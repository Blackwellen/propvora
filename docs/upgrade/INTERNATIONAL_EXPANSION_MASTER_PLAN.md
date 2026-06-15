# Propvora International Expansion + Global Compliance Master Plan

**Product:** Propvora (property-operations SaaS)
**Legal entity:** Blackwellen Ltd t/a Propvora — registered in England & Wales (Co. No. 16482166), registered office 61 Bridge Street, Kington, HR5 3DJ, ICO registration ZC160806 (source of truth: `src/lib/legal/company.ts`).
**Document type:** Internal build/planning document. **Generated:** 2026-06-15.
**Status of this initiative:** **GATED — NOT ELIGIBLE TO START** until the current UK V1 build is signed off as release-ready (see `docs/release` MAX-RELEASE trackers and §13 Gating below).

> ⚠️ **This is not legal, tax, financial, payment, employment, consumer, property, insurance or regulatory advice.** It is an engineering and commercial planning document. Every country pack, tax workflow, payment rail, consent flow, legal template and disclosure named here must pass **qualified local counsel and tax-adviser review** before production enablement. Items requiring sign-off are flagged ⚖️ (legal) and 🧾 (tax) throughout. Web citations are point-in-time (June 2026); law changes — re-verify at build time.

---

## 0. How this plan fits the existing roadmap

This master plan is the **compliance + market-entry spine** that sits underneath the architecture already designed in:

- `PROPVORA_GLOBAL_MARKETPLACE_CONTEXT_EXPANSION_AUDIT_2026-06-15.md` — the **Context Engine**, country-pack schema, workspace/property country separation, and per-section behaviour change. This plan provides the *legal/tax/sanctions content* that the Context Engine country packs must carry.
- `Complete_Layer_2_Upgrade_Guide.md` + `new subscription and addon tiers.md` — the tier model. International features map to the **"Country pack beta GBP 19/mo/country (Scale+, only after legal/tax/compliance review)"** add-on and the **Enterprise "custom country packs / data residency review"** entitlement.
- Marketplace docs (`supplier_marketplace.md`, `booking_marketplace_upgrade.md`, `id_verifcation_upgrade.md`) — the payment/KYC/escrow surfaces that international rollout most heavily constrains.

The three companion documents to this one:

- `COUNTRY_LEGAL_PROFILES.md` — the country-profile **data model** and per-country profiles.
- `I18N_LOCALIZATION_AND_UX_PLAN.md` — i18n framework, locale routing, per-route impact map.
- `GLOBAL_ROLLOUT_PHASING.md` — phased market entry + the gating checklist.

**One-line strategic framing:** Propvora can *sell a property-operations SaaS subscription* to most of the world relatively early (Stripe lets a UK business bill globally), but it can only *offer country-specific property/tenancy/compliance/legal intelligence* where a reviewed country pack exists. The hard line is between **"we bill you"** and **"we advise you about your jurisdiction."** Everything below enforces that line.

---

## 1. Operating model: a UK entity serving global customers

### 1.1 What Blackwellen Ltd actually is in each customer relationship

| Role | Who | Propvora's status | Consequence |
|---|---|---|---|
| **SaaS provider** | Paying operator (landlord/agency) | **Controller** of *account/billing/usage* data; **Processor** of the *property/tenant/contact* data the customer uploads | Customer is controller of tenant/guest PII; Propvora needs a **Data Processing Agreement (DPA)** with every customer (already a surface: `data-processing-agreement-ui` skill, `workspace-settings/data`). |
| **Marketplace operator** (Layer 2) | Suppliers, guests | **Controller** for marketplace identity, reviews, dispute records; **Processor/intermediary** for transaction data | New controller relationships → new privacy notices per actor type. |
| **Payment facilitator** (Connect) | Suppliers receiving payouts, guests paying | Platform under Stripe Connect terms | Triggers KYC/AML obligations flow-through (§6). |

**Build implication:** the workspace data model must record, per workspace, whether Propvora is acting as controller or processor for each data category — this drives which privacy notice, DPA clause set, and breach-notification path applies. Tie to `workspace.data_region`, `workspace.business_country_code` (already proposed in the marketplace audit §3.1).

### 1.2 GDPR Article 27 representatives — required once Propvora targets EU/UK data subjects

Because Blackwellen is established **only in the UK**, the moment Propvora **offers services to, or monitors, individuals in the EU/EEA**, Article 27 EU GDPR requires it to **appoint an EU representative** in a member state where data subjects are. The representative is a contact point for supervisory authorities and data subjects; **liability and compliance stay with Blackwellen.** Non-appointment risks fines up to €10m / 2% of global turnover. ([gdpr-info.eu Art 27](https://gdpr-info.eu/art-27-gdpr/), [GDPRLocal](https://gdprlocal.com/gdpr-art-27-requirements-explained/))

Mirror obligations:

- **UK GDPR Art 27** — once Propvora is established *outside* the UK it would need a UK rep; today Blackwellen *is* UK-established, so a UK rep is **not** required, but the UK contact role is filled by the ICO registration already held (ZC160806). ⚖️
- **Switzerland (revised FADP, in force 1 Sep 2023)** — foreign controllers must **appoint a Swiss representative** when processing relating to Swiss data subjects on a large scale / offering goods & services. ([SecurePrivacy FADP](https://secureprivacy.ai/blog/switzerland-new-federal-act-data-protection-fadp-key-changes-compliance), [DLA Piper CH](https://www.dlapiperdataprotection.com/?t=law&c=CH))
- **Turkey (KVKK), South Korea, China, Brazil (LGPD), and others** have their own representative/local-contact concepts — confirm per country pack. ⚖️

**Build implication:** add `country_pack.representative_required` (bool) + a **"Representatives & Authorities"** record set. Surface the appointed reps in the public privacy notice and legal pages (`src/app/legal`, `LegalLayout.tsx`). Appointing reps is a **commercial/legal action**, not a code task — but the app must *display* them. **Trigger:** appoint an EU (e.g. Ireland) representative **before** EU launch (Phase 2).

### 1.3 Tax establishment / permanent establishment (PE)

Selling SaaS into a country does **not** by itself create a corporate-tax PE — but **employees, agents, or fixed places of business** in-country can. Appointing an EU GDPR *representative* is a data-protection contact, **not** a tax agent, and is generally PE-neutral, but confirm. 🧾⚖️ Indirect tax (VAT/GST/sales tax) obligations *do* arise from sales alone (§5) and are separate from corporate-tax PE.

**Build implication:** none in app for corporate PE (it's a Blackwellen finance matter), but the **invoicing engine must capture supply country, customer country, customer tax ID and B2B/B2C status** to support indirect-tax compliance.

### 1.4 Governing law, jurisdiction, and consumer carve-outs

- **B2B customers:** Terms can specify **English law + courts of England & Wales** as governing law/forum. Keep this as the default.
- **B2C/consumer customers (EU/UK and others):** mandatory consumer-protection law of the **consumer's home country** generally **cannot be contracted away** (Rome I Art 6 in the EU). A choice-of-English-law clause survives but **does not strip the consumer of their local mandatory protections** (withdrawal rights, unfair-terms control). ⚖️
- Add per-region **arbitration / class-action-waiver** considerations for the US (enforceable in many states) but **not** for the EU/UK consumer context.

**Build implication:** the legal-document engine must serve **region-specific Terms/EULA/Refund variants** keyed to the customer's `country_code` + B2B/B2C flag (see `I18N_LOCALIZATION_AND_UX_PLAN.md` route map; surfaces: `src/app/legal`, `LegalLayout.tsx`, `terms-privacy-legal-page-ui`, `refund-cancellation-policy-ui`).

---

## 2. Data protection by regime

Propvora is data-heavy: landlord, tenant, guest, supplier, contact, financial, evidence-photo, and (Layer 2) ID-verification data. The table below is the **per-regime build spec** for the country packs. Each row's depth = what the privacy engine must vary.

### 2.1 Regime matrix

| Regime / Law | Territory | Applies to Propvora because… | Key build deltas | Breach clock | Rep/DPO |
|---|---|---|---|---|---|
| **UK GDPR + DPA 2018** | UK | Home jurisdiction | Baseline. ICO reg held. | **72h** to ICO | UK-established (no rep); DPO if large-scale special-category |
| **EU GDPR** | EEA | Offering services to EU residents | Lawful basis, DSAR 1mo, DPIA, SCCs for transfers out | **72h** to lead SA | **EU Art 27 rep required** ([Art 27](https://gdpr-info.eu/art-27-gdpr/)) |
| **EU AI Act** | EU | AI Copilot may be transparency-scoped / GPAI downstream | Transparency labels on AI output (Art 50 from **2 Aug 2026**); avoid high-risk uses (no automated tenant-screening decisions) ([Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)) | n/a | n/a |
| **ePrivacy / PECR** | UK/EU | Cookies, marketing email | Cookie consent banner per region; opt-in for marketing | n/a | n/a |
| **Switzerland FADP (rev.)** | CH | Swiss data subjects | **Swiss representative**; Swiss SCC; near-GDPR rights ([SecurePrivacy](https://secureprivacy.ai/blog/switzerland-new-federal-act-data-protection-fadp-key-changes-compliance)) | ASAP to FDPIC | **Swiss rep required** |
| **Turkey KVKK** | TR | Turkish data subjects | VERBİS registration; **Turkish SCC** recognised by CH list ([MyData-Trust](https://www.mydata-trust.com/turkish-data-privacy-law/)); localisation pressure | 72h to KVKK Board | Local contact ⚖️ |
| **US CCPA/CPRA + 19 state laws (in effect 2026)** | US | Sales to US residents above thresholds | "Do Not Sell/Share" link, opt-out preference signals (GPC), sensitive-PI handling; **patchwork** of 19 enforcing states ([IAPP](https://iapp.org/resources/article/us-state-privacy-laws-overview), [MultiState](https://www.multistate.us/insider/2026/2/4/all-of-the-comprehensive-privacy-laws-that-take-effect-in-2026)) | Varies by state | No DPO mandate; "contact" disclosure |
| **Canada PIPEDA** (federal) | CA | Commercial handling of Canadian PII | Consent, access, breach record-keeping (Bill C-27/CPPA **died Jan 2025** — PIPEDA still governs) ([RollWorks](https://help.rollworks.com/hc/en-us/articles/19475094782989)) | "real risk of significant harm" → notify | Accountable individual |
| **Quebec Law 25** | QC | Quebec residents | **Privacy Officer mandatory** (defaults to CEO), PIAs, data-portability, consent rigor beyond GDPR in places ([Usercentrics](https://usercentrics.com/knowledge-hub/quebec-law-25/), [Ankura](https://ankura.com/insights/quebec-privacy-bill-64-law-25)) | Confidentiality-incident reporting | **Privacy Officer required** |
| **Australia Privacy Act + APPs** | AU | Australian customers | 2024 reforms in force: **statutory tort for serious invasions of privacy (from 10 Jun 2025)**; **Children's Online Privacy Code by 10 Dec 2026**; automated-decision transparency ([FTI](https://www.fticonsulting.com/insights/articles/australian-privacy-law-reforms-take-effect), [IAPP](https://iapp.org/news/a/australia-approves-first-privacy-act-reforms-social-media-ban-for-minors)) | Notifiable Data Breaches scheme | n/a (privacy contact) |
| **NZ Privacy Act 2020** | NZ | NZ customers | 13 IPPs, **IPP12** cross-border rules, mandatory breach notify to OPC | "notifiable privacy breach" ASAP | n/a |
| **Brazil LGPD** | BR | Brazilian data subjects | DPO ("encarregado"), ANPD; **Brazilian SCC** now exists (per CH FADP list) ([DataGuidance CH](https://www.dataguidance.com/jurisdictions/switzerland)) | ANPD "reasonable time" | **DPO/encarregado required** |
| **India DPDP Act 2023 + DPDP Rules 2025** | IN | Indian "Data Principals" | **Negative-list** transfer model (Rule 15: allowed unless gov't restricts); consent-manager model; **full compliance by ~May 2027** ([K&K](https://ksandk.com/data-protection-and-data-privacy/indias-new-cross-border-data-transfer-framework/), [Wikipedia DPDP Rules](https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Rules,_2025)) | To Data Protection Board | "Significant DF" → DPO; verifiable parental consent for minors |
| **South Africa POPIA** | ZA | SA data subjects | 8 conditions, Information Officer registration, cross-border §72 | To Regulator + data subject | **Information Officer required** |
| **Nigeria NDPA 2023** | NG | Nigerian data subjects | NDPA replaced NDPR as statute; NDPC registration; DPCO concept ([GIR](https://globalinvestigationsreview.com)) | To NDPC | DPO for major processors |
| **Kenya DPA 2019** | KE | Kenyan data subjects | ODPC registration of controllers/processors; data-localisation triggers for sensitive data | To Data Commissioner (72h) | DPO where required |
| **Thailand PDPA** | TH | Thai data subjects | Consent, **local representative** where no presence, cross-border rules | To PDPC (72h) | Local rep / DPO |
| **Japan APPI** | JP | Japanese data subjects | Opt-out for third-party transfer, **PPC**, cross-border consent/adequacy; Japan↔EU mutual adequacy exists | To PPC + individual | Handling supervisor |
| **Pakistan (PDPB — pending)** | PK | Pakistani data subjects | **No comprehensive law in force yet** (Personal Data Protection Bill still in process); treat as *research-only / contract-based safeguards* ⚖️ | n/a (no statute) | n/a |

### 2.2 International data transfers (out of EU/UK → Propvora's hosting)

Propvora hosts on Supabase; the **`data_region`** field (already proposed) governs where data sits. Transfer mechanisms by source:

| From | Mechanism Propvora must use | Notes |
|---|---|---|
| EU → US subprocessor | **EU SCCs** or recipient's **EU-US DPF** certification | DPF adequacy decision had a **sunset/renewal review (27 Jun 2025)** — monitor ([dataprivacyframework.gov](https://www.dataprivacyframework.gov/Program-Overview)) |
| UK → US subprocessor | **UK IDTA** or **UK Addendum to EU SCCs**, or recipient's **UK Extension to DPF** (effective 12 Oct 2023) ([ICO UK Extension](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/adequacy-regulations/how-does-the-uk-extension-to-the-eu-us-data-privacy-framework-work/)) |
| EU/UK → UK (Blackwellen) | UK has **EU adequacy** (review pending) | If EU adequacy for UK lapses, SCCs needed UK→EU and vice-versa ⚖️ |
| CH → out | **Swiss SCC** | Separate from EU SCC ([CH FADP](https://www.dataguidance.com/jurisdictions/switzerland)) |
| BR/TR/SA → out | **Brazilian / Turkish / Saudi SCCs** (now recognised) | Per CH FADP Dec-2025 list |
| IN → out | **Negative-list**: allowed unless gov't restricts the destination | Watch for restricted-country notifications ([K&K](https://ksandk.com/data-protection-and-data-privacy/indias-new-cross-border-data-transfer-framework/)) |

**Build implication:** the **subprocessor register** must be a live, country-aware document (`subprocessor-security-page-ui` skill, public page). A `transfer_mechanism` field per country pack drives which clause set the DPA generator emits. **Do not promise data residency you have not built** — store `data_region` and document current hosting honestly (the marketplace audit §12.3 already says this).

### 2.3 DSAR / erasure / breach-clock variance (the operational core)

The **`account/data-privacy`** route + `data-retention-deletion-ui` / `privacy-request-flow-ui` surfaces must become **regime-aware**:

| Dimension | Variance to encode |
|---|---|
| **DSAR response window** | EU/UK: 1 month (extendable). CA: 30/45 days. AU: "reasonable", usually 30 days. BR: 15 days for confirmation. Encode `dsar_response_days` per pack. |
| **Erasure / "right to be forgotten"** | Strong in EU/UK/BR; **narrower** in US states (deletion with exceptions), AU, JP. Tenancy/financial records often have **legal retention overrides** — erasure must respect statutory retention (tax, tenancy deposit, AML). |
| **Breach notification clock** | 72h (EU/UK/TR/KE/TH), "without undue delay/real risk" (CA/AU/NZ/ZA), state-specific (US). Encode `breach_notify_hours` + authority contact per pack. |
| **Opt-out signals** | US: must honour **Global Privacy Control (GPC)**; "Do Not Sell/Share" link. |
| **Consent model** | EU/UK/CA(Law25)/BR: opt-in. US: largely opt-out. CASL (CA): opt-in for marketing email. |

---

## 3. Consumer & contract law (what changes in Terms / EULA / Refund per region)

| Region | B2C trigger | What Propvora must change |
|---|---|---|
| **EU/EEA** | Selling SaaS subscriptions to consumers | **14-day right of withdrawal** (Consumer Rights Directive). For digital services that *start immediately*, the consumer must **expressly consent to start + acknowledge loss of withdrawal right** — Propvora must capture this checkbox at checkout. From **19 Jun 2026** a **mandatory "Cancel my contract" withdrawal function** must be on-site ([Your Europe](https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm), [Taylor Wessing](https://www.taylorwessing.com/en/insights-and-events/insights/2026/02/withdrawal-button-as-compliance-risk-for-eu-and-non-eu-businesses)). Unfair-terms control (Dir 93/13) → no one-sided terms. |
| **UK** | Same as EU pre-Brexit pattern | Consumer Contracts Regs 2013 (14-day cancellation, same digital-content consent carve-out); CRA 2015 fairness. |
| **US** | Consumer subscriptions | **FTC "Click-to-Cancel"** style + state auto-renewal laws (CA ARL): clear renewal disclosure, easy cancel, reminder notices. ⚖️ |
| **Australia** | Consumer | **Australian Consumer Law** non-excludable consumer guarantees; can't disclaim them in T&Cs. |
| **Canada/Quebec** | Consumer | Provincial consumer-protection + Law 25 consent; French-language contract rights in QC. |
| **Brazil** | Consumer | CDC (Consumer Defence Code) — **7-day** withdrawal for distance contracts. |

**Build implication:** the checkout/billing flow (`workspace-settings/subscription`, `billing-section-skill`, `plan-selection-ui`, `subscription-gating-ui`) needs:
1. a **B2B/B2C determination step** (business vs consumer; VAT ID capture doubles as B2B signal),
2. a **jurisdiction-aware consent block** (immediate-start + withdrawal acknowledgement for EU; auto-renewal disclosure for US/CA),
3. a **region-correct refund/withdrawal policy** document, and
4. (EU, by Jun 2026) a **self-service cancel/withdrawal control** in-app.

---

## 4. Tax (VAT / GST / sales tax / DST / e-invoicing)

Indirect tax is the **most certain** obligation that follows from sales (it does not require boots-on-ground). The billing + invoicing engine is the main surface.

### 4.1 By regime

| Tax | Where | Rule for a UK SaaS seller | Build delta |
|---|---|---|---|
| **UK VAT** | UK | Standard VAT on UK B2C; B2B normal rules. | Existing. |
| **EU VAT — digital services** | EU | **Place of supply = customer location** for B2C. Charge **local VAT rate of customer's country**; register once via **Non-Union OSS** to file all EU B2C. **B2B with valid VAT ID → reverse charge (no VAT)**. Collect **2 pieces of non-contradictory location evidence** (billing address + IP). ([1stopVAT](https://1stopvat.com/articles/eu-vat-saas-companies), [Taxually](https://www.taxually.com/blog/when-and-where-to-charge-eu-vat-on-digital-services)) | VAT-ID validation (VIES), per-country rate table, evidence capture, reverse-charge invoice note. |
| **US sales tax** | US | **Economic nexus** per state; SaaS taxable in ~**25 jurisdictions**, rules vary by state/city. Thresholds e.g. $100k gross sales. ([Anrok](https://www.anrok.com/saas-sales-tax-by-state), [Sales Tax Institute](https://www.salestaxinstitute.com/resources/expanding-digital-tax-net-digital-goods-services-2025)) | Nexus tracking by state; tax engine (TaxJar/Avalara/Stripe Tax) required — **do not hand-roll**. |
| **GST — Australia** | AU | Register if AU sales > **AUD 75,000**; non-resident simplified GST (no ABN needed). ([ATO](https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst)) | AU GST registration + 10% on B2C. |
| **GST — New Zealand** | NZ | Simplified non-resident "remote services" registration. ([Taxually NZ](https://support.taxually.com/support/solutions/articles/80001177064)) | 15% GST B2C. |
| **GST/HST — Canada** | CA | Register once Canadian sales > **CAD 30,000**/4 quarters; simplified digital-economy registration. ([Canada.ca](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/digital-economy-gsthst/find-out-need-register/cross-border-threshold-amounts.html)) | Federal GST/HST + QST (Quebec) handling. |
| **GST — India** | IN | **OIDAR**: register & collect for **any** B2C supply to India (no threshold). ([Anrok IN](https://www.anrok.com/vat-software-digital-services/india)) | 18% GST; mandatory registration before supply. |
| **GST — Singapore** | SG | Overseas Vendor Registration regime for digital services (SGD 1m global / SGD 100k local threshold). 🧾 | Confirm at pack build. |
| **Digital Services Taxes (DST)** | Various (e.g. some EU states, others) | Turnover-based DSTs may apply at scale — generally large-cap; monitor. 🧾 | Watch only until scale. |
| **E-invoicing mandates** | EU/Italy/Poland/Belgium/France, India, Brazil, etc. | **ViDA** adopted Mar 2025; member states may mandate domestic B2B e-invoicing now; **intra-EU B2B e-invoicing mandatory from 1 Jul 2030** (EN 16931). Italy SDI, Belgium (1 Jan 2026), Poland KSeF (Feb 2026), France (Sep 2026). ([fiskaly](https://www.fiskaly.com/blog/e-invoicing-mandates-in-europe-2026), [PwC ViDA](https://www.pwc.lu/en/newsletter/2025/vat-in-the-digital-age-vida.html)) | Invoice engine must support **structured e-invoice formats (Peppol BIS / EN 16931)** per country — a **Phase 2+** build, but design the invoice model for it now. |

### 4.2 Build implications for billing/invoicing

- The **invoice data model** (`workspace-settings/invoices`, `money/invoices`) must carry: `supply_country`, `customer_country`, `customer_tax_id`, `b2b_or_b2c`, `tax_scheme` (VAT/GST/sales_tax/none), `tax_rate`, `reverse_charge_flag`, `place_of_supply_evidence`.
- **Adopt a tax engine** (Stripe Tax / Avalara / Anrok) rather than hardcoding rates — rates and nexus shift constantly. This is the cheapest way to be defensible.
- Register for **EU OSS, AU/NZ/CA/IN GST** as each phase opens (a Blackwellen finance action, gated per phase).
- Design invoices for **structured e-invoicing** even before mandates bite.

---

## 5. Payments & currency

### 5.1 Stripe reality

A UK Stripe account can **sell to customers worldwide** once activated. Stripe supports businesses in ~**46 countries** and **135+ currencies**, with **SCA/3DS** built in (mandatory in EU + India). Stripe **does not operate in sanctioned regions** (Iran, North Korea, Syria, Cuba, Crimea, etc.). ([Stripe global](https://stripe.com/global), [cs-cart list](https://www.cs-cart.com/blog/stripe-supported-countries/), [Dodo](https://dodopayments.com/blogs/stripe-supported-countries-alternatives))

**Critical distinction (already flagged in the marketplace audit §4.3):** *selling subscriptions globally* ≠ *paying suppliers globally*. **Stripe Connect payouts** require the **connected account's country** to be Connect-supported. Maintain **two matrices**: `billing_country_matrix` (where Propvora can charge) and `connect_payout_country_matrix` (where suppliers/affiliates can be paid).

### 5.2 Currency, SCA, local methods

| Concern | Plan |
|---|---|
| **Multi-currency display** | Workspace `base_currency` + property `currency` + transaction currency (marketplace audit §3.1). Present prices in the customer's currency; settle/report in base. |
| **SCA / 3DS** | Mandatory EU + India — rely on Stripe's built-in SCA; ensure the checkout component does not bypass it. |
| **Local payment methods** | iDEAL (NL), SEPA Direct Debit (EU), Bancontact (BE), SOFORT/giropay (DE), BLIK (PL), UPI (IN, via partner), PIX (BR), PayNow (SG), BECS (AU). Enable per launch market via Stripe Payment Element. |
| **FX** | Record exchange rate + realised gain/loss (marketplace audit §6 already specifies `fx_rates`, `fx_revaluations`). Display "amount charged in your currency" clearly. |

### 5.3 KYC/AML — only where money flows *through* Propvora

- **Pure SaaS subscription** (customer → Blackwellen): low AML exposure; standard card-acquiring KYC handled by Stripe.
- **Marketplace + Connect payouts + affiliate payouts** (money flows through the platform to third parties): **KYC on connected accounts** (Stripe handles much of this), **sanctions screening of payees** (§6), and **records of beneficial ownership** for business suppliers. Affiliate payouts to individuals trigger **tax-form** and **sanctions-screening** needs (marketplace audit §7.2). ⚖️
- **No payouts to sanctioned/blocked entities** — enforce a screening gate before any `marketplace_payout` or `affiliate_payout` (`partner_sanctions_checks` table already proposed).

---

## 6. Sanctions & eligibility classification

### 6.1 Framework

Propvora must screen against **OFAC (US), UK OFSI, EU, and UN** consolidated lists. As a UK company using a US-based payment processor (Stripe) and likely US-based subprocessors, **both UK and US regimes bite.**

- **Comprehensively embargoed (BANNED):** Cuba, Iran, North Korea (DPRK), Syria, and the occupied Ukrainian regions **Crimea, Donetsk, Luhansk** (+ practically Russia/Belarus for a SaaS sale due to layered restrictions and processor policy). ([Sanction Scanner](https://www.sanctionscanner.com/blog/list-of-sanctioned-countries-by-ofac-un-and-eu-2025-1103), [Princeton ORPA](https://orpa.princeton.edu/export-controls/sanctioned-countries))
- **Targeted / high-risk (RESTRICTED — manual review, likely decline):** Afghanistan, Belarus, Myanmar (Burma), Central African Republic, DR Congo, Ethiopia, Iraq, Lebanon, Libya, Mali, Nicaragua, Somalia, South Sudan, Sudan, Venezuela, Yemen, Zimbabwe, Russia. ([Sanction Scanner](https://www.sanctionscanner.com/blog/list-of-sanctioned-countries-by-ofac-un-and-eu-2025-1103))

### 6.2 Classification rules used in the matrix

- **OFFER** — Stripe-supported, no comprehensive sanctions, reviewed-pack feasible. Subscription sales viable; country-pack property features only once reviewed.
- **RESTRICTED** — payments/sanctions/regulatory friction or no Stripe support; **manual sales + compliance review** before any onboarding; property packs unlikely near-term.
- **BANNED** — comprehensive sanctions / Stripe will not operate / Blackwellen must not transact. **Hard block at signup** (IP + billing-country + sanctions screen).

> ⚖️ **Counsel sign-off required** on the BANNED/RESTRICTED split before it gates real signups. Sanctions lists change frequently — wire the screen to a **live list provider**, do not hardcode this table.

### 6.3 Eligibility matrix (~128 countries)

Status legend: ✅ OFFER · ⚠️ RESTRICTED (manual review) · ⛔ BANNED. "Pack" = whether a property/tenancy country pack is plausibly in scope (Y near-term / L later / N not planned).

| # | Country | Region/Family | Status | Pack | Key reason |
|---:|---|---|:--:|:--:|---|
| 1 | United Kingdom | UK | ✅ | Y | Home market; V1. |
| 2 | Ireland | EU | ✅ | Y | Stripe, common-law, English-language. |
| 3 | United States | North America | ✅ | L | Stripe; sales-tax + 19-state privacy patchwork; tenancy = state-by-state. |
| 4 | Canada | North America | ✅ | L | Stripe; PIPEDA + Law25; provincial tenancy. |
| 5 | Australia | Oceania | ✅ | Y | Stripe; APPs; state tenancy. |
| 6 | New Zealand | Oceania | ✅ | Y | Stripe; Privacy Act 2020. |
| 7 | Germany | EU | ✅ | L | Stripe; GDPR; strong tenancy law. |
| 8 | France | EU | ✅ | L | Stripe; GDPR; e-invoicing Sep 2026. |
| 9 | Spain | EU | ✅ | L | Stripe; GDPR. |
| 10 | Italy | EU | ✅ | L | Stripe; GDPR; SDI e-invoicing live. |
| 11 | Netherlands | EU | ✅ | L | Stripe; iDEAL; GDPR. |
| 12 | Belgium | EU | ✅ | L | Stripe; B2B e-invoicing Jan 2026. |
| 13 | Austria | EU | ✅ | L | Stripe; GDPR. |
| 14 | Portugal | EU | ✅ | L | Stripe; GDPR. |
| 15 | Sweden | EU | ✅ | L | Stripe; GDPR. |
| 16 | Finland | EU | ✅ | L | Stripe; GDPR. |
| 17 | Denmark | EU | ✅ | L | Stripe; GDPR. |
| 18 | Croatia | EU | ✅ | L | Stripe; GDPR. |
| 19 | Czech Republic | EU | ✅ | L | Stripe; GDPR. |
| 20 | Hungary | EU | ✅ | L | Stripe; GDPR; real-time invoice reporting. |
| 21 | Poland | EU | ✅ | L | Stripe; KSeF e-invoicing 2026. |
| 22 | Greece | EU | ✅ | L | Stripe; GDPR. |
| 23 | Romania | EU | ✅ | L | Stripe; e-invoicing. |
| 24 | Bulgaria | EU | ✅ | L | Stripe; GDPR. |
| 25 | Slovakia | EU | ✅ | L | Stripe; GDPR. |
| 26 | Slovenia | EU | ✅ | L | Stripe; GDPR. |
| 27 | Estonia | EU | ✅ | L | Stripe; GDPR. |
| 28 | Latvia | EU | ✅ | L | Stripe; GDPR. |
| 29 | Lithuania | EU | ✅ | L | Stripe; GDPR. |
| 30 | Luxembourg | EU | ✅ | L | Stripe; GDPR. |
| 31 | Cyprus | EU | ✅ | L | Stripe; GDPR. |
| 32 | Malta | EU | ✅ | L | Stripe; GDPR; English-language. |
| 33 | Switzerland | Europe (non-EU) | ✅ | L | Stripe; **FADP — Swiss rep**. |
| 34 | Norway | EEA | ✅ | L | Stripe; GDPR via EEA. |
| 35 | Iceland | EEA | ⚠️ | L | EEA/GDPR; small; Stripe review. |
| 36 | Liechtenstein | EEA | ⚠️ | N | EEA; tiny market; review. |
| 37 | Japan | Asia | ✅ | L | Stripe; APPI; EU mutual adequacy. |
| 38 | Singapore | Asia | ✅ | L | Stripe; PDPA; GST OVR. |
| 39 | Hong Kong | Asia | ✅ | L | Stripe; PDPO; **note OFAC HK measures** — review. |
| 40 | Thailand | Asia | ✅ | Y | Stripe; PDPA; short-let licensing sensitive. |
| 41 | Malaysia | Asia | ✅ | L | Stripe; PDPA. |
| 42 | India | Asia | ⚠️ | Y | Stripe **Preview**; OIDAR GST; DPDP. Manual-first. |
| 43 | United Arab Emirates | MENA | ✅ | L | Stripe; PDPL; free-zone nuances. |
| 44 | Brazil | LATAM | ✅ | Y | Stripe; LGPD; PIX; CDC 7-day. |
| 45 | Mexico | LATAM | ✅ | L | Stripe; LFPDPPP. |
| 46 | South Africa | Africa | ⚠️ | Y | Stripe via Paystack network; POPIA. |
| 47 | Nigeria | Africa | ⚠️ | L | Paystack network; NDPA 2023; payout review. |
| 48 | Kenya | Africa | ⚠️ | L | Paystack network; DPA 2019 localisation. |
| 49 | Indonesia | Asia | ⚠️ | L | Stripe **Preview**; PDP Law; manual-first. |
| 50 | Pakistan | Asia | ⚠️ | Y | **No DP law in force**; payment/sanctions review. |
| 51 | Turkey | Europe/Asia | ⚠️ | Y | **No native Stripe**; KVKK/VERBİS; manual review. |
| 52 | Saudi Arabia | MENA | ⚠️ | L | PDPL; manual payment/legal review. |
| 53 | Qatar | MENA | ⚠️ | L | Manual payment/legal review. |
| 54 | Kuwait | MENA | ⚠️ | N | Manual review. |
| 55 | Bahrain | MENA | ⚠️ | L | PDPL; manual review. |
| 56 | Oman | MENA | ⚠️ | N | Manual review. |
| 57 | Israel | MENA | ✅ | L | Stripe-adjacent; PPL adequacy with EU. Verify. |
| 58 | Egypt | MENA/Africa | ⚠️ | N | DP law; manual payment review. |
| 59 | Morocco | Africa | ⚠️ | N | Law 09-08; manual review. |
| 60 | Tunisia | Africa | ⚠️ | N | Manual review. |
| 61 | Ghana | Africa | ⚠️ | N | DPA; Paystack-adjacent; review. |
| 62 | Côte d'Ivoire | Africa | ⚠️ | N | Review. |
| 63 | Tanzania | Africa | ⚠️ | N | Review. |
| 64 | Uganda | Africa | ⚠️ | N | DPPA; review. |
| 65 | Rwanda | Africa | ⚠️ | N | DP law; review. |
| 66 | Senegal | Africa | ⚠️ | N | Review. |
| 67 | Botswana | Africa | ⚠️ | N | Review. |
| 68 | Mauritius | Africa | ⚠️ | L | DPA (GDPR-aligned); review. |
| 69 | Namibia | Africa | ⚠️ | N | Review. |
| 70 | Zambia | Africa | ⚠️ | N | Review. |
| 71 | Zimbabwe | Africa | ⚠️ | N | **Targeted sanctions** — review/likely decline. |
| 72 | Ethiopia | Africa | ⚠️ | N | **Targeted sanctions** — review. |
| 73 | Angola | Africa | ⚠️ | N | Review. |
| 74 | Mozambique | Africa | ⚠️ | N | Review. |
| 75 | Argentina | LATAM | ⚠️ | L | EU-adequate DP; Stripe limited; manual. |
| 76 | Chile | LATAM | ⚠️ | L | New DP law; Stripe limited; manual. |
| 77 | Colombia | LATAM | ⚠️ | L | DP law; manual. |
| 78 | Peru | LATAM | ⚠️ | N | Manual. |
| 79 | Uruguay | LATAM | ⚠️ | L | EU-adequate; small; manual. |
| 80 | Costa Rica | LATAM | ⚠️ | N | Manual. |
| 81 | Panama | LATAM | ⚠️ | N | Manual. |
| 82 | Dominican Republic | LATAM | ⚠️ | N | Manual. |
| 83 | Ecuador | LATAM | ⚠️ | N | Manual. |
| 84 | Paraguay | LATAM | ⚠️ | N | Manual. |
| 85 | Bolivia | LATAM | ⚠️ | N | Manual. |
| 86 | Guatemala | LATAM | ⚠️ | N | Manual. |
| 87 | Venezuela | LATAM | ⛔ | N | **Targeted sanctions / high-risk** — block. |
| 88 | Cuba | LATAM | ⛔ | N | **Comprehensive embargo.** |
| 89 | Nicaragua | LATAM | ⛔ | N | **Sanctions** — block. |
| 90 | South Korea | Asia | ✅ | L | Stripe-adjacent; PIPA; verify acquiring. |
| 91 | Taiwan | Asia | ⚠️ | N | PDPA; Stripe limited; review. |
| 92 | Philippines | Asia | ⚠️ | L | DPA 2012; Stripe limited; review. |
| 93 | Vietnam | Asia | ⚠️ | N | PDPD localisation; manual. |
| 94 | China (mainland) | Asia | ⛔ | N | No Stripe merchant accounts; PIPL localisation; treat as no-offer. |
| 95 | Sri Lanka | Asia | ⚠️ | N | New DP law; manual. |
| 96 | Bangladesh | Asia | ⚠️ | N | Manual. |
| 97 | Nepal | Asia | ⚠️ | N | Manual. |
| 98 | Kazakhstan | Central Asia | ⚠️ | N | Localisation; manual. |
| 99 | Uzbekistan | Central Asia | ⚠️ | N | Manual. |
| 100 | Georgia | Caucasus | ⚠️ | N | DP law; manual. |
| 101 | Armenia | Caucasus | ⚠️ | N | Manual. |
| 102 | Azerbaijan | Caucasus | ⚠️ | N | Manual. |
| 103 | Russia | Europe/Asia | ⛔ | N | **Broad sanctions; Stripe withdrawn** — block. |
| 104 | Belarus | Europe | ⛔ | N | **Sanctions** — block. |
| 105 | Ukraine | Europe | ⚠️ | N | OFFER core, but **Crimea/Donetsk/Luhansk ⛔**; geo-screen sub-regions. |
| 106 | Serbia | Europe | ⚠️ | N | DP law (Serbian SCC); manual. |
| 107 | North Macedonia | Europe | ⚠️ | N | Manual. |
| 108 | Albania | Europe | ⚠️ | N | Manual. |
| 109 | Bosnia & Herzegovina | Europe | ⚠️ | N | Manual. |
| 110 | Montenegro | Europe | ⚠️ | N | Manual. |
| 111 | Moldova | Europe | ⚠️ | N | Manual. |
| 112 | Iran | MENA | ⛔ | N | **Comprehensive embargo.** |
| 113 | Syria | MENA | ⛔ | N | **Comprehensive embargo.** |
| 114 | North Korea | Asia | ⛔ | N | **Comprehensive embargo.** |
| 115 | Iraq | MENA | ⚠️ | N | **Targeted sanctions** — review. |
| 116 | Lebanon | MENA | ⚠️ | N | **Targeted sanctions** — review. |
| 117 | Libya | MENA/Africa | ⚠️ | N | **Targeted sanctions** — review. |
| 118 | Yemen | MENA | ⛔ | N | **Sanctions / conflict** — block. |
| 119 | Sudan | Africa | ⛔ | N | **Sanctions / conflict** — block. |
| 120 | South Sudan | Africa | ⛔ | N | **Sanctions** — block. |
| 121 | Somalia | Africa | ⛔ | N | **Sanctions / conflict** — block. |
| 122 | Mali | Africa | ⚠️ | N | **Targeted sanctions** — review. |
| 123 | Central African Republic | Africa | ⚠️ | N | **Targeted sanctions** — review. |
| 124 | DR Congo | Africa | ⚠️ | N | **Targeted sanctions** — review. |
| 125 | Afghanistan | Asia | ⛔ | N | **Sanctions / Taliban controls** — block. |
| 126 | Myanmar (Burma) | Asia | ⛔ | N | **Sanctions** — block. |
| 127 | Eritrea | Africa | ⚠️ | N | High-risk — review/likely decline. |
| 128 | Vatican City / Monaco / San Marino / Andorra | Europe micro | ⚠️ | N | Tiny; handle case-by-case via neighbouring pack. |

**Headline:** of 128 rows, approximately **57 OFFER ✅**, **53 RESTRICTED ⚠️** (manual review), and **18 BANNED ⛔**. (Counts are indicative — the live sanctions feed is authoritative; ⚖️ counsel must ratify before this gates real signups.)

---

## 7. Accessibility law (reinforces WCAG 2.2 AA work)

| Law | Territory | Requirement | Propvora impact |
|---|---|---|---|
| **EU European Accessibility Act (EAA)** | EU | Enforceable from **28 Jun 2025**; private digital services must meet **EN 301 549 / WCAG 2.1 AA**. Micro-enterprises (<10 staff, ≤€2m) exempt from *service* obligations — Blackwellen may exceed this at scale. ([Level Access](https://www.levelaccess.com/blog/eu-accessibility-requirements-and-eaa-compliance/), [AudioEye](https://www.audioeye.com/post/eu-digital-accessibility/)) | The marketing site, app, portals, and booking pages serving EU consumers must meet WCAG. Propvora's existing **WCAG 2.2 AA** target exceeds the EAA's WCAG 2.1 AA floor — good. |
| **US ADA + Section 508** | US | ADA Title III applied to commercial websites by case law; 508 for federal. | Reinforces accessibility QA (`accessibility-qa-skill`). |
| **Canada ACA / AODA (Ontario)** | CA | Accessible Canada Act + provincial (AODA) → WCAG 2.0 AA. | Same QA gate. |

**Build implication:** none new beyond keeping the **WCAG 2.2 AA** discipline already in the skill set; add an **accessibility statement** page per region (a legal-page variant). The EAA is a *reason the existing a11y work is now legally load-bearing in the EU*, not a new build.

---

## 8. Marketing / communications law

| Law | Territory | Rule | Build impact |
|---|---|---|---|
| **CAN-SPAM** | US | Opt-**out**; accurate headers; physical address; honour unsubscribe ≤10 days. | Email footer + unsubscribe (Resend). |
| **CASL** | Canada | **Opt-in** for commercial email; identity + unsubscribe; **keep consent records**; fines to CAD 10m. ([Global Relay](https://www.globalrelay.com/resources/the-compliance-hub/compliance-insights/casl-canadas-anti-spam-law-compliance-in-digital-marketing/)) | Per-contact consent ledger; region-aware send logic. |
| **GDPR / PECR (ePrivacy)** | EU/UK | **Opt-in** marketing + cookie consent; soft opt-in narrow. | Region-aware cookie banner (`cookie-consent-privacy-ui`) + consent capture. |

**Build implication:** the contact/notification layer (`contacts`, `notifications`, Resend integration) must store **per-contact, per-channel consent with timestamp + source + region**, and the send engine must **suppress** where consent is absent under the contact's regime. Cookie consent must be **region-conditional** (opt-in EU/UK; notice-only US).

---

## 9. Cross-cutting build implications by app section

| Section (route) | Biggest international change |
|---|---|
| **Portfolio** (`/app/portfolio`) | Property gains `country_code`, `legal_jurisdiction`, `currency`, `area_unit`, address model; multi-country portfolio dashboard; unsupported-country "generic mode" banner. |
| **Money** (`/app/money`, `/app/accounting`) | Multi-currency + FX; per-country VAT/GST/sales-tax invoice fields; B2B/B2C; reverse-charge; OSS/GST reporting; e-invoice formats. **Heaviest tax surface.** |
| **Compliance** (`/app/compliance`) | UK gas/electrical/EPC/HMO checks are **UK-only** today → must become country-pack-gated (disabled or "research-only" outside reviewed packs). |
| **Legal** (`/app/legal` — `rra-2026`, `hmo-licences`, `possession`, `epc-advisory`) | Entirely **UK-statute-specific**. Must be **hard-gated to GB packs**; everywhere else show "no reviewed legal pack — generic evidence only." |
| **Work** (`/app/work`) | Country-aware emergency categories, supplier tax on invoices, timezone/SLA, holidays; marketplace dispatch by property locality. |
| **Planning** (`/app/planning`) | Yield/forecast assume GBP + UK tax (MTD ITSA). Currency + tax-regime aware; disable UK-specific landlord-offer logic outside GB. |
| **Contacts** (`/app/contacts`) | Per-contact consent/marketing region; address/phone formats. |
| **Calendar** (`/app/calendar`) | Locale date/number formats; per-country holidays; timezone correctness. |
| **Portals** (`/app/portals`) | Tenant vs guest vs supplier portal privacy notices per region; portal-language. |
| **Admin / Workspace settings** | New **Global Setup**, **Country Packs**, **Representatives & Authorities**, **data_region**, **subprocessors**, sanctions/eligibility control plane. |
| **Affiliate / Partners** (`/app/money/affiliate`) | Payout-country matrix, sanctions screening of payees, per-country affiliate terms + disclosure, tax forms. |

---

## 10. Top legal risks needing counsel (ranked)

1. **Sanctions / eligibility gating** ⚖️ — getting OFFER/RESTRICTED/BANNED wrong (or hardcoding a stale list) risks OFAC/OFSI breach. Must use a live screening feed + counsel-ratified policy before any non-UK signup.
2. **Per-jurisdiction tax registration & invoicing** 🧾 — EU OSS, US sales-tax nexus, AU/NZ/CA/IN GST. Wrong-tax invoices create liability and customer-trust damage; adopt a tax engine + register per phase.
3. **GDPR Art 27 / FADP / LGPD representative & DPO appointments** ⚖️ — required *before* EU/CH/BR launch; non-appointment is independently finable.
4. **"Legal/compliance intelligence" outside reviewed packs** ⚖️ — Propvora's UK tenancy/compliance features presented in an unsupported country could be construed as unauthorised legal advice or mislead users. Hard-gate + disclaimers are essential.
5. **Consumer withdrawal/auto-renewal + data-transfer mechanism validity** ⚖️ — EU 14-day withdrawal + 2026 mandatory cancel button; US auto-renewal laws; and the **DPF/SCC/IDTA** chain staying valid (DPF adequacy review). Mis-handling either invites regulator + consumer-body action.

---

## 11. Sources

- GDPR Art 27: https://gdpr-info.eu/art-27-gdpr/ · https://gdprlocal.com/gdpr-art-27-requirements-explained/
- EU AI Act timeline / Omnibus: https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/
- DPF / UK Extension: https://www.dataprivacyframework.gov/Program-Overview · https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/adequacy-regulations/how-does-the-uk-extension-to-the-eu-us-data-privacy-framework-work/
- Canada PIPEDA / Bill C-27 lapse: https://help.rollworks.com/hc/en-us/articles/19475094782989-Canadian-Privacy-Laws-Law-25-and-Canadian-Consumer-Privacy-Protection-Act-CPPA
- Quebec Law 25: https://usercentrics.com/knowledge-hub/quebec-law-25/ · https://ankura.com/insights/quebec-privacy-bill-64-law-25
- Australia reforms: https://www.fticonsulting.com/insights/articles/australian-privacy-law-reforms-take-effect · https://iapp.org/news/a/australia-approves-first-privacy-act-reforms-social-media-ban-for-minors
- India DPDP Rules 2025: https://ksandk.com/data-protection-and-data-privacy/indias-new-cross-border-data-transfer-framework/ · https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Rules,_2025
- Switzerland FADP: https://secureprivacy.ai/blog/switzerland-new-federal-act-data-protection-fadp-key-changes-compliance · https://www.dataguidance.com/jurisdictions/switzerland
- Turkey KVKK: https://www.mydata-trust.com/turkish-data-privacy-law/
- US state privacy: https://iapp.org/resources/article/us-state-privacy-laws-overview · https://www.multistate.us/insider/2026/2/4/all-of-the-comprehensive-privacy-laws-that-take-effect-in-2026
- EU VAT OSS digital: https://1stopvat.com/articles/eu-vat-saas-companies · https://www.taxually.com/blog/when-and-where-to-charge-eu-vat-on-digital-services
- US sales tax SaaS: https://www.anrok.com/saas-sales-tax-by-state · https://www.salestaxinstitute.com/resources/expanding-digital-tax-net-digital-goods-services-2025
- GST AU/CA/NZ/IN: https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst · https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/digital-economy-gsthst/find-out-need-register/cross-border-threshold-amounts.html · https://support.taxually.com/support/solutions/articles/80001177064 · https://www.anrok.com/vat-software-digital-services/india
- ViDA / e-invoicing: https://www.pwc.lu/en/newsletter/2025/vat-in-the-digital-age-vida.html · https://www.fiskaly.com/blog/e-invoicing-mandates-in-europe-2026
- Stripe global / countries: https://stripe.com/global · https://www.cs-cart.com/blog/stripe-supported-countries/ · https://dodopayments.com/blogs/stripe-supported-countries-alternatives
- Sanctions: https://www.sanctionscanner.com/blog/list-of-sanctioned-countries-by-ofac-un-and-eu-2025-1103 · https://orpa.princeton.edu/export-controls/sanctioned-countries
- EAA accessibility: https://www.levelaccess.com/blog/eu-accessibility-requirements-and-eaa-compliance/ · https://www.audioeye.com/post/eu-digital-accessibility/
- EU consumer withdrawal: https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm · https://www.taylorwessing.com/en/insights-and-events/insights/2026/02/withdrawal-button-as-compliance-risk-for-eu-and-non-eu-businesses
- CASL/CAN-SPAM: https://www.globalrelay.com/resources/the-compliance-hub/compliance-insights/casl-canadas-anti-spam-law-compliance-in-digital-marketing/
