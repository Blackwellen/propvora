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
