import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import {createDemoEngine} from './demo-core.js';

const migrations=import.meta.glob('../../drizzle/*.sql',{query:'?raw',import:'default',eager:true});
const schema=Object.keys(migrations).sort().map(key=>migrations[key]).join('\n');
const storageKey='njo-inventory-demo-v1';
let enginePromise,SQLPromise,queue=Promise.resolve();
const sql=()=>SQLPromise||(SQLPromise=initSqlJs({locateFile:()=>wasmUrl}));
const decode=value=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
function encode(bytes){let text='';for(let i=0;i<bytes.length;i+=16384)text+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(text);}
function persist(engine){try{sessionStorage.setItem(storageKey,encode(engine.export()));window.dispatchEvent(new CustomEvent('njo-demo-storage',{detail:true}));}catch{window.dispatchEvent(new CustomEvent('njo-demo-storage',{detail:false}));}}
async function open(){
 const SQL=await sql();let bytes;
 try{const saved=sessionStorage.getItem(storageKey);if(saved&&saved.length<4_000_000)bytes=decode(saved);}catch{}
 let engine;try{engine=await createDemoEngine(SQL,schema,bytes);}catch(error){if(!bytes)throw error;engine=await createDemoEngine(SQL,schema);}
 persist(engine);return engine;
}
const engine=()=>enginePromise||(enginePromise=open().catch(error=>{enginePromise=null;throw error;}));
export function requestDemo(path,method='GET',body,key,signal){
 const next=queue.then(async()=>{if(signal?.aborted)throw new DOMException('Request cancelled.','AbortError');const demo=await engine();if(signal?.aborted)throw new DOMException('Request cancelled.','AbortError');const response=await demo.request(path,method,body,key);const value=await response.json();if(!response.ok)throw Error(value.error||'This demo action could not be completed.');if(method!=='GET')persist(demo);return value;});
 queue=next.catch(()=>{});return next;
}
export function resetDemo(){
 const next=queue.then(async()=>{const previous=await engine();const fresh=await createDemoEngine(await sql(),schema);enginePromise=Promise.resolve(fresh);previous.close();persist(fresh);});queue=next.catch(()=>{});return next;
}
