import React, {useId, useState, useRef} from 'react';
import {ArrowUpRight, ArrowDown, Check, ChevronDown, Quote, Plus, MoveVertical, Shield, CircleDot, Zap, Lightbulb, Tent, Truck, Droplets, Waves, Anchor, Caravan} from 'lucide-react';
import {P, inquiry, services, serviceImages, serviceKeys} from './routes.js';
import {Inquiry} from './Inquiry.jsx';
import {reviews, proofByContext, googleReviews} from './customerProof.js';
import {actionMotionProps} from './actionMotion.js';

export function JourneyImage({file, alt, eager=false, sizes='100vw', ...props}) {
  const stem=file.replace(/\.[^.]+$/, '');
  return <img src={`/images/${stem}-1600.webp`} srcSet={`/images/${stem}-640.webp 640w, /images/${stem}-1000.webp 1000w, /images/${stem}-1600.webp 1600w`} sizes={sizes} alt={alt} loading={eager?'eager':'lazy'} fetchPriority={eager?'high':'auto'} width="1600" height="1000" {...props}/>;
}
export function JourneyAction({to, children, secondary=false}) {
  return <a className={`journey-action ${secondary?'journey-action-secondary':''}`} href={to} {...actionMotionProps(to)}><span>{children}</span><ArrowUpRight aria-hidden="true" size={21}/></a>;
}

// Modern Hero + Scroll Expansion Hero: bounded native scroll, visible offer and actions.
export function FullPhotoHero({file, alt, kicker, title, description, action='Get a quote', to=inquiry(), secondary, caption, home=false}) {
  const id=useId();
  return <section className={`full-photo-hero ${home?'full-photo-home':''}`} data-scene aria-labelledby={id}>
    <div className="full-photo-media"><JourneyImage file={file} alt={alt} eager/></div>
    <div className="full-photo-overlay" aria-hidden="true"/>
    <div className="full-photo-copy container"><p className="hero-kicker">{kicker}</p><h1 id={id}>{title}</h1><p className="hero-description">{description}</p><div className="journey-actions"><JourneyAction to={to}>{action}</JourneyAction>{secondary&&<JourneyAction to={secondary.to} secondary>{secondary.label}</JourneyAction>}</div></div>
    <div className="full-photo-foot container"><a href="#page-content">Explore what’s possible <ArrowDown size={19}/></a><span>{caption||'Next Jump photography. Equipment varies by project.'}</span></div>
  </section>;
}

export function PhotoChapter({file, alt, label, title, children, to, action, secondary}) {
  return <section className="photo-chapter" data-scene>
    <div className="chapter-media"><JourneyImage file={file} alt={alt}/></div>
    <div className="chapter-shade" aria-hidden="true"/>
    <div className="chapter-copy"><span className="hero-kicker">{label}</span><h2>{title}</h2><p>{children}</p><div className="journey-actions"><JourneyAction to={to}>{action}</JourneyAction>{secondary&&<JourneyAction to={secondary.to} secondary>{secondary.label}</JourneyAction>}</div></div>
  </section>;
}

// Native disclosure gives mouse, touch and keyboard users the same review context.
export function CustomerProof({to=inquiry(),context='home'}) {
  const uid=useId();const selected=(proofByContext[context]||[]).map(key=>reviews[key]);
  if(!selected.length)return null;
  const partnership=selected.every(item=>item.project);
  return <section className={`customer-proof container proof-count-${selected.length}`} aria-labelledby={`${uid}-heading`}>
    <div className="journey-section-head" data-reveal><div><span className="eyebrow">{partnership?'FROM THE BUILD PARTNER':'REAL PEOPLE. REAL PROJECTS.'}</span><h2 id={`${uid}-heading`}>{partnership?<>A build worth <span className="trail-mark">talking about.</span></>:<>Good work.<br/><span className="trail-mark">Word gets around.</span></>}</h2></div><a className="text-link" href={googleReviews}>More reviews on Google <ArrowUpRight size={19}/></a></div>
    <div className="proof-columns">{selected.map((item,i)=><article className={`proof-card proof-card-${i} ${item.image?'proof-card-photo':''}`} key={item.name} data-reveal style={item.image?{'--proof-image':`url('/images/${item.image}-1000.webp')`}:undefined}>
      <figure><Quote aria-hidden="true" size={35}/><span className="proof-topic">{item.topic}</span><blockquote>“{item.quote}”</blockquote><figcaption><strong>{item.name}</strong><span>{item.label}</span></figcaption></figure>
      <details className="proof-detail"><summary>About this project <Plus size={20} aria-hidden="true"/></summary><div><p>{item.context}</p><a href={item.source}>View review source <ArrowUpRight size={17} aria-hidden="true"/></a>{item.project&&<a href={P.ute}>Explore the Super Ute <ArrowUpRight size={17} aria-hidden="true"/></a>}</div></details>
    </article>)}</div>
    <div className="proof-next"><p>Have something in mind? Bring us the truck and the idea.</p><JourneyAction to={to}>Let’s talk about your project</JourneyAction></div>
  </section>;
}

const serviceDetails={P16:[MoveVertical,'Lifts & suspension','Get the stance and ride your setup needs.'],P17:[Shield,'Bumpers & racks','Add protection and room for your gear.'],P18:[CircleDot,'Wheels & tires','Match the rubber to the road ahead.'],P19:[Zap,'Power & electrical','Keep the essentials powered away from campgrounds.'],P20:[Lightbulb,'Lighting','See the trail. Light up camp.'],P21:[Tent,'Rooftop tents','Give your next campsite a better setup.'],P22:[Truck,'Camper installation','Bring the truck and camper together.'],P23:[Droplets,'Vehicle detailing','Get the road trip off your rig.'],P24:[Waves,'Boat detailing','Get your boat ready for its next outing.'],P25:[Anchor,'Marine outfitting','Plan equipment around life on the water.'],P26:[Caravan,'Trailer projects','Build more room into your adventures.']};

const serviceGroups=[
  {name:'Off-road & performance',file:'services-hero.jpg',alt:'Toyota 4Runner equipped for overland travel',title:'Make the upgrades work together.',text:'Suspension, tires, racks, lighting and power should fit the vehicle—and how you use it.',ids:['P16','P17','P18','P19','P20']},
  {name:'Camping & overland',file:'ute-tent.jpg',alt:'Super Ute with its rooftop tent deployed at camp',title:'From daily driver to basecamp.',text:'Plan the tent, camper and carrying setup around your truck, your gear and your trips.',ids:['P21','P22']},
  {name:'Care & other projects',file:'boat.png',alt:'Boat shown by Next Jump Outfitters',title:'Keep the rest of your adventures ready.',text:'Vehicle detailing, marine projects and trailer work. Share the details so we can confirm the service scope.',ids:['P23','P24','P25','P26']}
];
function moveTab(event,index,count,activate,refs){let target=index;if(event.key==='ArrowRight')target=(index+1)%count;else if(event.key==='ArrowLeft')target=(index+count-1)%count;else if(event.key==='Home')target=0;else if(event.key==='End')target=count-1;else return;event.preventDefault();activate(target);refs.current[target]?.focus()}

export function ServiceExplorer(){
  const [active,setActive]=useState(0);const refs=useRef([]);const uid=useId();
  return <section className="service-explorer container" aria-labelledby={`${uid}-heading`}>
    <div className="journey-section-head" data-reveal><div><span className="eyebrow">PICK THE JOB. SEE THE POSSIBILITIES.</span><h2 id={`${uid}-heading`}><span className="trail-mark">Upgrade your rig.</span></h2></div><p>One upgrade or a complete setup. Start with the problem you want to solve.</p></div>
    <div className="journey-tabs" role="tablist" aria-label="Installation categories">{serviceGroups.map((g,i)=><button key={g.name} type="button" role="tab" id={`${uid}-tab-${i}`} aria-controls={`${uid}-panel-${i}`} aria-selected={active===i} tabIndex={active===i?0:-1} ref={el=>refs.current[i]=el} onClick={()=>setActive(i)} onKeyDown={e=>moveTab(e,i,serviceGroups.length,setActive,refs)}>{g.name}</button>)}</div>
    {serviceGroups.map((g,i)=><div key={g.name} className="service-tab-panel" id={`${uid}-panel-${i}`} role="tabpanel" aria-labelledby={`${uid}-tab-${i}`} hidden={active!==i} tabIndex={0}><div className="service-tab-media"><JourneyImage file={g.file} alt={g.alt}/><div><h3>{g.title}</h3><p>{g.text}</p></div></div><div className="service-tab-links">{g.ids.map(id=>{const s=services.find(x=>x.id===id);const [Icon,title,description]=serviceDetails[id];return <a key={id} href={s.path}><span className="service-icon"><Icon size={28} strokeWidth={1.6} aria-hidden="true"/></span><span className="service-link-copy"><strong>{title}</strong><span>{description}</span></span><ArrowUpRight className="service-link-arrow" size={23} aria-hidden="true"/></a>})}</div><JourneyAction to={inquiry('service')}>Request an installation quote</JourneyAction></div>)}
  </section>;
}

const faqGroups=[
  {name:'Flatbeds',items:[['Do I need to know exactly what I want?','No. Start with your truck and what it needs to carry or do. You can explore components in the builder, or ask the team to help shape the configuration.'],['Will the flatbed fit my truck?','Fitment depends on the vehicle and configuration. Share the year, make, model and factory bed length. The team must confirm mounting and compatibility before you order.'],['What goes into the quote?','The flatbed, selected equipment, installation and vehicle-specific work. A finished quote needs a confirmed scope; the preview does not display unapproved prices.']]},
  {name:'Installation',items:[['Can I start with just one upgrade?','Yes. Tell us about the installation you have in mind and any equipment already on your vehicle. The team will review the work before confirming the scope.'],['Can you install equipment I already have?','Share the exact product and vehicle details first. The team needs to review compatibility and confirm whether it can take on the installation.'],['Does requesting a quote book the work?','No. A request starts a conversation. Scope, pricing and scheduling are confirmed before an installation is booked.']]}
];
export function JourneyFAQ({initial=0}){
  const [active,setActive]=useState(initial);const refs=useRef([]);const uid=useId();
  return <section className="journey-faq container"><div><span className="eyebrow">BEFORE YOU START</span><h2>A few good questions.</h2><p>Get clear on the next step.</p><JourneyAction to={inquiry('general')}>Ask the team</JourneyAction></div><div><div className="journey-tabs" role="tablist" aria-label="Question topics">{faqGroups.map((g,i)=><button key={g.name} ref={el=>refs.current[i]=el} id={`${uid}-tab-${i}`} aria-controls={`${uid}-panel-${i}`} type="button" role="tab" aria-selected={active===i} tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={e=>moveTab(e,i,2,setActive,refs)}>{g.name}</button>)}</div>{faqGroups.map((g,i)=><div role="tabpanel" id={`${uid}-panel-${i}`} aria-labelledby={`${uid}-tab-${i}`} hidden={active!==i} key={g.name}>{g.items.map(([q,a])=><details key={q}><summary>{q}<ChevronDown size={21} aria-hidden="true"/></summary><p>{a}</p></details>)}</div>)}</div></section>;
}

export function LeadSection({context='general'}){
  return <section className="lead-section" id="start-project" data-ambient><div className="trail-contours" aria-hidden="true"><i/><i/><i/></div><div className="container lead-grid"><div className="lead-copy"><span className="eyebrow">YOUR TRUCK. YOUR PROJECT.</span><h2>{context==='service'?<>Let’s plan<br/><span className="trail-mark">your installation.</span></>:<>Let’s build<br/><span className="trail-mark">your next rig.</span></>}</h2><p>Tell us what you drive and what you want to change. We’ll help you work through the equipment, fitment and installation scope.</p><ul><li><Check/>A configuration around your needs</li><li><Check/>Clarity on the parts and installation</li><li><Check/>A next step before you commit</li></ul><a href="tel:+12533010028" className="lead-phone">Prefer to talk? (253) 301-0028 <ArrowUpRight size={20}/></a></div><Inquiry query={{context}} embedded/></div></section>;
}
