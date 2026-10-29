import assert from 'node:assert/strict';
import {createBuild, vehicleRoutes} from '../src/builder/domain.js';
import {restoreJourney} from '../src/builder/journey-state.js';

const base=new URL(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4187');
assert.ok(['127.0.0.1','localhost'].includes(base.hostname)&&base.protocol==='http:');
const P={flatbeds:'/pages/overland-aluminum-flatbed-truck-bodies',services:'/pages/overland-off-road-installation-services-tacoma-wa',builder:'/pages/flatbed-build-price-by-vehicle',quote:'/pages/book-install-services-or-get-a-quote'};
const render=async path=>{const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(15000)});assert.equal(response.status,200);return {html:await response.text()};};
const cases=[];
const test=(name,run)=>cases.push({name,run});
const links=html=>[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>({url:new URL(m[1].replaceAll('&amp;','&'),'http://localhost'),text:m[2].replace(/<[^>]*>/g,'').trim()}));

test('marketing flatbed entries override an upfitting draft using the existing journey interface',async()=>{
  const {html}=await render(P.flatbeds);
  const entries=links(html).filter(a=>a.text==='Choose my truck'||/Plan (a work flatbed|a camping flatbed|for a flatbed camper)$/.test(a.text));
  assert.equal(entries.length,6);
  const saved=restoreJourney({saved:createBuild(vehicleRoutes[0]),query:{kind:'vehicle'}});
  saved.truck.year='2022';saved.plan.packageId='overlander-light';
  for(const {url} of entries){
    assert.equal(url.searchParams.get('kind'),'flatbed');
    const next=restoreJourney({saved,query:Object.fromEntries(url.searchParams)});
    assert.equal(next.plan.kind,'flatbed');assert.equal(next.plan.packageId,'');
  }
});

test('installation marketing keeps the latest upfitting entry and staged embedded request',async()=>{
  const {html}=await render(P.services);
  const entry=links(html).find(a=>a.text==='Plan my upgrades');
  assert.equal(entry.url.pathname,P.builder);assert.equal(entry.url.searchParams.get('kind'),'vehicle');
  for(const page of [html,(await render('/')).html]){
    assert.equal([...page.matchAll(/id="start-project"/g)].length,1);
    assert.match(page,/Start my request/);
    assert.doesNotMatch(page,/class="native-inquiry"/);
  }
});

test('new marketing interests reach the native handoff while the test form remains explicit',async()=>{
  const url=P.quote+'?context=general&interest=complete-build';
  const live=(await render(url)).html;
  assert.match(live,/class="native-inquiry"/);assert.match(live,/Project interest: A complete build/);
  assert.doesNotMatch(live,/id="inquiry-firstName"/);
  const preview=(await render(url+'&preview=1')).html;
  assert.doesNotMatch(preview,/class="native-inquiry"/);assert.match(preview,/id="inquiry-firstName"/);
  assert.match(preview,/nothing is sent/);
});

test('unknown interest text is not copied into the native project description',async()=>{
  for(const interest of ['__proto__','private@example.test']){
    const {html}=await render(P.quote+'?context=general&interest='+encodeURIComponent(interest));
    assert.match(html,/class="native-inquiry"/);assert.doesNotMatch(html,/Project interest:/);
    assert.equal(html.includes(interest),false);
  }
});

for(const check of cases)await check.run();
console.log(JSON.stringify({checks:cases.length,passed:cases.map(c=>c.name),failures:0}));
