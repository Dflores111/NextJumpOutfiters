import {variantsFor,hoursFor} from './variant-domain.js';

export const useLabels={weekender:'Weekender','overlander-light':'Overlander Lite','overlander-heavy':'Overlander Heavy',expedition:'Expedition'};
export const copyChecks={identity:'Vehicle, use and package name',content:'Customer description and exclusions',parts:'Parts, quantities and supplier codes',pricing:'Scope, labor and price',fitment:'Fitment and installation notes',media:'Images and sales restrictions'};
export const vehicleLabel=d=>`${d.vehicle.yearFrom}–${d.vehicle.yearTo} ${d.vehicle.make} ${d.vehicle.model}`;
export function suggestedPackageTitle(data){
 const scope=variantsFor(data).find(v=>v.id===data.defaultVariantId)||variantsFor(data)[0],hours=hoursFor(scope.labor);
 return [vehicleLabel(data),useLabels[data.useLevel]||'Custom build',data.specs?.recommendedLiftHeight,scope.label,hours===null?null:`NJOBH${hours}`].filter(Boolean).join(' | ');
}
export function clonePackageDraft(row,useLevel){
 const data=JSON.parse(JSON.stringify(row.data));
 data.useLevel=useLevel;data.menuOrder=Object.keys(useLabels).indexOf(useLevel)+1;
 data.approvals={parts:false,pricing:false,fitment:false};data.reviewEvidence='';data.reviewedBy=null;data.reviewedAt=null;
 data.issues=(data.issues||[]).map(i=>({...i,resolved:false}));
 data.cloneReview=Object.fromEntries(Object.keys(copyChecks).map(k=>[k,false]));
 data.clonedFrom={id:row.id,revision:row.revision,title:row.title};
 return {title:`${vehicleLabel(data)} · ${useLabels[useLevel]} · review copy`,category:row.category,data};
}
// Approval changes alone can be saved without changing what has been reviewed.
export function reviewContent(data){
 const {approvals,reviewEvidence,reviewedBy,reviewedAt,cloneReview,issues,...content}=data;
 return JSON.stringify({...content,issues:(issues||[]).map(({resolved,...i})=>i)});
}
export function changedSections(before,after){
 if(!before||!after)return [];
 const diff=(a,b)=>JSON.stringify(a)!==JSON.stringify(b),a=before.data,b=after.data;
 return [
  [diff([before.title,a.audience,a.description,a.vehicle,a.useLevel,a.media,a.excludes,a.diyAllowed],[after.title,b.audience,b.description,b.vehicle,b.useLevel,b.media,b.excludes,b.diyAllowed]),'Overview'],
  [diff([a.lines,a.labor,a.variants,a.defaultVariantId],[b.lines,b.labor,b.variants,b.defaultVariantId]),'Parts & pricing'],
  [diff([a.specs,a.fitmentNotes,a.installNotes,a.vehicleQuestions],[b.specs,b.fitmentNotes,b.installNotes,b.vehicleQuestions]),'Fitment & install'],
  [diff([a.issues,a.approvals,a.reviewEvidence,a.cloneReview],[b.issues,b.approvals,b.reviewEvidence,b.cloneReview]),'Review checks']
 ].filter(([changed])=>changed).map(([,label])=>label);
}

// Customer visibility follows the active release, even while its draft is edited.
export const packageIsShown=record=>!!record.published&&!record.published.stale&&!record.published.problems?.length;
export function packageStatusLabel(record){
 if(record.published){if(!packageIsShown(record))return 'Not shown · needs review';return record.hasDraftChanges||record.stale?'In builder · draft changes':'Shown in builder';}
 return record.state==='ARCHIVED'?'Archived · not shown':'Draft · not shown';
}
