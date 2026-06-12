# Portfolio Release Scorecard

**Date:** 2026-06-03  
**Version:** Propvora V1.5 — Portfolio Level 2

---

## Final Output Report

### 1. Sidebar consolidation ✅
- Portfolio has Properties, Units, Tenancies as sub-nav children
- Units and Tenancies are NOT separate top-level sidebar items
- All Portfolio child routes highlight "Portfolio" as active

### 2. Units/Tenancies removed from main sidebar ✅
- Confirmed: sidebar config shows them as Portfolio children only

### 3. Portfolio route map ✅
- `/app/portfolio` — dashboard with view tabs
- `/app/portfolio/properties` — list (cards/table)
- `/app/portfolio/properties/new` — 9-step wizard
- `/app/portfolio/properties/[id]` — detail with 9 tabs
- `/app/portfolio/units` — list (cards/table/search/filter)
- `/app/portfolio/units/new` — 4-step wizard
- `/app/portfolio/units/[id]` — detail with 6 tabs + real data
- `/app/portfolio/tenancies` — list (cards/table/Gantt)
- `/app/portfolio/tenancies/new` — 6-step wizard
- `/app/portfolio/tenancies/[id]` — detail with real data hook

### 4. Portfolio dashboard rebuilt ✅
- 8-card KPI grid with click-through
- View tab system: Overview, Properties, Units, Tenancies, Map
- Overview tab: recent properties + attention queue + quick actions
- Properties tab: cards/table view toggle
- Units tab: unit cards preview
- Tenancies tab: tenancy cards preview
- Map tab: premium fallback with property count + env config instructions

### 5. View types added ✅
- Properties: cards + table
- Units: cards + table
- Tenancies: cards + table + Gantt timeline

### 6. Map view / fallback ✅
- Premium fallback UI with Map icon, instructions for adding MAP_PROVIDER_KEY
- Property count shown
- Link to property list

### 7. Gallery view ⚠️
- Not yet built as dedicated `/app/portfolio/gallery` route
- Property images shown on cards

### 8. Tenancy Gantt / timeline ✅
- Full custom Gantt on tenancies page
- Month headers, tenancy bars, today line, end-soon highlighting
- Legend for status colours

### 9. Property detail ✅
- Full tabs: Overview, Units, Tenancies, Contacts, Work, Money, Planning, Documents, Activity
- Mock data (real data wire is next priority)

### 10. Unit detail ✅
- Full tabs: Overview, Tenancy, Work, Money, Documents, Activity
- Real data via useUnit hook
- Tenancy list per unit via useTenancies

### 11. Tenancy detail ✅
- Full tabs: Overview, Contacts, Payments, Documents, Activity
- Real data via useTenancy hook
- Payment history, deposit details, ending-soon alert

### 12. Multi-step wizards ✅
- Add Property: 9 steps (existing)
- Add Unit: 4 steps (new)
- Create Tenancy: 6 steps (new)

### 13. Upload/media/docs ⚠️
- Upload placeholder UI on Documents steps
- Full Supabase Storage wiring is next priority

### 14. Buttons/actions wired ✅
- Add Property, Add Unit, Create Tenancy all route correctly
- Edit buttons link to /edit routes
- Create task/job buttons link to /work routes
- Back/breadcrumb navigation on all detail pages

### 15. Inline editing ⚠️
- Edit pages at /edit routes defined but not yet built

### 16. Cross-module integrations ✅
- Work: "Create task/job" buttons on property/unit detail
- Contacts: "View full profile" links
- Money: Arrears link on portfolio dashboard
- Planning: "Create planning set" link on property detail

### 17. Supabase tables/migrations ✅
- Migration 005 adds: operation profile metadata, commercial KPIs,
  planning conversion tracking, property_reviews table,
  planning_conversion_events table, indexes

### 18. RLS policies ✅
- All existing tables: workspace-scoped RLS
- New tables (property_reviews, planning_conversion_events) have RLS policies

### 19. Demo data ✅
- Rich mock data in all pages (7+ properties, 11+ units, 9+ tenancies)
- Covers all view states: occupied, vacant, under works, ending soon, arrears

### 20. Premium styling ✅
- All components use global CSS variables and Tailwind tokens
- White/light backgrounds throughout
- Blue primary, emerald success, amber warning, red danger
- Rounded cards, soft shadows, 1px borders
- Hover states on all interactive elements

### 21. Tests ⚠️
- Typecheck: run `npm run typecheck`
- Build: run `npm run build`
- Manual browser testing required

### 22. Remaining blockers / next priorities

**P1 (next pass):**
- Wire property detail page to real Supabase data
- Build /edit pages for property, unit, tenancy
- Implement Supabase Storage file upload on document/media steps
- Map provider integration (Mapbox/Google Maps)

**P2 (future):**
- Gallery view (`/app/portfolio/gallery`)
- Timeline view (`/app/portfolio/timeline`)
- Portfolio export pack (PDF/CSV)
- AI portfolio review actions
- Forecast vs Actual panel (when planning conversion data exists)
- Commercial health score computation from real data
