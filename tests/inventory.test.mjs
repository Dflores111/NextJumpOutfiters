import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {sqliteAdapter} from '../scripts/local-master.mjs';
import {catalogService} from '../src/catalog/service.js';

const origin='https://example.test',location='Tacoma Showroom',key=()=>randomUUID().replaceAll('-','');
const worker={provider:'google',subject:'test-inventory',email:'inventory@example.test',roles:['inventory']};
async function fixture(){const database=new DatabaseSync(':memory:');database.exec('PRAGMA foreign_keys=ON');for(const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())database.exec(await readFile(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));return {database,DB:sqliteAdapter(database)};}
function product(env,{title='Synthetic rack',sku='RACK-100',stockType='STOCKED',category='Racks',state='DRAFT'}={}){const id=randomUUID();env.database.prepare('INSERT INTO master_products VALUES (?,?,?,?,?,?,?,?,?)').run(id,`fixture:${id}`,title,category,state,1,'base',JSON.stringify({stockType,supplierSku:sku,manufacturerPartNumber:'MPN-123',options:['Double cab','Black'],candidateCostCents:87654,prices:{installed:{cents:125000,currency:'USD',state:'APPROVED'}}}),'2026-10-11');return id;}
async function call(env,path,method='GET',body,identity=worker,headers={}){const r=await catalogService(new Request(origin+path,{method,headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}),env,{staffIdentity:identity});return {status:r.status,value:await r.json()};}
const list=(env,params={})=>call(env,`/api/staff/inventory/items?${new URLSearchParams({location,...params})}`);
const settings=(env,items,field,value,actionKey=key(),identity=worker,at=location)=>call(env,'/api/staff/inventory/settings','PATCH',{location:at,items,field,value},identity,{'Idempotency-Key':actionKey});
const move=(env,productId,kind,quantity,reference='job-1',at=location)=>call(env,'/api/staff/inventory','POST',{productId,location:at,kind,quantity,reference,reason:'Synthetic QA movement'},worker,{'Idempotency-Key':key()});

test('inventory search covers SKU, MPN, variants and literal SQL wildcards; stable pagination reaches all candidates',async()=>{
 const env=await fixture();for(let n=0;n<113;n++)product(env,{title:`Synthetic ${String(n).padStart(3,'0')}`,sku:`SKU-${n}`});product(env,{title:'100% load_kit',sku:'SPECIAL'});
 const first=await list(env),last=await list(env,{page:3});assert.equal(first.status,200);assert.equal(first.value.total,114);assert.equal(first.value.items.length,50);assert.equal(last.value.items.length,14);assert.equal(new Set([...first.value.items,...last.value.items].map(r=>r.id)).size,64);
 assert.equal((await list(env,{q:'SKU-112'})).value.items.length,1);assert.equal((await list(env,{q:'MPN-123'})).value.total,114);assert.equal((await list(env,{q:'Double cab'})).value.total,114);assert.equal((await list(env,{q:'%'})).value.total,1);assert.equal((await list(env,{q:'_kit'})).value.total,1);
 assert.equal((await list(env,{sort:'title',direction:'desc'})).value.items[0].title,'Synthetic 112');assert.equal((await list(env,{page:99})).value.page,3);env.database.close();
});
test('grid distinguishes unknown from counted zero and keeps counts scoped to the selected location',async()=>{
 const env=await fixture(),id=product(env);let row=(await list(env)).value.items[0];assert.equal(row.onhand,null);assert.equal(row.available,null);assert.equal(row.status,'uncounted');
 assert.equal((await move(env,id,'RECEIVE',3)).status,201);row=(await list(env)).value.items[0];assert.equal(row.onhand,null);assert.equal(row.available,null);
 assert.equal((await move(env,id,'COUNT',0)).status,201);row=(await list(env)).value.items[0];assert.equal(row.available,0);assert.equal(row.status,'out');assert.equal((await list(env,{location:'Overland Expo Redmond'})).value.items[0].status,'uncounted');
 assert.equal((await list(env,{view:'low'})).value.total,1);assert.equal((await list(env,{view:'uncounted'})).value.total,0);env.database.close();
});
test('stock views, category/review filters and reorder levels identify the work that needs attention',async()=>{
 const env=await fixture(),id=product(env),unknown=product(env,{stockType:'UNREVIEWED',category:'Lighting',state:'REVIEW'});product(env,{stockType:'SERVICE'});product(env,{stockType:'NON_STOCKED'});
 await move(env,id,'COUNT',5);await move(env,id,'RESERVE',2);await settings(env,[{id,revision:0}],'minLevel',3);
 const result=(await list(env)).value;assert.equal(result.facets.all,4);assert.equal(result.facets.low,1);assert.equal(result.facets.reserved,1);assert.equal(result.facets.classification,1);assert.equal(result.items.find(r=>r.id===id).status,'low');assert.equal(result.items.find(r=>r.stockType==='SERVICE').available,null);
 assert.equal((await list(env,{category:'Lighting',state:'REVIEW'})).value.items[0].id,unknown);assert.equal((await list(env,{sort:'available'})).value.items[0].id,id);env.database.close();
});
test('inventory roles never receive private cost, price or source payloads through the grid or history',async()=>{
 const env=await fixture(),id=product(env);env.database.prepare('INSERT INTO master_audit VALUES (?,?,?,?,?,?)').run(randomUUID(),id,'PRODUCT_REVIEW','Catalog actor',JSON.stringify({price:9999,privateCost:87654}),'2026-10-11');
 await settings(env,[{id,revision:0}],'bin','A-04');const result=await list(env),history=await call(env,`/api/staff/inventory/${id}/history?location=${encodeURIComponent(location)}`);
 for(const value of [result.value,history.value])assert.ok(!/87654|125000|privateCost|data_json|prices|PRODUCT_REVIEW/.test(JSON.stringify(value)));
 assert.equal(history.value.edits.length,1);assert.equal((await call(env,'/api/staff/inventory/items','GET',null,{...worker,roles:['sales']})).status,403);assert.equal((await call(env,'/api/staff/inventory/items','GET',null,null)).status,403);env.database.close();
});
test('cell edits preserve other metadata and product/fitment revisions; exact retry writes once',async()=>{
 const env=await fixture(),id=product(env),actionKey=key();const items=[{id,revision:0}];
 assert.equal((await settings(env,items,'bin','A-04',actionKey)).status,200);assert.equal((await settings(env,items,'bin','A-04',actionKey)).value.reused,true);assert.equal((await settings(env,items,'bin','B-02',actionKey)).status,409);
 assert.equal((await settings(env,[{id,revision:1}],'minLevel',0)).status,200);const row=(await list(env)).value.items[0];assert.equal(row.bin,'A-04');assert.equal(row.minLevel,0);assert.equal(row.revision,2);assert.equal(row.productRevision,1);assert.equal(env.database.prepare('SELECT COUNT(*) n FROM master_audit').get().n,2);
 await settings(env,[{id,revision:2}],'bin',null);assert.equal((await list(env)).value.items[0].minLevel,0);env.database.close();
});
test('bulk edits are atomic: any stale or missing participant saves neither rows nor audit',async()=>{
 const env=await fixture(),a=product(env),b=product(env);await settings(env,[{id:b,revision:0}],'bin','Existing');
 const stale=await settings(env,[{id:a,revision:0},{id:b,revision:0}],'minLevel',8);assert.equal(stale.status,409);assert.equal(env.database.prepare('SELECT COUNT(*) n FROM inventory_settings').get().n,1);assert.equal(env.database.prepare('SELECT COUNT(*) n FROM master_audit').get().n,1);
 assert.equal((await settings(env,[{id:a,revision:0},{id:randomUUID(),revision:0}],'bin','No')).status,409);
 assert.equal((await settings(env,[{id:a,revision:0},{id:b,revision:1}],'minLevel',8)).status,200);const rows=(await list(env)).value.items;assert.ok(rows.every(r=>r.minLevel===8));assert.equal(rows.find(r=>r.id===b).bin,'Existing');env.database.close();
});
test('concurrent edits cannot overwrite and 50-row selection stays within D1 parameter limits',async()=>{
 const env=await fixture(),items=Array.from({length:50},()=>({id:product(env),revision:0}));let maxBinds=0;const original=env.DB.prepare;env.DB.prepare=sql=>{const p=original(sql),bind=p.bind;p.bind=(...values)=>{maxBinds=Math.max(maxBinds,values.length);return bind(...values);};return p;};
 const results=await Promise.all([settings(env,items,'bin','A'),settings(env,items,'bin','B')]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.ok(maxBinds<=100);assert.equal(env.database.prepare('SELECT COUNT(*) n FROM inventory_settings').get().n,50);assert.equal(env.database.prepare('SELECT COUNT(*) n FROM master_audit').get().n,1);env.database.close();
});
test('settings validate values, unique selection, CSRF, role and actor-bound retry keys',async()=>{
 const env=await fixture(),id=product(env),items=[{id,revision:0}],actionKey=key();
 for(const value of [-1,1.5,'5',1000001])assert.equal((await settings(env,items,'minLevel',value)).status,422);
 assert.equal((await settings(env,[...items,...items],'bin','A')).status,422);assert.equal((await settings(env,items,'stockType','STOCKED')).status,422);assert.equal((await settings(env,items,'bin','A',key(),{...worker,roles:['catalog']})).status,403);
 assert.equal((await call(env,'/api/staff/inventory/settings','PATCH',{location,items,field:'bin',value:'A'},worker,{Origin:'https://other.test','Idempotency-Key':key()})).status,403);
 await settings(env,items,'bin','A',actionKey);assert.equal((await settings(env,items,'bin','A',actionKey,{...worker,subject:'different'})).status,409);env.database.close();
});
test('item activity shows relevant changes only at the selected location',async()=>{
 const env=await fixture(),a=product(env),b=product(env);await move(env,a,'COUNT',3);await move(env,a,'COUNT',7,'job-2','Overland Expo Redmond');await settings(env,[{id:a,revision:0},{id:b,revision:0}],'bin','A');await settings(env,[{id:a,revision:0}],'bin','Expo',key(),worker,'Overland Expo Redmond');
 const h=(await call(env,`/api/staff/inventory/${a}/history?location=${encodeURIComponent(location)}`)).value;assert.equal(h.movements.length,1);assert.equal(h.movements[0].onhand_delta,3);assert.equal(h.edits.length,1);assert.equal(h.edits[0].value,'A');assert.ok(!JSON.stringify(h).includes('Expo'));env.database.close();
});
test('quick product edits preserve approval, prices and mapping; held stock still blocks reclassification',async()=>{
 const env=await fixture(),id=product(env,{state:'APPROVED'}),admin={...worker,roles:['admin']},payload={revision:1,title:'Renamed rack',category:'Racks',supplierSku:'NEW-SKU',stockType:'STOCKED',reason:'Synthetic detail change'};
 assert.equal((await call(env,`/api/staff/products/${id}/quick`,'PATCH',payload)).status,403);assert.equal((await call(env,`/api/staff/products/${id}/quick`,'PATCH',{...payload,price:{cents:1}},admin)).status,422);
 assert.equal((await call(env,`/api/staff/products/${id}/quick`,'PATCH',payload,admin)).status,200);let row=env.database.prepare('SELECT * FROM master_products WHERE id=?').get(id);assert.equal(row.planning_slot,'base');assert.equal(row.state,'APPROVED');assert.equal(JSON.parse(row.data_json).prices.installed.cents,125000);assert.equal(row.revision,2);
 await move(env,id,'COUNT',2);await move(env,id,'RESERVE',1);assert.equal((await call(env,`/api/staff/products/${id}/quick`,'PATCH',{revision:2,stockType:'SERVICE',reason:'Synthetic'},admin)).status,409);env.database.close();
});

test('attention stock links replace remembered filters and reject unsupported locations or views',async()=>{
 const {stockViewFromLink}=await import('../src/catalog/inventory-route.js');
 const base={q:'old search',category:'Lighting',state:'DRAFT',view:'all',location:'Tacoma Showroom',page:8};
 const linked=stockViewFromLink(base,'?tab=inventory&area=stock&view=uncounted&location=Tacoma+Showroom&q=&category=&state=');
 assert.equal(linked.view,'uncounted');assert.equal(linked.q,'');assert.equal(linked.category,'');assert.equal(linked.state,'');assert.equal(linked.page,1);
 assert.equal(stockViewFromLink(base,'?view=invalid&location=unrecognized').location,base.location);assert.equal(stockViewFromLink(base,'?view=invalid').view,'all');
});
