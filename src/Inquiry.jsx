import React, { useEffect, useRef, useState } from 'react';
import { CAMPER_TYPES, USE_OPTIONS, SERVICE_OPTIONS, TOPICS, normalizeContext, normalizeProjectContext, PROJECT_LABELS, FEATURE_LABELS, validateInquiryFields } from './inquiry-contract.js';
import { parseSavedBuild, validateBuild, products, STORAGE_KEY } from './builder/domain.js';
import NativeInquiry from './NativeInquiry.jsx';
import { buildInquirySummary } from './hubspot-contract.js';
import './inquiry.css';

const QUOTE_PATH = '/pages/book-install-services-or-get-a-quote';
const BUILDER_PATH = '/pages/flatbed-build-price-by-vehicle';
const RECEIPT_KEY = 'nj-preview-receipt-v1';
const makeToken = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
const useFor = (build) => ({ 'Daily use & weekends': 'General use', 'Work & hauling': 'Work / business', 'Longer overland trips': 'Overland', 'Camper setup': 'Camper', 'Still exploring': 'Not sure' }[build?.use] || '');
const camperFor = (build) => ({ 'Topper / camper shell': 'Topper', 'Slide-in camper': 'Slide-in', 'Flatbed camper': 'Flatbed camper', 'Still deciding': 'Not decided' }[build?.camperType] || '');

function Field({ name, label, error, hint, children, optional = false }) {
  return <div className={`inquiry-field${error ? ' has-error' : ''}`}>
    <label htmlFor={`inquiry-${name}`}>{label}{optional && <span className="field-optional">Optional</span>}</label>
    {hint && <p id={`${name}-hint`} className="field-hint">{hint}</p>}
    {children}
    {error && <p id={`${name}-error`} className="field-error">{error}</p>}
  </div>;
}

export function Inquiry({ query = {}, embedded = false }) {
  const initial = normalizeContext(query);
  const [form, setForm] = useState({ ...initial, topic: '', firstName: '', preferredContact: 'email', email: '', phone: '', vehicleDetails: '', needVehicleHelp: false, intendedUse: '', camperType: '', workGoal: '', vehicleCount: '', company: '', message: '', marketingOptIn: false, ...normalizeProjectContext(query) });
  const [liveForm, setLiveForm] = useState(false);
  const [liveRequested, setLiveRequested] = useState(false);
  const [build, setBuild] = useState(null);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle');
  const [notice, setNotice] = useState('');
  const keyRef = useRef(null);
  const payloadRef = useRef(null);
  const headingRef = useRef(null);
  const busy = state === 'submitting' || state === 'checking';
  useEffect(() => {
    if (!['flatbed', 'camper', 'work'].includes(initial.context)) return;
    try {
      const saved = parseSavedBuild(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        setBuild(saved);
        setForm(current => ({ ...current, intendedUse: useFor(saved), camperType: camperFor(saved) }));
      }
    } catch { /* The inquiry remains available when browser storage is blocked. */ }
  }, []);
  const set = (name, value) => {
    setForm(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: undefined }));
    if (state !== 'submitting') { setState('idle'); setNotice(''); }
  };
  const control = (name) => ({ id: `inquiry-${name}`, name, value: form[name], onChange: event => set(name, event.target.value), 'aria-invalid': errors[name] ? true : undefined, 'aria-describedby': errors[name] ? `${name}-error` : undefined });
  const completeBuild = build && validateBuild(build).valid;
  const hasVehicle = build?.truck?.make && build.truck.make !== 'Other / not sure';
  const isVessel = ['marine', 'boat-detail'].includes(form.service);
  const vehicleLabel = form.context === 'service' && isVessel ? 'Vessel details' : form.context === 'service' && form.service === 'trailer' ? 'Trailer details' : 'Truck or vehicle details';
  const currentContextLabel = { flatbed: 'Your flatbed', camper: 'Your camper plans', work: 'Your work', service: 'Your installation or service', general: 'Your question' }[form.context];

  async function showConfirmation(data) {
    if (!data.receiptToken || data.mode !== 'preview' || data.sentToShop !== false) throw new Error('The preview receipt could not be verified.');
    try { sessionStorage.setItem(RECEIPT_KEY, data.receiptToken); }
    catch { setState('received'); setNotice(`Preview saved. Reference ${data.receiptId.slice(0, 8)}. No contact information was retained and nothing was sent to the shop.`); return; }
    window.location.assign('/pages/build-request-received');
  }
  async function checkReceipt(token) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch('/api/preview-requests/status', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal });
      if (response.status === 404) return null;
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not check the saved preview.');
      return { ...data, receiptToken: token };
    } finally { clearTimeout(timeout); }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const payload = { ...form, build: build || null };
    const fields = validateInquiryFields(payload);
    if (build && !completeBuild) fields.build = 'Your saved build needs a little more detail. Review it or continue without it.';
    if (Object.keys(fields).length) {
      setErrors(fields); setState('invalid'); setNotice('Please check the fields below. Your entries are still here.');
      requestAnimationFrame(() => { const first = document.getElementById(`inquiry-${Object.keys(fields)[0]}`); (first || headingRef.current)?.focus(); });
      return;
    }
    const encoded = JSON.stringify(payload);
    if (!keyRef.current || payloadRef.current !== encoded) { keyRef.current = makeToken(); payloadRef.current = encoded; }
    setState('submitting'); setNotice('Saving this preview locally. Nothing will be sent to the shop.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch('/api/preview-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': keyRef.current }, body: encoded, signal: controller.signal });
      const data = await response.json();
      if (!response.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error || 'Your preview could not be saved.');
      }
      await showConfirmation(data);
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        setState('checking'); setNotice('Checking whether your preview was saved before trying again.');
        try {
          const received = await checkReceipt(keyRef.current);
          if (received) { await showConfirmation(received); return; }
        } catch { /* Preserve the key for a safe, idempotent retry. */ }
        setNotice('We could not confirm the preview save. Your entries are still here. Retry safely, or contact the shop directly. Nothing has been sent to the shop.');
      } else setNotice(error.message);
      setState('failed');
      requestAnimationFrame(() => headingRef.current?.focus());
    } finally { clearTimeout(timeout); }
  }

  return <section className={`inquiry-layout ${embedded ? 'inquiry-embedded' : ''}`} aria-label="Quote inquiry preview">
    <div className="inquiry-main">
      <div className="inquiry-mode-choice"><div><strong>Ready to talk to the team?</strong><p>{liveForm ? 'You are using the shop’s live form. Your website preview draft is kept while you stay on this page.' : 'Try the short preview below, or open the existing live form to send a real inquiry.'}</p></div><button type="button" aria-pressed={liveForm} onClick={() => { setLiveRequested(true); setLiveForm(current => !current); }}>{liveForm ? 'Return to website preview' : 'Open the live shop form'}</button></div>
      {liveRequested && <div hidden={!liveForm}><NativeInquiry context={form.context} service={form.service} summary={buildInquirySummary(form, build)} /></div>}
      <div hidden={liveForm}>
      <div className="preview-disclosure"><strong>Website preview</strong><p>This form demonstrates the inquiry. Contact details are not saved or sent to the shop.</p></div>
      {(form.project || form.feature) && <p className="inquiry-context">{form.project && <>Inspired by {PROJECT_LABELS[form.project]}. </>}{form.feature && <>Interested in {FEATURE_LABELS[form.feature].toLowerCase()}. </>}These details stay with your request.</p>}
      <form onSubmit={submit} noValidate>
        <h2 ref={headingRef} tabIndex="-1">{currentContextLabel}</h2>
        {notice && <div className={`inquiry-status ${state}`} role={['failed', 'invalid'].includes(state) ? 'alert' : 'status'}>{notice}</div>}
        {build && <div className="inquiry-build" id="inquiry-build" tabIndex="-1">
          <div><span className="inquiry-eyebrow">Your saved configuration</span><h3>{[build.truck.year, build.truck.make, build.truck.model].filter(Boolean).join(' ') || 'Truck details to confirm'}</h3><p>{build.truck.bed ? `${build.truck.bed} bed · ` : ''}{build.use || 'Use to confirm'}</p></div>
          <ul>{build.selected.map(id => <li key={id}>{products.find(item => item.id === id)?.name || id}</li>)}</ul>
          <p className="field-hint">Pricing and fitment still need review. Your request does not place an order or reserve an installation.</p>
          {errors.build && <p className="field-error">{errors.build}</p>}
          <div className="inquiry-inline-actions"><a href={`${BUILDER_PATH}?resume=1`}>Review saved build</a><button type="button" onClick={() => { setBuild(null); setErrors(current => ({ ...current, build: undefined })); }}>Continue without this build</button></div>
        </div>}
        {form.context === 'service' && <Field name="service" label="What can we help with?" error={errors.service}><select {...control('service')}><option value="">Choose a service</option>{SERVICE_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>}
        {form.context !== 'general' && !hasVehicle && <>
          <Field name="vehicleDetails" label={vehicleLabel} error={errors.vehicleDetails} hint={isVessel ? 'Make, model, and size, if you know them.' : 'Year, make, and model are a useful start. You can ask for help if you are unsure.'}><input {...control('vehicleDetails')} maxLength="180" disabled={form.needVehicleHelp} autoComplete="off" /></Field>
          <label className="inquiry-check"><input type="checkbox" checked={form.needVehicleHelp} onChange={event => set('needVehicleHelp', event.target.checked)} />I need help identifying {isVessel ? 'my vessel' : 'my vehicle'}.</label>
        </>}
        {form.context === 'flatbed' && <Field name="intendedUse" label="What do you have in mind?" error={errors.intendedUse}><select {...control('intendedUse')}><option value="">Choose a use</option>{USE_OPTIONS.map(use => <option key={use}>{use}</option>)}</select></Field>}
        {form.context === 'camper' && <Field name="camperType" label="What kind of camper?" error={errors.camperType}><select {...control('camperType')}><option value="">Choose a camper type</option>{CAMPER_TYPES.map(type => <option key={type}>{type}</option>)}</select></Field>}
        {form.context === 'work' && <>
          <Field name="workGoal" label="What does your truck need to carry or do?" error={errors.workGoal}><textarea {...control('workGoal')} maxLength="1000" rows="3" /></Field>
          <Field name="vehicleCount" label="How many vehicles?" error={errors.vehicleCount}><select {...control('vehicleCount')}><option value="">Choose a count</option>{['1', '2–5', '6+', 'Not sure'].map(count => <option key={count}>{count}</option>)}</select></Field>
          <Field name="company" label="Company" optional><input {...control('company')} maxLength="120" autoComplete="organization" /></Field>
        </>}
        {form.context === 'general' && <Field name="topic" label="What is your question about?" error={errors.topic}><select {...control('topic')}><option value="">Choose a topic</option>{TOPICS.map(topic => <option key={topic}>{topic}</option>)}</select></Field>}
        <Field name="message" label={form.context === 'general' ? 'How can we help?' : form.context === 'service' ? 'What would you like help with?' : 'Anything else we should know?'} error={errors.message} optional={!['general', 'service'].includes(form.context)}><textarea {...control('message')} maxLength="1500" rows="4" placeholder={form.context === 'service' ? 'The work you have in mind, or the problem you would like to solve.' : undefined} /></Field>
        <fieldset className="inquiry-contact"><legend>Your contact details</legend><p className="field-hint">These fields demonstrate validation. Contact details are not saved or sent from this preview.</p>
          <Field name="firstName" label="First name" error={errors.firstName}><input {...control('firstName')} autoComplete="given-name" maxLength="80" /></Field>
          <fieldset className="inquiry-preference"><legend>Preferred contact method</legend><div>{['email', 'phone'].map(method => <label key={method}><input type="radio" name="preferredContact" checked={form.preferredContact === method} onChange={() => set('preferredContact', method)} />{method === 'email' ? 'Email' : 'Phone'}</label>)}</div></fieldset>
          {form.preferredContact === 'email' ? <Field name="email" label="Email address" error={errors.email}><input {...control('email')} type="email" inputMode="email" autoComplete="email" maxLength="254" /></Field> : <Field name="phone" label="Phone number" error={errors.phone}><input {...control('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength="32" /></Field>}
        </fieldset>
        <label className="inquiry-check"><input type="checkbox" checked={form.marketingOptIn} onChange={event => set('marketingOptIn', event.target.checked)} />Keep me informed about Next Jump news. <span>Optional. No subscription is created in this preview.</span></label>
        <p className="inquiry-terms">Sending a request on the finished site will not place an order or book an installation. The team will review your configuration and confirm the next step.</p>
        <button className="inquiry-submit" type="submit" disabled={busy || state === 'received'}>{state === 'submitting' ? 'Saving preview…' : state === 'checking' ? 'Checking receipt…' : state === 'received' ? 'Preview saved' : 'Save preview request'}</button>
        <noscript><p>This website preview needs JavaScript to save a request. You can still contact the shop using the contact page.</p></noscript>
      </form>
      </div>
    </div>
    {!embedded && <aside className="inquiry-aside"><span className="inquiry-eyebrow">A conversation comes first</span><h2>Let's work out your next step.</h2><p>You do not need a finished plan. Bring the truck, the gear, or the question you have been thinking about.</p><hr /><h3>Ready to reach the team?</h3><p>{liveForm ? 'The live form sends your inquiry to Next Jump. You can also call the Tacoma team directly.' : 'The short preview does not send inquiries. Open the live shop form above or call the team.'}</p><a href="tel:+12533010028">Call (253) 301-0028</a><a href="/pages/contact-us">Contact & visit</a><a href={BUILDER_PATH}>Explore a flatbed configuration</a></aside>}
  </section>;
}

export function Confirmation() {
  const [status, setStatus] = useState('loading');
  const [receipt, setReceipt] = useState(null);
  useEffect(() => {
    let live = true;
    let token;
    try { token = sessionStorage.getItem(RECEIPT_KEY); } catch { /* No receipt. */ }
    if (!token) { setStatus('empty'); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    fetch('/api/preview-requests/status', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('No receipt'); return response.json(); })
      .then(data => { if (live) { if (data.mode === 'preview' && data.sentToShop === false) { setReceipt(data); setStatus('received'); } else setStatus('failed'); } })
      .catch(() => { if (live) setStatus('failed'); }).finally(() => clearTimeout(timeout));
    return () => { live = false; controller.abort(); clearTimeout(timeout); };
  }, []);
  return <section className="confirmation-panel" aria-live="polite">
    <span className="inquiry-eyebrow">Website preview</span>
    <h1>{status === 'loading' ? 'Checking your preview receipt.' : status === 'received' ? 'Your preview request is saved.' : status === 'empty' ? 'No request has been submitted.' : 'We could not verify a saved request.'}</h1>
    {status === 'received' ? <><p>Your configuration and inquiry type were saved on this website preview. <strong>Nothing was sent to Next Jump.</strong> Your contact details and message were not retained.</p><p className="receipt-reference">Preview reference: {receipt.receiptId.slice(0, 8)}</p><h2>The next step is a conversation.</h2><p>For a real quote, contact the Tacoma team. A quote request does not place an order, reserve stock, or book an installation.</p></> : <p>{status === 'loading' ? 'A confirmation appears only after the preview server verifies a saved receipt.' : 'Opening this page does not submit a request. Nothing has been sent to the shop. You can return to the form or contact the team directly.'}</p>}
    <div className="confirmation-actions"><a className="inquiry-submit" href="/pages/contact-us">Contact the shop</a><a href={QUOTE_PATH}>Back to inquiry</a><a href={`${BUILDER_PATH}?resume=1`}>Return to your build</a></div>
  </section>;
}
