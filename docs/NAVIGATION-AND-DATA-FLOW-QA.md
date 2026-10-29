# Navigation and builder data-flow verification

Verified locally on 2026-10-22 against an isolated copy of the product database. Synthetic QA products and published packages were used for all write tests. No production package was approved, and no production inventory, order, or job was changed.

Historical behavior below is superseded where noted by the October 28 Package Studio release: saving draft changes now keeps the last approved customer release available. A separate publish action replaces that release. See `PACKAGE-STUDIO.md` and the current `SITE-READINESS-REVIEW.md` for later verification.

## Fixes

- Builder refreshes restore the current step and compatible saved choices. Explicit Flatbed links enter Flatbeds even when an Upfitting draft exists.
- Browser Back/Forward restores builder steps and vehicle/use context, staff sections, and Stock/Purchasing/Jobs navigation.
- Changing a vehicle clears the old use/package choice. Changing package scope or installation mode clears the previous quote, preventing a mismatched estimate.
- Saved quote links reopen the saved estimate. Late responses cannot overwrite a newly selected journey.
- Existing package and product edits warn before staff navigate away; keeping edits preserves the form, while discarding continues navigation.
- Published package and flatbed data refresh on focus, tab visibility, step changes, and every 30 seconds while visible. Same-browser staff changes notify open builder tabs immediately. Notifications contain no private data.
- A changed or withdrawn package clears the active selection and asks the customer to review again. The server still rejects stale package revisions when saving a quote.
- Flatbed pricing uses the selected installed/parts-only mode; an installed price is never substituted for a missing parts-only price.
- Customer quote creation refreshes the staff Quotes list. Existing saved quotes remain snapshots rather than silently changing with future catalog edits.

## Verification results

| Path | Result |
| --- | --- |
| Fresh homepage → Flatbeds → vehicle → platform → review | Passed, including required-field validation and accessory dependencies |
| Reload review; Back/Forward; edit vehicle/choices | Passed |
| Installation Services → Upfitting → Tacoma → each of three use levels | Passed with synthetic reviewed packages |
| Unsupported 2024 Tacoma | Custom-estimate fallback; no pilot package falsely offered |
| Staff edit of a published test package | Saving draft withdrew it from the already-open builder |
| Staff republish after test price change | Builder updated from $430 to $480 without reloading |
| Customer installed quote → staff customer/purchasing/installation views | Same $480 quote, quantities, supplier code, and labor context |
| Change to front-only, parts-only quote | New $100 estimate with quantity 1; prior estimate not reused |
| Saved quote reload and consultation handoff | Reopened correctly; vehicle and quote reference prefilled; no inquiry submitted |
| Flatbed saved plan reopen | Vehicle, choices, version, and $3,200 synthetic approved line restored |
| Package and product unsaved-edit guard | Keep editing and discard/navigation both passed |
| Inventory count → reserve → complete job | On hand 5 → 4; reservation cleared |
| Purchase order → record order → receive one | On hand 4 → 5 |
| Barcode lookup | Correct item, leading zeroes preserved, no quantity change |
| Mobile at 390 × 844 | Menu, Escape/focus return, Upfitting, Flatbeds, and saved plan tested; no page-width overflow on checked views |
| Automated suite | 111 passed, 0 failed |
| Production build | Passed |
| Route audit | 49 routes, 2,198 link/control instances, 444 static action expressions, 87 images; 0 failures or warnings |

## Operating boundary

Backend edits reach the customer menu only after the required publication, price, identity, and fitment reviews. Draft changes intentionally do not become customer promises. A saved quote is an historical snapshot; customers create a new quote to obtain a newly published price.

The three real Tacoma packages remain drafts pending shop review. These tests demonstrate software behavior using synthetic approved data; they do not certify real-world compatibility, supplier stock, pricing, payment processing, or appointment booking. The open demo remains isolated from the real customer builder.

Production deployment and read-only live checks are recorded separately after publication, so local checks are not confused with hosted verification.
