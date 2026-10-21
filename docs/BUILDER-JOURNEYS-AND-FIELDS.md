# Builder journeys and source field mapping

The public builder and private staff workspace share the hosted Product Master. Source imports create review candidates, never approved prices, fitment or physical stock.

## Customer paths

- **Flatbeds:** vehicle and factory bed → size category and optional accessories → review and estimate inquiry. There is no required use step. Known vehicle routes map to Full-size Long, Full-size Regular, Mid-size Long or Mid-size Regular as a sizing guide. An exact vehicle/product/price approval is needed to show a reviewed product estimate. Unknown vehicles receive a custom fitment path.
- **Upfitting:** vehicle → Weekender, Overlander Light or Overlander Heavy → the corresponding released lift package → saved quote. The curated pilot stays within the 2016–2023 Toyota Tacoma. Unreleased packages and other vehicles lead to a personal estimate, with no invented price or fitment.

Vehicle changes clear component choices. Kitchen inserts and their required upper storage boxes stay linked. Existing version-one saved plans can still reopen. Contact details are collected in the separate inquiry; saved plans do not place an order or reserve an appointment.

## Review with the team

Open `/staff?tab=packages` and sign in with the approved work account.

1. **Package menu:** choose a Tacoma package. Switch between Front only and Front & rear where the source supports both. Review quantities, private unit costs, retail prices and labor. The scope marked as a draft option is excluded from the public menu until enabled and reviewed.
2. Expand **Vehicle specification & original totals** for recommended height, stock coil, leveling method, intake questions and the workbook's original figures. These source totals are separate from the server's itemized estimate.
3. Use **Preview saved version** for the customer rundown and shop job brief. It does not save a customer quote. Both outputs identify the installation scope.
4. Resolve source issues, fill the supported vehicle configuration, record the review decision, and complete the release checks before publishing. Changing a shared part revision withdraws an affected public package until reviewed again.
5. **Build standards:** open an electrical section. Its per-build BOM links to the parts library. Correct the matched part, quantity and unit; unknown quantities stay blank. Technical review needs every line checked, all issues resolved and supporting evidence. It does not certify a circuit or change stock.
6. **Source library:** search by vehicle, part number or source text; filter by category and sheet/size group. Expand one original row at a time to see its fields, values, cells, formulas and mapping.
7. **Parts:** open a record and expand **Full product details, costs & source variants**. Keep purchase cost, COGS, retail and installed prices separate. Original size variants remain visible even when the supplier reused a SKU.

## Full mapping

The machine-readable column dictionary is `docs/source-field-map.json`. Mapping version two captures:

| Workbook / sheet | Fields per row | Destination |
| --- | ---: | --- |
| Lifts / Weekender | 43 (A:AQ) | Original vehicle/year, both installation-scope totals, price difference, lift/coil/leveling specifications, component names/codes/quantities/costs/retail, alignment, front/rear/rust labor, original inclusion copy |
| Lifts / Overlander (light) | 35 (A:AI) | Vehicle/year, source totals, suspension/UCA/brake/diff/cam/bump-stop components, labor/rust, inclusion copy and vehicle intake questions |
| Lifts / Overlander (Heavy) | 30 (A:AD) | Vehicle/year, source totals, suspension/UCA/brake/diff/cam components, labor/rust and inclusion copy |
| Flatbed Components | 18 (A:R) | Source quantity, English/Chinese names and descriptions, supplier SKU, item cost, dimensions in mm, kg, branding, production changes/notes, COGS, retail, installed and both historical promotional prices |
| Electrical / Medium | 5 (A:E) | Component type, name/model, feeds-to, purpose and original per-build BOM; parsed draft BOM retains source text, explicit quantities and units |

The prepared source contains 169 original rows: 65 flatbed component rows, 68 current lift rows, 12 electrical rows and 24 archived source rows. It creates/supplements 80 part candidates, the three Tacoma package drafts, 12 electrical sections and one conventions section. Other lift vehicles remain source references; they are not silently released as supported packages.

Every captured cell retains its cached value, original formula and cell location. Broken formulas and missing values stay visible. Purchase cost and COGS are distinct; imported source quantities never become on-hand stock. Conditional rust hours are separate from aggregate hours; staff may explicitly choose the reviewed breakdown. Historical Labor Day promotions start inactive and need current prices and dates before activation in the private catalog.

## Import and reliability

Prepare the private file outside the repository using `scripts/prepare-full-catalog.py` with the same `--lifts`, `--flatbeds`, `--electrical`, `--conventions` and `--output` arguments as the earlier preparer. The original files are read only. Do not commit the generated JSON, source workbooks, private costs or local QA database.

In Packages, choose **Import source data**, inspect the counts and choose **Import drafts**. The browser sends small batches: original rows, parts, standards, then packages. Version two supplements only untouched draft records; staff-edited and released records are preserved. Original rows are append-only. Each batch and its audit record commit together; exact retries apply once. An interrupted import can be retried without reapplying earlier changes or replacing human reviews.

The source reuses flatbed supplier codes and dimensions across sizes. Those rows are preserved separately, and affected master records require identity evidence before approval or stock tracking. No corrected dimensions or replacement SKUs are invented. Electrical kit overlap and inconsistent bus/charger references remain technical review tasks.

The staff routes enforce work-account roles and same-origin writes. Public package and quote projections exclude costs, supplier codes, source rows and internal decisions. Public estimates are calculated by the server; quotes preserve the selected scope and revisions in an immutable snapshot. Inventory movements, purchase orders and operational jobs remain explicit staff actions.
