# Reference design study

October 3, 2026. Read-only source study of the actual Momentos Media, Creative Collective and 120VC implementations. No reference project was edited or run in a browser for this study. No applicable `AGENTS.md` was found in the inspected project roots, ancestor directories or project source trees.

Applied the `website-component-prompts` skill, including catalog, selection, interaction-intent and remix guides. Adaptation mode: mechanism extraction and inspiration. Use the reference behavior in Next Jump's own orange/charcoal, truck-first composition. This is a design selection, not an implemented or browser-verified derivative.

## Six concrete mechanisms

### 1. One immersive truck stage with bounded scroll depth

**Sources:** `/Users/diegoflores/Documents/ChatGPT/Momentos Media/website/src/pages/Home.tsx:75` and `src/components/ZoomReveal.tsx:28`.

Momentos places media across the first viewport, limits its vertical movement to 9% and scale to 1.06, and keeps a real CTA over the image. Its separate ZoomReveal opens an inset frame from `inset(8% 10% 8% 10%)` to full bleed while settling the image from 1.18 to 1. Native page scrolling supplies progress; no wheel interception.

**Transfer:** Replace Next Jump's detached text/image panels with one deliberately composed truck stage. Use the exact truck image, a legible text zone, large orange editorial emphasis and an immediate Build & Price link. Let the photo settle slightly as the visitor enters the next section. An inset-to-full-width photo can introduce the Super Ute later; do not stack both signature effects in the hero.

**Keep / adapt / remove:** Keep full-bleed photography and a small bounded transform; adapt the crop around the flatbed and use Next Jump's angular geometry; remove Momentos's camera-aperture identity and delayed initial CTA. Static layout must be complete before hydration and under reduced motion.

### 2. Shared scroll progress and short masked headline entrances

**Sources:** `/Users/diegoflores/Documents/ChatGPT/Creative Collective/website/components/site/scroll-scenes.tsx:17` and `components/site/editorial.tsx:47`, `:159`.

`useSceneProgress` activates only for visible sections, uses passive scroll events and requestAnimationFrame, and writes one `--scene-progress` custom property. It stops while hidden or reduced-motion is requested. `TextReveal` moves words through clipped windows over 420ms with a capped 160ms total stagger; Web Animations supplies the effect without another dependency.

**Transfer:** One shared lightweight enhancement for Next Jump's chapter transitions, the truck image transform and a short statement such as “Make room for what’s next.” Use an orange word or orange rule as the destination of the eye. CSS/SSR starts fully readable; animation is an entrance, never a condition for seeing content.

**Keep / adapt / remove:** Keep visibility-based work and cancellation; adapt timing to a firm automotive feel; remove duplicate reveal wrappers and any delayed full paragraph. Avoid persistent loops in the first screen.

### 3. Tactile, manually browsable build photography

**Source:** `/Users/diegoflores/Documents/ChatGPT/Creative Collective/website/components/site/image-fan-carousel.tsx:30`.

The finished implementation is a native horizontal rail with explicit previous/next, position, keyboard arrows/Home/End and full-size viewing. It tracks untransformed `offsetLeft` values so visual tilt does not corrupt snap alignment. Movement over 10px counts as dragging and suppresses an accidental photo-open click. It remembers the opener for focus return.

**Transfer:** Turn Super Ute proof into a broad image sequence with one large image and visible neighboring frames, orange controls, stable project captions and an actual enlarge action. This gives the user space to inspect real evidence and brings physical depth without a fake 3D configurator.

**Keep / adapt / remove:** Keep swipe, manual controls, stable captions and drag suppression; adapt mild tilt and broad landscape ratios; remove auto-rotation and unrelated community photos. Use the existing native dialog instead of importing the reference's dialog library.

### 4. A photo stack as one meaningful destination

**Sources:** `/Users/diegoflores/Documents/ChatGPT/Momentos Media/website/src/components/PhotoStackCard.tsx:9` and `src/styles/art-direction.css:82`.

Three photo leaves overlap with different rotations. Hover and keyboard focus fan them a little further because the entire card is one genuine link. Secondary images are decorative to assistive technology. Reduced motion removes transform feedback.

**Transfer:** Use one generous Super Ute project preview or a small set of genuine use-case destination cards, rather than repeating rectangular image/text cards all the way down the page. Retain a visible action and actual destination. Use orange backing planes and charcoal typography instead of Momentos's pastel palette.

**Keep / adapt / remove:** Keep real single-link boundaries and layered media; adapt rotation, dimensions and orange framing; remove inaccessible stacked controls, decorative dragging and any image that misrepresents the category. Do not use overlap where parts must be compared precisely.

### 5. Orange pointer light on actual destination links

**Sources:** `/Users/diegoflores/Documents/120VC 2/120vc-website/app/components/problem-spotlight-link.tsx:11` and `app/homepage-refresh.css:49`.

One native anchor writes local `--spot-x`/`--spot-y` coordinates. A radial gradient is masked to a border. It operates only for a fine mouse pointer and no reduced-motion preference. Keyboard focus has its own visible outline and background, so the glow is not the only cue.

**Transfer:** Give Next Jump's Camper / Overland / Work destination surfaces an orange edge that follows intent, while the whole surface opens the corresponding real page. Use it on a few key choices, not every informational panel. The builder's selected state should remain a clear permanent state, separate from this transient hover.

**Keep / adapt / remove:** Keep semantic links and local listeners; adapt the radius and orange intensity; remove hover cues on inert facts, pointer tracking on touch and canvas/WebGL effects.

### 6. One orange line that connects a real sequence

**Source:** `/Users/diegoflores/Documents/120VC 2/120vc-website/app/homepage-refresh.css:84`, `:187`; supporting marker: `app/page.tsx:90`.

An orange pseudo-element connects a grouped narrative and draws once with `scaleX(0→1)` over 900ms. Content remains readable throughout. Reduced-motion uses the complete static line.

**Transfer:** Present Choose truck → Plan configuration → Review with the team → Installation as one connected path. Use a bold orange band or plane around this section and a clear line to communicate sequence, rather than treating the steps as independent peer cards. Label later human stages accurately; drawing the line is not a completion indicator.

**Keep / adapt / remove:** Keep the linear relationship and one-time reveal; adapt orientation to vertical on phones; remove implied progress/success if the visitor has not completed those steps.

## Recommended composition and limits

Make orange a structural material: a large headline accent, chapter band, backing plane and action treatment, balanced with charcoal and full-width real photography. Use dark text on orange because white small text on `#F2673A` is below normal-text contrast requirements. Keep the page visually varied through scale, asymmetry, overlapping media and alternating full-bleed/editorial sections, not by giving each section a different animation language.

The hero and one proof-gallery moment can be expressive. The component explainer should stay a clear selection system, and the builder/form should stay stable enough to complete. Across these references the strongest transferable lesson is native behavior under art direction: real links, genuine selection, manual media controls and normal scrolling.

Avoid transplanting Momentos's camera aperture, Creative Collective's doorway masks or 120VC's business-proof content. Avoid global smooth-scroll interception, a long pinned rail on mobile, auto-spinning galleries, fabricated truck renders, drawing a product silhouette from an unrelated crop, motion-delayed CTAs, or an effect that promises clickability without an outcome. No new animation dependency is needed for the recommended mechanisms; the native Creative Collective approach fits the current React/Vite stack.
