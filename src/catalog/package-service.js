import {packageTotals,releaseProblems,publicPackage,cleanIntake,packageStates,supplierModes} from './package-domain.js';
import {selectVariant,variantsFor,privateCostTotals} from './variant-domain.js';
import {staffActor} from './access.js';
import {clonePackageDraft,useLabels,copyChecks,reviewContent} from './package-workflow.js';
const fail=(status,message)=>Object.assign(Error(message),{status});
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const uuid=value=>typeof value==='string'&&/^[a-f\d-]{36}$/i.test(value);
const token=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{32,96}$/.test(value);
const cleanText=(value,max=300)=>typeof value==='string'?value.trim().slice(0,max):'';
const nullableNumber=(value,{integer=true,max=100000000}={})=>value===null||value===undefined?null:typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=max&&(!integer||Number.isSafeInteger(value))?value:(()=>{throw fail(422,'Use a valid number, or leave an unknown value blank.');})();
const decoded=row=>row?{...row,data:JSON.parse(row.data_json),data_json:undefined}:null;
const timestamp=()=>new Date().toISOString();
async function replay(db,input,key,actor){
 if(!token(key))throw fail(400,'A valid action key is required.');
 const row=await one(db,'SELECT actor,payload FROM master_audit WHERE id=?',await hash(key));if(!row)return null;
 const value=JSON.parse(row.payload);if(row.actor!==actor||value.fingerprint!==await hash(JSON.stringify(input)))throw fail(409,'This action key belongs to a different change.');return value;
}

async function command(db,action,input,key,actor,entityId,condition,args,effects,summary={}){
 if(!token(key))throw fail(400,'A valid action key is required.');
 const auditId=await hash(key),fingerprint=await hash(JSON.stringify(input));
 const check=row=>{const value=JSON.parse(row.payload);if(row.actor!==actor||value.fingerprint!==fingerprint)throw fail(409,'This action key belongs to a different change.');return value;};
 const prior=await one(db,'SELECT actor,payload FROM master_audit WHERE id=?',auditId);if(prior)return {...check(prior),reused:true};
 const time=timestamp(),payload=JSON.stringify({fingerprint,entityId,...summary});
 const gate="EXISTS(SELECT 1 FROM master_audit WHERE id=? AND actor=? AND json_extract(payload,'$.fingerprint')=?)",gateArgs=[auditId,actor,fingerprint];
 const result=await db.batch([db.prepare(`INSERT OR IGNORE INTO master_audit (id,subject_id,action,actor,payload,created_at) SELECT ?,?,?,?,?,? WHERE ${condition}`).bind(auditId,entityId,action,actor,payload,time,...args),...effects({gate,gateArgs,time})]);
 const saved=await one(db,'SELECT actor,payload FROM master_audit WHERE id=?',auditId);if(!saved)throw fail(409,'This record changed. Refresh before saving; nothing was applied.');
 return {...check(saved),reused:result[0].meta?.changes===0};
}
function cleanPackageData(input){
 const vehicle=input?.vehicle;
 if(!vehicle||!cleanText(vehicle.make,80)||!cleanText(vehicle.model,80)||!Number.isSafeInteger(vehicle.yearFrom)||!Number.isSafeInteger(vehicle.yearTo)||vehicle.yearFrom<1900||vehicle.yearTo>2100||vehicle.yearTo<vehicle.yearFrom)throw fail(422,'Set a clear vehicle and year range.');
 const cleanLines=lines=>{
  if(!Array.isArray(lines)||!lines.length||lines.length>25||new Set(lines.map(l=>l.productId)).size!==lines.length)throw fail(422,'Use 1 to 25 different parts per package.');
  return lines.map(line=>{if(!uuid(line.productId))throw fail(422,'Choose an existing part.');const quantity=nullableNumber(line.quantity,{max:100000});if(quantity===0)throw fail(422,'Remove a part instead of setting its quantity to zero.');return {productId:line.productId,role:cleanText(line.role,100),quantity,unitRetailCents:nullableNumber(line.unitRetailCents),unitCostCents:nullableNumber(line.unitCostCents)};});
 };
 const cleanLabor=value=>{
  const result={rateCents:nullableNumber(value?.rateCents),alignmentCents:nullableNumber(value?.alignmentCents),useBreakdown:value?.useBreakdown===true,rustApplies:value?.rustApplies===true,basis:value?.basis==='CONFIRMED'?'CONFIRMED':'ESTIMATE'};
  for(const key of ['hours','frontHours','rearHours','rustHours']){const n=nullableNumber(value?.[key],{integer:false,max:200});if(n!==null&&Math.abs(n*60-Math.round(n*60))>1e-7)throw fail(422,'Use labor time in whole minutes.');result[key]=n;}return result;
 };
 let variants;
 if(input.variants!==undefined){
  if(!Array.isArray(input.variants)||!input.variants.length||input.variants.length>4||new Set(input.variants.map(v=>v.id)).size!==input.variants.length)throw fail(422,'Use up to four distinct package scopes.');
  variants=input.variants.map(v=>{if(!/^[a-z][a-z0-9-]{1,39}$/.test(v.id)||!cleanText(v.label,80))throw fail(422,'Name each package scope.');return {id:v.id,label:cleanText(v.label,80),enabled:v.enabled===true,lines:cleanLines(v.lines),labor:cleanLabor(v.labor)};});
 }
 const defaultVariantId=variants?input.defaultVariantId:null,primary=variants?.find(v=>v.id===defaultVariantId);
 if(variants&&(!primary||!primary.enabled))throw fail(422,'Choose an enabled default scope.');
 const useLevel=input.useLevel||null;if(useLevel&&!Object.hasOwn(useLabels,useLevel))throw fail(422,'Choose a recognized use.');
 const media=(Array.isArray(input.media)?input.media:[]).slice(0,8).map(item=>{
  const url=cleanText(item.url,1200),alt=cleanText(item.alt,200),kind=item.kind==='part'?'part':'vehicle';
  if(!url)return null;
  if(!/^\/(?!\/)[\w/.-]+\.(?:png|jpe?g|webp|avif)$/i.test(url)&&!/^https:\/\/[^\s]+$/i.test(url))throw fail(422,'Use an existing site image path or an HTTPS image URL.');
  if(!alt)throw fail(422,'Describe each image so its contents are clear.');return {url,alt,kind};
 }).filter(Boolean);
 return {menuOrder:nullableNumber(input.menuOrder,{max:1000})??100,audience:cleanText(input.audience,150),description:cleanText(input.description,600),vehicle:{make:cleanText(vehicle.make,80),model:cleanText(vehicle.model,80),yearFrom:vehicle.yearFrom,yearTo:vehicle.yearTo},lines:primary?primary.lines:cleanLines(input.lines),
  labor:primary?primary.labor:cleanLabor(input.labor),...(variants?{variants,defaultVariantId}:{}),useLevel,media,
  specs:Object.fromEntries(['recommendedLiftHeight','stockCoil','levelingMethod'].map(k=>[k,cleanText(input.specs?.[k],300)])),vehicleQuestions:Array.isArray(input.vehicleQuestions)?input.vehicleQuestions.slice(0,20).map(q=>cleanText(q,600)):[],
  fitmentNotes:cleanText(input.fitmentNotes,2000),installNotes:cleanText(input.installNotes,3000),
  excludes:Array.isArray(input.excludes)?input.excludes.slice(0,12).map(v=>cleanText(v,150)).filter(Boolean):[],diyAllowed:input.diyAllowed===true,
  approvals:Object.fromEntries(['parts','pricing','fitment'].map(key=>[key,input.approvals?.[key]===true])),reviewEvidence:cleanText(input.reviewEvidence,1000)};
}
async function materializePackage(db,data){
 if(data.variants){for(const v of data.variants)v.lines=await materializeLines(db,v.lines);const v=data.variants.find(v=>v.id===data.defaultVariantId);data.lines=v.lines;data.labor=v.labor;}
 else data.lines=await materializeLines(db,data.lines);return data;
}
function allPackageLines(data){return data.variants?data.variants.flatMap(v=>v.lines):data.lines;}
async function materializeLines(db,lines){
 return Promise.all(lines.map(async line=>{const p=await one(db,'SELECT id,title,revision,state,data_json FROM master_products WHERE id=?',line.productId);if(!p||p.state==='RETIRED')throw fail(422,'A package part is missing or retired. Choose a replacement.');const data=JSON.parse(p.data_json);return {...line,title:p.title,productRevision:p.revision,supplierSku:data.supplierSku||null,supplier:data.supplier||null,installOnly:(data.tags||[]).includes('Install-Only')};}));
}
async function inspectPackage(db,row){
 if(!row)throw fail(404,'Package not found.');
 const products=await all(db,"SELECT p.id,p.revision,p.state FROM master_products p JOIN json_each(?) j ON p.id=json_extract(j.value,'$.productId')",JSON.stringify(allPackageLines(row.data)));
 const current=new Map(products.map(p=>[p.id,p]));row.stale=allPackageLines(row.data).some(line=>!current.has(line.productId)||current.get(line.productId).state==='RETIRED'||current.get(line.productId).revision!==line.productRevision);
 row.variantCosts=variantsFor(row.data).map(v=>({id:v.id,...privateCostTotals(v)}));row.totals=packageTotals(row.data);row.problems=[...releaseProblems(row.data),...(row.stale?['A part changed. Review the package against the current part records.']:[])];return row;
}
async function readPublishedPackage(db,id){
 const release=await one(db,'SELECT package_id AS id,revision,title,category,data_json,published_at AS updated_at FROM package_releases WHERE package_id=? AND active=1',id);
 return release?inspectPackage(db,{...decoded(release),state:'PUBLISHED'}):null;
}
async function readPackage(db,id){
 const row=await inspectPackage(db,decoded(await one(db,'SELECT * FROM curated_packages WHERE id=?',id)));
 const published=await readPublishedPackage(db,id);
 row.published=published?{revision:published.revision,title:published.title,category:published.category,data:published.data,totals:published.totals,stale:published.stale,problems:published.problems}:null;
 row.hasDraftChanges=!!published&&row.revision!==published.revision;return row;
}
async function savePackage(db,id,input,key,actor,{demo=false}={}){
 const requestInput={id,input},prior=await replay(db,requestInput,key,actor);if(prior)return readPackage(db,prior.entityId);
 const row=await readPackage(db,id);if(input.revision!==row.revision)throw fail(409,'This package changed. Reload it before saving.');
 if(!packageStates.includes(input.state)||!cleanText(input.title)||!cleanText(input.category))throw fail(422,'Choose a package name, category and state.');
 const data={...cleanPackageData(input.data),source:row.data.source,sourceTotalCents:row.data.sourceTotalCents??null,
  importSource:row.data.importSource,sourceCells:row.data.sourceCells,sourceSummary:row.data.sourceSummary,sourceRowKey:row.data.sourceRowKey,sourceDescription:row.data.sourceDescription,
  issues:(row.data.issues||[]).map(issue=>({...issue,resolved:input.data.issues?.find(value=>value.id===issue.id)?.resolved===true}))};
 if(row.data.clonedFrom){data.clonedFrom=row.data.clonedFrom;data.cloneReview=Object.fromEntries(Object.keys(copyChecks).map(k=>[k,input.data.cloneReview?.[k]===true]));}
 const contentChanged=reviewContent(cleanPackageData(row.data))!==reviewContent(cleanPackageData(input.data))||row.title!==cleanText(input.title);
 await materializePackage(db,data);
 if(input.state==='PUBLISHED'){
  if(!demo&&!(data.vehicle.make==='Toyota'&&data.vehicle.model==='Tacoma'&&data.vehicle.yearFrom===2016&&data.vehicle.yearTo===2023))throw fail(422,'The production pilot is 2016–2023 Toyota Tacoma. Keep other vehicles as drafts for now.');
  const problems=releaseProblems(data);if(problems.length)throw fail(422,problems.join(' '));data.reviewedBy=actor;data.reviewedAt=timestamp();
 }else{if(contentChanged){data.approvals={parts:false,pricing:false,fitment:false};if(data.cloneReview)data.cloneReview=Object.fromEntries(Object.keys(copyChecks).map(k=>[k,false]));}data.reviewedBy=null;data.reviewedAt=null;}
 const uniqueMenu="NOT EXISTS(SELECT 1 FROM package_releases WHERE package_id<>? AND active=1 AND json_extract(data_json,'$.useLevel')=? AND lower(json_extract(data_json,'$.vehicle.make'))=lower(?) AND lower(json_extract(data_json,'$.vehicle.model'))=lower(?) AND json_extract(data_json,'$.vehicle.yearFrom')<=? AND json_extract(data_json,'$.vehicle.yearTo')>=?)";
 const uniqueArgs=[id,data.useLevel,data.vehicle.make,data.vehicle.model,data.vehicle.yearTo,data.vehicle.yearFrom];
 if(input.state==='PUBLISHED'&&data.useLevel&&await one(db,`SELECT 1 found WHERE NOT (${uniqueMenu})`,...uniqueArgs))throw fail(422,'A published package already serves this vehicle and use. Update that package, or archive it before releasing this replacement.');
 const lineJson=JSON.stringify(allPackageLines(data)),clean={revision:input.revision,state:input.state,title:cleanText(input.title),category:cleanText(input.category,80),data};
 await command(db,'PACKAGE_'+input.state,requestInput,key,actor,id,
  "EXISTS(SELECT 1 FROM curated_packages WHERE id=? AND revision=?) AND NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN master_products p ON p.id=json_extract(j.value,'$.productId') WHERE p.id IS NULL OR p.state='RETIRED' OR p.revision<>json_extract(j.value,'$.productRevision'))"+(input.state==='PUBLISHED'&&data.useLevel?' AND '+uniqueMenu:''),[id,input.revision,lineJson,...(input.state==='PUBLISHED'&&data.useLevel?uniqueArgs:[])],
  ({gate,gateArgs,time})=>[
   ...(input.state==='PUBLISHED'||input.state==='ARCHIVED'?[db.prepare(`UPDATE package_releases SET active=0 WHERE package_id=? AND active=1 AND ${gate} AND EXISTS(SELECT 1 FROM curated_packages WHERE id=? AND revision=?)`).bind(id,...gateArgs,id,input.revision)]:[]),
   ...(input.state==='PUBLISHED'?[db.prepare(`INSERT OR IGNORE INTO package_releases (id,package_id,revision,title,category,data_json,active,published_by,published_at) SELECT ?,?,?,?,?,?,1,?,? WHERE ${gate} AND EXISTS(SELECT 1 FROM curated_packages WHERE id=? AND revision=?)`).bind(id+':'+(input.revision+1),id,input.revision+1,clean.title,clean.category,JSON.stringify(data),actor,time,...gateArgs,id,input.revision)]:[]),
   db.prepare(`UPDATE curated_packages SET title=?,category=?,state=?,revision=revision+1,data_json=?,updated_at=? WHERE id=? AND revision=? AND ${gate}`).bind(clean.title,clean.category,clean.state,JSON.stringify(data),time,id,input.revision,...gateArgs)
  ],{state:input.state,revision:input.revision+1,title:clean.title});
 return readPackage(db,id);
}
async function duplicatePackage(db,id,input,key,actor){
 const requestInput={id,input},prior=await replay(db,requestInput,key,actor);if(prior)return readPackage(db,prior.entityId);
 const row=await readPackage(db,id);if(input.revision!==row.revision)throw fail(409,'This package changed. Reload it before making a copy.');
 if(!Object.hasOwn(useLabels,input.useLevel))throw fail(422,'Choose a pilot use for this copy.');
 const draft=clonePackageDraft(row,input.useLevel),digest=await hash(actor+':'+key),newId=[digest.slice(0,8),digest.slice(8,12),digest.slice(12,16),digest.slice(16,20),digest.slice(20,32)].join('-');
 await materializePackage(db,draft.data);
 await command(db,'PACKAGE_DUPLICATED',requestInput,key,actor,newId,'EXISTS(SELECT 1 FROM curated_packages WHERE id=? AND revision=?)',[id,input.revision],({gate,gateArgs,time})=>[
  db.prepare(`INSERT OR IGNORE INTO curated_packages (id,source_key,title,category,state,revision,data_json,updated_at) SELECT ?,?,?,?,'DRAFT',1,?,? WHERE ${gate}`).bind(newId,'copy:'+newId,draft.title,draft.category,JSON.stringify(draft.data),time,...gateArgs)
 ],{from:id,fromRevision:row.revision,useLevel:input.useLevel,state:'DRAFT'});
 return readPackage(db,newId);
}
async function importSources(db,input,key,actor){
 if(input.format!=='NJO_PACKAGE_WORKSHOP_V1'||!Array.isArray(input.products)||input.products.length>20||!Array.isArray(input.packages)||input.packages.length>5||!Array.isArray(input.standards)||input.standards.length>20||!/^[a-f\d]{64}$/.test(input.sourceId||''))throw fail(422,'Choose a prepared Next Jump source review file. Import up to 20 parts per batch.');
 const products=input.products.map(p=>{
  if(!cleanText(p.sourceKey,200)||!cleanText(p.title)||!cleanText(p.category)||!p.data||JSON.stringify(p.data).length>12000)throw fail(422,'A source part is incomplete or too large.');
  const permitted=['source','sourceReferences','supplierSku','supplier','manufacturerPartNumber','candidateRetailCents','candidateInstalledCents','candidateCostCents','unit','options','tags','description','changes','dimensions','weightKg','candidatePriceConflicts'];
  const data=Object.fromEntries(permitted.filter(k=>p.data[k]!==undefined).map(k=>[k,p.data[k]]));
  return {id:crypto.randomUUID(),sourceKey:cleanText(p.sourceKey,200),title:cleanText(p.title),category:cleanText(p.category,80),data:{...data,prices:{},stockType:'UNREVIEWED'}};
 });
 const definitions=[];
 for(const p of input.packages){
  const lines=[];for(const line of p.data?.lines||[]){const product=await one(db,'SELECT id FROM master_products WHERE source_key=?',line.sourceKey);if(!product)throw fail(422,'Import the source parts before their packages.');lines.push({...line,productId:product.id});}
  const data=cleanPackageData({...p.data,lines});await materializePackage(db,data);data.approvals={parts:false,pricing:false,fitment:false};
  data.source=p.data.source;data.sourceTotalCents=nullableNumber(p.data.sourceTotalCents);data.issues=(p.data.issues||[]).slice(0,20).map(i=>({id:cleanText(i.id,80),message:cleanText(i.message,600),resolved:false}));
  if(!cleanText(p.sourceKey,200)||!cleanText(p.title)||!cleanText(p.category))throw fail(422,'A source package is incomplete.');
  definitions.push({id:crypto.randomUUID(),sourceKey:cleanText(p.sourceKey,200),title:cleanText(p.title),category:cleanText(p.category,80),data});
 }
 const standards=input.standards.map(s=>{if(!cleanText(s.sourceKey,200)||!cleanText(s.title)||!cleanText(s.category)||!s.data||JSON.stringify(s.data).length>16000)throw fail(422,'A build standard is incomplete or too large.');return {id:crypto.randomUUID(),sourceKey:cleanText(s.sourceKey,200),title:cleanText(s.title),category:cleanText(s.category,80),data:s.data};});
 const clean={sourceId:input.sourceId,products:products.map(({id,...p})=>p),packages:definitions.map(({id,...p})=>p),standards:standards.map(({id,...s})=>s)};
 await command(db,'SOURCE_REVIEW_IMPORT',clean,key,actor,'source:'+input.sourceId,'1',[],({gate,gateArgs,time})=>[
  ...products.map(p=>db.prepare(`INSERT OR IGNORE INTO master_products (id,source_key,title,category,state,revision,planning_slot,data_json,updated_at) SELECT ?,?,?,?,'DRAFT',1,NULL,?,? WHERE ${gate}`).bind(p.id,p.sourceKey,p.title,p.category,JSON.stringify(p.data),time,...gateArgs)),
  ...definitions.map(p=>db.prepare(`INSERT OR IGNORE INTO curated_packages (id,source_key,title,category,state,revision,data_json,updated_at) SELECT ?,?,?,?,'DRAFT',1,?,? WHERE ${gate}`).bind(p.id,p.sourceKey,p.title,p.category,JSON.stringify(p.data),time,...gateArgs)),
  ...standards.map(s=>db.prepare(`INSERT OR IGNORE INTO build_standards (id,source_key,title,category,state,revision,data_json,updated_at) SELECT ?,?,?,?,'DRAFT',1,?,? WHERE ${gate}`).bind(s.id,s.sourceKey,s.title,s.category,JSON.stringify(s.data),time,...gateArgs))
 ],{sourceId:input.sourceId,parts:products.length,packages:definitions.length,standards:standards.length,approval:'DRAFT_ONLY'});
 return {processed:{parts:products.length,packages:definitions.length,standards:standards.length},state:'DRAFT_ONLY',stockMovements:0};
}
const unknownSupply={supplier:'',supplierSku:'',fulfillment:'UNKNOWN',quantity:null,leadTimeDays:null,checkedAt:null,reference:'',kind:'manual'};
async function readSupply(db,id){const product=await one(db,'SELECT id,title,data_json FROM master_products WHERE id=?',id);if(!product)throw fail(404,'Part not found.');const supply=decoded(await one(db,'SELECT * FROM product_supply WHERE product_id=?',id)),data=JSON.parse(product.data_json);return {productId:id,title:product.title,revision:supply?.revision||0,supply:supply?.data||{...unknownSupply,supplier:data.supplier||'',supplierSku:data.supplierSku||''},connected:false};}
async function saveSupply(db,id,input,key,actor){
 const requestInput={id,input},prior=await replay(db,requestInput,key,actor);if(prior)return readSupply(db,prior.entityId);
 const current=await readSupply(db,id);if(input.revision!==current.revision)throw fail(409,'This supplier record changed. Reload before saving.');
 const data={supplier:cleanText(input.supplier,150),supplierSku:cleanText(input.supplierSku,100),fulfillment:input.fulfillment,quantity:nullableNumber(input.quantity,{max:1000000}),leadTimeDays:nullableNumber(input.leadTimeDays,{max:3650}),checkedAt:input.checkedAt||null,reference:cleanText(input.reference,500),kind:'manual'};
 if(!supplierModes.includes(data.fulfillment))throw fail(422,'Choose how this part will be sourced.');
 if(data.checkedAt!==null&&(!/^\d{4}-\d{2}-\d{2}T/.test(data.checkedAt)||!Number.isFinite(Date.parse(data.checkedAt))||Date.parse(data.checkedAt)>Date.now()+60000))throw fail(422,'Use a valid past check date.');
 if(data.quantity!==null&&(!data.supplier||!data.checkedAt||!data.reference))throw fail(422,'For supplier stock, record the supplier, check date and source.');
 await command(db,'SUPPLIER_UPDATED',requestInput,key,actor,id,'COALESCE((SELECT revision FROM product_supply WHERE product_id=?),0)=?',[id,input.revision],({gate,gateArgs,time})=>[
  db.prepare(`INSERT INTO product_supply (product_id,revision,data_json,updated_at) SELECT ?,?,?,? WHERE ${gate} ON CONFLICT(product_id) DO UPDATE SET revision=excluded.revision,data_json=excluded.data_json,updated_at=excluded.updated_at WHERE product_supply.revision=?`).bind(id,input.revision+1,JSON.stringify(data),time,...gateArgs,input.revision)
 ],{supplier:data.supplier,fulfillment:data.fulfillment,revision:input.revision+1});return readSupply(db,id);
}
async function buildQuote(db,pack,intake,fulfillment,draft){
 const customerPackage=publicPackage(pack,{preview:draft}),totals=packageTotals(pack.data,fulfillment),lines=[];
 for(const line of pack.data.lines){
  const product=await one(db,'SELECT data_json FROM master_products WHERE id=?',line.productId),d=product?JSON.parse(product.data_json):{};
  const stock=await one(db,"SELECT SUM(onhand_delta)-SUM(reserved_delta) available,SUM(CASE WHEN kind='COUNT' THEN 1 ELSE 0 END) verified FROM inventory_movements WHERE product_id=? AND location='Tacoma Showroom'",line.productId);
  const supply=await readSupply(db,line.productId);
  lines.push({productId:line.productId,productRevision:line.productRevision,title:line.title,role:line.role,quantity:line.quantity,supplierSku:d.supplierSku||null,supplier:d.supplier||null,available:stock?.verified&&d.stockType==='STOCKED'?stock.available:null,supply:supply.supply});
 }
 return {customer:{title:pack.title,description:pack.data.description,media:pack.data.media||[],variantId:pack.data.variantId||pack.data.defaultVariantId||'front-rear',variantLabel:pack.data.variantLabel||'',packageId:pack.id,packageRevision:pack.revision,vehicle:intake,fulfillment,lines:customerPackage.lines,totals,fitmentNotes:pack.data.fitmentNotes,excludes:pack.data.excludes,draft,requiresVehicleConfirmation:true,stockReserved:false,orderPlaced:false},shop:{lines,labor:pack.data.labor,installNotes:pack.data.installNotes,source:pack.data.source,packageIssues:pack.data.issues||[],status:'PLANNING',stockAsOf:timestamp()}};
}
async function saveQuote(request,db,input,draft=false){
 const key=request.headers.get('idempotency-key'),access=request.headers.get('x-build-access');if(!token(key)||!token(access))throw fail(400,'A valid quote save and reopen key are required.');
 if(!uuid(input.packageId)||!Number.isSafeInteger(input.revision)||!['installed','diy'].includes(input.fulfillment))throw fail(422,'Choose a package and fulfillment option.');
 const clean={packageId:input.packageId,revision:input.revision,variantId:input.variantId||null,fulfillment:input.fulfillment,intake:{year:Number(input.intake?.year),suspension:input.intake?.suspension,use:input.intake?.use},draft};
 const fingerprint=await hash(JSON.stringify(clean)),keyHash=await hash(key),accessHash=await hash(access);
 const previous=await one(db,'SELECT * FROM package_quotes WHERE key_hash=?',keyHash);
 if(previous){if(previous.fingerprint!==fingerprint||previous.access_hash!==accessHash)throw fail(409,'This save key belongs to a different quote.');return {id:previous.id,...JSON.parse(previous.snapshot_json),reused:true};}
 const pack=draft?await readPackage(db,input.packageId):await readPublishedPackage(db,input.packageId);if(!pack)throw fail(409,'This package is being reviewed. Ask the shop for a custom estimate.');if(pack.revision!==input.revision)throw fail(409,'The package changed. Refresh the estimate before saving.');
 if(!draft&&(pack.state!=='PUBLISHED'||pack.stale||pack.problems.length))throw fail(409,'This package is being reviewed. Ask the shop for a custom estimate.');
 if(input.fulfillment==='diy'&&!pack.data.diyAllowed)throw fail(422,'This package is offered with installation.');
 if(!draft&&pack.data.useLevel&&clean.intake.use!==({'weekender':'daily','overlander-light':'trips','overlander-heavy':'permanent','expedition':'expedition'}[pack.data.useLevel]))throw fail(422,'Choose the package that matches your selected use.');
 const variant=variantsFor(pack.data).find(v=>v.id===(clean.variantId||pack.data.defaultVariantId||'front-rear'));if(!variant||!variant.enabled)throw fail(422,'Choose an available package scope.');
 const chosen={...pack,data:selectVariant(pack.data,variant.id)};
 const intake=cleanIntake(clean.intake,pack.data.vehicle),snapshot=await buildQuote(db,chosen,intake,input.fulfillment,draft),id=crypto.randomUUID(),time=timestamp(),number='NJO-'+id.slice(0,8).toUpperCase();
 snapshot.customer={...snapshot.customer,number,createdAt:time};
 // The package and component revisions are checked again in the write itself.
 const condition=(draft?"EXISTS(SELECT 1 FROM curated_packages WHERE id=? AND revision=?)":"EXISTS(SELECT 1 FROM package_releases WHERE package_id=? AND revision=? AND active=1)")+" AND NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN master_products p ON p.id=json_extract(j.value,'$.productId') WHERE p.id IS NULL OR p.state='RETIRED' OR p.revision<>json_extract(j.value,'$.productRevision'))";
 try{await db.prepare(`INSERT OR IGNORE INTO package_quotes (id,number,package_id,package_revision,key_hash,access_hash,fingerprint,snapshot_json,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE ${condition} AND (SELECT COUNT(*) FROM package_quotes)<10000`).bind(id,number,pack.id,pack.revision,keyHash,accessHash,fingerprint,JSON.stringify(snapshot),time,pack.id,pack.revision,JSON.stringify(chosen.data.lines)).run();}catch{throw fail(503,'The quote could not be saved. Keep this page open and retry.');}
 const saved=await one(db,'SELECT * FROM package_quotes WHERE key_hash=?',keyHash);if(!saved)throw fail(409,'The package changed, or quote storage is full. Refresh before retrying.');if(saved.fingerprint!==fingerprint||saved.access_hash!==accessHash)throw fail(409,'This save key belongs to a different quote.');
 return {id:saved.id,...JSON.parse(saved.snapshot_json),reused:saved.id!==id};
}
export async function packageService(request,db,{identity,readBody,json}){
 const url=new URL(request.url),path=url.pathname,method=request.method;
 if(path==='/api/packages'&&method==='GET'){
  const candidates=await all(db,"SELECT package_id AS id FROM package_releases WHERE active=1 ORDER BY COALESCE(json_extract(data_json,'$.menuOrder'),100),title LIMIT 100"),packages=[];
  for(const candidate of candidates){const p=await readPublishedPackage(db,candidate.id);if(!p.stale&&!p.problems.length&&p.data.vehicle.make==='Toyota'&&p.data.vehicle.model==='Tacoma'&&p.data.vehicle.yearFrom===2016&&p.data.vehicle.yearTo===2023)packages.push(publicPackage(p));}
  return json({packages});
 }
 if(path==='/api/package-quotes'&&method==='POST'){
  const result=await saveQuote(request,db,await readBody(request));return json({id:result.id,customer:result.customer,reused:result.reused},201);
 }
 if(/^\/api\/package-quotes\/[a-f\d-]{36}$/i.test(path)&&method==='GET'){
  const access=request.headers.get('x-build-access');if(!token(access))throw fail(401,'Use this quote’s reopen key.');
  const row=await one(db,'SELECT id,snapshot_json FROM package_quotes WHERE id=? AND access_hash=?',path.split('/').at(-1),await hash(access));if(!row)throw fail(404,'Quote not found with this reopen key.');return json({id:row.id,customer:JSON.parse(row.snapshot_json).customer});
 }
 if(!identity)return null;
 const actor=staffActor(identity);
 if(path==='/api/staff/package-imports'&&method==='POST')return json(await importSources(db,await readBody(request,500000),request.headers.get('idempotency-key'),actor));
 if(path==='/api/staff/packages'&&method==='GET'){
  const rows=await all(db,"SELECT id FROM curated_packages ORDER BY category,COALESCE(json_extract(data_json,'$.menuOrder'),100),title LIMIT 100");return json({packages:await Promise.all(rows.map(row=>readPackage(db,row.id)))});
 }
 if(/^\/api\/staff\/packages\/[a-f\d-]{36}$/i.test(path)&&method==='PATCH')return json(await savePackage(db,path.split('/').at(-1),await readBody(request),request.headers.get('idempotency-key'),actor,{demo:identity.provider==='demo'}));
 if(/^\/api\/staff\/packages\/[a-f\d-]{36}\/duplicate$/i.test(path)&&method==='POST')return json(await duplicatePackage(db,path.split('/').at(-2),await readBody(request),request.headers.get('idempotency-key'),actor),201);
 if(path==='/api/staff/package-preview'&&method==='POST'){
  const input=await readBody(request);if(!uuid(input.packageId)||!Number.isSafeInteger(input.revision))throw fail(422,'Choose a saved package to preview.');const pack=input.published?await readPublishedPackage(db,input.packageId):await readPackage(db,input.packageId);if(!pack)throw fail(404,'No published revision exists.');
  if(input.revision!==pack.revision)throw fail(409,'The package changed. Reload before previewing.');
  if(!['installed','diy'].includes(input.fulfillment)||input.fulfillment==='diy'&&!pack.data.diyAllowed)throw fail(422,'Choose an available fulfillment option.');
  const variant=selectVariant(pack.data,input.variantId);if(!variant)throw fail(422,'Choose a package scope.');
  const snapshot=await buildQuote(db,{...pack,data:variant},cleanIntake(input.intake,pack.data.vehicle),input.fulfillment,!input.published);
  snapshot.customer={...snapshot.customer,number:input.published?'PUBLISHED PREVIEW':'DRAFT PREVIEW',createdAt:timestamp()};return json({id:null,...snapshot,preview:true});
 }
 if(path==='/api/staff/package-demo-quotes'&&method==='POST'){
  if(identity.provider!=='demo')throw fail(403,'Sample quote saving is available only in the isolated demo.');const input=await readBody(request),headers=new Headers(request.headers);headers.set('x-build-access',input.access||'');const result=await saveQuote({headers},db,input);const row=await one(db,'SELECT snapshot_json FROM package_quotes WHERE id=?',result.id);return json({id:result.id,...JSON.parse(row.snapshot_json),reused:result.reused},201);
 }
 if(path==='/api/staff/package-menu'&&method==='GET'){
  const rows=await all(db,'SELECT package_id AS id FROM package_releases WHERE active=1 ORDER BY title'),packages=[];
  for(const row of rows){const p=await readPublishedPackage(db,row.id);if(!p.stale&&!p.problems.length)packages.push(publicPackage(p));}return json({packages});
 }
 if(path==='/api/staff/standards'&&method==='GET')return json({standards:(await all(db,'SELECT * FROM build_standards ORDER BY category,title LIMIT 100')).map(decoded)});
 if(/^\/api\/staff\/supply\/[a-f\d-]{36}$/i.test(path)){
  const id=path.split('/').at(-1);if(method==='GET')return json(await readSupply(db,id));if(method==='PATCH')return json(await saveSupply(db,id,await readBody(request),request.headers.get('idempotency-key'),actor));
 }
 if(path==='/api/staff/package-quotes'&&method==='GET'){
  const rows=await all(db,'SELECT id,snapshot_json FROM package_quotes ORDER BY created_at DESC LIMIT 100');return json({quotes:rows.map(row=>({id:row.id,customer:JSON.parse(row.snapshot_json).customer}))});
 }
 if(/^\/api\/staff\/package-quotes\/[a-f\d-]{36}$/i.test(path)&&method==='GET'){
  const row=await one(db,'SELECT id,snapshot_json FROM package_quotes WHERE id=?',path.split('/').at(-1));if(!row)throw fail(404,'Quote not found.');return json({id:row.id,...JSON.parse(row.snapshot_json)});
 }
 return null;
}

export {command,replay,cleanPackageData,materializePackage,readPackage,allPackageLines,readPublishedPackage,savePackage};
