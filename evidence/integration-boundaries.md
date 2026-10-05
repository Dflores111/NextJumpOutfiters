# Integration boundaries

Updated October 4, 2026. The implementation in `website/` is an unpublished local React/Vite preview with server rendering. It now offers an explicitly selected native HubSpot form connected to the verified Next Jump account. No live submission or notification was sent to test delivery. It is not a deployed replacement or an approved Shopify theme.

## Shopify and public routes

Prefer the existing Shopify theme and commerce setup for production. Port or adapt the approved content, visual components and builder there before considering a separate host. Keep retail checkout, existing catalog prices and policies on their current store paths until a deliberate migration is approved.

Core marketing, builder and inquiry routes should work within the local preview. Retail and policy links may intentionally lead to the live store; they must be visibly meaningful destinations, not silent substitutes for unfinished core routes. Preserve all nineteen supplied vehicle paths and review exact model meaning, especially Tacoma and Colorado long-bed destinations.

Server rendering makes preview content available as HTML. It does not by itself establish production SEO, Shopify session compatibility, commerce integration, security certification or deployment readiness. Preview indexing protection must remain enabled until an approved launch configuration is ready.

## HubSpot lead capture

The supplied brief prefers a reusable wrapper around **approved native HubSpot forms** while preserving Shopify commerce. This is distinct from replacing lead capture with a Shopify contact form. Use the actual existing portal, form IDs, editor version and property conventions once approved access and records are supplied.

That wrapper is now implemented in `src/NativeInquiry.jsx`. The connected portal was verified as Next Jump Outfitters (24102432), and the published form registry, existing live embeds and public form definitions were read without changing them. The short local form stays the default. Clicking **Open the live shop form** loads the real native form; submitting that form contacts the shop. No credentials are needed in browser code, and no duplicate custom API submission exists. The native form retains its current requirements, consent, spam protections and optional file upload.

The existing forms require both email and mobile phone and considerably more vehicle detail than the proposed short preview. Do not describe those journeys as equivalent. Consolidating the production intake requires a deliberate form/schema update and review of its routing and consent. The local draft remains mounted when switching between preview and native form. Allowlisted vehicle/equipment/project/feature context is added only to an empty native work-description field. A visible copyable summary remains available if autofill cannot access the native field. Personal values or consent are never automatically copied or prechecked.

Production integration must preserve inquiry type, selected vehicle, intended use, selected equipment, relevant project/service source and approved attribution. Validate URL-derived context. Do not place names, email, phone, VINs, notes or uploaded files in public URLs or analytics.

For native HubSpot forms, success must come from the confirmed-success event for the correct form instance and current editor/version. Submit-button clicks, rendering, generic messages and local preview completion are not leads. Do not add a second API submission beside a native form.

A custom Forms API adapter is a documented alternative only when needed and approved. It requires server-side validation, appropriate credentials and current official API documentation, abuse controls, consent preservation, once-only receipt and observable delivery/retry handling. No credentials or production configuration are assumed in this preview.

## Local state and unavailable integrations

- A locally saved build is stored for that browser/device; it is not a cloud-saved private link, inventory hold, accepted quote or reserved installation.
- Build restoration must validate allowed fields and keep fitment/pricing pending. Client-supplied prices or approval flags are never trusted commercial authority.
- Contact fields and private notes require deliberate data-retention decisions. Do not describe a generic browser download as secure shared storage.
- An inquiry whose production destination is unavailable must keep the user's entries and offer working contact alternatives. It must not generate a fake server reference or claim the shop received the request.
- A direct visit to the confirmation route must not manufacture receipt. A future server must authorize access to any private request summary.
- No production emails, inquiries, HubSpot writes, tracking configuration, booking, payments or catalog updates are authorized by the existence of this local implementation.

The local server includes a separate `/api/preview-requests` adapter. Its source is designed to persist only allowlisted non-personal configuration context in `.preview-data`, with an idempotency key and token-protected status lookup. It deliberately discards names, contact details, company, free text, consent and uploads. Any UI using it must describe the result as a local preview receipt and explicitly state that nothing was sent to the shop. This source inspection is not evidence that durability, validation, retry or access controls have passed tests.

## Approval and evidence status

Prices, fitment, package recipes, media rights and policy terms remain owner-gated. `asset-manifest.json` records live-image provenance and explicitly marks publication rights pending. Existing prototype image provenance is recorded separately in `public/images/sources.json`.

`evidence/launch-integration.md` records the new implementation, verified IDs, local tests and outstanding delivery validation. The final verification report must distinguish native form rendering from actual HubSpot receipt and shop response. No live delivery is established by local tests.
