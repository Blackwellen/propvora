# User / Manual Actions — Settings › Billing (Subscription & Billing Control Centre)

Everything in code is complete and verified (tsc + eslint clean, production build run, 6 fixes applied — see `qa-release/implementation-fix-log.md` FIX-641…646). The items below are **genuinely external** to the codebase and cannot be applied by Claude Code.

---

## 1. Provision live Stripe configuration (founder / Vercel)

**Why Claude Code can't do it:** secrets live in Vercel/host env (CLI stdin stores empty on Windows per project notes) and require a Stripe dashboard login + live keys.

**Exact steps:**
1. In the Stripe dashboard, create/confirm the **products & prices** matching `src/lib/billing/plans.ts` (plan tiers monthly + annual, and the self-serve add-ons: `extra_props_10`, `extra_seat`, `white_label`, `ai_credits_1k`, `automation_pack`). Copy each **price ID** into the plan catalogue / env as that file expects.
2. Set environment variables (Vercel → Project → Settings → Environment Variables, all environments):
   - `STRIPE_SECRET_KEY` (live) and/or `STRIPE_SECRET_KEY_TEST` (test/preview)
   - `STRIPE_WEBHOOK_SECRET` (from the webhook endpoint below)
   - `NEXT_PUBLIC_APP_URL` = `https://staging.propvora.com` (or prod domain)
   - *(optional)* `STRIPE_PORTAL_RETURN_URL`, `STRIPE_PORTAL_CONFIGURATION_ID`, PMC ids
3. In Stripe → Developers → **Webhooks**, add endpoint `https://<domain>/api/webhooks/stripe` subscribed to: `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed`, `charge.refunded`, `charge.dispute.created`, `account.updated`. Paste the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Add **`plan` metadata** (`starter`/`operator`/`scale`/`pro_agency`/`enterprise`) to each subscription **price** so the webhook maps tiers exactly (it falls back to price nickname otherwise).
5. Redeploy. Verify: subscribe with a test card → land on `…/billing/renewals?checkout=success` → webhook flips `workspaces.plan_status` to active and creates a `workspace_subscriptions` row → Renewals/History populate.

**Until done:** the section degrades honestly — checkout/portal/addons/cancel return **503** with a clear "Billing not configured" message; the UI shows seed/empty states and the `SeedNotice`. No fake data, no broken layouts.

### 1a. Add-on prices for PRODUCTION — ✅ ALREADY DONE (verified live)

**No action needed.** Verified against the LIVE Stripe account (`acct_1RUWQW…`,
blackwellen Ltd, charges enabled): the live add-on **and** plan prices already exist,
and `src/lib/billing/catalog.generated.json` already holds the correct **live** price
IDs. Read-only live verification = **12/12 active** (8 plans + 4 self-serve add-ons:
extra_seat £9, extra_props_10 £19, white_label £49, automation_pack £29 — all /mo).

Production resolution is correct as-is: with no add-on override in Vercel env,
`getAddons()` falls back to the catalog's **live** IDs. The `.env.local`
`NEXT_PUBLIC_STRIPE_PRICE_ADDON_*` values are **test** IDs for local dev only and must
**not** be copied into the production (Vercel) environment.

> The earlier "create live add-on prices" note was based on a test-account check
> (`acct_1Tl3yU…`, which had no add-on products); the **live** account was always
> correctly configured. AI credit packs (`ai_credits_1k`) remain one-time and are
> intentionally not sold as recurring subscription items.

## 2. Live Chrome-MCP viewport capture (tooling)

**Why deferred this session:** only one Next dev server may run per directory (project rule), and the production build occupied the toolchain. Not a code blocker.

**Exact steps:** start the shared dev server (`npm run dev -- -p <claimed port>`), claim a Chrome MCP port in `.claude/port-registry.md`, then capture `/property-manager/workspace/billing/{checkout,renewals,add-ons,cancellation,history}` at **1536×960, 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812**, plus: read-only role (PermissionNotice + disabled controls), cancel→resume round-trip, add-on confirm. Save under `qa-release/` screenshots and tick the responsive matrix. Expected: no clip/overflow, no console/hydration errors (verified statically).

---

No other manual actions. All application-layer work is complete and merged to the working tree.
