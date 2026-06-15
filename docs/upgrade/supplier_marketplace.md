# PROPVORA SUPPLIER MARKETPLACE CANVAS — PROPERTY CONTRACTOR MARKETPLACE, SUPPLIER WORKSPACES, EMERGENCY SERVICES, VERIFICATION, INSURANCE, LICENSING, ESCROW, DISPUTES AND PROPERTY-MANAGER PROCUREMENT

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
2. Employer’s liability insurance
3. Professional indemnity
4. Contractor’s all-risk
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

## Step 1 — Account type

Fields:

* solo supplier
* supplier company
* agency
* emergency supplier
* professional service
* utility/logistics partner

## Step 2 — Identity

Fields:

* legal name
* email
* phone
* country
* address
* date of birth if required by verification provider
* ID verification start

## Step 3 — Business details

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

## Step 4 — Categories

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

## Step 5 — Service areas

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

## Step 6 — Services and packages

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

## Step 7 — Availability

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

## Step 8 — Insurance

Upload:

* public liability
* employer liability if team
* specialist insurance
* expiry date
* coverage amount
* issuing country

## Step 9 — Licences

Upload category-specific certificates.

## Step 10 — Payments

* connect Stripe account
* payout country
* bank details through provider
* tax profile
* platform fee agreement
* escrow/hold agreement
* refund/dispute agreement

## Step 11 — Marketplace profile

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

## Step 12 — Review and publish

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

Do not casually call Stripe “escrow” unless the legal/payment setup supports it.

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
* today’s schedule
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

* jobs under £150 can be auto-approved
* emergency jobs can notify top 3 verified suppliers
* gas jobs require verified gas certification
* electrical jobs require verified electrical certification
* jobs over £1,000 require 2 quotes
* jobs over £5,000 require owner approval
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

> “When an emergency plumbing job is raised after 6pm, notify my top 3 verified plumbers within 10 miles and escalate to me if nobody accepts in 10 minutes.”

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

This module can become one of Propvora’s biggest moats.

The strongest product positioning is:

> Propvora Supplier Network gives property managers verified, insured and licence-aware property suppliers for planned works, emergency jobs, serviced accommodation operations, HMO compliance and rent-to-rent setup — with quotes, bookings, evidence, payments, reviews and disputes managed in one workspace.

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
