# PROPVORA BOOKING SYSTEM CANVAS — AIRBNB-LEVEL FUNCTIONAL DEPTH FOR DIRECT BOOKINGS, CUSTOMER WORKSPACE AND PROPERTY MANAGER WORKSPACE

## 0. Strategic decision

Propvora should not jump straight into a full public Airbnb clone.

The correct phased architecture is:

1. **Phase 1 — Direct Booking Management**
   * Property manager creates public booking pages.
   * Customers book directly.
   * Propvora manages availability, payments, check-in, cleaning, rules, deposits, cancellations, messaging, tasks, accounting and reporting.
   * External platforms sync by iCal first.
2. **Phase 2 — Customer Workspace**
   * Guest/customer gets a lightweight account or magic-link booking portal.
   * They can manage their booking, messages, payments, documents, check-in, extras, issues and reviews.
3. **Phase 3 — Supplier Workspace**
   * Cleaners, locksmiths, maintenance teams, linen services, emergency suppliers and property-service providers manage jobs, availability, packages, teams, invoices and work orders.
4. **Phase 4 — Supplier Marketplace**
   * Property managers can discover/book suppliers.
   * Supplier can list services, prices, service areas, packages and availability.
   * Stripe Connect or escrow provider handles payments.
5. **Phase 5 — Property Booking Marketplace**
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

## Stage 1 — Listing setup

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

## Stage 2 — Pre-booking discovery

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

## Stage 3 — Booking intent

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

## Stage 4 — Checkout

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

## Stage 5 — Booking confirmation

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

## Stage 6 — Pre-arrival management

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

## Stage 7 — Check-in

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

## Stage 8 — In-stay management

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

## Stage 9 — Checkout

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

## Stage 10 — Post-booking

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

* today’s arrivals
* today’s departures
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

* can’t access property
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
* property manager’s software provider

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
