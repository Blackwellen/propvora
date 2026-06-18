# Customer Workspace — Image Manifest (1:1 pixel-perfect build)

> Source of truth: the supplied customer-workspace design images, delivered in 3 batches.
> This manifest merges all batches into one 31-image map (the prompt says "30 images"
> but the supplied set resolves to 31 — image 31 is the Move-in Checklist page).
>
> **Build rule:** top-navigation only (no left sidebar). Top nav = Home · Stays · Lets ·
> Favourites · Messages · Bookings · Payments · Reviews · Help · avatar dropdown.
> Avatar dropdown = Profile settings · Account settings · Finance settings · Notifications ·
> Privacy · Security · Log out.

## Status legend
- `todo` — not started
- `wip` — in progress
- `done` — built + wired
- `blocked` — needs an input before coding (see Notes)

## ⚠️ Build blockers / ambiguities (raised per prompt §3)

1. **Batch A images (1–11) not in build context.** The Batch 1 / Batch A screenshots
   (Home, Favourites, Messages, Bookings manager/cards/table/map, Disputes, Completed,
   Booking detail, Dispute stages) were supplied in an earlier message and were dropped
   when the conversation was compacted. Only the Batch B & C pixels (≈ images 12–31) are
   currently visible. Pages 1–11 are therefore marked `blocked` for **pixel** parity and
   need the Batch A images re-attached. Their **component spec** (prompt §4) is captured
   below so the structure can be pre-built and pixel-QA'd on re-attach.
2. **Public route vs internal rewrite.** `next.config` rewrites `/user/*` → `/customer/*`.
   The prompt specifies literal `/customer/*` routes; this build targets `/customer/*`
   file routes directly and points the new top-nav at `/customer/*`. The legacy `/user/*`
   surface continues to exist via rewrite and is being superseded page-by-page.
3. **Top-nav render style.** Two mock variants appear across images — icon+label (e.g.
   Tenancy/Applications/Offers) and text-only-with-underline (e.g. Documents/Maintenance).
   Resolved to a single shared `CustomerTopNav`: icon + label, active item in Propvora
   blue with a blue underline (satisfies §2 "active nav underline in Propvora blue").

---

## BATCH A — Home, Favourites, Messages, Bookings (images 1–11)

| # | Visual title | Route | Active nav | Key components | Right panel / modal | Status |
|---|---|---|---|---|---|---|
| 1 | Customer Home Dashboard | `/customer/home` | Home | hero welcome + search, quick KPIs, upcoming stays, active bookings, saved, messages, exclusive offers, recommended, recent activity, account summary, trust & safety, invite/referral, quick actions | — | blocked (pixels) |
| 2 | Favourites | `/customer/favourites` | Favourites | saved stays + lets, collections, filters, card grid, map toggle, availability/price badges, trust badges, compare, recommended similar | — | blocked (pixels) |
| 3 | Messages | `/customer/messages` | Messages | conversation list, booking/let/viewing/application/support threads, attachments, quick replies, reply composer, unread badges | right linked-record panel | blocked (pixels) |
| 4 | Bookings Manager | `/customer/bookings` | Bookings | upcoming/active/past/cancelled, booking stats, search, filters, upcoming stay cards, status + payment badges, host details | selected booking panel | blocked (pixels) |
| 5 | Bookings — Card view | `/customer/bookings?view=cards` | Bookings | premium property cards, status, dates, guests, payment status, host avatar, next action | — | blocked (pixels) |
| 6 | Bookings — Table view | `/customer/bookings?view=table` | Bookings | dense register: ID, property, host, dates, status, total, payment status, source, actions | right detail drawer | blocked (pixels) |
| 7 | Bookings — Map view | `/customer/bookings?view=map` | Bookings | map + booking markers, property list, selected card, dates, check-in status, directions, host contact | selected booking card | blocked (pixels) |
| 8 | Booking Disputes | `/customer/bookings/disputes` | Bookings | open/resolved disputes, evidence-required, dispute state, stage tracker, case owner, timeline | selected dispute detail | blocked (pixels) |
| 9 | Booking Completed | `/customer/bookings/completed` | Bookings | completed list, review status, receipt status, refund/deposit status, host response, rebook, receipts | — | blocked (pixels) |
| 10 | Booking Detail | `/customer/bookings/:bookingId` | Bookings | property hero, status, dates, guests, price breakdown, payment status, host, check-in, house rules, docs, messages, map, cancellation policy, receipts, support/dispute | — | blocked (pixels) |
| 11 | Booking Dispute Stages | `/customer/bookings/:bookingId/dispute` | Bookings | stage tracker (submitted → host response → evidence review → platform review → resolution), evidence upload, message thread, outcome, SLA countdown | — | blocked (pixels) |

## BATCH B — Payments, Reviews, Help, Account, Lets dashboards (images 12–21)

| # | Visual title | Route | Active nav | Key components | Right panel / modal | Status |
|---|---|---|---|---|---|---|
| 12 | Payments | `/customer/payments` | Payments | tabs (Overview/Upcoming/History/Payment methods/Deposits & refunds/Statements), KPI row (upcoming, deposit held, refunds, rent due soon, saved methods, receipts), payments table, saved methods, autopay/direct debit, receipts & statements, deposit/refund tracker, payment support | payment detail panel (breakdown, timeline, method, autopay, actions) | todo |
| 13 | Reviews | `/customer/reviews` | Reviews | tabs (To write/Submitted/Responses/Saved stays), KPI row, stays-awaiting-review cards with category stars, submitted reviews table, review tips, review credits, trust & safety | review detail panel (ratings, your review, host response, stay info) | todo |
| 14 | Help Centre | `/customer/help` | Help | search help, emergency assistance, KPI (open tickets/priority/recent resolutions/safety), quick guides, help categories, support ticket table, top articles, dispute resolution, emergency & safety, support contact cards | selected case panel (linked booking, assignee, SLA, attachments) | todo |
| 15 | Account / Profile / Finance Settings | `/customer/account-settings` | avatar | tabs (Overview/Profile settings/Finance settings/Security/Notifications/Privacy), KPI row (verification, profile completeness, saved methods, autopay, security health), profile info, saved addresses, emergency contact, identity verification, comms prefs, notification channels, finance & payment settings, save/discard bar | account status, quick actions, payment summary, trust & safety (right rail) | todo |
| 16 | Lets Main | `/customer/lets` | Lets | internal tabs (Overview/Viewings/Applications/Offers/Tenancy), journey progress, upcoming viewings, active applications, open offers, active tenancies, pending docs, rent due, recommended homes, next steps, recent activity, support, trust strip | — | todo |
| 17 | Tenancy Profile | `/customer/lets/tenancies/:tenancyId` | Lets | tenancy hero, internal tabs (Tenancy Setup/Documents/Rent & Deposits/Maintenance/Inspections/Move-in/Renewal-Notice/Guarantor-Referencing), overview cards, landlord/agent, occupants, key dates, agreement, guarantor/referencing, deposit protection, onboarding progress, setup tasks | quick actions, next steps, support/help, tenancy summary (right rail) | todo |
| 18 | Lets — Viewings tab | `/customer/lets?tab=viewings` | Lets | KPI (upcoming/confirmed/completed/reschedule/cancellations), filters, viewings table, viewing-prep checklist, saved homes, feedback panel | selected viewing panel (property, host, date/time, access, transport, map, docs, notes, reminder) | todo |
| 19 | Lets — Applications tab | `/customer/lets?tab=applications` | Lets | KPI (draft/submitted/under review/approved/declined), applications table, next steps, application score, affordability check, guarantor support | selected application detail (applicant, household, referencing checklist, docs progress, timeline, comms) | todo |
| 20 | Lets — Offers tab | `/customer/lets?tab=offers` | Lets | KPI (open/counter/accepted/expired/holding deposits), offers table, compare offers, key comparison cards | selected offer panel (hero, rent, move-in, tenancy length, holding deposit, accept/counter/decline, financial breakdown, landlord terms, included/tenant pays, negotiation history, conditions, supporting docs) | todo |
| 21 | Lets — Tenancy tab | `/customer/lets?tab=tenancy` | Lets | KPI (active tenancies/upcoming move-ins/rent due/maintenance open/docs pending), tenancy list, tenancy timeline, documents due, maintenance requests, upcoming inspections, renewal countdown, quick actions | selected tenancy panel (next payment, landlord/manager, urgent actions) | todo |

## BATCH C — Lets search, details, viewings, applications, offers, tenancy ops (images 22–31)

| # | Visual title | Route | Active nav | Key components | Right panel / modal | Status |
|---|---|---|---|---|---|---|
| 22 | Lets Search | `/customer/lets/search` | Lets | search hero (location/move-in/budget/beds/furnishing/tenancy length/pet + more filters), KPI strip (saved lets/upcoming viewings/active applications/offers/active tenancies), results header (filters, cards/map/list selector, sort), property cards | recommended areas, search-on-map, application progress, recommended for you, upcoming viewings (right rail) | todo |
| 23 | Let Detail | `/customer/lets/properties/:letId` | Lets | photo gallery, title + verified badge, spec chips (rent/holding/security deposit/available/furnished/type/beds/baths/floor area/council tax/EPC/pet/tenancy length), tabs (Overview/Amenities/Area/Landlord/Fees/Documents/Viewing/Application), about, floorplan & documents, area overview, transport, schools, reviews, journey tracker | booking/application rail (Book viewing/Start application/Make offer/Save), trust & safety, reviews | todo |
| 24 | Viewing Detail | `/customer/lets/viewings/:viewingId` | Lets | hero, status, date/time, add-to-calendar, tabs (Overview/Instructions/Directions/Messages/History), reschedule/cancellation policy banner, host/agent card, countdown, travel time, viewing details, meeting/access, location map, related docs, previous messages | Your viewing + Manage viewing + Need-to-reschedule + cancellation policy (right rail) | todo |
| 25 | Application Wizard | `/customer/lets/applications/:applicationId/wizard` | Lets | stepper (Applicant Details/Income/References/Guarantor/Documents/Review & Submit), progress, linked property, affordability snapshot, step content (identity/right-to-rent, income verification, payslips, bank statements, employment contract, proof of address, additional docs), secure-data notice, Save draft/Back/Continue | application summary, application checklist, applicant card, guarantor card (right rail) | todo |
| 26 | Offer Detail | `/customer/lets/offers/:offerId` | Lets | offer header (#ref + status), property card, offer progress tracker, tabs (Overview/Terms/Messages/Documents/Activity), offer summary, special terms, notes, holding deposit, payment status, offer history & negotiation, property & agent, property highlights | Actions rail (Accept counter-offer/Amend/Withdraw/Pay holding deposit/Message), trust & security, payment breakdown, what happens next | todo |
| 27 | Tenancy Setup | `/customer/lets/tenancies/:tenancyId/setup` | Lets | setup progress, stepper (Agreement/Deposit/First Rent/ID Checks/Move-in Ready), tenancy internal tabs, agreement/deposit/first-rent/ID-checks/move-in-ready cards | tenancy summary, move-in date, total due before move-in, next actions, contacts, need-help (right rail) | todo |
| 28 | Rent Payments | `/customer/lets/tenancies/:tenancyId/rent-payments` | Payments | header + tenancy strip, KPI (next rent due/paid this year/outstanding/deposit held/overpayment credit), tabs (Rent Schedule/Receipts/Payment Methods/History), rent schedule table, payment history overview (donut), payment timeline | selected-month payment details (breakdown, summary, method, actions) | todo |
| 29 | Tenancy Documents | `/customer/lets/tenancies/:tenancyId/documents` | Lets | header (cover image), tenancy internal tabs, KPI (total/awaiting signature/recently added/expiring soon), category filter + search + upload, documents table, pagination | selected document preview (PDF viewer, signature panel, metadata, download/share/request signature) | todo |
| 30 | Maintenance Requests | `/customer/lets/tenancies/:tenancyId/maintenance` | Lets | header + New request button, tenancy tabs, KPI (open/in progress/emergency/awaiting landlord/resolved), quick report, process explainer, requests table, trust & safety, service-level expectations, escalation | selected issue detail (description, photos/videos, preferred access, contractor appointment, timeline, message thread, quick actions) | todo |
| 31 | Move-in Checklist | `/customer/lets/tenancies/:tenancyId/move-in` | Lets | header + Download checklist, tenancy tabs, KPI (checklist completion/items completed/pending/move-in date/docs uploaded), progress bar, checklist table (keys/inventory/meter readings/condition photos), Mark move-in complete | move-in summary, property, tenant, managing agent, next actions, quick actions (right rail) | todo |

---

## Shared components (built once, reused across all 31)

Reuse existing primitives in `src/components/customer/ui.tsx` + `format.ts` where they fit;
add the prompt's named shared components under `src/features/customer/`:

`CustomerTopNav` · `CustomerAvatarMenu` · `CustomerPageHeader` · `CustomerHeroSearch` ·
`CustomerKpiCard` · `CustomerPropertyCard` · `CustomerBookingCard` · `CustomerDataTable` ·
`CustomerRightPanel` · `CustomerTimeline` · `CustomerStatusBadge` · `CustomerPaymentBreakdown` ·
`CustomerDocumentPreview` · `CustomerMessageThread` · `CustomerUploadBox` · `CustomerStepper` ·
`CustomerEmptyState` · `CustomerLoadingSkeleton` · `CustomerActionBar` · `CustomerTrustSafetyCard`.

## Feature folder layout (prompt §10)

```
src/features/customer/shell/
src/features/customer/home/
src/features/customer/favourites/
src/features/customer/messages/
src/features/customer/bookings/
src/features/customer/payments/
src/features/customer/reviews/
src/features/customer/help/
src/features/customer/settings/
src/features/customer/lets/
src/features/customer/tenancies/
```
