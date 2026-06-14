# Disaster Recovery Plan

**Product:** Propvora · **Owner:** Blackwellen Ltd. **Status:** Draft
(MAX-RELEASE items 188–197; backup/restore test is founder/external X6).

> Beta-appropriate targets. These are achievable with the current managed stack
> (Supabase, Cloudflare R2, Stripe, Resend, Vercel) without a bespoke HA setup.
> Restore steps that touch production data are **destructive** and must be run
> deliberately, with a dry-run first where possible.

## 1. Objectives (beta)

| Metric | Target | Basis |
|--------|--------|-------|
| **RTO** (time to restore service) | **≤ 4 hours** | Managed providers; redeploy + restore is fast at beta scale. |
| **RPO** (max data loss) | **≤ 24 hours** | Supabase daily backups (PITR if enabled tightens this to minutes). |

Revisit both as customer count grows; tighten RPO by enabling Supabase
Point-in-Time Recovery (PITR).

## 2. What must be recoverable
- **Database** — Supabase Postgres (229 tables, all RLS). Source of truth.
- **Files** — Cloudflare R2 private objects (documents, evidence photos) + their
  `files`/`documents` metadata rows in Supabase.
- **Billing state** — Stripe (authoritative for subscriptions; mirrored to
  `workspaces.plan` via webhook).
- **Config / secrets** — env vars (section 5).
- **Code** — this Git repo + Vercel deployment history (instant rollback).

## 3. Backups
- **Supabase:** enable automated daily backups; enable **PITR** on a paid tier for
  sub-day RPO. Take a **manual export** (`pg_dump` / dashboard export) before any
  risky migration and store it off-platform (encrypted).
- **R2:** enable object versioning where available; periodically replicate the
  private bucket to a second bucket/region or an offline export. R2 is the only
  copy of uploaded files — treat it as critical.
- **Stripe/Resend:** provider-managed; no local backup needed (Stripe is the
  billing source of truth; Resend logs are transient).
- **Config:** keep the canonical env-var inventory (section 5) in the ops vault.

## 4. Failure runbooks

| Scenario | Action |
|----------|--------|
| **DB corruption / accidental mass delete** | Put app in maintenance mode (A1 flag). Restore from latest Supabase backup or PITR to just before the event. Verify **RLS re-enabled** and row counts after restore (`scripts/audit-rls.mjs`). Reconcile Stripe→`workspaces.plan` by replaying/refetching subscription state. |
| **Bad migration** | Roll back the migration (or restore from the pre-migration manual export taken in §3). Redeploy the matching code commit on Vercel. Run `scripts/audit-queries.mjs` to confirm schema alignment. |
| **Stripe outage** | Billing reads degrade gracefully; **plan gates fail open** so paying users aren't locked out. Webhooks are idempotent — queued events reconcile when Stripe recovers. No data action needed; monitor `/api/ready` `lastWebhookAt`. |
| **Resend outage** | Email delivery pauses; app continues. Retry/queue sends when restored. No data loss (content lives in DB). |
| **Supabase outage** | App is down (DB is the dependency). Maintenance page. Wait for provider recovery; if regional, consider restore into a new project (last resort — re-point env + redeploy). |
| **Vercel outage** | App unreachable. Cloudflare serves a maintenance/error page. Redeploy or wait for provider recovery; rollback to last good deployment if the outage is deploy-induced. |
| **Cloudflare outage** | If proxied DNS fails, temporarily switch records to **DNS-only** (grey cloud) pointing straight at Vercel to bypass the edge. |
| **Security incident** | Follow `docs/compliance/breach-response-runbook.md`: contain (rotate keys/sessions, maintenance mode), assess, ICO 72h decision, restore from a **clean** backup, verify integrity + RLS, post-incident review. |

## 5. Config / env inventory (restore checklist)
Required to bring an environment up (values in the ops vault, never the repo):
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`, `OPENAI_API_KEY`, R2 set
(`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`/`R2_BUCKET_NAME`),
`COMPANIES_HOUSE_API_KEY`, `NEXT_PUBLIC_SITE_URL`, portal-session signing secret,
Turnstile keys. `/api/ready` reports presence-only booleans for the core set —
use it to confirm an environment is wired before going live.

## 6. Rollback
- **Code:** Vercel → Deployments → promote the last known-good deployment (instant).
- **DB:** restore from backup/PITR (see §4); never selectively re-inject data into
  a purged/erased account (respects erasure — see `retention-schedule.md`).
- **Config:** revert env changes from the vault history.

## 7. Maintenance mode
A maintenance-mode flag + safe error pages (404/403/500/maintenance/
payment-required/workspace-not-found/subscription-inactive/portal-expired/
invite-expired) are implemented as **MAX-RELEASE item A1**. Use it to take the app
offline cleanly during a restore.

## 8. Open actions (founder/external — X6)
- [ ] Enable Supabase automated backups (+ PITR if on a paid tier).
- [ ] Configure R2 versioning / off-site replication of the private bucket.
- [ ] Run a **full restore test** end-to-end and record the actual RTO/RPO hit.
- [ ] Store the env inventory + signing secrets in the ops vault.
