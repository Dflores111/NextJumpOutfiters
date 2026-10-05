import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createPreviewHandler, validatePreviewRequest, isPrivatePath, isAllowedHost } from '../server.mjs';
import { sanitizeBuild, validateBuild } from '../src/builder/domain.js';

const key = () => randomUUID().replaceAll('-', '');
const good = () => ({ context: 'flatbed', firstName: 'Preview Person', preferredContact: 'email', email: 'preview@example.test', intendedUse: 'Overland', needVehicleHelp: true, message: '', project: '', marketingOptIn: false, build: null });
const vehicleBuild = () => ({ version: 1, truck: { year: '2024', make: 'Toyota', model: 'Tacoma', bed: '6.1 ft' }, use: 'Longer overland trips', camperType: '', selected: ['base', 'boxes', 'kitchen'], notes: 'Never persist note@example.test' });
const domain = { sanitizeBuild, validateBuild };
async function fixture(t, options = {}) {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'nj-preview-test-'));
  const handler = createPreviewHandler({ dataDir, ...domain, ...options });
  const server = http.createServer(async (req, res) => { if (!await handler(req, res)) { res.statusCode = 404; res.end(); } });
  t.after(async () => { if (server.listening) await new Promise(resolve => server.close(resolve)); await rm(dataDir, { recursive: true, force: true }); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const post = (data = good(), token = key(), headers = {}) => fetch(`${origin}/api/preview-requests`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': token, ...headers }, body: typeof data === 'string' ? data : JSON.stringify(data) });
  const status = token => fetch(`${origin}/api/preview-requests/status`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { dataDir, origin, post, status };
}

test('email OR phone is accepted; unselected contact channel is not required', () => {
  assert.equal(validatePreviewRequest(good(), domain).context, 'flatbed');
  assert.equal(validatePreviewRequest({ ...good(), preferredContact: 'phone', email: '', phone: '+1 (555) 123-4567' }, domain).context, 'flatbed');
  assert.throws(() => validatePreviewRequest({ ...good(), email: 'invalid' }, domain), error => error.status === 422 && !!error.fields.email);
  assert.throws(() => validatePreviewRequest({ ...good(), preferredContact: 'phone', phone: 'short' }, domain), error => error.status === 422 && !!error.fields.phone);
});

test('forms validate context-specific data without imposing truck fields on general or marine inquiries', () => {
  assert.equal(validatePreviewRequest({ ...good(), context: 'general', topic: 'Visiting the shop', needVehicleHelp: false, message: 'A question about your store.' }, domain).context, 'general');
  assert.equal(validatePreviewRequest({ ...good(), context: 'service', needVehicleHelp: false, service: 'boat-detail', vehicleDetails: '24-foot sailboat', message: 'Please help with detailing.' }, domain).service, 'boat-detail');
  assert.throws(() => validatePreviewRequest({ ...good(), context: 'camper' }, domain), error => !!error.fields.camperType);
  assert.throws(() => validatePreviewRequest({ ...good(), context: 'work' }, domain), error => !!error.fields.workGoal && !!error.fields.vehicleCount);
  assert.equal(validatePreviewRequest({ ...good(), context: 'work', workGoal: 'Carry tools', vehicleCount: 'Not sure' }, domain).vehicleCount, 'Not sure');
});

test('server validates component dependencies and rejects fabricated prices instead of trusting client totals', () => {
  const result = validatePreviewRequest({ ...good(), build: vehicleBuild(), project: 'super-ute' }, domain);
  assert.equal(result.build.truck.model, 'Tacoma');
  assert.equal(result.project, 'super-ute');
  assert.equal(result.build.notes, undefined);
  assert.throws(() => validatePreviewRequest({ ...good(), total: 1 }, domain), error => error.status === 400);
  assert.throws(() => validatePreviewRequest({ ...good(), build: { ...vehicleBuild(), selected: ['base', 'kitchen'] } }, domain), error => error.status === 422);
  assert.throws(() => validatePreviewRequest({ ...good(), build: { ...vehicleBuild(), selected: ['base', 'fake-product'] } }, domain), error => error.status === 422);
  assert.throws(() => validatePreviewRequest({ ...good(), project: 'unapproved-offer' }, domain), error => error.status === 400);
});

test('durable receipt excludes all contact, free text, notes and consent; verified status requires opaque token', async t => {
  const app = await fixture(t);
  const token = key();
  const response = await app.post({ ...good(), firstName: 'PrivateNameSentinel', company: 'PrivateCompanySentinel', message: 'PrivateMessageSentinel', build: vehicleBuild(), marketingOptIn: true }, token);
  assert.equal(response.status, 201);
  const receipt = await response.json();
  assert.equal(receipt.sentToShop, false);
  assert.equal(receipt.contactStored, false);
  assert.equal(receipt.mode, 'preview');
  const files = await readdir(app.dataDir);
  assert.equal(files.length, 1);
  const disk = await readFile(path.join(app.dataDir, files[0]), 'utf8');
  for (const privateValue of ['PrivateNameSentinel', 'PrivateCompanySentinel', 'PrivateMessageSentinel', 'preview@example.test', 'note@example.test', 'marketingOptIn', token]) assert.equal(disk.includes(privateValue), false, `${privateValue} must not be retained`);
  const status = await app.status(token);
  assert.equal(status.status, 200);
  assert.equal((await status.json()).receiptId, receipt.receiptId);
  assert.equal((await app.status()).status, 401);
  assert.equal((await app.status(key())).status, 404);
});

test('concurrent double-click and timeout retry reuse exactly one receipt', async t => {
  const app = await fixture(t);
  const token = key();
  const responses = await Promise.all([app.post(good(), token), app.post(good(), token)]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 201]);
  const receipts = await Promise.all(responses.map(response => response.json()));
  assert.equal(receipts[0].receiptId, receipts[1].receiptId);
  assert.equal((await readdir(app.dataDir)).length, 1);
  const retry = await app.post(good(), token);
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).receiptId, receipts[0].receiptId);
  assert.equal((await app.post({ ...good(), intendedUse: 'Camper' }, token)).status, 409);
});

test('a repeat customer making a new inquiry gets a distinct receipt', async t => {
  const app = await fixture(t);
  const first = await (await app.post(good())).json();
  const second = await (await app.post({ ...good(), intendedUse: 'Work / business' })).json();
  assert.notEqual(first.receiptId, second.receiptId);
  assert.equal((await readdir(app.dataDir)).length, 2);
});

test('CSRF, malformed data, huge bodies and invalid requests never produce receipts', async t => {
  const app = await fixture(t);
  assert.equal((await app.post(good(), key(), { Origin: 'https://external.example' })).status, 403);
  assert.equal((await app.post(good(), key(), { Origin: '' })).status, 403);
  assert.equal((await app.post(good(), key(), { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await app.post('{bad json')).status, 400);
  assert.equal((await app.post(good(), key(), { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await app.post({ ...good(), message: 'x'.repeat(17000) })).status, 413);
  assert.equal((await app.post({ ...good(), firstName: '' })).status, 422);
  assert.equal((await app.post(good(), 'short')).status, 400);
  assert.equal((await readdir(app.dataDir)).length, 0);
});

test('storage failure and capacity limits report failure, never confirmation', async t => {
  const broken = await fixture(t, { writeRecord: async () => { throw new Error('Private failure detail should never be returned.'); } });
  const token = key();
  const failure = await broken.post(good(), token);
  assert.equal(failure.status, 503);
  assert.equal((await failure.text()).includes('Private failure detail'), false);
  assert.equal((await broken.status(token)).status, 404);
  const full = await fixture(t, { maxRecords: 0 });
  assert.equal((await full.post()).status, 503);
  assert.equal((await readdir(full.dataDir)).length, 0);
});

test('rate limits bound local API use and state when a retry is allowed', async t => {
  const app = await fixture(t, { limit: 2 });
  assert.equal((await app.post()).status, 201);
  assert.equal((await app.post()).status, 201);
  const response = await app.post();
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '60');
});

test('private files and non-local hostnames are rejected before Vite/static middleware', () => {
  for (const pathname of ['/.preview-data/receipt.json', '/%2epreview-data/test', '/@fs/tmp/.preview-data/a.json', '/.env', '/.env.local', '/evidence/test.json', '/server.mjs', '/tests/server.test.mjs', '/.git/config']) assert.equal(isPrivatePath(pathname), true, pathname);
  for (const pathname of ['/pages/contact-us', '/images/base-0.jpg', '/src/entry-client.jsx']) assert.equal(isPrivatePath(pathname), false, pathname);
  for (const host of ['127.0.0.1:4173', 'localhost:4173', '[::1]:4173']) assert.equal(isAllowedHost(host), true);
  for (const host of ['evil.example:4173', '127.0.0.1.evil.example', 'localhost@evil.example', '']) assert.equal(isAllowedHost(host), false);
});
