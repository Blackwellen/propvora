# PROPVORA — MAX RELEASE TODO

**Product:** Propvora · **Legal owner:** Blackwellen Ltd (Reg. England & Wales No. 16482166; ICO ZC160806)
**Started:** 2026-06-13 · **Owner key:** Claude = implementable in-repo · Manual Founder = needs founder action · External = needs a third-party account/dashboard · Legal = needs legal review.

**Status key:** Not Started · In Progress · Blocked · Implemented · Tested · Passed · Failed

> This is the live master tracker for the MAX RELEASE hardening pass. It is honest:
> items are only "Implemented" when the code exists in-repo and builds green; only
> "Tested/Passed" when exercised at browser + backend + boundary level. The
> companion **PROP-VORA-RELEASE-SIGNOFF.md** must NOT say release-ready until every
> Critical and High row here is Passed.

---

## 0. Already implemented & verified this hardening pass (evidence in git)

| # | Item | Area | Severity | Status | Evidence |
|---|------|------|----------|--------|----------|
| 0.1 | Schema alignment — every `.from().select()` matches live schema | db | High | Implemented | `scripts/audit-queries.mjs` → **0** misaligned refs; build green |
| 0.2 | Server-side subscription gates (seat / AI Copilot / storage) | payments | Critical | Implemented | `src/lib/billing/gates.ts`; wired in team invite, `/api/ai/chat`, `/api/ai/actions`, `/api/upload` |
| 0.3 | R2 upload hardening — MIME allowlist, 10 MB cap, filename sanitisation, workspace-membership check, storage quota | storage/security | High | Implemented | `src/app/api/upload/route.ts`, `src/lib/r2.ts` (`buildKey`) |
| 0.4 | Private file streaming behind auth + workspace check | storage/security | High | Implemented | `src/app/api/files/[...key]/route.ts` |
| 0.5 | Security headers — CSP, HSTS, X-Frame/frame-ancestors, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP | security | High | Implemented | `next.config.ts` `headers()` |
| 0.6 | Stripe webhook signature verification (raw body + `constructEvent`) | payments | High | Implemented | `src/app/api/webhooks/stripe/route.ts` |
| 0.7 | Stripe webhook idempotency / replay protection (dedupe by event id + unique index backstop) | payments | High | Implemented | webhook route + migration `20260613000001_stripe_webhook_idempotency.sql` |
| 0.8 | AI Copilot workspace-scoped context + per-workspace rate limit + plan gate | security/AI | High | Implemented | `src/lib/ai/workspace-context.ts`, `src/lib/ai/metering.ts`, `gateAiCopilot` |
| 0.9 | Open-redirect allowlist on login + auth callback | security | Medium | Implemented | prior wave (`safeRedirect`) |
| 0.10 | Legal entity correctness — Blackwellen Ltd, Co. 16482166, ICO ZC160806, 3 real mailboxes | compliance/legal | High | Implemented | `src/lib/legal/company.ts`; legal pages + footer updated |
| 0.11 | SEO surface — robots.txt, sitemap.xml, llms.txt, AI.txt, FAQ.txt, SEO.txt, Blackwellen.txt, Propvora.txt, security.txt | SEO | Medium | Implemented | `/public/*` |
| 0.12 | Saved Views, bulk actions, Ask-AI trigger, card/kanban views, CSV import/export | app | Medium | Implemented | `useSavedViews`, `SavedViewsMenu`, `openCopilot`, `parseCsv` |

---

## A–D. Route / nav / clickable inventory & logic-flow mapping (items 1–21)

| # | Item | Area | Sev | Owner | Status |
|---|------|------|-----|-------|--------|
| 1 | Full route inventory (/app, /admin, /auth, /portals, marketing) | app | High | Claude | Not Started |
| 2 | Per-route doc (auth/workspace/role/plan/tables/buckets/risks) | app | High | Claude | Not Started |
| 3 | Navigation inventory (sidebars, topnav, switchers, mobile, breadcrumbs) | app | Medium | Claude | Partially (top-bar cluster done) |
| 4 | Dropdown/menu z-index above sticky bars/modals/grids | app | Medium | Claude | Implemented (portaled menus) |
| 5–6 | UI warp checks + fixes desktop/tablet/mobile | app | Medium | Claude | Not Started |
| 7–11 | Clickable-element inventory; wire/disable/remove dead+duplicate | app | High | Claude | Partially (work/money/contacts swept) |
| 12–13 | Logic-flow map (happy + failure paths) for all workflows | app | High | Claude | Not Started |
| 14 | Playwright E2E for critical flows | QA | High | Claude | Not Started |
| 15 | Backend/API tests for critical mutations | QA | High | Claude | Not Started |
| 16 | RLS tests per table | security | Critical | Claude | Not Started |
| 17 | Multi-workspace leakage tests | security | Critical | Claude | Not Started |
| 18 | Role tests (owner/manager/member/read-only/tenant/supplier/admin) | security | Critical | Claude | Not Started |
| 19–21 | Subscription/add-on gate tests, server-side enforced, safe upgrade prompts | payments | Critical | Claude | Partially (gates built; tests pending) |

## E. Pen test & security hardening (items 22–50)

| # | Item | Sev | Owner | Status |
|---|------|-----|-------|--------|
| 22–23 | Internal pen-test pass + `/docs/release/pen-test-lite-report.md` | Critical | Claude | Not Started |
| 24–34 | Brute-force / signup / reset / OTP / invite / form / AI / upload abuse protection | High | Claude+External | Partial (AI + upload rate-limited; auth/forms pending) |
| 35 | Payment webhook replay handling | High | Claude | **Implemented** (0.7) |
| 36 | CSRF protections | Medium | Claude | Not Started |
| 37 | XSS across all text/rich/uploaded-filename/AI surfaces | High | Claude | Not Started |
| 38 | SQLi attempts (Supabase parameterised — verify) | Medium | Claude | Not Started |
| 39 | SSRF review of any URL-fetch | Medium | Claude | Not Started |
| 40 | Open redirect (auth + invite links) | Medium | Claude | Implemented (0.9) |
| 41 | IDOR on every detail page + API route | Critical | Claude | Not Started |
| 42–44 | File upload vuln tests + strict allowlists + scan pipeline (`pending_scan`/quarantine) | High | Claude | Partial (allowlist+size done; scan pipeline pending) |
| 45–46 | Security headers + CSP report-only→enforce | High | Claude | Implemented (0.5) |
| 47–48 | No stack traces/secrets in prod errors; safe logging | High | Claude | Not Started |
| 49–50 | Audit logs for all sensitive actions + tamper-resistant fields | High | Claude | Partial (`audit_logs` exists; coverage pending) |

## F. Rate limiting & bot defence (items 51–58)

| # | Item | Sev | Owner | Status |
|---|------|-----|-------|--------|
| 51–54 | App-side rate limits on all sensitive endpoints + safe errors | High | Claude+External | Partial (AI done; rest pending — needs shared store) |
| 52 | Shared rate-limit store (Upstash/Supabase fallback) | High | External | Not Started (Upstash account) |
| 55 | Cloudflare Turnstile on public forms | Medium | External | Not Started |
| 56–57 | Cloudflare config + `/docs/release/cloudflare-production-setup.md` | High | Manual Founder | Not Started |
| 58 | DNS-filtering guidance doc | Low | Claude | Not Started |

## G. Supabase integration & tidy-up (items 59–81)

| # | Item | Sev | Owner | Status |
|---|------|-----|-------|--------|
| 59–65 | Inventory tables/views/RPC/triggers/buckets/edge-fns/auth providers | db | Medium | Partial (schema map exists: 229 tables/34 enums) |
| 66–67 | Remove Microsoft OAuth if unused; keep Google only if intended | auth | Medium | Manual Founder (decision) |
| 68–71 | Signup/login/OTP/MFA flows correct + recovery + sessions | auth | Critical | Not Started (verify) |
| 72 | /admin: platform_admin only + MFA + re-auth + audit | admin | Critical | Partial (server role check exists; MFA pending) |
| 73 | /app: auth + active workspace + role + plan + workspace_id everywhere | app | Critical | Partial |
| 74 | /portals: scoped, no cross-workspace leakage | portal | Critical | Partial (scoping rebuilt; tests pending) |
| 75 | DB cleanup migration (indexes/FKs/constraints/timestamps/soft-delete) | db | High | Not Started |
| 76–78 | Perf checks, pagination, safe search limits | db | High | Partial |
| 79–81 | Server-side validation, safe optimistic UI, state surfaces | app | High | Partial (Zod on key routes) |

## H. Edge function / API tests (items 82–88) — Not Started (inventory + contract tests)
## I. Stripe full integration (items 89–108)

| # | Item | Sev | Owner | Status |
|---|------|-----|-------|--------|
| 89–92 | Product/price map; pricing+billing pages match Stripe; limits match entitlements | payments | High | Partial (live catalog built; entitlement reconciliation pending) |
| 93 | Subscription source-of-truth via webhook; no client-redirect unlock | payments | Critical | Implemented (webhook updates `workspaces.plan`) |
| 94 | Handle all webhook event types | payments | High | Partial (core events handled; `checkout.session.completed`, `payment_intent.*`, `dispute.created` pending) |
| 95 | Webhook replay/duplicate tests | payments | High | Implemented logic (0.7); test pending |
| 96–104 | Failed/cancel/trial/upgrade/downgrade/add-on/portal/refund tests | payments | High | Not Started |
| 105–108 | Stripe Connect (only if owners receive tenant payments) + separation | payments | High | Manual Founder (decision) — Not Started |

## J. R2 / storage security (items 109–118)

| # | Item | Sev | Owner | Status |
|---|------|-----|-------|--------|
| 109 | Storage architecture decision doc | storage | Medium | Not Started |
| 110 | Create R2 buckets (private/quarantine/public) | storage | High | External (Cloudflare) |
| 111–115 | Signed upload/download + metadata table + access checks | storage | High | Partial (server-proxied upload + authed stream done; signed-URL + metadata table pending) |
| 116 | Evidence-photo rules (assigned-job scope) | portal | Medium | Partial (`EvidenceUpload` exists) |
| 117–118 | Private-file access tests per role; deleted files purged from AI/search/exports | security | High | Not Started |

## K. Resend email (items 119–124) — Partial (provider wired); templates + audit log + domain verify pending. Owner: Claude + Manual Founder (DNS).
## L. Support + AI auto-response (items 125–129) — Not Started.
## M. Account deletion + SAR (items 130–136) — Not Started (tables + workers).
## N. GDPR/compliance docs (items 137–157) — In Progress (entity facts fixed; doc pack pending).
## O. AI Copilot security (items 158–164) — Partial (workspace boundary + limits done; injection tests + approval flows pending).
## P. Tenant/supplier/property logic (items 165–172) — Partial (jobs/suppliers/portals exist; ratings/complaint-reopen/referencing flag pending).
## Q. HMRC/MTD safety (items 173–178) — Manual Founder + feature-flag; keep disabled until tested.
## R. Vercel readiness (items 179–187) — In Progress. **`/api/health` (public) + `/api/ready` (admin-only, presence-booleans + last-webhook) Implemented.** Env-var audit, build settings, preview isolation, monitoring + safe error pages pending.
## S. DR / backups / maintenance mode (items 188–197) — Not Started (docs + maintenance flag + bug catcher).
## T. Changelog / announcements / newsletter (items 198–201) — Not Started.
## U. SEO / robots / llms / brand files (items 202–216) — **Implemented** core files (0.11); structured data + portfolio txts (MeasureDeck/OrbasCRM/GalaDock/CaptionFox) pending founder confirmation.
## V. WCAG 2.2 AA (items 217–219) — Not Started (audit + fixes + axe tests).
## W. Admin hardening (items 220–225) — Partial (admin exists + server role check; MFA/impersonation/audit coverage pending).
## X. Portal hardening tests (items 226–230) — Not Started (E2E per portal).
## Y. Pricing/add-ons/entitlements (items 231–235) — Partial (catalog + gates; entitlement service + matrix pending).
## Z. Affiliate programme (items 236–243) — Partial (pages + ledger exist, flagged off; Turnstile/fraud/admin pending).
## AA. Final browser testing (items 244–246) — Not Started (test accounts + data + full click-through).

---

## Session log — 2026-06-13 (batch 2)
Implemented + build-green this batch:
- **Legal entity corrected** — Blackwellen Ltd, Co. 16482166, ICO **ZC160806**, 3 real mailboxes (legal@/support@/info@). `src/lib/legal/company.ts` + all legal pages + footers (U/N).
- **Microsoft OAuth removed** (item 66/67) — login, register, connected-accounts, account login/index, integrations card + status route, stale FAQ roadmap. Google retained.
- **RLS coverage VERIFIED** (item 16) — `scripts/audit-rls.mjs`: **229/229 base tables RLS-enabled, 0 disabled**. 7 deny-all tables reviewed (service-internal, fail-closed). `RLS_SECURITY_AUDIT.md` refreshed. Behavioural leakage tests still pending.
- **Account deletion + SAR** (items 130–134) — `account_deletion_requests` + `data_export_requests` tables (RLS, one-open-per-user), `POST /api/account/request` with **password re-auth**, data-privacy page fully wired (was mock). Erasure/export **worker** intentionally deferred (destructive — item 135).
- **Stripe event coverage** (item 94) — added `checkout.session.completed`, `payment_intent.succeeded/payment_failed`, `charge.dispute.created`, `account.updated`. + webhook **idempotency** (batch 1).
- **Stripe Connect (Standard)** (items 105–107) — owners' OWN accounts, separate from SaaS billing, **feature-flagged off**: `stripe_connect_accounts` table, `connect.ts`, `/api/connect/onboard` (owner-only) + `/api/connect/status`, `account.updated` sync, `docs/release/stripe-connect-setup.md`.
- **Compliance pack** (items 137–157, partial) — `docs/compliance/`: data-map, ROPA, retention-schedule, subprocessor-register, SAR runbook, breach runbook + index.
- **Health/readiness** — `/api/health`, `/api/ready` (batch 1).

## AGENT EXECUTION BACKLOG (drive to completion)

In-repo, agent-completable (A#). External/founder-blocked (X#) — agents scaffold + document only.

| ID | Task | Maps to | Status |
|----|------|---------|--------|
| A1 | Maintenance-mode flag + safe error pages (404/403/500/maintenance/payment-required/workspace-not-found/subscription-inactive/portal-expired/invite-expired) | 187, 194 | Done (agent) |
| A2 | Cookie consent banner + gating (necessary-only pre-consent; analytics/marketing post-consent; preferences) + cookie-audit.md | 155, 147 | Pending |
| A3 | App-side rate limiting on auth/signup/reset/OTP/invite/contact/support/newsletter/affiliate via Supabase-backed store + safe errors | 51–54 | Pending |
| A4 | Newsletter signup (consent + suppression + rate limit) + Turnstile hook (key-gated) | 200, 31 | Pending |
| A5 | Changelog + announcements system (public + in-app + admin editor, sanitised) | 198–199, 201 | Pending |
| A6 | Admin sections: SAR requests, deletion requests, Stripe events, security events, AI usage, email logs (read views + audit) | 221–225 | Pending |
| A7 | Global error boundary + bug-catcher (route ctx, safe refs, admin bug inbox) | 197 | Pending |
| A8 | Entitlement service (Stripe state → plan/add-on flags; server-enforced) + remaining gates (portal/white-label/SSO/automation/reports) | 234, 19–21 | Pending |
| A9 | XSS-safe rendering audit + fixes (notes/comments/filenames/AI/rich-text/announcements) | 37 | Pending |
| A10 | Supplier rating model + tenant complaint/reopen flow + preferred-supplier | 165–170 | Pending |
| A11 | Account: email change, password change, session list, sign-out-all, MFA setup (TOTP) | 70–71, 130 | Pending |
| A12 | Audit-log coverage: write entries on all sensitive mutations (login/role/CRUD/file/export/billing/admin/AI) | 49–50 | Pending |
| A13 | WCAG 2.2 AA pass (focus, contrast, labels, modal traps, skip links, tap targets, reduced motion) + wcag doc | 217–219 | Pending |
| A14 | Remaining compliance/release docs (lawful-basis, dpia-screening, ai-copilot-risk, international-transfer, cookie-audit, pen-test-lite, cloudflare-setup, DR plan, vercel-readiness) | 137–152, 179–193, 57 | Done (agent) |
| A15 | Erasure/export WORKER (admin-triggered, dry-run first, audited) — careful/destructive | 135 | Pending (gated) |
| X1 | Cloudflare config + Turnstile keys | 55–58 | Founder/External |
| X2 | Upstash (optional hard rate-limit edge) | 52 | Founder/External |
| X3 | Stripe Connect activation in dashboard | 105 | Founder (doc ready) |
| X4 | Resend domain verification (SPF/DKIM/DMARC) | 119 | Founder/DNS |
| X5 | HMRC/MTD dev app + live submission | 173–177 | Founder/Legal |
| X6 | Supabase backups plan + restore test | 190–191 | Founder/External |

### Agent batches 1–4 complete (2026-06-13/14, build-green 227 pages, tsc-clean)
- **Batch 1:** A1 maintenance+error pages · A2 cookie consent · A3 rate limiting · A6 admin ops views · A14 9 docs.
- **Batch 2:** A8 entitlement service+gates · A12 audit-log coverage · A5 changelog+announcements.
- **Batch 3:** A4 newsletter (consent/double-opt-in/suppression/Turnstile hook) · A11 account security + TOTP MFA · A10 supplier ratings + tenant complaint/reopen + preferred supplier.
- **Batch 4:** A7 error-boundary bug-catcher (+admin inbox) · A15 GDPR erasure/export worker (dry-run gated) · A9 XSS verified.
- **A13 WCAG** — first conformance pass (in progress).
- 8 migrations applied (000001–000008). Footer email → info@. Admin nav: OPS (data-requests/bugs/stripe-events/ai-usage) + COMMS (changelog/announcements).

External/founder still required (X1–X6): Cloudflare+Turnstile keys, Stripe Connect activation, Resend DNS, Supabase MFA add-on + backups plan, HMRC. Behavioural test suites (RLS leakage E2E, IDOR sweep, role/subscription tests) remain for the Critical release gate — see SIGNOFF.

### Done (earlier batches)
`/api/health`+`/api/ready`, RLS verify, Stripe events+idempotency, account deletion/SAR, Stripe Connect scaffold, core compliance pack, legal entity, MS-OAuth removal.
