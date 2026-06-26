# Agent Regulation (19) · Fitness/Repair (23) · Income Tax & Interest Relief (8/9) · Insurance (24) · Language (25) — Sourced

**Compiled:** 2026-06-25. **Status:** `sourced` (informational, from verified public sources — NOT legal advice; verify & customise; permanent disclaimer per LIABILITY plan). Operator override per master plan §10b.

## Dim 19 — Letting-agent / property-manager regulation
| Jurisdiction | Regime | Requirements | Source |
|---|---|---|---|
| **Wales** | **Rent Smart Wales** (mandatory since Nov 2015/16) | landlord + agent licensing; **PII + redress + CMP** | [Propertymark — UK regulation](https://www.propertymark.co.uk/professional-standards/uk-regulation.html) |
| **Scotland** | **Scottish Letting Agent Register** (since Oct 2018) | **criminal offence** to operate unregistered (£50k / 6mo); Code of Practice; client-money rules | [Propertymark — Scottish register](https://www.propertymark.co.uk/professional-standards/uk-regulation/scottish-letting-agent-register.html) |
| **England** | no agent licensing, but **redress scheme + CMP** mandatory (from 1 Apr 2019) + deposit protection | redress + CMP only | gov.uk |
| **NI** | **none** (no redress/CMP duty) | — | — |
| Others | varies (e.g. ES API; AU agent licence per state; US broker licence) | — | — |

> Right level for the data model: a **workspace/agent credential** record (Rent Smart Wales number, Scottish LAR number, redress scheme, CMP provider) surfaced in Settings + Contacts(agent), conditioned on jurisdiction.

## Dim 23 — Fitness / repair / habitation standards
| Jurisdiction | Standard | Key timelines | Source |
|---|---|---|---|
| **England** | **Homes (Fitness for Human Habitation) Act 2018** (s.9A LTA 1985) — fit at start + throughout | — | [GOV.UK — FFHH guide](https://www.gov.uk/government/publications/homes-fitness-for-human-habitation-act-2018/guide-for-tenants-homes-fitness-for-human-habitation-act-2018) |
| England | **Awaab's Law** — social housing from **27 Oct 2025**; **RRA 2025 extends to PRS** | emergency hazard **investigate 24h**; significant **10 working days**; safety work **5 working days** (emergency 24h) | [Browne Jacobson — Awaab's Law](https://www.brownejacobson.com/insights/awaab-s-law-to-take-effect-from-october-2025) |
| England | **Decent Homes Standard** (+ new Criterion E damp/mould) extending to PRS | — | gov.uk consultation |
| **Scotland** | **Repairing Standard** + Tolerable Standard | — | gov.scot |
| **Ireland** | minimum standards S.I. 137/2019 | — | RTB |
| Others | habitability warranty (US implied warranty of habitability; ES cédula; FR logement décent) | — | — |

> Encoding: a **repair-SLA** model per jurisdiction (Awaab's Law 24h/10d/5d timelines) drives Work ▸ Tasks/Jobs priority + Compliance. England PRS timelines are the strictest emerging standard.

## Dim 8/9 — Rental income tax & finance-cost (mortgage interest) relief
| Jurisdiction | Income tax on rent | Finance-cost / mortgage-interest relief | Source |
|---|---|---|---|
| **UK** | property income at marginal rate (no separate schedule) | **Section 24 restriction** — interest **NOT deductible**; **20% basic-rate tax credit only** (was full deduction); raises headline profit, can push into higher band | [legislation.gov.uk — Finance (No.2) Act 2015 s.24](https://www.legislation.gov.uk/ukpga/2015/33/section/24) · [Landlord Studio — S24](https://www.landlordstudio.com/uk-blog/section-24-tax-change-for-buy-to-let-investors) |
| **Ireland** | 20/40% + USC + PRSI | mortgage interest **100% deductible** (restored) | revenue.ie |
| **Germany** | progressive **14–45%** + 5.5% solidarity; **AfA depreciation 2%/yr** (50yr) | interest **fully deductible** (Werbungskosten) | [PTI Returns — DE rental income](https://www.ptireturns.com/blog/rental-income-tax-germany/) |
| **France** | **micro-foncier** (≤€15k, **30% flat abatement**, no deductions) vs **régime réel** | interest deductible **only under régime réel**; déficit foncier (excl. interest) offsets global income ≤€10,700 | [service-public F1991](https://www.service-public.gouv.fr/particuliers/vosdroits/F1991) · [bofip micro-foncier](https://bofip.impots.gouv.fr/bofip/3973-PGP.html) |
| **Spain** | residents **50% reduction** (was 60%, up to 90% in stressed zones) on long-let; non-res **19%** (EU) / 24% (non-EU, but Audiencia Nacional 28 Jul 2025 allows net+19%) | interest + IBI + community + **3% depreciation** deductible (residents/EU) | [Costaluz — Spain rental income tax](https://www.costaluzlawyers.com/resources/guide-to-taxes-on-rental-properties-in-spain/) · [Baker McKenzie — non-EU deduction ruling](https://insightplus.bakermckenzie.com/bm/tax/spain-nonresident-income-tax-the-national-court-recognizes-the-right-of-non-eueea-nonresidents-to-deduct-expenses-related-to-the-rental-of-properties) |
| **Italy** | **cedolare secca** flat **21%** (10% canone concordato) **OR** ordinary IRPEF | cedolare = **NO deductions**; ordinary IRPEF = interest deductible (first-home only, 19% ≤€4,000) | [italiantaxes — cedolare secca](https://www.italiantaxes.com/articles/cedolare-secca-the-flat-tax-regime-for-rental-income-in-italy) |

> **UK Section 24 is the single biggest Planning-forecast divergence** — most other countries allow full interest deductibility. The forecast engine MUST branch on `financeCostRelief(jurisdiction)`; a UK BTL forecast that deducts interest in full is materially wrong.

## Dim 24 — Insurance obligations (brief)
- **Buildings insurance:** landlord duty (leasehold: often via freeholder/service charge; freehold: landlord). Required by most BTL mortgages.
- **Landlord liability / public liability:** strongly advised; sometimes a licensing condition (Rent Smart Wales requires PII for agents).
- **HMO / short-let insurance:** specialist cover required; standard policies void for HMO/STL use.
- **Contractor public-liability:** minimum cover often a supplier-onboarding requirement (links dim 20).
> Encoding: an **insurance checklist** per property type/jurisdiction (buildings, liability, HMO, STL) in Compliance/Portfolio; not a hard statutory cap in most places but a release-readiness checklist item.

## Dim 25 — Notice / document language requirements
| Jurisdiction | Requirement | Source |
|---|---|---|
| **Wales** | Welsh + English — occupation-contract written statements & forms available bilingually; Welsh-language rights | [GOV.WALES — renting homes forms](https://www.gov.wales/renting-homes-forms-landlords) |
| **Belgium** | **regional language mandatory** (Dutch in Flanders, French in Wallonia, German in east) for official documents | [ACC — mandatory national languages EU](https://www.acc.com/resource-library/mandatory-use-national-languages-contractual-documents-european-perspective) |
| **Quebec (Canada)** | **French-first** (Bill 96) for contracts/notices | Bill 96 |
| **Switzerland** | cantonal official language (DE/FR/IT) — official termination form in canton language | OR/cantonal |
| **USA (some states)** | translated-lease duty where negotiated in another language (e.g. CA Civil Code §1632) | CA §1632 |
> Encoding: ties to the **translation pipeline (master plan §5)** — notices/templates must render in the **jurisdiction's official language(s)**, not just the operator's locale. Wales = bilingual; Belgium/Quebec/Switzerland = region language mandatory.

### Sources (consolidated)
propertymark.co.uk (UK agent regulation); gov.uk FFHH + Browne Jacobson (Awaab's Law); legislation.gov.uk Finance (No.2) Act 2015 s.24 + Landlord Studio; gov.wales renting-homes forms; ACC (EU language); CA Civil Code §1632.
