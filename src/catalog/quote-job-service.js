import {inventoryLocations} from './inventory-service.js';
import {command,reserveParts,addJobParts} from './operations-service.js';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const number=(prefix,id)=>`${prefix}-${id.slice(0,8).toUpperCase()}`;
const atLocation=value=>{if(!inventoryLocations.includes(value))throw fail(422,'Choose a shop location.');return value;};
const validQty=value=>Number.isSafeInteger(value)&&value>0&&value<=1000000;
const linked=async(db,id)=>{
 const job=await one(db,'SELECT j.* FROM quote_job_handoffs h JOIN stock_jobs j ON j.id=h.job_id WHERE h.quote_id=?',id);
 if(!job)return null;
 return {job,purchases:await all(db,'SELECT o.id,o.number,o.supplier,o.status FROM job_purchase_orders p JOIN purchase_orders o ON o.id=p.order_id WHERE p.job_id=?',job.id)};
};
async function stockRow(db,id,at){
 return one(db,`SELECT p.id,p.revision,p.state,p.data_json,COALESCE((SELECT SUM(onhand_delta) FROM inventory_movements WHERE product_id=p.id AND location=?),0) AS onhand,COALESCE((SELECT SUM(reserved_delta) FROM inventory_movements WHERE product_id=p.id AND location=?),0) AS reserved,(SELECT COUNT(*) FROM inventory_movements WHERE product_id=p.id AND location=? AND kind='COUNT') AS counted,COALESCE((SELECT SUM(l.quantity-l.received) FROM purchase_order_lines l JOIN purchase_orders o ON o.id=l.order_id WHERE l.product_id=p.id AND o.location=? AND o.status IN ('ORDERED','PARTIAL')),0) AS incoming FROM master_products p WHERE p.id=?`,at,at,at,at,id);
}
export async function quotePreparation(db,quoteId,at=inventoryLocations[0]){
 atLocation(at);const row=await one(db,'SELECT snapshot_json FROM package_quotes WHERE id=?',quoteId);if(!row)throw fail(404,'Quote not found.');
 const snapshot=JSON.parse(row.snapshot_json),q=snapshot.customer,existing=await linked(db,quoteId),issues=[],lines=[],services=[];
 if(q.draft)issues.push('Use a saved customer quote from a published package. Draft previews cannot become jobs.');
 if(q.fulfillment!=='installed')issues.push('This is a parts-only quote. Prepare an installed quote before creating an installation job.');
 const combined=new Map();
 for(const item of snapshot.shop.lines){if(!validQty(item.quantity)){issues.push(`Confirm the quantity for ${item.title}.`);continue;}
  const previous=combined.get(item.productId);if(previous&&previous.productRevision!==item.productRevision)issues.push(`Review conflicting versions of ${item.title}.`);
  combined.set(item.productId,previous?{...previous,quantity:previous.quantity+item.quantity}:{...item});
 }
 if(combined.size>25)issues.push('Split this build into jobs of up to 25 different parts.');
 for(const item of combined.values()){
  const p=await stockRow(db,item.productId,at),d=p?JSON.parse(p.data_json):{};
  if(!p||p.state==='RETIRED'||p.revision!==item.productRevision)issues.push(`${item.title} changed since this quote. Review the part and save a new quote.`);
  if(!validQty(item.quantity))issues.push(`Review the total quantity for ${item.title}.`);
  if(d.stockType==='SERVICE'){services.push({productId:item.productId,title:item.title,quantity:item.quantity,revision:p.revision,state:p.state});continue;}
  if(d.stockType!=='STOCKED')issues.push(`${item.title}: confirm its inventory classification in Parts before preparing this job.`);
  const available=p?.counted?Math.max(0,p.onhand-p.reserved):null;
  if(available===null)issues.push(`Count ${item.title} at ${at} before reserving or ordering a shortage.`);
  const supply=await one(db,'SELECT data_json FROM product_supply WHERE product_id=?',item.productId),supplier=(supply?JSON.parse(supply.data_json).supplier:null)||d.supplier||item.supplier||'';
  lines.push({productId:item.productId,title:item.title,sku:d.supplierSku||item.supplierSku||'',quantity:item.quantity,supplier,available,reserve:available===null?0:Math.min(available,item.quantity),shortage:available===null?null:Math.max(0,item.quantity-available),incoming:p?.incoming||0,revision:p?.revision??null,state:p?.state??null,stockType:d.stockType||'UNREVIEWED',onhand:p?.onhand??0,reserved:p?.reserved??0,counted:p?.counted??0});
 }
 if(!lines.length)issues.push('This quote needs at least one stocked part to prepare an inventory job.');
 const token=await hash(JSON.stringify({quoteId,at,lines,services}));
 return {quoteId,quoteNumber:q.number,title:q.title,vehicle:[q.vehicle.year,q.vehicle.make,q.vehicle.model].join(' '),variant:q.variantLabel,location:at,locations:inventoryLocations,lines,services,issues:[...new Set(issues)],reviewToken:token,existing,installNotes:snapshot.shop.installNotes,fitmentNotes:q.fitmentNotes};
}
// Recheck the reviewed stock and product revisions inside the same transaction
// that creates the job, holds stock and creates internal purchase-order drafts.
function unchanged(){
 return `NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN master_products p ON p.id=json_extract(j.value,'$.productId') WHERE p.id IS NULL OR p.revision<>json_extract(j.value,'$.revision') OR p.state<>json_extract(j.value,'$.state') OR COALESCE(json_extract(p.data_json,'$.stockType'),'')<>json_extract(j.value,'$.stockType') OR COALESCE((SELECT SUM(onhand_delta) FROM inventory_movements WHERE product_id=p.id AND location=?),0)<>json_extract(j.value,'$.onhand') OR COALESCE((SELECT SUM(reserved_delta) FROM inventory_movements WHERE product_id=p.id AND location=?),0)<>json_extract(j.value,'$.reserved') OR (SELECT COUNT(*) FROM inventory_movements WHERE product_id=p.id AND location=? AND kind='COUNT')<>json_extract(j.value,'$.counted'))`;
}
export async function prepareQuoteJob(db,quoteId,input,key,actor,canPurchasing){
 const at=atLocation(input.location);if(input.confirmed!==true)throw fail(422,'Confirm the vehicle, installation scope and parts before preparing the job.');
 if(!Array.isArray(input.orders)||input.orders.length>25)throw fail(422,'Review the purchase-order lines.');
 if(input.orders.length&&!canPurchasing)throw fail(403,'Purchasing access is required to create purchase-order drafts. You can prepare the job without orders.');
 const existing=await linked(db,quoteId);if(existing)return {...existing,reused:true};
 const plan=await quotePreparation(db,quoteId,at);if(plan.issues.length)throw fail(422,plan.issues[0]);
 if(input.reviewToken!==plan.reviewToken)throw fail(409,'Stock or part details changed. Refresh availability and review the handoff again.');
 const seen=new Set(),groups=new Map();
 for(const item of input.orders){
  const line=plan.lines.find(l=>l.productId===item.productId);
  if(!line||seen.has(item.productId)||!validQty(item.quantity)||item.quantity>line.shortage)throw fail(422,'Order only the reviewed shortage, once per part.');
  if(!line.sku)throw fail(422,`Add a supplier SKU for ${line.title} before drafting its purchase order.`);
  if(typeof item.supplier!=='string'||!item.supplier.trim()||item.supplier.trim().length>160)throw fail(422,`Choose a supplier for ${line.title}.`);
  seen.add(item.productId);const supplier=item.supplier.trim(),groupKey=supplier.toLowerCase();
  if(!groups.has(groupKey))groups.set(groupKey,{id:crypto.randomUUID(),supplier,lines:[]});groups.get(groupKey).lines.push({productId:line.productId,quantity:item.quantity});
 }
 const orders=[...groups.values()],jobId=crypto.randomUUID(),clean={quoteId,location:at,reviewToken:input.reviewToken,confirmed:true,orders:input.orders},held=plan.lines.filter(l=>l.reserve>0).map(l=>({productId:l.productId,quantity:l.reserve})),encoded=JSON.stringify(plan.lines);
 const condition=`NOT EXISTS(SELECT 1 FROM quote_job_handoffs WHERE quote_id=?) AND ${unchanged()} AND NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN master_products p ON p.id=json_extract(j.value,'$.productId') WHERE p.id IS NULL OR p.revision<>json_extract(j.value,'$.revision') OR p.state<>json_extract(j.value,'$.state') OR COALESCE(json_extract(p.data_json,'$.stockType'),'')<>'SERVICE')`;
 try{
  await command(db,'QUOTE_JOB_PREPARED',clean,key,actor,jobId,condition,[quoteId,encoded,at,at,at,JSON.stringify(plan.services)],ctx=>{
   const {gate,gateArgs,time}=ctx,statements=[
    db.prepare(`INSERT INTO stock_jobs (id,number,title,vehicle,location,status,revision,notes,created_by,created_at,updated_at) SELECT ?,?,?,?,?,'OPEN',1,?,?,?,? WHERE ${gate}`).bind(jobId,number('JOB',jobId),plan.title.slice(0,160),plan.vehicle,at,`Prepared from ${plan.quoteNumber}. ${plan.variant||''}`.trim(),actor,time,time,...gateArgs),
    db.prepare(`INSERT INTO quote_job_handoffs (quote_id,job_id,created_by,created_at) SELECT ?,?,?,? WHERE ${gate}`).bind(quoteId,jobId,actor,time,...gateArgs),
    db.prepare(`INSERT INTO job_requirements (job_id,product_id,quantity) SELECT ?,json_extract(value,'$.productId'),json_extract(value,'$.quantity') FROM json_each(?) WHERE ${gate}`).bind(jobId,encoded,...gateArgs),
    ...reserveParts(db,held,at,ctx)
   ];
   for(const order of orders){statements.push(
    db.prepare(`INSERT INTO purchase_orders (id,number,supplier,location,status,revision,expected_on,notes,created_by,created_at,updated_at) SELECT ?,?,?,?,'DRAFT',1,NULL,?,?,?,? WHERE ${gate}`).bind(order.id,number('PO',order.id),order.supplier,at,`Shortages for ${number('JOB',jobId)} · ${plan.quoteNumber}. Confirm supplier, cost and delivery before ordering.`,actor,time,time,...gateArgs),
    db.prepare(`INSERT INTO purchase_order_lines (order_id,product_id,quantity,received,unit_cost_cents) SELECT ?,json_extract(value,'$.productId'),json_extract(value,'$.quantity'),0,NULL FROM json_each(?) WHERE ${gate}`).bind(order.id,JSON.stringify(order.lines),...gateArgs),
    db.prepare(`INSERT INTO job_purchase_orders (order_id,job_id) SELECT ?,? WHERE ${gate}`).bind(order.id,jobId,...gateArgs),
    db.prepare(`INSERT INTO master_audit (id,subject_id,action,actor,payload,created_at) SELECT ?,?,'PO_CREATED',?,?,? WHERE ${gate}`).bind(crypto.randomUUID(),order.id,actor,JSON.stringify({quoteId,jobId,note:'Internal draft from quote shortages; no order sent.'}),time,...gateArgs)
   );}
   return statements;
  },'Stock changed while saving. Refresh availability; no partial handoff was applied.');
 }catch(error){const winner=await linked(db,quoteId);if(winner)return {...winner,reused:true};throw error;}
 return {...await linked(db,quoteId),reused:false};
}
export async function reserveMissingJobParts(db,jobId,input,key,actor){
 if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{32,96}$/.test(key))throw fail(400,'A valid action key is required.');
 const receipt=await one(db,'SELECT action,actor,payload FROM master_audit WHERE id=?',await hash(key));
 if(receipt){const saved=JSON.parse(receipt.payload);if(receipt.action!=='JOB_PARTS_ADDED'||receipt.actor!==actor||saved.entityId!==jobId||saved.missingOnly!==true||saved.revision!==input.revision)throw fail(409,'This action key belongs to a different change.');return {id:jobId,reused:true};}
 const job=await one(db,"SELECT * FROM stock_jobs WHERE id=? AND status='OPEN'",jobId);if(!job)throw fail(409,'This job is no longer open.');
 if(job.revision!==input.revision)throw fail(409,'This job changed. Reopen it before reserving parts.');
 const required=await all(db,'SELECT r.product_id AS productId,r.quantity-COALESCE(l.quantity,0) AS missing FROM job_requirements r LEFT JOIN stock_job_lines l ON l.job_id=r.job_id AND l.product_id=r.product_id WHERE r.job_id=?',jobId),lines=[];
 for(const row of required){if(row.missing<=0)continue;const p=await stockRow(db,row.productId,job.location);if(!p?.counted)continue;const n=Math.min(row.missing,Math.max(0,p.onhand-p.reserved));if(n>0)lines.push({productId:row.productId,quantity:n});}
 if(!lines.length)throw fail(409,'No missing parts are available yet. Receive the delivery or count stock, then refresh the job.');
 return addJobParts(db,jobId,{revision:input.revision,lines},key,actor,{missingOnly:true});
}
