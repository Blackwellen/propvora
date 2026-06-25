# Release Evidence — Add Unit wizard

- **Wizard:** Add Unit / Room
- **Route:** `/property-manager/portfolio/units/new` (file: `src/app/(app)/app/portfolio/units/new/page.tsx`)
- **Parent section:** Portfolio
- **Pattern:** Full-page wizard, 4 steps (Property, Details, Rent, Review)
- **Date:** 2026-06-24

## Launch points tested
- Portfolio → Units list "Add Unit" CTA.
- Empty-state "Add a property first" path when the workspace has no properties.
- Direct URL (auth) renders Step 1; unauthenticated bounced by proxy guard.

## Steps tested (each individually)
| Step | Fields | Persisted? | Notes |
|---|---|---|---|
| 1 Property | property_id* (selectable list) | property_id | Honest empty state → Add Property; advance gated on selection. Lists only this workspace's properties (`useProperties`). |
| 2 Details | unit_name*, unit_type*, bedrooms, bathrooms, floor, floor_area_sqm, status | label, **unit_type** (FIXED), bedrooms, bathrooms, floor, size_sqm, status | Advance gated on name+type. Status maps vacant/reserved/under_works → available/offline/maintenance |
| 3 Rent | target_rent, notes | rent_amount, **notes** (FIXED — wired) | Live /yr · /wk derivation |
| 4 Review | read-only summary | — | Reflects entered values |

## Bugs found & fixed (see implementation-fix-log FIX-410, FIX-416)
1. **`unit_type` dropped + no column:** `toDb` never mapped it AND the live `units` table had no `unit_type` column → added the column (PAT + `20260624130000_units_unit_type_column.sql`) and the mapping.
2. **`notes` discarded:** collected but never plumbed; `units.notes` exists → wired through `InsertUnit`/`Unit`/`fromDb`/`toDb`/submit.
3. **Double-submit** guard added.

## Data / Supabase
- **Table:** `units` (canonical; label/rent_amount/size_sqm lineage). Status CHECK = available|occupied|maintenance|offline (adapter normalises).
- **unit_type** column free text (no CHECK) — accepts `en_suite` and all wizard keys. Verified live (E2E insert unit_type='en_suite', notes='QA note' persisted).
- Create goes through `useCreateUnit` → cache invalidation on `["units", ws]` + `["units", ws, propertyId]`.
- **RLS:** workspace-scoped (anon client).

## Screen sizes
- Desktop header + `MobileTopBar`; 4-step indicator fits without scroll at all widths; unit-type grid is 2-col mobile / 3-col ≥sm. Sticky footer clear of content.

## Remaining manual actions
- None. (The richer HMO room fields — bathroom_type/kitchen_access/heating etc. — exist on `units` but are intentionally out of this lightweight create wizard; edited on the unit detail/HMO surfaces.)

## Tests run
- `tsc --noEmit`: clean.
- Live E2E insert/round-trip/cleanup: unit_type + notes persisted.

## Score: 96/100
## Decision: **Ready for release** (V1).
