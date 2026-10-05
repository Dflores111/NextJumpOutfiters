# Next Jump website rebuild

The complete flatbed-first website rebuild, prepared for GitHub and a public ChatGPT Site. It includes the accepted photography, motion, hover effects, responsive layouts, all 49 routes, truck explorer, galleries and configurator. It preserves the existing Shopify page paths and keeps retail/policy links on the live store. An optional native HubSpot form can send a real inquiry when a visitor explicitly chooses and submits it. This project is not a Shopify theme export or a replacement for the live Shopify storefront.

Repository: https://github.com/Dflores111/NextJumpOutfiters

Shareable Site: https://next-jump-outfitters.diegoafmejia111.chatgpt.site

Read [publication preparation and verification](evidence/publication-preparation.md) for the hosted adaptation and its boundaries. Earlier evidence documents the development history.

## Run

Use Node 22.13 or newer and npm; Node 24 is recommended.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. The server binds only to this computer.

```sh
npm test
npm run build
npm start
```

Stop the development server before starting the production server on the same port. Restart the production server after rebuilding: it caches the server-rendering module, so leaving an old process running can mix old HTML with new client bundles. `PORT=4174 npm start` runs a separate production preview if needed.

### Hosted runtime preview

`npm run build` produces both the browser bundle and a Cloudflare Workers-compatible server. The same React components and CSS run in both previews.

```sh
npm run build
npx wrangler d1 migrations apply next-jump-preview --local --config dist/server/wrangler.json
npm run start:hosted
```

Open http://127.0.0.1:4174. The local Worker database is disposable development data; rebuilding clears the generated server directory. Hosted preview receipts use the Site's persistent D1 database. Generate schema changes with `npm run db:generate` and inspect the generated SQL before publishing. The runtime never creates tables.

`npm run build:local` retains the original browser/Node build option. Deployment uses `.openai/hosting.json`, `dist/server/index.js`, `dist/client/` and the checked-in `drizzle/` migrations. Use the Sites publishing workflow to push the exact source commit, package it, save a version and deploy that saved version. Credentials belong in the publishing session, not in this repository.

## What is implemented

- Distinct homepage, flatbed, camper, work/business, services, projects, guide, about and contact pages, plus dedicated installation and setup stories.
- A real-photo Super Ute explorer with numbered feature points, keyboard tabs, a detail dialog and context-preserving inquiry actions.
- Eleven service detail pages with prominent photography, concrete scope, planning requirements, relevant proof, FAQs and preselected inquiries.
- Preserved vehicle page inventory, with route-derived truck context and a four-stage configurator.
- Explicit optional equipment, dependency confirmation, undo, local anonymous saving, and actual JSON download.
- Contextual preview inquiry forms, receipt validation, idempotency and a receipt-only confirmation screen; an explicit switch to six verified existing HubSpot native forms.
- Safe project/feature context in native inquiries, a copy fallback and preserved local drafts when switching back.
- Server-rendered content, branded social metadata/image, an explicit indexing allowlist, true 404s, preview noindex and security headers.
- Responsive images from source-verified Next Jump assets, responsive layouts, native controls, keyboard gallery and reduced-motion support.

## Visual direction

The current design uses cinematic photo heroes, structural orange, larger typography, wide rounded images, contained CTA hover motion, scroll reveals and coordinated image/text movement. The Super Ute explorer puts actual truck features within reach; the build stories and on-demand Adventure Built walkaround add detail before the inquiry. Motion can be paused and honors the device reduced-motion preference. The interior pages and configurator share the same visual language.

Read [the latest implementation and verification record](evidence/next-level-finish.md). Earlier [visual redesign](evidence/visual-redesign.md), [reference study](evidence/reference-design-study.md), [customer journey](evidence/customer-journey-redesign.md) and [character polish](evidence/character-polish.md) records preserve the component, review, founder and favicon provenance. The component library is adapted by interaction mechanism; demo dependencies are not installed wholesale.

## Preview boundary

All configuration prices are unknown pending approved records. Vehicle routes identify existing page labels, not certified fitment. The old prototype's numeric prices and proposed packages are not presented as offers. No payment, booking or marketing delivery is implemented. No conversion analytics service is installed.

Anonymous builds stay in this browser. The default preview form validates contact fields but does not persist them. The local Node API saves a non-personal configuration receipt under the ignored `.preview-data/` directory; the hosted Worker saves the same allowlisted configuration in D1. Names, contact details, free text and marketing choices are discarded. A saved preview receipt is not an inquiry to Next Jump.

**Open the live shop form** is different: it loads Next Jump's existing native HubSpot form, and submitting that form sends a real inquiry. Current native requirements, validation, consent and optional uploads remain HubSpot-managed. Only allowlisted project/build context is copied into an empty description field; personal entries are not silently transferred. Switching back preserves the local draft. Native rendering and context prefill have been checked, but no agent-generated live submission or end-to-end CRM delivery test has been performed. See [inquiry integration](evidence/launch-integration.md).

The sitemap XML is intentionally empty because this review Site has no approved indexable pages. The human sitemap lists the reviewable pages. `src/site-release.js` controls the public origin, sharing image and explicit indexing allowlist. Public sharing and search-engine indexing are separate: the Site remains `noindex` until paths and commercial records are approved.

## Continue toward launch

Read [release checklist](evidence/release-checklist.md), [integration boundaries](evidence/integration-boundaries.md), [media and launch brief](evidence/media-and-launch-brief.md), and [source conflicts](evidence/source-conflicts.md). The next production work is adapting this candidate into the actual unpublished Shopify theme, approving commercial/fitment records and final intake requirements, then verifying deployed inquiry receipt and routing. Read [QA.md](QA.md) for what was actually checked and what remains unverified.

Supplied text is preserved under `evidence/source-text`. The UI uses proposed page copy, with changes for available assets and truthful preview states. Live image source URLs and publication-rights status are listed in `evidence/asset-manifest.json`; prior component-image provenance is preserved in `public/images/sources.json`. Font files were reused from the current storefront's Montserrat URLs.

The original website and builder-prototype projects remain in the local workspace. This repository includes the complete website and hosted adaptation; it does not include unrelated workspace projects or local visitor data.
