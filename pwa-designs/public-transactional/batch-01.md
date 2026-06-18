# Public transactional · batch 01 · Images 100–109

Area: **Public transactional** (marketplace + booking public flows). Persona:
anonymous buyers/guests (some flows gate to a signed-in operator/customer).
All pages render under **Chrome: Public** (`PublicNav` + `PublicFooter`) unless an
image notes its own minimal checkout frame. Light theme only; brand blue
`#2563EB` / `#1D4ED8`, navy `#0B1B3F`, surfaces white on `#F7F9FC`. Money is
integer pence; escrow + Stripe messaging is honest throughout (never asserts a
captured charge).

The marketplace discovery hub is one client island (`PublicSearchClient`) reused
across intents (`/marketplace`, `/marketplace/emergency`, `/marketplace/services`,
`/marketplace/suppliers`) with the same toolbar; its **grid** and **split-map**
views are separate images. The three listing-detail routes share one component
(`PublicListingDetail`) but split by CTA: stays/services = escrow *checkout*,
suppliers/emergency = inline *quote* form.

---

### Image 100 — `/marketplace` — Marketplace discover hub (grid view)
- **Area / Persona:** Public transactional · anonymous buyers (all intents).
- **Route:** `/marketplace`
- **Chrome:** Public.
- **Purpose:** Single entry to browse everything — stays, suppliers, emergency call-outs, service packages — server-rendered first page (24 published listings) then interactive search.
- **Layout:** Max-w 1500 container. Heading + subheading block → intent tab row → search/toolbar row → quick-toggle chip row → (optional inline filter panel) → responsive card grid (1/2/3/4 cols) → pagination.
- **Primary components:** `PublicSearchClient` (`StayCard` / `SupplierCard` / `EmergencyCard` per listing's transaction type), debounced FTS search input, `FilterPanel` (country select, location, price min/max, min-rating), `MarketplaceEmptyState`.
- **Local nav / tabs / filters:** Intent pill tabs (All · Stays · Suppliers · Emergency · Services; active = navy `#0B1B3F`). Filters button (active count badge), Sort dropdown (Recommended + options), **Grid/Map** segmented view toggle. Quick chips: Instant book / Verified / Available now / Top rated (intent-aware visibility).
- **Actions:** Open listing card → detail; toggle filters/sort/view; paginate Prev/Next; clear filters.
- **States:** loading (8 skeleton cards) · results · empty-browse · empty-no-results (Clear filters) · errored (Retry, on 5xx). Result count "Searching…/N results".
- **PWA notes:** intent tabs horizontally scroll (scrollbar-hide); filters open as a **bottom sheet** on mobile with "Show N results" CTA; sticky toolbar candidate; lazy map import.
- **Multi-stage / multi-view:** grid vs map = Image 100 / **Image 101**.

---

### Image 101 — `/marketplace` — Marketplace discover hub (split-map view)
- **Area / Persona:** Public transactional · anonymous buyers.
- **Route:** `/marketplace?…` (view=split, client state)
- **Chrome:** Public.
- **Purpose:** Same discovery set viewed as cards + a live Leaflet map with hover-sync.
- **Layout:** Two-column on `lg` — left card column (1–2 col), right sticky map (`MarketplaceMap`, `~calc(100vh-120px)`). On mobile the map sits on top (60vh) with cards below.
- **Primary components:** `MarketplaceMap` (dynamic, ssr:false, spinner fallback), listing cards with mouse-enter→`activeId` map highlight, "Search as I move the map" checkbox (lg only).
- **Local nav / tabs / filters:** identical toolbar to Image 100; view toggle set to **Map**.
- **Actions:** hover card ↔ highlight pin; pan/zoom map (optionally re-filter visible set to bounds); open listing.
- **States:** map loading spinner; same empty/error/loading as grid.
- **PWA notes:** map full-width above the horizontal card strip on small screens; "search as I move" hidden below lg.
- **Multi-stage / multi-view:** sibling of Image 100 (grid).

---

### Image 102 — `/marketplace/emergency` — Emergency call-outs
- **Area / Persona:** Public transactional · buyers needing urgent trades.
- **Route:** `/marketplace/emergency`
- **Chrome:** Public.
- **Purpose:** Locked-intent marketplace view for urgent call-outs (leaks, lockouts, heating, electrical).
- **Layout:** Same `PublicSearchClient` shell as Image 100 but `lockIntent` (tabs read-only), heading "Emergency call-outs", red-leaning `EmergencyCard` items.
- **Primary components:** `EmergencyCard` grid, search ("Search emergency call-outs…"), filters (service area / price / rating), "Available now" quick chip.
- **Local nav / tabs / filters:** intent tabs shown but non-navigating (locked); Sort + Grid/Map + filters as Image 100.
- **Actions:** open call-out detail → quote/request form.
- **States:** loading skeletons · results · empty · error.
- **PWA notes:** emphasise "Available now" urgency; one-tap to request; sticky search.
- **Multi-stage / multi-view:** grid/map toggle as per the hub.

---

### Image 103 — `/marketplace/services` — Service packages
- **Area / Persona:** Public transactional · buyers booking professional packages.
- **Route:** `/marketplace/services`
- **Chrome:** Public.
- **Purpose:** Locked-intent view of inventory reports, compliance services and professional packages ("book and pay securely").
- **Layout:** `PublicSearchClient` shell, heading "Service packages", subheading on secure booking; card grid.
- **Primary components:** service listing cards (checkout-intent), search, filters, sort, view toggle.
- **Local nav / tabs / filters:** locked intent tabs; filters/sort/view as hub.
- **Actions:** open service detail → escrow checkout (Reserve).
- **States:** loading · results · empty · error.
- **PWA notes:** as hub; purple service accent on detail.
- **Multi-stage / multi-view:** grid/map toggle.

---

### Image 104 — `/marketplace/suppliers` — Suppliers & trades (with join banner)
- **Area / Persona:** Public transactional · buyers + supplier-recruitment cross-sell.
- **Route:** `/marketplace/suppliers`
- **Chrome:** Public.
- **Purpose:** Browse vetted cleaning/gas/electrical/maintenance suppliers; request a quote.
- **Layout:** Amber **"Join as a supplier"** banner strip across the top (CTA → `/register?intent=supplier`) → `PublicSearchClient` shell, heading "Suppliers & trades", `SupplierCard` grid.
- **Primary components:** amber join banner; `SupplierCard` grid; search ("Request a quote in seconds"); filters (service area / price / rating); Verified / Top-rated chips.
- **Local nav / tabs / filters:** locked intent tabs; filters/sort/view toggle.
- **Actions:** Join as a supplier → register; open supplier detail → inline quote form.
- **States:** loading · results · empty · error.
- **PWA notes:** banner stacks (CTA full-width) on mobile; quote CTA prominent.
- **Multi-stage / multi-view:** grid/map toggle.

---

### Image 105 — `/marketplace/stays` — Stays redirect (canonical funnel)
- **Area / Persona:** Public transactional · stays browsers.
- **Route:** `/marketplace/stays` → **redirects to `/stay/search`**
- **Chrome:** Public (rendered by the destination).
- **Purpose:** Marketplace stays nav entry funnels to the deeper canonical stays experience (`/stay/search`) — single source of truth, no duplicate UI.
- **Layout:** none of its own — server `redirect()`. Design target is Image 114 (`/stay/search` list).
- **Primary components:** n/a (redirect).
- **Actions:** transparent navigation.
- **States:** redirect only.
- **PWA notes:** instant client navigation; no flash.
- **Multi-stage / multi-view:** resolves to Image 114 / 115 (stay search).

---

### Image 106 — `/marketplace/stays/[slug]` — Stay listing detail (escrow checkout intent)
- **Area / Persona:** Public transactional · stay buyer. **Dynamic param:** `slug`.
- **Route:** `/marketplace/stays/[slug]`
- **Chrome:** Public.
- **Purpose:** Marketplace stay detail with a real **Reserve** CTA into the escrow checkout draft.
- **Layout:** Back link → 3-col grid (`lg:col-span-2` left / sticky right aside). Left: image gallery (16:10 hero + thumbnail strip, Instant-book badge), title block (intent + Verified pills, rating/reviews, location), stay facts card (beds/baths/floor area), About card, "Booking protection" card (escrow / Stripe / 2.5% fee). Right: price card with `PriceTag`, informational price breakdown (listing + 2.5% fee + estimated total), **Reserve this stay** CTA, sign-in hint, trust badges card.
- **Primary components:** `PublicListingDetail`, `ListingGallery` (inline), `PriceTag`, `PriceBreakdown`, `TrustBadge`.
- **Local nav / tabs / filters:** none (scroll detail).
- **Actions:** Reserve this stay → `/marketplace/checkout/[id]`; gallery thumbnail select; Back to stays.
- **States:** gallery empty → gradient placeholder ("No photos provided"); not-found page (SearchX, "Browse stays"); signed-in vs anon CTA hint copy.
- **PWA notes:** gallery swipeable; sticky price card → mobile bottom Reserve bar candidate; single column stack.
- **Multi-stage / multi-view:** shares component with Images 107/108; checkout continues at 109–111.

---

### Image 107 — `/marketplace/services/[slug]` — Service listing detail (escrow checkout intent)
- **Area / Persona:** Public transactional · service buyer. **Dynamic param:** `slug`.
- **Route:** `/marketplace/services/[slug]`
- **Chrome:** Public.
- **Purpose:** Service package detail with a **Book this service** escrow CTA.
- **Layout:** Same `PublicListingDetail` 2+1 layout as Image 106; purple service accent; About + protection cards; right price card + breakdown + Book CTA.
- **Primary components:** `PublicListingDetail`, gallery, `PriceTag`, `PriceBreakdown`, trust badges.
- **Local nav / tabs / filters:** none.
- **Actions:** Book this service → `/marketplace/checkout/[id]`; gallery select; Back to services.
- **States:** empty gallery gradient; not-found ("Browse services"); auth hint copy.
- **PWA notes:** as Image 106.
- **Multi-stage / multi-view:** checkout continues at 109–111.

---

### Image 108 — `/marketplace/suppliers/[slug]` — Supplier listing detail (inline quote intent)
- **Area / Persona:** Public transactional · buyer requesting a quote. **Dynamic param:** `slug`.
- **Route:** `/marketplace/suppliers/[slug]`
- **Chrome:** Public.
- **Purpose:** Vetted supplier detail whose primary CTA is an **inline quote-request form** (writes a real `marketplace_enquiries` row) — no checkout.
- **Layout:** Same `PublicListingDetail` left column (gallery / title / about / protection). Right aside price card swaps the Reserve button for a header ("Request a quote from this supplier") + embedded `QuoteRequestForm`.
- **Primary components:** `PublicListingDetail`, `QuoteRequestForm` (name/email/phone/message + GDPR consent), `PriceTag`, trust badges. Emergency variant words CTA urgently.
- **Local nav / tabs / filters:** none.
- **Actions:** Submit quote → POST `/api/marketplace/enquiries`; gallery select; Back to suppliers.
- **States:** form idle/validating/submitting/done (green "Enquiry sent") / error; pre-fills name+email when signed in; not-found ("Browse suppliers").
- **PWA notes:** form inputs native keyboard types; submit ≥44px; success replaces form in place.
- **Multi-stage / multi-view:** standalone focused version at Image 113 (`/marketplace/request/[id]`).

---

### Image 109 — `/marketplace/checkout/[draftId]` — Escrow checkout · auth gate
- **Area / Persona:** Public transactional · buyer (must be signed-in operator with a buyer workspace). **Dynamic param:** `draftId` (= listing id).
- **Route:** `/marketplace/checkout/[draftId]`
- **Chrome:** Minimal **checkout frame** (centered card on `#F7F9FC`, no app sidebar) — the `CheckoutClient` `need_auth` stage; outer Public chrome.
- **Purpose:** Gate anonymous buyers before payment — sign in and return here.
- **Layout:** Centered max-w-xl card. Blue circle `LogIn` icon → "Sign in to complete your booking" → listing title + amount line → **Sign in to continue** button.
- **Primary components:** `CheckoutClient` (`need_auth` stage), `formatPence` amount.
- **Local nav / tabs / filters:** none.
- **Actions:** Sign in to continue → `/login?redirectTo=/marketplace/checkout/[id]`.
- **States:** this image **is** the gate state (shown when not signed-in / no buyer workspace).
- **PWA notes:** single card; large tap target; preserves return path.
- **Multi-stage / multi-view:** stage 1 of checkout set 109 → **110** (pay) → **111** (result). Reached via Image 112 (`/book` redirect) and Reserve CTAs.

---

**Next:** batch-02 — escrow payment + result, marketplace request, stay search/compare/wishlist, stay detail. Images 110–119.
