import React,{useState,useRef,useEffect} from 'react';
import {ArrowUpRight,Play,X,ArrowRight,Maximize2} from 'lucide-react';
import {FullPhotoHero,JourneyImage,JourneyAction} from './Journey.jsx';
import {P,inquiry} from './routes.js';
const builds=[
  {name:'The Super Ute.',tag:'2017 FORD F-250 · COLLABORATION',file:'ute-front.jpg',alt:'Completed Super Ute Ford F-250 on a forest road',to:P.ute,text:'A Ford F-250 collaboration built around a flatbed, storage and camp setup.',label:'Explore the build'},
  {name:'Dillon’s F-250.',tag:'1993 FORD F-250 · CUSTOMER PROJECT',file:'flagship-dillon-f250.webp',alt:'Dillon Collins’s lifted green and white 1993 Ford F-250',to:P.dillon,text:'Other shops passed on the lift. Dillon found a team willing to take it on.',label:'See the lift project'},
  {name:'Camper on a flatbed',tag:'ALASKAN CAMPER · SETUP EXAMPLE',file:'flagship-camper-slide-in.jpg',alt:'Alaskan camper and side storage on a Next Jump branded Ford flatbed truck',to:P.camperStory,text:'A camper above. Storage beside it. See how the pieces work together.',label:'Explore the setup'},
  {name:'Small truck. Big ideas.',tag:'FORD RANGER · FLATBED SETUP',file:'flagship-ranger-flatbed.jpg',alt:'Ford Ranger with a Next Jump midsize flatbed, dropsides and underbody storage in a grassy field',to:P.rangerStory,text:'A midsize truck with a different kind of bed. Get a closer look at the platform, dropsides and storage.',label:'See the Ranger setup'}
];
export function BuildStories({index=false,compact=false}){return <section className={`build-stories container ${index?'build-stories-index':''} ${compact?'njo-stories-compact':''}`} aria-labelledby="build-stories-heading"><div className="build-stories-heading"><div><span className="eyebrow">FROM OUR SHOP</span><h2 id="build-stories-heading">Real trucks.<br/><span className="trail-mark">Real work.</span></h2></div><p>Take a closer look at the builds and installations we've worked on. Sometimes the whole project starts with one job.</p></div><div className="build-story-grid">{(compact?builds.slice(0,3):builds).map((b,i)=><a className={`build-story build-story-${i}`} href={b.to} key={b.to}><div className="build-story-photo"><JourneyImage file={b.file} alt={b.alt} sizes="(max-width: 800px) 100vw, 60vw"/><span className="build-story-open" aria-hidden="true"><ArrowUpRight/></span></div><div className="build-story-copy"><span className="eyebrow">{b.tag}</span><h3>{b.name}</h3><p>{b.text}</p><span className="text-link">{b.label} <ArrowRight size={20} aria-hidden="true"/></span></div></a>)}</div>{compact&&<a className="text-link njo-projects-more" href={P.projects}>See more projects <ArrowUpRight size={20} aria-hidden="true"/></a>}</section>}
export function ProjectIndex(){return <div className="expressive-page flagship-projects"><FullPhotoHero file="ute-tent.jpg" alt="Super Ute at camp in a wide open golden landscape" kicker="REAL PROJECTS" title="See what we've built. Find your starting point." description="A lift for a classic truck. A modular flatbed. A camp setup with room for more. Browse the work, then tell us what you'd like to do with your truck." action="Talk about my project" to={inquiry('general')} secondary={{to:'#build-stories-heading',label:'See the projects'}}/><div id="page-content"><BuildStories index/></div><ProjectNext/></div>}
function ProjectNext({context='general',project='',title='Have something like this in mind?',body="Tell us what caught your eye and what truck you're working with. We'll help figure out what's possible.",action='Plan something like this',secondary}){
 const mainAction=<JourneyAction to={inquiry(context,{...(project?{project}:{}),...(project==='dillon-f250'?{service:'suspension'}:{})})}>{action}</JourneyAction>;
 return <section className="project-next"><div className="container"><div><span className="eyebrow">YOUR TRUCK IS NEXT</span><h2>{title}</h2><p>{body}</p></div>{secondary?<div className="project-next-actions">{mainAction}<a className="text-link" href={secondary.to}>{secondary.label} <ArrowUpRight size={18} aria-hidden="true"/></a></div>:mainAction}</div></section>;
}
export function RangerStoryPage(){
 const to=inquiry('flatbed',{project:'ranger-flatbed'});
 return <div className="expressive-page flagship-story flagship-ranger"><FullPhotoHero file="flagship-ranger-flatbed.jpg" alt={builds[3].alt} kicker="FORD RANGER / PHOTOGRAPHED SETUP" title={<>Small truck.<br/><em>Big ideas.</em></>} description="A Ford Ranger with a Next Jump midsize flatbed. Dropsides, underbody storage and a platform ready for your next idea." to={to} action="Plan my Ranger setup" secondary={{to:'#ranger-details',label:'Look at the details'}} caption="Actual Next Jump setup. Configuration varies by truck."/>
 <div id="page-content" className="container project-story-body"><nav className="project-story-back" aria-label="Breadcrumb"><a href={P.projects}>Our work</a><span aria-hidden="true">/</span><span>Ford Ranger flatbed setup</span></nav><div className="project-story-intro" id="ranger-details"><h2>Your truck.<br/><span className="trail-mark">A different bed.</span></h2><div><p>You don’t need a full-size truck to start thinking differently about your bed. This Ranger is pictured with Next Jump’s midsize 5-foot flatbed, enclosed sides and storage below the deck.</p><p>Look at the space around the platform. Think about what you carry, where you need access and how the truck should work between trips. Those are the details to bring into your own build.</p></div></div><div className="project-full-photo"><JourneyImage file="flagship-ranger-flatbed.jpg" alt={builds[3].alt}/></div><div className="project-considerations">{[['A different platform','An aluminum bed gives this Ranger a new starting point for its equipment.'],['Storage below','The photographed underbody box keeps storage separate from the main deck.'],['Plan the whole setup','Discuss bed access, mounting, clearances and vehicle ratings before choosing equipment.']].map(([h,p],i)=><div key={h}><span>0{i+1}</span><h3>{h}</h3><p>{p}</p></div>)}</div><p className="project-source-note">Photographed setup from <a href="https://www.nextjumpoutfitters.com/collections/aluminum-flatbeds-truck-beds">Next Jump’s aluminum flatbed collection</a>. Fit and equipment need confirmation for your specific Ranger.</p><div className="project-related"><h3>Start with the truck you drive.</h3><p>Explore the flatbed components, then tell the shop which details matter to you.</p><JourneyAction to={P.flatbeds}>Explore aluminum flatbeds</JourneyAction></div></div><ProjectNext context="flatbed" project="ranger-flatbed" title="What could your Ranger carry?" body="Bring your vehicle details and the gear you want to take. Let’s work through the setup together."/></div>
}
function StoryPhotograph({file,alt,caption,portrait=false}) {
 const [open,setOpen]=useState(false);
 const dialog=useRef(null);
 useEffect(()=>{
  if(!open)return;
  const prior=document.activeElement,overflow=document.body.style.overflow;
  dialog.current.showModal();
  document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=overflow;prior?.focus()};
 },[open]);
 return <figure className={`story-photograph ${portrait?'story-photograph-portrait':''}`}>
  <button type="button" className="story-photo-open" onClick={()=>setOpen(true)} aria-label={`View full photograph: ${alt}`} aria-haspopup="dialog">
   <JourneyImage file={file} alt={alt} sizes="(max-width:800px) 100vw, 58vw"/>
   <span>View full photograph <Maximize2 size={18} aria-hidden="true"/></span>
  </button>
  <figcaption>{caption}</figcaption>
  {open&&<dialog ref={dialog} className="story-photo-dialog" aria-label="Project photograph" onCancel={e=>{e.preventDefault();setOpen(false)}}>
   <div className="story-photo-dialog-heading"><p>{caption}</p><button type="button" aria-label="Close project photograph" onClick={()=>setOpen(false)}><X aria-hidden="true"/></button></div>
   <JourneyImage file={file} alt={alt} eager/>
  </dialog>}
 </figure>;
}

export function BuildStoryPage({kind}){
 const isLift=kind==='dillon';
 const to=inquiry(isLift?'service':'camper',isLift?{service:'suspension',project:'dillon-f250'}:{project:'alaskan-camper'});
 const facts=isLift?[
  ['The truck','1993 Ford F-250'],['The work','Lift installation'],['The story','Dillon Collins, owner']
 ]:[
  ['The truck','Next Jump Ford flatbed'],['The camper','Alaskan'],['The setup','Camper + side storage']
 ];
 const notes=isLift?[
  ['The request','Dillon wanted a lift for his 1993 F-250. His review describes the difficulty of finding a shop willing to take on the job.'],
  ['The response','He contacted Next Jump and found a team ready to help. He describes care throughout the job and clear communication from the shop.'],
  ['The result','The completed truck is pictured here. In his review, Dillon highlights the communication, pricing and quality of the work.']
 ]:[
  ['The camper comes first','The Alaskan camper sits above the platform. Start your own plan with the exact camper model, dimensions and mounting requirements.'],
  ['Give the gear a place','Side boxes put storage alongside the camper. Think about what you need to reach when the camper is installed and how each door will open.'],
  ['Think about the whole truck','The camper, people, water and gear all add to the loaded truck. Vehicle ratings, clearances and installation details need to be reviewed together.']
 ];
 return <div className={`expressive-page flagship-story story-refined ${isLift?'flagship-lift':'flagship-camper'}`}>
  <FullPhotoHero file={isLift?'flagship-dillon-f250.webp':'flagship-camper-slide-in.jpg'} alt={isLift?builds[1].alt:builds[2].alt} kicker={isLift?'DILLON’S STORY / 1993 FORD F-250':'SETUP EXAMPLE / ALASKAN CAMPER'} title={isLift?<>A classic truck.<br/><em>A different stance.</em></>:<>Take your room<br/><em>on the road.</em></>} description={isLift?'Dillon wanted to lift his 1993 F-250. After other shops turned the job away, he called Next Jump. This is his truck—and his experience with the crew.':'A camper above the flatbed. Storage along the sides. Get closer to this Alaskan setup and the choices to work through for your own truck.'} to={to} action={isLift?'Plan my suspension upgrade':'Discuss my camper setup'} secondary={{to:'#story-details',label:isLift?'Read Dillon’s story':'Look at the setup'}} caption={isLift?'Dillon’s actual truck, published with his review.':'Next Jump setup photograph. Exact fit varies by vehicle.'}/>
  <div id="page-content" className="container project-story-body">
   <nav className="project-story-back" aria-label="Breadcrumb"><a href={P.projects}>Our work</a><span aria-hidden="true">/</span><span aria-current="page">{isLift?'Dillon’s F-250':'Alaskan camper setup'}</span></nav>
   <dl className="story-project-facts">{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   <div className="project-story-intro" id="story-details">
    <h2>{isLift?<>A shop willing<br/>to <span className="trail-mark">take it on.</span></>:<>A place for the camper.<br/>A place for <span className="trail-mark">the gear.</span></>}</h2>
    <div>{isLift?<><p>Dillon’s F-250 is a reminder that a project can start with one job. You don’t need a complete build plan to ask about a lift.</p></>:<><p>A camper needs space to live in. Your gear needs a place to go. This Next Jump Ford shows both in one setup, with an Alaskan camper above the platform and storage along the sides.</p></>}</div>
   </div>
   <section className="story-field-study" aria-labelledby="story-study-heading">
    <div className="story-study-heading"><span className="eyebrow">{isLift?'ONE TRUCK. ONE REAL PROJECT.':'LOOK CLOSER'}</span><h2 id="story-study-heading">{isLift?'The job. The care. The finished truck.':'Three parts of the same plan.'}</h2></div>
    <div className="story-study-grid">
     <StoryPhotograph file={isLift?'flagship-dillon-f250.webp':'flagship-camper-slide-in.jpg'} alt={isLift?builds[1].alt:builds[2].alt} portrait={isLift} caption={isLift?'Dillon’s completed F-250, photographed and published with his review.':'The photographed Alaskan setup: camper, Ford truck and side storage.'}/>
     <ol className="story-field-notes">{notes.map(([title,text],i)=><li key={title}><span className="story-note-number" aria-hidden="true">0{i+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
    </div>
   </section>
   {isLift?<figure className="owner-voice"><blockquote>“Great communication, great pricing, and amazing quality.”</blockquote><figcaption><strong>Dillon Collins</strong><span>1993 Ford F-250 lift · Customer review excerpt</span></figcaption><a href="https://www.nextjumpoutfitters.com/pages/lift-suspension-installation">Read Dillon’s published review <ArrowUpRight size={18} aria-hidden="true"/></a></figure>:<p className="project-source-note">Published setup example from <a href="https://www.nextjumpoutfitters.com/pages/flatbeds-for-overland-and-off-road-campers">Next Jump’s camper collection</a>. Fitment, equipment and installation scope need confirmation for your truck.</p>}
  </div>
  <ProjectNext context={isLift?'service':'camper'} project={isLift?'dillon-f250':'alaskan-camper'} title={isLift?'What would you change about your truck?':'Start with the camper you have in mind.'} body={isLift?'Tell us the year, make and model, your current setup and how you use the truck. The crew will review the parts, fitment and scope before confirming the work.':'Bring the camper model, truck details and the gear you want to carry. We’ll work through the platform, access and installation before confirming a setup.'} action={isLift?'Get a suspension quote':'Discuss my camper setup'} secondary={{to:isLift?'/pages/lift-suspension-installation':P.camper,label:isLift?'Explore suspension services':'Compare camper types'}}/>
 </div>;
}
export function WalkaroundFilm(){const [open,setOpen]=useState(false);const ref=useRef(null);useEffect(()=>{if(!open)return;const prior=document.activeElement,overflow=document.body.style.overflow;ref.current.showModal();document.body.style.overflow='hidden';return()=>{document.body.style.overflow=overflow;prior?.focus()}},[open]);return <section className="walkaround-film container"><button className="film-poster" type="button" onClick={()=>setOpen(true)} aria-label="Play the Super Ute walkaround"><JourneyImage file="ute-tent.jpg" alt="Super Ute camp setup in an open landscape at sunset"/><span className="film-play"><Play size={32} fill="currentColor" aria-hidden="true"/></span><span className="film-title"><span>ADVENTURE BUILT / SUPER UTE</span><strong>See it work.<br/>Watch the walkaround.</strong></span></button><p>Watch the original Adventure Built tour. Video loads from YouTube when opened.</p>{open&&<dialog ref={ref} className="film-dialog" aria-label="Super Ute walkaround video" onCancel={e=>{e.preventDefault();setOpen(false)}}><div><span>Super Ute · Adventure Built</span><button type="button" aria-label="Close walkaround video" onClick={()=>setOpen(false)}><X/></button></div><iframe title="Adventure Built Super Ute walkaround" src="https://www.youtube-nocookie.com/embed/06HrZY39eVk?rel=0" allow="fullscreen; picture-in-picture; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><a href="https://www.youtube.com/watch?v=06HrZY39eVk">Open the original video on YouTube <ArrowUpRight size={18}/></a></dialog>}</section>}
