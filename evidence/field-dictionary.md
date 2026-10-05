# Inquiry field dictionary

This documents the implemented local preview, not a configured HubSpot integration. The button is **Save preview request**. A successful save means a durable non-personal receipt on this computer. Nothing is delivered to Next Jump.

All HubSpot mappings are **pending**. No portal ID, form ID, subscription ID or property name is invented. The authoritative machine-readable record is `forms-manifest.json`.

## Required inputs by path

| Context | Required beyond first name and the chosen email or phone channel |
| --- | --- |
| Flatbed | Recognized saved truck, vehicle description, or vehicle-help checkbox; intended use including Not sure. |
| Camper | Recognized saved truck, vehicle description, or help; camper type including Not decided. |
| Work / business | Recognized saved truck, vehicle description, or help; work/equipment goal; vehicle count including Not sure. Company is optional. |
| Service | Preselected/editable service; relevant vehicle, vessel or trailer description, or help; service goal. Boat detailing and marine paths use vessel labels. |
| General | Inquiry topic and short message. No truck, bed length or vehicle requirement. |

The Super Ute project reference can accompany these paths. Builder entries reuse anonymous `nj-build-v1` state. Invalid builds must be reviewed or explicitly excluded before submission.

## Fields

| Internal key | Visible label / input | Required, validation and prefill | Reason / preview retention |
| --- | --- | --- | --- |
| context | Inquiry path (route_context) | always. Allowlist: flatbed, camper, work, service, general. Invalid query context defaults to flatbed; invalid POST is rejected. Prefill: context query parameter; default flatbed. | Select the appropriate intake questions. Destination: summary.context. |
| service | What can we help with? (select) | context == service. One of the service IDs in this manifest. Prefill: service query parameter; recognized ID or exact label. | Route the requested service. Destination: summary.service for service only. |
| project | Inspired by the Super Ute build (route_context) | optional. Only super-ute or empty is accepted. Prefill: project=super-ute query parameter. | Preserve the project that inspired the inquiry. Destination: summary.project. |
| topic | What is your question about? (select) | context == general. One of Flatbed question, Installation or service, Parts or order support, Visiting the shop, Something else. Prefill: none. | Route general inquiries without requiring a truck. Destination: summary.topic for general only. |
| firstName | First name (text) | always. Nonempty after trimming. UI maximum 80 characters; server scalar maximum 180. Prefill: browser given-name autofill only. | Demonstrate contact validation; not used for delivery in this preview. Destination: discarded. |
| preferredContact | Preferred contact method (radio) | always. email or phone. Defaults to email. Prefill: default email. | Require one usable channel rather than both. Destination: discarded. |
| email | Email address (email) | preferredContact == email. Basic non-whitespace local@domain.suffix check; maximum 254 characters. Prefill: browser email autofill only. | Demonstrate email contact validation. Destination: discarded. |
| phone | Phone number (tel) | preferredContact == phone. At least 7 digits; permits a leading plus, digits, spaces, parentheses, hyphens and dots. UI maximum 32 characters; validation examines up to 32. Prefill: browser tel autofill only. | Demonstrate phone-only contact validation. Destination: discarded. |
| vehicleDetails | Truck or vehicle details / Vessel details / Trailer details (text) | flatbed, camper or work without a recognized saved truck, OR service; waived by needVehicleHelp. Nonempty unless help is selected. Maximum 180 characters. No mandatory truck bed field for marine, boat-detail, trailer or general paths. Prefill: none; omitted from view when a recognized saved truck is shown. | Describe the relevant vehicle or vessel when no build supplies it. Destination: discarded. |
| needVehicleHelp | I need help identifying my vehicle / my vessel (checkbox) | optional alternative to vehicleDetails. Boolean. Defaults false. Prefill: default false. | Allow visitors to proceed without identifying technical details. Destination: summary.needsVehicleHelp. |
| intendedUse | What do you have in mind? (select) | context == flatbed. Overland, Camper, Work / business, General use, or Not sure. Prefill: mapped from saved build.use when present. | Understand the flatbed use. Destination: summary.intendedUse for flatbed only. |
| camperType | What kind of camper? (select) | context == camper. Not decided, Topper, Slide-in, or Flatbed camper. Prefill: mapped from saved build.camperType when present. | Prepare a relevant camper discussion without assuming ownership. Destination: summary.camperType for camper only. |
| workGoal | What does your truck need to carry or do? (textarea) | context == work. Nonempty. UI maximum 1000 characters; server scalar maximum 1500. Prefill: none. | Understand the work and equipment. Destination: discarded. |
| vehicleCount | How many vehicles? (select) | context == work. 1, 2–5, 6+, or Not sure. Prefill: none. | Distinguish single-vehicle and fleet planning. Destination: summary.vehicleCount for work only. |
| company | Company (text) | optional; displayed for work. UI maximum 120 characters; server scalar maximum 180. Prefill: browser organization autofill only. | Allow a business identity without requiring one from sole proprietors. Destination: discarded. |
| message | How can we help? / What would you like help with? / Anything else we should know? (textarea) | general or service; optional otherwise. Nonempty for required paths; maximum 1500 characters. Prefill: none. | Collect the question or service goal. Destination: discarded. |
| marketingOptIn | Keep me informed about Next Jump news (checkbox) | optional. Boolean; unchecked by default. UI explicitly says no subscription is created. Prefill: default false. | Demonstrate separate optional marketing preference; does not establish production consent. Destination: discarded. |
| build | Your saved configuration (structured_saved_build) | optional; if included must pass domain validation. Version 1, validated vehicle/use/camper/selected IDs and dependencies. No client prices accepted. Unknown truck labels reduced to Other / not sure; no free-text notes retained. Prefill: nj-build-v1 localStorage for flatbed/camper/work only. | Preserve an anonymous configuration instead of restarting. Destination: summary.build with allowlisted fields only. |

Every field’s production HubSpot property remains **pending verified inspection**. Retained fields go only to the local receipt’s structured summary. All discarded fields are transient browser/server memory; they are not written to disk, local/session storage, URLs or analytics.

## Receipt and failure contract

- `POST /api/preview-requests` requires same origin, JSON and an opaque `Idempotency-Key`. Limit: 16 KiB, 30 requests/minute/address, 500 saved receipt files. Unknown fields and client totals are rejected.
- `GET /api/preview-requests/status` requires `Authorization: Bearer <opaque token>`. The same token reconciles a timed-out POST and authorizes the confirmation screen. Tokens never enter a URL.
- A save writes an owner-only file under private `.preview-data/`. It retains receipt ID, timestamp, a fingerprint of the non-personal summary and allowlisted configuration/context. No price or final-fitment approval is inferred.
- Truck labels are canonical route labels; unknown labels become Other / not sure. Notes and free text are never retained. The token itself is absent from file contents; its hash names the file.
- Contact details, company, vehicle prose, work goal, message and marketing choice are discarded. The optional unchecked marketing box creates neither a subscription nor a consent record.
- Receipt files remain locally until manually cleared. No automatic expiry or production retention policy is implemented. Anonymous build state stays in localStorage; only the receipt token goes to sessionStorage.
- Identical retries reuse the same receipt; different non-personal content with the same token is rejected. A new inquiry uses a new token. Storage failure shows failure, preserves form entries and never claims receipt.
- The POST times out after 10 seconds, then checks status before retry. Status checks have a 6-second timeout. A direct confirmation-page visit without a receipt says no request was submitted.
- The UI includes direct phone and contact-page fallbacks. It exposes no live HubSpot, email, CRM, payment or tracking delivery.

## Production owners and remaining decisions

| Owner | Required before live delivery |
| --- | --- |
| Andrew | Approved native HubSpot form family/embedded form UI, editor-version event handling, user-facing failure behavior. |
| Diego | Verified portal/form/property definitions and mappings, protected configuration references, attribution and confirmed-success analytics, CRM infrastructure. |
| Nick | Approved price/fitment evidence and correct sales/contact/ticket/deal routing; technical validation must come from qualified evidence. |
| Tally | Privacy, retention, consultation/commercial terms and consent treatment. |
| Andrew + Diego | Approved test portal and end-to-end receipt/retry tests. Confirm whether the approved form supports phone-only inquiries; otherwise explain the email requirement and retain a direct phone alternative. |

The preview intentionally has no saved-build email delivery, uploads, public share links, consultation booking/payment, or CRM object creation. Production must align final UI/server length limits: preview UI limits first name to 80, work goal to 1000 and company to 120 characters while the general server caps are 180, 1500 and 180 respectively. All three are currently discarded.

Verification: `tests/server.test.mjs` passed 10 scoped tests with loopback socket permission. These establish local validation/storage behavior, not HubSpot installation or end-to-end production delivery.
