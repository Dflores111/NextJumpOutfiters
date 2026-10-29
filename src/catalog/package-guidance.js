import {releaseProblems} from './package-domain.js';
export const editTasks={price:{label:'Update prices',detail:'Change part prices, labor or alignment.',section:'parts'},parts:{label:'Change parts',detail:'Add, remove or replace a part.',section:'parts'},copy:{label:'Copy a package',detail:'Start a private draft for another use.',section:'overview'}};
export function packageChecks(record){
 const problems=[...releaseProblems(record.data),...(record.stale?['A shared part changed. Review and save the current parts.']:[])];
 return problems.map((label,index)=>({id:String(index),label,section:/configuration|exclusions/.test(label)?'install':/quantity|quantities|retail|labor|alignment|Install-Only|enabled|shared part/.test(label)?'parts':'review'}));
}

export function partEntryProblems(line){
 return {
  quantity:Number.isSafeInteger(line.quantity)&&line.quantity>=1&&line.quantity<=100000?'':'Enter a whole quantity of 1 or more.',
  price:Number.isSafeInteger(line.unitRetailCents)&&line.unitRetailCents>=0&&line.unitRetailCents<=100000000?'':'Enter the retail price, or 0 if included at no charge.'
 };
}

// A replacement stays unconfirmed. Never carry an old part's quantity or price
// onto a different product, and never remove the original before selection.
export function pickPackagePart(lines,product,replacing=null){
 if(lines.some(line=>line.productId===product.id))return lines;
 const index=lines.findIndex(line=>line.productId===replacing);
 if(replacing&&index<0)return lines;
 const line={productId:product.id,title:product.title,role:product.category||'',supplier:product.data.supplier,supplierSku:product.data.supplierSku,quantity:null,unitCostCents:product.data.candidateCostCents??null,unitRetailCents:product.data.candidateRetailCents??null};
 return index<0?[...lines,line]:lines.map((old,i)=>i===index?line:old);
}

export function packageMenuConflict(packages,record,useLevel=record.data.useLevel){
 const vehicle=record.data.vehicle,lower=value=>String(value||'').toLowerCase();
 return packages.find(other=>{
  const active=other.published?.data;
  return other.id!==record.id&&active&&active.useLevel===useLevel&&lower(active.vehicle.make)===lower(vehicle.make)&&lower(active.vehicle.model)===lower(vehicle.model)&&active.vehicle.yearFrom<=vehicle.yearTo&&active.vehicle.yearTo>=vehicle.yearFrom;
 })||null;
}

export function packagePilotNotice(data,demo=false){
 if(demo)return '';
 if(data.vehicle.make!=='Toyota'||data.vehicle.model!=='Tacoma'||data.vehicle.yearFrom!==2016||data.vehicle.yearTo!==2023)return 'The current customer menu covers the 2016–2023 Toyota Tacoma. Keep this package as a private draft for future coverage.';
 return data.useLevel==='expedition'?'Expedition is future coverage. You can prepare a private draft now; the current customer pilot offers Weekender, Overlander Lite and Overlander Heavy.':'';
}
