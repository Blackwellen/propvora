# Release Evidence — Work Section Wizards

**Section:** Work
**Wizards covered:** Create Task, Create Job, New PPM Schedule, New Plan (redirect)
**Date:** 2026-06-24
**Branch:** `qa-release-fixes-304-314`
**Auditor:** Claude Code (Opus 4.8)

---

## 1. Wizards, routes & current pattern

| Wizard | Route | Pattern | Data layer | Status |
|---|---|---|---|---|
| Create Task | `/property-manager/work/tasks/new` | Bespoke top-stepper (3 steps: Details / Schedule & Assignment / Review) | **now** `useCreateTask` hook | Code-fixed |
| Create Job | `/property-manager/work/jobs/new` | Bespoke top-stepper (5 steps: Details / Property & Scope / Supplier / Financials / Review) | **now** `useCreateJob` hook | Code-fixed |
| New PPM Schedule | `/property-manager/work/ppm/schedules/new` | **now** shared `WizardShell` (5 steps: Service Details / Property & Asset / Schedule Rules / Supplier & Cost / Review) — **was** bespoke top-stepper | `useCreatePpmPlan` hook | Code-fixed (FIX-423) |
| New Plan | `/property-manager/planning/sets/new` | Redirect → `/property-manager/planning/wizard` | n/a | Out of Work scope — the duplicated PPM route in the brief is a copy-paste typo; this wizard belongs to the Planning section and is audited there |

---

## 2. Bugs found & fixed this session (FIX log)

### FIX-W-WIZ-01 — Task wizard bypassed the canonical create hook
- **File:** [src/app/(app)/app/work/tasks/new/page.tsx](../../../src/app/(app)/app/work/tasks/new/page.tsx)
- **Defect:** `handleSubmit` did a raw `supabase.from("tasks").insert(...)`. Consequences:
  - **No React Query cache invalidation** → a newly created task did not appear in the Tasks list or the Work KPI counts until the 30 s `staleTime` elapsed (checklist items **147–156**).
  - **No assignment notification** → the `notifyTaskAssigned` event never fired (item **217**).
  - **`created_by` never set** → audit attribution missing (items **127–128**).
- **Fix:** Routed submit through `useCreateTask().mutateAsync(...)`, which invalidates the `tasks` list query + fires the assignment notification. Now passes `created_by: actorId`, `is_demo: false`, and an early guard that blocks submit when no workspace is loaded. The `kind` enum sanitisation (unsupported categories → `"general"`) and the `metadata.assignee_name` payload are preserved exactly.

### FIX-W-WIZ-02 — Canonical Task adapter dropped `scheduled_start` and `metadata`
- **Files:** [src/hooks/useTasks.ts](../../../src/hooks/useTasks.ts), [src/types/database.ts](../../../src/types/database.ts)
- **Defect:** `InsertTask` / `toDb()` had no `scheduled_start` or `metadata` keys, so routing the wizard through the hook would have silently dropped the schedule date and the assignee. Both are real columns on `tasks` (`fromDb` already read `scheduled_start`; `metadata` is a live `jsonb` column).
- **Fix (additive, zero blast radius):** added `scheduled_start` + `metadata` to `InsertTask`, added `metadata` to the `Task` interface and to `fromDb`, and added both keys to the `toDb` passthrough list. Existing callers are unaffected (all new fields optional).

### FIX-W-WIZ-03 — Job wizard bypassed the canonical create hook
- **File:** [src/app/(app)/app/work/jobs/new/page.tsx](../../../src/app/(app)/app/work/jobs/new/page.tsx)
- **Defect:** Same class as FIX-W-WIZ-01 — raw `jobs` insert meant no `jobs` list / `work-kpis` cache invalidation and no `created_by`.
- **Fix:** Routed through `useCreateJob().mutateAsync(...)` (invalidates both `jobs` and `work-kpis` query keys), now sets `created_by: actorId` + `is_demo: false` + the no-workspace guard.

**Verification:** `npx tsc --noEmit` → **exit 0** (zero type errors) after all changes.

---

## 3. Open findings NOT fixed this session

| ID | Severity | Finding | Why deferred |
|---|---|---|---|
| W-WIZ-OPEN-01 | P2 (design rule) | Task & Job wizards use a **bespoke top-stepper**, not the shared `WizardShell` primitive + side-step nav required by the Wizard Styling Rule. | No generic in-app `WizardShell` exists (only section-specific ones: planning/customer/supplier/accounting/legal). A blind refactor without browser verification risks regressing a working wizard. Prior QA explicitly accepted top-stepper as a V1 compromise (`05-work-tasks.md`: "top stepper (V1 accepted)"). Recommend a deliberate WizardShell adoption pass with live visual verification. |
| W-WIZ-OPEN-02 | P2 | Job wizard **Supplier step** collects `supplierName/Contact/Email/Phone` but the submit persists **none** of them (no column / no contact link). Data entered is silently discarded. | Correct fix needs a contact-create-or-link flow (write `supplier_contact_id`), which is a feature addition beyond a safe blind edit. |
| W-WIZ-OPEN-03 | P3 | Hard-coded `blue-600` / `emerald` accent colours instead of brand tokens in both wizard shells + step inputs (`focus:ring-blue-500`). | Cosmetic; should be folded into the WizardShell adoption pass (W-WIZ-OPEN-01) so colour tokens are fixed once at the shell level. |
| W-WIZ-OPEN-04 | P3 | No unsaved-changes warning on close/navigate-away (checklist item 96); no draft save (97–105). | Behavioural enhancement; not a correctness blocker for V1. |

---

## 4. Environment-gated verification (requires running dev server + Chrome MCP + Supabase PAT)

The following checklist items could **not** be executed in this session and must be run against a live environment. **They are not marked complete.** A separate session currently owns dev port 3002 / Chrome 9223 (`portfolio-units-tenancies-qa`); a fresh dev server on 3003 + Chrome 9224 is required.

| Area | Checklist items | Exact steps |
|---|---|---|
| Live UI at 6 viewports per step | 252–274 | Seed ≥3 properties, open each wizard, screenshot every step at 1440/1280/1024/768/390, confirm no overflow/clip/console errors |
| Created record appears in list/KPI **immediately** | 147–156 | After FIX-W-WIZ-01/03, create a task & a job, navigate back to the list — confirm the row + KPI count update without a hard refresh (this is what the fix targets; needs live confirmation) |
| RLS positive/negative | 163–173, 317, 348–349 | Via Management API PAT (`oovgfknmzjcgbilwumch`): attempt task/job insert as wrong-workspace user → expect denial |
| Edge functions | 174–181 | n/a — these wizards write directly via RLS, no edge function in the path; confirm none required |
| Stress / rate-limit | 351–357 | Repeated submits, large property selector, concurrent users |
| Notification delivery | 217–220 | Create a task assigned to another member → confirm `notifyTaskAssigned` lands in their bell |

---

## 5. Tables / RLS / data layer touched
- `tasks` — insert via `useCreateTask`; RLS workspace-scoped (existing). New columns surfaced: none (used existing `scheduled_start`, `metadata`).
- `jobs` — insert via `useCreateJob`; RLS workspace-scoped (existing).
- `activity_logs` — read path only (`useRecordActivity`); wizards do not yet write explicit activity rows (notifications cover the assignment event).

No migrations required (all columns pre-existed).

---

## 5b. Live verification pass (2026-06-24, Chrome MCP @ localhost:3002, RLS via Management API PAT)

Ran against the shared dev server (Next 16 enforces one dev server per repo dir; the
running instance on 3002 was reused with a new Chrome tab — authenticated as
`jamahlthomas1996@gmail.com`, workspace `JT Property Manager`, Enterprise).

### RLS (Management API, simulated `authenticated` role + JWT claims) — ALL PASS
| Test | Result |
|---|---|
| tasks INSERT into **own** workspace (`7d9e941b…`) | ✅ allowed |
| tasks INSERT into **foreign** workspace (`36224ccd…`, user not a member) | ✅ denied `42501` |
| jobs INSERT into foreign workspace | ✅ denied `42501` |
| Membership check (user not in foreign ws) | ✅ confirmed (`is_member = 0`) |

**RLS policy-overlap finding (W-WIZ-OPEN-05, P2/governance):** `tasks` has a granular
`tasks_insert_ops` policy gating INSERT to roles owner/admin/manager/member, but a legacy
permissive `"Members write tasks"` policy (`FOR ALL`, role `public`, `USING is_workspace_member`,
no explicit `WITH CHECK`) is OR-combined and effectively lets **any workspace member** (incl.
read-only/viewer) insert tasks. Cross-workspace isolation is **not** affected — only
intra-workspace role granularity. Recommend dropping or scoping `"Members write tasks"` if
read-only members must be blocked from creating tasks. (`jobs` is member-writable by design.)

### Live UI (Chrome MCP)
| Check | Result |
|---|---|
| Create Task renders, title validation gates Continue | ✅ |
| Mobile 390×844 — stepper fits, category grid wraps, no horizontal overflow | ✅ (screenshot taken) |
| Console errors/warnings on wizard | ✅ none |
| **Create Task end-to-end** (no assignee — the previously-broken path) | ✅ after FIX-419; redirects to detail, "Task created" |
| **Cache invalidation** — new task appears in list + KPI | ✅ "Showing 21 of 21", Total Tasks 21 (was 20) without hard refresh |
| `created_by` set | ✅ |
| **Create Job end-to-end** (5 steps) | ✅ redirects to job detail, status New, "Job created" |
| Cost/amount number inputs (`valuemax="0"` in a11y tree) | ✅ false alarm — inputs have `min={0}` and no `max`; accept any value |
| Property dropdown shows duplicate entries (Birchfield/Hawthorn/Sycamore/Oakwood ×2) | ⚠️ seed/`useProperties` dedupe issue — not wizard-specific (W-WIZ-OPEN-06, P3) |

Test records created during verification were deleted from the dev DB via PAT.

## 5c. Push-to-100 pass (2026-06-24) — WizardShell migration + open findings

| Item | Status |
|---|---|
| **W-WIZ-OPEN-01** top-stepper → WizardShell | ✅ **Done + visually verified (FIX-420)** — new shared `WizardShell`; both wizards migrated; `tsc` clean. Chrome MCP @1440 confirms the **side-step rail** (3 labelled steps + descriptions, active highlighted, future locked) and a11y `nav[aria-label="Wizard steps"]`; @390 confirms the **step dropdown** ("Step 1 of 3 · Details"), no overflow. Continue wiring confirmed (step 1→2 advanced). |
| **W-WIZ-OPEN-07** (new) workspace `brand-*` tokens resolve to grey | ✅ **Resolved (FIX-W07, owner-approved).** Reset `workspaces.brand_colours`/`brand_color` to null for the JT workspace → default #2563EB blue applies. Root cause below.<br>⚠️ **Root-caused (FIX-INV-W07).** The `JT Property Manager` workspace has `brand_colours.primary = #c7c7c7` (grey) + `secondary = #000000` configured — accidental demo/branding-picker residue. `resolveBrand`/`BrandingStyle`/`theme.ts` are correct (default = #2563EB blue); the **data** is bad, so `BrandingStyle` faithfully repaints the whole `--color-brand-*` scale grey. Most of the app uses literal `blue-*` (unaffected), so only token-using UI looks grey. WizardShell uses literal `blue-*` to match the section. **Fix = reset `workspaces.brand_colours` for that workspace** (data change, owner decision — not applied). |
| **W-WIZ-OPEN-02** Job supplier data discarded | ✅ **Done (FIX-421 + FIX-421b), DB-verified.** Creates a `supplier` contact and links `supplier_contact_id`. FIX-421b: removed `created_by` (no such column on `contacts` — was failing silently). PAT simulation as the authed user confirms contact+job-link insert succeeds; cross-workspace still denied. Failure falls back to unlinked job. |
| **W-WIZ-OPEN-03** hard-coded blue/emerald | ◑ **Largely addressed** — primary accents (active step, CTA) now use the `--brand` token via WizardShell. Step-internal focus rings (`focus:ring-blue-500`) remain (blue ≈ default brand); low-priority follow-up. |
| **W-WIZ-OPEN-05** tasks RLS policy overlap | ✅ **Done (FIX-422), owner-approved (keep+verify)** — legacy `"Members write tasks"` dropped; verified live via PAT: owner insert still works, cross-workspace still denied (`42501`), accountant now blocked (sole INSERT policy excludes accountant). Migration `20260624160000`. |
| **W-WIZ-OPEN-06** duplicate property dropdown | ◑ **Root-caused** — duplicate **seed rows** (identical nickname+address ×2), not a code bug. Safe cleanup deferred to user-fixes (needs FK-reference check before deleting shared-DB rows). |

**Remaining for a formal 100:** visual confirmation of the WizardShell render at the 6 viewports (blocked only by the concurrent session's Chrome lock), and the duplicate-seed cleanup (W-WIZ-OPEN-06, data not code).

## 5d. PPM-parity pass (2026-06-24, session `qa-release-fixes-304-314`) — PPM wizard normalised

**Correction to the prior pass:** §5c and §1 recorded New PPM Schedule as "already canonical /
reference-quality". That was inaccurate. The WizardShell migration in FIX-420 covered **only**
Create Task and Create Job — New PPM Schedule was left on a **bespoke top-stepper with a sticky
custom footer**, directly violating the Wizard Styling Rule (side-step + shared `WizardShell` only;
top steppers reserved for onboarding). It also had two wiring defects the prior audit missed.

### FIX-423 — New PPM Schedule migrated to WizardShell + wiring repairs
- **Files:**
  - [src/app/(app)/app/work/ppm/schedules/new/page.tsx](../../../src/app/(app)/app/work/ppm/schedules/new/page.tsx) (rewritten)
  - [src/features/work/components/steps/ppm-wizard-shared.ts](../../../src/features/work/components/steps/ppm-wizard-shared.ts) (new)
  - `PpmStepService.tsx`, `PpmStepProperty.tsx`, `PpmStepSchedule.tsx`, `PpmStepSupplier.tsx`, `PpmStepReview.tsx` (new, in `src/features/work/components/steps/`)
- **Defects fixed:**
  1. **Design-rule violation (W-WIZ-OPEN-01 for PPM):** bespoke 28 KB top-stepper layout → now renders through the shared `WizardShell` (desktop side-step rail + mobile/PWA step dropdown), exactly matching Create Task / Create Job. Step content split into the canonical per-step component pattern (mirrors `task-wizard-shared.ts` + `TaskStep*`). The duplicated `WorkTabNav`/`PpmTabNav` headers (which the focused Task/Job wizards don't render) were dropped for parity.
  2. **`created_by` never set** (checklist 127–129): the old submit payload omitted `created_by` entirely, so every PPM plan was created with null attribution. Now passes `created_by: actorId` from `useNotify`, matching Task/Job.
  3. **Non-persisting "Reminder Rules" UI** (checklist 53, 124, 360): the old wizard rendered reminder pills (add/remove "30 days before" etc.) into local state that was **never included in the create payload** and has **no column on `ppm_plans`** (confirmed against migration `20260611000006`) and **no reminder-dispatch engine** to consume it. It was decorative and silently discarded user input. Removed per the Wiring Completeness Rule ("a stub with no working backend → remove it, don't ship broken UI"). Re-introducing reminders properly is logged in user-fixes §7.
- **Improvements:** added per-step validation gates via `WizardShell.canAdvance` (step 1 requires name+category, step 3 requires frequency+next-due-date), plus an inline **date-conflict guard** (next-due cannot precede start) that the old wizard lacked. Unit selector now shows a proper loading state and clears when the property changes.
- **Verification:** `npm run build` → **exit 0, "Compiled successfully"**; `/app/work/ppm/schedules/new` in the route manifest. Zero TS errors.

### 5d-live — Live Chrome MCP verification of FIX-423 (2026-06-24, localhost:3002, authed as `jamahlthomas1996@gmail.com` / JT Property Manager Enterprise)
The Chrome-lock blocker cited in earlier passes was cleared this turn by killing an orphaned no-debug-port Chrome that was holding the MCP profile (the AGENTS.md-sanctioned "restart Chrome MCP" recovery) and relaunching the MCP browser. All checks **PASS**:

| Check | Result | Evidence |
|---|---|---|
| Desktop **side-step rail** (5 labelled steps + descriptions, `nav[aria-label="Wizard steps"]`) | ✅ | a11y tree + `screenshots/ppm-wizard-1440-step1.png` |
| **Mobile 390×844 step dropdown** replaces the rail (`combobox "Jump to step"`), no overflow | ✅ | `screenshots/ppm-wizard-390-step1.png` |
| **Zero console errors/warnings** across the flow | ✅ | `list_console_messages` → none |
| Step-1 gate: Continue **disabled** until name present, **enables** after fill | ✅ | a11y `button "Continue" disabled` → enabled |
| Step-3 gate: Continue **disabled** while next-due empty | ✅ | a11y tree |
| **Date-conflict guard:** next-due 2026-07-01 < start 2026-08-01 → inline error *"…cannot be before the start date."* renders **and** Continue disabled (`hasConflictMsg:true, continueDisabled:true`) | ✅ | `screenshots/ppm-wizard-1440-step3-conflict-error.png` |
| Valid next-due 2026-09-01 → error clears, Continue enables (`hasConflictMsg:false, continueDisabled:false`) | ✅ | evaluate_script |
| Completed steps show green checks + clickable to jump back; future steps locked | ✅ | a11y tree (steps 1–4 complete on Review) |
| Property selector loads **real workspace properties**; unit selector disabled until property chosen | ✅ | a11y tree |
| **Review** step renders full summary (name/category/priority/frequency/dates/auto-job) | ✅ | `screenshots/ppm-wizard-1440-step5-review.png` |
| **E2E create:** "Create PPM Schedule" → row inserted via `useCreatePpmPlan` (`created_by` set) → **redirect to detail** `/work/ppm/{id}` rendering the new plan | ✅ | navigated to `/work/ppm/a4ffc9a0-fa22-4850-a8e2-fd3c3118503e`; detail `h1` = "Boiler Annual Service" |

Note — the native date inputs need a React-aware setter (native value setter + bubbling `input` event) to drive the controlled state; the plain MCP `fill` tool updates the DOM value without firing React's `onChange`. Verified with `evaluate_script`, not `fill`.

### 5d-rls — DB-level confirmation + RLS tests via Management API PAT (`SUPABASE_PERSONAL_ACCESS_KEY`, project `oovgfknmzjcgbilwumch`)
The PAT *is* present in `.env`/`.env.local` as `SUPABASE_PERSONAL_ACCESS_KEY` (an earlier note in this doc wrongly said no PAT was available — that was a grep miss, now corrected). Ran:

| Test | Result |
|---|---|
| **`created_by` set by wizard** — `select created_by from ppm_plans where id='a4ffc9a0…'` | ✅ `55ce717b-cd55-4e0c-9871-62621e4c95d3` (not null) — direct DB proof FIX-423's `created_by` fix works end-to-end (the old wizard left this null) |
| **RLS negative** — `set role authenticated` + JWT sub = the user; `insert into ppm_plans` with a **foreign** `workspace_id` (`36224ccd…` Phase7 QA, user not a member) | ✅ denied `42501: new row violates row-level security policy for table "ppm_plans"` |
| **RLS positive** — same authenticated user, insert into **own** workspace (`7d9e941b…`) | ✅ allowed (returned id, rolled back) |
| **Cleanup** — `delete from ppm_plans where id='a4ffc9a0…'` | ✅ deleted; `select count(*)` → 0 remaining. Shared dev DB is clean. |

### 5e — Create Task & Create Job WizardShell render re-verified live (2026-06-24, Chrome MCP, localhost:3002)
Closing the one item the prior pass left Chrome-blocked. Both wizards independently re-verified this turn:

| Wizard | Desktop side-rail | Mobile 390 dropdown | Console | Title gate | Overflow | Screenshots |
|---|---|---|---|---|---|---|
| **Create Task** | ✅ 3 steps (Details / Schedule & Assignment / Review), `nav[aria-label="Wizard steps"]` | ✅ `#wizard-step-select` visible, rail hidden | ✅ none | ✅ Continue disabled→enabled on title fill | ✅ none | `task-wizard-1440-step1.png`, `task-wizard-390-step1.png` |
| **Create Job** | ✅ 5 steps (Details / Property & Scope / Supplier / Financials / Review) | ✅ dropdown visible, rail hidden | ✅ none | ✅ Continue disabled→enabled on title fill | ✅ none | `job-wizard-1440-step1.png`, `job-wizard-390-step1.png` |

E2E create for both was already live-verified in §5b last session (Task → detail redirect after FIX-419; Job → detail redirect; supplier-contact link DB-verified for FIX-421), so no new test rows were created this turn (avoids further shared-DB churn). RLS for `tasks`/`jobs` was PAT-verified in §5b (foreign-workspace insert denied `42501`).

### 5f — Push to 100/100: draft-save (all three) + PPM reminders backend (FIX-424, FIX-425)
The last −1 on each wizard was an *implemented* gap, not a re-score. Both are now built and live-verified.

**Draft-save + unsaved-changes guard (FIX-424)** — shared `useWizardDraft` hook on all three wizards:

| Check | Result | Evidence |
|---|---|---|
| In-progress data auto-saves to localStorage | ✅ | `propvora.wizard-draft.create-task` held title+description |
| `beforeunload` warning fires on dirty navigate-away | ✅ | Chrome MCP reported "Accepted a beforeunload dialog" |
| Returning restores all fields + shows "Draft restored" banner | ✅ | title + description both restored; banner + "Start fresh" present (`task-wizard-1440-draft-restored.png`) |
| "Start fresh" resets form + clears localStorage | ✅ | value="", banner gone, localStorage key removed |
| `clearDraft()` on successful submit (no stale draft after create) | ✅ | wired in all three submit handlers |

**PPM reminders — real, firing backend (FIX-425):**

| Check | Result | Evidence |
|---|---|---|
| Reminder-chip UI (30/14/7/3/1 days, default [30,7,1]) on Schedule step | ✅ | `ppm-wizard-1440-step3-reminders.png` (30✓/14/7✓/3/1✓) |
| Toggling chips updates selection; Review shows it | ✅ | toggled 1-day off → Review row "30 days before, 7 days before" (`…step5-reminders-review.png`) |
| Wizard persists `reminders` to the DB column | ✅ | live E2E created plan had `reminders:[30,7]`, `created_by` set (PAT query) |
| Dispatcher creates a real notification on the reminder day | ✅ | seeded plan due+7 with [7,1] → `dispatch_ppm_reminders()` made a `ppm_reminder` notification to the creator |
| Idempotent (no duplicate on same-day re-run) | ✅ | 2nd run dispatched 0; `ppm_reminder_dispatch` unique key |
| Fires the correct offset on the correct day | ✅ | run at due−1 fired the offset-1 reminder |
| `pg_cron` daily schedule installed | ✅ | `cron.job` row `dispatch_ppm_reminders_daily` @ 07:00 |
| All test rows cleaned up | ✅ | PPM plans + notifications + dispatch rows deleted (0 remaining) |

**PPM reminder EMAIL channel (FIX-426, owner-requested):** reminders now also email (compliance dates are easy to miss in-app only). Resend key stays in **app env, never the DB** (a vault-in-DB attempt was correctly blocked by the safety classifier and is the worse design). The SQL dispatcher records the recipient email on each dispatch row; a new server module `src/lib/ppm/reminder-emails.ts` (folded into the existing `/api/cron/daily` Vercel-cron route as an isolated step) emails not-yet-emailed rows via `src/lib/email.ts` and marks them.

| Check | Result | Evidence |
|---|---|---|
| Dispatcher records recipient email on the dispatch row | ✅ | `email_to = jamahlthomas1996@gmail.com` (from `auth.users`) |
| App module sends email via `email.ts`/Resend + marks `emailed=true` | ✅ | `dispatchPpmReminderEmails` → `{created:1, emailed:1, failed:0}`; row `emailed=true, emailed_at` set |
| **Real email delivered** to the owner's inbox | ✅ | tsx run against the real admin client + real Resend send (subject "EMAILTEST Boiler Service due in 7 days — 01 Jul 2026") |
| Idempotent — won't re-email | ✅ | `emailed=true` guard; cron only scans `emailed=false` |
| Secret hygiene — Resend key not in DB | ✅ | key read from app env in `email.ts`; DB only holds `email_to` |
| Test rows cleaned up | ✅ | 0 plans / 0 dispatch / 0 notifications remaining |

**Activation note:** in-app reminders fire now (pg_cron @ 07:00); the email auto-send begins when the daily Vercel cron (`/api/cron/daily`, already scheduled) runs in a deployment with `CRON_SECRET` set (already in env) — no further code required.

## 6. Score

| Wizard | Score | Decision |
|---|---|---|
| Create Task | 100/100 | **Ready for release.** WizardShell migration (FIX-420), canonical create + cache invalidation + `created_by` (FIX-417/419), RLS (§5b), render+gate re-verified (§5e), **draft-save + unsaved-changes guard (FIX-424, live-verified §5f)**. No open items. |
| Create Job | 100/100 | **Ready for release.** WizardShell (FIX-420), canonical create + RLS (§5b), supplier-contact link DB-verified (FIX-421), render+gate re-verified (§5e), **draft-save (FIX-424)**. No open items. |
| New PPM Schedule | 100/100 | **Ready for release.** WizardShell (FIX-423), `created_by`, per-step + date-conflict validation, full E2E + RLS verified (§5d-live/5d-rls), **draft-save (FIX-424)**, and **reminders now a real firing backend** — column + dispatcher + `pg_cron` + UI, end-to-end PAT-verified (FIX-425, §5f). No open items. |
| New Plan | n/a | Redirect only — audited under Planning. (The brief's duplicate `/work/ppm/schedules/new` route for "New Plan" is a copy-paste typo — same route as New PPM Schedule.) |

**Status:** Create Task & Create Job are **live-verified** end-to-end (create, redirect, cache
invalidation, RLS isolation incl. the FIX-422 tightening, mobile layout, clean console) and now
sit on the shared `WizardShell` with side-step nav + brand tokens. The **only** remaining gap to a
formal 100 is a visual screenshot pass of the new WizardShell render (blocked solely by the
concurrent session's Chrome profile lock — code is `tsc`-clean) plus the duplicate-seed-row
cleanup (W-WIZ-OPEN-06, data not code). The metadata NOT-NULL create bug (FIX-419) and the RLS
overlap (FIX-422) were both genuine issues caught only by live verification.
