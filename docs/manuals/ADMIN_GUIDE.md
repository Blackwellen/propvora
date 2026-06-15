# Propvora — Admin Guide

This guide covers the **platform admin console** at `/admin` — the internal tooling
Blackwellen operates Propvora with. It is separate from a customer's *workspace* settings
and is reachable only by users whose `platform_role = "admin"`.

> The admin console operates above individual workspaces using the service role on the
> server. Access is gated by a server-side platform-admin check **and** an MFA/OTP gate
> on the admin auth surface (`/(admin-auth)`). Never expose admin routes to ordinary
> users; the guard is server-side, not cosmetic.

---

## Access & protection

- **Auth guard** — every `/admin` route verifies `platform_role = "admin"` on the
  server before rendering. Non-admins are turned away.
- **MFA / OTP gate** — the admin login surface requires a second factor.
- **Bootstrap** — first admin is provisioned via a one-time, shared-secret route
  (`POST /api/admin/init`, guarded by `ADMIN_SETUP_SECRET`) or the
  `scripts/seed-platform-admin.ts` / `setup-platform-admin.sql` helpers.
- **Readiness** — `GET /api/ready` returns presence-only config booleans and is itself
  platform-admin gated (fail-closed); it never leaks secret values.

---

## Console sections

| Section | What it does |
|---|---|
| **Dashboard** | Real platform KPIs via service role; recent workspaces. |
| **Users** | All `profiles` — search and filter platform users. |
| **Workspaces** | All workspaces with filters. |
| **Customers / Subscriptions** | Billing relationships and subscription state per workspace. |
| **Portfolios / Work / Planning** | Cross-workspace operational views for support. |
| **AI models** | Manage the AI provider/model catalogue (see below). |
| **AI usage** | Token/cost usage across workspaces from the metering ledger. |
| **Affiliates** | Affiliate applications review, per-affiliate actions and **payout review**. |
| **Stripe events** | Inbound Stripe webhook event log (idempotency/debug). |
| **Data requests** | GDPR export/erasure requests queue and processing. |
| **Bugs** | In-app bug reports (write-only deny-all table; never stores secrets/stacks). |
| **Announcements / Changelog** | Publish product announcements and changelog entries. |
| **Security / Settings** | Platform security configuration and feature flags. |
| **Health** | Checks real env vars + a Supabase ping. |

---

## AI model controls

The AI Copilot dispatches through a **multi-provider gateway** that the admin console
governs via the AI models catalogue:

- Add/enable **providers** (OpenAI, OpenRouter, Gemini, NVIDIA — OpenAI-compatible — and
  Anthropic via its native API) and **models**, with per-1k input/output costs and a
  default flag.
- **API keys live in env only**, referenced by name (`api_key_env`) on the provider row.
  No key is ever persisted to the database or sent to the client.
- The gateway tries the preferred/default model first and **falls back** down the enabled
  chain, ending at a hard-coded OpenAI default so chat keeps working even if the catalogue
  is empty or a provider is down.
- **Hard caps** (request/token windows + monthly cost budget, per plan) and **usage
  metering** apply to every call regardless of the selected model.

See `docs/finalisation/AI_SAFETY_AUDIT.md` for the full safety posture.

---

## Billing administration

- Plans and add-ons reconcile against **LIVE Stripe** via
  `scripts/test/billing-reconcile.mjs` (read-only). The catalogue is in
  `src/lib/billing/catalog.generated.json`.
- Subscription state is **webhook-sourced** — the app only changes a workspace's plan on
  a verified Stripe webhook (`/api/webhooks/stripe`), never on a client success redirect.
  The handler verifies the signature, dedupes by `event.id` (replay-safe) and handles the
  full lifecycle (checkout, subscription created/updated/deleted, invoice paid/failed,
  refunds, disputes, Connect `account.updated`).
- **Stripe Connect** (owner payouts) and **affiliate payouts** are feature-flagged **OFF**
  for V1; commission **accrues** and **reverses** on refund/dispute but does not pay out
  until the owner enables the flags. See `docs/release/stripe-connect-setup.md`.

Full procedure: `docs/finalisation/BILLING_E2E.md`.

---

## Audit & data governance

- **Audit logging** — administrative and sensitive actions write to the audit tables via
  `src/lib/audit/log.ts`; the admin **Audit** views surface them.
- **GDPR** — export/erasure requests flow through **Data requests**. Erasure is
  **DRY-RUN only** unless `ACCOUNT_ERASURE_ENABLED=true` **and** the operator explicitly
  confirms (double-gated). Export and preview work regardless.
- **Bug reports** — stored in a service-role deny-all table; the intake route strips
  secrets and stacks and always returns a generic 200.

---

## Operational runbooks (owner)

| Task | Document |
|---|---|
| Cloudflare/R2 production setup | `docs/release/cloudflare-production-setup.md` |
| Vercel production readiness | `docs/release/vercel-production-readiness.md` |
| Stripe Connect setup | `docs/release/stripe-connect-setup.md` |
| Disaster recovery / backups | `docs/release/disaster-recovery-plan.md` |
| Maintenance mode | set `MAINTENANCE_MODE=true` (admins + allowlist still pass) |
| Go/no-go | `docs/release/PROP-VORA-RELEASE-SIGNOFF.md` |
