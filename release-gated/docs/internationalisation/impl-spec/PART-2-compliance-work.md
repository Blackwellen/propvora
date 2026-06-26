# Propvora i18n — IMPLEMENTATION SPEC · PART 2 / 4 · Compliance & Work

**Dimensions:** 4 Safety compliance certs · 20 Trade certification · 24 Insurance · 27 Building safety.
**Compiled:** 2026-06-25 · Facet template + shared spine as defined in `PART-1-legal-frameworks.md`.
**Posture:** PM platform, not a legal advisor; `<SourcedValue>` + permanent dismissible disclaimer on every figure.

---

# DIM 4 — Safety compliance certificates

### 1. How it works
**The single biggest Compliance change: re-key `useComplianceRequirements` from workspace `countryCode` to the property's `country_code`.** Each property resolves its own certificate set (gas/EICR/EPC/alarms/fire/legionella/PAT) with cadence + authority via `complianceRequirements(jur)`. Coverage + Reports group by jurisdiction in a mixed portfolio.

### 2. New features
- Per-property certificate set (45 jurisdictions, up from 6 reviewed).
- Mixed-portfolio **group-by-jurisdiction** Coverage + Reports.
- Cert-renewal windows fed to Calendar.

### 3. New components
- `src/components/compliance/JurisdictionCoverageGroup.tsx` — grouped coverage matrix.
- `src/components/compliance/CertRequirementRow.tsx` — cert + cadence + authority + `<SourcedValue>`.
- `src/components/compliance/JurisdictionLensSwitcher` reuse (overview lens).

### 4. Context changes
`ComplianceFramework` returned by `usePropertyJurisdiction`; `useComplianceRequirements(propertyId)` replaces the workspace-scoped version. Section overviews use `useActiveJurisdiction({sectionKey:"compliance"})` defaulting to "All (grouped)".

### 5. Cross-integration
Dim 20 (cert valid only if from credentialed supplier) · dim 23 (fitness overlaps) · dim 24 (insurance) · dim 27 (building-level certs) · **Calendar** (renewals) · **Work ▸ PPM** (recurring cert jobs) · **Automations** (cert-expiry trigger).

### 6. Requirements
Phase-2; extend `compliance/requirements.ts` from `safety-compliance-and-trade-certs-sourced.md` (FR DDT/DPE, DE Rauchwarnmelder/Schornsteinfeger, ES ITE/cédula added; rest queued). `compliance_items` columns confirmed.

### 7. Workspace level
Workspace ▸ Jurisdiction Customisation: add an extra local cert; mark one exempt (e.g. no gas supply → no CP12) with reason.

### 8. Section → sub-tab → wizard → detail
- **Compliance ▸ Overview / Certificates / Inspections / Coverage / Reports** — all property-jurisdiction sourced; Coverage/Reports grouped.
- **Wizards: Add Certificate / Schedule Inspection / Upload Document / Upload Evidence** — cert `kind` list from property pack.
- **Portfolio ▸ Property ▸ Compliance** — that property's set.
- **Planning ▸ Compliance tab (every profile)** — profile + jurisdiction certs.

### 9. Editable & new fields
- Editable: cert kind, issue/expiry date, authority, cadence, exempt flag + reason, issuing supplier (links dim 20).
- New form fields: `authority`, `exempt`, `exempt_reason`, `issuing_supplier_id`.

### 10. DB additions
`compliance_items`: ensure `kind` enum covers all cert types; `+ authority text`, `+ cadence_months int`, `+ exempt bool default false`, `+ exempt_reason text`, `+ issuing_supplier_id uuid` FK→suppliers. RLS workspace+property scoped; index (property_id, kind).

### 11. Function additions
`src/lib/compliance/requirements.ts`: `complianceRequirements(jur): Requirement[]`, `requirementCadence(jur, kind)`, `coverageByJurisdiction(properties)` (grouping), `nextDue(item)`.

### 12. Onboarding additions
Add-Property → seeds the jurisdiction's required cert checklist as pending compliance items for that property.

### 13. Seed data additions
Per Demo Seed Rule: ≥4 compliance items per seeded property (overdue/due-soon/ok), across EW (CP12+EICR+EPC+alarms), FR (DPE+électricité+ERP), DE (Rauchwarnmelder+Schornsteinfeger) so the grouped Coverage view is testable.

---

# DIM 20 — Contractor / trade certification & Work regulation

### 1. How it works
The Work ▸ Suppliers directory captures the **right credential per jurisdiction + work type** via `requiredTradeCredential(jur, workType)` (Gas Safe, NICEIC/Part P, RGI, Safe Electric, Schornsteinfeger, AU builder licence). A compliance cert (dim 4) is only "valid" if its `issuing_supplier_id` holds the matching verified credential.

### 2. New features
- Jurisdiction-aware supplier credential fields + verification.
- Supplier eligibility gate on Create Job / PPM (only credentialed suppliers for regulated work).
- Supplier **tax-ID label per country** (VAT/ABN/EIN — shared with dim 8).

### 3. New components
- `src/components/work/SupplierCredentialFields.tsx` — renders the right credential input per jurisdiction.
- `src/components/work/CredentialVerifiedBadge.tsx`.
- `src/components/work/EligibleSupplierSelect.tsx` (filters by credential).

### 4. Context changes
`requiredTradeCredential` in a new work pack; `useTradeCredentials(jur, workType)`.

### 5. Cross-integration
Dim 4 (cert validity) · dim 24 (PL insurance minimum) · **Work ▸ Suppliers (Directory/Compliance)** · **Supplier detail ▸ Compliance** · **Work ▸ PPM** · **Create Job wizard** · **Contacts ▸ Organisation ▸ Supplier Profile**.

### 6. Requirements
Phase-2; `supplier_credentials` table (generic) or jurisdiction columns on `suppliers`.

### 7. Workspace level
None (supplier-level data).

### 8. Section → sub-tab → wizard → detail
- **Work ▸ Suppliers ▸ Directory / Compliance / Performance**.
- **Supplier detail ▸ Compliance / Invoice** (tax-ID label).
- **Work ▸ PPM ▸ Suppliers** (eligibility).
- **Wizard: Create Job** (supplier eligibility) · **New PPM Schedule**.

### 9. Editable & new fields
- Editable: credential type, reference (Gas Safe no / RGI no / Schornsteinfeger), verified date, PL insurance, tax-ID.
- New: `supplier_credentials` rows; `suppliers.tax_id`, `suppliers.tax_id_label`.

### 10. DB additions
`supplier_credentials` (id, workspace_id, supplier_id, credential_type, jurisdiction, reference, verified_at, expires_at, document_path) — RLS scoped. `suppliers`: `+ tax_id text`, `+ tax_id_label text`, `+ public_liability_expires_at date`.

### 11. Function additions
`src/lib/work/trade-certs.ts`: `requiredTradeCredential(jur, workType)`, `supplierIsEligible(supplier, jur, workType)`, `taxIdLabel(jur)` (VAT/ABN/EIN).

### 12. Onboarding additions
Supplier-onboarding wizard asks for jurisdiction → renders the correct credential fields (Gas Safe number for UK gas trade etc.).

### 13. Seed data additions
3 suppliers: 1 UK Gas-Safe gas engineer, 1 IE RGI installer, 1 DE Schornsteinfeger — each with a verified `supplier_credentials` row, so the eligibility gate + cert-validity link are testable.

---

# DIM 24 — Insurance obligations

### 1. How it works
`insuranceDuties(jur, propertyType)` resolves required cover (buildings insurance, HMO/short-let cover, contractor PL minimums). Surfaced as a Compliance checklist row on the property + a PL-insurance gate on suppliers.

### 2. New features
- Per-property insurance tracking + duty checklist.
- Supplier PL-insurance minimum gate.

### 3. New components
- `src/components/compliance/InsuranceDutyRow.tsx`.
- `src/components/work/PlInsuranceGate.tsx` (reuses dim-20 eligibility).

### 4. Context changes
`insuranceDuties` in compliance pack; `useInsuranceDuties(propertyId)`.

### 5. Cross-integration
Dim 20 (supplier PL) · dim 3 (HMO cover) · dim 10 (short-let cover) · **Portfolio ▸ Property ▸ Compliance/Documents** · **Planning ▸ Cost Drivers** (premium estimate).

### 6. Requirements
Phase-2; `property_insurance` table; supplier PL field (from dim 20).

### 7. Workspace level
None.

### 8. Section → sub-tab → wizard → detail
- **Portfolio ▸ Property ▸ Compliance / Documents** · **Work ▸ Suppliers** (PL) · **Planning ▸ Cost Drivers** (premium line).

### 9. Editable & new fields
- Editable: policy type, insurer, expiry, sum insured.
- New: `property_insurance` row.

### 10. DB additions
`property_insurance` (id, workspace_id, property_id, policy_type, insurer, sum_insured, expires_at, document_path) — RLS scoped.

### 11. Function additions
`src/lib/compliance/insurance.ts`: `insuranceDuties(jur, propertyType)`, `insuranceStatus(property)`.

### 12. Onboarding additions
Add-Property → seeds a "buildings insurance" duty row if jurisdiction/property-type requires it.

### 13. Seed data additions
1 property with a buildings-insurance policy (expiring soon) + 1 HMO with HMO-specific cover.

---

# DIM 27 — Building safety (high-rise/cladding)  *(STRUCTURAL — adds a building entity)*

### 1. How it works
A new **`buildings`** entity sits above `properties`/units (shared with dim 17 tenure). `buildingSafetyDuties(jur, building)` evaluates higher-risk status (E&W BSA 2022: ≥18m **or** ≥7 storeys **and** ≥2 units) and surfaces a building-level compliance checklist (Accountable Person, safety case, cladding/EWS1 status) on blocks of flats. Leaseholder cost protections referenced in Legal.

### 2. New features
- **Building entity** with auto `is_higher_risk` flag.
- Building-level safety checklist on higher-risk blocks (V1); full Accountable-Person workflow is V1.5.

### 3. New components
- `src/components/portfolio/BuildingCard.tsx` (building above its units).
- `src/components/compliance/BuildingSafetyChecklist.tsx`.
- `src/components/compliance/HigherRiskBadge.tsx`.

### 4. Context changes
`buildingSafetyDuties` in compliance pack; `useBuilding(propertyId)` resolves the property's building.

### 5. Cross-integration
**Dim 17 (tenure) shares the `buildings` entity** · dim 4 (building-level certs e.g. communal fire) · **Portfolio ▸ Property ▸ Compliance** · **Compliance ▸ Coverage** · **Legal ▸ Overview** (leaseholder protections reference).

### 6. Requirements
Phase-0/1 builds the `buildings` skeleton (shared with dim 17); Phase-2 surfaces the checklist.

### 7. Workspace level
None.

### 8. Section → sub-tab → wizard → detail
- **Portfolio ▸ Property ▸ Compliance** — building checklist for higher-risk blocks.
- **Compliance ▸ Coverage** — building-level rows.
- **Add Property wizard** — optionally links/creates a `building`.

### 9. Editable & new fields
- Editable: building height, storeys, unit count, accountable person, safety-case status, cladding status, EWS1 status.
- New: full `buildings` row + `properties.building_id`.

### 10. DB additions
`buildings` (id, workspace_id, address, country_code, region_code, height_m, storeys, unit_count, is_higher_risk, accountable_person, safety_case_status, cladding_status, ews1_status) — RLS workspace scoped. `properties`: `+ building_id uuid` FK. `is_higher_risk` computed on write.

### 11. Function additions
`src/lib/compliance/building-safety.ts`: `isHigherRisk(jur, {height, storeys, units})`, `buildingSafetyDuties(jur, building)`.

### 12. Onboarding additions
Add-Property → if "flat in a block", prompt to attach/create a building; auto-evaluate higher-risk.

### 13. Seed data additions
1 higher-risk building (20m, 8 storeys, 12 units) in England with 3 leasehold flats as properties → building checklist + leaseholder-protection reference testable.

---

## Part-2 build order & dependencies
- **`buildings` entity (dim 27 + dim 17) is the structural prerequisite** — build the skeleton in Phase 0/1 so both consume it.
- **Dim 4 ↔ dim 20 build together** (cert validity depends on supplier credential).
- **Dim 24** rides on dim-20 supplier fields + dim-4 compliance rows.
- All of Part 2 lands in **Phase 2** (Compliance/Work), except the `buildings` skeleton (Phase 0/1).

## Part-2 migration summary (Management API PAT, idempotent, RLS)
| Table | Change |
|---|---|
| `compliance_items` | + authority, cadence_months, exempt, exempt_reason, issuing_supplier_id; extend kind enum |
| `supplier_credentials` | NEW |
| `suppliers` | + tax_id, tax_id_label, public_liability_expires_at |
| `property_insurance` | NEW |
| `buildings` | NEW (shared with dim 17) |
| `properties` | + building_id |

> **Next:** PART-3 (Money & Tax — dims 2, 7, 8, 9, 21, 26).
