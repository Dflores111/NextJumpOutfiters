// Creates a fresh, disposable demo outside the checkout. Never imports shop data.
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {openLocalMaster} from './local-master.mjs';
import {catalogService} from '../src/catalog/service.js';
const root=fileURLToPath(new URL('../',import.meta.url)),folder=await mkdtemp(path.join(tmpdir(),'njo-ims-demo-')),{DB,database,close}=await openLocalMaster(folder,root);
const products=[['DEMO Trail light kit','Lighting','DEMO-LIGHT-01',12,4,'A-04'],['DEMO Suspension lift kit','Suspension','DEMO-LIFT-02',6,2,'B-02'],['DEMO All-terrain tire','Wheels & tires','DEMO-TIRE-03',24,8,'C-01'],['DEMO Roof rack','Racks','DEMO-RACK-04',3,2,'D-03'],['DEMO Auxiliary power kit','Electrical','DEMO-POWER-05',8,3,'A-08'],['DEMO Recovery bumper','Bumpers','DEMO-BUMP-06',2,2,'D-01'],['DEMO Camper mounting kit','Campers','DEMO-CAMP-07',5,2,'B-05']];
const origin='http://127.0.0.1:4177';
async function call(endpoint,body){const response=await catalogService(new Request(origin+'/api/staff/'+endpoint,{method:endpoint==='inventory/settings'?'PATCH':'POST',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':randomUUID().replaceAll('-','')},body:JSON.stringify(body)}),{DB},{localStaff:true});const value=await response.json();if(!response.ok)throw Error(JSON.stringify(value));return value;}
const ids=[];for(const [title,category,sku,quantity,min,bin]of products){const id=randomUUID();ids.push(id);database.prepare('INSERT INTO master_products VALUES (?,?,?,?,?,?,?,?,?)').run(id,'demo:'+id,title,category,'DRAFT',1,null,JSON.stringify({stockType:'STOCKED',supplierSku:sku,source:'Synthetic demo only',prices:{}}),new Date().toISOString());await call('inventory',{productId:id,location:'Tacoma Showroom',kind:'COUNT',quantity,reason:'Synthetic demo opening count'});await call('inventory/settings',{location:'Tacoma Showroom',field:'bin',value:bin,items:[{id,revision:0}]});await call('inventory/settings',{location:'Tacoma Showroom',field:'minLevel',value:min,items:[{id,revision:1}]});}
await call('barcodes',{productId:ids[0],code:'001234567890'});
const createPo=async(supplier,lines)=>call('purchases',{supplier,location:'Tacoma Showroom',lines,notes:'Synthetic demo. No supplier order was placed.'});
let p=await createPo('DEMO Northtrail Lighting',[{productId:ids[0],quantity:8,unitCostCents:14500},{productId:ids[4],quantity:4,unitCostCents:21500}]);await call('purchases/'+p.id,{action:'ORDER',revision:1});await call('purchases/'+p.id+'/receive',{revision:2,reference:'DEMO split delivery',lines:[{productId:ids[0],quantity:3}]});
p=await createPo('DEMO Summit Suspension',[{productId:ids[1],quantity:4,unitCostCents:68000}]);await call('purchases/'+p.id,{action:'ORDER',revision:1});
await createPo('DEMO Ridge Fabrication',[{productId:ids[5],quantity:2,unitCostCents:95000}]);
await call('jobs',{title:'DEMO Tacoma · trail lighting',vehicle:'DEMO 2022 Toyota Tacoma',location:'Tacoma Showroom',lines:[{productId:ids[0],quantity:2},{productId:ids[4],quantity:1}]});
await call('jobs',{title:'DEMO F-250 · weekend setup',vehicle:'DEMO 2023 Ford F-250',location:'Tacoma Showroom',lines:[{productId:ids[1],quantity:1},{productId:ids[2],quantity:4},{productId:ids[5],quantity:1}]});
close();console.log(JSON.stringify({folder,synthetic:true,barcode:'001234567890',products:ids.length}));
