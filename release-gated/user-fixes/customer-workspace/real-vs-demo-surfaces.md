# Customer Workspace — Real-Data vs Static-Demo Surfaces (honest 100/100 accounting)

**Date:** 2026-06-27
**Question answered:** "Are we 100/100? If not, what's left?"

**Short answer:** The customer workspace is **not** uniformly 100/100. It splits cleanly into two
halves. One half is wired to real Supabase/Stripe and is release-quality. The other half is a
**pixel-perfect UI built on static demo data** — its buttons are demo affordances, and making them
"real" is a **data-layer rebuild**, not button-wiring. This doc draws that line precisely so the
remaining work is a known, scoped feature build rather than a vague "finish the buttons."

The whole workspace remains **flag-gated OFF** for V1, so none of this ships to V1 users yet.

---

## ✅ Real-data surfaces — wired this session, release-quality

These read/write real Supabase tables and/or Stripe. All toast stubs on them have been replaced
with real actions (FIX-637…676):

- **Account settings** — profile (auth metadata), avatar (customer-files bucket), addresses
  (`customer_saved_addresses`), notifications (`customer_notification_preferences`), password + 2FA
  (Supabase Auth), data-export / deletion / identity (help-tickets + Stripe Identity), saved cards
  (Stripe SetupIntent), emergency contact (auth metadata).
- **Favourites** — `customer_favourites` + collections; stays Save round-trip + page hydration +
  compare view.
- **Bookings** — real `bookings` data: list (real **sort + search** FIX-676), detail, **modify**
  (host-message change request), **cancellation request** (`/api/customer/issues`), **CSV export**,
  **PDF receipts** (FIX-671), dispute-request, reachable modify/receipt from list panel + rail.
- **Payments** — real `bookings`-derived rows: history table + detail rail **receipts → PDF**,
  pay-now → booking detail (FIX-674); **self-service cards** (add/list/remove via Stripe).
- **Messages** — real `customer_message_threads` (separate session, already 100/100).
- **Stays** — public marketplace data + Save + **saved searches** (`customer_saved_searches`).
- **Maintenance** — `/api/customer/maintenance` (pre-existing).

---

## ◑ Static-demo surfaces — UI built on `src/features/customer/data/*` mock modules

These render **hardcoded demo data**, not Supabase. Their buttons are demo affordances (toasts).
The backing tables exist (the 55-table migration is applied) but **the UI never reads them**. Making
each real means rewiring its data layer to the live tables + building the matching endpoints —
a feature build, not a button fix. **Do not fake-wire these toasts** — that would hide the gap.

### 1. Lets (long-term rentals) — ✅ REBUILT ON REAL DATA (FIX-677)
**Status: done.** The Lets hub tabs (Viewings / Applications / Offers / Tenancy) and all 9 detail
pages now read RLS-scoped live data via `src/lib/customer/lets.ts` + `/api/customer/lets`. Viewing
confirm/reschedule/cancel and offer accept/counter/withdraw are wired to real PATCH endpoints.
Seeded realistic data for the dev customer (4 properties, 2 tenancies, 4 viewings, 3 offers, 3
applications). Remaining Lets long-tail (rent payment via Stripe, autopay, application doc upload,
move-in meter readings) routes into the real wizard / messages or is documented below.

### 1b. Search filter pickers (Lets + Stays) — ✅ WIRED (FIX-681)
**Status: done.** The previously "coming soon" toast pickers are now real client-side filters:
- **Lets** (`src/features/customer/lets/LetsSearch.tsx`): location text, move-in date (filters on
  `availableFrom`), monthly-budget brackets, bedrooms, furnishing, sort (recommended / price / beds /
  available-soonest), and Pet-friendly / Bills-included / Parking / Garden chips — all applied over
  `EXPANDED_LONG_TERM_RENTALS` with a live result count, empty state and "clear filters". The 5 KPIs
  (saved / viewings / applications / offers / tenancies) now read real counts from
  `/api/customer/lets?type=all` + `/api/customer/favourites`.
- **Stays** (`src/app/(customer)/customer/stays/page.tsx` → new `CustomerStaysFilterClient.tsx`):
  replaced the toggle-only `PublicFilterChips` (which wrote `?filters` but never applied them) with
  the canonical shared `FilterBar` — price range, type multi-select, bedrooms/bathrooms steppers,
  pets/instant/verified/short/long toggles, sort + infinite scroll, scoped to `/user/stays`.

<details><summary>Original (now historical) note</summary>

- **Data source today:** `src/features/customer/data/lets.ts` (static `tenancies`, `offers`,
  `viewings`, `applications`). e.g. `lets/tenancies/[id]/page.tsx` → `findTenancy(id)` from the mock.
- **Live tables that exist but are unused by the UI:** `customer_tenancies`,
  `customer_tenancy_*` (rent schedule, payments, documents, maintenance, move-in, meter readings,
  inspections), `customer_let_offers` + events/docs, `customer_let_viewings` + messages/docs,
  `customer_let_applications` + steps/refs/guarantors/affordability, `let_properties` + photos/docs.
- **~30 demo toast buttons** across: search filters (date/budget/bedrooms/furnishing/sort),
  gallery, offers (amend/pay/terms), tenancy (rent payment, autopay, receipts, pro-forma, move-in,
  meter readings, checklist uploads), viewings (reschedule/cancel/message/directions/policy/docs),
  applications (upload docs / add guarantor), wizard step uploads, document downloads.
- **To make real (scoped feature build):**
  1. Build `src/lib/customer/lets.ts` data layer reading the `customer_tenancies`/`let_*` tables
     (mirror `src/lib/customer/data.ts`'s booking pattern + RLS scoping).
  2. Point each `/customer/lets/*` server page at it (replace the `data/lets` mock imports).
  3. Build `/api/customer/lets/*` endpoints for the actions (offer respond/amend, viewing
     reschedule/cancel, application doc upload to a let bucket, rent payment via Stripe, autopay via
     `customer_autopay_mandates`, document downloads via PDF/storage).
  4. Wire each button to its endpoint.
  - Rough size: comparable to the bookings + payments wiring done this session, ×~1.5 (it's a full
    tenancy-management sub-product). Best done as its own drop.

</details>

### 2. CompletedPage — `/customer/bookings/completed`
- Static demo confirmation page (`data/mock` images, "—" placeholders, empty RECS). Receipt/invoice
  buttons now route to the real bookings list (FIX-675); a full fix makes this page render the
  customer's actual most-recent completed booking.

### 3. DashboardHero search widget — `customer/dashboard`
- Date/guest pickers are demo toasts; they should drive the stays search query (small).

### 4. Booking dispute pages — `DisputesClient` / `DisputeStagesPage`
- Demo over `customer_booking_disputes` (not read by the UI). Evidence uploader + withdraw are
  toasts. Real fix: read `customer_booking_disputes`, add an evidence-upload endpoint (booking-
  disputes bucket exists) + a withdraw action. The single-booking dispute *entry* (report-issue)
  is already real via `/api/customer/issues`.

---

## Bottom line

- **Real-data half: ~100/100** (release-quality, all stubs wired).
- **Demo half: a scoped data-layer rebuild** — chiefly the **Lets** long-term-rental sub-product,
  plus 3 smaller static pages. The tables are ready; the work is data-layer + endpoints + wiring,
  not "finish the buttons."

Recommend tackling **Lets** as a dedicated drop (its own `lib/customer/lets.ts` + `/api/customer/lets/*`),
the same way bookings/payments/account were done this session.
