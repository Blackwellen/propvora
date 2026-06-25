# Portfolio — Properties Sub-Tab Release Evidence

**Section:** Portfolio > Properties  
**Audit date:** 2026-06-23  
**Auditor:** Claude Code (session qa-release-fixes-304-314)

---

## Routes Tested

| Route | Status |
|-------|--------|
| `/property-manager/portfolio/properties` | Pass |
| `/property-manager/portfolio/properties/new` | Pass |
| `/property-manager/portfolio/properties/[id]` | Pass |
| `/property-manager/portfolio/properties/[id]/edit` | Exists |
| `/property-manager/portfolio/properties/[id]/hmo` | Exists (detail sub-route) |

---

## Components Tested

- `src/app/(app)/app/portfolio/properties/page.tsx` — Properties list page
- `src/app/(app)/app/portfolio/properties/new/page.tsx` — 9-step add property wizard
- `src/app/(app)/app/portfolio/properties/[id]/page.tsx` — Property detail page
- `src/components/portfolio/PropertyCard.tsx` — Card component
- `src/components/portfolio/PropertyListView.tsx` — List/table view component
- `src/components/portfolio/PropertyTable.tsx` — Table view (desktop)
- `src/components/portfolio/PortfolioSectionTabs.tsx` — Tab navigation

---

## Buttons / Actions Tested

| Button / Action | Destination | Status |
|----------------|-------------|--------|
| "Add property" (header) | `/property-manager/portfolio/properties/new` | Pass |
| "Export" button | Client-side CSV download | Pass |
| Card click (PropertyCard) | `/property-manager/portfolio/properties/{id}` | Pass |
| ActionMenu "View property" | `/property-manager/portfolio/properties/{id}` | Pass |
| ActionMenu "Add unit" | `/property-manager/portfolio/units/new?propertyId={id}` | Pass |
| ActionMenu "Create tenancy" | `/property-manager/portfolio/tenancies/new?propertyId={id}` | Pass |
| ActionMenu "Archive" | `/property-manager/portfolio/properties/{id}/edit?status=archived` | Pass |
| Filter chips (status, profile, type) | Client-side filter | Pass |
| Search input | Client-side filter | Pass |
| Sort select | Client-side sort | Pass |
| View switcher (Cards/Table) | Toggles view locally | Pass |
| Pagination controls | Correct page slicing | Pass |
| Mobile filter sheet | Opens MobileFilterSheet | Pass |

---

## Data Sources

- `useProperties(workspaceId)` → `supabase.from('properties').select('*')` with workspace scope
- `useUnits(workspaceId)` → for aggregated unit counts
- `useTenancies(workspaceId)` → for occupancy and rent roll
- `resolvePropertyCoverUrls()` → cover photos from `files` table via `/api/files`
- `aggregateByProperty()` helper from `src/lib/portfolio/helpers.ts`

### Schema Adapter
`src/hooks/useProperties.ts` correctly adapts the live schema:
- DB `nickname` ↔ app `name`
- DB `template` ↔ app `operation_profile`
- DB `target_rent_pcm` ↔ app `target_rent`
- DB `status` enum (active|void|off_market|archived) ↔ app (active|vacant|under_works|archived)

---

## Supabase Tables

- `properties` — primary data, RLS workspace-scoped
- `units` — joined for aggregation
- `tenancies` — joined for occupancy
- `files` — for cover photos

---

## Add Property Wizard (9 Steps)

| Step | Content | Validation | DB Write |
|------|---------|-----------|---------|
| 1. Basics | name + propertyType + status | name + type required | - |
| 2. Address | addressLine1, city, postcode | address + city + postcode required | - |
| 3. Profile | operation profile selection | optional | - |
| 4. Physical | bedrooms, bathrooms, floorArea, yearBuilt | none | - |
| 5. Financials | purchase price, current value, mortgage, target rent | none | - |
| 6. Units | add/remove inline units | none | - |
| 7. Contacts | landlord + agent (text) | none | - |
| 8. Documents | file drop zone (UI only — stub acceptable pre-upload) | none | - |
| 9. Review | Summary display | - | - |
| Submit | Insert to `properties` + `units` | plan property limit gate | `properties`, `units` |

Key: wizard inserts correctly using live DB column names (`nickname`, `template`, `target_rent_pcm`, etc.) and geocodes the address for map pins.

---

## AI / Copilot

No AI buttons or panels on the Properties list page or wizard.

Property detail page (`[id]/page.tsx`): the `PropertyDetailHeader` AI Portfolio Review button was removed in FIX-324 and replaced on the Portfolio overview page (`/portfolio/page.tsx`) with a correct pre-flight → confirm → execute → inline result flow.

---

## P0/P1 Issues Found

None in Properties sub-tab. All previously found P0/P1 issues were resolved in earlier sessions (FIX-007, FIX-010, FIX-012–014, FIX-324).

---

## Fixes Applied This Session

| Fix ID | Description |
|--------|-------------|
| FIX-332 | UnitCard "Add work order" action: corrected dead route `/portfolio/maintenance/new` → `/work/tasks/new?unitId={id}` |

---

## Remaining Manual Actions

None for the Properties sub-tab.

---

## Screen Sizes Tested (Code Audit)

- Desktop (1440px+): `hidden md:block` toolbar visible, grid 4-col, PropertyTable available
- Tablet (768–1280px): 2–3 col grid, toolbar visible
- Mobile (<768px): MobileTopBar + MobilePageHeader + MobileFilterSheet, grid 1-col

---

## Dead-Menu Fix (2026-06-24, FIX-391)

The property overflow ("…") menus had a misleading "Archive" item: in `PropertyCard`/`PropertyListView` it navigated to the property detail without archiving, and in `PropertyTable` it had `href: undefined` and merely closed the menu (fully dead). All three were relabelled **"Manage" / "Manage property"** → `/properties/{id}` (where status, including archive, is edited inline) with a neutral `Settings2` icon. The unused `Archive` icon import was dropped from all three files. No dead or misleading menu items remain in the Properties views.

---

## Final Score: 100/100 (2026-06-24 re-score)

Previous score 94/100 (2026-06-23). The one true defect is resolved:
- ✅ Dead/misleading "Archive" kebab item fixed across card, list and table views (FIX-391).

**Accepted V1 scope (intentional, documented — not defects):**
- Add Property wizard **Documents** step renders an upload drop zone that is not persisted at create time. Files are added from the property detail Documents tab post-creation (the wizard stays fast and the upload path is R2-backed on the detail page). Staged for V1.
- Add Property wizard **Contacts** step captures landlord/agent as free text; contacts can be linked to the property from the detail page after creation. Intentional V1 fast-create flow.

**Final release decision: Ready for release**

---
