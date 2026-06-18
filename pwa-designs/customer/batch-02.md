# Customer dashboard · batch 02 · Images 310–319

All pages use **Chrome: Customer top-nav** (see batch 01 header). Light theme only.

---

### Image 310 — `/customer/lets?tab=applications` — Lets · Applications tab
- **Area / Persona:** Customer dashboard · rental applications.
- **Route:** `/customer/lets?tab=applications`
- **Chrome:** Customer top-nav.
- **Purpose:** Track in-flight tenancy applications.
- **Layout:** Lets header + tab bar (Applications active) → **ApplicationsTab**: application cards/rows (property, status, progress, required documents) with continue/view actions.
- **Primary components:** application cards with progress + status pills.
- **Local nav / tabs / filters:** Lets tabs.
- **Actions:** Continue → `/customer/lets/applications/[id]/wizard`.
- **States:** seeded; empty state.
- **PWA notes:** cards 1-col; progress bar prominent.
- **Multi-stage / multi-view:** sibling of 308/309/311/312.

---

### Image 311 — `/customer/lets?tab=offers` — Lets · Offers tab
- **Area / Persona:** Customer dashboard · offers.
- **Route:** `/customer/lets?tab=offers`
- **Chrome:** Customer top-nav.
- **Purpose:** Track rent offers and negotiation status.
- **Layout:** Lets header + tab bar (Offers active) → **OffersTab**: offer cards (property, offered vs asking rent, status Open/Counter/Accepted/Expired).
- **Primary components:** offer cards with status pills, amounts.
- **Local nav / tabs / filters:** Lets tabs.
- **Actions:** open → `/customer/lets/offers/[id]`.
- **States:** seeded; empty state.
- **PWA notes:** cards 1-col.
- **Multi-stage / multi-view:** sibling of 308/309/310/312.

---

### Image 312 — `/customer/lets?tab=tenancy` — Lets · Tenancy tab
- **Area / Persona:** Customer dashboard · active tenancy.
- **Route:** `/customer/lets?tab=tenancy`
- **Chrome:** Customer top-nav.
- **Purpose:** Entry to active/past tenancies.
- **Layout:** Lets header + tab bar (Tenancy active) → **TenancyTab**: tenancy cards (property, status, rent, next payment) linking into the tenancy profile.
- **Primary components:** tenancy cards with status + rent summary.
- **Local nav / tabs / filters:** Lets tabs.
- **Actions:** open → `/customer/lets/tenancies/[id]`.
- **States:** seeded; empty state.
- **PWA notes:** cards 1-col.
- **Multi-stage / multi-view:** sibling of 308–311.

---

### Image 313 — `/customer/lets/search` — Lets search
- **Area / Persona:** Customer dashboard · long-let search.
- **Route:** `/customer/lets/search`
- **Chrome:** Customer top-nav.
- **Purpose:** Faceted search for long-term lets with saved-journey KPIs.
- **Layout:** Header ("Let's find your next home") → search bar card (Location / Move-in date / Budget / Bedrooms / Furnishing segments + Search lets button + quick chips Pet friendly/Bills included/Parking/Garden + More filters) → 5 KPI tiles (saved lets, upcoming viewings, active applications, offers in progress, active tenancies) → results header (count + Sort + cards/list/map view toggle) → `CustomerPropertyCard` grid; map view adds a right map pane.
- **Primary components:** segmented search bar, filter chips, KPI tiles, view toggle, property cards, map placeholder.
- **Local nav / tabs / filters:** view toggle (cards/list/map); facet segments; chips.
- **Actions:** Search (toast); card → `/customer/lets/properties/[id]`; save toggle.
- **States:** seeded 120-result count; toasts for unbuilt facets.
- **PWA notes:** search segments stack; view toggle compact; map full-screen.

---

### Image 314 — `/customer/lets/properties/[id]` — Let property detail
- **Area / Persona:** Customer dashboard · let listing profile.
- **Route:** `/customer/lets/properties/[id]`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Full long-let listing with apply/offer/viewing actions.
- **Layout:** Back to search → 5-tile gallery → 2-col `[1fr_340px]`: left = title/location + Verified landlord chip, spec row (beds/baths/area/furnishing/availability), About, Property details grid, Amenities grid, Transport + Schools cards, Documents; right sticky rail = price card (rent/month, availability, **Book a viewing / Start application / Make an offer / Save**), deposit breakdown, "Your journey to a new home" checklist, tenant review snippet.
- **Primary components:** gallery, spec chips, detail grids, transport/school minis, document list, price/action rail, journey checklist.
- **Actions:** Book viewing → `/customer/lets/viewings/VW-2042`; Start application → `…/applications/AP-7841/wizard`; Make an offer → `…/offers/OFF-…`; Save (toast); document download (toast).
- **States:** seeded (`findLet` fallback).
- **PWA notes:** gallery swipe; action rail → sticky bottom bar.

---

### Image 315 — `/customer/lets/viewings/[id]` — Viewing detail
- **Area / Persona:** Customer dashboard · viewing.
- **Route:** `/customer/lets/viewings/[id]`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Manage a single property viewing.
- **Layout:** Back to viewings → 2-col `[1fr_340px]`: left = hero image card (Long-term let + status pills, property, date/time, Add to calendar), navy **live countdown** banner, Host/agent card (Message/Call/Email), Viewing details card, Meeting & access instructions (map placeholder + directions), Documents (brochure/EPC/floorplan); right sticky = Manage viewing (Confirm attendance / Reschedule / Cancel + reminders toggle), cancellation-policy amber card.
- **Primary components:** hero card, countdown timer (`useEffect`), contact mini-buttons, map placeholder, document list, manage-actions card.
- **Actions:** Confirm/Reschedule/Cancel (toasts); contact agent; get directions; toggle reminders.
- **States:** seeded (`findViewing`); live ticking countdown.
- **PWA notes:** countdown prominent; actions sticky bottom; map tappable.

---

### Image 316 — `/customer/lets/offers/[id]` — Offer detail
- **Area / Persona:** Customer dashboard · rent offer.
- **Route:** `/customer/lets/offers/[id]`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Review and act on a rent offer / counter-offer.
- **Layout:** Back to offers → header (Offer #id + status pill) → 6-step progress tracker (Offer submitted→Tenancy) → 2-col `[1fr_320px]`: left = Offer summary (offered vs asking rent, move-in, term, furnishing, holding deposit + notes), Offer history & negotiation timeline, Property & agent card; right sticky = Actions (Accept/Amend/Withdraw/Pay holding deposit/Download terms), Payment breakdown, "What happens next" checklist, Tenant-Fees-Act protection note.
- **Primary components:** status tracker, summary grid, negotiation timeline, action rail, payment breakdown.
- **Actions:** Accept offer/counter; Amend; Withdraw; Pay holding deposit; message agent — toasts.
- **States:** seeded; stage derived from status.
- **PWA notes:** tracker horizontal scroll; action rail bottom sheet.

---

### Image 317 — `/customer/lets/tenancies/[id]` — Tenancy profile
- **Area / Persona:** Customer dashboard · active tenancy.
- **Route:** `/customer/lets/tenancies/[id]`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Tenancy command centre with sub-page links.
- **Layout:** Back to tenancies → hero card (property tenancy + status pill, 5 hero stats: move-in, rent, next payment, address, status) → internal tab bar (Setup / Documents / Rent & Deposits / Maintenance / Inspections / Move-in / Renewal-Notice / Guarantor) → 2-col `[1fr_320px]`: left content per tab (Setup shows onboarding progress + landlord/occupants/agreement/deposit cards; Documents/Rent/Maintenance/Move-in render LinkPanels to dedicated routes; Inspections/Renewal/Guarantor render inline tables); right rail = Quick actions, Tenancy summary, Support card.
- **Primary components:** hero stat row, internal tabs, progress bar, link panels, inline tables, quick-action rail.
- **Local nav / tabs / filters:** internal tab bar (in-page); link panels jump to images 318–322.
- **Actions:** Continue setup → `…/setup`; tab link panels → documents/rent-payments/maintenance/move-in; quick actions.
- **States:** seeded (`findTenancy`).
- **PWA notes:** internal tabs scroll; hero stats 2-col; link panels full-width buttons.

---

### Image 318 — `/customer/lets/tenancies/[id]/setup` — Tenancy setup
- **Area / Persona:** Customer dashboard · tenancy onboarding.
- **Route:** `/customer/lets/tenancies/[id]/setup`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Complete the steps that secure the tenancy.
- **Layout:** Back to tenancy → header (title + % complete) → `TenancySubNav` → 5-step stepper (Agreement→Move-in Ready, done/current/todo) → 2-col `[1fr_320px]`: left = 5 SetupCards (Agreement signed, Deposit paid, First Rent due → Pay, ID Checks → upload, Move-in Ready locked); right sticky = Tenancy summary (total due before move-in), Contacts (message), Need help.
- **Primary components:** progress stepper, setup-step cards with status pills + CTAs, summary rail.
- **Actions:** Pay first rent → `…/rent-payments`; View requirements → `…/move-in`; upload ID / view agreement (toasts).
- **States:** seeded; step states hard-coded (3/5 demo).
- **PWA notes:** stepper horizontal scroll; cards full-width; sticky rail collapses.

---

### Image 319 — `/customer/lets/tenancies/[id]/documents` — Tenancy documents
- **Area / Persona:** Customer dashboard · tenancy docs.
- **Route:** `/customer/lets/tenancies/[id]/documents`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Library of tenancy documents with preview.
- **Layout:** Back to tenancy → header (+ Upload document) → `TenancySubNav` → 4 KPI tiles (total docs / awaiting signature / recently added / expiring soon) → 2-col `[1fr_340px]`: left = filter/search + documents table (Document·Category·Date·Status·download, row-select, pagination "7 of 38"); right sticky = preview panel (thumbnail, metadata, Download / Share / Sign).
- **Primary components:** KPI tiles, document table with PDF chips + status pills, preview/sign rail, pagination.
- **Local nav / tabs / filters:** TenancySubNav; category filter; search; pagination.
- **Actions:** Upload (toast); row select; Download/Share/Sign (toasts).
- **States:** seeded 7-row demo; selected doc state.
- **PWA notes:** table → stacked cards; preview → bottom sheet on tap.
