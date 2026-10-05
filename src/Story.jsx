import React from 'react';
import {Wrench, Flag, Quote} from 'lucide-react';
import {P,inquiry} from './routes.js';
import {FullPhotoHero, JourneyImage, JourneyAction, CustomerProof, LeadSection} from './Journey.jsx';

export function ShopStoryTeaser(){
  return <section className="shop-story container" data-scene>
    <div className="shop-story-photo" data-reveal><JourneyImage file="install.jpg" alt="Next Jump installation specialist fitting underbody storage beside a truck"/><span className="shop-story-stamp"><Wrench aria-hidden="true"/>Made personal.<br/>Built in Tacoma.</span></div>
    <div className="shop-story-copy" data-reveal><span className="eyebrow">VETERAN-OWNED. ADVENTURE-DRIVEN.</span><h2>We’re here for<br/><span className="trail-mark">the next trip.</span></h2><p>And the one after that. Next Jump grew from a simple belief: getting outdoors should fit into your life.</p><p>That’s why we build around real people, real gear and the way you want to use your truck. Come talk with the people who’ll work on it.</p><JourneyAction to={P.about}>Meet the spirit of the shop</JourneyAction></div>
  </section>;
}

export function AboutStory(){
  return <div className="expressive-page about-story">
    <FullPhotoHero file="ute-tent.jpg" alt="The Super Ute at camp with its rooftop tent deployed" kicker="OUR STORY / VETERAN-OWNED & OPERATED" title={<>More time<br/><em>out there.</em></>} description="We build trucks for the life you want to get out and live. Work, family, camping, the next trail—make room for all of it." action="Let’s talk about your rig" to="#start-project" secondary={{to:P.projects,label:'See what we build'}}/>
    <div id="page-content" className="story-belief container"><span className="eyebrow">WHY NEXT JUMP EXISTS</span><h2>The trip should be<br/><span className="trail-mark">the good part.</span></h2><div><p>Researching gear. Packing the truck. Setting up camp. Breaking it all down again. Sometimes getting away starts to feel like another job.</p><p>Next Jump began with a different idea: make the rig more versatile and the routine simpler, so adventure can become part of everyday life. We call it Jump Life.</p></div></div>
    <section className="founder-story container" aria-labelledby="founder-heading"><div className="founder-portrait"><img src="/images/j-scott.webp" width="532" height="530" loading="lazy" alt="J. Scott, Next Jump founder"/><span>J. SCOTT / FOUNDER</span></div><div><span className="eyebrow">THE PERSON BEHIND THE IDEA</span><h2 id="founder-heading">Make room<br/>for the <span className="trail-mark">living part.</span></h2><p>J. Scott founded Next Jump to make room for exploration alongside work and family. That belief shapes our modular flatbeds and the way we outfit a rig.</p><figure><Quote aria-hidden="true" size={24}/><blockquote>“Play has become secondary.”</blockquote><figcaption>J. Scott, on the problem Next Jump set out to solve</figcaption></figure></div></section>
    <section className="story-workshop container" aria-labelledby="workshop-heading"><div className="story-workshop-image"><JourneyImage file="ute-1130.jpg" alt="Three people celebrating the Super Ute build beside its flatbed in the Next Jump workshop"/><span>THE SUPER UTE / AT THE TACOMA SHOP</span></div><div className="story-workshop-caption"><h2 id="workshop-heading">Good people.<br/>Hands-on work.</h2><p>From a single upgrade to a complete flatbed setup, the details matter. Tell us what you carry, where you go and what gets in the way. That’s where a better build starts.</p></div></section>
    <section className="story-manifesto" data-ambient><div className="trail-contours" aria-hidden="true"><i/><i/><i/></div><div className="container"><Flag size={38} aria-hidden="true"/><span className="eyebrow">VETERAN-OWNED & OPERATED · TACOMA, WA</span><h2>Built with purpose.<br/><span className="trail-mark">Used with passion.</span></h2><p>We’re an outfitter, a workshop and a community of people who love getting outside. The truck is the starting point. What you do with it is the reason.</p><div className="journey-actions"><JourneyAction to={P.services}>Find your next upgrade</JourneyAction><JourneyAction to={P.contact} secondary>Come talk trucks</JourneyAction></div></div></section>
    <CustomerProof context="about" to="#start-project"/>
    <LeadSection/>
  </div>;
}
