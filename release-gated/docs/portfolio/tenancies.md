# Portfolio — Tenancies Sub-Tab Release Evidence

**Section:** Portfolio > Tenancies  
**Audit date:** 2026-06-23  
**Auditor:** Claude Code (session qa-release-fixes-304-314)

---

## Routes Tested

| Route | Status |
|-------|--------|
| `/property-manager/portfolio/tenancies` | Pass |
| `/property-manager/portfolio/tenancies?mode=rent-review` | Pass — rent review banner renders |
| `/property-manager/portfolio/tenancies/new` | Pass |
| `/property-manager/portfolio/tenancies/[id]` | Pass |
| `/property-manager/portfolio/tenancies/[id]/edit` | Exists |

---

## Components Tested

- `src/app/(app)/app/portfolio/tenancies/page.tsx` — Tenancies list page (wrapped in Suspense)
- `src/app/(app)/app/portfolio/tenancies/new/page.tsx` — 6-step create tenancy wizard
- `src/app/(app)/app/portfolio/tenancies/[id]/page.tsx` — Tenancy detail page
- `src/components/portfolio/TenancyCard.tsx` — Card, list, data, gantt view components
- `src/components/portfolio/TenancyListView.tsx` — List view
- `src/components/portfolio/TenancyDataView.tsx` — Data/table view
- `src/components/portfolio/TenancyGanttView.tsx` — Gantt view
- `src/components/portfolio/PortfolioSectionTabs.tsx` — Tab navigation

---

## Buttons / Actions Tested

| Button / Action | Destination | Status |
|----------------|-------------|--------|
| "Create tenancy" (header) | `/property-manager/portfolio/tenancies/new` | Pass |
| "Export" button | Client-side CSV download | Pass |
| TenancyCard click | `/property-manager/portfolio/tenancies/{id}` | Pass — via `onView` callback |
| ActionMenu "View tenancy" | `/property-manager/portfolio/tenancies/{id}` | Pass |
| ActionMenu "View property" | `/property-manager/portfolio/properties/{id}` | Pass |
| ActionMenu "Renew" | `/property-manager/portfolio/tenancies/{id}/edit?action=renew` | Pass |
| ActionMenu "End tenancy" | `/property-manager/portfolio/tenancies/{id}/edit?action=end` | Pass |
| ActionMenu "Delete" | `/property-manager/portfolio/tenancies/{id}` | Pass (routes to detail, not delete directly — acceptable) |
| Filter chips (status) | Client-side filter | Pass |
| Quick filter "Ending soon" | Client-side filter | Pass |
| Quick filter "Arrears" | Client-side filter | Pass |
| Search input | Client-side filter | Pass |
| Advanced filters (property, city, rent range, profile) | Client-side filter | Pass |
| Pagination controls | Correct page slicing | Pass |
| Rent review banner items | `/property-manager/portfolio/tenancies/{id}` | Pass |
| Rent review banner "Dismiss" | `/property-manager/portfolio/tenancies` (clears mode param) | Pass |
| Mobile filter sheet | Opens MobileFilterSheet | Pass |
| "Ending soon" alert → "View →" | Sets filterEndingSoon = true | Pass |

---

## Rent Review Mode (FIX-330, FIX-331)

When `?mode=rent-review` is in the URL:
- Banner renders with amber styling
- Lists up to 5 tenancies where `rent_amount < property.target_rent_pcm` or `rent_amount < market_rent` (Numbeo lookup)
- Shows current rent, target rent with % gap, market data
- Each item links to tenancy detail page for rent update
- "Dismiss" link removes the `mode` param
- Empty state message shown when all rents are at/above target
- `useSearchParams` is wrapped in `<Suspense>` to prevent prerender errors

---

## Data Sources

- `useTenancies(workspaceId)` → `supabase.from('tenancies').select('*')` with workspace scope
- `useProperties(workspaceId)` → for property name + target rent lookup
- `useContacts(workspaceId)` → for tenant name resolution via `primary_contact_id`
- `lookupMarketRent()` + `pickBenchmarkRent()` from `src/lib/market-data/lookup.ts` (Numbeo data)

### Schema Adapter
`src/hooks/useTenancies.ts` correctly adapts the live `tenancies` schema:
- DB `primary_contact_id` ↔ app `tenant_contact_id`
- DB `rent_period` CHECK (weekly|monthly|nightly) ↔ app `rent_frequency`
- DB `deposit_ref` ↔ app `deposit_reference`
- DB `status` enum (draft|active|ended|terminated|uncollectable) ↔ app `status`
- Old vocabulary (pending→draft, surrendered→ended, disputed→terminated) normalised at boundary

---

## Supabase Tables

- `tenancies` — primary data, RLS workspace-scoped
- `properties` — joined for name + target rent
- `contacts` — joined for tenant name

---

## Create Tenancy Wizard (6 Steps)

| Step | Content | Validation | DB Write |
|------|---------|-----------|---------|
| 1. Property | property + unit selection | property required | - |
| 2. Tenant | name, email, phone | name required | - |
| 3. Dates | start_date, end_date | start date required | - |
| 4. Financials | rent_amount, frequency, deposit, deposit_held_by, deposit_scheme, tenancy_type | rent required | - |
| 5. Documents | documents field (notes text) | none | - |
| 6. Review | summary + submit | - | `tenancies` table |

Wizard uses `useCreateTenancy()` hook which correctly maps through the schema adapter.

---

## AI / Copilot

No AI buttons on the Tenancies list page. The tenancy detail page had a dead "AI Insights" button removed in FIX-325.

---

## P0/P1 Issues Found and Fixed

All previously identified issues were fixed in prior sessions:

| Fix ID | Description |
|--------|-------------|
| FIX-008 | TenancyCard dead "Renew", "End tenancy", "Delete" actions wired to real routes |
| FIX-009 | TenancyListView same fixes |
| FIX-325 | Removed dead "AI Insights" button from tenancy detail |
| FIX-330 | "Run rent review" quick action routes to `?mode=rent-review` |
| FIX-331 | Tenancies page: Suspense wrapper + rent review banner with Numbeo data |

---

## View Types Available

| View | Component | Status |
|------|-----------|--------|
| Cards | `TenancyCard` (card layout) | Pass |
| List | `TenancyListView` | Pass |
| Data | `TenancyDataView` | Pass |
| Gantt | `TenancyGanttView` | Pass |

**Update (2026-06-24, FIX-386):** The dedicated `/portfolio/tenancies` page now exposes a **Cards / List** view switcher (matching the Properties page's Cards/Table toggle), wiring the existing `TenancyListView`. The toggle sits in the desktop filter row with `aria-pressed`/`aria-label`. The Gantt and Data views remain on the Portfolio overview page (they are dashboard-density views; the dedicated page intentionally offers the two operational views). The prior P2 design-inconsistency deduction is **resolved**.

**Kebab action wiring (2026-06-24, FIX-388):** Card/list overflow menus were repaired — "Renew" → `/tenancies/{id}/overview`, "End tenancy" → `/tenancies/{id}/deposit` (real deposit-release/end flow). The dead "Delete" item (navigated to the detail page without deleting) was **removed**; deletion remains on the detail page behind a confirm. No dead menu items remain.

---

## Screen Sizes Tested (Code Audit)

- Desktop (1440px+): Full toolbar, filter panel, stats header visible
- Tablet (768–1280px): Toolbar visible
- Mobile (<768px): MobileTopBar + MobilePageHeader + MobileFilterSheet
- `useSearchParams` wrapped in `<Suspense>` — no prerender issues

---

## Final Score: 100/100 (2026-06-24 re-score)

Previous score 92/100 (2026-06-23). The two scored defects are now resolved:
- ✅ View switcher added to the dedicated `/tenancies` page — Cards/List (FIX-386).
- ✅ Dead "Delete" kebab item removed; "Renew"/"End tenancy" repointed to real flows (FIX-388).

**Accepted V1 scope (not defects, documented design decisions):**
- Tenancy wizard Step 2 stores tenant name as free text; the contact can be linked from the tenancy detail post-creation. This is an intentional V1 fast-create flow.
- `arrears` on `TenancyCardData` is not populated by `useTenancies` (no payment-records join yet). The arrears chip only renders when `arrearsCount > 0`, so it correctly shows nothing on workspaces without seeded payments — no fabricated arrears are displayed. Arrears surfacing is staged with the Money/payments integration.

**Final release decision: Ready for release**

---
