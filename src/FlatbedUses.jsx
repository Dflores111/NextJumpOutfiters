import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,Check} from 'lucide-react';
import {P} from './routes.js';
import {JourneyAction,JourneyImage} from './Journey.jsx';
import './flatbed-uses.css';

const uses=[
 {id:'campers',label:'Campers',need:'Start with the camper you want to carry.',title:'The camper you want. Gear you can still reach.',problem:'A camper needs a platform. Your chairs, tools and camp gear still need a place.',solution:'Plan the flatbed, mounting and storage together, with access to the things you use. Compare camper types before working through the fit for your truck.',file:'flagship-camper-slide-in.jpg',alt:'NJO Ford truck carrying an Alaskan camper above flatbed side storage',caption:'Alaskan camper · setup example. Equipment and fit vary by truck.',to:P.camper,action:'Compare camper setups',proof:P.camperStory,proofAction:'See the Alaskan setup'},
 {id:'camping',label:'Camping',need:'Give the kitchen and camp gear a place.',title:'Pull in. Open the kitchen. Settle in.',problem:'Cooking gear buried under the rest of the load can turn a meal stop into an unpacking job.',solution:'Plan storage around what you reach for at camp. Ask about a pull-out kitchen, side storage and room for the gear that makes a weekend away your own.',file:'ute-tent.jpg',alt:'Super Ute parked in a golden landscape at sunset with its rooftop tent deployed',caption:'The Super Ute at camp · collaboration build. Kitchen options are reviewed separately.',to:P.builder+'?kind=flatbed&use=overland',action:'Plan my camping setup',proof:P.ute,proofAction:'Explore the Super Ute'},
 {id:'overlanding',label:'Overlanding',need:'Make room for a longer trip.',title:'Pack for the long way home.',problem:'More days away can mean more equipment to carry—and more gear to reach around.',solution:'Start with what you need to carry. Work through where the load sits, which gear stays accessible and how storage, racks and camp equipment fit together.',file:'ute-front.jpg',alt:'Super Ute Ford F-250 with flatbed and camp equipment on a forest road',caption:'The Super Ute · Ford F-250 collaboration build. A starting point for ideas, not a fixed package.',to:P.builder+'?kind=flatbed&use=overland',action:'Plan my overland flatbed',proof:P.ute,proofAction:'See how the build came together'},
 {id:'work',label:'Work & farm',need:'Load materials. Keep tools within reach.',title:'Load for the job. Get to the tools.',problem:"The tools you need most shouldn't be buried behind the load.",solution:'Use an open deck for materials and plan storage around the tools you reach for all day. Review deck size, access and how the truck is loaded, whether you work on a jobsite or around the property.',file:'flagship-ranger-flatbed.jpg',alt:'Ford Ranger flatbed with drop sides and underbody tool storage in a field',caption:'Ford Ranger · real flatbed setup example, with drop sides and underbody storage.',to:P.work,action:'Explore work & farm setups',proof:P.rangerStory,proofAction:'See the Ranger setup'}
];

// Four alternate views of one decision. No carousel, automatic cycling or scroll interception.
export default function FlatbedUses(){
 const [active,setActive]=useState('campers');
 const tabs=useRef([]);
 useEffect(()=>{
  const restore=()=>{
   const id=uses.find(use=>'#'+use.id===window.location.hash)?.id||'campers';
   setActive(id);
   if(tabs.current.includes(document.activeElement))tabs.current[uses.findIndex(use=>use.id===id)]?.focus({preventScroll:true});
  };
  restore();window.addEventListener('hashchange',restore);window.addEventListener('popstate',restore);
  return()=>{window.removeEventListener('hashchange',restore);window.removeEventListener('popstate',restore)};
 },[]);
 const activate=id=>{setActive(id);if(window.location.hash!=='#'+id)window.history.pushState(null,'','#'+id)};
 const move=(event,index)=>{
  let next=index;
  if(event.key==='ArrowRight')next=(index+1)%uses.length;
  else if(event.key==='ArrowLeft')next=(index+uses.length-1)%uses.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=uses.length-1;
  else return;
  event.preventDefault();activate(uses[next].id);tabs.current[next]?.focus();
 };
 return <section className="flatbed-uses container" aria-labelledby="flatbed-uses-heading">
  <div className="flatbed-uses-heading" data-reveal><span className="eyebrow">YOUR TRUCK. YOUR REASON.</span><h2 id="flatbed-uses-heading">What would you do with the space?</h2><p>Carry a camper. Make camp your own. Pack for a longer trip. Put the truck to work. Start with what you need it to do.</p></div>
  <div className="flatbed-use-tabs" role="tablist" aria-label="How you use your flatbed">
   {uses.map((use,i)=><button key={use.id} id={use.id} ref={node=>{tabs.current[i]=node}} type="button" role="tab" aria-selected={active===use.id} aria-controls={'flatbed-panel-'+use.id} tabIndex={active===use.id?0:-1} onClick={()=>activate(use.id)} onKeyDown={event=>move(event,i)}><span className="flatbed-use-label">{use.label}<Check size={18} aria-hidden="true"/></span><span className="flatbed-use-need">{use.need}</span></button>)}
  </div>
  {uses.map(use=><div className={'flatbed-use-panel flatbed-use-'+use.id} key={use.id} id={'flatbed-panel-'+use.id} role="tabpanel" aria-labelledby={use.id} tabIndex="0" hidden={active!==use.id}>
   <figure className="flatbed-use-photo"><JourneyImage file={use.file} alt={use.alt} sizes="(max-width:900px) 100vw, 55vw"/><figcaption>{use.caption}</figcaption></figure>
   <div className="flatbed-use-copy"><h3>{use.title}</h3><p className="flatbed-use-problem">{use.problem}</p><p>{use.solution}</p><div className="flatbed-use-actions"><JourneyAction to={use.to}>{use.action}</JourneyAction><a className="flatbed-use-proof" href={use.proof}>{use.proofAction}<ArrowRight size={20} aria-hidden="true"/></a></div></div>
  </div>)}
  <p className="flatbed-use-fit">A setup starts with your needs. NJO confirms mounting, loaded weight, fit and available options for your truck before you order.</p>
  <noscript><p>Explore <a href={P.camper}>camper setups</a>, <a href={P.ute}>camping and overland builds</a> or <a href={P.work}>work and farm flatbeds</a>.</p></noscript>
 </section>;
}
