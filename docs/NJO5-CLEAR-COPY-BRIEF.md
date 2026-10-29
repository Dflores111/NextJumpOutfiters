# NJO 5.0: clearer customer language

Combined local integration is now reviewed in [NJO5-COMBINED-LOCAL-REVIEW.md](NJO5-COMBINED-LOCAL-REVIEW.md). The isolated-pass evidence below remains historical.

2026-10-29 · `codex/njo-5-marketing` · Local preview: http://127.0.0.1:4186/

## Approved scope

Diego confirmed: **“Keep current journeys; improve clarity.”** The workshop notes are research inputs. Their references to a shop pause, a flatbed-only offer and future operating plans do not authorize a change to the website's services. Those changes were not introduced.

This pass builds on the approved marketing, photography and story work at `dc5d5c626974c1fca72d61886868525084781728`. It preserves the design, imagery, routes, accessibility markup and motion controls. No production changes or customer submissions were made.

## What we learned and applied

The useful sequence is **recognizable situation → desired change → concrete explanation and proof → clear next step**. Use it to edit a page, without adding repetitive framework headings to the customer experience.

| Improvement | Customer decision it helps | Where it appears |
| --- | --- | --- |
| Open with making room for tools, planning around a camper or improving how the truck rides | Is this shop relevant to what I need? | Homepage hero and metadata |
| Explain loading from the side or rear without working around wheel wells | Why consider a flatbed instead of the bed I have? | Starting-path card, flatbed hero and supporting copy |
| Explain that campers add weight, tires need clearance and lights need power | Why plan upgrades with one crew? | Homepage Why NJO section and Why NJO introduction |
| Invite customers to describe what gets in their way, with J. Scott and actual workshop photography alongside | Can I start without researching every part myself? | Founder teaser on Home and Why NJO |
| Name the actual next action: “Choose my truck,” “Explore complete builds,” “Compare camper types” | What will happen when I click? | Builder entries, use cards and information-page links |

Before: “More ways to use your truck. One modular flatbed.”

After: **“Load from three sides. Build on one flatbed.”** The following paragraph explains the loading benefit and then names the aluminum deck and drop sides. Features support the reason to care.

The five-stage section now asks which pieces can carry forward and what needs to change. It avoids implying that every future configuration will reuse every part. The closing action explains that a saved plan does not reserve stock or book an installation.

## Shared message brief

| Journey | Recognizable need | Better experience to describe | Evidence to use | Next action |
| --- | --- | --- | --- | --- |
| Installation | “I need a lift, tires, lighting or another upgrade, rather than a whole truck build.” | Work through the parts, fit and installation scope for that job | Relevant service detail and Dillon's documented suspension story and review | Choose the relevant service and describe the truck and job in its contextual inquiry |
| Flatbed / camper | “I need access to my load and room for tools or camping gear.” | An open deck, access from three sides and storage or camper options reviewed for the truck | Actual Ranger / flatbed photographs, the Super Ute explorer and the Alaskan setup example | Choose the truck; review fit, dimensions, carrying limits, parts and price with NJO |
| Complete build | “I want the pieces to work together, but I don't know where to start.” | A plan for the vehicle and setup, all at once or in stages | The Super Ute collaboration, real project details and the people doing the work | Explore complete builds, then start a build conversation |

Keep specifications available after explaining why they matter. Use named parts and recognizable situations. Replace broad phrases such as “ultimate capability” with the specific work or access being discussed. Retain the distinction between a customer project, a collaboration, a setup example and a review.

Do not turn the pit-crew story into a promise of free support, an operational customer portal, automatic availability, guaranteed compatibility or a response / completion time. Paid care remains a separate inquiry. Package prices and fitment still require staff review.

## How to test the message with buyers

Ask someone unfamiliar with NJO to read a page and explain:

1. What can NJO help you do?
2. Which situation or customer is this for?
3. What becomes easier or better?
4. What evidence supports that?
5. What happens after the next click?

Listen for their own explanation and watch which path they choose. Ask about the last time they had the problem rather than whether they like the headline. Buyer comprehension and conversion effects have **not** been measured in this pass.

## Validation

- `npm test`: **94 passed, 0 failed** on this marketing branch.
- `npm run build`: passed. Existing Vite advisory remains: main client bundle 514.41 kB before gzip, above the 500 kB advisory threshold. No performance improvement is claimed.
- Route audit: **53/53 routes**, 3,560 link/control instances, 406 static action expressions, 84 unique images, **0 failures / 0 warnings**.
- Browser layout checks: Home, Flatbeds, Complete Builds and Why NJO at **360, 768, 1024 and 1440 px**. All 16 combinations had one H1, no horizontal overflow and no broken loaded images. Hero text/button/footer spacing was also measured on Home, Complete Builds and Why NJO; flatbed desktop and 390px phone screenshots were visually reviewed.
- Captured Home, Flatbeds and the founder teaser at 1440px desktop and 390px phone sizes.
- Clicked the homepage complete-build and Why NJO links, the founder story link, the flatbed builder entry and all four flatbed use cards. Their existing destinations and query parameters were retained.
- Opened a stage disclosure, exercised the mobile menu, and paused / restored motion. Browser console: no warnings or errors.
- Flatbed quote link opened the existing non-sending inquiry with `context=flatbed`. No contact details were entered and no form was submitted. Existing form/backend behavior was not changed.

Evidence: [`evidence/njo5-clarity/`](../evidence/njo5-clarity/), including browser measurements, screenshots, test/build logs and route reports. Baseline audit files at the root of `evidence/` were restored after saving this pass's results separately.

## Integration handoff

The main checkout was inspected at `3d738b1` and was clean. This marketing branch and main share ancestor `590affcfb1667621a4c886cc61a955570172b241`; the earlier approved marketing commits (`b44d11a`, `50a680b`, `dc5d5c6`) have not been integrated into current main. This is a local marketing preview, not a combined release candidate.

Review the earlier marketing work plus this pass against the latest main. Carry forward the marketing presentation and copy while preserving the newer builder, catalog, inventory, authentication and native inquiry work. Do not deploy this isolated branch as a replacement snapshot of main.

This pass changes six source files only:

- `src/HomeExperience.jsx`: hero supporting copy and complete-build information link label.
- `src/marketing-content.js`: flatbed starting-path explanation.
- `src/Marketing.jsx`: concrete pit-crew explanation, staged-build paragraph and consistent information-link label.
- `src/Story.jsx`: customer-centered founder teaser language.
- `src/FlatbedStages.jsx`: practical loading benefits, checks, contextual action labels and saved-plan disclosure. Existing destinations are unchanged; use-card data adds a display-label field only.
- `src/content.json`: matching existing Home / Flatbeds / Why NJO text and concise metadata. Port those values into the latest file rather than replacing the full content registry.

No builder, route definition, inquiry, HubSpot contract, catalog, server, stylesheet or dependency file changed in this pass. Main's source currently defaults to native inquiry and uses `preview=1` for the non-sending form; this older isolated preview defaults to the non-sending form. Preserve main's newer behavior and prefill safeguards during integration. Re-run combined-release validation after integration; the 94 tests here do not certify the newer main implementation.

## Inputs and source checks

- Diego's workshop notes and the attached `27b32a77-6094-4d1b-abe0-60b9d267ede4/Pasted text.txt`; interpreted within his confirmed scope above.
- The approved NJO marketing and story implementation, including existing real projects and review sources.
- [NJO aluminum flatbed page](https://www.nextjumpoutfitters.com/pages/overland-aluminum-flatbed-truck-bodies): checked existing deck / drop-side / tie-down descriptions. No current prices, stock claims or new specifications were imported.
- [W3C link-purpose guidance](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html): links should make their purpose understandable in context. This supports using different labels for information, comparison and builder steps.
- Previously selected UX/UI and component skills were retained for design continuity. Targeted UX database searches did not return a directly relevant copywriting rule; the copy decisions above use the supplied workshop test, existing evidence and the rendered customer journey.
