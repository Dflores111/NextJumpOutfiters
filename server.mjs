import http from 'node:http';
import { readFile, open, mkdir, rename, readdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { cleanString, validateInquiryFields, PROJECT_LABELS, FEATURE_LABELS } from './src/inquiry-contract.js';

import { vehicleRoutes } from './src/builder/domain.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const sha = (value) => createHash('sha256').update(value).digest('hex');
const TOKEN_RE = /^[A-Za-z0-9_-]{32,96}$/;
const MAX_BODY = 16 * 1024;
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex, nofollow',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
const json = (res, status, value) => {
  res.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
};
const asObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (status, message, fields) => Object.assign(new Error(message), { status, fields });

export {validatePreviewRequest} from './src/preview-validation.js';
import {validatePreviewRequest} from './src/preview-validation.js';

async function readJsonBody(req) {
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) throw fail(415, 'Send this request as JSON.');
  const declared = Number(req.headers['content-length'] || 0);
  if (!Number.isFinite(declared) || declared > MAX_BODY) throw fail(413, 'This request is too large.');
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw fail(413, 'This request is too large.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw fail(400, 'This request is not valid JSON.'); }
}

export function createPreviewHandler({ dataDir = path.join(root, '.preview-data'), maxRecords = 500, limit = 30, windowMs = 60_000, clock = Date.now, sanitizeBuild, validateBuild, writeRecord } = {}) {
  const rates = new Map();
  let queue = Promise.resolve();
  const serialize = (fn) => { const next = queue.then(fn); queue = next.catch(() => {}); return next; };
  const fileFor = (token) => path.join(dataDir, `${sha(token)}.json`);
  const publicReceipt = (record) => ({ receiptId: record.receiptId, receivedAt: record.receivedAt, mode: 'preview', sentToShop: false, contactStored: false, context: record.context, summary: record.summary });
  async function lookup(token) {
    try { return JSON.parse(await readFile(fileFor(token), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  return async function previewHandler(req, res) {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/api/preview-requests')) return false;
    try {
      if (!['/api/preview-requests', '/api/preview-requests/status'].includes(pathname)) throw fail(404, 'Preview endpoint not found.');
      const remote = req.socket.remoteAddress || 'local';
      const now = clock();
      const current = rates.get(remote);
      const rate = current && now - current.started < windowMs ? current : { started: now, count: 0 };
      rate.count += 1; rates.set(remote, rate);
      if (rates.size > 1000) for (const [key, item] of rates) if (now - item.started >= windowMs) rates.delete(key);
      if (rate.count > limit) { res.setHeader('Retry-After', Math.ceil(windowMs / 1000)); throw fail(429, 'Too many preview requests. Please wait a minute and try again.'); }
      const expectedOrigin = `http://${req.headers.host}`;
      if (req.headers.origin && req.headers.origin !== expectedOrigin) throw fail(403, 'This request must come from this preview.');
      if (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) throw fail(403, 'This request must come from this preview.');
      if (pathname.endsWith('/status')) {
        if (req.method !== 'GET') throw fail(405, 'Use GET to check a preview receipt.');
        const token = (req.headers.authorization || '').replace(/^Bearer /, '');
        if (!TOKEN_RE.test(token)) throw fail(401, 'A valid preview receipt is required.');
        const record = await lookup(token);
        if (!record) throw fail(404, 'No saved preview request was found. Nothing has been sent to the shop.');
        json(res, 200, publicReceipt(record)); return true;
      }
      if (req.method !== 'POST') throw fail(405, 'Use POST to save a preview request.');
      if (!req.headers.origin || req.headers.origin !== expectedOrigin) throw fail(403, 'This request must come from this preview.');
      const token = req.headers['idempotency-key'];
      if (typeof token !== 'string' || !TOKEN_RE.test(token)) throw fail(400, 'A valid request key is required.');
      const data = await readJsonBody(req);
      const summary = validatePreviewRequest(data, { sanitizeBuild, validateBuild });
      const fingerprint = sha(JSON.stringify(summary));
      const result = await serialize(async () => {
        const previous = await lookup(token);
        if (previous) {
          const matches = previous.fingerprint?.length === fingerprint.length && timingSafeEqual(Buffer.from(previous.fingerprint), Buffer.from(fingerprint));
          if (!matches) throw fail(409, 'This request key belongs to a different preview. Start a new request.');
          return { record: previous, reused: true };
        }
        await mkdir(dataDir, { recursive: true, mode: 0o700 });
        const files = await readdir(dataDir);
        if (files.filter((filename) => filename.endsWith('.json')).length >= maxRecords) throw fail(503, 'Preview storage is full. Nothing has been sent to the shop.');
        const record = { version: 1, receiptId: randomUUID(), receivedAt: new Date(clock()).toISOString(), context: summary.context, fingerprint, summary };
        const tmp = path.join(dataDir, `${randomUUID()}.tmp`);
        if (writeRecord) await writeRecord(fileFor(token), record);
        else {
          const file = await open(tmp, 'wx', 0o600);
          try { await file.writeFile(JSON.stringify(record)); await file.sync(); } finally { await file.close(); }
          await rename(tmp, fileFor(token));
        }
        return { record, reused: false };
      });
      json(res, result.reused ? 200 : 201, { ...publicReceipt(result.record), receiptToken: token, reused: result.reused });
    } catch (error) {
      json(res, error.status || 503, { error: error.status ? error.message : 'This preview could not save your request. Your entries are still here. Nothing has been sent to the shop.', ...(error.fields ? { fields: error.fields } : {}) });
    }
    return true;
  };
}

const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };
async function staticFile(req, res, folder, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return false; }
  const relative = decoded.replace(/^\/+/, '');
  if (!relative || relative.split('/').some((part) => part.startsWith('.')) || relative.includes('\\')) return false;
  const candidate = path.resolve(folder, relative);
  if (!candidate.startsWith(path.resolve(folder) + path.sep)) return false;
  try {
    const info = await stat(candidate);
    if (!info.isFile()) return false;
    res.writeHead(200, { ...securityHeaders, 'Content-Type': `${mime[path.extname(candidate)] || 'application/octet-stream'}${['.js', '.css', '.txt', '.xml', '.json'].includes(path.extname(candidate)) ? '; charset=utf-8' : ''}`, 'Content-Length': info.size, 'Cache-Control': pathname.startsWith('/assets/') ? 'public,max-age=31536000,immutable' : 'public,max-age=3600' });
    if (req.method === 'HEAD') res.end(); else createReadStream(candidate).pipe(res);
    return true;
  } catch { return false; }
}

export function isAllowedHost(host) { return /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(host || ''); }

export function isPrivatePath(requestUrl) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname); } catch { return true; }
  return pathname.split('/').some((part) => part === '.preview-data' || part === 'evidence' || part === '.env' || part.startsWith('.env.') || part === '.git' || part === 'server.mjs' || part === 'tests');
}

export async function startServer({ port = Number(process.env.PORT || 4173), host = '127.0.0.1' } = {}) {
  const production = process.env.NODE_ENV === 'production';
  const { sanitizeBuild, validateBuild } = await import('./src/builder/domain.js');
  const dataDir = path.resolve(process.env.PREVIEW_DATA_DIR || path.join(root, '.preview-data'));
  if ([path.join(root, 'public'), path.join(root, 'dist/client')].some((folder) => dataDir === folder || dataDir.startsWith(folder + path.sep))) throw new Error('PREVIEW_DATA_DIR must be outside public asset directories.');
  const api = createPreviewHandler({ sanitizeBuild, validateBuild, dataDir });
  const vite = production ? null : await (await import('vite')).createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
  const productionEntry = production ? await import(pathToFileURL(path.join(root, 'dist/server/entry-server.js')).href) : null;
  const server = http.createServer(async (req, res) => {
    for (const [name, value] of Object.entries(securityHeaders)) res.setHeader(name, value);
    try {
      if (!isAllowedHost(req.headers.host)) { json(res, 403, { error: 'This preview is available only on localhost.' }); return; }
      if (isPrivatePath(req.url)) { json(res, 404, { error: 'Not found.' }); return; }
      if (await api(req, res)) return;
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (!['GET', 'HEAD'].includes(req.method)) { json(res, 405, { error: 'Method not allowed.' }); return; }
      if (url.pathname.startsWith('/api/')) { json(res, 404, { error: 'Endpoint not found.' }); return; }
      if (['/robots.txt', '/sitemap.xml'].includes(url.pathname)) {
        const { seoResources } = productionEntry || await vite.ssrLoadModule('/src/entry-server.jsx');
        const resources = seoResources();
        const isRobots = url.pathname === '/robots.txt';
        res.writeHead(200, { 'Content-Type': isRobots ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(req.method === 'HEAD' ? undefined : isRobots ? resources.robots : resources.sitemap);
        return;
      }
      if (production && await staticFile(req, res, path.join(root, 'dist/client'), url.pathname)) return;
      if (await staticFile(req, res, path.join(root, 'public'), url.pathname)) return;
      const renderPage = async () => {
        try {
          let template = await readFile(path.join(root, production ? 'dist/client/index.html' : 'index.html'), 'utf8');
          if (vite) template = await vite.transformIndexHtml(req.url, template);
          const { render } = productionEntry || await vite.ssrLoadModule('/src/entry-server.jsx');
          const result = await render(req.url);
          const html = template.replace('<!--app-head-->', result.head || '').replace(/<!--(?:app-html|ssr-outlet)-->/, result.html || '');
          res.writeHead(result.status || 200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': result.robots || 'noindex, nofollow' });
          res.end(req.method === 'HEAD' ? undefined : html);
        } catch (error) {
          if (vite) vite.ssrFixStacktrace(error);
          // Do not log request payloads or contact data.
          console.error('Page rendering failed.');
          if (!res.headersSent) json(res, 500, { error: 'This preview page could not load. Please refresh or return home.' });
          else res.end();
        }
      };
      if (vite) vite.middlewares(req, res, renderPage); else await renderPage();
    } catch {
      if (!res.headersSent) json(res, 500, { error: 'This preview request could not be completed.' }); else res.end();
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  console.log(`Next Jump preview ready at http://${host}:${server.address().port} (${production ? 'production build' : 'development'})`);
  server.on('close', () => vite?.close());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) startServer().catch((error) => { console.error('Preview failed to start:', error.message); process.exitCode = 1; });
