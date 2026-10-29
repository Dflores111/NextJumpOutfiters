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
 const items=await list(engine,'inventory/items');assert.equal(items.total,10);assert.ok(items.items.every(item=>item.title.startsWith('DEMO ')));
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
 assert.equal(restored.exec('SELECT COUNT(*) FROM master_products')[0].values[0][0],10);
});

test('demo transport never calls the hosted API, and staff failures never fall back to demo access',async()=>{
 let remote=0,demo=0;const api=createWorkspaceApi({demo:true,fetchImpl:()=>{remote++;throw Error('Remote access forbidden');},loadDemo:async()=>({requestDemo:async()=>{demo++;return {sample:true};}})});
 assert.deepEqual(await api('inventory/items'),{sample:true});assert.equal(demo,1);assert.equal(remote,0);
 const broken=createWorkspaceApi({demo:true,fetchImpl:()=>{remote++;},loadDemo:async()=>{throw Error('Demo unavailable');}});await assert.rejects(broken('jobs'),/Demo unavailable/);assert.equal(remote,0);
 const staff=createWorkspaceApi({fetchImpl:async()=>new Response(JSON.stringify({error:'Staff access required'}),{status:403}),loadDemo:async()=>{demo++;}});await assert.rejects(staff('session'),/Staff access required/);assert.equal(demo,1);
 const response=await catalogService(new Request('https://example.test/api/staff/session'),{DB:{}},{});assert.equal(response.status,403);
});

test('demo quote prepares a job and shortage order without changing its saved estimate',async t=>{
 const engine=await createDemoEngine(SQL,schema);t.after(()=>engine.close());
 const quote=(await call(engine,'package-quotes')).value.quotes[0];assert.equal(quote.customer.number,'NJO-DEMO-PREP');
 const path=`package-quotes/${quote.id}/prepare`,plan=(await call(engine,path)).value;
 assert.deepEqual(plan.issues,[]);assert.equal(plan.lines.reduce((n,l)=>n+l.shortage,0),1);
 const payload={location,reviewToken:plan.reviewToken,confirmed:true,orders:plan.lines.filter(l=>l.shortage).map(l=>({productId:l.productId,quantity:l.shortage,supplier:l.supplier}))};
 const result=await call(engine,path,'POST',payload);assert.equal(result.status,201,JSON.stringify(result));assert.equal(result.value.purchases.length,1);
 const restored=await createDemoEngine(SQL,schema,engine.export());t.after(()=>restored.close());
 assert.equal((await call(restored,path)).value.existing.job.id,result.value.job.id);assert.equal((await call(restored,'package-quotes')).value.quotes.length,1);
 assert.deepEqual((await call(restored,'package-quotes/'+quote.id)).value.customer,quote.customer);
});

test('older demo sessions gain the handoff tables without losing edited stock',async t=>{
 const engine=await createDemoEngine(SQL,schema);t.after(()=>engine.close());
 const light=await stock(engine);await call(engine,'inventory','POST',{productId:light.id,location,kind:'COUNT',quantity:19,reason:'Demo saved count'});
 const legacy=new SQL.Database(engine.export());legacy.run('PRAGMA foreign_keys=OFF');
 legacy.run('DROP TABLE quote_job_handoffs; DROP TABLE package_releases; DROP TABLE job_purchase_orders; DROP TABLE job_requirements; DELETE FROM package_quotes; DELETE FROM curated_packages;');
 const restored=await createDemoEngine(SQL,schema,legacy.export());legacy.close();t.after(()=>restored.close());
 assert.equal((await stock(restored)).onhand,19);const quote=(await call(restored,'package-quotes')).value.quotes[0];
 assert.equal((await call(restored,`package-quotes/${quote.id}/prepare`)).status,200);
});

test('attention links cover job shortages and dated deliveries, then clear when resolved',async t=>{
 const engine=await createDemoEngine(SQL,schema);t.after(()=>engine.close());
 const quotes=(await call(engine,'package-quotes')).value.quotes,q=quotes.find(q=>q.customer.number==='NJO-DEMO-PREP');
 const plan=(await call(engine,`package-quotes/${q.id}/prepare?${new URLSearchParams({location})}`)).value;
 const prepared=await call(engine,`package-quotes/${q.id}/prepare`,'POST',{location,reviewToken:plan.reviewToken,confirmed:true,orders:[]});assert.equal(prepared.status,201,JSON.stringify(prepared));
 let items=(await call(engine,'attention?'+new URLSearchParams({location}))).value.items;assert.ok(items.some(i=>i.kind==='jobs'&&i.target.record===prepared.value.job.id));
 const part=await stock(engine),order=(await call(engine,'purchases','POST',{location,supplier:'DEMO dated delivery',expectedOn:'2026-11-03',notes:'Synthetic test only',lines:[{productId:part.id,quantity:1,unitCostCents:100}]})).value;
 const ordered=await call(engine,'purchases/'+order.id,'POST',{action:'ORDER',revision:1});assert.equal(ordered.status,200,JSON.stringify(ordered));
 items=(await call(engine,'attention?'+new URLSearchParams({location}))).value.items;assert.ok(items.some(i=>i.target.record===order.id&&i.detail.includes('2026-11-03')));
 const detail=(await call(engine,'purchases/'+order.id)).value;await call(engine,'purchases/'+order.id+'/receive','POST',{revision:detail.record.revision,reference:'DEMO complete delivery',lines:[{productId:part.id,quantity:1}]});
 items=(await call(engine,'attention?'+new URLSearchParams({location}))).value.items;assert.ok(!items.some(i=>i.target.record===order.id));
 const job=(await call(engine,'jobs/'+prepared.value.job.id)).value;await call(engine,'jobs/'+job.record.id,'POST',{action:'CANCEL',revision:job.record.revision,note:'Synthetic cancellation to verify attention clears'});
 items=(await call(engine,'attention?'+new URLSearchParams({location}))).value.items;assert.ok(!items.some(i=>i.target.record===job.record.id));
});
test('an older browser demo gains saved versions without losing existing stock edits',async t=>{
 const oldSchema=(await Promise.all((await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')&&!f.startsWith('0009_')).sort().map(f=>readFile(new URL('../drizzle/'+f,import.meta.url),'utf8')))).join('\n');
 const old=await createDemoEngine(SQL,oldSchema);t.after(()=>old.close());
 const part=await stock(old);await call(old,'inventory','POST',{productId:part.id,location,kind:'RECEIVE',quantity:3,reason:'Synthetic existing stock edit'});
 const updated=await createDemoEngine(SQL,schema,old.export());t.after(()=>updated.close());assert.equal((await stock(updated)).onhand,part.onhand+3);
 const pack=(await call(updated,'packages')).value.packages.find(p=>p.data.useLevel==='weekender'&&p.published),history=await call(updated,'packages/'+pack.id+'/history');assert.equal(history.status,200);assert.ok(history.value.versions.length>0);assert.equal(history.value.publishedRevision,pack.published.revision);
});
