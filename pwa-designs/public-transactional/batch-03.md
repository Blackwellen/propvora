# Public transactional · batch 03 · Images 120–129

The `/stay/[slug]` booking-card stepper (3 stages), the lets enquiry variant, the
checkout bridge + alias redirect, the secure pay step and confirmation, then the
magic-link guest portal gate. Stages 120–122 are the right-rail `StayBookingCard`
on the detail page (Image 119) expanded per step. Public chrome throughout;
pay/confirmation are noindex minimal frames.

---

### Image 120 — `/stay/[slug]` — Booking card · step 1 Dates & live quote
- **Area / Persona:** Public transactional · stay guest. **Dynamic param:** `slug`.
- **Route:** `/stay/[slug]` (`StayBookingCard` step "dates")
- **Chrome:** Public (right-rail card on the detail page).
- **Purpose:** Pick dates + guests and see the server-recomputed price breakdown before committing.
- **Layout:** Card: header (per-night price + 3-dot step indicator) → Dates field (opens calendar; mobile opens a sheet) → `DateRangeCalendar` (1 month desktop) → Guests `GuestStepper` ("Sleeps up to N") → price breakdown panel (line items, Total due now, deposit note, warnings) → **Continue to guest details** → "No payment taken yet" note.
- **Primary components:** `StayBookingCard`, `DateRangeCalendar` (blocked dates from availability API), `GuestStepper`, live quote panel (`/api/booking/listing/quote`).
- **Local nav / tabs / filters:** internal step dots (dates/details/review).
- **Actions:** select range; +/- guests; Continue (enabled when quote ready).
- **States:** availability-loaded blocked days; quote loading ("Updating price…"); quote error ("couldn't price these dates"); min-nights notice; deposit line.
- **PWA notes:** **mobile date sheet** (`MobileSheet`, 2-month calendar + guest stepper + confirm); sticky CTA; calendar tap targets ≥44px.
- **Multi-stage / multi-view:** stepper 120 → **121** → **122**; on detail Image 119.

---

### Image 121 — `/stay/[slug]` — Booking card · step 2 Guest details
- **Area / Persona:** Public transactional · stay guest. **Dynamic param:** `slug`.
- **Route:** `/stay/[slug]` (`StayBookingCard` step "details")
- **Chrome:** Public (right-rail card).
- **Purpose:** Collect guest contact + arrival info before review.
- **Layout:** Card body: Full name*, Email*, Phone + Arrival time (2-col), Message to host (textarea), booking summary line (guests · dates), Back + **Review & confirm** buttons.
- **Primary components:** `StayBookingCard` form fields (`.cf-input`).
- **Local nav / tabs / filters:** step dots advance.
- **Actions:** Back → dates; Review & confirm (enabled when name ≥2 + valid email).
- **States:** validation gating on name/email.
- **PWA notes:** native keyboards (email/tel); autocomplete name/email/tel; single column on mobile.
- **Multi-stage / multi-view:** stepper 120 → 121 → 122.

---

### Image 122 — `/stay/[slug]` — Booking card · step 3 Review & reserve
- **Area / Persona:** Public transactional · stay guest. **Dynamic param:** `slug`.
- **Route:** `/stay/[slug]` (`StayBookingCard` step "review")
- **Chrome:** Public (right-rail card).
- **Purpose:** Final review + legal acceptance, then create the held reservation and hand off to pay.
- **Layout:** Card body: price breakdown recap → cancellation-policy box → acceptance checkboxes (house rules / cancellation / deposit (if any) / booking terms, each with "View policy" modal) → Back + **Reserve & continue to payment** → "Payment held securely until check-in".
- **Primary components:** `StayBookingCard` review, `AcceptBox` + `PolicyModal` (BOOKING_POLICIES), reserve call (`/api/booking/listing/reserve`).
- **Local nav / tabs / filters:** "View policy" opens a full policy modal (version/effective date).
- **Actions:** toggle acceptances; View policy; Back; Reserve & continue → `/stay/[slug]/pay?ref=…&hrid=…&token=…`.
- **States:** submit gated on all-accepted + quote-ready; submitting ("Holding your dates…"); submit error.
- **PWA notes:** policy modal slides up as a sheet; checkboxes ≥44px; sticky CTA.
- **Multi-stage / multi-view:** final stepper stage → pay (Image 126).

---

### Image 123 — `/stay/[slug]` — Enquiry / Apply card (lets variant)
- **Area / Persona:** Public transactional · long/mid-term let, shared/HMO, student-room enquirer. **Dynamic param:** `slug`.
- **Route:** `/stay/[slug]` (`EnquiryCard`, when `applyFlow` listing)
- **Chrome:** Public (right-rail card replacing the nightly booking card).
- **Purpose:** Register interest in a non-nightly let (no payment) — move-in date + contact + message.
- **Layout:** Card: headline price (/ month or week, or "Price on enquiry") + "No payment taken — register your interest" → Preferred move-in date, Full name, Email, Phone, Message → consent checkbox → CTA ("Apply for this let" / "Enquire about this room").
- **Primary components:** `EnquiryCard`, submits via `/api/booking/reserve` (enquiry window).
- **Local nav / tabs / filters:** none.
- **Actions:** Submit enquiry → success card ("Enquiry sent", honest "not a confirmed let").
- **States:** validation (name+email, consent); sending; done; error.
- **PWA notes:** date input native picker; success replaces card in place.
- **Multi-stage / multi-view:** alternative to the 120–122 booking stepper on Image 119.

---

### Image 124 — `/stay/[slug]/checkout` — Stay checkout alias redirect
- **Area / Persona:** Public transactional · stay guest. **Dynamic param:** `slug`.
- **Route:** `/stay/[slug]/checkout` → **redirects to `/booking/checkout/[slug]`**
- **Chrome:** Public (destination).
- **Purpose:** Stable per-listing checkout alias resolving to the booking checkout bridge.
- **Layout:** none — server `redirect()`. Design target is Image 125.
- **Primary components:** n/a.
- **Actions:** transparent navigation.
- **States:** redirect only.
- **PWA notes:** instant; deep-link safe.
- **Multi-stage / multi-view:** resolves to Image 125.

---

### Image 125 — `/booking/checkout/[draftId]` — Booking checkout bridge
- **Area / Persona:** Public transactional · stay guest. **Dynamic param:** `draftId` (slug or draft id).
- **Route:** `/booking/checkout/[draftId]`
- **Chrome:** Minimal **`min-h-screen bg-#F7F9FC`** booking frame (own back link, no app nav).
- **Purpose:** Reassure + explain how booking works, then send the guest to choose dates on the listing (the real flow runs through `StayBookingCard`).
- **Layout:** max-w-2xl. Back to {listing} → card: header (eyebrow "Booking checkout", "Complete your booking", listing title, from-price) → emerald escrow security note → "How booking works" 4-step list (Choose dates / See full price / Secure payment / Confirmation) → **Choose dates & book** CTA (→ `#booking-card`) → "No payment taken until you confirm" → "Powered by Propvora" footer.
- **Primary components:** static bridge card, numbered step list.
- **Local nav / tabs / filters:** none.
- **Actions:** Choose dates & book → listing `#booking-card`; Back to listing.
- **States:** resolved-listing rich summary vs generic fallback ("your stay").
- **PWA notes:** single column; CTA full-width; standalone (no marketing footer) — installable booking surface.
- **Multi-stage / multi-view:** entered via Image 124; leads back to 120–122.

---

### Image 126 — `/stay/[slug]/pay` — Secure payment (Stripe)
- **Area / Persona:** Public transactional · stay guest (anonymous, magic-link-ish via `?ref`). **Dynamic param:** `slug`; query `ref`/`hrid`/`token`.
- **Route:** `/stay/[slug]/pay?ref=<bookingId>`
- **Chrome:** Minimal **noindex** payment frame (centered card), under Public chrome.
- **Purpose:** Authorise the held reservation's escrow PaymentIntent via Stripe Elements.
- **Layout:** Back link → card: header ("Secure payment", big amount + "total", booking reference) → emerald escrow explanation → `PaymentForm` (Stripe Card Element) → "256-bit encrypted · Processed by Stripe" trust strip. Mobile: fixed bottom amount bar ("Held in escrow until your stay · Secure").
- **Primary components:** `PayClient`, `PaymentForm`, `/api/payments/status` load.
- **Local nav / tabs / filters:** none.
- **Actions:** confirm card payment → result; Back to confirmation.
- **States:** `loading` ("Loading secure payment…") · `not_ready` (Info card "Payment unavailable", Back to listing) · `form` (this image) · `result` (Image 127). Honest webhook-driven status, never asserts capture.
- **PWA notes:** mobile sticky amount bar (`pb-28`, safe-area inset); ≥44px targets.
- **Multi-stage / multi-view:** pay form (126) → result (127) → confirmation (128).

---

### Image 127 — `/stay/[slug]/pay` — Payment result (status-driven)
- **Area / Persona:** Public transactional · stay guest. **Dynamic param:** `slug`; query `ref`.
- **Route:** `/stay/[slug]/pay` (`PayClient` `result` stage)
- **Chrome:** Minimal noindex payment frame (centered card).
- **Purpose:** Show the honest payment outcome (held / confirmed / processing / failed) and route onward.
- **Layout:** Card: status circle + heading + body (tone-driven copy), Booking reference row, Amount authorised row, escrow reassurance (non-failed) → action button ("View booking details" or "Try again" on failure).
- **Primary components:** `PayClient` result, `guestPaymentCopy` / `normalisePaymentPhase`, 4s status polling.
- **Local nav / tabs / filters:** none.
- **Actions:** View booking details → `/stay/[slug]/confirmation?…`; Try again → back to form.
- **States:** confirmed (emerald) / held (indigo) / processing (blue) / failed (red). Polling stops on terminal.
- **PWA notes:** single card; status icon animation candidate; reference break-all.
- **Multi-stage / multi-view:** between pay (126) and confirmation (128).

---

### Image 128 — `/stay/[slug]/confirmation` — Booking received / confirmed
- **Area / Persona:** Public transactional · stay guest. **Dynamic param:** `slug`; query `ref`/`hrid`/`token`/`status`.
- **Route:** `/stay/[slug]/confirmation?ref=…`
- **Chrome:** Minimal **noindex** confirmation frame (centered card).
- **Purpose:** Honest confirmation — held/pending or confirmed — with reference and next steps; never claims payment taken unless confirmed.
- **Layout:** Card: status circle (emerald check confirmed / blue clock pending) + heading + body → Booking reference block with **Copy** → "What happens next" 3-step list (Check email / PM confirms / Payment & check-in details) → actions (**Manage your booking** when token/hrid → portal, else Back to listing; **Done** → home) → Powered-by footer.
- **Primary components:** `ConfirmationClient`, copy-to-clipboard, step list.
- **Local nav / tabs / filters:** none.
- **Actions:** Copy reference; Manage your booking → `/booking/[ref]?token=…`; Done → `/`.
- **States:** confirmed vs pending_payment copy; portal link present only with hrid/token.
- **PWA notes:** copy button with copied feedback; single column; install candidate.
- **Multi-stage / multi-view:** terminus of pay flow; links to guest portal (129+).

---

### Image 129 — `/booking/[ref]` — Guest portal · access gate
- **Area / Persona:** Public transactional · anonymous guest (magic-link or ref+email). **Dynamic param:** `ref`; query `token`.
- **Route:** `/booking/[ref]` (no/invalid token → gate)
- **Chrome:** Minimal **portal-ish** centered card (own footer), under Public chrome.
- **Purpose:** Resolve a single trip without an account — via token (auto) or booking reference + email.
- **Layout:** Centered max-w-md card: blue `KeyRound` circle → "Manage your booking" → explainer → form (Booking reference `PV-XXXXXXXX`, Email) → **Find my booking**.
- **Primary components:** `GuestPortal` gate, `/api/booking-portal/lookup`.
- **Local nav / tabs / filters:** none (gate precedes the tabbed portal).
- **Actions:** Find my booking → resolve trip (Images 130–134).
- **States:** gate (this image, when no trip); gate error ("couldn't find a booking"); auto-resolved when valid `?token` present (skips straight to Trip tab).
- **PWA notes:** ref auto-uppercases; email keyboard; single card; magic-link deep-link.
- **Multi-stage / multi-view:** gate → tabbed portal: Trip (130) / Payment (131) / Check-in (132) / Report issue (133) / Review (134).

---

**Next:** batch-04 — guest-portal tabs and the four `/checkout/*` order screens. Images 130–138.
