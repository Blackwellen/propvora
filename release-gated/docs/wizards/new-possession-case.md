# Release Evidence — New Possession Case wizard

- **Wizard:** New Possession Case (Section 8 / Section 21)
- **Entry route:** `/property-manager/legal/possession/new` → redirects to `/property-manager/legal/possession/new/select-tenancy`
- **Parent section:** Legal → Possession
- **Pattern:** Full-page multi-step wizard, **5 steps**, `PossessionWizardShell` (top stepper on md+, compact progress on mobile). Review-only — Propvora never serves, files, or validates notices.
- **Date:** 2026-06-25
- **Build:** `npm run build` clean. `tsc --noEmit` clean.

## Steps & files
| Step | File | Purpose |
|---|---|---|
| 1 Select Tenancy | `new/select-tenancy/page.tsx` | Pick live tenancy → creates the draft `possession_cases` row, redirects with `?case=`. |
| 2 Select Grounds | `new/select-grounds/page.tsx` | Choose route (S8/S21) + S8 grounds; **NEW** rent-arrears capture; live validity checks. |
| 3 Review Evidence | `new/review-evidence/page.tsx` | Upload/record evidence chain (R2) against the case. |
| 4 Notice Preview | `new/notice-preview/page.tsx` | Draft notice summary + "Generate Draft Court Bundle". |
| 5 Record Service | `new/record-service/page.tsx` | Log offline service (method/date/recipient/proof) → opens the case detail. |

## What changed this drop
**Rent arrears were never captured.** The case was created with a default `ground` but `arrears_amount` / `arrears_weeks` stayed `null`, so the Notice Preview and the Court Bundle always showed **"Rent Arrears £0"** for Section 8 Ground 8/10/11 — the single most important figure on an arrears notice.

- Added a **Rent Arrears (review-only)** panel to Step 2 (Select Grounds), shown when route = Section 8 **and** a rent-arrears ground (Ground 8 / 10 / 11) is selected.
- Captures `arrears_amount` (£) and `arrears_weeks`; validated (≥ 0, numeric); prefilled from any value already on the case; persisted via `useUpdatePossessionCase`.
- Cleared automatically when the route no longer relies on arrears (e.g. switched to Section 21).
- **Notice Preview** now hides the Rent Arrears row entirely for Section 21 (no-fault) and shows the real amount + weeks for Section 8.
- The **Court Bundle** (`openCourtBundle`) now receives the real `arrears_amount`.

## Launch points tested
- Possession list "Start Case" CTA → Step 1.
- Empty-state CTA → Step 1.
- Direct URL `/legal/possession/new/*` (authenticated) → renders; unauthenticated bounced by `src/proxy.ts`.

## Fields & validation
- Step 1: tenancy required (Next disabled until selected). Case row created with `workspace_id`, `tenancy_id`, `property_id`, `contact_id`, `ground`, `status='gathering_evidence'`.
- Step 2: S8 requires ≥ 1 ground; arrears amount/weeks validated (≥ 0); Next disabled on invalid arrears. Persists `ground`, `notice_type`, `grounds` (jsonb), `notice_period_days`, `validity_snapshot`, `arrears_amount`, `arrears_weeks`, `status='drafting_notice'`.
- Step 5: service method (hand/post/email/process), date served, notice expiry (suggested from indicative notice period), recipient, notes (≤ 500), optional proof upload. Persists `status='notice_served'`, `notice_served_date`, `notice_expiry_date`, `service_method`, `service_recipient`, appends notes, and writes a `notice_served` evidence row.

## Data / Supabase
- **Tables:** `possession_cases`, `possession_evidence` (migrations `20260614130000_legal_tables.sql` + `20260615040000_legal_hardening.sql`). `arrears_amount numeric(12,2)`, `arrears_weeks numeric(6,1)` already present.
- **RLS:** `possession_cases_workspace_member`, `possession_evidence_workspace_member` (FOR ALL, USING + WITH CHECK on `workspace_members`). Writes workspace-scoped.
- **Caches** invalidated on create/update (`legal-possession-cases`, single-case key) → case detail + list reflect changes.
- **Evidence uploads** via `EvidenceUpload` → R2, workspace + case scoped.

## i18n / jurisdiction
- The whole possession subtree (`/possession`, `/possession/new/*`, `/possession/[caseId]`) is wrapped by `possession/layout.tsx` → `LegalJurisdictionGate module="possession"`. Section 8 / Section 21 are England & Wales statute; for Scotland (First-tier Tribunal Notice to Leave), Northern Ireland (Notice to Quit), any other country, or sanctioned countries, the wizard never renders (including by direct URL) — the jurisdiction panel is shown instead, pointing to generic record-keeping in Compliance/Documents. No E&W grounds/notice-period wording leaks to other jurisdictions.

## Known limitation (intentional, documented)
- Step 1 creates the draft case row immediately. Abandoning the wizard leaves a `gathering_evidence` case in the list. This is draft-like and recoverable but not labelled "draft". Logged in `release-gated/user-fixes/new-possession-case.md` as a V1.5 polish item (status filter / draft cleanup), not a release blocker.

## Bugs found & fixed (see implementation-fix-log)
1. **Arrears always £0** on notice preview + court bundle → arrears capture added to Step 2; preview/bundle now show real figures; arrears row hidden for S21.

## Score: 98 / 100
2 points withheld for the abandon-on-Step-1 draft-row behaviour (intentional, documented, non-blocking).
**Release decision: Ready for release.** (Behind the existing `legalSection` flag + E&W jurisdiction gate.)
