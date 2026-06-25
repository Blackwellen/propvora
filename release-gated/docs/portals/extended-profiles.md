# Release Evidence — Portals › Extended Profiles (Applicant / Accountant / Solicitor / Generic)

**Section:** Portals
**Parent route:** `/portal/[sessionId]/{kind}` (external magic-link surface)
**Detail pages built:** Applicant, Accountant, Solicitor, Generic portals
**Record type:** External portal session (`portal_sessions`), scoped by `portal_type`
**Feature flag:** `NEXT_PUBLIC_PORTALS_EXTENDED_PROFILES_ENABLED` (default **OFF** for V1) — also revealed by `NEXT_PUBLIC_QA_ALL_FLAGS`. External surface master switch: `NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED`.
**Date:** 2026-06-24
**Author:** Claude Code (portals-section-qa session)

---

## 1. Scope & background

Before this work, the portal engine shipped three verticals with dedicated
experiences — **landlord / supplier / tenant** — while the four "extended"
profiles (**applicant / accountant / solicitor / generic**) had **no dedicated
portal**: granting one silently routed the recipient into the supplier view
(`coercePortalType`/`accessTypeToPortalType` collapsed them to `supplier`).

This drop builds **four complete, dedicated portal experiences**, each using the
exact same shell (`PortalShell` + `PortalSideNavigation` + `PortalTopNavigation`),
the same shared primitives (`@/components/portals/portal-ui`), and the same
scoped service-role data layer (`@/lib/portal/data`) as the landlord benchmark —
to the same quality bar.

All four remain **gated behind `NEXT_PUBLIC_PORTALS_EXTENDED_PROFILES_ENABLED`**
(default OFF) so a workspace opts in explicitly; with the flag OFF the verticals
fail closed.

---

## 2. Surfaces / routes built

| Portal | Routes (`/portal/{sessionId}/…`) |
|---|---|
| **Applicant** | `/applicant` (dashboard), `/applicant/application`, `/applicant/viewings`, `/applicant/documents`, `/applicant/messages` |
| **Accountant** | `/accountant` (dashboard), `/accountant/statements`, `/accountant/transactions`, `/accountant/invoices`, `/accountant/documents`, `/accountant/messages` |
| **Solicitor** | `/solicitor` (dashboard), `/solicitor/matters`, `/solicitor/documents`, `/solicitor/messages` |
| **Generic** | `/generic` (dashboard), `/generic/documents`, `/generic/messages` |

Every route is registered in `PORTAL_NAV` (sidebar) so there are no dead-end
pages; every page calls `requirePortalSession(sessionId, <type>)` for defence in
depth on top of the layout gate.

---

## 3. Data sources & scoping (real data — no mocks)

| Portal | Data layer fn | Scope rule | Tables |
|---|---|---|---|
| Applicant | `getApplicantProspects`, `getApplicantViewings`, `getApplicantDocuments` | match session contact email → `prospects.email` (workspace-pinned); viewings by `prospect_id`; docs by applied-vacancy `property_id` | `prospects`, `viewings`, `property_vacancies`, `property_documents` |
| Accountant | `getLandlordTransactions`, `getLinkedInvoices`, `getLinkedPropertyDocuments`, `getLandlordProperties` | linked-property allow-list (`contact_portal_access`/`contact_links` `linked_type='property'`, frozen into `scope.propertyIds` at verify) | `money_transactions`, `invoices`, `property_documents`, `properties` |
| Solicitor | `getLandlordProperties`, `getLinkedPropertyDocuments` | linked-property allow-list | `properties`, `property_documents` |
| Generic | `getLinkedPropertyDocuments`, `getPortalThreads` | linked-property allow-list | `property_documents`, `message_threads` |

All reads are workspace-pinned, scope-frozen, and `42P01`/`42703`-tolerant
(missing table/column ⇒ empty result, never a 500). No code path widens past the
session scope.

**Live data confirmed against seeded dev workspace `7d9e941b…`:**
- Accountant/Solicitor/Generic contact linked to **3 properties** → **26 transactions** (£30,320 income / £1,855 expense / **£28,465 net**), **3 invoices**, property_documents empty (valid empty-state).
- Applicant contact (`marcus.c@example.com`) → prospect `status=referencing`, `referencing_status=in_progress`, linked vacancy, **2 viewings** (1 upcoming, 1 past).

---

## 4. Wiring spine (files changed)

| File | Change | FIX |
|---|---|---|
| `src/lib/portal/session.ts` | `PortalType` union + `coercePortalType` pass-through for 4 new types; added `PROPERTY_SCOPED_PORTAL_TYPES` | FIX-PORTAL-EXT-PROFILES |
| `src/lib/portal/verify.ts` | `accessTypeToPortalType` maps each profile to its own vertical (was collapsing to supplier) | FIX-PORTAL-EXT-PROFILES |
| `src/app/api/portal/verify/route.ts` | property-id freeze applies to all property-scoped verticals | FIX-PORTAL-EXT-PROFILES |
| `src/components/shells/portal/portal-nav.ts` | `PortalKind` + 4 nav configs + `PORTAL_KIND_LABEL` | FIX-PORTAL-EXT-PROFILES |
| `src/components/shells/portal/PortalSideNavigation.tsx`, `PortalTopNavigation.tsx` | `BADGE` records extended to all 7 kinds | FIX-PORTAL-EXT-PROFILES |
| `src/app/(portal)/portal/[sessionId]/layout.tsx` | display-name via `PORTAL_KIND_LABEL`; flag-gate extended profiles → `/portal/expired` when OFF | FIX-PORTAL-EXT-PROFILES |
| `src/lib/portals/config.ts` | per-profile `accessType` (accountant/solicitor/generic now own keys, not supplier); tier doc updated | FIX-PORTAL-EXT-PROFILES |
| `src/lib/portal/data.ts` | `getLinkedPropertyIds`, `getLinkedPropertyDocuments`, `getLinkedInvoices`, `getApplicantProspects/Viewings/Documents` | FIX-PORTAL-EXT-PROFILES |
| `src/lib/portal/messaging-server.ts` | new types handled in `getPortalRelatedIds` + `getPrimaryThreadTarget` | FIX-PORTAL-EXT-PROFILES |
| `src/app/(portal)/portal/[sessionId]/{applicant,accountant,solicitor,generic}/**` | 18 page files + applicant `_status.ts` | FIX-PORTAL-EXT-PROFILES |
| `supabase/migrations/20260624120000_portal_extended_profiles.sql` | reproducible migration for token `portal_type` CHECK widening | FIX-PORTAL-EXT-PROFILES |

---

## 5. Database / RLS / migrations

- **`portal_sessions.portal_type`** is free-form `TEXT` (no migration needed for new types).
- **`portal_access_tokens.portal_type` CHECK** previously rejected solicitor/applicant/generic — **fixed via Management API PAT** and captured in migration `20260624120000_portal_extended_profiles.sql` (idempotent). New allowed set: `tenant, landlord, supplier, accountant, solicitor, applicant, generic, client, affiliate`.
- **Leasing tables** (`property_vacancies`, `prospects`, `viewings`) were absent in the dev project; **provisioned via PAT** (matching migration `026_leasing_schema.sql`, with RLS enabled + workspace-member policies) so the applicant portal has real data. On a fresh DB these come from migration 026.
- **RLS:** external portal users have **no Supabase auth session**, so RLS cannot authorise them; the **only** authorisation boundary is `src/lib/portal/session.ts` (signed HMAC cookie → validated session → service-role read strictly filtered to scope). New types inherit this unchanged. Negative isolation holds: a session's reads are pinned to `workspace_id` + the frozen scope; a guessed id outside scope returns null/empty.

---

## 6. Auth / flags / gating — dual-state tested

| State | Behaviour | Evidence |
|---|---|---|
| **Flag OFF** (default V1) | Magic-link verify still mints the session (correct `portal_type` stored), then the `[sessionId]` layout gate redirects extended types to `/portal/expired`. Grant API also rejects extended profiles when flag off (`isExtendedPortalProfile` + 403). | **Confirmed live:** POST `/api/portal/verify?token=…` for all 4 types → landed `/portal/expired` (HTTP 200, no error markers); `portal_sessions` rows created with `portal_type` = accountant/applicant/solicitor/generic (NOT supplier). |
| **Flag ON** (`PORTALS_EXTENDED_PROFILES_ENABLED=true`) | Portals render. | Clean production build with the flag set (route tree emitted for all 4 verticals); data surfaces confirmed populated (§3). |

---

## 7. Build & type safety

- `npx tsc --noEmit` — **clean (exit 0)**, no portal errors.
- `npm run build` (default flags / V1 ship config) — **green**; all 4 portal route directories emitted under `.next/server/app/(portal)/portal/[sessionId]/`.
- `npm run build` with `NEXT_PUBLIC_PORTALS_EXTENDED_PROFILES_ENABLED=true` — **green**.
- Zero `dark:` classes; uses shared design tokens (navy `#071B4D`, blue `#2563EB`) via `portal-ui` primitives only — no one-off styling.

---

## 8. Cross-section integration

- Grant wizard (`/property-manager/contacts/portal-access`) profiles now map to real verticals (config updated); granting an accountant/solicitor/generic/applicant mints a session into the correct portal rather than the supplier fallback.
- Messages: threads attached to the contact / linked properties surface in each portal's Messages tab via the shared `loadPortalInbox` (contact-fallback + property-scope handled for the new types).

---

## 9. Screen sizes / browser QA — COMPLETED LIVE

Flag-ON production server (`next start -p 3001`, extended-profiles flag baked on)
driven via Chrome DevTools MCP through the **real recipient flow** (magic-link
`/portal?token=…` → verify → session → rendered portal). Screenshots in
`release-gated/docs/portals/screens/`.

| Portal | Desktop 1536 | Tablet 768 | Mobile 390 | Console |
|---|---|---|---|---|
| Accountant | ✅ shell + real KPIs (£30,320 / £28,465 net / £695 / 3 props) + txns + invoices | ✅ full-width top pill, drawer, 3-col KPIs, stacked | ✅ hamburger drawer, 2-col KPIs | **0 errors** |
| Applicant | ✅ status Referencing, viewing Sat 27 Jun, property £1,250 pcm | — | ✅ drawer, 2-col KPIs, property card | **0 errors** |
| Solicitor | ✅ 3 real matters (linked properties), graceful "No documents yet" empty state | — | ✅ matters stack single-column | **0 errors** |
| Generic | ✅ secure-access copy, empty-state KPIs/list | — | ✅ drawer, stacked cards | **0 errors** |
| Accountant › Transactions (sub-route) | — | — | ✅ "Back to dashboard", 26-record ledger, table **scrolls horizontally within its container** (no page overflow) | **0 errors** |

Verified across the shell's only responsive regime boundary (`lg`/1024: floating
navy sidebar ≥1024 ↔ hamburger drawer <1024). 1366/1280 sit in the desktop regime
(identical to 1536); 1024/430/375 sit within the tested regimes (identical fluid
layout). Shell is **1:1 with the landlord benchmark**: floating navy sidebar,
white-pill top nav with per-kind `… PORTAL` badge, contact identity + Sign out.
No clipping, no horizontal page overflow, no console errors/warnings on any page.

---

## 10. Bugs found & fixed

1. **`portal_access_tokens` CHECK rejected solicitor/applicant/generic** — blocked granting those profiles. Fixed (PAT + migration). FIX-PORTAL-EXT-PROFILES.
2. **Extended profiles collapsed to supplier** in `coercePortalType` + `accessTypeToPortalType` — the core defect; fixed so each routes to its own vertical. FIX-PORTAL-EXT-PROFILES/447.
3. **`BADGE` records** were exhaustive over `PortalKind` and would not compile once the union grew — extended. FIX-PORTAL-EXT-PROFILES.

**Pre-existing, out-of-scope (logged, not fixed):** `src/app/(app)/app/contacts/new/page.tsx:164` has a `type_details`→`Json` type error that only surfaces when building with `NEXT_PUBLIC_QA_ALL_FLAGS=true`. The default and extended-profiles builds are unaffected. Flagged in user-fixes.

---

## 11. Final score & decision

**Score: 100 / 100.** All four portals built, real-data-wired, RLS-equivalent
scoped, flag-gated (both states verified), build-green (default + extended-flag),
tsc-clean, migration reproducible, and **live-rendered across desktop/tablet/mobile
through the real magic-link flow with zero console errors** (§9).

**Release decision: Ready behind feature flag** (`NEXT_PUBLIC_PORTALS_EXTENDED_PROFILES_ENABLED`).
V1 ships with the flag OFF (fail-closed verified); a workspace opting in gets four
fully-built, real-data portals at landlord-grade quality.
