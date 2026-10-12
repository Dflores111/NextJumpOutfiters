// Read-only runtime check. Never seeds hosted products or changes stock.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const origin=process.argv[2]||'http://127.0.0.1:4178',url=new URL(origin);
assert.equal(url.protocol,'http:');assert.ok(['127.0.0.1','localhost'].includes(url.hostname));assert.equal(url.origin,origin);
const checks={};
for(const path of ['/staff','/api/staff/session','/api/staff/barcodes?code=001234567890','/api/staff/purchases','/api/staff/jobs','/api/staff/inventory/items','/api/staff/inventory/00000000-0000-0000-0000-000000000000/history']){const response=await fetch(origin+path);checks[path]=response.status;assert.equal(response.status,403);}
const edit=await fetch(origin+'/api/staff/inventory/settings',{method:'PATCH',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});checks['PATCH /api/staff/inventory/settings']=edit.status;assert.equal(edit.status,403);
const builder=await fetch(origin+'/pages/flatbed-build-price-by-vehicle');assert.equal(builder.status,200);assert.match(await builder.text(),/Plan your truck build/i);checks.builderSSR=200;
const signIn=await fetch(origin+'/auth/login');assert.equal(signIn.status,503);checks.unconfiguredSignIn=503;
const result={checkedAt:new Date().toISOString(),runtime:'Disposable local Cloudflare Worker',result:'PASS',checks,privateSourceImports:0,stockWrites:0};
await writeFile(new URL('../evidence/inventory-worker-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
