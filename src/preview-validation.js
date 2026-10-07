import {cleanString,validateInquiryFields,PROJECT_LABELS,FEATURE_LABELS} from './inquiry-contract.js';
import {vehicleRoutes} from './builder/domain.js';
const asObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail=(status,message,fields)=>Object.assign(new Error(message),{status,fields});
export function validatePreviewRequest(data, { sanitizeBuild, validateBuild } = {}) {
  if (!asObject(data)) throw fail(400, 'The request must be a JSON object.');
  const allowed = ['context', 'service', 'firstName', 'preferredContact', 'email', 'phone', 'vehicleDetails', 'needVehicleHelp', 'intendedUse', 'camperType', 'workGoal', 'vehicleCount', 'company', 'message', 'marketingOptIn', 'project', 'feature', 'topic', 'build'];
  if (Object.keys(data).some((key) => !allowed.includes(key))) throw fail(400, 'The request contains unsupported fields.');
  for (const key of allowed.filter((key) => !['build', 'needVehicleHelp', 'marketingOptIn'].includes(key))) {
    if (data[key] !== undefined && typeof data[key] !== 'string') throw fail(400, `Invalid ${key} field.`);
  }
  for (const key of ['needVehicleHelp', 'marketingOptIn']) {
    if (data[key] !== undefined && typeof data[key] !== 'boolean') throw fail(400, `Invalid ${key} field.`);
  }
  if (Object.entries(data).some(([key, value]) => typeof value === 'string' && value.length > (['message', 'workGoal'].includes(key) ? 1500 : key === 'email' ? 254 : 180))) throw fail(400, 'One or more fields are too long.');
  if (data.project && !Object.hasOwn(PROJECT_LABELS, data.project)) throw fail(400, 'Unsupported project reference.');
  if (data.feature && !Object.hasOwn(FEATURE_LABELS, data.feature)) throw fail(400, 'Unsupported feature reference.');
  let build = null;
  if (data.build !== undefined && data.build !== null) {
    if (!asObject(data.build) || !sanitizeBuild || !validateBuild) throw fail(422, 'This saved build could not be checked. Return to the builder and save it again.');
    const validation = validateBuild(data.build);
    const valid = validation === true || validation?.valid === true || validation?.ok === true;
    if (!valid) throw fail(422, 'This saved build needs review. Open the builder to check your selections.');
    const sanitized = sanitizeBuild(data.build);
    build = sanitized;
    // Free-text build notes and unrecognized truck labels are deliberately excluded.
  }
  const normalized = { ...data, context: cleanString(data.context, 20), build };
  const fields = validateInquiryFields(normalized);
  if (Object.keys(fields).length) throw fail(422, 'Check the highlighted fields.', fields);
  // Deliberately retain no names, email, phone, company, free text, consent or uploads.
  // This preview only demonstrates durable receipt of non-personal configuration context.
  return {
    context: normalized.context,
    project: normalized.project || null,
    feature: normalized.feature || null,
    topic: normalized.context === 'general' ? normalized.topic : null,
    service: normalized.context === 'service' ? normalized.service : null,
    intendedUse: normalized.context === 'flatbed' ? normalized.intendedUse : null,
    camperType: normalized.context === 'camper' ? normalized.camperType : null,
    vehicleCount: normalized.context === 'work' ? normalized.vehicleCount : null,
    needsVehicleHelp: normalized.needVehicleHelp === true,
    build,
  };
}
