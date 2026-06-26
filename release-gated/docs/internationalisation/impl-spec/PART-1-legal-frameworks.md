# Propvora i18n — IMPLEMENTATION SPEC · PART 1 / 4 · Legal frameworks

**Dimensions in this part:** 1 Possession · 3 Shared-occupancy/HMO · 5 Registration · 6 Rent regulation · 10 Short-let · 11 Tenancy types · 12 Notice service/forms · 13 Right-to-rent · 22 Tenant fees · 23 Fitness/repair.
**Compiled:** 2026-06-25 · Companion to `DIMENSION-by-DIMENSION-implementation.md` (summary) and `INTEGRATION-and-IMPLEMENTATION-plan.md` (where it mounts).
**Posture:** PM platform, not a legal advisor. Every resolved value renders via `<SourcedValue>` (value + source chip + edit + permanent dismissible disclaimer). One `sourced` tier; operator owns the numbers.

---

## Facet template (every dimension below uses these 13 headings)
1. **How it works (integration)** — the resolution path workspace→property→leaf.
2. **New features** — user-visible capability.
3. **New components** — React components to build (`src/components/**`).
4. **Context changes** — what `JurisdictionContextProvider`/hooks expose.
5. **Cross-integration** — other dimensions/sections it touches.
6. **Requirements** — preconditions to build it.
7. **Workspace level** — settings/defaults.
8. **Section → sub-tab → wizard → detail** — exact placement in the founder's map.
9. **Editable & new fields** — what the operator can edit; new form fields.
10. **DB additions** — tables/columns/enums/RLS.
11. **Function additions** — `src/lib/**` functions + signatures.
12. **Onboarding additions** — what first-run/setup captures.
13. **Seed data additions** — demo rows so the surface is testable.

**Shared spine (assumed by all):** `JurisdictionContextProvider` (mounts in `AppShell`/`PortalPageShell`), `usePropertyJurisdiction(id)` (record-true), `useActiveJurisdiction({sectionKey})` (lens), `resolveValue(dim, jur, ctx)` (override chain), `<SourcedValue>` (render wrapper), `<JurisdictionChip>`, `<JurisdictionLensSwitcher>`, `<NotLegalAdviceNotice>` (dismissible). These are built once in Phase 0; the per-dimension work below *feeds* them.

---

# DIM 1 — Possession / eviction

### 1. How it works
`New Possession Case` wizard reads the **case's property** → `usePropertyJurisdiction(propertyId)` → `resolveValue("possession", jur, {caseId})` returns the `PossessionFramework` (routes, grounds, notice days, court, service methods). The wizard renders that jurisdiction's routes/grounds; notice days flow into the notice-preview + Calendar expiry calculator. Record-true: a Dubai property always shows UAE possession, even in a UK workspace.

### 2. New features
- Jurisdiction-correct possession routes & grounds (E&W S8 post-RRA-2026; SCT Notice to Leave; NI Notice to Quit; IE Notice of Termination).
- Per-case **notice-period override + exemption reason** with sub-minimum warning.
- Statutory **notice-expiry calculator** (service-method aware) surfaced in Calendar + Tenancy timeline.

### 3. New components
- `src/components/legal/PossessionRoutePicker.tsx` — routes from pack.
- `src/components/legal/GroundsSelector.tsx` — grounds checklist from pack (replaces hardcoded E&W list).
- `src/components/legal/NoticeOverridePanel.tsx` — value + reason + exemption + sub-minimum warning, wraps `<SourcedValue>`.
- `src/components/legal/NoticePreviewCard.tsx` — computed expiry + service method.

### 4. Context changes
`PossessionFramework` added to the pack bundle returned by `usePropertyJurisdiction`. New helper `useNoticeCalculator(jur)` returns `computeExpiry(serviceDate, ground, method)`.

### 5. Cross-integration
Dim 11 (tenancy type gates available grounds) · dim 12 (service method affects expiry) · dim 22 (arrears thresholds) · **Money ▸ Arrears/Rent-Chase** (pre-action protocol) · **Calendar** (expiry event) · **Automations** (possession-deadline trigger node) · audit log on every override.

### 6. Requirements
Phase-0 spine live; `possession_cases` migration applied; possession packs typed for at least Tier-A (EW/SCT/NI/IE) before exposing the per-jurisdiction picker (others render generic + verify-locally).

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: set **default notice periods** per jurisdiction the workspace operates in (e.g. an agent who always serves longer notice). Badged "workspace-customised — not Propvora-sourced".

### 8. Section → sub-tab → wizard → detail
- **Legal ▸ Possession** (overview, lens-aware) — list cases grouped by jurisdiction.
- **Wizard: New Possession Case** — select-tenancy → select-route → select-grounds → arrears (if S8 arrears ground) → notice-preview → review. Each step jurisdiction-driven.
- **Tenancy ▸ Timeline** — statutory key-dates.
- **Calendar** — notice expiry event.

### 9. Editable & new fields
- Editable: notice period (with reason), grounds selection, service method, arrears amount/weeks (FIX-504).
- New form fields: `notice_override_reason`, `notice_override_exemption`, service-method select.

### 10. DB additions
`possession_cases`: `+ notice_period_overridden bool default false`, `+ notice_override_reason text`, `+ notice_override_exemption text`, `+ service_method text`. RLS unchanged (workspace+property scoped). Index on `property_id`.

### 11. Function additions
`src/lib/legal/jurisdiction.ts`: `getPossessionFramework(jur): PossessionFramework`, `groundsForRoute(jur, routeId)`, `computeNoticeExpiry({jur, ground, serviceDate, method})`, `isBelowStatutoryMinimum(jur, ground, days)`.

### 12. Onboarding additions
Workspace setup ▸ "Where do you operate?" captures default jurisdiction(s) → seeds the customisation panel defaults. No tenant-facing onboarding.

### 13. Seed data additions
3 demo possession cases across EW (S8 arrears), SCT (Notice to Leave), IE (Notice of Termination) on seeded properties in those jurisdictions, so the picker + override + expiry calculator are testable in the mixed-portfolio acceptance test.

---

# DIM 3 — Shared-occupancy / HMO / rental licensing

### 1. How it works
`Register HMO Licence` wizard + `Property ▸ HMO Details` read the property jurisdiction → `resolveValue("licensing", jur)` → `LicensingFramework` (classes, thresholds, authority, conditions). Where the concept doesn't exist, an empty-state renders ("no shared-occupancy licensing in {jurisdiction}").

### 2. New features
- Jurisdiction licence classes (E&W mandatory/additional/selective; SCT/NI licence; IE registration).
- `requiresLicence(jur, persons, households)` auto-evaluation on the property.
- Local-council additional-condition capture.

### 3. New components
- `src/components/legal/LicenceClassPicker.tsx`.
- `src/components/legal/OccupancyThresholdGauge.tsx` — persons/households vs threshold.
- `src/components/legal/LicensingEmptyState.tsx`.

### 4. Context changes
`LicensingFramework` in the pack bundle; `useLicensing(propertyId)` convenience hook.

### 5. Cross-integration
Dim 4 (HMO triggers extra fire/compliance) · dim 5 (registration overlap) · **Portfolio ▸ Property ▸ HMO Details** · **Planning ▸ HMO/Co-living** Compliance tab · **Compliance ▸ Coverage**.

### 6. Requirements
Phase-1; `hmo_licences` table exists; licensing pack typed Tier-A first.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: record a specific council's selective-licensing scheme + conditions.

### 8. Section → sub-tab → wizard → detail
- **Legal ▸ HMO Licences** (lens-aware list).
- **Wizard: Register HMO Licence** (FIX-505) — Property&Type → Licence Details → Occupancy → Conditions&Document → Review; classes from pack.
- **Portfolio ▸ Property ▸ HMO Details** — hidden where no regime.

### 9. Editable & new fields
- Editable: licence class, occupancy counts, conditions[], authority, renewal reminder.
- New: `conditions text[]`, `authority text`, `licence_class text`.

### 10. DB additions
`hmo_licences`: `+ licence_class text`, `+ authority text`, `+ conditions text[]` (omit when empty — NOT-NULL jsonb rule), `+ renewal_reminder_days int`. New `property_licensing_status` view (optional) for Coverage.

### 11. Function additions
`src/lib/legal/licensing.ts`: `getLicensingFramework(jur)`, `requiresLicence(jur, persons, households): {required, class}`, `licenceConditions(jur, class)`.

### 12. Onboarding additions
Add-Property wizard asks "shared occupancy?" → if yes + jurisdiction has licensing, surfaces a "may need a licence" hint linking the register wizard.

### 13. Seed data additions
1 EW property flagged HMO (5 persons/2 households → mandatory licence) + 1 SCT licence + 1 IE registration, each with a seeded `hmo_licences` row.

---

# DIM 5 — Mandatory registration

### 1. How it works
`registrationDuties(jur)` resolves landlord/tenancy registration duties (IE RTB, Scotland Landlord Register, England selective licensing). Surfaced as compliance-coverage rows + Planning starter-checklist tasks per property.

### 2. New features
- Per-property registration tracking (type, authority, reference, expiry).
- Auto-generated setup tasks from registration duties.

### 3. New components
- `src/components/legal/RegistrationDutyList.tsx`.
- `src/components/legal/RegistrationStatusBadge.tsx`.

### 4. Context changes
`registrationDuties` added to legal pack; `useRegistrationDuties(propertyId)`.

### 5. Cross-integration
Dim 3 (HMO licence is a registration) · **Compliance ▸ Coverage** · **Planning ▸ Starter Checklist** · **Calendar** (renewal).

### 6. Requirements
Phase-1; new `property_registrations` table.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: enable/disable a duty if locally exempt.

### 8. Section → sub-tab → wizard → detail
- **Compliance ▸ Coverage/Overview** — registration rows.
- **Portfolio ▸ Property ▸ Compliance** — registration sub-list.
- **Planning ▸ Starter Checklist** — setup tasks.

### 9. Editable & new fields
- Editable: registration reference, status, expiry, "not applicable" flag.
- New: full `property_registrations` row.

### 10. DB additions
`property_registrations` (id, workspace_id, property_id, registration_type, authority, reference, status, expires_at, created_at) — RLS workspace+property scoped; index property_id.

### 11. Function additions
`src/lib/legal/licensing.ts`: `registrationDuties(jur): RegistrationDuty[]`, `registrationStatus(property): {met, missing}`.

### 12. Onboarding additions
Add-Property → if jurisdiction has a registration duty, creates a pending registration task.

### 13. Seed data additions
1 IE property with an RTB registration row; 1 SCT property with Landlord Register row.

---

# DIM 6 — Rent regulation / rent control

### 1. How it works
Rent-change forms call `rentIncreaseRule(jur)` → max allowed increase (cap %, index method, frequency) → validated against the proposed increase with a soft warning if above cap. Planning Income Model caps projected uplift at the rule.

### 2. New features
- Rent-increase validator with jurisdiction cap (IE CPI-or-2% from 1 Mar 2026; SCT RCA; DE Mietpreisbremse; once/12mo enforcement).
- Notice-of-increase generator with correct notice days.

### 3. New components
- `src/components/money/RentIncreaseValidator.tsx`.
- `src/components/planning/RentCapBanner.tsx`.

### 4. Context changes
`rentIncreaseRule` in legal pack; `useRentRule(propertyId)`.

### 5. Cross-integration
**Money ▸ Income** · **Tenancy ▸ Payments/Overview** · **Planning ▸ Income Model** · **Automations** (rent-review trigger) · dim 1 (increase disputes → tribunal).

### 6. Requirements
Phase-3; `country_rent_rules` table populated from `rent-regulation-sourced.md`.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: zone-specific caps (rent pressure zones / zonas tensionadas).

### 8. Section → sub-tab → wizard → detail
- **Money ▸ Income** (rent change) · **Tenancy ▸ Payments** · **Planning ▸ Income Model** (cap on uplift) · **Calendar** (review date).

### 9. Editable & new fields
- Editable: proposed rent, increase %, effective date, contractual index choice.
- New: `tenancies.rent_index_method`, `tenancies.last_increase_at`.

### 10. DB additions
`country_rent_rules` (jurisdiction, region, increase_frequency, index_method, cap_pct, pressure_zone_model, notice_days, effective_from). `tenancies`: `+ rent_index_method text`, `+ last_increase_at date`.

### 11. Function additions
`src/lib/legal/rent-control.ts`: `rentIncreaseRule(jur): RentRule`, `maxIncrease(jur, currentRent, lastIncreaseAt)`, `canIncreaseNow(jur, lastIncreaseAt)`.

### 12. Onboarding additions
None workspace-level; tenancy creation captures index method default from jurisdiction.

### 13. Seed data additions
1 IE tenancy with a recent increase (to trigger once/12mo block) + 1 DE tenancy under Mietpreisbremse.

---

# DIM 10 — Short-let / holiday-let licensing

### 1. How it works
Planning SA/Holiday profiles + Property Compliance read `shortLetRule(jur)` → registration requirement, night cap, change-of-use, tourist tax. Profile **applicability** flag gates/flags where short-let is hostile or banned.

### 2. New features
- Short-let registration + night-cap tracking per property (ES VUT, FR n° enregistrement, PT AL, Scotland control areas, AE).
- Tourist/occupancy tax line in Income Model.

### 3. New components
- `src/components/planning/ShortLetComplianceChecklist.tsx`.
- `src/components/planning/NightCapMeter.tsx`.

### 4. Context changes
`shortLetRule` in legal pack; `useShortLet(propertyId)`.

### 5. Cross-integration
Dim 8 (short-let VAT) · dim 21 (business-rates vs council-tax) · **Planning ▸ Serviced Accommodation + Holiday Lets** · **Portfolio ▸ Property ▸ Compliance**.

### 6. Requirements
Phase-4 (consumed by Planning); `property_short_let` table.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: local control-area rules.

### 8. Section → sub-tab → wizard → detail
- **Planning ▸ SA / Holiday** profile Compliance + Income tabs.
- **Portfolio ▸ Property ▸ Compliance** — short-let checklist.

### 9. Editable & new fields
- Editable: registration number, night cap, change-of-use status.
- New: full `property_short_let` row.

### 10. DB additions
`property_short_let` (id, workspace_id, property_id, registration_no, night_cap, change_of_use_status, authority) — RLS scoped.

### 11. Function additions
`src/lib/legal/short-let.ts`: `shortLetRule(jur): ShortLetRule`, `shortLetApplicability(jur): "build"|"flag"|"gate"`.

### 12. Onboarding additions
None; Planning profile selection surfaces the checklist on first SA/Holiday set.

### 13. Seed data additions
1 ES property with VUT registration; 1 Scotland property in a control area.

---

# DIM 11 — Tenancy types & minimum terms

### 1. How it works
`Create Tenancy` wizard type dropdown is built from `tenancyTypes(jur)` (AST→periodic post-RRA, PRT, bail vide/meublé, 4+4). Min-term validator warns below statutory minimum.

### 2. New features
- Jurisdiction tenancy-type list + min/max-term validation.
- Post-RRA-2026 E&W defaults to periodic (no new ASTs).

### 3. New components
- `src/components/portfolio/TenancyTypeSelect.tsx`.
- `src/components/portfolio/MinTermWarning.tsx`.

### 4. Context changes
`tenancyTypes` + `agreementModel` (dim 18) in legal pack; `useTenancyModel(propertyId)`.

### 5. Cross-integration
Dim 1 (type gates grounds) · dim 18 (agreement template) · dim 22 (permitted fees) · **Tenancy ▸ Overview**.

### 6. Requirements
Phase-1; store `tenancy_type` as text validated against pack (avoid DB enum lock-in across 45 jurisdictions).

### 7. Workspace level
None.

### 8. Section → sub-tab → wizard → detail
- **Wizard: Create Tenancy** (type step) · **Tenancy ▸ Overview** (statutory rights).

### 9. Editable & new fields
- Editable: tenancy type, term length.
- New: validation only; `tenancies.tenancy_type` widened to text.

### 10. DB additions
`tenancies.tenancy_type` → text (drop restrictive enum); add CHECK against an allowlist function is not feasible — validate in app against pack.

### 11. Function additions
`src/lib/legal/tenancy-models.ts`: `tenancyTypes(jur)`, `minTerm(jur, type)`, `isValidType(jur, type)`.

### 12. Onboarding additions
None.

### 13. Seed data additions
1 SCT PRT tenancy; 1 FR bail meublé; 1 EW periodic (post-RRA).

---

# DIM 12 — Notice service methods & prescribed forms

### 1. How it works
Possession/rent-chase notice steps render `serviceMethods(jur)` + `prescribedForms(jur)`; chosen method feeds the expiry calculator (postal service adds days). Non-compliant method warns.

### 2. New features
- Service-method selector + prescribed-form reference per jurisdiction (registered mail, notary, cantonal form, bailiff, RTB co-service).

### 3. New components
- `src/components/legal/ServiceMethodSelect.tsx`.
- `src/components/legal/PrescribedFormLink.tsx`.

### 4. Context changes
`serviceMethods`/`prescribedForms` in legal pack (folded into `jurisdiction.ts`).

### 5. Cross-integration
Dim 1 (expiry math) · **Money ▸ Rent-Chase** · any statutory-notice generation · dim 25 (notice language).

### 6. Requirements
Phase-1; part of possession pack.

### 7. Workspace level
None.

### 8. Section → sub-tab → wizard → detail
- **Wizard: New Possession Case** (service step) · **Money ▸ New Rent Chase Case**.

### 9. Editable & new fields
- Editable: service method, service date.
- New: `possession_cases.service_method` (shared with dim 1).

### 10. DB additions
Covered by dim 1's `service_method` column.

### 11. Function additions
`serviceMethods(jur)`, `prescribedForms(jur, noticeType)`, `serviceDelayDays(jur, method)`.

### 12. Onboarding additions
None.

### 13. Seed data additions
Covered by dim-1 cases (each carries a service method).

---

# DIM 13 — Right-to-rent / immigration checks

### 1. How it works
`requiredTenantChecks(jur)` returns England Right-to-Rent **only**; the check step renders only for England properties (re-keyed from workspace to property). Other jurisdictions show anti-discrimination guidance, no check.

### 2. New features
- Property-jurisdiction-correct tenant-check requirement (England-only RtR).

### 3. New components
- `src/components/legal/TenantCheckPanel.tsx` (England-only render).

### 4. Context changes
`requiredTenantChecks` in legal pack; `useTenantChecks(propertyId)`.

### 5. Cross-integration
**Create Tenancy wizard** · **Tenancy ▸ Overview** · **Compliance ▸ Coverage** · dim 28 (KYC overlap).

### 6. Requirements
Phase-1; `tenancy_checks` table.

### 7. Workspace level
None.

### 8. Section → sub-tab → wizard → detail
- **Wizard: Create Tenancy** (check step, England only) · **Tenancy ▸ Overview**.

### 9. Editable & new fields
- Editable: check status, completion date, document ref.
- New: `tenancy_checks` row.

### 10. DB additions
`tenancy_checks` (id, workspace_id, tenancy_id, check_type, status, completed_at, document_path) — RLS scoped.

### 11. Function additions
`src/lib/legal/tenant-checks.ts`: `requiredTenantChecks(jur)`.

### 12. Onboarding additions
None.

### 13. Seed data additions
1 England tenancy with a completed RtR check.

---

# DIM 22 — Tenant fees / permitted payments

### 1. How it works
Create-Tenancy + Money-Income fee fields validate against `permittedPayments(jur)`; holding-deposit field capped via `holdingDepositCap(jur)`. Banned-fee entry warns.

### 2. New features
- Permitted-payment validation + holding-deposit cap (Tenant Fees Act 2019 E&W, SCT, Wales).

### 3. New components
- `src/components/money/PermittedFeeField.tsx`.
- `src/components/money/HoldingDepositCapInput.tsx`.

### 4. Context changes
`permittedPayments`/`holdingDepositCap` in legal pack.

### 5. Cross-integration
Dim 2 (deposit) · **Create Tenancy** · **Money ▸ Income** · **Tenancy ▸ Deposit**.

### 6. Requirements
Phase-1; pack only, no new table.

### 7. Workspace level
None.

### 8. Section → sub-tab → wizard → detail
- **Wizard: Create Tenancy** (fees) · **Money ▸ Income** (fee validation) · **Tenancy ▸ Deposit** (holding cap).

### 9. Editable & new fields
- Editable: fee type/amount, holding deposit.
- New: validation only.

### 10. DB additions
None (validation against pack).

### 11. Function additions
`src/lib/legal/tenant-fees.ts`: `permittedPayments(jur)`, `holdingDepositCap(jur)`, `isPermittedFee(jur, feeType)`.

### 12. Onboarding additions
None.

### 13. Seed data additions
1 EW tenancy with a permitted holding deposit at the 1-week cap.

---

# DIM 23 — Repair / fitness / habitation standards

### 1. How it works
`fitnessStandards(jur)` returns the jurisdiction's repair/fitness regime (Homes Act 2018, **Awaab's Law** timescales, Repairing Standard SCT, IE S.I.137/2019). Drives Work job SLA defaults + a Compliance fitness checklist.

### 2. New features
- Fitness/repair checklist per property jurisdiction.
- **Awaab's-Law repair-response SLA** auto-applied to qualifying Work jobs (England social/PRS).

### 3. New components
- `src/components/compliance/FitnessStandardChecklist.tsx`.
- `src/components/work/RepairSlaBadge.tsx`.

### 4. Context changes
`fitnessStandards` folded into compliance pack; `useFitnessStandards(propertyId)`.

### 5. Cross-integration
**Compliance ▸ Coverage** · **Work ▸ Jobs** (SLA) · **Portfolio ▸ Property ▸ Compliance** · dim 4 (overlaps cert requirements).

### 6. Requirements
Phase-2; reuse `compliance_items` kinds; Work jobs gain SLA fields.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: record local standard.

### 8. Section → sub-tab → wizard → detail
- **Compliance ▸ Overview/Coverage** · **Work ▸ Job ▸ Overview** (SLA) · **Portfolio ▸ Property ▸ Compliance**.

### 9. Editable & new fields
- Editable: SLA target date, standard met flag.
- New: `jobs.sla_target_at`, `jobs.sla_source` (e.g. "Awaab's Law").

### 10. DB additions
`jobs`: `+ sla_target_at timestamptz`, `+ sla_source text`. `compliance_items.kind` extended for fitness.

### 11. Function additions
`src/lib/compliance/requirements.ts`: `fitnessStandards(jur)`, `repairSla(jur, hazardType): {days, source}`.

### 12. Onboarding additions
None.

### 13. Seed data additions
1 England damp/mould job with an Awaab's-Law SLA target; 1 SCT Repairing-Standard checklist item.

---

## Part-1 build order & dependencies
- **All of Part 1 depends on Phase-0 spine.**
- **Possession pack (dim 1)** is the anchor; dims 11/12/22 share its `jurisdiction.ts`/`tenancy-models.ts` pair — build together.
- **Licensing (3) + registration (5)** share `licensing.ts` + need the `property_registrations`/`hmo_licences` schema.
- **Rent regulation (6)** lands in Phase 3 (needs `country_rent_rules`).
- **Short-let (10)** lands in Phase 4 (consumed by Planning).
- **Fitness (23)** lands in Phase 2 with Compliance.

## Part-1 migration summary (apply via Management API PAT, idempotent, RLS)
| Table | Change |
|---|---|
| `possession_cases` | + notice_period_overridden, notice_override_reason, notice_override_exemption, service_method |
| `hmo_licences` | + licence_class, authority, conditions[], renewal_reminder_days |
| `property_registrations` | NEW |
| `country_rent_rules` | NEW |
| `tenancies` | + rent_index_method, last_increase_at; tenancy_type → text |
| `tenancy_checks` | NEW |
| `property_short_let` | NEW |
| `jobs` | + sla_target_at, sla_source |
| `compliance_items` | extend kind enum (fitness) |

> **Next:** PART-2 (Compliance & Work — dims 4, 20, 24, 27), PART-3 (Money & Tax — 2, 7, 8, 9, 21, 26), PART-4 (Structural — 15, 16, 17, 18, 19, 25, 28).
