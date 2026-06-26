# Tier-A Possession / Eviction Notice Periods — Sourced from Official Sources

**Compiled:** 2026-06-25 by Claude Code from primary government sources.
**Status:** `sourced` (informational, from verified public sources — NOT legal advice; verify & customise; permanent disclaimer per LIABILITY plan). The **"not legal advice — verify & customise" disclaimer is PERMANENT** (it is never removed). Propvora is a property-management tool, not a legal advisor (see `LIABILITY-disclaimer-and-customizability-plan.md`).
**Use:** this is the content source-of-truth that backs `LegalFramework` packs for England&Wales, Scotland, Northern Ireland, Ireland. Every figure below carries its source.

> ⚠️ **P1 FINDING — the existing possession wizard is now partly out of date for England.** As of **1 May 2026** the **Renters' Rights Act 2026** has commenced: **Section 21 ("no-fault") is abolished** for new and existing tenancies, all ASTs become periodic, and possession is via **Section 8 grounds only** with revised notice periods. The current wizard still offers Section 21 as a route. This must be reconciled (the codebase already has an `RRA 2026` tab; the possession framework pack must reflect the post-1-May-2026 regime for England). Northern Ireland, Scotland and Wales have their own separate regimes.

---

## 1. England — Renters' Rights Act 2026 regime (from 1 May 2026)
**Authority:** County Court. **Route:** Section 8 grounds (Housing Act 1988 as amended by RRA 2026). **Section 21: ABOLISHED.**

| Ground | Basis | Type | Notice period | Notes |
|---|---|---|---|---|
| **1 / 1A** | Landlord/family move-in or sale | Mandatory | **4 months** | Cannot be used in the **first 12 months** of a new tenancy (protected period). |
| **2** | Mortgage repossession | Mandatory | 4 months (default no-fault period) | Verify on sign-off. |
| **4A** | Student HMO (full-time students) | Mandatory | **4 months**, expiring **1 Jun–30 Sep** | Seasonal possession for student lets. |
| **6 / 6A** | Redevelopment / compliance | Mandatory | 4 months (default) | Verify on sign-off. |
| **8** | Serious rent arrears | Mandatory | **4 weeks** | Threshold raised: **3 months'** arrears (was 2) at service **and** hearing. |
| **10 / 11** | Some / persistent rent arrears | Discretionary | 4 weeks | Verify exact period on sign-off. |
| **12** | Breach of tenancy | Discretionary | 4 weeks (approx.) | Verify. |
| **13** | Deterioration of property | Discretionary | 4 weeks (approx.) | Verify. |
| **14** | Antisocial behaviour / nuisance | Discretionary | Can be **immediate** (no notice) | Most serious cases. |
| **7 / 7A / 9 / 16** | Death/transfer, etc. | Mixed | Verify per ground | Confirm on sign-off. |

**Default rule of thumb (gov.uk):** "usually **4 months** if the tenant has not done anything wrong; may be **2 months** in some specialist cases; shorter if the tenant is at fault (e.g. rent arrears)."
**Transition:** a Section 21 notice served **before 1 May 2026** must reach court proceedings **no later than 31 July 2026**.

**Sources:**
- [GOV.UK — Renters' Rights Act: an overview for landlords](https://www.gov.uk/guidance/renters-rights-act-an-overview-for-landlords)
- [GOV.UK — The Renters' Rights Act Information Sheet 2026](https://www.gov.uk/government/publications/the-renters-rights-act-information-sheet-2026)
- [GOV.UK — Giving notice of possession to tenants before 1 May 2026](https://www.gov.uk/guidance/giving-notice-of-possession-to-tenants-before-1-may-2026)
- [GOV.UK — Evicting tenants (Section 8)](https://www.gov.uk/evicting-tenants/section-21-and-section-8-notices)

---

## 2. Scotland — Private Residential Tenancy "Notice to Leave"
**Authority:** First-tier Tribunal for Scotland (Housing and Property Chamber). **Route:** Notice to Leave under the Private Housing (Tenancies)(Scotland) Act 2016. **All 18 grounds are now discretionary** (Cost of Living/Coronavirus legacy → tribunal discretion).

**Notice period rule:**
- **28 days** if the tenant has lived in the property **6 months or less** (any ground), **OR** the landlord relies **only** on one or more of these grounds (regardless of length):
  - tenant no longer occupying the let property as their only/principal home
  - tenant has breached a term of the tenancy (cannot be used for rent arrears)
  - tenant has been in **rent arrears for 3 or more consecutive months**
  - tenant has a relevant criminal conviction
  - tenant has engaged in relevant antisocial behaviour
  - tenant associates in the let property with a person who has a relevant conviction / engaged in antisocial behaviour
- **84 days** if the tenant has lived in the property **more than 6 months** and the landlord is **not** relying solely on the grounds above.

**Pre-action requirement:** for rent-arrears grounds, landlords must comply with **pre-action protocol** requirements before the tribunal.

**Sources:**
- [gov.scot — Private residential tenancy: landlords' guide — Ending the tenancy: notice to leave](https://www.gov.scot/publications/private-residential-tenancies-landlords-guide/pages/ending-the-tenancy-notice-to-leave/)
- [mygov.scot — Giving a tenant notice to end a private residential tenancy](https://www.mygov.scot/landlord-end-tenancy/private-residential-tenancy)

---

## 3. Northern Ireland — "Notice to Quit"
**Authority:** County Court / enforcement. **Route:** Notice to Quit under the Private Tenancies (Northern Ireland) Order 2006 as amended by the **Private Tenancies Act (Northern Ireland) 2022** (s.11). Notice periods below apply **from 5 May 2022**.

| Tenancy length | Landlord notice to quit |
|---|---|
| **Not more than 12 months** | **4 weeks** |
| **More than 12 months, up to 10 years** | **8 weeks** |
| **More than 10 years** | **12 weeks** |

- **Tenant → landlord:** 4 weeks if in occupation ≤10 years; 12 weeks otherwise.
- **Proposed (NOT yet in force):** draft regulations would tier the periods further (e.g. 4wk 12mo–2yr, 8wk 2–5yr, 12wk 5–10yr); a consultation ran 5 Jan–29 Mar 2026. **Do not encode the proposed tiers as live** until regulations are made.

**Sources:**
- [Department for Communities — Section 11 of Private Tenancies (NI) Act 2022](https://www.communities-ni.gov.uk/articles/section-11-private-tenancies-northern-ireland-act-2022)
- [Housing Rights NI — New law changes notice to quit periods](https://www.housingrights.org.uk/professionals/news/new-law-changes-notice-quit-periods-private-tenants-northern-ireland)
- [Private Tenancies Act (Northern Ireland) 2022 — legislation.gov.uk](https://www.legislation.gov.uk/nia/2022/20)

---

## 4. Ireland — RTB "Notice of Termination"
**Authority:** Residential Tenancies Board (RTB). **Route:** Notice of Termination under the Residential Tenancies Act 2004 (as amended). **Must be served on the tenant AND the RTB simultaneously.** Periods below apply since 6 July 2022.

| Tenancy duration | Landlord notice period |
|---|---|
| Less than 6 months | **90 days** |
| 6 months to less than 1 year | **152 days** |
| 1 year to less than 7 years | **180 days** |
| 7 years to less than 8 years | **196 days** |
| 8 years or more | **224 days** |

**Shortened periods:**
- **Rent arrears:** serve a **28-day warning notice** to pay; if unpaid, serve Notice of Termination with **28 days'** notice.
- **Serious antisocial behaviour:** **7 days'** notice.
- **Breach of other tenant obligations:** warning notice + reasonable time to remedy, then **28 days'** notice.

> **Note:** the RTB has published a separate regime **"How a landlord can end a tenancy from 1 March 2026"** — verify whether the 2024 Residential Tenancies (Amendment) Act has altered any of the above before sign-off.

**Sources:**
- [RTB — How a landlord can end a tenancy](https://rtb.ie/renting/how-a-landlord-can-end-a-tenancy/)
- [RTB — How a landlord can end a tenancy from 1 March 2026](https://rtb.ie/renting/how-a-landlord-can-end-a-tenancy-from-1-march-2026/)
- [RTB — Notice of Termination guide](https://rtb.ie/renting/ending-a-tenancy/notice-of-termination-guides/)

---

## Shared-occupancy / HMO licensing (Tier-A) — to research next
- **England & Wales:** HMO mandatory (5+ persons, 2+ households) / additional / selective licensing — Housing Act 2004. *(Encoded in current wizard.)*
- **Scotland:** Mandatory HMO licence for **3+ unrelated persons** — Housing (Scotland) Act 2006. Local-authority licensing.
- **Northern Ireland:** HMO licence — **Houses in Multiple Occupation Act (NI) 2016** (licensing via councils; 3+ persons / 2+ households).
- **Ireland:** No "HMO licence" concept; **RTB tenancy registration** is the equivalent registration duty; plus local-authority standards/rental-accommodation rules.

(HMO/registration classes to be captured in a sibling sourced doc before encoding the `sharedOccupancy` pack.)

---

## Review/provenance ledger (per `jurisdiction_review_signoff`)
| Jurisdiction | Module | Status | Sign-off |
|---|---|---|---|
| England (RRA 2026) | possession | researched | ☐ pending counsel |
| Scotland | possession | researched | ☐ pending counsel |
| Northern Ireland | possession | researched | ☐ pending counsel |
| Ireland | possession | researched | ☐ pending counsel |

**Until each row is signed off, the wizard shows "Reference guidance only — verify with a qualified [jurisdiction] solicitor" and the figure is presented as indicative.** This is the defensible enterprise posture: real cited content now, authoritative badge on human review.

---

### Sources (consolidated)
- GOV.UK Renters' Rights Act overviews & information sheet 2026; Evicting tenants guidance.
- gov.scot / mygov.scot Private Residential Tenancy landlord guidance.
- Department for Communities NI; Housing Rights NI; legislation.gov.uk (Private Tenancies Act NI 2022).
- Residential Tenancies Board (RTB) Ireland notice-of-termination guidance.
