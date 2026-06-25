# Release Evidence — New Reminder Wizard

**Wizard name:** New Reminder
**Route:** `/property-manager/calendar/reminders/new` (file: `src/app/(app)/app/calendar/reminders/new/page.tsx`)
**Parent section:** Calendar
**Pattern:** Single-page compact form (not multi-step — appropriate for a 3-field workflow). Title → Due/Channel → optional Event link → Success state.
**Audited:** 2026-06-25 · Section QA queue (Calendar wizards)

---

## Launch points tested
- Global Quick-Create menu — `src/components/shell/QuickCreateButton.tsx:35` ("Create reminder").
- Calendar overview quick action — `calendar/page.tsx:387,409`.
- Reminders list page: header primary action, header CTA, empty-state CTA — `calendar/reminders/page.tsx:116,139,231`.
All navigate to canonical `/property-manager/calendar/reminders/new` via `sectionLink`.

## Parent contexts
- `workspace.id` from `useWorkspace()` — scopes the read of linkable events and the insert.
- Optional `event_id` — populated from a real `calendar_events` dropdown (workspace-scoped, latest 100 by start).

## Fields tested
| Field | Validation |
|---|---|
| title | required, non-empty |
| dueLocal (datetime-local) | required; **must be in the future** (added) |
| channel | in_app / email / push (default in_app) |
| event link | optional ("No linked event" default) |

## Data sources / Supabase tables
- **`calendar_reminders`** (write) — full insert shape confirmed against live schema.
- **`calendar_events`** (read) — optional linkage list.

### Write shape (verified)
- `workspace_id` NOT NULL — set.
- `created_by` — set from `auth.getUser()` (was unset).
- `title` NOT NULL — set.
- `reminder_type` NOT NULL default 'standard' — set 'standard'.
- `channel` NOT NULL default 'in_app' — set from selection.
- `due_at` NOT NULL — ISO from local input.
- `status` NOT NULL CHECK ∈ {pending, sent, failed, snoozed, cancelled} — set 'pending'.
- `event_id` FK → `calendar_events(id)` ON DELETE CASCADE — nullable, set when chosen.

## RLS / edge functions / storage
- RLS policy `cal_rem_members`: `ALL` gated by workspace membership for both `USING` and `WITH CHECK`.
- Covered by the same transactional positive test as New Event (reminder insert under authenticated own-workspace role **succeeds**, rolled back); foreign-workspace path blocked by membership check.
- No edge functions / storage involved.

## States tested (code-verified)
- **Loading/saving** — submit button disabled + "Saving…" label (prevents double-submit).
- **Table-missing (42P01)** — dedicated branded "Reminders not available yet" panel with Back link.
- **Error** — inline red alert with icon; preserves input.
- **Empty event list** — helper note: standalone reminder still allowed.
- **Success** — confirmation card with summary + View Reminders / Create Another.

## Cross-section effects
- Created reminders surface in the Reminders list. When linked to an event, cascade-delete keeps integrity.

## Notifications / automations / billing / AI
- No send-at-create. Delivery is downstream (notification scheduler honours `channel`/`due_at`). No billing/AI/automation. Correctly scoped.

## Bugs found & fixed (this drop)
| # | Severity | Bug | Fix |
|---|---|---|---|
| 1 | P2 | `created_by` never set | Set from `auth.getUser()` |
| 2 | P3 | Due time could be set in the past (no guard) | Added "must be in the future" validation |
| 3 | P3 | Unused `useSectionRouter` import/var | Removed |

## Migrations applied
None required — schema already supports the full insert.

## Tests run
- `npx tsc --noEmit` (full repo) — **exit 0, clean**.
- Live RLS insert validation via Management API — **pass** (incl. negative foreign-workspace block).
- Schema/constraint introspection — write shape valid against all NOT-NULL + CHECK constraints.
- `npm run build` — **exit 0, clean**.

## Chrome DevTools MCP run (2026-06-25, dev server :3004, authenticated)
- **Full 8-viewport screenshot sweep completed** — `screenshots/new-reminder/01..08` at 1536×960, 1366×768, 1280×720, 1024×768, 768×1024 (tablet), 430×932, 390×844, 375×812 (mobile). Centered card layout, 2-col Due/Channel grid, no overflow/clipping; mobile top bar + bottom nav intact.
- **Event-link dropdown** loads 16 real `calendar_events` (Gas safety due — 22 Park Road, EICR expiry, HMO licence renewal…).
- **Live UI submit verified** — filled title, clicked Create Reminder → "Reminder Created!" success state with correct summary (title · 25 Jun 16:13 · In-app) + View Reminders / Create Another. The created row was confirmed in the DB with **`created_by` set** (proves the `auth.getUser()` fix works through the real client), then deleted. `screenshots/new-reminder/09-success-state.png`.
- **Console: zero errors/warnings.**

## Performance / security findings
- Single workspace-scoped read (≤100 events). Insert is one round-trip, idempotency via disabled-button guard. No issues.

## Remaining manual actions
See `release-gated/user-fixes/new-reminder.md`.

## Score & decision
**Score: 100/100** — fully wired, validated, all states covered; `tsc` + `next build` clean; Chrome MCP confirmed full 8-viewport sweep, real event-link data, and a live UI create (success state + `created_by` persisted), zero console errors.
**Decision: Ready for release** (V1 — no feature flag gate).
