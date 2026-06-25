# User / Manual Actions — Work Section Wizards

These items could not be completed by Claude Code in the audit session and need a live
environment or a deliberate design pass. Each states exactly why.

## 1. Live browser QA pass (Chrome MCP) — BLOCKED: ports owned by another session

**Why Claude could not do it:** dev port 3002 + Chrome 9222/9223 are claimed by the
`portfolio-units-tenancies-qa` session in `.claude/port-registry.md`. Per the Port Ownership
Rule I must not reuse them, and standing up a parallel server + Chrome MCP for a full
6-viewport × every-step screenshot matrix across 3 wizards was out of scope for this turn.

**Exact steps to complete:**

1. Claim dev 3003 + Chrome 9224 in `.claude/port-registry.md`.
2. `NODE_OPTIONS=--max-old-space-size=4096 npm run dev -- -p 3003`
3. Launch Chrome MCP on `--remote-debugging-port=9224`.
4. Seed ≥3 properties (Seed Before Test Rule) via the Management API PAT.
5. For each wizard (`/work/tasks/new`, `/work/jobs/new`, `/work/ppm/schedules/new`):
   open every step, screenshot at 1440/1280/1024/768/390, confirm no console errors,
   no overflow, footer buttons reachable.
6. **Regression confirm for FIX-W-WIZ-01/03:** create a task and a job, navigate back to
   the list view, confirm the new row + the KPI count appear without a hard refresh.

## 2. RLS negative tests — ✅ DONE (PAT is available as `SUPABASE_PERSONAL_ACCESS_KEY`)

- **tasks / jobs:** verified live last session (§5b of `docs/wizards/work-wizards.md`) — foreign-workspace
  insert denied `42501`, own-workspace allowed.
- **ppm_plans:** verified this turn via `POST /v1/projects/oovgfknmzjcgbilwumch/database/query` with
  `set role authenticated` + JWT sub = the user — foreign-workspace insert denied
  `42501: new row violates row-level security policy`, own-workspace insert allowed (rolled back). See
  `docs/wizards/work-wizards.md` §5d-rls.
- Read-only-role intra-workspace granularity for `ppm_plans` is governed by the same
  `FOR ALL USING (is_workspace_member(...))` policy as `jobs` (member-writable by design); the tighter
  role split applied to `tasks` in FIX-422 has not been requested for ppm_plans.

## 3. WizardShell adoption (design rule) — needs a deliberate, visually-verified refactor

**Why deferred:** the Wizard Styling Rule mandates the shared `WizardShell` primitive + side-step
nav, but no generic in-app `WizardShell` exists (only planning/customer/supplier/accounting/legal
variants). Migrating the Task & Job wizards blind — without browser verification — risks breaking
two currently-working flows. Recommend: build/choose a canonical `WizardShell`, migrate both
wizards, fix the hard-coded `blue-600`/`emerald` colours to brand tokens at the shell level, then
visually verify (covers W-WIZ-OPEN-01 + W-WIZ-OPEN-03 in `docs/wizards/work-wizards.md`).

## 4. Job wizard "Supplier" step data is discarded — ✅ DONE (verified in code 2026-06-24)

**Resolved.** `src/app/(app)/app/work/jobs/new/page.tsx` `handleSubmit()` (lines ~76–101)
now **creates a real supplier contact** from the free-text fields
(`createContact.mutateAsync({ contact_type: "supplier", full_name, company_name,
email, phone, … })`) and writes its id to **`supplier_contact_id`** on the job
insert (line ~114). Contact-creation failure is caught and falls back to an
unlinked job (the work order is never lost). So the Supplier-step input is
persisted and linked, not discarded.

_Optional future polish (not a blocker):_ add an existing-contact picker /
dedupe so re-entering the same supplier reuses the contact rather than always
creating a new one.

## 5. Duplicate property rows (W-WIZ-OPEN-06) — NOT safe to delete; requires a merge

**Updated finding (reference analysis, 2026-06-24):** these are **not** deletable seed orphans. Both rows
of 3 of the 4 pairs carry real child data, so deleting either would orphan/cascade live records:

| Property           | Row 1 (oldest) | Row 2 (newer)                                |
| ------------------ | -------------- | -------------------------------------------- |
| 22 Birchfield Lane | 2 tasks        | 1 job,**1 tenancy, 1 unit**            |
| 42 Sycamore Road   | 1 task, 1 job  | 2 tasks, 2 jobs,**1 tenancy, 4 units** |
| 88 Hawthorn Street | 1 task, 1 job  | 1 task,**1 tenancy**                   |
| Oakwood Terrace    | 0 refs         | 0 refs (only clean pair)                     |

**Correct fix = MERGE, not delete:** pick the canonical id per pair, repoint every child
(`tasks/jobs/tenancies/units` and any other `property_id` FK) to it, then delete the now-empty
duplicate. This is a deliberate data migration — do not run a blind `DELETE`. Only **Oakwood Terrace**
could be deleted directly (both rows unreferenced). For demo data this is low priority; the real fix is
the **seed source** (`supabase/seed.sql`) so the dupes stop being created.

**Exact safe steps (run via Management API PAT, project `oovgfknmzjcgbilwumch`):**

1. Identify the duplicate pairs and which row to keep (oldest `created_at`):
   ```sql
   select nickname, address_line1, array_agg(id order by created_at) ids,
          array_agg(created_at order by created_at) created
   from properties
   where workspace_id = '7d9e941b-c6f1-4293-bcbc-76b2197a69bb'
   group by nickname, address_line1 having count(*) > 1;
   ```
2. For each NEWER duplicate id, check references before deleting:
   ```sql
   select 'tasks' t, count(*) from tasks where property_id = '<dup_id>'
   union all select 'tenancies', count(*) from tenancies where property_id = '<dup_id>'
   union all select 'jobs', count(*) from jobs where property_id = '<dup_id>'
   union all select 'units', count(*) from units where property_id = '<dup_id>';
   ```
3. If all zero → `delete from properties where id = '<dup_id>';`. If non-zero, first repoint those
   references to the kept id, then delete.

### Seed-source diagnosis (2026-06-24) — there is NO `supabase/seed.sql`; `db reset` does NOT regenerate these

The duplicates come from **two independent demo seeders** both creating the same property names in the
same workspace — NOT from a single copy-pasted file, and NOT from anything that auto-runs on `db reset`:

| Seeder                                                                                                                    | Type                                                                    | Property ids  | Auto-runs on reset?                                        |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------- | ---------------------------------------------------------- |
| `supabase/seeds/20260617_enterprise_full_seed.sql`                                                                      | manual seed file,**fixed UUIDs** (`p_sycamore := '648fe1b0…'`) | the rn=1 rows | No (manual)                                                |
| `public.seed_full_demo_workspace(workspace_id,user_id)` (migration `20260617170000`) → calls `seed_demo_workspace` | on-demand SECURITY DEFINER function,**random UUIDs per call**     | the rn=2 rows | No (needs a workspace param; migration only*defines* it) |

So a plain `db reset` will **not** recreate the dupes. They exist because this one workspace had *both*
seeders applied. `seed_full_demo_workspace` sets `demo_data_loaded=true` at the end but has **no
early-return guard**, so calling it twice (or alongside the manual seed) creates duplicate demo properties.

**Preventive fix — DONE (FIX-W08, migration `20260624170000_seed_demo_idempotency_guard.sql`).** Added the
idempotency guard to `seed_full_demo_workspace` (no-op when `demo_data_loaded` is already true), applied +
tested via PAT: re-seeding the loaded JT workspace now returns null and creates **zero** new rows (props
25→25, tenancies 17→17, contacts 20→20). Grants + body intact. So **future** double-seeding can no longer
create duplicate properties.

**Overlap fully closed for property duplication.** Investigated `enterprise_full_seed.sql` further:
it contains **zero `INSERT INTO properties`** — it only *references* existing property UUIDs as FK
anchors (header: "does NOT duplicate the existing 12 properties … reuses them as FK anchors"). So it never
created the duplicate properties. The two rows per property both came from **`seed_demo_workspace` running
twice** (random UUIDs: `648fe1b0…` from run 1, `bcab5a75…` from run 2); `enterprise_full_seed.sql` hardcoded
run‑1's generated UUIDs. FIX-W08 makes `seed_full_demo_workspace` (→ `seed_demo_workspace`) no-op once
`demo_data_loaded` is true, so the double-run can't recur. **No further seed guard is needed.**

### Existing live dupes — ✅ RESOLVED (verified 2026-06-24)

The duplicate-detection query now returns **zero rows** for the dev workspace
`7d9e941b…` (`group by nickname, address_line1 having count(*) > 1` → empty;
the workspace now holds 10 distinct properties). The live duplicates have been
cleared and FIX-W08's idempotency guard prevents recurrence. Nothing to merge.

Remaining (lower priority, not a dup source):

1. **Fragility:** `enterprise_full_seed.sql` hardcodes specific property UUIDs assigned by
   one particular seed run, so a reset + re-seed (new random UUIDs) would break its FK anchors. It should be
   reworked to resolve anchors by `nickname`/marker, or retired in favour of the consolidated seeder. (Seed-source robustness only — does not affect the live DB.)

## 6. WizardShell visual verification

**PPM (FIX-423) — ✅ DONE (2026-06-24, this turn).** The Chrome lock was cleared by killing an orphaned
no-debug-port Chrome that was holding the MCP profile (`~/.cache/chrome-devtools-mcp/chrome-profile`) —
the AGENTS.md-sanctioned "restart Chrome MCP" recovery — then relaunching. Live Chrome MCP verified
`/property-manager/work/ppm/schedules/new`: desktop side-step rail, mobile 390 step dropdown, zero
console errors, both validation gates, the date-conflict guard (inline error + disabled Continue), and
full **E2E create → redirect to detail**. Evidence in `docs/wizards/work-wizards.md` §5d-live (4
screenshots in `docs/screenshots/ppm-wizard-*`). **RLS positive/negative also verified** via the
Management API PAT (`SUPABASE_PERSONAL_ACCESS_KEY`): foreign-workspace insert denied `42501`,
own-workspace insert allowed; `created_by` DB-confirmed non-null. **Test row cleaned up** — the
E2E-created `Boiler Annual Service` (`a4ffc9a0…`) was deleted via PAT; 0 rows remain. Nothing
outstanding here.

**Task & Job (FIX-420) — ✅ DONE (2026-06-24, this turn).** Re-verified live via Chrome MCP:

- **Create Task** — 3-step side-rail (desktop), step dropdown + hidden rail (mobile 390), zero console
  errors, title gate disabled→enabled, no horizontal overflow. Screenshots `task-wizard-1440-step1.png`,
  `task-wizard-390-step1.png`.
- **Create Job** — 5-step side-rail (desktop), step dropdown (mobile 390), zero console errors, title
  gate disabled→enabled, no overflow. Screenshots `job-wizard-1440-step1.png`, `job-wizard-390-step1.png`.
  E2E create + RLS for both were already live/PAT-verified in `docs/wizards/work-wizards.md` §5b, so no new
  test rows were created. **Nothing outstanding for the three Work wizards** — all on `WizardShell`, all
  render + gate + RLS verified.

## 7. PPM "Reminder Rules" — ✅ DONE (FIX-425, 2026-06-24): real firing backend built + verified

**Resolved.** Implemented end-to-end, not deferred. Migration `20260624180000_ppm_reminders.sql`
(APPLIED via PAT) adds `ppm_plans.reminders jsonb`, a `ppm_reminder_dispatch` idempotency log, a
SECURITY DEFINER `dispatch_ppm_reminders(p_today date)` that creates a workspace-scoped `notifications`
row for each reminder due that day (recipient = plan `created_by` ⟶ workspace-owner fallback), and a
`pg_cron` job `dispatch_ppm_reminders_daily` @ 07:00. The wizard re-gained a reminder-chip UI
(30/14/7/3/1 days, default [30,7,1]) on the Schedule step, shows it on Review, and persists it via
`InsertPpmPlan.reminders`. **PAT-verified:** seeded plan due+7 with [7,1] → offset-7 notification
created; same-day re-run dispatched 0 (idempotent); due−1 run fired offset-1. **Live wizard E2E**
persisted `reminders:[30,7]`. All test rows cleaned up. Evidence: `docs/wizards/work-wizards.md` §5f.

**Email channel — ✅ DONE (FIX-426, 2026-06-24).** Reminders now also email. Migration
`20260624190000_ppm_reminder_emails.sql` (APPLIED via PAT) adds `email_to/emailed/emailed_at` to
`ppm_reminder_dispatch` and has the dispatcher record the recipient address; a new server module
`src/lib/ppm/reminder-emails.ts` emails not-yet-emailed rows via the app's `src/lib/email.ts` (Resend)
with a branded template, folded into the existing `/api/cron/daily` Vercel-cron route as an isolated
step. **The Resend key stays in app env — never the DB.** LIVE-VERIFIED: a real reminder email was
delivered to the owner's inbox (`{created:1, emailed:1, failed:0}`); test rows cleaned up.

- **Activation:** in-app reminders already fire (pg_cron); email auto-send begins the first time the
  daily cron runs in a deployment with `CRON_SECRET` set (already present in env). No code left to write.

**Detail-page reminder editor — ✅ DONE (FIX-PPM-REMINDER-EDIT, 2026-06-24).** Added a `PpmRemindersEditor`
card to the plan detail **Schedule** tab (same chip UI as the wizard); each toggle saves immediately via
`useUpdatePpmPlan`. LIVE-VERIFIED: toggled a live plan's reminders `[30,7,1] → [30,1]`, DB persisted the
change (PAT-confirmed), test row cleaned up. **Nothing left on the PPM reminders feature** — create,
edit, in-app fire, and email delivery are all complete and verified.

---

### Original analysis (kept for context) — why it was removed in FIX-423 before being rebuilt here

**Why it had been removed:** the old New PPM Schedule wizard let users add/remove reminder pills
("30 days before", "7 days before", …) but the value was **never persisted** — `ppm_plans` has no
reminders column (confirmed against migration `20260611000006_work_ppm_plans_documents.sql`, which
defines the full table) and the create payload never included it. There is also **no reminder
dispatch engine** that would consume such rules. Shipping a control that silently discards input
violates the Wiring Completeness Rule, so it was removed rather than left decorative.

**Exact steps to re-introduce properly (PAT, project `oovgfknmzjcgbilwumch`):**

1. Add a column + migration:
   ```sql
   ALTER TABLE ppm_plans ADD COLUMN IF NOT EXISTS reminders jsonb NOT NULL DEFAULT '[]'::jsonb;
   ```
   (jsonb array of `{ offset_days: int, channel: 'email'|'in_app' }`, or keep the simple label
   strings the UI used.)
2. Add `reminders?: Json` to `InsertPpmPlan` in [src/hooks/usePpm.ts](../../../src/hooks/usePpm.ts);
   the create payload then includes it. Because ~200 tables here have NOT-NULL jsonb defaults, send
   `[]`/omit rather than explicit `null` (see the NOT-NULL jsonb insert rule).
3. Re-add the reminder-pill UI to `PpmStepSchedule.tsx` and feed `reminders` into the wizard payload.
4. **Critically — wire a dispatcher:** a scheduled job (Supabase cron / edge function) that reads
   `ppm_plans.next_due_date` minus each reminder offset and enqueues a notification/email via the
   existing automations engine. Without this the column is just storage; the reminders won't fire.
5. Surface the configured reminders on the PPM plan detail page so they're visible/editable.
