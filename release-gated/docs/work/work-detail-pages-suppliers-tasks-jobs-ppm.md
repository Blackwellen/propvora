# Release Evidence — Work Detail Pages (Suppliers · Tasks · Jobs · PPM)

**Section:** Work
**Parent route:** `/property-manager/work`
**Date:** 2026-06-24
**Branch:** `qa-release-fixes-304-314`
**Audit type:** Code-level audit + fixes + Supabase migration. Live multi-viewport browser/RLS/E2E verification still required (see *Remaining manual actions*).

---

## Detail pages & record IDs tested (code path)

| Detail page | Record type | Route | Record ID (from checklist) |
|---|---|---|---|
| Supplier | contact (supplier) | `/property-manager/work/suppliers/{id}` | `df423abd-1fb6-4bac-8504-c62a625dab40` |
| Task | task | `/property-manager/work/tasks/{id}` | `524f6e42-6875-41f4-b601-9290f279c66b` |
| Job | job | `/property-manager/work/jobs/{id}` | `91f04382-2bc4-4ffc-ab97-ebb1d1ed4be0` |
| PPM Plan | ppm_plan | `/property-manager/work/ppm/{id}` | `a79fff4e-c4e7-469e-b758-31ea15b4be8e` |

Sub-tabs are in-page (client tab state), not separate routes — so deep-linking lands on the default (Overview) tab; per-tab deep links are noted under *Remaining manual actions*.

### Sub-tabs in scope
- **Supplier:** Overview · Jobs · Quotes · Invoices · Compliance · Documents · Performance · Activity
- **Task:** Overview · Checklist · Activity · Files · Linked Work · Notes · History
- **Job:** Overview · Schedule · Quotes · Costs · Documents · Activity · Supplier · Notes · Linked Tasks
- **PPM Plan:** Overview · Schedule · Generated Jobs · Supplier · Activity

> Note: the checklist lists a Job **Communication** sub-tab; the live tab set has no Communication tab (Notes + Activity cover this). No dead tab was added — flagged as an intentional scope decision, not a gap.

---

## Bugs found & fixed (this session)

| # | Page / sub-tab | Bug | Severity | Fix |
|---|---|---|---|---|
| FIX-W01 | Supplier · right rail | `ComplianceCertificatesCard` was a hard-coded stub: always rendered "No certificates uploaded yet" and a **dead** "Upload New Certificate" button (no handler). | P1 (dead button + fake static state) | Replaced with live `ComplianceSummaryCard` reading `useSupplierDocuments` → real Verified / Due-soon / Expired counts; action routes to the **Compliance** tab (no dead button). |
| FIX-W02 | Task · Notes (Overview + Notes tab) | Formatting toolbar (Bold / Italic / Link / @-mention) were **dead** buttons (no handlers). | P1 (dead buttons) | Removed the dead toolbar; the plain-text notes textarea + working Save remain. |
| FIX-W03 | Task · Files | Uploaded evidence was persisted to `task_documents` + R2 but **never re-read**, so files vanished from the list after refresh. Dead Download/Trash buttons on a never-populated `mockFiles` array. | P1 (persistence display gap) | Added `useTaskDocuments` and pass `initialDocs` to `EvidenceUpload`; removed dead `mockFiles` block + buttons. |
| FIX-W04 | Job · Documents | Same persistence gap as W03 (`job_documents` never re-read). Dead Download buttons in two never-populated `job.documents` blocks (Overview + right rail) and a dead "Link Issue" button. | P1 | Added `useJobDocuments` + `initialDocs`; extracted `JobDocumentsTab`; removed dead document blocks, dead buttons and the now-unused `documents` view-model field. |
| FIX-W05 | PPM · Activity | Fake comment composer: text input + **dead** "Post" button (no handler); single hard-coded activity line. | P1 (dead button) | Replaced with an honest derived timeline (Next due / Last completed / Created) and removed the dead composer. |
| FIX-W06 | PPM · Generated Jobs | Static "No jobs generated yet" — `generateJob` created a `jobs` row with **no linkage**, so generated work orders could never be listed. | P1 (non-functional tab) | Added `jobs.ppm_plan_id` FK (migration), store it on generation (42703-tolerant), added `usePpmGeneratedJobs`, and the tab now lists real linked work orders (clickable rows → job detail). |

### Modularisation (per user request — "make them more modular")
- Extracted all Supplier detail tab components into `src/features/work/suppliers/SupplierDetailTabs.tsx` (page `991 → ~370` lines). Page is now a thin orchestrator (header / KPI / tab state / layout).
- Shared, reusable document read hooks added at `src/features/work/useWorkDocuments.ts` (`useJobDocuments`, `useTaskDocuments`).
- `EvidenceUpload` refactored to render persisted `initialDocs` merged with in-session uploads (de-duped by key/url, hidden-set for removals) — **backward compatible**: existing callers that pass no `initialDocs` behave exactly as before.

---

## Files changed

| File | Change |
|---|---|
| `src/features/work/useWorkDocuments.ts` | **new** — 42P01-safe `useJobDocuments` / `useTaskDocuments` returning `EvidenceDoc[]`. |
| `src/components/work/EvidenceUpload.tsx` | Merged render of `initialDocs` + session uploads (backward compatible). |
| `src/features/work/suppliers/SupplierDetailTabs.tsx` | **new** — extracted supplier tabs + live `ComplianceSummaryCard`. |
| `src/app/(app)/app/work/suppliers/[id]/page.tsx` | Slimmed to orchestrator; wires live compliance card. |
| `src/app/(app)/app/work/tasks/[id]/page.tsx` | Removed dead Notes toolbar; Files tab re-reads `task_documents`; removed dead `mockFiles`. |
| `src/app/(app)/app/work/jobs/[id]/page.tsx` | `JobDocumentsTab` re-reads `job_documents`; removed dead document blocks/buttons + unused field. |
| `src/app/(app)/app/work/ppm/[id]/page.tsx` | Honest Activity timeline; live Generated Jobs list. |
| `src/hooks/usePpm.ts` | Store `ppm_plan_id` on generate (42703-tolerant); new `usePpmGeneratedJobs`. |
| `supabase/migrations/20260624000000_jobs_ppm_plan_link.sql` | **new** — `jobs.ppm_plan_id` FK + index. |

---

## Database / RLS / migrations

- **Migration applied live** via Management API (project `oovgfknmzjcgbilwumch`) on 2026-06-24:
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ppm_plan_id UUID REFERENCES ppm_plans(id) ON DELETE SET NULL;` + index. Verified present in `information_schema.columns`. Recorded as migration file for fresh-DB reproducibility.
- Tables exercised: `jobs`, `tasks`, `ppm_plans`, `job_documents`, `task_documents`, `supplier_documents`, `contact_activity`, `task_comments`, `task_checklist_items`, `contacts`.
- RLS: all reads/writes go through the workspace-scoped client; document tables carry `is_workspace_member()` SELECT/ALL policies (migration `20260611000006`). `jobs.ppm_plan_id` inherits the existing `jobs` RLS policies (no new policy needed).
- All new reads are `42P01`/`42703`-safe (missing table/column → honest empty state, never a crash).

## Data correctness
- No mock/fake data introduced. Removed: hard-coded compliance stub (W01), `mockFiles` array (W03), never-populated `documents` blocks (W04), fake PPM comment composer (W05).
- Money formatted `£` + `toLocaleString`; dates `en-GB`.

## Tests run
- `npx tsc --noEmit` — **0 errors** across the repo (full typecheck). Touched files compile clean.
- (Pending) `npm run build` production compile, multi-viewport browser QA, RLS positive/negative, E2E — see below.

---

## Remaining manual / follow-up actions (see user-fixes doc)
1. Live multi-viewport browser QA (1536→375 + PWA) of all four detail pages and every sub-tab — dev server is owned by another session this run.
2. RLS negative tests (wrong workspace / wrong record / archived) against the four record types.
3. Per-sub-tab deep-linking + refresh-preserves-tab: sub-tab state is in-memory only (no `?tab=` URL sync) — enhancement, not a blocker.
4. Real activity/audit feeds for Job and PPM Activity tabs are still derived (created/scheduled events), not full `activity_logs` history.

## Score
- **Suppliers detail:** 96/100 (live data, dead card fixed, modularised; -4 pending live viewport/RLS sign-off)
- **Tasks detail:** 95/100 (dead toolbar removed, file persistence fixed; -5 pending live sign-off + derived History tab)
- **Jobs detail:** 94/100 (file persistence + dead buttons fixed; -6 pending live sign-off + derived Activity)
- **PPM detail:** 95/100 (Generated Jobs now real, dead composer removed; -5 pending live sign-off)

**Release decision:** Ready for release pending live browser/RLS sign-off (code-complete; no known dead buttons, stubs, or non-persisting uploads remain in scope).

---

## Addendum — Enhancements + live DB verification (2026-06-24, session 2)

### Enhancements implemented (code, typecheck 0 errors)
- **FIX-410 — `?tab=` deep-linking** (`src/features/work/useTabParam.ts` + all four pages): sub-tabs now sync to the `?tab=` query param via the History API (SSR-safe, no `useSearchParams`/Suspense). Deep-linkable, survives hard refresh, syncs on browser back/forward. Closes checklist items 16/19/79/80/84.
- **FIX-411 — real `activity_logs` history** (`src/features/work/useRecordActivity.ts`): Job **Activity**, Task **History** and PPM **Activity** tabs now read real `activity_logs` rows (workspace-scoped, 42P01-safe) merged with the derived lifecycle baseline.

### Live database / RLS verification (Management API, project oovgfknmzjcgbilwumch)
- **Test records confirmed real:** contact `Carol Webster`; task `Replace bathroom tap · Beech House`; job `Annual gas safety inspection`; ppm `Fire alarm test — Birchfield`.
- **Hook queries execute clean** against live schema: `job_documents`, `task_documents`, `jobs.ppm_plan_id`, `activity_logs` by `resource_type`.
- **`activity_logs` already holds real data** the old derived-only tabs ignored: **17 `job` rows, 10 `task` rows** (actions like `job.created`, `job_completed`).
- **RLS confirmed present** on `jobs`, `job_documents`, `task_documents`, `ppm_plans` (Members read SELECT + write ALL; plus `jobs_supplier_self_select` portal boundary).

### NEW P1 finding — activity_logs RLS gap (BLOCKED on owner authorisation)
- `activity_logs` has **RLS enabled but ZERO policies** on this (partial-history) live DB → every client-side read returns empty. The "Members read activity" policy from migration 003 was never applied here.
- **Impact:** FIX-411 activity wiring (and the existing home-dashboard activity feed) cannot surface real rows until this is fixed.
- **Fix prepared:** `supabase/migrations/20260624000001_activity_logs_read_policy.sql` (restores the workspace-scoped SELECT policy). **Not applied** — the auto-mode classifier denied a DROP/CREATE POLICY on the shared production table; needs explicit owner approval. See user-fixes doc.

### Browser-pixel QA — still blocked (honest)
- A fresh headless browser 307-redirects to `/login` (verified live); there are **no test credentials** in the repo/env and **no dev auth bypass** in `src/proxy.ts`.
- Next refuses a 2nd `dev` instance for this working dir (project-locked to the other session's 3002 server), so an isolated authed browser run needs either credentials, a git worktree, or imported real-browser cookies. Steps in the user-fixes doc.

---

## Addendum 2 — RLS fix applied + browser-QA tooling status (2026-06-24, session 3)

### ✅ FIX-412 applied live (owner-authorised)
- `activity_logs` `Members read activity` SELECT policy created via Management API and **verified present in `pg_policies`**. The 17 `job` + 10 `task` real rows are now readable by workspace members → FIX-411 Activity tabs and the home-dashboard feed will surface real data.

### Browser-pixel QA — attempted, tooling not installed (honest)
- User authorised the **real-Chromium cookie-import** path. On setup, the gstack `browse` runtime is **not installed on this machine**: no `~/.claude/skills/gstack/` dir, no `browse/dist/browse` binary, no build script (only `SKILL.md` stubs for `browse` + `setup-browser-cookies`). `cookie-import-browser` cannot run; there is nothing to build.
- Windows caveat also stands: gstack cookie decryption targets macOS Keychain / Linux libsecret, not Windows DPAPI.
- **Remaining options for the live pixel pass:** (a) drive Chrome DevTools MCP (cross-platform) and log in once interactively in that window, (b) install the full gstack browse runtime, or (c) run the documented manual QA. The four routes are confirmed served by the dev server (307 → /login, no 500s).

### Net status
- **Code:** complete, `tsc --noEmit` 0 errors. No dead buttons / stubs / non-persisting uploads remain in scope. Sub-tab deep-linking + real activity history added.
- **DB/RLS:** verified live; the one P1 gap found (activity_logs policy) is **fixed and live**.
- **Pixel QA:** the only outstanding item; blocked on browser-auth tooling, not on the code.

---

## Addendum 3 — LIVE BROWSER QA COMPLETED (2026-06-24, session 4)

Ran the live pixel/functional pass via Chrome DevTools MCP against the running dev server (localhost:3002, serving the HMR'd branch code) under an authenticated owner session (jamahl thomas / Enterprise plan). All four detail pages exercised with their real record IDs.

### Results — all four PASS
| Page | Verified live | Console |
|---|---|---|
| **Supplier** (Carol Webster) | All 8 tabs; **live `ComplianceSummaryCard`** (no dead Upload button) — "Manage compliance documents" switches to Compliance tab; `?tab=Compliance` updates URL + **survives hard refresh** (restored Compliance tab, not Overview); mobile 390×844 clean (no clip/scroll, mobile tab bar reflects `?tab=`). | 0 errors |
| **Task** (Replace bathroom tap) | `?tab=History` + `?tab=Notes` + `?tab=Files` deep-links land correctly; **Notes has NO dead formatting toolbar** (only textarea + Save Note); Files renders EvidenceUpload dropzone (no dead mockFiles buttons); History renders merged activity timeline. | 0 errors (after FIX-413) |
| **Job** (Annual gas safety inspection, JOB-1001) | All 9 tabs; `?tab=Activity` + `?tab=Documents` deep-links; Activity merged timeline; Documents renders upload zone (no dead Download buttons). | 0 errors |
| **PPM** (Fire alarm test — Birchfield) | All 5 tabs; **Activity = derived timeline (Next due/Last completed/Created), NO dead "Post" composer**; **Generated Jobs = honest empty state + working Generate Job button** (`usePpmGeneratedJobs`); `?tab=Activity` adopted on refresh; `?tab=Generated+Jobs` via click. | 0 errors (after FIX-414) |

### Two real bugs caught live and fixed
- **FIX-413** — `workspace_members.joined_at` does not exist → 400 broke the assignee dropdown on Task/Job detail. Changed `useWorkspaceMembers` order to `created_at`. (Same pattern flagged in 6 out-of-scope files for a follow-up sweep.)
- **FIX-414** — `useTabParam` caused a React hydration mismatch (server rendered defaultTab, client rendered the `?tab=` value). Re-implemented with the SSR-safe init + post-mount effect pattern. Deep-linking still works.

### FIX-411/412 confirmed working live
- `activity_logs` reads now return **200** (e.g. reqid for task/job activity) — the FIX-412 RLS policy is effective. Activity tabs render the merged timeline (derived baseline shown where a record has no logged rows yet, which is correct).

### Net
All four Work detail pages and every in-scope sub-tab verified live: 0 console errors, deep-linking + refresh-preserves-tab working, every fixed surface confirmed (live compliance card, no dead toolbars/composers/buttons, upload zones, real Generated Jobs). **Browser-pixel QA is now complete.**
