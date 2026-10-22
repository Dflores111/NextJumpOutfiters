import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {sqliteAdapter} from '../scripts/local-master.mjs';
import {catalogService} from '../src/catalog/service.js';
const origin='https://example.test',location='Tacoma Showroom',key=()=>randomUUID().replaceAll('-','');
const admin={provider:'google',subject:'qa',email:'qa@example.test',roles:['admin']};
async function fixture(){
 const database=new DatabaseSync(':memory:');database.exec('PRAGMA foreign_keys=ON');for(const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())database.exec(await readFile(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));
 const env={database,DB:sqliteAdapter(database)},ids=[randomUUID(),randomUUID(),randomUUID()];
 for(const [i,id] of ids.entries())database.prepare('INSERT INTO master_products VALUES (?,?,?,?,?,?,?,?,?)').run(id,id,'QA part '+i,'Suspension','APPROVED',1,null,JSON.stringify({stockType:'STOCKED',supplierSku:'QA-'+i,supplier:i===2?'Second supplier':'QA supplier',candidateCostCents:9876543}),new Date().toISOString());
 for(const [i,id] of ids.entries())await call(env,'inventory','POST',{productId:id,location,kind:'COUNT',quantity:[4,1,0][i],reason:'QA count'});
 const packageId=randomUUID(),quoteId=randomUUID(),lines=ids.map((id,i)=>({productId:id,productRevision:1,title:'QA part '+i,quantity:[2,3,1][i],role:'Part',unitRetailCents:10000}));
 database.prepare('INSERT INTO curated_packages VALUES (?,?,?,?,?,?,?,?)').run(packageId,packageId,'QA package','Lifts','PUBLISHED',1,'{}',new Date().toISOString());
 const customer={number:'NJO-QA',title:'QA package',vehicle:{year:2022,make:'Toyota',model:'Tacoma'},fulfillment:'installed',draft:false,variantLabel:'Front & rear',lines,totals:{partsCents:60000,totalCents:80000,laborCents:20000,alignmentCents:0},excludes:[],fitmentNotes:'Check vehicle'},shop={lines,installNotes:'QA install scope',labor:{frontHours:2}};
 database.prepare('INSERT INTO package_quotes VALUES (?,?,?,?,?,?,?,?,?)').run(quoteId,'NJO-QA',packageId,1,key(),key(),key(),JSON.stringify({customer,shop}),new Date().toISOString());
 return {...env,ids,quoteId};
}
async function call(env,path,method='GET',body,identity=admin,actionKey=key(),requestOrigin=origin){const response=await catalogService(new Request(origin+'/api/staff/'+path,{method,headers:{Origin:requestOrigin,'Idempotency-Key':actionKey,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,{staffIdentity:identity});return {status:response.status,value:await response.json()};}
const preview=async e=>(await call(e,`package-quotes/${e.quoteId}/prepare`)).value;
async function prepare(e,orders=true,identity=admin){const p=await preview(e);return call(e,`package-quotes/${e.quoteId}/prepare`,'POST',{location,reviewToken:p.reviewToken,confirmed:true,orders:orders?p.lines.filter(l=>l.shortage>0).map(l=>({productId:l.productId,quantity:l.shortage,supplier:l.supplier})):[]},identity);}
const scalar=(e,sql,...args)=>Object.values(e.database.prepare(sql).get(...args))[0];

test('quote handoff shows live shortages, groups supplier drafts, preserves quote and reserves once',async()=>{
 const e=await fixture(),before=scalar(e,'SELECT snapshot_json FROM package_quotes');const p=await preview(e);assert.deepEqual(p.lines.map(l=>[l.available,l.reserve,l.shortage]),[[4,2,0],[1,1,2],[0,0,1]]);
 const r=await prepare(e);assert.equal(r.status,201,JSON.stringify(r));assert.equal(r.value.purchases.length,2);assert.equal(scalar(e,'SELECT SUM(reserved_delta) FROM inventory_movements'),3);assert.equal(scalar(e,'SELECT SUM(onhand_delta) FROM inventory_movements'),5);assert.equal(scalar(e,'SELECT snapshot_json FROM package_quotes'),before);
 assert.equal(scalar(e,"SELECT COUNT(*) FROM purchase_orders WHERE status='DRAFT'"),2);assert.equal(scalar(e,'SELECT COUNT(*) FROM purchase_order_lines WHERE unit_cost_cents IS NOT NULL'),0);assert.equal((await prepare(e)).value.job.id,r.value.job.id);assert.equal(scalar(e,'SELECT COUNT(*) FROM stock_jobs'),1);assert.equal(scalar(e,'SELECT SUM(reserved_delta) FROM inventory_movements'),3);
 const d=(await call(e,'jobs/'+r.value.job.id)).value;assert.equal(d.source.quoteNumber,'NJO-QA');assert.equal(d.requirements.length,3);assert.equal(d.purchases.length,2);e.database.close();
});
test('receiving and reserving missing parts unlock completion, then actual use deducts stock once',async()=>{
 const e=await fixture(),r=(await prepare(e)).value,id=r.job.id;
 assert.equal((await call(e,'jobs/'+id,'POST',{action:'COMPLETE',revision:1,lines:[{productId:e.ids[0],quantity:2},{productId:e.ids[1],quantity:1}]})).status,409);
 for(const po of r.purchases){const d=(await call(e,'purchases/'+po.id)).value;await call(e,'purchases/'+po.id,'POST',{action:'ORDER',revision:1});const receive=await call(e,'purchases/'+po.id+'/receive','POST',{revision:2,lines:d.lines.map(l=>({productId:l.productId,quantity:l.quantity}))});assert.equal(receive.status,200);}
 const reserveKey=key(),held=await call(e,`jobs/${id}/reserve-missing`,'POST',{revision:1},admin,reserveKey);assert.equal((await call(e,`jobs/${id}/reserve-missing`,'POST',{revision:1},admin,reserveKey)).value.reused,true);assert.equal(held.status,200,JSON.stringify(held));const d=(await call(e,'jobs/'+id)).value;assert.ok(d.requirements.every(l=>l.held>=l.required));assert.equal(d.record.revision,2);
 const k=key(),payload={action:'COMPLETE',revision:2,lines:d.lines.map(l=>({productId:l.productId,quantity:l.quantity}))};assert.equal((await call(e,'jobs/'+id,'POST',payload,admin,k)).status,200);assert.equal((await call(e,'jobs/'+id,'POST',payload,admin,k)).value.reused,true);assert.equal(scalar(e,'SELECT SUM(reserved_delta) FROM inventory_movements'),0);assert.equal(scalar(e,'SELECT SUM(onhand_delta) FROM inventory_movements'),2);e.database.close();
});
test('unknown stock, stale parts, draft and parts-only quotes never silently become jobs',async()=>{
 for(const mode of ['unknown','retired','revision','draft','diy','type']){const e=await fixture();
 if(mode==='unknown')e.database.prepare('DELETE FROM inventory_movements WHERE product_id=?').run(e.ids[0]);
 if(mode==='retired')e.database.prepare("UPDATE master_products SET state='RETIRED' WHERE id=?").run(e.ids[0]);
 if(mode==='revision')e.database.prepare('UPDATE master_products SET revision=2 WHERE id=?').run(e.ids[0]);
 if(mode==='type')e.database.prepare("UPDATE master_products SET data_json=json_set(data_json,'$.stockType','UNREVIEWED') WHERE id=?").run(e.ids[0]);
 if(mode==='draft'||mode==='diy')e.database.prepare("UPDATE package_quotes SET snapshot_json=json_set(snapshot_json,?,?)").run(mode==='draft'?'$.customer.draft':'$.customer.fulfillment',mode==='draft'?1:'diy');
 assert.ok((await preview(e)).issues.length,mode);assert.equal((await prepare(e,false)).status,422,mode);assert.equal(scalar(e,'SELECT COUNT(*) FROM stock_jobs'),0);e.database.close();}
});
test('stale stock review is rejected atomically and two competing handoffs cannot overbook',async()=>{
 const e=await fixture(),p=await preview(e);await call(e,'jobs','POST',{title:'Other job',location,lines:[{productId:e.ids[0],quantity:3}]});const r=await call(e,`package-quotes/${e.quoteId}/prepare`,'POST',{location,reviewToken:p.reviewToken,confirmed:true,orders:[]});assert.equal(r.status,409);assert.equal(scalar(e,'SELECT COUNT(*) FROM quote_job_handoffs'),0);
 const fresh=await preview(e),payload={location,reviewToken:fresh.reviewToken,confirmed:true,orders:[]};const results=await Promise.all([call(e,`package-quotes/${e.quoteId}/prepare`,'POST',payload),call(e,`package-quotes/${e.quoteId}/prepare`,'POST',payload)]);assert.ok(results.every(r=>r.status===201),JSON.stringify(results));assert.equal(results[0].value.job.id,results[1].value.job.id);assert.equal(scalar(e,'SELECT COUNT(*) FROM quote_job_handoffs'),1);e.database.close();
});
test('handoff checks roles, explicit review, supplier data, quantities and origin',async()=>{
 const e=await fixture(),path=`package-quotes/${e.quoteId}/prepare`,p=await preview(e),base={location,reviewToken:p.reviewToken,confirmed:true,orders:[]};
 for(const roles of [['sales'],['inventory'],['catalog']])assert.equal((await call(e,path,'GET',null,{...admin,roles})).status,403);
 assert.equal((await call(e,path,'POST',base,null)).status,403);assert.equal((await call(e,path,'POST',base,admin,key(),'https://evil.test')).status,403);
 assert.equal((await call(e,path,'POST',{...base,confirmed:false})).status,422);
 for(const entry of [{productId:e.ids[1],quantity:3,supplier:'QA'},{productId:e.ids[1],quantity:2,supplier:''},{productId:e.ids[1],quantity:-1,supplier:'QA'}])assert.equal((await call(e,path,'POST',{...base,orders:[entry]})).status,422);
 const inventorySales={...admin,roles:['inventory','sales']};assert.equal((await prepare(e,true,inventorySales)).status,403);assert.equal((await prepare(e,false,inventorySales)).status,201);assert.equal(scalar(e,'SELECT COUNT(*) FROM purchase_orders'),0);e.database.close();
});
test('handoff permits all-short stock and cancellation without creating false holds',async()=>{
 const e=await fixture();for(const id of e.ids)await call(e,'inventory','POST',{productId:id,location,kind:'COUNT',quantity:0,reason:'QA empty'});const r=await prepare(e);assert.equal(r.status,201,JSON.stringify(r));assert.equal(scalar(e,'SELECT COUNT(*) FROM stock_job_lines'),0);assert.equal(scalar(e,'SELECT SUM(reserved_delta) FROM inventory_movements'),0);
 assert.equal((await call(e,'jobs/'+r.value.job.id,'POST',{action:'CANCEL',revision:1,note:'QA cancelled'})).status,200);assert.equal(scalar(e,"SELECT COUNT(*) FROM purchase_orders WHERE status='DRAFT'"),2);e.database.close();
});

test('a failed purchase draft rolls back the linked job, reservations and command receipt',async()=>{
 const e=await fixture();e.database.exec("CREATE TRIGGER reject_po BEFORE INSERT ON purchase_orders BEGIN SELECT RAISE(ABORT,'QA draft failure'); END;");
 const before=scalar(e,'SELECT COUNT(*) FROM master_audit');assert.equal((await prepare(e)).status,503);
 assert.equal(scalar(e,'SELECT COUNT(*) FROM stock_jobs'),0);assert.equal(scalar(e,'SELECT COUNT(*) FROM quote_job_handoffs'),0);assert.equal(scalar(e,'SELECT COUNT(*) FROM job_requirements'),0);assert.equal(scalar(e,'SELECT SUM(reserved_delta) FROM inventory_movements'),0);assert.equal(scalar(e,'SELECT COUNT(*) FROM master_audit'),before);e.database.close();
});
