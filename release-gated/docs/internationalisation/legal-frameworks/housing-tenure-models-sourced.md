# Housing / Tenure & Ownership Models (dim 17) — Sourced

**Compiled:** 2026-06-25. **Status:** `sourced` (informational, from verified public sources — NOT legal advice; verify & customise; permanent disclaimer per LIABILITY plan). **STRUCTURAL — changes the property/unit data model, not just labels.**
**Drives:** Portfolio property/unit schema, HMO/building tabs, Money (service/condo charges), Planning (cost drivers). Operator override per master plan §10b.

| Jurisdiction | Tenure types | Building-governance body | Periodic charge | Governing doc | Source |
|---|---|---|---|---|---|
| **UK (E&W)** | **Freehold · Leasehold · Commonhold · Share of Freehold** | Freeholder / RMC / commonhold association | **Ground rent** (leasehold) + **service charge** | Lease / Commonhold Community Statement | [Leasehold & Freehold Reform Act 2024](https://www.legislation.gov.uk/id/ukpga/2024/22) · [Commons Library briefing](https://commonslibrary.parliament.uk/research-briefings/cbp-10653/) |
| | **Reform in train:** draft **Commonhold and Leasehold Reform Bill** (27 Jan 2026) — bans new leasehold flats, **ground rent capped £250 → peppercorn after 40yr**, abolishes forfeiture, revives commonhold (50% conversion), Commonhold Community Statement | | | | |
| **Germany** | **Wohnungseigentum (WEG)**: Sondereigentum (exclusive unit) + Gemeinschaftseigentum (common) | **WEG owners' association** | **Hausgeld** (§16 WEG) | **Teilungserklärung** (declaration of division) | [WEG / Sondereigentum](https://www.verband-wohneigentum.de/bv/on241861) |
| **France** | **Copropriété**: lots (private + common parts) | **Syndic** (manager) + **assemblée générale** | **charges de copropriété** by **tantièmes/millièmes** | **règlement de copropriété** (Law 10 Jul 1965) | [Notaires/Hellio — tantièmes](https://copropriete.hellio.com/blog/vie-copro/tantiemes) |
| **USA** | **Condominium** (own unit + common) · **Co-op** (own shares in corp) · **HOA** (single-family) | Condo/HOA association; co-op corporation board | **monthly assessments / dues** | **Declaration + Bylaws** (condo); proprietary lease (co-op) | [Wise PM — condo/co-op/HOA](https://wisepropertymanagement.com/whats-the-difference-between-a-condominium-co-op-and-hoa/) |
| **Spain** | **Propiedad horizontal**: comunidad de propietarios (legal entity) | **comunidad de propietarios** + **administrador de fincas colegiado** | **cuotas comunitarias** by **coeficiente de participación** | **Ley de Propiedad Horizontal 49/1960** | [Spanish Property Insight — community of owners](https://www.spanishpropertyinsight.com/guides/community-of-owners-in-spain/) |
| **Italy** | **Condominio**: unit + parti comuni | **amministratore di condominio** | **spese condominiali** by millesimi | regolamento condominiale (Codice Civile artt. 1117+) | researched-light |
| **Australia / NZ** | **Strata / unit title** | **body corporate / owners' corporation** | **strata levies** | strata plan + by-laws (state Strata Acts) | researched-light |
| **Brazil** | **Condomínio edilício** | **síndico** + assembleia | **taxa de condomínio** | convenção de condomínio (Lei 4.591/64 + Código Civil) | researched-light |
| **Netherlands** | **Appartementsrecht** | **VvE** (Vereniging van Eigenaars) | **VvE bijdrage** | splitsingsakte (BW Boek 5) | researched-light |

## Data-model implications (the structural part)
The property/unit schema must carry, per jurisdiction:
- **`tenure_type`** enum (freehold/leasehold/commonhold/share-of-freehold/condominium/coop/strata/WEG/copropriété/condominio/appartementsrecht/…) — jurisdiction-filtered option set.
- **`governance_body`** (freeholder/RMC/HOA/condo-assoc/syndic/WEG/body-corporate/VvE) + its contact.
- **periodic charge model**: ground rent (leasehold only) + service/condo/strata charge with frequency and apportionment basis (tantièmes/millesimi/coefficient/share).
- **lease term** (leasehold) — remaining years, critical for value + reform eligibility.
- **building vs unit relationship** — a "unit" in a condo/WEG/copropriété is owned within a governed building; the data model must represent the building (governance body, common parts) distinct from the unit.

> **This is Phase 0/1 schema work, not just content.** Without `tenure_type` + `governance_body` + a periodic-charge model, Money (service charges), Planning (cost drivers), and Legal (leasehold reform / ground rent) cannot be jurisdiction-correct. Default UK to leasehold/freehold (current behaviour); add the per-jurisdiction option sets + the building/governance layer.

### Sources (consolidated)
legislation.gov.uk LFRA 2024 + Commons Library; verband-wohneigentum.de (WEG); hellio.com/notaires (copropriété); wisepropertymanagement.com (US condo/co-op/HOA).
