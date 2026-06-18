# Customer dashboard · batch 01 · Images 300–309

All pages use **Chrome: Customer top-nav** (`CustomerTopNav` — logo left, centred
icon+label nav Home/Stays/Lets/Favourites/Messages/Bookings/Payments/Reviews/Help,
bell + avatar dropdown; no sidebar; mobile = `MobileTopBar` + bottom nav). Light
theme only, brand blue `#2563EB`, navy `#0D1B2A`, surfaces white on `#F6F9FE`,
cards `rounded-2xl border border-slate-200 shadow-sm`.

> Note: two route families coexist. The **root** `/customer` dashboard and several
> leaf pages (saved, search, orders, profile, notifications, maintenance, messages
> thread, modify/report wizards) are **live Supabase** surfaces using
> `src/components/customer/*` and link to legacy `/user/*` paths. The richer
> **feature** surfaces (home, stays, lets, bookings, payments, reviews, help,
> favourites, affiliate, account-settings) live in `src/features/customer/*` with
> seeded mock data and link to `/customer/*`. Both are catalogued as shipped.

---

### Image 300 — `/customer` — Customer workspace dashboard (live)
- **Area / Persona:** Customer dashboard · signed-in guest.
- **Route:** `/customer`
- **Chrome:** Customer top-nav.
- **Purpose:** At-a-glance hub: upcoming stays, orders, saved listings, recent activity (live data).
- **Layout:** `CustomerPageHeader` (welcome + Browse marketplace CTA) → `CustomerKpiStrip` (3 KPIs) → 2-col grid `[1.5fr_1fr]` (Upcoming stays list | Quick actions + Recent activity) → `StaysSummaryChart` full-width.
- **Primary components:** KPI cards (Upcoming stays / Orders / Saved listings, each linking to `/user/*`), upcoming-stay list rows (date chip, title, dates, price, status badge), 2×2 Quick-actions grid (Find a stay / My bookings / Saved / Messages), notifications list, stays summary chart.
- **Local nav / tabs / filters:** none.
- **Actions:** Browse marketplace → `/app/marketplace`; KPI/list rows → bookings/orders/saved; quick-action tiles.
- **States:** empty states per card (`CustomerEmptyState` — "No upcoming stays", "No recent notifications"); live `force-dynamic` fetch.
- **PWA notes:** KPI strip horizontal scroll/stack; quick-actions 2-col tiles ideal for thumb reach; chart lazy below fold.

---

### Image 301 — `/customer/home` — Home (feature hero dashboard)
- **Area / Persona:** Customer dashboard · guest.
- **Route:** `/customer/home`
- **Chrome:** Customer top-nav.
- **Purpose:** Marketing-grade home with search hero, stat strip, recommendations and activity.
- **Layout:** Full-bleed image **hero** (gradient overlay, greeting "Welcome back, {firstName}", inline stay search: Where + Search) → KPI/stat strip (5 stats: upcoming stays, orders, saved, messages, offers) → 2-col (recommended property cards grid | recent activity + quick actions) → trust/help bands.
- **Primary components:** hero search, stat cards, `CustomerPropertyCard` grid (save toggle), activity timeline, 4 quick-action tiles (Search stays / Browse collections / Invite friends / Customer support).
- **Local nav / tabs / filters:** none.
- **Actions:** Search → `/customer/stays?where=`; save toggles (toast); quick actions to stays/favourites/account-settings?tab=referrals/help.
- **States:** save toggle optimistic toast; seeded recommendations.
- **PWA notes:** hero collapses to stacked search; cards 1-col; sticky search candidate.

---

### Image 302 — `/customer/stays` — Find a stay (list)
- **Area / Persona:** Customer dashboard · discovery (signed-in marketplace).
- **Route:** `/customer/stays`
- **Chrome:** Customer top-nav.
- **Purpose:** Browse verified short-lets / serviced apartments / long-stays.
- **Layout:** Blue→white **hero** with `StayTypeTabs` (Stays / Long-term), H1 + subcopy + `PublicSearchBar` (stays variant) → sticky `PublicFilterChips` row → results section (`PublicResultsToolbar` count + map/list toggle) → responsive `StayCard` grid (1→4 cols) → `MarketplaceTrustStrip`.
- **Primary components:** stay-type tabs, search bar, filter chips (Price/Type/Bedrooms dropdowns, Pets, Instant book, Verified, Short lets, Long stays), results toolbar, StayCard grid, trust strip.
- **Local nav / tabs / filters:** StayTypeTabs; filter chips; grid↔map toggle (map → image 303).
- **Actions:** open stay → `/user/stays/[slug]`; map → `/user/stays/map`; search/filter.
- **States:** static SSR list from `getPublicStays`.
- **PWA notes:** sticky filter chips horizontal scroll; cards 1-col; map toggle full-screen.
- **Multi-stage / multi-view:** list (302) ↔ map (303).

---

### Image 303 — `/customer/stays/map` — Find a stay (map split)
- **Area / Persona:** Customer dashboard · discovery.
- **Route:** `/customer/stays/map`
- **Chrome:** Customer top-nav.
- **Purpose:** Map-first browsing of stays.
- **Layout:** Stacked top bars (search bar + filter chips, results toolbar with Save search, area chips + map/search toggle) → split pane: left 384px scroll list of `StayCompactCard` (first = featured), right flex map (`StaysMap`) with floating count bubble.
- **Primary components:** PublicSearchBar, filter chips, results toolbar (`showSaveSearch`), `MapAreaChips`, `MapSearchToggle`, compact cards, map, info bubble.
- **Local nav / tabs / filters:** area chips, filter chips, map↔list toggle.
- **Actions:** pin/card → `/user/stays/[slug]`; save search; list view.
- **States:** static; map client-rendered.
- **PWA notes:** collapse to map with bottom sheet card carousel; tap pin → sheet.
- **Multi-stage / multi-view:** sibling of 302.

---

### Image 304 — `/customer/stays/[slug]` — Stay detail
- **Area / Persona:** Customer dashboard · stay profile.
- **Route:** `/customer/stays/[slug]`  (dynamic: slug)
- **Chrome:** Customer top-nav.
- **Purpose:** Full stay listing with booking card.
- **Layout:** Header (verified chip, Save/Share, title, location · beds/baths/guests, rating·reviews) → `StayGallery` → 2-col `[2fr_1fr]`: left = host strip, About, Highlights, What's included (amenity icons), Room breakdown, House rules / Cancellation / Booking protection trio; right = sticky `StayBookingCard`. Below: Other units from host + Similar stays (`StayCard` grids).
- **Primary components:** gallery, host card, amenities grid, rooms, policy cards, booking card, related grids.
- **Local nav / tabs / filters:** none.
- **Actions:** Save/Share; Show all amenities; booking card → checkout; related → other slugs.
- **States:** `notFound()` if missing; SSR.
- **PWA notes:** gallery swipeable; booking card → sticky bottom bar with price + Reserve.

---

### Image 305 — `/customer/stays/long-term` — Long-term rentals (list)
- **Area / Persona:** Customer dashboard · long-let discovery.
- **Route:** `/customer/stays/long-term`
- **Chrome:** Customer top-nav.
- **Purpose:** Browse verified 6+ month lets.
- **Layout:** Hero with StayTypeTabs + H1 + count → customer action row (Save search / Compare selected / **Create rental brief**) → `LongTermRentalCard` grid (1→4 cols).
- **Primary components:** StayTypeTabs, action buttons, long-term rental cards.
- **Local nav / tabs / filters:** StayTypeTabs (Stays↔Long-term); actions.
- **Actions:** Save search; Compare; Create rental brief; card → `/customer/stays/long-term/[slug]`.
- **States:** static from `getPublicLongTermRentals`.
- **PWA notes:** action row wraps; cards 1-col.
- **Multi-stage / multi-view:** list (305) ↔ map (306).

---

### Image 306 — `/customer/stays/long-term/map` — Long-term rentals (map split)
- **Area / Persona:** Customer dashboard · long-let discovery.
- **Route:** `/customer/stays/long-term/map`
- **Chrome:** Customer top-nav.
- **Purpose:** Map browsing of long-term rentals.
- **Layout:** Top bar (StayTypeTabs + "{n} rentals on map") → split: left 384px list of `LongTermRentalCompactCard` (featured first), right `LongTermRentalMap` (client, `ssr:false`) + floating count bubble.
- **Primary components:** StayTypeTabs, compact rental cards, map, bubble.
- **Actions:** pin/card → `/customer/stays/long-term/[slug]`.
- **States:** seed fallback data.
- **PWA notes:** map full-screen + bottom card sheet.
- **Multi-stage / multi-view:** sibling of 305.

---

### Image 307 — `/customer/stays/long-term/[slug]` — Long-term rental detail
- **Area / Persona:** Customer dashboard · long-let profile.
- **Route:** `/customer/stays/long-term/[slug]`  (dynamic: slug)
- **Chrome:** Customer top-nav.
- **Purpose:** Full long-let listing with authenticated enquiry panel.
- **Layout:** StayTypeTabs sub-nav → header (Verified rental / type / furnishing chips; actions Add to shortlist / Compare / Add note / Save / Share; title; location·beds·baths·max occupants·rating) → 5-tile gallery grid → 2-col `[2fr_1fr]`: left = feature chips (Bills included/Pets/Parking/Garden/Student/Family/Professional), About, Key features, Amenities, `LongTermRentalCostBreakdown`, `LongTermRentalCompliance`, rooms, transport, nearby; right = `LongTermRentalEnquiryPanel` (`isAuthenticated`). Similar rentals grid.
- **Primary components:** gallery, chips, cost breakdown, compliance block, enquiry panel, related cards.
- **Actions:** shortlist/compare/note/save/share; enquiry submit; similar → slugs.
- **States:** `notFound()`; SSR + static params.
- **PWA notes:** gallery swipe; enquiry panel → bottom sheet.

---

### Image 308 — `/customer/lets` — Lets · Overview tab
- **Area / Persona:** Customer dashboard · rental journey hub.
- **Route:** `/customer/lets`  (default tab=overview; `?tab=` syncs URL)
- **Chrome:** Customer top-nav.
- **Purpose:** Manage the long-term rental journey from viewings → tenancy.
- **Layout:** Header (H1 "Lets" + subcopy + "Book a free consultation" help card) → underlined tab bar (Overview / Viewings / Applications / Offers / Tenancy) → **OverviewTab**: 5-step journey stepper (Searching→Tenancy active), 6 KPI tiles (upcoming viewings, active applications, open offers, active tenancies, pending documents, rent due — each links to a sub-tab/payments), trust strip, recent activity feed, recommended lets cards.
- **Primary components:** tab bar, journey stepper, KPI tiles, trust cards, activity timeline, `CustomerPropertyCard` grid.
- **Local nav / tabs / filters:** Lets tabs (each = separate image 309–312).
- **Actions:** Book consultation (toast); KPI tiles → `/customer/lets?tab=…` / `/customer/payments`.
- **States:** seeded; client tab state + `router.replace`.
- **PWA notes:** tabs horizontal scroll; stepper vertical on mobile; KPI tiles 2-col.
- **Multi-stage / multi-view:** Lets tabs — Overview (308), Viewings (309), Applications (310), Offers (311), Tenancy (312).

---

### Image 309 — `/customer/lets?tab=viewings` — Lets · Viewings tab
- **Area / Persona:** Customer dashboard · viewings.
- **Route:** `/customer/lets?tab=viewings`
- **Chrome:** Customer top-nav.
- **Purpose:** Upcoming and past property viewings.
- **Layout:** Same Lets header + tab bar (Viewings active) → **ViewingsTab**: list/cards of scheduled viewings (property, date/time, agent, status) with manage actions.
- **Primary components:** viewing cards/rows with status pills, agent chips.
- **Local nav / tabs / filters:** Lets tabs.
- **Actions:** open viewing → `/customer/lets/viewings/[id]`; reschedule/cancel.
- **States:** seeded list; empty when none.
- **PWA notes:** rows 1-col cards.
- **Multi-stage / multi-view:** sibling of 308/310/311/312.
