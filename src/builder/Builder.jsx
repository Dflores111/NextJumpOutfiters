import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Plus, Minus, Download, ChevronDown, X, RotateCcw, Truck, Box, Compass, Tent, Briefcase, Sun, Info } from 'lucide-react';
import { STORAGE_KEY, products, uses, camperTypes, makeOptions, modelOptions, bedOptions, createBuild, parseSavedBuild, truckReady, validModelYear, toggleSelected, normalizeSelected, vehicleFromRoute, routeForVehicle } from './domain.js';
import './builder.css';

const steps = ['Your truck', 'Your setup', 'Your options', 'Review'];
const useIcons = [Sun, Briefcase, Compass, Tent, Box];
const readStep = value => /^\d$/.test(String(value)) ? Math.min(3, Number(value)) : 0;
const maxStep = build => truckReady(build.truck) ? build.use && (build.use !== 'Camper setup' || build.camperType) ? 3 : 1 : 0;

function Dialog({ title, onClose, children }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const prior = document.activeElement;
    const el = ref.current;
    el.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { el.close(); document.body.style.overflow = overflow; prior?.focus(); };
  }, []);
  function keydown(event) {
    if (event.key !== 'Tab') return;
    const focusable = [...ref.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <dialog ref={ref} className="builder-dialog" aria-labelledby={id} onKeyDown={keydown} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    if (event.target !== ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}><div className="builder-dialog-heading"><h2 id={id}>{title}</h2><button type="button" className="builder-icon-button" aria-label="Close dialog" onClick={onClose}><X size={22}/></button></div>{children}</dialog>;
}

export default function Builder({ routeVehicle = null, query = {} }) {
  const [build, setBuild] = useState(() => createBuild(routeVehicle));
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(null);
  const [filter, setFilter] = useState('All options');
  const [modal, setModal] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [truckChanged, setTruckChanged] = useState(false);
  const [mobileSummary, setMobileSummary] = useState(false);
  const heading = useRef(null);
  const firstStep = useRef(true);
  const buildRef = useRef(build);
  const vehicleKey = typeof routeVehicle === 'string' ? routeVehicle : JSON.stringify(routeVehicle);
  buildRef.current = build;

  useEffect(() => {
    let next = createBuild(routeVehicle);
    let stored = null;
    try {
      stored = parseSavedBuild(localStorage.getItem(STORAGE_KEY));
      if (stored) {
        next = stored;
        const route = vehicleFromRoute(routeVehicle);
        if (route) {
          const nextTruck = { ...stored.truck, make: route.make, model: route.model, bed: route.bed };
          if (JSON.stringify(stored.truck) !== JSON.stringify(nextTruck)) setTruckChanged(true);
          next = { ...stored, truck: nextTruck };
        }
      }
    } catch { /* Browsers may disallow storage; downloading still works. */ }
    const params = new URLSearchParams(window.location.search);
    const entryUse = { overland: 'Longer overland trips', work: 'Work & hauling', camper: 'Camper setup' }[params.get('use') || query.use];
    const entryCamper = { topper: 'Topper / camper shell', 'slide-in': 'Slide-in camper', flatbed: 'Flatbed camper', 'not-decided': 'Still deciding' }[params.get('camperType') || query.camperType];
    if (entryUse || entryCamper) {
      const use = entryUse || 'Camper setup';
      next = { ...next, use, camperType: use === 'Camper setup' ? entryCamper || next.camperType : '' };
      if (stored && (next.use !== stored.use || next.camperType !== stored.camperType)) setFeedback({ message: 'Your plans were updated from this page. Your saved truck and options are kept.', previous: stored });
    }
    setBuild(next);
    const requested = readStep(params.get('step') ?? query.step);
    setStep(Math.min(requested, maxStep(next)));
    setLoaded(true);
  }, [vehicleKey]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(build)); setSaved(true); }
    catch { setSaved(false); }
  }, [build, loaded]);

  useEffect(() => {
    const pop = () => {
      const requested = readStep(new URLSearchParams(window.location.search).get('step'));
      setStep(Math.min(requested, maxStep(buildRef.current)));
      setError('');
      setMobileSummary(false);
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [step]);

  const selected = products.filter(product => build.selected.includes(product.id));
  const matchedRoute = routeForVehicle(build.truck);
  const vehicleLabel = [build.truck.year, build.truck.make, build.truck.model].filter(Boolean).join(' ') || 'Your truck';
  const count = selected.length - 1;

  function go(target) {
    const allowed = maxStep(build);
    if (target > allowed) { setError(!validModelYear(build.truck.year) ? 'Enter a four-digit model year from 1900 to 2100, or leave it blank.' : allowed === 0 ? 'Choose your make, model and bed, or use the unsure option.' : 'Choose a use and, if relevant, a camper type. Still exploring is a valid choice.'); return; }
    const next = Math.min(3, Math.max(0, target));
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(next));
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setStep(next); setError(''); setMobileSummary(false);
  }
  function updateTruck(key, value) {
    const previous = build;
    const truck = key === 'make' ? { ...build.truck, make: value, model: value === 'Other / not sure' ? 'Not sure' : '', bed: value === 'Other / not sure' ? 'Not sure' : '' }
      : key === 'model' ? { ...build.truck, model: value, bed: value === 'Not listed / not sure' ? 'Not sure' : '' }
      : { ...build.truck, [key]: value };
    setBuild({ ...build, truck });
    setTruckChanged(true);
    if (build.use || count) setFeedback({ message: 'Truck updated. Your options are kept and need review for this truck.', previous });
  }
  function toggle(id, confirmed = false) {
    if (!confirmed && id === 'kitchen' && !build.selected.includes('kitchen') && !build.selected.includes('boxes')) { setModal({ kind: 'add-pair' }); return; }
    if (!confirmed && id === 'boxes' && build.selected.includes('kitchen')) { setModal({ kind: 'remove-pair' }); return; }
    const previous = build;
    const next = toggleSelected(build.selected, id);
    setBuild({ ...build, selected: next });
    setModal(null);
    setFeedback({ message: `${products.find(p => p.id === id).name} ${next.includes(id) ? 'added' : 'removed'}.${id === 'kitchen' && !previous.selected.includes('boxes') ? ' Upper storage boxes added too.' : id === 'boxes' && previous.selected.includes('kitchen') ? ' Kitchen insert removed too.' : ''}`, previous });
  }
  function download() {
    const blob = new Blob([JSON.stringify({ ...build, selected: normalizeSelected(build.selected) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'next-jump-build.json';
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback({ message: 'Build file prepared. Check your browser downloads. No inquiry was sent.' });
  }
  function saveNow() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(build)); setSaved(true); setFeedback({ message: 'Build saved on this browser. Your contact details are not part of this build.' }); }
    catch { setSaved(false); setFeedback({ message: 'This browser could not save your build. Download a copy to keep it.' }); }
  }
  function nextStep() {
    if (step === 0 && !validModelYear(build.truck.year)) { setError('Enter a four-digit model year from 1900 to 2100, or leave it blank.'); document.getElementById('builder-year')?.focus(); return; }
    go(step + 1);
  }
  function Summary() {
    return <div className="builder-summary-inner"><figure className="builder-summary-image"><img src="/images/hero-640.webp" alt="Example Next Jump Ford flatbed photographed on a forest trail" loading="lazy"/><figcaption>Example build. Your configuration is reviewed separately.</figcaption></figure><span className="eyebrow">Your build so far</span><h3>{vehicleLabel}</h3><p className="builder-muted">{build.truck.bed ? `${build.truck.bed} factory bed` : 'Bed to confirm'}{build.use ? ` · ${build.use}` : ''}</p><ul className="builder-summary-items">{selected.map(product => <li key={product.id}><span>{product.name}{product.id === 'base' && <small>Required foundation</small>}</span><Check size={16}/></li>)}</ul><div className="builder-price"><span>Pricing</span><strong>Itemized after review</strong><p>Fitment, component prices and installation are confirmed together. Nothing is charged here.</p></div><div className="builder-status"><Info size={16}/><span>All selections need fitment review.</span></div><button className="builder-text-button" type="button" onClick={download}><Download size={16}/>Download build</button><p className="builder-save-note">{saved === true ? 'Saved on this browser' : saved === false ? 'Use download to keep a copy' : 'Checking this browser’s save status…'}</p></div>;
  }

  return <section className="builder" aria-label="Plan your flatbed">
    <nav className="builder-steps" aria-label="Build progress" style={{'--builder-step': step}}>{steps.map((label, index) => <button key={label} type="button" onClick={() => go(index)} disabled={index > maxStep(build)} aria-current={index === step ? 'step' : undefined}><span>{index < step ? <Check size={16}/> : `0${index + 1}`}</span>{label}</button>)}</nav>
    <div className="builder-layout"><div className="builder-work">
      <div className="builder-heading"><span className="eyebrow">Step {step + 1} of 4 · No payment required</span><h2 ref={heading} tabIndex={-1}>{['Start with your truck.', 'Build around what you do.', 'Choose what earns its place.', 'A useful starting point.'][step]}</h2><p>{['Tell us what you drive. We’ll gather the right details for a fitment conversation.', 'Choose how you’ll use the truck. Your flatbed is the starting point; every extra stays optional.', 'Explore storage, carrying and camp options. The team will review compatibility before a quote.', 'Review your truck and options, then carry this build into a quote inquiry.'][step]}</p></div>
      {error && <p className="builder-error" role="alert">{error}</p>}
      {step === 0 && <>
        <figure className="builder-mobile-visual"><img src="/images/hero-1000.webp" alt="Example Next Jump flatbed on a Ford truck in the forest"/><figcaption>Plan your own setup. Example Ford build shown.</figcaption></figure>
        <div className="builder-fields">
          <label className="field">Make<select value={build.truck.make} onChange={event => updateTruck('make', event.target.value)}><option value="">Choose make</option>{makeOptions.map(make => <option key={make}>{make}</option>)}<option>Other / not sure</option></select></label>
          <label className="field">Model<select disabled={!build.truck.make || build.truck.make === 'Other / not sure'} value={build.truck.model} onChange={event => updateTruck('model', event.target.value)}><option value="">Choose model</option>{modelOptions(build.truck.make).map(model => <option key={model}>{model}</option>)}<option>Not listed / not sure</option>{build.truck.make === 'Other / not sure' && <option>Not sure</option>}</select></label>
          <label className="field">Factory bed length<select disabled={!build.truck.model || build.truck.make === 'Other / not sure' || build.truck.model === 'Not listed / not sure'} value={build.truck.bed} onChange={event => updateTruck('bed', event.target.value)}><option value="">Choose bed length</option>{bedOptions(build.truck.make, build.truck.model).map(bed => <option key={bed}>{bed}</option>)}<option>Not sure</option></select></label>
          <label className="field" htmlFor="builder-year">Model year <span className="builder-optional">optional</span><input id="builder-year" inputMode="numeric" maxLength={4} placeholder="e.g. 2022" value={build.truck.year} onChange={event => updateTruck('year', event.target.value.replace(/\D/g, ''))}/></label>
        </div>
        <div className="builder-notice"><Truck size={23}/><div><strong>{matchedRoute ? 'Your truck details are a starting point.' : 'Not sure? You can still make a plan.'}</strong><p>Factory bed length helps identify your truck. It is not the replacement platform’s dimensions. The team will confirm model year, fitment and mounting.</p></div></div>
        {build.truck.make === 'Ram' && build.truck.model === 'Model to confirm' && <p className="builder-muted">The existing Ram route does not specify a model. Please include the exact model when you talk with the team.</p>}
      </>}
      {step === 1 && <>
        <div className="builder-use-grid">{uses.map((use, index) => { const Icon = useIcons[index]; return <button type="button" key={use} className={build.use === use ? 'chosen' : ''} aria-pressed={build.use === use} onClick={() => setBuild({ ...build, use, camperType: use === 'Camper setup' ? build.camperType : '' })}><Icon size={24} strokeWidth={1.5}/><span>{use}</span><span className="builder-choice-dot">{build.use === use && <Check size={13}/>}</span></button>; })}</div>
        {build.use === 'Camper setup' && <label className="field builder-camper-field">What kind of camper?<select value={build.camperType} onChange={event => setBuild({ ...build, camperType: event.target.value })}><option value="">Choose a camper type</option>{camperTypes.map(type => <option key={type}>{type}</option>)}</select><small>Camper dimensions, loaded weight and mounting details will be reviewed with the team.</small></label>}
        <div className="builder-foundation"><img src="/images/base-2.jpg" alt="Next Jump aluminum flatbed deck with side panels"/><div><span className="eyebrow">Your starting point</span><h3>One flatbed. Your choices.</h3><p>The aluminum platform is included in your plan. Add only the options you want to discuss.</p><span className="builder-tag">Extras are your choice</span></div></div>
      </>}
      {step === 2 && <>
        {truckChanged && <p className="builder-inline-notice"><Info size={17}/>Your truck changed. Saved options remain in your plan and need a fresh fitment review.</p>}
        <div className="builder-filters" aria-label="Filter options">{['All options', 'Carry', 'Storage', 'Camp', 'Selected'].map(category => <button key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}</div>
        <div className="builder-product-grid">{products.filter(product => product.id !== 'base' && (filter === 'All options' || filter === 'Selected' && build.selected.includes(product.id) || product.category === filter)).map(product => <article className={`builder-product ${build.selected.includes(product.id) ? 'chosen' : ''}`} key={product.id}><button type="button" className="builder-product-photo" onClick={() => setModal({ kind: 'product', id: product.id })} aria-label={`View ${product.name} details`}><img src={`/images/${product.image.replace(/\.[^.]+$/, '-640.webp')}`} alt={product.name} loading="lazy"/><span>View details <Plus size={18}/></span></button><div className="builder-product-body"><span className="eyebrow">{product.category}</span><h3>{product.name}</h3><p>{product.description}</p><div className="builder-product-action"><span>Price after review</span><button type="button" className="builder-option-button" onClick={() => toggle(product.id)} aria-label={`${build.selected.includes(product.id) ? 'Remove' : 'Add'} ${product.name}`} aria-pressed={build.selected.includes(product.id)}>{build.selected.includes(product.id) ? <><Check size={15}/>Added</> : <><Plus size={15}/>Add</>}</button></div></div></article>)}</div>
        {filter === 'Selected' && count === 0 && <div className="builder-empty"><Box size={30}/><h3>An open deck is a good starting point.</h3><p>Your flatbed is included. Explore extras or continue with the foundation alone.</p><button type="button" className="builder-text-button" onClick={() => setFilter('All options')}>Explore options <ArrowRight size={16}/></button></div>}
        <p className="builder-image-note">Photos show example components. They do not show a confirmed configuration for your truck.</p>
      </>}
      {step === 3 && <>
        <div className="builder-review"><div><span>Your truck</span><h3>{vehicleLabel}</h3><p>{build.truck.bed || 'Bed to confirm'} factory bed · {build.truck.year || 'Year to confirm'}</p><button type="button" onClick={() => go(0)}>Edit truck</button></div><div><span>Your plans</span><h3>{build.use}</h3><p>{build.camperType || 'Modular flatbed setup'}</p><button type="button" onClick={() => go(1)}>Edit plans</button></div><div><span>Your options</span><h3>Flatbed + {count} optional {count === 1 ? 'component' : 'components'}</h3><p>{selected.map(product => product.name).join(', ')}</p><button type="button" onClick={() => go(2)}>Edit options</button></div></div>
        <div className="builder-quote-panel"><span className="eyebrow">Bring your plan to the team</span><h3>Let’s work out the details.</h3><p>Your build gives the team a starting point for fitment, an itemized price and installation. An inquiry is not an order or a booked appointment.</p><a className="button button-primary" href="/pages/book-install-services-or-get-a-quote?context=flatbed&build=local" data-priority="quote" data-ambient>Continue to quote inquiry <ArrowRight size={18}/></a><p className="builder-muted">{saved === true ? 'Your saved build will carry into the inquiry in this browser.' : saved === false ? 'Browser storage is unavailable. Download your build to keep a copy for the team.' : 'Checking whether your build is saved on this browser…'}</p></div>
        <div className="builder-save-actions"><button className="button" type="button" onClick={saveNow}>Save on this browser</button><button className="button" type="button" onClick={download}><Download size={16}/>Download build</button></div>
        <details className="builder-disclosure"><summary>What happens next?<ChevronDown size={18}/></summary><ol><li>Share your truck, selected options and questions.</li><li>The team confirms fitment, scope, pricing and installation details.</li><li>Review and approve the final quote before any deposit or booking.</li></ol></details>
      </>}
      <div className="builder-flow-actions">{step > 0 ? <button type="button" className="button" onClick={() => go(step - 1)}><ArrowLeft size={17}/>Back</button> : <a className="builder-text-button" href="/pages/overland-aluminum-flatbed-truck-bodies">About the flatbed system</a>}{step < 3 && <button type="button" className="button button-primary" onClick={nextStep}>{['Choose your setup', 'Explore options', 'Review your build'][step]}<ArrowRight size={17}/></button>}</div>
      <button type="button" className="builder-text-button builder-restart" onClick={() => setModal({ kind: 'restart' })}><RotateCcw size={14}/>Start a new build</button>
    </div><aside className="builder-summary" aria-label="Build summary"><Summary/></aside></div>
    <div className="builder-mobile-dock"><button type="button" onClick={() => setMobileSummary(true)}><span>{count} optional {count === 1 ? 'component' : 'components'}</span><strong>Your build <ChevronDown size={15}/></strong></button>{step < 3 ? <button className="button button-primary" type="button" onClick={nextStep}>{step === 2 ? 'Review' : 'Continue'}<ArrowRight size={16}/></button> : <a className="button button-primary" href="/pages/book-install-services-or-get-a-quote?context=flatbed&build=local" data-priority="quote" data-ambient>Quote inquiry <ArrowRight size={16}/></a>}</div>
    <div className="builder-live-region" aria-live="polite" role="status">{feedback?.message}</div>
    {feedback && <div className="builder-feedback"><p>{feedback.message}</p>{feedback.previous && <button type="button" onClick={() => { setBuild(feedback.previous); setFeedback({ message: 'Change undone. Your previous build is restored.' }); }}>Undo</button>}<button type="button" aria-label="Dismiss update" onClick={() => setFeedback(null)}><X size={16}/></button></div>}
    {mobileSummary && <Dialog title="Your build so far" onClose={() => setMobileSummary(false)}><Summary/></Dialog>}
    {modal && <Dialog title={modal.kind === 'add-pair' ? 'The kitchen needs its storage boxes.' : modal.kind === 'remove-pair' ? 'Remove both components?' : modal.kind === 'restart' ? 'Start a new build?' : products.find(product => product.id === modal.id)?.name} onClose={() => setModal(null)}>
      {modal.kind === 'add-pair' && <><p>The kitchen insert fits into upper storage boxes. Add both to your plan so the team can review them together.</p><div className="builder-dialog-callout">Kitchen insert + upper storage boxes<br/><strong>Prices and fitment confirmed after review.</strong></div><div className="builder-dialog-actions"><button className="button" type="button" onClick={() => setModal(null)}>Keep my build</button><button className="button button-primary" type="button" onClick={() => toggle('kitchen', true)}>Add both <Plus size={16}/></button></div></>}
      {modal.kind === 'remove-pair' && <><p>Removing upper storage boxes also removes the kitchen insert from your plan.</p><div className="builder-dialog-actions"><button className="button" type="button" onClick={() => setModal(null)}>Keep both</button><button className="button button-primary" type="button" onClick={() => toggle('boxes', true)}>Remove both <Minus size={16}/></button></div></>}
      {modal.kind === 'restart' && <><p>This replaces the build saved on this browser. Download your current build if you want to keep a copy.</p><button className="builder-text-button" type="button" onClick={download}><Download size={16}/>Download current build</button><div className="builder-dialog-actions"><button className="button" type="button" onClick={() => setModal(null)}>Keep my build</button><button className="button button-primary" type="button" onClick={() => { const previous = build; setBuild(createBuild(routeVehicle)); setModal(null); setTruckChanged(false); setFilter('All options'); go(0); setFeedback({ message: 'A fresh start. Your previous build can still be restored with Undo.', previous }); }}>Start fresh</button></div></>}
      {modal.kind === 'product' && (() => { const product = products.find(item => item.id === modal.id); return <><img className="builder-detail-photo" src={`/images/${product.image}`} alt={product.name}/><p>{product.description}</p><div className="builder-dialog-callout">This is an example component.<br/><strong>Fitment and price require review for your truck.</strong></div><button className="button button-primary builder-full" type="button" onClick={() => toggle(product.id)}>{build.selected.includes(product.id) ? 'Remove from my plan' : 'Add to my plan'}{build.selected.includes(product.id) ? <Minus size={16}/> : <Plus size={16}/>}</button></>; })()}
    </Dialog>}
  </section>;
}
