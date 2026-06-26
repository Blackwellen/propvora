# AML / KYC (dim 28) — Sourced

**Compiled:** 2026-06-25. **Status:** `sourced` UK (informational — NOT legal advice; verify & customise); EU + rest queued. **Links the existing sanctioned-country set in code** (`src/lib/international/countries.ts`).
**Drives:** Contacts/onboarding (CDD), any transaction/marketplace/payment path, Settings (MLRO/risk policy). Operator override per master plan §10b.

## UK
| Item | Rule | Source |
|---|---|---|
| **Framework** | **Money Laundering Regs 2017 (MLR 2017)** (+ 5MLD from 10 Jan 2020) | [GOV.UK — AML supervision: estate & letting agency](https://assets.publishing.service.gov.uk/media/65ba2cbee9e10a000d031139/Estate_and_letting_agency_business_guidance_money_laundering_supervision_240130-1__1_.odt) |
| **Who** | **Estate agents** (all) + **letting agents** for high-value lettings (**≥€10,000/month** rent) | [Legal Eye — AML letting agents](https://legal-eye.co.uk/estate-agents/anti-money-laundering-aml-regulations-for-letting-agents-what-do-you-need-to-know/) |
| **Supervisor** | **HMRC** — must register **before** trading; criminal offence to operate unregistered | GOV.UK |
| **CDD** | identify + verify client **and beneficial owners**; **both buyer and seller** once offer accepted (Reg 27) | Howard Kennedy / GOV.UK |
| **Org** | written **risk assessment** + AML policy + nominated **MLRO**; SARs to NCA | GOV.UK |
| **Records** | retain **5 years** post-transaction | GOV.UK |
| **Penalty** | civil penalty / criminal — unlimited fine and/or **up to 2 years** prison | Legal Eye |

## EU & others (queued)
- **EU:** AMLD framework (4/5/6MLD) → new **EU AML Regulation + AMLA authority** (single rulebook, phasing from 2027). Real-estate agents are obliged entities; CDD + UBO registers.
- **UAE/Saudi:** FATF-aligned AML regimes; real-estate reporting to FIU (UAE goAML).
- **US:** FinCEN real-estate reporting rule (residential all-cash transfers) phasing in.
- **Sanctions:** screen against the **banned/sanctioned country set already in code** + OFAC/OFSI/EU lists — this is the existing sanctions layer; AML adds the CDD/MLRO/SAR workflow on top.

> **Encoding:** AML is a **workspace/transaction compliance layer**, not a per-property legal pack: `amlRequired(jurisdiction, role, dealValue)` → triggers CDD on Contacts (buyer/seller/high-value tenant), MLRO config in Settings, SAR workflow, 5-year retention. For V1: surface CDD status on Contacts + a sanctions screen (reuse the code's sanctioned set); full MLRO/SAR workflow is V1.5+ and only needed if Propvora itself acts as a regulated agent.
