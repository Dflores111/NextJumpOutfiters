import http from 'node:http';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';
import { vehicleRoutes } from '../src/builder/domain.js';

// Read-only HTTP inspection. This does not click controls, submit forms or contact external sites.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = new URL(process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) || base.protocol !== 'http:') throw new Error('The audit only accepts an HTTP localhost preview.');
const output = path.join(root, 'evidence');
const started = new Date().toISOString();
const vite = await createServer({ root, logLevel: 'silent', server: { middlewareMode: true, hmr: false } });
let pages, P, external;
try { ({ pages, P, external } = await vite.ssrLoadModule('/src/routes.js')); }
finally { await vite.close(); }

const decode = (s = '') => s.replace(/&(?:amp|lt|gt|quot|apos|#x[0-9a-f]+|#\d+);/gi, (entity) => {
  const known = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#x27;': "'" };
  if (known[entity]) return known[entity];
  const value = entity.startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
  return Number.isFinite(value) && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
});
const clean = (s = '') => decode(s).replace(/\s+/g, ' ').trim();
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
function parseHtml(html) {
  const document = { tag: '#document', attrs: {}, text: '', children: [], parent: null };
  const stack = [document], nodes = [];
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[\w:-]+(?:\s+(?:[^"'<>]|"[^"]*"|'[^']*')*)?\s*\/?>|[^<]+/g)) {
    const token = match[0];
    if (token.startsWith('<!--') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/([\w:-]+)/)?.[1].toLowerCase();
      const at = stack.map((n) => n.tag).lastIndexOf(tag);
      if (at > 0) stack.length = at;
      continue;
    }
    if (token.startsWith('<')) {
      const tagMatch = token.match(/^<([\w:-]+)/), tag = tagMatch?.[1].toLowerCase();
      if (!tag) continue;
      const attrs = {};
      for (const a of token.slice(tagMatch[0].length).replace(/\/?\s*>$/, '').matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? '');
      const node = { tag, attrs, text: '', children: [], parent: stack.at(-1) };
      node.parent.children.push(node); nodes.push(node);
      if (!VOID.has(tag) && !token.endsWith('/>')) stack.push(node);
      continue;
    }
    if (!stack.some((n) => ['script', 'style'].includes(n.tag))) for (const node of stack) node.text += ' ' + token;
  }
  return { document, nodes };
}
function ancestor(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (['header', 'footer'].includes(current.tag)) return current.tag;
    if (current.attrs.id) return `${current.tag}#${current.attrs.id}`;
    if (['section', 'nav', 'form', 'dialog'].includes(current.tag)) return `${current.tag}${current.attrs['aria-label'] ? `[${current.attrs['aria-label']}]` : current.attrs.class ? '.' + current.attrs.class.split(' ')[0] : ''}`;
  }
  return 'document';
}
function request(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers: { 'User-Agent': 'NextJumpLocalRouteAudit/1.0' } }, (res) => {
      const chunks = []; let length = 0;
      res.on('data', (chunk) => { length += chunk.length; if (length > 4 * 1024 * 1024) req.destroy(new Error('Audit response exceeded 4 MiB')); else chunks.push(chunk); });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.setTimeout(15000, () => req.destroy(new Error('Local request timed out')));
    req.on('error', reject); req.end();
  });
}
const cache = new Map();
async function fetchPage(destination) {
  const url = new URL(destination, base); url.hash = '';
  const key = url.pathname + url.search;
  if (!cache.has(key)) cache.set(key, request(url).then((res) => ({ ...res, ...parseHtml(res.body), url: key })));
  return cache.get(key);
}
const inventory = [...pages.map((p) => ({ path: p.path, id: p.id, label: p.label, publication: p.publication, kind: p.id === 'P10' ? 'utility' : 'content' })), ...vehicleRoutes.map((v) => ({ path: v.path, label: v.label, publication: 'preview-fitment-pending', kind: 'vehicle', vehicle: v })), { path: P.sitemap, label: 'Sitemap', publication: 'preview', kind: 'utility' }];
const routeMap = new Map(inventory.map((r) => [r.path, r]));
const failures = [], warnings = [], actions = [], resources = new Map(), routes = [];
const addFailure = (source, check, detail) => failures.push({ source, check, detail });
const intentionalExternal = new Set(external.map(([, url]) => url));

for (const route of inventory) {
  let page;
  try { page = await fetchPage(route.path); }
  catch (error) { addFailure(route.path, 'fetch', error.message); continue; }
  const byTag = (tag) => page.nodes.filter((n) => n.tag === tag);
  const title = clean(byTag('title')[0]?.text);
  const description = byTag('meta').find((n) => n.attrs.name === 'description')?.attrs.content || '';
  const h1 = byTag('h1').map((n) => clean(n.text));
  const robots = byTag('meta').find((n) => n.attrs.name === 'robots')?.attrs.content || '';
  const canonical = byTag('link').find((n) => n.attrs.rel === 'canonical')?.attrs.href || null;
  const ids = page.nodes.filter((n) => n.attrs.id).map((n) => n.attrs.id);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (page.status !== 200) addFailure(route.path, 'status', `Expected 200; got ${page.status}`);
  if (!title || /page not found/i.test(title)) addFailure(route.path, 'title', title || 'Missing title');
  if (!description) addFailure(route.path, 'description', 'Missing description');
  if (h1.length !== 1) addFailure(route.path, 'h1', `Expected one h1; got ${h1.length}`);
  if (!/noindex/.test(robots) || !/noindex/.test(page.headers['x-robots-tag'] || '')) addFailure(route.path, 'preview-indexing', 'Expected noindex meta and response header');
  if (duplicates.length) addFailure(route.path, 'duplicate-id', duplicates.join(', '));
  if (/BUILD NOTE|PAGE JOB|APPROVAL|Sources and implementation context|\{approved-|\{vehicle-slug\}/.test(page.document.text)) addFailure(route.path, 'internal-content', 'Internal instructions or unresolved tokens rendered');
  if (route.kind === 'vehicle') {
    if (!title.toLowerCase().includes(route.vehicle.make.toLowerCase()) || !title.toLowerCase().includes(route.vehicle.model.toLowerCase())) addFailure(route.path, 'vehicle-title', `Title does not identify ${route.vehicle.make} ${route.vehicle.model}`);
    const selected = byTag('option').filter((n) => Object.hasOwn(n.attrs, 'selected')).map((n) => clean(n.text));
    for (const expected of [route.vehicle.make, route.vehicle.model, route.vehicle.bed]) if (!selected.includes(expected)) addFailure(route.path, 'vehicle-prefill', `Missing selected value ${expected}`);
  }
  routes.push({ path: route.path, label: route.label, publication: route.publication, status: page.status, title, description, h1, robots, canonical, imageCount: byTag('img').length, links: byTag('a').length, controls: page.nodes.filter((n) => ['button', 'input', 'select', 'textarea', 'form'].includes(n.tag)).length, htmlSha256: createHash('sha256').update(page.body).digest('hex'), coverage: 'HTTP SSR inspected; browser behavior not exercised' });
  for (const node of page.nodes.filter((n) => ['a', 'button', 'input', 'select', 'textarea', 'form', 'summary'].includes(n.tag))) {
    const labelFor = node.attrs.id && byTag('label').find((n) => n.attrs.for === node.attrs.id);
    const imageAlt = node.children.find((n) => n.tag === 'img')?.attrs.alt;
    const label = clean(node.attrs['aria-label'] || labelFor?.text || node.text || imageAlt || node.attrs.placeholder || node.attrs.name || node.attrs.type || node.tag);
    const destination = node.tag === 'a' ? node.attrs.href ?? null : node.tag === 'form' ? node.attrs.action || null : null;
    const row = { sourcePath: route.path, section: ancestor(node), element: node.tag, label, destination, preservedQueryContext: {}, publicationStatus: route.publication, coverage: 'runtime pending', disabled: Object.hasOwn(node.attrs, 'disabled') };
    if (node.tag === 'a') {
      if (!destination || destination === '#') { row.coverage = 'failed: empty destination'; addFailure(route.path, 'dead-link', label); }
      else if (/^(tel:|mailto:)/.test(destination)) row.coverage = 'contact URI present; activation not tested';
      else if (destination.startsWith('javascript:')) { row.coverage = 'failed: script URI'; addFailure(route.path, 'script-link', label); }
      else {
        const url = new URL(destination, new URL(route.path, base));
        row.preservedQueryContext = Object.fromEntries(url.searchParams);
        row.destinationPublicationStatus = url.origin === base.origin ? routeMap.get(url.pathname)?.publication || 'unregistered local destination' : 'external';
        if (url.origin !== base.origin) row.coverage = intentionalExternal.has(destination) ? 'intentional live store handoff; external not requested' : 'external destination recorded; not requested';
        else {
          try {
            const target = await fetchPage(url.pathname + url.search);
            row.destinationStatus = target.status;
            row.coverage = target.status === 200 ? 'local destination HTTP 200; runtime pending' : `failed: HTTP ${target.status}`;
            if (target.status !== 200) addFailure(route.path, 'link-status', `${label} → ${destination}: ${target.status}`);
            if (url.hash) {
              const id = decodeURIComponent(url.hash.slice(1));
              const found = target.nodes.some((n) => n.attrs.id === id);
              row.fragmentFound = found;
              if (!found) addFailure(route.path, 'fragment', `${destination} has no matching id`);
            }
            const intended = vehicleRoutes.find((v) => clean(v.label) === label);
            if (intended && url.pathname !== intended.path) addFailure(route.path, 'vehicle-link-meaning', `${label} points to ${url.pathname}, expected ${intended.path}`);
          } catch (error) { row.coverage = 'failed: local fetch'; addFailure(route.path, 'link-fetch', `${destination}: ${error.message}`); }
        }
      }
    }
    actions.push(row);
  }
  for (const node of page.nodes.filter((n) => ['img', 'source'].includes(n.tag))) {
    const sourceSet = (node.attrs.srcset || '').split(',').map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
    for (const src of [...new Set([node.attrs.src, ...sourceSet].filter(Boolean))]) {
      if (!resources.has(src)) resources.set(src, { source: src, pages: [], coverage: 'pending' });
      resources.get(src).pages.push(route.path);
    }
    if (node.tag === 'img' && !Object.hasOwn(node.attrs, 'alt')) addFailure(route.path, 'image-alt', node.attrs.src || 'Missing source');
  }
}

for (const resource of resources.values()) {
  const url = new URL(resource.source, base);
  if (url.origin !== base.origin) { resource.coverage = 'external image recorded; not requested'; continue; }
  try {
    const result = await request(url, 'HEAD');
    resource.status = result.status; resource.contentType = result.headers['content-type'];
    resource.coverage = result.status === 200 && /^image\//.test(resource.contentType || '') ? 'local image exists with image content type' : 'failed';
    if (resource.coverage === 'failed') addFailure(resource.source, 'image-resource', `HTTP ${result.status}, ${resource.contentType}`);
  } catch (error) { resource.coverage = 'failed'; addFailure(resource.source, 'image-fetch', error.message); }
}

const unknown = await fetchPage('/route-audit-deliberately-missing');
if (unknown.status !== 404) addFailure('/route-audit-deliberately-missing', '404', `Expected 404; got ${unknown.status}`);
const staticActions = [];
async function walk(folder) {
  const out = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...await walk(path.join(folder, entry.name)));
    else if (/\.jsx$/.test(entry.name)) out.push(path.join(folder, entry.name));
  }
  return out;
}
for (const file of await walk(path.join(root, 'src'))) {
  const source = await readFile(file, 'utf8');
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) for (const match of lines[i].matchAll(/\b(onClick|onChange|onSubmit|onCancel|onKeyDown|href|download|action)\s*=\s*(\{[^}]{0,220}\}|"[^"]*"|'[^']*')/g)) {
    staticActions.push({ sourceFile: path.relative(root, file), line: i + 1, attribute: match[1], expression: match[2], scope: file.includes('/builder/') ? 'builder' : /inquiry|quote|confirm/i.test(file) ? 'inquiry' : 'shared/content', coverage: 'runtime pending; static inventory only; expressions may be abbreviated' });
  }
}
const titleGroups = new Map();
for (const route of routes) { if (!titleGroups.has(route.title)) titleGroups.set(route.title, []); titleGroups.get(route.title).push(route.path); }
for (const [title, paths] of titleGroups) if (paths.length > 1) warnings.push({ check: 'duplicate-title', title, paths });
const contextLimit = 'Query fields are recorded from destinations; runtime propagation, storage and submission are not proven by HTTP inspection.';
await mkdir(output, { recursive: true });
const summary = { routes: routes.length, expectedRoutes: inventory.length, linkAndControlInstances: actions.length, staticActionExpressions: staticActions.length, uniqueImages: resources.size, failures: failures.length, warnings: warnings.length };
await writeFile(path.join(output, 'route-audit.json'), JSON.stringify({ generatedAt: new Date().toISOString(), startedAt: started, baseUrl: base.href, method: 'Node HTTP GET/HEAD against local server-rendered HTML; no browser, no production writes or external requests', summary, failures, warnings, routes, images: [...resources.values()], notFoundStatus: unknown.status, limitations: [contextLimit, 'JavaScript interactions, browser focus, responsive layout, downloads and form submission are not exercised.', 'Source inventory records dynamic handlers without certifying runtime behavior.', 'External store, policies, phone, email and map destinations are listed but not requested.'] }, null, 2) + '\n');
await writeFile(path.join(output, 'route-action-registry.json'), JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: base.href, method: 'SSR action inventory plus static JSX handler inventory', contextLimit, actions, dynamicActions: staticActions, externalHandoffs: [...new Set(actions.filter((a) => a.coverage.includes('external') || a.coverage.includes('intentional live')).map((a) => a.destination))] }, null, 2) + '\n');
console.log(JSON.stringify({ ...summary, outputs: ['evidence/route-audit.json', 'evidence/route-action-registry.json'] }));
for (const failure of failures.slice(0, 12)) console.log(`${failure.check}: ${failure.source}: ${failure.detail}`);
if (failures.length > 12) console.log(`${failures.length - 12} additional findings recorded in route-audit.json`);
process.exitCode = failures.length ? 1 : 0;
