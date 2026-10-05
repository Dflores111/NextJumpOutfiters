# Expressive Next Jump redesign

## User direction

The first rebuild was rejected as too generic, too small in its typography, too rectangular, and too quiet. The accepted working direction for this implementation is a visual, orange-led outdoor automotive experience with prominent real photography, deliberate depth, working hover/selection behavior and meaningful motion. This document records implementation choices; it is not a business or publication approval.

## Design decisions

- Full-bleed truck hero: immediate proposition and actions, a bold orange headline, a bounded scroll transform, and an actionable circular flatbed callout.
- Orange is structural: a large chapter band, platform backing plane, controls, active states and a closing statement. Dark text on orange carries normal reading content.
- Three destinations express three genuine choices: overland, camper and work. Large shaped photographs and tactile link feedback replace plain square cards.
- A real product photograph appears against layered circular geometry. It links to the existing component explorer; it is not a fabricated 3D model or a fitment simulation.
- A manually selected Super Ute photo fan gives one image priority, with neighboring views in perspective, actual previous/next controls, arrow-key selection and stable context below. No autoplay.
- Shop images overlap in an editorial composition, with a clipped corner and orange label. These images remain static content; the installation and About links have their own actions.
- Builder selections and progress use permanent orange state, larger type, image depth and tactile controls. Existing dependency, storage and validation logic is retained.
- Motion uses one native intersection observer and passive requestAnimationFrame scroll updates. Normal page scrolling is retained; no scroll interception, new animation package or WebGL renderer. Core content starts visible in server HTML. A visible pause control disables motion and remembers the choice for the browser session; the device's reduced-motion preference also wins.

## Component provenance

Adaptation mode: mechanism extraction and remix. Exact source prompts remain unchanged.

| Saved source | Retained | Adapted or removed |
| --- | --- | --- |
| `modern-hero.prompt.md` | Full-width media and a bounded transform driven by normal scrolling. | Removed SpaceX identity, long pinned scene, extra scroll distance, unused Lenis and unrelated demo photos. Main copy and CTA are immediately present. |
| `image-showcase.prompt.md` | Layered photographs, perspective, selected foreground image, state transition. | Rebuilt with semantic buttons, visible controls, current position and keyboard operation. No non-semantic click targets or demo imagery. CSS and React state replace the sample motion package. |
| `clip-path-image.prompt.md` | Intentional image silhouettes and graphic composition. | Original angular and asymmetric rounded frames fit truck imagery. No raw squiggle masks, demo video or inert hover cues. |
| Animated Tab Bar, as inspected by builder agent | Persistent selected/progress state. | Kept ordered steps and labels; removed icon-only navigation and unrelated notch styling. |
| Image Mask, as inspected by page agent | Art-directed media geometry. | Site-native angles and orange backing planes; no control-like response on static media. |

Reference project source patterns were studied in Momentos Media, Creative Collective and 120VC. Exact source pointers and transfer decisions are in `reference-design-study.md`. The three reference projects were not edited. The current Next Jump public homepage was also inspected in a browser.

## Interaction contract

- Hero, destination cards and platform illustration: navigation intent → semantic link and visible action → pointer/touch/Enter → lift/image feedback or static reduced-motion focus → real route/anchor.
- Photo fan: inspect another view → named buttons and position → pointer/touch/arrow keys → foreground and caption change → selected actual build photograph.
- Motion preference: reduce visual movement → labelled button with pressed state → click/tap/keyboard → Motion paused/on → global static/animated presentation. Device preference cannot be overridden.
- Builder: ordered configuration → labelled steps/options → existing controls → orange selected state and confirmations → same validated configuration contract.

No prices, fitment approvals, customer claims, transactions or live delivery claims were introduced by this visual work. Rendered checks and test results are recorded separately in QA.md.
