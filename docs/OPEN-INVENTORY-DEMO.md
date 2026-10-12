# Open inventory review

Review URL: https://next-jump-outfitters.diegoafmejia111.chatgpt.site/inventory-demo

Anyone with the link can explore the workspace. No Microsoft or Google application registration, account creation, or sign-in is needed for this review. `/staff` and `/api/staff/*` continue to require a verified, named staff identity; production work-account activation remains pending.

## Try the complete workflow

1. Open **Stock → Scan barcode** and enter `001234567890`. The sample light kit opens with 15 on hand, 2 reserved and 13 available.
2. Open **Purchasing → DEMO Northtrail Lighting → Receive delivery**. Receive part of the remaining quantity. Physical stock increases; the remaining units stay on order.
3. Open **Jobs → DEMO Tacoma · trail lighting → Complete job**. Confirm the quantities actually used. Completion deducts those units and releases unused holds together.
4. Return to Stock, search or filter, edit a shelf/bin or reorder level, and inspect the activity history. Reloading preserves this tab's demo edits when browser storage is available.
5. Use **Reset demo → Reset sample data** to restore the starting examples. **Share demo** copies the review URL.

## Isolation and limitations

All seven parts, three purchase orders, two jobs, supplier names, quantities and costs are fictional and labeled DEMO. They are not imported from private spreadsheets or the hosted database.

The browser loads a self-hosted SQLite WASM asset and runs the existing catalog/inventory/purchasing/job service rules against a browser-owned database. Requests on this route invoke that local service directly; they never fetch the staff API or fall back to it. Successful changes are serialized into session storage for this tab. A storage warning appears if the browser cannot retain edits. Closing the tab normally discards the demo; browser session restoration can retain it, so Reset is the explicit way to start over.

Visitors do not share demo edits. This is a product review environment, not a shared operational stock ledger. Demo edits do not update the customer builder, contact suppliers, send messages, spend money, or create real customer jobs. The isolated demo identity is only supplied to the browser-owned service; hosted authentication does not recognize it.

No real catalog, cost, stock, source snapshot, demo fixture, or login secret is seeded into D1 by this release. Existing environment settings and staff authentication remain unchanged. Activate named work-account access and reconcile/import reviewed real inventory before operational use.

## Verification

The regression suite covers receiving once, job deduction and hold release, separate databases, export/restore, transactional rollback, foreign keys, no hosted fetch from the demo transport, and rejection of unauthenticated staff API access. Browser review covers barcode lookup, partial receiving, actual-use completion, reload persistence, reset, and a phone-width layout. Typed barcode testing does not certify physical scanner hardware.
