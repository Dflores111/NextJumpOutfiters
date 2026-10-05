import React from 'react';
import {ArrowUpRight} from 'lucide-react';
import {BuildStories} from './BuildStories.jsx';
import RigExplorer from './RigExplorer.jsx';
import {ShopStoryTeaser} from './Story.jsx';
import {P, inquiry} from './routes.js';
import {FullPhotoHero, PhotoChapter, CustomerProof, JourneyFAQ, LeadSection, JourneyAction} from './Journey.jsx';

export default function HomeExperience(){
  return <div className="expressive-home journey-home">
    <FullPhotoHero home file="hero.png" alt="Next Jump Ford F-350 aluminum flatbed on a wooded trail" kicker="NEXT JUMP OUTFITTERS / TACOMA, WASHINGTON" title={<>Aluminum flatbeds.<br/><em>Serious truck upgrades.</em></>} description="More space for gear. A setup that works together. We build modular flatbeds and install off-road equipment for work, camping and everything in between." action="Get a quote" to="#start-project" secondary={{to:P.builder,label:'Plan your flatbed'}}/>
    <div id="page-content" className="journey-value-strip"><span>Modular aluminum flatbeds</span><span>Off-road & overland installations</span><span>Veteran-owned Tacoma shop</span></div>
    <div className="journey-chapters container">
      <div className="journey-section-head" data-reveal><div><span className="eyebrow">LESS COMPROMISE. MORE TRUCK.</span><h2>Build around<br/><span className="trail-mark">what you actually do.</span></h2></div><p>Haul the tools. Pack for a longer trip. Make camp easier. Start with the job your current setup can’t do.</p></div>
      <PhotoChapter file="ute-detail.jpg" alt="Super Ute flatbed with its tailgate down and side storage boxes" label="MODULAR ALUMINUM FLATBEDS" title={<>More room.<br/>Less digging.</>} to={P.flatbeds} action="Explore the flatbed system" secondary={{to:inquiry('flatbed'),label:'Get a flatbed quote'}}>Replace the factory bed with an open platform. Add storage boxes, removable sides and camp equipment around the gear you carry.</PhotoChapter>
      <PhotoChapter file="services-hero.jpg" alt="Black Toyota 4Runner outfitted with a rooftop tent on a forest trail" label="OFF-ROAD & OVERLAND INSTALLATION" title={<>Off-road installs.<br/><span className="trail-mark">Done right.</span></>} to={P.services} action="Explore installation services" secondary={{to:inquiry('service'),label:'Get an installation quote'}}>Suspension, tires, racks, lighting, power and camping equipment. Planned around your vehicle and installed at our Tacoma shop.</PhotoChapter>
      <div className="journey-use-links"><a href={P.camper}>Building around a camper? <ArrowUpRight/></a><a href={P.work}>Need a truck that works harder? <ArrowUpRight/></a></div>
    </div>
    <CustomerProof to="#start-project"/>
    <RigExplorer/><BuildStories/>
    <ShopStoryTeaser/><JourneyFAQ/>
    <LeadSection/>
  </div>;
}
