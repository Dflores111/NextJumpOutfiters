import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT,decodeJwt} from 'jose';
import {authConfig,workAuth,staffIdentity,staffLoginResponse} from '../src/catalog/work-auth.js';
import {canStaff} from '../src/catalog/access.js';

const origin='https://shop.example.test',tenant='11111111-1111-4111-8111-111111111111',objectId='22222222-2222-4222-8222-222222222222';
const env=provider=>({STAFF_PROVIDER:provider,STAFF_ORIGIN:origin,STAFF_CLIENT_ID:'test-client',STAFF_CLIENT_SECRET:'synthetic-test-secret',STAFF_SESSION_SECRET:'synthetic-session-secret-for-tests-only-123456789',STAFF_GOOGLE_DOMAIN:'example.test',STAFF_MICROSOFT_TENANT:tenant,STAFF_ROSTER_JSON:JSON.stringify([{email:'tech@example.test',subject:provider==='google'?'123456789':objectId,roles:['inventory']}])});
const request=(path,options={})=>new Request(origin+path,options);
async function start(config,provider){const login=await workAuth(request('/auth/login'+(provider?'?provider='+provider:'')),config),target=new URL(login.headers.get('Location')),cookie=login.headers.get('Set-Cookie').split(';')[0];return {login,target,cookie,flow:decodeJwt(cookie.split('=')[1])};}
async function callback(config,flow,claims={},settings={}){
 const keys=await generateKeyPair('RS256');const provider=flow.flow.provider,connection=authConfig(config,provider);
 const token=await new SignJWT({nonce:flow.flow.nonce,...(provider==='google'?{email:'tech@example.test',email_verified:true,hd:'example.test'}:{tid:tenant,oid:objectId,preferred_username:'changed@example.test'}),...claims}).setProtectedHeader({alg:'RS256'}).setIssuer(settings.issuer||(provider==='google'?'https://accounts.google.com':`https://login.microsoftonline.com/${tenant}/v2.0`)).setAudience(settings.audience||connection.clientId).setSubject('123456789').setIssuedAt().setExpirationTime(settings.expiration||'5m').sign(keys.privateKey);
 return workAuth(request(`/auth/callback?state=${flow.flow.state}&code=synthetic`,{headers:{Cookie:flow.cookie}}),config,{keyResolver:keys.publicKey,fetchImpl:async(url,options)=>{assert.equal(url,connection.token);const data=new URLSearchParams(options.body);assert.equal(data.get('client_id'),connection.clientId);assert.equal(data.get('client_secret'),connection.clientSecret);assert.equal(data.get('code_verifier'),flow.flow.verifier);assert.equal(data.get('redirect_uri'),origin+'/auth/callback');return Response.json({id_token:token});}});
}
const sessionCookie=response=>response.headers.getSetCookie().find(x=>x.startsWith('__Host-njo-staff=')).split(';')[0];

test('work sign-in remains closed with missing settings, an unknown provider or ambiguous roster',async()=>{
 assert.equal(authConfig({}),null);assert.equal(staffLoginResponse(request('/staff'),{}).status,403);assert.equal((await workAuth(request('/auth/login'),{})).status,503);
 for(const change of [{STAFF_PROVIDER:'unknown'},{STAFF_ORIGIN:'http://shop.example.test'},{STAFF_SESSION_SECRET:'short'},{STAFF_ROSTER_JSON:'[]'},{STAFF_MICROSOFT_TENANT:'common'}])assert.equal(authConfig({...env('microsoft'),...change}),null);
 const config=env('google'),roster=JSON.parse(config.STAFF_ROSTER_JSON);assert.equal(authConfig({...config,STAFF_ROSTER_JSON:JSON.stringify([...roster,...roster])}),null);
});
test('authorization redirects use PKCE, random state/nonce and a secure short-lived cookie',async()=>{
 const config=env('google'),a=await start(config),b=await start(config);
 assert.equal(a.login.status,302);assert.equal(a.target.origin,'https://accounts.google.com');assert.equal(a.target.searchParams.get('code_challenge_method'),'S256');assert.equal(a.target.searchParams.get('hd'),'example.test');assert.notEqual(a.flow.state,b.flow.state);assert.notEqual(a.flow.nonce,b.flow.nonce);assert.ok(a.target.searchParams.get('code_challenge'));assert.match(a.login.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
 let calls=0;const bad=await workAuth(request('/auth/callback?state=wrong&code=synthetic',{headers:{Cookie:a.cookie}}),config,{fetchImpl:async()=>{calls++;}});assert.equal(bad.status,403);assert.equal(calls,0);assert.equal((await workAuth(new Request('https://attacker.example/auth/login'),config)).status,503);
});
test('Google tokens require verified Workspace identity, the named subject and matching nonce/audience/issuer',async()=>{
 const config=env('google'),flow=await start(config),accepted=await callback(config,flow);assert.equal(accepted.status,303);
 const identity=await staffIdentity(request('/staff',{headers:{Cookie:sessionCookie(accepted)}}),config);assert.equal(identity.email,'tech@example.test');assert.equal(canStaff(identity,'inventory'),true);assert.equal(canStaff(identity,'catalog'),false);
 for(const claims of [{email_verified:false},{hd:'another.test'},{email:'another@example.test'},{nonce:'wrong'},{azp:'other-client'}])assert.equal((await callback(config,flow,claims)).status,403);
 for(const settings of [{audience:'other-client'},{issuer:'https://untrusted.example'},{expiration:'-1m'}])assert.equal((await callback(config,flow,{},settings)).status,403);
 const other={...config,STAFF_ROSTER_JSON:JSON.stringify([{email:'tech@example.test',subject:'other-subject',roles:['admin']}])};assert.equal((await callback(other,flow)).status,403);
});
test('Microsoft uses tenant and object ID for authorization rather than an email-shaped claim',async()=>{
 const config=env('microsoft'),flow=await start(config);assert.match(flow.target.href,new RegExp(tenant));
 const accepted=await callback(config,flow);assert.equal(accepted.status,303);const identity=await staffIdentity(request('/staff',{headers:{Cookie:sessionCookie(accepted)}}),config);assert.equal(identity.subject,objectId);assert.equal(identity.email,'tech@example.test');
 for(const claims of [{tid:objectId},{oid:tenant},{oid:undefined,preferred_username:'tech@example.test'}])assert.equal((await callback(config,flow,claims)).status,403);
});
test('session tampering, revocation, changed roles and same-origin logout are enforced',async()=>{
 const config=env('google'),flow=await start(config),accepted=await callback(config,flow),cookie=sessionCookie(accepted),signed=request('/staff',{headers:{Cookie:cookie}});
 assert.equal(await staffIdentity(request('/staff',{headers:{Cookie:cookie.slice(0,-8)+'tampered'}}),config),null);
 assert.equal(await staffIdentity(signed,{...config,STAFF_SESSION_EPOCH:'2'}),null);
 assert.equal(await staffIdentity(signed,{...config,STAFF_ROSTER_JSON:JSON.stringify([{email:'other@example.test',subject:'another',roles:['admin']}])}),null);
 const promoted=await staffIdentity(signed,{...config,STAFF_ROSTER_JSON:JSON.stringify([{email:'tech@example.test',subject:'123456789',roles:['sales']}])});assert.equal(canStaff(promoted,'inventory'),false);assert.equal(canStaff(promoted,'sales'),true);
 for(const Origin of ['https://attacker.example','null'])assert.equal((await workAuth(request('/auth/logout',{method:'POST',headers:{Origin,'Sec-Fetch-Site':'same-origin'}}),config)).status,403);
 const logout=await workAuth(request('/auth/logout',{method:'POST',headers:{Origin:origin}}),config);assert.equal(logout.status,303);assert.match(logout.headers.get('Set-Cookie'),/Max-Age=0/);
});

const dual=()=>({...env('microsoft'),STAFF_PROVIDER:undefined,STAFF_CLIENT_ID:undefined,STAFF_CLIENT_SECRET:undefined,STAFF_PROVIDERS:'microsoft,google',STAFF_PRIMARY_PROVIDER:'microsoft',STAFF_MICROSOFT_CLIENT_ID:'microsoft-client',STAFF_MICROSOFT_CLIENT_SECRET:'synthetic-microsoft-client-secret',STAFF_GOOGLE_CLIENT_ID:'google-client',STAFF_GOOGLE_CLIENT_SECRET:'synthetic-google-client-secret',STAFF_ROSTER_JSON:JSON.stringify([{provider:'microsoft',email:'tech@example.test',subject:objectId,roles:['inventory']},{provider:'google',email:'tech@example.test',subject:'123456789',roles:['sales']}])});

test('both providers use separate clients and separate roles even for the same email',async()=>{
 const config=dual();
 assert.equal(authConfig(config).provider,'microsoft');
 for(const provider of ['microsoft','google']){
  const flow=await start(config,provider);assert.equal(flow.target.searchParams.get('client_id'),provider+'-client');
  const accepted=await callback(config,flow);assert.equal(accepted.status,303);
  const identity=await staffIdentity(request('/api/staff/session',{headers:{Cookie:sessionCookie(accepted)}}),config);
  assert.equal(identity.provider,provider);assert.deepEqual(identity.roles,provider==='microsoft'?['inventory']:['sales']);
 }
});
test('multi-provider settings reject ambiguous rosters and shared legacy credentials',()=>{
 const config=dual();
 for(const update of [{STAFF_PROVIDERS:'microsoft,unknown'},{STAFF_PROVIDERS:'google,google'},{STAFF_PRIMARY_PROVIDER:'unknown'},{STAFF_ROSTER_JSON:env('google').STAFF_ROSTER_JSON}])assert.equal(authConfig({...config,...update}),null);
 assert.equal(authConfig({...config,STAFF_GOOGLE_CLIENT_ID:undefined,STAFF_CLIENT_ID:'shared'},'google'),null);
 assert.equal(authConfig(config,'unknown'),null);
});
test('a provider cannot reuse the other provider flow or audience',async()=>{
 const config=dual(),flow=await start(config,'google');
 assert.equal((await callback(config,flow,{}, {audience:'microsoft-client'})).status,403);
 const microsoftOnly={...config,STAFF_PROVIDERS:'microsoft',STAFF_ROSTER_JSON:JSON.stringify(JSON.parse(config.STAFF_ROSTER_JSON).filter(p=>p.provider==='microsoft'))};
 let calls=0;const denied=await workAuth(request(`/auth/callback?state=${flow.flow.state}&code=synthetic`,{headers:{Cookie:flow.cookie}}),microsoftOnly,{fetchImpl:async()=>{calls++;}});
 assert.equal(denied.status,403);assert.equal(calls,0);
 const duplicate=await workAuth(request('/auth/login?provider=google&provider=microsoft'),config);assert.equal(duplicate.status,400);
});
test('removing one provider and changing its connection revoke only the corresponding sessions',async()=>{
 const config=dual(),google=await callback(config,await start(config,'google')),microsoft=await callback(config,await start(config,'microsoft'));
 const googleRequest=request('/staff',{headers:{Cookie:sessionCookie(google)}}),microsoftRequest=request('/staff',{headers:{Cookie:sessionCookie(microsoft)}});
 assert.equal(await staffIdentity(googleRequest,{...config,STAFF_GOOGLE_CLIENT_ID:'changed-client'}),null);
 assert.equal(await staffIdentity(microsoftRequest,{...config,STAFF_MICROSOFT_TENANT:objectId}),null);
 const microsoftOnly={...config,STAFF_PROVIDERS:'microsoft',STAFF_ROSTER_JSON:JSON.stringify(JSON.parse(config.STAFF_ROSTER_JSON).filter(p=>p.provider==='microsoft'))};
 assert.equal(await staffIdentity(googleRequest,microsoftOnly),null);assert.equal((await staffIdentity(microsoftRequest,microsoftOnly)).provider,'microsoft');
});
test('sign-in page offers both choices, discloses unavailable options and exposes no roster or credentials',async()=>{
 const config=dual(),page=staffLoginResponse(request('/staff'),config),html=await page.text();
 assert.equal(page.status,200);assert.match(html,/provider=microsoft/);assert.match(html,/provider=google/);assert.ok(html.indexOf('Continue with Microsoft')<html.indexOf('Continue with Google'));
 for(const secret of [config.STAFF_GOOGLE_CLIENT_SECRET,config.STAFF_MICROSOFT_CLIENT_SECRET,config.STAFF_SESSION_SECRET,'tech@example.test',objectId])assert.equal(html.includes(secret),false);
 assert.match(page.headers.get('Content-Security-Policy'),/default-src 'none'/);
 const partial=staffLoginResponse(request('/staff'),{...config,STAFF_GOOGLE_CLIENT_SECRET:undefined});assert.equal(partial.status,200);const partialHtml=await partial.text();assert.match(partialHtml,/provider=microsoft/);assert.doesNotMatch(partialHtml,/provider=google/);assert.match(partialHtml,/Setup pending/);
 const closed=staffLoginResponse(request('/staff'),{});assert.equal(closed.status,403);assert.match(await closed.text(),/Team access is being connected/);
 assert.equal(await staffLoginResponse(request('/staff',{method:'HEAD'}),config).text(),'');
});

test('failed callbacks offer a fresh sign-in and log only a fixed failure reason',async t=>{
 const messages=[];t.mock.method(console,'warn',(...args)=>messages.push(args));
 const config=env('microsoft'),flow=await start(config),path='/auth/callback?code=private-callback-code&state=private-callback-state';
 for(const headers of [{},{Cookie:flow.cookie.slice(0,-8)+'tampered'}]){
  const response=await workAuth(request(path,{headers}),config),html=await response.text();
  assert.equal(response.status,403);assert.match(response.headers.get('Content-Type'),/text\/html/);
  assert.match(html,/role="alert"/);assert.match(html,/Start a fresh request/);assert.match(html,/href="\/auth\/login\?provider=microsoft"/);
  assert.match(response.headers.get('Set-Cookie'),/Max-Age=0/);
  for(const value of ['private-callback-code','private-callback-state',flow.cookie,config.STAFF_CLIENT_SECRET,config.STAFF_SESSION_SECRET])assert.equal(html.includes(value),false);
 }
 assert.deepEqual(messages,[['staff_sign_in_rejected','missing_flow'],['staff_sign_in_rejected','invalid_flow']]);
});

test('token exchange uses the edge-compatible manual mode and rejects redirects without forwarding credentials',async t=>{
 const messages=[];t.mock.method(console,'warn',(...args)=>messages.push(args));
 const config=env('microsoft'),flow=await start(config);let calls=0;
 const response=await workAuth(request(`/auth/callback?state=${flow.flow.state}&code=synthetic`,{headers:{Cookie:flow.cookie}}),config,{fetchImpl:async(url,options)=>{
  calls++;assert.equal(url,authConfig(config).token);assert.equal(options.redirect,'manual');
  return new Response(null,{status:302,headers:{Location:'https://untrusted.example/token'}});
 }});
 assert.equal(calls,1);assert.equal(response.status,403);assert.deepEqual(messages,[['staff_sign_in_rejected','token_exchange']]);
 assert.equal((await response.text()).includes(config.STAFF_CLIENT_SECRET),false);
});
