# Tenancy Models (18) · Right-to-Rent (13) · Tenant Fees (22) · Energy Minimums (14) — Sourced

**Compiled:** 2026-06-25. **Status:** `sourced` (informational, from verified public sources — NOT legal advice; verify & customise; permanent disclaimer per LIABILITY plan). These four are tightly UK-coupled (devolved differences matter); EU/other equivalents noted. Operator override per master plan §10b.

## Dim 18 — Tenancy-agreement models (statutory type + written-statement duty)
| Jurisdiction | Statutory model | Written statement / form | Source |
|---|---|---|---|
| **England** | AST → **periodic only** post-RRA 2026 (S21 gone); prescribed info duties | "How to Rent" guide; no single statutory form | gov.uk RRA |
| **Wales** | **Occupation contracts** (NOT tenancies) — Renting Homes (Wales) Act 2016 (from 1 Dec 2022); **standard** (PRS) / secure (social) | **Written statement within 14 days** (new) / 6 months (converted) | [GOV.WALES — converted occupation contract](https://www.gov.wales/creating-converted-occupation-contract-guidance-landlords-html) · [RHW Act 2016](https://www.legislation.gov.uk/anaw/2016/1) |
| **Scotland** | **Private Residential Tenancy (PRT)** — open-ended; model agreement | model PRT (Scottish Govt) | gov.scot PRT |
| **Ireland** | tenancy under RTA 2004; RTB registration | — | RTB |
| **France** | bail vide / bail meublé (different terms) | prescribed mentions + DDT annexed | service-public |
| **Germany** | Mietvertrag (written, signed) | — | §550 BGB |
| **Italy** | 4+4 / 3+2 (canone concordato) | registered with Agenzia Entrate | L.431/98 |

> **Wales is the structural outlier:** "occupation contracts" + "contract-holder" (not tenant) + standard/secure contracts. The data model needs a **tenancy_model** per jurisdiction (tenancy / occupation-contract / PRT / bail / Mietvertrag) with the right terminology and written-statement deadline.

## Dim 13 — Right-to-Rent / immigration checks
| Jurisdiction | Duty | Penalty | Source |
|---|---|---|---|
| **England ONLY** | Landlord must check immigration status of all adult occupiers **before** tenancy (Immigration Act 2014) | civil penalty **up to £3,000/tenant** (statutory excuse if checks done correctly) | [GOV.UK — right to rent](https://www.gov.uk/government/collections/landlords-immigration-right-to-rent-checks) |
| **Wales / Scotland / NI** | **EXEMPT** — scheme is England-only | n/a | gov.uk |
| Most other countries | no landlord immigration-check duty (tenant may need residence registration — e.g. DE Anmeldung) | — | — |

> Right-to-Rent is an **England-only** gate — must be conditioned on property region = England, never applied to Wales/Scotland/NI or abroad.

## Dim 22 — Tenant fees / permitted payments
| Jurisdiction | Regime | Key caps | Source |
|---|---|---|---|
| **England** | **Tenant Fees Act 2019** (amended by RRA 2025) — all fees banned except permitted | deposit **5/6 weeks**; **holding deposit ≤1 week**; default fees (late rent, lost key); variation ≤£50 | [GOV.UK — Tenant Fees Act](https://www.gov.uk/government/collections/tenant-fees-act) |
| **Scotland** | letting agent/tenant fees banned (pre-dates England) | premiums illegal | gov.scot |
| **Wales** | Renting Homes (Fees etc.) (Wales) Act 2019 | similar ban | gov.wales |
| Others | generally no fee-ban regime (agency commission varies) | — | — |

## Dim 14 — Energy-efficiency minimum standards
| Jurisdiction | Standard | Trajectory | Source |
|---|---|---|---|
| **England & Wales** | **MEES** — currently min **EPC E** to let | **EPC C by 1 Oct 2030** (all tenancies); **£10,000 cost cap**/10yr; affordability exemption <£100k; **EPC reform Oct 2026** → multi-metric (fabric + heating/smart) | [Jones Day — EPC C by 2030](https://www.jonesday.com/en/insights/2026/03/epc-c-by-2030) · [CLA — PRS MEES](https://www.cla.org.uk/news/government-announces-plan-for-minimum-energy-efficiency-standards-in-the-private-rented-sector-prs-mees/) |
| **Scotland** | own energy-standard pathway | — | gov.scot |
| **EU** | **EPBD** (recast 2024) — member states set minimum energy-performance trajectories; worst-performing buildings to improve (residential MEPS by member-state roadmap) | national transposition | EU EPBD 2024 |
| Non-EU | energy-certificate where it exists (dim 4); minimum-standard varies | — | — |

> **Encoding:** dim 14 = `energyMinStandard(jurisdiction, date)` returning the required EPC/energy grade + the upcoming trajectory + cost cap/exemptions. England/Wales EPC-C-by-2030 is the headline; EU is member-state MEPS under EPBD 2024. All **dated** (trajectories move).

### Sources (consolidated)
GOV.WALES RHW Act 2016 + legislation.gov.uk anaw/2016/1; GOV.UK right-to-rent collection + Tenant Fees Act collection; Jones Day / CLA MEES; EU EPBD 2024.
