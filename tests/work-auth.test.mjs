import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT,decodeJwt} from 'jose';
import {authConfig,workAuth,staffIdentity,staffLoginResponse} from '../src/catalog/work-auth.js';
import {canStaff} from '../src/catalog/access.js';

const origin='https://shop.example.test',tenant='11111111-1111-4111-8111-111111111111',objectId='22222222-2222-4222-8222-222222222222';
const env=provider=>({STAFF_PROVIDER:provider,STAFF_ORIGIN:origin,STAFF_CLIENT_ID:'test-client',STAFF_CLIENT_SECRET:'synthetic-test-secret',STAFF_SESSION_SECRET:'synthetic-session-secret-for-tests-only-123456789',STAFF_GOOGLE_DOMAIN:'example.test',STAFF_MICROSOFT_TENANT:tenant,STAFF_ROSTER_JSON:JSON.stringify([{email:'tech@example.test',subject:provider==='google'?'123456789':objectId,roles:['inventory']}])});
const request=(path,options={})=>new Request(origin+path,options);
async function start(config){const login=await workAuth(request('/auth/login'),config),target=new URL(login.headers.get('Location')),cookie=login.headers.get('Set-Cookie').split(';')[0];return {login,target,cookie,flow:decodeJwt(cookie.split('=')[1])};}
async function callback(config,flow,claims={},settings={}){
 const keys=await generateKeyPair('RS256');const provider=config.STAFF_PROVIDER;
 const token=await new SignJWT({nonce:flow.flow.nonce,...(provider==='google'?{email:'tech@example.test',email_verified:true,hd:'example.test'}:{tid:tenant,oid:objectId,preferred_username:'changed@example.test'}),...claims}).setProtectedHeader({alg:'RS256'}).setIssuer(settings.issuer||(provider==='google'?'https://accounts.google.com':`https://login.microsoftonline.com/${tenant}/v2.0`)).setAudience(settings.audience||'test-client').setSubject('123456789').setIssuedAt().setExpirationTime(settings.expiration||'5m').sign(keys.privateKey);
 return workAuth(request(`/auth/callback?state=${flow.flow.state}&code=synthetic`,{headers:{Cookie:flow.cookie}}),config,{keyResolver:keys.publicKey,fetchImpl:async(url,options)=>{assert.equal(url,authConfig(config).token);const data=new URLSearchParams(options.body);assert.equal(data.get('code_verifier'),flow.flow.verifier);assert.equal(data.get('redirect_uri'),origin+'/auth/callback');return Response.json({id_token:token});}});
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
 assert.equal((await workAuth(request('/auth/logout',{method:'POST',headers:{Origin:'https://attacker.example'}}),config)).status,403);
 const logout=await workAuth(request('/auth/logout',{method:'POST',headers:{Origin:origin}}),config);assert.equal(logout.status,303);assert.match(logout.headers.get('Set-Cookie'),/Max-Age=0/);
});
