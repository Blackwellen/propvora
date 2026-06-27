# Customer Workspace — V2 Demo Surface Status

**Section:** Customer workspace (`/customer/*`, files in `src/features/customer/*`)
**Date:** 2026-06-27

## What it is

The customer workspace is a **pixel-perfect demo/preview build** (48 routes). It is a **V2
surface, gated OFF for V1** via the `NEXT_PUBLIC_*` customer feature flags. There is intentionally
**no customer Supabase backend** yet — favourites, saved searches, collections, avatar upload, 2FA,
identity verification, etc. are all client-side demo interactions (toast / localStorage), by design.

This is consistent with the documented architecture (customer backend migration
`20260617230000` was written but **not applied** — see project memory "Customer backend").

## Why the toast-only buttons are NOT V1 bugs

An audit of the customer workspace flags ~40 toast-only / "coming soon" buttons (account-settings
avatar/2FA/password/address/identity, favourites collections/compare/map, stays save, lets
date-picker/budget/sort, bookings export/bulk, disputes evidence, etc.). These are **expected** for
a flag-gated demo surface with no backend — they are not dead buttons shipped into a live V1 path,
because the entire surface is gated off for V1.

## Fixed this session (real, backend-free — no migration required)

- **`/customer/stays/[slug]` Share button** — now performs a real Web Share API call with clipboard
  fallback ("Link copied" confirmation). New client component `StayDetailActions.tsx`. The Save
  button now toggles a real pressed/saved visual state consistent with the rest of the demo.
- **Account-settings → Security → Change password** — wired to Supabase Auth
  (`auth.updateUser({ password })`) via new `SecurityModals.tsx`. Real validation, error handling,
  success toast. Both the Security-tab row and the quick-action button open the same modal.
- **Account-settings → Security → Enable 2FA** — wired to the Supabase Auth TOTP MFA flow
  (`auth.mfa.enroll` → QR + secret → `challenge` → `verify`). Real QR code, 6-digit verification,
  enables a TOTP factor on the user's auth account. **No customer table needed** — this is pure
  Supabase Auth, so it works the moment the customer workspace flag is on.

These three are genuinely live because they depend only on the public marketplace queries and
Supabase Auth — neither needs the customer backend migration.

## ✅ MIGRATION APPLIED (2026-06-27, founder-authorized)

`supabase/migrations/20260617230000_customer_workspace_tables.sql` (55 additive tables, 65
`customer_*` RLS policies) was applied to the live project `oovgfknmzjcgbilwumch` via the
Management API PAT after explicit founder authorization. Verified: table presence + real insert
round-trip on favourites / addresses / collections (all HTTP 201).

### Now wired to real persistence (this session)
- **Favourites** — `/api/customer/favourites` (GET/POST/DELETE). Stays detail Save button persists
  by slug, reflects saved state on load, optimistic toggle with rollback.
- **Collections** — `/api/customer/favourites/collections` (GET/POST). Favourites "Create
  collection" modal + collections tab load real data.
- **Saved addresses** — `/api/customer/addresses` (GET/POST/DELETE). Account-settings "Add
  address" modal.
- **Account settings** — `/api/customer/account` (GET/PATCH: locale/timezone/currency/marketing).
- **Help / data export / account deletion** — `/api/customer/help-tickets` (POST). Account-settings
  "Download your data", "Download data", and "Delete / export account" raise real support tickets.
- **Security** — password change + 2FA via Supabase Auth (no table needed).

### Remaining customer button wiring (next tranche — schema now live, all unblocked)
These are lower-value demo affordances; each is now buildable against the live tables:
- Favourites card-grid hydration (resolve saved `ref` → public stay/let card data) + per-card
  remove + compare view.
- Bookings: export, bulk cancel, modify/dispute/report-issue persistence (tables:
  `customer_bookings`, `customer_booking_disputes`).
- Payments: add card / autopay (`customer_payment_methods`, `customer_autopay_mandates`) — needs
  Stripe SetupIntent for real card capture.
- Profile: avatar upload (R2 → store key), emergency contact, profile field persistence.
- Identity verification flow (`customer_*` + the existing admin id-verification pipeline).
- Notification preferences (`customer_notification_preferences`).

The customer workspace remains **flag-gated OFF** until a full QA pass — none of this ships to V1
users yet, but it now works end-to-end the moment the flag is enabled.

## To promote the customer workspace to a live V1.5/V2 surface

1. **Apply the customer backend migration** `supabase/migrations/20260617230000_*.sql` (after review)
   — creates `customer_*` / `let_*` tables.
2. **Build `/api/customer/*` endpoints** for: favourites (save/list/remove), saved searches,
   bookings (read/modify/cancel/dispute), payments, maintenance requests, messages, profile.
3. **Wire each toast button** to its endpoint following the operator-side patterns.
4. **Account-settings security features** (2FA, password change, identity verification) — wire to
   Supabase Auth MFA + the existing ID-verification flow used in `/admin/id-verification`.
5. **Flip the customer feature flags ON** once wired and tested.

## V1 release decision

**Ready behind feature flag (V2 demo surface).** The customer workspace is correctly gated off for
V1. It must NOT be flipped on until the customer backend (step 1–4 above) is built, because its
interactive surfaces are demo-only. No V1 release blocker — it is invisible to V1 users.

**External blocker:** Customer backend build (migration apply + `/api/customer/*` endpoints) is a
substantial V1.5/V2 workstream, not a quick fix. Documented here so it is not mistaken for a set of
trivial dead-button fixes.
