# NJO 5.0: combined marketing and builder review

2026-10-29 · Local integration complete · **Not deployed**

- Preview: http://127.0.0.1:4187/
- Worktree: `/Users/diegoflores/Documents/Next Jump/next-jump-integrated`
- Branch: `codex/njo5-builder-integration`
- Latest builder / backend input: `15a55db2bcc9e474c71b4fdb4d96889325dc6f65`, fetched from GitHub main and rechecked after validation.
- Approved marketing input: `995fe1f`, including the earlier marketing, photography, founder and project-story commits.

This supersedes the earlier notes saying the marketing branch had not been combined with the newer builder. The original marketing branch and main checkout remain unchanged. Publication has not been performed.

## Combined behavior

The approved cinematic heroes, starting paths, typography, photography, service interactions, project stories, J. Scott section and pit-crew copy now run alongside the latest separate Flatbeds and Upfitting journeys.

Three overlapping files were resolved deliberately:

- `App.jsx` uses the approved marketing navigation and four added marketing pages while retaining the latest `BuilderJourneys.jsx`, Tacoma pilot, vehicle aliases and protected staff/demo routing. Home and service-header quote actions still reach the embedded request section.
- `HomeExperience.jsx` keeps the approved marketing layout and copy. Its closing section uses the current on-demand native inquiry. The service hub also retains that inquiry behavior and the latest **Plan my upgrades** entry.
- `Inquiry.jsx` retains current live-default behavior, the explicit `preview=1` test mode, vehicle/service prefill, visitor-edit safeguards, form loading, retry/contact alternatives and the three next-step explanations. Presentation changes add a contextual page H1 and allowlisted marketing interest labels. Complete-build, care and other named interests enter the existing general-inquiry contract, with their label in the native project description.

`LeadSection` accepts optional heading/description copy so the newer inquiry can keep the approved marketing language. It still loads the native form only after **Start my request**, then moves keyboard focus to its heading. There is one `start-project` anchor per page.

Flatbed marketing and menu entries now explicitly pass `kind=flatbed`. Upgrade entries pass `kind=vehicle`. This prevents a visitor entering through a flatbed page from accidentally reopening an upfitting draft. Existing use/camper query context remains in the links; builder logic was not changed.

## Backend and data preservation

The protected-file comparison in `evidence/njo5-combined/backend-preservation.json` verifies unchanged builder, catalog, native form, HubSpot/inquiry contracts, server, schema/migrations, build scripts, metadata/indexing policy and dependencies against the builder input above. Staff, pricing, package approval, inventory, purchasing, job and authentication implementations were not edited.

Local preview storage is separate: `/private/tmp/njo-combined-995fe1f-15a55db`. It started empty and uses the existing local migration path. A synthetic anonymous truck plan was saved/reopened there. No production database, real stock, package publication, real customer details or CRM records were changed. No live form was submitted. Store and policy links still lead to Shopify.

The empty local catalog correctly shows a shop-estimate fallback rather than displaying an unapproved package price. Published-package and saved-quote behavior is covered by the existing automated suite using isolated fixtures; the local preview is not a copy of production catalog data.

## Validation

| Check | Result |
| --- | --- |
| Existing regression suite | **147 passed, 0 failed** |
| New read-only marketing/builder integration audit | **4 checks passed** |
| Hosted production build | Passed; existing Vite size advisory remains (508.21 kB main client chunk before gzip) |
| Route audit | **53/53 routes**, 3,415 link/control instances, 554 static action expressions, 84 images; **0 failures / 0 warnings** |
| Responsive browser matrix | **36 combinations** at 320, 390, 768 and 1440px; one H1, no horizontal overflow or broken loaded images |
| Browser diagnostics | No console warnings/errors in the combined preview tab |

The responsive matrix covers Home, Flatbeds, Campers, Work & Business, Installation Services, Complete Builds, Why NJO, About and the explicit test inquiry. Builder review and the native flatbed form were also checked on a 390px phone; the form iframe itself had no horizontal overflow.

Fresh browser walkthroughs:

- **Home:** header quote → embedded request → on-demand shop form. Focus moved to the native form heading.
- **Installation / Upfitting:** service hub → Plan my upgrades → 2019 Toyota Tacoma → Overlander Lite → correct unpriced fallback. Reload, browser Back and Forward restored the chosen step/use. The inquiry carried the truck/use; the actual native fields showed Toyota, Tacoma, 2019 and **Suspension** selected.
- **Flatbed:** enter from marketing after an upfitting draft → correct Flatbeds direction → 5 ft bed → platform size → kitchen insert automatically includes required upper boxes → review → save and reopen local version 1 → itemized-estimate inquiry. The native form received Toyota, 2019 and the 5 ft bed, with the plan/equipment context.
- **Camper:** Flatbed camper card entered the Flatbeds builder with its existing camper query context.
- **Work truck:** the primary quote action opened the work inquiry with its specific heading/context.
- **Complete build:** the primary conversation action opened the current native form, whose description included **Project interest: A complete build**.
- **Test inquiry:** only `preview=1` exposed the non-sending form. Empty submission showed validation feedback and focused the first invalid field. No contact details were entered or saved.
- Mobile menu Escape closed the menu and returned focus. Motion paused and resumed correctly.

Screenshots, browser measurements, protected-file comparison, route reports and logs are saved in [`evidence/njo5-combined/`](../evidence/njo5-combined/). Older evidence folders describe their original isolated passes and are retained as history. Root audit reports were restored after archiving these combined results.

## Reproduce locally

From this worktree:

```sh
PORT=4187 PREVIEW_DATA_DIR=/private/tmp/njo-combined-995fe1f-15a55db npm run dev
```

With the preview running:

```sh
npm test
npm run build
AUDIT_BASE_URL=http://127.0.0.1:4187 node tests/audit-routes.mjs
AUDIT_BASE_URL=http://127.0.0.1:4187 node tests/audit-marketing-builder.mjs
```

The new integration audit reads rendered pages from localhost and checks the existing journey interface, embedded request gate, native/test distinction and interest allowlist. It does not click controls or submit forms. Browser verification above covers the interactive behavior.

## Remaining review boundaries

No deployment, remote push or main-branch update was made. A future publication should use this combined branch, with a fresh comparison if the builder branch advances, rather than the older standalone marketing snapshot.

Live inquiry delivery/ownership remains unverified because no lead was submitted. Real parts, package pricing, fitment and shop operations still require their existing staff reviews. The build-size advisory remains; this pass does not claim measured performance or conversion improvement.

UX/UI Pro Max's mobile Back Button guidance was used as a check to preserve history and verify Back/Forward behavior. No replacement design system, component library or dependency was introduced.
