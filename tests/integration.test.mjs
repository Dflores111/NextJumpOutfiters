import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProjectContext } from '../src/inquiry-contract.js';
import { buildInquirySummary, nativeFormFor, resolveNativeForm, prefillNativeContext } from '../src/hubspot-contract.js';
import { validatePreviewRequest } from '../server.mjs';
import { sanitizeBuild, validateBuild } from '../src/builder/domain.js';
import { buildSeoHead, buildSeoResources, validateRelease } from '../src/seo.js';
import { siteRelease } from '../src/site-release.js';

const build = { version: 1, truck: { year: '2024', make: 'Toyota', model: 'Tacoma', bed: '6.1 ft' }, use: 'Longer overland trips', camperType: '', selected: ['base', 'boxes', 'kitchen'], notes: 'Private note never copied' };
test('project and feature context survives preview without accepting arbitrary URL text', () => {
  const context = normalizeProjectContext(new URLSearchParams('project=dillon-f250&feature=storage'));
  assert.deepEqual(context, { project: 'dillon-f250', feature: 'storage' });
  assert.deepEqual(normalizeProjectContext({ project: 'private@example.test', feature: '__proto__' }), { project: '', feature: '' });
  const request = { context: 'flatbed', firstName: 'Test', preferredContact: 'email', email: 'test@example.test', needVehicleHelp: true, intendedUse: 'Overland', ...context };
  const result = validatePreviewRequest(request, { sanitizeBuild, validateBuild });
  assert.equal(result.project, 'dillon-f250'); assert.equal(result.feature, 'storage');
  assert.throws(() => validatePreviewRequest({ ...request, feature: 'fabricated-option' }, { sanitizeBuild, validateBuild }), /Unsupported feature/);
});
test('native summary preserves product context and excludes contact, free text and unapproved totals', () => {
  const summary = buildInquirySummary({ context: 'flatbed', project: 'super-ute', feature: 'camp', email: 'private@example.test', message: 'Private message', total: 10 }, build);
  assert.match(summary, /Super Ute/); assert.match(summary, /Camp setup/); assert.match(summary, /2024 Toyota Tacoma/); assert.match(summary, /Equipment to discuss:/);
  for (const forbidden of ['private@example.test', 'Private message', 'Private note', '$10']) assert.equal(summary.includes(forbidden), false);
  assert.equal(nativeFormFor('camper').id, '405a62cd-cfac-41a6-b8d3-b74a859e9ef1');
  assert.equal(nativeFormFor('service').id, '62895413-4437-4f87-a4aa-b12ccb6a89d6');
  assert.equal(nativeFormFor('service', 'marine').id, 'd1b51e71-d018-48de-a38f-78dbb08846b6');
  assert.equal(nativeFormFor('service', 'boat-detail').id, 'c086baf4-e59a-43ac-9c1f-3367969528c8');
  assert.equal(nativeFormFor('service', '__proto__').id, '62895413-4437-4f87-a4aa-b12ccb6a89d6');
});
test('native prefill dispatches input and change without overwriting visitor edits or submitting', () => {
  const events = [];
  const field = { value: '', dispatchEvent: event => events.push(event.type) };
  const form = { querySelector: selector => { assert.equal(selector, '[name="TICKET.content"], [name="0-5/content"], [name="content"]'); return field; } };
  assert.equal(prefillNativeContext(form, 'Project details'), true);
  assert.equal(field.value, 'Project details'); assert.deepEqual(events, ['input', 'change']);
  field.value = 'Customer edits'; assert.equal(prefillNativeContext(form, 'New details'), false); assert.equal(field.value, 'Customer edits');
  assert.equal(prefillNativeContext(null, 'Details'), false);
});
test('native form callback resolution preserves an array-like HTMLFormElement and unwraps jQuery only when needed', () => {
  const fieldset = { tagName: 'FIELDSET' };
  const form = { tagName: 'FORM', 0: fieldset, length: 36, querySelector() {} };
  assert.equal(resolveNativeForm(form), form);
  assert.equal(resolveNativeForm({ 0: form, get: () => form }), form);
  assert.equal(resolveNativeForm([form]), form);
  assert.equal(resolveNativeForm(undefined), null);
});
test('preview stays noindex and sharing metadata has a branded absolute image with safe escaped text', () => {
  const result = buildSeoHead({ path: '/', title: 'Trucks & <builds>', description: '"Useful" gear', known: true }, siteRelease);
  assert.equal(result.robots, 'noindex,nofollow');
  assert.match(result.head, /og:image" content="https:\/\/next-jump-outfitters.diegoafmejia111.chatgpt.site\/images\/share-next-jump.png/);
  assert.match(result.head, /twitter:card" content="summary_large_image/);
  assert.match(result.head, /Trucks &amp; &lt;builds&gt;/);
  assert.equal(buildSeoResources([{ path: '/' }], siteRelease).sitemap.includes('<url>'), false);
});
test('launch allowlist includes only approved public pages; inquiry, unknown and unapproved pages stay noindex', () => {
  const released = { ...siteRelease, indexingEnabled: true, indexablePaths: ['/', '/pages/quote', '/missing'] };
  const common = { title: 'Page', description: 'Description', known: true };
  assert.match(buildSeoHead({ ...common, path: '/' }, released).robots, /^index/);
  assert.equal(buildSeoHead({ ...common, path: '/pages/quote', privatePage: true }, released).robots, 'noindex,nofollow');
  assert.equal(buildSeoHead({ ...common, path: '/missing', known: false }, released).robots, 'noindex,nofollow');
  assert.equal(buildSeoHead({ ...common, path: '/unapproved' }, released).robots, 'noindex,nofollow');
  const result = buildSeoResources([{ path: '/' }, { path: '/pages/quote', privatePage: true }, { path: '/unapproved' }], released);
  assert.match(result.robots, /Sitemap:/); assert.equal((result.sitemap.match(/<url>/g) || []).length, 1);
});
test('invalid release origins or asset paths cannot be configured', () => {
  for (const publicOrigin of ['http://example.test', 'https://user:secret@example.test', 'https://example.test/path']) assert.throws(() => validateRelease({ ...siteRelease, publicOrigin }));
  assert.throws(() => validateRelease({ ...siteRelease, socialImage: '/images/../secret.jpg' }));
});
