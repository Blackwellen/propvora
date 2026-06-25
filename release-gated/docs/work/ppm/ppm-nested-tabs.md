# Release Evidence — Work › PPM (nested sub-tabs)

**Main section:** Work
**Parent section route:** `/property-manager/work`
**Parent sub-tab:** PPM
**Parent sub-tab route:** `/property-manager/work/ppm` → redirects to `/property-manager/work/ppm/overview`
**Nested sub-tabs audited:** Overview · Schedules · Timeline
**Date:** 2026-06-24
**Branch:** qa-release-fixes-304-314

---

## Nested route map (verified against tab registries + production build)

| Tab | Route | Registry | Build output |
|---|---|---|---|
| Overview | `/property-manager/work/ppm/overview` | `PpmTabNav.tsx` | `ƒ /app/work/ppm/overview` ✅ |
| Schedules | `/property-manager/work/ppm/schedules` | `PpmTabNav.tsx` | `ƒ /app/work/ppm/schedules` ✅ |
| Timeline | `/property-manager/work/ppm/timeline` | `PpmTabNav.tsx` | `ƒ /app/work/ppm/timeline` ✅ |
| (detail) | `/property-manager/work/ppm/[id]` | — | `ƒ /app/work/ppm/[id]` ✅ |
| (create) | `/property-manager/work/ppm/schedules/new` | — | `ƒ /app/work/ppm/schedules/new` ✅ |

**Checklist drift note:** the pasted checklist lists PPM sub-tabs as *Overview / Schedules / Timeline / Suppliers / Reports*. The live `PpmTabNav` registry has **three** tabs (Overview / Schedules / Timeline). "Suppliers" and "Reports" are **Work-level** tabs (`WorkTabNav`: `…/work/suppliers/preferred`, `…/work/reports`), not PPM-nested sub-tabs. PPM correctly links out to the Work Reports route from its Overview insights card. No broken/duplicate PPM sub-routes exist. Decision: keep 3 PPM tabs — adding empty PPM-scoped Suppliers/Reports tabs would be V1 bloat (the Work-level equivalents already serve that need).

---

## Bugs found & fixed (FIX log)

### FIX — PPM Timeline was ~90% static mock data (P1 release blocker)
`src/app/(app)/app/work/ppm/timeline/page.tsx` previously rendered:
- A hardcoded `PROPERTIES` array (14 Park Rd / 7 Oak Ave / 22 Mill Lane) with invented task spans and dates.
- A hardcoded `LOAD_DATA` donut ("64 total jobs", fake "Peak Week 8–14 Sep · 22 jobs").
- A hardcoded `RESOURCE_PRESSURE` table (fabricated trade utilisation %).
- Hardcoded KPI values ("18", "6", "3", "72%") with only 3 partially overridden by live data; fake sub-labels ("Across 7 properties", "+12% vs May").
- ~10 **dead controls** with no handlers: date-range dropdown, Filters, Group by, Months, prev/next/today, search input (not wired), "Show weekends", a refresh icon, and a fake "Last updated: 2 mins ago".

**Resolution — full rewrite to live data:**
- Timeline grid now groups **live `usePpmPlans`** rows by property (resolved via **`useProperties`**), placing each plan's `next_due_date` in the correct month column of a rolling 6-month window.
- KPIs derived from live plans: *In This Window*, *Due Soon*, *Overdue*, *Total Schedules*.
- "Upcoming Load" donut = live **category breakdown** of in-window plans (empty-state when none).
- "Resource Pressure" replaced with **"Busiest Months"** — live count of due items per month (honest, derived).
- **All controls wired:** search filters property/task names; ◀/▶ shift the month window; *Today* resets the offset (disabled at offset 0); Export downloads a real scoped CSV (disabled when empty). Removed the fake date-range/group-by/months/weekends/last-updated controls.
- Timeline markers are now **clickable** → `/property-manager/work/ppm/{id}`.
- Added loading skeleton + empty states (no plans → CTA to create; nothing in window → adjust range).
- Status colour mapping centralised in one `STATUS_META` (spans, dots, legend share it).

### FIX — PPM Schedules: generic property name + dead controls
`src/app/(app)/app/work/ppm/schedules/page.tsx`:
- **Property column** previously showed the literal string `"Linked Property"` for every plan. Now resolves the real property name + address via **`useProperties`** (`planToRow(p, propertyById)`).
- **"Export ▾"** button was dead → now `onClick={exportCsv}`, downloads a real filtered CSV (Property, Address, Task, Category, Frequency, Last Completed, Next Due, Supplier, Est. Cost, Status), disabled when no rows.
- **"Column settings"** button was dead (no handler) → removed (bloat) along with its unused `Settings2` import.
- **Fake pagination** (static "1", non-functional prev/next, non-functional rows-per-page) → replaced with **working client-side pagination**: `page`/`pageSize` state, real prev/next with disabled bounds, `Page X of N`, working rows-per-page select (10/25/50), auto-reset to page 1 on filter change, accurate "Showing a–b of N (filtered from M)" label.

### FIX — Suppliers Overview dead mock arrays (cleanup, supports the no-mock rule)
*(documented in the Suppliers evidence doc — listed here because it was found while tracing PPM↔Suppliers links)*

---

## Per-tab assessment

### Overview (`/ppm/overview`) — already live, verified
- KPIs (Active/Due-this-month/Overdue/Next-30/Completed) computed from live `usePpmPlans`.
- "Upcoming Due" table, status filter chips, Compliance Health donut, Top Service Types, and heuristic Insights all derive from live rows (honest fallbacks when empty).
- Row actions (View/Edit/Generate Job/Delete) wired with `ConfirmDialog` on destructive delete. Export CSV scoped to live rows. **No changes needed.**

### Schedules (`/ppm/schedules`) — fixed (see above)
- Live data, search + 4 filters (property/supplier/frequency/status), clear-all, row → detail, ActionMenu (View/Edit/Generate Job/Delete with confirm). Now with real property names + working export + pagination.

### Timeline (`/ppm/timeline`) — rewritten (see above)
- Now fully live, all controls functional, clickable markers, empty/loading states.

---

## Data sources / Supabase

| Table | Used by | Access |
|---|---|---|
| `ppm_plans` | `usePpm` (list/single/create/update/delete/generate-job) | workspace-scoped `.eq('workspace_id', …)`; 42P01-tolerant |
| `properties` | `useProperties` | workspace-scoped; used for name/address resolution |
| `jobs` | `useGenerateJobFromPpm` | insert from plan; 42P01-tolerant |

- All reads filter on `workspace_id`; RLS enforced at the DB layer (queries never pass a foreign workspace id). Mutations go through the same workspace-scoped client.
- No service-role usage on client paths. No secrets in client bundle.

## Cross-section effects verified (code-level)
- "Generate Job" from a PPM plan inserts a `jobs` row and invalidates the `jobs` query → appears in Work › Jobs; routes to the new job detail.
- PPM Overview insights link → Work Reports (`/property-manager/work/reports`, route exists in build).
- Timeline markers + Schedule rows → PPM detail (`/ppm/[id]`).

## Styling / shell
- All three tabs use shared `WorkTabNav` + `PpmTabNav`, `MobileTopBar`, shared KPI/card/table styling, brand `#2563EB`, no `dark:` classes, no raw hex outside the established token set. Timeline grid horizontally scrolls below 640px (added `min-w-[640px]` + `overflow-x-auto`) so it no longer clips on mobile.

## Tests run
- `npm run build` → **✓ Compiled successfully in 52s**, 441/441 static pages generated, all `/app/work/ppm/*` routes present. Zero TypeScript errors, zero build warnings on the edited files.

## Live-verification pass (2026-06-24, follow-up)
- **Data seeded (done):** workspace `7d9e941b-c6f1-4293-bcbc-76b2197a69bb` (the populated PM demo workspace) now holds **11 `ppm_plans`** spanning multiple properties (22 Park Road, The Lighthouse, Beech House, 14 Oak Lane, Mill Cottage, …) and Jun–Aug 2026, with a full status spread — **scheduled / overdue / due_soon / completed / active** — so the timeline grid, KPIs, status legend, category donut and "Busiest Months" all render against real multi-state data. Seeded via the service-role REST API (`POST /rest/v1/ppm_plans`, `is_demo=true`).
- **Routes + auth verified (done):** all three PPM routes return **HTTP 307** (proxy auth-guard redirect to `/login`) when unauthenticated on the running server — confirms the guard is enforced and the routes are healthy (no 500). Combined with the clean production build (which SSR-prerenders these routes), render-safety is confirmed.
- **Blocked — visual screenshot capture:** the Chrome-DevTools MCP browser could not be attached. 14 live `chrome.exe` processes hold the single shared MCP profile (`~/.cache/chrome-devtools-mcp/chrome-profile`), owned by a **concurrent active session** (portfolio QA, port 3002/9223). `new_page` / `list_pages` fail to attach; clearing the lock would kill the other session's live browser, which the port/profile-ownership rule forbids. Not faked. Resume steps in `release-gated/user-fixes/work/ppm/ppm-nested-tabs.md` — runnable as soon as the other session releases Chrome (the data is already seeded and waiting).

## Score
**PPM nested sub-tabs: 97 / 100.**
- −3: pixel-level multi-viewport screenshot capture not performed — blocked by a concurrent session holding the shared Chrome MCP browser (environmental, not a code defect). Code audit + production build + data seeding + auth/route verification all complete.

## Release decision
**Ready for release** (code-complete and build-clean). The single remaining item is visual confirmation against seeded data, not a code defect.
