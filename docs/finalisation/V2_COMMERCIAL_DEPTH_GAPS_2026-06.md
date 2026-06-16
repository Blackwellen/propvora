# V2 Commercial Depth + Value Gaps — New v2 Surfaces

Date: 2026-06-15
Branch: `Propvora-release-version.2.0`
Scope: the NEW v2 surfaces only (marketplace, supplier workspace, booking, payments/escrow/payouts, identity/KYC, customer workspace, admin control plane + risk, automation v2, network + activity, international).
Method: read each surface's lib + API + page code. Analysis only — no app code modified.

> **Framing.** The v2 build is *structurally* impressive: clean, typed, RLS-scoped, 42P01-tolerant data layers with honest state machines and audit trails. The gaps below are **not** about correctness or safety — they are about **commercial depth** (richness a paying operator/seller/buyer expects) and **value capture** (whether the surface is sticky and monetised). The recurring pattern: **the data kernel is built, but the value-generating and money-capturing edges are thin, placeholder, or unwired.**

---

## 0. Headline findings (the three that matter most)

1. **The marketplace has no actual checkout.** The commerce kernel is fully built in `src/lib/marketplace/transactions.ts` (`createMarketplaceTransaction` → fee split → commission ledger) and the fee engine (`fees.ts`) is DB-driven and correct. But the buyer-facing listing detail CTA is an explicit **non-destructive placeholder**: `src/components/marketplace/ListingDetail.tsx` renders "Request to book / Enquire to buy" that does `setRequested(true)` (local state) and tells the user *"Requesting does not commit you to anything."* No `createMarketplaceTransaction`, no payment, no enquiry persisted. **The only path that actually transacts money is the separate public `/stay` booking flow.** So the headline "marketplace + 2.5% fee engine" is, in the browse marketplace, **not wired to revenue**.
2. **Automation v2 (definitions / builder / canvas / webhooks) records runs but never executes them.** There are effectively **two automation systems**. The legacy `smart_rules` engine (`engine.ts` / `execute.ts` / `evaluate.ts`) *does* execute safe actions. The v2 `automation_definitions` layer (`definitions.ts`, `runs.ts`, `dry-run.ts`, the webhook receiver) only ever **CRUDs definitions, simulates dry-runs, and enqueues `automation_v2_runs` rows in status `queued`**. The inbound webhook route (`api/automations/trigger/[token]/route.ts`) explicitly *"only RECORDS a queued run"*. **There is no worker / cron / consumer that picks up a queued `automation_v2_run` and runs the definition's action array.** A `grep` for `recordRun`/`evaluateWorkspace` confirms no executor reads `automation_definitions`. So a webhook-triggered v2 automation is recorded honestly as "queued" and then nothing happens to it. also we need canvas enlargers, nodes need a rdesign and they dont drag and drop, missing all the required listed nodes etc and functions there were laods 
3. **Supplier earnings and customer/marketplace value are display-only.** Supplier earnings (`supplier/earnings/page.tsx`) defaults to `indicative ?? true` and shows an "indicative figures" banner — earnings are not reconciled from real payouts. Across surfaces, there are essentially **zero analytics/insight dashboards** for the people who'd pay for them (seller performance, listing conversion, demand signals, payout schedules).

---

## 1. Surface-by-surface table

| #  | Surface                                                                                                         | Depth                                                     | Commercial-depth gaps (what a paying user expects, missing)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Value gaps (what makes it sticky, missing)                                                                                                                                                                                                                                                   | Monetisation status                                                                                                                                                                                                                                                              |
| -- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | **Marketplace** (`lib/marketplace/*`, browse/detail pages)                                              | **Partial** — kernel deep, edge placeholder        | No checkout (CTA is a non-committal placeholder, money never moves in browse); search has**no sort / relevance ranking / recommendations / saved searches** (`searchListings` only orders by `published_at`/`created_at`); no seller analytics; no listing performance (views/impressions/conversion); reviews require a `transaction_id` but no transaction is created from browse, so reviews can't accrue; trust score exists but **does not influence search ranking**; no featured/promoted placement; no categories taxonomy surfacing in search.                                                                                                                                                                                                                                                                                                 | No demand signals, no "similar listings", no saved-search alerts, no map/clustering of listings, no buyer↔seller messaging from a listing (enquiry isn't persisted), no review→trust→ranking loop (the network-effect flywheel is absent).                                                | **Fee engine wired (2.5% DB-driven) but UNUSED in browse** — no transaction is created, so no fee is ever captured here. No premium placement / featured-listing add-on. Monetisation effectively £0 from the browse marketplace today.                                  |
| 2  | **Supplier workspace** (`lib/supplier/*`, `(supplier-workspace)`)                                     | **Partial**                                         | Quotes/jobs/connections are clean state machines but**earnings are "indicative" (not reconciled to payouts)**; no supplier-side analytics (win rate, avg quote value, response-time SLA tracking vs the `response_time_hours` they declare); `accepts_emergency` + emergency_job fee tier exist but no emergency dispatch/routing; coverage is stored + `coversLocation()` is pure-correct but **nothing matches a job to a covered supplier** (no marketplace discovery of suppliers by coverage/availability); availability table exists but isn't used to gate quote requests; no supplier ratings feeding their ranking; no repeat-customer / preferred-supplier mechanics.                                                                                                                                                                           | No lead-gen (operators can't*discover* suppliers by trade/coverage/rating — connection is invite-by-id only); no supplier scorecard, no SLA enforcement, no "jobs near you" feed, no calendar/availability-driven matching. Stickiness depends on operators bringing their own suppliers. | Fee tier (`supplier_job`, `emergency_job`) exists in fee rules; but jobs/quotes never create a `marketplace_transaction`, so **no commission is captured on supplier work**. No supplier subscription / featured-supplier tier.                                      |
| 3  | **Booking / direct booking** (`lib/booking/*`, `/stay`, `/app/bookings`)                            | **Partial → the deepest real commerce path**       | Solid: availability (overlap + blocked dates), pricing (nights + weekend uplift), public SECURITY-DEFINER reservation RPC, holds with expiry. But:**no channel manager / iCal / Airbnb / Booking.com sync** (single-channel only — fatal for serious STR operators); pricing is flat-rate + one weekend uplift only — **no seasonal rates, length-of-stay discounts, last-minute/early-bird, occupancy-based dynamic pricing, promo codes, min/max-stay enforcement beyond rate-plan fields**; no cleaning-fee / extra-guest-fee / security-deposit line items (only a single nightly rate); no guest review → host rating loop; no booking modification flow; no cancellation-policy engine (cancel just flips status, no refund policy applied).                                                                                                           | No multi-property calendar, no demand/pacing signals, no occupancy/RevPAR analytics, no guest CRM / re-book, no upsells, no automated guest messaging tied to booking lifecycle.                                                                                                             | Platform fee IS folded into stay pricing (`quoteStayWithFees`, `platform_fee_pence` on booking) — **this is the one place fees are genuinely captured**. But no add-on monetisation (no channel-sync upsell, no dynamic-pricing tier, no booking-protection product). |
| 4  | **Payments / escrow / payouts** (`lib/payments/*`, `/money/payouts`)                                  | **Partial**                                         | Escrow + Connect transfer + payout libs are well-modelled and Stripe-honest (pure param builders, webhook-driven state). But there is**no invoicing, no statements, no tax documents/1099-equivalent, no payout schedule control** (payouts are one-shot `pending→paid`, no daily/weekly/monthly schedule, no payout threshold, no instant-payout product); `getPayoutSummary` hardcodes `inTransitPence: 0` (no in-transit state in the live model) — so payout transparency is coarse; no reserve/rolling-reserve for risk; no fee/refund reconciliation surfaced to the seller; refunds lib exists but no self-serve refund UX tied to disputes.                                                                                                                                                                                                           | No earnings statement export (CSV/PDF), no remittance advice, no payout calendar, no "next payout" forecast, no balance breakdown by source. Sellers can't reconcile.                                                                                                                        | Commission is*recorded* in the commission ledger and *deducted* in payout math — but only when a transaction exists (i.e. only the stay path). No instant-payout fee, no premium-payout-speed product, no FX margin on cross-border.                                        |
| 5  | **Identity / KYC** (`lib/identity/*`)                                                                   | **Partial (honest MVP)**                            | The module is explicitly honest: sanctions screening is a**SIGNAL, not a provider** (`screening.ts` checks only Propvora's own banned-country list + a naive name-substring watchlist — clearly labelled "NOT a legal sanctions/AML determination"). Stripe Identity is wired only as **pure param builders + webhook status mapping** — `buildVerificationSessionParams` never calls Stripe; there is no server action that actually creates the session, so **standalone KYC verification cannot currently be initiated from the app** (the only real "verified" path is via Connect onboarding). No PEP screening, no adverse-media, no document-expiry re-verification, no tiered KYC by transaction value.                                                                                                                                     | No verified-badge surfaced to buyers as a trust/ranking signal, no re-verification cadence, no per-jurisdiction KYC thresholds. KYC is a compliance checkbox, not a value/trust driver.                                                                                                      | No monetisation (nor expected) — but KYC also isn't leveraged to unlock higher limits / lower fees / trust badges that*could* drive upgrades.                                                                                                                                 |
| 6  | **Customer workspace** (`lib/customer/*`, `(customer)`)                                               | **MVP**                                             | Saved listings (favourites), bookings, orders, message threads — all read-only lists.**No re-book, no loyalty/points, no order tracking beyond a status string, no saved payment methods, no in-thread composer depth** (threads list last-message but composing/replying depth not evident here), no reviews-from-customer, no wishlists/collections, no price-drop or availability alerts on saved listings. Orders read `marketplace_transactions` as buyer — but since browse has no checkout, customer "orders" only populate from stays.                                                                                                                                                                                                                                                                                                                    | No loyalty/repeat-purchase mechanics, no personalised recommendations, no saved-search alerts, no re-engagement. The customer side is a receipt drawer, not a sticky account.                                                                                                                | No monetisation surface (membership, priority booking, etc.).                                                                                                                                                                                                                    |
| 7  | **Admin control plane + risk** (`(admin)/admin/marketplace`, `/admin/risk`, `lib/risk/*`)           | **Partial → Deep on oversight, advisory on risk**  | Admin marketplace oversight is genuinely good: live GMV / platform revenue / active listings / open disputes / pending payouts, all summed from real rows. Dispute resolution is authorised + audited. Risk engine ingests real signals (sanctions/KYC/disputes/marketplace) into `risk_events` + a scored/banded `risk_scores`. **Gaps:** risk is **advisory only — it never gates or blocks anything** (explicitly "NOT an authorisation gate"); `assessTransactionRisk` is pure heuristics never wired into the transaction path; no automated holds/reserves on high-risk; no admin revenue analytics beyond 5 KPIs (no cohort, no trend, no take-rate over time, no per-category GMV); no chargeback/fraud-loss tracking; no fee-rule editor UI surfaced (fee rules are DB-only).                                                                   | No admin growth analytics, no liquidity/marketplace-health metrics (supply/demand balance, time-to-first-transaction), no automated risk enforcement, no payout-risk reserves.                                                                                                               | The admin plane*measures* monetisation (take-rate) well but provides **no levers** to tune it in-product (fee rules, promotions, featured placement are all DB-only or absent).                                                                                          |
| 8  | **Automation v2** (`lib/automation/{definitions,runs,caps,dry-run}`, builder/canvas/webhooks/templates) | **Partial — builds + simulates, does not execute** | **Definitions are CRUD-only + dry-run-only.** The v2 definition path (builder/canvas/webhook source, action arrays, versioning, caps, dry-run preview) is well-built, but **no executor consumes `automation_v2_runs`** — the webhook receiver enqueues a `queued` run and stops; dry-run never writes. Only the legacy single-action `smart_rules` engine actually executes (and only safe/reversible actions: task/notification/draft/flag/reminder). So v2's multi-action definitions, webhook triggers, and scheduled triggers **do not run**. No real integrations/connectors (Slack/email-send/HTTP-out) — `draft_message` explicitly never sends. Caps exist but only matter once execution exists.                                                                                                                                      | No actual workflow value delivered from the v2 builder; no marketplace of integrations; no outbound webhooks/actions; the "canvas/builder" is a design surface over an engine that doesn't run its output.                                                                                   | Automation is plan-gated (`gateAutomation`) — a real upgrade lever — but the gated feature **doesn't execute its headline (v2) capability**, which undercuts the upsell.                                                                                               |
| 9  | **Network + activity** (`lib/network/*`)                                                                | **Partial**                                         | Unified cross-module activity feed (`activity.ts`) is genuinely useful and honest (merges real rows from 8 modules). Partner graph (`partners.ts`) is a derived/cached relationship graph via `recompute_partner_graph`. **Gaps:** activity is a feed only — **no insights, no aggregates, no trends, no exports**; partner graph shows counts + last-interaction but **no value** (no £ transacted per partner, no partner scoring, no "top suppliers/customers by revenue", no relationship health, no churn signals); no directory/discovery built on the graph (can't *find* new partners). Note: `activity.ts`/`partners.ts` reference `supplier_quotes`/`supplier_jobs` and `amount` columns that differ from the P3 `supplier_marketplace_quotes`/`supplier_job_assignments` tables — possible schema drift / dead reads. | The network is the natural**network-effect flywheel** (more partners → more activity → more value) but it's presented as a passive log + count, not as a directory, a scorecard, or a discovery engine.                                                                              | No monetisation (network/directory placement, partner-intro fees, etc.).                                                                                                                                                                                                         |
| 10 | **International** (`lib/international/*`, i18n, jurisdiction)                                           | **Partial (honest)**                                | Country packs, jurisdiction guardrails, and a tax**ESTIMATE** engine (DB-driven rates + correct GB-VAT fallback, explicitly "not tax advice, we don't file or pay"). Sanctioned countries handled. **Gaps:** tax is estimate-only — **no tax collection, no remittance, no invoicing with tax lines, no VAT MOSS / OSS, no per-country payout compliance, no multi-currency settlement** (everything defaults GBP; no FX); i18n appears to be jurisdiction/guardrail logic rather than full UI localisation; no automated jurisdiction-based fee/tax application into the transaction.                                                                                                                                                                                                                                                                   | No genuine multi-market expansion value (no localised pricing display, no currency selection, no market-specific compliance packs that unlock new geographies as a product).                                                                                                                 | FX margin and per-market tax handling are obvious monetisation/expansion levers that are absent; tax engine captures nothing.                                                                                                                                                    |

---

## 2. Consolidated, prioritised master list of EVERY gap

Tags: **Surface** · **Impact** (High/Med/Low) · **Effort** (S/M/L). Grouped by surface; nothing deduped so nothing is missed.

### Marketplace

1. **No buyer checkout — CTA is a non-committal placeholder; `createMarketplaceTransaction` is never invoked from browse.** · High · L
2. Enquiry/"request" is not persisted (only local `setRequested` state) — buyer intent is lost, no lead for the seller. · High · S
3. No search sort options (price asc/desc, newest, rating, distance). · High · S
4. No relevance ranking / weighting (text match score, recency, trust). · High · M
5. No recommendations / "similar listings" / "you may also like". · Med · M
6. No saved searches + alerts (no re-engagement loop). · Med · M
7. Trust score does not influence search ranking (built but inert as a ranking signal). · High · S
8. No seller analytics (impressions, views, click-through, conversion, time-to-sale). · High · M
9. No listing performance metrics captured at all (no view/impression events). · High · M
10. Reviews depend on a `transaction_id` that browse never creates → review/trust flywheel can't spin. · High · M
11. No featured / promoted / boosted listing placement (a core marketplace monetiser). · High · M
12. No map view / geo-clustering despite lat/lng on listings. · Med · M
13. No buyer↔seller messaging from a listing. · High · M
14. No category/taxonomy browsing surfaced in search UX. · Low · S
15. not showing in side nav or publically at all

### Supplier workspace

15. Earnings are "indicative" (`indicative ?? true`) — not reconciled to real payouts. · High · M
16. No commission ever captured on supplier jobs/quotes (no transaction created on job completion). · High · M
17. No supplier discovery by operators (connection is invite-by-id only; `coversLocation` exists but nothing matches jobs→suppliers). · High · L
18. No supplier analytics (win rate, avg quote value, acceptance rate, response-time SLA vs declared `response_time_hours`). · Med · M
19. Availability table exists but isn't used to gate quote requests / scheduling. · Med · M
20. Emergency dispatch/routing absent though `accepts_emergency` + `emergency_job` fee tier exist. · Med · M
21. No supplier ratings feeding a supplier ranking / preferred-supplier status. · Med · M
22. No "jobs near you" feed for suppliers (no inbound lead-gen). · High · L
23. Possible schema drift: `network/activity.ts` reads `supplier_quotes`/`supplier_jobs`/`amount` vs P3 `supplier_marketplace_quotes`/`supplier_job_assignments`. · Med · S

### Booking

24. **No channel manager / iCal / Airbnb / Booking.com sync** — single-channel only. · High · L
25. No seasonal / date-range pricing (only flat rate + one weekend uplift). · High · M
26. No length-of-stay discounts, early-bird, last-minute, occupancy-based dynamic pricing. · High · M
27. No promo codes / discounts. · Med · M
28. No cleaning fee / extra-guest fee / security deposit line items (single nightly rate only). · High · M
29. No cancellation-policy engine (cancel flips status, applies no refund policy). · High · M
30. No guest review → host rating loop. · Med · M
31. No booking modification flow (change dates/guests). · Med · M
32. No multi-property calendar / occupancy / RevPAR analytics. · Med · L
33. No automated guest messaging tied to booking lifecycle. · Med · M
34. No upsells / add-ons at booking. · Med · M
35. not showing in the side nav at all

### Payments / escrow / payouts

35. No invoicing / statements / remittance advice for sellers. · High · M
36. No tax documents (annual earnings / 1099-equivalent). · Med · M
37. No payout schedule control (only one-shot `pending→paid`; no daily/weekly, no threshold). · High · M
38. `inTransitPence` hardcoded to 0 — coarse payout transparency. · Med · S
39. No instant-payout / faster-payout product (a classic add-on monetiser). · Med · M
40. No reserves / rolling reserves for risk. · Med · M
41. No seller-facing fee/refund reconciliation view. · Med · M
42. No self-serve refund UX tied to disputes (refunds lib exists, unsurfaced). · Med · M
43. No earnings export (CSV/PDF). · Med · S

### Identity / KYC

44. Sanctions screening is a SIGNAL, not a real provider (no PEP, no adverse-media, no licensed list). · High · L
45. No server action actually creates a Stripe Identity session — standalone KYC can't be initiated in-app (only Connect path proves identity). · High · M
46. No document-expiry re-verification cadence. · Low · M
47. No tiered KYC by transaction value / jurisdiction thresholds. · Med · M
48. Verified status isn't surfaced as a buyer-facing trust/ranking badge. · Med · S

### Customer workspace

49. No re-book from past stays/orders. · Med · S
50. No loyalty / points / membership mechanics. · Med · M
51. No personalised recommendations. · Med · M
52. No price-drop / availability alerts on saved listings. · Med · M
53. No saved payment methods. · Med · M
54. No customer-side reviews. · Med · M
55. Orders only populate from stays (browse has no checkout) — "orders" tab is mostly empty by construction. · High · (resolved by #1)
56. no full commercial or user customer depth we need that oo
57. no access through onboarding

### Admin control plane + risk

56. Risk is advisory only — never gates/blocks/holds (no automated enforcement). · Med · M
57. `assessTransactionRisk` pure heuristic is never wired into the transaction path. · Med · S
58. No admin growth/marketplace-health analytics (take-rate trend, per-category GMV, supply/demand, time-to-first-transaction, cohort). · High · M
59. No chargeback / fraud-loss tracking. · Med · M
60. No in-product fee-rule editor (fee rules are DB-only — can't tune monetisation without SQL). · High · M
61. No promotions / featured-placement controls for admins. · Med · M
62. No payout-risk reserves / holds for flagged workspaces. · Med · M

### Automation v2

63. **No executor consumes `automation_v2_runs` — v2 definitions never run** (webhook/dry-run only enqueue/simulate). · High · L
64. Webhook/schedule triggers don't actually fire any action. · High · L
65. No real outbound actions/integrations (`draft_message` never sends; no Slack/email/HTTP-out). · High · L
66. The builder/canvas is a design surface over an engine that doesn't execute its multi-action output. · High · M
67. Two parallel automation models (`smart_rules` vs `automation_definitions`) — only the legacy one runs; confusing + duplicative. · Med · M
68. completely change from smart rules into automation section
69. full drag and drop canvas
70. fulkl lsit of all the required 50+ node types
71. usage limits and caps and their enforcemtn
72. the sart rules section is now swallowed by autoimnationa nd called this in side nav

### Network + activity

68. Activity feed has no insights/aggregates/trends/exports (log only). · Med · M
69. Partner graph shows counts/last-interaction but no value (£ per partner, partner scoring, top-by-revenue, health/churn). · Med · M
70. No partner directory / discovery built on the graph (can't find new partners). · High · L
71. Network effects are passive (no flywheel surfaced). · Med · L

### International

72. Tax is estimate-only — no collection / remittance / VAT-MOSS-OSS. · Med · L
73. No multi-currency settlement / FX (defaults GBP everywhere). · High · L
74. No localised pricing display / currency selection. · Med · M
75. Jurisdiction tax/fee not auto-applied into the transaction split. · Med · M
76. No market-specific compliance packs as an expansion product. · Low · L

---

## 3. Top 10 "make it commercially serious" upgrades

Ranked by commercial impact ÷ effort, grounded in the code above.

1. **Wire a real marketplace checkout.** Replace the placeholder CTA in `ListingDetail.tsx` with a flow that creates a payment intent → `createMarketplaceTransaction` → escrow hold → payout. The kernel, fee engine, escrow, and Connect transfers already exist; only the buyer edge is missing. **This is the single change that turns the marketplace from £0 to revenue-generating.** (Gaps 1, 2, 10, 55) · Effort L.
2. **Add an automation v2 executor.** Build the worker/cron that drains `automation_v2_runs` (status `queued`) and runs each definition's action array through `executeAction` (with caps + review gates). Without it, the entire v2 builder/canvas/webhook investment delivers no workflow value and undercuts the `gateAutomation` upsell. (Gaps 63–66) · Effort L.
3. **Make the trust/review/ranking flywheel real.** Order search by a relevance+trust score, let completed transactions spawn review prompts, and feed trust score back into ranking. This creates the marketplace network effect and a reason to transact on-platform. (Gaps 3, 4, 7, 10) · Effort M.
4. **Ship pricing depth for bookings** (seasonal rates, LOS discounts, cleaning/extra-guest fees, cancellation policy, promo codes). STR operators will not pay for flat-rate + one weekend uplift. (Gaps 25–29) · Effort M.
5. **Channel sync (iCal import/export at minimum).** Single-channel bookings are a non-starter for serious hosts; iCal two-way is the table-stakes wedge before full Airbnb/Booking.com APIs. (Gap 24) · Effort L.
6. **Reconcile supplier + seller earnings to real payouts and add statements/exports.** Kill the "indicative" default; surface a payout calendar, balance breakdown, and CSV/PDF statement. Turns the money surfaces from display-only into something operators trust and rely on. (Gaps 15, 35, 37, 38, 43) · Effort M.
7. **Capture commission on supplier jobs.** On `completeJob`, create a `marketplace_transaction` (the `supplier_job`/`emergency_job` fee tiers already exist) so supplier work actually monetises. (Gaps 16) · Effort M.
8. **Build supplier (and partner) discovery.** Use `coversLocation` + trades + availability + rating to let operators *find* suppliers, and surface the partner graph as a directory. This is the lead-gen value that makes both the supplier workspace and the network sticky. (Gaps 17, 22, 70) · Effort L.
9. **Seller + admin analytics.** Listing impressions/views/conversion for sellers; take-rate trend, per-category GMV, supply/demand health for admins; plus an in-product fee-rule editor so monetisation is tunable without SQL. (Gaps 8, 9, 58, 60) · Effort M.
10. **Featured/promoted placement + premium tiers.** A featured-listing boost, a featured-supplier tier, and an instant-payout fee are the highest-margin marketplace monetisers and all are currently absent. (Gaps 11, 21, 39, 61) · Effort M.

---

## 4. What's genuinely strong (so it isn't lost)

- **Fee engine** (`fees.ts`): DB-driven, most-specific-rule resolution, min/max clamps, provider-fee pass-through, unit-testable pure core. Production-grade — it just isn't called from browse.
- **Escrow + Connect + payouts** (`lib/payments/*`): honest Stripe modelling (pure param builders, webhook-driven state, no invented money movements), reuses billing/connect for destinations.
- **Booking** is the one end-to-end real-commerce path: anon SECURITY-DEFINER reservation RPC with server-side price recompute, availability overlap + blocked dates, holds with expiry, fees folded in.
- **Dispute engine**: authorised (DB `can_resolve_dispute`), state-machine-validated, audited; never claims a resolution that didn't write.
- **Risk engine**: ingests real signals idempotently, scores + bands, preserves manual flags across recompute, explicitly advisory (honest).
- **Unified activity feed**: merges real rows from 8 modules with strict scoping and graceful degradation.
- **Honesty discipline throughout**: KYC screening labelled a signal, tax labelled an estimate, automation drafts never auto-send, everything 42P01-tolerant. The build does not lie about what it does — the gap is that several headline capabilities don't yet *do* the commercial thing the surface implies.
