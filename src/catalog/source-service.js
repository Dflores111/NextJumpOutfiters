import {command,replay,cleanPackageData,materializePackage,readPackage} from './package-service.js';
import {cleanCatalogFields} from './catalog-fields.js';
import {staffActor} from './access.js';
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const text=(s,max=300)=>typeof s==='string'?s.trim().slice(0,max):'';
const decoded=r=>({...r,data:JSON.parse(r.data_json),data_json:undefined});
const bounded=(value,max)=>{if(!value||typeof value!=='object'||JSON.stringify(value).length>max)fail(422,'A source record is incomplete or too large.');return value;};

export async function importFullSources(db,input,key,actor){
 if(input.format!=='NJO_PACKAGE_WORKSHOP_V2'||!/^[a-f\d]{64}$/.test(input.sourceId||''))fail(422,'Choose a prepared Next Jump V2 source file.');
 for(const name of ['products','packages','standards','sourceRows'])if(!Array.isArray(input[name])||input[name].length>(name==='packages'?5:20))fail(422,'Import this source file in small batches.');
 const prior=await replay(db,input,key,actor);if(prior)return {...prior,reused:true};
 const products=[],packages=[],standards=[],rows=[];let preserved=0;
 for(const r of input.sourceRows){
  bounded(r,80000);if(!text(r.sourceKey,300)||!['flatbed','lift','electrical','legacy'].includes(r.kind)||!Number.isSafeInteger(r.row)||r.row<1||!r.columns||!r.fieldMap||!r.mapped||Object.keys(r.columns).some(c=>!r.fieldMap[c]))fail(422,'A source row is missing its field mapping.');
  rows.push({...r,id:crypto.randomUUID()});
 }
 for(const p of input.products){
  bounded(p,150000);bounded(p.data,140000);if(!text(p.sourceKey,200)||!text(p.title)||!text(p.category))fail(422,'A source part needs a name and category.');
  const existing=await one(db,'SELECT * FROM master_products WHERE source_key=?',p.sourceKey),previous=existing?JSON.parse(existing.data_json):null;
  if(existing&&(existing.state!=='DRAFT'||existing.revision!==1||previous.stockType&&previous.stockType!=='UNREVIEWED')){preserved++;continue;}
  const allowed=['source','sourceReferences','supplierSku','supplier','manufacturerPartNumber','candidateRetailCents','candidateInstalledCents','candidateCostCents','unit','options','tags','description','changes','dimensions','weightKg','candidatePriceConflicts','sourceVariants','sourceIdentityIssue'];
  const source=Object.fromEntries(allowed.filter(k=>p.data[k]!==undefined).map(k=>[k,p.data[k]]));
  const data={...previous,...source,catalogFields:cleanCatalogFields(p.data.catalogFields),prices:previous?.prices||{},stockType:'UNREVIEWED',mappingVersion:2};
  products.push({id:existing?.id||crypto.randomUUID(),sourceKey:p.sourceKey,title:text(p.title),category:text(p.category,80),data,existing});
 }
 for(const p of input.packages){
  bounded(p,80000);bounded(p.data,75000);if(!text(p.sourceKey,200)||!text(p.title)||!text(p.category))fail(422,'A source package is incomplete.');
  const existing=await one(db,'SELECT * FROM curated_packages WHERE source_key=?',p.sourceKey);
  if(existing&&(existing.state!=='DRAFT'||existing.revision!==1)){preserved++;continue;}
  const mapLines=async lines=>{const result=[];for(const line of lines||[]){const product=await one(db,'SELECT id FROM master_products WHERE source_key=?',line.sourceKey);if(!product)fail(422,'Import the parts before their packages.');result.push({...line,productId:product.id});}return result;};
  const mapped={...p.data,lines:await mapLines(p.data.lines)};
  if(mapped.variants)mapped.variants=await Promise.all(mapped.variants.map(async v=>({...v,lines:await mapLines(v.lines)})));
  const data=cleanPackageData(mapped);await materializePackage(db,data);
  Object.assign(data,{source:p.data.source,sourceTotalCents:p.data.sourceTotalCents??null,sourceSummary:p.data.sourceSummary,sourceDescription:p.data.sourceDescription,sourceRowKey:p.data.sourceRowKey,mappingVersion:2,issues:(p.data.issues||[]).map(i=>({id:text(i.id,80),message:text(i.message,1000),resolved:false})),approvals:{parts:false,pricing:false,fitment:false}});
  packages.push({id:existing?.id||crypto.randomUUID(),sourceKey:p.sourceKey,title:text(p.title),category:text(p.category,80),data,existing});
 }
 for(const s of input.standards){
  bounded(s,80000);bounded(s.data,75000);if(!text(s.sourceKey,200)||!text(s.title)||!text(s.category))fail(422,'A source standard is incomplete.');
  const existing=await one(db,'SELECT * FROM build_standards WHERE source_key=?',s.sourceKey);
  if(existing&&(existing.state!=='DRAFT'||existing.revision!==1)){preserved++;continue;}
  const data={...s.data,mappingVersion:2};
  if(data.bomLines){if(!Array.isArray(data.bomLines)||data.bomLines.length>80)fail(422,'Keep each BOM section within 80 lines.');data.bomLines=await Promise.all(data.bomLines.map(async l=>{const p=await one(db,'SELECT id FROM master_products WHERE source_key=?',l.sourceKey);if(!p)fail(422,'Import electrical parts before their build standards.');return {...l,productId:p.id,reviewed:false};}));}
  standards.push({id:existing?.id||crypto.randomUUID(),sourceKey:s.sourceKey,title:text(s.title),category:text(s.category,80),data,existing});
 }
 const existing=[...products,...packages,...standards].filter(p=>p.existing),tables=p=>products.includes(p)?'master_products':packages.includes(p)?'curated_packages':'build_standards';
 const condition=existing.length?existing.map(p=>`EXISTS(SELECT 1 FROM ${tables(p)} WHERE id=? AND revision=1 AND state='DRAFT')`).join(' AND '):'1';
 const result=await command(db,'SOURCE_MAPPING_IMPORT',input,key,actor,'source:'+input.sourceId,condition,existing.map(p=>p.id),({gate,gateArgs,time})=>[
  ...rows.map(r=>db.prepare(`INSERT OR IGNORE INTO catalog_source_rows (id,source_key,source_id,kind,title,group_name,file,sheet,row_number,data_json,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE ${gate}`).bind(r.id,r.sourceKey,input.sourceId,r.kind,text(r.title),text(r.group,100),text(r.file),text(r.sheet,100),r.row,JSON.stringify(r),time,...gateArgs)),
  ...[...products,...packages,...standards].map(p=>p.existing?db.prepare(`UPDATE ${tables(p)} SET data_json=?,revision=revision+1,updated_at=? WHERE id=? AND revision=1 AND state='DRAFT' AND ${gate}`).bind(JSON.stringify(p.data),time,p.id,...gateArgs):db.prepare(`INSERT OR IGNORE INTO ${tables(p)} (id,source_key,title,category,state,revision,data_json,updated_at) SELECT ?,?,?,?,'DRAFT',1,?,? WHERE ${gate}`).bind(p.id,p.sourceKey,p.title,p.category,JSON.stringify(p.data),time,...gateArgs))
 ],{sourceId:input.sourceId,parts:products.length,packages:packages.length,standards:standards.length,sourceRows:rows.length,preserved,state:'DRAFT_ONLY',stockMovements:0});
 return result;
}

async function saveStandard(db,id,input,key,actor){
 const prior=await replay(db,{id,input},key,actor);if(prior)return decoded(await one(db,'SELECT * FROM build_standards WHERE id=?',id));
 const row=await one(db,'SELECT * FROM build_standards WHERE id=?',id);if(!row)fail(404,'Build standard not found.');if(row.revision!==input.revision)fail(409,'This standard changed. Reload it before saving.');
 const data=JSON.parse(row.data_json);if(!Array.isArray(data.bomLines)||!Array.isArray(input.bomLines)||input.bomLines.length!==data.bomLines.length)fail(422,'Keep the source BOM lines. Correct the part mapping, quantity and unit.');
 const mapped=[];
 for(const original of data.bomLines){const l=input.bomLines.find(l=>l.id===original.id);if(!l||!['each','ft','m','in'].includes(l.unit)||l.quantity!==null&&(!Number.isFinite(l.quantity)||l.quantity<=0||l.quantity>100000))fail(422,'Use a positive quantity and a recognized unit, or leave an unknown quantity blank.');const p=await one(db,"SELECT id FROM master_products WHERE id=? AND state<>'RETIRED'",l.productId);if(!p)fail(422,'Choose a current part from the parts library.');if(l.reviewed&&l.quantity===null)fail(422,'Confirm the quantity before marking a BOM line reviewed.');mapped.push({...original,productId:p.id,quantity:l.quantity,unit:l.unit,reviewed:l.reviewed===true});}
 data.bomLines=mapped;data.reviewEvidence=text(input.reviewEvidence,2000);data.issues=(data.issues||[]).map(i=>({...i,resolved:input.issues?.find(v=>v.id===i.id)?.resolved===true}));
 if(!['DRAFT','REVIEWED'].includes(input.state))fail(422,'Choose draft or technically reviewed.');
 if(input.state==='REVIEWED'&&(!data.reviewEvidence||mapped.some(l=>!l.reviewed)||data.issues.some(i=>!i.resolved)))fail(422,'Check every BOM line, resolve the source issues and record the technical review.');
 await command(db,'STANDARD_'+input.state,{id,input},key,actor,id,'EXISTS(SELECT 1 FROM build_standards WHERE id=? AND revision=?)',[id,input.revision],({gate,gateArgs,time})=>[db.prepare(`UPDATE build_standards SET data_json=?,state=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND ${gate}`).bind(JSON.stringify(data),input.state,time,id,input.revision,...gateArgs)],{state:input.state,revision:input.revision+1});
 return decoded(await one(db,'SELECT * FROM build_standards WHERE id=?',id));
}
export async function sourceService(request,db,{identity,readBody,json}){
 if(!identity)return null;const url=new URL(request.url),path=url.pathname,actor=staffActor(identity);
 if(path==='/api/staff/source-imports'&&request.method==='POST')return json(await importFullSources(db,await readBody(request,500000),request.headers.get('idempotency-key'),actor));
 if(path==='/api/staff/source-rows'&&request.method==='GET'){
  const q=text(url.searchParams.get('q'),100),kind=text(url.searchParams.get('kind'),30),group=text(url.searchParams.get('group'),100),offset=Math.max(0,Math.min(10000,Number(url.searchParams.get('offset'))||0));
  const where="(?='' OR kind=?) AND (?='' OR group_name=?) AND (?='' OR instr(lower(title||' '||sheet||' '||data_json),lower(?))>0)",args=[kind,kind,group,group,q,q];
  const rows=await all(db,`SELECT * FROM catalog_source_rows WHERE ${where} ORDER BY kind,group_name,row_number LIMIT 30 OFFSET ?`,...args,offset);
  return json({rows:rows.map(decoded),total:(await one(db,`SELECT COUNT(*) n FROM catalog_source_rows WHERE ${where}`,...args)).n,groups:await all(db,'SELECT DISTINCT kind,group_name FROM catalog_source_rows ORDER BY kind,group_name')});
 }
 if(/^\/api\/staff\/standards\/[a-f\d-]{36}$/i.test(path)&&request.method==='PATCH')return json(await saveStandard(db,path.split('/').at(-1),await readBody(request),request.headers.get('idempotency-key'),actor));
 return null;
}
