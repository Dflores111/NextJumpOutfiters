import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import initSqlJs from 'sql.js';
import {createDemoEngine,browserSqliteAdapter} from '../src/catalog/demo-core.js';
import {createWorkspaceApi} from '../src/catalog/workspace-api.js';
import {catalogService} from '../src/catalog/service.js';

const SQL=await initSqlJs();
const schema=(await Promise.all((await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort().map(f=>readFile(new URL('../drizzle/'+f,import.meta.url),'utf8')))).join('\n');
const location='Tacoma Showroom',key=()=>crypto.randomUUID().replaceAll('-','');
async function call(engine,path,method='GET',body,command=key()){const response=await engine.request(path,method,body,command);return {status:response.status,value:await response.json()};}
const stock=async engine=>(await call(engine,`barcodes?${new URLSearchParams({code:'001234567890',location})}`)).value.item;
const list=async(engine,path)=>(await call(engine,path+'?location='+encodeURIComponent(location))).value;

test('open demo starts with synthetic inventory, barcode, purchasing and job reservations',async t=>{
 const engine=await createDemoEngine(SQL,schema);t.after(()=>engine.close());
 const session=(await call(engine,'session')).value;assert.equal(session.identity.provider,'demo');assert.ok(session.permissions.includes('inventory'));
 const items=await list(engine,'inventory/items');assert.equal(items.total,7);assert.ok(items.items.every(item=>item.title.startsWith('DEMO ')));
 const light=await stock(engine);assert.equal(light.onhand,15);assert.equal(light.reserved,2);assert.equal(light.available,13);
 assert.equal((await list(engine,'purchases')).records.length,3);assert.equal((await list(engine,'jobs')).records.length,2);
});

test('demo receiving updates stock once and survives a browser-style export / restore',async t=>{
 const engine=await createDemoEngine(SQL,schema);t.after(()=>engine.close());
 const order=(await list(engine,'purchases')).records.find(row=>row.status==='PARTIAL');
 const detail=(await call(engine,'purchases/'+order.id)).value;
 const light=await stock(engine),command=key(),input={revision:detail.record.revision,reference:'DEMO test delivery',lines:[{productId:light.id,quantity:2}]};
 assert.equal((await call(engine,`purchases/${order.id}/receive`,'POST',input,command)).status,200);
 assert.equal((await call(engine,`purchases/${order.id}/receive`,'POST',input,command)).value.reused,true);
 assert.equal((await stock(engine)).onhand,17);
 const restored=await createDemoEngine(SQL,schema,engine.export());t.after(()=>restored.close());assert.equal((await stock(restored)).onhand,17);
 assert.equal((await call(engine,`purchases/${order.id}/receive`,'POST',{...input,revision:4,lines:[{productId:light.id,quantity:100}]})).status,409);assert.equal((await stock(engine)).onhand,17);
});

test('completing a demo job deducts actual use, releases holds, and keeps other visitors separate',async t=>{
 const engine=await createDemoEngine(SQL,schema),other=await createDemoEngine(SQL,schema);t.after(()=>{engine.close();other.close();});
 const job=(await list(engine,'jobs')).records.find(row=>row.title.includes('Tacoma'));
 const detail=(await call(engine,'jobs/'+job.id)).value,command=key();
 const input={action:'COMPLETE',revision:detail.record.revision,lines:detail.lines.map(line=>({productId:line.productId,quantity:1}))};
 assert.equal((await call(engine,'jobs/'+job.id,'POST',input,command)).status,200);assert.equal((await call(engine,'jobs/'+job.id,'POST',input,command)).value.reused,true);
 const light=await stock(engine);assert.equal(light.onhand,14);assert.equal(light.reserved,0);assert.equal(light.available,14);
 assert.equal((await stock(other)).onhand,15);assert.equal((await stock(other)).reserved,2);
 assert.equal((await call(engine,'jobs/'+job.id,'POST',input)).status,409);assert.equal((await stock(engine)).onhand,14);
});

test('SQLite demo adapter rolls back failed batches and retains foreign keys after export',async t=>{
 const database=new SQL.Database();t.after(()=>database.close());database.run('PRAGMA foreign_keys=ON');database.run(schema);const DB=browserSqliteAdapter(database);
 await assert.rejects(DB.batch([DB.prepare("INSERT INTO inventory_settings VALUES ('missing','Tacoma Showroom',NULL,NULL,1,'now')")]));
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM inventory_settings').first()).n,0);
 let engineDatabase;const inspectable={Database:class extends SQL.Database{constructor(...args){super(...args);engineDatabase=this;}}};
 const engine=await createDemoEngine(inspectable,schema);t.after(()=>engine.close());const image=engine.export(),restored=new SQL.Database(image);t.after(()=>restored.close());
 assert.equal(engineDatabase.exec('PRAGMA foreign_keys')[0].values[0][0],1);
 await assert.rejects(browserSqliteAdapter(engineDatabase).batch([browserSqliteAdapter(engineDatabase).prepare("INSERT INTO inventory_settings VALUES ('missing','Tacoma Showroom',NULL,NULL,1,'now')")]));
 assert.equal(restored.exec('SELECT COUNT(*) FROM master_products')[0].values[0][0],7);
});

test('demo transport never calls the hosted API, and staff failures never fall back to demo access',async()=>{
 let remote=0,demo=0;const api=createWorkspaceApi({demo:true,fetchImpl:()=>{remote++;throw Error('Remote access forbidden');},loadDemo:async()=>({requestDemo:async()=>{demo++;return {sample:true};}})});
 assert.deepEqual(await api('inventory/items'),{sample:true});assert.equal(demo,1);assert.equal(remote,0);
 const broken=createWorkspaceApi({demo:true,fetchImpl:()=>{remote++;},loadDemo:async()=>{throw Error('Demo unavailable');}});await assert.rejects(broken('jobs'),/Demo unavailable/);assert.equal(remote,0);
 const staff=createWorkspaceApi({fetchImpl:async()=>new Response(JSON.stringify({error:'Staff access required'}),{status:403}),loadDemo:async()=>{demo++;}});await assert.rejects(staff('session'),/Staff access required/);assert.equal(demo,1);
 const response=await catalogService(new Request('https://example.test/api/staff/session'),{DB:{}},{});assert.equal(response.status,403);
});
