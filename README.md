# Propvora

**Propvora** is a UK property-operations SaaS — a single workspace for landlords,
portfolio operators and letting agencies to run portfolio, money, work, compliance,
planning, legal, accounting, automations, contacts, calendar and messaging, with an
AI Copilot and tenant/landlord/supplier portals on top.

Propvora is a brand and trading name of **Blackwellen Ltd** (registered in England &
Wales, company no. **16482166**; registered office 61 Bridge Street, Kington, HR5 3DJ;
ICO data-protection registration **ZC160806**). The legal entity facts are held in one
place — `src/lib/legal/company.ts` — and rendered across the legal pages, footers and
emails.

> **Status:** pre-launch. This repository is feature-complete for UK V1 but is **not yet
> approved for general availability**. See `docs/release/PROP-VORA-RELEASE-SIGNOFF.md`
> for the authoritative go/no-go checklist.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16.2** (App Router; auth guard in `src/proxy.ts`, formerly `middleware`) |
| UI | **React 19.2**, **Tailwind CSS v4**, Radix UI primitives, Framer Motion, Recharts, Leaflet |
| Data / auth | **Supabase** (Postgres + Auth + RLS), `@supabase/ssr` |
| File storage | **Cloudflare R2** (S3-compatible, private bucket, signed/streamed access) |
| Billing | **Stripe** (Checkout, Billing Portal, webhooks; Connect feature-flagged off) |
| Email | **Resend** |
| AI | **OpenAI** by default, via a multi-provider gateway (OpenAI / OpenRouter / Gemini / NVIDIA / Anthropic) |
| Validation | **Zod**; forms via React Hook Form |
| Tests | **Node** security/billing suites + **Playwright** E2E |

> **Note on Next.js 16.** This is not the Next.js most snapshots know — the API surface,
> conventions and file layout differ. Read the in-repo guides under
> `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).

---

## Local setup

### 1. Prerequisites
- Node.js 20+
- A Supabase project (URL + anon key + service-role key)
- Optional for full functionality: Stripe, Resend, Cloudflare R2, OpenAI keys

### 2. Install
```bash
npm install
```

### 3. Environment
Copy the template and fill in values. **Never commit real secrets.**
```bash
cp .env.example .env.local
```

Minimum to boot the app (the rest degrade gracefully):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; admin/worker operations |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` | App + canonical site URL |

Feature integrations (each optional; absence is detected and the feature shows a
configuration state rather than breaking):

| Group | Variables |
|---|---|
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| OpenAI (server-only) | `OPENAI_API_KEY`, `NEXT_PUBLIC_OPENAI_MODEL` |
| Resend | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` |
| Cloudflare R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` |
| Companies House | `COMPANIES_HOUSE_API_KEY` |
| Turnstile (bot) | `NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY`, `CF_TURNSTILE_SECRET_KEY` |

Safety flags (default **OFF** — leave off until verified):

| Flag | Effect |
|---|---|
| `MAINTENANCE_MODE` | Redirects traffic to `/maintenance` (platform admins + allowlist still pass) |
| `NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED` | Master switch for the magic-link `/p/[token]` recipient portals |
| `NEXT_PUBLIC_FF_STRIPE_CONNECT` | Stripe Connect (owner payouts) |
| `NEXT_PUBLIC_AFFILIATE_PAYOUTS_ENABLED` | Affiliate payout execution (accrual still runs when off) |
| `ACCOUNT_ERASURE_ENABLED` | GDPR erasure worker leaves DRY-RUN unless exactly `true` **and** confirmed |

`src/lib/env.ts` validates the two required Supabase vars at startup (throws in
production, warns in development).

### 4. Run
```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
npm run typecheck# tsc --noEmit
```

---

## Database & migrations

- Schema lives under `supabase/migrations/` (69 migrations as of this writing).
- The **live** schema is captured in `docs/final-wiring/live-schema.{json,md}` and is the
  reference the app is aligned to.
- Apply migrations with the helper scripts (service-role required):
  ```bash
  node scripts/_apply_all_migrations.mjs   # apply every pending migration
  node scripts/_apply_migration.mjs <file> # apply one
  ```
- **Schema alignment gate** — every query in the app is verified against the live schema:
  ```bash
  npm run audit:schema   # node scripts/audit-queries.mjs  (must report 0)
  npm run audit:rls      # node scripts/audit-rls.mjs       (RLS enablement)
  ```

---

## Test suite

The consolidated security/billing harness runs **10 suites** in sequence:

```bash
npm run test:security    # node scripts/test/run-all.mjs
```

| # | Suite | What it proves |
|---|---|---|
| 1 | RLS multi-workspace isolation + IDOR | cross-workspace rows are not visible/writable |
| 2 | Subscription / feature gates | per-tier allow/deny with 402 upgrade messages |
| 3 | Billing catalog reconciliation | app catalog ↔ **LIVE** Stripe (read-only) |
| 4 | Stripe webhook coverage | signature, idempotency, lifecycle events handled |
| 5 | Billing entitlement gates E2E | every tier boundary, live `gateStorage` |
| 6 | RLS coverage | every `workspace_id` table has RLS enabled |
| 7 | Anonymous exposure | the anon client leaks no rows |
| 8 | IDOR sweep | cross-workspace object references blocked (live) |
| 9 | Role within workspace | RBAC gates inside a workspace |
| 10 | Supplier portal scoping | per-supplier RLS isolation |

Individual entry points: `npm run test:rls`, `npm run test:gates`, plus
`node scripts/test/billing-reconcile.mjs`, `billing-webhooks.mjs`,
`billing-entitlements-e2e.mjs`. Playwright E2E: `npm run test:e2e`.

> The Stripe billing scripts make **read-only** LIVE calls only. Destructive card/refund/
> cancellation flows must be run by the owner in **Stripe TEST mode** — see
> `docs/finalisation/BILLING_E2E.md`.

---

## Deploy

- Target: **Vercel** (framework preset must be `nextjs`); staging runs at
  `staging.propvora.com`.
- Private files are served from **Cloudflare R2** via the app (never public-bucket).
- Set every secret in the deploy environment (see `.env.example`); register the Stripe
  **LIVE** webhook at `/api/webhooks/stripe` with the events listed in
  `docs/finalisation/BILLING_E2E.md`.
- Health endpoints: `GET /api/health` (liveness) and `GET /api/ready` (admin-gated
  readiness booleans).
- Owner-side production setup runbooks live in `docs/release/`
  (`cloudflare-production-setup.md`, `vercel-production-readiness.md`,
  `stripe-connect-setup.md`, `disaster-recovery-plan.md`).

---

## Documentation map

| Area | Path |
|---|---|
| User guide (per section) | `docs/manuals/USER_GUIDE.md` |
| Admin guide | `docs/manuals/ADMIN_GUIDE.md` |
| Portal guide (tenant/landlord/supplier/recipient) | `docs/manuals/PORTAL_GUIDE.md` |
| Final production audit | `docs/finalisation/FINAL_PRODUCTION_AUDIT.md` |
| RLS / API security / billing matrices | `docs/finalisation/RLS_POLICY_MATRIX.md`, `API_SECURITY_MATRIX.md`, `BILLING_E2E.md` |
| Admin / AI-safety / DB-alignment audits | `docs/finalisation/ADMIN_AUDIT.md`, `AI_SAFETY_AUDIT.md`, `DB_FRONTEND_ALIGNMENT.md` |
| Compliance pack (GDPR/WCAG/ROPA…) | `docs/compliance/` |
| **Release sign-off (go/no-go)** | `docs/release/PROP-VORA-RELEASE-SIGNOFF.md` |
| International expansion (post-V1, gated) | `docs/upgrade/` |

---

© Blackwellen Ltd, trading as Propvora. All rights reserved.
