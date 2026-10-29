import {packageStatusLabel,packageIsShown} from '../src/catalog/package-workflow.js';
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

test('approved price and replacement-part edits reach the public menu and new quotes, while old quotes and other options stay fixed',async()=>{
 const env=await fixture();try{
  let p=await seed(env);const full={id:'front-rear',label:'Front & rear',enabled:true,lines:p.data.lines,labor:p.data.labor},front={id:'front-only',label:'Front only',enabled:true,lines:p.data.lines.map(l=>({...l,quantity:1})),labor:{...p.data.labor,hours:1}};
  p={...p,data:{...p.data,useLevel:'weekender',variants:[front,full],defaultVariantId:'front-rear'}};p=await publish(env,p);
  const baseline=(await quote(env,p)).value,readMenu=async()=>(await call(env,'/api/packages','GET',null,null)).value.packages;
  assert.equal(baseline.customer.totals.totalCents,43000);
  const path='/api/staff/packages/'+p.id,input=ready(p);input.state='DRAFT';input.data=structuredClone(input.data);input.data.variants[1].lines[0].unitRetailCents=15000;
  let result=await call(env,path,'PATCH',input);assert.equal(result.status,200,JSON.stringify(result));p=result.value;
  assert.equal((await readMenu())[0].totals.totalCents,43000);p=await publish(env,p);
  let menu=await readMenu();assert.equal(menu[0].totals.totalCents,53000);assert.equal(menu[0].variants.find(v=>v.id==='front-only').totals.totalCents,27000);
  assert.equal((await quote(env,p)).value.customer.totals.totalCents,53000);
  const imported={...sources(),sourceId:'b'.repeat(64),products:[{sourceKey:'fixture:replacement',title:'Synthetic replacement shock',category:'Suspension',data:{supplier:'Test supplier',supplierSku:'SYN-456',stockType:'STOCKED'}}]};
  assert.equal((await call(env,'/api/staff/package-imports','POST',imported)).status,200);
  const product=(await call(env,'/api/staff/products?q=SYN-456')).value.products[0],replacement=ready(p);replacement.state='DRAFT';replacement.data=structuredClone(replacement.data);
  replacement.data.variants[1].lines=[{productId:product.id,role:'Rear shocks',quantity:null,unitRetailCents:null}];
  result=await call(env,path,'PATCH',replacement);assert.equal(result.status,200,JSON.stringify(result));p=result.value;
  assert.equal((await call(env,path,'PATCH',ready(p))).status,422);assert.equal((await readMenu())[0].totals.totalCents,53000);
  const completed=ready(p);completed.state='DRAFT';completed.data=structuredClone(completed.data);completed.data.variants[1].lines[0]={...completed.data.variants[1].lines[0],quantity:2,unitRetailCents:17500};
  result=await call(env,path,'PATCH',completed);assert.equal(result.status,200,JSON.stringify(result));p=await publish(env,result.value);
  menu=await readMenu();assert.equal(menu[0].totals.totalCents,58000);assert.equal(menu[0].lines[0].title,'Synthetic replacement shock');assert.equal(menu[0].variants.find(v=>v.id==='front-only').totals.totalCents,27000);
  const current=(await quote(env,p)).value;assert.equal(current.customer.lines[0].title,'Synthetic replacement shock');assert.equal(current.customer.lines[0].quantity,2);assert.equal(current.customer.totals.totalCents,58000);
  assert.equal(current.customer.lines[0].supplierSku,undefined);assert.equal(current.customer.lines[0].unitCostCents,undefined);
  const previous=(await call(env,'/api/staff/package-quotes/'+baseline.id)).value;assert.equal(previous.customer.totals.totalCents,43000);assert.equal(previous.customer.lines[0].title,'Synthetic shock');
  const copied=(await call(env,path+'/duplicate','POST',{revision:p.revision,useLevel:'overlander-light'})).value;
  assert.equal(copied.state,'DRAFT');assert.ok(Object.values(copied.data.approvals).every(v=>!v));assert.equal((await readMenu()).length,1);
  for(const table of ['inventory_movements','stock_jobs','purchase_orders'])assert.equal(count(env,table),0);
 }finally{env.database.close();}
});

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

test('duplicate creates an audited private copy, keeps shared parts, and resets every inherited approval',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env)),path='/api/staff/packages/'+p.id+'/duplicate',input={revision:p.revision,useLevel:'overlander-light'},action=key();
 assert.equal((await call(env,path,'POST',input,null)).status,403);assert.equal((await call(env,path,'POST',input,inventory)).status,403);
 assert.equal((await call(env,path,'POST',{...input,revision:1})).status,409);
 const r=await call(env,path,'POST',input,admin,{'Idempotency-Key':action});assert.equal(r.status,201,JSON.stringify(r));const c=r.value;
 assert.notEqual(c.id,p.id);assert.equal(c.state,'DRAFT');assert.equal(c.data.useLevel,'overlander-light');assert.equal(c.data.lines[0].productId,p.data.lines[0].productId);assert.deepEqual(c.data.vehicle,p.data.vehicle);assert.equal(c.data.clonedFrom.revision,p.revision);assert.ok(Object.values(c.data.cloneReview).every(v=>v===false));assert.ok(Object.values(c.data.approvals).every(v=>v===false));assert.equal(c.data.reviewEvidence,'');assert.equal(c.data.issues[0].resolved,false);
 assert.equal((await call(env,path,'POST',input,admin,{'Idempotency-Key':action})).value.id,c.id);assert.equal(count(env,'curated_packages'),2);assert.equal(count(env,'master_products'),1);
 const bypass=ready(c);delete bypass.data.clonedFrom;delete bypass.data.cloneReview;assert.equal((await call(env,'/api/staff/packages/'+c.id,'PATCH',bypass)).status,422);
 const release=ready(c);release.data.cloneReview=Object.fromEntries(Object.keys(c.data.cloneReview).map(k=>[k,true]));assert.equal((await call(env,'/api/staff/packages/'+c.id,'PATCH',release)).status,200);
 assert.equal(count(env,'inventory_movements'),0);assert.equal(count(env,'stock_jobs'),0);assert.equal(count(env,'purchase_orders'),0);env.database.close();
});
test('only one published package can serve overlapping vehicle years and the same use',async()=>{
 const env=await fixture(),p=await seed(env);p.data.useLevel='weekender';const original=await publish(env,p);
 const copy=(await call(env,'/api/staff/packages/'+original.id+'/duplicate','POST',{revision:original.revision,useLevel:'weekender'})).value;
 const input=ready(copy);input.data.cloneReview=Object.fromEntries(Object.keys(copy.data.cloneReview).map(k=>[k,true]));let r=await call(env,'/api/staff/packages/'+copy.id,'PATCH',input);assert.equal(r.status,422);assert.match(r.value.error,/already serves/);
 await call(env,'/api/staff/packages/'+original.id,'PATCH',{...ready(original),state:'ARCHIVED'});
 r=await call(env,'/api/staff/packages/'+copy.id,'PATCH',input);assert.equal(r.status,200,JSON.stringify(r));env.database.close();
});
test('saving review progress retains checks; changing package contents resets draft approval',async()=>{
 const env=await fixture(),p=await seed(env),input={...ready(p),state:'DRAFT'};let r=await call(env,'/api/staff/packages/'+p.id,'PATCH',input);assert.equal(r.status,200);assert.ok(Object.values(r.value.data.approvals).every(v=>!v));
 const reviewed={...ready(r.value),state:'DRAFT'};r=await call(env,'/api/staff/packages/'+p.id,'PATCH',reviewed);assert.equal(r.status,200);assert.ok(Object.values(r.value.data.approvals).every(Boolean));
 const changed={...ready(r.value),state:'DRAFT'};changed.data.lines[0].quantity=3;r=await call(env,'/api/staff/packages/'+p.id,'PATCH',changed);assert.equal(r.status,200);assert.ok(Object.values(r.value.data.approvals).every(v=>!v));env.database.close();
});
test('media validation is stored safely and customer, purchasing and install outputs stay distinct',async()=>{
 const env=await fixture(),p=await seed(env),input=ready(p);input.data.media=[{url:'javascript:alert(1)',alt:'Unsafe',kind:'vehicle'}];assert.equal((await call(env,'/api/staff/packages/'+p.id,'PATCH',input)).status,422);
 input.data.media=[{url:'/images/fixture.webp',alt:'Synthetic test image',kind:'vehicle'}];let r=await call(env,'/api/staff/packages/'+p.id,'PATCH',input);assert.equal(r.status,200);const saved=r.value;
 const preview=(await call(env,'/api/staff/package-preview','POST',{packageId:saved.id,revision:saved.revision,fulfillment:'installed',intake})).value;
 assert.equal(preview.customer.description,input.data.description);assert.equal(preview.customer.media[0].alt,'Synthetic test image');assert.equal(preview.customer.lines[0].supplierSku,undefined);
 const customer=quoteDocument(preview,'customer'),purchasing=quoteDocument(preview,'purchasing'),install=quoteDocument(preview,'shop');assert.ok(!customer.includes('SYN-123'));assert.ok(purchasing.includes('What to order'));assert.ok(purchasing.includes('SYN-123'));assert.ok(!purchasing.includes('<h2>Install preparation</h2>'));assert.ok(install.includes('<h2>Install preparation</h2>'));assert.equal(count(env,'package_quotes'),0);env.database.close();
});

test('concurrent duplicate retries create a single draft and a single audit event',async()=>{
 const env=await fixture(),p=await seed(env),before=count(env,'master_audit'),action=key(),input={revision:p.revision,useLevel:'overlander-heavy'},path='/api/staff/packages/'+p.id+'/duplicate';
 const results=await Promise.all([call(env,path,'POST',input,admin,{'Idempotency-Key':action}),call(env,path,'POST',input,admin,{'Idempotency-Key':action})]);
 assert.ok(results.every(r=>r.status===201),JSON.stringify(results));assert.equal(new Set(results.map(r=>r.value.id)).size,1);assert.equal(count(env,'curated_packages'),2);assert.equal(count(env,'master_audit'),before+1);env.database.close();
});

test('draft edits retain the active release, publish switches one revision, old quotes remain fixed, archive removes it',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env)),saved=await quote(env,p),path='/api/staff/packages/'+p.id;
 const edit={...ready(p),state:'DRAFT'};edit.data.labor.hours=3;let d=(await call(env,path,'PATCH',edit)).value;
 assert.equal(d.published.revision,p.revision);assert.equal(d.hasDraftChanges,true);let menu=(await call(env,'/api/packages','GET',null,null)).value.packages;assert.equal(menu[0].totals.totalCents,43000);assert.equal((await quote(env,p)).status,201);
 d=(await call(env,path,'PATCH',{...ready(d),state:'DRAFT'})).value;const updated=await publish(env,d);menu=(await call(env,'/api/packages','GET',null,null)).value.packages;assert.equal(menu[0].totals.totalCents,61000);assert.equal((await quote(env,p)).status,409);assert.equal(count(env,'package_releases'),2);
 const old=(await call(env,'/api/staff/package-quotes/'+saved.value.id)).value;assert.equal(old.customer.totals.totalCents,43000);assert.equal(old.customer.packageRevision,p.revision);
 assert.equal((await call(env,path,'PATCH',{...ready(updated),state:'ARCHIVED'})).status,200);assert.equal((await call(env,'/api/packages','GET',null,null)).value.packages.length,0);assert.equal(count(env,'package_releases'),2);env.database.close();
});
test('a live release prevents overlapping replacement publication even while its working record is a draft',async()=>{
 const env=await fixture();let p=await seed(env);p.data.useLevel='weekender';p=await publish(env,p);const draft=(await call(env,'/api/staff/packages/'+p.id,'PATCH',{...ready(p),state:'DRAFT'})).value;
 const copy=(await call(env,'/api/staff/packages/'+draft.id+'/duplicate','POST',{revision:draft.revision,useLevel:'weekender'})).value;const input=ready(copy);input.data.cloneReview=Object.fromEntries(Object.keys(copy.data.cloneReview).map(k=>[k,true]));assert.equal((await call(env,'/api/staff/packages/'+copy.id,'PATCH',input)).status,422);env.database.close();
});
test('workbook imports show a comparison, require a fresh review, preserve published prices and retry once',async()=>{
 const {exportPackages,importWorkbook}=await import('../src/catalog/package-excel.js'),{DOMParser}=await import('@xmldom/xmldom');const env=await fixture(),p=await publish(env,await seed(env));const bundle=await importWorkbook(exportPackages([p]),'Test.xlsx',DOMParser);bundle.packages[0].data.variants[0].labor.hours=3;
 const plan=(await call(env,'/api/staff/packages/import-preview','POST',bundle)).value.plans[0];assert.equal(plan.oldTotal,43000);assert.equal(plan.newTotal,61000);
 const input={bundle,index:0,reviewToken:plan.reviewToken,overwrite:false},action=key();assert.equal((await call(env,'/api/staff/packages/import-apply','POST',{...input,reviewToken:'wrong'})).status,409);
 let r=await call(env,'/api/staff/packages/import-apply','POST',input,admin,{'Idempotency-Key':action});assert.equal(r.status,200,JSON.stringify(r));const revision=r.value.revision;assert.equal(r.value.state,'DRAFT');assert.equal(r.value.published.totals.totalCents,43000);assert.equal((await call(env,'/api/packages','GET',null,null)).value.packages[0].totals.totalCents,43000);
 r=await call(env,'/api/staff/packages/import-apply','POST',input,admin,{'Idempotency-Key':action});assert.equal(r.value.revision,revision);assert.equal(count(env,'inventory_movements'),0);
 const conflict=(await call(env,'/api/staff/packages/import-preview','POST',bundle)).value.plans[0];assert.equal(conflict.conflict,true);assert.equal((await call(env,'/api/staff/packages/import-apply','POST',{bundle,index:0,reviewToken:conflict.reviewToken})).status,409);assert.equal((await call(env,'/api/staff/packages/import-preview','POST',bundle,inventory)).status,403);env.database.close();
});

test('new workbook parts and package writes roll back together',async()=>{
 const env=await fixture(),p=await seed(env);const bundle={format:'NJO_PACKAGE_TRANSFER_V1',sourceId:'f'.repeat(64),file:'Synthetic.xlsx',packages:[{sourceKey:'test:new-build',title:'New build',category:'Suspension',data:{...p.data,vehicle:{...p.data.vehicle,yearFrom:2010,yearTo:2015},variants:[{id:'front-rear',label:'Front & rear',enabled:true,lines:[{title:'Synthetic new part',sku:'NEW-TEST',supplier:'Test',role:'Front',quantity:1,unitRetailCents:10000}],labor:p.data.labor}],defaultVariantId:'front-rear'}}]};
 let r=await call(env,'/api/staff/packages/import-preview','POST',bundle);assert.equal(r.status,200,JSON.stringify(r));const plan=r.value.plans[0],before=count(env,'master_products');env.database.exec("CREATE TRIGGER fail_package BEFORE INSERT ON curated_packages BEGIN SELECT RAISE(ABORT,'QA failure'); END;");
 r=await call(env,'/api/staff/packages/import-apply','POST',{bundle,index:0,reviewToken:plan.reviewToken});assert.equal(r.status,503);assert.equal(count(env,'master_products'),before);assert.equal(count(env,'curated_packages'),1);env.database.close();
});
test('future vehicle records remain private drafts during the Tacoma production pilot',async()=>{
 const env=await fixture(),p=await seed(env),input=ready(p);input.data.useLevel='expedition';assert.equal((await call(env,'/api/staff/packages/'+p.id,'PATCH',input)).status,422);input.data.useLevel='weekender';input.data.vehicle={make:'Toyota',model:'4Runner',yearFrom:2010,yearTo:2024};assert.equal((await call(env,'/api/staff/packages/'+p.id,'PATCH',input)).status,422);input.state='DRAFT';assert.equal((await call(env,'/api/staff/packages/'+p.id,'PATCH',input)).status,200);assert.equal((await call(env,'/api/packages','GET',null,null)).value.packages.length,0);env.database.close();
});

test('demo-only saved quote supplies internal views while the public route keeps them private',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env)),body={packageId:p.id,revision:p.revision,fulfillment:'installed',intake,access:key()};assert.equal((await call(env,'/api/staff/package-demo-quotes','POST',body,admin)).status,403);const r=await call(env,'/api/staff/package-demo-quotes','POST',body,{...admin,provider:'demo'});assert.equal(r.status,201);assert.equal(r.value.shop.lines[0].supplierSku,'SYN-123');assert.equal((await quote(env,p)).value.shop,undefined);env.database.close();
});

test('operator visibility labels follow the active release while a working draft needs review',()=>{
 const p={state:'DRAFT',stale:true,hasDraftChanges:true,published:{stale:false,problems:[]}};assert.equal(packageIsShown(p),true);assert.equal(packageStatusLabel(p),'In builder · draft changes');const withdrawn={...p,published:{stale:true,problems:['Part changed']}};assert.equal(packageIsShown(withdrawn),false);assert.equal(packageStatusLabel(withdrawn),'Not shown · needs review');assert.equal(packageStatusLabel({state:'DRAFT',published:null}),'Draft · not shown');
});

test('saved version history includes drafts and releases; restore is confirmed, private, attributed and idempotent',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env)),access=key(),q=await quote(env,p,access),before=env.database.prepare('SELECT snapshot_json FROM package_quotes').get().snapshot_json;
 const changed={revision:p.revision,title:p.title,category:p.category,state:'DRAFT',data:structuredClone(p.data)};changed.data.lines[0].unitRetailCents=20000;
 const edited=(await call(env,'/api/staff/packages/'+p.id,'PATCH',changed)).value;
 const history=await call(env,`/api/staff/packages/${p.id}/history`);assert.deepEqual(history.value.versions.map(v=>v.revision),[3,2,1]);assert.equal(history.value.versions[0].actor,'admin@example.test [microsoft:test-admin]');
 assert.equal((await call(env,`/api/staff/packages/${p.id}/history`,'GET',null,inventory)).status,403);
 assert.equal((await call(env,`/api/staff/packages/${p.id}/history`,'GET',null,null)).status,403);
 const path=`/api/staff/packages/${p.id}/restore`,input={revision:edited.revision,fromRevision:2,confirmed:true,reason:'Return to the reviewed parts price'},action=key();
 assert.equal((await call(env,path,'POST',{...input,confirmed:false})).status,422);assert.equal((await call(env,path,'POST',{...input,reason:''})).status,422);
 assert.equal((await call(env,path,'POST',input,inventory)).status,403);
 const restored=await call(env,path,'POST',input,admin,{'Idempotency-Key':action});assert.equal(restored.status,200,JSON.stringify(restored));assert.equal(restored.value.revision,4);assert.equal(restored.value.state,'DRAFT');assert.deepEqual(restored.value.data.approvals,{parts:false,pricing:false,fitment:false});assert.equal(restored.value.data.reviewEvidence,'');assert.equal(restored.value.data.lines[0].unitRetailCents,10000);assert.equal(restored.value.published.revision,2);
 assert.equal((await call(env,path,'POST',input,admin,{'Idempotency-Key':action})).value.revision,4);assert.equal((await call(env,path,'POST',input)).status,409);
 assert.equal((await call(env,'/api/packages','GET',null,null)).value.packages[0].revision,2);assert.equal(env.database.prepare('SELECT snapshot_json FROM package_quotes').get().snapshot_json,before);assert.equal(count(env,'inventory_movements'),0);assert.equal(count(env,'purchase_orders'),0);
 assert.equal(env.database.prepare('SELECT action FROM package_versions WHERE package_id=? AND revision=4').get(p.id).action,'PACKAGE_RESTORED');
 assert.equal((await call(env,`/api/staff/packages/${p.id}/history/2`)).value.version.data.lines[0].unitRetailCents,10000);
 assert.equal((await call(env,`/api/staff/packages/${p.id}/history/999`)).status,404);env.database.close();
});
test('restoring unavailable historical parts creates a blocked draft and version recording rolls back with failed saves',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env)),changed={revision:p.revision,title:p.title,category:p.category,state:'DRAFT',data:p.data};
 const edited=(await call(env,'/api/staff/packages/'+p.id,'PATCH',changed)).value;
 env.database.prepare("UPDATE master_products SET state='RETIRED',revision=revision+1").run();
 const restored=await call(env,`/api/staff/packages/${p.id}/restore`,'POST',{revision:edited.revision,fromRevision:2,confirmed:true,reason:'Restore for a replacement part review'});assert.equal(restored.status,200);assert.equal(restored.value.stale,true);assert.equal(restored.value.state,'DRAFT');assert.equal((await call(env,'/api/packages','GET',null,null)).value.packages.length,0);
 env.database.prepare("UPDATE master_products SET state='DRAFT'").run();
 const before=count(env,'package_versions'),audits=count(env,'master_audit');
 env.database.exec("CREATE TRIGGER reject_version BEFORE INSERT ON package_versions WHEN NEW.revision=5 BEGIN SELECT RAISE(ABORT,'synthetic history failure'); END");
 const r=await call(env,'/api/staff/packages/'+p.id,'PATCH',{...changed,revision:4});assert.equal(r.status,503);assert.equal(count(env,'package_versions'),before);assert.equal(count(env,'master_audit'),audits);assert.equal(env.database.prepare('SELECT revision FROM curated_packages').get().revision,4);env.database.close();
});
test('attention items respect staff roles, link to records and resolve after package checks',async()=>{
 const env=await fixture(),p=await seed(env),path='/api/staff/attention?location=Tacoma+Showroom';
 let r=await call(env,path);assert.equal(r.status,200,JSON.stringify(r));assert.ok(r.value.items.some(i=>i.packageId===p.id));
 assert.equal((await call(env,path,'GET',null,null)).status,403);
 assert.equal((await call(env,path,'GET',null,sales)).value.items.length,0);
 assert.ok(!(await call(env,path,'GET',null,inventory)).value.items.some(i=>i.kind==='packages'));
 const cat={...admin,roles:['catalog']},catalogOnly=(await call(env,path,'GET',null,cat)).value;assert.ok(catalogOnly.items.every(i=>i.kind==='packages'));assert.deepEqual(catalogOnly.locations,[]);
 assert.ok(!JSON.stringify(r.value).includes('candidateCost'));assert.equal((await call(env,'/api/staff/attention?location=Unknown')).status,422);
 await publish(env,p);r=await call(env,path);assert.ok(!r.value.items.some(i=>i.packageId===p.id));env.database.close();
});

test('changed shared parts block publication until a new draft is reviewed, with an explicit attention item',async()=>{
 const env=await fixture(),p=await publish(env,await seed(env));env.database.prepare('UPDATE master_products SET revision=revision+1').run();
 assert.equal((await call(env,'/api/staff/packages/'+p.id,'PATCH',ready(p))).status,409);
 const attention=(await call(env,'/api/staff/attention')).value.items.find(i=>i.packageId===p.id);assert.equal(attention.level,'blocked');assert.match(attention.detail,/Customer estimate is hidden/);
 const draft=(await call(env,'/api/staff/packages/'+p.id,'PATCH',{...ready(p),state:'DRAFT'})).value;assert.equal(draft.stale,false);assert.deepEqual(draft.data.approvals,{parts:false,pricing:false,fitment:false});
 assert.equal((await call(env,'/api/staff/packages/'+p.id,'PATCH',ready(draft))).status,200);env.database.close();
});
