import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {sqliteAdapter} from '../scripts/local-master.mjs';
import {catalogService} from '../src/catalog/service.js';
const origin='https://example.test',location='Tacoma Showroom',key=()=>randomUUID().replaceAll('-','');
const admin={provider:'google',subject:'qa-admin',email:'admin@example.test',roles:['admin']},worker={...admin,subject:'qa-inventory',email:'inventory@example.test',roles:['inventory']};
async function fixture(){const database=new DatabaseSync(':memory:');database.exec('PRAGMA foreign_keys=ON');for(const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())database.exec(await readFile(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));return {database,DB:sqliteAdapter(database)};}
function part(env,stockType='STOCKED'){const id=randomUUID();env.database.prepare('INSERT INTO master_products VALUES (?,?,?,?,?,?,?,?,?)').run(id,'synthetic:'+id,'DEMO trail light','Lighting','DRAFT',1,null,JSON.stringify({stockType,supplierSku:'DEMO-'+id.slice(0,4),candidateCostCents:8765432,prices:{installed:{cents:1234567}}}),new Date().toISOString());return id;}
async function call(env,path,method='GET',body,identity=admin,actionKey=key(),headers={}){const r=await catalogService(new Request(origin+'/api/staff/'+path,{method,headers:{Origin:origin,'Idempotency-Key':actionKey,...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}),env,{staffIdentity:identity});return {status:r.status,value:await r.json()};}
const stock=async(env,id)=>{const r=await call(env,`inventory/items?${new URLSearchParams({q:id,location})}`);return r.value.items[0];};
const count=(env,id,quantity)=>call(env,'inventory','POST',{productId:id,location,kind:'COUNT',quantity,reason:'Synthetic QA count'});
const po=(env,lines)=>call(env,'purchases','POST',{supplier:'DEMO supplier',location,lines});
const detail=(env,id,kind='purchases',identity=admin)=>call(env,`${kind}/${id}`,'GET',null,identity);
const order=(env,id,revision=1)=>call(env,`purchases/${id}`,'POST',{action:'ORDER',revision});
const receive=(env,id,revision,lines,actionKey=key())=>call(env,`purchases/${id}/receive`,'POST',{revision,lines,reference:'DEMO packing slip'},worker,actionKey);
const job=(env,lines)=>call(env,'jobs','POST',{title:'DEMO Tacoma lighting install',vehicle:'DEMO Toyota Tacoma',location,lines});
const complete=(env,id,revision,lines,actionKey=key())=>call(env,`jobs/${id}`,'POST',{action:'COMPLETE',revision,lines},worker,actionKey);

test('barcode lookup preserves leading zeros and case; aliases are unique and cost-free',async()=>{
 const env=await fixture(),a=part(env),b=part(env),actionKey=key(),payload={productId:a,code:'001234567890'};
 let r=await call(env,'barcodes','POST',payload,worker,actionKey);assert.equal(r.status,200,JSON.stringify(r.value));assert.equal((await call(env,'barcodes','POST',payload,worker,actionKey)).value.reused,true);
 assert.equal((await call(env,'barcodes','POST',{...payload,productId:b},worker)).status,409);
 const found=await call(env,`barcodes?${new URLSearchParams({code:payload.code,location})}`,'GET',null,worker);assert.equal(found.value.item.id,a);assert.ok(!/8765432|1234567|unitCost/.test(JSON.stringify(found.value.item)));
 assert.equal((await call(env,'barcodes?code=1234567890','GET',null,worker)).status,404);
 assert.equal((await call(env,'barcodes','POST',{productId:a,code:'CODE-a'},worker)).status,200);assert.equal((await call(env,'barcodes?code=CODE-A','GET',null,worker)).status,404);
 const alias=r.value.barcodes[0];assert.equal((await call(env,'barcodes','POST',{productId:a,code:alias.code,createdAt:alias.createdAt,remove:true},worker)).status,200);assert.equal((await call(env,'barcodes?code='+alias.code,'GET',null,worker)).status,404);
 assert.equal(env.database.prepare('SELECT revision FROM master_products WHERE id=?').get(a).revision,1);env.database.close();
});
test('purchase orders receive in parts, preserve unknown baseline and never receive twice',async()=>{
 const env=await fixture(),a=part(env),b=part(env),r=await po(env,[{productId:a,quantity:5,unitCostCents:1500},{productId:b,quantity:2}]);assert.equal(r.status,201,JSON.stringify(r.value));const id=r.value.id;
 assert.equal((await receive(env,id,1,[{productId:a,quantity:1}])).status,409);assert.equal((await order(env,id)).status,200);
 const actionKey=key();assert.equal((await receive(env,id,2,[{productId:a,quantity:3}],actionKey)).status,200);assert.equal((await receive(env,id,2,[{productId:a,quantity:3}],actionKey)).value.reused,true);assert.equal((await receive(env,id,2,[{productId:a,quantity:4}],actionKey)).status,409);
 let d=(await detail(env,id)).value;assert.equal(d.record.status,'PARTIAL');assert.equal(d.lines.find(l=>l.productId===a).received,3);assert.equal((await stock(env,a)).onhand,null);
 assert.equal((await receive(env,id,3,[{productId:a,quantity:3},{productId:b,quantity:1}])).status,409);assert.equal((await detail(env,id)).value.lines.find(l=>l.productId===b).received,0);
 assert.equal((await receive(env,id,3,[{productId:a,quantity:2},{productId:b,quantity:2}])).status,200);assert.equal((await detail(env,id)).value.record.status,'RECEIVED');assert.equal(env.database.prepare("SELECT SUM(onhand_delta) n FROM inventory_movements WHERE product_id=?").get(a).n,5);env.database.close();
});
test('purchase receiving is atomic on concurrent stale revisions and cancellation keeps prior receipts',async()=>{
 const env=await fixture(),a=part(env);await count(env,a,4);const id=(await po(env,[{productId:a,quantity:6}])).value.id;await order(env,id);
 const results=await Promise.all([receive(env,id,2,[{productId:a,quantity:2}]),receive(env,id,2,[{productId:a,quantity:2}])]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal((await stock(env,a)).onhand,6);
 assert.equal((await call(env,`purchases/${id}`,'POST',{action:'CANCEL',revision:3,note:'DEMO cancelled remainder'})).status,200);assert.equal((await detail(env,id)).value.record.status,'CANCELLED');assert.equal((await receive(env,id,4,[{productId:a,quantity:1}])).status,409);assert.equal((await stock(env,a)).onhand,6);env.database.close();
});
test('draft order edits are revision checked, and retired or non-physical parts are rejected',async()=>{
 const env=await fixture(),a=part(env),b=part(env,'SERVICE');assert.equal((await po(env,[{productId:b,quantity:1}])).status,409);const id=(await po(env,[{productId:a,quantity:1}])).value.id;
 const input={action:'EDIT',revision:1,supplier:'DEMO new supplier',lines:[{productId:a,quantity:4,unitCostCents:9900}]};assert.equal((await call(env,`purchases/${id}`,'POST',input)).status,200);assert.equal((await call(env,`purchases/${id}`,'POST',input)).status,409);let d=(await detail(env,id)).value;assert.equal(d.lines[0].quantity,4);assert.equal(d.record.supplier,'DEMO new supplier');await order(env,id,2);assert.equal((await call(env,`purchases/${id}`,'POST',{...input,revision:3})).status,409);env.database.close();
});
test('job completion deducts actual use and releases unused holds, once only',async()=>{
 const env=await fixture(),a=part(env),b=part(env);await count(env,a,10);await count(env,b,4);const r=await job(env,[{productId:a,quantity:5},{productId:b,quantity:2}]);assert.equal(r.status,201,JSON.stringify(r.value));const id=r.value.id;
 assert.equal((await stock(env,a)).reserved,5);assert.equal((await stock(env,a)).onhand,10);
 const actionKey=key(),lines=[{productId:a,quantity:3},{productId:b,quantity:0}];assert.equal((await complete(env,id,1,lines,actionKey)).status,200);assert.equal((await complete(env,id,1,lines,actionKey)).value.reused,true);assert.equal((await complete(env,id,2,lines)).status,409);
 const row=await stock(env,a);assert.equal(row.onhand,7);assert.equal(row.reserved,0);assert.equal(row.available,7);assert.equal((await stock(env,b)).onhand,4);assert.equal((await detail(env,id,'jobs')).value.record.status,'COMPLETE');env.database.close();
});
test('jobs cannot overbook, use uncounted stock, omit held parts, overconsume or release protected holds manually',async()=>{
 const env=await fixture(),a=part(env),b=part(env);assert.equal((await job(env,[{productId:a,quantity:1}])).status,409);await count(env,a,3);await count(env,b,2);
 const results=await Promise.all([job(env,[{productId:a,quantity:2}]),job(env,[{productId:a,quantity:2}])]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);const id=results.find(r=>r.status===201).value.id;
 assert.equal((await call(env,'inventory','POST',{productId:a,location,kind:'RELEASE',quantity:1,reference:'job:'+id,reason:'DEMO invalid manual release'})).status,422);
 assert.equal((await complete(env,id,1,[{productId:b,quantity:0}])).status,409);assert.equal((await complete(env,id,1,[{productId:a,quantity:3}])).status,409);assert.equal((await stock(env,a)).onhand,3);assert.equal((await count(env,a,1)).status,409);env.database.close();
});
test('jobs add parts atomically and cancellation releases all holds without deducting stock',async()=>{
 const env=await fixture(),a=part(env),b=part(env);await count(env,a,7);await count(env,b,3);const id=(await job(env,[{productId:a,quantity:2}])).value.id;
 assert.equal((await call(env,`jobs/${id}/parts`,'POST',{revision:1,lines:[{productId:a,quantity:1},{productId:b,quantity:4}]})).status,409);assert.equal((await stock(env,a)).reserved,2);
 const actionKey=key(),input={revision:1,lines:[{productId:a,quantity:1},{productId:b,quantity:2}]};assert.equal((await call(env,`jobs/${id}/parts`,'POST',input,worker,actionKey)).status,200);assert.equal((await call(env,`jobs/${id}/parts`,'POST',input,worker,actionKey)).value.reused,true);assert.equal((await stock(env,a)).reserved,3);
 assert.equal((await call(env,`jobs/${id}`,'POST',{action:'CANCEL',revision:2,note:'DEMO postponed'})).status,200);assert.equal((await stock(env,a)).reserved,0);assert.equal((await stock(env,a)).onhand,7);assert.equal((await stock(env,b)).onhand,3);env.database.close();
});
test('roles, cost projections, cross-origin writes and actor-bound command receipts stay protected',async()=>{
 const env=await fixture(),a=part(env),actionKey=key(),input={supplier:'DEMO supplier',location,lines:[{productId:a,quantity:2,unitCostCents:9876543}]};
 assert.equal((await call(env,'purchases','POST',input,worker)).status,403);let created=await call(env,'purchases','POST',input,admin,actionKey);assert.equal(created.status,201);assert.equal((await call(env,'purchases','POST',input,admin,actionKey)).value.id,created.value.id);
 assert.equal((await call(env,'purchases','POST',input,{...admin,subject:'other'},actionKey)).status,409);
 for(const path of ['purchases?location='+encodeURIComponent(location),`purchases/${created.value.id}`]){const safe=await call(env,path,'GET',null,worker);assert.equal(safe.status,200);assert.ok(!/9876543|unitCostCents|candidateCost/.test(JSON.stringify(safe.value)));assert.equal((await call(env,path,'GET',null,null)).status,403);}
 assert.equal((await call(env,'barcodes','POST',{productId:a,code:'DEMO'},worker,key(),{Origin:'https://evil.test'})).status,403);env.database.close();
});
test('malformed quantities, duplicate lines, dates and location fail before writes',async()=>{
 const env=await fixture(),a=part(env);for(const quantity of [0,-1,1.5,'2',1000001])assert.equal((await po(env,[{productId:a,quantity}])).status,422);
 assert.equal((await po(env,[{productId:a,quantity:1},{productId:a,quantity:2}])).status,422);
 for(const expectedOn of ['2026-02-30','2026-99-01','not-a-date'])assert.equal((await call(env,'purchases','POST',{supplier:'DEMO',location,expectedOn,lines:[{productId:a,quantity:1}]})).status,422);
 assert.equal(env.database.prepare('SELECT COUNT(*) n FROM purchase_orders').get().n,0);env.database.close();
});
test('incoming quantities are separate from available stock and stay scoped to the PO location',async()=>{
 const env=await fixture(),a=part(env);await count(env,a,7);const id=(await po(env,[{productId:a,quantity:5}])).value.id;assert.equal((await stock(env,a)).incoming,0);await order(env,id);let row=await stock(env,a);assert.equal(row.incoming,5);assert.equal(row.available,7);await receive(env,id,2,[{productId:a,quantity:2}]);row=await stock(env,a);assert.equal(row.incoming,3);assert.equal(row.available,9);
 const expo=await call(env,`inventory/items?${new URLSearchParams({location:'Overland Expo Redmond',q:a})}`);assert.equal(expo.value.items[0].incoming,0);assert.equal(expo.value.items[0].available,null);env.database.close();
});
test('simultaneous exact retries create one job and receive one delivery',async()=>{
 const env=await fixture(),a=part(env);await count(env,a,10);const input={title:'DEMO retry job',location,lines:[{productId:a,quantity:2}]},actionKey=key();const jobs=await Promise.all([call(env,'jobs','POST',input,worker,actionKey),call(env,'jobs','POST',input,worker,actionKey)]);assert.ok(jobs.every(r=>r.status===201));assert.equal(jobs[0].value.id,jobs[1].value.id);assert.equal(env.database.prepare('SELECT COUNT(*) n FROM stock_jobs').get().n,1);assert.equal((await stock(env,a)).reserved,2);
 const id=(await po(env,[{productId:a,quantity:4}])).value.id;await order(env,id);const receiptKey=key(),receipts=await Promise.all([receive(env,id,2,[{productId:a,quantity:3}],receiptKey),receive(env,id,2,[{productId:a,quantity:3}],receiptKey)]);assert.ok(receipts.every(r=>r.status===200));assert.equal((await stock(env,a)).onhand,13);assert.equal((await detail(env,id)).value.lines[0].received,3);env.database.close();
});
test('concurrent completion and cancellation cannot both consume or release a job',async()=>{
 const env=await fixture(),a=part(env);await count(env,a,8);const id=(await job(env,[{productId:a,quantity:3}])).value.id;const results=await Promise.all([complete(env,id,1,[{productId:a,quantity:2}]),call(env,`jobs/${id}`,'POST',{action:'CANCEL',revision:1,note:'DEMO cancellation'})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const d=(await detail(env,id,'jobs')).value,row=await stock(env,a);assert.equal(row.reserved,0);assert.equal(row.onhand,d.record.status==='COMPLETE'?6:8);env.database.close();
});
test('a database error rolls back the command receipt, stock and order counters together',async()=>{
 const env=await fixture(),a=part(env);await count(env,a,2);const id=(await po(env,[{productId:a,quantity:3}])).value.id;await order(env,id);env.database.exec("CREATE TRIGGER demo_fail_receipt BEFORE UPDATE ON purchase_order_lines BEGIN SELECT RAISE(ABORT,'synthetic rollback'); END");assert.equal((await receive(env,id,2,[{productId:a,quantity:2}])).status,503);assert.equal((await stock(env,a)).onhand,2);assert.equal((await detail(env,id)).value.record.revision,2);assert.equal(env.database.prepare("SELECT COUNT(*) n FROM master_audit WHERE action='PO_RECEIVED'").get().n,0);env.database.close();
});
test('operations lists search literal wildcards, filter statuses and paginate beyond the first page',async()=>{
 const env=await fixture(),a=part(env);for(let n=0;n<34;n++)await call(env,'purchases','POST',{supplier:n===33?'DEMO 100%_supplier':`DEMO Supplier ${String(n).padStart(2,'0')}`,location,lines:[{productId:a,quantity:1}]});
 const first=await call(env,'purchases?'+new URLSearchParams({location,sort:'name'})),last=await call(env,'purchases?'+new URLSearchParams({location,page:2,sort:'name'}));assert.equal(first.value.total,34);assert.equal(first.value.records.length,30);assert.equal(last.value.records.length,4);assert.equal(new Set([...first.value.records,...last.value.records].map(r=>r.id)).size,34);assert.equal((await call(env,'purchases?'+new URLSearchParams({location,q:'%_'}))).value.total,1);assert.equal((await call(env,'purchases?'+new URLSearchParams({location,status:'RECEIVED'}))).value.total,0);env.database.close();
});
