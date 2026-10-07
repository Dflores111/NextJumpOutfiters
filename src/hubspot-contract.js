import { normalizeContext, normalizeProjectContext, PROJECT_LABELS, FEATURE_LABELS, SERVICE_OPTIONS } from './inquiry-contract.js';
import { sanitizeBuild, validateBuild, buildItems } from './builder/domain.js';
import {startingPlans} from './catalog/planning.js';

// Public embed IDs, verified against the Next Jump portal and existing live embeds.
// These are not API credentials. No custom submission endpoint or CRM write is used.
export const HUBSPOT_PORTAL_ID = '24102432';
export const HUBSPOT_SCRIPT = 'https://js.hsforms.net/forms/embed/v2.js';
export const NATIVE_FORMS = Object.freeze({
  flatbed: { id: 'b690f934-a789-43e4-aa17-665a6722d661', name: 'Flatbed Landing Leads' },
  camper: { id: '405a62cd-cfac-41a6-b8d3-b74a859e9ef1', name: 'Flatbed For Campers Landing Leads' },
  general: { id: '62895413-4437-4f87-a4aa-b12ccb6a89d6', name: 'Install Intake Form - Flatbed and General' },
  'boat-detail': { id: 'c086baf4-e59a-43ac-9c1f-3367969528c8', name: 'Boat Detail Form', descriptionLabel: 'Notes' },
  marine: { id: 'd1b51e71-d018-48de-a38f-78dbb08846b6', name: 'Marine Services Lead Form', descriptionLabel: 'Notes' },
  detailing: { id: '8c5e34be-4e8f-4cca-a825-1dc0bb64fa8e', name: 'Vehicle Wash & Detail Form', descriptionLabel: 'What Else Would You Like Done?' },
});
export function nativeFormFor(context, service) { return (context === 'service' && Object.hasOwn(NATIVE_FORMS, service) ? NATIVE_FORMS[service] : null) || (Object.hasOwn(NATIVE_FORMS, context) ? NATIVE_FORMS[context] : NATIVE_FORMS.general); }

export function buildInquirySummary(query, build, reference = null) {
  const { context, service } = normalizeContext(query);
  const { project, feature } = normalizeProjectContext(query);
  const lines = [`Inquiry: ${{ flatbed: 'Flatbed', camper: 'Camper setup', work: 'Work truck', service: 'Installation or service', general: 'General question' }[context]}`];
  if (service) lines.push(`Service: ${SERVICE_OPTIONS.find(([id]) => id === service)[1]}`);
  if (project) lines.push(`Inspired by: ${PROJECT_LABELS[project]}`);
  if (feature) lines.push(`Interested in: ${FEATURE_LABELS[feature]}`);
  if (build && validateBuild(build).valid) {
    const clean = sanitizeBuild(build);
    lines.push(`Truck: ${[clean.truck.year, clean.truck.make, clean.truck.model].filter(Boolean).join(' ')}`);
    if (clean.truck.bed) lines.push(`Factory bed: ${clean.truck.bed}`);
    if (clean.use) lines.push(`Intended use: ${clean.use}`);
    if (clean.camperType) lines.push(`Camper: ${clean.camperType}`);
    if(clean.plan.packageId)lines.push(`Starting direction: ${startingPlans.find(p=>p.id===clean.plan.packageId)?.name}`);
    lines.push(`Equipment to discuss: ${buildItems(clean).map(item=>item.name).join(', ')||'Custom scope'}`);
    lines.push(`Preferred handoff: ${clean.plan.fulfillment==='diy'?'Parts for my own install':'Installed by Next Jump'}`);
    if(/^[a-f0-9-]{36}$/.test(reference?.id||'')&&Number.isSafeInteger(reference.version)&&reference.version>0)lines.push(`Saved plan reference: ${reference.id} / version ${reference.version}`);
    lines.push('Selections are a planning request. Fitment, price and availability need shop review.');
  }
  return lines.join('\n');
}

// Never overwrite customer edits, populate consent, or submit programmatically.
export function resolveNativeForm(value) {
  // HTMLFormElement is itself array-like. Indexing it first returns a fieldset.
  if (typeof value?.querySelector === 'function') return value;
  return value?.get?.(0) || value?.[0] || null;
}
export function prefillNativeContext(formElement, summary) {
  if (!formElement?.querySelector) return false;
  const field = formElement.querySelector('[name="TICKET.content"], [name="0-5/content"], [name="content"]');
  if (!field || field.value) return false;
  field.value = summary;
  const InputEvent = field.ownerDocument?.defaultView?.Event || Event;
  field.dispatchEvent(new InputEvent('input', { bubbles: true }));
  field.dispatchEvent(new InputEvent('change', { bubbles: true }));
  return true;
}
