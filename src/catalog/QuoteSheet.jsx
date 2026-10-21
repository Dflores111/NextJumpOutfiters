import React,{useState} from 'react';
import {Download,ClipboardList,FileText,Check,ArrowRight} from 'lucide-react';
import {moneyLabel,quoteDocument,quoteDate} from './package-domain.js';
import {hoursFor} from './variant-domain.js';
import {inquiry} from '../routes.js';
export function downloadQuote(record,kind){
 const blob=new Blob([quoteDocument(record,kind)],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`Next-Jump-${record.customer.number.replace(/\W+/g,'-')}-${kind==='shop'?'Install-Brief':'Build-Quote'}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function QuoteSheet({record,staff=false}){
 const [view,setView]=useState('customer'),q=record.customer,shop=staff&&view==='shop',brief=record.shop;
 return <section className="package-quote-sheet" aria-label={shop?'Order and install job brief':'Customer build quote rundown'}>
  {staff&&<div className="package-segments" aria-label="Quote output"><button type="button" aria-pressed={!shop} onClick={()=>setView('customer')}><FileText size={18}/>Customer rundown</button><button type="button" aria-pressed={shop} onClick={()=>setView('shop')}><ClipboardList size={18}/>Shop job brief</button></div>}
  <div className="package-quote-heading"><div><span className="package-kicker">{q.draft?'Draft for review':q.number}</span><h2>{shop?'Ready for the shop.':'Your build, in one place.'}</h2><p>{q.title}{q.variantLabel?' · '+q.variantLabel:''} · {q.vehicle.year} {q.vehicle.make} {q.vehicle.model}</p></div><button type="button" onClick={()=>downloadQuote(record,shop?'shop':'customer')}><Download size={19}/>Download {shop?'job brief':'quote'}</button></div>
  <div className="package-price-bar"><div><span>{q.draft?'Draft estimate':'Estimated '+(q.fulfillment==='installed'?'installed':'parts-only')+' total'}</span><strong>{moneyLabel(q.totals.totalCents)}</strong><p>Before tax and freight. Vehicle confirmation required.</p></div><div><span>Parts <b>{moneyLabel(q.totals.partsCents)}</b></span>{q.fulfillment==='installed'&&<><span>Labor <b>{moneyLabel(q.totals.laborCents)}</b></span><span>Alignment <b>{moneyLabel(q.totals.alignmentCents)}</b></span></>}</div></div>
  <div className="package-output-lines">{(shop?brief.lines:q.lines).map((line,i)=><article key={line.productId||i}><div><strong>{line.title}</strong><span>{line.role}{shop&&` · ${line.supplierSku||'Part number needs confirmation'}`}</span>{shop&&<p>{line.supplier||'Supplier not specified'} · {line.available===null?'Shop stock needs a count':`${line.available} available at Tacoma`}<br/>Distributor stock: {line.supply.quantity===null?'Not confirmed':`${line.supply.quantity} reported · ${line.supply.checkedAt?.slice(0,10)}`} · {line.supply.fulfillment.replaceAll('_',' ').toLowerCase()}</p>}</div><span className="package-line-qty">{line.quantity===null?'Confirm qty':`× ${line.quantity}`}</span>{!shop&&<strong>{moneyLabel(line.quantity===null||line.unitRetailCents===null?null:line.quantity*line.unitRetailCents)}</strong>}</article>)}</div>
  {shop&&<div className="package-note"><h3>Before ordering or installation</h3><p>Stock snapshot: {quoteDate(brief.stockAsOf)}. Confirm current availability before ordering.</p><p>{brief.installNotes}</p><p>Labor allowance: {hoursFor(brief.labor)??'Confirm'} hours. This brief does not reserve stock, place a supplier order or complete a job.</p></div>}
  <div className="package-note"><Check size={22}/><div><h3>Confirm the truck, then the appointment.</h3><p>{q.fitmentNotes||'The shop needs to confirm factory suspension, trim, tire clearance and the vehicle’s load.'}</p><p>Not included: {q.excludes.join(', ')}.</p></div></div>
  {!staff&&!q.draft&&<a className="button button-primary" data-priority="quote" data-ambient="" href={inquiry('service',{service:'suspension',packageQuote:record.id})}>Confirm my build & appointment <ArrowRight size={19}/></a>}
 </section>;
}
