const validMoney=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000;
export function variantsFor(data){return data.variants?.length?data.variants:[{id:'front-rear',label:'Front & rear',enabled:true,lines:data.lines,labor:data.labor}];}
export function selectVariant(data,id){const variants=variantsFor(data);const v=variants.find(v=>v.id===(id||data.defaultVariantId||variants[0].id));if(!v)return null;return {...data,lines:v.lines,labor:v.labor,variantId:v.id,variantLabel:v.label};}
export function hoursFor(labor={}){
 if(!labor.useBreakdown)return Number.isFinite(labor.hours)?labor.hours:null;
 if(!Number.isFinite(labor.frontHours)||!Number.isFinite(labor.rearHours)||labor.rustApplies&&!Number.isFinite(labor.rustHours))return null;
 return labor.frontHours+labor.rearHours+(labor.rustApplies?labor.rustHours:0);
}
export function privateCostTotals(data){
 let cost=0;for(const line of data.lines||[]){if(!Number.isSafeInteger(line.quantity)||line.quantity<1||!validMoney(line.unitCostCents))return {partsCostCents:null};cost+=line.quantity*line.unitCostCents;}return {partsCostCents:cost};
}
