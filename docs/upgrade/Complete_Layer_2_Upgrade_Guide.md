# Complete Layer 2 Upgrade Guide

**Product:** Propvora  
**Layer:** Layer 2  
**Generated:** 2026-06-15  

> This guide is an implementation planning document, not legal, tax, financial, payment, identity, insurance, employment, consumer, property or regulatory advice. Every country pack, payment flow, marketplace flow, supplier verification claim, legal template, tax workflow, dispute workflow and escrow-like flow needs qualified review before production.

---

## 0. Executive Decision

Layer 2 should turn Propvora from a strong UK property-management SaaS into a context-aware operating platform with three connected surfaces:

1. **Operator workspace:** landlords, HMO operators, rent-to-rent operators, serviced accommodation operators, property managers and agencies manage properties, bookings, compliance, money, suppliers, automations and reporting.
2. **Supplier workspace:** contractors, cleaners, trades, compliance assessors, emergency suppliers and service teams manage leads, jobs, availability, evidence, invoices, payouts, licences, insurance and reviews.
3. **Customer workspace:** tenants, guests, booking customers, landlords/owners and other external parties interact through lightweight portals, magic links or accounts.

Do not jump straight to a full Airbnb clone or broad public supplier marketplace. The correct order is:

1. Build the **Context Engine** so every action knows actor, workspace, country, property, operation type, legal/compliance mode, money type, marketplace type and risk level.
2. Upgrade **manual supplier records** and the existing supplier portal before launching an open marketplace.
3. Build **direct booking management** before public booking discovery.
4. Build **free supplier onboarding** and paid supplier add-ons before imposing supplier subscriptions.
5. Monetise bookings and supplier jobs through **low transparent commission**, starting at 2.5% and moving selected categories toward 5% after proof.
6. Build **Smart Recipes** first, then natural-language automation drafting, then Canvas Lite, then a richer node canvas.
7. Treat identity, verification, escrow wording, country packs, legal automation and payment release as high-risk surfaces requiring explicit review gates.

Core product line:

```text
Propvora Core SaaS
  + Context Engine
  + Booking Management
  + Supplier Workspace
  + Customer Workspace
  + Supplier Marketplace
  + Direct Booking Pages
  + Marketplace Payments/Commission
  + Trust and Verification
  + Smart Recipes / Automation Canvas
```

---

## 1. Current Commercial Baseline

The codebase already has a canonical plan catalog in `src/lib/billing/plans.ts` and `src/lib/billing/catalog.generated.json`:

| Current tier | Monthly | Annual | Current positioning |
|---|---:|---:|---|
| Starter | GBP 29 | GBP 290 | 5 properties, 1 seat, compliance/rent basics |
| Operator | GBP 79 | GBP 790 | 25 properties, 3 seats, advanced reports |
| Scale | GBP 149 | GBP 1,490 | 100 properties, 10 seats, AI Copilot, portals/accounting |
| Pro / Agency | GBP 299 | GBP 2,990 | 500 properties, 25 seats, white-label ready |
| Enterprise | Custom | Custom | Unlimited, SSO/SAML, dedicated support |

Current add-ons are extra seat, +10 properties, white-label branding, AI credit pack and onboarding/migration. The public pricing page currently uses an older `Starter / Pro / Business` structure, so after this guide is accepted the public page should be reconciled with the canonical Stripe catalog.

The key commercial decision for Layer 2 is to **keep the current base SaaS prices initially** and add value through entitlements, operator add-ons, supplier add-ons and marketplace commissions. Changing base prices at the same time as adding a marketplace would create unnecessary billing migration risk.

---

## 2. New Competitor and Fee Audit

The previous commercial audit established a UK SaaS pricing gap between low-cost landlord tools and agency platforms. Layer 2 adds a second competitor set: supplier directories, lead marketplaces, task marketplaces, contractor networks and OTAs.

Current online checks support a simple commercial conclusion: supplier entry should be free, paid supplier plans should be optional, and successful marketplace transactions should carry a low transparent fee. Checkatrade shows paid trade memberships are normal but can become a barrier. MyBuilder shows free entry plus shortlist/lead economics are familiar to trades. Rated People shows subscription-style supplier access can work later. Taskrabbit and OTAs show service/booking fees are accepted in marketplaces, but often feel heavy. Fixflo contractor-network material shows property operators may add works management fees, leaving room for Propvora to charge a lower and clearer fee. Stripe Connect supports application fees, but the payment architecture must be described precisely.

Sources checked online on 2026-06-15:

- https://www.checkatrade.com/blog/trade/grow-business/checkatrade-membership-roi/
- https://support.mybuilder.com/s/article/What-are-the-fees
- https://support.mybuilder.com/s/article/How-are-lead-fees-calculated
- https://www.ratedpeople.com/tradespeople/signup/enquiry
- https://www.ratedpeople.com/help/faqs/what-is-the-unlimited-plan
- https://support.taskrabbit.com/hc/en-us/articles/46260411872155-What-s-the-Taskrabbit-Service-Fee
- https://support.taskrabbit.com/hc/en-us/articles/46260504648731-What-s-the-Taskrabbit-Trust-Support-Fee
- https://www.airbnb.com/help/article/1857
- https://partner.booking.com/en-us/help/commission-invoices-tax/commission/understanding-your-commission
- https://docs.stripe.com/connect/marketplace/tasks/app-fees
- https://www.fixflo.com/features/contractor-marketplace
- https://help.fixflo.com/support/solutions/articles/61000302114-novex-faqs

### 2.1 Pricing Conclusion

The upgraded model should be:

```text
Operator SaaS subscription: current tier prices retained.
Supplier free tier: permanent GBP 0 entry.
Supplier paid upgrades: profile, team, emergency, verification, promoted placement, automation and AI.
Supplier marketplace commission: 2.5% default; selected emergency/high-support categories up to 5% or fixed minimum.
Direct booking pages: 0% intro, then 0-1% or plan-included.
Public booking marketplace: 2.5% default; selected categories up to 5% after traction.
Manual/private supplier jobs: 0% commission.
Manual/private bookings tracked only: 0% commission unless payment is processed through Propvora.
```

This keeps Propvora cheaper than OTA norms, less hostile than paid lead directories, and still creates non-subscription revenue.

---

## 3. Product Architecture

Layer 2 requires five architecture pillars.

### 3.1 Context Engine

Every route, action, AI response and automation run should resolve a shared context object. Context must include:

```text
actor context
workspace context
country context
property context
operation profile context
money context
legal context
compliance context
booking context
supplier context
customer context
marketplace context
automation context
permission context
risk context
```

The app cannot safely handle UK ASTs, HMOs, R2R, serviced accommodation, global portfolios, booking deposits, supplier payouts, marketplace commission and legal workflows if it treats them as generic records.

Recommended module:

```text
src/lib/context/
  context-resolver.ts
  actor-context.ts
  workspace-context.ts
  country-context.ts
  property-context.ts
  operation-context.ts
  money-context.ts
  legal-context.ts
  compliance-context.ts
  booking-context.ts
  supplier-context.ts
  customer-context.ts
  marketplace-context.ts
  ai-context.ts
  automation-context.ts
  permission-context.ts
  risk-context.ts
  route-context.ts
  context-types.ts
```

The resolver should be called by page loaders, server actions, API routes, AI tools, automation workers and payment webhooks. It should return allowed actions, disabled reasons, jurisdiction mode, feature flags, entitlement state, audit metadata and risk classification.

### 3.2 Workspace Type Shells

The product should support separate shells rather than trying to force all users into the operator app:

```text
/app/*                    Operator workspace
/supplier-portal/*        Supplier workspace
/customer/* or /portal/*  Customer, tenant, guest or landlord portal
/admin/*                  Platform admin
/marketplace/*            Public/logged-in marketplace discovery
/book/*                   Public direct booking pages
```

Each shell needs its own navigation, permissions, empty states, mobile behaviour and audit policy.

### 3.3 Marketplace Kernel

Supplier jobs and booking reservations should share a transaction kernel:

```text
marketplace_transactions
  id
  transaction_type: supplier_job | stay_booking | service_package | emergency_job | booking_extra
  buyer_workspace_id
  buyer_user_id
  seller_workspace_id
  seller_user_id
  listing_id
  reservation_id
  supplier_job_id
  currency
  gross_amount
  platform_fee_percent
  platform_fee_amount
  provider_fee_amount
  seller_payout_amount
  tax_amount
  payment_provider
  payment_intent_id
  transfer_id
  hold_status
  payout_status
  refund_status
  dispute_status
  risk_status
  created_at
  updated_at
```

The system should not hardcode 2.5%. It should use fee rules:

```text
marketplace_fee_rules
  country_code
  transaction_type
  plan_tier
  category
  fee_percent
  minimum_fee
  maximum_fee
  provider_fee_pass_through
  active
```

### 3.4 Trust and Verification

The verification layer must be honest. Day-one verification should be layered:

```text
Level 0: Unverified
Level 1: Email verified
Level 2: Phone verified
Level 3: Payout verified via Stripe Connect
Level 4: Document evidence uploaded
Level 5: Admin reviewed
Level 6: Provider verified later, for example Stripe Identity / Persona / Veriff / Onfido
```

Badge text should avoid overclaiming. Use phrases like `Payout verified`, `Insurance evidence reviewed`, `Gas Safe evidence reviewed`, `Admin reviewed` and `Verification expired` rather than `fully government verified` unless a real provider and legal review support that claim.

### 3.5 Automation Stack

The automation layer should be Propvora-specific, not a generic Zapier clone:

```text
Smart Recipes -> Natural Language Drafting -> Canvas Lite -> Advanced Canvas
```

Restricted actions must require approval or be blocked, especially legal notices, payment release, refunds, destructive data actions, supplier suspension and automated external legal/tax advice.

---

## 4. Target Product Surfaces

### 4.1 Operator Navigation

```text
Dashboard
Portfolio
Bookings
Marketplace
Work
Suppliers
Money
Accounting
Compliance
Legal
Messages
Automations
Reports
Workspace Settings
```

`Bookings` handles direct booking management and operations. `Marketplace` handles supplier discovery, public booking marketplace performance, transactions, disputes and trust. `Suppliers` continues to handle manual and preferred suppliers. This separation matters because operators will still use trusted existing contractors outside the marketplace.

### 4.2 Supplier Navigation

```text
Dashboard
Leads / Requests
Jobs
Calendar
Availability
Services
Packages
Quotes
Messages
Evidence
Invoices & Payments
Reviews
Team
Service Areas
Verification
Insurance & Licences
Disputes
Settings
```

Suppliers should not need to understand the operator's property management app. Their experience should be job-led, mobile-first and built for quick actions: accept, decline, quote, schedule, upload evidence, invoice and message.

### 4.3 Customer Navigation

```text
My Bookings
Trip / Tenancy Details
Messages
Payments
Check-in / Access
House Rules / Documents
Report Issue
Extras
Reviews
Profile
Support
```

The same shell can support guests and customers, while tenant and landlord portals can remain more specialised. The context engine decides which modules are shown.

---

## 5. Wireframes

### 5.1 Operator Marketplace Home

```text
+--------------------------------------------------------------------------------+
| Propvora | Marketplace                                      Search...  Account |
+--------------------------------------------------------------------------------+
| Sidebar              | Marketplace Home                                           |
| Dashboard            | +----------------+ +----------------+ +----------------+ |
| Portfolio            | | Supplier spend | | Open disputes  | | Booking revenue| |
| Bookings             | | GBP 12,840     | | 2              | | GBP 38,200     | |
| Marketplace [active] | +----------------+ +----------------+ +----------------+ |
| Work                 |                                                            |
| Suppliers            | +--------------------------------------------------------+ |
| Money                | | Recommended suppliers                                 | |
| Automations          | | [Gas engineer] [Cleaner] [Locksmith] [EICR assessor] | |
| Settings             | +--------------------------------------------------------+ |
|                      |                                                            |
|                      | +--------------------------------------------------------+ |
|                      | | Recent marketplace transactions                       | |
|                      | | Job / booking | Seller | Fee | Status | Action         | |
|                      | +--------------------------------------------------------+ |
+--------------------------------------------------------------------------------+
```

### 5.2 Supplier Search and Shortlist

```text
+--------------------------------------------------------------------------------+
| Supplier Marketplace                                      [Postcode] [Category] |
+--------------------------------------------------------------------------------+
| Filters                       | Results                                           |
| Category                      | +----------------------------------------------+ |
| Distance                      | | BrightGas Ltd       Verified evidence        | |
| Availability                  | | Gas, boiler, emergency | 4.8 | 22 mins avg   | |
| Insurance                     | | GBP 85 callout | GBP 2m insurance reviewed   | |
| Licence evidence              | | [Request quote] [Book emergency] [Profile]    | |
| Emergency only                | +----------------------------------------------+ |
| Rating                        | +----------------------------------------------+ |
| Price band                    | | Northside Cleaning   Preferred supplier      | |
|                               | | SA turnover, linen, deep clean | 4.7          | |
|                               | | [Request quote] [Book package] [Profile]      | |
|                               | +----------------------------------------------+ |
+--------------------------------------------------------------------------------+
```

### 5.3 Supplier Workspace Job Detail

```text
+--------------------------------------------------------------------------------+
| Supplier Portal | Job #SJ-1042                             Status: In progress  |
+--------------------------------------------------------------------------------+
| Job summary                                                                     |
| Property: Flat 2, Manchester | Category: Leak | Access: Tenant available 2-5pm  |
+--------------------------------------------------------------------------------+
| Timeline                 | Evidence                  | Invoice                   |
| - Accepted 09:12         | [Upload before photo]     | Quote: GBP 180            |
| - En route 10:04         | [Upload after photo]      | Materials: GBP 42         |
| - Arrived 10:31          | [Upload certificate]      | Platform fee shown later  |
|                          |                           | [Submit invoice]          |
+--------------------------------------------------------------------------------+
| Messages                                                                       |
| Operator: Please confirm if stop tap is accessible.                             |
| Supplier: Confirmed, tenant has access.                                         |
+--------------------------------------------------------------------------------+
```

### 5.4 Booking Calendar and Operations Board

```text
+--------------------------------------------------------------------------------+
| Bookings | Calendar       [Month] [Week] [List]             [Create booking]    |
+--------------------------------------------------------------------------------+
| Listing / Unit       | Mon | Tue | Wed | Thu | Fri | Sat | Sun                  |
| Flat 1 - SA          | BKG | BKG | CLN | --- | BKG | BKG | BKG                  |
| Room 3 - HMO         | TEN | TEN | TEN | TEN | TEN | TEN | TEN                  |
| Cottage - Direct     | --- | --- | BKG | BKG | BKG | CLN | ---                  |
+--------------------------------------------------------------------------------+
| Turnover tasks                                                                  |
| [ ] Clean Flat 1 after checkout 11:00 - assigned to Northside Cleaning          |
| [ ] Send check-in code to Cottage guest - scheduled 15:00                       |
| [ ] Deposit hold review - Flat 1 - due tomorrow                                 |
+--------------------------------------------------------------------------------+
```

### 5.5 Automation Canvas Lite

```text
+--------------------------------------------------------------------------------+
| Automation: After booking checkout, clean and inspect      [Test] [Activate]    |
+--------------------------------------------------------------------------------+
| Nodes                         | Canvas                         | Inspector      |
| Triggers                      | [Booking checkout]             | Trigger        |
| - Booking created             |          |                     | Listing: Any   |
| - Checkout due                |          v                     | Timing: 10:00  |
| Conditions                    | [If cleaning required]         |                |
| Actions                       |      yes | no                   |                |
| - Create task                 |          v                     |                |
| - Invite supplier             | [Create cleaning task]         |                |
| - Send message                |          |                     |                |
| Approvals                     |          v                     |                |
| Payments                      | [Notify cleaner]               |                |
+--------------------------------------------------------------------------------+
| Run history: last dry run passed. 3 actions would be created.                   |
+--------------------------------------------------------------------------------+
```

### 5.6 Verification Queue

```text
+--------------------------------------------------------------------------------+
| Admin | Supplier Verification Queue                       [Risk] [Oldest first] |
+--------------------------------------------------------------------------------+
| Supplier          | Checks submitted                 | Risk | Action             |
| BrightGas Ltd     | Insurance, Gas Safe, Stripe      | Med  | [Review] [Hold]    |
| CleanStay North   | Insurance, company evidence      | Low  | [Review] [Approve] |
| LockPro 24/7      | ID, phone, insurance expired     | High | [Review] [Suspend] |
+--------------------------------------------------------------------------------+
| Review panel                                                                     |
| Evidence preview | Extracted fields | Expiry dates | Admin notes | Decision       |
+--------------------------------------------------------------------------------+
```

---

## 6. Implementation Phases

### Phase 1 - Commercial and Entitlement Foundation

- Reconcile public pricing with canonical `starter / operator / scale / pro_agency / enterprise` tiers.
- Add supplier free tier as a role/entitlement, not a Stripe subscription.
- Add operator add-ons and supplier add-ons to billing architecture.
- Add `marketplace_fee_rules` and transaction fee calculation.
- Add server-side gates for booking pages, supplier workspace, marketplace publishing, automation runs, AI and white-label surfaces.

### Phase 2 - Context Engine and Workspace Shells

- Build context resolver and wire it into critical app routes.
- Formalise operator, supplier, customer and admin shells.
- Add workspace type handling and actor context.
- Ensure all money/legal/compliance/booking/supplier actions carry context metadata.

### Phase 3 - Supplier Workspace and Private Supplier Network

- Upgrade manual suppliers and preferred suppliers.
- Add supplier onboarding, profile, service areas, services/packages, availability, verification evidence and Stripe Connect payout status.
- Support private job invites, quote requests, evidence upload, invoice submission and reviews.
- Keep manual/private jobs at 0% platform commission.

### Phase 4 - Direct Booking Management

- Add listing object separate from property/unit.
- Add reservations, availability, pricing, direct booking checkout, booking customer portal, payments/deposits, cleaning turnover tasks and iCal sync.
- Keep public discovery disabled while direct booking operations harden.

### Phase 5 - Supplier Marketplace

- Add supplier search, category pages, public supplier profiles, quote request, package booking, emergency dispatch, marketplace transaction records, commission, disputes and admin controls.
- Start with 2.5% commission plus provider fees.
- Add optional promoted placement only after ranking and trust rules are stable.

### Phase 6 - Automation Layer

- Ship Smart Recipes first.
- Add natural-language builder that drafts automations but does not activate risky flows automatically.
- Add Canvas Lite with safe node types, test runs, JSON inspection and run logs.
- Add approval nodes for payments, refunds, legal drafts, supplier suspension and destructive actions.

### Phase 7 - Public Booking Marketplace

- Add public marketplace discovery only after booking operations, risk controls, customer support, disputes, cancellation rules and payment release logic are proven.
- Start with low commission and controlled supply.
- Avoid trying to match Airbnb breadth; focus on professional direct-booking inventory connected to property operations.

---

## 7. Risk Controls and Definition of Done

The highest-risk areas are supplier verification claims, escrow/payment wording, legal/tax AI, country-pack accuracy, entitlement drift, public marketplace disputes and unclear fee presentation. Controls are mandatory: conservative badge wording, payment/legal review, country-aware feature states, server-side gates, audit logs, fee transparency and a controlled private-marketplace launch before public discovery.

Layer 2 foundation is done only when the context resolver is used by critical actions, supplier free/add-on entitlements are gated, pricing is reconciled with the canonical catalog, supplier workspace and direct booking management work without public marketplace dependency, transaction fees are rule-based, payment/refund/dispute records are auditable, Smart Recipes have caps/logs, risky automation requires approval and manual supplier/manual booking workflows remain commission-free.

---

## 8. Source Pack

The following source documents are included in full after this master guide so implementers can work from one canonical file. The source pack intentionally preserves the detailed object models, route inventories, node lists, lifecycle states, schema sketches and build order notes from the upgrade docs.


---

# Source Pack: new subscription and addon tiers.md

# Propvora Upgraded Subscription, Add-On and Marketplace Revenue Tiers

**Date:** 2026-06-15  
**Purpose:** Replace the empty upgrade note with the commercial model required for Layer 2: supplier workspaces, direct bookings, supplier marketplace, booking marketplace, automations, verification and add-on monetisation.

This document records the current app billing state, the recommended upgraded commercial structure, and the supplier/booking commission model to carry into `Complete_Layer_2_Upgrade_Guide.md`.

---

## 1. Current Subscription State

The canonical billing catalog in the app is `src/lib/billing/plans.ts` plus `src/lib/billing/catalog.generated.json`. The current live Stripe-backed catalog is:

| Tier | Current monthly price | Current annual price | Current limit summary |
|---|---:|---:|---|
| Starter | GBP 29/mo | GBP 290/yr | 5 properties, 1 seat, no AI Copilot, no advanced reports |
| Operator | GBP 79/mo | GBP 790/yr | 25 properties, 3 seats, advanced reports |
| Scale | GBP 149/mo | GBP 1,490/yr | 100 properties, 10 seats, AI Copilot, portals/accounting |
| Pro / Agency | GBP 299/mo | GBP 2,990/yr | 500 properties, 25 seats, white-label ready |
| Enterprise | Custom | Custom | Unlimited properties/seats, SSO/SAML, dedicated support |

Current Stripe add-ons:

| Add-on | Current price | Billing type |
|---|---:|---|
| Extra team seat | GBP 9/mo | Recurring |
| +10 properties | GBP 19/mo | Recurring |
| White-label branding | GBP 49/mo | Recurring |
| AI credit pack, 1,000 credits | GBP 15 | One-time |
| Onboarding and migration | GBP 499 | One-time |

The public pricing page currently shows an older `Starter / Pro / Business` offer. It should be reconciled after this commercial model is approved so public pricing, Stripe products, entitlement gates and add-on cards all use the same tier names.

---

## 2. Commercial Direction

Layer 2 changes Propvora from a property management SaaS into a multi-sided operating platform:

1. Property operators pay subscription fees for the operating system.
2. Suppliers should be allowed to join free so marketplace supply can grow without friction.
3. Supplier revenue should come from optional upgrades, verification upgrades, promoted visibility, emergency availability and successful bookings.
4. Booking marketplace revenue should come from low platform fees on direct/public bookings, not high OTA-style commission.
5. Automations, AI, global country packs, booking tools and marketplace tooling should be tier-gated to protect infrastructure cost.

The guiding rule is:

> Keep supplier entry free. Charge for commercial advantage, trust upgrades, high-usage automation, promoted reach and successful transaction volume.

---

## 3. Recommended Upgraded SaaS Plans

| Tier | Recommended positioning | Keep current price? | Key Layer 2 entitlements |
|---|---|---:|---|
| Starter | Individual landlord and early portfolio | Yes, GBP 29/mo | Core portfolio, money, compliance, work, contacts, basic supplier records, direct booking draft mode, 2 smart recipes |
| Operator | Active landlord, HMO/R2R/SA operator | Yes, GBP 79/mo | Booking management, customer portal, supplier portal, 15 smart recipes, basic automations, open banking add-on eligibility |
| Scale | Growth portfolio and small team | Yes, GBP 149/mo | Direct booking pages, booking operations board, supplier workspace invites, AI Copilot, Canvas Lite automations, marketplace browsing |
| Pro / Agency | Managed portfolio, letting agency, R2R/SA operator team | Yes, GBP 299/mo | Multi-landlord/client workspaces, owner portals, supplier procurement rules, white-label portal add-on eligibility, advanced marketplace controls |
| Enterprise | Large operator, multi-brand agency, global portfolio | Custom | SSO/SAML, custom country packs, API limits, advanced audit, data residency review, dedicated onboarding, SLA |

Recommendation: keep the current Stripe prices for now. They already support a premium product and avoid another billing migration. The upgrade should add value and add-ons before changing the base prices.

---

## 4. Free Supplier Level

Supplier onboarding should have a permanent free tier.

### Supplier Free

Price: **GBP 0/mo**

Included:

- Supplier workspace
- Public/private supplier profile
- Service categories and coverage area
- Manual job invites from property managers
- Quote submission
- Job status updates
- Evidence upload
- Invoice submission
- Basic review collection
- Email verification
- Stripe Connect payout verification when required for platform-paid jobs
- Up to 3 active marketplace leads at once

Restrictions:

- No promoted ranking
- No emergency availability badge
- No team roster beyond owner/admin
- Limited automation
- Limited profile media
- Limited analytics
- Cannot claim higher verification badges without evidence review
- Commission applies on marketplace-originated paid jobs

Rationale: a paid supplier subscription on day one would suppress marketplace liquidity. Property managers will not trust the marketplace until supply density is credible by category and postcode.

---

## 5. Supplier Paid Add-Ons

| Add-on | Suggested price | Purpose |
|---|---:|---|
| Supplier Pro Profile | GBP 19/mo | More media, case studies, service packages, richer profile analytics |
| Supplier Team | GBP 29/mo | Team members, team calendar, job assignment, multi-engineer availability |
| Emergency Availability | GBP 39/mo | 24/7 badge, emergency dispatch eligibility, response-time SLA fields |
| Verified Plus Review | GBP 49 one-time or GBP 9/mo | Manual admin evidence review for insurance/licence/business documents |
| Promoted Local Placement | GBP 49-99/mo per area/category | Sponsored rotation, clearly labelled as promoted |
| Extra Coverage Area | GBP 10/mo per area pack | Expand geographic reach without gaming ranking |
| Supplier Automation Pack | GBP 19/mo | Quote follow-ups, evidence reminders, invoice nudges |
| Supplier AI Assistant | GBP 15/mo or credit-based | Quote drafting, job summaries, customer-message drafting |

Promoted placement must not override trust and suitability entirely. Ranking should remain quality-led, with promoted slots clearly labelled.

---

## 6. Booking and Supplier Commission Model

Recommended default:

| Transaction type | Intro fee | Standard fee | Notes |
|---|---:|---:|---|
| Manual supplier added by operator | 0% | 0% | Propvora only tracks the work. No marketplace fee. |
| Supplier marketplace job | 2.5% | 2.5-5% | Start at 2.5%; move category/emergency jobs toward 5% only if value is proven. |
| Emergency supplier dispatch | 2.5% or minimum fee | 5% or fixed minimum | Higher operational/support burden. |
| Supplier service package booking | 2.5% | 2.5% | Clear and low-friction. |
| Direct booking page | 0% intro | 0-1% | Include in SaaS plan during launch to drive adoption. |
| Public property booking marketplace | 2.5% | 2.5-5% | Lower than OTA norms; can add guest/host split later. |
| Add-on/extras sold during booking | 2.5% | 2.5% | Cleaning, linen, late checkout, parking, etc. |

Payment provider fees should be shown separately or transparently passed through. Platform commission should be recorded as `platform_fee_percent`, `platform_fee_amount`, `payment_provider_fee_amount`, `seller_payout_amount` and `net_platform_revenue`.

Do not describe Stripe Connect as escrow unless the exact regulated flow supports it. Use accurate language: payment authorisation, delayed capture, platform hold, connected-account transfer, third-party escrow, manual invoice.

---

## 7. Competitor Pricing Signals Checked Online

The supplier model should be calibrated against current market behaviour:

- Checkatrade states that membership cost varies by trade, postcode and lead volume, with basic plans starting around GBP 30 + VAT/month and higher lead-volume plans costing more.
- MyBuilder states that tradespeople only pay when shortlisted, with no joining or membership fees; lead fees can start from GBP 7 and are shown before responding.
- Rated People has moved toward monthly membership/unlimited-leads packaging for relevant jobs, while still documenting membership/tariff structures.
- Taskrabbit charges clients service and trust/support fees as percentages on top of tasker rates.
- Airbnb states most hosts on split-fee pay about 3%, while PMS/host-only models can be materially higher.
- Booking.com partner commission varies by agreement and is commonly materially higher than the proposed Propvora 2.5-5% marketplace fee.
- Fixflo contractor marketplace material confirms contractor networks and, in one partner setup, lets operators add a works management fee up to 20%, showing there is room for a lower, transparent Propvora fee.

Conclusion: Propvora should lead with a low, transparent marketplace fee and supplier free entry. This is easier to defend than subscription-heavy lead directories or high OTA-style commissions.

---

## 8. Add-On Catalogue for Operators

| Add-on | Suggested price | Eligible plans | Notes |
|---|---:|---|---|
| Extra seat | Keep GBP 9/mo | All | Current catalog item. |
| +10 properties | Keep GBP 19/mo | Starter, Operator, Scale | Current catalog item. |
| White-label branding | Keep GBP 49/mo or bundle into Pro / Agency | Scale+ | Current catalog item; public page currently says GBP 99/mo and must be aligned. |
| AI credit pack | Keep GBP 15 one-time | AI-enabled tiers | Current catalog item. |
| Onboarding and migration | Keep GBP 499 one-time | All | Current catalog item. |
| Open Banking | GBP 19-49/mo | Operator+ | Depends on TrueLayer/Yapily/GoCardless costs. |
| WhatsApp Business | GBP 15/mo + usage | Operator+ | Pass through conversation cost. |
| eSignature | GBP 15/mo + envelopes | Operator+ | Native signing first; provider later if needed. |
| Xero / QuickBooks sync | GBP 29/mo | Scale+ | Accounting sync support cost. |
| MTD ITSA submission pack | GBP 19-39/mo | Operator+ | High willingness to pay due deadline pressure. |
| Booking pages | Included in Scale+; GBP 19/mo on Operator | Operator+ | Use included value to upsell Scale. |
| Automation pack | GBP 29/mo | Operator+ | More recipes/runs/nodes beyond plan cap. |
| API access | GBP 49/mo | Pro / Agency+ | Existing public page concept; move to canonical catalog. |
| Country pack beta | GBP 19/mo/country | Scale+ | Only after legal/tax/compliance review. |

---

## 9. Entitlement Principles

- Starter should not get marketplace publishing, public booking marketplace publishing, AI-heavy automation or white-label capabilities.
- Operator should get useful direct booking management and supplier portal workflows, but not advanced marketplace controls.
- Scale should unlock direct booking pages, Canvas Lite, customer workspaces and supplier workspace invites.
- Pro / Agency should unlock procurement rules, owner/client portals, multi-landlord controls and agency-grade workflows.
- Enterprise should unlock SSO/SAML, custom limits, custom country packs, dedicated API limits, data residency review and advanced support.

---

## 10. Immediate Implementation Notes

1. Keep the current Stripe plan IDs unless product leadership approves a pricing migration.
2. Add a supplier free tier as a non-Stripe entitlement, not a paid plan.
3. Add marketplace commission rules in database rather than hardcoding 2.5%.
4. Add operator add-ons to the canonical catalog before updating public pricing.
5. Reconcile `src/app/pricing/PricingClient.tsx` with `src/lib/billing/plans.ts`.
6. Ensure every paid feature has a server-side entitlement gate.
7. Track commission, payment provider fees, refunds and disputes in ledger-safe tables.


---

# Source Pack: PROPVORA_GLOBAL_MARKETPLACE_CONTEXT_EXPANSION_AUDIT_2026-06-15.md

# Propvora Global + Marketplace Context Expansion Audit

**Repository context:** `Blackwellen/propvora`**Audit date:** 2026-06-15**Document purpose:** Enrich the previous global audit with the missing PhD-depth product architecture: context-aware internationalisation, multi-country portfolios, country-aware Money/Accounting/Legal/Compliance/Work/Portfolio, AI, onboarding, storage/data, supplier workspaces, customer workspaces, supplier marketplace, property booking marketplace, escrow/disputes, direct booking pages, channel-manager strategy and automation upgrades.

> Internal strategy and implementation document. This is not legal, tax, financial, payment, employment, consumer, property, insurance or regulatory advice. Every country pack, payment rail, escrow flow, legal template, supplier marketplace feature and booking marketplace feature must pass qualified review before production enablement.

---

## 1. Executive conclusion

The previous global audit was directionally right but not deep enough. The real architecture problem is not just â€œadd countriesâ€. Propvora is becoming **multi-context software**. The same app action changes meaning depending on:

- who the actor is
- what workspace type they are in
- which country their business is based in
- which country the property is in
- whether the property is long-let, rent-to-rent, serviced accommodation, HMO/shared housing, co-living, commercial, student let, supported living, holiday let or mixed-use
- whether the record is internal-only, tenant-facing, guest-facing, supplier-facing, customer-facing, marketplace-facing or admin-facing
- whether money is rent, deposit, booking revenue, supplier job payment, escrow, commission, affiliate reward, refund or accounting journal
- whether a compliance/legal feature is country-reviewed, beta, research-only or disabled
- whether AI is allowed to provide country-specific guidance or must stay generic
- whether the user is on a manual workspace, supplier workspace, customer workspace, public booking flow or marketplace flow

Therefore the next upgrade should be designed as:

> **Propvora Context Engine + Country Packs + Workspace Type Shells + Booking Layer + Supplier Layer + Marketplace/Payments Layer + Automation Layer.**

This must be built behind feature flags and preferably in a separate branch so V1 manual property operations are not destabilised.

Recommended branch:

```text
feature/global-context-marketplace-architecture
```

Recommended feature flags:

```ts
features.globalCountryPacks
features.multiCountryPortfolio
features.contextEngine
features.directBookingPages
features.bookingManagement
features.supplierWorkspace
features.customerWorkspace
features.supplierMarketplace
features.propertyBookingMarketplace
features.marketplaceEscrow
features.marketplaceDisputes
features.utilitySetup
features.naturalLanguageAutomations
features.automationCanvasLite
```

---

## 2. The core architecture upgrade: Context Engine

### 2.1 Why this is required

Internationalisation and marketplaces cannot be solved by simple translations. A â€œtaskâ€, â€œinvoiceâ€, â€œbookingâ€, â€œlegal matterâ€, â€œpropertyâ€, â€œsupplier jobâ€, â€œcustomer paymentâ€ or â€œAI answerâ€ must behave differently depending on context.

Example:

- A gas safety reminder in a UK long-term let is a compliance workflow.
- A gas/fuel safety task in Thailand may be generic maintenance evidence, not a regulated UK-style certificate.
- A serviced accommodation checkout clean is a booking operations workflow.
- A supplier locksmith emergency job is a marketplace dispatch workflow.
- A customer booking payment is potentially hospitality/consumer-commerce revenue.
- A tenant deposit is not the same as an SA booking deposit or supplier escrow hold.
- An affiliate commission is not the same as marketplace commission.

### 2.2 Required Context Resolver

Create:

```text
src/lib/context/
  context-resolver.ts
  actor-context.ts
  workspace-context.ts
  country-context.ts
  property-context.ts
  operation-context.ts
  money-context.ts
  legal-context.ts
  compliance-context.ts
  booking-context.ts
  supplier-context.ts
  customer-context.ts
  marketplace-context.ts
  ai-context.ts
  automation-context.ts
  permission-context.ts
  route-context.ts
  context-types.ts
```

Every important page/API/action must call a central resolver:

```ts
const ctx = await resolvePropvoraContext({
  request,
  route,
  workspaceId,
  propertyId,
  entityType,
  entityId,
  actorId,
})
```

The context object should return:

```ts
{
  actor: {
    userId,
    role,
    workspaceRole,
    portalRole,
    marketplaceRole,
    isPlatformAdmin,
    permissions,
  },
  workspace: {
    id,
    type, // operator | supplier | customer | platform_admin
    plan,
    countryCode,
    legalJurisdiction,
    taxCountryCode,
    baseCurrency,
    language,
    timezone,
    dataRegion,
    featureFlags,
  },
  property: {
    id,
    countryCode,
    legalJurisdiction,
    operationProfile,
    currency,
    localAuthority,
    addressModel,
  },
  countryPack: {
    workspaceCountryPack,
    propertyCountryPack,
    supportStatus,
    legalReviewStatus,
    taxReviewStatus,
    privacyReviewStatus,
    paymentStatus,
  },
  money: {
    baseCurrency,
    transactionCurrency,
    taxProfile,
    paymentRail,
    isEscrow,
    isMarketplaceCommission,
    isAffiliateCommission,
  },
  legal: {
    allowedDepth,
    disclaimerRequired,
    localReviewRequired,
    templatesEnabled,
  },
  compliance: {
    enabledModules,
    disabledModules,
    researchOnlyModules,
    evidenceLanguage,
  },
  ai: {
    provider,
    model,
    countryPromptGuard,
    legalDepth,
    taxDepth,
    refusalRules,
  },
  ui: {
    dateFormat,
    numberFormat,
    currencySymbol,
    areaUnit,
    addressLabels,
    terminology,
    emptyStateCopy,
    warningBanners,
  }
}
```

### 2.3 Global interaction modes

The same entity must support these contexts:

| Context               | Example                                        | Behaviour change                                                 |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| Internal operator     | Property manager creates a work order          | Full internal controls, supplier assignment, accounting links    |
| Supplier portal       | Supplier views assigned job                    | Limited scope, job-specific documents only                       |
| Supplier workspace    | Supplier manages own services/team             | Full supplier CRM/jobs/calendar/invoices/payouts                 |
| Customer/guest portal | Guest views booking                            | Booking, messages, payments, docs, support only                  |
| Tenant portal         | Tenant views tenancy                           | Tenancy docs, rent, repairs, notices, messages only              |
| Public booking page   | Guest books property                           | Public availability, rates, guest details, payment               |
| Public supplier page  | Customer books supplier                        | Services, availability, coverage, quote/booking/payment          |
| Marketplace admin     | Platform reviews dispute                       | Escrow, evidence, audit, communication timeline                  |
| Platform admin        | Blackwellen controls countries/plans/providers | Global control plane, support, billing, sanctions, release gates |

### 2.4 Route-level context requirements

Every route must declare:

```ts
export const routeContext = {
  requiredWorkspaceTypes: ['operator'],
  supportedActorContexts: ['internal'],
  countryPackRequired: true,
  legalPackRequired: false,
  moneyContextRequired: false,
  allowResearchOnlyCountry: true,
  blockedCountryBehaviour: 'deny',
}
```

This prevents accidental exposure of UK legal modules, marketplace features or payment flows in unsupported contexts.

---

## 3. Global portfolio architecture: UK user with global properties

The key product issue is that the customer may be based in one country but own/manage properties in many countries.

### 3.1 Separate business country from property country

Do not use one country setting for everything.

Required fields:

```text
workspace.business_country_code
workspace.tax_country_code
workspace.legal_entity_country_code
workspace.default_currency
workspace.default_language
workspace.data_region
property.country_code
property.legal_jurisdiction
property.tax_region
property.currency
property.local_authority
booking.guest_country_code
supplier.business_country_code
customer.country_code
invoice.supply_country_code
payment.billing_country_code
```

### 3.2 Practical examples

#### Example A â€” UK business, property in Spain

- Workspace country: GB
- Property country: ES
- Base currency: GBP
- Property currency: EUR
- Tax engine: UK SaaS billing for subscription; Spanish property taxes/operational reminders as country pack only if reviewed
- Legal: Spanish tenancy/short-let rules disabled unless ES pack reviewed
- Accounting: FX and property-level EUR ledger required
- AI: must say â€œSpanish local review requiredâ€ if legal/tax query

#### Example B â€” US user, property in UK

- Workspace country: US
- Property country: GB
- Subscription billing may be USD
- Property income may be GBP
- UK compliance modules can apply to the UK property if user enables GB property pack
- US tax/accounting remains separate from UK property compliance

#### Example C â€” Australia operator with short-let properties in Thailand

- Workspace country: AU
- Property country: TH
- Booking currency may be THB, AUD or USD
- Short-let/legal rules require Thailand local review
- AI cannot confirm legality of short-let operation unless TH pack approved

### 3.3 UI model

Every workspace should have:

```text
Workspace Settings â†’ Global Setup
  Business country
  Tax country
  Base currency
  Default language
  Data region
  Supported property countries
  Country pack statuses
  Legal/tax/privacy disclaimers
```

Every property should have:

```text
Property Detail â†’ Country & Jurisdiction
  Property country
  Region/state/province
  Local authority/municipality
  Legal jurisdiction
  Tax region
  Currency
  Area unit
  Operation profile status in that country
  Compliance module status
```

---

## 4. Core Stripe-supported country set and rollout

Stripeâ€™s global availability page says that once Stripe is supported in your country/region, you can sell to customers anywhere in the world. It lists supported countries/regions including Australia, Austria, Belgium, Brazil, Canada, Croatia, Czech Republic, Denmark, Finland, France, Germany, Greece, Ireland, Italy, Japan, Mexico, Netherlands, New Zealand, Portugal, Romania, Spain, Sweden, Switzerland, Thailand, UAE, UK and US. It also shows India and Indonesia as Preview and Kenya/Nigeria/South Africa through an extended Paystack network.

### 4.1 Recommended practical launch countries

Start with Stripe-supported, commercially sensible countries:

```text
GB  United Kingdom
US  United States
CA  Canada
AU  Australia
NZ  New Zealand
IE  Ireland
FR  France
ES  Spain
PT  Portugal
DE  Germany
NL  Netherlands
BE  Belgium
SE  Sweden
FI  Finland
CH  Switzerland
GR  Greece
IT  Italy
JP  Japan
TH  Thailand
BR  Brazil
MX  Mexico
AE  United Arab Emirates
RO  Romania
DK  Denmark
AT  Austria
HR  Croatia
CZ  Czech Republic
```

### 4.2 Countries to keep manual-sales/review first

```text
ID  Indonesia â€” Stripe preview; manual review first
IN  India â€” Stripe preview; manual review first
KE  Kenya â€” extended network; review payout/payment assumptions
NG  Nigeria â€” extended network; review payout/payment assumptions
ZA  South Africa â€” extended network; review payout/payment assumptions
TR  Turkey â€” manual payment/provider/legal review
SA  Saudi Arabia â€” manual payment/provider/legal review
QA  Qatar â€” manual payment/provider/legal review
MA  Morocco â€” manual payment/provider/legal review
AL  Albania â€” manual payment/provider/legal review
AR  Argentina â€” manual payment/provider/legal review
CL  Chile â€” manual payment/provider/legal review
GL  Greenland â€” treat via Denmark relationship only after review
IS  Iceland â€” EEA/review first
```

### 4.3 SaaS subscriptions vs marketplace payouts

Important distinction:

- A UK Propvora Stripe account can generally sell subscriptions globally where Stripe allows the UK business to accept payments.
- Marketplace payouts through Stripe Connect require the supplier/connected account country to be supported by Connect and the correct capability/onboarding status.
- Therefore subscription countries and marketplace supplier payout countries must be two different matrices.

Create:

```text
billing_country_matrix
connect_payout_country_matrix
supplier_onboarding_country_matrix
booking_customer_country_matrix
```

---

## 5. Money section changes per country and context

The Money section becomes the financial operating centre. It must support rent, expenses, booking revenue, deposits, supplier payments, escrow, commissions, refunds and multi-currency.

### 5.1 Money context types

Add `money_context_type`:

```text
rent_income
rental_deposit
booking_revenue
booking_security_deposit
booking_cleaning_fee
supplier_job_payment
supplier_callout_fee
supplier_materials_charge
marketplace_commission
affiliate_commission
platform_subscription
utility_setup_commission
escrow_hold
escrow_release
refund
chargeback
dispute_adjustment
fx_gain_loss
```

### 5.2 Required Money routes

```text
/app/money/overview
/app/money/income
/app/money/expenses
/app/money/bookings
/app/money/deposits
/app/money/escrow
/app/money/commissions
/app/money/payouts
/app/money/refunds
/app/money/disputes
/app/money/fx
/app/money/tax
/app/money/reports
```

### 5.3 Country-aware behaviour

| Area       | Change required                                                         |
| ---------- | ----------------------------------------------------------------------- |
| Currency   | workspace base currency + property currency + transaction currency      |
| Tax        | VAT/GST/sales tax/consumption tax profile per country                   |
| Invoices   | local invoice labels, tax ID fields, B2B/B2C support                    |
| Deposits   | tenancy deposit, booking deposit and escrow are separate concepts       |
| Escrow     | hold funds as liability, not revenue, until released                    |
| Commission | platform 2.5% marketplace fee + Stripe/provider fee shown transparently |
| FX         | record exchange rate, realised gain/loss, reporting currency            |
| Refunds    | booking refund, supplier refund, subscription refund, escrow reversal   |
| Payouts    | supplier payout, property manager payout, affiliate payout all separate |
| Reports    | property-level, country-level, workspace-level, consolidated            |

### 5.4 UX changes

Money cards must adapt by workspace type:

#### Operator workspace

- rent roll
- arrears
- booking revenue
- supplier spend
- property margin
- country exposure
- FX exposure
- deposits held/owed

#### Supplier workspace

- job revenue
- pending payouts
- escrow holds
- platform fees
- materials reimbursement
- invoice status
- tax documents

#### Customer workspace

- booking payments
- security deposits
- refunds
- invoices/receipts
- disputes

#### Platform/admin

- marketplace GMV
- net revenue
- commission collected
- escrow held
- dispute exposure
- chargebacks
- affiliate payouts
- country revenue

---

## 6. Accounting changes per country and context

Accounting must become country-aware, marketplace-aware and multi-currency.

### 6.1 Accounting contexts

```text
operator_accounting
supplier_accounting
customer_receipts
platform_marketplace_accounting
affiliate_accounting
booking_accounting
escrow_accounting
```

### 6.2 Core ledger changes

Add:

```text
accounting_entities
accounting_books
accounting_periods
accounting_currencies
fx_rates
fx_revaluations
country_chart_templates
tax_codes
invoice_tax_lines
escrow_ledger_entries
marketplace_commission_entries
supplier_payout_entries
affiliate_payout_entries
booking_revenue_entries
```

### 6.3 Required journal patterns

#### Booking payment collected

Debit: Cash/Stripe clearing
Credit: Deferred booking revenue / customer deposit liability
Credit: Tax payable if applicable
Credit: Cleaning fee revenue/liability depending model

#### Booking stay completed

Debit: Deferred booking revenue
Credit: Booking revenue

#### Supplier job escrow funded

Debit: Cash/Stripe clearing
Credit: Escrow liability

#### Supplier job completed and released

Debit: Escrow liability
Credit: Supplier payable
Credit: Platform commission revenue

#### Supplier payout

Debit: Supplier payable
Credit: Cash/Stripe clearing

#### Platform 2.5% commission

Debit: Escrow liability or receivable
Credit: Marketplace commission revenue

#### Affiliate commission earned

Debit: Affiliate commission expense
Credit: Affiliate payable

### 6.4 Country-specific accounting settings

Each country pack needs:

- tax names
- tax code formats
- invoice field requirements
- default chart of accounts template
- currency
- FX treatment flag
- local accounting disclaimer
- local export formats later

### 6.5 UI upgrades

Accounting side nav:

```text
Overview
Chart of Accounts
Journals
Sales Invoices
Purchase Bills
Booking Ledger
Escrow Ledger
Supplier Payouts
Affiliate Payouts
Tax Codes
FX & Revaluation
Reports
Audit Trail
Settings
```

---

## 7. Affiliate and partner changes per country

The affiliate system should not live as a totally separate shell long term. It should become part of a broader **Partner & Commercial Network** because supplier partners, customer referrals, property manager referrals and affiliate payouts overlap.

### 7.1 Partner types

```text
affiliate
supplier_partner
property_manager_partner
agency_partner
utility_partner
channel_partner
integration_partner
ambassador
white_label_partner
```

### 7.2 Country impacts

| Area            | Required change                                                      |
| --------------- | -------------------------------------------------------------------- |
| Commission tax  | tax forms, VAT/GST treatment, self-billing or invoice upload         |
| Payout country  | payout methods depend on country/payment provider                    |
| Affiliate terms | country-specific affiliate terms and prohibited marketing claims     |
| Tracking        | cookie/marketing consent varies by region                            |
| Consumer rules  | some countries have stricter affiliate disclosure rules              |
| Sanctions       | no payouts to blocked/sanctioned entities                            |
| Accounting      | affiliate payable, commission expense, reversal on refund/chargeback |

### 7.3 Recommended product structure

Do not give affiliates their own heavy app shell at first. Wrap them into context:

- Operator workspace â†’ â€œReferrals & Partnersâ€
- Supplier workspace â†’ â€œPartner leads / referralsâ€
- Customer workspace â†’ â€œRefer a manager/supplierâ€
- Platform admin â†’ â€œAffiliate & Partner control centreâ€

### 7.4 Required tables

```text
partner_profiles
partner_programs
partner_terms_versions
partner_links
partner_attributions
partner_commissions
partner_payouts
partner_tax_profiles
partner_marketing_reviews
partner_sanctions_checks
partner_audit_events
```

---

## 8. Legal section changes per country and marketplace context

Legal becomes much more important once you add bookings, suppliers, marketplaces, escrow and international customers.

### 8.1 Legal contexts

```text
property_legal
rent_to_rent_legal
short_let_legal
supplier_contract_legal
customer_booking_terms
marketplace_terms
escrow_terms
dispute_terms
affiliate_terms
privacy_terms
country_availability_terms
```

### 8.2 Required Legal side nav

```text
Overview
Country Legal Profile
Property Legal Matters
Tenancy / Occupancy Evidence
Short-let / Booking Rules
Supplier Agreements
Customer Booking Terms
Marketplace Terms
Escrow & Disputes
Template Library
Disclaimer Acceptances
Legal Review Queue
Audit Trail
```

### 8.3 Legal rule

The UI must distinguish:

- â€œevidence collectedâ€
- â€œworkflow completeâ€
- â€œdraft generatedâ€
- â€œrequires local reviewâ€
- â€œreviewed country packâ€
- â€œnot legal adviceâ€

Do not show â€œcompliantâ€ as a definitive statement unless a reviewed country pack authorises that wording, and even then use caution.

### 8.4 Marketplace legal additions

Supplier marketplace requires:

- supplier terms
- customer terms
- booking terms
- cancellation policy
- refunds policy
- escrow/payment terms
- dispute policy
- review policy
- prohibited services
- insurance/licensing disclaimer
- platform role disclaimer
- supplier independent contractor wording
- customer acceptance logs
- supplier acceptance logs

### 8.5 Booking legal additions

Property booking marketplace requires:

- accommodation booking terms
- cancellation policy
- guest behaviour rules
- damage/security deposit terms
- local taxes/fees disclosure
- host/property manager terms
- platform liability limitation
- age/identity checks if needed
- accessibility information
- emergency contact rules

---

## 9. Compliance section changes per country and context

Compliance must become a rules/evidence engine, not a static UK checklist.

### 9.1 Compliance dimensions

```text
country
region/state/province
local authority/municipality
property operation profile
workspace type
booking/supplier/customer context
review status
```

### 9.2 Compliance side nav

```text
Overview
Country Profile
Property Safety
Energy / Performance
Gas / Fuel Safety
Electrical Safety
Fire Safety
Licences & Registrations
Short-let Rules
Shared Housing / HMO Equivalent
Insurance
Supplier Compliance
Customer / Guest Safety
Evidence Vault
Renewal Calendar
Audit Trail
```

### 9.3 Supplier compliance

Supplier marketplace requires supplier verification:

- business registration
- insurance
- trade licences/certifications where relevant
- team member checks if needed
- service area verification
- risk category approval
- prohibited services check
- emergency supplier approval
- reviews moderation

### 9.4 Booking compliance

Booking properties require:

- short-let/holiday-let eligibility
- local registration/licence if applicable
- fire safety evidence
- insurance evidence
- guest instructions
- emergency contact
- occupancy limit
- cleaning/turnover checklist
- local tax/tourism fee flag

---

## 10. Work section changes per country and marketplace context

Work becomes the operations dispatch layer.

### 10.1 Work contexts

```text
internal_task
maintenance_job
supplier_quote
supplier_booking
emergency_dispatch
booking_turnover
guest_issue
tenant_repair
compliance_remediation
marketplace_dispute_task
```

### 10.2 Work side nav

```text
Overview
Tasks
Jobs
Quotes
Supplier Dispatch
Emergency Jobs
Booking Turnovers
Guest / Tenant Issues
PPM / Recurring Work
Compliance Remediation
Disputes
Calendar
Automation Rules
Reports
```

### 10.3 Country changes

- emergency categories vary by country
- supplier availability/timezone matters
- service coverage radius and travel fees vary
- VAT/GST/tax applied to supplier invoices varies
- insurance/licence evidence varies
- local holidays affect SLAs
- language affects work order templates
- legal/compliance-related work must attach evidence

### 10.4 Supplier dispatch flow

1. Operator creates work order.
2. System resolves property country/locality.
3. System checks approved suppliers serving that area.
4. Operator requests quote or books package.
5. Supplier accepts/declines.
6. Customer/tenant/guest can be notified if relevant.
7. Job is completed with photos/evidence.
8. Payment/escrow/payout/accounting entries created.
9. Review requested if marketplace job.

---

## 11. Portfolio changes per country and marketplace context

Portfolio must become multi-country and multi-operation.

### 11.1 Portfolio side nav

```text
Overview
Properties
Units / Rooms
Tenancies / Occupancies
Bookings
Operation Profiles
Country Map
Compliance
Work
Suppliers
Money
Documents
Reports
```

### 11.2 Global portfolio dashboard

Cards:

- properties by country
- income by currency
- FX exposure
- compliance risk by country
- booking occupancy by country
- supplier coverage by country
- legal review required
- unsupported country warnings
- short-let risk warnings

### 11.3 Property detail tabs

```text
Overview
Address & Jurisdiction
Units / Rooms
Tenancies / Occupancies
Bookings
Work
Suppliers
Money
Compliance
Legal
Documents
AI Insights
Activity
Settings
```

---

## 12. Storage and data impact

International + marketplace makes storage/data much more sensitive because Propvora will store:

- landlord data
- tenant data
- guest/customer data
- supplier data
- booking documents
- invoices
- IDs/verification documents if added later
- evidence photos/videos
- legal drafts
- payment/dispute evidence
- communications

### 12.1 Required data classification

```text
public
workspace_internal
portal_shared
supplier_shared
customer_shared
legal_sensitive
financial_sensitive
identity_sensitive
health_or_accessibility_sensitive
booking_sensitive
dispute_sensitive
```

### 12.2 Storage rules

- no public bucket for private documents
- signed URLs only
- workspace-scoped paths
- portal-scoped paths
- supplier/customer scoped paths
- country-aware retention rules
- deletion/export workflows
- audit every download of sensitive files
- malware scanning hook
- file type restrictions
- automatic redaction later

### 12.3 Data residency

Do not promise country-specific data residency until actually built. Instead:

- store `data_region`
- document current hosting/subprocessors
- allow future EU/US/UK region routing
- add DPA/subprocessor docs
- support DSAR/export/delete workflows

---

## 13. AI impact and upgrades

AI must become context-aware, country-aware and marketplace-safe.

### 13.1 AI route must receive context

```ts
aiContext = {
  workspaceType,
  actorRole,
  countryPack,
  propertyCountry,
  operationProfile,
  legalDepth,
  taxDepth,
  privacyDepth,
  marketplaceContext,
  bookingContext,
  supplierContext,
  customerContext,
}
```

### 13.2 AI modules

```text
AI Chat
AI Property Analyst
AI Planning Analyst
AI Compliance Explainer
AI Legal Evidence Assistant
AI Accounting Explainer
AI Supplier Matching Assistant
AI Booking Revenue Assistant
AI Dispute Evidence Assistant
AI Automation Builder
```

### 13.3 AI country rules

AI must refuse or downgrade answers when:

- country pack is research-only
- legal pack is not reviewed
- tax pack is not reviewed
- user asks for definitive legal advice
- user asks to serve notices automatically
- user asks to bypass compliance
- marketplace dispute involves liability/legal advice

### 13.4 Natural language automations

Prompt example:

> â€œWhen a serviced accommodation checkout is tomorrow and no cleaner is assigned, create an urgent job and notify approved cleaners within 10 miles.â€

AI must convert to a draft rule:

```json
{
  "trigger": "booking.checkout_date_minus_1_day",
  "conditions": ["operation_profile = serviced_accommodation", "cleaner_assigned = false"],
  "actions": ["create_work_order", "notify_supplier_pool"],
  "approval_required": true
}
```

No destructive or legal actions auto-run in V1.

---

## 14. Onboarding impact

Onboarding must branch by workspace type.

### 14.1 Workspace type selector

```text
Property Operator Workspace
Supplier Workspace
Customer / Guest Workspace
Marketplace Admin Workspace
Platform Admin Workspace
```

### 14.2 Operator onboarding

- business country
- property countries
- operation profiles
- base currency
- accounting setup
- legal/compliance disclaimers
- booking/direct booking toggle
- supplier marketplace toggle
- demo data country pack

### 14.3 Supplier onboarding

- solo or team supplier
- business country
- service categories
- locations served
- availability
- insurance/licence docs
- payout country
- tax profile
- package setup
- emergency service toggle
- terms acceptance

### 14.4 Customer onboarding

- optional account
- booking profile
- saved payment method if enabled
- communication preferences
- privacy acceptance
- booking terms acceptance

### 14.5 Global portfolio onboarding

Ask separately:

- where is your company based?
- where are your properties?
- what is your reporting currency?
- do you need property-level currencies?
- do you want unsupported property countries in generic mode?

---

## 15. Booking channel manager and direct booking strategy

### 15.1 Realistic answer

Do not start by trying to become a full Airbnb/Booking.com/Vrbo channel manager. That adds too much API partnership, rate/availability sync, guest messaging, cancellations, payment policy and liability overhead.

### 15.2 V1 booking route

Build:

```text
Internal booking management + direct booking pages + iCal sync.
```

Airbnb supports calendar export/import via iCal; the help page explains that Airbnb provides a URL to paste into another website, can import a URL ending in `.ics`, and updates automatically about every 3 hours. That is enough for basic availability blocking, not full booking/revenue/customer data.

Booking.com has Connectivity APIs intended to let property owners manage their Booking.com properties using your site/software, but that is a proper integration route, not a quick free widget.

### 15.3 Recommended booking phases

#### Phase 1 â€” internal/direct bookings

- manual bookings
- public booking landing page
- availability calendar
- pricing rules
- Stripe payment
- booking confirmation email
- guest/customer portal
- cleaning task automation
- security deposit rules
- cancellation/refund workflow
- iCal import/export

#### Phase 2 â€” channel calendar sync

- import Airbnb iCal
- import Booking.com iCal
- import Vrbo iCal
- export Propvora iCal
- detect conflicts
- manual conflict resolution
- no claim of full channel management

#### Phase 3 â€” official/partner integrations

- Booking.com Connectivity API
- Airbnb partner/channel API if approved
- Vrbo/Expedia connectivity if approved
- Guesty/Hostaway/OwnerRez/Lodgify/Beds24 integrations if commercially worthwhile

### 15.4 Public booking pages

Yes, allow booking landing pages, but do **not** launch a general property marketplace yet.

Build:

```text
/property/[slug]
/book/[propertySlug]
/book/[propertySlug]/checkout
/bookings/[bookingRef]
```

These are property-manager-owned direct booking pages, not an open marketplace.

---

## 16. Supplier workspace

Supplier portal should evolve into a full supplier workspace, but keep lightweight portal mode for suppliers who do not want to sign up.

### 16.1 Supplier workspace types

```text
solo_supplier
supplier_team
supplier_company
emergency_supplier
utility_partner
logistics_partner
```

### 16.2 Supplier side nav

```text
Home
Leads
Jobs
Calendar
Services
Packages
Coverage Areas
Team
Quotes
Invoices
Payouts
Reviews
Documents
Compliance
Messages
Settings
```

### 16.3 Supplier functions

- create service offerings
- create fixed packages
- set hourly/callout/materials pricing
- set availability
- define locations served
- assign team members
- accept/decline jobs
- quote jobs
- upload completion evidence
- invoice/receive payout
- manage reviews
- manage licence/insurance docs
- emergency availability toggle

### 16.4 Supplier detail pages

```text
/supplier/jobs/[id]
/supplier/services/[id]
/supplier/packages/[id]
/supplier/team/[id]
/supplier/invoices/[id]
/supplier/payouts/[id]
/supplier/reviews/[id]
```

---

## 17. Supplier marketplace

This is powerful but should be branch/flagged, not merged directly into core V1.

### 17.1 Supplier marketplace side nav for operator

```text
Marketplace Home
Find Suppliers
Emergency Suppliers
Packages
Quotes
Bookings
Escrow
Disputes
Preferred Suppliers
Reviews
Saved Suppliers
Marketplace Settings
```

### 17.2 Public supplier page

Supplier public page should include:

- business name
- logo/avatar
- verified badges
- services
- packages
- service areas
- availability
- emergency response options
- pricing from
- photos
- team members optional
- reviews
- insurance/licence badges
- terms
- request quote
- book package
- message supplier

### 17.3 Marketplace transaction flow

1. Customer/operator selects supplier or package.
2. Supplier accepts booking or quote request.
3. Customer pays.
4. Platform fee is calculated: 2.5% + Stripe/provider fees.
5. Funds held or tracked depending payment model.
6. Supplier completes job and uploads evidence.
7. Customer/operator approves or dispute opens.
8. Funds released/payout created.
9. Commission recorded.
10. Review requested.
11. Accounting entries posted.

### 17.4 Escrow choice

Start with Stripe Connect-style marketplace payments if available for the supplier country. Stripe explicitly positions Connect for platforms and marketplaces. For complex high-value true escrow/milestone holding, evaluate Escrow.com later, but do not make Escrow.com a dependency for V1 because it adds onboarding, licensing and operational complexity.

Recommended:

```text
V1: Stripe Connect / delayed capture / separate charges and transfers where supported
V2: milestone payment ledger and dispute workflow
V3: Escrow.com or regulated escrow provider for high-value markets if legally reviewed
```

### 17.5 Required marketplace tables

```text
supplier_workspaces
supplier_profiles
supplier_services
supplier_packages
supplier_service_areas
supplier_availability
supplier_team_members
supplier_documents
supplier_compliance_checks
marketplace_listings
marketplace_quote_requests
marketplace_bookings
marketplace_orders
marketplace_payments
marketplace_commissions
marketplace_escrow_holds
marketplace_payouts
marketplace_reviews
marketplace_disputes
marketplace_dispute_messages
marketplace_dispute_evidence
marketplace_audit_events
```

---

## 18. Property booking marketplace and booking management

### 18.1 Recommendation

Do not launch an open property booking marketplace immediately. Build the booking management engine and direct booking pages first. Then later convert selected pages into marketplace inventory.

### 18.2 Booking Management side nav

```text
Bookings Home
Calendar
Listings
Availability
Rates
Direct Booking Pages
Guests / Customers
Payments
Deposits
Cleaning Turns
Messages
Reviews
Channel Sync
Disputes
Settings
```

### 18.3 Public direct booking flow

```text
Public property page
Availability check
Guest details
Add-ons
Rules acceptance
Payment/deposit
Confirmation
Customer portal
Pre-arrival messages
Checkout
Review
```

### 18.4 Booking tables

```text
booking_listings
booking_listing_photos
booking_availability
booking_rate_plans
booking_rate_rules
booking_blackout_dates
booking_orders
booking_guests
booking_payments
booking_deposits
booking_fees
booking_taxes
booking_cancellations
booking_refunds
booking_messages
booking_reviews
booking_channel_connections
booking_ical_feeds
booking_channel_events
booking_turnover_tasks
```

---

## 19. Customer workspace

Tenant portal should not simply become customer workspace. Keep both concepts:

- Tenant portal: tenancy-specific, low-friction, no signup required if owner wants.
- Customer workspace: booking/customer account across bookings, payments, disputes, support.

### 19.1 Customer side nav

```text
Home
My Bookings
Payments
Documents
Messages
Support
Disputes
Reviews
Profile
Settings
```

### 19.2 Customer account modes

```text
magic_link_guest
registered_customer
tenant_portal_user
business_customer
```

### 19.3 Customer capabilities

- view booking
- pay balance/deposit
- upload requested docs
- message property manager/supplier
- request support
- open dispute
- review supplier/property
- manage profile/privacy/export/delete

---

## 20. Utility setup and logistics layer

This should be later, but plan hooks now.

Potential modules:

- move-in utility setup
- broadband/energy/water referrals
- removals/logistics
- cleaning
- locksmith
- emergency repairs
- furniture packages
- appliance replacement
- compliance contractors

This connects to partner/affiliate/marketplace modules.

Do not build full utility marketplace immediately. Add data model hooks:

```text
utility_partner_profiles
utility_referrals
move_in_checklists
move_out_checklists
logistics_jobs
emergency_supplier_categories
```

---

## 21. Automation upgrades

Build two layers:

### 21.1 Smart Rules templates

Low overhead, high value:

- checkout tomorrow and no cleaner assigned
- HMO/shared housing licence due
- rent-to-rent margin below threshold
- supplier job overdue
- escrow release pending approval
- booking cancellation needs refund review
- property country pack changed
- unsupported legal/compliance module detected

### 21.2 Natural language builder

AI creates draft automation rules from plain English.

### 21.3 Canvas Lite

Do not build a giant Zapier clone. Build a constrained node canvas:

Node types:

```text
Trigger
Condition
Delay
Create Task
Send Notification
Request Approval
Create Draft Message
Assign Supplier
Create Booking Turnover
Calculate Money Impact
Flag Compliance Risk
AI Summarise
Webhook Later
```

Every automation must be context-aware and permission-aware.

---

## 22. Product organisation and side nav recommendations

### 22.1 Operator workspace side nav

```text
Home
Portfolio
Work
Bookings
Suppliers
Marketplace? or not
Planning
Money
Accounting
Calendar
Compliance
Legal
Documents
Automations
Messages
Settings
```

### 22.2 Supplier workspace side nav

```text
Home
Leads
Jobs
Calendar
Services
Packages
Coverage
Team
Quotes
Invoices
Payouts
Reviews
Compliance
Messages
Settings
```

### 22.3 Customer workspace side nav

```text
Home
Bookings
Payments
Documents
Messages
Support
Disputes
Reviews
Profile
```

### 22.4 Platform admin side nav

```text
Overview
Workspaces
Users
Countries
Country Packs
Billing
Marketplace
Escrow
Disputes
Suppliers
Customers
AI Providers
Security
Audit Logs
Release Gates
Settings
```

---

## 23. Supabase/RLS requirements

Every table must support:

- workspace ownership
- workspace type
- actor context
- portal grant context
- supplier workspace membership
- customer workspace membership
- platform admin override
- audit logs

Do not use one generic RLS rule for all marketplace contexts. Supplier/customer/portal/public booking flows need scoped policies.

Required membership tables:

```text
workspace_members
supplier_workspace_members
customer_workspace_members
portal_grants
marketplace_admin_roles
```

Required permission checks:

```text
can_view_property
can_manage_property
can_view_booking
can_manage_booking
can_view_supplier_job
can_manage_supplier_job
can_view_payment
can_manage_payment
can_view_escrow
can_release_escrow
can_open_dispute
can_resolve_dispute
can_manage_country_pack
```

---

## 24. Premium UI component requirements

Every new module must use premium enterprise patterns:

- full detail pages, not right drawers for complex objects
- tabbed detail pages
- timeline/activity rail
- evidence cards
- status badges
- audit banners
- country-pack banners
- risk chips
- AI explain buttons
- command buttons with confirmation
- skeleton loaders
- empty states
- mobile-specific card layouts
- responsive tables converted to cards on mobile
- sticky action bars for workflows
- approval modals for money/legal/dispute actions

Do not bury complex marketplace, booking or legal workflows in tiny modals.

---

## 25. Final implementation strategy

### Branching

```text
main = protected V1 property ops
feature/global-context-marketplace-architecture = global + marketplace architecture
feature/direct-bookings = direct booking pages and booking management
feature/supplier-workspace = supplier workspace
feature/marketplace-escrow-disputes = marketplace payments/disputes
feature/automation-builder = smart rules + canvas lite
```

### Build order

1. Context Engine
2. Global country/workspace/property fields
3. Country pack schema and GB pack
4. Multi-country portfolio behaviour
5. Money/accounting context upgrade
6. Legal/compliance country gating
7. Booking management and direct booking pages
8. Supplier workspace
9. Customer workspace
10. Supplier marketplace
11. Escrow/disputes
12. Booking marketplace
13. Automations
14. Admin global/marketplace control centre
15. Full tests and release gates

---

## 26. Final verdict

This upgrade can be huge, but only if it is structured properly.

The correct strategic shape is:

> Propvora remains a property operations SaaS at the core, then expands into country-aware operations, direct booking management, supplier workspaces, customer workspaces, and eventually supplier/property marketplaces with payments, escrow and disputes.

Do not merge marketplace into the current V1 shell without feature flags. Build it as an extender architecture that can be switched on by country, workspace type and plan.

The biggest product unlock is not â€œglobal translationsâ€. It is **context-aware property operations**.


---

# Source Pack: easy_shared_marketplace_structure.md

# PROPVORA COMBINED MARKETPLACE CANVAS â€” PROPERTY BOOKINGS + SUPPLIER SERVICES + CUSTOMER WORKSPACES + SUPPLIER WORKSPACES + ESCROW + DISPUTES + UNIFIED SEARCH

## 0. Strategic decision

Propvora should use a  **combined marketplace architecture** .

Do not build two totally separate marketplaces:

1. property booking marketplace
2. supplier contractor marketplace

That would duplicate:

* search
* filters
* profiles
* ratings
* reviews
* availability
* booking/ordering
* messages
* payments
* platform commission
* disputes
* public pages
* trust and verification
* admin moderation
* marketplace analytics
* policies
* customer workspace
* supplier/provider workspace

Instead, build one **Marketplace OS** with multiple marketplace listing types.

## Core principle

```text
Marketplace = unified discovery, trust, transaction, payment, review and dispute layer.

Booking listing = one marketplace listing type.
Supplier service/package = another marketplace listing type.
Utility/logistics/emergency services = later marketplace listing types.
```

This lets Propvora become:

> A property operations platform with a built-in marketplace for booking stays, booking suppliers, managing emergency jobs, handling payments, collecting reviews and resolving disputes â€” all connected to the property manager workspace.

---

# 1. Product architecture

## 1.1 Main app side-nav

Recommended manager workspace side-nav:

```text
Home
Portfolio
Work
Bookings
Marketplace
Planning
Money
Accounting
Calendar
Compliance
Legal
Contacts
Messages
Workspace
```

## 1.2 Marketplace internal side-nav

Inside `Marketplace`:

```text
Marketplace Home
Discover
Stays
Suppliers
Emergency
Requests
Orders
Leads
Messages
Payments
Escrow / Holds
Disputes
Reviews
Saved
My Listings
My Services
Marketplace Settings
```

## 1.3 Booking section remains operational

Inside `Bookings`:

```text
Booking Dashboard
Reservations
Booking Calendar
Listings
Availability
Pricing
Check-in / Checkout
Cleaning & Turnover
Guest Issues
Channel Sync
Direct Booking Pages
Booking Reports
Booking Settings
```

## 1.4 Supplier section can live under Work or Marketplace

Supplier operations can appear in two places:

### Under Work

For property manager operational jobs:

```text
Work Orders
Supplier Jobs
Quotes
Evidence
Maintenance Board
Emergency Dispatch
```

### Under Marketplace

For discovery and commerce:

```text
Supplier Search
Supplier Profiles
Packages
Requests
Reviews
Verification
Payments
Disputes
```

This avoids confusing marketplace discovery with internal work management.

---

# 2. Marketplace listing types

Create one table/model for marketplace listings with `listing_type`.

## 2.1 Listing types

```text
property_stay
serviced_accommodation
holiday_let
mid_term_stay
student_room
hmo_room
co_living_room
commercial_space
supplier_service
supplier_package
emergency_service
utility_setup
move_in_logistics
cleaning_turnover
maintenance_callout
compliance_service
professional_service
```

## 2.2 Core listing object

All marketplace listings share:

```text
marketplace_listing_id
listing_type
workspace_id
owner_user_id
provider_profile_id
property_id optional
unit_id optional
supplier_id optional
title
slug
short_description
long_description
country_code
region
city
postcode_zip
latitude
longitude
service_area
visibility
status
verification_status
risk_status
featured_status
pricing_model
currency
base_price
starting_price
instant_book_enabled
request_to_book_enabled
request_quote_enabled
availability_enabled
reviews_enabled
disputes_enabled
payments_enabled
escrow_enabled
platform_fee_percent
created_at
updated_at
published_at
```

## 2.3 Listing-type extensions

### Property booking extension

```text
max_guests
bedrooms
beds
bathrooms
amenities
house_rules
check_in_window
checkout_time
cancellation_policy_id
deposit_policy_id
damage_policy_id
licence_number
registration_number
local_authority_status
short_let_status
cleaning_fee
minimum_nights
maximum_nights
availability_calendar_id
pricing_profile_id
```

### Supplier extension

```text
supplier_profile_id
service_category
service_subcategory
emergency_category
licence_required
insurance_required
id_verification_required
average_response_time
emergency_response_time
service_radius
team_dispatch_enabled
fixed_package_enabled
quote_required
callout_fee
hourly_rate
availability_profile_id
```

### Utility/logistics extension

```text
utility_type
move_in_stage
property_access_required
customer_present_required
documents_required
provider_coverage_area
estimated_setup_time
```

---

# 3. Unified marketplace search

## 3.1 Search philosophy

Marketplace search should be unified but segmented by intent.

Search tabs:

```text
All
Stays
Suppliers
Emergency
Services
Utilities
Saved
```

Search input examples:

```text
â€œ2 bed serviced apartment in Manchesterâ€
â€œemergency plumber near Wokingâ€
â€œshort-let cleaner within 10 milesâ€
â€œHMO fire door installerâ€
â€œlocksmith available nowâ€
â€œstudent room in Leedsâ€
â€œEICR electricianâ€
â€œlinen service for serviced accommodationâ€
```

## 3.2 Search contexts

Search must change based on context:

### Customer searching for stay

Prioritise:

* location
* dates
* guests
* price
* property type
* reviews
* cancellation policy
* amenities
* check-in
* safety/compliance

### Property manager searching for supplier

Prioritise:

* category
* location radius
* verification
* insurance
* licence
* availability
* emergency response
* price
* reviews
* completed jobs
* dispute rate

### Supplier searching leads/jobs

Prioritise:

* category match
* service area
* urgency
* budget
* quote deadline
* access requirements
* verified property manager
* payment secured

### Property manager searching booking marketplace performance

Prioritise:

* listing conversion
* revenue
* occupancy
* channel source
* customer rating
* cancellation rate

## 3.3 Global filters

All listing types:

```text
location
country
region
city
distance
availability
price
rating
verified only
instant book
request quote
emergency available
language
currency
saved
previously used
top rated
```

## 3.4 Stay-specific filters

```text
dates
guests
bedrooms
bathrooms
beds
entire place
room
serviced accommodation
student room
co-living
pets allowed
parking
kitchen
washing machine
air conditioning
wifi
self check-in
family friendly
work friendly
accessibility
licence verified
short-let compliant evidence
```

## 3.5 Supplier-specific filters

```text
category
subcategory
emergency category
available now
response time
insurance verified
licence verified
ID verified
business verified
solo supplier
supplier team
fixed price package
hourly
quote only
accepts escrow/holds
accepts urgent jobs
service radius
completed jobs
dispute rate
repeat client rate
preferred supplier
```

## 3.6 Search result card types

### Stay card

* image carousel
* title
* location
* price per night
* total price
* rating
* reviews
* availability
* cancellation label
* instant book
* compliance badge
* save/share

### Supplier card

* supplier logo/photo
* category
* verification badges
* rating
* reviews
* response time
* emergency badge
* insurance badge
* licence badge
* service area
* starting price
* next availability
* completed jobs
* request quote
* book package
* emergency dispatch

### Emergency card

* supplier name
* emergency type
* live availability
* response radius
* estimated response time
* callout fee
* insurance/licence badges
* emergency call button
* dispatch button

---

# 4. Public marketplace structure

## 4.1 Public routes

```text
/marketplace
/marketplace/stays
/marketplace/suppliers
/marketplace/emergency
/marketplace/services
/marketplace/stays/[listingSlug]
/marketplace/suppliers/[supplierSlug]
/marketplace/services/[serviceSlug]
/marketplace/checkout/[draftId]
/marketplace/request/[requestId]
/marketplace/book/[listingId]
```

## 4.2 Logged-in routes

```text
/app/marketplace
/app/marketplace/discover
/app/marketplace/stays
/app/marketplace/suppliers
/app/marketplace/emergency
/app/marketplace/requests
/app/marketplace/orders
/app/marketplace/leads
/app/marketplace/messages
/app/marketplace/payments
/app/marketplace/disputes
/app/marketplace/reviews
/app/marketplace/saved
/app/marketplace/my-listings
/app/marketplace/my-services
/app/marketplace/settings
```

## 4.3 Admin routes

```text
/admin/marketplace
/admin/marketplace/listings
/admin/marketplace/suppliers
/admin/marketplace/bookings
/admin/marketplace/orders
/admin/marketplace/verifications
/admin/marketplace/disputes
/admin/marketplace/payments
/admin/marketplace/reviews
/admin/marketplace/categories
/admin/marketplace/fees
/admin/marketplace/risk
/admin/marketplace/content-moderation
/admin/marketplace/countries
```

---

# 5. User roles and workspace contexts

## 5.1 Property manager workspace

Can:

* publish booking listings
* publish supplier requests
* book suppliers
* manage bookings
* manage supplier jobs
* pay suppliers
* review suppliers
* raise disputes
* invite customers/guests
* invite suppliers
* configure marketplace settings
* enable/disable public listing visibility

## 5.2 Supplier workspace

Can:

* publish services/packages
* receive leads
* send quotes
* accept jobs
* manage team
* upload evidence
* invoice/request payout
* respond to disputes
* manage availability
* manage insurance/licence/ID verification
* collect reviews

## 5.3 Customer workspace

Can:

* book stays
* manage booking
* pay
* message manager
* check in
* report issues
* request changes
* review stay
* book add-ons if enabled
* see assigned supplier visit if permitted

## 5.4 Guest / no-signup portal

Magic-link access only.

Can:

* view booking
* pay balance
* see check-in info
* message
* report issue
* review
* upload required info

## 5.5 Admin workspace

Can:

* verify suppliers
* moderate listings
* manage disputes
* review payments
* manage marketplace fees
* manage categories
* manage countries
* suspend bad actors
* audit support access

---

# 6. Marketplace lifecycle models

## 6.1 Property stay lifecycle

```text
listing_draft
listing_review
listing_published
customer_search
booking_draft
payment_pending
pending_approval
confirmed
pre_arrival
checked_in
in_stay
checkout
inspection
completed
reviewed
disputed
refunded
closed
```

## 6.2 Supplier service lifecycle

```text
supplier_profile_draft
verification_pending
marketplace_published
property_manager_search
quote_request_sent
quote_received
quote_accepted
payment_authorised
job_scheduled
supplier_en_route
supplier_arrived
work_in_progress
evidence_submitted
manager_review
payment_released
reviewed
disputed
closed
```

## 6.3 Emergency lifecycle

```text
emergency_created
risk_assessed
supplier_searching
supplier_notified
supplier_accepted
backup_supplier_notified
supplier_en_route
arrived
temporary_fix
full_fix_required
completed
evidence_uploaded
payment_review
closed
disputed
```

---

# 7. Marketplace Home dashboard

## 7.1 Property manager marketplace home

Cards:

* direct booking revenue
* supplier spend
* marketplace commission paid
* active bookings
* active supplier jobs
* pending quotes
* emergency jobs
* disputes
* reviews awaiting response
* verification warnings
* payment holds

Sections:

* recommended suppliers
* recommended listing improvements
* booking leads
* supplier quote requests
* emergency supplier chain
* marketplace activity timeline
* AI marketplace insights

## 7.2 Supplier marketplace home

Cards:

* new leads
* quotes pending
* jobs scheduled
* emergency availability
* payout pending
* rating
* verification status
* insurance expiry
* disputes

Sections:

* lead inbox
* job calendar
* profile completion
* package performance
* review prompts
* AI profile improvement suggestions

## 7.3 Customer marketplace home

Cards:

* current booking
* upcoming bookings
* saved stays
* messages
* payments due
* check-in available
* issue status
* reviews due

---

# 8. Unified transaction model

A marketplace transaction can be:

```text
stay_booking
supplier_job
emergency_job
service_package
utility_setup
logistics_job
add_on_purchase
```

Core transaction fields:

```text
transaction_id
transaction_type
buyer_workspace_id
buyer_user_id
seller_workspace_id
seller_user_id
listing_id
reservation_id optional
supplier_job_id optional
status
currency
gross_amount
platform_fee_percent
platform_fee_amount
provider_fee_amount
tax_amount
seller_payout_amount
payment_provider
payment_intent_id
checkout_session_id
escrow_status
hold_status
refund_status
dispute_status
created_at
updated_at
```

---

# 9. Commission model

## 9.1 Supplier marketplace commission

Default:

```text
2.5% platform fee + payment provider fees
```

Fee examples:

* supplier job: 2.5% of gross job amount
* emergency job: 2.5% or emergency minimum fee
* service package: 2.5%
* supplier subscription later: optional
* promoted listing later: optional

## 9.2 Booking marketplace commission

Options:

1. Property manager pays SaaS only, no booking fee.
2. Propvora charges 2.5% direct booking fee.
3. Guest service fee + host fee later.
4. Lower fee for direct booking pages, higher for public marketplace leads.

Recommended:

```text
Direct booking pages: 0% to 1% intro or included in plan.
Public booking marketplace: 2.5% platform fee + payment provider fees.
Supplier marketplace: 2.5% platform fee + payment provider fees.
```

## 9.3 Fee flexibility

Fee rules table:

```text
marketplace_fee_rules
  id
  country_code
  transaction_type
  plan_tier
  category
  fee_percent
  minimum_fee
  maximum_fee
  provider_fee_pass_through
  tax_inclusive
  active
```

---

# 10. Payments, escrow and holds

## 10.1 Payment model options

Do not casually call Stripe escrow unless legally/provider-supported.

Use precise terminology:

```text
payment_authorisation
delayed_capture
platform_hold
connected_account_transfer
third_party_escrow
manual_invoice
```

## 10.2 Payment flows

### Stay booking

```text
customer pays
booking confirmed
funds held or captured
stay completed
refund window/dispute window
payout to property manager
platform fee recognised
```

### Supplier job

```text
manager accepts quote
payment authorised/captured
supplier performs work
evidence submitted
manager approves
payout released
platform fee recognised
```

### Emergency job

```text
manager authorises emergency payment or invoice
supplier attends
temporary/final fix recorded
evidence uploaded
payment reviewed
payout released
```

## 10.3 Release blocks

Payment release must block if:

* dispute open
* required evidence missing
* supplier insurance/licence invalid for required category
* sanctions/risk hold
* payment chargeback risk
* manager approval missing
* guest/tenant safety issue open
* platform admin hold active

---

# 11. Dispute system

## 11.1 Unified dispute types

### Stay disputes

* property not as described
* cancellation/refund
* access failure
* cleanliness
* safety issue
* guest damage
* unauthorised party
* deposit dispute
* overcharging
* missing amenity

### Supplier disputes

* no-show
* incomplete work
* poor quality
* unsafe work
* overcharging
* damage caused
* access denied
* scope changed
* payment release dispute
* licence/insurance issue

### Marketplace disputes

* fake review
* fraud
* off-platform payment
* abusive user
* chargeback
* identity mismatch
* sanctions/risk issue

## 11.2 Unified dispute lifecycle

```text
opened
acknowledged
evidence_requested
responses_pending
mediation
proposed_resolution
accepted
rejected
platform_review
payment_hold
resolved_refund
resolved_partial_refund
resolved_payout
resolved_no_fault
escalated_legal
closed
```

## 11.3 Dispute detail page

Tabs:

1. Overview
2. Parties
3. Transaction
4. Evidence
5. Messages
6. Payments
7. Timeline
8. Decision
9. Audit

Actions:

* request evidence
* hold payout
* release partial
* refund
* propose settlement
* suspend listing
* suspend supplier
* escalate legal
* close

---

# 12. Unified reviews and trust

## 12.1 Review types

```text
stay_review
guest_review
supplier_review
property_manager_review
customer_review
platform_review
```

## 12.2 Review fields

Stay review:

* cleanliness
* accuracy
* check-in
* communication
* location
* value
* overall

Supplier review:

* quality
* punctuality
* communication
* value
* professionalism
* evidence quality
* would use again
* overall

Property manager review:

* clarity of scope
* payment speed
* access readiness
* communication
* fairness

## 12.3 Moderation rules

Block/review:

* abuse
* hate/harassment
* personal data leakage
* fake reviews
* review extortion
* off-platform solicitation
* legal threats
* private address exposure

---

# 13. Verification and trust centre

Unified trust primitives:

```text
identity_verified
email_verified
phone_verified
business_verified
insurance_verified
licence_verified
payment_verified
country_reviewed
sanctions_screened
background_check_optional
top_rated
fast_responder
preferred
platform_verified
```

Supplier-specific verification:

* ID
* business
* insurance
* licence
* right to work
* category approval
* emergency approval

Property stay-specific verification:

* property ownership/right to let/right to operate confirmation
* licence/registration where required
* safety evidence
* insurance confirmation
* address verification optional
* local authority status
* host/property manager identity

Customer verification:

* email
* phone
* payment method
* ID if required
* risk score
* sanctions/country checks where required

---

# 14. Combined marketplace categories

## 14.1 Top-level marketplace categories

```text
Stays
Serviced Accommodation
Student Rooms
Co-Living
Commercial Spaces
Emergency Services
Maintenance
Compliance
Cleaning & Turnover
Utilities
Move-in Logistics
Professional Services
Furniture & Setup
Security
Technology
```

## 14.2 Supplier service categories

Same as previous supplier marketplace doc, but placed under the unified Marketplace taxonomy.

## 14.3 Booking categories

```text
entire_home
apartment
serviced_apartment
room
hmo_room
student_room
co_living_room
holiday_let
mid_term_stay
corporate_stay
commercial_space
event_space_later
```

## 14.4 Emergency categories

```text
locksmith
emergency_plumbing
emergency_electrician
gas_leak
boiler_breakdown
heating_failure
water_leak
flood_response
fire_damage
storm_damage
pest_emergency
security_boarding
glass_repair
drain_blockage
out_of_hours_cleaning
access_control_failure
```

---

# 15. Customer workspace in combined marketplace

Customer workspace should support both stays and service purchases.

## 15.1 Customer side-nav

```text
Home
My Bookings
My Requests
Messages
Payments
Documents
Issues
Reviews
Profile
Support
```

## 15.2 Customer booking detail

For stay:

* dates
* address/check-in
* guest details
* payment
* house rules
* issue reporting
* cancellation
* review

For service request:

* service type
* supplier
* appointment time
* property/access details
* payment
* status
* evidence
* issue/dispute
* review

## 15.3 No-signup portal mode

Allow magic links for:

* booking customer
* tenant affected by supplier job
* guest check-in
* issue report
* payment request
* review request

Do not force full customer signup for every interaction.

---

# 16. Supplier workspace in combined marketplace

Supplier workspace remains as defined in supplier marketplace doc, but now supplier listings are first-class marketplace listings.

Supplier can:

* create services
* create packages
* manage availability
* accept leads
* quote jobs
* manage team
* upload evidence
* receive payments
* manage reviews
* manage verification
* respond to disputes

Supplier can also later book stays as a customer if needed, using a separate customer context.

---

# 17. Property manager workspace in combined marketplace

Property manager can be:

1. marketplace seller of stays
2. buyer of supplier services
3. customer of utilities/logistics
4. admin of tenant/guest experience
5. payer in supplier jobs
6. recipient of booking revenue

This means the workspace must support multiple marketplace roles at once:

```text
marketplace_seller
marketplace_buyer
property_host
supplier_buyer
booking_manager
dispute_party
payment_recipient
payment_sender
```

---

# 18. Onboarding changes for combined marketplace

## 18.1 Property manager onboarding

Ask:

* Do you want to use Marketplace?
* Do you want direct booking pages?
* Do you want public marketplace listing?
* Do you want supplier marketplace access?
* Do you want emergency supplier dispatch?
* Do you want Stripe Connect payouts?
* What countries are your properties in?
* Are you legally allowed to accept bookings for these properties?
* Do you have required licences/registrations?
* Do you accept booking marketplace terms?
* Do you accept supplier marketplace terms?

## 18.2 Supplier onboarding

Ask:

* Solo or company?
* Services/categories
* Emergency services?
* Country/regions served
* ID verification
* Business verification
* Insurance upload
* Licence upload
* Availability
* Packages
* Stripe payouts
* Marketplace terms

## 18.3 Customer onboarding

Lightweight:

* name
* email
* phone
* country
* password optional
* magic-link default
* payment method at checkout
* ID verification if listing/service requires

---

# 19. Supabase schema

Core unified tables:

```text
marketplace_listings
marketplace_listing_media
marketplace_listing_categories
marketplace_listing_availability
marketplace_listing_pricing
marketplace_transactions
marketplace_orders
marketplace_messages
marketplace_reviews
marketplace_disputes
marketplace_dispute_evidence
marketplace_payments
marketplace_payouts
marketplace_refunds
marketplace_commissions
marketplace_fee_rules
marketplace_saved_items
marketplace_search_events
marketplace_audit_events
marketplace_terms_acceptances
marketplace_risk_flags
```

Booking-specific tables:

```text
booking_reservations
booking_guests
booking_checkin_instructions
booking_cleaning_tasks
booking_channel_connections
booking_channel_sync_events
booking_policy_snapshots
```

Supplier-specific tables:

```text
supplier_profiles
supplier_services
supplier_packages
supplier_service_areas
supplier_availability
supplier_verifications
supplier_insurance_policies
supplier_licences
supplier_quote_requests
supplier_quotes
supplier_jobs
supplier_job_evidence
supplier_job_variations
emergency_dispatch_events
```

Customer/portal tables:

```text
customer_profiles
customer_workspace_members
customer_portal_tokens
customer_booking_access
customer_service_access
```

---

# 20. RLS model

## Public

Can read only:

* published listing safe fields
* public supplier profile safe fields
* public review summaries
* public availability summaries if enabled

Cannot read:

* private address until booking confirmed
* check-in instructions
* supplier private insurance/licence docs
* payment data
* disputes
* internal notes
* audit logs

## Property manager

Can read/write:

* own marketplace listings
* own bookings
* supplier jobs in workspace
* transactions they are party to
* disputes they are party to

## Supplier

Can read/write:

* own supplier profile
* own services/packages
* jobs assigned to them
* quotes they created
* evidence they uploaded
* disputes they are party to

## Customer

Can read/write:

* own bookings
* own messages
* own payment records summary
* own reviews
* own disputes
* assigned service visit public info

## Admin

Can access through audited support/admin policies only.

---

# 21. API routes

Unified:

```text
/api/marketplace/search
/api/marketplace/listings
/api/marketplace/listings/[id]
/api/marketplace/availability
/api/marketplace/pricing
/api/marketplace/checkout
/api/marketplace/orders
/api/marketplace/messages
/api/marketplace/reviews
/api/marketplace/disputes
/api/marketplace/payments
/api/marketplace/refunds
/api/marketplace/commissions
/api/marketplace/saved
/api/marketplace/risk
```

Booking:

```text
/api/bookings/reservations
/api/bookings/checkin
/api/bookings/channel-sync
/api/bookings/ical
/api/bookings/cleaning
```

Supplier:

```text
/api/suppliers
/api/suppliers/verification
/api/suppliers/services
/api/suppliers/packages
/api/suppliers/quotes
/api/supplier-jobs
/api/emergency-dispatch
```

Every route requires:

* auth where needed
* RLS-safe query
* zod validation
* country support check
* sanctions/risk check when payment/public listing involved
* audit log for mutations
* payment status validation
* feature flag check
* rate limiting for public/search/checkout/message routes

---

# 22. Interconnectivity with existing Propvora modules

## Portfolio

Listings link to:

* property
* unit
* operation profile
* compliance profile
* local authority
* owner/investor reporting

## Work

Supplier jobs become work orders.

A supplier marketplace job should create or link to:

* task
* supplier job
* property
* unit
* tenant/guest access
* evidence
* invoice/payment
* timeline

## Bookings

Booking marketplace transactions create reservations and booking ops tasks.

## Money

Money sees:

* booking revenue
* supplier spend
* deposits
* refunds
* platform fees
* payment provider fees
* payouts
* escrow/hold balances

## Accounting

Accounting receives:

* booking revenue journals
* supplier expense journals
* platform fee income
* tax lines
* refund entries
* payout entries
* dispute provisions/adjustments

## Legal

Legal controls:

* booking terms
* supplier terms
* dispute rules
* licence disclaimers
* country rules
* booking policy snapshots
* supplier verification disclaimers

## Compliance

Compliance controls:

* listing publish readiness
* supplier licence requirements
* insurance checks
* short-let rules
* emergency job safety checks
* evidence requirements

## AI

AI can:

* recommend suppliers
* draft booking listing
* compare quotes
* summarise disputes
* suggest pricing
* generate checklists
* draft messages
* flag risk

AI cannot:

* decide disputes alone
* release payments alone
* verify legal compliance
* approve licences alone
* override blocked countries

---

# 23. Automation templates

Marketplace automation categories:

## Booking automations

* booking confirmed â†’ create cleaning task
* payment overdue â†’ remind guest
* check-in 48h away â†’ release instructions if safe
* checkout complete â†’ request review
* issue reported â†’ create urgent work order

## Supplier automations

* emergency issue raised â†’ notify verified suppliers
* supplier accepts â†’ notify tenant/guest
* evidence missing â†’ block payment release
* supplier insurance expired â†’ block new jobs
* quote deadline nearing â†’ remind suppliers

## Payment automations

* job approved â†’ release payout
* dispute opened â†’ hold payout
* refund approved â†’ create refund
* platform fee earned â†’ create accounting entry

## Trust automations

* licence expires soon â†’ notify supplier/admin
* supplier dispute rate high â†’ admin review
* fake review suspected â†’ moderation queue
* country mismatch â†’ risk review

---

# 24. Combined marketplace UI components

Core components:

```text
MarketplaceShell
MarketplaceSearchBar
MarketplaceFilterPanel
MarketplaceResultGrid
MarketplaceResultMap
MarketplaceListingCard
MarketplaceStayCard
MarketplaceSupplierCard
MarketplaceEmergencyCard
MarketplaceTabs
MarketplaceSavedButton
MarketplaceTrustBadges
MarketplacePriceBreakdown
MarketplaceCheckoutStepper
MarketplaceRequestWizard
MarketplaceOrderTimeline
MarketplaceDisputeTimeline
MarketplaceReviewCard
MarketplaceCommissionPanel
MarketplaceRiskBadge
MarketplaceCountryNotice
MarketplaceTermsAcceptance
```

Booking components:

```text
StayListingHero
StayAvailabilityPicker
GuestSelector
BookingFeeBreakdown
CheckinInstructionPanel
ReservationTimeline
GuestPortalTripCard
```

Supplier components:

```text
SupplierProfileHeader
SupplierVerificationPanel
SupplierPackageCard
SupplierQuoteWizard
SupplierAvailabilityCalendar
EmergencyDispatchPanel
SupplierEvidenceUploader
SupplierLicencePanel
SupplierInsurancePanel
```

---

# 25. Legal docs for combined marketplace

Required policies:

```text
Marketplace Terms
Booking Terms
Guest Terms
Host / Property Manager Terms
Supplier Terms
Supplier Verification Policy
Insurance and Licence Disclaimer
Payment and Payout Terms
Escrow / Payment Hold Terms
Dispute Resolution Policy
Refund Policy
Cancellation Policy
Review Policy
Off-Platform Payment Policy
Emergency Services Disclaimer
Marketplace Content Policy
Sanctions and Restricted Countries Policy
Marketplace Privacy Notice
Data Processing Addendum
```

Key wording:

* Propvora provides marketplace and SaaS tools.
* Propvora is not the property owner, host, supplier, contractor, travel agent, insurer, solicitor or tax adviser unless explicitly stated otherwise.
* Booking contract is between customer and property manager/listing provider.
* Supplier service contract is between property manager/customer and supplier.
* Propvora may facilitate payment, hold, payout, refund and dispute workflows depending on provider capability.
* Verification badges mean evidence has been submitted/checked to stated level, not a guarantee of future performance.
* Users remain responsible for local property, safety, tax, licensing and consumer-law compliance.
* Country support varies.
* Restricted countries and sanctioned persons/entities cannot use the marketplace.

---

# 26. Branch strategy

Create branch:

```text
feature/combined-marketplace-os
```

Do not merge into launch branch until feature flags and tests are complete.

Sub-branches:

```text
feature/marketplace-core-search
feature/marketplace-booking-listings
feature/marketplace-supplier-listings
feature/marketplace-payments-commission
feature/marketplace-disputes
feature/marketplace-customer-workspace
feature/marketplace-supplier-workspace
feature/marketplace-admin
```

Feature flags:

```text
marketplace_enabled
marketplace_public_search_enabled
marketplace_stays_enabled
marketplace_suppliers_enabled
marketplace_emergency_enabled
marketplace_checkout_enabled
marketplace_payments_enabled
marketplace_commission_enabled
marketplace_disputes_enabled
marketplace_reviews_enabled
supplier_workspace_enabled
customer_workspace_enabled
booking_marketplace_enabled
```

---

# 27. Release order

## Release 1 â€” private marketplace foundation

* marketplace shell
* unified listing model
* supplier listings private
* booking listings private/direct only
* search internal only
* no public SEO marketplace
* no escrow yet
* basic payments/commission tracking

## Release 2 â€” direct booking + supplier work orders

* direct booking pages
* customer portal
* supplier workspace
* quote/work-order flow
* iCal sync
* reviews internal

## Release 3 â€” verified supplier marketplace

* supplier search
* packages
* emergency dispatch
* insurance/licence verification
* Stripe Connect/payment holds
* disputes

## Release 4 â€” property booking marketplace

* public stay search
* public listing pages
* checkout
* reviews
* host/property manager trust
* customer workspace

## Release 5 â€” full marketplace scale

* combined public marketplace
* advanced ranking
* sponsored listings
* escrow provider if needed
* advanced dispute admin
* international country packs
* marketplace API

---

# 28. Final recommendation

Combined Marketplace is the right architecture.

The final structure should be:

```text
Marketplace
  Discover
  Stays
  Suppliers
  Emergency
  Requests
  Orders
  Payments
  Disputes
  Reviews
  Saved
  My Listings
  My Services
  Settings
```

But keep operational areas separate:

```text
Bookings = reservation operations
Work = supplier job/work-order operations
Marketplace = discovery, commerce, trust, payments, reviews and disputes
```

This gives Propvora the upside of a large marketplace without making the product messy.

The real moat becomes:

> One property platform where operators can manage portfolios, publish booking pages, sell stays, book verified suppliers, dispatch emergency contractors, collect payments, handle disputes, track accounting and use AI automation â€” all tied back to the same property, unit, tenancy, booking, job and ledger records.
>


---

# Source Pack: booking_marketplace_upgrade.md

# PROPVORA BOOKING SYSTEM CANVAS â€” AIRBNB-LEVEL FUNCTIONAL DEPTH FOR DIRECT BOOKINGS, CUSTOMER WORKSPACE AND PROPERTY MANAGER WORKSPACE

## 0. Strategic decision

Propvora should not jump straight into a full public Airbnb clone.

The correct phased architecture is:

1. **Phase 1 â€” Direct Booking Management**
   * Property manager creates public booking pages.
   * Customers book directly.
   * Propvora manages availability, payments, check-in, cleaning, rules, deposits, cancellations, messaging, tasks, accounting and reporting.
   * External platforms sync by iCal first.
2. **Phase 2 â€” Customer Workspace**
   * Guest/customer gets a lightweight account or magic-link booking portal.
   * They can manage their booking, messages, payments, documents, check-in, extras, issues and reviews.
3. **Phase 3 â€” Supplier Workspace**
   * Cleaners, locksmiths, maintenance teams, linen services, emergency suppliers and property-service providers manage jobs, availability, packages, teams, invoices and work orders.
4. **Phase 4 â€” Supplier Marketplace**
   * Property managers can discover/book suppliers.
   * Supplier can list services, prices, service areas, packages and availability.
   * Stripe Connect or escrow provider handles payments.
5. **Phase 5 â€” Property Booking Marketplace**
   * Public discovery like Airbnb.
   * Search by city/date/guests/property type.
   * Reviews, ranking, host verification, guest verification, deposits, disputes, refunds, damage claims.
   * This should be feature-flagged and built in a separate GitHub branch until legally/product-ready.

---

# 1. Product modules required

## 1.1 New main app section: Booking Management

Add a new main side-nav option:

`Bookings`

Inside Booking Management:

1. Booking Dashboard
2. Calendar
3. Listings
4. Availability
5. Pricing
6. Reservations
7. Guests / Customers
8. Payments & Deposits
9. Messages
10. Check-in / Checkout
11. House Rules
12. Cleaning & Turnover
13. Maintenance During Stay
14. Issues & Claims
15. Reviews
16. Channel Sync
17. Direct Booking Pages
18. Reports
19. Settings

## 1.2 New app section: Public Booking Pages

Public side:

1. Search / availability page
2. Listing detail page
3. Booking checkout
4. Guest account / magic-link booking portal
5. Booking confirmation page
6. Check-in page
7. Issue reporting page
8. Review page
9. Cancellation / modification request page

## 1.3 Customer workspace

Customer/guest side-nav:

1. My Bookings
2. Trip Details
3. Messages
4. Payments
5. Check-in
6. House Rules
7. Documents
8. Report Issue
9. Extras
10. Reviews
11. Profile
12. Support

## 1.4 Property manager workspace

Property manager side-nav additions:

1. Booking Management
2. Channel Sync
3. Guest CRM
4. Cleaning Operations
5. Owner/Investor Reporting
6. Supplier Jobs
7. Revenue Management
8. Booking Settings
9. Booking Legal & Policies

---

# 2. Airbnb-style system objects Propvora needs

## 2.1 Member / user objects

Types:

* property manager
* workspace owner
* property staff
* co-host / booking manager
* cleaner
* maintenance supplier
* guest / customer
* additional guest
* emergency contact
* owner/investor
* platform admin
* support agent

Fields:

* user_id
* workspace_id
* role
* customer_profile_id
* supplier_profile_id
* legal_name
* display_name
* email
* phone
* country
* preferred_language
* timezone
* identity_status
* risk_status
* sanctions_status
* payment_customer_id
* communication_preferences
* marketing_consent
* emergency_contact
* account_status

## 2.2 Listing object

A booking listing is not the same as a property record.

A property may have:

* one full-home listing
* multiple room listings
* serviced accommodation listing
* mid-term stay listing
* student stay listing
* add-on services
* owner-only/private booking page

Fields:

* listing_id
* workspace_id
* property_id
* unit_id
* listing_type
* operation_profile
* title
* short_description
* full_description
* public_slug
* status
* visibility
* booking_mode
* instant_book_enabled
* request_to_book_enabled
* manual_approval_required
* country_code
* legal_jurisdiction
* address_visibility_level
* location_summary
* latitude
* longitude
* check_in_window_start
* check_in_window_end
* checkout_time
* max_guests
* bedrooms
* beds
* bathrooms
* floor_area
* floor_area_unit
* amenities
* accessibility_features
* safety_features
* house_rules
* quiet_hours
* party_policy
* smoking_policy
* pet_policy
* child_policy
* event_policy
* cancellation_policy_id
* deposit_policy_id
* damage_policy_id
* cleaning_policy_id
* tax_profile_id
* pricing_profile_id
* availability_profile_id
* public_photos
* private_checkin_photos
* licence_number
* registration_number
* compliance_status
* local_authority_status
* created_at
* updated_at

## 2.3 Reservation object

Fields:

* reservation_id
* booking_reference
* listing_id
* workspace_id
* property_id
* unit_id
* customer_id
* primary_guest_id
* status
* lifecycle_stage
* source_channel
* channel_reservation_id
* direct_booking_page_id
* check_in_date
* check_out_date
* nights
* adults
* children
* infants
* pets
* total_guests
* guest_country
* host_country
* property_country
* currency
* base_price
* cleaning_fee
* service_fee
* platform_fee
* host_fee
* taxes
* tourist_tax
* deposit_amount
* damage_hold_amount
* total_price
* amount_paid
* amount_due
* payout_amount
* cancellation_policy_snapshot
* house_rules_snapshot
* legal_terms_snapshot
* guest_message
* host_notes
* internal_notes
* risk_score
* fraud_score
* party_risk_score
* payment_status
* deposit_status
* checkin_status
* checkout_status
* review_status
* dispute_status
* created_at
* updated_at

## 2.4 Availability object

Availability must be separate from listing.

Fields:

* listing_id
* date
* status
* source
* source_channel
* block_reason
* reservation_id
* min_nights
* max_nights
* checkin_allowed
* checkout_allowed
* preparation_time
* advance_notice
* cut_off_time
* price_override
* currency
* notes

Statuses:

* available
* blocked_manual
* blocked_owner
* blocked_maintenance
* blocked_cleaning
* blocked_external_channel
* booked_direct
* booked_airbnb
* booked_booking_com
* booked_vrbo
* pending_request
* provisional_hold
* unavailable_compliance
* unavailable_payment_issue
* unavailable_licence_issue

## 2.5 Pricing object

Pricing must support nightly, weekly, monthly and custom seasonal pricing.

Fields:

* pricing_profile_id
* listing_id
* base_nightly_rate
* weekend_rate
* weekly_discount
* monthly_discount
* minimum_rate
* maximum_rate
* cleaning_fee
* linen_fee
* pet_fee
* extra_guest_fee
* early_checkin_fee
* late_checkout_fee
* security_deposit
* damage_hold
* service_fee_mode
* tax_inclusive
* tax_exclusive
* currency
* country_tax_profile
* seasonal_rules
* event_rules
* gap-night_rules
* occupancy_rules
* AI_recommendation_enabled

## 2.6 Customer / guest profile

Fields:

* customer_id
* user_id
* full_name
* email
* phone
* country
* language
* date_of_birth_optional
* identity_verified
* document_verification_status
* payment_methods
* previous_bookings
* reviews_count
* average_rating
* internal_risk_flags
* banned_status
* party_risk_history
* damage_history
* cancellation_history
* communication_history
* marketing_consent
* privacy_region

## 2.7 Booking payment object

Fields:

* payment_id
* reservation_id
* workspace_id
* customer_id
* payment_provider
* stripe_payment_intent_id
* stripe_checkout_session_id
* stripe_customer_id
* amount
* currency
* payment_status
* capture_method
* deposit_amount
* deposit_status
* refund_status
* chargeback_status
* platform_fee_amount
* provider_fee_amount
* property_manager_payout
* supplier_payout
* tax_amount
* payment_due_at
* captured_at
* refunded_at
* failure_reason

## 2.8 Dispute / issue object

Fields:

* dispute_id
* reservation_id
* workspace_id
* raised_by
* issue_type
* severity
* description
* evidence_files
* photos
* messages
* requested_amount
* proposed_resolution
* status
* assigned_support_agent
* decision
* refund_amount
* damage_charge_amount
* payout_hold_amount
* legal_escalation_required
* created_at
* resolved_at

Issue types:

* property not as described
* access/check-in problem
* cleanliness issue
* safety issue
* maintenance failure
* noise/neighbour issue
* guest damage
* unauthorised party
* over-occupancy
* late checkout
* non-payment
* cancellation dispute
* refund dispute
* deposit dispute
* supplier failure

---

# 3. Booking lifecycle stages

## Stage 1 â€” Listing setup

Property manager creates booking listing.

Required pages:

* `/app/bookings/listings`
* `/app/bookings/listings/new`
* `/app/bookings/listings/[id]/overview`
* `/app/bookings/listings/[id]/content`
* `/app/bookings/listings/[id]/photos`
* `/app/bookings/listings/[id]/pricing`
* `/app/bookings/listings/[id]/availability`
* `/app/bookings/listings/[id]/rules`
* `/app/bookings/listings/[id]/legal`
* `/app/bookings/listings/[id]/tax`
* `/app/bookings/listings/[id]/publish`

Wizard steps:

1. Select property/unit
2. Listing type
3. Location visibility
4. Guest capacity
5. Amenities
6. Photos/media
7. Description
8. House rules
9. Check-in/check-out
10. Pricing
11. Fees
12. Cancellation policy
13. Deposit/damage policy
14. Tax/local charges
15. Licence/compliance evidence
16. Booking mode
17. Channel sync
18. Review and publish

Required validation:

* listing cannot publish without property/unit
* listing cannot publish without photos
* listing cannot publish without price
* listing cannot publish without availability profile
* listing cannot publish without cancellation policy
* listing cannot publish without house rules
* listing cannot publish without legal disclaimer acceptance
* listing cannot publish if country pack blocks short-let/direct booking
* listing cannot publish if local licence evidence required and missing

## Stage 2 â€” Pre-booking discovery

Public customer sees listing.

Pages:

* `/stay/[workspaceSlug]`
* `/stay/[workspaceSlug]/[listingSlug]`
* `/stay/search`
* `/stay/map`
* `/stay/wishlist`
* `/stay/compare`

Search filters:

* location
* dates
* guests
* property type
* listing type
* price range
* bedrooms
* bathrooms
* beds
* amenities
* accessibility
* pets
* cancellation flexibility
* instant book
* work-friendly
* family-friendly
* parking
* kitchen
* washing machine
* air conditioning
* pool
* hot tub
* self check-in
* country/region
* licence verified
* professionally managed

Search result cards:

* image carousel
* title
* location
* nightly price
* total trip price
* rating
* review count
* cancellation label
* instant book label
* available dates
* badges
* map pin
* save/share buttons

Legal/UX requirements:

* show total price before checkout
* show fees breakdown
* show taxes estimate
* show cancellation policy
* show house rules
* show local compliance note
* show platform role disclaimer
* show host/property manager identity
* show support/contact route

## Stage 3 â€” Booking intent

Customer selects dates and guests.

System checks:

* date availability
* min/max nights
* advance notice
* cut-off time
* preparation time
* guest capacity
* pet rules
* child/infant rules
* party risk
* country availability
* tax profile
* payment profile
* fraud risk
* sanctions/country restrictions
* calendar conflict
* external channel holds
* compliance blocks

Booking modes:

1. Instant book
2. Request to book
3. Enquiry first
4. Manual quote
5. Private invite-only
6. Owner/internal block
7. Corporate booking
8. Mid-term booking
9. Long-stay application

## Stage 4 â€” Checkout

Checkout page:

* `/stay/[listingSlug]/checkout`
* `/booking/checkout/[draftId]`

Checkout sections:

1. Trip summary
2. Guest details
3. Additional guests
4. Arrival time
5. Special requests
6. Rules acceptance
7. Cancellation policy acceptance
8. Damage/deposit policy acceptance
9. Local tax/registration notice
10. Payment
11. Promo/referral code
12. Final price breakdown
13. Confirm booking

Required fields:

* full name
* email
* phone
* country
* billing country
* guest count
* arrival time
* purpose of stay optional
* ID verification if required
* acceptance checkboxes
* payment method
* tax invoice details optional
* company booking details optional
* emergency contact optional

Legal acceptance checkboxes:

* accept house rules
* accept cancellation policy
* accept platform terms
* accept privacy policy
* accept damage/deposit policy
* confirm guest count accurate
* confirm no unauthorised party/event
* confirm local rules notice read
* confirm legal authority if booking for minors/additional guests
* consent to guest data being shared with property manager for booking fulfilment

## Stage 5 â€” Booking confirmation

System creates:

* reservation
* booking reference
* payment intent/session
* booking ledger rows
* owner/property manager notification
* guest confirmation email
* guest portal access
* calendar blocks
* cleaning task
* check-in task
* pre-arrival reminder
* payout schedule
* revenue forecast
* accounting entries/drafts
* audit log

Status flow:

* draft
* pending_payment
* pending_host_approval
* confirmed
* rejected
* expired
* cancelled
* checked_in
* checked_out
* completed
* disputed
* refunded

## Stage 6 â€” Pre-arrival management

Property manager tasks:

* verify payment
* verify ID if required
* assign cleaner
* confirm linen
* check maintenance blockers
* send pre-arrival message
* collect arrival time
* confirm check-in method
* verify access codes
* prepare welcome guide
* review special requests
* ensure compliance docs/guest registration if required
* risk check for party/fraud

Guest portal:

* trip details
* countdown
* message host
* add guests
* upload documents if required
* pay balance
* request change
* cancel
* arrival time
* check-in instructions locked/unlocked by rule
* house rules
* local guide
* extras/add-ons
* support

Automations:

* T-14 days: payment balance reminder
* T-7 days: arrival details request
* T-3 days: cleaner assignment check
* T-48 hours: release check-in instructions
* T-24 hours: access code validation
* arrival day: welcome message
* checkout day: checkout instructions
* T+1 day: review request
* T+3 days: deposit release review

## Stage 7 â€” Check-in

Check-in system:

* self check-in
* meet-and-greet
* smart lock
* key safe
* reception/concierge
* manual staff handoff

Fields:

* access method
* access code
* access code rotation rule
* check-in window
* ID verification required
* arrival time
* parking instructions
* building entry instructions
* unit entry instructions
* emergency contact
* WiFi details
* safety instructions
* local rules
* check-in photos
* check-in confirmation

Legal/security:

* check-in instructions should be released only when safe:
  * booking confirmed
  * payment paid
  * ID verified if required
  * cancellation window rule satisfied
  * no risk hold
* sensitive instructions must not be public.
* audit every access to check-in instructions.

## Stage 8 â€” In-stay management

Guest can:

* message property manager
* report issue
* request maintenance
* request extra cleaning
* extend stay
* change guest count
* request late checkout
* buy extras
* view house manual
* emergency contact
* upload photos
* open support ticket

Property manager can:

* view live stays
* triage issues
* dispatch supplier
* notify cleaner
* create maintenance job
* issue partial refund
* charge extra fees if policy allows
* log incident
* mark risk
* update guest notes

Supplier integration:

* cleaner gets task
* maintenance supplier gets job
* emergency supplier gets urgent callout
* supplier can update status
* supplier can upload proof/photos
* supplier can invoice or mark included

## Stage 9 â€” Checkout

Checkout workflow:

* checkout reminder
* checkout instructions
* late checkout request
* key return confirmation
* cleaner inspection
* damage inspection
* missing item checklist
* meter reading optional
* photo evidence
* guest departure status

Post-checkout states:

* checked_out_pending_clean
* cleaning_in_progress
* inspection_pending
* damage_review
* deposit_release_pending
* completed
* disputed

## Stage 10 â€” Post-booking

Actions:

* release deposit / damage hold
* process refund if needed
* finalize payout
* post revenue to accounting
* create owner statement
* send review request
* collect guest feedback
* update listing rating
* update customer profile
* mark cleaning complete
* trigger next stay preparation
* archive messages
* close disputes
* export invoice/receipt
* record taxes

---

# 4. Property manager workspace requirements

## 4.1 Booking dashboard

Widgets:

* todayâ€™s arrivals
* todayâ€™s departures
* current guests
* occupancy %
* revenue this month
* ADR
* RevPAR
* cleaning status
* payment issues
* pending approvals
* disputes
* channel sync errors
* direct booking conversion
* cancellation rate
* average review score

## 4.2 Calendar

Views:

* month
* week
* day
* timeline
* listing grid
* property grid
* cleaner schedule
* supplier schedule
* channel sync view

Calendar actions:

* block dates
* unblock dates
* set price override
* set min nights
* add maintenance block
* add owner stay
* add channel hold
* drag reservation
* approve request
* reject request
* open reservation drawer/page
* sync now
* create cleaning task

## 4.3 Reservations register

Views:

* all reservations
* arrivals
* departures
* in-house
* pending approval
* payment due
* cancellations
* disputes
* channel bookings
* direct bookings

Columns:

* booking ref
* guest
* listing
* property
* dates
* nights
* source
* status
* payment
* total
* payout
* cleaning
* risk
* actions

Actions:

* open booking
* message guest
* approve/reject
* modify
* cancel
* refund
* charge fee
* assign cleaner
* report damage
* open dispute
* export invoice
* send check-in

## 4.4 Reservation detail page

Tabs:

1. Overview
2. Guest
3. Payments
4. Messages
5. Check-in
6. Tasks
7. Cleaning
8. Issues
9. Documents
10. Timeline
11. Accounting
12. Audit

Overview:

* status card
* dates
* countdown
* guest count
* total price
* payment status
* risk flags
* checklist
* next actions

Guest tab:

* profile
* contact
* additional guests
* ID status
* past bookings
* reviews
* notes

Payments tab:

* price breakdown
* platform fee
* cleaning fee
* taxes
* deposit
* payment history
* refunds
* payout schedule
* Stripe events
* ledger links

Messages tab:

* customer messages
* automated messages
* internal notes
* templates
* AI reply drafts

Check-in tab:

* check-in method
* instructions
* access codes
* release status
* arrival time
* guest acknowledgement

Tasks tab:

* pre-arrival tasks
* cleaning tasks
* maintenance tasks
* checkout tasks
* post-stay tasks

Issues tab:

* issue log
* damage claims
* evidence
* dispute status
* refund/charge decisions

Accounting tab:

* revenue recognition
* tax lines
* payment entries
* payout entries
* supplier cost allocation
* owner statement link

Audit tab:

* every status change
* every payment event
* every message sent
* every instruction release
* every refund/charge/dispute action

## 4.5 Listing management

Listing detail tabs:

1. Overview
2. Content
3. Photos
4. Availability
5. Pricing
6. Fees
7. Rules
8. Check-in
9. Compliance
10. Legal
11. Channels
12. Performance
13. Reviews
14. Audit

## 4.6 Revenue management

Features:

* occupancy chart
* ADR
* RevPAR
* booking window
* cancellation rate
* channel mix
* direct booking conversion
* gap nights
* cleaning cost per stay
* average margin
* property profitability
* AI pricing suggestions
* seasonal calendar
* event pricing
* minimum stay optimization

---

# 5. Customer workspace requirements

## 5.1 Access model

Customer can access by:

* full account
* magic link
* booking reference + email
* invited guest link
* corporate account invite

Customer workspace must not expose manager workspace data.

## 5.2 Customer side-nav

1. My Bookings
2. Current Trip
3. Messages
4. Payments
5. Check-in
6. House Rules
7. Documents
8. Extras
9. Report Issue
10. Reviews
11. Profile
12. Support

## 5.3 My Bookings

Shows:

* upcoming bookings
* current stay
* past stays
* cancelled bookings
* booking status
* payment status
* check-in status
* next action

## 5.4 Trip detail

Sections:

* dates
* address / location
* access timing
* guest count
* host/property manager
* house rules
* cancellation policy
* payment summary
* check-in instructions
* local guide
* emergency contact

## 5.5 Customer payments

Customer can:

* pay balance
* view receipts
* view deposit/hold
* request refund
* see refund status
* update payment method
* view tax invoice if available
* view cancellation charges

## 5.6 Customer modifications

Customer can request:

* change dates
* add nights
* reduce nights
* change guest count
* add pets
* early check-in
* late checkout
* cancellation
* invoice details
* accessibility support

All modification requests must go to property manager approval unless rules allow auto-approval.

## 5.7 Customer issue reporting

Wizard:

1. Select issue type
2. Add description
3. Add photos/video
4. Select urgency
5. Confirm property access permission
6. Submit

Issue types:

* canâ€™t access property
* cleanliness
* maintenance
* safety
* noise
* missing amenity
* heating/cooling
* water/electricity
* WiFi
* pest
* neighbour issue
* refund request
* other

## 5.8 Customer reviews

Review fields:

* overall rating
* cleanliness
* accuracy
* check-in
* communication
* location
* value
* written review
* private feedback
* issue resolved rating

Review should only unlock after checkout.

---

# 6. Booking legal framework required

## 6.1 Platform role wording

Propvora must define whether it is:

* SaaS booking tool only
* payment facilitator/platform
* marketplace operator
* disclosed agent
* merchant of record
* payment collection agent
* property managerâ€™s software provider

Recommended Phase 1 position:

> Propvora provides software tools for property managers to publish direct booking pages, manage reservations, take payments, communicate with guests and coordinate operations. The booking contract is between the property manager/listing provider and the guest unless a separate written agreement says otherwise.

## 6.2 Legal documents required

Public/customer:

* Booking Terms
* Guest Terms
* Direct Booking Terms
* Cancellation Policy
* Refund Policy
* Damage & Deposit Policy
* House Rules Policy
* Privacy Policy
* Cookie Policy
* Payment Terms
* Guest Data Processing Notice
* Non-discrimination / fair use policy
* Safety and emergency disclaimer
* Review Policy

Property manager:

* Booking Management Terms
* Host / Property Manager Terms
* Payout Terms
* Tax Disclaimer
* Local Compliance Disclaimer
* Listing Accuracy Warranty
* Insurance Disclaimer
* Supplier Dispatch Disclaimer
* Channel Sync Disclaimer
* AI Use Disclaimer

Marketplace later:

* Marketplace Terms
* Supplier Terms
* Customer Terms
* Escrow Terms
* Dispute Rules
* Commission Terms
* Off-platform Fee Policy
* Reviews Policy
* Content Policy
* Identity Verification Policy
* Sanctions / Restricted Countries Policy

## 6.3 Legal fields per listing

* legal provider name
* company number optional
* licence number
* registration number
* local authority
* insurance confirmation
* right to short-let confirmation
* landlord consent confirmation
* planning/zoning confirmation
* tax registration flag
* max occupancy basis
* safety checklist evidence
* cancellation policy
* house rules
* deposit policy
* damage policy
* guest registration requirement
* privacy notice version
* terms version

## 6.4 Legal acceptance events

Store:

* terms_version
* policy_version
* user_id
* reservation_id
* IP address
* user agent
* timestamp
* country
* language
* accepted fields
* checkout snapshot

Never rely only on checkbox state in frontend.

## 6.5 Local compliance warnings

Every listing should show country-pack warnings:

* short-let licence may be required
* local taxes may apply
* registration may be needed
* tenancy rights may arise for longer stays
* host/property manager remains responsible for legal compliance
* Propvora is not legal/tax advice

---

# 7. Pre-booking management

Property manager must manage before bookings are accepted.

## 7.1 Listing readiness checklist

* property linked
* unit linked
* photos uploaded
* public description complete
* pricing set
* availability open
* rules set
* cancellation policy selected
* cleaning fee set
* check-in method set
* local compliance checked
* insurance confirmed
* tax profile configured
* payment account connected
* booking page previewed
* terms accepted

## 7.2 Risk controls

* minimum stay
* max stay
* advance notice
* preparation time
* same-day booking allowed
* local booking restriction
* guest age requirement where lawful
* party risk attestation
* max guests
* pet rules
* ID verification requirement
* deposit requirement
* manual approval threshold
* block high-risk booking pattern

## 7.3 Availability controls

* recurring availability
* seasonal open/close
* owner blocks
* maintenance blocks
* cleaning buffers
* minimum gap
* linked unit/listing conflict rules
* channel sync import/export
* manual override
* blackout dates

## 7.4 Pricing controls

* base nightly
* weekend
* weekly
* monthly
* seasonal
* event pricing
* last-minute discount
* early-bird discount
* gap-night discount
* extra guest fee
* cleaning fee
* linen fee
* pet fee
* damage deposit
* tourist tax
* service fee
* platform fee
* VAT/GST/tax rule

---

# 8. Post-booking management

## 8.1 Operations board

Columns:

* new booking
* pre-arrival pending
* payment pending
* cleaning scheduled
* ready for check-in
* in stay
* issue open
* checkout today
* cleaning after stay
* inspection
* deposit review
* completed

## 8.2 Task automation

On booking confirmed:

* block calendar
* create cleaning task
* create pre-arrival checklist
* schedule check-in message
* create payment reminder if balance due
* create inspection task
* update revenue forecast
* update occupancy metrics

On check-out:

* create cleaning task
* create damage inspection
* request review
* release deposit after review
* create owner statement item
* post accounting entries

## 8.3 Messaging automation

Templates:

* booking confirmation
* payment reminder
* pre-arrival
* check-in instructions
* welcome
* mid-stay check
* checkout instructions
* review request
* damage claim notice
* refund confirmation
* cancellation confirmation

AI may draft messages but should not auto-send sensitive/legal/refund messages without approval.

---

# 9. Channel management

## 9.1 Phase 1: iCal sync

Build:

* iCal import URL
* iCal export URL
* per-listing calendar token
* sync status
* sync logs
* conflict detector
* manual refresh
* last synced timestamp
* imported booking placeholder
* source channel label
* blocked date mapping

Supported iCal channels:

* Airbnb
* Booking.com
* Vrbo
* Tripadvisor
* Google Calendar
* Apple Calendar
* Outlook

Limitations to show:

* iCal is not instant
* iCal may not include guest/payment details
* iCal mainly blocks availability
* detailed booking management still requires manual entry or channel API

## 9.2 Phase 2: Channel API connectors

Later connectors:

* Booking.com Connectivity API
* Airbnb official partner route if accepted
* Vrbo API if approved
* Hospitable / Guesty / Lodgify / Smoobu / Hostaway connectors if available
* Stripe payments for direct bookings
* WhatsApp/email/SMS integrations

Do not scrape Airbnb or violate platform terms.

---

# 10. Supabase schema additions

Core tables:

* booking_listings
* booking_listing_photos
* booking_listing_rules
* booking_listing_amenities
* booking_availability_days
* booking_pricing_profiles
* booking_price_rules
* booking_reservations
* booking_guests
* booking_guest_invites
* booking_payments
* booking_refunds
* booking_deposits
* booking_payouts
* booking_messages
* booking_checkin_instructions
* booking_checkout_instructions
* booking_cleaning_tasks
* booking_issues
* booking_disputes
* booking_reviews
* booking_channel_connections
* booking_channel_sync_events
* booking_terms_acceptances
* booking_policy_snapshots
* booking_audit_events

RLS:

* property manager can see workspace bookings
* guest can see only their own booking
* invited guest can see limited trip info
* supplier can see only assigned task/job
* platform admin can see with audited support access
* public listing page can read only published listing-safe fields

---

# 11. Booking branch strategy

Create branch:

`feature/booking-management-marketplace-foundation`

Do not merge into launch branch until:

* build passes
* RLS passes
* booking E2E passes
* payment test passes
* legal disclaimers complete
* channel sync works
* mobile works
* no marketplace public search until feature flag enabled

Feature flags:

* `booking_management_enabled`
* `direct_booking_pages_enabled`
* `customer_workspace_enabled`
* `ical_sync_enabled`
* `supplier_workspace_enabled`
* `supplier_marketplace_enabled`
* `property_booking_marketplace_enabled`
* `escrow_enabled`
* `disputes_enabled`

---

# 12. UI styling requirements

Booking system should feel premium, not like a bolt-on.

Design language:

* white-first workspace
* deep navy sidebar
* soft blue active states
* emerald confirmed states
* amber pending states
* red dispute/cancelled states
* violet AI automation accents
* large calendar cards
* clean booking detail pages
* sticky action bars
* timeline components
* revenue KPI cards
* map/list split view for public search
* mobile-first customer booking portal
* thumb-friendly check-in and issue-reporting flows

Components:

* BookingStatusBadge
* PaymentStatusBadge
* ReservationTimeline
* GuestProfileCard
* ListingCard
* ListingPhotoManager
* AvailabilityCalendar
* PricingRuleBuilder
* FeeBreakdownPanel
* CancellationPolicySelector
* HouseRulesBuilder
* CheckinInstructionBuilder
* CleaningTaskBoard
* ChannelSyncStatusCard
* DisputeEvidenceUploader
* ReviewCard
* CustomerTripCard
* PublicListingHero
* BookingCheckoutStepper
* MobileGuestPortalNav

---

# 13. Customer workspace versus tenant portal

Do not merge tenant portal and booking customer workspace fully.

Use shared portal infrastructure but separate product modes:

1. Tenant portal
   * rent
   * tenancy docs
   * maintenance
   * notices
   * tenancy-specific compliance
2. Booking customer workspace
   * reservation
   * check-in
   * payments
   * stay issues
   * reviews
   * extras

Shared infrastructure:

* identity
* magic links
* messages
* documents
* payments
* support tickets
* profile
* audit
* privacy tools

Different UI and logic.

---

# 14. Property manager workspace versus marketplace host

Property manager workspace must exist without marketplace.

Modes:

1. Internal booking management only
2. Direct public booking pages
3. Supplier marketplace enabled
4. Property booking marketplace enabled

Do not force users into marketplace.

---


---

# Source Pack: supplier_marketplace.md

# PROPVORA SUPPLIER MARKETPLACE CANVAS â€” PROPERTY CONTRACTOR MARKETPLACE, SUPPLIER WORKSPACES, EMERGENCY SERVICES, VERIFICATION, INSURANCE, LICENSING, ESCROW, DISPUTES AND PROPERTY-MANAGER PROCUREMENT

## 0. Strategic product decision

Propvora should support **manual suppliers** first, then upgrade into a marketplace without removing the manual version.

There should be three supplier modes:

1. **Manual Supplier**
   * Property manager adds a supplier/contact manually.
   * No supplier login required.
   * Used for existing trusted contractors.
2. **Supplier Portal / Supplier Workspace**
   * Supplier accepts jobs, uploads evidence, invoices, manages team members and availability.
   * Can be solo supplier or supplier company/team.
3. **Supplier Marketplace**
   * Public/private marketplace where verified suppliers list services, packages, emergency availability and service areas.
   * Property managers can request quotes, book jobs, pay, hold funds, review work and dispute outcomes.

Do not force all suppliers into marketplace. Manual supplier workflows remain essential.

Recommended build branch:

`feature/supplier-marketplace-workspaces-escrow`

Feature flags:

```text
supplier_workspace_enabled
supplier_portal_enabled
supplier_marketplace_enabled
supplier_packages_enabled
supplier_availability_enabled
supplier_id_verification_enabled
supplier_insurance_verification_enabled
supplier_licence_verification_enabled
supplier_escrow_enabled
supplier_disputes_enabled
emergency_supplier_dispatch_enabled
supplier_reviews_enabled
```

---

# 1. Main product modules

## 1.1 Property manager side

Add/upgrade these app sections:

1. Suppliers
2. Supplier Marketplace
3. Supplier Jobs
4. Quotes & RFQs
5. Work Orders
6. Emergency Dispatch
7. Supplier Payments
8. Supplier Disputes
9. Supplier Reviews
10. Supplier Settings
11. Preferred Suppliers
12. Supplier Compliance

## 1.2 Supplier side

Supplier workspace side-nav:

1. Dashboard
2. Leads / Requests
3. Jobs
4. Calendar
5. Availability
6. Services
7. Packages
8. Quotes
9. Messages
10. Evidence
11. Invoices & Payments
12. Reviews
13. Team
14. Service Areas
15. Verification
16. Insurance & Licences
17. Disputes
18. Settings

## 1.3 Customer/tenant/guest side

Customer or tenant should not see the full marketplace by default.

They may see:

1. Report issue
2. Appointment slots
3. Assigned contractor
4. Contractor ETA
5. Safety notes
6. Job status
7. Access instructions
8. Completion confirmation
9. Feedback/review
10. Emergency support

Property manager controls what the customer/tenant/guest sees.

---

# 2. Marketplace categories

## 2.1 Emergency categories

Emergency suppliers need a different workflow from normal suppliers.

Emergency category examples:

1. Locksmith emergency
2. Emergency plumber
3. Emergency electrician
4. Gas leak / gas engineer
5. Boiler breakdown
6. Heating failure
7. No hot water
8. Flood / leak response
9. Fire damage response
10. Storm damage
11. Pest emergency
12. Security boarding
13. Window/glass emergency
14. Drain blockage
15. Waste/sanitation emergency
16. Lift/elevator emergency
17. Access control failure
18. Alarm/CCTV failure
19. Out-of-hours cleaner
20. Tenant lockout

Emergency supplier fields:

* 24/7 available
* out-of-hours rate
* emergency callout fee
* average response time
* maximum response radius
* emergency phone
* live availability status
* escalation contact
* licence/insurance required
* high-risk job disclaimer
* health & safety confirmation
* tenant/guest access policy

Emergency booking status flow:

```text
emergency_created
supplier_searching
supplier_notified
supplier_accepted
supplier_declined
backup_supplier_notified
supplier_en_route
supplier_arrived
work_in_progress
temporary_fix_complete
full_fix_required
completed
evidence_uploaded
invoice_pending
payment_pending
closed
disputed
```

## 2.2 Core property maintenance categories

1. Plumbing
2. Electrical
3. Gas / heating
4. Boiler servicing
5. HVAC / air conditioning
6. Roofing
7. Drainage
8. Locksmith
9. Glazing
10. Carpentry
11. Joinery
12. Painting & decorating
13. Plastering
14. Flooring
15. Tiling
16. Brickwork
17. General handyman
18. Appliance repair
19. White goods installation
20. Kitchen fitting
21. Bathroom fitting
22. Damp / mould specialist
23. Pest control
24. Waste removal
25. Garden maintenance
26. Tree surgery
27. Fencing
28. Driveways
29. Scaffolding
30. Cleaning
31. End-of-tenancy cleaning
32. Short-let cleaning
33. Linen/laundry
34. Inventory clerk
35. EPC assessor
36. Gas safety engineer
37. Electrical inspection / EICR
38. Fire safety assessor
39. Asbestos surveyor
40. Legionella risk assessor
41. CCTV / security
42. Alarm systems
43. Smart locks
44. Access control
45. WiFi / networking
46. Broadband installer
47. Solar / renewables
48. EV charger installer
49. Removals
50. Storage
51. Move-in logistics
52. Utility setup
53. Furniture assembly
54. Furniture supplier
55. Property photographer
56. Virtual tour provider
57. Staging / interior design
58. Letting compliance consultant
59. Property solicitor referral
60. Insurance broker referral

## 2.3 Serviced accommodation supplier categories

1. Turnover cleaning
2. Linen hire
3. Laundry service
4. Guest welcome packs
5. Key exchange
6. Smart lock installer
7. Maintenance callout
8. Guest support
9. Noise monitoring
10. Security patrol
11. Waste collection
12. Restocking
13. Deep cleaning
14. Damage inspection
15. Inventory checks
16. Photography
17. Listing optimisation
18. Interior staging
19. Fire safety
20. Short-let compliance consultant

## 2.4 HMO / shared housing supplier categories

1. Fire doors
2. Fire alarms
3. Emergency lighting
4. Room locks
5. HMO licence consultant
6. Space/room measurement
7. Fire risk assessor
8. Electrical testing
9. Gas safety
10. Communal cleaning
11. Waste management
12. Pest control
13. Security/CCTV
14. WiFi/networking
15. Furniture packages
16. Tenant room turnover
17. Damp/mould specialist

## 2.5 Rent-to-rent supplier categories

1. Landlord agreement review support
2. HMO conversion contractor
3. Furniture pack supplier
4. Compliance surveyor
5. Fire safety installer
6. Utility setup
7. Broadband setup
8. Cleaning team
9. Maintenance retainer
10. Inventory clerk
11. Photography
12. Tenant sourcing support
13. SA setup consultant
14. Licensing consultant
15. Rent-to-rent deal sourcer

## 2.6 Commercial property supplier categories

1. Facilities management
2. Commercial electrician
3. Commercial gas/heating
4. HVAC maintenance
5. Fire systems
6. Access control
7. Cleaning
8. Waste contracts
9. Security
10. Lift maintenance
11. Compliance inspection
12. Dilapidations surveyor
13. Commercial fit-out
14. Signage
15. Health and safety consultant

---

# 3. Supplier profile object

Supplier profile fields:

```text
supplier_id
workspace_id
owner_user_id
supplier_type
business_name
trading_name
company_number
tax_number
vat_number
country_code
legal_jurisdiction
business_address
service_categories
service_subcategories
emergency_categories
description_short
description_long
profile_photo
cover_image
gallery_images
intro_video_url
years_experience
team_size
solo_supplier
company_supplier
insured
insurance_status
licence_status
id_verification_status
right_to_work_status
background_check_status
sanctions_status
risk_score
average_rating
reviews_count
completed_jobs_count
cancelled_jobs_count
dispute_rate
response_time_average
emergency_response_time_average
repeat_client_rate
availability_status
stripe_connected_account_id
payment_status
payouts_enabled
marketplace_enabled
profile_visibility
created_at
updated_at
```

Supplier types:

```text
solo_contractor
supplier_company
agency
emergency_supplier
compliance_assessor
professional_service
utility_partner
logistics_partner
marketplace_partner
```

---

# 4. Supplier verification system

## 4.1 Verification levels

Supplier marketplace needs badges:

1. Email verified
2. Phone verified
3. ID verified
4. Business verified
5. Insurance verified
6. Licence verified
7. Right-to-work checked
8. Background checked if applicable
9. Emergency approved
10. Propvora verified
11. Top rated
12. Fast responder
13. Preferred supplier
14. Repeat supplier
15. Country-approved

## 4.2 ID verification

Required for:

* solo suppliers
* account owners of supplier companies
* emergency suppliers
* any supplier receiving payouts
* any supplier entering occupied properties
* any supplier with tenant/guest contact

ID verification fields:

```text
verification_id
supplier_id
user_id
provider
provider_session_id
status
document_type
document_country
name_match
face_match
address_match
risk_flags
verified_at
expires_at
manual_review_required
manual_review_notes
```

Verification statuses:

```text
not_started
pending
submitted
verified
failed
expired
manual_review
blocked
```

## 4.3 Business verification

Fields:

```text
business_registration_number
registered_business_name
trading_name
registered_address
country_code
company_type
director_owner_name
beneficial_owner_required
tax_number
vat_number
proof_of_business_document
business_bank_name
business_bank_country
verification_status
```

## 4.4 Insurance verification

Insurance types:

1. Public liability insurance
2. Employerâ€™s liability insurance
3. Professional indemnity
4. Contractorâ€™s all-risk
5. Product liability
6. Vehicle insurance
7. Tools/equipment insurance
8. Gas/electrical specialist cover
9. Short-let cleaning liability
10. Keyholding insurance
11. Security contractor insurance

Insurance fields:

```text
insurance_id
supplier_id
insurance_type
provider_name
policy_number
coverage_amount
currency
country_code
valid_from
valid_to
document_file_id
verified_status
verified_by
expiry_reminder_date
minimum_required_coverage_met
notes
```

System rules:

* block emergency jobs if insurance expired
* block high-risk categories if insurance missing
* warn property manager before booking unverified supplier
* create renewal tasks before expiry
* audit verification changes

## 4.5 Licence and certification verification

Licence/certification fields:

```text
licence_id
supplier_id
category
licence_name
licence_number
issuing_body
country_code
region_state
valid_from
valid_to
document_file_id
verification_status
expiry_reminder_date
required_for_categories
notes
```

Category-specific examples:

* gas engineer certification
* electrical qualification
* fire safety assessor
* asbestos surveyor
* pest control licence
* locksmith accreditation
* waste carrier licence
* security licence
* HVAC certification
* scaffolding certification
* elevator/lift maintenance certification
* EPC/energy assessor
* building contractor licence where applicable
* local trade licence where applicable

Country pack must define which categories require licence evidence per country.

---

# 5. Supplier onboarding wizard

Supplier onboarding should branch for solo supplier vs supplier team.

## Step 1 â€” Account type

Fields:

* solo supplier
* supplier company
* agency
* emergency supplier
* professional service
* utility/logistics partner

## Step 2 â€” Identity

Fields:

* legal name
* email
* phone
* country
* address
* date of birth if required by verification provider
* ID verification start

## Step 3 â€” Business details

Fields:

* business name
* trading name
* company number
* tax/VAT number
* registered address
* service country
* payout country
* business type
* website
* social links

## Step 4 â€” Categories

Fields:

* primary category
* secondary categories
* emergency categories
* compliance categories
* supplier tags
* property types served
* operation profiles served:
  * long-term let
  * HMO/shared housing
  * serviced accommodation
  * rent-to-rent
  * student let
  * commercial
  * mixed-use

## Step 5 â€” Service areas

Fields:

* postcode/ZIP radius
* cities served
* regions served
* country served
* travel fee
* emergency radius
* out-of-hours coverage
* map polygon optional
* excluded locations

## Step 6 â€” Services and packages

Supplier creates offerings:

* hourly rate
* callout fee
* fixed-price package
* quote-only service
* emergency callout
* retainer
* subscription maintenance plan
* inspection package
* compliance certificate package
* short-let turnover package
* HMO setup package

## Step 7 â€” Availability

Fields:

* working days
* working hours
* emergency hours
* same-day availability
* advance notice
* blackout dates
* team capacity
* jobs per day
* response SLA
* booking approval mode

## Step 8 â€” Insurance

Upload:

* public liability
* employer liability if team
* specialist insurance
* expiry date
* coverage amount
* issuing country

## Step 9 â€” Licences

Upload category-specific certificates.

## Step 10 â€” Payments

* connect Stripe account
* payout country
* bank details through provider
* tax profile
* platform fee agreement
* escrow/hold agreement
* refund/dispute agreement

## Step 11 â€” Marketplace profile

* profile photo
* cover image
* bio
* gallery
* before/after photos
* case studies
* service descriptions
* FAQs
* policies
* cancellation terms

## Step 12 â€” Review and publish

Checklist:

* identity verified
* business verified
* insurance uploaded
* required licences uploaded
* payout enabled
* terms accepted
* categories approved
* profile reviewed
* marketplace publish enabled

---

# 6. Property manager supplier marketplace journey

## 6.1 Browse/search suppliers

Route:

`/app/supplier-marketplace`

Filters:

* category
* emergency only
* availability now
* location radius
* rating
* verified only
* insured only
* licence verified
* fixed-price packages
* quote-only
* hourly rate
* response time
* language
* country
* property type
* operation profile
* supplier type
* preferred suppliers
* previously used
* top rated
* low dispute rate
* accepts escrow
* accepts urgent jobs

Supplier card:

* profile image
* business name
* category
* verification badges
* rating
* reviews
* response time
* emergency badge
* insurance badge
* licence badge
* service area
* starting price
* next availability
* completed jobs
* repeat client rate
* actions:
  * view profile
  * request quote
  * book package
  * message
  * save preferred
  * emergency callout

## 6.2 Supplier profile page

Route:

`/app/supplier-marketplace/suppliers/[supplierId]`

Tabs:

1. Overview
2. Services
3. Packages
4. Availability
5. Reviews
6. Verification
7. Insurance & Licences
8. Gallery
9. FAQs
10. Policies

Overview includes:

* headline
* description
* verification badges
* service categories
* emergency capability
* response metrics
* completed job metrics
* service areas
* insurance summary
* licence summary
* platform fee/payment note
* contact/message/request buttons

## 6.3 Request quote wizard

Steps:

1. Select property/unit
2. Select issue/category
3. Describe work
4. Upload photos/video
5. Select urgency
6. Access requirements
7. Preferred dates
8. Budget/range optional
9. Invite one or multiple suppliers
10. Review and send

Fields:

```text
property_id
unit_id
tenant_or_guest_occupied
access_contact
category
subcategory
urgency
description
photos
videos
documents
preferred_start_date
preferred_completion_date
budget_min
budget_max
quote_deadline
supplier_ids
site_access_notes
parking_notes
health_safety_notes
```

## 6.4 Book package wizard

Steps:

1. Select package
2. Select property/unit
3. Select date/time
4. Confirm service scope
5. Add access notes
6. Confirm price
7. Accept terms
8. Pay/hold funds
9. Confirm booking

## 6.5 Emergency dispatch wizard

Steps:

1. Select emergency type
2. Select property/unit
3. Is anyone at risk?
4. Upload issue photos
5. Confirm tenant/guest contact
6. Confirm access method
7. Search available emergency suppliers
8. Auto-notify top suppliers or manually choose
9. Supplier accepts
10. Track ETA
11. Evidence and invoice after job

Emergency logic:

* notify multiple suppliers
* first accept wins or manager selects
* fallback supplier if no response
* escalation after X minutes
* call button visible
* tenant/guest notified if allowed
* internal incident log created
* high-priority task created

---

# 7. Job and work-order lifecycle

## 7.1 Status flow

```text
draft
quote_requested
quote_received
quote_accepted
deposit_required
funds_held
scheduled
supplier_confirmed
en_route
arrived
in_progress
blocked
awaiting_parts
variation_requested
variation_approved
completed_pending_evidence
evidence_submitted
manager_review
customer_tenant_confirmation_optional
approved
payment_released
closed
cancelled
disputed
refunded
```

## 7.2 Work order detail page

Route:

`/app/supplier-jobs/[jobId]`

Tabs:

1. Overview
2. Scope
3. Supplier
4. Property
5. Schedule
6. Messages
7. Evidence
8. Quote
9. Payments
10. Variations
11. Tenant/Guest Access
12. Dispute
13. Audit

Overview:

* status
* urgency
* property
* supplier
* due date
* quote/price
* payment/escrow status
* access contact
* next actions

Scope:

* description
* included work
* excluded work
* materials
* safety notes
* acceptance criteria

Evidence:

* before photos
* during photos
* after photos
* certificates
* invoices
* parts receipts
* completion notes
* tenant/customer confirmation

Payments:

* quote amount
* deposit
* platform fee
* Stripe/provider fee
* escrow/hold status
* release button
* refund button
* variation charges
* payout schedule

Audit:

* all actions
* approvals
* payments
* messages
* evidence uploads
* status changes

---

# 8. Escrow, holds, payments and commission

## 8.1 Important payment architecture

Do not casually call Stripe â€œescrowâ€ unless the legal/payment setup supports it.

Possible models:

1. **Payment hold / delayed capture**
   * Customer/property manager authorises payment.
   * Capture after work approved.
   * Good for smaller jobs but time-limited and provider-rule dependent.
2. **Platform balance / Connect flow**
   * Payment taken by platform and transferred after completion.
   * Requires proper Stripe Connect setup and compliance.
3. **Third-party escrow provider**
   * More formal escrow.
   * Higher legal/compliance overhead.
   * Better for large works.
4. **Invoice-only**
   * Supplier invoices outside escrow.
   * Propvora tracks but does not hold funds.

## 8.2 Fee model

Marketplace commission:

```text
Propvora marketplace fee = 2.5% of supplier job transaction
Payment provider fee = passed through or shown separately
Supplier receives = gross job amount - marketplace fee - provider fee if applicable
```

Fee fields:

```text
gross_amount
currency
platform_fee_percent
platform_fee_amount
payment_provider_fee_amount
escrow_fee_amount
supplier_payout_amount
tax_amount
refund_amount
chargeback_amount
net_platform_revenue
```

## 8.3 Payment stages

```text
quote accepted
payment authorised
funds held / payment pending
supplier starts work
supplier submits evidence
manager approves
payment released
supplier payout scheduled
platform fee recognised
job closed
```

## 8.4 Release rules

Payment can release only if:

* job status = completed
* required evidence submitted
* manager approved
* no open dispute
* no fraud/risk hold
* no compliance block
* supplier payout enabled
* cooling/review period passed if configured

## 8.5 Refund rules

Refund types:

* full refund
* partial refund
* cancellation refund
* quality dispute refund
* supplier no-show refund
* duplicate payment refund
* manager goodwill refund

Every refund must create audit event and ledger entry.

---

# 9. Dispute system

## 9.1 Dispute types

Property manager raises:

* supplier no-show
* incomplete work
* poor quality
* overcharging
* property damage
* late completion
* wrong materials
* unsafe work
* licence/insurance issue
* invoice mismatch
* emergency response failure

Supplier raises:

* access denied
* scope changed
* unsafe site
* customer/tenant abusive
* payment not released
* manager requested extra work
* cancellation after travel
* materials not reimbursed

Tenant/guest can raise:

* issue not fixed
* supplier did not attend
* supplier conduct issue
* damage/privacy concern
* unsafe behaviour

## 9.2 Dispute lifecycle

```text
opened
evidence_requested
supplier_response_pending
manager_response_pending
mediation
proposed_resolution
accepted
rejected
platform_review
resolved_refund
resolved_partial_payment
resolved_supplier_paid
resolved_no_fault
escalated_legal
closed
```

## 9.3 Dispute evidence

Required evidence:

* work order scope
* quote
* chat messages
* before photos
* after photos
* invoices
* certificates
* site access logs
* timestamped attendance
* GPS/check-in if enabled
* tenant/guest confirmation
* manager approval/rejection reason
* supplier response
* refund/payment history

## 9.4 Dispute admin page

Admin route:

`/admin/marketplace/disputes`

Admin can:

* review evidence
* request more evidence
* place payout hold
* release partial payment
* approve refund
* suspend supplier
* mark manager abuse
* escalate to legal
* record decision
* audit decision

---

# 10. Supplier workspace

## 10.1 Solo supplier dashboard

Dashboard widgets:

* new requests
* upcoming jobs
* emergency availability
* todayâ€™s schedule
* quote win rate
* outstanding payments
* verification status
* insurance expiry
* reviews
* disputes
* profile completeness
* response SLA

## 10.2 Supplier team dashboard

Additional widgets:

* team members
* dispatch board
* job assignments
* team availability
* certifications by team member
* timesheets
* team performance
* payroll/export later
* vehicle/tools allocation later

## 10.3 Supplier jobs

Views:

* new requests
* quoted
* scheduled
* active
* evidence due
* awaiting approval
* paid
* disputed
* cancelled

Actions:

* accept request
* decline
* ask question
* send quote
* propose time
* assign team member
* mark en route
* mark arrived
* start work
* request variation
* upload evidence
* mark complete
* invoice
* respond to dispute

## 10.4 Supplier services and packages

Supplier can create:

* hourly services
* fixed-price packages
* emergency callout packages
* inspection packages
* compliance certificate packages
* short-let turnover packages
* monthly retainer
* maintenance plan
* HMO compliance package
* rent-to-rent setup package

Package fields:

```text
package_id
supplier_id
category
title
description
included_items
excluded_items
starting_price
fixed_price
price_type
currency
estimated_duration
required_property_info
required_photos
service_area
availability_rules
cancellation_policy
terms
status
```

## 10.5 Supplier availability

Supplier can set:

* normal working hours
* emergency hours
* blackout dates
* capacity per day
* service radius
* travel time
* team member calendars
* automatic acceptance rules
* manual approval rules

---

# 11. Property manager workspace changes

Add procurement depth into manager workspace.

## 11.1 Preferred suppliers

Property manager can:

* add manual supplier
* invite supplier to portal
* save marketplace supplier
* mark preferred
* mark blocked
* set default supplier by category/property
* set emergency supplier chain
* set spend limits
* set approval thresholds
* set insurance/licence minimums
* set supplier SLA

## 11.2 Procurement rules

Examples:

* jobs under Â£150 can be auto-approved
* emergency jobs can notify top 3 verified suppliers
* gas jobs require verified gas certification
* electrical jobs require verified electrical certification
* jobs over Â£1,000 require 2 quotes
* jobs over Â£5,000 require owner approval
* unverified supplier requires admin approval
* expired insurance blocks booking

## 11.3 Supplier analytics

Metrics:

* supplier spend
* average response time
* completion rate
* first-time fix rate
* dispute rate
* tenant/guest satisfaction
* average cost by category
* repeat usage
* emergency performance
* quote win rate
* insurance/licence status
* savings vs estimate

---

# 12. Supplier marketplace public/front page

If public supplier pages are enabled:

Public supplier profile:

* supplier name
* categories
* location served
* profile description
* verification badges
* rating
* reviews
* packages
* availability
* emergency status
* insurance/licence summary
* gallery
* FAQs
* contact/request quote button

SEO pages:

* `/suppliers/plumbers/london`
* `/suppliers/locksmiths/manchester`
* `/suppliers/short-let-cleaners/birmingham`
* `/suppliers/hmo-fire-safety/leeds`

But do not enable SEO marketplace before moderation, verification and dispute systems are ready.

---

# 13. Customer/tenant/guest interaction

Tenant/customer should only see assigned supplier details if manager allows.

Visible fields:

* supplier name
* arrival window
* job type
* safety note
* ID badge/verified badge
* contact masking
* ETA
* status
* completion confirmation
* feedback form

Hidden fields:

* supplier payment
* manager notes
* internal quote comparison
* dispute strategy
* supplier private documents
* insurance docs unless intentionally shown

---

# 14. AI upgrades

AI Copilot should support:

## Property manager AI

* recommend supplier category
* draft job scope
* compare quotes
* flag missing licence/insurance
* detect overpricing
* summarize supplier reviews
* draft tenant access message
* suggest emergency workflow
* detect repeat issue patterns
* create maintenance plan

## Supplier AI

* draft quote
* rewrite service description
* generate package
* summarize job evidence
* draft completion note
* respond to dispute
* improve profile
* suggest pricing

## Admin AI

* detect suspicious supplier behaviour
* detect fake reviews
* identify high-dispute suppliers
* flag sanctions/country mismatch
* review marketplace quality trends

AI restrictions:

* must not approve supplier verification alone
* must not decide disputes alone
* must not release payments alone
* must not give legal/licensing final advice
* must not override country pack requirements

---

# 15. Automation upgrades

## Smart rule examples

Property manager:

* If emergency job open > 10 minutes and no supplier accepted, notify backup suppliers.
* If job category = gas and supplier lacks gas certification, block booking.
* If supplier insurance expires in 14 days, block future jobs after expiry.
* If quote > budget by 25%, request manager approval.
* If job completed and evidence missing, block payment release.
* If dispute opened, hold payout.
* If supplier completes 5 jobs with 5-star ratings, suggest preferred supplier.
* If property has repeated plumbing jobs, suggest preventive inspection.

Supplier:

* If new request matches availability and category, notify supplier.
* If quote deadline near, remind supplier.
* If job tomorrow, remind assigned team member.
* If evidence missing after completion, remind supplier.
* If insurance expires soon, create renewal task.

Emergency:

* Notify multiple suppliers.
* Escalate after no response.
* Alert manager.
* Notify tenant/guest if permission set.
* Create incident report.

## Natural language automation builder

User types:

> â€œWhen an emergency plumbing job is raised after 6pm, notify my top 3 verified plumbers within 10 miles and escalate to me if nobody accepts in 10 minutes.â€

System converts to:

* trigger
* conditions
* actions
* fallback
* approval rules
* audit trail

## Canvas-lite automation builder

Nodes:

* Trigger
* Condition
* Delay
* Branch
* Notify
* Create task
* Request quote
* Assign supplier
* Hold payment
* Release payment
* Send message draft
* Require approval
* Stop

Do not build huge Zapier clone first. Use templates + low-overhead visual node builder.

---

# 16. Supabase tables

Required tables:

```text
supplier_profiles
supplier_users
supplier_team_members
supplier_service_categories
supplier_services
supplier_packages
supplier_service_areas
supplier_availability
supplier_verifications
supplier_identity_checks
supplier_business_checks
supplier_insurance_policies
supplier_licences
supplier_reviews
supplier_review_replies
supplier_marketplace_listings
supplier_favourites
preferred_suppliers
supplier_quote_requests
supplier_quotes
supplier_jobs
supplier_job_events
supplier_job_evidence
supplier_job_messages
supplier_job_variations
supplier_payments
supplier_payouts
supplier_disputes
supplier_dispute_evidence
supplier_audit_events
marketplace_commissions
marketplace_fee_rules
emergency_dispatch_events
```

RLS requirements:

* supplier can see own profile/jobs
* supplier company owner can manage team
* team member can see assigned jobs only
* property manager can see jobs in own workspace
* customer/tenant can see assigned job public-safe fields only
* public can see published marketplace-safe fields only
* admin access must be audited
* verification docs are private
* insurance/licence docs are private unless explicitly shared

---

# 17. API routes

Required API groups:

```text
/api/suppliers
/api/suppliers/[id]
/api/suppliers/onboarding
/api/suppliers/verification
/api/suppliers/insurance
/api/suppliers/licences
/api/suppliers/services
/api/suppliers/packages
/api/suppliers/availability
/api/supplier-marketplace/search
/api/supplier-marketplace/request-quote
/api/supplier-marketplace/book-package
/api/supplier-jobs
/api/supplier-jobs/[id]
/api/supplier-jobs/[id]/status
/api/supplier-jobs/[id]/evidence
/api/supplier-jobs/[id]/variations
/api/supplier-jobs/[id]/payments
/api/supplier-disputes
/api/supplier-reviews
/api/emergency-dispatch
/api/marketplace/commission
/api/marketplace/webhooks/stripe
```

Each route requires:

* auth
* workspace membership or supplier membership
* role permission
* zod validation
* RLS-safe query
* audit log on mutation
* rate limit where public/emergency/payment related
* clear error states

---

# 18. UI component inventory

Components:

* SupplierCard
* SupplierVerificationBadges
* SupplierProfileHeader
* SupplierServiceCategoryPicker
* SupplierPackageCard
* SupplierAvailabilityCalendar
* SupplierServiceAreaMap
* SupplierQuoteRequestWizard
* SupplierQuoteComparisonTable
* SupplierQuoteCard
* SupplierJobStatusBadge
* SupplierJobTimeline
* EmergencyDispatchPanel
* EmergencySupplierPicker
* SupplierEvidenceUploader
* SupplierInsurancePanel
* SupplierLicencePanel
* SupplierTeamRoster
* SupplierReviewCard
* SupplierDisputeTimeline
* SupplierPaymentBreakdown
* MarketplaceCommissionPanel
* PreferredSupplierBadge
* VerificationProgressStepper
* SupplierOnboardingWizard
* SupplierPublicProfile
* SupplierAdminRiskPanel

---

# 19. Legal and compliance docs

Required policies:

* Supplier Terms
* Marketplace Terms
* Property Manager Marketplace Terms
* Supplier Payment Terms
* Escrow/Hold Terms
* Dispute Resolution Policy
* Review Policy
* Verification Policy
* Insurance/Licence Disclaimer
* Emergency Supplier Disclaimer
* Off-platform Payments Policy
* Cancellation Policy
* Refund Policy
* Damage/Work Quality Policy
* Sanctions and Restricted Countries Policy
* Data Processing Addendum
* Privacy Policy update for suppliers
* Tenant/Guest Contractor Visit Notice

Important wording:

* Propvora does not guarantee supplier workmanship.
* Verification badges mean evidence was checked to the stated level, not that future work is guaranteed.
* Property manager remains responsible for selecting appropriate suppliers.
* Supplier remains responsible for licences, insurance and lawful work.
* Emergency dispatch does not guarantee arrival time unless contractually stated.
* Escrow/payment hold terms must match actual payment provider capability.
* Reviews must be honest and moderated for abuse/fraud.
* Disputes are platform mediation unless formal escrow/legal arbitration is implemented.
* Country rules may vary.

---

# 20. Admin marketplace controls

Admin routes:

```text
/admin/marketplace
/admin/marketplace/suppliers
/admin/marketplace/verifications
/admin/marketplace/insurance
/admin/marketplace/licences
/admin/marketplace/jobs
/admin/marketplace/disputes
/admin/marketplace/payments
/admin/marketplace/reviews
/admin/marketplace/categories
/admin/marketplace/fees
/admin/marketplace/risk
```

Admin can:

* approve supplier
* reject supplier
* suspend supplier
* verify documents
* request more evidence
* manage categories
* set commission
* view disputes
* hold payout
* release payout
* refund
* moderate reviews
* flag fake reviews
* block countries
* set emergency approval status
* audit support access

---

# 21. Marketplace scoring and ranking

Supplier search ranking should consider:

* category match
* location distance
* availability
* verification level
* insurance/licence status
* response time
* completion rate
* average rating
* dispute rate
* repeat client rate
* emergency capability
* price fit
* property type fit
* preferred supplier status

Do not rank only by paid promotion at first. Trust and response quality matter more.

---

# 22. Branch and release plan

Build order:

1. Manual supplier upgrade
2. Supplier workspace
3. Supplier onboarding and verification
4. Services/packages
5. Availability
6. Quote requests
7. Supplier jobs/work orders
8. Evidence upload
9. Payments without escrow
10. Platform fee tracking
11. Reviews
12. Emergency dispatch
13. Payment holds/Connect
14. Disputes
15. Supplier marketplace search
16. Public supplier pages
17. Full escrow provider integration later

Release gates:

```text
typecheck
lint
build
RLS tests
supplier workspace tests
supplier marketplace tests
payment tests
verification tests
dispute tests
emergency workflow tests
mobile tests
admin tests
```

---

# 23. Final recommendation

This module can become one of Propvoraâ€™s biggest moats.

The strongest product positioning is:

> Propvora Supplier Network gives property managers verified, insured and licence-aware property suppliers for planned works, emergency jobs, serviced accommodation operations, HMO compliance and rent-to-rent setup â€” with quotes, bookings, evidence, payments, reviews and disputes managed in one workspace.

Do not ship the public marketplace first.

Ship in this order:

1. Supplier workspace
2. Verified supplier profiles
3. Quote/job workflow
4. Emergency dispatch
5. Packages/availability
6. Payments/commission
7. Disputes/reviews
8. Marketplace discovery
9. Escrow/full marketplace scale


---

# Source Pack: automations,canvas,nodes.md

# PROPVORA AUTOMATIONS CANVAS â€” SMART RULES, NATURAL LANGUAGE BUILDER, NODE CANVAS, TEMPLATES, INTEGRATIONS, CAPS, TESTING, JSON EDITOR, ROUTES, PANELS AND ENTERPRISE WORKFLOW ENGINE

## 0. Strategic decision

Propvora should build an automation system in three layers:

1. **Smart Recipes**
   * Prebuilt templates.
   * Low-risk.
   * Fast for normal users.
   * â€œTurn on / configure / test / activateâ€.
2. **Natural Language Automation Builder**
   * User types: â€œWhen a guest checks out, create cleaning task and notify cleaner.â€
   * AI converts into a draft automation.
   * User reviews, edits, tests and activates.
   * AI must not activate destructive/legal/payment workflows without approval.
3. **Canvas Builder**
   * Advanced drag-and-drop workflow editor.
   * Nodes, edges, panels, JSON view, test trigger, run history, logs and versioning.
   * Expandable full-screen canvas over menus.
   * Used for complex property-manager, supplier, booking, marketplace, finance and compliance workflows.

The automation system should not become a heavy Zapier clone on day one. It should be  **Propvora-specific** , with strong templates and a controlled canvas.

---

# 1. Automation side-nav structure

Add main side-nav item:

```text
Automations
```

Internal automation nav:

```text
Automations Home
Recipes
My Automations
Canvas Builder
Runs & Logs
Approvals
Errors
Integrations
Webhooks
AI Builder
Usage & Limits
Settings
Admin Controls
```

Alternative if keeping sidebar lean:

* Put `Automations` under `Workspace`
* Surface contextual automation buttons inside each section:
  * Portfolio
  * Work
  * Bookings
  * Marketplace
  * Money
  * Accounting
  * Compliance
  * Legal
  * Contacts
  * Messages

Recommended: **top-level Automations** once marketplace/booking/supplier layers exist.

---

# 2. Automation object model

## 2.1 Automation definition

```text
automation_id
workspace_id
name
description
status
version
created_by
updated_by
owner_role
scope
category
trigger_type
canvas_json
compiled_json
natural_language_prompt
ai_generated
template_id
feature_flag
plan_required
risk_level
requires_approval
last_tested_at
last_run_at
last_run_status
run_count
error_count
enabled_at
disabled_at
created_at
updated_at
```

Statuses:

```text
draft
needs_review
test_ready
active
paused
failed
archived
disabled_by_plan
disabled_by_admin
disabled_by_error
```

Scopes:

```text
workspace
property
unit
tenancy
booking
supplier_job
marketplace_transaction
customer
supplier
accounting
legal
compliance
admin
```

Risk levels:

```text
low
medium
high
critical
restricted
```

Examples:

* low: create task, send internal notification
* medium: send email to supplier/customer
* high: create invoice, request payment
* critical: release payment, refund, legal draft
* restricted: serve legal notice, delete records, suspend account

Restricted actions must either be blocked or require explicit human approval.

---

# 3. Automation execution model

## 3.1 Execution lifecycle

```text
trigger_received
context_loaded
permissions_checked
plan_checked
limits_checked
conditions_evaluated
approval_required_optional
actions_started
actions_completed
audit_logged
notifications_sent
run_completed
```

Failure lifecycle:

```text
trigger_received
context_loaded
node_failed
retry_scheduled
retry_failed
error_logged
owner_notified
automation_paused_if_threshold_exceeded
```

## 3.2 Run record

```text
automation_run_id
automation_id
workspace_id
version
trigger_event_id
trigger_type
trigger_payload
status
started_at
completed_at
duration_ms
nodes_total
nodes_succeeded
nodes_failed
actions_executed
actions_skipped
approval_status
error_summary
cost_units
ai_tokens_used
created_records
updated_records
audit_event_ids
```

## 3.3 Node run record

```text
node_run_id
automation_run_id
node_id
node_type
node_label
status
input_json
output_json
error_json
started_at
completed_at
duration_ms
retry_count
```

---

# 4. Node categories

The canvas should support the following node groups:

1. Trigger nodes
2. Condition nodes
3. Branch nodes
4. Delay/time nodes
5. Data lookup nodes
6. AI nodes
7. Action nodes
8. Communication nodes
9. Payment nodes
10. Approval nodes
11. Legal safety nodes
12. Integration nodes
13. Webhook/API nodes
14. Utility/transform nodes
15. Error handling nodes
16. End/result nodes

---

# 5. Trigger nodes

## 5.1 Core record triggers

```text
Record Created
Record Updated
Record Deleted
Field Changed
Status Changed
Tag Added
Comment Added
File Uploaded
Document Signed
Review Submitted
Message Received
Form Submitted
```

Config fields:

```text
table/entity
field filters
old value
new value
workspace scope
property scope
debounce window
duplicate prevention key
```

## 5.2 Portfolio triggers

```text
Property Created
Property Updated
Property Status Changed
Unit Created
Unit Vacant
Unit Occupied
Tenancy Created
Tenancy Ending Soon
Tenancy Ended
Rent Review Date Reached
Property Compliance Missing
Property Country Changed
Operation Profile Changed
```

## 5.3 Work triggers

```text
Task Created
Task Due Soon
Task Overdue
Task Completed
Job Created
Job Status Changed
Maintenance Issue Reported
Supplier Assigned
Evidence Uploaded
Work Order Approved
Work Order Rejected
Emergency Job Raised
Emergency Job Unanswered
```

## 5.4 Booking triggers

```text
Booking Created
Booking Confirmed
Booking Payment Failed
Booking Cancelled
Booking Modified
Check-in Due
Checkout Due
Guest Checked In
Guest Checked Out
Cleaning Required
Cleaning Completed
Review Due
Booking Dispute Opened
Channel Sync Conflict
Calendar Block Created
```

## 5.5 Marketplace triggers

```text
Marketplace Listing Published
Quote Request Created
Quote Received
Quote Accepted
Marketplace Transaction Created
Payment Authorised
Payment Captured
Payout Due
Refund Requested
Review Submitted
Dispute Opened
Risk Flag Created
```

## 5.6 Supplier triggers

```text
Supplier Invited
Supplier Registered
Supplier Verification Submitted
Supplier Approved
Supplier Insurance Expiring
Supplier Licence Expiring
Supplier Availability Changed
Supplier Quote Deadline Near
Supplier Job Accepted
Supplier Job Completed
Supplier Evidence Missing
Supplier Dispute Opened
```

## 5.7 Money/accounting triggers

```text
Invoice Created
Invoice Due Soon
Invoice Overdue
Payment Received
Payment Failed
Refund Issued
Deposit Due
Deposit Release Due
Journal Posted
Journal Reversed
Budget Exceeded
Property Margin Below Target
Accounting Period Closing
```

## 5.8 Compliance triggers

```text
Compliance Item Created
Compliance Due Soon
Compliance Overdue
Certificate Uploaded
Certificate Expiring
HMO Licence Expiring
EPC Expiring
Gas Safety Expiring
Electrical Safety Expiring
Fire Safety Review Due
Short-let Licence Missing
Country Compliance Rule Changed
```

## 5.9 Legal triggers

```text
Legal Matter Created
Possession Case Created
Evidence Added
Legal Draft Generated
Legal Review Required
Legal Deadline Due Soon
Legal Disclaimer Accepted
Legal Pack Version Changed
Country Legal Profile Changed
```

Legal triggers must be review-first.

## 5.10 AI triggers

```text
AI Insight Generated
AI Risk Detected
AI Summary Requested
AI Usage Limit Near
AI Usage Limit Exceeded
AI Model Failed
AI Provider Switched
```

AI cannot be allowed to silently trigger destructive actions.

## 5.11 Schedule triggers

```text
Every Day
Every Week
Every Month
Every Quarter
Every Year
Custom Cron
Specific Date
Relative Date
Business Day
Country Holiday Aware Schedule
```

Schedule config:

```text
timezone
country calendar
start date
end date
frequency
cron expression
skip weekends
skip holidays
run window
max runs
```

## 5.12 Webhook/API triggers

```text
Incoming Webhook
Stripe Webhook Event
Booking Channel Webhook
Supplier API Event
Calendar Import Event
Email Inbound Event
Form Embed Submission
Public Portal Event
```

Security fields:

```text
secret
signature verification
allowed IPs
rate limit
schema validation
replay prevention
timestamp tolerance
dedupe key
```

---

# 6. Condition nodes

## 6.1 Basic condition nodes

```text
If / Else
Equals
Not Equals
Contains
Does Not Contain
Greater Than
Less Than
Between
Is Empty
Is Not Empty
Is True
Is False
Date Before
Date After
Date Within
```

## 6.2 Entity condition nodes

```text
If Property Country Is
If Operation Profile Is
If Property Status Is
If Unit Status Is
If Tenancy Type Is
If Booking Status Is
If Supplier Verified
If Supplier Insurance Valid
If Licence Required
If Payment Status Is
If Compliance Status Is
If AI Risk Score Above
If User Role Is
If Plan Allows
If Feature Flag Enabled
```

## 6.3 Safety condition nodes

```text
If Legal Review Approved
If Human Approval Granted
If Payment Release Allowed
If Country Pack Approved
If Sanctions Clear
If Tenant/Guest Consent Present
If Supplier Insurance Current
If File Virus Scan Clear
If RLS Access Confirmed
```

## 6.4 Context condition nodes

```text
If Workspace Country
If Property Country
If Customer Country
If Supplier Country
If Booking Source
If Marketplace Transaction Type
If Occupied Property
If Emergency
If Out of Hours
If Multi-country Portfolio
If Manual Sales Country
```

---

# 7. Branch and router nodes

```text
Switch
Multi-branch
Match Category
Match Country
Match Operation Profile
Match Urgency
Match Risk Level
Match Plan Tier
Match Role
Split Path
Parallel Paths
Merge Paths
Continue If
Stop If
Fallback Path
```

Example:

```text
Trigger: Emergency Job Created
Branch:
  Plumbing -> notify emergency plumbers
  Electrical -> notify electricians
  Locksmith -> notify locksmiths
  Gas -> require gas-certified supplier only
```

---

# 8. Delay and time nodes

```text
Wait
Wait Until
Delay for Business Hours
Delay Until Next Working Day
Delay Until Local Time
SLA Timer
Escalation Timer
Retry With Backoff
Run Window Gate
Stop After Deadline
```

Examples:

* wait 10 minutes for emergency supplier response
* wait until 48h before check-in before releasing instructions
* wait 3 days after checkout before deposit release
* retry failed webhook after 5 minutes, then 30 minutes, then 2 hours

---

# 9. Data lookup nodes

```text
Get Workspace
Get Property
Get Unit
Get Tenancy
Get Booking
Get Guest/Customer
Get Supplier
Get Supplier Availability
Get Preferred Suppliers
Get Compliance Items
Get Legal Matters
Get Documents
Get Files
Get Invoice
Get Payment
Get Journal Entries
Get Marketplace Transaction
Get AI Usage
Search Records
Aggregate Records
Count Records
Find Matching Supplier
Find Available Listing
Find Channel Conflict
```

Lookup rules:

* must be workspace-scoped
* must obey RLS
* must fail safely
* must not leak cross-workspace data
* must log access for sensitive records

---

# 10. AI nodes

AI nodes must be useful but controlled.

## 10.1 AI generation nodes

```text
AI Summarise Record
AI Draft Message
AI Draft Email
AI Draft Supplier Scope
AI Draft Booking Reply
AI Draft Legal Checklist
AI Draft Compliance Summary
AI Draft Invoice Note
AI Draft Dispute Summary
AI Draft Review Response
AI Generate Task List
AI Generate Property Risk Summary
AI Generate Quote Comparison
AI Generate Automation From Prompt
```

## 10.2 AI analysis nodes

```text
AI Risk Score
AI Margin Leakage Detector
AI Compliance Gap Detector
AI Booking Risk Detector
AI Supplier Risk Detector
AI Dispute Evidence Summary
AI Review Sentiment Analysis
AI Duplicate Contact Detector
AI Missing Evidence Detector
AI Pricing Suggestion
AI Next Best Action
```

## 10.3 AI control nodes

```text
AI Requires Approval
AI Confidence Gate
AI Legal Safety Gate
AI Cost Gate
AI Provider Fallback
AI Token Budget Check
AI Model Select
AI Human Review Required
```

## 10.4 AI node restrictions

AI nodes cannot:

* release payments
* issue refunds without approval
* serve legal notices
* verify legal compliance
* approve supplier licences
* approve identity verification
* delete records
* suspend accounts
* override sanctions blocks
* claim a legal/tax conclusion as certain

AI can:

* draft
* summarise
* recommend
* flag
* compare
* suggest
* create a draft task/action pending approval

---

# 11. Action nodes

## 11.1 Record action nodes

```text
Create Task
Update Task
Complete Task
Create Job
Update Job Status
Create Property Note
Create Contact
Update Contact
Create Document Record
Attach File
Create Calendar Event
Create Reminder
Create Notification
Add Tag
Remove Tag
Create Activity Log
Create Audit Event
```

## 11.2 Booking action nodes

```text
Create Booking Task
Update Booking Status
Send Booking Confirmation Draft
Release Check-in Instructions
Block Calendar Dates
Create Cleaning Task
Assign Cleaner
Create Checkout Inspection
Request Review
Create Booking Issue
Open Booking Dispute
Sync iCal
Flag Channel Conflict
```

High-risk booking actions requiring approval:

```text
Cancel Booking
Issue Refund
Charge Damage Fee
Release Deposit
Reject Guest
Suspend Booking Page
```

## 11.3 Supplier action nodes

```text
Create Supplier Job
Send Quote Request
Assign Supplier
Notify Preferred Suppliers
Notify Emergency Suppliers
Create Supplier Work Order
Request Supplier Evidence
Approve Supplier Evidence
Create Supplier Review Request
Open Supplier Dispute
Block Supplier From Job
```

High-risk supplier actions requiring approval:

```text
Release Supplier Payment
Refund Supplier Job
Suspend Supplier
Approve Supplier Verification
Reject Supplier Verification
```

## 11.4 Marketplace action nodes

```text
Publish Listing
Unpublish Listing
Create Marketplace Order
Create Marketplace Transaction
Calculate Platform Fee
Apply Marketplace Fee Rule
Create Payment Link
Create Payout Schedule
Create Review Request
Open Marketplace Dispute
Flag Marketplace Risk
```

High-risk marketplace actions:

```text
Hold Payout
Release Payout
Refund Transaction
Suspend Listing
Suspend User
```

## 11.5 Money/action nodes

```text
Create Invoice Draft
Send Invoice Draft For Approval
Mark Invoice Reminder
Create Payment Request
Create Refund Draft
Record Payment
Create Deposit Reminder
Create Expense Draft
Flag Arrears
Flag Margin Risk
```

## 11.6 Accounting action nodes

```text
Create Journal Draft
Post Journal Only After Approval
Create Reversal Draft
Allocate Payment
Create Accrual Draft
Create Revenue Recognition Draft
Create Supplier Expense Draft
Create Tax Line Draft
Create Owner Statement Item
```

Accounting action rules:

* unbalanced journals blocked
* posted journals immutable
* high-risk accounting actions require finance/admin role
* AI can create draft, not post automatically unless low-risk and enabled

## 11.7 Compliance action nodes

```text
Create Compliance Task
Update Compliance Status
Request Certificate
Notify Expiry
Create Evidence Request
Block Listing Publish
Block Supplier Job
Create Local Authority Check
Create Compliance Report
```

## 11.8 Legal action nodes

```text
Create Legal Matter
Create Legal Evidence Request
Create Legal Draft
Request Legal Review
Add Disclaimer
Create Legal Timeline Event
Create Legal Pack Export Draft
```

Blocked from automation:

```text
Auto-Serve Notice
Auto-File Claim
Auto-Send Legal Letter
Auto-Confirm Legal Compliance
```

These must be unavailable or admin-disabled.

---

# 12. Communication nodes

```text
Send Internal Notification
Send Email
Send SMS
Send WhatsApp Draft
Send In-App Message
Send Portal Message
Send Supplier Message
Send Guest Message
Send Tenant Message
Send Slack/Teams Webhook
Send Digest
Create Message Draft
Request Approval Before Sending
```

Communication safety:

* legal/payment/refund/cancellation messages require approval
* templates versioned
* unsubscribe/consent respected
* sensitive data redacted
* country language/locale applied

---

# 13. Payment nodes

```text
Create Payment Link
Create Payment Intent
Authorise Payment
Capture Payment
Create Refund Draft
Issue Refund After Approval
Create Payout Draft
Release Payout After Approval
Hold Payout
Calculate Platform Fee
Calculate Provider Fee
Record Payment Event
Create Stripe Checkout Session
Create Stripe Billing Portal Link
```

Payment rules:

* never fail open
* require role gate
* require plan gate
* require sanctions clear
* require no open dispute
* require payment provider status
* audit every action

---

# 14. Approval nodes

```text
Request Human Approval
Request Owner Approval
Request Finance Approval
Request Admin Approval
Request Legal Review
Request Compliance Review
Request Supplier Approval
Request Customer Confirmation
Wait For Approval
Approval Timeout
Escalate Approval
```

Approval object fields:

```text
approval_id
automation_run_id
node_id
requested_by
requested_from_role
approval_type
risk_level
summary
payload_snapshot
expires_at
status
approved_by
approved_at
rejected_by
rejected_at
decision_note
```

---

# 15. Integration nodes

## 15.1 First-party integrations

```text
Supabase
Stripe
Resend
OpenAI / AI Gateway
R2 / S3 Storage
Calendar
Email Inbox
Propvora Portal
Propvora Marketplace
Propvora Accounting
Propvora Legal
```

## 15.2 Booking integrations

```text
iCal Import
iCal Export
Google Calendar
Outlook Calendar
Airbnb iCal
Booking.com iCal
Vrbo iCal
Channel Manager Webhook
```

## 15.3 Marketplace/supplier integrations

```text
Stripe Connect
Identity Verification Provider
Insurance Verification Manual Upload
Licence Verification Manual Upload
Maps / Geocoding
Email
SMS
WhatsApp Later
```

## 15.4 Generic integration nodes

```text
HTTP Request
Incoming Webhook
Outgoing Webhook
Parse JSON
Transform JSON
Map Fields
Sign Request
Verify Signature
Retry Request
Handle API Error
```

Security rules:

* webhooks require secrets
* HTTP request node disabled by default on lower plans
* no arbitrary external requests on Starter/Operator
* allowlist domains for security
* admin must approve external webhook destinations
* log payload redaction
* prevent secrets in client JSON

---

# 16. Utility nodes

```text
Format Date
Format Currency
Format Address
Format Phone
Convert Currency
Calculate Margin
Calculate Nights
Calculate Cleaning Window
Calculate SLA
Calculate Risk Score
Generate Reference
Generate Slug
Deduplicate
Merge Data
Split Text
Extract Fields
Validate Schema
Redact Sensitive Data
Build Email Payload
Build PDF Payload
```

---

# 17. Error handling nodes

```text
Try / Catch
On Error
Retry
Retry With Backoff
Fallback Action
Notify Owner
Pause Automation
Open Error Ticket
Log Error
Stop Run
Continue On Error
```

Error policies:

```text
stop_on_error
continue_on_error
retry_then_stop
retry_then_fallback
pause_automation_after_threshold
```

---

# 18. End/result nodes

```text
End Success
End No Action
End Skipped
End Failed
End Waiting Approval
End Waiting External Event
End Paused
```

---

# 19. Canvas UX

## 19.1 Canvas route

```text
/app/automations/canvas/[automationId]
```

## 19.2 Full-screen expanding canvas

Default page layout:

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ App Shell Top Bar                                                           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Side Nav      â”‚ Automation Header                                           â”‚
â”‚               â”‚ [Name] [Status] [Test] [Publish] [More]                    â”‚
â”‚               â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚               â”‚ Node Library  â”‚ Canvas                        â”‚ Inspector  â”‚
â”‚               â”‚               â”‚                               â”‚            â”‚
â”‚               â”‚ Triggers      â”‚  [Trigger] â†’ [Condition]      â”‚ Node JSON  â”‚
â”‚               â”‚ Actions       â”‚       â†“                       â”‚ Config     â”‚
â”‚               â”‚ AI            â”‚  [Action] â†’ [End]             â”‚ Test       â”‚
â”‚               â”‚ Integrations  â”‚                               â”‚ Logs       â”‚
â”‚               â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Expanded mode:

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Automation Canvas Fullscreen                                                â”‚
â”‚ [Back] [Automation Name] [Draft/Active] [Zoom] [Test] [JSON] [Publish]      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Node Library  â”‚                                              â”‚ Inspector    â”‚
â”‚ Search nodes  â”‚                                              â”‚              â”‚
â”‚ Categories    â”‚              Infinite Canvas                 â”‚ Config       â”‚
â”‚ Templates     â”‚                                              â”‚ JSON         â”‚
â”‚ Recent nodes  â”‚                                              â”‚ Test         â”‚
â”‚               â”‚                                              â”‚ Logs         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Bottom Run Console: latest test, errors, node timings, payload preview       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## 19.3 Canvas behaviours

Required:

* drag node from library
* drop on canvas
* connect handles
* auto-layout
* zoom in/out
* minimap
* pan
* keyboard shortcuts
* duplicate node
* group nodes
* comment nodes
* disabled nodes
* copy/paste
* undo/redo
* snap to grid
* node validation
* edge validation
* branch labels
* collapsible node groups
* run path highlight
* failed node red highlight
* successful node green highlight
* skipped node grey highlight

## 19.4 Node inspector panels

Tabs:

```text
Config
Inputs
Outputs
JSON
Test
Runs
Docs
```

Config tab:

* friendly form
* field mapping
* dropdowns
* entity selectors
* validation messages

Inputs tab:

* incoming payload schema
* sample input
* mapped fields

Outputs tab:

* output schema
* sample output
* variables exposed to later nodes

JSON tab:

* view node JSON
* edit node JSON if allowed
* validate JSON
* reset to form values
* copy JSON
* import JSON

Test tab:

* test this node
* test from trigger to this node
* test entire automation
* mock payload selector
* real record selector
* dry run toggle
* destructive action blocked in test

Runs tab:

* last 10 node runs
* duration
* errors
* output
* retry count

Docs tab:

* what node does
* permissions required
* plan required
* examples
* safety notes

---

# 20. JSON editing

## 20.1 JSON view levels

1. Read-only JSON for normal users
2. Editable JSON for admin/advanced users
3. Raw compiled JSON for platform admins only

## 20.2 JSON editor rules

Allow:

* view node config
* edit labels
* edit mappings
* edit conditions
* edit safe config
* import/export automation JSON
* copy as template

Block:

* editing hidden system fields
* injecting arbitrary code
* changing workspace_id
* changing creator role
* bypassing plan limits
* bypassing approval gates
* bypassing legal/payment restrictions
* adding unapproved HTTP endpoints
* exposing secrets

## 20.3 Automation JSON structure

```json
{
  "version": "1.0",
  "automationId": "uuid",
  "name": "Emergency plumber dispatch",
  "nodes": [
    {
      "id": "trigger_1",
      "type": "trigger.emergency_job_created",
      "position": { "x": 100, "y": 100 },
      "config": {}
    }
  ],
  "edges": [
    {
      "from": "trigger_1",
      "to": "condition_1",
      "label": "continue"
    }
  ],
  "settings": {
    "riskLevel": "high",
    "requiresApproval": false,
    "maxRunsPerDay": 50
  }
}
```

## 20.4 JSON validation

Every save must validate:

* schema
* node types exist
* required fields present
* edges valid
* no orphan critical paths
* trigger exists
* end node exists
* no forbidden actions
* no plan-banned nodes
* no role-banned nodes
* no country-banned nodes
* no unsafe external endpoint
* no circular loops unless explicitly allowed with max iterations

---

# 21. Testing triggers and dry runs

## 21.1 Test modes

```text
Test with mock payload
Test with real record
Test selected node
Test branch path
Test full automation
Dry run
Safe run
Live run
Replay previous run
```

## 21.2 Test trigger panel

Fields:

* trigger type
* sample event
* workspace
* property
* booking
* supplier job
* customer
* payload JSON
* run as role
* dry run toggle
* skip external sends toggle
* skip payment actions toggle
* skip legal sends toggle

## 21.3 Dry run behaviour

Dry run must:

* evaluate conditions
* show selected branch
* show actions that would run
* validate permissions
* validate plan limits
* validate country rules
* validate payment/legal restrictions
* not send messages
* not charge/refund/release payments
* not create live records unless test sandbox selected

## 21.4 Test output

Show:

* run timeline
* node-by-node status
* input/output payload
* skipped nodes
* validation warnings
* required approvals
* estimated cost
* estimated AI tokens
* plan usage impact
* external API calls that would happen

---

# 22. Subscription limits and hard caps

Automation must be plan-gated.

## 22.1 Suggested plan limits

### Starter

```text
Active automations: 3
Runs/month: 250
Canvas builder: no
Natural language builder: no or limited trial
Webhook triggers: no
HTTP request node: no
AI nodes: no
Payment nodes: no
Max nodes per automation: 5
Run history retention: 7 days
```

### Operator

```text
Active automations: 10
Runs/month: 2,500
Canvas builder: basic
Natural language builder: limited
Webhook triggers: 2
HTTP request node: no
AI nodes: limited
Payment nodes: draft only
Max nodes per automation: 15
Run history retention: 30 days
```

### Scale

```text
Active automations: 50
Runs/month: 25,000
Canvas builder: yes
Natural language builder: yes
Webhook triggers: 10
HTTP request node: allowlisted
AI nodes: yes
Payment nodes: approval-only
Max nodes per automation: 50
Run history retention: 90 days
```

### Pro / Agency

```text
Active automations: 200
Runs/month: 250,000
Canvas builder: advanced
Natural language builder: advanced
Webhook triggers: 50
HTTP request node: yes with allowlist
AI nodes: advanced
Payment nodes: approval-only
Marketplace nodes: yes
Supplier/booking nodes: yes
Max nodes per automation: 150
Run history retention: 1 year
```

### Enterprise

```text
Active automations: custom
Runs/month: custom
Canvas builder: advanced
Custom nodes: yes
Custom integrations: yes
SLA queue: yes
Dedicated rate limits
Long run retention
Audit export
SSO/SAML
Custom approval rules
```

## 22.2 Hard caps

Global safety caps:

```text
max runs per minute per workspace
max runs per hour per workspace
max runs per day per workspace
max external API calls per run
max AI tokens per run
max AI spend per day
max payment actions per day
max emails/messages per day
max loop iterations
max retries
max execution duration
max webhook payload size
max JSON config size
```

## 22.3 Abuse protection

* dedupe keys
* cooldowns
* rate limits
* run queues
* circuit breaker
* external endpoint allowlist
* payment action approval
* legal action blocklist
* AI cost budget
* admin kill switch
* auto-pause after repeated errors

---

# 23. Automation settings

Workspace settings page:

```text
/app/automations/settings
```

Settings sections:

1. General
2. Plans & Limits
3. Approvals
4. Notifications
5. Integrations
6. Webhooks
7. AI Builder
8. Safety
9. Logs & Retention
10. Admin Controls

## General

* automations enabled
* default timezone
* country calendar
* business hours
* run queue mode
* default owner
* default error recipient

## Approvals

* payment actions require approval
* legal actions require approval
* external messages require approval
* AI-generated actions require approval
* approval timeout
* escalation role
* approval audit

## Notifications

* run failures
* approval requests
* quota warnings
* automation paused
* integration failures
* daily digest

## Integrations

* Stripe
* email
* calendar
* iCal
* marketplace
* supplier workspace
* booking workspace
* webhook secrets
* external endpoints

## AI Builder

* allow natural language builder
* require review before activation
* model selection
* AI budget
* prompt safety
* AI action restrictions

## Safety

* kill switch
* block destructive actions
* block legal sends
* block payment release
* external domain allowlist
* maximum run frequency
* sensitive field redaction

---

# 24. Integration web / webhook system

## 24.1 Incoming webhook setup

Route:

```text
/app/automations/webhooks
```

Features:

* create webhook endpoint
* generate secret
* rotate secret
* view endpoint URL
* copy curl example
* schema validation
* sample payload
* test webhook
* replay event
* disable endpoint
* logs

Webhook URL pattern:

```text
/api/automations/webhooks/[webhookId]
```

Security:

* HMAC signature
* timestamp tolerance
* replay protection
* max payload size
* IP allowlist optional
* JSON schema validation
* rate limit
* secret rotation

## 24.2 Outgoing webhook node

Config:

* URL
* method
* headers
* body template
* auth mode
* retry policy
* timeout
* redaction
* allowed domain check
* test request

Auth modes:

```text
none
bearer token
basic
api key header
hmac signature
oauth later
```

## 24.3 Webhook event registry

Events:

```text
property.created
property.updated
booking.confirmed
booking.cancelled
supplier.job.created
supplier.job.completed
marketplace.transaction.created
payment.failed
compliance.expiring
legal.review.required
automation.run.failed
```

---

# 25. Recipe templates

## 25.1 Portfolio recipes

```text
When property is created â†’ create compliance checklist
When operation profile changes â†’ update planning/compliance checklist
When unit becomes vacant â†’ create marketing/reletting task
When tenancy ending in 60 days â†’ create renewal workflow
When property country changes â†’ request country profile review
When property margin below target â†’ notify owner and create review task
```

## 25.2 Rent-to-rent recipes

```text
When guaranteed rent due in 7 days â†’ notify operator
When bills exceed forecast â†’ flag margin leakage
When landlord agreement expires in 90 days â†’ create renewal task
When operator margin below threshold â†’ create renegotiation task
When right-to-sublet evidence missing â†’ block compliance complete status
When HMO/SA risk detected â†’ create legal/compliance review task
```

## 25.3 Serviced accommodation recipes

```text
When booking confirmed â†’ create cleaning task
When checkout tomorrow and no cleaner assigned â†’ urgent alert
When occupancy below target for 14 days â†’ create pricing review
When guest reports issue â†’ create work order and notify manager
When check-in 48h away and payment clear â†’ release instructions
When channel sync conflict â†’ block dates and notify manager
When cleaning completed â†’ mark listing ready
```

## 25.4 HMO/shared housing recipes

```text
When room vacant > 14 days â†’ notify manager
When licence expires in 90 days â†’ create renewal task
When fire safety evidence missing â†’ create compliance task
When occupancy exceeds licence limit â†’ critical alert
When tenant moves in â†’ create room checklist
When communal cleaning missed â†’ notify supplier
```

## 25.5 Supplier recipes

```text
When emergency job created â†’ notify top verified suppliers
When supplier accepts job â†’ notify tenant/guest
When job completed without evidence â†’ block payment release
When supplier insurance expires in 14 days â†’ warn supplier and manager
When quote exceeds budget â†’ request approval
When supplier completes 5 jobs with 5-star reviews â†’ suggest preferred supplier
```

## 25.6 Marketplace recipes

```text
When transaction paid â†’ calculate platform fee
When dispute opened â†’ hold payout
When review submitted â†’ update supplier/listing score
When listing verification expires â†’ unpublish listing
When payout failed â†’ notify admin and supplier
When suspicious review detected â†’ send to moderation queue
```

## 25.7 Money recipes

```text
When invoice overdue â†’ send reminder draft
When payment received â†’ update money dashboard
When deposit release due â†’ request manager approval
When refund approved â†’ create refund action
When property spend exceeds budget â†’ alert owner
```

## 25.8 Accounting recipes

```text
When booking completed â†’ create revenue journal draft
When supplier job approved â†’ create expense journal draft
When refund issued â†’ create reversal journal draft
When accounting period closing â†’ lock draft changes after approval
When unbalanced journal detected â†’ block posting
```

## 25.9 Compliance recipes

```text
When certificate expires in 30 days â†’ request renewal
When compliance evidence uploaded â†’ update checklist
When country pack changes â†’ review affected compliance items
When short-let licence missing â†’ block booking listing publish
When supplier licence missing â†’ block high-risk job assignment
```

## 25.10 Legal recipes

```text
When legal matter created â†’ create evidence checklist
When legal draft generated â†’ request legal review
When country legal profile unreviewed â†’ disable legal templates
When possession evidence missing â†’ notify manager
When legal disclaimer not accepted â†’ block legal tools
```

## 25.11 Customer/portal recipes

```text
When guest checks in â†’ send welcome message
When tenant reports issue â†’ create work order
When customer uploads document â†’ notify manager
When booking review due â†’ send review request
When customer payment fails â†’ send payment retry message
```

## 25.12 Admin recipes

```text
When automation fails 5 times â†’ pause and notify admin
When AI spend reaches 80% cap â†’ notify owner
When webhook signature fails repeatedly â†’ disable webhook
When supplier dispute rate exceeds threshold â†’ admin review
When blocked country signup attempted â†’ log and notify compliance
```

---

# 26. Natural language builder

Route:

```text
/app/automations/ai-builder
```

UX:

1. User types automation idea.
2. AI asks clarifying questions if needed.
3. AI creates draft workflow.
4. User sees plain-English summary.
5. User sees node canvas.
6. User tests dry run.
7. User activates.

Examples:

```text
â€œWhen a serviced accommodation guest checks out, create a cleaning job, notify the cleaner, wait for evidence, then release the room as ready.â€

â€œWhen a supplier job is marked complete, require before/after photos before payment can be released.â€

â€œWhen rent-to-rent margin drops below 15%, notify me and create a renegotiation task.â€
```

AI output must include:

* trigger
* conditions
* actions
* approval gates
* risk level
* plan requirement
* estimated runs/month
* test payload
* missing fields
* warnings

---

# 27. Automation admin controls

Admin route:

```text
/admin/automations
```

Admin tabs:

1. Overview
2. All Automations
3. Runs
4. Errors
5. Abuse
6. Integrations
7. Templates
8. Node Registry
9. Plan Limits
10. Kill Switches
11. Audit

Admin can:

* disable automation globally
* disable node type globally
* disable external webhooks
* pause workspace automations
* view high-error automations
* view high-cost AI automations
* view payment/legal action attempts
* approve new templates
* manage plan limits
* export logs
* inspect run payloads with redaction
* force-replay failed run if safe

---

# 28. Database schema

Required tables:

```text
automation_definitions
automation_versions
automation_nodes
automation_edges
automation_runs
automation_node_runs
automation_run_events
automation_approvals
automation_templates
automation_template_categories
automation_webhooks
automation_webhook_events
automation_integrations
automation_secrets
automation_usage
automation_limits
automation_errors
automation_audit_events
automation_test_runs
automation_drafts
automation_ai_generations
automation_node_registry
automation_plan_limits
```

RLS rules:

* workspace members can see workspace automations according to role
* only owner/admin can activate high-risk automation
* finance role needed for money/accounting payment actions
* legal/compliance role needed for legal/compliance automation approval
* supplier can only see supplier-side automations in their workspace
* customer cannot see internal automations
* platform admin access audited

---

# 29. API routes

```text
/api/automations
/api/automations/[id]
/api/automations/[id]/versions
/api/automations/[id]/test
/api/automations/[id]/activate
/api/automations/[id]/pause
/api/automations/[id]/runs
/api/automations/[id]/approvals
/api/automations/templates
/api/automations/templates/[id]
/api/automations/ai-builder
/api/automations/webhooks
/api/automations/webhooks/[id]
/api/automations/webhooks/[id]/test
/api/automations/runs/[runId]
/api/automations/runs/[runId]/replay
/api/automations/node-registry
/api/automations/integrations
/api/automations/settings
```

Every API route must include:

* auth
* workspace membership
* role/permission gate
* plan gate
* zod validation
* RLS-safe query
* rate limit
* audit log
* safe errors
* no raw secret exposure

---

# 30. Worker/queue architecture

Do not run heavy automations inside normal web request lifecycle.

Architecture:

```text
trigger source
event table
automation dispatcher
run queue
node executor
integration executor
approval waiter
retry scheduler
audit logger
notification dispatcher
```

Implementation options:

1. Supabase Edge Functions
2. Vercel background jobs / cron where available
3. external worker later
4. queue table with polling worker
5. Upstash/QStash later if needed

Minimum v1:

* event table
* scheduled cron processor
* run queue table
* edge function or server job processor
* retry logic
* idempotency keys

---

# 31. Safety model

## 31.1 Blocked automatic actions

Never allow fully automatic:

* serve legal notice
* file court/legal claim
* delete workspace
* delete property
* release large payout without approval
* refund large payment without approval
* suspend customer/supplier without admin approval
* verify supplier ID/licence purely by AI
* override sanctions block
* change country legal profile silently

## 31.2 Approval-required actions

Require approval for:

* send legal draft
* send cancellation/refund message
* release payment
* issue refund
* charge damage fee
* publish marketplace listing in unreviewed country
* approve supplier verification
* unpublish/suspend supplier
* post accounting journal if high value
* create external webhook to new domain

## 31.3 Safe automatic actions

Can auto-run:

* create task
* create reminder
* notify internal user
* create draft message
* create compliance checklist
* update low-risk status
* create audit event
* create cleaning task
* send non-sensitive internal digest

---

# 32. Testing requirements

Create:

```text
scripts/test/automation-engine.mjs
scripts/test/automation-canvas-json.mjs
scripts/test/automation-limits.mjs
scripts/test/automation-safety.mjs
scripts/test/automation-webhooks.mjs
tests/e2e/automations.spec.ts
tests/e2e/automation-canvas.spec.ts
tests/e2e/automation-recipes.spec.ts
```

Tests:

* create recipe automation
* create canvas automation
* edit node config
* edit JSON safely
* invalid JSON blocked
* forbidden node blocked by plan
* webhook signature required
* dry run creates no live records
* payment action requires approval
* legal action requires approval
* AI action does not auto-send
* run logs created
* failure retries
* repeated failures pause automation
* usage limits enforced
* cross-workspace automation access blocked
* supplier cannot access manager automation
* customer cannot access internal automation
* admin kill switch works

---

# 33. Final build order

## Phase 1 â€” Smart recipes

* automation tables
* recipe templates
* recipe configuration forms
* runs/logs
* limits
* audit
* simple triggers/actions

## Phase 2 â€” Natural language builder

* prompt to draft workflow
* review screen
* safe activation
* generated JSON
* dry run

## Phase 3 â€” Canvas builder

* node library
* drag/drop
* inspector
* JSON view
* test mode
* logs
* versioning

## Phase 4 â€” Integrations/webhooks

* incoming webhooks
* outgoing webhooks
* Stripe/booking/supplier events
* channel sync events

## Phase 5 â€” Advanced automations

* marketplace automations
* supplier automations
* booking automations
* payment approvals
* AI scoring
* canvas-lite to advanced canvas

---

# 34. Final positioning

The automation layer should be described as:

> Propvora Automations lets property operators build smart, safe workflows across portfolios, bookings, suppliers, compliance, legal, money, accounting and marketplace operations â€” using ready-made recipes, natural language or an expandable node canvas with testing, approvals, limits and audit logs.

This becomes a major enterprise feature, but only if it is safe, testable and controlled.


---

# Source Pack: id_verifcation_upgrade.md

# FREE / LOW-OVERHEAD SUPPLIER ID VERIFICATION LAYER

## 1. Strategic decision

Propvora should not try to build a full paid KYC/AML identity-verification system on day one.

The best first version is a  **tiered verification stack** :

1. Email verification
2. Phone verification
3. Stripe Connect onboarding for payout/KYC requirements
4. Supplier document upload
5. Automated OCR extraction
6. Selfie + ID photo comparison/manual review
7. Business/insurance/licence evidence review
8. Admin approval badges
9. Upgrade path to Stripe Identity / Persona / Veriff / Onfido later if needed

This gives Propvora a practical verification system with low overhead, while avoiding false claims like â€œfully verified by government IDâ€ unless a proper provider is used.

---

# 2. Verification levels

Use clear badges.

## Level 0 â€” Unverified

Supplier has only created an account.

Badge:

```text
Unverified supplier
```

Restrictions:

* cannot receive marketplace jobs
* cannot receive emergency jobs
* cannot receive payouts
* can complete profile only

## Level 1 â€” Email verified

Checks:

* email confirmation link
* account created
* password/MFA optional

Badge:

```text
Email verified
```

Restrictions:

* can browse dashboard
* can complete onboarding
* cannot publish marketplace profile

## Level 2 â€” Phone verified

Checks:

* phone OTP
* country code match
* duplicate phone detection

Badge:

```text
Phone verified
```

Free/low-cost option:

* use email-only first if SMS cost is an issue
* later add Twilio/WhatsApp/Resend OTP
* allow manual phone verification by admin for early beta

## Level 3 â€” Payout verified via Stripe Connect

Checks:

* supplier completes Stripe Connect onboarding
* account has payouts enabled
* account country recorded
* business type recorded
* requirements currently due cleared where possible
* charges/payouts capability status stored

Badge:

```text
Payout verified
```

Why this is best first:

* low build overhead
* Stripe handles much of connected-account onboarding complexity
* supports solo contractors and companies
* ties directly to marketplace payments/payouts
* reduces need to store sensitive ID docs in Propvora

Required fields:

```text
stripe_account_id
stripe_account_country
stripe_business_type
stripe_charges_enabled
stripe_payouts_enabled
stripe_requirements_currently_due
stripe_requirements_eventually_due
stripe_disabled_reason
stripe_verification_last_synced_at
```

Important wording:

```text
Stripe payout verification confirms the supplier has completed the payment-provider onboarding required for payouts. It does not guarantee workmanship, licensing, insurance, legal compliance or suitability for a specific job.
```

---

# 3. Propvora free document verification

This is the free/low-overhead layer for trust badges.

## 3.1 ID document upload

Supplier uploads:

* passport
* driving licence
* national ID card
* residence permit where relevant

Fields:

```text
verification_document_id
supplier_id
user_id
document_type
document_country
document_number_masked
document_expiry_date
name_on_document
date_of_birth_optional
file_front_id
file_back_id
selfie_file_id
status
ocr_status
manual_review_status
risk_flags
created_at
verified_at
expires_at
```

Do not store full ID numbers unless absolutely required. Store masked values only.

## 3.2 OCR extraction

Use OCR to extract:

* name
* document type
* country
* expiry date
* visible document number partial
* date of birth if needed
* address if shown

Recommended low-overhead implementation:

* start with server-side OCR using open-source OCR or browser/on-device extraction
* Google ML Kit Text Recognition can recognise Chinese, Devanagari, Japanese, Korean and Latin scripts, analyse text structure and return bounding boxes/confidence/recognized text, making it useful for automating data entry from documents.
* OCR result should **never auto-approve ID alone**
* OCR only pre-fills fields and flags obvious mismatches

OCR statuses:

```text
not_started
processing
extracted
low_confidence
failed
manual_required
```

## 3.3 Selfie check

Low-overhead first version:

* supplier uploads selfie holding ID or separate selfie
* system checks file presence
* optional AI-assisted image quality check
* admin compares manually

Do not claim automated facial biometric verification unless using a proper provider.

Statuses:

```text
selfie_missing
selfie_uploaded
selfie_quality_failed
manual_compare_required
manual_match
manual_mismatch
```

## 3.4 Manual admin review

Admin reviews:

* name match
* document not obviously expired
* document country matches supplier country or explanation exists
* selfie appears to match
* Stripe Connect country mismatch
* insurance/licence names match supplier/business
* duplicate document risk
* suspicious edits/cropped/blurred images

Admin decision:

```text
approved
rejected
more_info_required
expired
suspicious
blocked
```

Admin must record:

* reviewer
* timestamp
* reason
* notes
* evidence checklist
* expiry date
* next review date

---

# 4. Business verification

Supplier company/team verification should include:

Fields:

```text
business_name
trading_name
company_number
tax_number
vat_number
registered_country
registered_address
website
business_email
business_phone
business_document_file_id
stripe_business_type
stripe_account_id
business_verification_status
```

Low-overhead first version:

* supplier enters company number/tax number
* uploads business registration document if available
* Stripe Connect onboarding collects payment-provider business details
* admin manually checks public registry where practical
* later integrate official registries/APIs per country

Badge:

```text
Business details reviewed
```

Do not call it â€œgovernment verifiedâ€ unless verified through official source/API.

---

# 5. Insurance and licence verification

This matters more than ID for property suppliers.

## Insurance verification

Supplier uploads:

* public liability insurance
* employer liability if team
* professional indemnity if professional service
* specialist insurance where needed

Fields:

```text
insurance_type
provider_name
policy_number_masked
coverage_amount
currency
valid_from
valid_to
document_file_id
ocr_extracted
manual_review_status
minimum_cover_met
verified_at
expires_at
```

Automation:

* OCR extracts insurer, dates and cover amount
* system warns if expired
* admin approves
* expiry reminder created
* expired insurance blocks high-risk jobs

## Licence verification

For:

* gas
* electrical
* fire safety
* asbestos
* pest control
* waste carrier
* locksmith/security
* HVAC
* lift/elevator
* EPC/energy assessor
* local contractor licence where relevant

Fields:

```text
licence_type
issuing_body
licence_number_masked
country_code
region_state
valid_from
valid_to
document_file_id
manual_review_status
required_for_categories
verified_at
expires_at
```

Automation:

* licence expiry reminder
* licence required by category
* block booking if required licence missing
* mark supplier as â€œlicence evidence reviewedâ€ not â€œlegally certifiedâ€ unless verified with official registry

---

# 6. Marketplace badge wording

Use precise trust badges:

```text
Email verified
Phone verified
Payout verified
ID evidence reviewed
Business details reviewed
Insurance evidence reviewed
Licence evidence reviewed
Emergency approved
Preferred supplier
Top rated
```

Avoid:

```text
Government verified
Fully vetted
Guaranteed safe
Legally compliant
Certified by Propvora
```

Unless there is formal verification evidence and legal review.

---

# 7. Verification risk rules

## Low-risk supplier

Examples:

* photographer
* cleaner for vacant property
* gardener
* painter for empty property

Minimum:

* email
* phone
* basic profile
* insurance recommended
* Stripe payout verification before paid marketplace jobs

## Medium-risk supplier

Examples:

* maintenance worker entering occupied homes
* short-let cleaner with keys
* handyman
* locksmith non-emergency
* furniture installer

Minimum:

* email
* phone
* Stripe payout verification
* ID evidence reviewed
* insurance evidence reviewed
* access rules accepted

## High-risk supplier

Examples:

* gas
* electrical
* fire safety
* emergency locksmith
* emergency access
* boiler/heating
* occupied property emergency
* vulnerable tenant/guest context

Minimum:

* email
* phone
* Stripe payout verification
* ID evidence reviewed
* insurance reviewed
* relevant licence reviewed
* emergency policy accepted
* admin approval
* country pack category approval

---

# 8. Database tables

Add:

```text
supplier_identity_verifications
supplier_identity_documents
supplier_selfie_checks
supplier_business_verifications
supplier_insurance_policies
supplier_licence_verifications
supplier_verification_events
supplier_verification_reviews
supplier_verification_badges
supplier_verification_requirements
supplier_verification_risk_flags
```

## supplier_identity_verifications

Fields:

```text
id
supplier_id
user_id
workspace_id
verification_level
status
provider
stripe_account_id
document_check_status
selfie_check_status
manual_review_status
risk_score
risk_flags
country_code
started_at
submitted_at
verified_at
expires_at
created_at
updated_at
```

## supplier_verification_reviews

Fields:

```text
id
supplier_id
verification_id
review_type
reviewer_user_id
decision
decision_reason
notes
checklist_json
created_at
```

## supplier_verification_badges

Fields:

```text
id
supplier_id
badge_key
badge_label
status
source
verified_at
expires_at
revoked_at
revoked_reason
```

---

# 9. API routes

Create:

```text
/api/suppliers/verification/start
/api/suppliers/verification/status
/api/suppliers/verification/upload-id
/api/suppliers/verification/upload-selfie
/api/suppliers/verification/ocr
/api/suppliers/verification/submit-review
/api/suppliers/verification/badges
/api/admin/supplier-verifications
/api/admin/supplier-verifications/[id]/approve
/api/admin/supplier-verifications/[id]/reject
/api/admin/supplier-verifications/[id]/request-more-info
/api/stripe/connect/onboarding
/api/stripe/connect/account-status
/api/webhooks/stripe/connect
```

Security:

* auth required
* supplier can only access own verification
* property manager can only see badge/status, not sensitive ID docs
* admin can see docs only with audited access
* ID docs stored private
* signed URLs expire
* every admin view logged
* redaction/delete flow required

---

# 10. UI pages

## Supplier verification page

Route:

```text
/supplier/verification
```

Sections:

1. Verification progress
2. Email/phone
3. Stripe payout onboarding
4. ID evidence upload
5. Selfie upload
6. Business details
7. Insurance
8. Licences
9. Review status
10. Badge preview

## Admin verification queue

Route:

```text
/admin/marketplace/verifications
```

Views:

* pending ID review
* pending business review
* pending insurance
* pending licence
* failed OCR
* suspicious
* expired
* emergency approval
* approved
* rejected

Admin review screen:

* supplier profile summary
* Stripe Connect status
* document preview
* OCR extracted fields
* selfie preview
* mismatch warnings
* insurance/licence docs
* risk flags
* approve/reject/request more info
* audit timeline

---

# 11. Automations

Add recipes:

```text
When supplier starts onboarding â†’ create verification checklist
When Stripe Connect payouts enabled â†’ add payout verified badge
When ID document uploaded â†’ run OCR extraction
When OCR confidence low â†’ send to manual review
When document expired â†’ reject and request new document
When insurance expires in 30 days â†’ notify supplier
When insurance expired â†’ remove insurance badge and block high-risk jobs
When licence expires in 30 days â†’ notify supplier
When licence expired â†’ block matching category jobs
When supplier approved for emergency work â†’ add emergency approved badge
When verification rejected â†’ notify supplier with reason
```

---

# 12. Free-first implementation order

## Phase 1 â€” zero/low-cost

1. Email verification
2. Phone field with manual verification option
3. Stripe Connect onboarding for suppliers receiving payouts
4. Private upload for ID/selfie/business/insurance/licence docs
5. OCR extraction to prefill fields
6. Admin manual review
7. Verification badges
8. Expiry reminders
9. Job-category blocking based on missing licence/insurance

## Phase 2 â€” low paid upgrade

1. Stripe Identity for higher-risk suppliers or customer/guest verification
2. Proper automated document authenticity checks
3. Liveness/selfie checks
4. Provider webhooks
5. Automatic redaction
6. Higher trust badges

Stripe Identity supports Verification Sessions that securely collect information and perform verification checks; document checks can verify the authenticity and ownership of government-issued identity documents, and successful checks move sessions to `verified`.

## Phase 3 â€” enterprise

1. Persona/Veriff/Onfido/Sumsub comparison
2. Country-specific KYC/KYB
3. Sanctions/PEP screening
4. Background checks where legally allowed
5. Official licence registry checks
6. Automated insurance verification provider

---

# 13. Final recommendation

The best free/least-overhead version is:

```text
Stripe Connect onboarding for payout verification
+
Propvora private document upload
+
OCR-assisted extraction
+
admin manual approval
+
clear trust badges
+
insurance/licence expiry automation
+
category-based job blocking
```

This is enough for beta marketplace trust without taking on the cost and complexity of a full identity-verification provider.

But do not call it â€œfully automated KYCâ€. Call it:

```text
Supplier verification evidence reviewed
```

or

```text
Payout verified + ID evidence reviewed
```

