# Tire tracks and chrome action emphasis

October 5, 2026. Applied to the published Site checkout.

The earlier tread sweep lasted 0.68 seconds, peaked at 22% opacity and ended completely invisible. The new twin tire lines reveal from left to right, reach 56% opacity and remain visible with a small rolling movement while the action is hovered or keyboard focused. The button's outer position and hit area stay fixed; labels remain between the tire lines.

Quote actions share a metallic glint and a light machined rim. The glint repeats every 7.2 seconds with a quiet interval. Initial visible quote actions use the existing intersection observer to pause the effect offscreen. The mobile and desktop builder's quote handoffs use the same emphasis. Service destination cards receive the same metallic pass on hover/focus and a small tread strip beneath their content.

## Component provenance

- Saved source: `website-component-prompts/references/shiny-button.prompt.md`, Shiny Button from the supplied component library.
- Adaptation mode: mechanism extraction. Retained a moving reflective emphasis on a real primary action; replaced demo colors, animated conic borders, imported fonts and breathing/scale effects with Next Jump's contained chrome pass.
- Native CSS implements the effect. No motion, particle or font dependencies were added.
- Only actual links and buttons receive the new treatment. Decorative layers use `pointer-events:none`; existing navigation, form validation and inquiry behavior remain intact.
- Manual motion pause hides the decorative layers. The same static state is provided by `prefers-reduced-motion`. Color and focus feedback remain usable without animation.

## Rendered verification

- Chromium pointer check: the header quote button matched `:hover`, displayed the new tread animation at 56% opacity and used the chrome pass. The button bounds remained unchanged.
- Keyboard check: the hero quote action matched `:focus-visible`, retained its visible outline, and showed the same tire lines with a dark green background and white label. Desktop capture: `cta-tire-tracks-desktop.jpg`.
- The initial visible quote button's idle glint was running; inspected quote buttons below the viewport were paused.
- Manual pause set the page's motion state to off and removed both tread and chrome pseudo-elements. Resuming restored motion.
- At an actual 390-pixel viewport, the header and hero quote buttons stayed within the viewport and the document had no horizontal overflow. Tapping the hero quote action reached the inline inquiry.
- Service destinations at 390 pixels retained readable labels, clear targets and no horizontal overflow. Keyboard focus activated the shared card gloss and bottom tread strip. Layout capture: `cta-service-cards-mobile.jpg`.
- The inspected browser logs contained no errors. The existing 27 behavioral tests passed.

The system reduced-motion setting was not toggled during this browser check; its CSS gate was inspected. The captures describe the local preview, while Sites deployment status establishes publication of the packaged source separately.
