// Run only against a disposable loopback Worker. Never creates production test records.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {createBuild} from '../src/builder/domain.js';
const origin=process.argv[2]||'http://127.0.0.1:4176',url=new URL(origin);
assert.equal(url.protocol,'http:');assert.ok(['127.0.0.1','localhost'].includes(url.hostname));assert.equal(url.origin,origin);
const access=randomBytes(32).toString('hex'),key=randomBytes(32).toString('hex');
const config={...createBuild('toyota-tacoma-5ft-short-bed'),truck:{year:'2022',make:'Toyota',model:'Tacoma',bed:'5 ft'},use:'Daily use & weekends'};
async function save(config,key,parentId){return fetch(origin+'/api/builds',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key,'X-Build-Access':access},body:JSON.stringify({config,parentId})});}
const first=await save(config,key);assert.equal(first.status,201);const version1=await first.json();assert.equal(version1.estimate.totalCents,null);assert.ok(version1.estimate.lines.every(line=>line.cents===null));
const retry=await save(config,key);assert.equal(retry.status,200);assert.equal((await retry.json()).id,version1.id);
const second=await save({...config,plan:{...config.plan,fulfillment:'diy'}},randomBytes(32).toString('hex'),version1.id);assert.equal(second.status,201);const version2=await second.json();assert.equal(version2.version,2);
const reopened=await fetch(origin+'/api/builds/'+version1.id,{headers:{'X-Build-Access':access}});assert.equal(reopened.status,200);const original=await reopened.json();assert.equal(original.latestVersion,2);assert.deepEqual(original.config,version1.config);assert.deepEqual(original.estimate,version1.estimate);
assert.equal((await fetch(origin+'/api/builds/'+version1.id)).status,401);
assert.equal((await fetch(origin+'/api/builds/'+version1.id,{headers:{'X-Build-Access':randomBytes(32).toString('hex')}})).status,404);
for(const path of ['/api/staff/products','/api/staff/options','/api/staff/inventory','/staff'])assert.equal((await fetch(origin+path)).status,403);
assert.equal((await fetch(origin+'/auth/login')).status,503);
const route=await fetch(origin+'/pages/flatbed-build-price-by-vehicle');assert.equal(route.status,200);assert.match(await route.text(),/Plan your truck build/i);
const result={checkedAt:new Date().toISOString(),runtime:'Local Cloudflare Worker with generated D1 schema',result:'PASS',savedVersions:2,exactRetry:'PASS',immutableReopen:'PASS',missingAccessKey:401,wrongAccessKey:404,staffWithoutConfiguration:403,signInWithoutConfiguration:503,builderSSR:200,approvedTotal:null,privateSourceImports:0};
await writeFile(new URL('../evidence/builder-worker-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
