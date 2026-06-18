# Public transactional · batch 04 · Images 130–138

The resolved magic-link guest portal (5 tabs over one trip header) and the four
`/checkout/*` instant-order screens (booking / service / emergency / quote
request). Images 130–134 are the tabbed `GuestPortal`; the trip header + tab bar
are persistent and each tab body is a separate image. Checkout screens share a
`CheckoutShell` (steps Details · Payment · Review) with sticky `OrderSummaryCard`.

---

### Image 130 — `/booking/[ref]` — Guest portal · Trip tab
- **Area / Persona:** Public transactional · resolved guest. **Dynamic param:** `ref`; query `token`.
- **Route:** `/booking/[ref]` (tab "trip")
- **Chrome:** Minimal portal frame (centered max-w-2xl, own footer).
- **Purpose:** Trip overview + cancel (while cancellable).
- **Layout:** Trip header card (listing title, place, status pill, dates → nights, reference) + horizontal tab bar (Trip · Payment · Check-in · Report issue · Review). Trip body: rows (Guest, Guests, Arrival, Check-in window, Check-out by, Total, refundable deposit) + **Cancel booking** (when hold/pending).
- **Primary components:** `GuestPortal`, status-tone pill, `Row` list, cancel → `/api/booking-portal/cancel`.
- **Local nav / tabs / filters:** 5-tab bar (persistent across 130–134).
- **Actions:** switch tabs; Cancel booking (confirm dialog).
- **States:** status tones (hold/pending/confirmed/checked-in/out/completed/cancelled/no-show); cancel only when hold/pending; post-cancel message.
- **PWA notes:** tab bar horizontally scrolls; rows stack; cancel confirm is a native dialog.
- **Multi-stage / multi-view:** tab 1 of 130–134; gate at Image 129.

---

### Image 131 — `/booking/[ref]` — Guest portal · Payment tab
- **Area / Persona:** Public transactional · resolved guest. **Dynamic param:** `ref`.
- **Route:** `/booking/[ref]` (tab "pay")
- **Chrome:** Minimal portal frame.
- **Purpose:** Show amount due and pay securely (or confirm already paid).
- **Layout:** Same header + tab bar. Body: amount-due panel (+ refundable deposit note) → **Pay securely now** (→ `/stay/[slug]/pay?ref=…`) when payable, or "Payment received — held securely" when paid, or "no payment due" → escrow reassurance line.
- **Primary components:** `PayTab`, amount panel, pay link.
- **Local nav / tabs / filters:** tab bar.
- **Actions:** Pay securely now → pay flow (Image 126).
- **States:** canPay (hold/pending + unpaid) · paid (emerald) · nothing-due.
- **PWA notes:** full-width pay CTA; escrow note.
- **Multi-stage / multi-view:** tab 2 of 130–134.

---

### Image 132 — `/booking/[ref]` — Guest portal · Check-in tab
- **Area / Persona:** Public transactional · resolved guest. **Dynamic param:** `ref`.
- **Route:** `/booking/[ref]` (tab "checkin")
- **Chrome:** Minimal portal frame.
- **Purpose:** Arrival info + safe-release keyless door code (server-gated to the stay window).
- **Layout:** Header + tabs. Locked state: padlock circle, "Check-in details locked" + check-back date. Unlocked: emerald "cleared to check in" banner → rows (check-in window / check-out by / arrival time) → door-access-code panel (Reveal my access code → big spaced code + instructions) → reference reminder.
- **Primary components:** `CheckinTab`, `/api/booking/keyless/release` reveal.
- **Local nav / tabs / filters:** tab bar.
- **Actions:** Reveal my access code → fetch code; copy/keep private.
- **States:** locked (not yet eligible) · unlocked-pre-reveal · code revealed · reveal error ("code isn't available yet").
- **PWA notes:** large tappable reveal button; code in monospace-ish large tracking; keep-private hint.
- **Multi-stage / multi-view:** tab 3 of 130–134.

---

### Image 133 — `/booking/[ref]` — Guest portal · Report issue tab
- **Area / Persona:** Public transactional · resolved guest. **Dynamic param:** `ref`.
- **Route:** `/booking/[ref]` (tab "issue")
- **Chrome:** Minimal portal frame.
- **Purpose:** Raise an issue to the host during/around the stay.
- **Layout:** Header + tabs. Form: Category select (access/cleanliness/maintenance/noise/safety/billing/other) + Severity select (low/normal/urgent) (2-col) → Subject → Details textarea → **Send report**. Success: check + "Report sent".
- **Primary components:** `IssueTab`, `/api/booking-portal/issue`.
- **Local nav / tabs / filters:** tab bar; category/severity selects.
- **Actions:** Send report (subject ≥2 chars).
- **States:** form · busy · done · error.
- **PWA notes:** selects native; textarea resizable; single column on mobile.
- **Multi-stage / multi-view:** tab 4 of 130–134.

---

### Image 134 — `/booking/[ref]` — Guest portal · Review tab
- **Area / Persona:** Public transactional · resolved guest (post-checkout). **Dynamic param:** `ref`.
- **Route:** `/booking/[ref]` (tab "review")
- **Chrome:** Minimal portal frame.
- **Purpose:** Rate the stay and leave feedback once checked out.
- **Layout:** Header + tabs. Locked state: star circle, "Reviews unlock after your stay". Unlocked: 5-star picker → Title → Review textarea → **Submit review**. Success: "Thanks for your review".
- **Primary components:** `ReviewTab`, `/api/booking-portal/review`.
- **Local nav / tabs / filters:** tab bar.
- **Actions:** set rating; Submit review (rating ≥1).
- **States:** locked (pre-checkout) · form · busy · done · error.
- **PWA notes:** large star targets; single column.
- **Multi-stage / multi-view:** tab 5 of 130–134.

---

### Image 135 — `/checkout/bookings/[bookingId]` — Booking checkout (instant-pay)
- **Area / Persona:** Public transactional · stay buyer. **Dynamic param:** `bookingId`.
- **Route:** `/checkout/bookings/[bookingId]`
- **Chrome:** **`CheckoutShell`** frame (own header + step rail + sticky summary; not Public marketing chrome).
- **Purpose:** Full booking checkout — details, billing, extras, promo, payment method → pay & confirm.
- **Layout:** `CheckoutShell` (step Details/Payment/Review) main column of `SectionCard`s: Your stay (thumb, dates/nights/guests, Edit dates) · Guest & contact details · Billing address (toggle same-as) · Optional extras (priced check rows) · Arrival + promo + special requests · Payment method picker · pay/confirm actions + (auth) Save draft. Right: sticky `OrderSummaryCard` (live breakdown, deposit hold).
- **Primary components:** `BookingCheckout`, `OrderSummaryCard`, `PaymentMethodPicker`, `ConfirmModal`, `useCheckoutBundle` (live/seed), `calcBooking`.
- **Local nav / tabs / filters:** step rail; billing toggle; promo apply.
- **Actions:** apply promo; toggle extras; pick method; **Pay {total} & confirm** → ConfirmModal → confirmed screen; Save draft.
- **States:** loading (`CheckoutLoading`) · error (`CheckoutError` + retry) · seed "Preview booking" subtitle · confirm modal/paying · **confirmed** ("You're all set", charged amount, email sent).
- **PWA notes:** summary collapses above form on mobile; sticky pay CTA; payment lifecycle modelled in state (no live Stripe).
- **Multi-stage / multi-view:** steps + confirmed are one screen's modelled stages.

---

### Image 136 — `/checkout/services/[serviceOrderId]` — Service checkout (escrow)
- **Area / Persona:** Public transactional · service buyer. **Dynamic param:** `serviceOrderId`.
- **Route:** `/checkout/services/[serviceOrderId]`
- **Chrome:** `CheckoutShell` frame.
- **Purpose:** Book and pay for a supplier service — funds **held in escrow**, released to the supplier after completion/sign-off + evidence.
- **Layout:** `CheckoutShell` SectionCards: service/supplier summary (rating, escrow note) · contact details · property access details · optional add-ons (priced check rows) · appointment confirm · notes · photo upload · payment method → **Pay & hold in escrow** → confirmed.
- **Primary components:** `ServiceCheckout`, `OrderSummaryCard`, `PaymentMethodPicker`, `PhotoUpload`, `ConfirmModal`, `calcService` (platform fee + escrow hold + VAT).
- **Local nav / tabs / filters:** step rail; add-on checks.
- **Actions:** select add-ons; pick method; Pay & confirm → escrow hold; confirmed/booked state.
- **States:** loading · error/retry · seed preview · paying · booked (escrow held).
- **PWA notes:** photo upload uses camera/library; sticky summary; modelled payment.
- **Multi-stage / multi-view:** details→payment→review modelled stages.

---

### Image 137 — `/checkout/emergency/[emergencyOrderId]` — Emergency dispatch checkout
- **Area / Persona:** Public transactional · buyer with an urgent call-out. **Dynamic param:** `emergencyOrderId`.
- **Route:** `/checkout/emergency/[emergencyOrderId]`
- **Chrome:** `CheckoutShell` frame with a **red emergency band**.
- **Purpose:** Dispatch an emergency provider — auth payment, hold in escrow, then run an acceptance-window countdown with provider failover.
- **Layout:** Red emergency header/band → SectionCards: issue + location + preferred contact (Call/Text/WhatsApp) · photo upload · payment method · authorise → **dispatch stages** tracker (Request sent → Provider accepted → En route → On site → Completion) with acceptance **Countdown**.
- **Primary components:** `EmergencyCheckout`, dispatch-stage stepper, `Countdown`, `PaymentMethodPicker`, `PhotoUpload`, `OrderSummaryCard`, `ConfirmModal`.
- **Local nav / tabs / filters:** dispatch-stage tracker; contact-method picker.
- **Actions:** choose contact method; pay & dispatch → request sent; on reject/timeout next provider dispatched.
- **States:** loading · error/retry · seed preview · authorising · dispatched + live countdown · accepted / en-route / on-site / completed.
- **PWA notes:** red urgency theme; live countdown ticks; call/WhatsApp deep links; modelled dispatch.
- **Multi-stage / multi-view:** dispatch tracker stages within one screen.

---

### Image 138 — `/checkout/quote-request/[quoteRequestId]` — Quote request / RFQ (no payment)
- **Area / Persona:** Public transactional · buyer requesting a supplier quote. **Dynamic param:** `quoteRequestId`.
- **Route:** `/checkout/quote-request/[quoteRequestId]`
- **Chrome:** `CheckoutShell` frame (subtitle "No payment taken").
- **Purpose:** Send a structured RFQ to a supplier — no payment; supplier replies with a tailored quote.
- **Layout:** `CheckoutShell` SectionCards: Supplier (trust badges: ID/Insurance/Background/Quality) · Service requirements (type + description) · Property address · Timing (date/time/urgency + budget range) · Attachments (`PhotoUpload`, max 5) · Your details & message + site-visit preference · "What happens next" 5-step list → **Send quote request** → ConfirmModal → request-sent screen.
- **Primary components:** `QuoteRequestCheckout`, `OrderSummaryCard` (estimate range), `PhotoUpload`, selects, `ConfirmModal`.
- **Local nav / tabs / filters:** time/urgency/site-visit selects.
- **Actions:** fill requirements; Send quote request → confirm → "Request sent" (no payment, supplier will reply).
- **States:** loading · error/retry · seed "Preview request" · sending · sent.
- **PWA notes:** attachments via camera/library; selects native; sticky CTA; explicitly no payment.
- **Multi-stage / multi-view:** single screen; success sub-state.

---

**End of Public transactional area.** Images 100–138 (39 images, 4 batch files).
See `_index.md` for the full route map.
