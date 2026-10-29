import React,{useState} from 'react';
import {Download,ClipboardList,FileText,ShoppingCart,Check,ArrowRight} from 'lucide-react';
import {moneyLabel,quoteDocument,quoteDate} from './package-domain.js';
import {hoursFor} from './variant-domain.js';
import {inquiry} from '../routes.js';
import './packages.css';
export function downloadQuote(record,kind){
 const blob=new Blob([quoteDocument(record,kind)],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`Next-Jump-${record.customer.number.replace(/\W+/g,'-')}-${kind==='shop'?'Install-Brief':kind==='purchasing'?'Purchasing-List':'Build-Quote'}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function QuoteSheet({record,staff=false}){
 const [view,setView]=useState('customer'),q=record.customer,internal=staff&&view!=='customer',shop=staff&&view==='shop',purchasing=staff&&view==='purchasing',brief=record.shop;
 return <section className="package-quote-sheet" aria-label={shop?'Installation brief':purchasing?'Purchasing list':'Customer build quote rundown'}>
  {staff&&<div className="package-segments" aria-label="Quote output"><button type="button" aria-pressed={view==='customer'} onClick={()=>setView('customer')}><FileText size={18}/>Customer rundown</button><button type="button" aria-pressed={purchasing} onClick={()=>setView('purchasing')}><ShoppingCart size={18}/>Purchasing list</button><button type="button" aria-pressed={shop} onClick={()=>setView('shop')}><ClipboardList size={18}/>Installation brief</button></div>}
  <div className="package-quote-heading"><div><span className="package-kicker">{q.draft?'Draft for review':q.number}</span><h2>{shop?'What to install.':purchasing?'What to order.':staff?'What the customer gets.':'What you get.'}</h2><p>{q.title}{q.variantLabel?' · '+q.variantLabel:''} · {q.vehicle.year} {q.vehicle.make} {q.vehicle.model}</p></div><button type="button" onClick={()=>downloadQuote(record,view)}><Download size={19}/>Download {shop?'install brief':purchasing?'parts list':'quote'}</button></div>
  {!internal&&q.description&&<p>{q.description}</p>}
  {!internal&&q.media?.length>0&&<div className="package-output-images">{q.media.map((m,i)=><img key={i} src={m.url} alt={m.alt} referrerPolicy="no-referrer"/>)}</div>}
  {internal&&<p className="package-output-guidance">{purchasing?'Verify supplier codes, quantities and current availability before placing an order.':'Confirm the vehicle configuration, scope and required hardware before beginning work.'} {q.draft?'This draft is for review; it is not a released job.':'This planning brief does not create or complete a job.'}</p>}
  {!internal&&<div className="package-price-bar"><div><span>{q.draft?'Draft estimate':'Estimated '+(q.fulfillment==='installed'?'installed':'parts-only')+' total'}</span><strong>{moneyLabel(q.totals.totalCents)}</strong><p>Before tax and freight. Vehicle confirmation required.</p></div><div><span>Parts <b>{moneyLabel(q.totals.partsCents)}</b></span>{q.fulfillment==='installed'&&<><span>Labor <b>{moneyLabel(q.totals.laborCents)}</b></span><span>Alignment <b>{moneyLabel(q.totals.alignmentCents)}</b></span></>}</div></div>}
  <div className="package-output-lines">{(internal?brief.lines:q.lines).map((line,i)=><article key={line.productId||i}><div><strong>{line.title}</strong><span>{line.role}{internal&&` · ${line.supplierSku||'Part number needs confirmation'}`}</span>{purchasing&&<p>{line.supplier||'Supplier not specified'} · {line.available===null?'Shop stock needs a count':`${line.available} available at Tacoma`}<br/>Distributor stock: {line.supply.quantity===null?'Not confirmed':`${line.supply.quantity} reported · ${line.supply.checkedAt?.slice(0,10)}`} · {line.supply.fulfillment.replaceAll('_',' ').toLowerCase()}</p>}</div><span className="package-line-qty">{line.quantity===null?'Confirm qty':`× ${line.quantity}`}</span>{!internal&&<strong>{moneyLabel(line.quantity===null||line.unitRetailCents===null?null:line.quantity*line.unitRetailCents)}</strong>}</article>)}</div>
  {purchasing&&<p>Stock snapshot: {quoteDate(brief.stockAsOf)}. Unknown stock is not zero. Distributor quantities are separate from counted shop stock.</p>}
  {shop&&<div className="package-note"><h3>Installation scope & preparation</h3><p>{brief.installNotes}</p><p>Labor allowance: {hoursFor(brief.labor)??'Confirm'} hours. This brief does not reserve stock, place a supplier order or complete a job.</p></div>}
  <div className="package-note"><Check size={22}/><div><h3>Confirm the truck, then the appointment.</h3><p>{q.fitmentNotes||'The shop needs to confirm factory suspension, trim, tire clearance and the vehicle’s load.'}</p><p>Not included: {q.excludes.join(', ')}.</p></div></div>
  {!staff&&!q.draft&&<a className="button button-primary" data-priority="quote" data-ambient="" href={inquiry('service',{service:'suspension',packageQuote:record.id})}>Confirm my build & appointment <ArrowRight size={19}/></a>}
 </section>;
}
