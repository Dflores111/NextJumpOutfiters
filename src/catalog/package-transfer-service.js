import {readPackage,cleanPackageData,allPackageLines,command,replay} from './package-service.js';
import {packageTotals} from './package-domain.js';
import {variantsFor} from './variant-domain.js';
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');
const text=(s,max=300)=>typeof s==='string'?s.trim().slice(0,max):'';
const canonical=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const uuid=s=>typeof s==='string'&&/^[a-f\d-]{36}$/i.test(s);
const fingerprint=async value=>{const h=await hash(value);return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20,32)].join('-');};
function validTransfer(input){if(input?.format!=='NJO_PACKAGE_TRANSFER_V1'||!/^[a-f\d]{64}$/.test(input.sourceId||'')||!Array.isArray(input.packages)||!input.packages.length||input.packages.length>150||JSON.stringify(input).length>3500000)fail(422,'Choose a supported package workbook of up to 150 builds.');}
const identity=d=>[d?.vehicle?.make,d?.vehicle?.model,d?.vehicle?.yearFrom,d?.vehicle?.yearTo,d?.useLevel].map(v=>String(v??'').toLowerCase().trim()).join('|');
export async function planTransfer(db,input){
 validTransfer(input);const records=await all(db,'SELECT id,source_key,data_json FROM curated_packages'),plans=[],seen=new Set();
 for(const [index,p] of input.packages.entries()){
  if(!p.data||!text(p.title)||!text(p.category))fail(422,'A workbook package needs its name, category and details.');
  const matches=records.filter(r=>p.id?r.id===p.id:r.source_key===p.sourceKey||identity(JSON.parse(r.data_json))===identity(p.data));if(matches.length>1)fail(422,`${p.title}: several packages match. Export the menu and use its stable package ID.`);
  if(p.id&&!matches.length)fail(422,'A workbook package ID was not found. Use a fresh export.');const existing=matches[0]?await readPackage(db,matches[0].id):null;
  const sourceKey=existing?.source_key||text(p.sourceKey,200);if(!sourceKey)fail(422,'A new package needs a stable source key.');
  const id=existing?.id||await fingerprint('package:'+sourceKey);if(seen.has(id))fail(422,'The workbook repeats a package. Combine its scopes in one record.');seen.add(id);
  const newParts=[],productChecks=[],mapLines=async lines=>{
   if(!Array.isArray(lines)||lines.length>25)fail(422,'Keep each package scope within 25 parts.');const mapped=[];
   for(const l of lines){const sku=text(l.sku||l.supplierSku,120),supplier=text(l.supplier,150),title=text(l.title)||text(l.role);
    let product;if(l.productId){if(!uuid(l.productId))fail(422,'A product ID is invalid.');product=await one(db,'SELECT * FROM master_products WHERE id=?',l.productId);if(!product)fail(422,'An exported part is no longer present. Choose a current part.');}
    else if(sku){const candidates=await all(db,"SELECT * FROM master_products WHERE lower(trim(json_extract(data_json,'$.supplierSku')))=lower(?) AND state<>'RETIRED'",sku);if(candidates.length>1)fail(422,`${sku}: multiple parts match. Export and use the correct product ID.`);product=candidates[0];}
    if(product?.state==='RETIRED')fail(422,'Replace a retired part before importing.');
    if(!product){const key='workbook-part:'+ (sku?supplier.toLowerCase()+':'+sku.toLowerCase():sourceKey+':'+text(l.role,100));let fresh=newParts.find(v=>v.sourceKey===key);if(!fresh){fresh={id:await fingerprint(key),sourceKey:key,title:title||'Source part to review',category:text(p.category,80),data:{supplierSku:sku,supplier,stockType:'UNREVIEWED',source:input.file,prices:{},candidateCostCents:l.unitCostCents??null,candidateRetailCents:l.unitRetailCents??null}};const previous=await one(db,'SELECT * FROM master_products WHERE source_key=?',key);if(previous){product=previous;}else newParts.push(fresh);}if(!product)product={id:fresh.id,title:fresh.title,revision:1,data_json:JSON.stringify(fresh.data)};}
    if(product.state==='RETIRED')fail(422,'Replace a retired part before importing.');if(!newParts.some(v=>v.id===product.id))productChecks.push({id:product.id,revision:product.revision});const d=JSON.parse(product.data_json);
    mapped.push({productId:product.id,title:product.title,role:text(l.role,100),quantity:l.quantity??null,unitCostCents:l.unitCostCents??null,unitRetailCents:l.unitRetailCents??null,productRevision:product.revision,supplierSku:d.supplierSku||null,supplier:d.supplier||null,installOnly:(d.tags||[]).includes('Install-Only')});
   }return mapped;
  };
  const mappedVariants=[];for(const v of p.data.variants||variantsFor(p.data))mappedVariants.push({...v,lines:await mapLines(v.lines)});const raw={...p.data,variants:mappedVariants};
  const data=cleanPackageData(raw);for(const v of data.variants)v.lines=raw.variants.find(r=>r.id===v.id).lines;const primary=data.variants.find(v=>v.id===data.defaultVariantId);data.lines=primary.lines;data.labor=primary.labor;
  Object.assign(data,{source:existing?.data.source||p.source,sourceTotalCents:existing?.data.sourceTotalCents??null,sourceSummary:existing?.data.sourceSummary,sourceDescription:existing?.data.sourceDescription||p.data.sourceDescription,sourceRowKey:existing?.data.sourceRowKey,issues:[...(existing?.data.issues||[]),...(!existing?.data.issues?.some(i=>i.id==='workbook-'+input.sourceId)?[{id:'workbook-'+input.sourceId,message:'Review imported changes against '+text(input.file,200)+'. '+(p.issues||[]).map(v=>text(v,300)).join(' ').slice(0,1600),resolved:false}]:[])],approvals:{parts:false,pricing:false,fitment:false},reviewEvidence:'',sourceCells:p.sourceCells||existing?.data.sourceCells,importSource:{id:input.sourceId,file:text(input.file,200),sheet:p.source?.sheet,row:p.source?.row},...(existing?.data.clonedFrom?{clonedFrom:existing.data.clonedFrom,cloneReview:Object.fromEntries(Object.keys(existing.data.cloneReview||{}).map(k=>[k,false]))}:{})});
  const prior=existing?.data,changes=[];for(const [key,label] of [['vehicle','Vehicle fitment'],['useLevel','Use'],['variants','Parts, scope & pricing'],['description','Customer description'],['fitmentNotes','Vehicle checks'],['installNotes','Installation notes'],['media','Images'],['excludes','Exclusions']])if(canonical(prior?.[key])!==canonical(data[key]))changes.push(label);
  if(existing?.title!==text(p.title))changes.unshift('Package name');const review={index,id,sourceKey,expectedRevision:existing?.revision??0,workbookRevision:p.expectedRevision??null,conflict:!!existing&&p.expectedRevision!=null&&p.expectedRevision!==existing.revision,title:text(p.title),category:text(p.category,80),data,newParts,productChecks,changes,oldTotal:existing?.totals.totalCents??null,newTotal:packageTotals(data).totalCents,publishedTotal:existing?.published?.totals.totalCents??null};
  review.reviewToken=await hash(JSON.stringify({sourceId:input.sourceId,review}));plans.push(review);
 }
 return {plans};
}
export async function applyTransfer(db,input,key,actor){
 if(!input||!input.bundle||!Number.isSafeInteger(input.index))fail(422,'Choose one workbook package to import.');const requestInput={sourceId:input.bundle.sourceId,index:input.index,reviewToken:input.reviewToken,overwrite:input.overwrite===true},prior=await replay(db,requestInput,key,actor);if(prior)return readPackage(db,prior.entityId);
 const p=input.bundle.packages?.[input.index];if(!p)fail(422,'Choose a workbook package.');const plan=(await planTransfer(db,{...input.bundle,packages:[p]})).plans[0];
 // Index does not affect package data but is part of the preview token.
 const tokenPlan={...plan,index:input.index};delete tokenPlan.reviewToken;const expected=await hash(JSON.stringify({sourceId:input.bundle.sourceId,review:tokenPlan}));if(expected!==input.reviewToken)fail(409,'The package or its parts changed. Refresh the import review before applying it.');
 if(plan.conflict&&input.overwrite!==true)fail(409,'This workbook is older than the native draft. Confirm the field differences before replacing it.');
 const encoded=JSON.stringify(plan.productChecks),newParts=JSON.stringify(plan.newParts),condition=(plan.expectedRevision?'EXISTS(SELECT 1 FROM curated_packages WHERE id=? AND revision=?)':"NOT EXISTS(SELECT 1 FROM curated_packages WHERE id=? OR source_key=?)")+" AND NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN master_products p ON p.id=json_extract(j.value,'$.id') WHERE p.id IS NULL OR p.revision<>json_extract(j.value,'$.revision') OR p.state='RETIRED') AND NOT EXISTS(SELECT 1 FROM json_each(?) j JOIN master_products p ON p.id=json_extract(j.value,'$.id') OR p.source_key=json_extract(j.value,'$.sourceKey'))";
 const args=plan.expectedRevision?[plan.id,plan.expectedRevision,encoded,newParts]:[plan.id,plan.sourceKey,encoded,newParts];
 await command(db,'WORKBOOK_DRAFT_APPLIED',requestInput,key,actor,plan.id,condition,args,({gate,gateArgs,time})=>[
  ...plan.newParts.map(p=>db.prepare(`INSERT INTO master_products (id,source_key,title,category,state,revision,planning_slot,data_json,updated_at) SELECT ?,?,?,?,'DRAFT',1,NULL,?,? WHERE ${gate}`).bind(p.id,p.sourceKey,p.title,p.category,JSON.stringify(p.data),time,...gateArgs)),
  plan.expectedRevision?db.prepare(`UPDATE curated_packages SET title=?,category=?,state='DRAFT',revision=revision+1,data_json=?,updated_at=? WHERE id=? AND revision=? AND ${gate}`).bind(plan.title,plan.category,JSON.stringify(plan.data),time,plan.id,plan.expectedRevision,...gateArgs):db.prepare(`INSERT INTO curated_packages (id,source_key,title,category,state,revision,data_json,updated_at) SELECT ?,?,?,?,'DRAFT',1,?,? WHERE ${gate}`).bind(plan.id,plan.sourceKey,plan.title,plan.category,JSON.stringify(plan.data),time,...gateArgs)
 ],{title:plan.title,file:text(input.bundle.file,200),changes:plan.changes,approval:'DRAFT_ONLY'});return readPackage(db,plan.id);
}
