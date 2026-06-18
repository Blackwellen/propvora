# Manual Founder Tasks — what only you can do

**Status:** 2026-06-18. These are the steps I cannot complete autonomously (they
need your accounts, OAuth, paid keys, or a deploy decision). Everything else
(staging, flags, admin, gating, email fix, roadmap) is built in the codebase.

## 🔴 Blockers before paid launch

### 1. Complete the MCP OAuth flows (started)
- **Stripe** — authorize: open the Stripe authorize URL I generated, approve. If
  the localhost redirect page errors, paste the address‑bar URL back to me and
  I'll call `complete_authentication`.
- **Cloudflare/R2** — same: open the Cloudflare authorize URL, approve, paste back.
- **Resend** — connected, but the current key is **send‑only** (`restricted_api_key`).
  Sending works; if you need domain management via MCP, add a full‑access key.

### 2. Persist feature flags in the DB (one migration)
The flag system works on registry defaults, but to **toggle flags in production**
(from `/admin/feature-flags`) you need the table:
- `platform_feature_flags (flag_key text primary key, enabled boolean not null default false, updated_at timestamptz default now())`
- Optional `workspace_feature_flags (workspace_id uuid, flag_key text, enabled boolean, primary key (workspace_id, flag_key))` for per‑workspace overrides.
Until this exists, flags read as their defaults (V1 = correct) and toggles report "table not provisioned".

### 3. Stripe live billing
- Create **live products + prices** for the 5 tiers (Starter £29 / Operator £79 /
  Scale £149 / Pro‑Agency £299 / Enterprise) — values per `src/lib/billing/plans.ts`.
- Set **price metadata `tier`** on each price (deterministic price→plan mapping).
- Configure the **webhook endpoint** (`/api/webhooks/stripe`) + copy the **signing
  secret** into `STRIPE_WEBHOOK_SECRET`.
- Set `NEXT_PUBLIC_STRIPE_PRICE_<TIER>_<INTERVAL>` env vars.
- Decide which add‑ons go live (17 of 22 are currently `priceId: null` — create
  prices or leave hidden).

### 4. Observability
- Set the Sentry (or chosen) **DSN** env var, then `registerSink()` activates and
  prod errors/AI/email/Stripe failures are captured (currently console‑only).

### 5. Email domain
- Verify the sending domain in Resend; confirm `RESEND_FROM_EMAIL`/`RESEND_FROM_NAME`.

### 6. Disaster recovery (evidence)
- Confirm **Supabase PITR / backups** are on; record RTO/RPO; run a **test restore**
  and capture evidence; confirm **R2 versioning/lifecycle**.

## 🟠 Deploy

### 7. GitHub + Vercel
- I can push + open a PR once the production build is green and you authorize it.
- **Vercel:** framework must be `nextjs`; set all env vars (Supabase URL/anon/
  service‑role, Stripe keys + webhook secret + price IDs, Resend key + from, R2
  keys/bucket, Sentry DSN, AI provider keys). **Trim** anything not referenced in
  code (I can produce the keep/trim list from `process.env.*` usage on request).
- Set production Supabase settings (auth redirect URLs, SMTP if used).

### 8. Visual QA (auth‑gated)
- Log in as a **platform admin** and eyeball the 45 admin pages + the flag manager.
- Log in as an **operator** and walk the V1 story (property → tenancy → cert → job
  → invoice → payment → portals). I can't reach these (the guards fail closed and
  I can't reset a prod password).

## 🟡 Decisions
- MTD/HMRC filing scope (we ship **MTD‑aware exports**, not in‑app filing).
- Legal/DPA review of the staged copy + the roadmap claims.
- Which V1.5 flags (Planning, AI Copilot, automations‑lite) to enable at/after launch.

---
See `docs/Audits/propvora-strategic-bloat-commercial-gap-audit/` for the full
strategy + gap detail, and the release‑readiness verdict for what's done vs open.
