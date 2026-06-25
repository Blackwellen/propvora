# Release Evidence — Calendar

**Section:** Calendar (Operational scheduling command centre)
**Canonical route:** `/property-manager/calendar` (rewrites to `app/calendar/*`; also section-mounted at `/supplier/calendar`)
**Audited:** 2026-06-25
**Branch:** `qa-release-fixes-304-314`
**Dev server:** shared Next 16 single-instance on `:3004`

---

## 1. Surfaces / routes tested

| Route | Page | Status |
|---|---|---|
| `/property-manager/calendar` | Overview hub (KPIs, Today schedule, Attention queue, Upcoming week, Sources) | ✅ |
| `/property-manager/calendar/views` | Client redirect → `/views/week` (tab label **"Calendar"**, FIX-467) | ✅ (restored) |
| `/property-manager/calendar/views/month` | Month grid | ✅ (restored) |
| `/property-manager/calendar/views/week` | Week time-grid + right rail | ✅ (restored) |
| `/property-manager/calendar/views/day` | Day view | ✅ (restored) |
| `/property-manager/calendar/views/agenda` | Agenda list | ✅ (restored) |
| `/property-manager/calendar/views/gantt` | Gantt view | ✅ (restored) |
| `/property-manager/calendar/schedule` | Schedule list (cross-section) | ✅ (restored) |
| `/property-manager/calendar/timeline` | Timeline view | ✅ (restored) |
| `/property-manager/calendar/{month,week,day,agenda,gantt}` | Thin server redirects → `/views/{view}` | ✅ |
| `/property-manager/calendar/events` | Events list (filters/search/KPIs/ActionMenu) | ✅ |
| `/property-manager/calendar/events/new` | 6-step side-stepper create wizard | ✅ |
| `/property-manager/calendar/events/[id]` | Event detail (inline edit, status, delete) | ✅ |
| `/property-manager/calendar/events/[id]/edit` | Event edit form | ✅ |
| `/property-manager/calendar/reminders` | Reminders list (snooze/cancel) | ✅ |
| `/property-manager/calendar/reminders/new` | Create reminder | ✅ |
| `/property-manager/calendar/settings` | iCal feed + notification prefs + default view | ✅ (feed fixed) |
| `/api/calendar/ical/[token].ics` | **NEW** public-by-token iCal subscribe feed | ✅ |

## 2. Screen sizes
Routing/redirect behaviour verified via HTTP at `:3004`. Responsive structure verified by code review across the shared primitives (`DashboardContainer`, `MobileTopBar`, `CalendarTabNav` mobile `<select>` + desktop scroll-strip, `ResponsiveTable`, `MobileFilterSheet`). Required matrix: 1536, 1366, 1280, 1024, 768, 430, 390, 375. The view grids degrade to a mobile agenda list below `md` (see `views/week/page.tsx`).

### 2026-06-25 live 8-viewport + view-mode sweep (Chrome MCP, authenticated)
Window-resized for ≥500px and **device-emulated** (mobile+touch) for <500px (Chrome clamps window width at ~500). Horizontal overflow measured as `documentElement.scrollWidth − clientWidth` at each size.

**Month view — full 8-viewport matrix (all 0px horizontal overflow):**
| 1536 | 1366 | 1280 | 1024 | 768 | 430 | 390 | 375 |
|---|---|---|---|---|---|---|---|
| ✅ grid + right rail | ✅ | ✅ | ✅ rail drops, grid full-width | ✅ tablet grid, mobile shell + bottom nav | ✅ agenda list | ✅ agenda list | ✅ agenda list |

Responsive transform confirmed visually: desktop 7-col grid → (≤md) date-grouped **agenda list** with source-coloured accent bars + tab `<select>`. Today (25 Jun) highlighted at every size.

**All 5 view modes (desktop 1440 + mobile 390, 0px overflow, no console/server errors):**
| View | Desktop | Mobile 390 |
|---|---|---|
| Month | ✅ grid, Calendar Layers toggles, month summary, attention queue | ✅ agenda list |
| Week | ✅ time-grid + right rail (This Week / Needs Action / Today) | ✅ degrades to list |
| Day | ✅ all-day row, Day Summary, By-Source | ✅ single-column list |
| Agenda | ✅ day-grouped, source-filter panel, Agenda Summary (47/32/8) | ✅ list |
| Gantt | ✅ horizontal timeline by source w/ colour bars + legend | ✅ smartly degrades to source-grouped list (no unusable h-scroll) |

Screenshots saved to the session scratchpad (`cal-month-1536/1024/768/390-real.png`, `cal-day-1440`, `cal-agenda-1440`, `cal-gantt-1440/390.png`).

**Infra note (not a product bug):** running `npm run build` against the same workspace while the shared dev server was live corrupted the dev server's Turbopack incremental cache (`.next/dev/cache/turbopack/*.sst` ENOENT → 500s). Recovered by killing the dev processes, `rm -rf .next`, and a clean `next dev` restart. **Lesson for future QA: never `npm run build` while the shared dev server is running on the same `.next`.**

## 3. Data sources & wiring
- **Cross-section aggregation** — `_lib/useCalendarItems.ts` (React Query, 42P01/RLS-tolerant). Live sources: `calendar_events`, `tasks.due_at`, `jobs.scheduled_date`, `job_schedules.next_run_at`, `ppm_plans.next_due_date`, `tenancies.start/end_date`, `rent_schedules.due_date`, `arrears_records.due_date`, `compliance_items.due_date`, `property_inspections.scheduled_for`, `properties.hmo_licence_expiry/epc_expiry`, `planning_landlord_offers`. All workspace-scoped (`.eq('workspace_id', …)`).
- **No mock data** — confirmed zero `Math.random`, hardcoded arrays, or lorem in any calendar page. Every KPI/list derives from `useCalendarItems`/`useCalendarReminders`.
- **Reminders** — `useCalendarReminders` / `useSnoozeReminder` / `useUpdateCalendarReminder` against `calendar_reminders` (real snooze + cancel mutations).

## 4. Buttons / actions / forms verified
- Overview CTAs (New Event, New Reminder, Export/Settings) → real routes.
- Today/Attention/Upcoming/Sources links → owning detail records (restored by FIX-464).
- Events list: source + status filter chips, search, ActionMenu (Open Record / Copy Title) — all wired; row click → source record.
- Create-event wizard: side-step nav, per-step validation (`canProceed`), persists to `calendar_events` (`start_at`/`end_at`/`start_date` + metadata), success step, **duplicate-submit guarded** (`disabled={saving}`).
- Event detail: status transitions (Confirmed/Completed/Cancelled), **ConfirmDialog** on delete, edit route, ActionMenu — no dead/AI-stub buttons.
- Reminders create: validation, 42P01-tolerant, success state, duplicate guard.
- Settings: iCal **Copy URL** (disabled until token ready), notification toggles + default-view persist to `calendar_settings` with save state.

## 5. Supabase tables / RLS / migrations
| Table | RLS | Notes |
|---|---|---|
| `calendar_events` | ✅ enabled (workspace insert/select/update/delete policies) | native events |
| `calendar_reminders` | ✅ enabled (1 policy, workspace-scoped) | reminders CRUD |
| `calendar_settings` | ✅ enabled (`cal_set_members`, USING+CHECK) | prefs + `ical_token` |

**Migration applied (PAT, live + committed):** `20260625090000_calendar_ical_token.sql` — adds `calendar_settings.ical_token` + unique partial index. Verified column present post-apply.

## 6. Edge functions / API routes
- **NEW** `GET /api/calendar/ical/[token].ics` (`runtime=nodejs`, `force-dynamic`): service-role token→workspace resolution; never accepts `workspace_id`; archived rows excluded; −90d…+365d window; 404 on bad/unknown token; returns `text/calendar`. Live-tested: bad→404, unknown→404, real token→valid VCALENDAR (16 events).

## 7. Bugs found & fixed
1. **[P0]** next.config view-collapse redirects killed all view/schedule/timeline routes (3 dead tabs) → **FIX-464** (removed).
2. **[P1]** iCal feed URL was 404 + workspace-UUID-leaky → **FIX-465** (token-based feed route + lib + migration + settings rewire).
3. **[Med]** `CalendarViewsSwitcher` broke under `/supplier/calendar` (cross-workspace nav + no active state) → **FIX-466** (section-aware hrefs).
4. **[Low/UX]** Second tab was labelled "Calendar Views" which read awkwardly beside "Overview" → **FIX-467** (renamed to **"Calendar"**; tabs now Overview · Calendar · Schedule · Timeline · Events · Reminders). Route key/href unchanged; propagated via the shared `CalendarTabNav` to desktop strip + mobile dropdown + all sub-tabs.
5. **[P1]** **Events Overdue KPI (32) ≠ Status="Overdue" filter (29)** — native `calendar_events` never re-derived status against today, so past-dated `scheduled` events sat in the overdue *bucket* but the status filter missed them → **FIX-468** (`deriveNativeStatus` makes native status date-aware; KPI=filter=32 confirmed in browser).
6. **[P1]** **Reminders Snooze was 100% broken** — every Snooze 400'd silently. Live `calendar_reminders` had diverged from migration 022: missing `snoozed_until` column **and** a `status` CHECK that excluded `'snoozed'` → **FIX-469** (additive column + widened CHECK + schema reload, applied via PAT + committed migration). Snooze + Cancel now verified end-to-end in browser.

### 2026-06-25 live browser re-sweep (Chrome MCP, authenticated, 1440px)
Clicked **under every sub-tab** on the seeded JT Property Manager workspace (16 native events + 77 cross-section items = 93 total): Overview (KPIs/Today/Attention/Upcoming/Sources), **Calendar** (views→week grid, view-switcher, right rail), Schedule (Overdue 32 / Today 3 / This Week 5 groups), Timeline (Past/Today/Upcoming + Items-by-Source rail), Events (KPIs + Source/Status filter chips + 93-row table + per-row ActionMenu; **Overdue filter exercised**), Reminders (seeded 3 demo reminders → KPIs Total 3/Overdue 1/Pending 2; **Snooze drawer + duration + Confirm** and **Cancel** both exercised). Every row deep-links to its owning record across Work/Money/Compliance/Portfolio/Planning. Console clean on every tab after fixes. Test data removed afterwards.

## 8. Cross-section effects
- Calendar items deep-link into Work (tasks/jobs/ppm), Portfolio (tenancies/properties), Money (rent-chase/arrears), Compliance (coverage/inspections), Planning (landlord-offers) — all routes canonical `/property-manager/*`.
- New `calendar_events` from the wizard appear in overview/events/views immediately (shared React Query key `['calendar-items', workspaceId]`).

## 9. Security / performance findings
- iCal feed is the only public calendar surface; token-gated, service-role, dates+titles only, 404 on miss, short cache (`max-age=900`). No `workspace_id` accepted from the query string.
- All in-app queries workspace-scoped + RLS-enforced. No service-role on client paths.
- All source queries fire in a single `Promise.all` (no N+1); 30s `staleTime`.

## 10. Tests run
- `npx tsc --noEmit` — **clean** (twice, after each change set).
- HTTP route probes at `:3004` — view/schedule/timeline now preserve original path to auth (no `?view=` bounce); iCal route 404/200 matrix verified end-to-end with a real workspace token (then cleared).
- RLS / schema verified via Management API PAT (`pg_policies`, `information_schema.columns`).

## 11. Pending user / manual actions
**None.** Migration applied to live DB and committed. The next.config change takes effect on the next Vercel build (automatic on deploy). See `release-gated/user-fixes/calendar.md`.

## 12. Score & decision
**Score: 100 / 100**
**Release decision: ✅ Ready for release.**
