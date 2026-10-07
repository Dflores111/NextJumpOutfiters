# Builder and Product Master foundation — 2026-10-07

The accepted website remains the design baseline. This release adds guided planning and durable data. It is a working first slice, not a completed Shopify replacement.

## Customer experience

- Four steps remain: truck, setup, options, review. Flatbed/storage and vehicle upgrades share the journey.
- Four adjustable starting plans per direction. A three-question chooser explains its recommendation; a comparison dialog helps customers decide.
- Starting priorities are requests, not approved bills of materials. The suspension workbook is not a complete overland package specification.
- Use/camper adjustments collapse after choosing a plan. Reasons, comparison and dependent options open on demand.
- Rounded landscape photography, selected states and contained hover depth preserve the orange visual language. Motion remains optional and honors device preferences.
- Browser drafts remain. An explicit server save creates an immutable version with a capability-protected reopen link. Contacts, VINs and free-text notes are excluded.
- Saved choices, product revisions and price status are frozen. Concurrent saves cannot overwrite a version; retries cannot create duplicates.
- Native inquiries include the planning direction, scopes, handoff preference and current saved-plan reference. The existing HubSpot form remains visitor-submitted. No agent-generated live inquiry or CRM delivery was performed.

## Data and approval

The hosted runtime uses the existing Site's D1 binding, prepared SQL and generated schema migrations. Local staff review uses SQLite through the same service. Hosted runtime code never creates tables.

Tables store products, exact fitment decisions, inventory source snapshots, inventory movements, staff audit and immutable build versions. Existing preview receipts are retained.

Commercial facts have separate gates:

1. Import a draft candidate with immutable internal ID and source provenance. Supplier SKU and manufacturer part number remain separate.
2. Review identity, category and inventory classification. Services and unreviewed/non-stocked records cannot enter the physical stock ledger.
3. Independently approve integer USD cents for installed or parts-only fulfillment.
4. Approve exact fitment for the current product revision, with evidence. Unsure keys cannot receive approval. Product changes invalidate earlier fitment for pricing.
5. Server pricing requires every applicable approval. Multiple candidates need specification. Missing amounts remain null; approved zero remains zero. Known-items subtotal is not a final quote; tax, freight and unresolved labor remain excluded.

Inventory uses an append-only movement ledger. Imported snapshots do not set availability. Physical count, receive, reserve and release actions have idempotency keys and reasons. Reservations require a job/build reference, cannot exceed counted available stock and cannot be released under another reference. Counts cannot drop below held stock. Customer saves never reserve stock.

Anonymous saves have bounded bodies, isolate-level throttling and a 10,000-version ceiling. Production abuse controls, retention/export policy and load testing remain rollout work; this is not enterprise scale certification.

## Private source staging

Extraction/import ran locally against the flatbed workbook and product/inventory members of the September 30 Shopify archive. Customer/order members were never opened. Originals were not edited.

| Source | Staged result | State |
| --- | ---: | --- |
| Shopify product CSV | 1,691 variant candidates | Draft, no approved prices/fitment |
| Flatbed worksheet | 65 candidates | Repeated supplier SKUs remain separate |
| Shopify inventory CSV | 2,340 snapshot rows | Unreconciled, zero stock movements |
| Lift workbook | 88 formula/reference errors across both Overlander sheets; Expedition empty | No approved prices or complete package import |

Inventory contains 21 negative counts and 1,394 `not stocked` values. Both remain source evidence. The flatbed sheet separates retail/installed prices and identifies dropsides as a separate option.

Private import JSON, cost candidates and SQLite files are outside public assets and Git. The public API exposes planning copy and approved pricing snapshots, never raw imports/costs. CSVs lack Shopify Admin API IDs; current record reconciliation is still required.

## Operator access

The preview started for this release is at `http://127.0.0.1:4175/staff`. Standard `npm run dev` uses port 4173.

The workspace supports search, draft creation, canonical field editing, product/price decisions, exact fitment decisions, counted stock/reservations, saved plans and activity. Its local actor label explicitly identifies development. Google Workspace/Microsoft work-account authentication and server role checks are implemented, but production `/staff` and `/api/staff/*` remain closed until the actual provider credentials and named roster are configured. Inventory-only access cannot approve prices or read private cost candidates. See [staff setup and live acceptance](staff-work-account-setup.md). No real-account sign-in or hosted private catalog import is claimed.

The supplied execution plan proposes Postgres/Directus. This pilot reuses D1/SQLite to validate the review workflow before introducing another platform. IDs, revisions and ledgers are portable concepts; an eventual migration requires actual migration and verification.

## Verification

- All 46 domain, receipt, inquiry, security, catalog/inventory and authentication tests pass. They cover approval gates, ambiguous matches, frozen prices, capability access, retries, concurrent versions, stale edits, fitment invalidation, stock classification, overselling, held-stock reclassification, named roles and provider/session validation. Provider identities in tests are synthetic.
- Local rendered checks cover both branches, chooser focus, comparison/dependency dialogs, save/reopen, second version, quote context, staff search/review focus, unverified stock, desktop and 390/320-pixel layouts, and motion pause. No broken images or overflow observed in checked states.
- Migration 0000 remains unchanged. New 0001/0002 migrations contain schema only, no seeded commercial data. Hosted Worker runtime is checked separately from the Node preview.
- Publication uses the exact SHA/archive and native version/deployment result, separately from local behavior checks.
- Production dependencies have no reported audit findings. Remaining development-tooling advisories and exact build sizes are recorded in QA.md; no enterprise security certification is claimed.

## Shopify cutover requirements

Shopify remains active until these are satisfied:

1. Confirm quote-led builds/catalog/inventory versus full retail checkout/shipping scope.
2. Configure the shop-owned OAuth application, stable named identities and roles, then verify actual account access, write attribution, revocation and recovery before opening production staff access.
3. Reconcile current Shopify IDs/variants, supplier codes, duplicate identities and original media. Approve the first sellable catalog, inclusions, prices, exact fitment, labor and freight/tax treatment.
4. Import reviewed records through an authenticated operator path into the hosted database. Count stock at each participating location and reconcile holds against real jobs/orders. The September snapshot cannot replace today's count.
5. Finish a sales desk for exact parts/quote versions and verify the intended HubSpot ticket, customer approval, payment and engineering handoff with a human-approved real workflow.
6. If retail checkout is included, verify payment, tax, shipping, cancellations/refunds and fulfillment before redirecting that traffic.
7. Prove backup/export and restore, concurrency/load limits, retention and monitoring. Rehearse cutover/rollback while Shopify remains available.
8. Retire Shopify only after end-to-end acceptance. This release does not close the store, migrate private customers/orders or claim payment/CRM completion.

Attached briefs are reference proposals. No paid platform, identity account or third-party private-data transmission is inferred from them.
