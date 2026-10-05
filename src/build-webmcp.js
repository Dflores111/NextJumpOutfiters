import {STORAGE_KEY,parseSavedBuild} from './builder/domain.js';
export function installBuildTool(){
 const context=document.modelContext;
 if(!context?.registerTool)return;
 const lifecycle=new AbortController();
 const tool={name:'get_saved_flatbed_configuration',title:'Read saved flatbed configuration',description:'Read the anonymous configuration saved by this browser’s flatbed planner. Returns the saved truck and equipment, with pricing and fitment pending review. It does not submit an inquiry.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Provide an empty object.');
  const build=parseSavedBuild(localStorage.getItem(STORAGE_KEY));
  return {saved:!!build,configuration:build,pricing:'pending review',fitment:'pending review'};
 }};
 try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{/* Unsupported preview registration leaves the normal planner available. */}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
