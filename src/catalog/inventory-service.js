// Inventory projections deliberately exclude product costs, prices and source payloads.
const fail=(status,message)=>Object.assign(new Error(message),{status});
const all=async(db,sql,...values)=>(await db.prepare(sql).bind(...values).all()).results;
const one=(db,sql,...values)=>db.prepare(sql).bind(...values).first();
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
export const inventoryLocations=['Tacoma Showroom','Overland Expo Redmond','Online Shop Shipping'];
const views={all:'1',classification:"stockType='UNREVIEWED'",uncounted:"stockType='STOCKED' AND verified=0",low:"stockType='STOCKED' AND verified>0 AND (available<=0 OR (minLevel IS NOT NULL AND available<=minLevel))",reserved:'reserved>0'};
const orders={title:'title COLLATE NOCASE',sku:'sku COLLATE NOCASE',available:'available',updated:'updatedAt',bin:'bin COLLATE NOCASE'};
const base=`WITH ledger AS (
 SELECT product_id,SUM(onhand_delta) AS onhand,SUM(reserved_delta) AS reserved,
 SUM(CASE WHEN kind='COUNT' THEN 1 ELSE 0 END) AS verified,MAX(created_at) AS changed
 FROM inventory_movements WHERE location=? GROUP BY product_id
), items AS (
 SELECT p.id,p.title,p.category,p.state,p.revision AS productRevision,
 COALESCE(json_extract(p.data_json,'$.stockType'),'UNREVIEWED') AS stockType,
 COALESCE(json_extract(p.data_json,'$.supplierSku'),'') AS sku,
 COALESCE(json_extract(p.data_json,'$.manufacturerPartNumber'),'') AS mpn,
 COALESCE((SELECT group_concat(value,' · ') FROM json_each(p.data_json,'$.options') WHERE type='text' AND value<>''),'') AS variant,
 COALESCE(l.verified,0) AS verified,
 CASE WHEN l.verified>0 AND json_extract(p.data_json,'$.stockType')='STOCKED' THEN l.onhand ELSE NULL END AS onhand,
 COALESCE(l.reserved,0) AS reserved,
 CASE WHEN l.verified>0 AND json_extract(p.data_json,'$.stockType')='STOCKED' THEN l.onhand-l.reserved ELSE NULL END AS available,
 s.bin,s.min_level AS minLevel,COALESCE(s.revision,0) AS revision,
 MAX(p.updated_at,COALESCE(l.changed,''),COALESCE(s.updated_at,'')) AS updatedAt
 FROM master_products p LEFT JOIN ledger l ON l.product_id=p.id
 LEFT JOIN inventory_settings s ON s.product_id=p.id AND s.location=?
)`;
function locationOf(value){if(!inventoryLocations.includes(value))throw fail(422,'Choose a shop location.');return value;}
function status(row){if(row.stockType==='UNREVIEWED')return 'classification';if(row.stockType==='SERVICE')return 'service';if(row.stockType==='NON_STOCKED')return 'on-order';if(!row.verified)return 'uncounted';if(row.available<=0)return 'out';if(row.minLevel!==null&&row.available<=row.minLevel)return 'low';return 'ready';}
export async function inventoryItems(db,params){
 const location=locationOf(params.get('location')||inventoryLocations[0]),q=(params.get('q')||'').trim().slice(0,100),view=params.get('view')||'all',sort=params.get('sort')||'title',direction=params.get('direction')||'asc',state=params.get('state')||'',category=(params.get('category')||'').slice(0,200);
 const page=Number(params.get('page')||1),pageSize=Number(params.get('pageSize')||50);
 if(!Object.hasOwn(views,view)||!Object.hasOwn(orders,sort)||!['asc','desc'].includes(direction)||!Number.isSafeInteger(page)||page<1||page>100000||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100||!['','DRAFT','REVIEW','APPROVED','RETIRED'].includes(state))throw fail(422,'Choose valid inventory filters.');
 const filters=[],args=[location,location];
 if(q){filters.push("(title LIKE ? ESCAPE '\\' OR sku LIKE ? ESCAPE '\\' OR mpn LIKE ? ESCAPE '\\' OR variant LIKE ? ESCAPE '\\' OR id=?)");const term=`%${q.replace(/[\\%_]/g,'\\$&')}%`;args.push(term,term,term,term,q);}
 if(category){filters.push('category=?');args.push(category);}if(state){filters.push('state=?');args.push(state);}
 const where=filters.length?filters.join(' AND '):'1';
 const facets=await one(db,`${base} SELECT COUNT(*) AS "all",SUM(CASE WHEN ${views.classification} THEN 1 ELSE 0 END) AS classification,SUM(CASE WHEN ${views.uncounted} THEN 1 ELSE 0 END) AS uncounted,SUM(CASE WHEN ${views.low} THEN 1 ELSE 0 END) AS low,SUM(CASE WHEN ${views.reserved} THEN 1 ELSE 0 END) AS reserved FROM items WHERE ${where}`,...args);
 for(const key of Object.keys(facets))facets[key]??=0;
 const total=facets[view],pages=Math.max(1,Math.ceil(total/pageSize)),currentPage=Math.min(page,pages);
 const rows=await all(db,`${base} SELECT * FROM items WHERE ${where} AND ${views[view]} ORDER BY ${orders[sort]} IS NULL,${orders[sort]} ${direction.toUpperCase()},id ASC LIMIT ? OFFSET ?`,...args,pageSize,(currentPage-1)*pageSize);
 const categories=(await all(db,'SELECT DISTINCT category FROM master_products ORDER BY category COLLATE NOCASE')).map(r=>r.category);
 return {items:rows.map(row=>({...row,status:status(row)})),facets,total,page:currentPage,pages,pageSize,location,locations:inventoryLocations,categories};
}
export async function saveInventorySettings(db,input,key,actor){
 if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{32,96}$/.test(key))throw fail(400,'A valid edit key is required.');
 const location=locationOf(input.location),field=input.field;
 if(!['bin','minLevel'].includes(field)||!Array.isArray(input.items)||!input.items.length||input.items.length>50)throw fail(422,'Choose up to 50 items and a shelf/bin or reorder level to edit.');
 const items=input.items.map(row=>({id:row?.id,revision:row?.revision}));
 if(items.some(row=>typeof row.id!=='string'||!/^[a-zA-Z0-9-]{36}$/.test(row.id)||!Number.isSafeInteger(row.revision)||row.revision<0)||new Set(items.map(row=>row.id)).size!==items.length)throw fail(422,'Choose unique inventory records with current revisions.');
 let value=input.value;
 if(field==='bin'){if(value!==null&&(typeof value!=='string'||value.trim().length>80))throw fail(422,'Shelf/bin must be 80 characters or fewer.');value=value?.trim()||null;}
 else if(value!==null&&(!Number.isSafeInteger(value)||value<0||value>1000000))throw fail(422,'Use a whole reorder level from 0 to 1,000,000, or clear it.');
 items.sort((a,b)=>a.id.localeCompare(b.id));
 const fingerprint=await hash(JSON.stringify({location,field,value,items})),auditId=await hash(key);
 const previous=await one(db,'SELECT actor,payload FROM master_audit WHERE id=?',auditId);
 if(previous){if(previous.actor!==actor||JSON.parse(previous.payload).fingerprint!==fingerprint)throw fail(409,'This edit key belongs to a different change.');return {saved:true,reused:true,count:items.length};}
 const payload=JSON.stringify({location,field,value,items,fingerprint}),time=new Date().toISOString(),itemJson=JSON.stringify(items),column=field==='bin'?'bin':'min_level';
 // One transaction: a stale participant prevents every edit. json_each keeps large
 // selections under D1's parameter limit. Metadata never changes product revisions.
 const results=await db.batch([
  db.prepare(`INSERT OR IGNORE INTO master_audit (id,subject_id,action,actor,payload,created_at)
   SELECT ?,?,'INVENTORY_SETTINGS',?,?,? WHERE NOT EXISTS (
    SELECT 1 FROM json_each(?) j LEFT JOIN master_products p ON p.id=json_extract(j.value,'$.id')
    LEFT JOIN inventory_settings s ON s.product_id=p.id AND s.location=?
    WHERE p.id IS NULL OR COALESCE(s.revision,0)<>json_extract(j.value,'$.revision'))`).bind(auditId,items.length===1?items[0].id:'inventory-bulk',actor,payload,time,itemJson,location),
  db.prepare(`INSERT INTO inventory_settings (product_id,location,bin,min_level,revision,updated_at)
   SELECT json_extract(j.value,'$.id'),?,${field==='bin'?'?':'s.bin'},${field==='minLevel'?'?':'s.min_level'},COALESCE(s.revision,0)+1,?
   FROM json_each(?) j LEFT JOIN inventory_settings s ON s.product_id=json_extract(j.value,'$.id') AND s.location=?
   WHERE COALESCE(s.revision,0)=json_extract(j.value,'$.revision') AND EXISTS (
    SELECT 1 FROM master_audit WHERE id=? AND actor=? AND json_extract(payload,'$.fingerprint')=?)
   ON CONFLICT(product_id,location) DO UPDATE SET ${column}=excluded.${column},revision=excluded.revision,updated_at=excluded.updated_at`).bind(location,value,time,itemJson,location,auditId,actor,fingerprint)
 ]);
 const saved=await one(db,'SELECT actor,payload FROM master_audit WHERE id=?',auditId);
 if(!saved)throw fail(409,'One of these items changed. Refresh the list before trying again; no edits were applied.');
 if(saved.actor!==actor||JSON.parse(saved.payload).fingerprint!==fingerprint)throw fail(409,'This edit key belongs to another change.');
 return {saved:true,reused:results[0].meta?.changes===0,count:items.length};
}
export async function inventoryHistory(db,productId,location){
 locationOf(location);if(!await one(db,'SELECT id FROM master_products WHERE id=?',productId))throw fail(404,'Item not found.');
 const movements=await all(db,'SELECT id,kind,onhand_delta,reserved_delta,reference,reason,actor,created_at FROM inventory_movements WHERE product_id=? AND location=? ORDER BY created_at DESC,id DESC LIMIT 30',productId,location);
 const edits=await all(db,`SELECT a.id,a.actor,a.created_at,json_extract(a.payload,'$.field') AS field,json_extract(a.payload,'$.value') AS value FROM master_audit a WHERE action='INVENTORY_SETTINGS' AND json_extract(payload,'$.location')=? AND EXISTS (SELECT 1 FROM json_each(a.payload,'$.items') j WHERE json_extract(j.value,'$.id')=?) ORDER BY a.created_at DESC,a.id DESC LIMIT 30`,location,productId);
 const productChanges=await all(db,`SELECT id,actor,created_at,json_extract(payload,'$.title') AS title,json_extract(payload,'$.stockType') AS stockType FROM master_audit WHERE subject_id=? AND action='PRODUCT_REVIEW' AND json_type(payload,'$.stockType')='text' ORDER BY created_at DESC,id DESC LIMIT 15`,productId);
 return {movements,edits,productChanges,location};
}
