import {buildKind, createBuild, sanitizeBuild, sanitizePlan, truckReady, validModelYear} from './domain.js';
import {useLevels} from '../catalog/catalog-fields.js';

export function journeyLimit(build) {
  const up = buildKind(build)==='vehicle';
  if (!truckReady(build.truck,buildKind(build)) || (up&&(!build.truck.year||!validModelYear(build.truck.year)))) return 0;
  return up ? (useLevels.some(level=>level.id===build.plan.packageId)?3:1) : 2;
}
export function journeyStep(value,build) {
  const number=Number(value);
  return Number.isInteger(number)&&number>=0 ? Math.min(number,journeyLimit(build)) : 0;
}
export function restoreJourney({saved,routeVehicle=null,pilot=false,query={}}) {
  let build=createBuild(routeVehicle);
  const sameRoute=saved&&(!routeVehicle||['make','model','bed'].every(key=>saved.truck[key]===routeVehicle[key]));
  const samePilot=saved&&buildKind(saved)==='vehicle'&&saved.truck.make==='Toyota'&&saved.truck.model==='Tacoma';
  if (saved&&sameRoute&&(!pilot||samePilot)) build=saved;
  else if(pilot) build={...build,truck:{year:validModelYear(query.year||'')?query.year:'',make:'Toyota',model:'Tacoma',bed:''},selected:[],plan:{...sanitizePlan(),kind:'vehicle'}};
  const kind=['flatbed','vehicle'].includes(query.kind)?query.kind:null;
  if(kind&&kind!==buildKind(build)) build={...build,selected:kind==='vehicle'?[]:['base'],plan:{...sanitizePlan(),kind},use:'',camperType:''};
  if(buildKind(build)==='vehicle') build={...build,truck:{...build.truck,bed:''}};
  return sanitizeBuild(build);
}

export function buildFromQuote(quote) {
  const level=useLevels.find(value=>value.use===quote.vehicle.use)||useLevels[0];
  return sanitizeBuild({...createBuild(),truck:{...quote.vehicle,year:String(quote.vehicle.year),bed:''},selected:[],use:level.use==='daily'?'Daily use & weekends':'Longer overland trips',plan:{kind:'vehicle',packageId:level.id,upgradeIds:['suspension']}});
}

export function restorePackageSelection(saved={},pack){
 const variants=pack.variants||[];
 return {scope:variants.some(v=>v.id===saved.scope)?saved.scope:pack.defaultVariantId||variants[0]?.id||'',fulfillment:(pack.fulfillment||[]).includes(saved.fulfillment)?saved.fulfillment:'installed',suspension:['stock','modified','unsure'].includes(saved.suspension)?saved.suspension:'unsure'};
}
