export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function validateRelease(config) {
  let origin;
  try { origin = new URL(config.publicOrigin); } catch { throw new Error('A valid public origin is required.'); }
  if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('The public origin must be an HTTPS origin with no path or credentials.');
  if (!Array.isArray(config.indexablePaths) || config.indexablePaths.some(path => typeof path !== 'string' || !/^\/(?:[a-z0-9/-]*)$/.test(path) || path.includes('//'))) throw new Error('Indexable paths must be explicit clean route paths.');
  if (!/^\/images\/[a-zA-Z0-9._/-]+\.(?:jpg|jpeg|png|webp)$/.test(config.socialImage || '') || config.socialImage.includes('..')) throw new Error('A local social image is required.');
  return { ...config, publicOrigin: origin.origin };
}
export function isIndexable(path, { known, privatePage = false }, config) {
  return config.indexingEnabled === true && known === true && !privatePage && config.indexablePaths.includes(path);
}
export function buildSeoHead({ path, title, description, known, privatePage = false, schema }, configuration) {
  const config = validateRelease(configuration);
  const canonical = `${config.publicOrigin}${path}`;
  const robots = isIndexable(path, { known, privatePage }, config) ? 'index,follow,max-image-preview:large' : 'noindex,nofollow';
  const image = `${config.publicOrigin}${config.socialImage}`;
  const publicTags = known && !privatePage ? `<link rel="canonical" href="${escapeHtml(canonical)}"/><meta property="og:url" content="${escapeHtml(canonical)}"/>` : '';
  const head = `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"/><meta name="robots" content="${robots}"/>${publicTags}<meta property="og:site_name" content="Next Jump Outfitters"/><meta property="og:title" content="${escapeHtml(title)}"/><meta property="og:description" content="${escapeHtml(description)}"/><meta property="og:type" content="website"/><meta property="og:locale" content="en_US"/><meta property="og:image" content="${escapeHtml(image)}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="${escapeHtml(config.socialImageAlt)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escapeHtml(title)}"/><meta name="twitter:description" content="${escapeHtml(description)}"/><meta name="twitter:image" content="${escapeHtml(image)}"/><meta name="twitter:image:alt" content="${escapeHtml(config.socialImageAlt)}"/>${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}`;
  return { head, robots };
}
export function buildSeoResources(routes, configuration) {
  const config = validateRelease(configuration);
  const paths = [...new Set(routes.filter(route => isIndexable(route.path, { known: true, privatePage: route.privatePage }, config)).map(route => route.path))];
  const robots = config.indexingEnabled === true && paths.length ? `User-agent: *\nAllow: /\nSitemap: ${config.publicOrigin}/sitemap.xml\n` : 'User-agent: *\nAllow: /\n# Unpublished preview: page responses return noindex, nofollow.\n';
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escapeHtml(config.publicOrigin + path)}</loc></url>`).join('')}</urlset>`;
  return { robots, sitemap };
}
