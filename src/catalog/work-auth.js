import {SignJWT,jwtVerify,createRemoteJWKSet,base64url} from 'jose';

const SESSION='__Host-njo-staff',FLOW='__Host-njo-login';
const responseHeaders={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const resolvers=new Map(),encoder=new TextEncoder();
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const random=()=>base64url.encode(crypto.getRandomValues(new Uint8Array(32)));
const cookie=(name,value,seconds)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${seconds}`;
const getCookie=(request,name)=>(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
const plain=(message,status=403)=>new Response(message,{status,headers:{...responseHeaders,'Content-Type':'text/plain; charset=utf-8'}});

export function authConfig(env){
 try{
  const origin=new URL(env.STAFF_ORIGIN);
  if(origin.protocol!=='https:'||origin.origin!==env.STAFF_ORIGIN||encoder.encode(env.STAFF_SESSION_SECRET||'').length<32||!env.STAFF_CLIENT_ID||!env.STAFF_CLIENT_SECRET)return null;
  const provider=env.STAFF_PROVIDER;if(!['google','microsoft'].includes(provider))return null;
  const domain=(env.STAFF_GOOGLE_DOMAIN||'').toLowerCase(),tenant=(env.STAFF_MICROSOFT_TENANT||'').toLowerCase();
  if(provider==='google'&&!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain))return null;
  if(provider==='microsoft'&&!uuid(tenant))return null;
  const roster=JSON.parse(env.STAFF_ROSTER_JSON||'null');
  if(!Array.isArray(roster)||!roster.length||roster.length>100)return null;
  const subjects=new Set();
  for(const person of roster){
   if(!person||typeof person.email!=='string'||!/^[^\s@]+@[^\s@]+$/.test(person.email)||typeof person.subject!=='string'||!person.subject||person.subject.length>128||subjects.has(person.subject)||!Array.isArray(person.roles)||!person.roles.length||person.roles.some(r=>!['admin','catalog','inventory','sales'].includes(r)))return null;
   if(provider==='microsoft'){if(!uuid(person.subject))return null;person.subject=person.subject.toLowerCase();if(subjects.has(person.subject))return null;}
   if(provider==='google'&&!person.email.toLowerCase().endsWith('@'+domain))return null;
   subjects.add(person.subject);
  }
  const base=`https://login.microsoftonline.com/${tenant}`;
  return {origin:origin.origin,provider,domain,tenant,roster,secret:encoder.encode(env.STAFF_SESSION_SECRET),epoch:String(env.STAFF_SESSION_EPOCH||'1'),clientId:env.STAFF_CLIENT_ID,clientSecret:env.STAFF_CLIENT_SECRET,
   authorize:provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':base+'/oauth2/v2.0/authorize',
   token:provider==='google'?'https://oauth2.googleapis.com/token':base+'/oauth2/v2.0/token',
   issuer:provider==='google'?['https://accounts.google.com','accounts.google.com']:base+'/v2.0',
   jwks:provider==='google'?'https://www.googleapis.com/oauth2/v3/certs':base+'/discovery/v2.0/keys'};
 }catch{return null;}
}
function claimsIdentity(config,claims){
 const subject=config.provider==='google'?claims.sub:claims.oid?.toLowerCase();
 if(config.provider==='google'&&(claims.email_verified!==true||claims.hd?.toLowerCase()!==config.domain))return null;
 if(config.provider==='microsoft'&&(claims.tid?.toLowerCase()!==config.tenant||!uuid(claims.oid)))return null;
 const person=config.roster.find(p=>p.subject===subject);
 if(!person||(config.provider==='google'&&claims.email?.toLowerCase()!==person.email.toLowerCase()))return null;
 // Microsoft usernames/emails are mutable display claims; only tenant + object ID grant access.
 return {provider:config.provider,subject,email:person.email,roles:person.roles,local:false};
}
const sign=(config,payload,purpose,seconds)=>new SignJWT({...payload,purpose,provider:config.provider,epoch:config.epoch}).setProtectedHeader({alg:'HS256',typ:'JWT'}).setIssuer(config.origin).setAudience('next-jump-staff').setIssuedAt().setExpirationTime(`${seconds}s`).sign(config.secret);
async function verifyCookie(config,value,purpose){
 if(typeof value!=='string'||value.length>6000)return null;
 try{const {payload}=await jwtVerify(value,config.secret,{issuer:config.origin,audience:'next-jump-staff',algorithms:['HS256'],requiredClaims:['exp','iat','purpose','provider','epoch'],maxTokenAge:purpose==='flow'?'10m':'30m'});return payload.purpose===purpose&&payload.provider===config.provider&&payload.epoch===config.epoch?payload:null;}catch{return null;}
}
export async function staffIdentity(request,env){
 const config=authConfig(env);if(!config||new URL(request.url).origin!==config.origin)return null;
 const session=await verifyCookie(config,getCookie(request,SESSION),'session');if(!session)return null;
 const person=config.roster.find(p=>p.subject===session.subject);
 // Roles are read from current configuration on every request. Removing access takes effect immediately.
 return person?{provider:config.provider,subject:person.subject,email:person.email,roles:person.roles,local:false}:null;
}
export async function workAuth(request,env,{fetchImpl=fetch,keyResolver}={}){
 const url=new URL(request.url);if(!url.pathname.startsWith('/auth/'))return null;
 const config=authConfig(env);if(!config||url.origin!==config.origin)return plain('Staff sign-in is awaiting shop account configuration.',503);
 if(url.pathname==='/auth/logout'&&request.method==='POST'){
  if(request.headers.get('origin')!==config.origin||!['same-origin','none',null].includes(request.headers.get('sec-fetch-site')))return plain('Use the staff workspace to sign out.');
  return new Response(null,{status:303,headers:{...responseHeaders,Location:'/staff', 'Set-Cookie':cookie(SESSION,'',0)}});
 }
 if(request.method!=='GET')return plain('Method not allowed.',405);
 if(url.pathname==='/auth/login'){
  const flow={state:random(),nonce:random(),verifier:random()};
  const challenge=base64url.encode(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(flow.verifier))));
  const target=new URL(config.authorize);
  const values={client_id:config.clientId,redirect_uri:config.origin+'/auth/callback',response_type:'code',response_mode:'query',scope:'openid email profile',state:flow.state,nonce:flow.nonce,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account',...(config.provider==='google'?{hd:config.domain}:{})};
  for(const [key,value]of Object.entries(values))target.searchParams.set(key,value);
  return new Response(null,{status:302,headers:{...responseHeaders,Location:target.href,'Set-Cookie':cookie(FLOW,await sign(config,flow,'flow',600),600)}});
 }
 if(url.pathname==='/auth/callback'){
  const clear=cookie(FLOW,'',0),flow=await verifyCookie(config,getCookie(request,FLOW),'flow');
  const denied=()=>new Response('Sign-in could not be completed. Return to /staff and try again, or ask the shop administrator to confirm your access.',{status:403,headers:{...responseHeaders,'Content-Type':'text/plain; charset=utf-8','Set-Cookie':clear}});
  if(url.href.length>12000||url.searchParams.getAll('state').length!==1||url.searchParams.getAll('code').length!==1||!flow||url.searchParams.get('state')!==flow.state||url.searchParams.has('error'))return denied();
  try{
   const token=await fetchImpl(config.token,{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:config.clientId,client_secret:config.clientSecret,code:url.searchParams.get('code'),redirect_uri:config.origin+'/auth/callback',code_verifier:flow.verifier})});
   if(!token.ok)return denied();const result=await token.json();if(typeof result.id_token!=='string'||result.id_token.length>16000)return denied();
   if(!resolvers.has(config.jwks))resolvers.set(config.jwks,createRemoteJWKSet(new URL(config.jwks),{timeoutDuration:10000}));
   const {payload}=await jwtVerify(result.id_token,keyResolver||resolvers.get(config.jwks),{issuer:config.issuer,audience:config.clientId,algorithms:['RS256'],requiredClaims:['exp','iat','sub','nonce'],maxTokenAge:'10m',clockTolerance:5});
   if(payload.nonce!==flow.nonce||(payload.azp&&payload.azp!==config.clientId)||(Array.isArray(payload.aud)&&payload.aud.length>1&&payload.azp!==config.clientId))return denied();
   const identity=claimsIdentity(config,payload);if(!identity)return denied();
   const lifetime=Math.min(1800,payload.exp-Math.floor(Date.now()/1000));if(lifetime<=0)return denied();
   const headers=new Headers({...responseHeaders,Location:'/staff'});headers.append('Set-Cookie',clear);headers.append('Set-Cookie',cookie(SESSION,await sign(config,{subject:identity.subject},'session',lifetime),lifetime));
   return new Response(null,{status:303,headers});
  }catch{return denied();}
 }
 return plain('Not found.',404);
}
export function staffLoginResponse(request,env){
 if(!authConfig(env))return plain('Staff access is awaiting shop account configuration. The private local pilot remains available.',403);
 if(!['GET','HEAD'].includes(request.method))return plain('Method not allowed.',405);
 return new Response(null,{status:302,headers:{...responseHeaders,Location:'/auth/login'}});
}
