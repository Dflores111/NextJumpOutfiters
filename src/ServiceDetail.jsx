import React, {useId} from 'react';
import {ArrowUpRight, Check, ChevronDown, MoveVertical, Shield, CircleDot, Zap, Lightbulb, Tent, Truck, Droplets, Waves, Anchor, Caravan, ClipboardList, Wrench, MessageCircle} from 'lucide-react';
import {FullPhotoHero, JourneyImage, JourneyAction, CustomerProof} from './Journey.jsx';
import {Inquiry} from './Inquiry.jsx';
import {P, services, serviceKeys, inquiry} from './routes.js';
import {serviceDetailData} from './service-detail-data.js';
import './service-detail.css';

const icons={suspension:MoveVertical,rack:Shield,wheel:CircleDot,power:Zap,light:Lightbulb,tent:Tent,camper:Truck,wash:Droplets,boat:Waves,marine:Anchor,trailer:Caravan};

// FAQ 4 mechanism extraction: native optional disclosures, no redundant category tabs.
function ServiceQuestions({detail}) {
  return <div className="service-questions">
    <details><summary>{detail.question}<ChevronDown size={22} aria-hidden="true"/></summary><p>{detail.answer}</p></details>
    <details><summary>What happens after I ask for a quote?<ChevronDown size={22} aria-hidden="true"/></summary><p>The team reviews your project details with you. The work, equipment, pricing and timing need to be confirmed before an appointment is booked.</p></details>
  </div>;
}

function ServiceLead({page,detail}) {
  const subject=detail.vessel?'boat':detail.trailer?'trailer':'vehicle';
  return <section className="lead-section service-lead" id="start-project" data-ambient>
    <div className="trail-contours" aria-hidden="true"><i/><i/><i/></div>
    <div className="container lead-grid">
      <div className="lead-copy"><span className="eyebrow">{page.label}</span><h2>Let’s plan<br/><span className="trail-mark">your {detail.care?'service':'project'}.</span></h2><p>Tell us about your {subject} and what you want to change. Start with these details—you don’t need to have every answer.</p><ul>{detail.prepare.map(item=><li key={item}><Check aria-hidden="true"/>{item}</li>)}</ul><a href="tel:+12533010028" className="lead-phone">Prefer to talk? (253) 301-0028 <ArrowUpRight size={20} aria-hidden="true"/></a></div>
      <Inquiry query={{context:'service',service:serviceKeys[page.id]}} embedded/>
    </div>
  </section>;
}

export function ServiceDetail({page}) {
  const detail=serviceDetailData[page.id]; const id=useId();
  if(!detail)return null;
  const Icon=icons[detail.icon];
  const to=inquiry('service',{service:serviceKeys[page.id]});
  return <div className={`service-detail-page service-detail-${page.id} ${detail.product?'service-detail-equipment':'service-detail-experience'}`}>
    <FullPhotoHero file={detail.hero} alt={detail.heroAlt} kicker={`TACOMA / ${page.label.toUpperCase()}`} title={detail.title} description={detail.intro} action={detail.care?'Discuss my service':detail.vessel||detail.trailer?'Discuss my project':'Plan my installation'} to="#start-project" secondary={{label:'Talk to the shop',to:'tel:+12533010028'}} caption={detail.heroCaption}/>
    <div id="page-content" className="container service-route-nav"><nav aria-label="Breadcrumb"><a href={P.services}>Installation & services</a><span aria-hidden="true">/</span><span aria-current="page">{page.label}</span></nav><a href="#start-project">Discuss your project <ArrowUpRight size={18} aria-hidden="true"/></a></div>
    <section className="service-workbench container" aria-labelledby={`${id}-scope`}>
      <div className="service-scope-heading" data-reveal><span className="service-heading-icon"><Icon size={33} strokeWidth={1.5} aria-hidden="true"/></span><h2 id={`${id}-scope`}>{detail.heading}</h2><p>{detail.description}</p></div>
      <div className="service-scope-layout">
        <figure className={`service-scope-photo ${detail.product?'service-product-photo':''}`} data-reveal><JourneyImage file={detail.image} alt={detail.imageAlt} sizes="(max-width: 850px) 100vw, 55vw"/><figcaption><span>{detail.imageCaption}</span>{detail.example&&<a href={detail.example.to}>{detail.example.label}<ArrowUpRight size={19} aria-hidden="true"/></a>}</figcaption></figure>
        <div className="service-scope-points">{detail.scope.map(([title,description],i)=><div className="service-scope-point" data-reveal key={title}><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}</div>
      </div>
    </section>
    <section className="service-next container" aria-labelledby={`${id}-next`}>
      <div className="service-next-heading"><span className="eyebrow">FROM IDEA TO AGREED PLAN</span><h2 id={`${id}-next`}>Know what comes next.</h2><p>Get clear on the work before you commit.</p><JourneyAction to="#start-project">Start the conversation</JourneyAction></div>
      <div><ol className="service-next-steps"><li><MessageCircle aria-hidden="true"/><div><h3>Tell us what you need.</h3><p>Share the {detail.vessel?'boat':detail.trailer?'trailer and tow vehicle':'vehicle'}, the goal and any equipment you already have.</p></div></li><li><ClipboardList aria-hidden="true"/><div><h3>Work through the details.</h3><p>Review the {detail.care?'condition and service scope':'equipment, fitment and project scope'} with the team.</p></div></li><li><Wrench aria-hidden="true"/><div><h3>Agree on the work.</h3><p>Confirm the price and timing before booking. A quote request starts the conversation.</p></div></li></ol><ServiceQuestions detail={detail}/></div>
    </section>
    <CustomerProof context={page.id} to={to}/>
    <ServiceLead page={page} detail={detail}/>
    <section className="service-related container" aria-labelledby={`${id}-related`}><h2 id={`${id}-related`}>Part of a bigger plan?</h2><div>{detail.related.map(key=>{const related=services.find(s=>s.id===key); const RelatedIcon=icons[serviceDetailData[key].icon];return <a key={key} href={related.path}><RelatedIcon size={30} strokeWidth={1.5} aria-hidden="true"/><span>{related.label}</span><ArrowUpRight size={23} aria-hidden="true"/></a>})}</div><a className="text-link" href={P.services}>See all services <ArrowUpRight size={18} aria-hidden="true"/></a></section>
  </div>;
}
