# Next Jump: next-level implementation

Updated October 4, 2026. This record describes the unpublished local React/Vite implementation in `website/`. It does not claim a Shopify deployment, live CRM delivery, verified commercial fitment or physical-device/performance certification.

## The experience

The accepted full-photo, orange-led design remains the foundation. Wide rounded imagery, larger type, contained button motion, scroll interaction, contextual proof and J. Scott’s founder story remain in place. This pass adds depth through actual truck details and useful choices.

`src/RigExplorer.jsx` combines mechanisms from the supplied Image Showcase and Animated Tab Bar components: a real Super Ute photograph, numbered feature points, four manual tabs and a stable detail panel. Visitors can inspect the platform, side storage, tailgate and completed camp setup, enlarge the photo, and carry the selected feature into their inquiry. Tabs support arrows, Home and End. The native photo dialog restores focus on close. Motion honors manual pause and the reduced-motion stylesheet. This is a photo explorer; no inaccurate 3D model or simulated fitment is presented.

`src/BuildStories.jsx` gives four projects/setups individual framing and clear next steps:

| Story | Evidence and limits |
| --- | --- |
| Super Ute | Published collaboration with Adventure Built, Flated and TRUKD; the partner endorsement is identified as such. |
| Dillon’s 1993 F-250 | Actual customer project, with the image explicitly paired with Dillon’s review on the live suspension page. No lift-kit brand, height, cost or turnaround is inferred. |
| Alaskan camper | Actual published Next Jump setup photograph. It is a setup example, not an invented named-customer story or outcome. |
| Ford Ranger | Actual photographed setup from the live flatbed collection, labeled there as a Ranger with the midsize 5-foot flatbed. No fictional customer or testimonial was needed. |

Source URLs and boundaries are recorded in `flagship-sources.json` and `asset-manifest.json`. The new story inquiry links retain their project context; the lift story also retains suspension service context. The Super Ute walkaround opens the original Adventure Built player on demand, without loading a video iframe before selection. Closing the dialog unmounts it and restores focus.

All eleven service details now have a photographic hero, a concrete description of the work, three visible scope points, planning requirements, next steps, native FAQ disclosures, an inline preselected inquiry and related services. Boat and trailer routes use the appropriate subject. Product collages are treated as equipment illustrations rather than photographic heroes. Reviews appear only where the service actually matches their subject: roof-rack fabrication is not tent-installation proof, a Northern Lite camper is not an Alaskan installation, and an Outback hitch is not evidence of a trailer build.

The planner now uses “Plan your build” instead of implying that unapproved prices are available. Existing route handles, the nineteen supplied vehicle paths, configuration dependencies and local builder saving remain intact. Header/footer actions retain the current service or project context.

## Inquiry integration

The default short form remains a local preview. It validates the journey and stores a non-personal receipt; it does not send an inquiry. The distinct **Open the live shop form** action loads the appropriate existing native HubSpot form and clearly identifies that submission contacts the shop. Returning to the preview retains the draft.

The connected account was verified as Next Jump Outfitters, portal 24102432. Six published existing forms were mapped for flatbed, camper, general/work/installation, boat detailing, marine and vehicle detailing. No production form schema or routing was changed. The native form preserves its current validation, consent and optional upload behavior. An allowlisted project/build summary is added only to an empty description field, with a visible copy fallback. Contact values, free text, alleged prices and consent are not silently transferred. A completed-submission callback produces one browser event without submitted field values; no analytics service or second submission is attached.

The actual native description field and prefill were inspected in Chromium, including mobile service presentation. No agent-generated live form submission was performed. Existing native forms require both email and phone, budget and additional detail, while the local proposal accepts email or phone. The final production intake still needs refinement and an authorized end-to-end delivery test. Full details: `launch-integration.md`.

## Sharing and release preparation

`src/site-release.js` keeps indexing disabled and maintains an explicit allowlist. `src/seo.js` produces escaped Open Graph/Twitter metadata and a 1200×630 branded sharing image. The preview remains `noindex,nofollow`; the XML sitemap is empty. Private inquiry/receipt/package pages have no canonical or `og:url`. The image and public URLs become usable by crawlers only once deployed at the declared origin.

The supplied source package remains a standalone Node/React preview, not a Shopify theme ZIP. The actual store/theme access is still needed to adapt it into an unpublished theme and verify Shopify app, cart, checkout and policy handoffs. HubSpot access does not provide Shopify theme access. No DNS, publication or current-storefront change is established by this work.

## Verification and remaining work

The final local client/server build succeeds and all 24 tests pass. The final route audit covers 49 routes, 2,256 rendered links/controls, 157 static action expressions and 87 image URLs, with zero failures or warnings. `route-audit.json` holds the route-by-route evidence. `next-level-layout-checks.json` records 24 rendered checks across six routes and four widths. `flagship-service-layout-checks.json` records 22 checks across all eleven services at mobile and desktop widths. `ranger-final-layout-checks.json` records twelve further checks across Ranger, our work and home at four widths, including the four-story collection. `../QA.md` records interaction checks and limitations.

Native form rendering/prefill is verified; live CRM receipt, correct assignment, notifications and uploads remain untested. The film player loads; sustained playback was not established. OS reduced-motion is supported in code but the OS preference itself was not toggled. Mobile viewport checks do not replace physical iPhone/Android testing, and local bundle/layout checks do not establish field Core Web Vitals.

Before production: adapt against the actual Shopify theme, approve price/fitment and policy records, confirm asset rights and exact configuration claims, finalize the native intake, verify the deployed inquiry journey and rollback, and run a real-device usability/performance pass. `media-and-launch-brief.md` contains the concrete filming, customer-story and optional true-3D inputs; `release-checklist.md` identifies the release responsibilities.
