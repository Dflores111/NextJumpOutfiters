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

export const products = [
  { id: 'base', name: 'Aluminum flatbed', category: 'Foundation', image: 'base-2.jpg', description: 'An open, modular foundation. Your truck determines the platform and mounting details.', price: null, status: PENDING_REVIEW },
  { id: 'headache', name: 'Cab protection rack', category: 'Carry', image: 'headache-0.jpg', description: 'A rack behind the cab. Ask the team to review it with your load and camper plans.', price: null, status: PENDING_REVIEW },
  { id: 'sides', name: 'Removable sides', category: 'Carry', image: 'sides-2.jpg', description: 'Sides for a contained load area, with open access when removed.', price: null, status: PENDING_REVIEW },
  { id: 'tailgate', name: 'Tailgate upgrade', category: 'Carry', image: 'tailgate-0.jpg', description: 'A rear closure to review with your sides and any camper or topper.', price: null, status: PENDING_REVIEW },
  { id: 'boxes', name: 'Upper storage boxes', category: 'Storage', image: 'boxes-1.jpg', description: 'Accessible storage above the deck. Required when considering the kitchen insert.', price: null, status: PENDING_REVIEW },
  { id: 'underbody', name: 'Rear underbody storage', category: 'Storage', image: 'underbody-0.jpg', description: 'Make use of space below the flatbed, subject to vehicle clearance and mounting review.', price: null, status: PENDING_REVIEW },
  { id: 'kitchen', name: 'Camp kitchen insert', category: 'Camp', image: 'kitchen-0.jpg', description: 'A pull-out kitchen insert for upper storage boxes. Both components need a fitment review.', requires: 'boxes', price: null, status: PENDING_REVIEW },
];
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
  return { version: 1, truck: { year: cleanText(vehicle?.year, 4), make: cleanText(vehicle?.make), model: cleanText(vehicle?.model), bed: cleanText(vehicle?.bed) }, use: '', camperType: '', selected: ['base'] };
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
  if (!truck.make) { truck.model = ''; truck.bed = ''; }
  else if (!makeOptions.includes(truck.make)) { truck.make = 'Other / not sure'; truck.model = 'Not sure'; truck.bed = 'Not sure'; }
  else if (truck.model && !modelOptions(truck.make).includes(truck.model)) { truck.model = 'Not listed / not sure'; truck.bed = 'Not sure'; }
  else if (!truck.model) truck.bed = '';
  else if (truck.bed && !bedOptions(truck.make, truck.model).includes(truck.bed)) truck.bed = 'Not sure';
  return { version: 1, truck, use: uses.includes(value.use) ? value.use : '', camperType: camperTypes.includes(value.camperType) ? value.camperType : '', selected: normalizeSelected(value.selected) };
}
export function parseSavedBuild(raw) { try { return sanitizeBuild(JSON.parse(raw)); } catch { return null; } }
export function truckReady(truck) { return !!truck && validModelYear(truck.year ?? '') && !!truck.make && (truck.make === 'Other / not sure' || (!!truck.model && !!truck.bed)); }
export function validateBuild(value) {
  const errors = [];
  const build = sanitizeBuild(value);
  if (!build) return { valid: false, errors: ['Build data is missing or has an unsupported format.'], value: null };
  if (!truckReady(build.truck)) errors.push('Choose your truck details or the unsure option.');
  if (!validModelYear(value.truck.year ?? '')) errors.push('Use a four-digit model year from 1900 to 2100 or leave it blank.');
  if (!uses.includes(value.use)) errors.push('Choose how you plan to use your truck.');
  if (value.use === 'Camper setup' && !camperTypes.includes(value.camperType)) errors.push('Choose a camper type or Still deciding.');
  if (!value.selected.includes('base')) errors.push('The flatbed foundation must be included.');
  if (value.selected.some(id => !products.some(p => p.id === id))) errors.push('A selected option is not recognized.');
  if (value.selected.includes('kitchen') && !value.selected.includes('boxes')) errors.push('The kitchen insert requires upper storage boxes.');
  if (new Set(value.selected).size !== value.selected.length) errors.push('Selected options must be unique.');
  return { valid: errors.length === 0, errors, value: build };
}
