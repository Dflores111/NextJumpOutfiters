# Character, proof and founder revision — October 3, 2026

This revision preserves the full-photo design approved in the conversation. It adds stronger interaction feedback, clearer services, relevant customer proof and a personal About story. The supplied component documents were used as design references, not as authorization to publish or install their demo dependencies.

## Components and behavior

- **Drive-through actions:** native adaptation of the saved Shiny Button specimen (`website-component-prompts/references/shiny-button.prompt.md`). An orange CTA turns dark green, its arrow moves right, and a brief tread pattern crosses inside the stable button. Secondary actions turn orange. Keyboard focus is explicit; disabled buttons cannot activate. No animation dependency, imported font, sound, cursor replacement or scroll interception was added.
- **Service explorer:** existing accessible category tabs retained. Each service now has a larger destination card, relevant Lucide icon, plain benefit and visible arrow. Category selection still changes only the matching image and services.
- **Review disclosures:** native details/summary controls reveal a short project summary and source destination. Quotes and authors remain visible. Cards gain border, shadow and slight expansion on pointer hover; touch and keyboard users have the same disclosure action. This adapts the optional-depth intent of the supplied card components without putting the quote behind a flip.
- **Trail highlights:** irregular orange strokes emphasize selected phrases. They are decoration and cannot intercept actions.
- **Ambient topography:** slow contour movement appears only in the inquiry section and the About purpose section. Intersection observation pauses it outside the viewport; hidden documents and the manual/device motion preferences stop it.
- **Human story:** homepage workshop teaser, dedicated About journey, J. Scott portrait and founder section, a large Super Ute workshop photograph, and veteran-owned context. No names were assigned to unlabeled technicians.

## Sources and proof governance

The current Google Maps listing was inspected directly in the browser. The new proof registry contains 12 short excerpts with named authors, actual project context and source destinations. The mapping is in `src/customerProof.js` and `evidence/customer-proof.json`. Each section is chosen for its route; pages without a matched review omit the review block. A related review can appear on more than one relevant service route. No randomized assignment or identical site-wide trio remains.

Dillon Collins (F-250 lift), Will Coburn (rack brackets), and Patrick Mulcare (suspension and lighting) were read directly on Google Maps. Luke Lamberson, Dennie Jones, Kristi Eager and Jake Watson also appear on the live services page; their project context was checked against the currently visible Google review listing. Other storefront excerpts retain their website attribution. Kenneth's detailing excerpt comes from the public Birdeye listing, explicitly attributed there to Google. This is curated static proof, not an automatically refreshed Google feed. No aggregate rating or review count is published.

**Removed stale proof:** Paul Robertson's current Google review is edited and negative (2 stars); the storefront still displays an older positive excerpt. That excerpt has been removed from the rebuilt pages. The existing live store was not edited.

Kelly Varney is explicitly labeled a collaboration partner. The faint background truck photograph is confined to that Super Ute endorsement and depicts the actual collaboration; other reviewers are not paired with unrelated vehicles or fabricated headshots.

J. Scott's public name was confirmed by Diego. The labeled portrait came from the existing 120VC founder asset at `https://www.120vc.com/wp-content/uploads/2026/02/Jason-Scott-120VC-CEO-Founder-img.webp`. The story and short quotation are grounded in `https://www.nextjumpoutfitters.com/pages/about-us`. The current Next Jump About page's photographs were inspected, but its unlabeled technician photograph was not asserted to be J. Scott.

The official current storefront favicon replaced the generic N mark. The 32px favicon and 180px touch icon retain the original logo. Asset URLs are recorded in `asset-manifest.json`.

## Verification

- Production build passes; 17 domain and HTTP tests pass with local loopback access.
- Final production audit: 46 routes, 1,908 link/control instances, 139 static action expressions and 78 image URLs; zero failures/warnings.
- Six routes at 320, 390, 768 and 1440 CSS pixels: 24 layout checks with no horizontal overflow, no broken loaded images, one H1 per route and in-bounds hero actions. Routes: homepage, About, service hub, flatbeds, campers and power detail. Raw observations: `character-layout-checks.json`.
- Actual pointer hover changed the header CTA from orange to green with white text and a `driveThrough` pseudo-element animation; the outer button retained `transform: none` and its size. Native screenshots also show service/review hover borders and depth.
- Enter on a review summary opened the project context and retained focus on SUMMARY. Click on mobile did the same with no overflow. Expanded dark-card text contrast was corrected after screenshot inspection.
- Camping service tab revealed the correct two destinations. Existing arrow-key tab handling is unchanged from the prior verified revision.
- Inquiry anchor reaches the form; its ambient field starts when visible. Pause stops the contour and button animations; offscreen contour state is paused. OS preference support was reviewed in code; the device setting itself was not changed.
- Both favicon URLs returned HTTP 200 and valid PNG bytes. No warning/error entries appeared in the inspected browser logs.

Current screenshots: `character-founder-desktop.png`, `character-reviews-desktop.png`, `character-review-mobile.png`, and `character-services-desktop.png`.

Only the local preview was changed. CRM delivery, production Shopify integration, commercial approvals and deployed verification remain the existing launch tasks in `release-checklist.md`.
