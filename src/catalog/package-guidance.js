import {releaseProblems} from './package-domain.js';
export const editTasks={price:{label:'Update prices',detail:'Change part prices, labor or alignment.',section:'parts'},parts:{label:'Change parts',detail:'Add, remove or replace a part.',section:'parts'},copy:{label:'Copy a package',detail:'Start a private draft for another use.',section:'overview'}};
export function packageChecks(record){
 const problems=[...releaseProblems(record.data),...(record.stale?['A shared part changed. Review and save the current parts.']:[])];
 return problems.map((label,index)=>({id:String(index),label,section:/configuration|exclusions/.test(label)?'install':/quantity|quantities|retail|labor|alignment|Install-Only|enabled|shared part/.test(label)?'parts':'review'}));
}
