// A linked stock task wins over remembered filters, without accepting arbitrary values.
export function stockViewFromLink(base,search){
 const p=new URLSearchParams(search),next={...base};
 for(const [key,max]of [['q',100],['category',200]])if(p.has(key))next[key]=(p.get(key)||'').slice(0,max);
 const choices={location:['Tacoma Showroom','Overland Expo Redmond','Online Shop Shipping'],view:['all','low','reserved','uncounted','classification'],state:['','DRAFT','REVIEW','APPROVED','RETIRED']};
 for(const [key,values]of Object.entries(choices))if(p.has(key)&&values.includes(p.get(key)))next[key]=p.get(key);
 return {...next,page:1};
}
