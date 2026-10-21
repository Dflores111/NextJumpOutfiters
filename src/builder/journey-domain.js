// These source collection categories guide sizing; they do not certify fitment.
import {vehicleRoutes,routeForVehicle} from './domain.js';
export const flatbedSizes={FSL:{title:'Full-size Long',description:'The long platform category for full-size, long-bed trucks.'},FSR:{title:'Full-size Regular',description:'The regular platform category for full-size, standard-bed trucks.'},MSL:{title:'Mid-size Long',description:'The long platform category for mid-size, long-bed trucks.'},MSR:{title:'Mid-size Regular',description:'The regular platform category for mid-size, short-bed trucks.'}};
const mid=new Set(['Tacoma','Ranger','Colorado','Gladiator JT','Frontier']);
export function flatbedSizeFor(truck){
 const route=routeForVehicle(truck);if(!route)return null;
 const size=mid.has(route.model)?(parseFloat(route.bed)<6?'MSR':'MSL'):(parseFloat(route.bed)<8?'FSR':'FSL');
 return {key:size,...flatbedSizes[size],vehicleLabel:route.label,source:'Next Jump vehicle collections',state:'SIZING_GUIDE',requiresFitmentReview:true};
}
export const pilotVehicle=truck=>truck?.make==='Toyota'&&truck?.model==='Tacoma'&&Number.isSafeInteger(Number(truck.year))&&Number(truck.year)>=2016&&Number(truck.year)<=2023;
export const flatbedVehicleOptions=vehicleRoutes.map(route=>({make:route.make,model:route.model,bed:route.bed,label:route.label}));
