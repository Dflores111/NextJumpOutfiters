import {useEffect,useRef,useState} from 'react';
import {sanitizeBuild} from './domain.js';
export const RECORD_KEY='nj-build-record-v1';
const randomKey=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
export function useBuildRecord(build,setBuild,setFeedback){
 const [record,setRecord]=useState(null),[state,setState]=useState('idle'),[error,setError]=useState(''),[link,setLink]=useState('');
 const access=useRef(''),pending=useRef(null);
 useEffect(()=>{
  const params=new URLSearchParams(window.location.hash.slice(1));const saved=params.get('saved'),key=params.get('key');
  if(!/^[a-f0-9-]{36}$/.test(saved||'')||!/^[a-f0-9]{64}$/.test(key||''))return;
  const controller=new AbortController();setState('loading');access.current=key;
  (async()=>{try{
   const read=async id=>{const response=await fetch(`/api/builds/${id}`,{headers:{'X-Build-Access':key},signal:controller.signal});const value=await response.json();if(!response.ok)throw Error(value.error);return value;};
   let value=await read(saved);if(value.latestVersion>value.version)value=await read(value.latestId);
   const clean=sanitizeBuild(value.config);if(!clean)throw Error('This saved plan has an unsupported format.');
   setBuild(clean);setRecord(value);setState('saved');const url=new URL(window.location.href);url.hash=new URLSearchParams({saved:value.id,key}).toString();setLink(url.href);setFeedback({message:`Saved plan reopened — version ${value.version}. No inquiry has been sent.`});
  }catch(error){if(error.name!=='AbortError'){setError(error.message||'The saved plan could not load. Your browser draft is still here.');setState('error');}}})();
  return()=>controller.abort();
 },[]);
 const current=record&&JSON.stringify(record.config)===JSON.stringify(sanitizeBuild(build));
 useEffect(()=>{try{if(current)localStorage.setItem(RECORD_KEY,JSON.stringify({id:record.id,version:record.version,config:record.config}));else localStorage.removeItem(RECORD_KEY);}catch{/* Download remains available. */}},[current,record,build]);
 async function save(){
  setError('');setState('saving');if(!access.current)access.current=randomKey();
  const data={config:sanitizeBuild(build),parentId:record?.id||null},fingerprint=JSON.stringify(data);
  if(pending.current?.fingerprint!==fingerprint)pending.current={fingerprint,key:randomKey()};
  try{
   const response=await fetch('/api/builds',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pending.current.key,'X-Build-Access':access.current},body:JSON.stringify(data)});
   const value=await response.json();if(!response.ok)throw Error(value.error||'Your build could not be saved.');
   setRecord(value);pending.current=null;setState('saved');
   const url=new URL(window.location.href);url.searchParams.set('step','3');url.hash=new URLSearchParams({saved:value.id,key:access.current}).toString();setLink(url.href);
   setFeedback({message:`Version ${value.version} saved. Keep the reopen link to return on another device. No inquiry has been sent.`});
  }catch(error){setError(error.message||'Your build could not be saved. Your choices are still here.');setState('error');}
 }
 function reset(){setRecord(null);setLink('');setError('');setState('idle');access.current='';pending.current=null;const url=new URL(window.location.href);url.hash='';window.history.replaceState({},'',url.pathname+url.search);}
 return {record,current,state,error,link,save,reset};
}
