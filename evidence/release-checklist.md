# Release checklist

Prepared October 3, 2026. Status: unpublished local rebuild. This checklist is not release approval and contains no assertion that browser QA or build checks have passed.

| Owner | Required before production | Current gate |
| --- | --- | --- |
| Nick | Approve a single maintained price source, installation/labor basis, exclusions, quantities and final-quote process. | Missing approved commercial records. No flatbed total should be presented as confirmed. |
| Nick, with qualified technical reviewers | Approve exact vehicle/year/cab/bed/fuel/axle combinations where relevant; dependencies, exclusions, mounting and camper evidence. | Existing route labels are pending, not certified fitment. |
| Nick and Tally | Confirm purchase/fulfillment, availability, warranty, consultation credit, cancellation/refund and installation scheduling terms. | Source observations do not establish approved operating policy. |
| Nick and Andrew | Approve any package name, BOM, exact photos, supporting rules and price basis. | Packages stay unpublished until all records exist. |
| Andrew | Confirm asset rights, customer permissions, exact vehicle/component labels, crops and image-to-configuration match. | Live-source provenance recorded; publication rights pending review. |
| Andrew | Choose Shopify theme integration and verify native HubSpot form presentation on the actual staging theme. | Optional native wrapper is implemented locally. Standalone preview is not a deployable Shopify theme. |
| Diego, with Andrew | Finalize native intake requirements, context properties, consent, deduplication and successful-submission behavior. | Portal and six published legacy-embed form IDs verified; context/copy fallback implemented. No agent-generated production submission or CRM delivery test. See launch-integration.md. |
| Nick and Diego | Confirm lead routing, sales response ownership, repeat-inquiry handling, qualification and ticket/deal conventions. | No response SLA or automatic CRM structure should be invented. |
| Tally and Diego | Approve privacy, retention, upload restrictions and marketing consent purpose/version. | Optional marketing opt-in must stay separate and unchecked; uploads need a secured destination. |
| Diego | Preserve existing tracking IDs, consent handling and the canonical confirmed-lead event; verify deduplication. | Exploratory actions, click-to-call and local saves are not qualified leads. |
| Diego | Approve final copy, canonical URLs, redirects, metadata, schema and sitemap eligibility. | OG/Twitter image metadata and explicit release allowlist are implemented. Preview stays non-indexable; no invented Product offers or review markup. |
| Andrew and Diego | Run build/tests, route/action checks, responsive/browser/keyboard testing and representative inquiry failure/retry journeys. | Record actual results separately; code completion alone does not close this gate. |
| Nick and Tally | Reconfirm address, phone, email, opening hours and active service menu. | Captured source facts need production confirmation. |
| J/Jason | Approve major business direction or a change of production platform where needed. | Routine implementation does not require an additional major-decision gate. |

## Deployment and rollback

- Obtain explicit user authorization for publication, theme deployment or DNS changes after presenting the concrete release candidate and unresolved blockers.
- First use an unpublished duplicate Shopify theme or approved staging environment. Preserve the current published theme, URL inventory, app configuration and existing lead path.
- Record the release version and deployed theme/hosting target. Verify actual rendered content, routes, lead receipt and tracking on that target using an authorized test plan.
- If the core inquiry or commerce path fails, restore the previous published theme/deployment and confirm the original lead flow. Do not delete original theme assets, catalog records, CRM properties or historical routes as part of rollback.
- A browser pass, build pass, deployment, operational approval and independent review are distinct statuses. Report each on its actual evidence.
