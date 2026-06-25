# Manual verification — Work › PPM nested sub-tabs

All code defects found in this drop were fixed in-session (see `release-gated/docs/work/ppm/ppm-nested-tabs.md`). The items below are **visual confirmations**, not code fixes — they require a running dev server + Chrome MCP + seeded data, which were not run in this code-audit session.

## Why Claude Code did not complete these
These are browser-only visual/interaction checks against **seeded data**. The code is build-clean and the data wiring was verified by reading the hooks, but the timeline's month-bucketing and the donut/busiest-months panels are only meaningfully confirmed with multi-month `ppm_plans` data present.

## Exact steps
1. Seed `ppm_plans` for the dev workspace (`oovgfknmzjcgbilwumch`) via the Management API — at least 8 plans across **3+ properties** with `next_due_date` spread over the next 6 months and a mix of `status` (scheduled / due_soon / overdue / completed) and `category` values.
2. Start dev server on a claimed port (`npm run dev -- -p 3002`) and Chrome MCP (port 9222+).
3. For each route, resize and screenshot at 1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812:
   - `/property-manager/work/ppm/overview`
   - `/property-manager/work/ppm/schedules` — verify real property names show, Export downloads CSV, pagination prev/next + rows-per-page work, page resets on filter change.
   - `/property-manager/work/ppm/timeline` — verify markers land in correct month columns, ◀/▶/Today shift the window, search filters rows, markers click through to `/ppm/[id]`, "Upcoming Load" donut + "Busiest Months" reflect seeded data, mobile grid scrolls horizontally without clipping.
4. Confirm zero console errors / React warnings / hydration warnings / failed network calls on each route.
5. Save screenshots under `release-gated/docs/work/ppm/screenshots/`.
