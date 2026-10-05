import test from 'node:test';
import assert from 'node:assert/strict';
import { vehicleRoutes, products, createBuild, normalizeSelected, toggleSelected, parseSavedBuild, sanitizeBuild, validateBuild, truckReady, routeForVehicle } from './domain.js';

const ready = () => ({ ...createBuild('toyota-tacoma-5ft-short-bed'), truck: { year: '2022', make: 'Toyota', model: 'Tacoma', bed: '5 ft' }, use: 'Daily use & weekends' });
test('all 19 source routes are unique and remain pending fitment review', () => {
  assert.equal(vehicleRoutes.length, 19);
  assert.equal(new Set(vehicleRoutes.map(v => v.path)).size, 19);
  assert.ok(vehicleRoutes.every(v => v.status === 'PENDING_REVIEW'));
  assert.equal(routeForVehicle(ready().truck)?.suffix, 'toyota-tacoma-5ft-short-bed');
  assert.equal(routeForVehicle({ make: 'GMC', model: 'Sierra', bed: '8 ft' }), null);
  assert.equal(vehicleRoutes.find(v => v.suffix === 'ram-6-4ft-standard-bed').model, 'Model to confirm');
});
test('public catalog has no approved or numeric prices and starts with no extras', () => {
  assert.deepEqual(createBuild().selected, ['base']);
  assert.ok(products.every(p => p.price === null && p.status === 'PENDING_REVIEW'));
});
test('required base and option dependencies cannot duplicate or disappear', () => {
  assert.deepEqual(normalizeSelected(['base', 'base', 'unknown']), ['base']);
  assert.deepEqual(toggleSelected(['base'], 'base'), ['base']);
  assert.deepEqual(toggleSelected(['base'], 'kitchen'), ['base', 'boxes', 'kitchen']);
  assert.deepEqual(toggleSelected(['base', 'boxes', 'kitchen'], 'boxes'), ['base']);
  assert.deepEqual(toggleSelected(['base', 'boxes', 'kitchen'], 'kitchen'), ['base', 'boxes']);
});
test('persisted contract strips contacts, notes, totals and malformed data', () => {
  const build = sanitizeBuild({ ...ready(), email: 'person@example.com', name: 'Private', notes: 'Private contact notes', total: 42, truck: { ...ready().truck, phone: '123' } });
  assert.equal(build.email, undefined); assert.equal(build.notes, undefined); assert.equal(build.total, undefined); assert.equal(build.truck.phone, undefined);
  assert.equal(parseSavedBuild('malformed'), null);
  assert.equal(parseSavedBuild('{}'), null);
  assert.equal(parseSavedBuild(JSON.stringify({ ...ready(), version: 2 })), null);
  assert.deepEqual(parseSavedBuild(JSON.stringify({ ...ready(), selected: ['base', 'base', 'fake', 'kitchen'] })).selected, ['base', 'boxes', 'kitchen']);
});
test('validation accepts useful uncertain routes but rejects incomplete or invalid payloads', () => {
  assert.equal(validateBuild(ready()).valid, true);
  assert.equal(validateBuild({ ...ready(), truck: { year: '', make: 'Other / not sure', model: 'Not sure', bed: 'Not sure' } }).valid, true);
  assert.equal(truckReady(createBuild().truck), false);
  for (const invalid of [createBuild(), { ...ready(), selected: ['base', 'kitchen'] }, { ...ready(), selected: ['base', 'fake'] }, { ...ready(), selected: ['headache'] }, { ...ready(), selected: ['base', 'base'] }, { ...ready(), use: 'Camper setup', camperType: '' }]) assert.equal(validateBuild(invalid).valid, false);
  assert.equal(validateBuild({ ...ready(), use: 'Camper setup', camperType: 'Still deciding' }).valid, true);
});
test('model-year validation gates navigation and rejects malformed API values before sanitation', () => {
  for (const year of ['202', '20222', 'bad', '0000', '2200', 2022]) {
    assert.equal(truckReady({ ...ready().truck, year }), false);
    assert.equal(validateBuild({ ...ready(), truck: { ...ready().truck, year } }).valid, false);
  }
  assert.equal(truckReady({ ...ready().truck, year: '' }), true);
  assert.equal(truckReady({ ...ready().truck, year: '2022' }), true);
});
test('corrupted saved vehicle values recover to selectable unsure paths', () => {
  const unknownMake = sanitizeBuild({ ...ready(), truck: { year: 'nonsense', make: 'Unknown make', model: 'unknown', bed: 'unknown' } });
  assert.deepEqual(unknownMake.truck, { year: '', make: 'Other / not sure', model: 'Not sure', bed: 'Not sure' });
  assert.equal(truckReady(unknownMake.truck), true);
  const unknownModel = sanitizeBuild({ ...ready(), truck: { ...ready().truck, model: 'Unknown' } });
  assert.equal(unknownModel.truck.model, 'Not listed / not sure');
  assert.equal(unknownModel.truck.bed, 'Not sure');
  const unknownBed = sanitizeBuild({ ...ready(), truck: { ...ready().truck, bed: '99 ft' } });
  assert.equal(unknownBed.truck.bed, 'Not sure');
});
