import { planningProducts, startingPlans, upgradeIntents, upgradeModels } from '../catalog/planning.js';
// Routing inventory from the supplied Website Blueprint, section 5.1.
// These are existing page labels, not certified fitment records.
export const STORAGE_KEY = 'nj-build-v1';
export const PENDING_REVIEW = 'PENDING_REVIEW';
const route = (suffix, make, model, bed, label) => ({ suffix, path: `/pages/aluminum-flatbed-truck-body-${suffix}`, make, model, bed, label, status: PENDING_REVIEW });
export const vehicleRoutes = [
  route('toyota-tacoma-5ft-short-bed', 'Toyota', 'Tacoma', '5 ft', 'Toyota Tacoma 5-foot short bed'),
  route('toyota-tacoma-6-1ft-long-bed', 'Toyota', 'Tacoma', '6.1 ft', 'Toyota Tacoma 6.1-foot long bed'),
  route('toyota-tundra-6-5ft-standard-bed', 'Toyota', 'Tundra', '6.5 ft', 'Toyota Tundra 6.5-foot standard bed'),
  route('toyota-tundra-8ft-long-bed', 'Toyota', 'Tundra', '8 ft', 'Toyota Tundra 8-foot long bed'),
  route('ford-ranger-5ft-short-bed', 'Ford', 'Ranger', '5 ft', 'Ford Ranger 5-foot short bed'),
  route('ford-ranger-6ft-long-bed', 'Ford', 'Ranger', '6 ft', 'Ford Ranger 6-foot long bed'),
  route('ford-super-duty-8ft-long-bed', 'Ford', 'Super Duty', '8 ft', 'Ford Super Duty 8-foot long bed'),
  route('chevrolet-colorado-5-2ft-short-bed', 'Chevrolet', 'Colorado', '5.2 ft', 'Chevrolet Colorado 5.2-foot short bed'),
  route('chevrolet-colorado-6-2ft-long-bed', 'Chevrolet', 'Colorado', '6.2 ft', 'Chevrolet Colorado 6.2-foot long bed'),
  route('chevrolet-silverado-6-6ft-standard-bed', 'Chevrolet', 'Silverado', '6.6 ft', 'Chevrolet Silverado 6.6-foot standard bed'),
  route('chevrolet-silverado-8-1ft-long-bed', 'Chevrolet', 'Silverado', '8.1 ft', 'Chevrolet Silverado 8.1-foot long bed'),
  route('jeep-gladiator-jt-5ft-standard-bed', 'Jeep', 'Gladiator JT', '5 ft', 'Jeep Gladiator JT 5-foot bed'),
  route('ram-6-4ft-standard-bed', 'Ram', 'Model to confirm', '6.4 ft', 'Ram 6.4-foot standard bed — model to confirm'),
  route('ram-8ft-long-bed', 'Ram', 'Model to confirm', '8 ft', 'Ram 8-foot long bed — model to confirm'),
  route('ram-heavy-duty-6-75ft-short-bed', 'Ram', 'Heavy Duty', '6.75 ft', 'Ram Heavy Duty 6.75-foot short bed'),
  route('ram-heavy-duty-8ft-long-bed', 'Ram', 'Heavy Duty', '8 ft', 'Ram Heavy Duty 8-foot long bed'),
  route('nissan-frontier-5ft-short-bed', 'Nissan', 'Frontier', '5 ft', 'Nissan Frontier 5-foot short bed'),
  route('nissan-frontier-6-1ft-long-bed', 'Nissan', 'Frontier', '6.1 ft', 'Nissan Frontier 6.1-foot long bed'),
  route('nissan-titan-6-5ft-standard-bed', 'Nissan', 'Titan', '6.5 ft', 'Nissan Titan 6.5-foot standard bed'),
];

export const products = planningProducts;
export const buildKind = build => build?.plan?.kind === 'vehicle' ? 'vehicle' : 'flatbed';
export const buildItems = build => buildKind(build) === 'vehicle' ? upgradeIntents.filter(p => build.plan.upgradeIds.includes(p.id)) : products.filter(p => build.selected.includes(p.id));
const answerOptions = { load: ['occasional','permanent','unsure'], trips: ['weekend','multi-day','remote'], priority: ['flexibility','work','camp','camper'] };
export function sanitizePlan(value = {}) {
  if(!value||typeof value!=='object'||Array.isArray(value))value={};
  const kind = value.kind === 'vehicle' ? 'vehicle' : 'flatbed';
  const answers = Object.fromEntries(Object.entries(answerOptions).filter(([key, values]) => values.includes(value.answers?.[key])).map(([key]) => [key, value.answers[key]]));
  return { kind, packageId: startingPlans.some(p => p.kind === kind && p.id === value.packageId) ? value.packageId : '', answers, upgradeIds: upgradeIntents.filter(p => Array.isArray(value.upgradeIds)&&value.upgradeIds.includes(p.id)).map(p => p.id), fulfillment: value.fulfillment === 'diy' ? 'diy' : 'installed' };
}
export const uses = ['Daily use & weekends', 'Work & hauling', 'Longer overland trips', 'Camper setup', 'Still exploring'];
export const camperTypes = ['Topper / camper shell', 'Slide-in camper', 'Flatbed camper', 'Still deciding'];
const cleanText = (value, max = 120) => typeof value === 'string' ? value.slice(0, max).trim() : '';
export const validModelYear = value => value === '' || (typeof value === 'string' && /^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= 2100);
export const makeOptions = [...new Set(vehicleRoutes.map(v => v.make))];
export const modelOptions = make => [...new Set(vehicleRoutes.filter(v => v.make === make).map(v => v.model))];
export const bedOptions = (make, model) => [...new Set(vehicleRoutes.filter(v => v.make === make && v.model === model).map(v => v.bed))];
export function routeForVehicle(truck) { return vehicleRoutes.find(v => v.make === truck.make && v.model === truck.model && v.bed === truck.bed) || null; }
export function vehicleFromRoute(value) {
  if (typeof value === 'string') return vehicleRoutes.find(v => v.suffix === value || v.path === value) || null;
  if (value && typeof value === 'object') return value;
  return null;
}
export function createBuild(routeVehicle = null) {
  const vehicle = vehicleFromRoute(routeVehicle);
  return { version: 1, truck: { year: cleanText(vehicle?.year, 4), make: cleanText(vehicle?.make), model: cleanText(vehicle?.model), bed: cleanText(vehicle?.bed) }, use: '', camperType: '', selected: ['base'], plan: sanitizePlan() };
}
export function normalizeSelected(ids = []) {
  const valid = new Set(products.map(p => p.id));
  const selected = new Set(['base', ...(Array.isArray(ids) ? ids.filter(id => valid.has(id)) : [])]);
  if (selected.has('kitchen')) selected.add('boxes');
  return products.filter(p => selected.has(p.id)).map(p => p.id);
}
export function toggleSelected(ids, id) {
  const selected = new Set(normalizeSelected(ids));
  if (id === 'base' || !products.some(p => p.id === id)) return [...selected];
  if (selected.has(id)) { selected.delete(id); if (id === 'boxes') selected.delete('kitchen'); }
  else { selected.add(id); if (id === 'kitchen') selected.add('boxes'); }
  return normalizeSelected([...selected]);
}
// Only this allowlist is persisted or passed to the quote form. Contacts never belong here.
export function sanitizeBuild(value) {
  if (!value || typeof value !== 'object' || value.version !== 1 || !value.truck || !Array.isArray(value.selected)) return null;
  const truck = { year: validModelYear(value.truck.year) ? value.truck.year : '', make: cleanText(value.truck.make), model: cleanText(value.truck.model), bed: cleanText(value.truck.bed) };
  const plan = sanitizePlan(value.plan);
  const makes = plan.kind === 'vehicle' ? Object.keys(upgradeModels) : makeOptions;
  const models = plan.kind === 'vehicle' ? upgradeModels[truck.make] || [] : modelOptions(truck.make);
  if (!truck.make) { truck.model = ''; truck.bed = ''; }
  else if (!makes.includes(truck.make)) { truck.make = 'Other / not sure'; truck.model = 'Not sure'; truck.bed = 'Not sure'; }
  else if (truck.model && !models.includes(truck.model)) { truck.model = 'Not listed / not sure'; truck.bed = 'Not sure'; }
  else if (!truck.model) truck.bed = '';
  else if (truck.bed && !bedOptions(truck.make, truck.model).includes(truck.bed)) truck.bed = 'Not sure';
  if(plan.kind==='vehicle')truck.bed='';
  return { version: 1, truck, use: uses.includes(value.use) ? value.use : '', camperType: camperTypes.includes(value.camperType) ? value.camperType : '', selected: plan.kind === 'vehicle' ? [] : normalizeSelected(value.selected), plan };
}
export function parseSavedBuild(raw) { try { return sanitizeBuild(JSON.parse(raw)); } catch { return null; } }
export function truckReady(truck, kind = 'flatbed') { return !!truck && validModelYear(truck.year ?? '') && !!truck.make && (truck.make === 'Other / not sure' || (!!truck.model && (kind === 'vehicle' || !!truck.bed))); }
export function validateBuild(value) {
  const errors = [];
  const build = sanitizeBuild(value);
  if (!build) return { valid: false, errors: ['Build data is missing or has an unsupported format.'], value: null };
  if (!truckReady(build.truck, buildKind(build))) errors.push('Choose your truck details or the unsure option.');
  if (!validModelYear(value.truck.year ?? '')) errors.push('Use a four-digit model year from 1900 to 2100 or leave it blank.');
  if (!uses.includes(value.use)) errors.push('Choose how you plan to use your truck.');
  if (value.use === 'Camper setup' && !camperTypes.includes(value.camperType)) errors.push('Choose a camper type or Still deciding.');
  if (buildKind(build) === 'flatbed' && !value.selected.includes('base')) errors.push('The flatbed foundation must be included.');
  if (value.selected.some(id => !products.some(p => p.id === id))) errors.push('A selected option is not recognized.');
  if (value.selected.includes('kitchen') && !value.selected.includes('boxes')) errors.push('The kitchen insert requires upper storage boxes.');
  if (new Set(value.selected).size !== value.selected.length) errors.push('Selected options must be unique.');
  if(buildKind(build)==='vehicle'&&value.selected.length)errors.push('Flatbed parts do not belong in a vehicle-upgrade plan.');
  if(value.plan?.fulfillment&&!['installed','diy'].includes(value.plan.fulfillment))errors.push('Choose an installed or parts-only preference.');
  if (value.plan && !['vehicle','flatbed'].includes(value.plan.kind)) errors.push('Choose a recognized build direction.');
  if (value.plan?.packageId && !startingPlans.some(p => p.id === value.plan.packageId && p.kind === buildKind(build))) errors.push('The starting plan does not match your build direction.');
  if (value.plan?.upgradeIds && (!Array.isArray(value.plan.upgradeIds) || value.plan.upgradeIds.some(id => !upgradeIntents.some(p => p.id === id)) || new Set(value.plan.upgradeIds).size !== value.plan.upgradeIds.length)) errors.push('Choose recognized, unique upgrade priorities.');
  return { valid: errors.length === 0, errors, value: build };
}
