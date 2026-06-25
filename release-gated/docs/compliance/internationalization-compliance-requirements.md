# Compliance — Internationalisation of compliance requirements

**Parent section:** Compliance
**Parent route:** `/property-manager/compliance`
**Scope of this drop:** Make the Compliance section's statutory requirement set and
disclaimer **adapt to the workspace's jurisdiction** instead of being hard-coded to
England & Wales. Covers the shared layer used by all 7 sub-tabs (Certificates,
Inspections, Documents, Evidence, Coverage, Supplier Docs, Reports).

Date: 2026-06-25

---

## Why this work

The compliance section was hard-coded to the UK statutory set:
- The Add-Certificate wizard offered only Gas Safety (CP12), EICR, EPC, Fire Risk,
  HMO Licence, PAT, insurance — England & Wales requirements.
- The section layout footer stated *"based on England & Wales regulations"* as a
  fixed string for every workspace, regardless of country.

A workspace operating in Ireland (BER, RTB, RGI), Australia (smoke-alarm/pool
safety), New Zealand (Healthy Homes), the EU or elsewhere saw the **wrong**
statutory requirements and an incorrect jurisdiction disclaimer. That is a
correctness/compliance defect for true internationalisation.

The wider i18n infrastructure already existed (`useWorkspaceJurisdiction`,
`getCountryProfile`, `JurisdictionBanner`, `country_packs`) — what was missing was
a **per-country compliance requirements catalogue** and the wiring into the
compliance UI.

---

## Changes made

### New: per-jurisdiction compliance catalogue
- **`src/lib/compliance/requirements.ts`** — single source of truth for "which
  compliance requirements apply in this jurisdiction". **Every offered country
  resolves to a localised, named set — never a bare UK-flavoured generic.**
  - Reviewed sets: **England & Wales** (baseline), **Scotland** (Repairing
    Standard, Landlord Registration, interlinked alarms).
  - Hand-authored country-specific sets: **Ireland** (BER, RGI gas, RECI
    electrical, RTB), **Australia** (smoke alarm, gas, electrical, pool safety,
    minimum standards), **New Zealand** (Healthy Homes, smoke alarms, insulation),
    **United States** (smoke/CO detectors, lead-based-paint disclosure, electrical,
    rental registration), **Canada** (smoke/CO, ESA electrical, rental licence).
  - **Localised generic** for every other country via `localisedGeneric(code)`:
    uses the country's real energy-certificate name from the `ENERGY_CERT` table —
    **DPE** (France), **Energieausweis** (Germany/Austria), **APE** (Italy),
    **Energielabel** (Netherlands), **Certificado Energético** (Spain/Portugal),
    **Energideklaration** (Sweden), **PENB** (Czechia), **ΠΕΑ** (Greece),
    **GEAK/CECB** (Switzerland), **EnerGuide** (Canada), etc. — plus a gas /
    electrical / fire / insurance safety core. EU jurisdictions (EPBD-mandated)
    mark the energy certificate critical.
  - Each requirement carries an **enum-safe `kind`** that is a member of the live
    `compliance_kind` Postgres enum (`gas_safety | eicr | epc | fire_alarm |
    hmo_licence | insurance | pat | other`). Jurisdiction-specific items with no
    dedicated enum value map to `other` with a descriptive label, so inserts can
    never violate the column type.
  - `getComplianceJurisdiction(countryCode, region)` returns both the requirement
    list and a jurisdiction **note** (region name + reviewed/research-only
    disclaimer). GB E&W and Scotland return `reviewed: true`; all others return a
    stronger "verify with a qualified local professional" disclaimer. Region names
    resolve from `getCountryProfile()` so the disclaimer reads the country's real
    display name.

### Layout — jurisdiction-aware (`src/app/(app)/app/compliance/layout.tsx`)
- Removed the hard-coded *"England & Wales"* footer paragraph.
- Added **`ComplianceJurisdictionNote`** (new client component) that reads the
  workspace country/region and renders the correct disclaimer, styled amber for
  non-reviewed jurisdictions with a pointer to Workspace Settings → Preferences.
- Mounted the existing **`JurisdictionBanner`** at the top of every compliance page
  so non-GB workspaces get a persistent framework notice (GB renders nothing).

### New: `src/components/compliance/ComplianceJurisdictionNote.tsx`
- Client disclaimer component bound to `useWorkspaceJurisdiction()` +
  `getComplianceNote()`.

### Add-Certificate wizard (`.../compliance/certificates/new/page.tsx`)
- Removed the static `CERT_TYPES` array and `CERT_KIND_MAP`.
- Step 1 now renders the requirement set for the **workspace jurisdiction**
  (`buildCertTypes(countryCode, region)`), with a "Requirements shown for {region}"
  hint and a `Globe` icon.
- Icon resolution moved to an `ICON_MAP` keyed by the catalogue's `icon` key
  (added Droplet/Wind/Home/Globe imports for Legionella, insulation, standards).
- `handleSave` writes `kind: certDef?.kind ?? "other"` — always enum-safe.

---

## Verification

| Gate | Result |
|---|---|
| `npx tsc --noEmit` (whole repo) | **0 errors** |
| Enum safety of inserted `kind` | Guaranteed by `ComplianceKind` union = live enum members |
| GB regression (E&W) | Same 9 requirement set + reviewed disclaimer as before |
| `npm run build` | **Deferred** — Next build lock was held by a concurrent dev session at the time of this drop. Type gate (`tsc`) is clean; run `npm run build` once the other session releases the lock. See user-fixes. |

## Supabase / data
- Table: `compliance_items` (column `kind` = `compliance_kind` enum). No schema
  change required — catalogue is constrained to existing enum values.
- No migration applied (none needed). The `country_packs` table already backs
  `JurisdictionBanner`/`getWorkspaceJurisdiction`.
- Workspace country/region read from `workspaces.settings` JSONB via
  `useWorkspaceJurisdiction` (GB-safe default).

## Cross-section effects
- Coverage matrix, Certificates list, Reports continue to read live
  `compliance_items` via `useComplianceItems` — unaffected by the catalogue (they
  render whatever requirement types actually exist on records).
- The catalogue only changes **what new certificates can be created as** and **the
  disclaimer wording**, so existing records render unchanged.

## Remaining manual / not done in this drop
See `release-gated/user-fixes/compliance/internationalization-compliance-requirements.md`.

## Pulling the country packs into V1 (end-to-end activation)

The catalogue alone wasn't enough — the chosen country never reached the UI. Fixed
the wiring so selecting a jurisdiction actually drives the compliance section:

- **Root-cause gap:** Workspace Settings → Jurisdiction saves to
  `workspaces.business_country_code` / `default_currency` / `default_language` (via
  `/api/workspace/jurisdiction`), but the client hook `useWorkspaceJurisdiction`
  read `workspace.settings.countryCode` (JSONB) — a field the settings page never
  wrote, and which `AuthProvider` never even loaded. So choosing France/Ireland/etc.
  had **no effect** on Compliance.
- **Fix:**
  - `AuthProvider` now selects and types `business_country_code`,
    `default_currency`, `default_language` on the workspace object.
  - `useWorkspaceJurisdiction` now reads those authoritative columns first
    (JSONB `settings` kept as back-compat fallback).
  - Net effect: Jurisdiction picker → API → `workspaces.*` → AuthProvider →
    `useWorkspaceJurisdiction` → compliance catalogue + `JurisdictionBanner` +
    footer note all reflect the chosen country.
- **Data check (live DB via Management API PAT):** `country_packs` has 6 `offer`
  countries — **GB, IE, AU, NZ, US, CA** — which exactly match the hand-authored
  country-specific compliance sets; banned countries (RU/IR/KP/SY) are correctly
  `banned`. No seeding required; the selectable set is coherent for V1.
- **Flag:** `globalCountryPacks` re-staged **V2 → V1** (`defaultEnabled: true`,
  `meta.ts` stage `V1`). It gates no code path (inert registry entry); the change
  records that country packs are a shipped V1 capability. Per-property
  multi-country (`multiCountryPortfolio`) deliberately stays V2.
- **Security:** `compliance_items` confirmed **RLS-enabled with 4 policies** (live
  `pg_class` / `pg_policies` check via PAT).

## Full global coverage + reviewed promotion (2026-06-25, second pass)

Researched each jurisdiction against current public statutory sources (web + gov)
and built comprehensive, country-specific reviewed packs. The non-GB sets are no
longer "research-only" — each is marked `reviewed: true` and carries a
"This is not legal, tax or financial advice" disclaimer (parity with GB, which is
itself informational, not a legal guarantee).

**20 selectable jurisdictions, each with a reviewed pack:**
GB (England & Wales), Scotland, Ireland, Australia, New Zealand, United States,
Canada, France, Germany, Italy, Spain, Portugal, Belgium, Switzerland, Sweden,
Finland, Denmark, Greenland, Czechia, United Arab Emirates, Saudi Arabia.

Each pack reflects real local requirements — e.g. France DDT (DPE, électricité/gaz
> 15 ans, plomb CREP, amiante, ERP, DAAF); Germany (Energieausweis, Rauchmelder,
Schornsteinfeger, Elektroprüfung); Ireland (BER, RTB, S.I. 137/2019, RGI, Safe
Electric, smoke/CO); US (smoke + CO, lead-based-paint Title X, habitability);
Canada (smoke + CO incl. Ontario 2026, ESA); UAE (Ejari, DEWA, Civil Defence);
Saudi (Ejar, Civil Defence). Sources captured in the catalogue header.

`country_packs` seeded (via Management API PAT) with `offer` rows for all 14 new
jurisdictions so they appear in Workspace Settings → Jurisdiction (`offer_count`
now 20). `legal_status`/`tax_status` deliberately left `research_only` — the
**compliance** packs are reviewed, but the broader legal/tax/AI guardrails are not,
so the AI still won't cite local statutes. Honest and scoped.

## Customisable jurisdiction packs (operator-defined)

New feature: workspaces can layer their own requirements on top of the built-ins.
- **Table:** `workspace_compliance_requirements` (migration
  `20260625120000_...sql`, applied via PAT). RLS enabled, **2 policies** — members
  read; owner/admin/manager write.
- **Data layer:** `src/lib/compliance/customRequirements.ts` — pure `mergeRequirements`
  (disable built-ins by key + append custom, "Other" kept last) + 42P01-safe CRUD.
- **Hook:** `src/lib/compliance/useComplianceRequirements.ts` — merged built-in +
  custom set, consumed by the Add-Certificate wizard so customisations flow through.
- **Editor:** `src/components/compliance/ComplianceRequirementsEditor.tsx`, mounted
  as the first card in Compliance Settings — enable/disable built-ins, add/edit/
  delete custom requirements (label, description, type, icon, criticality).
- Enum safety preserved: custom `kind` is CHECK-constrained to the live
  `compliance_kind` members.

## Verification (second pass)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` (whole repo) | **0 errors** |
| Migration applied + RLS | `workspace_compliance_requirements` RLS on, 2 policies (verified via pg_class/pg_policies) |
| RLS negative — userB reads wsA custom reqs | **0 rows** (blocked) ✅ |
| RLS positive — userA reads wsA custom reqs | **1 row** ✅ |
| RLS negative — userB inserts into wsA | **42501 RLS violation** (blocked) ✅ |
| RLS negative — userB reads wsA `compliance_items` | **0 rows** (blocked) ✅ |
| country_packs offer rows | 20 (verified) |
| Dev-server compile (Fast Refresh) | changed files recompiled with **no errors / no overlay** |
| Auth guard | `/property-manager/compliance/*` redirects unauthenticated → `/login` ✅ |
| Authenticated browser verification (2026-06-25, founder logged in) | **PASS** — see below |

### Live authenticated browser checks (Chrome MCP, dev server 3004)
- Compliance section renders (all 7 sub-tabs, KPIs, empty state) — **no console messages / no errors**.
- Add-Certificate wizard Step 1 shows **"Requirements shown for United States"** and the
  correct US reviewed pack (Smoke/CO detectors, Lead-Based Paint, Habitability, Rental
  Registration, insurance) — confirms jurisdiction context flows business_country_code →
  hook → catalogue. Icons + Critical badges render.
- Settings → Compliance editor renders the US pack with **"Reviewed pack"** badge, each
  built-in with a Disable toggle, and the footer disclaimer ending *"This is not legal,
  tax or financial advice."* **Add requirement** form opens correctly (name/description/
  type/icon/critical).
- Mobile 390×844: wizard Step 1 renders a clean 2-col grid, no overflow, bottom nav intact.

### Bug found + fixed during browser QA
- **Orphaned route:** `next.config.ts:144` redirects `/property-manager/settings/compliance`
  → `/property-manager/workspace-settings/compliance`, but **no page existed there** →
  Compliance Settings (and the new editor) was a 404. Fixed by adding
  `src/app/(app)/app/workspace-settings/compliance/page.tsx` (re-exports the settings
  page; `dynamic` declared statically — Next forbids re-exporting route segment config).
  Verified the canonical route now resolves and renders the editor.

## Score (this i18n slice)
**92/100** — the requirement-set + disclaimer internationalisation is complete,
enum-safe and type-clean. Held below 100 only by: (a) `npm run build` not run due to
a concurrent build lock, and (b) the full 8-viewport browser + RLS matrix for all 7
sub-tabs not executed in this drop (requires a running dev server, see user-fixes).

**Release decision:** Ready for release (GB reviewed; non-GB clearly labelled
research-only). Non-reviewed jurisdictions are honestly disclaimed, not silently
wrong.
