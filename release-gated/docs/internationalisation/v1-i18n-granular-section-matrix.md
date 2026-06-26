# Propvora V1 — Granular Internationalisation Gap Matrix (every leaf of the app map)

**Companion to:** `v1-enterprise-i18n-audit-and-plan.md` (read that first for the architecture, the 45-country tiers, and the per-property jurisdiction decision).
**Purpose:** assess **every** node in the founder's full app map — section → sub-tab → sub-sub-tab → detail-page sub-tab → wizard — on the four i18n axes, with the concrete alteration each needs.

**Axes:** **L** = Language/translation · **J** = Jurisdiction/Legal · **C** = Compliance/Frameworks · **M** = Money/Tax/Format.
**Rating:** ✅ already i18n-correct · 🟡 partial/needs binding · ❌ gap (hardcoded EN / workspace-only / GBP-locked).
**Ground truth:** ratings are **design-level** from the codebase audit (translation ≈0% wired; legal/compliance resolve from *workspace* not *property*; money formatters split 4 ways). Each leaf is **re-verified per-viewport, per-jurisdiction, per-locale in the Phase-7 MCP sweep** — this matrix is the sweep's checklist.

> **Repeating pattern (true for ~every leaf, stated once):** L ❌ because UI strings are hardcoded English. So the **L column below flags only where translation is *high-priority/legally-sensitive*** (external-facing portal/email/legal copy) vs ordinary chrome. Assume ordinary chrome = ❌-but-low-risk unless noted.

---

## SECTION: Home
| Leaf | L | J | C | M | Alteration needed |
|---|:-:|:-:|:-:|:-:|---|
| Home Dashboard (overview) | 🟡chrome | ❌ | 🟡 | ❌ | Property-snapshot cards must show **per-property jurisdiction chip**; KPI roll-ups in **reporting currency + show local**; translate dashboard chrome; mixed-portfolio aware. |

---

## SECTION: Portfolio
### Sub-tabs
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Portfolio Overview | 🟡 | ❌ | 🟡 | ❌ | Group/segment KPIs by property jurisdiction; multi-currency totals. |
| Properties (list) | 🟡 | ❌ | 🟡 | ❌ | Per-row country flag/jurisdiction + local currency; filter by country. |
| Units (list) | 🟡 | 🟡 | 🟡 | ❌ | Rent in property's local currency. |
| Tenancies (list) | 🟡 | ❌ | 🟡 | ❌ | **Deposit/notice rules per property jurisdiction**; rent local currency. |
### Property detail tabs (★ = jurisdiction spine lives here)
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Property ▸ Overview ★ | 🟡 | ❌ | ❌ | ❌ | Surface property `country_code`/`region_code` as the record's jurisdiction; drive all child tabs from it. |
| Property ▸ Unit | 🟡 | 🟡 | 🟡 | ❌ | Local currency rent. |
| Property ▸ Tenancies | 🟡 | ❌ | 🟡 | ❌ | Tenancy law/deposit per property jurisdiction. |
| Property ▸ **HMO Details** | 🟡 | ❌ | ❌ | 🟡 | Drive from **shared-occupancy framework** for the property's country (UK HMO vs ES *vivienda* rules vs none); not UK-only. |
| Property ▸ Finances | 🟡 | 🟡 | n/a | ❌ | Local currency + acquisition tax context. |
| Property ▸ Compliance | 🟡 | ❌ | ❌ | n/a | Show **that country's** certificate set, not workspace's. |
| Property ▸ Documents | 🟡 | 🟡 | 🟡 | n/a | Jurisdiction doc types (e.g. EU energy cert vs EPC). |
| Property ▸ Contacts | 🟡 | 🟡 | n/a | n/a | Address/phone/tax-ID forms per country. |
| Property ▸ Work | 🟡 | 🟡 | 🟡 | ❌ | PPM cadence per jurisdiction; cost currency. |
| Property ▸ Activity | 🟡 | n/a | n/a | n/a | Translate; localized timestamps. |
| Property ▸ Map | 🟡 | 🟡 | n/a | n/a | Localized labels; correct country centring/geocode. |
### Tenancy detail tabs
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Tenancy ▸ Overview | 🟡 | ❌ | 🟡 | ❌ | Tenancy type + statutory rights per jurisdiction. |
| Tenancy ▸ Payments | 🟡 | 🟡 | n/a | ❌ | Local currency, tax, date format. |
| Tenancy ▸ Documents | 🟡 | 🟡 | 🟡 | n/a | Jurisdiction tenancy-agreement templates. |
| Tenancy ▸ Timeline | 🟡 | 🟡 | n/a | n/a | Statutory key-dates per jurisdiction. |
| Tenancy ▸ Notes / Activity | 🟡 | n/a | n/a | n/a | Translate; localized dates. |
| Tenancy ▸ **Deposit** | 🟡 | ❌ | n/a | ❌ | **Biggest tenancy gap** — deposit scheme/cap/protection differ (UK TDP+prescribed info · ES *fianza* · DE *Kaution* 3-mo cap · IE RTB). Local currency. |
| Tenancy ▸ Communications | 🟡portal | 🟡 | n/a | n/a | Recipient-locale messaging. |
### Unit detail tabs
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Unit ▸ Overview / Tenancy / Documents / Timeline / Activity / Finance / **Specifications** | 🟡 | 🟡 | 🟡 | ❌ | Local currency on Finance; **Specifications area unit sqm/sqft per country** (`areaUnit()` exists — wire it); translate. |
### Wizards
| Wizard | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| **Add Property** | 🟡 | ❌ | ❌ | ❌ | Capture **country/region** up-front (address engine exists in `@/components/intl`); set the property's jurisdiction spine; currency from country; area unit from country. |
| **Add Unit** | 🟡 | 🟡 | 🟡 | ❌ | Inherit property jurisdiction; area unit + currency. |
| **Create Tenancy** | 🟡 | ❌ | 🟡 | ❌ | **Deposit fields + caps + scheme per property jurisdiction**; rent currency; notice defaults. |

---

## SECTION: Work
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Work Overview | 🟡 | 🟡 | 🟡 | ❌ | Cost roll-ups in reporting currency. |
| Tasks / Board / Gantt | 🟡 | n/a | n/a | n/a | Translate; localized dates on Gantt/board. |
| Jobs | 🟡 | 🟡 | 🟡 | ❌ | Job cost currency = property's; tax on quotes. |
| **PPM** (Overview/Schedules/Timeline/Suppliers/Reports) | 🟡 | 🟡 | ❌ | ❌ | **PPM cadences are jurisdiction-specific** (gas annual UK vs biennial AU; smoke/CO rules) — template per property jurisdiction. |
| Suppliers (Overview/Directory/Compliance/Performance) | 🟡 | 🟡 | 🟡 | ❌ | Supplier **tax-ID label per country** (VAT/ABN/EIN); local currency rates; cert types per jurisdiction. |
| Complaints | 🟡 | 🟡 | n/a | n/a | Jurisdiction complaint/redress scheme references. |
| Reports | 🟡 | 🟡 | 🟡 | ❌ | Multi-currency + multi-jurisdiction grouping. |
### Supplier detail tabs
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Supplier ▸ Overview/Jobs/Quotes/**Invoice**/Compliance/Documents/Performance/Activity | 🟡 | 🟡 | 🟡 | ❌ | **Invoice tax scheme per country** (VAT/GST/sales tax/reverse charge); currency; cert types; translate. |
### Task / Job / PPM detail tabs
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Task ▸ Overview/Checklist/Activity/Files/Linked Work/Notes/History | 🟡 | n/a | n/a | n/a | Translate; localized dates. |
| Job ▸ Overview/Schedule/Quotes/**Costs**/Documents/Activity/Supplier/Communication/Notes/Linked Tasks | 🟡 | 🟡 | 🟡 | ❌ | Costs/quotes in property currency + tax. |
| PPM Plan Schedule ▸ Overview/Schedule/Generated Jobs/Supplier/Activity | 🟡 | 🟡 | ❌ | ❌ | Cadence per jurisdiction. |
### Wizards
| Wizard | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Create Task | 🟡 | n/a | n/a | n/a | Translate; localized dates. |
| Create Job | 🟡 | 🟡 | 🟡 | ❌ | Cost currency = property; supplier tax. |
| New PPM Schedule | 🟡 | 🟡 | ❌ | ❌ | Jurisdiction cadence templates. |
| New Plan | 🟡 | 🟡 | ❌ | ❌ | Same. |

---

## SECTION: Planning (12 profiles × identical 8-tab structure)
**Tab pattern (every profile):** Overview · Income Model · Cost Drivers · Compliance · Example Forecast · Starter Checklist · Risks · AI Questions.
| Tab (all profiles) | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Overview | 🟡 | 🟡 | 🟡 | ❌ | Currency; jurisdiction context line. |
| **Income Model** | 🟡 | 🟡 | n/a | ❌ | Currency; **VAT on serviced/holiday** per country; rent regulation caps. |
| **Cost Drivers** | 🟡 | ❌ | n/a | ❌ | **Acquisition tax engine per country** (UK SDLT · ES ITP/AJD · DE Grunderwerbsteuer · IE Stamp Duty); currency. |
| **Compliance** | 🟡 | ❌ | ❌ | n/a | Profile compliance per property jurisdiction. |
| Example Forecast | 🟡 | ❌ | n/a | ❌ | **Tax model per country** (interest relief: UK S24 vs full deductibility elsewhere); currency. |
| Starter Checklist | 🟡 | 🟡 | 🟡 | n/a | Jurisdiction setup steps (licences/registrations). |
| Risks | 🟡 | 🟡 | n/a | n/a | Jurisdiction risk wording. |
| AI Questions | 🟡 | 🟡 | 🟡 | 🟡 | Ground AI on property jurisdiction (clause helper `aiJurisdictionClause` exists). |

**Per-profile jurisdiction-sensitivity (which profiles diverge most by country):**
- **Serviced Accommodation / Holiday Lets** — short-let **licensing/registration + VAT** vary sharply (UK FHL abolition, ES tourist licence, EU registration). Highest divergence.
- **HMO / Co-living** — shared-occupancy licensing per jurisdiction (UK HMO vs none/other).
- **Commercial / Mixed Use** — different lease law + VAT option-to-tax + business rates equivalents.
- **Social Housing** — jurisdiction-specific regimes; may not exist outside UK → research-only.
- **Rent-to-Rent** — legality/structure varies; flag research-only outside reviewed jurisdictions.
- **Student-Let / Long-Term Let / Build-to-Rent / Refinancing / Dev-Flip** — currency + acquisition tax + interest-relief parameterisation.

### Planning Sets detail tabs
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Overview/Assumptions/Income/Rooms&Units/**Expenses**/**Bills**/**Upfront Costs**/Compliance/Landlord Offer/Forecasts/Scenarios/Risk/Conversion/Documents/Tasks/AI Review/Activity | 🟡 | ❌ | ❌ | ❌ | Currency throughout; **Upfront Costs = acquisition tax per country**; Bills/Expenses tax scheme; Compliance per jurisdiction; AI Review grounded on jurisdiction. |
### Landlord Offer detail tabs
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Overview/Offer Terms/Financials/Conversion/Activity | 🟡 | 🟡 | n/a | ❌ | Offer currency + tax; jurisdiction terms. |
### Wizards
| Wizard | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| New Planning Set | 🟡 | ❌ | ❌ | ❌ | Pick property/country → currency + tax + compliance + acquisition-tax engine. |
| New Offer | 🟡 | 🟡 | n/a | ❌ | Currency + tax. |

---

## SECTION: Contacts
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Overview / People / Organisations / Board / Timeline / Portal Access / Documents / Activity | 🟡 | 🟡 | n/a | 🟡 | Address/phone/**tax-ID per country** (engine exists); translate; portal-access locale. |
### Contact / Organisation detail tabs
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Contact ▸ Overview/Profile/Tenancy/**Payments**/Documents/Messages/Tasks/Activity/Audit | 🟡 | 🟡 | n/a | ❌ | Payments currency; messages recipient-locale. |
| Organisation ▸ Overview/Supplier Profile/Work History/**Invoices**/Documents/Portal Access/Messages/Notes/Activity/Audit | 🟡 | 🟡 | 🟡 | ❌ | Invoice tax/currency; tax-ID; portal locale. |
### Wizards
| Wizard | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Add Contact / Add Person / Add Organisation | 🟡 | 🟡 | n/a | 🟡 | Country-aware address/phone/tax-ID fields. |

---

## SECTION: Portals (highest-value translation target — external readers)
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Portals Overview / Access Grants / Profiles / Purposes | 🟡 | 🟡 | n/a | 🟡 | Operator chrome. |
| Landlord / Supplier / **Tenant** / Applicant / Accountant / Solicitor / Generic portals | ❌**HIGH** | ❌ | 🟡 | ❌ | **Portal copy = recipient's locale** (Spanish tenant ⇒ Spanish UI). **Tenant-rights notices per jurisdiction.** Money in local currency. This is the top external-facing L priority. |
### Wizard
| Grant Portal Access | 🟡 | 🟡 | n/a | n/a | Set portal locale = recipient locale; jurisdiction-correct rights copy. |

---

## SECTION: Money (largest M surface)
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Overview | 🟡 | 🟡 | n/a | ❌ | Reporting currency + per-property local; FX. |
| Income / Expenses | 🟡 | 🟡 | n/a | ❌ | Currency + **tax scheme per country**. |
| **Invoices** | 🟡 | ❌ | n/a | ❌ | **Legal invoice fields + VAT/GST/sales-tax/reverse-charge per country** (rates in `country_tax_rates`); currency; number format. |
| Bills | 🟡 | 🟡 | n/a | ❌ | Tax + currency. |
| **Arrears** / **Rent Chase** | 🟡 | ❌ | n/a | ❌ | **Pre-action protocols differ per jurisdiction** (Scotland pre-action requirements; UK protocol); currency. |
| **Deposits** | 🟡 | ❌ | n/a | ❌ | **Scheme/cap/protection per jurisdiction** (mirrors Tenancy ▸ Deposit). |
| Escrow / Holds | 🟡 | 🟡 | n/a | ❌ | Currency; jurisdiction legality of holds. |
| Commissions / Payouts / Refunds | 🟡 | 🟡 | n/a | ❌ | Currency + tax. |
| Disputes | 🟡 | 🟡 | n/a | ❌ | Jurisdiction redress body references; currency. |
### Detail pages
| Invoice / Bill / Chase Arrear / Record Payment / Deposit / Disputes | 🟡 | ❌ | n/a | ❌ | Tax/currency/format + jurisdiction deposit/arrears logic. |
### Wizards
| Wizard | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Add Income / Add Expense | 🟡 | 🟡 | n/a | ❌ | Currency + tax scheme. |
| **New Invoice** | 🟡 | ❌ | n/a | ❌ | **Tax engine per country** + legal fields + currency. |
| Add Bill | 🟡 | 🟡 | n/a | ❌ | Tax + currency. |
| **Track Deposit** | 🟡 | ❌ | n/a | ❌ | Scheme/cap per jurisdiction. |
| New Rent Chase Case | 🟡 | ❌ | n/a | ❌ | Pre-action protocol per jurisdiction. |

---

## SECTION: Calendar
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Overview / Calendar / Schedule / Timeline / Events / Reminders | 🟡 | 🟡 | 🟡 | n/a | `Intl.DateTimeFormat` localized (month/day/first-day-of-week); **statutory key-date calculators per jurisdiction** (notice expiry, cert renewal windows). |
### Wizards
| New Event / New Reminder | 🟡 | 🟡 | n/a | n/a | Localized date/time; jurisdiction statutory presets. |

---

## SECTION: Compliance (must follow PROPERTY jurisdiction)
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Overview / Certificates / Inspections / Documents / Evidence / **Coverage** / Supplier Docs / Reports | 🟡 | ❌ | ❌ | n/a | Requirement set per **property** jurisdiction (reviewed: GB/IE/AU/NZ/US/CA); **Coverage + Reports group by property jurisdiction** in a mixed portfolio. |
### Wizards (already jurisdiction-driven via `useComplianceRequirements` — re-point to property)
| Add Certificate / Schedule Inspection / Upload Document / Upload Evidence | 🟡 | 🟡 | ❌→🟡 | n/a | Re-key requirement source from workspace → property; translate. |

---

## SECTION: Legal (deepest J gap — Tier-A frameworks to build)
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Legal Overview | 🟡 | ❌ | n/a | n/a | Show **property** jurisdiction context; mixed-portfolio aware. |
| **Possession** | 🟡 | ❌ | n/a | n/a | **Framework pack per jurisdiction** (E&W done; build SCT/NI/IE; structured-generic Tier B). |
| **HMO Licences** | 🟡 | ❌ | n/a | n/a | **Shared-occupancy framework per jurisdiction** (E&W classes; SCT/NI licensing; IE registration). |
| EPC Advisory | 🟡 | 🟡 | n/a | n/a | Already EU-EPC aware; extend labels per country. |
| RRA 2026 | 🟡 | ✅ | n/a | n/a | Correctly hidden outside E&W. |
### Wizards
| **New Possession Case** | 🟡 | ❌ | n/a | ❌ | Render property-jurisdiction routes/grounds/notice/authority; arrears currency (now captured). |
| **Register HMO Licence** | 🟡 | ❌ | n/a | n/a | Render property-jurisdiction licence/registration classes + authority. |

---

## SECTION: Messages (external-facing — translate per recipient)
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Messages & Inbox | 🟡 | n/a | n/a | n/a | Operator chrome. |
| **Email Templates** | ❌**HIGH** | ❌ | n/a | n/a | **Templates per recipient locale + jurisdiction-correct legal notice wording.** |
| Chat bubble inbox | 🟡 | n/a | n/a | n/a | Translate. |
| **Tenant / Landlord / Supplier portal messages** | ❌**HIGH** | 🟡 | n/a | ❌ | Recipient-locale; money local currency. |
| Notifications | ❌ | 🟡 | n/a | n/a | Recipient-locale; jurisdiction triggers. |

---

## SECTION: Automations
| Leaf | L | J | C | M | Alteration |
|---|:-:|:-:|:-:|:-:|---|
| Overview / Recipes / My Automations / Run&Logs / Approvals / Error / Usage&Limits / Admin Controls | 🟡 | 🟡 | 🟡 | 🟡 | Translate builder chrome. |
| **Canvas Builder / Node Library / Inspector / Testing Panel** | 🟡 | 🟡 | 🟡 | 🟡 | Translate node labels; **jurisdiction-aware compliance/legal trigger nodes** (cadence by property jurisdiction). Audit Node Library for missing nodes (founder's open question — separate task). |
| Integrations / Webhooks / Connection Health / Secrets / Usage Analytics / Audit Logs | 🟡 | n/a | n/a | n/a | Translate; localized timestamps. |
| AI Builder | 🟡 | 🟡 | 🟡 | 🟡 | Ground generated automations on property jurisdiction. |
### Wizards
| Create Recipe / New Automation / Add Integration / New Endpoint / AI Builder | 🟡 | 🟡 | 🟡 | 🟡 | Translate; jurisdiction-aware templates. |

---

## Cross-cutting verdict
- **The same three roots recur on every leaf:** (1) hardcoded EN strings (L), (2) workspace-not-property jurisdiction binding (J/C), (3) split/GBP-locked money formatting (M). Fixing the **three roots centrally** (Phase 0–3 in the plan doc) clears the ❌s across **most** leaves at once — this is not 700 individual fixes, it's ~4 architectural fixes + content packs + a translation pass.
- **Highest-priority leaves** (build first, by risk × external exposure): Tenancy/Money **Deposit**, **Invoices** (tax), **Legal Possession/HMO** frameworks, **Portal + Email** translation, Planning **Cost Drivers/Forecast** tax engines.
- **Acceptance test:** a **UK workspace with one ES and one AE property** renders, on every relevant leaf, the *property's* jurisdiction + currency + (where shipped) language — proven across all 8 viewports with zero console errors. That single scenario validates the whole programme.
