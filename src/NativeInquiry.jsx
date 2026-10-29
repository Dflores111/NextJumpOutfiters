import React, { useEffect, useId, useRef, useState } from 'react';
import { HUBSPOT_PORTAL_ID, HUBSPOT_SCRIPT, nativeFormFor, resolveNativeForm, prefillNativeContext, prefillNativeSelections } from './hubspot-contract.js';

let scriptPromise;
function loadNativeScript() {
  if (window.hbspt?.forms?.create) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = HUBSPOT_SCRIPT; script.async = true; script.charset = 'utf-8';
    const timeout = setTimeout(() => { script.remove(); scriptPromise = null; reject(new Error('timeout')); }, 12000);
    script.onload = () => { clearTimeout(timeout); if (window.hbspt?.forms?.create) resolve(); else { scriptPromise = null; reject(new Error('unavailable')); } };
    script.onerror = () => { clearTimeout(timeout); script.remove(); scriptPromise = null; reject(new Error('unavailable')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function NativeInquiry({ context, service, vehicle, summary, focusOnMount = false }) {
  const baseId = `native-inquiry-${useId().replace(/[^a-z0-9_-]/gi, '')}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState('loading');
  const [copied, setCopied] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const targetRef = useRef(null);
  const headingRef = useRef(null);
  const nativeRef = useRef(null);
  const insertedRef = useRef({ summary: undefined, selections: {} });
  const summaryRef = useRef(summary);
  summaryRef.current = summary;
  const selectionsRef = useRef({ vehicle, context, service });
  selectionsRef.current = { vehicle, context, service };
  const form = nativeFormFor(context, service);
  const id = `${baseId}-${form.id}-${attempt}`;
  const descriptionLabel = form.descriptionLabel || 'Description of Modification or Work Needed';
  function fillSelections(element) {
    const previous = insertedRef.current;
    const didFill = prefillNativeContext(element, summaryRef.current, previous.summary);
    insertedRef.current = {
      summary: didFill ? summaryRef.current : undefined,
      selections: prefillNativeSelections(element, selectionsRef.current, previous.selections),
    };
    setPrefilled(didFill);
  }
  useEffect(() => {
    setCopied(false);
    if (nativeRef.current) fillSelections(nativeRef.current);
  }, [summary, context, service, vehicle?.year, vehicle?.make, vehicle?.model, vehicle?.bed]);
  useEffect(() => {
    if (!focusOnMount) return;
    const frame = requestAnimationFrame(() => headingRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [focusOnMount]);
  useEffect(() => {
    let active = true;
    let confirmed = false;
    let ready = false;
    nativeRef.current = null;
    insertedRef.current = { summary: undefined, selections: {} };
    setState('loading'); setPrefilled(false);
    document.getElementById(id)?.replaceChildren();
    const timeout = setTimeout(() => { if (active && !ready) setState('unavailable'); }, 16000);
    loadNativeScript().then(() => {
      if (!active) return;
      window.hbspt.forms.create({
        region: 'na1', portalId: HUBSPOT_PORTAL_ID, formId: form.id,
        target: `#${id}`, formInstanceId: id,
        // Keep confirmation here instead of navigating to the old storefront thank-you route.
        redirectUrl: '', inlineMessage: '<p>Thank you. Your inquiry has been sent to Next Jump Outfitters.</p>',
        onFormReady: native => {
          if (!active) return;
          ready = true; clearTimeout(timeout);
          const element = resolveNativeForm(native);
          nativeRef.current = element;
          fillSelections(element);
          setState('ready');
        },
        onFormSubmitted: () => {
          if (!active || confirmed) return;
          confirmed = true; nativeRef.current = null; setState('received');
          // Only documented completed-submission callback. No PII or second submission.
          window.dispatchEvent(new CustomEvent('nextjump:inquiry-success', { detail: { provider: 'hubspot', formId: form.id, context } }));
        },
      });
    }).catch(() => { if (active) setState('unavailable'); });
    return () => { active = false; nativeRef.current = null; clearTimeout(timeout); };
  }, [form.id, id]);
  async function copySummary() {
    try { await navigator.clipboard.writeText(summary); setCopied(true); }
    catch { setCopied(false); targetRef.current?.focus(); targetRef.current?.select(); }
  }
  return <div className="native-inquiry">
    <div className="native-inquiry-disclosure"><h3 ref={headingRef} tabIndex={-1}>Send your request to the shop.</h3><p>This form sends your details to Next Jump. Review your project and add your contact information below.</p></div>
    <details className="native-context" open={!prefilled}>
      <summary>{prefilled ? 'Your project details were added — review or copy them' : 'Keep your project details with your inquiry'}</summary>
      <p>{prefilled ? `They appear in “${descriptionLabel}” below. You can edit that field before sending.` : `Copy these details into “${descriptionLabel}” in the form below.`}</p>
      <textarea ref={targetRef} readOnly value={summary} rows="6" aria-label="Project details to include" />
      <button type="button" onClick={copySummary}>{copied ? 'Copied project details' : 'Copy project details'}</button>
    </details>
    <div className="native-form-status" role="status">{state === 'loading' ? 'Loading the shop’s form…' : state === 'unavailable' ? 'The form could not finish loading. Nothing has been sent. Try again, call or email the team.' : state === 'received' ? 'Your inquiry has been sent to Next Jump. A request does not reserve stock or book an installation.' : ''}</div>
    {state === 'unavailable' && <button className="native-retry" type="button" onClick={() => { headingRef.current?.focus(); setAttempt(value => value + 1); }}>Try loading the form again</button>}
    <div key={id} id={id} className="native-form-target" aria-busy={state === 'loading'} />
    <noscript><p>Turn on JavaScript to use this form, or call or email the team using the links below.</p></noscript>
    <div className="native-contact-options"><a href="tel:+12533010028">Call (253) 301-0028</a><a href="mailto:theteam@nextjumpoutfitters.com">Email the team</a><a href="https://www.nextjumpoutfitters.com/pages/book-install-services-or-get-a-quote" target="_blank" rel="noreferrer">Open form on the live site ↗</a></div>
  </div>;
}
