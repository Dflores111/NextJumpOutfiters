# Inquiry integration and sharing preparation

Updated October 4, 2026. The website remains an unpublished local preview. This work changes the local website, not the published Shopify storefront or HubSpot forms.

## Working implementation

- The local preview form remains the default. Its existing receipt still discards personal data and explicitly says nothing was sent.
- **Open the live shop form** loads the existing HubSpot form only after a visitor chooses it. The native form sends to Next Jump if that visitor submits. Switching back retains the preview draft for the current page visit.
- A native form failure leaves call, email and the existing live-site form available. Native validation, consent, spam controls and image upload remain HubSpot-managed.
- The builder, selected project and explorer feature produce a readable inquiry summary. It is added only to an empty native work-description field. The same summary is visible and copyable if the native integration cannot prefill; customer edits are never overwritten. Names, contact data, free text, build notes and alleged prices are not silently copied into that summary.
- The documented `onFormSubmitted` callback for the specific embed triggers one `nextjump:inquiry-success` browser event. No submitted field values are included. No tracking service is installed or called by this event, and a click/local preview save does not trigger it.
- The existing forms redirect to an older storefront page. The local embed overrides that with native inline confirmation; it does not change the form in HubSpot.
- Project and feature allowlists are enforced by the local receipt server as well as the UI.

## Verified account and forms

The connected account was verified as **Next Jump Outfitters, portal 24102432**. The read-only form search returned 87 forms, with complete pagination. These six published native forms are selected:

| Inquiry | Form | Verified record |
| --- | --- | --- |
| Flatbed | Flatbed Landing Leads — `b690f934-a789-43e4-aa17-665a6722d661` | [HubSpot record](https://app.hubspot.com/contacts/24102432/record/0-28/582943031347?utm_source=app_12360546_mcp&utm_medium=ai_agent&utm_campaign=fetch) |
| Camper | Flatbed For Campers Landing Leads — `405a62cd-cfac-41a6-b8d3-b74a859e9ef1` | [HubSpot record](https://app.hubspot.com/contacts/24102432/record/0-28/586074807477?utm_source=app_12360546_mcp&utm_medium=ai_agent&utm_campaign=fetch) |
| Work, installation, general | Install Intake Form - Flatbed and General — `62895413-4437-4f87-a4aa-b12ccb6a89d6` | [HubSpot record](https://app.hubspot.com/contacts/24102432/record/0-28/276545312061?utm_source=app_12360546_mcp&utm_medium=ai_agent&utm_campaign=fetch) |
| Boat detail | Boat Detail Form — `c086baf4-e59a-43ac-9c1f-3367969528c8` | [HubSpot record](https://app.hubspot.com/contacts/24102432/record/0-28/302633040247?utm_source=app_12360546_mcp&utm_medium=ai_agent&utm_campaign=fetch) |
| Marine | Marine Services Lead Form — `d1b51e71-d018-48de-a38f-78dbb08846b6` | [HubSpot record](https://app.hubspot.com/contacts/24102432/record/0-28/483567799893?utm_source=app_12360546_mcp&utm_medium=ai_agent&utm_campaign=fetch) |
| Vehicle detailing | Vehicle Wash & Detail Form — `8c5e34be-4e8f-4cca-a825-1dc0bb64fa8e` | [HubSpot record](https://app.hubspot.com/contacts/24102432/record/0-28/302659667804?utm_source=app_12360546_mcp&utm_medium=ai_agent&utm_campaign=fetch) |

The service and camper GUIDs also match the existing live storefront embeds. Hosted field definitions were read without submission. `hubspot-form-discovery.json` and `hubspot-field-discovery.json` contain the bounded findings. No credentials or customer records were saved.

The HubSpot connector reported incomplete onboarding. Onboarding was not changed; published forms and their definitions were nevertheless readable.

## Remaining production decisions

The actual portal and form IDs are no longer missing. What remains is the final intake design and operational verification. All selected native forms require email **and** phone and budget. Installation/flatbed forms also require detailed vehicle information, preferred start date and attribution; marine forms ask about the vessel instead. The proposed short local form accepts email **or** phone. Changing production requirements, adding dedicated context properties or consolidating native forms requires an approved schema/routing change. Existing consent is preserved rather than replaced.

Before making native forms the default production journey, verify a controlled real submission to the intended contact/ticket, owner notifications, upload handling, failure behavior, consent and exactly-once analytics with an explicitly authorized test recipient. No agent-generated live submission, email, ticket or notification was made in this task.

## Sharing and search configuration

Every rendered page now has escaped Open Graph and Twitter metadata, an intentional 1200×630 branded image, and absolute public URLs. Private quote/receipt/package routes have no canonical or `og:url`. The preview is still `noindex,nofollow` and its sitemap is empty.

`src/site-release.js` is the single configuration for public origin, social image and the approved indexing allowlist. `src/seo.js` validates it and produces page robots directives plus the sitemap; the server serves those resources dynamically. To release after deployment, list only approved public paths and then enable indexing. Unknown pages, private inquiries and unapproved pages remain non-indexable even with the global switch enabled. The social image URL will be publicly usable only once the image is deployed at the declared origin.

This configuration does not publish a theme or change DNS. The local server remains bound to localhost. Keep Shopify commerce and existing URLs while adapting the release candidate into an unpublished theme/staging target.

## Verification

- Seven additional Node tests passed: safe context carry-through, native summary privacy, no-overwrite prefill, array-like native form resolution, branded/escaped social tags, release allowlist exclusions, and configuration validation.
- Full local suite passed at 23 tests before the additional native callback regression; the updated integration test file passes all 7 tests. Final full suite/build results are recorded by the main task.
- Chrome browser verification on the separate local dev preview confirmed the actual native iframe description field `TICKET.content` contains the expected inquiry, Super Ute project and Camp setup feature. The native callback supplies an array-like HTMLFormElement; the adapter preserves that form instead of mistakenly selecting its first fieldset. Screenshot: `native-context-prefill.png`. No form was submitted and no live CRM receipt is claimed.

Native integration follows [HubSpot’s legacy form documentation](https://developers.hubspot.com/docs/cms/start-building/features/forms/legacy-forms), including the completed-submission callback and HubSpot-hosted embed script. These existing forms use that documented embed. Forms created with the newer editor require its distinct [global form events API](https://developers.hubspot.com/docs/api-reference/latest/marketing/forms/global-form-events); do not substitute a new form GUID without adapting and testing its editor integration.
