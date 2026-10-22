import test from 'node:test';
import assert from 'node:assert/strict';
import {createBuild,vehicleRoutes} from '../src/builder/domain.js';
import {journeyLimit,journeyStep,restoreJourney,buildFromQuote} from '../src/builder/journey-state.js';

test('reload restores a valid review step while incomplete or malformed links remain at a safe step',()=>{
 const flat=createBuild(vehicleRoutes[0]);
 assert.equal(journeyStep('2',flat),2);
 for(const value of ['-1','oops','1.5'])assert.equal(journeyStep(value,flat),0);
 assert.equal(journeyStep('99',flat),2);
 assert.equal(journeyStep('3',createBuild()),0);
 const up=restoreJourney({saved:flat,query:{kind:'vehicle'}});
 assert.equal(journeyLimit(up),0,'upfitting needs a year');
 up.truck.year='2022';assert.equal(journeyLimit(up),1,'choose a use before package review');
 up.plan.packageId='weekender';assert.equal(journeyStep('3',up),3);
});

test('explicit flatbed entry wins over an upfitting draft and same-kind resume preserves choices',()=>{
 const flat={...createBuild(vehicleRoutes[0]),selected:['base','boxes','kitchen']};
 const up=restoreJourney({saved:flat,query:{kind:'vehicle'}});up.truck.year='2022';up.plan.packageId='overlander-light';
 assert.deepEqual(restoreJourney({saved:up,query:{kind:'vehicle'}}),up);
 const next=restoreJourney({saved:up,query:{kind:'flatbed'}});
 assert.equal(next.plan.kind,'flatbed');assert.deepEqual(next.selected,['base']);assert.equal(next.plan.packageId,'');
 assert.deepEqual(restoreJourney({saved:flat,query:{kind:'flatbed'}}).selected,flat.selected);
});

test('vehicle-specific entry does not borrow another vehicle but retains its own saved accessories',()=>{
 const saved={...createBuild(vehicleRoutes[0]),selected:['base','boxes'],truck:{...vehicleRoutes[0],year:'2022'}};
 const same=restoreJourney({saved,routeVehicle:vehicleRoutes[0]});assert.equal(same.truck.year,'2022');assert.deepEqual(same.selected,['base','boxes']);
 const different=restoreJourney({saved,routeVehicle:vehicleRoutes[2]});assert.equal(different.truck.model,'Tundra');assert.deepEqual(different.selected,['base']);
});

test('Tacoma pilot and saved quote use levels restore without borrowing an unrelated draft',()=>{
 const pilot=restoreJourney({saved:createBuild(vehicleRoutes[2]),pilot:true});assert.equal(pilot.truck.model,'Tacoma');assert.equal(pilot.plan.kind,'vehicle');assert.equal(journeyLimit(pilot),0);
 for(const [use,packageId]of [['daily','weekender'],['trips','overlander-light'],['permanent','overlander-heavy']]){
  const build=buildFromQuote({vehicle:{make:'Toyota',model:'Tacoma',year:2022,use}});assert.equal(build.plan.packageId,packageId);assert.equal(journeyStep(3,build),3);
 }
});
