# Section 13 — Feature Flags

Coverage for all 23 platform feature flags. QA environment: set `NEXT_PUBLIC_QA_ALL_FLAGS=true` in `.env.local` to enable all flags simultaneously. Each flag must be individually toggled ON then OFF to confirm nav impact and route gating behave correctly in both states.

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## Flag Registry Matrix

| ID | Flag Key | DB Key | Default | QA State | Nav Impact? | Routes Unlocked | Score | Status | Notes |
|----|----------|--------|---------|----------|-------------|-----------------|-------|--------|-------|
| FLAG-001 | contextEngine | context_engine | OFF | ON | No | context resolver | 4 | CODE_CONFIRMED | proxy.ts maybeApplyRouteContextGuard wraps context engine; flag-gated behind isFeatureEnabled("contextEngine"). No nav change needed — context resolver is internal. Score 4 (browser test pending). |
| FLAG-002 | marketplaceEnabled | marketplace_enabled | OFF | ON | Yes | /stays, /services, /suppliers/providers | 5 | CODE_CONFIRMED | FIX-294: /stays/page.tsx, /services/page.tsx, /providers/page.tsx all call getGlobalFlag("marketplaceEnabled") and redirect("/") when OFF. PM sidebar filters Suppliers-hub item with flag:"marketplaceEnabled". |
| FLAG-003 | marketplaceStays | marketplace_stays | OFF | ON | Yes | /marketplace/stays/* | 3 | CODE_CONFIRMED | Master switch (FLAG-002) gates the whole marketplace. marketplace_stays is applied as a data-layer filter within marketplace section when section is accessible. Sub-flag nav enforcement deferred to V2 marketplace tab strip. |
| FLAG-004 | marketplaceSuppliers | marketplace_suppliers | OFF | ON | Yes | /marketplace/suppliers/* | 3 | CODE_CONFIRMED | Same as FLAG-003 — gated by master switch. Sub-tab filtering within marketplace hub is V2 work. |
| FLAG-005 | marketplaceEmergency | marketplace_emergency | OFF | ON | Yes | /marketplace/emergency/* | 3 | CODE_CONFIRMED | Same as FLAG-003. Emergency sub-tab is V2 marketplace tab work. |
| FLAG-006 | marketplacePayments | marketplace_payments | OFF | ON | Yes | money/escrow, money/holds | 4 | CODE_CONFIRMED | app/(app)/layout.tsx gates /property-manager/money/escrow and /property-manager/money/holds — redirects to /property-manager/money when flag=OFF. Dependency rule: marketplaceEnabled=false forces this OFF. |
| FLAG-007 | marketplaceEscrow | marketplace_escrow | OFF | ON | Yes | /property-manager/money/escrow | 5 | CODE_CONFIRMED | app/(app)/layout.tsx: inEscrow && !v2Gates.marketplaceEscrow → redirect("/property-manager/money"). Route-level gate confirmed. |
| FLAG-008 | marketplaceDisputes | marketplace_disputes | OFF | ON | Yes | /property-manager/money/disputes | 5 | CODE_CONFIRMED | app/(app)/layout.tsx: inDisputes && !v2Gates.marketplaceDisputes → redirect("/property-manager/money"). Route-level gate confirmed. |
| FLAG-009 | bookingManagement | booking_management | OFF | ON | Yes | /property-manager/bookings/* | 5 | CODE_CONFIRMED | SideNavigation.tsx NAV_GROUPS: { label: "Bookings", flag: "bookingManagement" } — filtered from nav when OFF. resolveNavFlags() passes to AppShell. |
| FLAG-010 | directBookingPages | direct_booking_pages | OFF | ON | Yes | /property-manager/listings/* | 5 | CODE_CONFIRMED | SideNavigation.tsx NAV_GROUPS: { label: "Listings", flag: "directBookingPages" } — filtered from nav when OFF. |
| FLAG-011 | customerWorkspace | customer_workspace | OFF | ON | Yes | /customer/* | 5 | CODE_CONFIRMED | app/(customer)/layout.tsx line 34: getGlobalFlag("customerWorkspace") → redirect("/property-manager") when OFF. Defence-in-depth on proxy auth guard. |
| FLAG-012 | supplierWorkspace | supplier_workspace | OFF | ON | Yes | /supplier/* | 5 | CODE_CONFIRMED | app/(supplier-workspace)/layout.tsx: getGlobalFlag("supplierWorkspace") → redirect("/property-manager") when OFF. |
| FLAG-013 | icalSync | ical_sync | OFF | ON | No | ical import/export | 3 | CODE_CONFIRMED | iCal sync controls live within the channel sync manager (nested in calendar/bookings). No standalone nav item. When flag=OFF the feature is unreachable via direct URL guard at the iCal API route level. Browser test required to confirm UI hides correctly. |
| FLAG-014 | canvasLite | canvas_lite | OFF | ON | Yes | /property-manager/automations (canvas sub-tab + button) | 5 | CODE_CONFIRMED | FIX-294: AutomationsTabs now accepts hiddenTabs prop; home/page.tsx resolves canvasLite server-side and passes hiddenTabs=["Canvas Builder"] when OFF. AutomationsClient and HomePage hide Canvas button when canvasEnabled=false. canvas/page.tsx billing gate (gateCanvasLite) blocks the page if flag/plan is OFF. SideNavigation: { label: "Automations", flag: "canvasLite" } hides entire automations nav item when OFF. |
| FLAG-015 | multiCountryPortfolio | multi_country_portfolio | OFF | ON | No | per-property country/currency | 3 | CODE_CONFIRMED | Flag resolves in workspace preferences. Per-property country/currency selector is shown conditionally based on this flag within property edit form. No standalone nav item. Browser test required. |
| FLAG-016 | globalCountryPacks | global_country_packs | OFF | ON | No | country compliance depth | 3 | CODE_CONFIRMED | Applied as data-layer filter in compliance/legal sections — country pack depth gating. No standalone nav item. Browser test required. |
| FLAG-017 | accountingGl | accounting_gl | OFF | ON | Yes | /property-manager/accounting/* | 5 | CODE_CONFIRMED | SideNavigation NAV_GROUPS: { label: "Accounting", flag: "accountingGl" }. app/(app)/layout.tsx: inGl && !v2Gates.accountingGl → redirect("/property-manager/money"). Both nav and route gated. |
| FLAG-018 | automationsFull | automations_full | OFF | ON | Yes | automations canvas/webhooks/integrations tabs | 5 | CODE_CONFIRMED | FIX-294: AutomationsTabs hiddenTabs=["Webhooks","Integrations"] when automationsFull=OFF. home/page.tsx and canvas/page.tsx both resolve and pass hiddenTabs. app/(app)/layout.tsx: inCanvas (includes /webhooks, /integrations) && !v2Gates.automationsFull → redirect("/property-manager/automations"). |
| FLAG-019 | portalTenant | portal_tenant | ON | ON | No | /tenant-portal/* | 5 | CODE_CONFIRMED | Portal session guard active; routes confirmed in master scoreboard section 5. |
| FLAG-020 | portalLandlord | portal_landlord | ON | ON | No | /landlord-portal/* | 5 | CODE_CONFIRMED | Portal session guard active; routes confirmed in master scoreboard section 6. |
| FLAG-021 | portalSupplier | portal_supplier | ON | ON | No | /supplier-portal/* | 5 | CODE_CONFIRMED | Portal session guard active; routes confirmed in master scoreboard section 7. |
| FLAG-022 | registrationCustomer | registration_customer | OFF | ON | Yes | /register customer tab | 5 | CODE_CONFIRMED | register/page.tsx IntentChooser fetches /api/flags/public and filters customer card when registrationCustomer=false. API endpoint confirmed in src/app/api/flags/public/route.ts. |
| FLAG-023 | registrationSupplier | registration_supplier | OFF | ON | Yes | /register supplier tab | 5 | CODE_CONFIRMED | Same as FLAG-022 — supplier card filtered when registrationSupplier=false. |

---

## Code Audit Findings (FIX-294 — 2026-06-21)

**Audit date:** 2026-06-21  
**Fix ID:** FIX-294  
**Files changed:**
- `src/features/automations/components/AutomationsTabs.tsx` — added `hiddenTabs?: string[]` prop; tab strip filters out tabs in that array
- `src/features/automations/components/AutomationsModuleShell.tsx` — added `hiddenTabs?: string[]` prop; passed through to AutomationsTabs
- `src/app/(app)/app/automations/home/page.tsx` — converted to async server component; resolves `canvasLite` + `automationsFull` flags server-side; passes `hiddenTabs` + `canvasEnabled` to HomePage
- `src/features/automations/pages/HomePage.tsx` — accepts `hiddenTabs?` + `canvasEnabled?` props; Canvas button conditionally rendered; hiddenTabs passed to AutomationsModuleShell
- `src/app/(app)/app/automations/canvas/page.tsx` — resolves `automationsFull` flag; passes `hiddenTabs=["Webhooks","Integrations"]` when OFF to AutomationsTabs
- `src/app/(app)/app/automations/AutomationsClient.tsx` — accepts `canvasEnabled?` prop; Canvas link conditionally rendered

**Pre-existing confirmed gates (not changed):**
- `app/(app)/layout.tsx` — redirects escrow/disputes/accounting/canvas routes when respective flags are OFF
- `app/(customer)/layout.tsx` — blocks /customer/* when customerWorkspace=OFF  
- `app/(supplier-workspace)/layout.tsx` — blocks /supplier/* when supplierWorkspace=OFF
- `stays/page.tsx`, `services/page.tsx`, `providers/page.tsx` — redirect("/") when marketplaceEnabled=OFF
- `SideNavigation.tsx` NAV_GROUPS — bookingManagement, directBookingPages, accountingGl, canvasLite, marketplaceEnabled all wired as `flag` properties

**Remaining BROWSER_REQUIRED items:**
- FLAG-001 contextEngine: live test needed to confirm context resolver fires correctly
- FLAG-003/004/005: marketplace sub-type tab filtering within the marketplace hub is V2 work (master switch gates the whole section)
- FLAG-013 iCal sync: UI hide/show in calendar section requires browser test
- FLAG-015/016: per-property country selector and country-pack depth require browser test
- FLAG-003/004/005 sub-tab browser test: navigate to /marketplace hub with each sub-flag toggled to confirm data filtering

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

---

## QA Protocol for Flags

1. Set `NEXT_PUBLIC_QA_ALL_FLAGS=true` and verify all flagged routes/nav items appear.
2. For each flag individually: toggle OFF, confirm route/nav item is hidden or redirects correctly.
3. Toggle back ON, confirm route/nav item returns.
4. For flags with `Nav Impact? = Yes`: check sidebar/topbar nav at all relevant workspaces.
5. For flags with `Nav Impact? = No`: confirm no nav change but feature is accessible via direct URL when ON.
6. Record the DB key in `platform_feature_flags` table as the source of truth.

---

## FIX-296 — affiliateEnabled flag added (2026-06-21)

| Flag | DB Key | Registry | Meta | Nav Impact | Notes |
|---|---|---|---|---|---|
| affiliateEnabled | affiliate_enabled | ADDED ✅ | stage=V1, module=Platform, risk=low | Yes — Affiliate nav item in FINANCE group | Defaults OFF; enabled per-workspace on programme enrolment. Nav item hidden in V1 for all workspaces. |

**Total flags: 24** (was 23). V2_FLAG_KEYS array and FLAG_REGISTRY record updated. FLAG_META updated.

