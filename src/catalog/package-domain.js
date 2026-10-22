// Shared calculations and public projections. No source catalog or private costs.
import {hoursFor,variantsFor,selectVariant} from './variant-domain.js';
import {copyChecks} from './package-workflow.js';
export const packageStates=['DRAFT','PUBLISHED','ARCHIVED'];
export const supplierModes=['UNKNOWN','WAREHOUSE','SPECIAL_ORDER','DROP_SHIP'];
export const stockLabels={UNREVIEWED:'Needs setup',STOCKED:'Stocked inventory',NON_STOCKED:'Non-stocked item',SERVICE:'Service'};
const money=value=>Number.isSafeInteger(value)&&value>=0&&value<=100000000;
export function packageTotals(data,mode='installed'){
 let partsCents=0;const missing=[];
 for(const line of data.lines||[]){
  if(!Number.isSafeInteger(line.quantity)||line.quantity<1||!money(line.unitRetailCents)){missing.push(line.role||'Part');continue;}
  partsCents+=line.quantity*line.unitRetailCents;
 }
 const labor=data.labor||{},hours=hoursFor(labor),minutes=hours!==null?Math.round(hours*60):null;
 const laborCents=minutes!==null&&minutes>=0&&money(labor.rateCents)?Math.round(minutes*labor.rateCents/60):null;
 const alignmentCents=money(labor.alignmentCents)?labor.alignmentCents:null;
 const partsComplete=missing.length===0&&(data.lines?.length||0)>0;
 return {partsCents:partsComplete?partsCents:null,knownPartsCents:partsCents,laborCents,alignmentCents,
  totalCents:partsComplete&&(mode==='diy'||laborCents!==null&&alignmentCents!==null)?partsCents+(mode==='diy'?0:laborCents+alignmentCents):null,missing};
}
export function releaseProblems(data){
 const totals=packageTotals(data),problems=[];
 if(!data.lines?.length)problems.push('Add the package parts.');
 if(totals.missing.length)problems.push('Confirm every part quantity and retail price.');
 if(totals.laborCents===null||totals.alignmentCents===null)problems.push('Confirm labor and alignment, including an explicit zero when not included.');
 if((data.issues||[]).some(issue=>!issue.resolved))problems.push('Resolve the source review items.');
 if(data.diyAllowed&&data.lines?.some(line=>line.installOnly))problems.push('Install-Only parts cannot be offered as a DIY package.');
 if(!data.fitmentNotes?.trim())problems.push('Record the supported factory configuration and exclusions.');
 if(!['parts','pricing','fitment'].every(key=>data.approvals?.[key]===true))problems.push('Confirm parts, pricing and vehicle scope.');
 if(!data.reviewEvidence?.trim())problems.push('Record the review decision.');
 if(data.clonedFrom&&!Object.keys(copyChecks).every(k=>data.cloneReview?.[k]===true))problems.push('Review the inherited fields in this package copy.');
 for(const v of data.variants||[]){if(v.enabled&&v.id!==data.defaultVariantId){const t=packageTotals(v);if(t.totalCents===null)problems.push(`Complete the enabled ${v.label} scope.`);if(data.diyAllowed&&v.lines.some(l=>l.installOnly))problems.push('Install-Only parts cannot be offered as DIY.');}}
 return problems;
}
export function publicPackage(row,{preview=false}={}){
 const data=row.data,totals=packageTotals(data);
 return {id:row.id,revision:row.revision,title:row.title,category:row.category,audience:data.audience,description:data.description,
  vehicle:data.vehicle,useLevel:data.useLevel||null,media:data.media||[],specs:data.specs||{},fitmentNotes:data.fitmentNotes,excludes:data.excludes||[],
  lines:data.lines.map(line=>({title:line.title,role:line.role,quantity:line.quantity,unitRetailCents:line.unitRetailCents})),
  totals,fulfillment:['installed',...(data.diyAllowed?['diy']:[])],
  variants:variantsFor(data).filter(v=>v.enabled).map(v=>({id:v.id,label:v.label,lines:v.lines.map(l=>({title:l.title,role:l.role,quantity:l.quantity,unitRetailCents:l.unitRetailCents})),totals:packageTotals(v)})),defaultVariantId:data.defaultVariantId||'front-rear',
  priceStatus:preview?'DRAFT_PREVIEW':'REVIEWED_ESTIMATE',requiresVehicleConfirmation:true};
}
export function cleanIntake(input,vehicle){
 const year=Number(input?.year);
 if(!Number.isSafeInteger(year)||year<vehicle.yearFrom||year>vehicle.yearTo)throw Object.assign(Error('Choose a year within this package’s reviewed vehicle range.'),{status:422});
 if(!['stock','modified','unsure'].includes(input.suspension)||!['daily','trips','permanent','unsure'].includes(input.use))throw Object.assign(Error('Tell us about your suspension and how you use the truck.'),{status:422});
 return {year,make:vehicle.make,model:vehicle.model,suspension:input.suspension,use:input.use};
}
export const moneyLabel=value=>value===null||value===undefined?'Needs review':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value/100);
export const quoteDate=value=>new Date(value).toLocaleDateString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric'});
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function quoteDocument(record,kind='customer'){
 const purchasing=kind==='purchasing',internal=kind==='shop'||purchasing,q=record.customer,brief=record.shop,t=q.totals;
 const title=purchasing?'What to order':internal?'What to install':'Your build quote rundown';
 const rows=(internal?brief.lines:q.lines).map(l=>`<tr><td>${escape(l.title)}${internal?`<small>${escape(l.supplierSku||'Confirm supplier part number / VIN')}</small>`:''}</td><td>${escape(l.quantity??'Confirm')}</td><td>${purchasing?escape(l.supplier||'Source not confirmed'):internal?escape(l.role):moneyLabel(l.quantity===null||l.unitRetailCents===null?null:l.quantity*l.unitRetailCents)}</td>${purchasing?`<td>${l.available===null?'Count / source first':escape(l.available)+' available'}<small>Distributor: ${l.supply?.quantity==null?'Not confirmed':escape(l.supply.quantity)+' reported'} · ${escape(l.supply?.fulfillment||'UNKNOWN')}</small></td>`:''}</tr>`).join('');
 const price=!internal?`<div class="total"><span>${q.draft?'Draft estimate':'Estimated total'}<small>Before tax and freight</small></span><strong>${moneyLabel(t.totalCents)}</strong></div>`:'';
 const breakdown=!internal?`<p>Parts: ${moneyLabel(t.partsCents)}${q.fulfillment==='installed'?` · Labor: ${moneyLabel(t.laborCents)} · Alignment: ${moneyLabel(t.alignmentCents)}`:''}</p>`:'';
 const photos=!internal?(q.media||[]).map(m=>`<figure><img src="${escape(m.url)}" alt="${escape(m.alt)}" referrerpolicy="no-referrer"><figcaption>${escape(m.alt)}</figcaption></figure>`).join(''):'';
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} ${escape(q.number)}</title><style>body{font:16px/1.55 system-ui,sans-serif;color:#20241d;max-width:900px;margin:48px auto;padding:0 24px}h1{font-size:42px;line-height:1.1;letter-spacing:-1.5px}h2{font-size:24px;margin-top:32px}.brand{font-weight:800;letter-spacing:1px;color:#b34610}.meta{color:#5b6156}.total{padding:24px;border:2px solid #ff7824;border-radius:18px;display:flex;justify-content:space-between;gap:24px;font-size:22px}.total strong{font-size:32px}table{border-collapse:collapse;width:100%;margin:24px 0}td,th{padding:12px 8px;text-align:left;border-bottom:1px solid #d0d3c9;vertical-align:top}small{display:block;color:#5b6156}ul{padding-left:24px}.note{padding:18px;background:#f3f1e9;border-radius:12px}figure{display:inline-block;margin:12px 20px 12px 0;width:230px;vertical-align:top}img{width:100%;aspect-ratio:16/10;object-fit:contain;border-radius:12px}figcaption{font-size:13px;color:#5b6156}@media print{body{margin:0;max-width:none}h2,tr,.total{break-inside:avoid}}</style><body><p class="brand">NEXT JUMP OUTFITTERS</p><h1>${escape(title)}</h1><p class="meta">${escape(q.number)} · ${escape(quoteDate(q.createdAt))} · Package revision ${q.packageRevision}</p><h2>${escape(q.title)}</h2><p>${escape([q.vehicle.year,q.vehicle.make,q.vehicle.model].join(' '))} · ${q.fulfillment==='installed'?'Parts & installation':'Parts only'}${q.variantLabel?' · '+escape(q.variantLabel):''}</p>${!internal&&q.description?'<p>'+escape(q.description)+'</p>':''}${photos}${price}<table><thead><tr><th>Part</th><th>Qty</th><th>${purchasing?'Supplier':internal?'Role in this build':'Line total'}</th>${purchasing?'<th>Shop stock / sourcing</th>':''}</tr></thead><tbody>${rows}</tbody></table>${breakdown}${internal&&!purchasing?`<h2>Install preparation</h2><p>${escape(brief.installNotes)}</p><p>Labor allowance: ${escape(hoursFor(brief.labor)??'Confirm')} hours. Confirm VIN-specific hardware, tire clearance, permanent load and additional rust-related work.</p>`:''}${purchasing?`<p>Stock snapshot: ${escape(quoteDate(brief.stockAsOf))}. Supplier quantities are separate from counted shop stock. Confirm current availability before purchasing.</p>`:''}<h2>Confirm before booking</h2><p>${escape(q.fitmentNotes||'Vehicle configuration and fitment require shop review.')}</p><p>Current suspension: ${escape(q.vehicle.suspension)}. Intended use: ${escape(q.vehicle.use)}.</p><p class="note">${q.draft?'Draft for review. Pricing and package contents are not released. ':''}This is a planning estimate. The shop confirms vehicle fitment, parts availability and the appointment. No parts are reserved and no order has been placed.</p><h2>Not included</h2><ul>${(q.excludes||[]).map(item=>`<li>${escape(item)}</li>`).join('')}</ul><p class="meta">Next Jump Outfitters · Tacoma, WA · (253) 301-0028</p></body></html>`;
}
