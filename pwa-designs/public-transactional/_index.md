# Public transactional · index (Images 100–138)

Area: **Public transactional** — public marketplace + booking flows under
`src/app/(marketplace-public)/**`, `src/app/(public-booking)/**`,
`src/app/checkout/**`. Chrome: **Public** (`PublicNav` + `PublicFooter`), with
minimal checkout/pay/confirmation/portal frames where noted. Light theme only.

39 images · 4 batch files (`batch-01`…`batch-04`, 10/10/10/9) · range **100–138**.

| Image | Route | Page / view |
|:-----:|-------|-------------|
| 100 | `/marketplace` | Marketplace discover hub — grid view |
| 101 | `/marketplace` | Marketplace discover hub — split-map view |
| 102 | `/marketplace/emergency` | Emergency call-outs (locked intent) |
| 103 | `/marketplace/services` | Service packages (locked intent) |
| 104 | `/marketplace/suppliers` | Suppliers & trades + join banner |
| 105 | `/marketplace/stays` | Redirect → `/stay/search` |
| 106 | `/marketplace/stays/[slug]` | Stay detail (escrow checkout intent) |
| 107 | `/marketplace/services/[slug]` | Service detail (escrow checkout intent) |
| 108 | `/marketplace/suppliers/[slug]` | Supplier detail (inline quote intent) |
| 109 | `/marketplace/checkout/[draftId]` | Escrow checkout — auth gate |
| 110 | `/marketplace/checkout/[draftId]` | Escrow checkout — Stripe payment form |
| 111 | `/marketplace/checkout/[draftId]` | Escrow checkout — result / order created |
| 112 | `/marketplace/book/[listingId]` | Redirect → checkout |
| 113 | `/marketplace/request/[requestId]` | Standalone quote request |
| 114 | `/stay/search` | Stay search — list view |
| 115 | `/stay/search` | Stay search — split-map view |
| 116 | `/stay/map` | Stays map-first entry |
| 117 | `/stay/compare` | Compare stays (wishlist) |
| 118 | `/stay/wishlist` | Saved stays (anon entry) |
| 119 | `/stay/[slug]` | Stay listing detail |
| 120 | `/stay/[slug]` | Booking card — step 1 dates & quote |
| 121 | `/stay/[slug]` | Booking card — step 2 guest details |
| 122 | `/stay/[slug]` | Booking card — step 3 review & reserve |
| 123 | `/stay/[slug]` | Enquiry / Apply card (lets variant) |
| 124 | `/stay/[slug]/checkout` | Redirect → `/booking/checkout/[slug]` |
| 125 | `/booking/checkout/[draftId]` | Booking checkout bridge |
| 126 | `/stay/[slug]/pay` | Secure payment (Stripe) |
| 127 | `/stay/[slug]/pay` | Payment result (status-driven) |
| 128 | `/stay/[slug]/confirmation` | Booking received / confirmed |
| 129 | `/booking/[ref]` | Guest portal — access gate |
| 130 | `/booking/[ref]` | Guest portal — Trip tab |
| 131 | `/booking/[ref]` | Guest portal — Payment tab |
| 132 | `/booking/[ref]` | Guest portal — Check-in tab |
| 133 | `/booking/[ref]` | Guest portal — Report issue tab |
| 134 | `/booking/[ref]` | Guest portal — Review tab |
| 135 | `/checkout/bookings/[bookingId]` | Booking checkout (instant-pay) |
| 136 | `/checkout/services/[serviceOrderId]` | Service checkout (escrow) |
| 137 | `/checkout/emergency/[emergencyOrderId]` | Emergency dispatch checkout |
| 138 | `/checkout/quote-request/[quoteRequestId]` | Quote request / RFQ (no payment) |

## Source routes (page.tsx)
- `(marketplace-public)`: `/marketplace`, `/marketplace/emergency`, `/marketplace/services`, `/marketplace/suppliers`, `/marketplace/stays` (redirect), `/marketplace/stays/[slug]`, `/marketplace/services/[slug]`, `/marketplace/suppliers/[slug]`, `/marketplace/checkout/[draftId]`, `/marketplace/book/[listingId]` (redirect), `/marketplace/request/[requestId]` — 11 routes.
- `(public-booking)`: `/stay/search`, `/stay/map`, `/stay/compare`, `/stay/wishlist`, `/stay/[slug]`, `/stay/[slug]/checkout` (redirect), `/stay/[slug]/pay`, `/stay/[slug]/confirmation`, `/booking/checkout/[draftId]`, `/booking/[ref]` — 10 routes.
- `checkout`: `/checkout/bookings/[bookingId]`, `/checkout/services/[serviceOrderId]`, `/checkout/emergency/[emergencyOrderId]`, `/checkout/quote-request/[quoteRequestId]` — 4 routes.

**25 routes total** → expanded to **39 images** (multi-view hubs, the booking
stepper, pay/result, and the 5-tab guest portal each expand to one image per
view/stage).
