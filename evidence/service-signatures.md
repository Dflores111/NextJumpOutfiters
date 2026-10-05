# Service-specific installation card effects

October 5, 2026. Refinement of the existing published Next Jump checkout.

Each of the eleven destination cards now has a small animation that reflects the service. Orange badges, visible labels, rounded cards and the existing navigation remain. Hover, keyboard focus and pressed feedback use the same treatment. Cards stay stationary; movement is confined to the decorative icon and, for wheels, a small tread accent. Quote buttons retain their recurring chrome and hover tire marks.

| Service | Visual signature |
| --- | --- |
| Lifts & suspension | Chassis rises while the wheels stay planted; springs extend. |
| Bumpers & racks | Side guards close around a shield and a check appears. |
| Wheels & tires | Spokes rotate with a short tread reveal below the content. |
| Power & electrical | Current reaches a filled bolt with a soft green surface. |
| Lighting | Bulb illuminates, beams expand and the card gets a warm amber wash. |
| Rooftop tents | Tent opens upward from its base. |
| Camper installation | Camper lowers onto a stationary truck; mounting check appears. |
| Vehicle detailing | One cleaning wipe finishes with a sparkle and water tint. |
| Boat detailing | Hull brightens, sparkle appears and the water moves. |
| Marine outfitting | Anchor lowers into a revealed water line. |
| Trailer projects | Trailer rolls a few pixels; its wheel turns and a track appears. |

## Implementation

`ServiceSignature.jsx` supplies original inline decorative SVGs with one stroke style. `service-signatures.css` uses short CSS transitions and a single, non-repeating cleaning wipe. Effects use the existing canonical service keys rather than card order. No animation, image or icon dependencies were added. The previous generic service-card gloss is replaced by these signatures; button chrome and tread code remain intact.

Manual pause and `prefers-reduced-motion` reset all SVG transforms and animation. Colored surfaces, illuminated fills, static decorative cues and focus outlines remain. Decorations are hidden from accessibility names and have `pointer-events:none`. No content or action depends on hover.

## Verification

- The existing 27 behavioral tests passed before packaging. The publication workflow repeats the suite against the final source, then builds the Worker and browser bundles.
- Actual keyboard focus exercised all eleven cards across the three categories. Inspected style records capture transitions in progress; the suspension, camper, tent and detailing completion states were also inspected after settling.
- Actual pointer hover on Lighting showed the illuminated fill, revealed beams and amber surface without keyboard focus. Its card remained 374.664 × 190 CSS pixels.
- All eleven cards fit the viewport and their content in each of nine category/viewport checks: 320, 390 and the default 1280 CSS pixels. The page had no horizontal overflow. At narrow widths, cards grow vertically to fit existing descriptions.
- Manual pause produced no transformed or animated SVG parts across all eleven cards. Focused Lighting retained its amber surface, visible rays and filled bulb. Resuming restored motion. The operating-system reduced-motion setting was not toggled; its matching CSS reset was inspected.
- Clicking Lighting opened `/pages/custom-lighting-for-off-road-overland`. Its inquiry selected Lighting, and quote links retained `context=service&service=lighting`. No inquiry was submitted.
- Inspected Chromium logs contained no errors. Temporary viewport changes were reset.

Rendered data: `service-signature-checks.json`. Captures: `service-signatures-lighting-desktop.jpg`, `service-signatures-camping-mobile.jpg`, `service-signatures-paused-mobile.jpg`, and `service-signatures-detailing-desktop.jpg`. Captures show the local preview; the Sites deployment result separately establishes publication of the packaged source.
