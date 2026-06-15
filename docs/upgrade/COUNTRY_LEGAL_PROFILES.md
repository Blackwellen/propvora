# Propvora Country Legal Profile Architecture + Country Profiles

**Companion to:** `INTERNATIONAL_EXPANSION_MASTER_PLAN.md`. **Generated:** 2026-06-15.
**Status:** GATED — eligible only after the UK V1 build is signed off (see `GLOBAL_ROLLOUT_PHASING.md`).

> ⚠️ Build/planning document, **not legal/tax advice**. Every profile below is a *starting research scaffold*; each must be ratified by qualified local counsel + tax adviser before its country pack moves from `research_only` to `beta`/`enabled`. Flags: ⚖️ legal sign-off, 🧾 tax sign-off.

---

## 1. Why a "country legal profile" is the right architecture

Today, Propvora's **Legal** (`/app/legal`: `rra-2026`, `hmo-licences`, `possession`, `epc-advisory`) and **Compliance** (`/app/compliance`: gas/electrical/fire/EPC certificates, HMO) sections are **hard-coded to England & Wales statute**. That is correct for V1 but **cannot be shipped to another country** — a "gas safety certificate" or "Renters' Rights Act 2026" workflow is meaningless or misleading in Spain, Thailand or Texas.

The Context Engine (marketplace audit §2) already separates **workspace country** from **property country**. This document specifies the **content layer** that rides on top of it: a versioned, reviewable **Country Legal Profile** that every country-sensitive feature reads from, so that:

- features that **don't apply** in a country are **disabled**, not shown broken;
- features that **partially apply** run in **generic / research-only / evidence-only** mode with disclaimers;
- features that **fully apply** run only when a **reviewed pack** authorises them.

This is the difference between "we let you store a document" (safe everywhere) and "we tell you that you are legally compliant" (only where a reviewed pack says so).

---

## 2. The country profile data model

### 2.1 Core table: `country_profiles` (one row per country, versioned)

```text
country_profiles
  id
  country_code              -- ISO 3166-1 alpha-2 (GB, ES, US, AU…)
  display_name
  default_locale            -- en-GB, es-ES, de-DE…
  default_currency          -- ISO 4217 (GBP, EUR, USD…)
  supported_locales[]       -- for translation/RTL
  measurement_system        -- metric | imperial
  area_unit                 -- sqm | sqft
  date_format               -- ICU pattern
  number_format             -- ICU pattern
  address_model_id          -- FK → address_models (field order, postcode/zip/state)
  phone_country_code

  -- eligibility / commercial
  offer_status              -- offer | restricted | banned   (from master-plan matrix)
  offer_reason
  stripe_billing_supported  -- bool
  connect_payout_supported  -- bool
  local_payment_methods[]   -- ideal, sepa, pix, upi…

  -- tax
  tax_scheme                -- vat_oss | gst | sales_tax | consumption_tax | none
  tax_name                  -- "VAT","GST","Sales Tax","IVA"…
  standard_tax_rate
  reduced_tax_rates[]
  tax_id_label              -- "VAT number","ABN","GSTIN"…
  tax_id_validation_regex
  b2b_reverse_charge        -- bool
  einvoice_format           -- none | peppol_en16931 | sdi | ksef | nfe…
  tax_review_status         -- research_only | reviewed   🧾

  -- privacy
  privacy_regime            -- uk_gdpr | eu_gdpr | fadp | kvkk | ccpa_patchwork | pipeda | law25 | app | nz_privacy | lgpd | dpdp | popia | ndpa | ke_dpa | pdpa_th | appi | none_yet
  dsar_response_days
  breach_notify_hours
  consent_model             -- opt_in | opt_out | mixed
  representative_required   -- bool
  dpo_required              -- bool
  authority_name            -- ICO, CNIL, OAIC, ANPD…
  transfer_mechanism        -- eu_scc | uk_idta | swiss_scc | dpf | negative_list | local_scc | none
  privacy_review_status     -- research_only | reviewed   ⚖️

  -- consumer / contract
  governing_law_default     -- "England & Wales" for B2B; consumer-mandatory overrides flagged
  b2c_withdrawal_days       -- 14 (EU/UK), 7 (BR), 0/null (US)
  withdrawal_button_required-- bool (EU from 2026-06-19)
  auto_renewal_disclosure   -- bool (US/CA)
  consumer_review_status    -- research_only | reviewed   ⚖️

  -- property / tenancy applicability  ← the heart of legal gating
  property_features_status  -- disabled | generic_only | research_only | beta | enabled
  tenancy_law_applicable    -- bool
  tenancy_law_level         -- national | state_province | municipal
  short_let_regulated       -- bool/unknown
  hmo_equivalent_concept    -- text | null
  legal_pack_status         -- none | research_only | reviewed   ⚖️
  legal_disclaimer_id

  -- compliance modules (what safety/cert workflows exist)
  compliance_modules        -- jsonb: { gas_safety, electrical, epc_energy, fire, licensing, … : status }

  -- accessibility / representatives
  accessibility_regime      -- eaa | ada_508 | aca_aoda | none
  representatives[]          -- FK → representatives (EU rep, Swiss rep, DPO, Info Officer)

  -- governance
  reviewed_by               -- counsel/adviser reference
  reviewed_at
  version
  effective_from
```

### 2.2 Supporting tables

```text
address_models           -- per-country field set + ordering (postcode vs zip+state vs none)
representatives          -- appointed EU/Swiss/DP reps, DPOs, Info Officers per country
country_disclosures      -- required notices/disclaimers per country + surface (checkout, legal page, AI)
country_legal_templates  -- which T&C / privacy / DPA / refund variant per country + B2B/B2C
country_compliance_rules -- per (country, operation_profile) safety/licence rules + evidence schema
tax_rate_tables          -- per country/region rate rows (or delegate to Stripe Tax/Avalara)
```

### 2.3 How `property_features_status` gates the app

| Status | What the app does | Example |
|---|---|---|
| `enabled` | Full country-reviewed legal/compliance workflows, definitive labels allowed (cautiously) | GB (V1) |
| `beta` | Workflows run, but every output shows "beta pack — verify locally" | early AU/NZ pack |
| `research_only` | Show informational scaffolding; **no** definitive labels; AI must refuse country-specific legal/tax advice | TH, IN pre-review |
| `generic_only` | Only universal features (store documents, track tasks, upload evidence) — **no** tenancy/compliance logic | UK landlord with a property in a country with no pack |
| `disabled` | Country-specific legal/compliance sections hidden entirely | BANNED countries / no plans |

**Resolver rule (ties to Context Engine):** for any legal/compliance/planning page, resolve `property.country_code → country_profiles.property_features_status`. If `< enabled`, render the **"No reviewed legal pack for {country}"** banner and degrade the feature to the allowed mode. AI context (`ai.legalDepth`, `ai.taxDepth`) is downgraded to `generic` when status `< reviewed`.

---

## 3. How each app section adapts per profile

| Section | `enabled` pack | `research_only` / no pack |
|---|---|---|
| **Legal** (`/app/legal`) | Country-specific matters, templates, possession/licensing equivalents | UK-statute pages (`rra-2026`, `hmo-licences`, `possession`, `epc-advisory`) **hidden**; generic "legal documents & evidence" only + disclaimer |
| **Compliance** (`/app/compliance`) | Country's actual safety/cert/licence renewal calendar from `compliance_modules` | Generic evidence vault + renewal reminders the user defines manually; **no** "gas safety due" UK logic |
| **Planning** (`/app/planning`) | Country tax/yield assumptions; local landlord-offer logic | Currency-correct forecasting only; UK MTD-ITSA / RRA-2026 logic suppressed |
| **Money / Accounting** | Local VAT/GST/sales-tax codes, invoice fields, chart template | Multi-currency tracking + generic invoices; tax labels generic until `tax_review_status = reviewed` |
| **Work** | Local emergency categories, supplier-tax handling, SLAs by local holidays | Generic task/job tracking |
| **Portfolio** | Local address model, area unit, jurisdiction tab populated | Address model + currency only; "unsupported country — generic mode" banner |
| **Portals** | Locale + region privacy notice for tenant/guest/supplier | Default locale + base privacy notice |
| **Contacts/Calendar** | Locale formats, holidays, consent regime | Same (these are locale-driven, low legal risk) |

**Key rule for the founder's question — "UK property law is hard-coded today, how do we make it country-aware vs. disable it?"** Answer: **make the *engine* country-aware (rules live in `country_compliance_rules` + `country_legal_templates`, not in code), and ship country-specific rule data only for `reviewed` packs. For everything else, disable the UK-statute features and fall back to generic document/evidence/task tracking.** Never run UK rules against a non-UK property.

---

## 4. In-depth country profiles (founder's named markets)

Each profile: regime IDs to set, the tenancy/short-let reality, what to enable vs disable, and the sign-off needed. **Property-pack depth is a later phase everywhere except GB** — these scaffolds tell the build team what each pack must contain.

### 4.1 United Kingdom 🇬🇧 (baseline / V1 — `enabled`)
- **Privacy:** `uk_gdpr` · DSAR 1 month · breach 72h · ICO · UK-established (no rep).
- **Tax:** `vat` · VAT 20% · MTD-ITSA pressure (existing add-on). E-invoice: none mandated yet.
- **Consumer:** 14-day cancellation (Consumer Contracts Regs 2013); digital-content consent carve-out.
- **Property:** Renters' Rights Act 2026, HMO licensing, gas/electrical/EPC/fire — **fully built (V1)**. `property_features_status = enabled`.
- **Action:** none new; this is the reference profile.

### 4.2 Ireland 🇮🇪 (`offer`, pack `later`)
- **Privacy:** `eu_gdpr` · DPC · **EU Art 27 rep** (could double as Propvora's EU rep base). 
- **Tax:** EU VAT via OSS; standard 23%. Reverse charge B2B.
- **Property:** RTB (Residential Tenancies Board), differing notice/deposit rules vs UK. ⚖️ Distinct pack.
- **Why valuable:** English-language, common-law-adjacent, EU foothold → strong **Phase 2 first mover** + EU rep location.

### 4.3 Australia 🇦🇺 (`offer`, pack `Y` — priority)
- **Privacy:** `app` (Australian Privacy Principles) · NDB scheme · **statutory privacy tort live 10 Jun 2025** · **Children's Online Privacy Code by 10 Dec 2026** ([FTI](https://www.fticonsulting.com/insights/articles/australian-privacy-law-reforms-take-effect)).
- **Tax:** GST 10% · register if AU sales > **AUD 75k** ([ATO](https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst)). Tax ID = ABN.
- **Property:** **Tenancy law is state/territory** (NSW RTA, VIC RTA 1997, QLD, WA…). `tenancy_law_level = state_province`. Short-let regulated locally (e.g. NSW STRA register). ⚖️
- **Build:** address model (state + 4-digit postcode), AUD, sqm; compliance modules: smoke alarms (state rules), pool-safety where relevant — **state sub-packs** needed.

### 4.4 New Zealand 🇳🇿 (`offer`, pack `Y`)
- **Privacy:** `nz_privacy` (Privacy Act 2020) · 13 IPPs · **IPP12** cross-border · OPC breach notify.
- **Tax:** GST 15% · non-resident remote-services registration ([Taxually NZ](https://support.taxually.com/support/solutions/articles/80001177064)). Tax ID = IRD/NZBN.
- **Property:** Residential Tenancies Act 1986; Healthy Homes Standards (insulation/heating/ventilation) → strong **compliance pack** analog to UK certs. ⚖️
- **Build:** Healthy Homes maps neatly onto Propvora's compliance-evidence engine — good early pack candidate.

### 4.5 Canada 🇨🇦 (`offer`, pack `later`)
- **Privacy:** `pipeda` federal + **`law25` Quebec** (Privacy Officer mandatory) ([Usercentrics](https://usercentrics.com/knowledge-hub/quebec-law-25/)). Bill C-27/CPPA **dead Jan 2025** ([RollWorks](https://help.rollworks.com/hc/en-us/articles/19475094782989)).
- **Tax:** GST/HST federal + **QST** (Quebec) + provincial PST; register > **CAD 30k** ([Canada.ca](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/digital-economy-gsthst/find-out-need-register/cross-border-threshold-amounts.html)).
- **Property:** **provincial** (Ontario RTA, Quebec TAL, BC RTB…). `tenancy_law_level = state_province`. Quebec = French-language contract rights (Bill 96). ⚖️
- **Build:** bilingual (en-CA/fr-CA), QC Privacy Officer must be named in profile `representatives`.

### 4.6 United States 🇺🇸 (`offer`, pack `later` — complex)
- **Privacy:** `ccpa_patchwork` — **19 state laws in effect 2026** ([MultiState](https://www.multistate.us/insider/2026/2/4/all-of-the-comprehensive-privacy-laws-that-take-effect-in-2026)); GPC + "Do Not Sell/Share". 
- **Tax:** **sales tax by state/city**; SaaS taxable in ~25 jurisdictions ([Anrok](https://www.anrok.com/saas-sales-tax-by-state)); economic nexus. **Tax engine mandatory.**
- **Consumer:** state auto-renewal laws (CA ARL), FTC click-to-cancel.
- **Property:** **state + city landlord-tenant law** (huge variance: NY, CA, TX…); short-let = **city ordinances** (NYC, SF). `tenancy_law_level = state_province`/municipal. ⚖️
- **Build:** zip+state address, USD, imperial/sqft; treat US property packs as **state sub-packs**, late-phase. Subscription billing is easy; property intelligence is the hard part.

### 4.7 EU markets (Italy, Germany, Spain, France, Netherlands, Czechia, Austria, Hungary, Sweden, Finland, Denmark, Croatia) — `offer`, pack `later`
Shared baseline (set once, vary the deltas):
- **Privacy:** `eu_gdpr` · per-country authority (Garante, BfDI/state DPAs, AEPD, CNIL, AP, ÚOOÚ, DSB, NAIH, IMY, Tietosuoja, Datatilsynet, AZOP) · **EU Art 27 rep**.
- **Tax:** EU VAT via OSS, **country rate** (IT 22, DE 19, ES 21, FR 20, NL 21, CZ 21, AT 20, HU 27, SE 25, FI 25.5, DK 25, HR 25). Reverse charge B2B. **E-invoicing**: IT SDI (live), FR (Sep 2026), others harmonising to EN 16931 ([fiskaly](https://www.fiskaly.com/blog/e-invoicing-mandates-in-europe-2026)).
- **Consumer:** 14-day withdrawal + **mandatory cancel button from 19 Jun 2026** ([Taylor Wessing](https://www.taylorwessing.com/en/insights-and-events/insights/2026/02/withdrawal-button-as-compliance-risk-for-eu-and-non-eu-businesses)).
- **Accessibility:** **EAA / EN 301 549 (WCAG 2.1 AA)** enforceable.
- **Property deltas (⚖️ each is a distinct pack):**
  - **Germany** — strong tenant protection (Mietspiegel rent index, Kündigungsschutz); short-let *Zweckentfremdung* permits (Berlin/Munich).
  - **France** — loi ALUR, encadrement des loyers (Paris rent caps), strict short-let registration.
  - **Spain** — LAU; regional short-let licences (Catalonia/Balearics); recent rental-law reforms.
  - **Italy** — cedolare secca tax regime; CIN national short-let code.
  - **Netherlands** — points-based rent (WWS); municipal short-let night-caps (Amsterdam).
  - **Sweden/Finland/Denmark** — cooperative/regulated rents, strong tenant security.
  - **Austria/Czechia/Hungary/Croatia** — civil-code tenancy; Hungary real-time invoice reporting; Croatia tourism-heavy short-let.
- **Build:** localisation per language; e-invoicing format per country; rent-cap/registration logic only when pack reviewed.

### 4.8 Switzerland 🇨🇭 (`offer`, pack `later`)
- **Privacy:** `fadp` (revised, in force 1 Sep 2023) · **Swiss representative required** · Swiss SCC ([SecurePrivacy](https://secureprivacy.ai/blog/switzerland-new-federal-act-data-protection-fadp-key-changes-compliance)).
- **Tax:** Swiss VAT 8.1% (non-EU; separate registration, threshold rules). 🧾 Multilingual (de/fr/it).
- **Property:** OR (Code of Obligations) tenancy; cantonal nuances. ⚖️
- **Build:** name Swiss rep in `representatives`; CHF; 3 locales.

### 4.9 Turkey 🇹🇷 (`restricted`, pack `Y` but late)
- **Privacy:** `kvkk` · **VERBİS registration** · localisation pressure · **Turkish SCC** recognised ([MyData-Trust](https://www.mydata-trust.com/turkish-data-privacy-law/)).
- **Payments:** **no native Stripe** → manual payment/provider review. ⚠️
- **Property:** Turkish Code of Obligations tenancy; foreign-ownership zones; short-let permit tightening. ⚖️
- **Build:** manual onboarding; `offer_status = restricted`; TRY; tr-TR locale.

### 4.10 Thailand 🇹🇭 (`offer` payments via Stripe, pack `Y` but sensitive)
- **Privacy:** `pdpa_th` · PDPC · breach 72h · local representative where no presence.
- **Tax:** VAT 7%; e-service VAT registration for non-residents. 🧾
- **Property:** Hotel Act / Condominium Act make **short-let frequently restricted/illegal**; foreign-ownership limits. **AI must never assert short-let legality** — `legal_pack_status = research_only`. ⚖️ High-caution market.
- **Build:** th-TH locale; strong disclaimers; property features `research_only`.

### 4.11 India 🇮🇳 (`restricted` — Stripe Preview, pack `Y` but late)
- **Privacy:** `dpdp` (Act 2023 + Rules 2025) · **negative-list transfers** · consent-manager model · compliance by ~**May 2027** ([K&K](https://ksandk.com/data-protection-and-data-privacy/indias-new-cross-border-data-transfer-framework/)).
- **Tax:** **OIDAR GST 18% — register for any B2C supply, no threshold** ([Anrok IN](https://www.anrok.com/vat-software-digital-services/india)); GSTIN; e-invoicing (IRP) for large taxpayers. 🧾
- **Payments:** Stripe **Preview** → manual-first; UPI key local method.
- **Property:** state Rent Control + Model Tenancy Act adoption varies; RERA for developers. ⚖️
- **Build:** `offer_status = restricted`; INR; multi-script locales; SCA/3DS mandatory.

### 4.12 Pakistan 🇵🇰 (`restricted`, pack `Y` but caution)
- **Privacy:** **`none_yet`** — Personal Data Protection Bill **not yet in force**; rely on contractual safeguards. ⚖️ State this honestly in the profile.
- **Payments:** manual payment + sanctions/risk review. ⚠️
- **Property:** provincial Rent Restriction Ordinances. ⚖️
- **Build:** `privacy_regime = none_yet`; `offer_status = restricted`; PKR; en/ur locale.

### 4.13 Brazil 🇧🇷 (`offer`, pack `Y`)
- **Privacy:** `lgpd` · **DPO/encarregado required** · ANPD · **Brazilian SCC** exists ([DataGuidance CH](https://www.dataguidance.com/jurisdictions/switzerland)).
- **Tax:** complex (ISS/PIS/COFINS on services); **NF-e/NFS-e e-invoicing** pervasive. 🧾 Use local tax adviser + provider.
- **Consumer:** CDC **7-day** distance withdrawal.
- **Payments:** **PIX** essential local method (Stripe supports).
- **Property:** Lei do Inquilinato (Law 8.245); short-let condo-rule sensitive. ⚖️
- **Build:** pt-BR; BRL; PIX; DPO named; 7-day withdrawal flag.

### 4.14 Japan 🇯🇵 (`offer`, pack `later`)
- **Privacy:** `appi` · PPC · **EU↔Japan mutual adequacy** (eases EU transfers) · opt-out third-party transfer.
- **Tax:** Japanese Consumption Tax (JCT) 10%; qualified-invoice system. 🧾
- **Property:** Borrower-protective Act on Land and Building Leases; minpaku (private-lodging) law caps short-let nights. ⚖️
- **Build:** ja-JP (CJK, vertical considerations minimal for app); JPY; minpaku caution.

### 4.15 South Africa 🇿🇦 (`restricted`, pack `Y`)
- **Privacy:** `popia` · **Information Officer registration required** · §72 cross-border.
- **Payments:** Stripe via **Paystack** extended network → review payout assumptions. ⚠️
- **Tax:** VAT 15%; non-resident e-services VAT registration. 🧾
- **Property:** Rental Housing Act; PIE Act (evictions). ⚖️
- **Build:** Info Officer named; ZAR; en-ZA.

### 4.16 Nigeria 🇳🇬 (`restricted`, pack `later`)
- **Privacy:** `ndpa` (NDPA 2023, statute replacing NDPR) · NDPC registration · DPCO/DPO ([GIR](https://globalinvestigationsreview.com)).
- **Payments:** Paystack network; payout review. ⚠️
- **Tax:** VAT 7.5%; non-resident registration. 🧾
- **Property:** state Tenancy Laws (e.g. Lagos Tenancy Law). ⚖️
- **Build:** NGN; en-NG; manual onboarding.

### 4.17 Kenya 🇰🇪 (`restricted`, pack `later`)
- **Privacy:** `ke_dpa` (DPA 2019) · **ODPC registration of controllers/processors** · breach 72h · localisation for sensitive data.
- **Payments:** Paystack network; **M-Pesa** dominant locally; review. ⚠️
- **Tax:** VAT 16%; Digital Service Tax history. 🧾
- **Property:** Rent Restriction Act / Landlord & Tenant Act. ⚖️
- **Build:** KES; en-KE/sw-KE; ODPC registration recorded.

---

## 5. Profile lifecycle & governance

```text
research_only  →  beta  →  enabled
     │            │          │
  scaffold     counsel +   counsel/tax
  + AI guard   tax review  sign-off + monitoring
```

- A pack may **not** advance past `research_only` without a recorded `reviewed_by` + `reviewed_at` (⚖️/🧾).
- Tie pack status to the **billing entitlement**: "Country pack beta GBP 19/mo/country (Scale+)" only unlocks `beta`/`enabled` packs (per `new subscription and addon tiers.md` §8); Enterprise unlocks custom packs.
- The **Platform Admin → Country Packs** control plane (marketplace audit §22.4) is where status, reviewers, and disclosures are managed; **Release Gates** must block enabling a pack whose review fields are empty.

---

## 6. Sources
See `INTERNATIONAL_EXPANSION_MASTER_PLAN.md` §11 for the consolidated source list (privacy regimes, tax thresholds, e-invoicing, Stripe, sanctions, EAA, consumer withdrawal). Country-specific tenancy/short-let statutes referenced above require **local-counsel verification** before any pack is enabled.
