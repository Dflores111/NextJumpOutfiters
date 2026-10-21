# Tacoma package pilot

Updated journeys and full source mapping: see `BUILDER-JOURNEYS-AND-FIELDS.md`. The V2 preparer is now `scripts/prepare-full-catalog.py`; V1 imports remain supported.

The first curated menu is the 2016–2023 Toyota Tacoma: Weekender, Overlander Light and Overlander Heavy. Customer estimates and the shop's order/install brief come from the same saved, server-calculated snapshot. Existing flatbed planning, inventory, barcodes, purchasing and job completion remain available.

## Review the menu

1. Sign in at `/staff?tab=packages` with an approved work account.
2. Open a package. Confirm its parts, quantities, retail prices, labor, alignment and supported vehicle configuration.
3. Resolve each source issue and record the supporting decision. Unknown values stay blank; zero means a reviewed zero.
4. Save a draft, then use **Preview saved version** to inspect the customer rundown and shop job brief. Previewing does not create a customer quote, reserve parts or change stock.
5. Confirm the three release checks and publish the reviewed package. Published, current packages appear at `/pages/tacoma-lift-packages`. A later part revision withdraws the package until it is reviewed again.

Draft saving removes that package version from the public menu. A saved quote remains an immutable snapshot of what the customer selected; changing a package does not rewrite older quotes.

## Import the supplied source files

The original workbooks and document are read-only sources. `scripts/prepare-full-catalog.py` creates a private review bundle outside the repository:

```sh
python3 scripts/prepare-full-catalog.py \
  --lifts /private/path/lifts.xlsx \
  --electrical /private/path/electrical.xlsx \
  --flatbeds /private/path/flatbeds.xlsx \
  --conventions /private/path/conventions.docx \
  --output /private/path/njo-package-workshop.private.json
```

Use **Import source data**, select that file, review its counts, and choose **Import drafts**. The supplied files prepare 80 part candidates, three package drafts, 12 electrical sections and one catalog-conventions section. Imports run in bounded transactions, preserve existing staff records, and are safe to retry after a partial connection failure. They create no inventory movements or approved prices. Source costs, SKU references, conflicting candidate prices and original totals remain behind staff authentication and are excluded from the public bundle and source repository.

The source issues include broken Light/Heavy totals, missing quantities/alignment scope, identical Light/Heavy parts despite different load promises, VIN-dependent hardware and a Weekender alignment discrepancy. These are review tasks, not corrections the software is qualified to approve. Electrical sections remain reference drafts; they are not certified installation instructions. Promotional flatbed prices are not activated.

## Everyday shop work

- **Inventory:** search, filter or sort parts; maintain bins and reorder levels; open a part for counts, movements, barcodes and supplier details.
- **Packages:** maintain the reusable parts and labor scope, with a short review before publication.
- **Parts:** maintain shared names, supplier/manufacturer codes, product classification and sales/collection tags. `Install-Only` prevents DIY package publication.
- **Quotes:** find a customer reference, review the matching customer rundown or shop brief, and download a printable HTML copy.
- **Activity:** review who changed a record and the inventory movements.

Supplier details support reported quantity, check date, source reference, lead time and special-order/drop-ship fulfillment. They are manual records until a distributor integration is configured. A reported supplier quantity never becomes counted shop inventory.

## Customer journey

The customer chooses a vehicle, then one of three use levels, then its matching reviewed package. Existing suspension is confirmed with the package. Flatbeds skip the use step and move directly from the vehicle to a size category and accessories. The backend calculates parts, labor and alignment in cents. A saved estimate has a customer rundown and a private shop brief. The appointment inquiry carries the verified reference and vehicle details from that saved quote. No payment, appointment, stock reservation, purchase order or stock job is created by saving an estimate.

Customers can reopen a quote from the same browser. Its secret access key is stored locally and sent in a request header; it is not included in the link or inquiry. Downloading a quote gives the customer a shareable rundown without private costs or supplier codes. Staff can find the reference in Quotes.

## Integration and operating boundaries

The public builder and authenticated staff workspace use the same hosted D1 database and service. Local QA data and the public browser-only inventory demo are separate. Deploying code does not copy either into production.

Work-account roles and origin checks apply to all staff changes. Package/supplier edits use optimistic revisions and idempotency. Source-import batches and their audit records commit together. Saved quote writes check the package and component revisions again at commit time.

The existing inventory workflow reserves counted physical stock explicitly when staff creates a stock job and deducts actual used quantities when that job is completed. A quote's shop brief is preparation, not an executable job or supplier order. Staff must confirm availability and create the operational job separately; non-stocked and drop-shipped parts are not represented as warehouse stock.

This pilot does not connect a distributor stock feed, activate Google credentials, submit a test CRM lead, add payment processing or retire Shopify. An operational cutover still requires reviewed package specifications, a physical opening count, supplier decisions, a verified customer/contact and payment handoff, backup/recovery procedures and a shop rehearsal.
