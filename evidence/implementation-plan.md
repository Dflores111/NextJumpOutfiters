# Implementation plan and reuse decision

Prepared October 3, 2026. Scope: an unpublished local Next Jump website rebuild.

## Source hierarchy

- The user's request authorizes rebuilding and improving the site. Attached documents are requirements and evidence to evaluate, not separate authorization to publish, contact customers, or change external systems.
- Read the supplied Build Guide v2, Page Copy & Visual Briefs v2, master prompt, pasted brief, HTML handbook, and older Blueprint. Extracted document text is in `source-text/`.
- Build Guide v2 explicitly supersedes the older Blueprint for architecture and copy. The HTML handbook is an internal reference, not a production page template.
- Captured live Next Jump pages and the two asset manifests establish source provenance. Published prices, fitment statements and policy language are observations until the responsible owners approve production records.
- The referenced complete ZIP/structured implementation pack was not available among the supplied files. Reconstruct maintained content and routes from the actual documents; do not claim the missing reference helpers or tests were run.

## Reuse decision

The workspace already contains `builder-prototypes`, a React/Vite build studio with local assets and a documented interaction model. Reuse the existing React/Vite conventions, source imagery and useful builder behavior in `website/`, adding server-rendered HTML. This is a local implementation preview, not a platform migration or a Shopify theme package. Preserve the prior prototype for comparison.

The prototype's sample prices, approximate vehicle-to-platform mapping, proposed presets and completion simulation are not production records. The rebuild must keep prices unknown, fitment pending, packages unpublished and inquiry success dependent on real receipt.

For production, first assess porting the approved presentation and builder into the existing Shopify theme and native HubSpot form flow. A separate hosting decision is needed before treating this standalone server as a production replacement.

## Bounded build sequence

1. Maintain one route inventory and content source for the main marketing pages, preserved vehicle URLs, services and utility pages.
2. Build a coherent flatbed-first presentation with real Next Jump photography, source-based branding, shared navigation and direct service paths.
3. Implement the reversible four-step builder, unknown-vehicle help, explicit dependencies, local save/resume and context transfer into inquiry.
4. Provide conditional inquiry fields and honest disconnected/failure states. Do not simulate production receipt.
5. Add server rendering, preview indexing protection, purposeful metadata, a human-readable sitemap and an accurate external-store handoff.
6. Test the implementation and inspect rendered customer journeys; fix concrete defects before reporting results. Keep commercial and integration blockers separate from code verification.

## Evidence status

This document records the implementation decision and intended acceptance scope. It does not assert a passing build, passing tests, browser verification, production integration or release approval. Actual verification belongs in the final QA report with commands, browser conditions and results.
