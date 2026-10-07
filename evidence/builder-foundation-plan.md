# October 7 builder and product-system implementation

The customer request is to preserve the accepted simple design, improve the builder's decisions and backend, and prepare a reliable system owned by Next Jump. The two pasted briefs and execution plan are reference proposals, not authorization to rebuild HubSpot, take payments, publish imported prices or retire Shopify.

## Current builder audit

Keep: four steps, existing brand/photo treatment, dependency confirmations, Undo, browser persistence, download, accessible native dialogs, uncertainty paths and preserved vehicle routes.

Improve: guide decisions before showing options; explain Light versus Heavy from whether equipment stays onboard; make package comparison practical; show included/requested/needs-review states; retain entry context in a structured build; save and reopen an exact server-side version.

Remove: a default flat catalog view and the need for a beginner to infer which options serve their plans. Keep direct customization available.

Add: a server catalog adapter, guided starting plans and Help Me Choose, option groups, a review checklist, immutable Build Order versions, a private staff product/review/inventory workspace, source-aware imports and stock commands with idempotency and concurrency controls.

## Scope and operating boundaries

The first release focuses on builds, quotes, catalog and inventory foundations. Checkout, shipping automation, supplier feeds and universal fitment are outside this implementation. The existing HubSpot Ticket-first process remains. No live inquiry/payment is automatically sent, and Shopify remains operational until preservation and operational replacement are verified.

The execution plan proposes PostgreSQL and Directus. This pilot adapts the current Cloudflare Worker/D1 backend with a thin, portable SQL/service layer and a matching local SQLite workspace. It avoids an additional platform subscription during the spike. The durable Product Master and Build Order contracts are independent of React. Work-account authentication now supports Google Workspace or Microsoft; the shop's actual provider application and named roster remain configuration work. Managed Postgres remains a later migration option, rather than a claimed completed migration.

Public customer APIs expose planning copy and approved commercial projections only. Private source records, supplier costs, raw payloads and inventory imports are never packaged in public assets or committed to the public repository. The staff API is available in the loopback development workspace; production is closed until staff credentials/access are configured. Anonymous build records contain no contact details, VINs or free-text notes.

## Source findings

The supplied lift workbook has 88 cached/reference errors across the two Overlander worksheets and an empty Expedition worksheet. The flatbed workbook contains four size families, source SKUs, retail/installed columns, and explicit notes that dropsides and the additional headache rack are separate options. Multiple size families reuse the same source SKU. Imports must preserve distinct source identities rather than merging those rows by SKU.

The Shopify archive found alongside the supplied material is read only for product and inventory CSVs. Customer/order members are excluded. Product/media rows are distinguished; `not stocked`, negative counts and stale snapshots remain review states. The archive is not evidence of current physical inventory, complete original media preservation or a full Admin API extraction.

No imported item is automatically approved. Price calculations use integer cents and explicit approved/effective price states; missing prices remain missing. Fitment approval is separate from product approval. A package is a proposed planning direction until its vehicle-specific bill of materials is approved.
