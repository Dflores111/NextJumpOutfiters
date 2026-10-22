import {catalogService} from './service.js';

export const demoIdentity={provider:'demo',subject:'sample-reviewer',email:'Demo reviewer',roles:['admin'],local:false};

// D1-compatible adapter over a browser-owned SQLite database. No remote binding.
export function browserSqliteAdapter(database){
 function execute(sql,values,kind){
  const statement=database.prepare(sql);
  try{statement.bind(values);if(kind==='run'){statement.step();return {meta:{changes:database.getRowsModified()}};}
   const rows=[];while(statement.step()){rows.push(statement.getAsObject());if(kind==='first')break;}
   return kind==='first'?rows[0]||null:{results:rows};
  }finally{statement.free();}
 }
 const item=(sql,values=[])=>({_sql:sql,_values:values,bind(...args){return item(sql,args)},async first(){return execute(sql,values,'first')},async all(){return execute(sql,values,'all')},async run(){return execute(sql,values,'run')}});
 return {prepare:sql=>item(sql),async batch(statements){database.run('BEGIN IMMEDIATE');try{const results=statements.map(s=>execute(s._sql,s._values,'run'));database.run('COMMIT');return results;}catch(error){database.run('ROLLBACK');throw error;}}};
}

export function demoRequest(DB,path,method='GET',body,key,origin='https://inventory-demo.invalid'){
 const url=new URL('/api/staff/'+path,origin);
 if(url.origin!==origin||!url.pathname.startsWith('/api/staff/')||path.includes('\\'))throw Error('Use the inventory demo controls.');
 // This is a local service invocation, never an HTTP request. A separate header
 // bag avoids browsers stripping the synthetic Origin as a forbidden header.
 const headers=new Headers({Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{})});
 const request=new Request(url,{method,...(body?{body:JSON.stringify(body)}:{})});
 return catalogService({url:url.href,method,headers,body:request.body},{DB},{staffIdentity:demoIdentity});
}

export async function seedDemo(DB){
 const call=async(path,body,method='POST')=>{const response=await demoRequest(DB,path,method,body,crypto.randomUUID().replaceAll('-',''));if(!response.ok)throw Error((await response.json()).error);return response.json();};
 const products=[['DEMO Trail light kit','Lighting','DEMO-LIGHT-01',12,4,'A-04'],['DEMO Suspension lift kit','Suspension','DEMO-LIFT-02',6,2,'B-02'],['DEMO All-terrain tire','Wheels & tires','DEMO-TIRE-03',24,8,'C-01'],['DEMO Roof rack','Racks','DEMO-RACK-04',3,2,'D-03'],['DEMO Auxiliary power kit','Electrical','DEMO-POWER-05',8,3,'A-08'],['DEMO Recovery bumper','Bumpers','DEMO-BUMP-06',2,2,'D-01'],['DEMO Camper mounting kit','Campers','DEMO-CAMP-07',5,2,'B-05']];
 const ids=[];
 for(const [title,category,sku,quantity,min,bin]of products){
  const id=crypto.randomUUID();ids.push(id);
  await DB.prepare('INSERT INTO master_products VALUES (?,?,?,?,?,?,?,?,?)').bind(id,'demo:'+id,title,category,'DRAFT',1,null,JSON.stringify({stockType:'STOCKED',supplierSku:sku,source:'Synthetic demo only',prices:{}}),new Date().toISOString()).run();
  await call('inventory',{productId:id,location:'Tacoma Showroom',kind:'COUNT',quantity,reason:'Synthetic demo opening count'});
  await call('inventory/settings',{location:'Tacoma Showroom',field:'bin',value:bin,items:[{id,revision:0}]},'PATCH');
  await call('inventory/settings',{location:'Tacoma Showroom',field:'minLevel',value:min,items:[{id,revision:1}]},'PATCH');
 }
 await call('barcodes',{productId:ids[0],code:'001234567890'});
 const purchase=(supplier,lines)=>call('purchases',{supplier,location:'Tacoma Showroom',lines,notes:'Synthetic demo. No supplier order is placed.'});
 let p=await purchase('DEMO Northtrail Lighting',[{productId:ids[0],quantity:8,unitCostCents:14500},{productId:ids[4],quantity:4,unitCostCents:21500}]);
 await call('purchases/'+p.id,{action:'ORDER',revision:1});
 await call('purchases/'+p.id+'/receive',{revision:2,reference:'DEMO split delivery',lines:[{productId:ids[0],quantity:3}]});
 p=await purchase('DEMO Summit Suspension',[{productId:ids[1],quantity:4,unitCostCents:68000}]);await call('purchases/'+p.id,{action:'ORDER',revision:1});
 await purchase('DEMO Ridge Fabrication',[{productId:ids[5],quantity:2,unitCostCents:95000}]);
 await call('jobs',{title:'DEMO Tacoma · trail lighting',vehicle:'DEMO 2022 Toyota Tacoma',location:'Tacoma Showroom',lines:[{productId:ids[0],quantity:2},{productId:ids[4],quantity:1}]});
 await call('jobs',{title:'DEMO F-250 · weekend setup',vehicle:'DEMO 2023 Ford F-250',location:'Tacoma Showroom',lines:[{productId:ids[1],quantity:1},{productId:ids[2],quantity:4},{productId:ids[5],quantity:1}]});
}


// Existing browser demos keep their edits; add only this feature's new tables.
function migrateHandoffDemo(database,schema){
 const names=new Set(['job_purchase_orders','job_requirements','quote_job_handoffs','job_requirement_product','quote_job_handoffs_job_id_unique']);
 database.run('BEGIN');
 try{for(const match of schema.matchAll(/CREATE (?:UNIQUE )?(TABLE|INDEX) `([^`]+)`[\s\S]*?;/g)){
  if(names.has(match[2]))database.run(match[0].replace(/(TABLE|INDEX) /,'$1 IF NOT EXISTS '));
 }database.run('COMMIT');}catch(error){database.run('ROLLBACK');throw error;}
}
async function seedHandoffQuote(DB){
 if(await DB.prepare("SELECT id FROM package_quotes WHERE number='NJO-DEMO-PREP'").first())return;
 const products=(await DB.prepare("SELECT * FROM master_products WHERE json_extract(data_json,'$.supplierSku') IN ('DEMO-LIFT-02','DEMO-CAMP-07') ORDER BY title").all()).results;
 if(products.length!==2)return;
 const now=new Date().toISOString(),id=crypto.randomUUID(),packageId=crypto.randomUUID();
 const lines=products.map(p=>({productId:p.id,productRevision:p.revision,title:p.title,role:'Demo part',quantity:p.title.includes('Camper')?6:1,unitRetailCents:p.title.includes('Camper')?10000:80000,supplierSku:JSON.parse(p.data_json).supplierSku,supplier:'DEMO Summit Supply',available:null,supply:{quantity:null,checkedAt:null,fulfillment:'UNKNOWN'}}));
 const vehicle={make:'Toyota',model:'Tacoma',yearFrom:2016,yearTo:2023},labor={hours:2,rateCents:15000,alignmentCents:0};
 const data={vehicle,lines,labor,useLevel:'weekender',description:'Synthetic parts, quantities and prices for trying the quote-to-job workflow.',fitmentNotes:'Demo only. This is not a verified vehicle configuration or a real installation specification.',installNotes:'Sample shop handoff. Receive the missing mounting kit, reserve it, then record actual use.',excludes:['tax','freight'],approvals:{},issues:[],media:[],specs:{},source:{kind:'demo'}};
 const customer={number:'NJO-DEMO-PREP',createdAt:now,packageRevision:1,title:'DEMO Tacoma · quote-to-job walkthrough',description:data.description,vehicle:{year:2022,make:'Toyota',model:'Tacoma',suspension:'stock',use:'trips'},fulfillment:'installed',draft:false,variantLabel:'Sample build',lines,totals:{partsCents:140000,laborCents:30000,alignmentCents:0,totalCents:170000},excludes:data.excludes,fitmentNotes:data.fitmentNotes};
 const shop={lines,labor,stockAsOf:now,installNotes:data.installNotes};
 await DB.batch([
  DB.prepare('INSERT INTO curated_packages VALUES (?,?,?,?,?,?,?,?)').bind(packageId,'demo:handoff',customer.title,'Demo','DRAFT',1,JSON.stringify(data),now),
  DB.prepare('INSERT INTO package_quotes VALUES (?,?,?,?,?,?,?,?,?)').bind(id,customer.number,packageId,1,crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID(),JSON.stringify({customer,shop}),now)
 ]);
}

export async function createDemoEngine(SQL,schema,bytes){
 const database=bytes?new SQL.Database(bytes):new SQL.Database();
 database.run('PRAGMA foreign_keys=ON');
 const DB=browserSqliteAdapter(database);
 if(!bytes){database.run(schema);await seedDemo(DB);}else migrateHandoffDemo(database,schema);
 await seedHandoffQuote(DB);
 // Queue whole requests: async service steps must never interleave transactions.
 let queue=Promise.resolve();
 return {request(path,method,body,key){const next=queue.then(()=>demoRequest(DB,path,method,body,key));queue=next.catch(()=>{});return next;},export(){const bytes=database.export();database.run('PRAGMA foreign_keys=ON');return bytes;},close:()=>database.close()};
}
