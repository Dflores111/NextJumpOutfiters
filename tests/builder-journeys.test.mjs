import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {sqliteAdapter} from '../scripts/local-master.mjs';
import {catalogService} from '../src/catalog/service.js';
import {createBuild,validateBuild,vehicleRoutes} from '../src/builder/domain.js';
import {flatbedSizeFor,pilotVehicle} from '../src/builder/journey-domain.js';
import {cleanCatalogFields} from '../src/catalog/catalog-fields.js';
import {hoursFor} from '../src/catalog/variant-domain.js';
import {validateInquiryFields} from '../src/inquiry-contract.js';
const origin='https://example.test',key=()=>randomUUID().replaceAll('-',''),admin={provider:'microsoft',subject:'test',email:'staff@example.test',roles:['admin']};
async function fixture(){const database=new DatabaseSync(':memory:');database.exec('PRAGMA foreign_keys=ON');for(const name of (await readdir(new URL('../drizzle/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())database.exec(await readFile(new URL('../drizzle/'+name,import.meta.url),'utf8'));return {database,DB:sqliteAdapter(database)};}
async function call(env,path,method='GET',body,identity=admin,headers={}){const r=await catalogService(new Request(origin+path,{method,headers:{Origin:origin,'Idempotency-Key':key(),...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}),env,{staffIdentity:identity});return {status:r.status,value:await r.json()};}
const empty=()=>({format:'NJO_PACKAGE_WORKSHOP_V2',sourceId:'b'.repeat(64),sourceRows:[],products:[],packages:[],standards:[]});
const part=()=>({sourceKey:'fixture:part',title:'Synthetic shock',category:'Suspension',data:{supplierSku:'SYN-1',catalogFields:{purchaseCostCents:1000,cogsCents:1400,unit:'each'},sourceVariants:[{sourceRowKey:'source-row',group:'Size A',fields:{dimensionsMm:'Unconfirmed source'}}]}});
const row=()=>({sourceKey:'fixture:row',kind:'flatbed',title:'Synthetic source row',group:'Size A',file:'Synthetic.xlsx',sheet:'Parts',row:2,mapped:{purchaseCostCents:1000,cogsCents:1400},columns:{E:{cell:'E2',label:'Item Cost',value:10,formula:null},N:{cell:'N2',label:'COGS',value:14,formula:'=E2+4'}},fieldMap:{E:'purchaseCostCents',N:'cogsCents'}});
async function seed(env){const b=empty();b.products=[part()];b.sourceRows=[row()];const r=await call(env,'/api/staff/source-imports','POST',b);assert.equal(r.status,200,JSON.stringify(r));return (await call(env,'/api/staff/products')).value.products[0];}
const labor={hours:1,rateCents:10000,alignmentCents:5000};
function packageDef(){const lines=[{sourceKey:'fixture:part',role:'Synthetic shock',quantity:2,unitCostCents:1000,unitRetailCents:10000}];return {sourceKey:'fixture:weekender',title:'Weekender',category:'Suspension',data:{vehicle:{make:'Toyota',model:'Tacoma',yearFrom:2016,yearTo:2023},useLevel:'weekender',lines,labor,variants:[{id:'front-rear',label:'Front & rear',enabled:true,lines,labor},{id:'front-only',label:'Front only',enabled:false,lines:[{...lines[0],quantity:1}],labor:{...labor,hours:.5}}],defaultVariantId:'front-rear',fitmentNotes:'Synthetic fitment scope',issues:[],sourceSummary:{frontOnly:{retailCents:20000}},sourceDescription:'Original source scope'}};}

test('flatbeds skip use; upfitting requires use; kitchen dependencies and saved v1 records remain valid',()=>{
 const b=createBuild(vehicleRoutes[0]);assert.equal(validateBuild(b).valid,true);const fields={context:'flatbed',firstName:'Test',preferredContact:'email',email:'test@example.test',build:b};assert.deepEqual(validateInquiryFields(fields),{});
 const up={...b,truck:{...b.truck,bed:''},selected:[],plan:{kind:'vehicle',upgradeIds:[]}};assert.equal(validateBuild(up).valid,false);assert.equal(validateBuild({...up,use:'Daily use & weekends'}).valid,true);assert.equal(validateBuild({...b,selected:['base','kitchen']}).valid,false);
});
test('size guides cover the existing vehicle routes without claiming exact fitment; Tacoma pilot stays bounded',()=>{
 const groups=new Set(vehicleRoutes.map(v=>flatbedSizeFor(v).key));assert.deepEqual([...groups].sort(),['FSL','FSR','MSL','MSR']);for(const v of vehicleRoutes){const m=flatbedSizeFor(v);assert.equal(m.requiresFitmentReview,true);assert.equal(m.dimensionsMm,undefined);assert.equal(m.sku,undefined);}assert.equal(flatbedSizeFor({make:'Other / not sure',model:'Not sure',bed:'Not sure'}),null);assert.equal(pilotVehicle({make:'Toyota',model:'Tacoma',year:'2023'}),true);assert.equal(pilotVehicle({make:'Toyota',model:'Tacoma',year:'2024'}),false);
});
test('full source import preserves every source field, formulas, costs and variants without stock or approvals',async()=>{
 const env=await fixture(),p=await seed(env);assert.equal(p.state,'DRAFT');assert.equal(p.data.stockType,'UNREVIEWED');assert.equal(p.data.catalogFields.purchaseCostCents,1000);assert.equal(p.data.catalogFields.cogsCents,1400);assert.equal(p.data.sourceVariants.length,1);assert.equal(p.data.catalogFields.promotion.enabled,false);
 const r=await call(env,'/api/staff/source-rows?q=COGS');assert.equal(r.value.total,1);assert.equal(r.value.rows[0].data.columns.N.formula,'=E2+4');assert.equal(env.database.prepare('SELECT COUNT(*) n FROM inventory_movements').get().n,0);assert.equal((await call(env,'/api/staff/source-rows','GET',null,null)).status,403);assert.equal((await call(env,'/api/staff/source-imports','POST',empty(),{...admin,roles:['inventory']})).status,403);env.database.close();
});
test('V2 supplementation preserves reviewed edits, retries once, and SQL failures roll back all records',async()=>{
 const env=await fixture(),p=await seed(env);const b=empty();b.products=[{...part(),title:'Another source title'}];const action=key();assert.equal((await call(env,'/api/staff/source-imports','POST',b,admin,{'Idempotency-Key':action})).status,200);assert.equal((await call(env,'/api/staff/source-imports','POST',b,admin,{'Idempotency-Key':action})).status,200);assert.equal(env.database.prepare('SELECT revision FROM master_products').get().revision,2);env.database.prepare("UPDATE master_products SET title='Human decision',revision=3,state='REVIEW'").run();await call(env,'/api/staff/source-imports','POST',b);assert.equal(env.database.prepare('SELECT title FROM master_products').get().title,'Human decision');
 env.database.exec("CREATE TRIGGER reject_source BEFORE INSERT ON catalog_source_rows WHEN NEW.title='Reject me' BEGIN SELECT RAISE(ABORT,'synthetic'); END");const n=env.database.prepare('SELECT COUNT(*) n FROM master_audit').get().n;const broken={...empty(),sourceRows:[{...row(),sourceKey:'new:first'},{...row(),sourceKey:'new:reject',title:'Reject me'}]};assert.equal((await call(env,'/api/staff/source-imports','POST',broken)).status,503);assert.equal(env.database.prepare('SELECT COUNT(*) n FROM catalog_source_rows').get().n,1);assert.equal(env.database.prepare('SELECT COUNT(*) n FROM master_audit').get().n,n);env.database.close();
});
test('scopes retain separate prices and costs; customer quotes select only a released scope and exclude private fields',async()=>{
 const env=await fixture();await seed(env);let r=await call(env,'/api/staff/source-imports','POST',{...empty(),packages:[packageDef()]});assert.equal(r.status,200,JSON.stringify(r));let p=(await call(env,'/api/staff/packages')).value.packages[0];assert.equal(p.variantCosts[0].partsCostCents,2000);assert.equal(p.data.sourceSummary.frontOnly.retailCents,20000);
 const input={revision:p.revision,title:p.title,category:p.category,state:'PUBLISHED',data:{...p.data,reviewEvidence:'Synthetic reviewer',approvals:{parts:true,pricing:true,fitment:true}}};r=await call(env,'/api/staff/packages/'+p.id,'PATCH',input);assert.equal(r.status,200,JSON.stringify(r));p=r.value;
 let menu=(await call(env,'/api/packages','GET',null,null)).value;assert.equal(menu.packages[0].variants.length,1);assert.equal(menu.packages[0].useLevel,'weekender');for(const secret of ['unitCostCents','sourceSummary','sourceDescription','sourceVariants','SYN-1'])assert.ok(!JSON.stringify(menu).includes(secret));
 const quote={packageId:p.id,revision:p.revision,fulfillment:'installed',variantId:'front-only',intake:{year:2020,suspension:'stock',use:'daily'}};assert.equal((await call(env,'/api/package-quotes','POST',quote,null,{'X-Build-Access':key()})).status,422);
 const next={...input,revision:p.revision,data:{...p.data,variants:p.data.variants.map(v=>({...v,enabled:true}))}};p=(await call(env,'/api/staff/packages/'+p.id,'PATCH',next)).value;r=await call(env,'/api/package-quotes','POST',{...quote,revision:p.revision},null,{'X-Build-Access':key()});assert.equal(r.status,201,JSON.stringify(r));assert.equal(r.value.customer.variantId,'front-only');assert.equal(r.value.customer.totals.totalCents,20000);assert.ok(!JSON.stringify(r.value).includes('unitCost'));env.database.close();
});
test('electrical BOM mapping keeps unknown quantities and units and requires a complete technical review',async()=>{
 const env=await fixture(),p=await seed(env),standard={sourceKey:'fixture:power',title:'Synthetic power section',category:'Electrical',data:{bomLines:[{id:'line-1',sourceKey:p.source_key,quantity:null,unit:'ft',reviewed:true,sourceText:'Wire length not given'}],issues:[{id:'technical',message:'Check source',resolved:false}],reviewEvidence:''}};let r=await call(env,'/api/staff/source-imports','POST',{...empty(),standards:[standard]});assert.equal(r.status,200,JSON.stringify(r));let s=(await call(env,'/api/staff/standards')).value.standards[0];assert.equal(s.data.bomLines[0].reviewed,false);assert.equal(s.data.bomLines[0].productId,p.id);
 const input={revision:s.revision,state:'REVIEWED',bomLines:s.data.bomLines,issues:[{...s.data.issues[0],resolved:true}],reviewEvidence:'Synthetic review'};assert.equal((await call(env,'/api/staff/standards/'+s.id,'PATCH',input)).status,422);input.bomLines=[{...s.data.bomLines[0],quantity:6,reviewed:true}];assert.equal((await call(env,'/api/staff/standards/'+s.id,'PATCH',input)).status,200);assert.equal(env.database.prepare('SELECT COUNT(*) n FROM inventory_movements').get().n,0);env.database.close();
});
test('catalog fields validate prices and promotions; reused supplier identities cannot be approved without evidence',async()=>{
 assert.throws(()=>cleanCatalogFields({purchaseCostCents:-1}));assert.throws(()=>cleanCatalogFields({promotion:{enabled:true,retailCents:100}}));assert.equal(cleanCatalogFields({promotion:{enabled:false,retailCents:100}}).promotion.enabled,false);assert.equal(hoursFor({useBreakdown:true,frontHours:2,rearHours:1,rustHours:.5,rustApplies:true}),3.5);
 const env=await fixture();const b=empty();b.products=[{...part(),data:{...part().data,sourceIdentityIssue:'Two sizes share a supplier code'}}];await call(env,'/api/staff/source-imports','POST',b);const p=(await call(env,'/api/staff/products')).value.products[0],input={revision:p.revision,state:'APPROVED',stockType:'STOCKED',planningSlot:'base',reason:'Synthetic identity review'};assert.equal((await call(env,'/api/staff/products/'+p.id,'PATCH',input)).status,422);assert.equal((await call(env,'/api/staff/products/'+p.id,'PATCH',{...input,sourceIdentityEvidence:'Synthetic supplier confirmation',catalogFields:{cogsCents:2300}})).status,200);env.database.close();
});

test('flatbed builder reads approved backend titles and mode-specific prices and withdraws stale fitment',async()=>{
 const env=await fixture(),p=await seed(env);const path='/api/staff/products/'+p.id;
 const base={title:'Synthetic Tacoma platform',category:'Flatbeds',state:'APPROVED',stockType:'STOCKED',planningSlot:'base',reason:'Synthetic test only'};
 await call(env,path,'PATCH',{...base,revision:p.revision,price:{mode:'installed',cents:320000,state:'APPROVED'}});
 let product=(await call(env,'/api/staff/products')).value.products[0];
 await call(env,path,'PATCH',{...base,revision:product.revision,price:{mode:'diy',cents:250000,state:'APPROVED'}});
 product=(await call(env,'/api/staff/products')).value.products[0];
 const fit={productId:p.id,revision:product.revision,vehicleKey:'2022|Toyota|Tacoma|5 ft',state:'APPROVED',evidence:'Synthetic testing only'};
 assert.equal((await call(env,'/api/staff/fitments','POST',fit)).status,200);
 const route='/api/catalog/flatbed-match?year=2022&make=Toyota&model=Tacoma&bed=5+ft';
 let match=(await call(env,route,'GET',null,null)).value;
 assert.equal(match.product.title,base.title);assert.equal(match.product.priceCents,320000);
 assert.equal((await call(env,route+'&fulfillment=diy','GET',null,null)).value.product.priceCents,250000);
 assert.equal((await call(env,route.replace('2022','2021'),'GET',null,null)).value.product,null);
 for(const secret of ['purchaseCost','cogsCents','supplierSku','unitCost'])assert.ok(!JSON.stringify(match).includes(secret));
 assert.equal((await call(env,path,'PATCH',{...base,title:'Updated synthetic platform',revision:product.revision,price:{mode:'installed',cents:350000,state:'APPROVED'}})).status,200);
 assert.equal((await call(env,route,'GET',null,null)).value.product,null,'a changed product must be reviewed again');
 product=(await call(env,'/api/staff/products')).value.products[0];
 await call(env,'/api/staff/fitments','POST',{...fit,revision:product.revision});
 match=(await call(env,route,'GET',null,null)).value;
 assert.equal(match.product.title,'Updated synthetic platform');assert.equal(match.product.priceCents,350000);
 env.database.close();
});
