# Package workspace refinement — October 22, 2026

Historical release snapshot. For the current draft/release behavior, editable vehicle coverage and Excel workflow, see [Package Studio](PACKAGE-STUDIO.md).

This refines the existing native catalog and builder. The Shopify meeting notes and screenshots inform the staff workflow; they do not authorize Shopify migration, import live Shopify records, or establish compatibility or pricing.

## What the shop can do

1. Search packages by name, vehicle or use; filter by state and sort by tier, name or update date.
2. Open one record with four sections: Overview, Parts & pricing, Fitment & install, Review & publish.
3. Edit the customer offer, structured use level, inclusions/exclusions, optional vehicle/part image references, scope-specific parts and labor, and installation notes. Vehicle scope stays fixed to the existing pilot records in this editor.
4. See a live estimate and the original source total separately. Price remains the explicit itemized parts + labor + alignment calculation. No new override formula or markup is inferred from the meeting.
5. Save drafts, see the saved revision, preview the saved version, and receive a visible warning before leaving unsaved work. Saving a draft of a published package withdraws it from the menu until republished; saved quotes remain immutable.
6. Generate separate customer, purchasing and installation views/downloads from one saved record. Customer outputs exclude costs and supplier details. Purchasing identifies supplier codes and quantities; installation includes scope and preparation. None creates orders, reservations or job completions.
7. Duplicate into a private draft for one of the three existing pilot use levels. The copy keeps shared product IDs, scope options, images and original provenance, but resets approvals, source resolutions and review evidence. Six inherited areas require review. There is no automatic creation of additional vehicle or Expedition offerings.

## Backend safeguards

- Duplication is staff/catalog authorized, revision checked, audited and idempotent, including concurrent retries.
- The server preserves copy provenance and requires the copy checklist; omitting it in a request cannot bypass review.
- Publication blocks overlapping published vehicle-year ranges for the same make/model/use. The uniqueness condition is checked again inside the database write.
- Shared part revisions still invalidate a public package until reviewed. Draft content changes reset approvals; unchanged content allows review-progress checks to be saved.
- Media entries are bounded, require descriptive text and accept local image paths or HTTPS references. No new upload/storage infrastructure was introduced.
- No schema migration, auth policy change or operational inventory mutation is required for this release.

## Existing behavior retained

Flatbeds: vehicle → size guide and accessories → review.
Upfitting: vehicle → intended use → package/custom path → quote.
2016–2023 Tacoma remains the three-package pilot. Structured vehicle/use values drive the customer menu without hand-built collection pages. The customer frontend consumes the approved public projection of the native catalog; draft costs and source spreadsheets remain private.

Source imports still stage drafts, retain original cells/formulas and preserve staff-edited records. This pass adds a package-level import summary; it does not introduce a field-by-field merge tool that overwrites reviewed records.

## Verification and limits

106 automated tests pass, covering the existing builder/inventory/auth paths plus duplication, concurrent retry, copy-review enforcement, overlapping publication, draft review retention, media validation and output separation. Local browser checks cover list/search, editing, saving, duplication, preview switching and unsaved-change recovery, using an isolated database copy. Phone-width QA found and corrected save-bar wrapping and selected-tab contrast.

The shop must still resolve the original workbook questions and approve fitment/pricing before releasing the real three Tacoma drafts. Direct distributor synchronization, live Shopify cutover, payments and automatic appointment booking are outside this refinement. Neither the meeting example nor a copied package is treated as approved engineering data.
