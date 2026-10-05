import {useEffect,useState} from 'react';

// Progressive enhancement: content starts visible; native scrolling is never intercepted.
export function useExperienceMotion(){
  const [paused,setPaused]=useState(false);
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{try{setPaused(sessionStorage.getItem('nj-motion-paused')==='true')}catch{}},[]);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[]);
  useEffect(()=>{
    const off=paused||reduced;
    document.documentElement.dataset.motion=off?'off':'on';
    const reveals=[...document.querySelectorAll('[data-reveal]')];
    const scenes=[...document.querySelectorAll('[data-scene]')];
    const ambient=[...document.querySelectorAll('[data-ambient]')];
    if(off){ambient.forEach(el=>el.dataset.ambientVisible='false');reveals.forEach(el=>el.classList.remove('reveal-pending'));scenes.forEach(el=>{el.style.setProperty('--scene-progress','0');el.style.setProperty('--view-progress','.5')});return;}
    const ambientObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{entry.target.dataset.ambientVisible=String(entry.isIntersecting&&!document.hidden)}));
    ambient.forEach(el=>ambientObserver.observe(el));
    const syncAmbient=()=>ambient.forEach(el=>{const rect=el.getBoundingClientRect();el.dataset.ambientVisible=String(!document.hidden&&rect.bottom>0&&rect.top<innerHeight)});
    document.addEventListener('visibilitychange',syncAmbient);
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');entry.target.classList.add('reveal-in');observer.unobserve(entry.target)}}),{threshold:0.12});
    reveals.forEach(el=>{if(el.getBoundingClientRect().top>window.innerHeight){el.classList.add('reveal-pending');observer.observe(el)}});
    let frame=0;
    const update=()=>{
      frame=0;
      if(document.hidden)return;
      scenes.forEach(el=>{
        const rect=el.getBoundingClientRect();
        if(rect.bottom>0&&rect.top<innerHeight){
          const exit=Math.max(0,Math.min(1,-rect.top/rect.height));
          const view=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
          el.style.setProperty('--scene-progress',String(exit));
          el.style.setProperty('--view-progress',String(view));
        }
      });
    };
    const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)};
    window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',scroll);document.addEventListener('visibilitychange',scroll);update();
    return()=>{observer.disconnect();ambientObserver.disconnect();document.removeEventListener('visibilitychange',syncAmbient);ambient.forEach(el=>el.dataset.ambientVisible='false');cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);window.removeEventListener('resize',scroll);document.removeEventListener('visibilitychange',scroll);reveals.forEach(el=>el.classList.remove('reveal-pending'))};
  },[paused,reduced]);
  return {motionOff:paused||reduced,reduced,toggleMotion:()=>setPaused(value=>{const next=!value;try{sessionStorage.setItem('nj-motion-paused',String(next))}catch{}return next})};
}
