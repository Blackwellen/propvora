# Release Evidence — Add Property wizard

- **Wizard:** Add Property
- **Route:** `/property-manager/portfolio/properties/new` (file: `src/app/(app)/app/portfolio/properties/new/page.tsx`)
- **Parent section:** Portfolio
- **Pattern:** Full-page wizard, 9 steps (Basics, Address, Profile, Physical, Financials, Units, Contacts, Documents, Review)
- **Date:** 2026-06-24

## Launch points tested
- Portfolio → Properties list "Add Property" CTA → opens at Step 1 with empty state.
- Empty-state CTA on Properties list → same route.
- Add Unit / Create Tenancy empty-states deep-link here ("Add a property first").
- Direct URL access (authenticated) renders Step 1; unauthenticated is bounced by `src/proxy.ts` auth guard.

## Steps tested (each individually)
| Step | Fields | Persisted? | Notes |
|---|---|---|---|
| 1 Basics | name*, propertyType*, status | nickname, category, template, status | Required-field gate on name+type before advance |
| 2 Address | line1*, line2, city*, county, postcode* | all address cols + geocoded lat/lng | Required gate on line1/city/postcode; geocode fails silently |
| 3 Profile | operationProfile (13 options) | **operation_profile** (FIXED — was dropped) | All 13 `PLANNING_PROFILES` keys match the column CHECK |
| 4 Physical | bedrooms, bathrooms, floorArea, yearBuilt | bedrooms, bathrooms, floor_area_sqm, year_built | min/max bounds on inputs |
| 5 Financials | purchasePrice, currentValue, monthlyMortgage, targetRent | purchase_price, current_value, **mortgage_outstanding** (FIXED — was dropped), target_rent_pcm | GBP-prefixed inputs |
| 6 Units | repeatable units (name/type/rent) | inserted into `units` (label/rent_amount/status) | Live total-rent rollup |
| 7 Contacts | landlord (picker) | **landlord_contact_id** (FIXED — was dead free-text; column re-added) | Agent free-text removed (no column) |
| 8 Documents | — | n/a | Dead dropzone replaced with honest "upload on detail page" panel |
| 9 Review | read-only summary | — | Reflects entered values |

## Bugs found & fixed (see implementation-fix-log FIX-413, FIX-414, FIX-415)
1. **Data loss:** `operation_profile`, `mortgage_outstanding`, `created_by` were collected then dropped by the raw insert → now written.
2. **Stale lists:** raw-client write didn't invalidate react-query caches → added `["properties"]`/`["units"]` invalidation.
3. **Dead Contacts step:** free-text "search" inputs saved nothing (and `landlord_contact_id` had been dropped from the live schema) → re-added the column (PAT + migration) and replaced with a real contact `<select>`; removed dead agent input.
4. **Dead Documents step:** fake dropzone + non-functional "Browse files" button → honest info panel.
5. **Double-submit** guard added.

## Data / Supabase
- **Table:** `properties` (+ child `units`). Insert verified live (E2E) with the exact wizard column set incl. the re-added `operation_profile`, `mortgage_outstanding`, `landlord_contact_id`.
- **Plan gate:** property-count gate against `PLAN_DISPLAY[tier].features.properties` before insert (fails open on DB error).
- **Migrations applied (PAT + file):** `20260624150000_properties_landlord_contact_id.sql` (+ index). `operation_profile` column from earlier `20260624120000`.
- **RLS:** writes are workspace-scoped via anon client (RLS enforced); `created_by` set from `auth.getUser()`.

## Screen sizes
- Desktop header + mobile `MobileTopBar` both present; step indicator is horizontally scrollable (`overflow-x-auto`) — usable at 375–1536px. Sticky footer nav does not overlap the step card.

## Remaining manual actions
- None blocking. Pre-create document upload (before the record exists) is intentionally deferred to the detail page Documents tab.

## Tests run
- `tsc --noEmit`: clean.
- Live E2E insert/round-trip/cleanup via Management API: all fields persisted (operation_profile=hmo, mortgage_outstanding=750, landlord FK set).

## Score: 95/100
## Decision: **Ready for release** (V1). Remaining 5: in-wizard file upload + a full automated RLS negative-test suite are post-V1 polish, not blockers.
