# Shared-Occupancy Licensing (dim 3) + Mandatory Registration (dim 5) — Sourced

**Compiled:** 2026-06-25. **Status:** `sourced` (informational, from verified public sources — NOT legal advice; verify & customise; permanent disclaimer per LIABILITY plan). Tier-A complete; Tier-B representative + queued.
**Drives:** Legal ▸ HMO Licences wizard (classes per jurisdiction), Portfolio ▸ HMO tab, Compliance registration tracking. **Operator override / workspace customisation** per master plan §10b.

## Tier A — full

| Jurisdiction | Shared-occupancy licence | Threshold | Authority | Landlord/tenancy registration | Source |
|---|---|---|---|---|---|
| **England & Wales** | HMO: **Mandatory / Additional / Selective** | Mandatory = **5+ persons, 2+ households** (any storeys, since 1 Oct 2018); Additional = other HMOs (council-designated); Selective = **all PRS** in designated area | Local housing authority (Housing Act 2004 Pt 2) | No national landlord register; **selective licensing** per area; Rent Smart **Wales** = landlord registration+licensing | [GOV.UK HMO/selective licensing reform](https://www.gov.uk/government/publications/houses-in-multiple-occupation-and-residential-property-licensing-reform-guidance-for-local-housing-authorities) · [Housing Act 2004 Pt2](https://www.legislation.gov.uk/ukpga/2004/34/part/2) |
| **Scotland** | **HMO licence** (single class) | **3+ unrelated persons** sharing kitchen/bathroom | Local authority — Part 5 **Housing (Scotland) Act 2006**; unlicensed = offence, £50k fine | **Scottish Landlord Registration** mandatory (Antisocial Behaviour (Scotland) Act 2004) | [Housing (Scotland) Act 2006 Pt5](https://www.legislation.gov.uk/asp/2006/1/part/5) · [gov.uk HMO Scotland](https://www.gov.uk/find-licences/house-in-multiple-occupation-licence-scotland) |
| **Northern Ireland** | **HMO licence** | HMO per HMO Act (NI) 2016 (3+ persons, 2+ households, not exempt) | District councils (Belfast CC administers) — **HMO Act (NI) 2016**, from 1 Apr 2019; unlicensed = offence | **NI Landlord Registration Scheme** mandatory (HMO reg fee-exempt) | [Communities-NI — HMO scheme](https://www.communities-ni.gov.uk/news/introduction-new-licensing-scheme-houses-multiple-occupation) · [HMO Act (NI) 2016](https://www.legislation.gov.uk/nia/2016/22/contents) |
| **Ireland** | **No HMO licence concept** | n/a (multi-unit standards apply) | n/a | **RTB tenancy registration — ANNUAL** (by 3 Aug each year; combined fee for ≤10 units €170); minimum standards S.I. 137/2019 | [RTB — register a tenancy](https://rtb.ie/register-tenancies/register-a-tenancy/) · [citizensinformation — registering a tenancy](https://www.citizensinformation.ie/en/housing/renting-a-home/landlords-rights-and-responsibilities/registering-a-tenancy/) |

> **Encoding note:** the HMO wizard's `licence_type` enum is E&W-specific (mandatory/additional/selective). Per-jurisdiction it must become: Scotland = single "HMO licence"; NI = "HMO licence"; Ireland = **no HMO** → surface "RTB registration" instead; rest = local equivalent or "no licence — record locally".

## Tier B — representative (queued for full pass)
- **Germany:** no national HMO licence; **Zweckentfremdungsverbot** (misuse-of-housing bans) + **Wohnungsaufsicht** vary by Land/city (e.g. Berlin, Munich); short-let permits separate. Many cities require registration of the tenant (Anmeldung) — that's the tenant's duty, not the landlord's licence.
- **Netherlands:** municipal **rental permit (verhuurvergunning)** under Good Landlordship Act in designated areas; room-rental (kamerverhuur) permits in some cities.
- **Spain:** regional **tourist-let registration** (VUT) for short lets; long-let no licence but regional registries emerging in zonas tensionadas.
- **France:** **autorisation de changement d'usage** + registration number for short-lets (esp. Paris); long-let no licence.
- **Australia:** no HMO licence; rooming-house registration in some states (e.g. VIC rooming house operator licence).
- **USA:** city/county **rental registration + inspection** programs (highly local); occupancy limits per local code.
- **Scotland (short-let):** **Short-Term Let licensing** (mandatory since Oct 2023) — separate from HMO (covers holiday lets) → ties to dim 10.

**Pattern for restricted/other:** default to "record any local licence/registration as a compliance document" with the generic shared-occupancy pack (matches current `genericModules` posture), never asserting a non-existent "HMO licence".

### Sources (consolidated)
GOV.UK HMO/selective licensing reform guidance; Housing Act 2004 Pt2; Housing (Scotland) Act 2006 Pt5; HMO Act (NI) 2016 + Communities-NI; RTB register-a-tenancy + citizensinformation.ie.
