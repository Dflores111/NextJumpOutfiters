# Product, proof and action redesign

Implemented October 3, 2026 in the existing local React/Vite site. The production preview remains on loopback; nothing was published to Shopify.

## Diagnosis

The previous pass relied on decorative framing and abstract headlines. Split heroes reduced the prominence of vehicles, several secondary images remained square, proof was missing, and many actions led to more browsing or a builder before asking for contact. Hero image motion did not create the coordinated image/text scroll effect the owner wanted.

## Preserve

Existing route inventory and vehicle paths; real Next Jump photography; orange, charcoal and cream palette; working builder and dependency rules; source-bound pricing and fitment; keyboard gallery; contact validation and honest local receipt boundary.

## Journey

Show a real vehicle and name the offer → explain the practical problem and solution → show actual customer proof and a completed build → answer fitment/installation questions → request project and contact details.

- Homepage: explicit aluminum-flatbed/off-road offer, quote and configurator actions; two wide rounded product stories; camper/work links; three attributed reviews; manual depth gallery; categorized FAQs; inline inquiry.
- Installation: full-photo hero with clear service scope and direct inquiry action; service-category tabs with wide photographs and all service routes; customer proof; installation-first FAQs; inline service inquiry.
- Other visual page heroes: shared full-photo composition. Relevant header actions retain service, camper or work context. Image frames and builder photos use rounded corners and landscape ratios.
- Local forms reuse the existing validation, idempotency and receipt API. No alternate lead storage, PII persistence, live delivery, or conversion tracking was introduced.

## Component use

Mode: mechanism extraction and remix within the existing architecture. The saved prompts remain unchanged.

| Source | Visible job in the site | Adaptation |
| --- | --- | --- |
| Modern Hero | Image and text travel at different speeds during normal scrolling. | Bounded section progress, immediate offer/CTA, pause and device reduced motion. |
| Scroll Expansion Hero | Large cinematic media drives the visual hierarchy. | Native scroll and complete initial content; no wheel/touch interception or completion gate. |
| Testimonials Columns | Rounded attributed customer proof before the commercial action. | Static readable cards with one-time reveal; no duplicated quotes, invented portraits, autoplay or unverified ratings. |
| Animated Tab Bar | Persistent selection in the installation explorer. | Visible labels, actual panels, arrows/Home/End, roving tab focus, touch and selected-state underline. |
| FAQ 4 | Questions grouped by flatbed versus installation intent. | Complete category-tab semantics and native details disclosures. |
| Image Showcase | Manual foreground-photo selection with depth. | Retained working gallery, wider frames, rounded corners, full-size dialog, direct similar-build inquiry. |
| Clip-Path/Image Mask | Deliberate image silhouettes. | Soft rounded wide frames replace sharp cutouts where the owner preferred them. |

No extra animation library or WebGL dependency was added. Existing source prompts are under `/Users/diegoflores/.codex/skills/website-component-prompts/references/`.

## Current-site and reference findings

- [Next Jump](https://www.nextjumpoutfitters.com/): preserve the strong connection between vehicle photography, explicit product/service names, paired exploration/quote actions, and customer proof. The homepage and its actual rendered sections were inspected.
- [Rivian](https://rivian.com/): the inspected hero gives the vehicle the frame and keeps product identification and two primary actions visible. Adapted that hierarchy, without copying media or claims.
- [Airstream](https://www.airstream.com/): the inspected full-media hero routes visitors to product families; model browsing, build tools and owner experiences support evaluation. Adapted the principle of distinct browse/build/contact stages.

These are design observations, not claims that a particular effect causes more conversions. The previous Momentos/Creative Collective/120VC source study remains in `reference-design-study.md`.

## Evidence and limits

See QA.md, customer-proof.json, route-audit.json and journey-prefixed screenshots. The inline inquiry was submitted with fictional test data and reached a verified local receipt; the UI explicitly stated that nothing was sent to Next Jump. Publication, CRM delivery and conversion effectiveness are still separate work.
