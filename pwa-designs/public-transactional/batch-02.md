# Public transactional · batch 02 · Images 110–119

Continues the marketplace escrow checkout (pay + result), the standalone quote
request, then the canonical stays experience (`/stay/*`) and stay detail. Same
conventions as batch-01: Public chrome, light theme, escrow/Stripe honesty,
integer-pence money.

---

### Image 110 — `/marketplace/checkout/[draftId]` — Escrow checkout · payment form
- **Area / Persona:** Public transactional · signed-in buyer. **Dynamic param:** `draftId` (listing id).
- **Route:** `/marketplace/checkout/[draftId]`
- **Chrome:** Minimal **checkout frame** (max-w-4xl, `#F7F9FC`), under Public chrome.
- **Purpose:** Take the real escrow payment — POST creates order + transaction + escrow PaymentIntent, then mounts Stripe Card Element.
- **Layout:** Back link → 3-step pill stepper (**1 Review · 2 Pay · 3 Confirmed**, step 2 active navy) → two-column `[1fr_360px]`: left "Payment details" card (escrow note, Stripe Card Element mount, Pay button), right sticky **Order summary** card (title, subtotal, includes-platform-fee line, total due now, escrow/secure/authorised bullets).
- **Primary components:** `CheckoutClient` (`form` stage), Stripe Elements card field, order summary, mobile sticky pay bar.
- **Local nav / tabs / filters:** stepper (non-interactive progress).
- **Actions:** Pay {amount} → `stripe.confirmCardPayment` (authorise + hold); Back.
- **States:** `starting` (spinner "Setting up secure checkout…") · `form` (this image) · card validation error · submit "Authorising…" · `error` stage (AlertCircle, "Back to marketplace").
- **PWA notes:** desktop Pay button hidden, replaced by a **fixed bottom pay bar** (total + "Pay securely") on mobile; summary stacks above form; `pb-24` for the bar.
- **Multi-stage / multi-view:** stage 2 of 109 → 110 → **111**.

---

### Image 111 — `/marketplace/checkout/[draftId]` — Escrow checkout · result / order created
- **Area / Persona:** Public transactional · signed-in buyer. **Dynamic param:** `draftId`.
- **Route:** `/marketplace/checkout/[draftId]`
- **Chrome:** Minimal checkout frame (centered max-w-xl card).
- **Purpose:** Honest post-payment outcome — funds **authorised & held in escrow**, or "Order created" when online payment isn't provisioned.
- **Layout:** Centered card; status circle (emerald `CheckCircle2` when held/succeeded/processing, blue `ShieldCheck` otherwise) → heading ("Payment authorised" / "Order created") → escrow explanation → order reference → **View my orders** button.
- **Primary components:** `CheckoutClient` (`result` stage), order reference chip.
- **Local nav / tabs / filters:** none.
- **Actions:** View my orders → `/app/marketplace/orders`.
- **States:** held/authorised (emerald) vs created/payment-pending (blue, honest "seller will arrange payment"); payment-not-provisioned fallback.
- **PWA notes:** single column; reference is copy-friendly/break-all; success animation candidate.
- **Multi-stage / multi-view:** final stage of 109 → 110 → 111.

---

### Image 112 — `/marketplace/book/[listingId]` — Book entry redirect
- **Area / Persona:** Public transactional · buyer following a shareable "book this" link. **Dynamic param:** `listingId`.
- **Route:** `/marketplace/book/[listingId]` → **redirects to `/marketplace/checkout/[listingId]`**
- **Chrome:** Public (destination).
- **Purpose:** Stable shareable booking entry that survives checkout internals changing; resolves into the escrow checkout draft.
- **Layout:** none of its own — server `redirect()`. Design target is Images 109–111.
- **Primary components:** n/a.
- **Actions:** transparent navigation into checkout.
- **States:** redirect only.
- **PWA notes:** instant; deep-link safe.
- **Multi-stage / multi-view:** resolves to checkout set 109–111.

---

### Image 113 — `/marketplace/request/[requestId]` — Standalone quote request
- **Area / Persona:** Public transactional · buyer requesting a supplier/emergency quote. **Dynamic param:** `requestId` (listing id).
- **Route:** `/marketplace/request/[requestId]`
- **Chrome:** Public.
- **Purpose:** Focused single-card "request a quote" page for a supplier/emergency listing (real `marketplace_enquiries` write); no payment.
- **Layout:** Centered max-w-xl card. Header band (eyebrow "Request a quote" / "Emergency request", listing title, From + `PriceTag`) → `QuoteRequestForm` body → footer reassurance strip (ShieldCheck, "No payment is taken now — you agree pricing before any work begins").
- **Primary components:** `QuoteRequestForm` (name/email/phone/message + consent), `PriceTag`.
- **Local nav / tabs / filters:** none.
- **Actions:** Request a quote / Request urgent call-out → POST enquiry.
- **States:** form idle/validating/submitting/done (green "Enquiry sent") / error; not-found ("Browse suppliers"); emergency variant urgent wording; pre-fills from session.
- **PWA notes:** single card; sticky footer reassurance; native keyboards.
- **Multi-stage / multi-view:** inline twin of Image 108's quote form.

---

### Image 114 — `/stay/search` — Stay search (list view)
- **Area / Persona:** Public transactional · stay guests (canonical browse).
- **Route:** `/stay/search`
- **Chrome:** Public.
- **Purpose:** The Airbnb-grade direct-booking stays browse over real published `booking_listings`.
- **Layout:** White hero band (H1 "Find your next stay", subcopy, 3 trust badges: Licence verified hosts / Instant booking / Genuine reviews) → max-w-1500 `StaySearchExperience`: search + toolbar row → (optional inline filter panel) → result count + search-on-move → responsive card grid (1/2/3/4).
- **Primary components:** `StaySearchExperience`, `StayListingCard` (photo carousel cards), `StayFilterSheet` (guests, price, type, cancellation, beds/baths/bedrooms, instant-only, verified-only), URL-synced filters.
- **Local nav / tabs / filters:** Filters button (count badge), Sort dropdown, **List/Map** segmented toggle.
- **Actions:** open stay → `/stay/[slug]`; filter/sort; toggle view; clear filters; heart-save on card.
- **States:** loading (8 skeletons) · results · `EmptyAll` ("No stays published yet") · `EmptyFiltered` (Clear filters).
- **PWA notes:** filters as bottom sheet ("Show N stays"); search input 48px; cards stack single column; hero compresses.
- **Multi-stage / multi-view:** list vs map = Image 114 / **115**; map-first entry = Image 116.

---

### Image 115 — `/stay/search` — Stay search (split-map view)
- **Area / Persona:** Public transactional · stay guests.
- **Route:** `/stay/search?…` (view=map, client state)
- **Chrome:** Public.
- **Purpose:** Stays as a scrollable list rail + interactive Leaflet map with hover-sync.
- **Layout:** Two-column `lg:[1fr_1.15fr]` — left scrollable row-layout card rail (`max-h-76vh`), right sticky `StayMap`. Mobile/tablet: full map with a horizontal card strip beneath.
- **Primary components:** `StayMap` (dynamic ssr:false), `StayListingCard` row + carousel layouts, "Search as I move the map" checkbox.
- **Local nav / tabs / filters:** same toolbar; view = Map.
- **Actions:** hover card ↔ pin highlight; pan/zoom (optional re-query to bounds); open stay.
- **States:** map skeleton; same empty/loading as list.
- **PWA notes:** map dominant on mobile, cards as horizontal scroller; search-on-move lg only.
- **Multi-stage / multi-view:** sibling of 114; same experience as 116.

---

### Image 116 — `/stay/map` — Stays map-first entry
- **Area / Persona:** Public transactional · stay guests entering via map.
- **Route:** `/stay/map`
- **Chrome:** Public.
- **Purpose:** Map-led browse — same `StaySearchExperience` initialised to the map view.
- **Layout:** Compact hero (blue "Map search" pill, H1 "Stays on the map", subcopy) → `StaySearchExperience initialView="map"` (= the split-map layout of Image 115).
- **Primary components:** as Image 115.
- **Local nav / tabs / filters:** toolbar with List/Map (defaults Map).
- **Actions:** as Image 115; switch to list.
- **States:** "Loading map…" fallback; empty/loading as search.
- **PWA notes:** as Image 115.
- **Multi-stage / multi-view:** same engine as 114/115.

---

### Image 117 — `/stay/compare` — Compare stays
- **Area / Persona:** Public transactional · stay guests comparing saved stays.
- **Route:** `/stay/compare`
- **Chrome:** Public.
- **Purpose:** Side-by-side comparison of the visitor's actually-saved stays (wishlist), with a suggested fallback when empty.
- **Layout:** Page header (blue "Compare" pill, H1, subcopy) → `CompareClient` side-by-side table: column per stay (up to 4), rows = From/night, Type, Rating, Sleeps, Bedrooms, Bathrooms, Cancellation, Location; remove (X) per column.
- **Primary components:** `CompareClient`, `useWishlist` (localStorage anon / `customer_saved_listings` signed-in), comparison table.
- **Local nav / tabs / filters:** none.
- **Actions:** remove stay from comparison; heart to add elsewhere; Browse stays.
- **States:** empty (no pool → "No stays to compare yet", Browse); fallback banner ("you haven't saved any — here are a few"); saved set view.
- **PWA notes:** table → horizontal scroll on mobile; sticky first (label) column candidate.
- **Multi-stage / multi-view:** feeds from saved/wishlist (Image 118) and stay cards.

---

### Image 118 — `/stay/wishlist` — Saved stays (anon entry)
- **Area / Persona:** Public transactional · anonymous visitor (saved stays are a customer-account feature).
- **Route:** `/stay/wishlist`
- **Chrome:** Public.
- **Purpose:** Honestly route anon visitors to the account saved area; surface a few stays to explore (no fake "saved" data).
- **Layout:** Top promo card (rose "Saved stays" pill, H1 "Keep your favourites", explainer, **Go to saved** + **Browse stays** buttons) → "Stays to explore" 2-col grid of `StayListingCard` (up to 6).
- **Primary components:** promo card, `StayListingCard` grid.
- **Local nav / tabs / filters:** none.
- **Actions:** Go to saved → `/customer/saved`; Browse stays → `/stay/search`; open a stay.
- **States:** explore grid hidden if no listings.
- **PWA notes:** card buttons stack; grid single column.
- **Multi-stage / multi-view:** related to Compare (117).

---

### Image 119 — `/stay/[slug]` — Stay listing detail
- **Area / Persona:** Public transactional · stay guest. **Dynamic param:** `slug`.
- **Route:** `/stay/[slug]`
- **Chrome:** Public.
- **Purpose:** Deep direct-booking stay page (gallery, host, amenities, reviews, sticky booking card).
- **Layout:** Title row (title, rating·reviews, Licence-verified, place, **Share** + **Save**) → `ListingGallery` → 7+5 two-column. Left: property type + fact bar (guests/beds/baths) + host avatar; Highlights (managed-by / self check-in / Wi-Fi / instant confirmation); Description; Sleeping arrangements (per-bedroom cards); type-aware `AccommodationDetails` (long-let/HMO/student); amenities preview + "show all" modal; check-in/out cards; house rules; cancellation policy; location map; `StayReviews`; About-your-host; Things-to-know grid; compliance note. Right (sticky): booking card (`StayBookingCard` for short-stays or `EnquiryCard` for lets) + "You won't be charged yet" + Report-listing card. Below: guest sign-up nudge + `SimilarStays`.
- **Primary components:** `ListingGallery`, `StayBookingCard` / `EnquiryCard`, `AmenitiesModal`, `StayReviews`, `StayLocationMap`, `SimilarStays`, `MobileBookingBar`.
- **Local nav / tabs / filters:** none (long scroll); amenities "show all" modal.
- **Actions:** Share/Save; open amenities modal; choose dates & reserve (booking card); apply/enquire (lets); Sign up free → register; open similar stay.
- **States:** not-found (`notFound()`); empty description fallback; no-photos gallery; instant vs request-to-book badges; compliance-passed vs not copy.
- **PWA notes:** `MobileBookingBar` sticky (from-price + rating, jumps to booking card); `pb-28` for it; gallery swipeable; sticky desktop card.
- **Multi-stage / multi-view:** booking card stepper = Images 120–122; enquiry variant = Image 123; checkout continues 125–128.

---

**Next:** batch-03 — booking-card stepper (dates/details/review), enquiry, checkout bridge, pay/confirmation, guest portal gate. Images 120–129.
