# Safety Compliance Certificates (dim 4) + Contractor/Trade Certification (dim 20) — Sourced

**Compiled:** 2026-06-25. **Status:** `sourced` (informational, from verified public sources — NOT legal advice; verify & customise; permanent disclaimer per LIABILITY plan). The codebase already has **reviewed** compliance sets for **GB, IE, AU, NZ, US, CA** in `src/lib/compliance/requirements.ts`; this doc extends to EU + ties in the **who-can-do-the-work** trade-certification layer (dim 20, which drives Work ▸ Suppliers/Jobs/PPM).
**Drives:** Compliance section (certs/inspections/coverage), Work (supplier competence), Planning (compliance tabs).

## Dim 4 — Safety compliance per jurisdiction

| Jurisdiction | Certificate / inspection | Cadence | Who can issue (dim 20) | Source |
|---|---|---|---|---|
| **England** | **Gas Safety Record (CP12)** | **Annual** | **Gas Safe registered** engineer (legal) | [Gas Safe Register — landlord responsibilities](https://www.gassaferegister.co.uk/gas-safety/renting-a-property/landlord-gas-responsibilities/) · [HSE](https://www.hse.gov.uk/gas/landlords/safetycheckswho.htm) |
| England | **EICR** (electrical) | **Every 5 years** (since 1 Apr 2021) | qualified/competent electrician (Part P / NICEIC / NAPIT) | [GOV.UK electrical safety PRS](https://www.gov.uk/government/publications/electrical-safety-standards-in-the-private-rented-sector-guidance-for-landlords-tenants-and-local-authorities) |
| England | **EPC** (min E; MEES → C roadmap) · **Smoke + CO alarms** (2022 Regs) · fire risk | EPC 10yr; alarms ongoing | EPC = accredited assessor | [GOV.UK EPC/MEES] |
| **Scotland** | Gas (annual), EICR (5yr), EPC, **interlinked smoke/heat/CO alarms** (2022), **Repairing Standard** | as noted | Gas Safe / competent | gov.scot Repairing Standard |
| **Northern Ireland** | Gas (annual), electrical, EPC, smoke/CO | as noted | Gas Safe | nidirect |
| **Ireland** | **RGI** gas cert, **Safe Electric** RECI/ECSSA, BER (energy), S.I.137/2019 min standards | per standard | **Registered Gas Installer (RGI)**, **Safe Electric** registered | [RTB min standards / S.I.137/2019] |
| **France** | **DDT** (Dossier de Diagnostic Technique): **DPE** (10yr), **CREP/plomb** (pre-1949), **amiante** (permit pre-1 Jul 1997), **gaz** + **électricité** (installation >15yr), **ERP/état des risques** (6 months), bruit | attach to **bail + each renewal** | **diagnostiqueur certifié** (certified diagnostician) | [service-public.gouv.fr F33463](https://www.service-public.gouv.fr/particuliers/vosdroits/F33463) · [Notaires de France](https://www.notaires.fr/en/immobilier-fiscalite/diagnostics-environnement/diagnostics-immobiliers-obligatoires-pour-la-location) |
| **Germany** | **Rauchwarnmelder** (smoke, all 16 Länder, landlord installs + annual check; fine ≤€50k) · **E-Check / DGUV V3** electrical · **Schornsteinfeger** (chimney sweep) for heating | smoke annual; others periodic | **Schornsteinfeger** (state-appointed), certified electrician | [ABUS — smoke detector obligation](https://www.abus.com/int/Guide/Fire-protection-guide/Smoke-detector-obligation) · [DGUV V3](https://www.elektropruefung.guru/) |
| **Spain** | **ITE** (technical building inspection, buildings **45+ yrs**) · **Cédula de habitabilidad** (regional — abolished in Madrid 2018) · **certificado energético** (EPC) · boletín eléctrico/gas | ITE periodic; CEE 10yr | architect/aparejador/technical architect; authorised installer | [api.cat — cédula](https://www.api.cat/noticias/requisitos-para-obtener-la-cedula-de-habitabilidad/) · ITE guides |

## Dim 20 — Contractor / trade certification (who is competent to do the work)
The compliance cert is only valid if issued by the **legally competent person** — so the Work ▸ Suppliers directory must capture and verify the right credential per jurisdiction:

| Jurisdiction | Gas | Electrical | Energy assessor | Builder/general |
|---|---|---|---|---|
| **UK (E&W/SCT/NI)** | **Gas Safe Register** (mandatory by law) | competent person: **NICEIC / NAPIT / Part P** | accredited **EPC assessor** | (no national licence; CSCS card on sites) |
| **Ireland** | **RGI** (Registered Gas Installer) | **Safe Electric** (RECI) | **BER assessor** | — |
| **France** | diagnostiqueur certifié; PG (Professionnel Gaz) | — | diagnostiqueur certifié | artisan RGE for energy works |
| **Germany** | **Schornsteinfeger** (district master) | certified Elektrofachkraft | Energieberater | Meister (master-craftsman) system |
| **Spain** | authorised gas installer | authorised electrical installer | técnico (architect/engineer) | colegiado technician |
| **Australia** | licensed gasfitter | licensed electrician | accredited assessor | **builder's licence (state)** — significant |
| **USA** | licensed (state) | licensed (state) | — | contractor licence (state) |

> **Encoding note:** dim 4 extends `compliance/requirements.ts` from 6 → 45 jurisdictions (France/Germany/Spain added here; rest queued). dim 20 adds a **`requiredTradeCredential(jurisdiction, workType)`** the Suppliers directory verifies (e.g. "Gas Safe number" field for UK gas suppliers, "RGI number" for IE, "Schornsteinfeger" for DE). Supplier compliance tab becomes jurisdiction-aware.

## Queued (next pass)
IT (libretto impianto, APE), NL (energielabel), BE (EPC/keuring elektrische installatie), PT/SE/FI/DK/AT/CZ/HR/HU/RO/GR; CH (Feuerungskontrolle), JP, AE (Dubai Civil Defence), etc.

### Sources (consolidated)
gassaferegister.co.uk · hse.gov.uk · gov.uk electrical/EPC/MEES · gov.scot Repairing Standard · RTB/S.I.137/2019 (IE) · service-public.gouv.fr F33463 + notaires.fr (FR) · ABUS/DGUV V3 (DE) · api.cat + ITE guides (ES).
