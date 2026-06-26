# Capital Gains / Disposal Tax (dim 26) — Sourced

**Compiled:** 2026-06-25. **Status:** `sourced` UK (informational — NOT legal advice; verify & customise); rest queued. **Rates change at fiscal events → store dated/configurable.**
**Drives:** Planning ▸ Dev/Flip + exit/sale modelling, Money disposal. A forecast that ignores disposal tax overstates net return. Operator override per master plan §10b.

| Jurisdiction | Disposal tax | Rate | Main-home / holding relief | Reporting | Source |
|---|---|---|---|---|---|
| **UK** | **Capital Gains Tax** (residential) | **18%** basic-rate / **24%** higher/additional (from 6 Apr 2026) | **Private Residence Relief** (main home); non-residents taxed on UK residential gains | **within 60 days** of completion | [GOV.UK — CGT rates](https://www.gov.uk/capital-gains-tax/rates) · [GOV.UK — sell property](https://www.gov.uk/tax-sell-property) |
| **Ireland** | CGT | **33%** | PPR relief | self-assessment | [revenue.ie CGT](https://www.revenue.ie/en/gains-gifts-and-inheritance/transfering-an-asset/index.aspx) (confirm) |
| **France** | **plus-value immobilière** | 19% + 17.2% social = **36.2%**, **taper to exempt at 22yr (income)/30yr (social)** | main residence **exempt** | notaire withholds | (service-public — queued cite) |
| **Germany** | **Spekulationssteuer** | at income rate **if sold within 10 yrs**; **exempt after 10-yr hold** (or own-use) | own-use exemption | income tax return | (queued cite) |
| **Spain** | CGT (IRPF savings) + **plusvalía municipal** | 19–28% (savings scale) + municipal land-value tax | main-home reinvestment / over-65 relief | non-resident **3% retention** | (queued cite) |
| **Italy** | **plusvalenza** | 26% substitute tax **if sold <5 yrs** (exempt after 5yr or main home) | 5-yr / main-home exemption | — | (queued cite) |
| **USA** | federal + state capital gains | 0/15/20% federal long-term + state; **FIRPTA 15% withholding** on non-resident sellers | §121 primary-home exclusion ($250k/$500k) | IRS | (queued cite) |
| **Australia** | CGT | marginal rate; **50% discount** if held >12mo; main residence exempt; foreign residents no discount + withholding | main-residence exemption | ATO | (queued cite) |

> **Encoding:** `disposalTax(jurisdiction, gain, holdingYears, isMainResidence, isNonResident)`. Two big patterns: (1) **holding-period exemptions** (DE 10yr, IT 5yr, FR taper) — the model must take holding years; (2) **non-resident withholding** (US FIRPTA, ES 3%, AU foreign-resident) — affects net proceeds. UK 18/24% + 60-day reporting is the reviewed anchor; rest queued for full citation + counsel sign-off.
