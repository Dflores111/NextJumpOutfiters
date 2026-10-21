const storageKey=id=>'njo-package-quote:'+id;
export function rememberPackageQuote(id,access){try{localStorage.setItem(storageKey(id),access);return true;}catch{return false;}}
export async function reopenPackageQuote(id,{fetchImpl=fetch,readAccess=key=>localStorage.getItem(key)}={}){
 if(!/^[a-f\d-]{36}$/i.test(id||''))return null;
 let access;try{access=readAccess(storageKey(id));}catch{return null;}if(!/^[a-zA-Z0-9_-]{32,96}$/.test(access||''))return null;
 const response=await fetchImpl('/api/package-quotes/'+id,{headers:{'X-Build-Access':access},cache:'no-store'});if(!response.ok)return null;return response.json();
}
export function packageInquirySummary(record){
 const q=record?.customer;if(!q||q.draft)return '';
 return [`Saved package quote: ${q.number}`,`Package: ${q.title} (revision ${q.packageRevision})`,...(q.variantLabel?[`Scope: ${q.variantLabel}`]:[]),`Truck: ${q.vehicle.year} ${q.vehicle.make} ${q.vehicle.model}`,`Current suspension: ${q.vehicle.suspension}`,`Use: ${q.vehicle.use}`,`Handoff: ${q.fulfillment==='installed'?'Installed by Next Jump':'Parts only'}`,`Quote reference: ${record.id}`,'Vehicle fitment, parts availability and the appointment still need shop confirmation.'].join('\n');
}
