# Pen-Test Lite — Internal Pre-Release Security Report

**Product:** Propvora · **Owner:** Blackwellen Ltd (Co. 16482166, ICO ZC160806)
**Type:** Internal, pre-release "pen-test lite" — engineer-led, not an external
accredited assessment. **Status:** In progress (MAX-RELEASE items 22–23).

> This report is honest. It distinguishes controls that are **already implemented
> and verified in-repo** from controls that are **pending**. It is NOT a substitute
> for an independent external penetration test — see the recommendation at the end.

## 1. Scope
- `/app` — authenticated SaaS (portfolio, money, work, compliance, contacts, settings).
- `/admin` — platform-admin console (`platform_role = 'admin'`).
- `/auth` — signup, login, OAuth (Google), password reset, OTP/MFA.
- `/portals` — external tenant / landlord / supplier magic-link portals.
- Supporting APIs: `/api/ai/*`, `/api/upload`, `/api/files/[...key]`,
  `/api/webhooks/stripe`, `/api/account/request`, `/api/health`, `/api/ready`.

Out of scope: third-party provider internals (Supabase, Stripe, Cloudflare,
Resend, OpenAI, Vercel) — covered by their own attestations + our DPAs.

## 2. Methodology
- Manual review of auth guard (`src/proxy.ts`), RLS posture, route handlers,
  and the external-portal authorization boundary (`src/lib/portal/session.ts`).
- Automated repo gates: `scripts/audit-rls.mjs` (RLS coverage),
  `scripts/audit-queries.mjs` (schema alignment).
- Targeted manual probes per OWASP-style categories (auth, access control, IDOR,
  injection, file upload, headers, redirects, rate limiting).
- **Test accounts: to be created** (item AA / 244–246): two isolated workspaces
  (A, B) each with owner/manager/member/read-only; one tenant, one supplier, one
  landlord portal session; one platform-admin. Cross-tenant IDOR and leakage
  probes run from these.

## 3. Findings

### 3.1 Controls verified fixed / implemented (evidence in git)

| Area | Control | Evidence |
|------|---------|----------|
| Access control | **RLS enabled on 229/229 base tables, 0 disabled**; 7 deny-all service-internal tables fail closed | `scripts/audit-rls.mjs`, `RLS_SECURITY_AUDIT.md` |
| Payments | Stripe webhook **signature verification** (raw body + `constructEvent`) | `src/app/api/webhooks/stripe/route.ts` |
| Payments | Webhook **idempotency / replay protection** (dedupe by event id + unique index) | migration `20260613000001_stripe_webhook_idempotency.sql` |
| Storage | Upload hardening — **MIME allowlist, 10 MB cap, filename sanitisation, workspace-membership check, storage quota** | `src/app/api/upload/route.ts`, `src/lib/r2.ts` |
| Storage | Private file streaming **behind auth + workspace check** | `src/app/api/files/[...key]/route.ts` |
| Headers | **CSP, HSTS, X-Frame DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP** | `next.config.ts` |
| Redirects | **Open-redirect allowlist** on login + auth callback (`safeRedirect`) | auth flows |
| Billing | **Server-side plan gates** (seat / AI / storage), client cannot unlock | `src/lib/billing/gates.ts` |
| AI | **Workspace-scoped** context under caller RLS + per-workspace rate limit + plan gate | `src/lib/ai/workspace-context.ts`, `metering.ts`, `gateAiCopilot` |
| Portal | External sessions HMAC-signed, constant-time validated, scope-locked, **fail closed** | `src/lib/portal/session.ts` |
| Errors | Public `/api/health` exposes coarse status only; `/api/ready` admin-gated, presence-booleans only (no secrets) | `src/app/api/{health,ready}/route.ts` |

### 3.2 Findings pending test / remediation

| ID | Finding / test | Sev | Status |
|----|----------------|-----|--------|
| P-1 | **IDOR sweep** across every detail page + API route (object id swapping) | Critical | Pending (item 41) |
| P-2 | **Multi-workspace leakage E2E** (workspace A reaching B's data) | Critical | Pending (item 17) |
| P-3 | **Role tests** (owner/manager/member/read-only/tenant/supplier/admin) | Critical | Pending (item 18) |
| P-4 | **Auth brute-force / signup / reset / OTP** rate limiting | High | Partial — AI + upload limited; auth/forms pending (items 24–34, 51–54) |
| P-5 | **XSS sweep** (notes, comments, filenames, AI output, rich text, announcements) | High | Pending (item 37, A9) |
| P-6 | **CSRF** coverage on all mutating server actions | Medium | Pending (item 36) |
| P-7 | **File-upload vuln** depth (polyglot/MIME spoof) + **scan/quarantine pipeline** | High | Partial — allowlist+size done; scan pipeline pending (42–44) |
| P-8 | **No stack traces/secrets** in prod errors; safe logging | High | Pending (items 47–48) |
| P-9 | **Audit-log coverage** on all sensitive mutations | High | Partial — `audit_logs` exists; coverage pending (49–50, A12) |
| P-10 | **Admin MFA + re-auth** on `/admin` | Critical | Partial — server role check exists; MFA pending (item 72) |
| P-11 | **SQLi** (verify Supabase parameterisation) / **SSRF** on URL fetches | Medium | Pending (items 38–39) |

## 4. Residual risks
- Access control depends heavily on **RLS + the portal session boundary**; both are
  verified structurally but **behavioural cross-tenant proof (P-1/P-2/P-3) is the
  top open risk** until the E2E suite lands.
- Rate limiting is **app-level and fails open**; without a hard edge limit
  (Cloudflare/Upstash) brute-force/abuse resistance is limited (P-4).
- Upload **content scanning** is not yet in place (P-7).

## 5. Recommendation
Do not declare GA-ready until **all Critical pending items (P-1, P-2, P-3, P-10)**
are Passed. After internal items are green, commission an **independent external
penetration test** before public launch, scoped to the same surfaces plus business
logic abuse (billing, portals, AI). File the external report alongside this one.

> Prepared by engineering for internal hardening. External validation required
> before relying on this for customer or investor assurances.
