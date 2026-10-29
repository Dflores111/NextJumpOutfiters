# NJO 5.0 marketing and customer-journey handoff

Prepared October 18–19, 2026. Ready for local review and coordinated integration; not published.

## Integration target

- Branch: `codex/njo-5-marketing`.
- Worktree: `/Users/diegoflores/Documents/Next Jump/next-jump-njo5`.
- Base: `590affcfb1667621a4c886cc61a955570172b241`.
- The active checkout at `../next-jump-published` was clean and remained untouched. GitHub's latest commit and Sites version 14 were checked against the base during this run. Terminal fetch was unavailable because of DNS; connector reads supplied the remote checks.
- Local review: <http://127.0.0.1:4186/>. Start with `PORT=4186 npm run dev` from this worktree if needed. This checkout currently reuses the existing checkout's `node_modules` through an untracked local symlink. A fresh clone should install from the unchanged lockfile.
- Use this branch's final commit as the marketing change set. The builder/backend integration owner should apply it to their current integration branch, resolving shared files against their latest work. Do not publish this worktree as a competing snapshot.
- No merge, push, deployment, real lead submission, package publication, inventory update or production-data connection was performed.

## Five improvements and the decisions they help

| Improvement | Customer decision | Implemented result |
| --- | --- | --- |
| Clear offer and three starting paths | Do I need one upgrade, a flatbed/camper, or a complete build? | Preferred homepage hero, three photo paths and focused top navigation. Existing vehicle imagery, palette, type and motion remain. |
| Installation-first service journey | Can I get this specific job done without committing to a full build? | Refreshed hub, five core service pages plus tent/camper pages, service-specific quote actions, optional future-work section and relevant proof. |
| Five-stage flatbed story | What can I start with now, and what might I add later? | A readable five-stage sequence, fitment disclosures and goal links into the existing builder. Super Ute explorer remains on the flatbed journey and project story. |
| The larger NJO relationship, with limits | Can this crew help with the whole truck and later trips? | Complete Builds, Why NJO, paid Trip Prep & Care, and Trips & Community pages. About and Our Work retain actual people, projects and evidence labels. |
| Context and honest next steps | What am I requesting, and has anything actually been sent or booked? | Contextual form headings, editable request type, retained builder summary, preview-only results, explicit live-form choice for existing supported contexts, and phone alternatives. |

## Pass status

1. **Customer journey and revenue paths — implemented.** Homepage, navigation, service hub/details, CTA context, preview copy and removal of marine/trailer promotions from primary navigation and service discovery. Legacy URLs remain available.
2. **The bigger NJO story — implemented within verified content.** Four new information pages, flatbed stages, About/Our Work improvements, curated proof and optional paid-care paths.
3. **Quality and reporting specification — completed. Builder UI refinement — reserved for the builder owner.** The supplied kickoff expressly excludes builder logic/UI, APIs, CRM and analytics changes. Existing vehicle-first steps, use-prefill links, compatible selection rules, browser draft and quote summary were exercised without rewriting them.

## Review paths

| Page | Local preview |
| --- | --- |
| Home | <http://127.0.0.1:4186/> |
| Installation Services | <http://127.0.0.1:4186/pages/overland-off-road-installation-services-tacoma-wa> |
| Flatbeds & Campers | <http://127.0.0.1:4186/pages/overland-aluminum-flatbed-truck-bodies> |
| Complete Builds — new | <http://127.0.0.1:4186/pages/complete-expedition-truck-builds> |
| Why NJO — new | <http://127.0.0.1:4186/pages/why-njo> |
| Trip Prep & Care — new | <http://127.0.0.1:4186/pages/trip-prep-and-care> |
| Trips & Community — new | <http://127.0.0.1:4186/pages/trips-and-community> |
| About | <http://127.0.0.1:4186/pages/about-us> |
| Our Work | <http://127.0.0.1:4186/pages/our-work> |
| Complete-build inquiry preview | <http://127.0.0.1:4186/pages/book-install-services-or-get-a-quote?context=general&interest=complete-build> |

## Source and copy decisions

Primary direction: the complete project kickoff at `/Users/diegoflores/Documents/Next Jump/handoffs/website-copy-and-journey-kickoff.md`, the supplied `NJO_5_0_Mockup_Upgrade_Codex_Prompt.md`, pasted strategy notes and customer-journey diagrams. Repository release/QA records and current rendered pages established the implementation boundaries. The UI/UX Pro Max and website-component-prompts skills informed keyboard, focus, disclosure and component choices; no demo library or new dependency was introduced.

The preferred homepage headline/intro/signature, three starting-path titles and descriptions, principal service headlines and CTAs, flatbed headline, new-page headlines, key story paragraphs, FAQs, form headings, preview notice/button and validation wording were used as supplied. See `src/marketing-content.js`, `src/Marketing.jsx`, `src/HomeExperience.jsx` and `src/content.json` for the actual copy.

Deliberate factual limits:

- Reviews remain existing curated excerpts from `src/customerProof.js` and `evidence/customer-proof.json`, not a live feed. Super Ute is labeled a collaboration, and the Alaskan camper remains a setup example. No new customer quote, rating or result was invented.
- Founder biography, founder quote, real workshop photography and existing project stories remain. Unlabeled technicians were not given names.
- Build-record language asks the crew about documentation or describes a process being developed; it does not promise a completed customer portal or comprehensive recorded vehicle history.
- Flatbed stages 3–5 are inquiry-led. No unverified load capacity, water capacity, waterproof claim, fitment guarantee or changeover time was added. The Ranger photograph is explicitly an example, not an illustration of all five stages.
- Complete-build sourcing is an inquiry through the existing dealership proposition. Financing is something to ask about; no approval, term, rate or bundled-finance promise is made. On-site lodging was omitted because it was not verified.
- Care, itineraries, cleaning and replenishment require availability, scope and price confirmation. Memberships have no price, tier or enrollment. No trip date or RSVP is invented. Warranties remain separate from paid care.
- No full project filter was added to the four-story collection. Homepage and complete-build pages show three relevant stories; Our Work retains all four.
- New recovery, paint-protection and Rhino-lining interests lead to a clearly labeled inquiry preview. They do not invent a detailed service specification or mapped production form.
- Existing Shopify retail/policy destinations and preview `noindex,nofollow` remain. No route was redirected to the homepage.

## Shared-file integration notes

New presentation modules: `Marketing.jsx`, `MarketingNav.jsx`, `FlatbedStages.jsx`, `marketing-content.js`, `njo5.css`.

Shared files to review carefully against concurrent work:

- `App.jsx`: marketing routes/imports, menu rendering, footer and context-aware header quote destination. Builder/staff routing remains.
- `routes.js` and `content.json`: four new public preview pages and updated marketing metadata/copy. Existing route identities and inquiry helper remain.
- `Inquiry.jsx`: visible headings, path selector, optional new-interest truck field, allowlisted interest presentation, existing-service visibility, preview language and live-form gating. Existing validation, API payload contract, token handling, receipt verification, saved-build and package integrations remain.
- `Journey.jsx`, `Pages.jsx`, `ServiceDetail.jsx`: existing components reused for service presentation. `BuildStories.jsx`, `Story.jsx`, `HomeExperience.jsx`: proof and storytelling composition.

No changes were made to `src/builder/`, `src/catalog/`, `src/NativeInquiry.jsx`, inquiry/HubSpot contracts, server/Worker, schema/migrations, staff/authentication, inventory, package pricing, analytics, dependencies or hosting configuration. The previous flatbed component remains in `Pages.jsx` as unused code; `App.jsx` renders `FlatbedJourney` at the existing flatbed URL.

## Builder/backend owner: bounded follow-up

1. Review the optional goal-first entry and progressive disclosure in pass 3 of the supplied prompt. This branch uses existing builder query support: `?use=work`, `?use=overland`, `?use=camper&camperType=flatbed`, and `?step=1`. Preserve vehicle selection, compatibility gates, the ability to edit and resume, and the reviewed-price boundary. There are no new builder modes or approved package rules in this change set.
2. Approve a durable intent field before connecting new journeys to production. Current `interest` values are presentation-only: `complete-build`, `trip-care`, `trips`, `membership`, `dealer`, `paint-protection`, `rhino-lining`, `recovery`. They use the existing `general` preview context with an existing supported topic. The new interest itself is **not persisted in the receipt or mapped to HubSpot**. The page makes no promise that it was. New interests offer a call link and do not expose a pretend mapped live form.
3. Decide the approved HubSpot form/property mapping, source-page capture, consent, retention, attribution and follow-up routing. Existing supported live forms still require the visitor's explicit choice; nothing here expands their connections. The supplied brief proposes Andrew for website/form implementation, Diego for data/measurement QA and Nick for follow-up after routing approval; these are requirements to confirm, not automation already in place.
4. Keep draft packages, manual supplier availability and counted inventory separate. A configuration or saved estimate must continue to create neither a booking, order, reservation nor stock movement.

## Event specification — not implemented analytics

| Proposed event | Real trigger / boundary |
| --- | --- |
| `service_page_view` | Viewed supported service detail, with known service and source path. |
| `quote_start` | Intentional quote action or first form interaction; choose one definition and deduplicate. |
| `quote_submit_confirmed` | Approved live provider confirms receipt. Never a preview save or confirmation-page visit. |
| `phone_click` | User activates a `tel:` link; does not prove a connected call. |
| `builder_start`, `builder_vehicle_selected`, `builder_use_selected`, `builder_review_viewed`, `builder_quote_start` | Meaningful builder transitions, using its validated configuration. Owner implements and deduplicates. |
| `complete_build_inquiry_start` | User intentionally starts the complete-build inquiry. |
| `trip_interest`, `care_interest` | User intentionally requests that topic; no inferred interest from an incidental page view. |

Production requirements: preserve source page, actual service/build intent, vehicle and readable selections; retain known UTM source/medium/campaign/content/term and applicable click IDs with consent-aware handling. Do not infer referral source. HubSpot should identify actual captured leads. Qualification, quote, booking, delivery, revenue and margin must come from approved sales outcomes, not form submission alone. Audience-building and conversion feedback are separate work. No event collection or CRM routing was added here.

## Validation and evidence

- Final `npm test`: **94 passed, 0 failed**. Tests needed localhost permission; the sandbox-only attempt could not bind its test servers and was rerun successfully with local access.
- Final `npm run build`: client and hosted Worker builds passed. Vite reports the main client chunk at 510.13 kB / 150.71 kB gzip, slightly above its 500 kB warning threshold. No performance score is claimed; broad bundle splitting was not mixed into this copy pass.
- Final route audit: **53/53 routes**, **3,556 link/control instances**, **399 static action expressions**, **84 image URLs**, **0 failures / 0 warnings**. The original release audit files are preserved; this run is stored under `evidence/njo5/`.
- Browser responsive sweep: **21 paths × 5 widths** (360, 390, 768, 1024, 1440), 105 observations. No horizontal overflow, missing H1 or failed loaded image found. About/Our Work mobile overflow was repaired. This is Chromium viewport QA, not physical iOS/Android certification.
- Local compiled Worker smoke check on a separate port: nine key routes, expected titles/H1s and preview robots rules; **no console errors or warnings** observed. Production was not deployed. Two hydration errors were observed on the already-hosted baseline during initial inspection; they did not reproduce in this local compiled smoke check and are not declared fixed in production.
- Keyboard: desktop/mobile submenu Escape and focus return; service tab Home/End; Super Ute tab ArrowRight and photo dialog Escape/focus recovery. Manual motion pause persisted across navigation. Existing OS reduced-motion CSS/hook support was preserved; OS-level preference emulation was not exercised in this run.
- Final `git diff --check`: passed. No operational source directory changes; original checkout remained clean.

| Required flow | Browser result |
| --- | --- |
| Installation | Hub → lift service → suspension-specific preview. Empty form exposes errors and focuses the first invalid field. Fictional phone inquiry reaches a verified receipt explicitly saying no request was sent. No full-build questionnaire is required. |
| Flatbed | Relevant hub → five stages/disclosures → work goal → existing builder with Work & hauling preselected. Camper and work information paths remain. |
| Complete build | Page explains owned/sourced truck and staged/full build → complete-build preview heading. Changing to care retains typed name/message. Fictional email preview reaches truthful receipt. |
| Pit-crew story | Why NJO states installations/flatbeds/complete builds in the first viewport, with direct service/build actions and three starting paths immediately below. Mobile menu and related care path work. |
| Paid care | Paid/availability/warranty distinction → care-specific preview. No membership purchase, invented dates or free-service promise. |
| Builder to quote | Toyota → Tacoma → 6.1 ft → 2022 → Work & hauling → tools/cargo equipment + kitchen → review → browser draft → quote. The readable truck, use and equipment summary persists; Review saved build restores selections. |

Only fictional local QA inputs were used. No live form was submitted, and the local preview store does not retain contact details or message text. Existing regression tests cover preview privacy and storage boundaries.

Evidence: `evidence/njo5/test-results.txt`, `build-output.txt`, `route-audit.json`, `route-action-registry.json`, `layout-checks.json`, `compiled-browser-checks.json`, `browser-qa.json`, plus desktop/mobile JPEG captures. The screenshots show this local branch, not a published release.

## Outstanding approvals and limits

Business review still needs to confirm the commercial availability and specification of the tray/shell/interior stages; approved package prices and fitment; financing and warranty wording; trip/care scope, prices and schedules; and future membership rules. Real stage-specific product photography would improve the flatbed sequence; the current genuine setup photo is labeled accurately. Production mapping for the new intents and the optional builder UI work remain with the other owner. Publication requires coordinated integration and a new verification of the combined branch.
