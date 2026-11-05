# Flatbed customer journeys — local review

Implemented November 5, 2026 on `codex/flatbed-use-journeys`, based on the approved combined marketing/builder commit `fd127a7074dd5a28f265c5992da6acd51f7dc3ed`.

Preview: http://127.0.0.1:4187/pages/overland-aluminum-flatbed-truck-bodies#camping

## What changed and which decision it helps

| Improvement | Customer decision |
| --- | --- |
| Four clearly labeled uses immediately below the existing hero | Is this relevant to my truck and the way I use it? |
| Separate camper, camping, overlanding and work stories | What problem would this solve for me, and what could I do with it? |
| One generous real photo with a problem, benefit and relevant build-story link | Can I picture the setup and understand the evidence behind it? |
| Use-specific actions plus Camping and Overland navigation links that dismiss the menu | Where do I go next without losing the context of my choice? |
| Optional five-stage explanation and a brief photo transition | Can I understand the main offer first and explore the technical detail when I need it? |

The four uses are alternate views of the same decision, implemented with native buttons and accessible tabs. All labels and short needs remain visible. Only one photo story is shown at a time. The existing hero, Super Ute explorer, partner attribution, FAQs, closing CTA, service journeys, founder/crew presentation, palette and button effects remain in place.

## Interaction and motion

- Roving tab focus, Left/Right, Home/End, visible focus, selected state beyond color and linked tab/panel IDs.
- Public fragments `#campers`, `#camping`, `#overlanding`, `#work`; reload and browser Back/Forward restore the selected use. History restores focus only when focus is already in the selector, without forcing a scroll.
- Existing `#five-stages` links still open the full technical explanation. The chapter uses a native disclosure with all five stages and their existing fitment checks.
- Photo changes use a 220 ms fade and 5 px movement. Text and CTAs are immediately available. No cycling, scroll interception, video or new animation dependency.
- Manual pause and `prefers-reduced-motion` disable the new animation. Native scrolling remains available.
- Responsive images use the existing 640/1000/1600 WebP assets, lazy loading and a reserved aspect ratio. The image-size hint follows the 900 px stacked layout breakpoint.

## Evidence and truthful presentation

| Use | Existing asset | Relationship |
| --- | --- | --- |
| Campers | `flagship-camper-slide-in` | Alaskan camper setup example |
| Camping | `ute-tent` | Super Ute collaboration at camp; kitchen options are described separately |
| Overlanding | `ute-front` | Super Ute Ford F-250 collaboration |
| Work & farm | `flagship-ranger-flatbed` | Real Ranger setup example |

No new customer outcomes, reviews, specifications, prices or turnaround promises. The studio kitchen rendering is not used as a real campsite photograph. The different white-truck Northern Lite photo is not labeled Alaskan.

## Validation

- `npm test`: 147 passed, zero failures. See `validation-summary.json` (raw local output in ignored `test.log`). The first sandbox attempt could not bind local test servers; the successful run used the approved loopback-capable execution.
- `npm run build`: passed for client and server. See `validation-summary.json` (raw local output in ignored `build.log`). Existing advisory remains for the main client chunk exceeding 500 kB; this is not a field-performance measurement.
- `AUDIT_BASE_URL=http://127.0.0.1:4187 node tests/audit-marketing-builder.mjs`: five checks passed, including current journey parameters, complete tab relationships, staged service requests and preview/native inquiry separation.
- Read-only route audit: 53/53 routes, zero failures or warnings, 84 image resources. Generated root audit files were restored; this folder holds the current results.
- Browser: 24 combinations across four uses at 320×740, 375×812, 768×1024, 812×375, 1024×768 and 1440×900. No horizontal overflow; labels and actions fit; one active panel. See `responsive-checks.json`.
- Browser: keyboard selection and focus, Back/Forward, mobile menu destination, fragment landing below the header, five-stage deep link and Enter disclosure behavior, manual motion pause. Console warnings/errors: none. See `interaction-checks.json`.
- Browser builder check: overland CTA → flatbed direction → Ford Ranger / 6 ft → Mid-size Long → camp kitchen adds required upper storage boxes → review → reload retains the anonymous draft. No estimate request was submitted.
- OS reduced-motion rules were inspected in source; the OS preference was not changed or emulated. Manual motion pause was tested in the browser.
- `git diff --check`: passed.

Screenshots include all four desktop stories, phone choices and copy, the optional system chapter and builder review. Desktop captures use the static paused state; motion was tested separately. Default browser viewport and motion controls are restored for the review preview.

## Integration boundary and owner

Files to integrate: `src/FlatbedUses.jsx`, `src/flatbed-uses.css`, `src/FlatbedStages.jsx`, `src/MarketingNav.jsx`, `tests/audit-marketing-builder.mjs`, and this evidence folder.

The builder/backend owner needs no interface change. Camping and overlanding both retain the existing `?kind=flatbed&use=overland` entry contract; no new builder use value was introduced. Camper and work actions lead to their existing dedicated journeys. The hero and technical/closing builder entries retain `kind=flatbed`.

All 107 tracked files in the protected builder/catalog, native inquiry/contracts, server, DB, release/SEO, scripts and dependency boundaries match `fd127a7`; see `backend-preservation.json`. No routes, backend, inventory, supplier integration, pricing, auth, analytics or CRM configuration were changed. The existing untracked `node_modules` symlink is not part of the change.

This preview runs from the isolated integrated worktree, with a temporary local data directory at `/private/tmp/njo-desire-review-20261105`. No deployment, push, main merge or real customer-data connection. No live inquiry was sent.

The release/integration owner can review this branch against the approved combined baseline and integrate these marketing files into the designated next release. Any later builder changes remain owned by the builder chat. Do not publish a separate snapshot from this branch.

Customer desire and conversion lift have not been measured. Staff still confirms fitment, loaded weight, parts, availability and final pricing. A saved plan is not an order or booking; supplier availability remains manual and Shopify remains the live storefront.
