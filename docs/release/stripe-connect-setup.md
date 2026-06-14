# Stripe Connect (Standard) — Setup & Activation

**Purpose:** let a workspace **owner** connect **their own** Stripe account to
receive tenant/customer invoice payments through Propvora. This is **separate**
from Propvora's SaaS subscription billing (which bills to Blackwellen Ltd's
platform account). Propvora never custodies these funds — payments settle to the
owner's connected account.

**Status:** Built, **feature-flagged OFF** (`NEXT_PUBLIC_FF_STRIPE_CONNECT`).
Do not enable until the steps below are done and tested in Stripe **test mode**.

## What's already implemented (in-repo)
- DB: `stripe_connect_accounts` (one per workspace; RLS = members read, service-role writes). Migration `20260613000003_stripe_connect.sql` (applied).
- Flag + helpers: `src/lib/billing/connect.ts` (`connectEnabled()`, `statusFromAccount()`).
- API: `POST /api/connect/onboard` (owner-only; creates a Standard account + hosted onboarding link), `GET /api/connect/status`.
- Webhook: `account.updated` syncs `charges_enabled` / `payouts_enabled` / `details_submitted` / `status`.

## Founder / dashboard steps (Manual)
1. **Enable Connect** — Stripe Dashboard → Connect → *Get started*. Choose
   platform/marketplace. Keep in **test mode** first.
2. **Connect settings** — set the platform name "Propvora", brand colour, support
   email `support@propvora.com`, and the business/legal entity = **Blackwellen Ltd**.
3. **Account type** — we use **Standard** (owner has their own full Stripe
   dashboard and is liable for their own account). No change needed in code.
4. **Webhooks** — add a **Connect** webhook endpoint (separate from the account
   webhook) pointing at `https://propvora.com/api/webhooks/stripe`, subscribed to
   at least: `account.updated`. (The existing endpoint already handles it; in
   Stripe you may use one endpoint with "Listen to events on Connected accounts"
   enabled, or a dedicated Connect endpoint — either delivers `account.updated`.)
5. **Branding/redirects** — onboarding `return_url`/`refresh_url` already point to
   `/app/workspace-settings/billing`. Confirm `NEXT_PUBLIC_APP_URL` is the prod URL.

## Environment variables
| Var | Where | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_FF_STRIPE_CONNECT` | Vercel (all envs) | `false` until activated; set `true` to enable. |
| `STRIPE_SECRET_KEY` | Vercel | Platform secret key (already set for SaaS billing). |
| `STRIPE_WEBHOOK_SECRET` | Vercel | Signing secret for the webhook endpoint that receives `account.updated`. |
| `NEXT_PUBLIC_APP_URL` | Vercel | Prod app URL for onboarding return/refresh. |

## Acceptance criteria (test mode, before enabling in prod)
1. Owner clicks "Connect payouts" → redirected to Stripe onboarding → completes test onboarding → returns to billing page.
2. `stripe_connect_accounts` row exists for the workspace with `details_submitted=true`.
3. `account.updated` webhook flips `charges_enabled`/`payouts_enabled` and `status` to `active`.
4. `GET /api/connect/status` returns `connected:true, status:"active"`.
5. A **non-owner** member calling `/api/connect/onboard` gets **403**.
6. With the flag **off**, `/api/connect/onboard` returns 403 and `/api/connect/status` returns `enabled:false`.
7. SaaS subscription billing is unaffected (separate customer/account; no fund mixing).

## Rules / guardrails (must hold)
- Never mix SaaS subscription billing with owner payout flows (separate Stripe objects).
- Tenant/customer payment receipts must clearly show the **owner's** business, not Propvora.
- ToS/AUP must state Propvora is a software platform, not a landlord/agent/payment guarantor (already in legal pages).
- Refunds/disputes on connected-account charges are the **owner's** responsibility (Standard account).
