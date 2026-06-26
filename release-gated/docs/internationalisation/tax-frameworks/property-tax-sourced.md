# Property Tax — Acquisition (dim 7) + Recurring (dim 21) — Sourced

**Compiled:** 2026-06-25. **Status:** `sourced` (informational, from verified public sources — NOT legal advice; verify & customise; permanent disclaimer per LIABILITY plan). **Rates change at fiscal events — store as configurable, dated values, never hardcode.**
**Drives:** Planning ▸ Cost Drivers / Upfront Costs / Forecast; Money. Income tax + VAT (dims 8-9) partially in `country_tax_rates` already.

## Dim 7 — Acquisition / transfer tax (one-off on purchase)

| Jurisdiction | Tax | Standard | Buy-to-let / additional-property surcharge | Source |
|---|---|---|---|---|
| **England & NI** | **SDLT** | banded | **+5%** additional-dwelling surcharge (raised 3%→5% on 31 Oct 2024); **+2%** non-resident | [GOV.UK SDLT residential rates](https://www.gov.uk/stamp-duty-land-tax/residential-property-rates) · [higher rates](https://www.gov.uk/guidance/stamp-duty-land-tax-buying-an-additional-residential-property) |
| **Scotland** | **LBTT** | banded | **ADS +8%** (raised 6%→8% on 5 Dec 2024) | [Revenue Scotland — ADS](https://revenue.scot/taxes/land-buildings-transaction-tax/additional-dwelling-supplement-ads) |
| **Wales** | **LTT** | banded | higher residential rates (from 11 Dec 2024) | [GOV.WALES — LTT rates](https://www.gov.wales/land-transaction-tax-rates-and-bands) |
| **Ireland** | Stamp duty | ~**1%** to €1m, **2%** above (residential); higher for bulk | local property purchase | [Revenue.ie — stamp duty rates](https://www.revenue.ie/en/property/stamp-duty/property/stamp-duty-property/rates.aspx) |
| **Spain** | **ITP** (resale) / **IVA+AJD** (new) | **ITP 6–13% by region** (Madrid 6%, Andalusia 7%, Catalonia 10–11%, Valencia 10%, Balearics 11–13%); new-build IVA 10% + **AJD 0.5–1.5%** | regional | [tytle.io — Spain property taxes](https://www.tytle.io/post/property-taxes-in-spain-essential-guide-for-buyers-and-owners) |
| **Germany** | **Grunderwerbsteuer** | **3.5–6.5% by Bundesland** (Bavaria/Saxony 3.5%; NRW/Brandenburg/Saarland/SH 6.5%; Bremen 5.5% from 1 Jul 2025) | n/a (flat by land) | [gtai.de — taxation of real estate](https://www.gtai.de/en/invest/investment-guide/taxation-of-real-estate-561540) |
| **France** | droits de mutation (frais de notaire) | ~**5.8%** total | — | (service-public / notaires — queued) |

## Dim 21 — Recurring property tax (annual)

| Jurisdiction | Tax | Rate basis | Who pays | Source |
|---|---|---|---|---|
| **UK** | **Council Tax** | banded by valuation | occupier (tenant) usually; landlord between lets | gov.uk council tax |
| **Ireland** | **LPT** | **0.1029%** to €1.05m mid-point + **0.25%** above; local ±25% (from 2026); 2026–2030 bands | **landlord** (leases <20yr) | [citizensinformation — LPT](https://www.citizensinformation.ie/en/money-and-tax/tax/housing-taxes-and-reliefs/local-property-tax/) · [Irish Tax Hub — LPT bands 2026](https://www.irishtaxhub.ie/blog/the-ultimate-guide-to-irelands-lpt) |
| **Spain** | **IBI** | **0.4–1.1%** of cadastral value (municipal) | owner | [spaineasy — IBI](https://spaineasy.com/blog/ibi-property-tax-spain/) |
| **Germany** | **Grundsteuer** | reformed 1 Jan 2025: Grundsteuerwert × Steuermesszahl × municipal Hebesatz (Bavaria area-only model) | owner (passable to tenant via Nebenkosten) | [germantaxes.de — property tax](https://germantaxes.de/property-tax-faq/) |
| **France** | **taxe foncière** (owner) + (taxe d'habitation abolished for main homes) | local rates × cadastral value | owner | (service-public — queued) |
| **Italy** | **IMU** | municipal rate × cadastral | owner (not main home) | (queued) |

## Dims 8-9 pointers (next pass)
- **Income tax on rent:** UK (property income, **S24 finance-cost restriction** → 20% credit only — critical for Planning), IE (20/40% + USC + PRSI), ES (IRPF + 50–60% reduction on long-let), DE (progressive + depreciation AfA 2–3%), FR (régime réel vs micro-foncier).
- **VAT/GST on rent & services:** residential rent usually VAT-exempt; **short-let/serviced often VAT-able** (UK 20% over threshold, ES 10% with services, etc.) — `country_tax_rates` holds standard rates; treatment (exempt/standard/reduced/reverse-charge) to encode.
- **Mortgage-interest relief (dim 9):** UK **S24 restriction** (no full deduction, 20% credit) vs full deductibility in DE/FR/ES/IE — **materially changes Planning forecasts**; must be a per-jurisdiction function.

> **Encoding:** `acquisitionTax(jurisdiction, region, price, isAdditional, isNonResident)` and `recurringPropertyTax(jurisdiction, value)` + `financeCostRelief(jurisdiction)` — all dated/configurable. Region key required (UK nations, ES regions, DE Bundesländer).

### Sources (consolidated)
gov.uk SDLT · revenue.scot LBTT/ADS · gov.wales LTT · revenue.ie stamp duty · citizensinformation.ie LPT · tytle.io/spaineasy (ES ITP/IBI) · gtai.de/germantaxes.de (DE Grunderwerbsteuer/Grundsteuer).
