import React,{useEffect,useRef} from 'react';
import {ChevronDown} from 'lucide-react';
import {P,nav,services} from './routes.js';
const servicePath=id=>services.find(s=>s.id===id).path;
const groups={
 [P.services]:[['Lifts & suspension',servicePath('P16')],['Wheels & tires',servicePath('P18')],['Lighting',servicePath('P20')],['Bumpers & racks',servicePath('P17')],['Power & electrical',servicePath('P19')],['Rooftop tents & campers',servicePath('P21')],['Plan my upgrades',P.builder+'?kind=vehicle'],['All services',P.services]],
 [P.flatbeds]:[['Modular flatbeds',P.flatbeds],['Camper setups',P.camper],['Work & farm setups',P.work],['Find my vehicle',P.builder+'?kind=flatbed'],['Plan my flatbed',P.builder+'?kind=flatbed&step=1'],["Flatbed buyer's guide",P.guide]],
 [P.why]:[['Why NJO',P.why],['Meet the crew',P.about],['Trip prep & care',P.care],['Trips & community',P.trips]]
};
export default function MarketingNav({path,mobile=false,onNavigate=()=>{}}){
 const ref=useRef();
 useEffect(()=>{const close=e=>{if(!ref.current?.contains(e.target))ref.current?.querySelectorAll('details[open]').forEach(d=>{d.open=false})};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[]);
 return <div ref={ref} className={`njo-nav-links ${mobile?'njo-nav-mobile':''}`}>{nav.map(([label,url])=>groups[url]?<details key={url} className="njo-nav-group" onToggle={e=>{if(e.currentTarget.open)ref.current?.querySelectorAll('details[open]').forEach(d=>{if(d!==e.currentTarget)d.open=false})}} onKeyDown={e=>{if(e.key==='Escape'&&e.currentTarget.open){e.preventDefault();e.stopPropagation();e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus()}}}><summary aria-current={path===url?'page':undefined}>{label}<ChevronDown size={14} aria-hidden="true"/></summary><div className="njo-nav-dropdown">{groups[url].map(([text,to])=><a key={to} href={to} aria-current={path===to?'page':undefined} onClick={onNavigate}>{text}</a>)}</div></details>:<a key={url} href={url} aria-current={path===url?'page':undefined} onClick={onNavigate}>{label}</a>)}</div>
}
