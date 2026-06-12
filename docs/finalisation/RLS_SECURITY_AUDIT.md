# RLS Security Audit

**Last Updated:** 2026-06-11

## Status Key: ✅ Verified | ⬜ Pending | ❌ Issue Found

## Critical Tables

| Table | RLS Enabled | workspace_id isolation | Portal isolation | Admin bypass | Status |
|-------|-------------|----------------------|-----------------|--------------|--------|
| properties | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| units | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| tenancies | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| contacts | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| jobs | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| tasks | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| money_invoices | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| money_deposits | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| compliance_certificates | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| documents | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| messages | ⬜ Table pending | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| notifications | ⬜ Table pending | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| workspace_members | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| planning_sets | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| supplier_jobs | ⬜ Needs SQL verify | ⬜ | ✅ supplier_id FK | ⬜ | ⬜ Wave 4 |
| affiliate_referrals | ⬜ Needs SQL verify | ⬜ | ✅ affiliate_id FK | ⬜ | ⬜ Wave 4 |
| calendar_events | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |
| accounting_accounts | ⬜ Needs SQL verify | ⬜ | ⬜ | ⬜ | ⬜ Wave 4 |

## Application-Layer Security (Confirmed in Waves 1-4)

| Check | Status | Notes |
|-------|--------|-------|
| Admin routes server-side guard | ✅ | layout.tsx checks platform_role = 'admin' server-side |
| /app routes auth gate | ✅ | proxy.ts redirects unauthenticated users |
| Supplier portal session isolation | ✅ | supplier session checked in supplier layout |
| Affiliate portal session isolation | ✅ | affiliate session checked in affiliate layout |
| No service-role key in client bundle | ✅ Wave 4 | Grep confirmed: only in server files (admin.ts, health page server component) |
| No secrets in client bundle | ✅ Wave 4 | NEXT_PUBLIC_ audit complete — see PENTEST doc |
| Open redirect guard in /login | ✅ Wave 4 | safeRedirect() allowlist added |
| Open redirect guard in /api/auth/callback | ✅ Wave 4 | safeRedirect() allowlist added |
| Zod input validation on API routes | ✅ Wave 4 | ai/chat, ai/actions, demo/seed, demo/reset |
| Security headers (HTTP) | ✅ Wave 4 | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |

## Storage Bucket Policies

| Bucket | Public | Signed URLs | Workspace scoped | Status |
|--------|--------|-------------|-----------------|--------|
| documents | ❌ Must not be public | ✅ Plan: R2 signed URLs | ⬜ | ⬜ Wave 4 |
| avatars | ❌ Must not be public | ✅ Plan: R2 signed URLs | ⬜ | ⬜ Wave 4 |
| certificates | ❌ Must not be public | ✅ Plan: R2 signed URLs | ⬜ | ⬜ Wave 4 |
| evidence | ❌ Must not be public | ✅ Plan: R2 signed URLs | ⬜ | ⬜ Wave 4 |

## Security Checks

| Check | Status | Notes |
|-------|--------|-------|
| No service-role key client-side | ✅ Wave 4 | Grep confirmed — only in server files |
| No secrets in client bundle | ✅ Wave 4 | NEXT_PUBLIC_ audit complete — see PENTEST doc |
| API routes validate inputs with Zod | ✅ Wave 4 | ai/chat, ai/actions, demo/seed, demo/reset |
| Upload MIME validation | ⬜ Pending | No /api/upload route found — defer to R2 agent |
| Upload size limits | ⬜ Pending | No /api/upload route found — defer to R2 agent |
| Safe filename generation | ⬜ Pending | crypto.randomUUID() — defer to R2 agent |
| CSRF-safe actions | ✅ | Next.js App Router server actions are CSRF-safe by design |
| No open redirects | ✅ Wave 4 | safeRedirect() allowlist in /login and /api/auth/callback |
| Secure cookies | ✅ | Supabase Auth uses httpOnly secure cookies |
| Security headers | ✅ Wave 4 | X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy |
| Stripe webhook signature | ⬜ Pending | TODO placeholder in webhooks/stripe/route.ts — requires STRIPE_WEBHOOK_SECRET |

## Wave 4 Actions — Status

1. ⬜ Run SQL: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` — verify RLS on all tables
2. ⬜ Add RLS policies for `messages` and `notifications` tables
3. ✅ Grep `src/` for `SUPABASE_SERVICE_ROLE_KEY` — confirmed server-files only
4. ✅ Added `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` to `next.config.ts`
5. ✅ Validated redirect param in `/login` and `/api/auth/callback` against allowlist
6. ✅ Zod validation added to all POST API routes (ai/chat, ai/actions, demo/seed, demo/reset)
7. ⬜ Implement Stripe webhook signature verification in `src/app/api/webhooks/stripe/route.ts`
8. ⬜ Restrict `NEXT_PUBLIC_MAPS_API_KEY` to production domain in Google Cloud Console
