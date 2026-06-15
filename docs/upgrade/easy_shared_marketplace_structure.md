# PROPVORA COMBINED MARKETPLACE CANVAS — PROPERTY BOOKINGS + SUPPLIER SERVICES + CUSTOMER WORKSPACES + SUPPLIER WORKSPACES + ESCROW + DISPUTES + UNIFIED SEARCH

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

> A property operations platform with a built-in marketplace for booking stays, booking suppliers, managing emergency jobs, handling payments, collecting reviews and resolving disputes — all connected to the property manager workspace.

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
“2 bed serviced apartment in Manchester”
“emergency plumber near Woking”
“short-let cleaner within 10 miles”
“HMO fire door installer”
“locksmith available now”
“student room in Leeds”
“EICR electrician”
“linen service for serviced accommodation”
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

* booking confirmed → create cleaning task
* payment overdue → remind guest
* check-in 48h away → release instructions if safe
* checkout complete → request review
* issue reported → create urgent work order

## Supplier automations

* emergency issue raised → notify verified suppliers
* supplier accepts → notify tenant/guest
* evidence missing → block payment release
* supplier insurance expired → block new jobs
* quote deadline nearing → remind suppliers

## Payment automations

* job approved → release payout
* dispute opened → hold payout
* refund approved → create refund
* platform fee earned → create accounting entry

## Trust automations

* licence expires soon → notify supplier/admin
* supplier dispute rate high → admin review
* fake review suspected → moderation queue
* country mismatch → risk review

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

## Release 1 — private marketplace foundation

* marketplace shell
* unified listing model
* supplier listings private
* booking listings private/direct only
* search internal only
* no public SEO marketplace
* no escrow yet
* basic payments/commission tracking

## Release 2 — direct booking + supplier work orders

* direct booking pages
* customer portal
* supplier workspace
* quote/work-order flow
* iCal sync
* reviews internal

## Release 3 — verified supplier marketplace

* supplier search
* packages
* emergency dispatch
* insurance/licence verification
* Stripe Connect/payment holds
* disputes

## Release 4 — property booking marketplace

* public stay search
* public listing pages
* checkout
* reviews
* host/property manager trust
* customer workspace

## Release 5 — full marketplace scale

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

> One property platform where operators can manage portfolios, publish booking pages, sell stays, book verified suppliers, dispatch emergency contractors, collect payments, handle disputes, track accounting and use AI automation — all tied back to the same property, unit, tenancy, booking, job and ledger records.
>
