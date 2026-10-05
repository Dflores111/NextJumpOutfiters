import React, {useId,useState,useRef,useEffect} from 'react';
import {ArrowUpRight,Plus,Maximize2,X,Layers3,Box,PanelBottomOpen,Tent} from 'lucide-react';
import {JourneyImage,JourneyAction} from './Journey.jsx';
import {P,inquiry} from './routes.js';

// Image Showcase + Animated Tab Bar mechanism extraction: manual photo selection,
// spatial annotation and a stable detail panel. No demo dependency or auto rotation.
const features=[
  {id:'platform',name:'The flatbed',Icon:Layers3,file:'ute-detail.jpg',alt:'Rear of the Super Ute in the workshop, showing the platform between its side boxes',x:49,y:47,title:'A platform for the whole plan.',body:'The factory bed makes way for a Next Jump aluminum flatbed. On this Super Ute, the platform brings the side storage and rear opening into one layout.',benefit:'Start with what needs to fit. Build the layout around it.',detail:'The exact platform and mounting depend on your truck.'},
  {id:'storage',name:'Side storage',Icon:Box,file:'ute-detail.jpg',alt:'Super Ute side storage boxes fitted along the edges of the flatbed',x:79,y:40,title:'Your gear. Within reach.',body:'A pair of side boxes puts storage along the edges of this build. Plan a place for your equipment while keeping the center of the platform available.',benefit:'Think about what you reach for first at camp or on the job.',detail:'Box sizes, access and clearance are reviewed with the vehicle.'},
  {id:'tailgate',name:'The tailgate',Icon:PanelBottomOpen,file:'ute-detail.jpg',alt:'The Super Ute tailgate lowered between the two storage boxes',x:37,y:64,title:'The rear opening, worked out.',body:'Here, the tailgate works with the side-box arrangement to close the rear of the setup. The workshop photo shows it lowered, before the topper goes on.',benefit:'See how the pieces connect before choosing your own.',detail:'Tailgate and topper compatibility need a configuration review.'},
  {id:'camp',name:'Camp setup',Icon:Tent,file:'ute-front.jpg',alt:'Completed Super Ute with its Flated topper and TRUKD rack on a forest road',x:61,y:40,title:'One truck. A complete setup.',body:'The completed collaboration adds a Flated topper and TRUKD rack above the Next Jump flatbed. The carrying system and camp equipment are planned together.',benefit:'Carry the trip. Keep the everyday truck underneath.',detail:'Equipment shown belongs to this 2017 Ford F-250 collaboration.'}
];
export default function RigExplorer({compact=false}){
  const [active,setActive]=useState(0),[open,setOpen]=useState(false);
  const uid=useId(),refs=useRef([]),dialog=useRef(null);const item=features[active];
  useEffect(()=>{if(!open)return;const prior=document.activeElement,overflow=document.body.style.overflow;dialog.current.showModal();document.body.style.overflow='hidden';return()=>{document.body.style.overflow=overflow;prior?.focus()}},[open]);
  function key(event,index){let next=index;if(event.key==='ArrowRight')next=(index+1)%features.length;else if(event.key==='ArrowLeft')next=(index+features.length-1)%features.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=features.length-1;else return;event.preventDefault();setActive(next);refs.current[next]?.focus()}
  return <section className={`rig-explorer ${compact?'rig-compact':''}`} id="explore-the-build" aria-labelledby={`${uid}-heading`}>
    <div className="container rig-heading"><div><span className="eyebrow">EXPLORE A REAL NEXT JUMP BUILD</span><h2 id={`${uid}-heading`}>It’s all in<br/><span className="trail-mark">the setup.</span></h2></div><div><p>Get closer to the Super Ute. Pick a part and see how the whole truck comes together.</p><a className="text-link" href={P.ute}>The complete build story <ArrowUpRight size={20} aria-hidden="true"/></a></div></div>
    <div className="container"><div className="rig-console">
      <div className="rig-view"><div className="rig-image-plane"><JourneyImage key={item.file} file={item.file} alt={item.alt} sizes="(max-width: 900px) 100vw, 72vw"/>
        <div className="rig-annotations" role="group" aria-label="Explore parts on the truck photo">{features.map((f,i)=>f.file===item.file&&<button type="button" key={f.id} style={{left:`${f.x}%`,top:`${f.y}%`}} className="rig-pin" aria-label={`Explore ${f.name.toLowerCase()}`} aria-pressed={active===i} aria-controls={`${uid}-detail`} onClick={()=>setActive(i)}><span>{i+1}</span><Plus size={18} aria-hidden="true"/></button>)}</div>
        <button type="button" className="rig-enlarge" onClick={()=>setOpen(true)}><Maximize2 size={19} aria-hidden="true"/><span>View photo</span></button>
        <span className="rig-photo-label">{active===3?'ON THE ROAD':'IN THE WORKSHOP'}</span>
      </div></div>
      <div className="rig-detail" id={`${uid}-detail`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} tabIndex={0}><div className="rig-detail-top"><item.Icon size={32} strokeWidth={1.5} aria-hidden="true"/><span>0{active+1} / 04</span></div><div key={item.id} className="rig-detail-copy" aria-live="polite" aria-atomic="true"><h3>{item.title}</h3><p>{item.body}</p><p className="rig-benefit">{item.benefit}</p></div><JourneyAction to={inquiry('flatbed',{project:'super-ute',feature:item.id})}>Plan something like this</JourneyAction></div>
      <div className="rig-selector" role="tablist" aria-label="Super Ute features">{features.map((f,i)=><button key={f.id} ref={el=>refs.current[i]=el} type="button" role="tab" id={`${uid}-tab-${i}`} aria-controls={`${uid}-detail`} aria-selected={active===i} tabIndex={active===i?0:-1} onKeyDown={e=>key(e,i)} onClick={()=>setActive(i)}><f.Icon size={22} aria-hidden="true"/><span>{f.name}</span><span className="rig-tab-number" aria-hidden="true">0{i+1}</span></button>)}</div>
    </div><p className="rig-fineprint">{item.detail} <a href={P.builder}>Plan your flatbed <ArrowUpRight size={16} aria-hidden="true"/></a></p></div>
    {open&&<dialog ref={dialog} className="rig-photo-dialog" aria-label="Super Ute detail photo" onCancel={e=>{e.preventDefault();setOpen(false)}}><div><span>{item.name} · Super Ute</span><button type="button" onClick={()=>setOpen(false)} aria-label="Close truck photo"><X/></button></div><JourneyImage file={item.file} alt={item.alt}/><p>{item.detail}</p></dialog>}
  </section>;
}
