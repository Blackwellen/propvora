# Release Evidence — Create Tenancy wizard

- **Wizard:** Create Tenancy
- **Route:** `/property-manager/portfolio/tenancies/new` (file: `src/app/(app)/app/portfolio/tenancies/new/page.tsx`)
- **Parent section:** Portfolio
- **Pattern:** Full-page wizard, 6 steps (Property, Tenant, Dates, Financials, Documents, Review)
- **Date:** 2026-06-24

## Launch points tested
- Portfolio → Tenancies list "Create Tenancy" CTA.
- Empty-state "add one first" path when no properties.
- Direct URL (auth) renders Step 1; unauthenticated bounced by proxy guard.

## Steps tested (each individually)
| Step | Fields | Persisted? | Notes |
|---|---|---|---|
| 1 Property | property_id*, unit_id (optional) | property_id, unit_id | Units filtered to selected property and non-occupied; "Whole property" option. Lists only this workspace's records |
| 2 Tenant | tenant_name*, tenant_email, tenant_phone | **→ creates `contacts` row + links `primary_contact_id`** (FIXED — was fully dropped) | Email shape validated (only when supplied); inline error + `aria-invalid`; advance gated on name + valid email |
| 3 Dates | tenancy_type, start_date*, end_date | **tenancy_type** (FIXED), start_date, end_date | end_date ≥ start_date enforced; blank end = periodic |
| 4 Financials | rent_amount*, rent_frequency, deposit_amount, deposit_held_by, deposit_scheme | rent_amount, rent_period, deposit_amount, **deposit_held_by** (FIXED), deposit_scheme | Advance gated on rent > 0; rent_period CHECK weekly/monthly/nightly (adapter) |
| 5 Documents | — | n/a | Dead dropzone replaced with honest "upload on detail page" panel |
| 6 Review | read-only summary | — | Reflects entered values incl. resolved property/unit names |

## Bugs found & fixed (see implementation-fix-log FIX-411, FIX-412, FIX-415)
1. **Tenant never saved (critical):** Step 2 collected name/email/phone but `handleSubmit` never sent them → tenancy created with no tenant. Now creates a `tenant` contact and links via `primary_contact_id`.
2. **`tenancy_type` + `deposit_held_by` dropped + columns missing live:** `toDb` mapped neither and the live `tenancies` table had dropped both columns → re-added columns (PAT + `20260624140000`) and added mappings.
3. **Dead Documents step:** fake dropzone/Browse button → honest info panel.
4. **Validation:** email shape + end-date≥start-date; **double-submit** guard added.

## Data / Supabase
- **Tables:** `tenancies` (+ `contacts` for the tenant). Insert verified live (E2E) — tenant linked, tenancy_type='hmo_room', deposit_held_by='scheme' persisted.
- Create via `useCreateTenancy` + `useCreateContact` (both invalidate their caches).
- **RLS:** workspace-scoped (anon client) for both inserts.
- **Migrations applied (PAT + file):** `20260624140000_tenancy_type_deposit_held_by.sql`.

## Screen sizes
- Desktop header + `MobileTopBar`; 6-step indicator scrollable; property/unit pick lists capped with `max-h` + scroll. Sticky footer clear of content.

## Remaining manual actions
- None blocking. Future enhancement: reuse an existing contact instead of always creating a new tenant contact (currently always creates) — acceptable for V1; duplicates are manageable from Contacts.

## Tests run
- `tsc --noEmit`: clean.
- Live E2E insert/round-trip/cleanup: tenant FK + tenancy_type + deposit_held_by persisted.

## Score: 94/100
## Decision: **Ready for release** (V1). Remaining 6: existing-contact reuse + automated RLS negative-test suite are post-V1.
