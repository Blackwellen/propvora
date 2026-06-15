# Billing E2E Verification & Stripe Reconciliation

Owner-run pre-launch verification for Propvora subscription billing (Stripe +
Supabase). Pairs the **automated** read-only checks (run by `run-all.mjs`) with
the **manual** card-flow matrix the owner must run in Stripe **TEST mode**.

> **LIVE-key safety.** The automated scripts make **read-only** Stripe calls
> (`prices.retrieve`, `products.list`) only — they never create a charge,
> customer, subscription, product or price. All **destructive** flows below
> (real checkouts, declines, refunds, cancellations) MUST be run by the owner in
> **Stripe TEST mode** with test cards — never against LIVE keys.

---

## 1. Automated checks (run before every release)

```bash
node scripts/test/run-all.mjs          # includes the three billing suites below
# or individually:
node scripts/test/billing-reconcile.mjs        # app catalog ↔ LIVE Stripe (read-only)
node scripts/test/billing-webhooks.mjs         # webhook handler coverage (static)
node scripts/test/billing-entitlements-e2e.mjs # entitlement gates, every tier + live storage
node scripts/test/billing-gates.mjs            # original 31-check gate matrix
```

### 1a. Catalog reconciliation — `billing-reconcile.mjs`

Reconciles `src/lib/billing/catalog.generated.json` (+ any
`NEXT_PUBLIC_STRIPE_PRICE_*` env overrides) against **LIVE** Stripe. For every
plan price (starter/operator/scale/pro_agency × monthly/annual) and every add-on
it asserts the Stripe price **exists, is active, has an active product, currency
= GBP, and the amount matches** the catalog. It also:

- Flags **orphaned** Propvora-tagged Stripe products not referenced by the app.
- Confirms **enterprise is intentionally price-less** (contact sales).
- Detects the **webhook tier-resolution gap**: warns if a plan price lacks both
  `metadata.plan` and a tier-bearing nickname, which would make
  `customer.subscription.*` silently map the subscription to `starter`.

**Last verified result (LIVE):** `54/54 checks passed, 0 failed, 0 warnings`.
All 13 priced items (10 plan prices + 3 paid add-ons... see note) reconcile
exactly. Plan prices carry `metadata.plan` **and** tier-bearing nicknames, so
the webhook resolves tiers correctly — no silent-downgrade gap.

### 1b. Webhook coverage — `billing-webhooks.mjs`

Static audit of `src/app/api/webhooks/stripe/route.ts`. Asserts:

- **Signature verification** (`webhooks.constructEvent` + `STRIPE_WEBHOOK_SECRET`),
  rejects missing `stripe-signature` (400), reads the **raw body** (`request.text()`).
- **Idempotency / replay protection** via the `stripe_webhook_events` dedupe
  table: checks `event.id` before processing, records it **after** success, and
  returns **500 (no record)** on failure so Stripe retries are reprocessed.
- All **critical lifecycle events** handled: `checkout.session.completed`,
  `customer.subscription.created/updated/deleted`, `invoice.paid`,
  `invoice.payment_failed`.
- **Recommended** events handled: `charge.refunded`, `charge.dispute.created`,
  plus `account.updated` (Connect status sync).

**Last verified result:** `17/17 checks passed, 0 failed`.

### 1c. Entitlement gates E2E — `billing-entitlements-e2e.mjs`

Drives the **real** gate functions in `src/lib/billing/gates.ts` and the
entitlement service in `entitlements.ts` across **every tier boundary**:

- Feature gates (AI Copilot, advanced reports, white-label, SSO, portals,
  automation) — allow/deny at each tier, and every **deny carries an upgrade
  message + HTTP 402** (fail-closed contract).
- Numeric **limits** (properties / seats / storage) resolve correctly per tier,
  incl. `Infinity` for enterprise.
- **Monotonicity**: no feature turns back off as you move up a tier.
- **Live `gateStorage`** against a **real seeded workspace** (created via service
  role, owner user + slug, deleted in `finally`): under-limit upload allows;
  5 GB on a 2 GB starter workspace denies with 402.

**Last verified result:** `66/66 passed, 0 failed`.

---

## 2. Manual test-card matrix (Stripe **TEST mode** — owner runs)

Switch the dashboard to **Test mode**, point a local/staging build at the test
keys, then run each card through the real checkout (`POST /api/billing/checkout`)
and through the **Billing Portal** (`POST /api/billing/portal`). Confirm the
webhook fires and the workspace `plan` / `plan_status` updates.

| Scenario | Test card | Expected app result |
|---|---|---|
| Successful subscription | `4242 4242 4242 4242` | Checkout completes → `plan` = chosen tier, `plan_status` = `active`. Webhook `checkout.session.completed` + `customer.subscription.created`. |
| Generic decline | `4000 0000 0000 0002` | Checkout shows decline; **no** plan change; no `subscription.created`. |
| Insufficient funds | `4000 0000 0000 9995` | Decline at payment; workspace stays on prior plan. |
| Lost / stolen card | `4000 0000 0000 9987` | Decline; no plan change. |
| SCA / 3DS required | `4000 0027 6000 3184` | 3DS challenge shown; on **complete** → subscription active; on **fail/cancel** → no plan change. |
| Always-authenticate 3DS | `4000 0025 0000 3155` | 3DS prompt every charge; successful auth activates. |
| Failed renewal (dunning) | `4000 0000 0000 0341` (attach, then let renewal fail) | `invoice.payment_failed` → `plan_status` = `past_due`; dunning email; portal lets card be updated. |

Use any future expiry, any CVC, any postcode for test cards.

---

## 3. Manual lifecycle flows (Stripe **TEST mode** — owner runs)

Verify each end-to-end and confirm the **webhook-driven** state change (never
trust the client success redirect — the app deliberately only acts on webhooks):

- [ ] **New subscription** — checkout each tier (starter → pro_agency) monthly
      **and** annual. Confirm correct `plan`, `active`, correct Stripe amount.
- [ ] **Upgrade** (e.g. operator → scale) via Billing Portal → proration charged,
      `customer.subscription.updated` → new tier reflected immediately; AI/portal
      gates that were denied now allow.
- [ ] **Downgrade** (scale → operator) → at period end the tier drops; gated
      features (AI Copilot, portals) become **denied with a 402 upgrade message**.
- [ ] **Cancel** (immediate and at-period-end) → `customer.subscription.deleted`
      → `plan` = `starter`, `plan_status` = `canceled`; affiliate accrual stops
      (`stopReferralAccrual`).
- [ ] **Trial** — if a trial price is used, confirm `plan_status` = `trialing`,
      and conversion → `active` at trial end.
- [ ] **Refund** — refund a paid invoice in the dashboard → `charge.refunded` →
      affiliate commission for that customer is reversed (`reverseCommissionForCustomer`).
- [ ] **Dispute / chargeback** — simulate `charge.dispute.created` → workspace
      flagged `past_due`, commission reversed, audit row written.
- [ ] **Billing Portal** — `POST /api/billing/portal` opens the Stripe-hosted
      portal; update payment method, view invoices, change/cancel plan all work
      and round-trip back via webhook.
- [ ] **Idempotency** — replay a webhook event from the Stripe dashboard; confirm
      the second delivery is acknowledged as `duplicate` and does **not** double
      the affiliate accrual (`stripe_webhook_events` unique index).
- [ ] **Add-ons** — extra seat / +10 properties / white-label / AI credits /
      onboarding purchase via portal or a separate checkout line item.

---

## 4. Stripe Connect decision (affiliate payouts)

Connect is **feature-flagged OFF** and stays off for V1 launch:

- `connectEnabled()` (`src/lib/billing/connect.ts`) reads
  `NEXT_PUBLIC_FF_STRIPE_CONNECT` — **not set** in env (default OFF).
- Affiliate **payouts** read `NEXT_PUBLIC_AFFILIATE_PAYOUTS_ENABLED`
  (`src/lib/affiliate/payout-flag.ts`) — **not set** (default OFF). Commission
  **accrues** to the ledger on `invoice.paid` and **reverses** on
  refund/dispute, but **payout is disabled** until the owner flips the flag.
- The webhook already handles `account.updated` to sync connected-account
  onboarding status, so the surface is ready when Connect is switched on.

**Decision:** ship V1 with Connect + affiliate payouts OFF. Commission ledger
runs live (accrual/reversal). Before enabling payouts the owner must: enable
Connect in the platform Stripe dashboard, complete platform onboarding, set
`NEXT_PUBLIC_FF_STRIPE_CONNECT=true` and `NEXT_PUBLIC_AFFILIATE_PAYOUTS_ENABLED=true`,
then re-run the manual Connect onboarding flow in test mode.

---

## 5. Pre-launch sign-off

- [ ] `node scripts/test/run-all.mjs` passes (all suites).
- [ ] `billing-reconcile.mjs` = 0 mismatches, 0 unexpected warnings against LIVE.
- [ ] `STRIPE_WEBHOOK_SECRET` set in the deploy env; webhook endpoint registered
      in the LIVE Stripe dashboard pointing at `/api/webhooks/stripe` with the
      events in §1b subscribed.
- [ ] Section 2 (cards) + Section 3 (lifecycle) run green in **TEST mode**.
- [ ] Connect / payout flags confirmed OFF for launch (§4).
