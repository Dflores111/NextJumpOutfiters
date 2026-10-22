import {announceCatalogChange} from './catalog-refresh.js';
export function createWorkspaceApi({demo=false,fetchImpl=fetch,loadDemo=()=>import('./demo-runtime.js')}={}){
 return async function api(path,method='GET',body,key,signal){
  if(demo)return (await loadDemo()).requestDemo(path,method,body,key,signal);
  const response=await fetchImpl(`/api/staff/${path}`,{method,signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const value=await response.json();if(!response.ok)throw Error(value.error||'This action could not be completed.');if(method!=='GET')announceCatalogChange();return value;
 };
}
export function api(...args){return createWorkspaceApi({demo:typeof window!=='undefined'&&window.location.pathname.replace(/\/$/,'')==='/inventory-demo'})(...args);}
