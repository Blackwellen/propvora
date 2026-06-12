# Propvora: Commercial Audit, Competitive Assessment & Feature Roadmap

*Generated: June 2026 | Live competitor research + full codebase audit*

---

## PART 1 — WHAT PROPVORA HAS (CODEBASE AUDIT SUMMARY)

**Core Sections Built:**
- **Portfolio** — property/unit management
- **Compliance** — 9-tab section: Overview, Certificates, Inspections, Documents, Evidence, Coverage, Supplier Docs, Reports, Activity
- **Money** — finance, rent tracking, reporting
- **Maintenance** — work order management
- **Contacts/CRM** — tenants, landlords, suppliers
- **Documents** — document management
- **AI Copilot** — in-app AI assistant
- **Workspace Settings** — team, billing, SSO, branding, white-label, integrations, storage, demo data, audit logs, data exports, danger zone
- **Supplier Portal** — dedicated supplier-facing experience
- **Affiliate Portal** — referral/affiliate programme
- **Admin Panel** — platform-level administration

**Infrastructure:** 23+ Supabase migrations, 100+ tables, full RLS, 130+ components, React Query, Next.js 16 App Router.

**Assessment:** This is a fully built product — not a scaffold. Every section has real pages. The foundation is strong and modern.

---

## PART 2 — THE COMPETITIVE LANDSCAPE

### Where Propvora Sits

The UK property management market has a structural gap that Propvora is perfectly positioned to own:

```
US Platforms (DoorLoop, AppFolio, Buildium)
  ✅ Modern UX, AI investment
  ❌ Zero UK regulatory depth — no MTD, no Section 8, no HMO licence tools

UK Platforms (Arthur, Coho, Landlord Vision, Latch)
  ✅ UK compliance depth
  ❌ Minimal AI, dated UX, no agent-level intelligence

PROPVORA'S WHITE SPACE:
  ✅ UK-regulatory-native
  ✅ AI-first architecture
  ✅ Modern UX
  ← This gap is real and currently unoccupied at SMB/professional tier
```

### UK Market Tier Structure

| Tier | Monthly Cost | Target | Examples |
|---|---|---|---|
| Free | £0 | Accidental landlords | August (2 units), Latch (3 leases) |
| Entry | £8–£20 | Small portfolio landlords | August £8.99, Landlord Studio £12 |
| Mid | £20–£50 | Growing portfolios | Latch £40, Coho £30, Landlord Vision £20–£50 |
| Agency | £70–£150 | Letting agents, 20+ properties | Arthur £70–£126 |
| Enterprise | £200+ | Large operators, agencies | MRI, Yardi, Reapit |

### Competitor Pricing (UK 2026)

| Platform | Entry | Mid | Agency |
|---|---|---|---|
| August | Free → £8.99 → £29.99 | — | — |
| Latch | Free → £20 → £40 | — | — |
| Landlord Studio | Free → £12 + £1/unit | — | — |
| Coho | — | £30 (12 units) | £2.50/unit above 12 |
| Arthur Online | — | — | £70–£126/mo |
| Landlord Vision | £20 | £50 | £85 |
| Re-Leased | — | — | Custom (enterprise) |
| MRI Software | — | — | Custom (enterprise) |

**The gap:** There is almost nothing solid between £40 (Latch/Coho) and £70 (Arthur). A feature-rich platform at £50–£65 for professional landlords is uncontested.

### Key Competitors — Quick Profiles

**Arthur Online** — Most established UK SMB platform. HMO and multi-type portfolio support, Xero integration, contractor management. £70–£126/month. High learning curve. No AI.

**Coho** — Purpose-built for HMOs. Room-level rent tracking, Open Banking, GoCardless. £30/month. Best HMO-native in market. No AI, limited team features.

**Landlord Vision** — UK-first, compliance-heavy, double-entry accounting, MTD-ready. £20–£85/month. Weak on HMO depth. No AI.

**Latch** — New UK entrant. Claims AI-first. Free → £40. Good MTD, basic compliance. Early stage; marketing-led AI claims.

**AppFolio (US)** — Highest AI maturity: Realm-X autonomous leasing agent handles 90% of prospect enquiries, saves 10hrs/week/agent. Not UK-deployed. Min 50 units.

**Re-Leased** — Commercial-first. Has "Credia" AI suite: AI lease ingestion, NL Q&A, in-workflow recommendations. No residential HMO depth.

**Brickwise AI** — YC-backed (2025) UK startup. Voice AI (Alice) handles inbound calls, maintenance triage, contractor coordination. $4/tenant/month. Proof that AI property management at this layer works.

**Fixflo** — Maintenance specialist. 1.2M+ units. Best-in-class contractor management. Integrates with other platforms. Not a full PM platform.

---

## PART 3 — AI FEATURES ACROSS THE MARKET

| Platform | AI Capability | Maturity |
|---|---|---|
| AppFolio (Realm-X/Lisa) | Autonomous leasing agent, AI maintenance dispatch, invoice processing, owner statement generation | Production — highest in market |
| Re-Leased (Credia) | Lease ingestion, NL Q&A over lease data, in-workflow recommendations | Production |
| Brickwise AI (Alice) | Voice AI handles inbound calls 24/7, maintenance triage, contractor coordination, multi-channel | Production (UK-focused) |
| DoorLoop | AI Assistant + AI Inspections, handles 80% of tenant requests | Production |
| Landlord Studio | AI bank transaction categorization, smart receipt scanner | Production (narrow) |
| Latch | Claims AI rent chasing, document analysis, Open Banking reconciliation | Early-stage / marketing-led |
| Lendlord | AI yield analysis (May 2025), claims 30% yield improvement | Early-stage |
| LandlordOS | AI extracts expiry dates from uploaded certificates | Narrow |
| Arthur Online | Rule-based workflow automation only. No LLM-based AI. | Automation, not AI |
| Coho | AI-powered payment matching via Open Banking | Narrow |

### What No Platform Does Well (AI Gaps)

- Fully autonomous Section 8 notice preparation with auditable evidence bundles
- AI-predicted tenant risk scores using behavioural + financial data
- Proactive portfolio rebalancing recommendations (re-let vs sell analysis)
- AI energy efficiency advisory tied to EPC upgrade paths
- Natural-language portfolio Q&A ("How much did I spend on repairs at 12 Baker St last year?")
- AI-assisted HMO licence application drafting
- AI agentic rent chase with Ground 8 legal evidence chain (not just email sequences)

---

## PART 4 — UK REGULATORY CONTEXT

### Critical Regulatory Landscape (2026)

**Renters' Rights Act 2026 (England)**
- Section 21 abolished 1 May 2026. All existing tenancies converted to assured periodic.
- Possession now via Section 8 only. Ground 8 (2-months arrears) requires timestamped payment records.
- Fines up to £40,000 for non-compliance. Banning orders. Rent repayment orders.
- Periodic tenancy = no fixed end date; software must accommodate ongoing tenancies indefinitely.

**Making Tax Digital (MTD ITSA)**
- April 2026: mandatory for landlords with gross income >£50k
- April 2027: >£30k threshold
- April 2028: >£20k threshold
- Requires quarterly HMRC digital submissions via HMRC-recognised software. Massive software adoption forcing function.

**HMO Licensing**
- Mandatory licence: 5+ occupants in 3+ storeys (national minimum)
- Additional/selective licensing varies by council
- Licence conditions: room size standards, fire safety, management obligations
- Renewal every 5 years typically — needs tracking

**Deposit Protection**
- All deposits must be protected within 30 days in DPS, TDS, or mydeposits
- Prescribed information must be served to each tenant individually
- HMOs: each room tenancy requires separate deposit protection
- Non-protection bars Section 8 possession claims

**Right to Rent**
- Required for all adult tenants before tenancy starts
- Records retained for 1 year post-tenancy
- Digital checks now available via IDVT (Yoti, iProov)

**EPC Minimum Standards**
- Currently EPC E minimum for new lets
- Government target: EPC C by 2030 for new tenancies
- Significant opportunity for AI-assisted EPC improvement advisory

**Gas Safety / EICR / Fire Safety**
- Gas Safety: annual, records retained 2 years, copy to tenant within 28 days
- EICR: every 5 years, remedial works within 28 days
- HMOs: additional fire safety obligations (fire doors, detection, extinguishers)

---

## PART 5 — WHAT PROPVORA HAS THAT COMPETITORS LACK

| Propvora Feature | Competitor Status |
|---|---|
| AI Copilot (in-app) | Arthur: none. Landlord Vision: none. Coho: none. |
| White-label workspace branding | Only at enterprise tier (£200+/month) elsewhere |
| SAML / SSO | Enterprise-only everywhere else |
| Affiliate portal | No competitors have this |
| Supplier/contractor portal | Fixflo has a contractor app; nobody else at SMB |
| Audit logs | Only Arthur at agency tier |
| Demo data | Rare — good for onboarding/sales demos |
| 9-tab compliance section | More granular than any competitor |
| Evidence sub-section | Unique — no competitor has a dedicated evidence store |
| Coverage tracking | Unique framing — competitors do basic certificate reminders |

**These are genuine advantages.** The white-label, SSO, affiliate, and supplier portal put Propvora ahead of Arthur (£70–£126/month) on features — and Propvora isn't priced yet.

---

## PART 6 — CRITICAL GAPS TO FILL

Ranked by commercial impact (urgency × market gap × willingness to pay):

---

### TIER 1 — LEGALLY CRITICAL

**1. Post-Section 21 Possession Readiness Engine**

Section 21 abolished May 2026. No competitor has this at SMB price points.

What to build:
- Automated timestamped payment evidence log (extends Money section)
- Section 8 notice wizard (Ground 8 mandatory arrears + other grounds)
- Formal notice tracking: served date, expiry date, tenant acknowledgement
- Court bundle generator: PDF with payment history, comms log, all served notices
- Possession progress tracker: notice served → court issued → hearing → enforcement

**Why it wins:** Fines up to £40,000. Every English landlord is legally exposed right now. High fear, high willingness to pay.

---

**2. Making Tax Digital (MTD ITSA) Full Compliance**

April 2026 deadline for £50k+ income — mandatory, not optional.

What to build:
- HMRC-recognised quarterly digital submissions (HMRC API integration)
- AI-suggested expense categorizations (allowable vs non-allowable)
- Capital allowances tracking
- CGT event logging (disposals, improvements)
- Self-Assessment SA105 property income summary
- "Tax readiness score" showing completeness before quarterly deadline

**Why it wins:** MTD is pushing hundreds of thousands of landlords to new software in 2026–2028. Biggest acquisition driver in the market.

---

### TIER 2 — UNIQUE DIFFERENTIATORS

**3. Rent-to-Rent (R2R) Module**

Zero competitors have R2R-specific tooling. Growing operator segment with no dedicated software.

What to build:
- Dual-ledger: what you pay the owner vs what you receive from tenants
- Guaranteed rent contract management (promised vs actual received)
- Subletting legal compliance documentation per property
- Owner-facing portal: sees guaranteed rent only, no subletting margin visibility
- Tenant-facing portal: standard tenant experience
- R2R cash flow modelling: gross income − owner cost = operating margin
- Subletting clause generator for ASTs

**Why it wins:** Zero competition. R2R operators are underserved and growing fast. Creates an entirely new addressable segment.

---

**4. HMO Utility Management Module**

Universal HMO pain point. No software solution exists anywhere.

What to build:
- Utility cost input per property (electricity, gas, water, broadband, council tax)
- Automatic cost splitting across rooms (by occupancy date, floor area, or equal split)
- Tenant-facing utility invoice generation
- Meter reading log with photo upload
- Utility provider contact directory per property
- Smart meter API integration (SMETS2 via n3rgy/Hildebrand)
- Annual utility cost trends per property

**Why it wins:** HMO landlords spend hours on spreadsheets doing this monthly. Could be a standalone subscription upsell.

---

**5. Contractor Marketplace (extend existing Supplier Portal)**

"Finding a reliable contractor" is the top operational pain point for landlords. Platforms track work orders but don't solve the discovery problem.

What to build:
- Vetted contractor directory (GasSafe, NICEIC, NAPIT registered)
- Postcode-based contractor matching to maintenance jobs
- Contractor profiles: trades, coverage areas, ratings, insurance expiry, certifications
- Automated contractor dispatch on job creation
- Revenue model: contractor monthly subscription (£30–£60) or per-job referral fee

**Why it wins:** B2B revenue stream from contractors, not just landlords. Fixflo has a contractor network but it's agent-facing and expensive. Nothing at SMB.

---

### TIER 3 — AI DIFFERENTIATION

**6. Agentic AI Rent Chase with Legal Evidence Chain**

Extends existing AI Copilot. Platforms claim AI rent chasing but it's just scheduled emails.

What to build:
- Real-time Open Banking payment monitoring (missed payment detected within hours)
- AI decides communication tone: friendly reminder → formal notice → legal escalation
- Multi-channel escalation: email → SMS (Twilio) → WhatsApp Business API
- All communications timestamped and logged to tenancy record automatically
- Auto-prepares Ground 8 evidence file when arrears hit 14 days
- Human escalation trigger with full context handoff
- "Rent Chase Status" dashboard per tenancy

**Why it wins:** Brickwise does this for maintenance. Nobody applies it to arrears + legal evidence for UK landlords. Post-Section 21 world makes the evidence chain legally critical.

---

**7. AI Yield & Room Pricing Intelligence (HMO-Specific)**

What to build:
- Live market rent data integration (Rightmove rental listings)
- Per-room yield calculation vs local comparable rooms
- AI recommendation: "Room 3 is £150/month below market — raising to £850 would add £1,800/year"
- Void cost calculator: days void before a rent increase pays back the void risk
- Seasonal demand signals for SA units
- Portfolio yield benchmarking vs local averages

**Why it wins:** Lendlord claims 30% yield improvement with AI pricing, but only for standard lets. For HMO room-level pricing, nothing exists.

---

**8. AI Certificate & Lease Intelligence**

Extends AI Copilot to be document-aware.

What to build:
- Upload certificate (Gas Safety, EICR, EPC) → AI extracts: property, expiry date, issuing engineer, pass/fail, and auto-populates compliance record
- Upload lease → AI extracts: rent amount, break clauses, rent review dates, tenant names, special conditions, creates structured summary
- Natural-language Q&A: "Which properties have EICR expiring in 90 days?" / "What's my total outstanding rent?"

---

### TIER 4 — TABLE STAKES GAPS

**9. eSignature for Tenancy Agreements**
Every serious competitor has this. DocuSign/HelloSign integration or native signing flow. Digital AST creation + multi-party signing + automatic document storage.

**10. WhatsApp Business API Tenant Communications**
Twilio or 360dialog integration. Rent reminders, maintenance requests, document delivery via WhatsApp — all logged with timestamps against the tenancy record. 88% of renters prefer mobile. No mainstream UK platform has built this.

**11. Open Banking Rent Collection & Reconciliation**
TrueLayer/Yapily integration. Automatic transaction matching to expected rent payments. GoCardless Direct Debit rent collection. One-click monthly reconciliation.

**12. Tenant Referencing Integration**
Canopy API integration (open API available). One-click reference request from prospective tenant record. Reference status tracking. Right to Rent digital check (IDVT — Yoti/iProov).

**13. Portal Listing Syndication**
Create vacancy → publish to Rightmove/Zoopla/OnTheMarket. Applicant enquiry inbox. Viewing scheduler. Convert applicant to prospective tenant when referencing starts.

**14. Owner Portal for Property Managers**
Per-landlord portal: monthly owner statement, portfolio dashboard, maintenance visibility, compliance visibility. Extends white-label capability already in workspace settings. Unlocks the independent property manager market (10–100 properties).

**15. Scotland / Wales Regulatory Parity**
- Scotland: PRT tenancy type, pre-tenancy information packs, First-tier Tribunal tools, rent pressure zone awareness, LARN registration tracking
- Wales: Rent Smart Wales registration tracking, Welsh-language option

---

## PART 7 — PRICING STRATEGY RECOMMENDATION

```
STARTER      £29/month    Up to 10 properties    Individual landlords
PROFESSIONAL £59/month    Up to 30 properties    Growing portfolios, HMO operators
AGENCY       £99/month    Unlimited properties   Property managers, R2R operators
ENTERPRISE   Custom       White-label + SSO      Large agencies, multi-brand
```

**Paywalled at Professional:** MTD submissions, HMO utility management, Open Banking, WhatsApp comms, eSignature, AI rent chase, yield intelligence, owner portal

**Paywalled at Agency:** White-label, multi-landlord client management, contractor marketplace, R2R module, advanced API access

**Why this works:** The £40–£80 gap in the UK market is real and uncontested. Latch tops out at £40 with limited features. Arthur starts at £70 with a steep learning curve. A polished £59/month product with AI rent chase, MTD, and HMO utility tools owns that gap outright.

---

## PART 8 — PRIORITISED BUILD ROADMAP

### Immediate (1–4 weeks each) — Legal & Commercial Gaps

| # | Feature | Rationale |
|---|---|---|
| 1 | Section 8 Possession Wizard | Unique timing, no competition, high fear purchase |
| 2 | MTD ITSA Quarterly Submissions | Mandatory April 2026 for £50k+ income — massive acquisition driver |
| 3 | Open Banking Rent Reconciliation | TrueLayer/Yapily — automates manual CSV import |
| 4 | eSignature for Agreements | Table stakes — every competitor has it |
| 5 | WhatsApp Business API Comms | Differentiated, mobile-first, legal audit trail |

### Short-Term (4–8 weeks each) — Competitive Moat

| # | Feature | Rationale |
|---|---|---|
| 6 | HMO Utility Management Module | Zero competition, universal HMO pain point |
| 7 | Rent-to-Rent Dual-Ledger Module | Only platform in UK market |
| 8 | Contractor Marketplace (extend Supplier Portal) | B2B revenue stream + top landlord pain point |
| 9 | AI Certificate Extraction | Extends AI Copilot, auto-parse uploaded certificates |
| 10 | Tenant Referencing Integration (Canopy API) | Table stakes for serious landlords |

### Medium-Term (6–12 weeks each) — Premium AI Features

| # | Feature | Rationale |
|---|---|---|
| 11 | Agentic AI Rent Chase with Evidence Chain | Multi-channel, legal-grade timestamping, post-Section 21 |
| 12 | AI Yield & HMO Room Pricing Intelligence | Rightmove data + AI recommendations |
| 13 | Portfolio Intelligence Dashboard | Benchmarking, void analytics, asset performance |
| 14 | Owner Portal for Property Managers | Unlock agency/property manager market |
| 15 | SA + AST Hybrid Management | Airbnb/Booking.com + AST compliance in one platform |

### Longer-Term — Market Expansion

| # | Feature |
|---|---|
| 16 | Scotland PRT compliance |
| 17 | Wales (Rent Smart Wales) compliance |
| 18 | AI tenant risk scoring (behavioural + financial) |
| 19 | EPC upgrade advisory + grant navigator |
| 20 | Listing syndication (Rightmove/Zoopla vacancy publishing) |

---

## PART 9 — THE PROPVORA MOAT

**Propvora is the only UK property management platform that is simultaneously UK-regulatory-native, AI-first, HMO/R2R/SA specialist, and priced for the professional landlord — a combination no current competitor can replicate without a complete rebuild.**

The five features that create a genuinely defensible moat, none of which exist anywhere else at SMB price points:

1. **Post-Section-21 possession readiness** — legal urgency, no competition
2. **Rent-to-Rent dual-ledger** — zero competition in the entire market
3. **Agentic AI rent chase with Ground 8 evidence chain** — legal-grade AI nobody has
4. **HMO utility management** — universal pain, no software solution exists
5. **SA + AST hybrid channel management** — unserved operator type

Build those five. Price at £59/month Professional. Let the feature list do the rest.

---

*Sources: August, AgentHMO, Coho, Arthur Online, Re-Leased, AppFolio, DoorLoop, Buildium, Landlord Studio, Latch, Brickwise AI, Fixflo, Landlord Vision, Goodlord, Lendlord, MRI Software, PaTMa, NRLA, HMRC MTD guidance, Kamma, LetHub, Wonderful.co.uk — researched June 2026*
