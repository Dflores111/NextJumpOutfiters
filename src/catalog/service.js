import {publicPlanningCatalog} from './planning.js';
import {validateBuild,buildItems,buildKind,validModelYear,makeOptions,modelOptions,bedOptions} from '../builder/domain.js';
import {upgradeModels} from './planning.js';
import {canStaff,localIdentity,staffActor,staffPermission} from './access.js';

// Edge-compatible service. D1 and the local SQLite adapter share this contract.
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const fail=(status,message)=>Object.assign(new Error(message),{status});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const id=()=>crypto.randomUUID();
const now=()=>new Date().toISOString();
const all=async(db,sql,...values)=>(await db.prepare(sql).bind(...values).all()).results;
const one=(db,sql,...values)=>db.prepare(sql).bind(...values).first();
const run=(db,sql,...values)=>db.prepare(sql).bind(...values).run();
const text=(value,max=150)=>typeof value==='string'?value.trim().slice(0,max):'';
const token=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{32,96}$/.test(value);
const locations=['Tacoma Showroom','Overland Expo Redmond','Online Shop Shipping'];
const writeRates=new Map();
function rateLimit(request){const time=Date.now(),key=request.headers.get('cf-connecting-ip')||'local',current=writeRates.get(key),bucket=current&&time-current.start<60000?current:{start:time,count:0};bucket.count++;writeRates.set(key,bucket);if(writeRates.size>1000)for(const [key,value]of writeRates)if(time-value.start>=60000)writeRates.delete(key);if(bucket.count>30)throw fail(429,'Too many saves. Wait a minute; your browser draft is still here.');}
export const vehicleKey=truck=>[truck.year,truck.make,truck.model,truck.bed].join('|');
async function body(request){
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))throw fail(415,'Send this request as JSON.');
 const reader=request.body?.getReader();if(!reader)throw fail(400,'A request is required.');
 let size=0,parts=[];for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>24000){await reader.cancel();throw fail(413,'This request is too large.');}parts.push(chunk.value);}
 try{const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{throw fail(400,'This request is not valid JSON.');}
}
function sameOrigin(request){const origin=request.headers.get('origin');const site=request.headers.get('sec-fetch-site');if(origin!==new URL(request.url).origin||(site&&!['same-origin','none'].includes(site)))throw fail(403,'Use this workspace to make the change.');}
const decodeProduct=row=>({...row,data:JSON.parse(row.data_json),data_json:undefined});
export async function estimateBuild(db,build){
 const lines=[];let subtotal=0;const mode=build.plan.fulfillment;
 for(const item of buildItems(build)){
  const candidates=await all(db,"SELECT p.* FROM master_products p JOIN master_fitments f ON f.product_id=p.id WHERE p.state='APPROVED' AND p.planning_slot=? AND f.vehicle_key=? AND f.state='APPROVED' AND f.product_revision=p.revision",item.id,vehicleKey(build.truck));
  let match=null;if(candidates.length===1){const data=JSON.parse(candidates[0].data_json),price=data.prices?.[mode];if(price?.state==='APPROVED'&&Number.isSafeInteger(price.cents)&&price.cents>=0&&price.currency==='USD')match={row:candidates[0],price};}
  if(match){subtotal+=match.price.cents;lines.push({slot:item.id,name:item.name,productTitle:match.row.title,productId:match.row.id,revision:match.row.revision,cents:match.price.cents,currency:'USD',state:'APPROVED'});}
  else lines.push({slot:item.id,name:item.name,cents:null,state:candidates.length>1?'REQUIRES_SPECIFICATION':'REQUIRES_REVIEW'});
 }
 return {currency:'USD',lines,knownSubtotalCents:subtotal,totalCents:null,status:'SHOP_REVIEW_REQUIRED',excludes:['Tax','Freight','Additional labor or engineering'],fulfillment:mode,kind:buildKind(build)};
}
const buildRecord=row=>({id:row.id,buildId:row.build_id,version:row.version,parentId:row.parent_id,createdAt:row.created_at,config:JSON.parse(row.config_json),estimate:JSON.parse(row.estimate_json),sentToShop:false});
async function saveBuild(request,db){
 sameOrigin(request);
 rateLimit(request);
 const key=request.headers.get('idempotency-key'),access=request.headers.get('x-build-access');
 if(!token(key)||!token(access))throw fail(400,'A valid save key and reopen key are required.');
 const input=await body(request),checked=validateBuild(input.config);if(!checked.valid)throw fail(422,checked.errors.join(' '));
 const clean={config:checked.value,parentId:text(input.parentId,40)||null};
 const fingerprint=await hash(JSON.stringify(clean)),keyHash=await hash(key),accessHash=await hash(access);
 const previous=await one(db,'SELECT * FROM build_versions WHERE key_hash=?',keyHash);
 if(previous){if(previous.fingerprint!==fingerprint||previous.access_hash!==accessHash)throw fail(409,'This save key belongs to a different build. Try a new save.');return json({...buildRecord(previous),reused:true});}
 let parent=null;if(clean.parentId){parent=await one(db,'SELECT * FROM build_versions WHERE id=? AND access_hash=?',clean.parentId,accessHash);if(!parent)throw fail(404,'The saved build was not found with this reopen key.');const latest=await one(db,'SELECT MAX(version) AS version FROM build_versions WHERE build_id=?',parent.build_id);if(latest.version!==parent.version)throw fail(409,'A newer version exists. Reopen the latest version before saving again.');}
 const row={id:id(),buildId:parent?.build_id||id(),version:parent?parent.version+1:1,parentId:parent?.id||null,keyHash,accessHash,fingerprint,config:JSON.stringify(clean.config),estimate:JSON.stringify(await estimateBuild(db,clean.config)),createdAt:now()};
 try{const result=await run(db,'INSERT INTO build_versions (id,build_id,version,parent_id,key_hash,access_hash,fingerprint,config_json,estimate_json,created_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM build_versions)<10000',...Object.values(row));if(result.meta?.changes===0)throw fail(503,'Build storage is full. Download a copy while the team restores saving.');}
 catch(error){if(error.status)throw error;const retry=await one(db,'SELECT * FROM build_versions WHERE key_hash=?',keyHash);if(retry&&retry.fingerprint===fingerprint&&retry.access_hash===accessHash)return json({...buildRecord(retry),reused:true});throw fail(409,'Another save completed first. Reopen the latest version and try again.');}
 return json({...buildRecord(await one(db,'SELECT * FROM build_versions WHERE id=?',row.id)),reused:false},201);
}
async function inventory(db){const rows=await all(db,"SELECT p.id,p.title,json_extract(p.data_json,'$.stockType') AS stockType,m.location,COUNT(m.id) AS events,SUM(CASE WHEN m.kind='COUNT' THEN 1 ELSE 0 END) AS verified,COALESCE(SUM(m.onhand_delta),0) AS onhand,COALESCE(SUM(m.reserved_delta),0) AS reserved FROM master_products p JOIN inventory_movements m ON m.product_id=p.id GROUP BY p.id,m.location ORDER BY p.title");return rows.map(row=>({...row,available:row.verified&&row.stockType==='STOCKED'?row.onhand-row.reserved:null}));}
async function moveInventory(request,db,actor){
 const input=await body(request),key=request.headers.get('idempotency-key');if(!token(key))throw fail(400,'A valid inventory action key is required.');
 const action={productId:text(input.productId,40),location:text(input.location),kind:text(input.kind),quantity:input.quantity,reference:text(input.reference),reason:text(input.reason,300)};
 if(!locations.includes(action.location)||!['COUNT','RECEIVE','RESERVE','RELEASE'].includes(action.kind)||!Number.isSafeInteger(action.quantity)||action.quantity<0||action.quantity>1000000||(action.kind!=='COUNT'&&action.quantity===0)||!action.reason||(['RESERVE','RELEASE'].includes(action.kind)&&!action.reference))throw fail(422,'Choose a location, valid quantity, reason and a job/build reference for reservations.');
 const fingerprint=await hash(JSON.stringify(action)),eventKey=await hash(key),prior=await one(db,'SELECT * FROM inventory_movements WHERE event_key=?',eventKey);
 if(prior){if(prior.fingerprint!==fingerprint)throw fail(409,'This action key was already used for a different change.');return json({movement:prior,reused:true});}
 const product=await one(db,'SELECT id,data_json FROM master_products WHERE id=?',action.productId);if(!product)throw fail(404,'Product not found.');
 if(action.kind!=='RELEASE'&&JSON.parse(product.data_json).stockType!=='STOCKED')throw fail(422,'Review this product as a stocked physical item before counting, receiving or reserving it. Services and non-stocked items do not promise warehouse stock.');
 const scope='product_id=? AND location=?';
 const stock=`COALESCE((SELECT SUM(onhand_delta) FROM inventory_movements WHERE ${scope}),0)`;
 const reserved=`COALESCE((SELECT SUM(reserved_delta) FROM inventory_movements WHERE ${scope}),0)`;
 const qty=action.quantity;
 let delta='?',deltaArgs=[action.kind==='RECEIVE'?qty:0],reservedDelta=action.kind==='RESERVE'?qty:action.kind==='RELEASE'?-qty:0,condition='1',conditionArgs=[];
 if(action.kind==='COUNT'){delta=`? - ${stock}`;deltaArgs=[qty,action.productId,action.location];condition=`? >= ${reserved}`;conditionArgs=[qty,action.productId,action.location];}
 if(action.kind==='RESERVE'){condition=`EXISTS(SELECT 1 FROM inventory_movements WHERE ${scope} AND kind='COUNT') AND ${stock} - ${reserved} >= ?`;conditionArgs=[action.productId,action.location,action.productId,action.location,action.productId,action.location,qty];}
 if(action.kind==='RELEASE'){condition=`COALESCE((SELECT SUM(reserved_delta) FROM inventory_movements WHERE ${scope} AND reference=?),0)>=?`;conditionArgs=[action.productId,action.location,action.reference,qty];}
 if(action.kind!=='RELEASE'){condition+=` AND EXISTS(SELECT 1 FROM master_products WHERE id=? AND json_extract(data_json,'$.stockType')='STOCKED')`;conditionArgs.push(action.productId);}
 await run(db,`INSERT OR IGNORE INTO inventory_movements (id,event_key,fingerprint,product_id,location,kind,onhand_delta,reserved_delta,reference,actor,reason,created_at) SELECT ?,?,?,?,?,?,${delta},?,?,?,?,? WHERE ${condition}`,id(),eventKey,fingerprint,action.productId,action.location,action.kind,...deltaArgs,reservedDelta,action.reference,actor,action.reason,now(),...conditionArgs);
 const saved=await one(db,'SELECT * FROM inventory_movements WHERE event_key=?',eventKey);if(!saved)throw fail(409,'This change would exceed verified available stock or release stock held for another job.');if(saved.fingerprint!==fingerprint)throw fail(409,'This action key belongs to another change.');return json({movement:saved,reused:false},201);
}
async function updateProduct(request,db,productId,actor){
 const input=await body(request),row=await one(db,'SELECT * FROM master_products WHERE id=?',productId);if(!row)throw fail(404,'Product not found.');
 if(!Number.isSafeInteger(input.revision)||input.revision!==row.revision)throw fail(409,'This product changed. Refresh before editing.');
 if(!['DRAFT','REVIEW','APPROVED','RETIRED'].includes(input.state)||!text(input.reason,300))throw fail(422,'Choose a review state and record your reason.');
 const data=JSON.parse(row.data_json);data.prices??={};
 const title=input.title===undefined?row.title:text(input.title,300),category=input.category===undefined?row.category:text(input.category,200);if(!title||!category)throw fail(422,'Product name and category cannot be empty.');
 if(input.supplierSku!==undefined)data.supplierSku=text(input.supplierSku,100)||null;if(input.manufacturerPartNumber!==undefined)data.manufacturerPartNumber=text(input.manufacturerPartNumber,100)||null;
 if(input.stockType!==undefined){if(!['UNREVIEWED','STOCKED','NON_STOCKED','SERVICE'].includes(input.stockType))throw fail(422,'Choose a recognized inventory classification.');data.stockType=input.stockType;}
 if(input.price){const p=input.price;if(!['installed','diy'].includes(p.mode)||!Number.isSafeInteger(p.cents)||p.cents<0||p.cents>100000000||!['DRAFT','APPROVED'].includes(p.state))throw fail(422,'Use a valid price mode, integer cents and approval state.');data.prices[p.mode]={cents:p.cents,currency:'USD',state:p.state,approvedBy:p.state==='APPROVED'?actor:null,updatedAt:now()};}
 const slot=input.planningSlot===''?null:text(input.planningSlot,50);if(slot&&!publicPlanningCatalog().products.concat(publicPlanningCatalog().upgrades).some(p=>p.id===slot))throw fail(422,'Choose a recognized planning option.');
 const actionId=id(),time=now(),payload=JSON.stringify({revision:row.revision+1,state:input.state,title,category,stockType:data.stockType||'UNREVIEWED',planningSlot:slot,reason:text(input.reason,300),price:input.price||null,previous:{revision:row.revision,state:row.state,title:row.title,category:row.category}});
 const eligible="(?='STOCKED' OR NOT EXISTS(SELECT 1 FROM inventory_movements WHERE product_id=? GROUP BY location HAVING SUM(reserved_delta)>0))",classification=data.stockType||'UNREVIEWED';
 if(classification!=='STOCKED'&&await one(db,'SELECT product_id FROM inventory_movements WHERE product_id=? GROUP BY location HAVING SUM(reserved_delta)>0 LIMIT 1',productId))throw fail(409,'Release active job reservations before changing this item away from stocked inventory.');
 // The audit row and optimistic product update commit together. Losing edits create neither.
 const results=await db.batch([
  db.prepare('INSERT INTO master_audit (id,subject_id,action,actor,payload,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM master_products WHERE id=? AND revision=?) AND '+eligible).bind(actionId,productId,'PRODUCT_REVIEW',actor,payload,time,productId,input.revision,classification,productId),
  db.prepare('UPDATE master_products SET title=?,category=?,state=?,planning_slot=?,data_json=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND '+eligible).bind(title,category,input.state,slot,JSON.stringify(data),time,productId,input.revision,classification,productId)
 ]);if(!results[1].meta?.changes)throw fail(409,'Another edit completed first. Refresh the product.');return json({product:decodeProduct(await one(db,'SELECT * FROM master_products WHERE id=?',productId))});
}
async function fitment(request,db,actor){
 const input=await body(request);if(!text(input.productId,40)||!text(input.vehicleKey,200)||!Number.isSafeInteger(input.revision)||!['APPROVED','BLOCKED'].includes(input.state)||!text(input.evidence,300))throw fail(422,'Record the product revision, exact vehicle key, decision and evidence.');
 const product=await one(db,'SELECT id,revision FROM master_products WHERE id=?',input.productId);if(!product)throw fail(404,'Product not found.');
 if(input.revision!==product.revision)throw fail(409,'The product changed. Refresh it before reviewing fitment.');
 if(input.state==='APPROVED'){const parts=input.vehicleKey.split('|'),[year,make,model,bed]=parts;const makes=new Set([...makeOptions,...Object.keys(upgradeModels)]),models=new Set([...modelOptions(make),...(upgradeModels[make]||[])]);if(parts.length!==4||!year||!validModelYear(year)||!makes.has(make)||!models.has(model)||(bed&&!bedOptions(make,model).includes(bed))||/not sure|to confirm/i.test(model))throw fail(422,'Approved fitment needs a specific model year, make, model and valid factory bed, or an empty bed for vehicle upgrades. Unsure selections stay under review.');}
 const time=now(),values=[id(),input.productId,text(input.vehicleKey,200),input.state,text(input.evidence,300),actor,time,product.revision];
 const results=await db.batch([db.prepare('INSERT INTO master_fitments (id,product_id,vehicle_key,state,evidence,actor,created_at,product_revision) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM master_products WHERE id=? AND revision=?) ON CONFLICT(product_id,vehicle_key) DO UPDATE SET state=excluded.state,evidence=excluded.evidence,actor=excluded.actor,created_at=excluded.created_at,product_revision=excluded.product_revision').bind(...values,product.id,product.revision),db.prepare('INSERT INTO master_audit (id,subject_id,action,actor,payload,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM master_products WHERE id=? AND revision=?)').bind(id(),input.productId,'FITMENT_REVIEW',actor,JSON.stringify({vehicleKey:values[2],state:input.state,evidence:values[4],productRevision:product.revision}),time,product.id,product.revision)]);if(!results[0].meta?.changes)throw fail(409,'The product changed before this decision saved. Refresh and review it again.');return json({saved:true});
}
export async function catalogService(request,env,{localStaff=false,staffIdentity=null}={}){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/catalog')&&!path.startsWith('/api/builds')&&!path.startsWith('/api/staff'))return null;
 try{
  if(path==='/api/catalog'&&request.method==='GET')return json(publicPlanningCatalog());
  const staff=path.startsWith('/api/staff');
  const identity=localStaff?localIdentity:staffIdentity,permission=staffPermission(path,request.method);
  if(staff&&!identity)throw fail(403,'Sign in with an authorized shop account to use this workspace.');
  if(staff&&permission!=='session'&&!canStaff(identity,permission))throw fail(403,'Your staff role cannot perform this action. Ask the shop administrator if your access needs to change.');
  if(path==='/api/staff/session'&&request.method==='GET')return json({identity,permissions:['catalog','inventory','sales','audit'].filter(p=>canStaff(identity,p))});
  if(!env.DB)throw fail(503,'Saved builds are temporarily unavailable. Your browser draft is still here.');
  if(request.method!=='GET')sameOrigin(request);
  if(path==='/api/builds'&&request.method==='POST')return await saveBuild(request,env.DB);
  if(/^\/api\/builds\/[a-zA-Z0-9-]{36}$/.test(path)&&request.method==='GET'){
   const access=request.headers.get('x-build-access');if(!token(access))throw fail(401,'Use the reopen link to access this build.');
   const row=await one(env.DB,'SELECT * FROM build_versions WHERE id=? AND access_hash=?',path.split('/').at(-1),await hash(access));if(!row)throw fail(404,'No saved build was found with this reopen key.');
   const latest=await one(env.DB,'SELECT id,version FROM build_versions WHERE build_id=? ORDER BY version DESC LIMIT 1',row.build_id);return json({...buildRecord(row),latestId:latest.id,latestVersion:latest.version});
  }
  if(staff){const actor=staffActor(identity),db=env.DB;
   if(path==='/api/staff/products'&&request.method==='POST'){const input=await body(request),title=text(input.title,300),category=text(input.category,200);if(!title||!category)throw fail(422,'Add a product name and category.');const productId=id(),time=now();await db.batch([db.prepare('INSERT INTO master_products (id,source_key,title,category,state,revision,planning_slot,data_json,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(productId,`manual:${productId}`,title,category,'DRAFT',1,null,JSON.stringify({source:'Manual staff entry',supplierSku:text(input.supplierSku,100)||null,prices:{}}),time),db.prepare('INSERT INTO master_audit (id,subject_id,action,actor,payload,created_at) VALUES (?,?,?,?,?,?)').bind(id(),productId,'PRODUCT_CREATED',actor,JSON.stringify({title,category}),time)]);return json({product:decodeProduct(await one(env.DB,'SELECT * FROM master_products WHERE id=?',productId))},201);}
   if(path==='/api/staff/products'&&request.method==='GET'){const q=text(url.searchParams.get('q'),80),rows=await all(env.DB,'SELECT * FROM master_products WHERE title LIKE ? ORDER BY title LIMIT 100',`%${q}%`);return json({products:rows.map(decodeProduct),locations,total:(await one(env.DB,'SELECT COUNT(*) AS count FROM master_products')).count,localOnly:!!identity.local});}
   if(path==='/api/staff/options'&&request.method==='GET'){const q=text(url.searchParams.get('q'),80);const rows=await all(db,"SELECT id,title,json_extract(data_json,'$.stockType') AS stockType,json_extract(data_json,'$.options') AS options FROM master_products WHERE title LIKE ? ORDER BY title LIMIT 100",`%${q}%`);return json({products:rows.map(({options,...p})=>{const values=options?JSON.parse(options):[];return {...p,variant:Array.isArray(values)?values.filter(Boolean).join(' · '):''};})});}
   if(/^\/api\/staff\/products\/[a-zA-Z0-9-]{36}$/.test(path)&&request.method==='PATCH')return await updateProduct(request,env.DB,path.split('/').at(-1),actor);
   if(path==='/api/staff/fitments'&&request.method==='POST')return await fitment(request,env.DB,actor);
   if(path==='/api/staff/inventory'&&request.method==='GET')return json({stock:await inventory(env.DB),candidates:await all(env.DB,'SELECT * FROM inventory_sources ORDER BY location LIMIT 100'),candidateCount:(await one(env.DB,'SELECT COUNT(*) AS count FROM inventory_sources')).count,locations});
   if(path==='/api/staff/inventory'&&request.method==='POST')return await moveInventory(request,env.DB,actor);
   if(path==='/api/staff/builds'&&request.method==='GET')return json({builds:(await all(env.DB,'SELECT * FROM build_versions ORDER BY created_at DESC LIMIT 100')).map(buildRecord)});
   if(path==='/api/staff/audit'&&request.method==='GET')return json({events:await all(env.DB,'SELECT id,subject_id,action,actor,payload,created_at FROM master_audit ORDER BY created_at DESC LIMIT 100'),movements:await all(env.DB,'SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 100')});
  }
  throw fail(404,'Endpoint not found.');
 }catch(error){return json({error:error.status?error.message:'This change could not be saved. Your entries are still here.'},error.status||503);}
}
