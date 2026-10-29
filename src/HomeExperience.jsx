import React from 'react';
import {BuildStories} from './BuildStories.jsx';
import {ShopStoryTeaser} from './Story.jsx';
import {P,inquiry} from './routes.js';
import {FullPhotoHero,PhotoChapter,CustomerProof,LeadSection} from './Journey.jsx';
import {StartingPaths,BrandDifference,BuildWays,Questions} from './Marketing.jsx';
export default function HomeExperience(){return <div className="expressive-home journey-home njo-home">
 <FullPhotoHero home file="hero.png" alt="Next Jump Ford F-350 aluminum flatbed on a wooded trail" kicker="OFF-ROAD & OVERLAND SHOP · TACOMA, WA" title={<>From one truck upgrade to a <em>complete expedition build.</em></>} description="Make room for your tools, plan around a camper or improve how your truck rides. Start with the change you need. We'll work through the parts, fit and installation with you." signature="You drive. We're your pit crew." action="Explore installation services" to={P.services} secondary={{to:P.complete,label:'Explore complete builds'}}/>
 <div id="page-content"><StartingPaths/></div>
 <ShopStoryTeaser/>
 <BrandDifference/>
 <BuildStories compact/>
 <CustomerProof to={inquiry('general')}/>
 <BuildWays/>
 <div className="container njo-flatbed-teaser"><PhotoChapter file="flagship-ranger-flatbed.jpg" alt="Ford Ranger with a Next Jump modular flatbed and dropsides" label="MODULAR FLATBEDS" title="Start with a flatbed. Build from there." to={P.flatbeds+'#five-stages'} action="See the five stages">An open aluminum deck today. Lockable storage or a camper setup later. The NJO modular system is designed to grow with what you need from your truck.</PhotoChapter></div>
 <section className="njo-editorial container"><h2>The shop doesn't have to disappear after pickup.</h2><div><span className="eyebrow">BEYOND THE INSTALL</span><p>Getting ready for a trip? Dealing with something that broke? We plan to help with readiness checks, trip itineraries and post-trip care. These are paid services, separate from the build warranty.</p><a className="text-link" href={P.care}>Explore trip prep & care</a></div></section>
 <Questions items={[["Can I come in for just a lift or lighting?","Absolutely. One-time installs are welcome. You don't have to sign up for a full build."],["Do I need to know which parts I want?","No. Tell us what you drive and what you want the truck to do. We'll help work through the options."],["Do I have to build everything at once?","No. You can start with one upgrade, or talk to us about planning the whole build and available financing."]]}/>
 <LeadSection heading="Tell us what you're working on." description="A lift, a flatbed, a full build or an idea you're still figuring out. Start there. We'll help you work out the next step."/>
 </div>}
