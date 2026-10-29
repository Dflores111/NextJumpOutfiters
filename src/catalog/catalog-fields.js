// Typed staff fields. Source cells stay separate from the editable catalog.
export const catalogFieldGroups = [
 {label:'Product details',fields:[['nameZh','Chinese product name','text'],['description','Description','textarea'],['descriptionZh','Chinese description','textarea'],['dimensionsMm','Dimensions (mm)','text'],['weightKg','Weight (kg)','number'],['unit','Stock unit','text'],['sourceQuantity','Quantity in source','number']]},
 {label:'Cost & selling prices',fields:[['purchaseCostCents','Item purchase cost ($)','money'],['cogsCents','Item COGS ($)','money'],['retailCents','Retail candidate ($)','money'],['installedCents','Installed candidate ($)','money']]},
 {label:'Production notes',fields:[['branding','Logo / branding','textarea'],['changes','Changes','textarea'],['changesZh','Chinese changes','textarea'],['notesZh','Source notes','textarea']]},
];
const textFields=new Set(['nameZh','description','descriptionZh','dimensionsMm','unit','branding','changes','changesZh','notesZh']);
const numberFields=new Set(['weightKg','sourceQuantity','purchaseCostCents','cogsCents','retailCents','installedCents']);
const fail=message=>{throw Object.assign(Error(message),{status:422});};
export function cleanCatalogFields(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('Use the product detail fields.');
 const result={};
 for(const field of textFields){const v=value[field];result[field]=v===undefined||v===null?'':typeof v==='string'&&v.length<=4000?v.trim():fail('Keep product descriptions within 4,000 characters.');}
 for(const field of numberFields){const v=value[field];result[field]=v===null||v===undefined||v===''?null:typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100000000&&(!field.endsWith('Cents')||Number.isSafeInteger(v))?v:fail('Use non-negative numbers. Prices are stored in cents.');}
 const promo=value.promotion||{};
 result.promotion={label:typeof promo.label==='string'?promo.label.trim().slice(0,120):'Historical Labor Day source',retailCents:promo.retailCents??null,installedCents:promo.installedCents??null,startsOn:promo.startsOn||null,endsOn:promo.endsOn||null,enabled:promo.enabled===true};
 for(const k of ['retailCents','installedCents'])if(result.promotion[k]!==null&&(!Number.isSafeInteger(result.promotion[k])||result.promotion[k]<0||result.promotion[k]>100000000))fail('Use a valid promotional price.');
 for(const k of ['startsOn','endsOn'])if(result.promotion[k]!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(result.promotion[k])||!Number.isFinite(Date.parse(result.promotion[k]))))fail('Use a valid promotion date.');
 if(result.promotion.enabled&&(!result.promotion.startsOn||!result.promotion.endsOn||result.promotion.endsOn<result.promotion.startsOn||result.promotion.retailCents===null))fail('An active promotion needs a retail price and a valid start and end date.');
 return result;
}
export const useLevels=[
 {id:'weekender',title:'Weekender',use:'daily',line:'Daily driving. Weekend escapes.',description:'A starting point for a truck that runs light most days.',image:'flagship-dillon-f250-640.webp'},
 {id:'overlander-light',title:'Overlander Lite',use:'trips',line:'Gear goes on for the trip.',description:'For trip equipment that comes off when you get home.',image:'ute-tent-640.webp'},
 {id:'overlander-heavy',title:'Overlander Heavy',use:'permanent',line:'Equipment stays onboard.',description:'Plan around the weight the truck carries every day.',image:'hero-640.webp'},
];
export const useLevelForTitle=title=>useLevels.find(level=>level.title===title||level.id==='overlander-light'&&title==='Overlander Light')?.id||null;
