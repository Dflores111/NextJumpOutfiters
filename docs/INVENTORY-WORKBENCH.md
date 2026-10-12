# Inventory workbench

The staff workspace opens on Inventory for inventory users and administrators. It uses a sheet-like list over the existing stock ledger. No Smartsheet account, subscription or synchronization is introduced.

## Daily work

1. Choose a location. Search by name, supplier SKU, manufacturer part number, variant or exact item ID.
2. Open a work view: All items, Running low, Reserved, Needs count or Needs setup. Narrow by category or product review state. Sort and paginate through the complete catalog, 50 rows at a time.
3. Click Shelf / bin or Reorder at to edit in place. Enter saves; Escape cancels. Select up to 50 rows on the current page to apply one shelf/bin or reorder value together. A blank value clears the field.
4. Open an item to count, receive, reserve for a job or release that job's hold. The list, filters and page remain in place. A note is optional; job references are required for holds and releases. Physical counts cannot fall below active reservations.
5. Review recent stock activity for the selected location, shelf/reorder changes and a safe summary of global product detail changes. Save view remembers the current filters in this browser. Export downloads the visible page or selected visible rows, clearly excluding private costs and prices.

Product names, SKUs, categories and stock classification can be edited in the drawer by users with catalog permission. Approval, price and builder mapping decisions remain in Product review. Changing product facts advances its revision and requires fresh exact fitment review. Changing shelf/bin or reorder metadata does not invalidate fitment.

## Data rules

- Imported snapshots remain unreconciled source data. They never become stock counts automatically. Uncounted stock shows a dash, not a false zero.
- Physical stock is tracked only for explicitly classified stocked items. Services and items ordered as needed have no implied availability. Receipt alone does not establish a verified baseline; perform a physical count before reserving.
- Available equals counted on-hand minus active holds at this location. Running low includes counted stock at or below a saved reorder level and counted items with no availability. It is a work view, not an automated purchasing or notification service.
- Stock movements remain append-only. Quantity edits are meaningful actions, not direct database overwrites. The existing reservation rules prevent overselling and releasing another job's stock.
- Single and bulk metadata changes use optimistic revisions and an actor-bound idempotency key. Every participant must still match; otherwise the entire bulk edit is rejected without a partial change or audit record.
- The inventory role receives only the inventory projection. Costs, prices, raw source payloads and catalog approval audits are excluded. History exposes only explicit safe fields from product detail updates.
- CSV export escapes formula prefixes. Private staged source imports and SQLite files stay outside the published assets and repository.

## Research and recommendation

Reviewed October 11, 2026. Smartsheet describes shared inventory sheets, location/vendor tracking, alerts and mobile workflows. Sortly documents advanced search, sorting, bulk editing and minimum-level reports. inFlow models quantities alongside incoming/outgoing orders, receiving and barcode workflows.

- [Smartsheet inventory management](https://www.smartsheet.com/content/inventory-management-software)
- [Sortly advanced search](https://help.sortly.com/advanced-search)
- [Sortly bulk editing](https://help.sortly.com/bulk-edit)
- [Sortly low-stock report](https://help.sortly.com/low-stock-report)
- [inFlow inventory](https://www.inflowinventory.com/inflow-inventory)

The useful shared pattern is a fast editable list, exception views, product/location records and a traceable record of stock movements. Adopt that interface within the existing system rather than making a spreadsheet a second source of truth. Smartsheet remains a possible coordination tool if staff already use it; no platform migration is selected here.

The next operational capabilities to evaluate with the shop are barcode lookup/labels, purchase orders with partial receiving, stock consumption when a job is completed, and location transfers. Those capabilities are not implemented by this UX update. This is not yet a complete Shopify replacement.

## Verification and rollout

- 56 automated tests pass, including ten inventory scenarios covering search, pagination, unknown/zero stock, filters, role privacy, concurrent edits, atomic bulk saves, retries, history scoping and quick product edits.
- Desktop and 390px phone checks covered direct cell save, bulk save, category filtering, SKU search, pagination, physical count, reservation, oversell rejection, classification, activity history and Escape/focus restoration. At 390px the page has no horizontal document overflow; the inventory rows become labeled cards. Controls honor reduced-motion CSS.
- Browser writes used a separate temporary database with explicitly labeled synthetic items. The existing staged catalog was checked read-only: 1,756 candidates across 36 pages; every item remains unclassified. Real stock, approval and pricing values were not fabricated.
- The schema-only migration `0003_redundant_hellion.sql` adds location-specific shelf/bin, reorder level and independent metadata revisions. It applies successfully to the disposable local Worker database.
- The compiled Worker check verifies the customer builder still renders and unconfigured staff access remains closed. See `evidence/inventory-worker-check.json`.
- Production environment inspection found no configured work-account settings. Shop rollout still requires the actual Google Workspace or Microsoft provider, its application settings, and a named staff roster. Local pilot access is not production authentication.
- The hosted release contains code and schema only. The private local source imports are not automatically copied to hosted D1. Reconcile and approve the catalog, establish counts and validate staff access before an operational cutover.

To review the private local catalog, run `PORT=4175 npm start` from this checkout after building, then open `http://127.0.0.1:4175/staff`. It binds to loopback and reads the existing ignored `.preview-data` database. The development identity is explicitly local. Temporary QA servers are stopped at the end of verification.
