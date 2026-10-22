# Quote → job → parts

A saved installation quote can now become one inventory job. The customer estimate stays unchanged; the job keeps a link to that quote and its required parts. Flatbed planning requests remain separate: this workflow starts with a saved package quote with reviewed part identities and quantities.

## Team workflow

1. Open **Quotes**, choose a saved quote, then **Prepare job**.
2. Choose the stock location. Review required quantities, available stock, what will be reserved, and shortages. Existing incoming quantities are shown separately and are not automatically assigned to the job.
3. Optionally select **Draft purchase orders for shortages**. Confirm supplier and quantity; use zero when an existing order will cover a line. Lines group into one draft per supplier. Costs are left blank for purchasing review.
4. Confirm the vehicle, parts and installation scope. Save the job. Available units are reserved, not consumed; requirements for missing units remain on the job.
5. Open the linked purchase order, review costs and delivery details, and place any real order with the supplier outside this system. **Record as ordered** records that fact; it does not send an order.
6. Receive the actual delivery. Open the linked job and choose **Reserve available missing parts**. Other jobs' holds remain protected.
7. Complete the job with actual quantities used. Stock deduction and release of unused reservations happen together. A job cannot be completed while required parts remain unallocated.

Cancellation releases job holds but does not cancel associated purchase orders. One quote creates one job, including after cancellation; staff must prepare a new reviewed quote for a replacement job.

## Review it safely

Open `/inventory-demo?tab=builds` and select **NJO-DEMO-PREP**. The sample has six units available to reserve and one missing mounting kit. It uses fictional parts, quantities and prices, not verified vehicle fitment. Demo writes stay in the browser tab and never reach staff inventory. Existing demo sessions retain their edits when gaining the new handoff tables.

Real use: `/staff?tab=builds`, with normal Microsoft staff access. Preparing requires sales and inventory access; drafting orders also requires purchasing access. Existing role assignments are unchanged. Draft previews, parts-only quotes, unreviewed inventory types, stale part revisions and unknown opening counts cannot silently become installation jobs.

## Implementation and evidence

- Migration `0007` adds quote/job links, full job requirements and job/PO links. Existing tables and data are preserved.
- The shared service implements authenticated preparation for both hosted D1 and the isolated browser SQLite demo. The handoff, stock reservations and draft orders are one atomic transaction.
- Reopening or retrying a quote returns its existing job. Stock/revision races reject without partial writes. Reserving missing parts and job completion support exact retries.
- Automated coverage includes role/origin checks, unknown stock, stale reviews, concurrent handoffs, transaction rollback, linked orders, receiving, allocation, completion, cancellation and older demo migration.
- Browser QA exercised quote → job → draft PO → ordered → received → job allocation → completion → reload, as well as direct linked navigation, 390px layout, uncounted locations and Escape focus return.

Production package approval, physical opening counts and supplier verification remain shop responsibilities. This release does not approve catalog data, send supplier orders, book appointments or create customer messages.
