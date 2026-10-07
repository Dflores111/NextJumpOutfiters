import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {sqliteAdapter} from '../scripts/local-master.mjs';
import {catalogService,estimateBuild,vehicleKey} from '../src/catalog/service.js';
import {createBuild,validateBuild,sanitizeBuild,buildItems} from '../src/builder/domain.js';
import {recommendPlan} from '../src/catalog/planning.js';

const origin='https://example.test',token=()=>randomUUID().replaceAll('-','');
async function fixture(){const database=new DatabaseSync(':memory:');database.exec('PRAGMA foreign_keys=ON');for(const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())database.exec(await readFile(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));return {database,DB:sqliteAdapter(database)};}
const ready=()=>({...createBuild('toyota-tacoma-5ft-short-bed'),truck:{year:'2022',make:'Toyota',model:'Tacoma',bed:'5 ft'},use:'Daily use & weekends'});
async function call(env,path,method='GET',body,headers={},localStaff=false,staffIdentity=null){const response=await catalogService(new Request(origin+path,{method,headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}),env,{localStaff,staffIdentity});return {status:response.status,value:await response.json()};}
function candidate(env,{state='DRAFT',priceState='DRAFT',slot='base',cents=10000}={}){const id=randomUUID();env.database.prepare('INSERT INTO master_products VALUES (?,?,?,?,?,?,?,?,?)').run(id,`fixture:${id}`,'Fixture product','Test',state,1,slot,JSON.stringify({stockType:'STOCKED',options:['Synthetic variant'],candidateCostCents:99,supplierSku:'FIXTURE',prices:{installed:{state:priceState,cents,currency:'USD'}}}),'2026-10-07');return id;}
function fit(env,id,truck=ready().truck){env.database.prepare('INSERT INTO master_fitments VALUES (?,?,?,?,?,?,?,?)').run(randomUUID(),id,vehicleKey(truck),'APPROVED','Synthetic test evidence','Test actor','2026-10-07',env.database.prepare('SELECT revision FROM master_products WHERE id=?').get(id).revision);}
const save=(env,config=ready(),key=token(),access=token(),parentId)=>call(env,'/api/builds','POST',{config,parentId},{'Idempotency-Key':key,'X-Build-Access':access});

test('planning directions preserve uncertain vehicles and keep package priorities out of flatbed parts',()=>{
 const build={...ready(),truck:{year:'',make:'Lexus',model:'GX460/470',bed:''},selected:[],plan:{kind:'vehicle',packageId:'overlander-heavy',upgradeIds:['suspension'],fulfillment:'installed',answers:{load:'permanent',notes:'Private'}}};
 assert.equal(validateBuild(build).valid,true);assert.equal(buildItems(sanitizeBuild(build))[0].id,'suspension');assert.equal(sanitizeBuild(build).plan.answers.notes,undefined);
 assert.equal(validateBuild({...build,selected:['base']}).valid,false);assert.equal(validateBuild({...build,plan:{...build.plan,upgradeIds:['invented']}}).valid,false);assert.equal(validateBuild({...build,plan:{...build.plan,packageId:'cargo'}}).valid,false);
 assert.equal(recommendPlan('vehicle',{load:'permanent',trips:'weekend'}).id,'overlander-heavy');assert.equal(recommendPlan('flatbed',{priority:'camper'}).id,'camper-platform');
});
test('public catalog never exposes private candidate fields; hosted staff is closed even with a database',async()=>{
 const env=await fixture();candidate(env);const catalog=await call(env,'/api/catalog');assert.equal(catalog.status,200);assert.ok(!JSON.stringify(catalog.value).includes('candidateCost'));assert.equal((await call(env,'/api/staff/products')).status,403);env.database.close();
});
test('server prices require product, price and exact fitment approval; ambiguities and zero prices stay explicit',async()=>{
 const env=await fixture(),product=candidate(env);fit(env,product);assert.equal((await estimateBuild(env.DB,ready())).lines[0].cents,null);
 env.database.prepare("UPDATE master_products SET state='APPROVED' WHERE id=?").run(product);assert.equal((await estimateBuild(env.DB,ready())).lines[0].cents,null);
 env.database.prepare("UPDATE master_products SET data_json=? WHERE id=?").run(JSON.stringify({prices:{installed:{state:'APPROVED',cents:0,currency:'USD'}}}),product);const estimate=await estimateBuild(env.DB,ready());assert.equal(estimate.lines[0].cents,0);assert.equal(estimate.totalCents,null);
 assert.equal((await estimateBuild(env.DB,{...ready(),truck:{...ready().truck,year:'2023'}})).lines[0].cents,null);
 const duplicate=candidate(env,{state:'APPROVED',priceState:'APPROVED'});fit(env,duplicate);assert.equal((await estimateBuild(env.DB,ready())).lines[0].state,'REQUIRES_SPECIFICATION');env.database.close();
});
test('saved versions survive reconnect, reject missing capabilities and discard contact/free text/client totals',async()=>{
 const env=await fixture(),access=token(),key=token();const result=await save(env,{...ready(),email:'private@example.test',total:1,notes:'Private text'},key,access);assert.equal(result.status,201);
 const id=result.value.id;assert.equal((await call(env,`/api/builds/${id}`)).status,401);assert.equal((await call(env,`/api/builds/${id}`,'GET',null,{'X-Build-Access':token()})).status,404);
 const reopened=await call(env,`/api/builds/${id}`,'GET',null,{'X-Build-Access':access});assert.equal(reopened.status,200);assert.equal(reopened.value.sentToShop,false);assert.equal(reopened.value.estimate.totalCents,null);
 const stored=env.database.prepare('SELECT * FROM build_versions').get();assert.ok(!JSON.stringify(stored).includes('private@example.test'));assert.ok(!JSON.stringify(stored).includes('Private text'));assert.notEqual(stored.access_hash,access);env.database.close();
});
test('exact retries create one version and freeze pricing; changed retries fail',async()=>{
 const env=await fixture(),access=token(),key=token(),product=candidate(env,{state:'APPROVED',priceState:'APPROVED'});fit(env,product);
 const results=await Promise.all([save(env,ready(),key,access),save(env,ready(),key,access)]);assert.ok(results.every(r=>[200,201].includes(r.status)));assert.equal(new Set(results.map(r=>r.value.id)).size,1);
 env.database.prepare('UPDATE master_products SET data_json=? WHERE id=?').run(JSON.stringify({prices:{installed:{state:'APPROVED',cents:99000,currency:'USD'}}}),product);
 assert.equal((await save(env,ready(),key,access)).value.estimate.lines[0].cents,10000);assert.equal((await save(env,{...ready(),use:'Work & hauling'},key,access)).status,409);assert.equal(env.database.prepare('SELECT COUNT(*) AS n FROM build_versions').get().n,1);env.database.close();
});
test('new versions keep old configurations intact and concurrent edits cannot overwrite',async()=>{
 const env=await fixture(),access=token(),root=await save(env,ready(),token(),access),config={...ready(),selected:['base','boxes']};
 const changes=await Promise.all([save(env,config,token(),access,root.value.id),save(env,{...config,use:'Work & hauling'},token(),access,root.value.id)]);assert.deepEqual(changes.map(r=>r.status).sort(),[201,409]);
 const old=await call(env,`/api/builds/${root.value.id}`,'GET',null,{'X-Build-Access':access});assert.deepEqual(old.value.config.selected,['base']);assert.equal(old.value.latestVersion,2);assert.equal((await save(env,config,token(),token(),root.value.id)).status,404);env.database.close();
});
test('same-origin validation and database failures preserve failure states',async()=>{
 const env=await fixture();assert.equal((await call(env,'/api/builds','POST',{config:ready()},{Origin:'https://evil.test','Idempotency-Key':token(),'X-Build-Access':token()})).status,403);
 assert.equal((await save(env,{...ready(),selected:['base','kitchen']})).status,422);assert.equal((await save({})).status,503);env.database.close();
});
test('staff review uses revision checks and commits one audit; price approval is separate from fitment',async()=>{
 const env=await fixture(),id=candidate(env),data={revision:1,state:'APPROVED',planningSlot:'base',reason:'Synthetic review',price:{mode:'installed',cents:25000,state:'APPROVED'}};
 assert.equal((await call(env,`/api/staff/products/${id}`,'PATCH',data,{},true)).status,200);assert.equal((await call(env,`/api/staff/products/${id}`,'PATCH',data,{},true)).status,409);assert.equal(env.database.prepare('SELECT COUNT(*) AS n FROM master_audit').get().n,1);assert.equal((await estimateBuild(env.DB,ready())).lines[0].cents,null);
 assert.equal((await call(env,'/api/staff/fitments','POST',{productId:id,revision:2,vehicleKey:vehicleKey(ready().truck),state:'APPROVED',evidence:'Synthetic exact fitment review'}, {},true)).status,200);assert.equal((await estimateBuild(env.DB,ready())).lines[0].cents,25000);env.database.close();
});
test('imported inventory cannot reserve stock; counted ledger prevents overselling and mismatched releases',async()=>{
 const env=await fixture(),productId=candidate(env),location='Tacoma Showroom',action=(kind,quantity,reference='job-1',key=token())=>call(env,'/api/staff/inventory','POST',{productId,location,kind,quantity,reference,reason:'Synthetic test movement'},{'Idempotency-Key':key},true);
 assert.equal((await action('RESERVE',1)).status,409);assert.equal((await action('RECEIVE',3)).status,201);assert.equal((await action('RESERVE',1)).status,409);assert.equal((await action('COUNT',3)).status,201);
 const reservations=await Promise.all([action('RESERVE',2,'job-1'),action('RESERVE',2,'job-2')]);assert.deepEqual(reservations.map(r=>r.status).sort(),[201,409]);assert.equal((await action('COUNT',1)).status,409);
 const winner=reservations[0].status===201?'job-1':'job-2';assert.equal((await action('RELEASE',1,'wrong-job')).status,409);assert.equal((await action('RELEASE',2,winner)).status,201);assert.equal((await action('RELEASE',1,winner)).status,409);
 const stock=(await call(env,'/api/staff/inventory','GET',null,{},true)).value.stock[0];assert.equal(stock.onhand,3);assert.equal(stock.reserved,0);env.database.close();
});
test('inventory retries are idempotent and zero physical count is different from unknown stock',async()=>{
 const env=await fixture(),productId=candidate(env),key=token(),data={productId,location:'Tacoma Showroom',kind:'COUNT',quantity:0,reference:'',reason:'Synthetic zero count'};
 assert.equal((await call(env,'/api/staff/inventory','POST',data,{'Idempotency-Key':key},true)).status,201);assert.equal((await call(env,'/api/staff/inventory','POST',data,{'Idempotency-Key':key},true)).value.reused,true);assert.equal((await call(env,'/api/staff/inventory','POST',{...data,quantity:2},{'Idempotency-Key':key},true)).status,409);
 const stock=(await call(env,'/api/staff/inventory','GET',null,{},true)).value.stock[0];assert.equal(stock.verified,1);assert.equal(stock.onhand,0);env.database.close();
});
test('product revisions invalidate earlier fitment approval and uncertain vehicles cannot be approved',async()=>{
 const env=await fixture(),product=candidate(env,{state:'APPROVED',priceState:'APPROVED'});fit(env,product);assert.equal((await estimateBuild(env.DB,ready())).lines[0].cents,10000);
 const changed=await call(env,`/api/staff/products/${product}`,'PATCH',{revision:1,title:'Revised test component',category:'Test',state:'APPROVED',planningSlot:'base',reason:'Synthetic revision change'}, {},true);assert.equal(changed.status,200);assert.equal((await estimateBuild(env.DB,ready())).lines[0].cents,null);
 assert.equal((await call(env,'/api/staff/fitments','POST',{productId:product,revision:2,vehicleKey:'|Other / not sure|Not sure|Not sure',state:'APPROVED',evidence:'Synthetic test'}, {},true)).status,422);env.database.close();
});
test('services and unclassified imports cannot enter a physical stock ledger',async()=>{
 const env=await fixture(),productId=candidate(env);env.database.prepare('UPDATE master_products SET data_json=? WHERE id=?').run(JSON.stringify({stockType:'SERVICE',prices:{}}),productId);
 const result=await call(env,'/api/staff/inventory','POST',{productId,location:'Tacoma Showroom',kind:'COUNT',quantity:2,reference:'',reason:'Synthetic service count'},{'Idempotency-Key':token()},true);assert.equal(result.status,422);assert.equal(env.database.prepare('SELECT COUNT(*) AS n FROM inventory_movements').get().n,0);env.database.close();
});
test('named staff roles protect costs/approvals and attribute stock and draft changes to verified actors',async()=>{
 const env=await fixture(),inventory={provider:'google',subject:'synthetic-subject',email:'inventory@example.test',roles:['inventory']},catalog={...inventory,email:'catalog@example.test',roles:['catalog']};
 const productId=candidate(env);assert.equal((await call(env,'/api/staff/products','GET',null,{},false,inventory)).status,403);
 assert.equal((await call(env,'/api/staff/products','POST',{title:'Spoof',category:'Test',roles:['admin']},{},false,inventory)).status,403);
 const options=await call(env,'/api/staff/options','GET',null,{},false,inventory);assert.equal(options.status,200);assert.equal(options.value.products[0].variant,'Synthetic variant');assert.ok(!JSON.stringify(options.value).includes('candidateCost'));
 assert.equal((await call(env,'/api/staff/builds','GET',null,{},false,inventory)).status,403);
 const counted=await call(env,'/api/staff/inventory','POST',{productId,location:'Tacoma Showroom',kind:'COUNT',quantity:3,reference:'',reason:'Synthetic count'},{'Idempotency-Key':token()},false,inventory);assert.equal(counted.status,201);assert.equal(counted.value.movement.actor,'inventory@example.test [google:synthetic-subject]');
 const created=await call(env,'/api/staff/products','POST',{title:'Synthetic draft',category:'Test'},{},false,catalog);assert.equal(created.status,201);assert.equal(created.value.product.state,'DRAFT');assert.deepEqual(created.value.product.data.prices,{});
 const audit=env.database.prepare("SELECT * FROM master_audit WHERE action='PRODUCT_CREATED'").get();assert.equal(audit.actor,'catalog@example.test [google:synthetic-subject]');
 assert.equal((await call(env,'/api/staff/inventory','GET',null,{},false,catalog)).status,403);env.database.close();
});
test('held stock cannot be reclassified; released non-stocked items retain history without availability',async()=>{
 const env=await fixture(),productId=candidate(env),base={productId,location:'Tacoma Showroom',reference:'synthetic-job',reason:'Synthetic test'};
 const move=(kind,quantity)=>call(env,'/api/staff/inventory','POST',{...base,kind,quantity},{'Idempotency-Key':token()},true);
 assert.equal((await move('COUNT',3)).status,201);assert.equal((await move('RESERVE',1)).status,201);
 const review={revision:1,stockType:'NON_STOCKED',state:'DRAFT',planningSlot:'base',reason:'Synthetic classification review'};
 assert.equal((await call(env,`/api/staff/products/${productId}`,'PATCH',review,{},true)).status,409);assert.equal(env.database.prepare('SELECT COUNT(*) AS n FROM master_audit').get().n,0);
 assert.equal((await move('RELEASE',1)).status,201);assert.equal((await call(env,`/api/staff/products/${productId}`,'PATCH',review,{},true)).status,200);
 const stock=(await call(env,'/api/staff/inventory','GET',null,{},true)).value.stock[0];assert.equal(stock.onhand,3);assert.equal(stock.available,null);assert.equal((await move('RESERVE',1)).status,422);env.database.close();
});
