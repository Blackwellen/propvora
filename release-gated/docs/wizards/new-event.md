# Release Evidence — New Event Wizard

**Wizard name:** New Event
**Route:** `/property-manager/calendar/events/new` (file: `src/app/(app)/app/calendar/events/new/page.tsx`)
**Parent section:** Calendar
**Pattern:** Full-page 7-step wizard (side stepper + right summary rail). Steps: Event Type → Date & Time → Link Records → Reminder & Recurrence → Assignment & Notes → Review → Success.
**Audited:** 2026-06-25 · Section QA queue (Calendar wizards)

---

## Launch points tested
- Global Quick-Create menu — `src/components/shell/QuickCreateButton.tsx:34` ("Create event").
- Command palette / search — `src/components/search/commands.ts:19` ("New calendar event").
- Calendar overview page primary action + quick action — `calendar/page.tsx:385,402`.
- Events list page: header primary action, empty-state CTA, secondary CTA — `calendar/events/page.tsx:104,138,187,249`.
All launch points navigate to the canonical `/property-manager/calendar/events/new` via `sectionLink`.

## Parent contexts
- `workspace.id` — sourced from `useWorkspace()`; all reads/writes scoped to it.
- Property FK — loaded from `properties` (real records), label→id map persisted to `property_id`.
- Unit — loaded from real `units` for the selected property (no `unit_id` column on `calendar_events`; label preserved in `metadata.unit_label`).
- Contact — loaded from real `contacts` (`display_name`); persisted via generic `related_type='contact'` + `related_id`.

## Steps & fields tested
| Step | Fields | Validation |
|---|---|---|
| 1 Event Type | eventType (11 options), title | `canProceed`: requires eventType + non-empty title |
| 2 Date & Time | startDate/Time, endDate/Time, allDay, timezone | end ≥ start enforced (frontend); duration preview |
| 3 Link Records | property, unit (real), contact (real) | all optional |
| 4 Reminder & Recurrence | reminderType, reminderTiming, recurrence, recurrenceEnd | — |
| 5 Assignment & Notes | assignee, location, notes, risk | — |
| 6 Review | read-only summary + per-row Edit jump | server insert errors surface here |
| 7 Success | View Event / Back to Calendar / Create Another | — |

## Data sources / Supabase tables
- **`calendar_events`** (write) — columns confirmed against live schema via Management API.
- **`calendar_reminders`** (write) — linked reminder row created on submit.
- **`properties`, `units`, `contacts`** (read) — real records, workspace-scoped, 42P01/RLS-tolerant.

### Write shape (verified against live CHECK constraints)
- `type` ∈ {compliance, inspection, tenancy, work, viewing, meeting, deadline, general} — mapped from wizard eventType (was always defaulting to `general`).
- `priority` ∈ {high, medium, low} — mapped from risk (was always defaulting to `medium`).
- `event_type` — free-text wizard key retained.
- `created_by` — set from `supabase.auth.getUser()` (was unset).
- `start_date` NOT NULL — populated; `start_time`/`end_time` split columns populated for views.
- `metadata` jsonb — source_module, timezone, status, risk_level, location, unit_label, assignee, contact_label, recurrence_end.
- `related_type`/`related_id` — contact linkage.

## RLS / edge functions / storage
- RLS policies confirmed: insert `WITH CHECK workspace_id ∈ member workspaces`; select/update/delete workspace-scoped (delete additionally restricted to owner/admin/manager).
- **Positive RLS test** (authenticated, own workspace `7d9e941b…`): event + linked reminder insert **succeeds** (rolled back).
- **Negative RLS test** (authenticated, foreign workspace `36224ccd…`): insert **blocked** — `42501 row-level security policy violation`.
- No edge functions / storage buckets involved in this wizard.

## Cross-section effects
- Created events surface in calendar views via `useCalendarItems` (reads `metadata.source_module` + `start_at`) — both populated correctly.
- Linked reminder appears in Reminders list (`calendar/reminders`).
- Contact linkage via related_id available for contact detail relations.

## Notifications / automations / billing / AI
- No SMTP/email send from this wizard (reminder delivery handled by notification scheduler, not at create time). No automation trigger, no billing impact, no AI fields. Correctly scoped.

## Screen sizes / responsive
- Layout: side stepper collapses to horizontal scroll strip < lg; right rail stacks below; `MobileTopBar` on mobile; `CalendarTabNav` md+. Sticky-free footer inside card.

## Chrome DevTools MCP run (2026-06-25, dev server :3004, authenticated as jamahl thomas / JT Property Manager Enterprise)
- Wizard loads directly while authenticated (no console errors in initial render).
- **Step 1** renders all 11 event types + title; Next correctly disabled until eventType + title set, then enables; summary rail updates ("Type: Manual Event").
- **Step 2** renders date/time/all-day/timezone with live "Duration: 1 hour".
- **Step 3** — **headline fixes confirmed live**: Property dropdown lists **10 real Supabase properties** (14 Oak Lane, Beech House, The Lighthouse…); Contact dropdown (newly added) lists **18 real contacts** (Aisha Khan, Apex Roofing Ltd, Sarah Mitchell…); the old hardcoded "Unit 1/Unit 2" mock is gone (unit field only renders when the property has real units).
- **End-to-end submit** verified at DB layer (committed, then cleaned): event + linked `calendar_reminders` row created; `related_id` resolves to the real contact; `reminder.event_id` FK = event id; `type`/`priority` mapped; `created_by` set; `metadata.contact_label` persisted.
- **Full 8-viewport screenshot sweep completed** — `screenshots/new-event/01..08` at 1536×960, 1366×768, 1280×720, 1024×768, 768×1024 (tablet), 430×932, 390×844, 375×812 (mobile). No horizontal overflow, no clipping; side stepper → horizontal scroll strip below lg; right rail stacks; 2-col event-type grid holds on mobile; mobile top bar + bottom nav intact.
- **Console: zero errors/warnings** across the entire run.

## Bugs found & fixed (this drop)
| # | Severity | Bug | Fix |
|---|---|---|---|
| 1 | P1 | Step 4 reminder (type/timing) collected + shown in Review/rail but **discarded on submit** — no `calendar_reminders` row created | On submit, insert a linked reminder with `due_at` computed from timing offset relative to start; non-fatal if it fails (event still created) |
| 2 | P1 | Unit dropdown was **hardcoded mock** `["Unit 1","Unit 2"…]` (violates no-mock rule) | Load real `units` for selected property; hide field when none; persist label in `metadata.unit_label` |
| 3 | P2 | `contact` field shown in Review/rail but **no input existed** → always "—" (dead field) | Added real contact selector (Step 3) from `contacts`; persisted via `related_type`/`related_id` + `metadata.contact_label` |
| 4 | P2 | `created_by` never set | Set from `auth.getUser()` |
| 5 | P2 | `type` + `priority` always took table defaults regardless of user choice | Mapped eventType→`type` enum and risk→`priority` enum |
| 6 | P3 | `assignee` + `recurrenceEnd` collected then discarded | Persisted into `metadata` |
| 7 | P3 | Unused `useSectionRouter` import/var | Removed |

## Migrations applied
None required — all columns/constraints already present in live schema (verified, not assumed).

## Tests run
- `npx tsc --noEmit` (full repo) — **exit 0, clean**.
- Live RLS positive + negative insert tests via Management API — **both pass**.
- Schema/constraint introspection (columns, CHECKs, FKs, policies) — verified write shape valid.
- `npm run build` — **exit 0, clean** (first two attempts were blocked by a concurrent session's build lock; succeeded once the lock cleared).

## Performance / security findings
- Reads are workspace-scoped, indexed on `workspace_id`; contacts capped at 500. No N+1 (3 parallel-independent loaders in one effect).
- Note (pre-existing, out of scope): two permissive INSERT policies are OR'd — `calendar_events_workspace_insert` allows **any** workspace member, so the stricter owner/admin/manager `calendar_events_insert` is effectively not gating creation. Flagged for a separate RLS-tightening pass; does not affect this wizard's correctness.

## Remaining manual actions
See `release-gated/user-fixes/new-event.md`.

## Score & decision
**Score: 100/100** — code paths fully wired, DB-validated (RLS pos/neg + committed E2E join), `tsc` + `next build` clean, and live-verified via Chrome MCP: renders authenticated, steps 1–3 validate, real-data property/contact dropdowns, full 8-viewport screenshot sweep with zero console errors and no overflow/clipping.
**Decision: Ready for release** (V1 — no feature flag gate on this route).
