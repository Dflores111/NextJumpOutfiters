import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {sqliteAdapter} from '../scripts/local-master.mjs';
import {catalogService} from '../src/catalog/service.js';
import {packageTotals,releaseProblems,quoteDocument} from '../src/catalog/package-domain.js';
import {packageInquirySummary} from '../src/catalog/package-client.js';

const origin='https://example.test',key=()=>randomUUID().replaceAll('-','');
const admin={provider:'microsoft',subject:'test-admin',email:'admin@example.test',roles:['admin']};
const inventory={...admin,subject:'test-stock',roles:['inventory']},sales={...admin,subject:'test-sales',roles:['sales']};
async function fixture(){const database=new DatabaseSync(':memory:');database.exec('PRAGMA foreign_keys=ON');for(const file of (await readdir(new URL('../drizzle/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())database.exec(await readFile(new URL('../drizzle/'+file,import.meta.url),'utf8'));return {database,DB:sqliteAdapter(database)};}
async function call(env,path,method='GET',body,identity=admin,headers={}){const r=await catalogService(new Request(origin+path,{method,headers:{Origin:origin,'Idempotency-Key':key(),...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}),env,{staffIdentity:identity});return {status:r.status,value:await r.json()};}
const count=(env,table)=>env.database.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n;
function sources(){return {format:'NJO_PACKAGE_WORKSHOP_V1',sourceId:'a'.repeat(64),products:[{sourceKey:'fixture:shock',title:'Synthetic shock',category:'Suspension',data:{source:'Synthetic workbook',supplier:'Test distributor',supplierSku:'SYN-123',candidateCostCents:7,candidateRetailCents:10000,stockType:'STOCKED',prices:{installed:{state:'APPROVED',cents:1}},tags:[]}}],packages:[],standards:[]};}
function definition(){return {sourceKey:'fixture:package',title:'Synthetic Weekender',category:'Suspension',data:{audience:'Weekend driving',description:'Synthetic package for testing only',vehicle:{make:'Toyota',model:'Tacoma',yearFrom:2016,yearTo:2023},lines:[{sourceKey:'fixture:shock',role:'Rear shocks',quantity:2,unitRetailCents:10000}],labor:{hours:1.5,rateCents:12000,alignmentCents:5000},issues:[{id:'confirm-source',message:'Confirm synthetic specification',resolved:true}],source:{file:'Synthetic.xlsx',sheet:'Test',row:2},sourceTotalCents:43000,fitmentNotes:'',installNotes:'Synthetic install note',excludes:['Tax','Freight'],diyAllowed:false,approvals:{parts:true,pricing:true,fitment:true},reviewEvidence:'Untrusted imported approval'}};}
async function seed(env){let r=await call(env,'/api/staff/package-imports','POST',sources());assert.equal(r.status,200,JSON.stringify(r));const bundle={...sources(),products:[],packages:[definition()],standards:[{sourceKey:'fixture:standard',title:'Synthetic standard',category:'Electrical',data:{source:{file:'Test.xlsx',sheet:'Medium',row:4},bom:'Synthetic reference'}}]};r=await call(env,'/api/staff/package-imports','POST',bundle);assert.equal(r.status,200,JSON.stringify(r));return (await call(env,'/api/staff/packages')).value.packages[0];}
function ready(p){return {revision:p.revision,title:p.title,category:p.category,state:'PUBLISHED',data:{...p.data,fitmentNotes:'Synthetic verified configuration and exclusions',reviewEvidence:'Synthetic human review',issues:p.data.issues.map(i=>({...i,resolved:true})),approvals:{parts:true,pricing:true,fitment:true}}};}
async function publish(env,p){const r=await call(env,'/api/staff/packages/'+p.id,'PATCH',ready(p));assert.equal(r.status,200,JSON.stringify(r));return r.value;}
const intake={year:2020,suspension:'stock',use:'daily'};
const quote=(env,p,access=key(),action=key(),extra={})=>call(env,'/api/package-quotes','POST',{packageId:p.id,revision:p.revision,fulfillment:'installed',intake,...extra},null,{'X-Build-Access':access,'Idempotency-Key':action});

test('package math preserves unknown quantities and explicit zero alignment; minutes calculate deterministically',()=>{
 const d=definition().data;assert.equal(packageTotals(d).totalCents,43000);assert.equal(packageTotals({...d,labor:{...d.labor,alignmentCents:0}}).totalCents,38000);assert.equal(packageTotals({...d,labor:{...d.labor,alignmentCents:null}}).totalCents,null);assert.equal(packageTotals({...d,lines:[{...d.lines[0],quantity:null}]}).partsCents,null);assert.equal(packageTotals(d,'diy').totalCents,20000);
 assert.ok(releaseProblems({...d,diyAllowed:true,lines:[{...d.lines[0],installOnly:true}]}).some(v=>v.includes('Install-Only')));
});
test('private source import creates drafts only, preserves unknowns and never fabricates stock or public prices',async()=>{
 const env=await fixture(),p=await seed(env);assert.equal(p.state,'DRAFT');assert.deepEqual(p.data.approvals,{parts:false,pricing:false,fitment:false});assert.equal(p.data.issues[0].resolved,false);
 const product=JSON.parse(env.database.prepare('SELECT data_json FROM master_products').get().data_json);assert.equal(product.stockType,'UNREVIEWED');assert.deepEqual(product.prices,{});assert.equal(count(env,'inventory_movements'),0);assert.deepEqual((await call(env,'/api/packages','GET',null,null)).value,{packages:[]});assert.equal(count(env,'build_standards'),1);env.database.close();
});
test('imports are idempotent and repeat source loads preserve staff edits; SQL failures roll back the complete batch',async()=>{
 const env=await fixture(),input=sources(),action=key();const a=await call(env,'/api/staff/package-imports','POST',input,admin,{'Idempotency-Key':action});assert.equal(a.status,200);assert.equal((await call(env,'/api/staff/package-imports','POST',input,admin,{'Idempotency-Key':action})).status,200);assert.equal(count(env,'master_audit'),1);
 env.database.prepare("UPDATE master_products SET title='Staff correction',state='APPROVED'").run();await call(env,'/api/staff/package-imports','POST',input);assert.equal(count(env,'master_products'),1);assert.equal(env.database.prepare('SELECT title FROM master_products').get().title,'Staff correction');
 env.database.exec("CREATE TRIGGER reject_fixture BEFORE INSERT ON master_products WHEN NEW.title='Reject me' BEGIN SELECT RAISE(ABORT,'fixture failure'); END");const before=count(env,'master_audit'),batch={...sources(),products:[{...input.products[0],sourceKey:'fixture:new',title:'Would be rolled back'},{...input.products[0],sourceKey:'fixture:reject',title:'Reject me'}]};assert.equal((await call(env,'/api/staff/package-imports','POST',batch)).status,503);assert.equal(count(env,'master_products'),1);assert.equal(count(env,'master_audit'),before);env.database.close();
});
test('package publishing requires complete quantities, alignment, source decisions and human evidence',async()=>{
 const env=await fixture(),p=await seed(env),path='/api/staff/packages/'+p.id;
 assert.equal((await call(env,path,'PATCH',{...ready(p),data:{...ready(p).data,lines:[{...p.data.lines[0],quantity:null}]}})).status,422);
 assert.equal((await call(env,path,'PATCH',{...ready(p),data:{...ready(p).data,labor:{...p.data.labor,alignmentCents:null}}})).status,422);
 assert.equal((await call(env,path,'PATCH',{...ready(p),data:{...ready(p).data,issues:[]}})).status,422);
 assert.equal((await call(env,path,'PATCH',{...ready(p),data:{...ready(p).data,reviewEvidence:''}})).status,422);
 assert.equal((await call(env,path,'PATCH',ready(p),inventory)).status,403);assert.equal(count(env,'package_quotes'),0);env.database.close();
});
test('publishing exposes a public allowlist and changed part revisions immediately withdraw the estimate',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env));const menu=await call(env,'/api/packages','GET',null,null);assert.equal(menu.value.packages.length,1);const serialized=JSON.stringify(menu.value);for(const privateKey of ['candidateCost','supplierSku','Synthetic.xlsx','reviewEvidence','reviewedBy','sourceTotal'])assert.ok(!serialized.includes(privateKey),privateKey);
 const product=p.data.lines[0].productId;env.database.prepare('UPDATE master_products SET revision=revision+1 WHERE id=?').run(product);assert.equal((await call(env,'/api/packages','GET',null,null)).value.packages.length,0);assert.equal((await quote(env,p)).status,409);env.database.close();
});
test('package saves reject competing revisions and exact retry does not publish a second revision',async()=>{
 const env=await fixture(),p=await seed(env),input=ready(p),action=key(),path='/api/staff/packages/'+p.id;const results=await Promise.all([call(env,path,'PATCH',input,admin,{'Idempotency-Key':action}),call(env,path,'PATCH',input,admin,{'Idempotency-Key':action})]);assert.ok(results.every(r=>r.status===200),JSON.stringify(results));assert.equal((await call(env,'/api/staff/packages')).value.packages[0].revision,2);
 assert.equal((await call(env,path,'PATCH',input)).status,409);assert.equal((await call(env,path,'PATCH',{...input,title:'Different'},admin,{'Idempotency-Key':action})).status,409);env.database.close();
});
test('quote saves calculate on the server, stay immutable, require reopen capability and create no order or reservation',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env)),access=key(),action=key();const result=await quote(env,p,access,action,{totalCents:1,email:'private@example.test',intake:{...intake,notes:'Private free text'}});assert.equal(result.status,201,JSON.stringify(result));assert.equal(result.value.customer.totals.totalCents,43000);assert.equal(result.value.shop,undefined);
 const id=result.value.id;assert.equal((await call(env,'/api/package-quotes/'+id,'GET',null,null)).status,401);assert.equal((await call(env,'/api/package-quotes/'+id,'GET',null,null,{'X-Build-Access':key()})).status,404);
 assert.equal((await quote(env,p,access,action)).value.id,id);assert.equal(count(env,'package_quotes'),1);assert.equal((await quote(env,p,access,action,{intake:{...intake,use:'trips'}})).status,409);
 const changed=ready(p);changed.data.lines[0].unitRetailCents=99000;assert.equal((await call(env,'/api/staff/packages/'+p.id,'PATCH',changed)).status,200);
 const reopened=await call(env,'/api/package-quotes/'+id,'GET',null,null,{'X-Build-Access':access});assert.equal(reopened.value.customer.totals.totalCents,43000);
 const stored=env.database.prepare('SELECT * FROM package_quotes').get();assert.ok(!JSON.stringify(stored).includes('private@example.test'));assert.ok(!JSON.stringify(stored).includes('Private free text'));assert.notEqual(stored.access_hash,access);assert.equal(count(env,'inventory_movements'),0);assert.equal(count(env,'stock_jobs'),0);assert.equal(count(env,'purchase_orders'),0);
 const staff=await call(env,'/api/staff/package-quotes/'+id,'GET',null,sales);assert.equal(staff.status,200);assert.equal(staff.value.shop.lines[0].supplierSku,'SYN-123');assert.equal(staff.value.shop.lines[0].quantity,reopened.value.customer.lines[0].quantity);assert.equal(staff.value.shop.lines[0].available,null);env.database.close();
});
test('concurrent quote retries create exactly one snapshot; wrong years, DIY and cross-origin writes fail',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env)),access=key(),action=key(),results=await Promise.all([quote(env,p,access,action),quote(env,p,access,action)]);assert.ok(results.every(r=>r.status===201),JSON.stringify(results));assert.equal(new Set(results.map(r=>r.value.id)).size,1);assert.equal(count(env,'package_quotes'),1);
 assert.equal((await quote(env,p,key(),key(),{intake:{...intake,year:2015}})).status,422);assert.equal((await quote(env,p,key(),key(),{fulfillment:'diy'})).status,422);
 assert.equal((await call(env,'/api/package-quotes','POST',{packageId:p.id,revision:p.revision,fulfillment:'installed',intake},null,{Origin:'https://evil.test','X-Build-Access':key()})).status,403);env.database.close();
});
test('staff draft previews are ephemeral and protected; source drafts cannot be saved as customer quotes',async()=>{
 const env=await fixture(),p=await seed(env),input={packageId:p.id,revision:p.revision,fulfillment:'installed',intake};const audits=count(env,'master_audit');assert.equal((await call(env,'/api/staff/package-preview','POST',input,null)).status,403);const r=await call(env,'/api/staff/package-preview','POST',input);assert.equal(r.status,200);assert.equal(r.value.customer.draft,true);assert.equal(r.value.id,null);assert.equal(count(env,'package_quotes'),0);assert.equal(count(env,'master_audit'),audits);assert.equal((await quote(env,p)).status,409);env.database.close();
});
test('supplier reports distinguish unknown from zero and never become warehouse inventory',async()=>{
 const env=await fixture(),p=await seed(env),id=p.data.lines[0].productId,path='/api/staff/supply/'+id;assert.equal((await call(env,path,'GET',null,inventory)).value.supply.quantity,null);
 const input={revision:0,supplier:'Test distributor',supplierSku:'SYN-123',fulfillment:'DROP_SHIP',quantity:0,leadTimeDays:4,checkedAt:'2026-01-01T12:00:00Z',reference:'Synthetic supplier check'},action=key();assert.equal((await call(env,path,'PATCH',{...input,reference:''})).status,422);assert.equal((await call(env,path,'PATCH',input,inventory)).status,403);
 assert.equal((await call(env,path,'PATCH',input,admin,{'Idempotency-Key':action})).status,200);assert.equal((await call(env,path,'PATCH',input,admin,{'Idempotency-Key':action})).status,200);const read=await call(env,path,'GET',null,inventory);assert.equal(read.value.supply.quantity,0);assert.equal(read.value.connected,false);assert.equal(read.value.supply.kind,'manual');assert.equal(count(env,'inventory_movements'),0);assert.equal((await call(env,path,'PATCH',input)).status,409);env.database.close();
});
test('source SKU search is literal and Install-Only tags prevent parts-only publication',async()=>{
 const env=await fixture(),p=await seed(env),id=p.data.lines[0].productId;assert.equal((await call(env,'/api/staff/products?q=SYN-123')).value.products.length,1);assert.equal((await call(env,'/api/staff/products?q=%25')).value.products.length,0);
 assert.equal((await call(env,'/api/staff/products/'+id,'PATCH',{revision:1,state:'DRAFT',stockType:'UNREVIEWED',planningSlot:'',tags:['Install-Only'],reason:'Synthetic sales rule'})).status,200);const input=ready(p);input.data.diyAllowed=true;assert.equal((await call(env,'/api/staff/packages/'+p.id,'PATCH',input)).status,422);env.database.close();
});
test('download projections escape text and inquiry handoff carries the saved reference without credentials',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env)),r=await quote(env,p),record=(await call(env,'/api/staff/package-quotes/'+r.value.id)).value;
 record.customer.title='<script>alert(1)</script>';const customer=quoteDocument(record),shop=quoteDocument(record,'shop');assert.ok(customer.includes('&lt;script&gt;'));assert.ok(!customer.includes('<script>'));assert.ok(!customer.includes('SYN-123'));assert.ok(shop.includes('SYN-123'));assert.ok(!shop.includes('candidateCost'));
 const summary=packageInquirySummary(record);assert.ok(summary.includes(record.customer.number));assert.ok(!summary.includes('access'));assert.equal(packageInquirySummary({...record,customer:{...record.customer,draft:true}}),'');env.database.close();
});
