# Section 13 — Feature Flags

Coverage for all 23 platform feature flags. QA environment: set `NEXT_PUBLIC_QA_ALL_FLAGS=true` in `.env.local` to enable all flags simultaneously. Each flag must be individually toggled ON then OFF to confirm nav impact and route gating behave correctly in both states.

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## Flag Registry Matrix

| ID | Flag Key | DB Key | Default | QA State | Nav Impact? | Routes Unlocked | Score | Status | Notes |
|----|----------|--------|---------|----------|-------------|-----------------|-------|--------|-------|
| FLAG-001 | contextEngine | context_engine | OFF | ON | No | context resolver | [~] | BROWSER_REQUIRED | Toggle + observe context resolver behaviour requires live browser |
| FLAG-002 | marketplaceEnabled | marketplace_enabled | OFF | ON | Yes | /marketplace/* | [~] | BROWSER_REQUIRED | Toggle + verify nav change requires live browser |
| FLAG-003 | marketplaceStays | marketplace_stays | OFF | ON | Yes | /marketplace/stays/* | [~] | BROWSER_REQUIRED | |
| FLAG-004 | marketplaceSuppliers | marketplace_suppliers | OFF | ON | Yes | /marketplace/suppliers/* | [~] | BROWSER_REQUIRED | |
| FLAG-005 | marketplaceEmergency | marketplace_emergency | OFF | ON | Yes | /marketplace/emergency/* | [~] | BROWSER_REQUIRED | |
| FLAG-006 | marketplacePayments | marketplace_payments | OFF | ON | Yes | money/escrow, money/holds | [~] | BROWSER_REQUIRED | |
| FLAG-007 | marketplaceEscrow | marketplace_escrow | OFF | ON | Yes | /property-manager/money/escrow | [~] | BROWSER_REQUIRED | |
| FLAG-008 | marketplaceDisputes | marketplace_disputes | OFF | ON | Yes | /property-manager/money/disputes | [~] | BROWSER_REQUIRED | |
| FLAG-009 | bookingManagement | booking_management | OFF | ON | Yes | /property-manager/bookings/* | 4 | CODE_CONFIRMED | FIX-022: /contacts/guests feature-gated with layout.tsx gate redirect when flag=OFF |
| FLAG-010 | directBookingPages | direct_booking_pages | OFF | ON | Yes | /property-manager/listings/* | [~] | BROWSER_REQUIRED | |
| FLAG-011 | customerWorkspace | customer_workspace | OFF | ON | Yes | /customer/* | [~] | BROWSER_REQUIRED | |
| FLAG-012 | supplierWorkspace | supplier_workspace | OFF | ON | Yes | /supplier/* | [~] | BROWSER_REQUIRED | |
| FLAG-013 | icalSync | ical_sync | OFF | ON | No | ical import/export | [~] | BROWSER_REQUIRED | |
| FLAG-014 | canvasLite | canvas_lite | OFF | ON | Yes | /property-manager/automations/* | [~] | BROWSER_REQUIRED | |
| FLAG-015 | multiCountryPortfolio | multi_country_portfolio | OFF | ON | No | per-property country/currency | [~] | BROWSER_REQUIRED | |
| FLAG-016 | globalCountryPacks | global_country_packs | OFF | ON | No | country compliance depth | [~] | BROWSER_REQUIRED | |
| FLAG-017 | accountingGl | accounting_gl | OFF | ON | Yes | /property-manager/accounting/* | [~] | BROWSER_REQUIRED | |
| FLAG-018 | automationsFull | automations_full | OFF | ON | Yes | automations canvas/webhooks | [~] | BROWSER_REQUIRED | |
| FLAG-019 | portalTenant | portal_tenant | ON | ON | No | /tenant-portal/* | 5 | CODE_CONFIRMED | Portal session guard active; routes confirmed in master scoreboard section 5 |
| FLAG-020 | portalLandlord | portal_landlord | ON | ON | No | /landlord-portal/* | 5 | CODE_CONFIRMED | Portal session guard active; routes confirmed in master scoreboard section 6 |
| FLAG-021 | portalSupplier | portal_supplier | ON | ON | No | /supplier-portal/* | 5 | CODE_CONFIRMED | Portal session guard active; routes confirmed in master scoreboard section 7 |
| FLAG-022 | registrationCustomer | registration_customer | OFF | ON | Yes | /register customer tab | [~] | BROWSER_REQUIRED | |
| FLAG-023 | registrationSupplier | registration_supplier | OFF | ON | Yes | /register supplier tab | [~] | BROWSER_REQUIRED | |

---

## Code Audit Findings (FIX-292 — 2026-06-21 Deepen)

**Audit date:** 2026-06-21  
**Files audited:** `src/lib/flags/registry.ts`, `src/lib/flags/index.ts`, `src/lib/flags/public.ts`, `src/lib/flags/api-gate.ts`, `src/lib/flags/route-context.ts`

**All 23 flags confirmed defined** in `registry.ts` with correct camelCase keys, snake_case dbKeys, human labels, and descriptions.

**NEXT_PUBLIC_QA_ALL_FLAGS=true bypass:** confirmed in `index.ts` line 116 — `if (process.env.NEXT_PUBLIC_QA_ALL_FLAGS === "true") return true` — applies before any DB lookup.

**Resolution order confirmed:** workspace_feature_flags override → platform_feature_flags global → registry default (OFF). Tolerant: 42P01/PGRST205/schema-gap codes collapse to default. Never throws.

**Flag dependency rules confirmed** in `applyFlagDependencies()`:
- marketplaceEnabled=false → all marketplace sub-flags forced OFF
- marketplacePayments=false → escrow + disputes forced OFF
- automationsFull=true → canvasLite forced ON

**Admin toggle path:** Platform Admin feature flags page (`/admin/feature-flags`) writes to `platform_feature_flags` table. Workspace overrides via `workspace_feature_flags`. Audit log entry confirmed in admin action.

**FIX-292 additional findings (2026-06-21):**
- FLAG-011 (customerWorkspace): `/app/(customer)/layout.tsx` line 34 — `getGlobalFlag("customerWorkspace")` gate confirmed; redirects to /property-manager when OFF. Score: 5.
- FLAG-012 (supplierWorkspace): `/app/(supplier-workspace)/layout.tsx` — global flag gate confirmed. Score: 5.
- FLAG-022/023 (registrationCustomer/registrationSupplier): `/app/(auth)/login/page.tsx` lines 137–150 and `/app/(auth)/register/page.tsx` lines 223–233 — fetch /api/flags/public and filter persona tabs when OFF. Score: 5.
- NAV_FLAG_KEYS array confirmed: includes marketplaceEnabled, bookingManagement, directBookingPages, accountingGl, automationsFull, canvasLite, customerWorkspace, supplierWorkspace. SideNavigation filters items using `.filter((i) => !i.flag || navFlags?.[i.flag] === true)`. Score: 5.
- FLAGS 001/003–010/013–018 (context engine, marketplace sub-flags, ical, multi-country, global packs): No direct nav/route gate found in proxy or layout files for these individual flags (other than the master marketplaceEnabled). Sub-flags are used as data-layer filters within their sections when the section is already visible. This is the intended design per audit doc §5.3. Score maintained as BROWSER_REQUIRED — individual flag gating is section-internal.

**Gaps remaining (BROWSER_REQUIRED):** The [~] entries in the matrix above require live browser testing with the flag toggled ON and OFF to confirm nav shows/hides and routes gate correctly. These are operational QA tasks, not code gaps.

---

## QA Protocol for Flags

1. Set `NEXT_PUBLIC_QA_ALL_FLAGS=true` and verify all flagged routes/nav items appear.
2. For each flag individually: toggle OFF, confirm route/nav item is hidden or redirects correctly.
3. Toggle back ON, confirm route/nav item returns.
4. For flags with `Nav Impact? = Yes`: check sidebar/topbar nav at all relevant workspaces.
5. For flags with `Nav Impact? = No`: confirm no nav change but feature is accessible via direct URL when ON.
6. Record the DB key in `platform_feature_flags` table as the source of truth.
