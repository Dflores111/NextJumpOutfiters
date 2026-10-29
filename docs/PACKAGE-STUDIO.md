# Package Studio — October 28, 2026

This upgrades the existing native package system. Staff maintain records in the workspace; Excel is an exchange and review format. No Shopify records, credentials or work-account settings changed.

## Team workflow

1. Open `/staff?tab=packages`. Use the vehicle/use menu or searchable list to open a build. Empty menu cells can start with a reviewed copy of another package for that vehicle. Copies reset inherited approvals.
2. Edit Vehicle & offer, Parts & pricing, and Customer & install. Enabled installation scopes have separate parts, quantities, retail prices and labor allowances. Private unit costs stay in the workspace. Estimated labor is explicitly distinguished from shop-confirmed hours.
3. Save a draft. An existing published revision continues serving customers until its replacement is reviewed and published. Compare the current published price with the draft. Preview customer, purchasing and installer outputs. Published previews use the saved release, independently of the working draft.
4. Review source questions, fitment, parts, pricing and evidence. Publish the reviewed update. Only the 2016–2023 Toyota Tacoma pilot can be released in production. Other vehicle records and Expedition coverage can be prepared as private drafts. Archiving withdraws the active release.
5. The public upfitting builder selects vehicle and use, retrieves the matching released package, and offers enabled installation scopes. One matching kit is presented as the shop recommendation without an unnecessary selection card. A saved quote freezes that release and scope. Subsequent package edits do not rewrite that quote or its job brief.
6. Open Quotes to prepare a job, inspect actual stock and shortages, reserve available parts, and draft purchase orders. Existing stock and ordering controls remain in place. Neither editing a package nor saving a quote deducts stock.

## Excel review

- Export produces a real `.xlsx` with Packages and Parts sheets, stable IDs, saved revisions, scope rows and private cost fields. Shared package fields must agree across scope rows.
- Import supports the native export and the recognized September 2026 Good, Better, Best suspension layout. No workbook macros or formulas execute. Cached formula results and original source cells are retained for human review; this is not an Excel calculation engine.
- Select one imported package, inspect field differences and before/after prices, then apply a draft. A stale native workbook needs explicit overwrite confirmation. Any competing native change invalidates the review token. Applying never publishes a package or changes inventory.
- New source parts become private draft catalog records with unreviewed stock classification. Source quantities that are absent remain unknown. Labor rate, alignment, kit contents and conditional rust time require review. Rows with no component information are reported as skipped rather than filled automatically.
- The supplied September workbook currently maps 75 component-bearing package rows and reports 14 rows without component details. This is mapping coverage, not approval or compatibility verification. Original private workbooks and extracted cost data are not committed to the repository.

## Connected review demo

`/inventory-demo?tab=packages` uses fictional products and prices in the browser tab's isolated database. The menu contains published sample packages and front-only/front-and-rear scopes. “Try the connected sample builder” reads this same demo catalog. Save a sample quote, then open Quotes to prepare its job. Staff can edit a draft, verify the old price remains available, publish, and verify that new quotes use the new price while earlier quotes retain their original amounts.

The demo does not write to real inventory. Use `/staff?tab=packages` for authorized work. Existing Microsoft sign-in and roles remain unchanged.

## Data and release safeguards

`package_releases` stores immutable snapshots with one active release per package. The migration backfills previously published packages. Optimistic revisions, command audit receipts, transactional imports, scoped permissions, overlapping-fitment checks and idempotent retries protect writes. Shared-part revisions or retirement withdraw a stale published estimate until staff review it again.

Customer endpoints expose the public projection only. Supplier codes, costs, source cells, review evidence and staff identity remain private. The demo-only quote route returns internal views solely inside the isolated demo; real staff identities cannot use it.

The production source packages remain unapproved until the shop verifies the actual data. This release adds no distributor sync, automatic compatibility inference, payments, appointment booking or Shopify migration.
