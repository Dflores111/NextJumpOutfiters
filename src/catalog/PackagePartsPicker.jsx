import React,{useEffect,useRef,useState} from 'react';
import {Search,Plus,Trash2,RefreshCw,Undo2} from 'lucide-react';
import {api} from './operations-ui.jsx';
import {moneyLabel} from './package-domain.js';
import {partEntryProblems,pickPackagePart} from './package-guidance.js';

const dollars=value=>value==null?'':value/100;
const cents=value=>value===''?null:Math.round(Number(value)*100);

export default function PackagePartsPicker({lines,onChange,priceOnly=false,disabled=false}){
 const [query,setQuery]=useState(''),[matches,setMatches]=useState([]),[searchState,setSearchState]=useState('idle'),[searchError,setSearchError]=useState(''),[replacing,setReplacing]=useState(null),[removed,setRemoved]=useState(null),[notice,setNotice]=useState('');
 const search=useRef(),quantityInputs=useRef(new Map());
 useEffect(()=>{
  if(!query.trim()){setMatches([]);setSearchState('idle');return;}
  const controller=new AbortController();let active=true;
  const timer=setTimeout(async()=>{
   try{const result=await api('products?'+new URLSearchParams({q:query}),'GET',null,null,controller.signal);if(active){setMatches(result.products.filter(p=>p.state!=='RETIRED'));setSearchState('ready');}}
   catch(error){if(active&&error.name!=='AbortError'){setSearchError(error.message);setSearchState('error');}}
  },180);
  return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[query]);
 function find(value){setQuery(value);setMatches([]);setSearchError('');setSearchState(value.trim()?'loading':'idle');}
 function changeLine(index,patch){onChange(lines.map((line,i)=>i===index?{...line,...patch}:line));setNotice('');}
 function choose(product){
  const previous=lines.find(line=>line.productId===replacing),next=pickPackagePart(lines,product,replacing);
  if(next===lines)return;
  onChange(next);setNotice(previous?`Replaced ${previous.title} with ${product.title}. Confirm the new quantity and price.`:`Added ${product.title}. Confirm its quantity and price.`);
  setReplacing(null);find('');requestAnimationFrame(()=>quantityInputs.current.get(product.id)?.focus());
 }
 function remove(index){const line=lines[index];onChange(lines.filter((_,i)=>i!==index));setRemoved({line,index});setNotice(`Removed ${line.title}.`);if(replacing===line.productId){setReplacing(null);find('');}}
 function undo(){if(!removed||lines.some(line=>line.productId===removed.line.productId))return;const next=[...lines];next.splice(Math.min(removed.index,next.length),0,removed.line);onChange(next);setNotice(`Restored ${removed.line.title}.`);setRemoved(null);}
 const replacement=lines.find(line=>line.productId===replacing),shown=matches.slice(0,8);
 return <>
  <div className="guided-part-feedback" role="status">{notice&&<p>{notice}</p>}{removed&&!lines.some(line=>line.productId===removed.line.productId)&&!priceOnly&&<button type="button" disabled={disabled} onClick={undo}><Undo2 size={17}/>Undo remove</button>}</div>
  {!lines.length&&<p className="guided-field-hint">No parts in this installation option. Add at least one part before saving.</p>}
  <div className="workbench-parts">{lines.map((line,index)=>{
   const problems=partEntryProblems(line),quantityId=`part-quantity-${line.productId}`,priceId=`part-price-${line.productId}`;
   return <article key={line.productId}>
    <div className="workbench-part-heading"><div><strong>{line.title}</strong><span>{line.supplier||'Supplier to confirm'} · {line.supplierSku||'Part number / VIN needed'}</span></div>{!priceOnly&&<div className="guided-part-actions"><button type="button" disabled={disabled} aria-label={`Replace ${line.title}`} onClick={()=>{setReplacing(line.productId);find('');setNotice('');search.current?.focus();}}><RefreshCw size={17}/>Replace</button><button type="button" disabled={disabled} aria-label={`Remove ${line.title}`} onClick={()=>remove(index)}><Trash2 size={17}/></button></div>}</div>
    <div className="workbench-part-fields"><label>Quantity<input ref={element=>{if(element)quantityInputs.current.set(line.productId,element);else quantityInputs.current.delete(line.productId);}} disabled={disabled||priceOnly} aria-label={`Quantity for ${line.title}`} aria-invalid={!!problems.quantity} aria-describedby={problems.quantity?quantityId:undefined} type="number" min="1" max="100000" step="1" value={line.quantity??''} placeholder="Enter quantity" onChange={event=>changeLine(index,{quantity:event.target.value===''?null:Number(event.target.value)})}/>{problems.quantity&&<span className="guided-field-error" id={quantityId}>{problems.quantity}{priceOnly?' Open Change parts to fix this.':''}</span>}</label>
     <label>Retail / unit ($)<input disabled={disabled} aria-label={`Retail price for ${line.title}`} aria-invalid={!!problems.price} aria-describedby={problems.price?priceId:undefined} type="number" min="0" max="1000000" step="0.01" value={dollars(line.unitRetailCents)} placeholder="Enter retail price" onChange={event=>changeLine(index,{unitRetailCents:cents(event.target.value)})}/>{problems.price&&<span className="guided-field-error" id={priceId}>{problems.price}</span>}</label><div><span>Line total</span><strong>{moneyLabel(!problems.quantity&&!problems.price?line.quantity*line.unitRetailCents:null)}</strong></div></div>
    <details><summary>Ordering role & private unit cost</summary><div className="package-field-grid"><label>Role in this build<input disabled={disabled} value={line.role||''} onChange={event=>changeLine(index,{role:event.target.value})}/></label><label>Private cost / unit ($)<input disabled={disabled} aria-label={`Private cost for ${line.title}`} type="number" min="0" step="0.01" value={dollars(line.unitCostCents)} onChange={event=>changeLine(index,{unitCostCents:cents(event.target.value)})}/></label></div></details>
   </article>;
  })}</div>
  {!priceOnly&&<div className="guided-part-search">
   {replacement&&<div className="guided-replacing"><p>Replacing <strong>{replacement.title}</strong>. The original stays until you choose a replacement.</p><button type="button" disabled={disabled} onClick={()=>{setReplacing(null);find('');}}>Cancel replacement</button></div>}
   <label className="package-add-search"><Search size={20}/><input ref={search} disabled={disabled} aria-label="Find a part for this package" aria-describedby="package-part-search-help" placeholder={replacement?'Find a replacement: name or part number':'Add a part: name or part number'} value={query} onChange={event=>find(event.target.value)}/></label>
   <p id="package-part-search-help" className="guided-field-hint">Search the shared parts library. Confirm fitment for this vehicle before publishing.</p>
   <div role="status">{searchState==='loading'&&<p>Searching parts…</p>}{searchState==='ready'&&!matches.length&&<p>No parts found. Try another name or part number. New parts can be added from the Parts tab.</p>}{searchState==='ready'&&matches.length>0&&<p>{matches.length>8?'Showing the first 8 matches. Narrow your search to find another part.':`${matches.length} ${matches.length===1?'part found':'parts found'}.`}</p>}</div>
   {searchError&&<p className="package-error" role="alert">{searchError} Change your search to try again.</p>}
   {shown.length>0&&<ul className="package-part-matches">{shown.map(product=>{const included=lines.some(line=>line.productId===product.id);return <li key={product.id}><button type="button" disabled={disabled||included} onClick={()=>choose(product)}><span><strong>{product.title}</strong><small>{product.data.supplierSku||'Part number not set'}{included?' / already in this option':''}</small></span>{replacing?<RefreshCw size={18}/>:<Plus size={18}/>}</button></li>;})}</ul>}
  </div>}
 </>;
}
