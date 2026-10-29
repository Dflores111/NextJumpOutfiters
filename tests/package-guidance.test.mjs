import test from 'node:test';
import assert from 'node:assert/strict';
import {partEntryProblems,pickPackagePart,packageMenuConflict,packagePilotNotice} from '../src/catalog/package-guidance.js';

test('replacing a part preserves its position without inheriting the old role, quantity or price',()=>{
 const original=[{productId:'front',title:'Front kit',quantity:1,unitRetailCents:80000},{productId:'rear',title:'Rear shocks',role:'Rear suspension',quantity:2,unitRetailCents:28000}];
 const part={id:'replacement',title:'Reviewed replacement',category:'Suspension',data:{supplier:'Test supplier',supplierSku:'TEST-2'}};
 const result=pickPackagePart(original,part,'rear');
 assert.equal(result.length,2);assert.equal(result[0],original[0]);assert.equal(result[1].productId,'replacement');assert.equal(result[1].role,'Suspension');
 assert.equal(result[1].quantity,null);assert.equal(result[1].unitRetailCents,null);assert.equal(original[1].productId,'rear');
 assert.ok(partEntryProblems(result[1]).quantity);assert.ok(partEntryProblems(result[1]).price);
 assert.equal(pickPackagePart(original,{...part,id:'front'},'rear'),original);
 assert.equal(pickPackagePart(original,part,'missing'),original);
});

test('known catalog prices may be suggested but unknowns and invalid quantities remain explicit',()=>{
 const line=pickPackagePart([],{id:'new',title:'Test',category:'Rear',data:{candidateRetailCents:32000}})[0];
 assert.equal(line.unitRetailCents,32000);assert.equal(line.quantity,null);assert.ok(partEntryProblems(line).quantity);
 assert.equal(partEntryProblems({...line,quantity:1}).price,'');
 assert.ok(partEntryProblems({...line,quantity:1.5}).quantity);assert.ok(partEntryProblems({...line,quantity:100001}).quantity);
 assert.equal(partEntryProblems({...line,quantity:1,unitRetailCents:0}).price,'');
 assert.ok(partEntryProblems({...line,quantity:1,unitRetailCents:-1}).price);
});

const vehicle={make:'Toyota',model:'Tacoma',yearFrom:2016,yearTo:2023};
test('copy warnings use the active customer record even if its working draft has different coverage',()=>{
 const current={id:'current',data:{vehicle,useLevel:'weekender'}};
 const active={id:'other',data:{vehicle:{...vehicle,yearFrom:2024,yearTo:2026},useLevel:'expedition'},published:{data:{vehicle:{...vehicle,make:'toyota',yearFrom:2020,yearTo:2023},useLevel:'overlander-light'}}};
 assert.equal(packageMenuConflict([active],current,'overlander-light'),active);
 assert.equal(packageMenuConflict([active],current,'weekender'),null);
 assert.equal(packageMenuConflict([active],{...current,id:'other'},'overlander-light'),null);
 assert.equal(packageMenuConflict([active],{...current,data:{...current.data,vehicle:{...vehicle,yearTo:2019}}},'overlander-light'),null);
});

test('future coverage is described as private draft work while isolated demo review stays available',()=>{
 const data={vehicle,useLevel:'weekender'};assert.equal(packagePilotNotice(data),'');
 assert.match(packagePilotNotice({...data,useLevel:'expedition'}),/private draft/);
 assert.match(packagePilotNotice({...data,vehicle:{...vehicle,yearFrom:2005,yearTo:2015}}),/future coverage/);
 assert.equal(packagePilotNotice({...data,useLevel:'expedition'},true),'');
});
