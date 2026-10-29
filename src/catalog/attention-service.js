import {canStaff} from './access.js';
import {releaseProblems} from './package-domain.js';
import {inventoryItems,inventoryLocations} from './inventory-service.js';
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const lines=d=>d.variants?d.variants.flatMap(v=>v.lines):d.lines||[];
export async function workspaceAttention(db,identity,params){
 const location=params.get('location')||inventoryLocations[0];
 if(!inventoryLocations.includes(location))throw Object.assign(Error('Choose a shop location.'),{status:422});
 const items=[],limits=[];
 if(canStaff(identity,'catalog')){
  const rows=await all(db,"SELECT c.id,c.title,c.state,c.data_json,c.revision,r.revision AS published_revision,r.data_json AS published_json FROM curated_packages c LEFT JOIN package_releases r ON r.package_id=c.id AND r.active=1 WHERE c.state<>'ARCHIVED' ORDER BY c.updated_at DESC LIMIT 101");
  if(rows.length>100)limits.push('packages');
  const parsed=rows.slice(0,100).map(p=>({...p,data:JSON.parse(p.data_json),published:p.published_json?JSON.parse(p.published_json):null})),ids=[...new Set(parsed.flatMap(p=>[...lines(p.data),...(p.published?lines(p.published):[])].map(l=>l.productId)))];
  const products=ids.length?await all(db,'SELECT id,state,revision FROM master_products WHERE id IN (SELECT value FROM json_each(?))',JSON.stringify(ids)):[],byId=new Map(products.map(p=>[p.id,p]));
  for(const p of parsed){const changed=d=>lines(d).some(l=>!byId.has(l.productId)||byId.get(l.productId).state==='RETIRED'||byId.get(l.productId).revision!==l.productRevision),stale=changed(p.data),publishedStale=p.published&&changed(p.published),problems=[...releaseProblems(p.data),...(stale?['A shared part changed or is unavailable.']:[])];
   if(problems.length||publishedStale||!p.published_revision||p.published_revision!==p.revision)items.push({id:'package:'+p.id,kind:'packages',level:stale||publishedStale?'blocked':'review',title:p.title,detail:publishedStale?'Customer estimate is hidden: a shared part changed. Review the parts and save a draft before releasing the update.':problems.length?`${problems.length} ${problems.length===1?'check':'checks'} to finish. ${problems[0]}`:'Draft is ready for the shop to review.',packageId:p.id,action:'Review package',target:{tab:'packages',package:p.id,task:'review'}});
  }
 }
 if(canStaff(identity,'inventory')){
  const jobs=await all(db,`SELECT j.id,j.number,j.title,SUM(r.quantity-COALESCE(l.quantity,0)) AS missing FROM stock_jobs j JOIN job_requirements r ON r.job_id=j.id LEFT JOIN stock_job_lines l ON l.job_id=j.id AND l.product_id=r.product_id WHERE j.status='OPEN' AND j.location=? AND r.quantity>COALESCE(l.quantity,0) GROUP BY j.id ORDER BY j.updated_at DESC LIMIT 101`,location);
  if(jobs.length>100)limits.push('jobs');
  for(const j of jobs.slice(0,100))items.push({id:'job:'+j.id,kind:'jobs',level:'blocked',title:j.title,detail:`${j.number}: ${j.missing} ${j.missing===1?'unit':'units'} still need to be held for this job.`,action:'Open job',target:{tab:'inventory',area:'jobs',record:j.id,location}});
  const orders=await all(db,"SELECT id,number,supplier,expected_on,status FROM purchase_orders WHERE location=? AND status IN ('DRAFT','ORDERED','PARTIAL') ORDER BY expected_on IS NULL,expected_on,updated_at DESC LIMIT 101",location);
  if(orders.length>100)limits.push('deliveries');
  for(const o of orders.slice(0,100))items.push({id:'order:'+o.id,kind:'deliveries',level:o.status==='DRAFT'?'review':'upcoming',title:o.supplier,detail:o.status==='DRAFT'?`${o.number}: draft only. The supplier order has not been recorded as placed.`:`${o.number}: ${o.expected_on?'expected '+o.expected_on:'delivery date not set'}. ${o.status==='PARTIAL'?'Part of the order is still due.':'Waiting for delivery.'}`,action:'Open order',target:{tab:'inventory',area:'purchasing',record:o.id,location}});
  const stock=await inventoryItems(db,new URLSearchParams({location,pageSize:'1'}));
  for(const [view,title,detail]of [['uncounted','Stock counts needed','items have no confirmed opening count.'],['low','Stock running low','items meet their reorder level.'],['classification','Parts need setup','items need an inventory classification.']])if(stock.facets[view])items.push({id:'stock:'+view,kind:'stock',level:'review',title,detail:`${stock.facets[view]} ${stock.facets[view]===1?detail.replace('items have','item has').replace('items meet','item meets').replace('items need','item needs'):detail}`,action:'View items',target:{tab:'inventory',area:'stock',view,location,q:'',category:'',state:''}});
 }
 return {items,location,locations:canStaff(identity,'inventory')?inventoryLocations:[],limits,updatedAt:new Date().toISOString(),counts:Object.fromEntries(['packages','jobs','deliveries','stock'].map(k=>[k,items.filter(i=>i.kind===k).length]))};
}
