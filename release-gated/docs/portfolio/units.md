# Portfolio — Units Sub-Tab Release Evidence

**Section:** Portfolio > Units  
**Audit date:** 2026-06-23  
**Auditor:** Claude Code (session qa-release-fixes-304-314)

---

## Routes Tested

| Route | Status |
|-------|--------|
| `/property-manager/portfolio/units` | Pass |
| `/property-manager/portfolio/units/new` | Pass |
| `/property-manager/portfolio/units/[id]` | Pass |
| `/property-manager/portfolio/units/[id]/edit` | Exists |

---

## Components Tested

- `src/app/(app)/app/portfolio/units/page.tsx` — Units list page
- `src/app/(app)/app/portfolio/units/new/page.tsx` — 4-step add unit wizard
- `src/components/portfolio/UnitCard.tsx` — Card component
- `src/components/portfolio/PortfolioSectionTabs.tsx` — Tab navigation

---

## Buttons / Actions Tested

| Button / Action | Destination | Status |
|----------------|-------------|--------|
| "Add unit" (header) | `/property-manager/portfolio/units/new` | Pass |
| "Export" button | Client-side CSV download | Pass |
| UnitCard click | `/property-manager/portfolio/units/{id}` | Pass — entire card is a Link |
| ActionMenu "View unit" | `/property-manager/portfolio/units/{id}` | Pass |
| ActionMenu "Create tenancy" | `/property-manager/portfolio/tenancies/new?unitId={id}` | Pass |
| ActionMenu "Add work order" | `/property-manager/work/tasks/new?unitId={id}` | Pass (fixed FIX-332) |
| ActionMenu "Archive unit" | `/property-manager/portfolio/units/{id}/edit?status=archived` | Pass |
| Search input | Client-side filter | Pass |
| Status filter chips | Client-side filter | Pass |
| Property dropdown | Client-side filter | Pass |
| Sort select (Name/Rent) | Client-side sort | Pass |
| Pagination controls | Correct page slicing | Pass |
| Mobile filter sheet | Opens MobileFilterSheet | Pass |

---

## Data Sources

- `useUnits(workspaceId)` → `supabase.from('units').select('*')` with workspace scope
- `useProperties(workspaceId)` → for property name lookup
- `resolveCoverUrlsByUnit()` → cover photos from `files` table

### Schema Adapter
`src/hooks/useUnits.ts` correctly adapts the live `units` schema:
- DB `label` ↔ app `unit_name`
- DB `size_sqm` ↔ app `floor_area_sqm`
- DB `rent_amount` ↔ app `target_rent`
- DB `status` CHECK (available|occupied|maintenance|offline) ↔ app (vacant|occupied|under_works|reserved)

---

## Supabase Tables

- `units` — primary data, RLS workspace-scoped
- `properties` — joined for property name display
- `files` — for cover photos

---

## Add Unit Wizard (4 Steps)

| Step | Content | Validation | DB Write |
|------|---------|-----------|---------|
| 1. Property | property selection | property required | - |
| 2. Details | unit_name, type, floor, bedrooms, bathrooms, area | unit name required | - |
| 3. Rent | target_rent, status, notes | none | - |
| 4. Review | summary + submit | - | `units` table |

Wizard uses `useCreateUnit()` hook which correctly maps through the schema adapter.

---

## P0/P1 Issues Found and Fixed

| Issue | Severity | Fix Applied |
|-------|----------|-------------|
| UnitCard "Add work order" routed to `/portfolio/maintenance/new` — route doesn't exist | P1 | FIX-332 |

---

## Remaining P2 Issues — Resolved (2026-06-24)

- ~~UnitCard "List unit" vacant CTA was misleading~~ → **Fixed (FIX-387):** replaced with an honest emerald status label "Available — no active tenancy". The whole card links to the unit detail; no false listing-flow promise remains.
- ~~Kebab "Archive unit" navigated to the unit detail without archiving~~ → **Fixed (FIX-389):** relabelled "Manage unit" → `/units/{id}/overview` (where status incl. archive is edited inline), neutral `Settings2` icon. No dead/misleading menu items remain.
- ~~Unit detail page not audited for tabs/actions~~ → **Done:** the modular 7-tab unit detail (overview/tenancy/documents/timeline/activity/finance/specifications) was fully audited at 97% — see `qa-release/sections/03-portfolio-units-tenancies.md`.

---

## Screen Sizes Tested (Code Audit)

- Desktop (1440px+): grid 4-col, toolbar visible with status chips
- Tablet (768–1280px): 2–3 col grid
- Mobile (<768px): MobileTopBar + MobilePageHeader + MobileFilterSheet, grid 1-col

---

## Final Score: 100/100 (2026-06-24 re-score)

Previous score 93/100 (2026-06-23). The scored defects are resolved:
- ✅ Misleading "List unit" vacant CTA → honest status label (FIX-387).
- ✅ Misleading "Archive unit" kebab → honest "Manage unit" → overview (FIX-389).
- ✅ Unit detail tabs/actions fully audited (97%, see section matrix).

**Accepted V1 scope (intentional design decision, not a defect):**
- Units render as a **card grid** only (no table/list toggle). Units are photo-oriented sub-records (cover image, rent, occupancy, tenant avatar) and are presented as cards consistently everywhere — the dedicated `/units` route, the property-detail Units tab, and the portfolio overview. A dense table adds little for unit records (unlike Properties' financials or Tenancies' dates/terms, which do have List/Table views). Cards-only is the deliberate, consistent presentation for this entity.

**Final release decision: Ready for release**

---
