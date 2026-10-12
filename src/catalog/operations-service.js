import {inventoryItems,inventoryLocations} from './inventory-service.js';

const fail=(status,message)=>Object.assign(new Error(message),{status});
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const uuid=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/i.test(value);
const qty=(value,zero=false)=>Number.isSafeInteger(value)&&value>=(zero?0:1)&&value<=1000000;
function text(value,max,required=false){if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw fail(422,`Enter ${required?'a value':'text'} of ${max} characters or fewer.`);return value.trim();}
function location(value){if(!inventoryLocations.includes(value))throw fail(422,'Choose a shop location.');return value;}
function revision(value){if(!Number.isSafeInteger(value)||value<1)throw fail(422,'Refresh this record before changing it.');return value;}
function codeOf(value){if(typeof value!=='string'||!value.trim()||value.trim().length>100||!/^[\x20-\x7e]+$/.test(value.trim()))throw fail(422,'Scan or enter a barcode of up to 100 printable characters.');return value.trim();}
function linesOf(value,{cost=false,zero=false}={}){
 if(!Array.isArray(value)||!value.length||value.length>25)throw fail(422,'Choose 1 to 25 different parts.');
 const lines=value.map(row=>{if(!uuid(row?.productId)||!qty(row.quantity,zero))throw fail(422,'Each part needs a valid whole quantity.');const line={productId:row.productId,quantity:row.quantity};if(cost){line.unitCostCents=row.unitCostCents??null;if(line.unitCostCents!==null&&(!Number.isSafeInteger(line.unitCostCents)||line.unitCostCents<0||line.unitCostCents>100000000))throw fail(422,'Unit cost must be valid USD cents, or left blank.');}return line;}).sort((a,b)=>a.productId.localeCompare(b.productId));
 if(new Set(lines.map(l=>l.productId)).size!==lines.length)throw fail(422,'Combine duplicate parts into one line.');return lines;
}
// A command is a transaction gate plus an immutable audit receipt. Every effect is
// guarded by the same receipt and current revision, and stock events have unique
// keys. Lost responses and concurrent retries cannot receive or consume twice.
async function command(db,action,input,key,actor,entityId,condition,conditionArgs,effects,failureMessage){
 if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{32,96}$/.test(key))throw fail(400,'A valid action key is required.');
 const commandId=await hash(key),fingerprint=await hash(JSON.stringify({action,input}));
 const check=row=>{if(row.actor!==actor||JSON.parse(row.payload).fingerprint!==fingerprint)throw fail(409,'This action key belongs to a different change.');return JSON.parse(row.payload).entityId;};
 const prior=await one(db,'SELECT actor,payload FROM master_audit WHERE id=?',commandId);if(prior)return {id:check(prior),reused:true};
 const time=new Date().toISOString(),payload=JSON.stringify({entityId,fingerprint,...input});
 const gate='EXISTS(SELECT 1 FROM master_audit WHERE id=? AND actor=? AND json_extract(payload,\'$.fingerprint\')=? AND json_extract(payload,\'$.entityId\')=?)';
 const gateArgs=[commandId,actor,fingerprint,entityId],ctx={gate,gateArgs,time,commandId,entityId,actor};
 const results=await db.batch([
  db.prepare(`INSERT OR IGNORE INTO master_audit (id,subject_id,action,actor,payload,created_at) SELECT ?,?,?,?,?,? WHERE ${condition}`).bind(commandId,entityId,action,actor,payload,time,...conditionArgs),
  ...effects(ctx)
 ]);
 const saved=await one(db,'SELECT actor,payload FROM master_audit WHERE id=?',commandId);
 if(!saved)throw fail(409,failureMessage||'The record or stock changed. Refresh and review it again; nothing was applied.');
 return {id:check(saved),reused:results[0].meta?.changes===0};
}
const physicalLines=`NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN master_products p ON p.id=json_extract(j.value,'$.productId') WHERE p.id IS NULL OR p.state='RETIRED' OR COALESCE(json_extract(p.data_json,'$.stockType'),'')<>'STOCKED')`;
const currentOrder="EXISTS(SELECT 1 FROM purchase_orders WHERE id=? AND revision=? AND status IN ('ORDERED','PARTIAL'))";
const currentJob="EXISTS(SELECT 1 FROM stock_jobs WHERE id=? AND revision=? AND status='OPEN')";
const stockSum=(column,product='p.id')=>`COALESCE((SELECT SUM(${column}) FROM inventory_movements WHERE product_id=${product} AND location=?),0)`;
const availableLines=`NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN master_products p ON p.id=json_extract(j.value,'$.productId') WHERE p.id IS NULL OR p.state='RETIRED' OR COALESCE(json_extract(p.data_json,'$.stockType'),'')<>'STOCKED' OR NOT EXISTS(SELECT 1 FROM inventory_movements WHERE product_id=p.id AND location=? AND kind='COUNT') OR ${stockSum('onhand_delta')}-${stockSum('reserved_delta')}<json_extract(j.value,'$.quantity'))`;
const number=(prefix,id)=>`${prefix}-${id.slice(0,8).toUpperCase()}`;

export async function lookupBarcode(db,params){
 const code=codeOf(params.get('code')),at=location(params.get('location')||inventoryLocations[0]);
 const row=await one(db,'SELECT product_id FROM product_barcodes WHERE code=?',code);if(!row)throw fail(404,'Barcode not linked yet. Find the part by name or SKU and add this code in its details.');
 const result=await inventoryItems(db,new URLSearchParams({q:row.product_id,location:at}));const item=result.items.find(i=>i.id===row.product_id);if(!item)throw fail(404,'Linked part not found.');return {code,item};
}
export async function barcodes(db,productId){return {barcodes:await all(db,'SELECT code,created_at AS createdAt FROM product_barcodes WHERE product_id=? ORDER BY code',productId)};}
export async function saveBarcode(db,input,key,actor){
 const productId=input.productId,code=codeOf(input.code),remove=input.remove===true;if(!uuid(productId))throw fail(422,'Choose a part.');
 const createdAt=remove?text(input.createdAt,40,true):null;const clean={productId,code,remove,createdAt};
 const condition=remove?'EXISTS(SELECT 1 FROM product_barcodes WHERE code=? AND product_id=? AND created_at=?)':"EXISTS(SELECT 1 FROM master_products WHERE id=? AND state<>'RETIRED') AND NOT EXISTS(SELECT 1 FROM product_barcodes WHERE code=?)";
 const args=remove?[code,productId,createdAt]:[productId,code];
 const result=await command(db,remove?'BARCODE_REMOVED':'BARCODE_ADDED',clean,key,actor,productId,condition,args,({gate,gateArgs,time})=>[
  remove?db.prepare(`DELETE FROM product_barcodes WHERE code=? AND product_id=? AND created_at=? AND ${gate}`).bind(code,productId,createdAt,...gateArgs):db.prepare(`INSERT OR IGNORE INTO product_barcodes (code,product_id,created_by,created_at) SELECT ?,?,?,? WHERE ${gate}`).bind(code,productId,actor,time,...gateArgs)
 ],remove?'This barcode link changed. Refresh the part before removing it.':'This barcode is already linked, or the part is retired. Check the code and existing links.');return {...result,...await barcodes(db,productId)};
}
function listParams(params,statuses){
 const at=location(params.get('location')||inventoryLocations[0]),q=(params.get('q')||'').trim().slice(0,100),status=params.get('status')||'active',page=Number(params.get('page')||1),sort=params.get('sort')||'updated';
 if(!['all','active',...statuses].includes(status)||!Number.isSafeInteger(page)||page<1||page>100000||!['updated','oldest','name'].includes(sort))throw fail(422,'Choose valid filters.');return {at,q,status,page,sort};
}
export async function listOperations(db,params,kind){
 const po=kind==='purchases',table=po?'purchase_orders':'stock_jobs',lineTable=po?'purchase_order_lines':'stock_job_lines',fk=po?'order_id':'job_id',name=po?'supplier':'title';
 const {at,q,status,page,sort}=listParams(params,po?['DRAFT','ORDERED','PARTIAL','RECEIVED','CANCELLED']:['OPEN','COMPLETE','CANCELLED']);
 const filters=['o.location=?'],args=[at];
 if(status==='active')filters.push(po?"o.status IN ('DRAFT','ORDERED','PARTIAL')":"o.status='OPEN'");else if(status!=='all'){filters.push('o.status=?');args.push(status);}
 if(q){const term=`%${q.replace(/[\\%_]/g,'\\$&')}%`;filters.push(`(o.number LIKE ? ESCAPE '\\' OR o.${name} LIKE ? ESCAPE '\\' ${po?'':"OR o.vehicle LIKE ? ESCAPE '\\'"})`);args.push(term,term,...(po?[]:[term]));}
 const where=filters.join(' AND '),total=(await one(db,`SELECT COUNT(*) n FROM ${table} o WHERE ${where}`,...args)).n,pages=Math.max(1,Math.ceil(total/30)),current=Math.min(page,pages);
 const order=sort==='name'?`o.${name} COLLATE NOCASE ASC`:sort==='oldest'?'o.created_at ASC':'o.updated_at DESC';
 const rows=await all(db,`SELECT o.*,(SELECT COUNT(*) FROM ${lineTable} l WHERE l.${fk}=o.id) AS parts,(SELECT SUM(quantity) FROM ${lineTable} l WHERE l.${fk}=o.id) AS units${po?`,(SELECT SUM(received) FROM ${lineTable} l WHERE l.${fk}=o.id) AS received`:''} FROM ${table} o WHERE ${where} ORDER BY ${order},o.id LIMIT 30 OFFSET ?`,...args,(current-1)*30);
 const summary=await all(db,`SELECT status,COUNT(*) AS count FROM ${table} WHERE location=? GROUP BY status`,at);
 return {records:rows,total,pages,page:current,summary,locations:inventoryLocations,location:at};
}
export async function operationDetail(db,id,kind,canPurchasing=false){
 const po=kind==='purchases',record=await one(db,`SELECT * FROM ${po?'purchase_orders':'stock_jobs'} WHERE id=?`,id);if(!record)throw fail(404,po?'Purchase order not found.':'Job not found.');
 const lines=await all(db,`SELECT l.product_id AS productId,l.quantity,${po?'l.received':'l.used'},p.title,COALESCE(json_extract(p.data_json,'$.supplierSku'),'') AS sku${po&&canPurchasing?',l.unit_cost_cents AS unitCostCents':''} FROM ${po?'purchase_order_lines':'stock_job_lines'} l JOIN master_products p ON p.id=l.product_id WHERE ${po?'l.order_id':'l.job_id'}=? ORDER BY p.title COLLATE NOCASE`,id);
 // Audit payloads can contain purchasing costs; receiving staff see only receipts.
 const activity=await all(db,`SELECT id,action,actor,created_at,json_extract(payload,'$.reference') AS reference,json_extract(payload,'$.note') AS note${po?",CASE WHEN action='PO_RECEIVED' THEN json_extract(payload,'$.lines') ELSE NULL END AS lines":''} FROM master_audit WHERE subject_id=? ORDER BY created_at DESC,id DESC LIMIT 40`,id);
 return {record,lines,activity:activity.map(row=>({...row,...(row.lines?{lines:JSON.parse(row.lines)}:{})}))};
}
export async function createPurchase(db,input,key,actor){
 const clean={supplier:text(input.supplier,160,true),location:location(input.location),notes:text(input.notes||'',500),expectedOn:input.expectedOn||null,lines:linesOf(input.lines,{cost:true})};
 if(clean.expectedOn&&(typeof clean.expectedOn!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(clean.expectedOn)||!Number.isFinite(Date.parse(clean.expectedOn))||new Date(clean.expectedOn).toISOString().slice(0,10)!==clean.expectedOn))throw fail(422,'Choose a valid expected date.');
 const entityId=crypto.randomUUID(),encoded=JSON.stringify(clean.lines);
 return command(db,'PO_CREATED',clean,key,actor,entityId,physicalLines,[encoded],({gate,gateArgs,time})=>[
  db.prepare(`INSERT INTO purchase_orders (id,number,supplier,location,status,revision,expected_on,notes,created_by,created_at,updated_at) SELECT ?,?,?,?,'DRAFT',1,?,?,?,?,? WHERE ${gate}`).bind(entityId,number('PO',entityId),clean.supplier,clean.location,clean.expectedOn,clean.notes,actor,time,time,...gateArgs),
  db.prepare(`INSERT OR IGNORE INTO purchase_order_lines (order_id,product_id,quantity,received,unit_cost_cents) SELECT ?,json_extract(value,'$.productId'),json_extract(value,'$.quantity'),0,json_extract(value,'$.unitCostCents') FROM json_each(?) WHERE ${gate}`).bind(entityId,encoded,...gateArgs)
 ]);
}
export async function purchaseAction(db,id,input,key,actor){
 const action=input.action,rev=revision(input.revision);if(!['ORDER','CANCEL','EDIT'].includes(action))throw fail(422,'Choose an order action.');
 if(action==='EDIT'){
  const clean={revision:rev,supplier:text(input.supplier,160,true),notes:text(input.notes||'',500),expectedOn:input.expectedOn||null,lines:linesOf(input.lines,{cost:true})};
  if(clean.expectedOn&&(typeof clean.expectedOn!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(clean.expectedOn)||!Number.isFinite(Date.parse(clean.expectedOn))||new Date(clean.expectedOn).toISOString().slice(0,10)!==clean.expectedOn))throw fail(422,'Choose a valid expected date.');
  const encoded=JSON.stringify(clean.lines),eligible="EXISTS(SELECT 1 FROM purchase_orders WHERE id=? AND revision=? AND status='DRAFT')";
  return command(db,'PO_EDITED',clean,key,actor,id,`${eligible} AND ${physicalLines}`,[id,rev,encoded],({gate,gateArgs,time})=>[
   db.prepare(`DELETE FROM purchase_order_lines WHERE order_id=? AND ${gate} AND ${eligible}`).bind(id,...gateArgs,id,rev),
   db.prepare(`INSERT INTO purchase_order_lines (order_id,product_id,quantity,received,unit_cost_cents) SELECT ?,json_extract(value,'$.productId'),json_extract(value,'$.quantity'),0,json_extract(value,'$.unitCostCents') FROM json_each(?) WHERE ${gate} AND ${eligible}`).bind(id,encoded,...gateArgs,id,rev),
   db.prepare(`UPDATE purchase_orders SET supplier=?,notes=?,expected_on=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND status='DRAFT' AND ${gate}`).bind(clean.supplier,clean.notes,clean.expectedOn,time,id,rev,...gateArgs)
  ]);
 }
 const clean={revision:rev,note:text(input.note||'',300,action==='CANCEL')},eligible=`EXISTS(SELECT 1 FROM purchase_orders WHERE id=? AND revision=? AND status IN (${action==='ORDER'?"'DRAFT'":"'DRAFT','ORDERED','PARTIAL'"}))`;
 return command(db,action==='ORDER'?'PO_ORDERED':'PO_CANCELLED',clean,key,actor,id,eligible,[id,rev],({gate,gateArgs,time})=>[
  db.prepare(`UPDATE purchase_orders SET status=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND ${gate}`).bind(action==='ORDER'?'ORDERED':'CANCELLED',time,id,rev,...gateArgs)
 ]);
}
export async function receivePurchase(db,id,input,key,actor){
 const clean={revision:revision(input.revision),reference:text(input.reference||'',150),lines:linesOf(input.lines)};const encoded=JSON.stringify(clean.lines);
 const eligible=`${currentOrder} AND NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN purchase_order_lines l ON l.order_id=? AND l.product_id=json_extract(j.value,'$.productId') LEFT JOIN master_products p ON p.id=l.product_id WHERE l.product_id IS NULL OR l.received+json_extract(j.value,'$.quantity')>l.quantity OR COALESCE(json_extract(p.data_json,'$.stockType'),'')<>'STOCKED')`;
 return command(db,'PO_RECEIVED',clean,key,actor,id,eligible,[id,clean.revision,encoded,id],({gate,gateArgs,time,commandId})=>[
  db.prepare(`INSERT OR IGNORE INTO inventory_movements (id,event_key,fingerprint,product_id,location,kind,onhand_delta,reserved_delta,reference,actor,reason,created_at) SELECT ?||':'||json_extract(j.value,'$.productId'),?||':'||json_extract(j.value,'$.productId'),?,json_extract(j.value,'$.productId'),o.location,'RECEIVE',json_extract(j.value,'$.quantity'),0,'po:'||o.id,?,'Purchase order received'||CASE WHEN ?<>'' THEN ': '||? ELSE '' END,? FROM json_each(?) j JOIN purchase_orders o ON o.id=? WHERE ${gate} AND ${currentOrder}`).bind(commandId,commandId,commandId,actor,clean.reference,clean.reference,time,encoded,id,...gateArgs,id,clean.revision),
  db.prepare(`UPDATE purchase_order_lines SET received=received+(SELECT json_extract(value,'$.quantity') FROM json_each(?) WHERE json_extract(value,'$.productId')=purchase_order_lines.product_id) WHERE order_id=? AND product_id IN (SELECT json_extract(value,'$.productId') FROM json_each(?)) AND ${gate} AND ${currentOrder}`).bind(encoded,id,encoded,...gateArgs,id,clean.revision),
  db.prepare(`UPDATE purchase_orders SET status=CASE WHEN EXISTS(SELECT 1 FROM purchase_order_lines WHERE order_id=? AND received<quantity) THEN 'PARTIAL' ELSE 'RECEIVED' END,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND ${gate}`).bind(id,time,id,clean.revision,...gateArgs)
 ]);
}
export async function createJob(db,input,key,actor){
 const clean={title:text(input.title,160,true),vehicle:text(input.vehicle||'',160),location:location(input.location),notes:text(input.notes||'',500),lines:linesOf(input.lines)},entityId=crypto.randomUUID(),encoded=JSON.stringify(clean.lines);
 return command(db,'JOB_CREATED',clean,key,actor,entityId,availableLines,[encoded,clean.location,clean.location,clean.location],ctx=>[
  db.prepare(`INSERT INTO stock_jobs (id,number,title,vehicle,location,status,revision,notes,created_by,created_at,updated_at) SELECT ?,?,?,?,?,'OPEN',1,?,?,?,? WHERE ${ctx.gate}`).bind(entityId,number('JOB',entityId),clean.title,clean.vehicle,clean.location,clean.notes,actor,ctx.time,ctx.time,...ctx.gateArgs),
  ...reserveParts(db,clean.lines,clean.location,ctx)
 ]);
}
function reserveParts(db,lines,at,{gate,gateArgs,time,commandId,entityId,actor},rev=null){
 const encoded=JSON.stringify(lines),eligible=rev===null?'1':currentJob,args=rev===null?[]:[entityId,rev];
 return [
  db.prepare(`INSERT OR IGNORE INTO inventory_movements (id,event_key,fingerprint,product_id,location,kind,onhand_delta,reserved_delta,reference,actor,reason,created_at) SELECT ?||':'||json_extract(value,'$.productId'),?||':'||json_extract(value,'$.productId'),?,json_extract(value,'$.productId'),?,'RESERVE',0,json_extract(value,'$.quantity'),?,?,?,? FROM json_each(?) WHERE ${gate} AND ${eligible}`).bind(commandId,commandId,commandId,at,`job:${entityId}`,actor,'Parts reserved for job',time,encoded,...gateArgs,...args),
  db.prepare(`INSERT INTO stock_job_lines (job_id,product_id,quantity,used) SELECT ?,json_extract(value,'$.productId'),json_extract(value,'$.quantity'),NULL FROM json_each(?) WHERE ${gate} AND ${eligible} ON CONFLICT(job_id,product_id) DO UPDATE SET quantity=quantity+excluded.quantity`).bind(entityId,encoded,...gateArgs,...args)
 ];
}
export async function addJobParts(db,id,input,key,actor){
 const clean={revision:revision(input.revision),lines:linesOf(input.lines)},row=await one(db,'SELECT location FROM stock_jobs WHERE id=?',id);if(!row)throw fail(404,'Job not found.');const encoded=JSON.stringify(clean.lines);
 return command(db,'JOB_PARTS_ADDED',clean,key,actor,id,`${currentJob} AND ${availableLines} AND (SELECT COUNT(*) FROM stock_job_lines WHERE job_id=?)+(SELECT COUNT(*) FROM json_each(?) j WHERE NOT EXISTS(SELECT 1 FROM stock_job_lines l WHERE l.job_id=? AND l.product_id=json_extract(j.value,'$.productId')))<=25 AND NOT EXISTS(SELECT 1 FROM json_each(?) j JOIN stock_job_lines l ON l.job_id=? AND l.product_id=json_extract(j.value,'$.productId') WHERE l.quantity+json_extract(j.value,'$.quantity')>1000000)`,[id,clean.revision,encoded,row.location,row.location,row.location,id,encoded,id,encoded,id],ctx=>[
  ...reserveParts(db,clean.lines,row.location,ctx,clean.revision),
  db.prepare(`UPDATE stock_jobs SET revision=revision+1,updated_at=? WHERE id=? AND revision=? AND ${ctx.gate}`).bind(ctx.time,id,clean.revision,...ctx.gateArgs)
 ]);
}
export async function finishJob(db,id,input,key,actor){
 const cancel=input.action==='CANCEL';if(!cancel&&input.action!=='COMPLETE')throw fail(422,'Choose complete or cancel.');
 const clean={revision:revision(input.revision),note:text(input.note||'',300,cancel),lines:cancel?[]:linesOf(input.lines,{zero:true})};const encoded=JSON.stringify(clean.lines);
 // Completion must account for every held part, including zero used. Manual stock
 // actions cannot release the protected job: reference. Unused units are released.
 const eligible=`${currentJob} AND NOT EXISTS(SELECT 1 FROM stock_job_lines l JOIN stock_jobs o ON o.id=l.job_id WHERE l.job_id=? AND (COALESCE((SELECT SUM(reserved_delta) FROM inventory_movements WHERE product_id=l.product_id AND location=o.location AND reference='job:'||o.id),0)<>l.quantity OR COALESCE((SELECT SUM(onhand_delta) FROM inventory_movements WHERE product_id=l.product_id AND location=o.location),0)<l.quantity))${cancel?'':` AND (SELECT COUNT(*) FROM stock_job_lines WHERE job_id=?)=json_array_length(?) AND NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN stock_job_lines l ON l.job_id=? AND l.product_id=json_extract(j.value,'$.productId') WHERE l.product_id IS NULL OR json_extract(j.value,'$.quantity')>l.quantity)`}`;
 const args=[id,clean.revision,id,...(cancel?[]:[id,encoded,encoded,id])];
 return command(db,cancel?'JOB_CANCELLED':'JOB_COMPLETED',clean,key,actor,id,eligible,args,({gate,gateArgs,time,commandId})=>[
  db.prepare(`INSERT OR IGNORE INTO inventory_movements (id,event_key,fingerprint,product_id,location,kind,onhand_delta,reserved_delta,reference,actor,reason,created_at) SELECT ?||':'||l.product_id,?||':'||l.product_id,?,l.product_id,o.location,?,${cancel?'0':"-(SELECT json_extract(value,'$.quantity') FROM json_each(?) WHERE json_extract(value,'$.productId')=l.product_id)"},-l.quantity,'job:'||o.id,?,?,? FROM stock_job_lines l JOIN stock_jobs o ON o.id=l.job_id WHERE l.job_id=? AND ${gate} AND ${currentJob}`).bind(commandId,commandId,commandId,cancel?'RELEASE':'JOB_USE',...(cancel?[]:[encoded]),actor,cancel?`Job cancelled: ${clean.note}`:`Job completed${clean.note?': '+clean.note:''}`,time,id,...gateArgs,id,clean.revision),
  db.prepare(`UPDATE stock_job_lines SET used=${cancel?'0':"(SELECT json_extract(value,'$.quantity') FROM json_each(?) WHERE json_extract(value,'$.productId')=stock_job_lines.product_id)"} WHERE job_id=? AND ${gate} AND ${currentJob}`).bind(...(cancel?[]:[encoded]),id,...gateArgs,id,clean.revision),
  db.prepare(`UPDATE stock_jobs SET status=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND ${gate}`).bind(cancel?'CANCELLED':'COMPLETE',time,id,clean.revision,...gateArgs)
 ]);
}
