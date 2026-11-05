import React,{useEffect,useRef,useState} from 'react';
import {Pencil} from 'lucide-react';

export default function StockCountCell({item,location,onSave,disabled}){
 const [editing,setEditing]=useState(false),[quantity,setQuantity]=useState(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const trigger=useRef(null),wasEditing=useRef(false);
 const fieldId=`stock-count-${item.id}`,helpId=`${fieldId}-help`,errorId=`${fieldId}-error`;
 useEffect(()=>{if(editing)wasEditing.current=true;else if(wasEditing.current&&!disabled){trigger.current?.focus({preventScroll:true});wasEditing.current=false;}},[editing,disabled]);
 if(item.stockType!=='STOCKED')return <>{item.onhand??'—'}</>;
 async function save(event){
  event.preventDefault();if(busy)return;
  const count=Number(quantity);
  if(quantity.trim()===''||!Number.isSafeInteger(count)||count<0||count>1000000){setError('Enter a whole number from 0 to 1,000,000.');return;}
  if(count<item.reserved){setError(`${item.reserved} parts are held for jobs. Check those job holds before saving a smaller count.`);return;}
  setBusy(true);setError('');
  try{await onSave(item,count,note);setEditing(false);}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return editing?<form className="inv-count-form" onSubmit={save} onKeyDown={event=>{if(event.key==='Escape'&&!busy){event.preventDefault();event.stopPropagation();setEditing(false);}}}>
  <label htmlFor={fieldId}>Total on the shelf</label>
  <input id={fieldId} autoFocus type="number" min="0" max="1000000" step="1" inputMode="numeric" required value={quantity} onChange={event=>{setQuantity(event.target.value);setError('');}} disabled={busy} aria-invalid={!!error} aria-describedby={`${helpId}${error?' '+errorId:''}`}/>
  <small id={helpId}>{location}. Include the {item.reserved} held for jobs. Enter the total, not the change.</small>
  <label className="inv-count-note">Note <span>optional</span><input value={note} onChange={event=>setNote(event.target.value)} maxLength={300} disabled={busy} placeholder="e.g. Counted shelf A"/></label>
  <div><button type="submit" className="inv-primary" disabled={busy||quantity.trim()===''}>{busy?'Saving…':'Save count'}</button><button type="button" disabled={busy} onClick={()=>setEditing(false)}>Cancel</button></div>
  {error&&<span id={errorId} role="alert" className="inv-cell-error">{error} Your count is still here.</span>}
 </form>:<button ref={trigger} type="button" className="inv-edit-cell inv-count-trigger" disabled={disabled} aria-label={`Count stock for ${item.title}, currently ${item.onhand??'not counted'}`} onClick={()=>{setQuantity('');setNote('');setError('');setEditing(true);}}><strong>{item.onhand??'—'}</strong><span><Pencil size={13} aria-hidden="true"/>Count</span></button>;
}
