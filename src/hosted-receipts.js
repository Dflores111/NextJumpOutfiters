import {validatePreviewRequest} from './preview-validation.js';
import {sanitizeBuild,validateBuild} from './builder/domain.js';

const MAX_BODY=16*1024;
const TOKEN_RE=/^[A-Za-z0-9_-]{32,96}$/;
const rates=new Map();
const failure=(status,message,fields)=>Object.assign(new Error(message),{status,fields});
export const hostedSecurityHeaders={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
const json=(status,value,headers={})=>Response.json(value,{status,headers:{...hostedSecurityHeaders,'Cache-Control':'no-store',...headers}});
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');
const publicReceipt=row=>({receiptId:row.receipt_id,receivedAt:row.received_at,mode:'preview',sentToShop:false,contactStored:false,context:row.context,summary:JSON.parse(row.summary)});

export async function hostedReceipts(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/preview-requests'))return null;
 try{
  if(!['/api/preview-requests','/api/preview-requests/status'].includes(url.pathname))throw failure(404,'Preview endpoint not found.');
  const remote=request.headers.get('CF-Connecting-IP')||'local',now=Date.now();
  const previous=rates.get(remote),rate=previous&&now-previous.started<60_000?previous:{started:now,count:0};
  rate.count++;rates.set(remote,rate);
  if(rates.size>1000)for(const [key,value]of rates)if(now-value.started>=60_000)rates.delete(key);
  if(rate.count>30)return json(429,{error:'Too many preview requests. Please wait a minute and try again.'},{'Retry-After':'60'});
  const origin=request.headers.get('Origin'),site=request.headers.get('Sec-Fetch-Site');
  if(origin&&origin!==url.origin||site&&!['same-origin','none'].includes(site))throw failure(403,'This request must come from this preview.');
  if(!env.DB)throw failure(503,'Preview storage is unavailable. Your entries are still here. Nothing has been sent to the shop.');
  if(url.pathname.endsWith('/status')){
   if(request.method!=='GET')throw failure(405,'Use GET to check a preview receipt.');
   const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
   if(!TOKEN_RE.test(token))throw failure(401,'A valid preview receipt is required.');
   const row=await env.DB.prepare('SELECT * FROM preview_receipts WHERE token_hash = ?').bind(await digest(token)).first();
   if(!row)throw failure(404,'No saved preview request was found. Nothing has been sent to the shop.');
   return json(200,publicReceipt(row));
  }
  if(request.method!=='POST')throw failure(405,'Use POST to save a preview request.');
  if(!origin||origin!==url.origin)throw failure(403,'This request must come from this preview.');
  const token=request.headers.get('Idempotency-Key');
  if(!token||!TOKEN_RE.test(token))throw failure(400,'A valid request key is required.');
  if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))throw failure(415,'Send this request as JSON.');
  const length=Number(request.headers.get('Content-Length')||0);
  if(!Number.isFinite(length)||length>MAX_BODY)throw failure(413,'This request is too large.');
  const reader=request.body?.getReader();let bytes=0,text='';const decoder=new TextDecoder();
  if(!reader)throw failure(400,'This request is not valid JSON.');
  while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>MAX_BODY){await reader.cancel();throw failure(413,'This request is too large.')}text+=decoder.decode(part.value,{stream:true})}text+=decoder.decode();
  let data;try{data=JSON.parse(text)}catch{throw failure(400,'This request is not valid JSON.')}
  const summary=validatePreviewRequest(data,{sanitizeBuild,validateBuild});
  const encoded=JSON.stringify(summary),fingerprint=await digest(encoded),tokenHash=await digest(token);
  const receiptId=crypto.randomUUID(),receivedAt=new Date().toISOString();
  // The unique key and conditional insert make retries and concurrent requests atomic.
  const result=await env.DB.prepare('INSERT OR IGNORE INTO preview_receipts (token_hash, receipt_id, received_at, context, fingerprint, summary) SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM preview_receipts) < 500').bind(tokenHash,receiptId,receivedAt,summary.context,fingerprint,encoded).run();
  const row=await env.DB.prepare('SELECT * FROM preview_receipts WHERE token_hash = ?').bind(tokenHash).first();
  if(!row)throw failure(503,'Preview storage is full. Nothing has been sent to the shop.');
  if(row.fingerprint!==fingerprint)throw failure(409,'This request key belongs to a different preview. Start a new request.');
  const reused=!result.meta.changes;
  return json(reused?200:201,{...publicReceipt(row),receiptToken:token,reused});
 }catch(error){return json(error.status||503,{error:error.status?error.message:'This preview could not save your request. Your entries are still here. Nothing has been sent to the shop.',...(error.fields?{fields:error.fields}:{})})}
}
