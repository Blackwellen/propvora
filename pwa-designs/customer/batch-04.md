# Customer dashboard · batch 04 · Images 330–339

All pages use **Chrome: Customer top-nav** (see batch 01 header). Light theme only.

---

### Image 330 — `/customer/bookings?view=cards` — Bookings · Cards view
- **Area / Persona:** Customer dashboard · bookings.
- **Route:** `/customer/bookings?view=cards`
- **Chrome:** Customer top-nav.
- **Purpose:** Visual card browse of bookings.
- **Layout:** Same Bookings header/KPIs/tabs/toolbar → left = **CardsView** 2-col grid (image with status pill, property, location, dates/guests, total paid, View booking link); right = Booking summary rail.
- **Primary components:** booking cards, summary rail.
- **Local nav / tabs / filters:** view switch (Cards active); type tabs; filters.
- **Actions:** View booking → `/customer/bookings/[id]`.
- **States:** seeded; filtered by All/Stays/Lets tab.
- **PWA notes:** cards 1-col; summary rail collapses below.
- **Multi-stage / multi-view:** sibling of 329/331/332.

---

### Image 331 — `/customer/bookings?view=table` — Bookings · Table view
- **Area / Persona:** Customer dashboard · bookings.
- **Route:** `/customer/bookings?view=table`
- **Chrome:** Customer top-nav.
- **Purpose:** Dense table with bulk actions and row detail.
- **Layout:** Same header/KPIs/tabs/toolbar → **bulk bar** (n selected · Message / Download / Cancel / More) → 2-col `[1fr_360px]`: left = **TableView** (checkbox, Booking ID, Property, Type, Dates, Guests, Status, Payment, Host) + pagination; right = **BookingDetailPanel** for selected row (image, dates, price breakdown, payment status, host, View detail / Message / Receipt / Open dispute).
- **Primary components:** selectable table with status/payment pills, bulk action bar, detail panel rail.
- **Local nav / tabs / filters:** view switch (Table active); row checkboxes; filters.
- **Actions:** bulk Message/Download/Cancel; row select; detail-panel actions → booking/dispute.
- **States:** checked-row state; selected booking.
- **PWA notes:** table horizontal scroll or stacked rows; detail → bottom sheet.
- **Multi-stage / multi-view:** sibling of 329/330/332.

---

### Image 332 — `/customer/bookings?view=map` — Bookings · Map view
- **Area / Persona:** Customer dashboard · bookings.
- **Route:** `/customer/bookings?view=map`
- **Chrome:** Customer top-nav.
- **Purpose:** Geographic view of bookings.
- **Layout:** Same header/KPIs/tabs/toolbar → 2-col `[1fr_360px]`: left = **MapView** `[300px_1fr]` (left scroll list of booking thumbnails + static map placeholder with price markers and a Confirmed/Upcoming/Let legend); right = BookingDetailPanel for selected.
- **Primary components:** booking list, static map with price pins, detail panel.
- **Local nav / tabs / filters:** view switch (Map active); filters.
- **Actions:** select pin/row → detail panel; panel actions.
- **States:** static map (`TODO(maps)` live swap); selected state.
- **PWA notes:** map full-width + bottom card sheet.
- **Multi-stage / multi-view:** sibling of 329/330/331.

---

### Image 333 — `/customer/bookings/[id]` — Booking detail
- **Area / Persona:** Customer dashboard · booking profile.
- **Route:** `/customer/bookings/[id]`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Full trip detail with itinerary, host, payments, documents.
- **Layout:** Back to bookings → header (property + Confirmed pill, booking ID copy, booked-on) → internal tab bar (Overview / Itinerary / Messages(2) / Payments / Documents / Dispute) → 2-col `[1fr_320px]`: left = gallery + dates card, Property & host cards, Guest/Check-in/House-rules trio, Amenities/Documents/Receipt trio, Guest-protection band; right sticky rail = action stack (Message host, Check-in details, Download receipt, View/edit, Cancel, Open dispute), Booking activity timeline, Need-help links.
- **Primary components:** photo grid, date card, host/property cards, amenities grid, receipt summary, action rail, activity timeline.
- **Local nav / tabs / filters:** internal tabs (in-page); copy booking ID.
- **Actions:** Message host; Add to calendar; Download receipt; Open dispute → `…/dispute`; documents → tenancy docs.
- **States:** seeded (`findBooking`); client tab state.
- **PWA notes:** tabs scroll; gallery swipe; action rail → sticky bottom bar.

---

### Image 334 — `/customer/bookings/completed` — Booking complete (success)
- **Area / Persona:** Customer dashboard · post-stay.
- **Route:** `/customer/bookings/completed`
- **Chrome:** Customer top-nav.
- **Purpose:** Completion confirmation + review/rebook prompts.
- **Layout:** 2-col `[1fr_320px]`: left = success hero (green check, "Booking complete!"), booking hero card (image, ref copy, dates/guests/total, status strip: stay completed / deposit released / paid in full, receipt/invoice/calendar buttons), "What happens next" trio, "Share your experience" trio (Leave a review / Rebook / Report an issue), Trip summary; right = Recommended-for-you list, "Your safety" card, Your host card, referral promo.
- **Primary components:** success hero, booking summary card, next-step cards, share cards, recommendation rail.
- **Actions:** View receipt/invoice; Leave review → `/customer/reviews`; Rebook (toast); Report → `…/dispute`; invite friends.
- **States:** static success demo.
- **PWA notes:** single column; CTAs full-width.

---

### Image 335 — `/customer/bookings/disputes` — Disputes list
- **Area / Persona:** Customer dashboard · disputes hub.
- **Route:** `/customer/bookings/disputes`
- **Chrome:** Customer top-nav.
- **Purpose:** Manage all open/past booking disputes.
- **Layout:** H1 + Bookings tab bar (Disputes active) → 5 KPI tiles (open / awaiting response / evidence submitted / refund in progress / resolved) → toolbar (search + Status/Type/Date drops + More filters) → 2-col `[1fr_400px]`: left = Open disputes + Past disputes sections (dispute rows: image, property, ref, dates, status, claimed amount); right = sticky **DisputePanel** (reason, claimed/refund/raised/stage minis, 4 quick actions Add evidence/Message/Escalate/Withdraw, timeline, messages, evidence grid).
- **Primary components:** KPI tiles, dispute rows, detail panel with timeline + evidence.
- **Local nav / tabs / filters:** Bookings tabs; status/type/date filters; row select.
- **Actions:** select dispute; Add evidence/Message/Escalate/Withdraw (toasts); View booking; open stages → `…/[id]/dispute`.
- **States:** seeded open/past split; selected state.
- **PWA notes:** rows → cards; panel → bottom sheet.

---

### Image 336 — `/customer/bookings/[id]/dispute` — Dispute case (stages)
- **Area / Persona:** Customer dashboard · dispute case.
- **Route:** `/customer/bookings/[id]/dispute`  (dynamic: id)
- **Chrome:** Customer top-nav.
- **Purpose:** Track a single dispute through its resolution stages.
- **Layout:** Breadcrumb (Bookings › Booking details › Dispute) → header (Dispute DP-id + In progress pill, booking meta; View booking / Download case summary / Message support) → 6-stage tracker (Dispute opened→Refund/closure with dates) → host-response info banner → 3-col `[300px_1fr_300px]`: left = Case summary + Need help; centre = Evidence submitted grid (+ upload) + Message thread; right = Refund-requested card (breakdown + Update amount) + Case timeline → amber bottom "We're here to help" bar (Upload more evidence / Wait for host).
- **Primary components:** stage tracker, case summary, evidence grid, message thread, refund card, timeline.
- **Local nav / tabs / filters:** none (single case).
- **Actions:** Download case summary; Message support; Upload evidence; Update refund — toasts.
- **States:** seeded (`findDispute`); stageIndex drives tracker.
- **PWA notes:** 3-col → stacked; tracker horizontal scroll; evidence camera upload.

---

### Image 337 — `/customer/bookings/[id]/modify` — Request a change wizard (live)
- **Area / Persona:** Customer dashboard · booking change request.
- **Route:** `/customer/bookings/[id]/modify`  (dynamic: id)
- **Chrome:** Customer top-nav (rendered inside `CustomerWizardShell` with close → `/user/bookings/[id]`).
- **Purpose:** Send a host a dates/guests/cancellation/other change request (live action).
- **Layout:** `CustomerWizardShell` (title "Request a change" + booking subtitle, 3-step rail Type / Details / Review, Prev/Next/Send buttons) → step body. **Step 1 Type:** 2×2 type grid (Change dates / Change guest count / Request cancellation / Something else). **Step 2 Details:** conditional date or guest inputs + required note textarea. **Step 3 Review:** summary `<dl>` + "host confirms first" note. **Success:** green check "Request sent".
- **Primary components:** wizard shell + stepper, choice cards, form inputs, review list, success state.
- **Local nav / tabs / filters:** 3-step wizard (Type→Details→Review→success).
- **Actions:** select type; Send request → `submitChangeRequestAction` (live), then redirect to booking.
- **States:** validation gates Next; submitting; error; done success.
- **PWA notes:** single-column modal; native date/number keyboards; sticky footer buttons.
- **Multi-stage / multi-view:** 3 steps + success captured in this one image.

---

### Image 338 — `/customer/bookings/[id]/report-issue` — Report an issue wizard (live)
- **Area / Persona:** Customer dashboard · booking issue report.
- **Route:** `/customer/bookings/[id]/report-issue`  (dynamic: id)
- **Chrome:** Customer top-nav (inside `CustomerWizardShell`, close → `/user/bookings/[id]`).
- **Purpose:** Report a maintenance/wifi/cleanliness/safety/access issue with photos (live POST + Supabase upload).
- **Layout:** `CustomerWizardShell` (4-step rail Type / Details / Urgency / Review). **Step 1:** category grid (Maintenance / Wi-Fi / Cleanliness / Safety / Access / Other). **Step 2:** Title + Description + camera photo capture (up to 4 thumbnails). **Step 3:** severity list (Low/Normal/High/Urgent radio cards). **Step 4 Review:** summary + photo thumbnails. **Success:** "Issue reported".
- **Primary components:** wizard shell, category cards, text inputs, camera uploader, severity radios, review, success.
- **Local nav / tabs / filters:** 4-step wizard.
- **Actions:** uploads photos to `customer-maintenance` bucket; submit → `/api/customer/issues`; redirect.
- **States:** validation gates; upload progress label; error; done.
- **PWA notes:** `capture="environment"` camera; thumbnails; sticky footer.
- **Multi-stage / multi-view:** 4 steps + success in this one image.

---

### Image 339 — `/customer/favourites` — Favourites
- **Area / Persona:** Customer dashboard · saved stays/lets.
- **Route:** `/customer/favourites`
- **Chrome:** Customer top-nav.
- **Purpose:** Organise saved stays and lets into collections with compare.
- **Layout:** Header (Favourites + Create collection / Open map) → tab bar (All / Saved stays / Saved lets / Collections) + search/filter/grid tools → content: card grid of `CustomerPropertyCard` (with Compare checkbox overlay + save toggle) OR Collections cover-card grid (+ Create collection tile) → Recommended similar grid → floating **compare bar** when ≥1 selected.
- **Primary components:** tabs, property cards with compare checkbox, collection cover cards, recommended grid, compare bar.
- **Local nav / tabs / filters:** tabs (All/Stays/Lets/Collections); search; compare select (max 3).
- **Actions:** save toggle (toast); compare select; Create collection / Open map (toasts); card → stay/let detail.
- **States:** live save + compare state; empty per-tab message.
- **PWA notes:** cards 2-col; compare bar floats above bottom nav.
