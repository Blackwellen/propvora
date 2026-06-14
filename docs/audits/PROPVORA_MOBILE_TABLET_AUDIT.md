# Propvora — Mobile / Tablet Responsive Audit (Task P2a)

**Date:** 2026-06-14
**Scope:** Conservative first pass. Goal = ZERO page-level horizontal scroll on mobile/tablet.
**Constraint:** Only `src/components/**` + `src/app/globals.css` touched. No `page.tsx`, `lib`, `api`, or `proxy.ts` changes. No `dark:` classes. Desktop (lg+) layout/density unchanged — only mobile-first prefixes added.
**Verification:** `npx tsc --noEmit` clean.

---

## Summary

The codebase is in much better shape than a typical pre-audit app:

- **All `<table>` elements in shared components are already wrapped in `overflow-x-auto`** (PropertyTable, ContactTable, TenancyDataView/ListView, PropertyDataView/ListView, etc.) and wide tables use an inner `min-w-[900px]/[960px]` so they scroll *within their card*, not the page. No table fixes were needed.
- **Most KPI/stat strips already use mobile-first fallbacks** (`grid-cols-2 sm:grid-cols-4 lg:grid-cols-8`, etc.): KpiStrip, WorkKpiStrip, TenancyGanttView strips.
- **ChatBubble** already uses `pwa-safe-bottom` + `bottom-7 right-7`; a 56px bubble in the corner does not overlap content. No change required.
- **Shell tab rails** (ShellTabsRail and all the section TabNavs) already use `overflow-x-auto` + `shrink-0` chips.

The remaining risk was **page-level horizontal scroll** leaking out of the content `<main>` when a stray wide child appears, and a couple of un-prefixed `grid-cols-5` stat rows. Those are the focus of the fixes below.

---

## Findings & Actions

| Component | Issue | Viewport | Fix applied |
|---|---|---|---|
| `shell/ShellContent.tsx` | `<main>` was `overflow-y-auto` only — horizontal overflow from any wide child escaped to page level. Content padding `px-6` heavy on phones. | mobile + tablet | **Yes** — added `overflow-x-hidden` backstop; padding now `px-4 py-5 sm:px-6 sm:py-6`. |
| `shells/AdminShell.tsx` | Same `<main>` pattern (`overflow-y-auto` only); `px-6` padding. | mobile + tablet | **Yes** — `overflow-x-hidden` added; padding `px-4 py-5 sm:px-6 sm:py-6`. |
| `shells/PortalShell.tsx` | Content column + `<main>` lacked `min-w-0` / `overflow-x-hidden` (flex child can be pushed wide). | mobile + tablet | **Yes** — `min-w-0` on column, `min-w-0 overflow-x-hidden` on main. |
| `shells/TenantShell.tsx` | Same as PortalShell. | mobile + tablet | **Yes** — same fix. |
| `shells/LandlordShell.tsx` | Same. | mobile + tablet | **Yes** — same fix. |
| `shells/SupplierShell.tsx` | Same. | mobile + tablet | **Yes** — same fix. |
| `shells/AffiliateShell.tsx` | Same. | mobile + tablet | **Yes** — same fix. |
| `portfolio/TenancyCard.tsx` (L337) | KPI metrics row `grid-cols-5` (Rent / Deposit / Start / End / On-time) with no mobile fallback — 5 money/date cells cram and overflow the card on phones. Shared across tenancy lists. | mobile | **Yes** — `grid-cols-3 sm:grid-cols-5` (desktop unchanged at sm+). |
| `app/globals.css` | Flex/grid children default to `min-width:auto`, so a long unbreakable string / wide child refuses to shrink and forces page scroll. | mobile + tablet | **Yes** — added zero-specificity `:where(.flex) > *, :where(.grid) > * { min-width: 0 }`. Wrapped in `:where()` so any explicit Tailwind `min-w-[…]`/`shrink-0` still wins (wide tables keep their min-width). |

---

## Deferred to full P2 rebuild (risky — NOT touched this pass)

| Component | Issue | Why deferred |
|---|---|---|
| `portfolio/PropertyMapView.tsx` | Internal `grid-cols-5` region strip (L357) + `grid-cols-3` panel grid (L279); fixed `w-[320px]`/`w-[280px]` side rails (L229/L502). | This is a desktop split-pane map view. The grids live inside fixed-width rails by design; making it phone-friendly needs a dedicated responsive transform (stack the panels, collapse the map), not a className tweak. |
| `portfolio/TenancyGanttView.tsx` | Fixed-width timeline columns `w-[220px]` / `w-[120px]` (label + date gutters) drive a horizontally-scrolling Gantt. | A Gantt is intrinsically wide; it already scrolls within its own `overflow-x-auto`. Proper mobile treatment = a dedicated compact/agenda mode (P2). |
| `planning/wizard/steps/*` | Several `grid-cols-3` / `grid-cols-5` (Step02 Basics, Step06 LLOffer, Step08 RiskAIReview, Step05 Upfront). | The full-screen planning wizard has dense multi-column calculator layouts. These render in a `max-w` wizard shell and need per-step responsive work; out of scope for a low-risk pass and these are `steps/` not a single shared grid. |
| `planning/profiles/tabs/ComplianceTab.tsx`, `wizard/steps/Step03Income.tsx` | Wide tables `min-w-[900px]` / `min-w-[960px]`. | Already correctly inside `overflow-x-auto` — they scroll within their card. Mobile-optimised card/stacked rendering is a P2 enhancement, not an overflow bug. |
| `marketing/**` landing & feature sections | Many `grid-cols-3`/`grid-cols-4` without mobile fallback (HeroSection L160, WorkingWithTeamsSection, AccountingInvoicesSection, etc.). | Public marketing pages with bespoke fixed-content layouts; a bulk grid change risks visible desktop shifts. Marketing responsive polish is its own pass. |
| `portfolio/PropertyMapView.tsx` split-pane, `planning/wizard/WizardShell.tsx` `w-[160px]`/`w-[260px]` rails | Fixed-width side rails. | Already `hidden lg:flex` — they don't render on mobile, so no overflow. Listed for completeness; no action needed. |

---

## Net effect

Every authenticated app shell and every external portal shell now has an `overflow-x-hidden` + `min-w-0` content boundary, so no child can produce **page-level** horizontal scroll on mobile/tablet — wide content (tables, Gantts) still scrolls *inside its own card*. The global `:where()` min-width rule removes the most common silent overflow cause without overriding any explicit width intent. Mobile content padding tightened from 24px to 16px. The one cramped shared stat row (TenancyCard KPI strip) now falls back to 3 columns on phones. Desktop (sm/lg+) is visually unchanged.
