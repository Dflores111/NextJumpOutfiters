# NJO: the next level

Review of the approved NJO 5.0 local preview and Diego's two screenshots, October 18–19, 2026.

The site has a clear offer, distinctive photography and useful paths. The next investment should make NJO's judgment and workmanship easier to see, make each next step easier to understand, and refine the visual details across screen sizes.

## Immediate repair completed

The compact project grid inherited the full-width featured story's internal two-column layout. On desktop that squeezed Super Ute copy into approximately 162 px inside a 401 px card. On mobile, an inherited percentage height could expand the photo beyond its card and crop most of the vehicle. The compact variant now stacks its photo above full-width copy, constrains images to their card, resets the mobile height and aligns the project actions. Tablet rows, mobile stacking, project destinations and the dedicated Our Work featured layout are preserved.

Change: scoped rules in `src/njo5.css`. Evidence: `evidence/njo5-craft/`. This is a local marketing refinement on `codex/njo-5-marketing`; production is unchanged.

## Recommended priorities

| Priority | What to improve | Why it matters | Concrete next result |
| --- | --- | --- | --- |
| 1. Visual craft and photography | Review crops, text widths, card heights, action alignment and spacing. Bring the complete-build vehicle closer in the third starting-path image; retain the wide sunset image within the story. | A visitor should recognize the offer before reading its paragraph. The current three starting paths work, but the distant truck conveys less about a complete build than the other two images convey about their offers. | A deliberate image/crop choice for each route and a consistent desktop/tablet/mobile presentation. |
| 2. Proof of judgment and workmanship | Give each priority service one relevant project: customer need, verified work, reasons behind the choices, useful detail photos and an attributed customer excerpt when available. | The existing reviews build trust; showing how the crew solved a relevant problem helps a buyer choose NJO for their own truck. | One suspension mini case study and one flatbed/camper mini case study, assembled from existing evidence first. New facts require shop verification. |
| 3. More of the people | Bring a concise founder/shop moment nearer the early decision points. Pair J. Scott's verified story with an actual portrait or hands-on shop image and a specific statement about how the crew approaches a vehicle. | “Pit crew” becomes credible when visitors can see the people and care behind it. | A short human section that connects the founder and workmanship to the customer's decision, while the full story remains on About. |
| 4. More confident next steps | At each priority inquiry, clearly show what to bring and the expected sequence: discuss vehicle/use, review fitment/scope, confirm a quote, arrange the work. Explain the real cost drivers where verified. | Customers can start a conversation without knowing the exact parts or assuming a saved estimate is a booking. | Useful service-specific expectations beside the quote action, with no invented price or response-time promise. New production intent fields and builder changes remain with their owner. |
| 5. Speed and learning | Measure the home, service, flatbed and inquiry templates on mobile; review the 510 kB main-chunk warning with the implementation owner; validate the journeys with prospective customers. Instrument confirmed lead outcomes only through approved integrations. | A polished experience must load quickly and help people complete real tasks. Click counts alone cannot establish lead quality or revenue. | Performance baseline, prioritized fixes, short customer task observations and an approved measurement handoff. |

These are recommendations from the rendered page and current code, not measured claims of increased conversion.

## Suggested sequence

1. **Marketing craft pass:** refine image selection/crops, compact proof layouts, spacing and a short founder moment. Keep the three clear starting choices and the accepted visual language.
2. **Evidence pass:** publish two stronger project stories with verified work details and close-up photography. Use the existing Super Ute explorer and walkaround where the visitor is evaluating that build. Stage-specific flatbed visuals require real or explicitly labeled conceptual assets; do not show unapproved stages as finished customer products.
3. **Confidence and performance pass:** tune inquiry expectations, run customer task checks and coordinate route loading, builder improvements and measurement with the other owner.

## Asset brief

- Complete build: a recognizable whole-vehicle view plus a camp/use view, ideally of the same verified build.
- Suspension: the actual customer truck and close-ups of verified work; before/after only when both images and the change are documented.
- Flatbed: deck access, storage access, mounting and real camper use; confirmed stage-specific photographs when available.
- People: J. Scott portrait, actual workshop interaction and craft details. Identify people only when their names and roles are confirmed.

## Performance definition

Use Google's current Core Web Vitals guidance: LCP within 2.5 seconds, INP at or below 200 ms and CLS at or below 0.1, evaluated at the 75th percentile and split by mobile/desktop. Source: <https://web.dev/articles/vitals>. Lab tests help find regressions; they are not a substitute for field measurements. No field performance or conversion improvement is claimed from the local preview.

## Repair verification

- 27 browser layout observations: homepage, Complete Builds and Our Work at 360, 390, 600, 768, 900, 901, 1024, 1440 and 1920 px.
- No horizontal overflow or images wider than their card in those observations. All compact desktop story cards use their full width for copy. At 390 px, all three photos measure 342 × 214 px, rather than extending beyond the card.
- Desktop and mobile screenshots saved, with the original failing layout preserved for comparison.
- Hosted client/Worker build passed; the existing main-chunk warning remains. CSS repair was validated in the browser rather than adding an implementation-mirroring unit test.
- Existing project destinations retained. No builder, API, data, CRM, analytics or deployment change.
