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

This gives Propvora a practical verification system with low overhead, while avoiding false claims like “fully verified by government ID” unless a proper provider is used.

---

# 2. Verification levels

Use clear badges.

## Level 0 — Unverified

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

## Level 1 — Email verified

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

## Level 2 — Phone verified

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

## Level 3 — Payout verified via Stripe Connect

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

Do not call it “government verified” unless verified through official source/API.

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
* mark supplier as “licence evidence reviewed” not “legally certified” unless verified with official registry

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
When supplier starts onboarding → create verification checklist
When Stripe Connect payouts enabled → add payout verified badge
When ID document uploaded → run OCR extraction
When OCR confidence low → send to manual review
When document expired → reject and request new document
When insurance expires in 30 days → notify supplier
When insurance expired → remove insurance badge and block high-risk jobs
When licence expires in 30 days → notify supplier
When licence expired → block matching category jobs
When supplier approved for emergency work → add emergency approved badge
When verification rejected → notify supplier with reason
```

---

# 12. Free-first implementation order

## Phase 1 — zero/low-cost

1. Email verification
2. Phone field with manual verification option
3. Stripe Connect onboarding for suppliers receiving payouts
4. Private upload for ID/selfie/business/insurance/licence docs
5. OCR extraction to prefill fields
6. Admin manual review
7. Verification badges
8. Expiry reminders
9. Job-category blocking based on missing licence/insurance

## Phase 2 — low paid upgrade

1. Stripe Identity for higher-risk suppliers or customer/guest verification
2. Proper automated document authenticity checks
3. Liveness/selfie checks
4. Provider webhooks
5. Automatic redaction
6. Higher trust badges

Stripe Identity supports Verification Sessions that securely collect information and perform verification checks; document checks can verify the authenticity and ownership of government-issued identity documents, and successful checks move sessions to `verified`.

## Phase 3 — enterprise

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

But do not call it “fully automated KYC”. Call it:

```text
Supplier verification evidence reviewed
```

or

```text
Payout verified + ID evidence reviewed
```
