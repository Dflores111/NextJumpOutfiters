# Guided Package Studio / October 29, 2026

## Everyday shop work

Choose **Update prices**, **Change parts** or **Copy a package**, then choose the vehicle/package. The same native package record powers the editor, customer builder and saved quote.

- **Update prices:** edit retail prices, labor or alignment. Quantities and part selection stay locked in this view. The current customer price and draft price use the same installation option. Save a draft, then review the change.
- **Change parts:** search the shared library, add/remove parts and confirm quantities and retail prices. Labor remains available in a disclosure. Missing values stay unknown; the system does not guess prices or fitment.
- **Copy:** choose the new use and create a private copy. Vehicle details and parts carry over; approvals reset. Review inherited details before publication. The production pilot still permits only the three 2016–2023 Tacoma uses; other coverage remains draft work.

The editor's **Before customers see it** checklist links to the relevant section. Common guided edits have an Edit / Review path; All details retains the complete record. Price and part changes clear approval and review evidence. A draft save keeps the previous customer release available.

Package links retain the selected record, task, section and installation option on refresh. Standards/source views also retain their selected view. An empty standards page explains the state and offers routes back to packages and the source library.

## Version history and guarded restore

Open **Version history** to see saved drafts, publications, copies, archives and restorations, with version, identity, time and default installed price. Review an earlier version to compare changed areas, its price and its parts/labor by installation option.

Restoration requires existing catalog access, a short reason and explicit confirmation. It creates a **new DRAFT version**, clears approvals, review evidence and inherited/source confirmations, and leaves customer releases, saved quotes, jobs, orders and stock untouched. It never publishes or rolls stock backward. Missing or retired historical parts remain blocked until staff replaces/reviews them.

Migration `0009_sleepy_paibok.sql` adds `package_versions` and transactional SQLite triggers. Every native insert or revision change, including imports, captures its snapshot in the same transaction as the record change. A failed history write rolls back the record and audit receipt. Restore uses optimistic revisions, existing role checks and idempotency keys.

Earlier published snapshots and the current saved record are backfilled. Uncaptured drafts from before this feature cannot be reconstructed. Earlier saves without recorded staff identity say so. The list shows the latest 100 versions; snapshot detail is staff-only.

## Needs attention

The workspace header opens a live, role-filtered list of saved work:

- Incomplete package fields, source questions and review steps.
- Customer estimates hidden by changed/unavailable shared parts.
- Open quote-linked jobs with parts still needing a hold.
- Draft supplier orders and orders awaiting delivery, with recorded dates where available.
- Stock that needs counting/classification or is running low.

Each item links to its package review, job, order or filtered stock view. Stock/job/order checks use the selected location; package checks span the catalog. Counts refresh after saved changes, on focus and every 30 seconds while the page is visible. Errors retain the last list with an explicit refresh error. This is an in-app work list, not a push/email notification service or a historical error-monitoring system. Unsaved form problems remain in the editor's checklist.

Only existing authorized roles receive their corresponding records. The center does not send supplier orders, approve data, reserve parts or contact customers. Automatic HubSpot job synchronization remains deferred.

## Verification

- Automated checks cover history capture and migration, role boundaries, explicit restore confirmation, stale requests, retries, immutable customer snapshots, transaction rollback, unavailable parts, dated orders, shortage jobs and stock deep links.
- A shared-part change now blocks publication until a refreshed draft is reviewed; the attention center explains when it hides a customer estimate.
- Browser sample: Weekender changed from $1,955 to $2,005 as a draft while customers retained $1,955. Version 2 was restored as a new draft, with approvals cleared. A later reviewed release appeared at $2,005 in the connected demo builder and saved quote.
- Browser sample: copied Weekender to an Expedition draft, added a light kit, filled its quantity/retail and saved it privately. Attention links opened package review and the correct Running low stock filter.
- This is an agent-led software check. Nick or another first-time employee still needs to try the workflows without coaching before unsupervised shop use. Real package approval and opening-stock reconciliation remain separate work.

Demo activity is fictional, isolated from production, and labeled as sample data. Existing demo sessions gain the history tables without discarding stock edits.
