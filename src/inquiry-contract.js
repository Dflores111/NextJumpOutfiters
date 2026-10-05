export const SERVICE_OPTIONS = [
  ['flatbed', 'Flatbed installation'], ['suspension', 'Suspension'], ['bumpers-racks', 'Bumpers & racks'],
  ['wheels-tires', 'Wheels & tires'], ['power', 'Power systems'], ['lighting', 'Lighting'],
  ['rooftop-tent', 'Rooftop tent installation'], ['camper', 'Camper installation'], ['detailing', 'Vehicle detailing'], ['boat-detail', 'Boat detailing'], ['marine', 'Marine services'], ['trailer', 'Trailer work'],
];
export const CONTEXTS = ['flatbed', 'camper', 'work', 'service', 'general'];
export const TOPICS = ['Flatbed question', 'Installation or service', 'Parts or order support', 'Visiting the shop', 'Something else'];
export const CAMPER_TYPES = ['Not decided', 'Topper', 'Slide-in', 'Flatbed camper'];
export const USE_OPTIONS = ['Overland', 'Camper', 'Work / business', 'General use', 'Not sure'];
export const PROJECT_LABELS = { 'ranger-flatbed': 'Ford Ranger flatbed setup', 'super-ute': 'The Super Ute collaboration', 'alaskan-camper': 'Alaskan camper flatbed setup', 'dillon-f250': 'Dillon’s F-250 lift project' };
export const FEATURE_LABELS = { platform: 'Aluminum platform', storage: 'Lockable storage', tailgate: 'Tailgate and bed access', camp: 'Camp setup' };
export function normalizeProjectContext(query = {}) {
  const read = key => query instanceof URLSearchParams ? query.get(key) : query[key];
  return { project: Object.hasOwn(PROJECT_LABELS, read('project')) ? read('project') : '', feature: Object.hasOwn(FEATURE_LABELS, read('feature')) ? read('feature') : '' };
}
export const cleanString = (value, max = 300) => typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max) : '';
export function normalizeContext(query = {}) {
  const read = (key) => query instanceof URLSearchParams ? query.get(key) : query[key];
  const context = CONTEXTS.includes(read('context')) ? read('context') : 'flatbed';
  const rawService = read('service');
  const service = SERVICE_OPTIONS.find(([id, label]) => rawService === id || rawService === label)?.[0] || '';
  return { context, service };
}
export function validateInquiryFields(data) {
  const errors = {};
  if (!cleanString(data.firstName, 80)) errors.firstName = 'Enter your first name.';
  if (!['email', 'phone'].includes(data.preferredContact)) errors.preferredContact = 'Choose email or phone.';
  if (data.preferredContact === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanString(data.email, 254))) errors.email = 'Enter a valid email address.';
  if (data.preferredContact === 'phone' && !/^\+?[0-9 ()\-\.]{7,32}$/.test(cleanString(data.phone, 32))) errors.phone = 'Enter a phone number with at least 7 digits.';
  if (data.preferredContact === 'phone' && cleanString(data.phone, 32).replace(/\D/g, '').length < 7) errors.phone = 'Enter a phone number with at least 7 digits.';
  if (!CONTEXTS.includes(data.context)) errors.context = 'Choose a supported inquiry type.';
  const hasTruck = data.build?.truck?.make && data.build?.truck?.model;
  if (['flatbed', 'camper', 'work'].includes(data.context) && !hasTruck && !cleanString(data.vehicleDetails, 180) && !data.needVehicleHelp) errors.vehicleDetails = 'Tell us about your truck or choose vehicle help.';
  if (data.context === 'flatbed' && !USE_OPTIONS.includes(data.intendedUse)) errors.intendedUse = 'Choose what you have in mind, including Not sure.';
  if (data.context === 'camper' && !CAMPER_TYPES.includes(data.camperType)) errors.camperType = 'Choose a camper type, including Not decided.';
  if (data.context === 'work') {
    if (!cleanString(data.workGoal, 1000)) errors.workGoal = 'Describe the equipment or work you need to support.';
    if (!['1', '2–5', '6+', 'Not sure'].includes(data.vehicleCount)) errors.vehicleCount = 'Choose a vehicle count, including Not sure.';
  }
  if (data.context === 'service') {
    if (!SERVICE_OPTIONS.some(([id]) => id === data.service)) errors.service = 'Choose a service.';
    if (!cleanString(data.vehicleDetails, 180) && !data.needVehicleHelp) errors.vehicleDetails = ['marine', 'boat-detail'].includes(data.service) ? 'Tell us about your vessel or choose help identifying it.' : 'Tell us about your vehicle or choose help identifying it.';
    if (!cleanString(data.message, 1500)) errors.message = 'Tell us what you would like help with.';
  }
  if (data.context === 'general') {
    if (!TOPICS.includes(data.topic)) errors.topic = 'Choose an inquiry topic.';
    if (!cleanString(data.message, 1500)) errors.message = 'Enter a short message.';
  }
  return errors;
}
