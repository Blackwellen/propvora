# Nav Coverage — 2026-06-17 wave (Legal framework + iCal channel sync)

Scope: the new routes/surfaces created by the **booking/marketplace legal
framework + iCal channel sync** work. For each, whether it is reachable from
navigation, and any built-but-unreachable surfaces flagged.

Legend: **Reachable** = a user can get there by clicking through the UI without
typing a URL. **Direct-URL only** = the route works and is correct, but is not
yet linked from a menu/button.

## Public legal pages (19 new) — all Reachable

All nineteen new booking/host legal pages live under `/legal/*` and are linked
from the central **Legal hub** (`src/app/legal/page.tsx`), which the public
**footer** links to via the `Legal` entry (`PublicFooter.tsx` → `/legal`).

Path: `Footer → /legal → (Booking policies / Host & property-manager terms sections) → each page.`

| Route | Audience | Reachable via |
|-------|----------|---------------|
| `/legal/booking-terms` | guest | `/legal` → Booking policies |
| `/legal/guest-terms` | guest | `/legal` → Booking policies |
| `/legal/direct-booking-terms` | guest | `/legal` → Booking policies |
| `/legal/booking-cancellation-policy` | guest | `/legal` → Booking policies |
| `/legal/booking-refund-policy` | guest | `/legal` → Booking policies |
| `/legal/damage-deposit-policy` | both | `/legal` → Booking + Host sections |
| `/legal/house-rules-policy` | both | `/legal` → Booking + Host sections |
| `/legal/booking-payment-terms` | guest | `/legal` → Booking policies |
| `/legal/guest-data-notice` | guest | `/legal` → Booking policies |
| `/legal/safety-emergency-disclaimer` | both | `/legal` → Booking + Host sections |
| `/legal/booking-review-policy` | both | `/legal` → Booking + Host sections |
| `/legal/host-terms` | host | `/legal` → Host & property-manager terms |
| `/legal/host-payout-terms` | host | `/legal` → Host & property-manager terms |
| `/legal/host-tax-disclaimer` | host | `/legal` → Host & property-manager terms |
| `/legal/host-compliance-disclaimer` | host | `/legal` → Host & property-manager terms |
| `/legal/listing-accuracy-warranty` | host | `/legal` → Host & property-manager terms |
| `/legal/host-insurance-disclaimer` | host | `/legal` → Host & property-manager terms |
| `/legal/channel-sync-disclaimer` | host | `/legal` → Host & property-manager terms **and** the in-app Channel Sync panel banner |
| `/legal/booking-ai-disclaimer` | both | `/legal` → Booking + Host sections |

**Status: all 19 reachable.** The legal index page was extended (this session)
with two new sections — *Booking policies (guests)* and *Host & property-manager
terms* — driven by `GUEST_POLICY_LIST` / `HOST_POLICY_LIST` from
`src/lib/legal/booking-policies.ts`, so the list cannot drift from the registry.

## In-app: iCal channel sync — Reachable by direct URL (deep link present)

| Route | Purpose | Nav status |
|-------|---------|-----------|
| `/app/bookings/listings/[listingId]/channels` | iCal channel-sync control panel for one listing (`ChannelSyncManager`) | **Direct-URL / deep-link reachable.** It is a sub-route of the existing listing detail page and uses the same back-nav. It is **not yet surfaced as a tab/button on the listing detail UI** — that UI (`ListingsManagerDeepClient` / `ListingWizardClient`) is owned by the bookings agent and was intentionally **not edited** in this session (boundary rule). |

### Flag: built-but-not-yet-linked

- **`ChannelSyncManager`** (`src/components/bookings/ChannelSyncManager.tsx`) is
  fully built and mounted at `/app/bookings/listings/[listingId]/channels`, and
  that page is correct and live. The **only** missing link is a "Channel sync"
  tab/button on the listing detail screen. That link must be added by whoever
  owns `ListingWizardClient` / `ListingsManagerDeepClient`, because this session
  was scoped to **not** modify the bookings agent's listing UI. Suggested wiring:
  add a link to `/app/bookings/listings/${listingId}/channels` from the listing
  detail header actions.

## API routes (not nav, listed for completeness)

| Route | Method | Auth | Reachable by |
|-------|--------|------|--------------|
| `/api/booking/ical/[token].ics` | GET | public-by-token (service role lookup) | the export URL pasted into Airbnb/Booking/Vrbo/Google/Outlook. Emits dates only. |
| `/api/booking/ical/connections` | GET/POST/DELETE | session + listing-RLS | `ChannelSyncManager` |
| `/api/booking/ical/refresh` | POST | session + listing-RLS | `ChannelSyncManager` "Sync now" |

## Summary

- **19/19** public legal pages reachable from nav (Footer → `/legal` hub).
- **iCal channel-sync page** is route-complete and deep-link reachable; the one
  outstanding nav task is a single link from the bookings agent's listing-detail
  UI (flagged above, left to that owner per the boundary rule).
- No orphaned/broken routes introduced.
