# Propvora Global + Marketplace Context Expansion Audit

**Repository context:** `Blackwellen/propvora`**Audit date:** 2026-06-15**Document purpose:** Enrich the previous global audit with the missing PhD-depth product architecture: context-aware internationalisation, multi-country portfolios, country-aware Money/Accounting/Legal/Compliance/Work/Portfolio, AI, onboarding, storage/data, supplier workspaces, customer workspaces, supplier marketplace, property booking marketplace, escrow/disputes, direct booking pages, channel-manager strategy and automation upgrades.

> Internal strategy and implementation document. This is not legal, tax, financial, payment, employment, consumer, property, insurance or regulatory advice. Every country pack, payment rail, escrow flow, legal template, supplier marketplace feature and booking marketplace feature must pass qualified review before production enablement.

---

## 1. Executive conclusion

The previous global audit was directionally right but not deep enough. The real architecture problem is not just “add countries”. Propvora is becoming **multi-context software**. The same app action changes meaning depending on:

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

Internationalisation and marketplaces cannot be solved by simple translations. A “task”, “invoice”, “booking”, “legal matter”, “property”, “supplier job”, “customer payment” or “AI answer” must behave differently depending on context.

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

#### Example A — UK business, property in Spain

- Workspace country: GB
- Property country: ES
- Base currency: GBP
- Property currency: EUR
- Tax engine: UK SaaS billing for subscription; Spanish property taxes/operational reminders as country pack only if reviewed
- Legal: Spanish tenancy/short-let rules disabled unless ES pack reviewed
- Accounting: FX and property-level EUR ledger required
- AI: must say “Spanish local review required” if legal/tax query

#### Example B — US user, property in UK

- Workspace country: US
- Property country: GB
- Subscription billing may be USD
- Property income may be GBP
- UK compliance modules can apply to the UK property if user enables GB property pack
- US tax/accounting remains separate from UK property compliance

#### Example C — Australia operator with short-let properties in Thailand

- Workspace country: AU
- Property country: TH
- Booking currency may be THB, AUD or USD
- Short-let/legal rules require Thailand local review
- AI cannot confirm legality of short-let operation unless TH pack approved

### 3.3 UI model

Every workspace should have:

```text
Workspace Settings → Global Setup
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
Property Detail → Country & Jurisdiction
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

Stripe’s global availability page says that once Stripe is supported in your country/region, you can sell to customers anywhere in the world. It lists supported countries/regions including Australia, Austria, Belgium, Brazil, Canada, Croatia, Czech Republic, Denmark, Finland, France, Germany, Greece, Ireland, Italy, Japan, Mexico, Netherlands, New Zealand, Portugal, Romania, Spain, Sweden, Switzerland, Thailand, UAE, UK and US. It also shows India and Indonesia as Preview and Kenya/Nigeria/South Africa through an extended Paystack network.

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
ID  Indonesia — Stripe preview; manual review first
IN  India — Stripe preview; manual review first
KE  Kenya — extended network; review payout/payment assumptions
NG  Nigeria — extended network; review payout/payment assumptions
ZA  South Africa — extended network; review payout/payment assumptions
TR  Turkey — manual payment/provider/legal review
SA  Saudi Arabia — manual payment/provider/legal review
QA  Qatar — manual payment/provider/legal review
MA  Morocco — manual payment/provider/legal review
AL  Albania — manual payment/provider/legal review
AR  Argentina — manual payment/provider/legal review
CL  Chile — manual payment/provider/legal review
GL  Greenland — treat via Denmark relationship only after review
IS  Iceland — EEA/review first
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

- Operator workspace → “Referrals & Partners”
- Supplier workspace → “Partner leads / referrals”
- Customer workspace → “Refer a manager/supplier”
- Platform admin → “Affiliate & Partner control centre”

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

- “evidence collected”
- “workflow complete”
- “draft generated”
- “requires local review”
- “reviewed country pack”
- “not legal advice”

Do not show “compliant” as a definitive statement unless a reviewed country pack authorises that wording, and even then use caution.

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

> “When a serviced accommodation checkout is tomorrow and no cleaner is assigned, create an urgent job and notify approved cleaners within 10 miles.”

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

#### Phase 1 — internal/direct bookings

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

#### Phase 2 — channel calendar sync

- import Airbnb iCal
- import Booking.com iCal
- import Vrbo iCal
- export Propvora iCal
- detect conflicts
- manual conflict resolution
- no claim of full channel management

#### Phase 3 — official/partner integrations

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

The biggest product unlock is not “global translations”. It is **context-aware property operations**.
