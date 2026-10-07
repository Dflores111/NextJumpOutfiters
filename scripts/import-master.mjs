import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {openLocalMaster} from './local-master.mjs';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=process.argv[2];if(!source)throw Error('Pass a private NJO_IMPORT_REVIEW_V1 JSON file.');
const sourcePath=path.resolve(source),dataDir=path.resolve(process.env.PREVIEW_DATA_DIR||path.join(root,'.preview-data'));
for(const folder of [path.join(root,'public'),path.join(root,'dist')])if(sourcePath.startsWith(folder+path.sep)||dataDir===folder||dataDir.startsWith(folder+path.sep))throw Error('Imports and database files must be outside published assets.');
const input=JSON.parse(await readFile(sourcePath,'utf8'));
if(input.format!=='NJO_IMPORT_REVIEW_V1'||!Array.isArray(input.products)||!Array.isArray(input.inventory)||input.products.length>10000||input.inventory.length>20000)throw Error('Unsupported or oversized import.');
const master=await openLocalMaster(dataDir,root),db=master.database;
let products=0,inventory=0;const time=new Date().toISOString();
try{
 db.exec('BEGIN IMMEDIATE');
 for(const item of input.products){
  if(!item.sourceKey||typeof item.title!=='string'||!item.title.trim()||typeof item.category!=='string'||!item.data||JSON.stringify(item.data).length>16000)throw Error('Invalid product candidate. Import rolled back.');
  // Imports never update an approved record, infer fitment or promote candidate prices.
  const data={...item.data,prices:{},stockType:'UNREVIEWED'};
  const result=db.prepare('INSERT OR IGNORE INTO master_products (id,source_key,title,category,state,revision,planning_slot,data_json,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(randomUUID(),item.sourceKey,item.title.slice(0,300),item.category.slice(0,200),'DRAFT',1,null,JSON.stringify(data),time);products+=Number(result.changes);
 }
 for(const item of input.inventory){
  if(!item.sourceKey||!item.productKey||!item.location||!item.data)throw Error('Invalid inventory candidate. Import rolled back.');
  inventory+=Number(db.prepare('INSERT OR IGNORE INTO inventory_sources (id,source_key,product_key,location,data_json,imported_at) VALUES (?,?,?,?,?,?)').run(randomUUID(),item.sourceKey,item.productKey,item.location,JSON.stringify(item.data),time).changes);
 }
 db.prepare('INSERT INTO master_audit (id,subject_id,action,actor,payload,created_at) VALUES (?,?,?,?,?,?)').run(randomUUID(),'catalog','SOURCE_IMPORT','Private local import',JSON.stringify({products,inventory,report:input.report,approval:'DRAFT_ONLY'}),time);
 db.exec('COMMIT');console.log(JSON.stringify({productsInserted:products,inventoryCandidatesInserted:inventory,approved:0,stockMovements:0,database:'Private local workspace'}));
}catch(error){db.exec('ROLLBACK');throw error;}finally{master.close();}
