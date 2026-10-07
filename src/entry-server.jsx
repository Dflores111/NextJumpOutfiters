import React from 'react';
import { renderToString } from 'react-dom/server.browser';
import App from './App.jsx';
import { pages, P } from './routes.js';
import { vehicleRoutes } from './builder/domain.js';
import { siteRelease } from './site-release.js';
import { buildSeoHead, buildSeoResources } from './seo.js';

const privatePaths = [P.quote, P.confirmation, P.packages];
const origin = siteRelease.publicOrigin;
const business = { '@context': 'https://schema.org', '@type': 'AutomotiveBusiness', name: 'Next Jump Outfitters', url: origin, image: origin + siteRelease.socialImage, telephone: '+1-253-301-0028', email: 'theteam@nextjumpoutfitters.com', address: { '@type': 'PostalAddress', streetAddress: '3721 S Lawrence St', addressLocality: 'Tacoma', addressRegion: 'WA', postalCode: '98409', addressCountry: 'US' }, openingHours: ['Mo-Fr 08:00-17:00'] };

export function metadata(url) {
  const path = new URL(url, 'http://localhost').pathname.replace(/\/$/, '') || '/';
  const vehicle = vehicleRoutes.find(page => page.path === path);
  const page = pages.find(page => page.path === path);
  const known = !!(page || vehicle || path === P.sitemap || path === '/staff');
  const title = path==='/staff'?'Product Master | Next Jump Staff':path===P.builder?'Plan Your Truck Build | Next Jump Outfitters':vehicle ? `${vehicle.label} Flatbed Planner | Next Jump` : path === P.sitemap ? 'Website Sitemap | Next Jump Outfitters' : page?.title || 'Page not found | Next Jump Outfitters';
  const description = path===P.builder?'Plan a flatbed or vehicle upgrades in four simple steps. Choose a starting direction, adjust priorities and save your plan for a fitment and quote conversation.':vehicle ? `Plan a flatbed configuration for your ${vehicle.label}. Explore storage and equipment, with final fitment and pricing reviewed by the Tacoma team.` : page?.description || 'Find your next build with Next Jump Outfitters in Tacoma.';
  const privatePage = privatePaths.includes(path) || path === '/staff';
  const schema = path === '/' || path === P.contact ? business : known && !privatePage ? { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: origin }, { '@type': 'ListItem', position: 2, name: vehicle?.label || page?.label || 'Sitemap', item: origin + path }] } : null;
  return { status: known ? 200 : 404, ...buildSeoHead({ path, title, description, known, privatePage, schema }, siteRelease) };
}
export function seoResources() {
  return buildSeoResources([...pages, ...vehicleRoutes].map(page => ({ path: page.path, privatePage: privatePaths.includes(page.path) })), siteRelease);
}
export function render(url) { return { ...metadata(url), html: renderToString(<App url={url} />) }; }
