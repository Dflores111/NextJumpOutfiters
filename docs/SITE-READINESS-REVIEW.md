# Site readiness review

Reviewed October 29, 2026. This is a software and customer-journey check. It is not shop approval of real parts, prices, inventory counts or installation procedures.

## Improvements shipped

- Customer quote links open the existing live shop inquiry form. The non-sending test form is available only with `preview=1` on the inquiry URL and identifies itself as a test.
- Homepage and service-page inquiry sections have one clear **Start my request** action. The embedded form loads after that action, keeping the initial page lighter. Keyboard focus moves to the form heading.
- The quote page explains what happens next: review the truck and goals, confirm scope and estimate, then agree on the next step. Sending a request does not book an appointment.
- Known vehicle make, model, year and bed length carry from a completed builder plan into matching empty form fields. The selected service carries into the shop form when that option exists. Contact details and consent are never filled automatically.
- Project and saved-quote details that arrive after the form loads can update the app's own prefill. Visitor edits are preserved. No form is submitted automatically.
- A failed form load offers a retry and direct call/email alternatives. The no-JavaScript fallback also points to those contact methods.
- Mobile navigation identifies the current page for assistive technology.

The existing HubSpot form is still the inquiry destination. Automatic ticket/deal/job synchronization remains deferred.

## Verification

- Automated regression suite: **135 passed, 0 failed**, covering catalog publication, quote snapshots, job/stock transactions, authentication and the new prefill behavior.
- Full local route audit: **49 routes**, all local links/anchors and **87 image resources**, with no failures or warnings. Machine-readable results are in `evidence/route-audit.json` and `evidence/route-action-registry.json`.
- Fresh browser walkthrough: homepage quote CTA → embedded request; installation navigation → suspension service → quote; Flatbeds → 2019 Toyota Tacoma / 5 ft bed → platform → review → itemized-estimate inquiry.
- Builder Back/Forward preserved the plan. The live form displayed the selected truck's make, model, year and bed length; the suspension form selected Suspension.
- Phone menu opened, Escape closed it and returned focus to the menu button. Keyboard activation opened the embedded form and focused its heading.
- Responsive page checks at 320, 390, 768 and 1280 pixels found no page-width overflow on the checked inquiry and navigation views.
- Local and hosted production builds passed. Live publication is verified separately after deployment.

No real inquiry was submitted during this review. No supplier order was sent, real stock changed, package published, permission changed or HubSpot job integration enabled. The retry control was added; a deliberate third-party outage was not injected into the live form.

## Before a full business launch

1. **Nick/Jay:** review and release real Tacoma packages. The live database currently has three working package records and no active package releases; customer fallback estimates remain appropriate.
2. **Shop team:** reconcile opening stock and perform the short first-time-employee trial in `SHOP-USABILITY-REVIEW.md` using sample data before operating real jobs.
3. **Owner/team:** send one authorized real inquiry and confirm its receipt, ownership and response routing. This review verified loading and context transfer, not delivery by submitting a lead.
4. **Owner:** decide the final public domain and which pages to index. Search indexing remains deliberately disabled for this review site; existing retail and policy links still hand off to the current store.

The existing intake form still asks for substantial vehicle information. Simplifying its required fields is a separate CRM/form decision; this release reduces repetition without silently changing those requirements.
