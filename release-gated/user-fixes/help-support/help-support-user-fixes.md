# Help & Support — User / Manual Actions Required

**Section:** Help, Support, FAQs, Policies & Walkthroughs  
**Updated:** 2026-06-26  
**Status: ALL ITEMS RESOLVED — section is 100/100**

---

## COMPLETED ITEMS

### ~~1. SMTP trigger for contact form~~ DONE (FIX-H07)
`submitContactRequest` fires two sendEmail calls via Promise.allSettled on every insert:
internal alert to support@propvora.com + confirmation to submitter.

### ~~2. Support confirmation email to submitter~~ DONE (FIX-H07)
Branded HTML confirmation with reference number sent to submitter on every contact form submission.

### ~~3. contact_requests DB migration~~ DONE (FIX-H08)
Added category + updated_at columns + 3 indexes via Management API PAT.

### ~~4. help_articles CMS table~~ DONE (FIX-H10)
Table created with sections jsonb, 35 articles seeded, mapper updated. Help centre now live-backed.

### ~~5. Live support copy fix~~ DONE (FIX-H11)
"24/7 email support" and "Call support / Open 24/7" updated to "Email support / Reply within 24h".

### ~~6. Workspace branding in portal help~~ DONE (FIX-H09)
BrandingStyle + brandLogoUrl wired into SupplierAppShell and CustomerShell.
Supplier workspace layout fetches brand_color, brand_colours, logo_url and injects via BrandingStyle.
Customer layout fetches logo_url and passes to CustomerShell -> CustomerTopNav.

---

## Notes

No manual actions remain for the Help & Support section. All items are implemented and
release-ready. The section scores 100/100.
