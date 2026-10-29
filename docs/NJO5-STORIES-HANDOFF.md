# NJO photography, project stories and people

October 18–19, 2026. Local review change on `codex/njo-5-marketing`, following `50a680b`. The branch also contains the NJO 5.0 marketing pass (`b44d11a`) and compact-card repair (`50a680b`). Integrate the combined branch against the builder owner's latest work before any coordinated publication.

## What changed

- The complete-build starting card now uses the recognizable Super Ute forest-road photograph. The wide camp scene remains in the story experience. Starting-path crop positions are explicit, and existing responsive WebP sources are reused.
- The shop section moves directly after the homepage's three starting paths. It pairs hands-on installation photography with J. Scott's actual portrait and a concise account of the founding idea. The founder action leads to the whole founder section on About, preserving the portrait on mobile. The shared section also improves Why NJO.
- Dillon's page now has a concise project summary, a request → response → result narrative, a clear owner-review attribution and a more useful suspension inquiry handoff. The clean photograph can be opened in full without the hero overlay.
- The Alaskan camper page explains the camper, side storage and whole-truck planning relationship. It remains a photographed setup example, with no invented owner, design rationale or customer outcome. Its photo is shown without cropping away the setup and can also be opened in full.
- Project cards use clearer short summaries. Closing project actions retain service/project context, and related-service links remain available. The duplicate closing pitch within the story body was removed so the orange closing section carries the next step once.

## Review links

- [Homepage](http://127.0.0.1:4186/)
- [Earlier founder and crew introduction](http://127.0.0.1:4186/#meet-the-crew)
- [Dillon's suspension story](http://127.0.0.1:4186/pages/dillon-f250-lift-project)
- [Alaskan camper/flatbed story](http://127.0.0.1:4186/pages/alaskan-camper-flatbed-setup)
- [Founder section](http://127.0.0.1:4186/pages/about-us#meet-j-scott)

## Facts and image provenance

Existing asset and proof registers remain the baseline: `evidence/flagship-sources.json`, `evidence/customer-proof.json` and `src/customerProof.js`. Primary pages were checked again during this pass:

- [NJO lift and suspension page](https://www.nextjumpoutfitters.com/pages/lift-suspension-installation): Dillon's 93 F-250 lift, difficulty finding a willing shop, communication and quality review, with the matched truck photograph. No lift height, kit brand, price, turnaround, alignment work or specific mechanical outcome was inferred.
- [NJO camper collection](https://www.nextjumpoutfitters.com/pages/flatbeds-for-overland-and-off-road-campers): the Alaskan setup and storage/platform context. This remains a setup example, not a named customer case study. Planning notes explain what a new buyer should review; they do not claim to know why the pictured components were selected.
- [NJO About page](https://www.nextjumpoutfitters.com/pages/about-us): exploration alongside work, family and play, and the published J. Scott statement. The existing verified portrait and founder attribution are reused.

No new image was generated or downloaded. Photograph framing uses CSS. No staff names were assigned to unlabeled people. The source originals and prior copy remain in Git history.

## Implementation and integration

- `src/HomeExperience.jsx`: moves the shop section earlier without adding another homepage section.
- `src/Story.jsx`: shared shop copy/photography, founder portrait, section anchor and About destination.
- `src/marketing-content.js`, `src/Marketing.jsx`: closer complete-build photo and explicit crop positions for existing cards.
- `src/BuildStories.jsx`: stronger narratives, project facts, full-photo native dialogs and contextual closing actions.
- `src/story-refinements.css`: scoped presentation within the existing orange/charcoal/cream system. Imported by a single additional line in shared `src/App.jsx`.

The original full-photo heroes, tire-track actions, service hovers, Super Ute explorer, routes, existing motion system and manual/reduced-motion controls remain. The new photo controls use native dialogs and add no animation dependency. No builder, inventory, backend, inquiry contract, CRM, analytics, authentication, data, hosting or indexing change was made. No new operational approvals or claims are implied by the stories.

## Verification

- `npm test`: **94 passed, 0 failed**.
- `npm run build`: client and hosted Worker builds passed. Main client chunk is 513.97 kB / 151.63 kB gzip; the existing 500 kB warning remains. No performance score is claimed.
- Route audit: **53 routes**, **3,560 link/control instances**, **406 static action expressions**, **84 image URLs**, **0 failures / 0 warnings**.
- Browser layouts: **63 observations** across seven pages at 360, 390, 600, 768, 800, 900, 1024, 1440 and 1920 px. No horizontal overflow, missing/duplicate H1, failed loaded image or new photo spilling beyond its container was found.
- Desktop/mobile photo views: click/Enter opens the native dialog, Close receives focus, Escape or Close returns focus and restores page scrolling. Images stay inside the phone viewport. Lightbox caption contrast was corrected during review.
- Dillon's closing action opens the preview with suspension selected and `project=dillon-f250`. The camper action opens the camper context with `project=alaskan-camper`. Both retain the truthful preview notice; no live form was submitted.
- Founder link, existing project destinations and related-service paths checked. Manual motion pause and the existing reduced-motion implementation were preserved; no new persistent motion was introduced.

Evidence is in `evidence/njo5-stories/`: build/test logs, route audit, compact machine-readable action registry, browser checks and desktop/mobile screenshots. Older evidence files were preserved. This is local Chromium viewport QA, not physical iOS/Android certification.

## Remaining limits

Only one verified project photograph is currently available for each of Dillon's truck and the Alaskan setup. Actual work-in-progress or documented before/after photography would support a future deeper case study; none was fabricated here. Existing commercial approvals and the builder/CRM follow-ups remain as recorded in `docs/NJO5-INTEGRATION-HANDOFF.md`. Production publication still requires the integration owner's combined-branch review.
