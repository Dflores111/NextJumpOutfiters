# Staff work-account setup

Google Workspace and Microsoft 365 can now be enabled together. The owner selected both, with Outlook/Microsoft primary and `120vc.com` as the confirmed company domain. Production staff access stays closed until company application credentials, exact named identities and roles are supplied and a real sign-in is verified. The local pilot deliberately uses a development identity.

## Accounts and permissions

| Role | Allowed work | Private access |
| --- | --- | --- |
| `catalog` | Review products, approve installed/parts prices, decide exact fitment | Product candidates, supplier/cost fields |
| `inventory` | Read source stock, count, receive, reserve and release stock | Inventory and minimal product names/IDs; no product costs or price approvals |
| `sales` | Read saved customer plans and their frozen estimates | No private cost/import access |
| `admin` | All of the above and activity review | Full operator access |

Assign individual people. Do not approve everyone in a domain. A person may receive multiple roles. User-supplied headers/body fields never establish an identity or role. The Worker verifies a signed session and rechecks the current named roster on every request; removing a person or changing roles takes effect immediately. Every operator write records the configured staff email and stable provider identity.

## Required private runtime settings

Configure these as server environment variables/secrets through Sites. They do not belong in Git, VITE variables, screenshots, public assets or chat messages containing credentials.

- `STAFF_ORIGIN`: exact HTTPS site origin, without a trailing slash. Register that origin plus `/auth/callback` as the provider's exact web redirect URI.
- `STAFF_PROVIDERS`: `microsoft,google`; `STAFF_PRIMARY_PROVIDER`: `microsoft`. Each configured provider is independently available; an incomplete provider never becomes an active button. Legacy single-provider `STAFF_PROVIDER` and `STAFF_CLIENT_ID` / `STAFF_CLIENT_SECRET` remain supported.
- `STAFF_MICROSOFT_CLIENT_ID`, `STAFF_MICROSOFT_CLIENT_SECRET`, `STAFF_GOOGLE_CLIENT_ID`, `STAFF_GOOGLE_CLIENT_SECRET`: separate company-owned web OAuth application credentials. Only `openid email profile` is requested; no mail, files, CRM or inventory provider scopes.
- `STAFF_SESSION_SECRET`: at least 32 random bytes, encoded for storage, generated privately. Rotate it to invalidate all existing login/session cookies.
- `STAFF_SESSION_EPOCH`: default `1`; increment to invalidate all sessions after an access/security change.
- `STAFF_ROSTER_JSON`: an array of exact named identities, each with `provider`, `email`, stable `subject`, and `roles`. Example shape only: `[{"provider":"microsoft","email":"person@shop-domain.example","subject":"actual-entra-object-uuid","roles":["inventory"]},{"provider":"google","email":"person@shop-domain.example","subject":"actual-google-sub","roles":["inventory"]}]`. The same email at two providers is two distinct identities; neither acquires the other's roles. Untagged entries are rejected when both providers are selected.
- Google: `STAFF_GOOGLE_DOMAIN`, plus each user's stable Google account `sub`. The ID token must have a verified email, exact Workspace domain, matching named email and stable subject. A domain hint alone does not authorize access. Obtain IDs through the shop's directory administrator or a trusted identity export.
- Microsoft: `STAFF_MICROSOFT_TENANT` must be the shop's exact tenant GUID, not `common`/`organizations`. Each roster `subject` is the user's Entra object ID (`oid`) in that tenant. Email/UPN claims do not grant access. Use a single-tenant web application and the directory's actual user object IDs.

The source follows [Google's OpenID Connect flow and identity guidance](https://developers.google.com/identity/openid-connect/openid-connect), [Microsoft's authorization-code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow) and [Microsoft's stable identity claims](https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference). JWT signature/claim validation uses the maintained [jose library](https://github.com/panva/jose).

## Controls and acceptance

The login uses authorization code with PKCE S256, signed ten-minute state/nonce cookies, fixed provider endpoints and server token exchange. ID tokens require a valid provider signature, exact issuer/audience, expiry, nonce and provider account restrictions. Provider access/ID tokens are not saved. Sessions expire within 30 minutes and within the ID-token lifetime; cookies are Secure, HttpOnly, SameSite=Lax and host-only. Mutations and logout require the exact origin. Logout clears this browser's app session; provider sessions remain governed by the shop's Google/Microsoft policy.

Before opening staff access, sign in with one actual administrator and one inventory-only account. Verify unauthorized/personal/external accounts are rejected; an inventory-only account cannot read cost records, approve prices, or open activity/sales data. Verify a real permitted change carries the named identity. Then test removal/role changes and session invalidation. Enforce the shop's MFA/device requirements in the identity provider.

Synthetic tests cover valid and denied Google/Microsoft claims, invalid/expired tokens, state, nonce, PKCE, session tampering, role revocation and server permissions. They do not establish that the shop's live provider registration or credentials work. No real-account login has been completed in this release.

## 120VC setup status — October 12, 2026

Microsoft's public OIDC discovery endpoint for `120vc.com` returns tenant `974b58d7-bb75-4452-9f95-099645250bfc`. This verifies discovery only; it does not prove tenant administrator access or authorize any employee.

Both application registrations use the exact redirect URI:

`https://next-jump-outfitters.diegoafmejia111.chatgpt.site/auth/callback`

The public `/staff` address now serves a branded, accessible sign-in page without sending the inventory application or any private records to anonymous visitors. When configuration is incomplete it returns 403, with disabled options labeled Setup pending. Every staff API remains protected independently. Sessions and login flows are bound to the provider, client ID and tenant/domain; changing that connection invalidates its cookies.

Outstanding: the owner and reviewers' exact email addresses, company-controlled Microsoft and Google application registrations, immutable provider identifiers and approved roles. Confirm whether Google accounts are managed Workspace accounts at `120vc.com`; a Google account using an Outlook email alone does not satisfy the required Workspace `hd` claim. No private catalog or synthetic inventory is seeded into hosted production D1 by this change.
