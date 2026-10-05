# Rebuild verification

Updated October 5, 2026. Original Node preview: `http://127.0.0.1:4173`. Hosted Worker preview: `http://127.0.0.1:4174`.

## Service-specific card refinement

All eleven installation services now have individual hover/focus signatures, with stationary cards and clear color feedback when motion is paused. Chromium checks exercised every service through the keyboard, actual Lighting pointer hover, the detailing wipe completion, pause/resume, all three categories at 320, 390 and 1280 CSS pixels, and the Lighting destination with its retained inquiry context. Every checked layout fit without horizontal overflow. The existing 27 tests passed; the final publication workflow also runs them before building. Full mapping and evidence: [service signatures](evidence/service-signatures.md).

## Tire-track and chrome refinement

The earlier October 5 action treatment uses brighter twin tire lines that remain visible during hover/focus and recurring chrome emphasis on quote actions. Its shared service-card pass is superseded by the individual signatures above. The 27 existing tests passed. Chromium checks exercised actual pointer hover, keyboard focus, fixed button geometry, manual pause/resume, offscreen idle state, a 390-pixel layout and the hero-to-inquiry action. Decorative layers do not intercept input. Details and component provenance: [action motion polish](evidence/action-motion-polish.md).

## GitHub and ChatGPT Site publication candidate

The complete existing experience is preserved in a Cloudflare Workers-compatible build. The original 24 tests plus three hosted receipt tests pass: **27 passed, zero failed**. The hosted tests execute the generated schema in SQLite and check anonymous persistence, token-gated status, personal-field exclusion, concurrent idempotency, conflicting retries, cross-origin rejection and storage-failure behavior. Production dependencies have zero reported audit vulnerabilities.

The route audit against the actual local Worker returned **49 routes, 2,256 rendered links/controls, 157 action expressions and 87 image URLs, with zero failures or warnings**. Current output is in `evidence/route-audit.json`. No animation or layout code was removed in the hosting adaptation.

The local Worker was also exercised in Chromium: motion pause/resume, Side storage selection, the matching Super Ute/storage inquiry context, a fictional preview request reaching a server-verified receipt, and Ford Super Duty / 8 ft progression into the configurator's setup stage. Browser WebMCP retrieved that same anonymous saved configuration with pricing and fitment pending review. The inspected browser logs had no errors. The homepage's full photo hero, fonts, orange treatment and navigation rendered correctly.

This establishes the hosted build and local runtime behavior. Successful Sites deployment status and a verified GitHub source push establish publication separately. The existing responsive checks below remain historical evidence for the unchanged visual components. No live HubSpot inquiry was submitted in these checks; Shopify commerce remains on the existing store. See `evidence/publication-preparation.md`.

## Current next-level revision

The October 4 local revision includes the Super Ute feature explorer, four source-backed project/setup stories, eleven improved service detail pages, an optional native HubSpot form journey, and branded sharing metadata. The following describes that revision before the October 5 publication preparation. It is not an installed Shopify theme or evidence of successful live lead delivery.

The final full suite has 24 passing tests, including seven integration/SEO checks. Client and server production bundles built successfully. The final route audit covers 49 routes, 2,256 rendered link/control instances, 157 static action expressions and 87 image URLs, with no failures or warnings. Evidence is retained in `evidence/route-audit.json`. Client JavaScript is 428.07 kB / 125.30 kB gzip; CSS is 171.00 kB / 32.39 kB gzip. The production server was restarted after building to avoid serving a cached older SSR module with new client assets.

Rendered checks and exercised interactions:

- Six representative routes—home, flatbeds, our work, Dillon’s lift, Alaskan camper setup and Super Ute—passed 24 layout checks at 320, 390, 768 and 1440 CSS pixels. Actual viewport widths were checked. Each had one H1, no horizontal overflow, no broken loaded images and no hero actions outside the hero. Data: `evidence/next-level-layout-checks.json`.
- All eleven service detail pages passed 22 rendered checks at 390 and 1440 pixels. These inspected service preselection, page-specific quote context, scope content, one H1 and overflow. Data: `evidence/flagship-service-layout-checks.json`.
- After the fourth story was added, Ranger, our work and home passed twelve more actual-width layout checks at 320, 390, 768 and 1440 pixels. These confirmed one H1, no overflow, no broken loaded images and the four-card project collection. The Ranger inquiry visibly retained “Inspired by Ford Ranger flatbed setup.” Data: `evidence/ranger-final-layout-checks.json`.
- The explorer’s tabs changed the active feature and matching inquiry URL; ArrowRight moved selection and focus. Photo enlargement opened a native dialog; Escape closed it and restored focus. Mobile feature selection also worked. Manual pause stopped the inspected explorer image/copy animation.
- The Super Ute film dialog loaded the intended Adventure Built YouTube player. Closing removed the iframe and restored focus. Sustained playback was not established, so the evidence confirms the player load and dialog behavior only.
- Native HubSpot forms rendered in Chromium without submitting them. The actual `TICKET.content` field contained the intended project/feature context in the flatbed check and the intended service context in the production suspension check. A regression in resolving the array-like native form callback was fixed and covered by a test. `evidence/native-context-prefill.png` records the successful flatbed prefill.
- The production native service iframe fit a 390-pixel viewport. Returning to the local preview retained the selected service and local draft. No test inquiry was sent to HubSpot, and no live receipt, notification, upload or analytics delivery is claimed.
- Current-bundle checks found no errors in the inspected logs. Earlier stale-bundle hydration errors were resolved by restarting the production preview and are not evidence of a current runtime failure.

The fourth story uses the actual Ford Ranger setup published on Next Jump’s flatbed collection. It is labeled as a photographed setup, with no invented customer, quote or outcome. Its source is retained in `evidence/flagship-sources.json`.

Current screenshots live directly in `evidence/` and use `next-level-`, `flagship-service-` and `native-context-prefill` names. `next-level-native-form-desktop.png` is an earlier form-rendering capture; use `native-context-prefill.png` for successful context-prefill evidence. The following October 3 sections are historical verification, retained to distinguish prior work from this revision.

## October 3 result

The rebuilt local experience is ready for review. The production bundles compile, all 17 tests pass, and all 46 implemented routes pass the HTML/asset audit. This is not publication approval, certified vehicle fitment, a connected Shopify theme, or verified HubSpot delivery.

## Automated evidence

| Check | Actual result |
| --- | --- |
| `npm test` | 17 passed, 0 failed: seven builder/domain tests and ten validation/local HTTP tests. |
| `npm run build` | Client and server bundles built successfully. Client JavaScript 368.60 kB / 107.95 kB gzip; CSS 130.70 kB / 25.12 kB gzip. |
| `node tests/audit-routes.mjs` against production server | 46 routes, 1,859 rendered link/control instances, 136 static action expressions, 71 unique image URLs; 0 failures, 0 warnings. |
| Routing/metadata | All 19 vehicle paths preserved; unique titles, descriptions, one H1, preview noindex, image targets and internal links checked. Unknown paths return 404. |
| Local API | Real HTTP tests cover contact-channel validation, context-specific fields, invalid dependencies/prices, concurrent retries, separate repeat inquiries, private-path protection, CSRF, size/rate/storage limits and non-personal receipts. |

The route audit inspects server-rendered HTML and source expressions; it does not prove every dynamic interaction. Detailed output is in `evidence/route-audit.json` and `evidence/route-action-registry.json`. The test runner needs permission to listen on loopback in a restricted sandbox.

## Browser evidence

Executed in the Codex in-app Chromium browser. The interactive checks below used the integrated implementation; the final production build was then checked across the representative pages listed below.

- Homepage: visually inspected desktop and mobile. No horizontal overflow at 320, 360, 390, 768, 1024 and 1440 CSS pixels. Mobile menu opens, Escape closes it and returns focus.
- Builder: Tacoma 6.1 ft vehicle page preselects the correct model/bed. Entered 2022, selected overland use, added the kitchen through the explicit boxes-plus-kitchen confirmation, removed both through confirmation, and restored both with Undo.
- Builder persistence: a later navigation restored 2022 Toyota Tacoma, 6.1 ft bed, overland use, boxes and kitchen. Explicit Save succeeded. Back/Forward moved correctly between Review and Options.
- Builder mobile summary: opened and read the selected components, pending pricing and fitment; Escape closed the dialog. No horizontal overflow at 320, 390, 768, 1024 and 1440 pixels.
- Download: clicked the actual control and inspected the resulting `next-jump-build (1).json` in Downloads. It contains only version, truck, use, camper type and selected component IDs, matching the reviewed build. The browser tool's download-event wait timed out even though the file downloaded; filesystem evidence confirmed the result.
- Builder-to-inquiry handoff: the inquiry displayed the same truck and components and derived the overland use. Contact inputs were blank.
- Service inquiry: boat-detail entry selected Boat detailing and requested vessel details instead of truck details. Empty submission produced focused, field-specific errors. A fictional local test using the phone channel reached a verified receipt and explicitly stated that nothing was sent to Next Jump. A separate tab visiting confirmation without a receipt showed no submitted request.
- Gallery: selected photo 2, opened the full-size dialog, used ArrowRight to reach photo 3, toggled zoom, and closed with Escape; focus returned to the opener.
- Production smoke check: flatbeds, camper, work/business, installation services, general inquiry and contact rendered at 390 and 1280 pixels with no horizontal overflow or broken loaded images. No warnings or errors appeared in the inspected browser logs.

Screenshots are in `evidence/screenshots/`: homepage desktop/mobile, flatbeds desktop and builder desktop. The desktop builder capture represents the options stage after navigation, with the page scrolled to the active task.

## Visual redesign verification

The orange-led visual redesign was implemented and checked October 3, 2026. `npm test`, `npm run build` and the 46-route production audit above were rerun after the final visual edits. The production preview was restarted with those final bundles.

- Reviewed the actual source of Momentos Media, Creative Collective and 120VC, plus the supplied component library. Mechanism/adaptation records are in `evidence/visual-redesign.md` and `evidence/reference-design-study.md`.
- Rendered the full-bleed hero, shaped destination cards, layered platform photograph, perspective photo gallery and interior-page hero. Replaced the prior gallery video screenshot with an actual source-verified Super Ute workshop photograph.
- Homepage: no horizontal overflow at 320, 360, 390, 768, 1024 and 1440 CSS pixels. Flatbeds, camper, installation services, initial builder and general inquiry were also inspected at 320, 390, 768 and 1440 pixels with no horizontal overflow or broken loaded images.
- Gallery: previous/next changes the selected photo, counter and caption. Clicking the selected image opens the full-size dialog. ArrowRight changes photos; Escape closes and returns focus to the opener. The final production build was exercised at 390 pixels; the dialog remained within the viewport.
- Manual motion pause: clears pending reveals and stops hero animation/parallax; the preference survives page navigation and reload. Builder and interior-page motion rules honor the same setting. OS reduced-motion is supported in code/CSS; the actual system preference was not toggled during QA.
- Builder: the stored Tacoma configuration and selected components were retained. Options view and its photo-detail dialog were inspected at desktop and mobile sizes. Escape returned focus to the opening button.
- Mobile menu: at 320 pixels, opened without overflow, used 18px link text, and closed on Escape with focus returned to the menu button.
- Final production homepage, flatbeds, builder options and gallery were inspected in Chromium. No warning/error logs appeared in the inspected tab.

Current redesign screenshots are prefixed `redesign-` in `evidence/screenshots/`; earlier filenames document the previous pass. The main redesign uses React state and native CSS/scroll observers, with no added animation or WebGL dependencies. These checks establish the local preview behavior, not cross-browser certification or publication readiness.

## Product, proof and inquiry revision

The October 3 follow-up revision supersedes the prior visual screenshots. Final bundles compile, the same 17 behavioral/API tests pass, and the final production route audit reports 46 routes, 1,859 link/control instances, 136 static action expressions, 71 unique image URLs and no failures or warnings.

- Rendered full-photo homepage and installation heroes on desktop and mobile; widened and rounded the secondary image treatment. Fixed a mobile hero inset found in the screenshot review.
- Checked homepage, installation hub, flatbeds, campers, suspension detail and initial builder at 320, 390, 768 and 1440 CSS pixels. No horizontal overflow, broken loaded images or hero actions extending outside the hero.
- Measured actual scroll behavior: installation hero copy moved upward by approximately 38px while its image moved downward by approximately 55px at the observed scroll position. Product-story media and copy also changed independently with section progress.
- Pausing motion stopped all new hero/story transforms and cleared pending reveals. Device reduced motion remains implemented; the system preference itself was not toggled.
- Installation tabs: click selected Camping; ArrowRight moved selection and focus to Care. Each selection displayed the matching photograph and service links.
- FAQ: category arrow-key operation and native question disclosure both worked on mobile.
- Mobile menu: Get a Quote closed the menu and navigated to the inline inquiry anchor.
- Homepage inquiry: hero quote action navigated to the inline form. Empty submission showed field errors and focused an invalid field. A fictional complete test reached a server-verified local receipt with explicit no-delivery status.
- Existing builder selection, pricing/fitment rules, and gallery behavior are retained. This revision changes presentation and entry paths, not the server submission contract.

Current screenshots are prefixed `journey-`. Review excerpts are attributed and traceable in `evidence/customer-proof.json`. Only local Chromium behavior was exercised; this is not cross-browser or live conversion certification.

## Character, proof and founder revision

The latest October 3 polish retains the accepted full-photo direction. Build and 17 tests pass. The final production audit reports 46 routes, 1,908 links/controls, 139 action expressions, 78 image URLs and zero failures/warnings.

- Six representative routes at 320, 390, 768 and 1440 pixels passed 24 layout checks. Data: `evidence/character-layout-checks.json`.
- Verified actual CTA hover color/sweep with no outer-button movement, larger service destinations, keyboard/mobile review disclosure, corrected expanded-card contrast, and visible/offscreen/manual-pause ambient motion.
- Added a source-verified J. Scott portrait, founder story, actual workshop images and the official favicon/touch icon. Both icon endpoints return valid PNGs with HTTP 200.
- Verified current Google reviews and replaced the universal three-review block with contextual selections. Removed Paul Robertson's stale positive excerpt after finding his current edited review conflicts with it.
- No browser warnings/errors appeared in the inspected tab. Existing inquiry and builder contracts were not changed. Device reduced-motion support is implemented; the OS preference was not toggled.

Details and component provenance: `evidence/character-polish.md`. Latest screenshots use the `character-` prefix.

## Current limits and launch work

Browser checks used Chromium in the Codex browser and Chrome with viewport emulation. This is not cross-browser, physical-device, WCAG or Core Web Vitals certification. Reduced-motion behavior is supported in CSS and manual pause was exercised, but the system preference was not toggled during browser QA. Local API error/retry semantics are verified by HTTP tests; a simulated offline browser journey was not run.

No live commerce, consultation payment, booking, file upload, email, marketing subscription, CRM submission or conversion event was executed by an agent. The optional native HubSpot form can send a real inquiry when a visitor submits it; default local receipts remain separate and explicitly say nothing was sent. External retail, policy, phone and email links remain visible user actions. All pages remain non-indexable, and `sitemap.xml` remains empty until deployed paths are approved for indexing.

Before launch, complete `evidence/release-checklist.md`: approve commercial/fitment records, copy and asset rights; adapt the candidate into the actual unpublished Shopify theme; finalize the longer native intake requirements; verify a controlled real inquiry, record routing, consent, upload behavior and confirmed-lead event; verify the deployed target and rollback. Portal and form IDs have been read and mapped, but Shopify access and operational delivery verification remain separate. The forms contract is documented in `evidence/forms-manifest.json`, `evidence/field-dictionary.md` and `evidence/launch-integration.md`.
