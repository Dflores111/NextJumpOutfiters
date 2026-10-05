import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {hostedReceipts} from '../src/hosted-receipts.js';
const origin='https://next-jump-outfitters.diegoafmejia111.chatgpt.site';
const payload={context:'service',service:'suspension',project:'dillon-f250',firstName:'Preview Test',preferredContact:'email',email:'private@example.test',vehicleDetails:'Truck example',message:'Private note to exclude',marketingOptIn:true};
function database(){
 const db=new DatabaseSync(':memory:');
 for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')))db.exec(readFileSync('drizzle/'+name,'utf8'));
 return {db,env:{DB:{prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){return db.prepare(sql).get(...args)||null},async run(){const result=db.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}}}}}}}};
}
const submit=(key,data=payload,headers={})=>new Request(origin+'/api/preview-requests',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key,...headers},body:JSON.stringify(data)});
test('hosted D1 receipt is durable, token-gated and discards every personal field',async()=>{
 const {db,env}=database(),key=crypto.randomUUID();
 try{
  const response=await hostedReceipts(submit(key),env);assert.equal(response.status,201);const receipt=await response.json();assert.equal(receipt.sentToShop,false);
  const status=await hostedReceipts(new Request(origin+'/api/preview-requests/status',{headers:{Authorization:'Bearer '+key}}),env);assert.equal(status.status,200);assert.equal((await status.json()).receiptId,receipt.receiptId);
  const stored=JSON.stringify(db.prepare('SELECT * FROM preview_receipts').all());
  for(const secret of ['Preview Test','private@example.test','Truck example','Private note to exclude','marketingOptIn',key])assert.equal(stored.includes(secret),false);
  assert.match(stored,/dillon-f250/);
  const anonymous=await hostedReceipts(new Request(origin+'/api/preview-requests/status'),env);assert.equal(anonymous.status,401);
 }finally{db.close()}
});
test('hosted concurrent retry returns exactly one receipt and rejects changed context',async()=>{
 const {db,env}=database(),key=crypto.randomUUID();
 try{const results=await Promise.all([hostedReceipts(submit(key),env),hostedReceipts(submit(key),env)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,201]);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM preview_receipts').get().n,1);
 const conflict=await hostedReceipts(submit(key,{...payload,service:'lighting'}),env);assert.equal(conflict.status,409);
 }finally{db.close()}
});
test('hosted cross-origin, invalid and storage-failure requests never produce false success',async()=>{
 const {db,env}=database();
 try{
  assert.equal((await hostedReceipts(submit(crypto.randomUUID(),payload,{Origin:'https://other.example'}),env)).status,403);
  assert.equal((await hostedReceipts(submit(crypto.randomUUID(),{...payload,project:'invented'}),env)).status,400);
  assert.equal((await hostedReceipts(submit(crypto.randomUUID()),{})).status,503);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM preview_receipts').get().n,0);
 }finally{db.close()}
});
