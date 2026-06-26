# Building Safety (dim 27) — Sourced

**Compiled:** 2026-06-25. **Status:** `sourced` UK E&W (informational — NOT legal advice; verify & customise); rest queued. **Attaches to the BUILDING, not the unit** — links the housing-model layer (§17): a block of flats needs a *building* record (Accountable Person, safety case) distinct from each leasehold *unit*.
**Drives:** Portfolio (building/unit model), Compliance, Legal (leaseholder cost protections), Work (remediation). Operator override per master plan §10b.

## UK — England & Wales
| Item | Rule | Source |
|---|---|---|
| **Higher-risk building** | ≥2 residential units **and** (**≥18m** **or** **≥7 storeys**) | [GOV.UK — higher-risk building criteria](https://www.gov.uk/guidance/criteria-for-being-a-higher-risk-building-during-the-occupation-phase-of-the-new-higher-risk-regime) |
| **Building Safety Act 2022** | new safety regime + **Building Safety Regulator**; building registration | [GOV.UK — Building Safety Act](https://www.gov.uk/guidance/the-building-safety-act) |
| **Accountable Person** | dutyholder during occupation (Part 4); manage building-safety risks; **safety case** | GOV.UK BSA |
| **Leaseholder protections** | qualifying leaseholders **cannot be charged for cladding** remediation; non-cladding costs **capped + spread over 10 yrs** (costs since 28 Jun 2017 count) | [GOV.UK — leaseholder protections FAQ](https://www.gov.uk/guidance/leaseholder-protections-on-building-safety-costs-in-england-frequently-asked-questions) |
| **EWS1** | **lender-driven, NOT statutory**; should not be requested for buildings <18m | GOV.UK |
| **Fire safety** | Fire Safety Act 2021 + Regulatory Reform (Fire Safety) Order 2005 — fire-risk assessments | legislation.gov.uk |
| **Building Safety / Cladding Safety Funds** | freeholder can apply for remediation funding (buildings >18m with dangerous cladding) | GOV.UK CSS |

## Other jurisdictions (queued)
- **Scotland:** Single Building Assessment (SBA) cladding programme; tenement maintenance duties.
- **EU:** national fire-safety codes; high-rise façade rules post-Grenfell vary by member state.
- **Australia:** combustible-cladding registers (state, e.g. VIC Cladding Safety Victoria).
- **UAE:** Dubai Civil Defence fire & life-safety code (one of the strictest).

> **Encoding:** a **building record** with `is_higher_risk` (≥18m/7-storeys + 2 units), `accountable_person`, `safety_case_status`, `cladding_status`, `ews1_status`. This is the structural reason the data model needs a building entity above the unit (§17). For V1, surface as a **compliance checklist on the building/property** for higher-risk blocks; full Accountable-Person workflow is V1.5+.
