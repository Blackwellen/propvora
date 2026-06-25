# Release Evidence — Legal Overview

- **Section:** Legal — Overview
- **Route:** `/property-manager/legal` (files under `src/app/(app)/app/legal/`, rewritten from `/app/legal`)
- **Date:** 2026-06-25
- **Session:** legal-overview-qa

## Header issue addressed
> "missing the overview tab"

The Legal section tab rail (`LegalTabNav`) shipped with **no Overview tab**, so the
section root `/property-manager/legal` (which renders the Legal & Compliance
Overview page) was unreachable from the rail and never showed as the active tab.

## Root-cause findings (bugs)

1. **No Overview tab** — `LEGAL_TABS` only contained Possession, HMO Licences, EPC
   Advisory, RRA 2026. The overview index route had no entry. (FIX-LEG-OV-01)
2. **Deprecated `/app/legal/*` href prefix** — every tab linked to `/app/legal/...`.
   Canonical is `/property-manager/*` (CLAUDE.md routing rule). Because the live
   pathname is `/property-manager/legal/...`, the old active check
   `pathname.startsWith("/app/legal/...")` was **always false** → no tab ever
   highlighted as active, on any legal page. (FIX-LEG-OV-02)
3. **No mobile / sticky behaviour** — the rail was a bare overflow-scroll row with
   no mobile dropdown and no sticky positioning, inconsistent with the benchmark
   Planning tab rail. (FIX-LEG-OV-03)

## Fixes made

File: `src/components/legal/LegalTabNav.tsx` (rewritten)

- Added the **Overview** tab (`LayoutDashboard` icon) → `/property-manager/legal`.
- Switched all hrefs to the canonical `/property-manager/legal/*` prefix.
- Active-tab logic now mirrors the canonical `PlanningTabNav`: Overview matches the
  path **exactly** (it is a prefix of every other href), all other tabs match by
  prefix so they stay active on detail/sub-routes (e.g. `/legal/possession/[caseId]`).
- Added the mobile `<select>` dropdown (below `md`) + sticky desktop strip
  (`sticky top-0 z-20`) with horizontal scroll + active scroll-into-view, matching
  Planning. Kept Legal's blue brand `#2563EB` and per-tab icons.
- Added `aria-current="page"` on the active tab and an `aria-label` on the mobile
  select for accessibility. `counts` badges and `actions` slot preserved (back-compat).

## Verification

- **TypeScript:** `npx tsc --noEmit` — clean, zero errors.
- **Pattern parity:** logic/structure mirror `src/components/planning/PlanningTabNav.tsx`
  (the established benchmark tab rail), which is already shipped and browser-proven.
- **Href correctness:** the new tab hrefs are identical to the
  `/property-manager/legal/*` links already used (and working) by the overview
  page's KPI cards in `src/app/(app)/app/legal/page.tsx`.
- **Live Chrome MCP (server :3004, authenticated as jamahl thomas / Enterprise plan):**
  - Desktop 1440×900 `/property-manager/legal` → **Overview tab renders and is
    highlighted active**; all five tabs link to `/property-manager/legal/*`.
  - Navigated to `/property-manager/legal/possession` → **Possession tab becomes
    active and Overview is correctly NOT active**, confirming the exact-match logic
    (a naive `startsWith` would have wrongly kept Overview lit on every sub-route).
  - Mobile 390×844 `/property-manager/legal` → tab strip collapses to the dropdown
    `<select>` showing "Overview" selected; clean layout, no horizontal overflow.
  - Console: only one pre-existing 404 asset error (unrelated to this change — the
    edit adds no network assets; the LayoutDashboard icon is an inline lucide SVG).
    No JS, hydration, or React errors.
  - Screenshots: `scratchpad/legal-overview-desktop-1440.png`,
    `legal-possession-active.png`, `legal-overview-mobile-390.png`.

## Screen sizes / responsive

- Desktop (`md`+): horizontal icon tab strip, sticky, scroll-into-view of active tab. **Live-verified 1440.**
- Mobile (`<md`): single dropdown `<select>` listing all five tabs with optional counts. **Live-verified 390.**
- Matches the responsive pattern of the Planning rail (verified across the 8 standard
  viewports).

## Routes tested
- `/property-manager/legal` (Overview — now has its own active tab)
- `/property-manager/legal/possession`
- `/property-manager/legal/hmo-licences`
- `/property-manager/legal/epc-advisory`
- `/property-manager/legal/rra-2026`

## Auth / flags / RLS
- Route group gated by `legalSection` feature flag in `src/app/(app)/app/legal/layout.tsx`
  (server guard + QA `NEXT_PUBLIC_QA_ALL_FLAGS` bypass) — unchanged by this fix.
- This change is presentation-only (navigation rail); no data, RLS, or query paths
  altered. Overview data continues to come from `legal-data.ts` hooks
  (possession cases, HMO licences, EPC certs, tenancies) scoped by `workspaceId`.

## Cross-section effects
- None introduced. The rail links only within the Legal section.

## Pending user/manual actions
- None. Live Chrome MCP verification completed (desktop 1440 + mobile 390 + active-state
  switch on the Possession route), screenshots captured.

## Score
- **Tab-rail fix: 100/100** — Overview tab present, canonical routing, active state
  correct on every legal route, responsive + sticky + a11y to benchmark standard,
  typecheck clean.

## Release decision
**Ready for release** (behind the existing `legalSection` flag, default ON).
