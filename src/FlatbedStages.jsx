import React,{useEffect,useRef} from 'react';
import {ChevronDown} from 'lucide-react';
import {P,inquiry} from './routes.js';
import {FullPhotoHero,JourneyImage,JourneyAction,CustomerProof} from './Journey.jsx';
import RigExplorer from './RigExplorer.jsx';
import FlatbedUses from './FlatbedUses.jsx';
import {Questions,MarketingClose} from './Marketing.jsx';
const stages=[
 ['Flatbed & drop sides',"Load from the left, right or rear. No wheel wells in the deck, so there's room for the tools, materials or camp gear you actually carry. Use the integrated tie-down track to secure the load.",'Confirm deck size, dropside options, mounting and vehicle payload.'],
 ['Lockable storage',"Move the tools and gear out of your cab. Reach what you need from the side, with room for a rack when your setup calls for one.",'Build on the deck. Confirm box sizes, access and rack compatibility.'],
 ['Camper tray',"Ask about putting the boxes and tailgate on a removable tray, so the camper setup can come off as a unit when you need the open flatbed. Ask the team to walk you through the changeover.",'Review the tray, lifting method and which existing parts can carry forward.'],
 ['Camper shell',"Choose a compatible topper and ask about an NJO enclosure to create a camper. We'll review how the topper, panels, weather sealing and storage fit your truck.",'Confirm the topper, enclosure and mounting before choosing parts.'],
 ['Interior modules',"Ask about a bench that converts to a bed, a kitchen area and storage when you're ready to make the inside your own.",'Build around the camper layout. Confirm dimensions, weight and available modules.']
];
export function FlatbedJourney(){
 const system=useRef();
 useEffect(()=>{
  const revealSystem=()=>{if(window.location.hash==='#five-stages'&&system.current)system.current.open=true};
  revealSystem();window.addEventListener('hashchange',revealSystem);window.addEventListener('popstate',revealSystem);
  return()=>{window.removeEventListener('hashchange',revealSystem);window.removeEventListener('popstate',revealSystem)};
 },[]);
 return <div className="expressive-page njo-marketing njo-flatbeds">
 <FullPhotoHero file="hero.png" alt="Next Jump Ford flatbed on a wooded trail" kicker="NJO MODULAR ALUMINUM FLATBEDS" title="Load from three sides. Build on one flatbed." description="Get tools, materials and camp gear in and out without working around wheel wells. An open aluminum deck and drop sides give you loading access from the left, right and rear. Start with your truck, then review the size and options." action="Choose my truck" to={P.builder+'?kind=flatbed'} secondary={{label:'Talk to the shop',to:inquiry('flatbed')}}/>
 <nav id="page-content" className="breadcrumb container" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Flatbeds & campers</span></nav>
 <FlatbedUses/>
 <RigExplorer/>
 <details className="flatbed-system container" id="five-stages" ref={system}><summary><h2><span className="eyebrow">HOW THE SYSTEM GROWS</span><span>See the five-stage modular plan</span><ChevronDown size={28} aria-hidden="true"/></h2></summary>
 <div className="njo-stages"><div className="njo-stage-intro"><p>Start with an open deck for what you carry now. Then ask which storage or camper pieces can be added later, what you can keep and what needs to change for your truck.</p><figure><JourneyImage file="flagship-ranger-flatbed.jpg" alt="Ford Ranger photographed with a Next Jump flatbed, dropsides and underbody storage" sizes="(max-width:800px) 100vw,45vw"/><figcaption>A real flatbed starting point. The Ranger setup shown is an example, not a rendering of all five stages.</figcaption></figure><JourneyAction to={P.builder+'?kind=flatbed'}>Choose my truck</JourneyAction></div>
 <ol className="njo-stage-list">{stages.map(([title,text,check],i)=><li key={title}><span aria-hidden="true">0{i+1}</span><div><h3>{title}</h3><p>{text}</p><details><summary>What to check before adding this stage</summary><p>{check}</p></details></div></li>)}</ol></div>
 <div className="njo-technical"><h3>More space to load. More ways to reach it.</h3><p>An open deck gives you space to position a load. Drop sides let you reach it from three sides, and tie-down track provides places to secure it. Confirm the deck dimensions, mounting and your truck's carrying limits with NJO.</p></div><a className="flatbed-system-guide" href={P.guide}>Read the flatbed buyer's guide</a></details>
 <CustomerProof context="flatbed" to={inquiry('flatbed')}/>
 <Questions items={[["Can I start with only the flatbed?","Yes. Start with the deck and the pieces you need. We can talk about storage or camper options later."],["Will this fit my truck?","Fitment depends on year, model, bed configuration and the exact parts. The team will confirm compatibility before an order or installation."],["Can I use the same truck for work and camping?","That's what the modular approach is designed to help with. We'll review the setup and the changeover process for your truck."],["Do the builder selections lock in my price?","No. The final price depends on verified parts, vehicle fitment and installation scope."]]}/>
 <MarketingClose title="Start with the truck and what you carry." text="Choose your truck and a starting flatbed setup. NJO still needs to confirm fit, parts and pricing before you order. A saved plan does not reserve stock or book an installation." to={P.builder+'?kind=flatbed'} action="Choose my truck"/>
 </div>}
