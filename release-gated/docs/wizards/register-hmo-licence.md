# Release Evidence — Register HMO Licence wizard

- **Wizard:** Register HMO Licence
- **Route:** `/property-manager/legal/hmo-licences/new` (file: `src/app/(app)/app/legal/hmo-licences/new/page.tsx`)
- **Parent section:** Legal → HMO Licences
- **Pattern:** Full-page multi-step wizard, **5 steps**, shared `WizardShell` primitive (premium side-step rail on desktop, step dropdown < lg). **Replaces the previous single popover modal.**
- **Date:** 2026-06-25
- **Build:** `npm run build` clean (route registered as `/app/legal/hmo-licences/new`). `tsc --noEmit` clean.

## What changed this drop
The wizard was previously a **single cramped popover** (`RegisterLicenceModal`) opened from the list page. Per the Wizard Styling Rule ("complex/commercial workflows must not open in cramped drawers; use the shared `WizardShell` with side-step nav"), it has been rebuilt as a proper full-page multi-step wizard, and the old modal removed entirely (no dead code / no orphan launch path).

It now also captures the **full `hmo_licences` record** — the popover only collected 7 fields and silently dropped `arrangement_type`, `max_households`, `occupancy_current`, `conditions`, `document_path`, `renewal_reminder_days`.

## Steps tested (each individually)
| Step | Fields | Persisted column(s) | Notes |
|---|---|---|---|
| 1 Property & Type | property*, licence_type*, arrangement_type | property_id, licence_type, arrangement_type | Advance gated on property selected. Empty-state + loading handled. |
| 2 Licence Details | licence_number, issuing_council, issue_date, expiry_date*, renewal_reminder_days, r2r_agreement_end (conditional) | licence_number, issuing_council, issue_date, expiry_date, renewal_reminder_days, r2r_agreement_end | Advance gated on expiry present **and** expiry ≥ issue. `r2r_agreement_end` only shown when arrangement = rent-to-rent. |
| 3 Occupancy | max_occupants, max_households, occupancy_current | max_occupants, max_households, occupancy_current | Inline validation: positive whole numbers; current ≥ 0. |
| 4 Conditions & Document | conditions[] (add/remove), licence document upload | conditions (jsonb), document_path | Upload via `EvidenceUpload` (R2-backed, workspace-scoped). |
| 5 Review | read-only summary | — | Reflects all entered values incl. conditions list; review-only disclaimer. |

## Launch points tested / rewired
- **Header "Register Licence"** (list page) → `router.push("/property-manager/legal/hmo-licences/new")`.
- **Empty-state "Register First Licence"** → same route.
- **Copilot deep-link** `?new=1` (`src/lib/ai/site-map.ts`) → list page now `router.replace`s to the wizard route.
- **Property-detail HMO tab** (`src/components/portfolio/property-detail/HmoTab.tsx`) already linked to `/hmo-licences/new?propertyId=…` — that link was a **404 before this drop** (no `/new` route existed) and now resolves; the wizard reads `?propertyId` and prefills/locks-onto the property on Step 1.
- **Direct URL** (authenticated) renders Step 1; unauthenticated bounced by `src/proxy.ts` auth guard.

## Validation
- Property required (Step 1 gate + submit guard).
- Expiry date required; expiry **≥ issue date** (Step 2 gate + `min` attr + submit guard).
- max_occupants / max_households: integer ≥ 1; occupancy_current: integer ≥ 0 (Step 3 inline + submit guard).
- On any submit-time failure the wizard jumps back to the offending step and shows the error.

## Drafts, persistence & double-submit
- `useWizardDraft("register-hmo-licence", …)` persists in-progress state to localStorage; restored-draft banner with Discard; `clearDraft()` on success. Cancelling never creates a partial DB row (draft is client-side only).
- Submit button shows a saving spinner and is disabled while pending → no double-submit.

## Data / Supabase
- **Table:** `hmo_licences` (migration `20260614130000_legal_tables.sql` + hardening `20260615040000_legal_hardening.sql`).
- **Insert** via `useCreateHmoLicence` (anon client → RLS enforced). `InsertHmoLicence` extended with `conditions?: string[]`, `document_path?`, `renewal_reminder_days?`.
- **NOT-NULL jsonb safety:** `conditions` is `jsonb NOT NULL DEFAULT '[]'` — the wizard **omits** the field unless it has entries (never sends `null`), per the project NOT-NULL jsonb insert rule (avoids 23502/HTTP400).
- **Cache:** `useCreateHmoLicence.onSuccess` invalidates `["legal-hmo-licences", workspaceId]` → list + KPIs refresh immediately; success redirects to the new detail page.
- **RLS:** `hmo_licences_workspace_member` (FOR ALL, USING + WITH CHECK on `workspace_members`). Insert is workspace-scoped; cross-workspace insert blocked by WITH CHECK.

## i18n / jurisdiction
- Wrapped in `LegalJurisdictionGate module="hmo"` **and** covered by the parent `hmo-licences/layout.tsx` gate → for any non-England-&-Wales workspace (Scotland, NI, other, sanctioned) the wizard never renders, including by direct URL; the jurisdiction panel is shown instead. No E&W statute leaks to other jurisdictions. See `legal-overview` evidence + `register-hmo-licence` user-fixes for the cross-jurisdiction record-keeping note.

## Responsive / a11y
- `WizardShell`: side-step rail ≥ lg, step `<select>` dropdown < lg; sticky-free footer with Back/Continue/Register. Labelled inputs, `min`/`step` on numerics, `aria-label`s on remove buttons, focus-ring on all controls. Tested via build + code review at the 8 standard breakpoints' layout classes.

## Bugs found & fixed (see implementation-fix-log)
1. **Cramped popover, not a wizard** (user-reported) → rebuilt as 5-step full-page `WizardShell`.
2. **Silent data loss** — `arrangement_type`, `max_households`, `occupancy_current`, `conditions`, `document_path`, `renewal_reminder_days` were never captured → now collected and persisted.
3. **404 launch point** — property-detail HMO tab linked to a non-existent `/new` route → route now exists + honours `?propertyId`.
4. **No date validation** in the old modal → expiry ≥ issue enforced.
5. **Dead-code removal** — `RegisterLicenceModal` + helpers deleted; unused imports pruned.

## Remaining manual actions
- None for England & Wales. Cross-jurisdiction (Scotland/NI) HMO registration is a tracked V1.5 enhancement — see `release-gated/user-fixes/register-hmo-licence.md`.

## Score: 100 / 100 (England & Wales)
**Release decision: Ready for release.** (Behind the existing `legalSection` flag + E&W jurisdiction gate.)
