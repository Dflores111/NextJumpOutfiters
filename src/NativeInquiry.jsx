import React, { useEffect, useId, useRef, useState } from 'react';
import { HUBSPOT_PORTAL_ID, HUBSPOT_SCRIPT, nativeFormFor, resolveNativeForm, prefillNativeContext } from './hubspot-contract.js';

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

export default function NativeInquiry({ context, service, summary }) {
  const id = `native-inquiry-${useId().replace(/[^a-z0-9_-]/gi, '')}`;
  const [state, setState] = useState('loading');
  const [copied, setCopied] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const targetRef = useRef(null);
  const summaryRef = useRef(summary);
  summaryRef.current = summary;
  const form = nativeFormFor(context, service);
  const descriptionLabel = form.descriptionLabel || 'Description of Modification or Work Needed';
  useEffect(() => { setPrefilled(false); setCopied(false); }, [summary]);
  useEffect(() => {
    let active = true;
    let confirmed = false;
    let ready = false;
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
          setPrefilled(prefillNativeContext(element, summaryRef.current));
          setState('ready');
        },
        onFormSubmitted: () => {
          if (!active || confirmed) return;
          confirmed = true; setState('received');
          // Only documented completed-submission callback. No PII or second submission.
          window.dispatchEvent(new CustomEvent('nextjump:inquiry-success', { detail: { provider: 'hubspot', formId: form.id, context } }));
        },
      });
    }).catch(() => { if (active) setState('unavailable'); });
    return () => { active = false; clearTimeout(timeout); };
  }, [form.id, id]);
  async function copySummary() {
    try { await navigator.clipboard.writeText(summary); setCopied(true); }
    catch { setCopied(false); targetRef.current?.focus(); targetRef.current?.select(); }
  }
  return <div className="native-inquiry">
    <div className="native-inquiry-disclosure"><strong>This form contacts the shop.</strong><p>This is Next Jump’s existing live inquiry form, powered by HubSpot. It asks for email and phone. Submit only when you are ready to send a real request.</p></div>
    <details className="native-context" open={!prefilled}>
      <summary>{prefilled ? 'Your project details were added — review or copy them' : 'Keep your project details with your inquiry'}</summary>
      <p>{prefilled ? `They appear in “${descriptionLabel}” below. You can edit that field before sending.` : `Copy these details into “${descriptionLabel}” in the form below.`}</p>
      <textarea ref={targetRef} readOnly value={summary} rows="6" aria-label="Project details to include" />
      <button type="button" onClick={copySummary}>{copied ? 'Copied project details' : 'Copy project details'}</button>
    </details>
    <div className="native-form-status" role="status">{state === 'loading' ? 'Loading the shop’s live form…' : state === 'unavailable' ? 'The live form is taking longer to load. Your local draft is still here. You can contact the shop directly below.' : state === 'received' ? 'Your inquiry has been sent to Next Jump. A request does not reserve stock or book an installation.' : ''}</div>
    <div id={id} className="native-form-target" />
    <div className="native-contact-options"><a href="tel:+12533010028">Call (253) 301-0028</a><a href="mailto:theteam@nextjumpoutfitters.com">Email the team</a><a href="https://www.nextjumpoutfitters.com/pages/book-install-services-or-get-a-quote" target="_blank" rel="noreferrer">Open form on the live site ↗</a></div>
  </div>;
}
