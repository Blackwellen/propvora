# PROPVORA — RELEASE SIGNOFF

**Product:** Propvora · **Legal owner:** Blackwellen Ltd (Reg. England & Wales No. 16482166; ICO ZC160806)
**Document owner:** Founder (Blackwellen Ltd) · **Last updated:** 2026-06-13

## Decision

> ❌ **NOT RELEASE-READY.** This product is **not** approved for public/general
> availability. Multiple Critical and High items in `PROP-VORA-MAX-RELEASE-TODO.md`
> are not yet Implemented/Tested/Passed. See the gate table below.

A **controlled private beta** may be considered only after the Critical gates below
are Passed (see "Minimum beta gate").

## Release gate — Critical items (all must be **Passed**)

| Gate | Status | Blocker summary |
|------|--------|-----------------|
| RLS enforced + tested on every table | ⬜ Not Passed | No automated multi-workspace leakage test suite yet (TODO 16–18). |
| Multi-workspace data isolation proven | ⬜ Not Passed | Needs role/workspace boundary E2E (TODO 17). |
| Server-side subscription gating (no client-only) | 🟡 Partial | Seat/AI/storage gates implemented server-side; full entitlement service + tests pending (TODO 19–21, 234). |
| Payments are webhook-sourced, no client-redirect unlock | ✅ Implemented | Webhook updates plan; signature + replay protection in place (TODO 93, 95). Test pass pending. |
| IDOR tested on all detail pages + API routes | ⬜ Not Passed | No IDOR sweep yet (TODO 41). |
| File upload abuse controlled (MIME/size/path) | 🟡 Partial | Allowlist + size + sanitised key done; scan pipeline + signed-URL + per-role access tests pending (TODO 42–44, 117). |
| Admin protected (role + MFA + audit) | 🟡 Partial | Server role check exists; MFA + full audit coverage pending (TODO 72). |
| No secrets in client; service role server-only | ✅ Implemented | Audited; see pentest doc (TODO 48 partial). |
| Auth abuse protection (brute-force/OTP/reset) | ⬜ Not Passed | Needs rate-limit store + Turnstile (TODO 24–34, 52, 55). |
| Account deletion + SAR flows exist | ⬜ Not Passed | Not built (TODO 130–136). |
| GDPR compliance pack + cookie consent | 🟡 Partial | Entity facts + legal pages corrected; doc pack + consent gating pending (TODO 137–157). |
| DR/backup/maintenance-mode | ⬜ Not Passed | Not built (TODO 188–197). |

## Minimum beta gate (controlled private beta only)

Before inviting **trusted** beta users:
1. ⬜ RLS multi-workspace isolation **test suite** green (TODO 16–18). _Enablement verified (241/241); behavioural tests still needed._
2. ⬜ IDOR sweep on detail pages + API routes (TODO 41).
3. 🟡 Auth + form rate limiting — ✅ **app-side limiter live** (login/signup/reset/OTP/invite/data-request, Supabase store); still need a shared edge store + Turnstile keys on public forms (TODO 52, 55 — external).
4. ✅ Account deletion + data-export request flow — **built** (re-auth request flow + dry-run gated worker; TODO 130–136).
5. ✅ Cookie consent gating analytics/marketing — **built** (banner + `hasConsent()`; TODO 155).
6. ✅ Maintenance mode + safe error pages — **built** (TODO 187, 194).
7. 🟡 Stripe webhook event coverage — ✅ all key events + idempotency handled; manual replay/failed-payment **test** still to run (TODO 94–98).
8. ✅ `/api/health` + `/api/ready` — **built** (monitoring wiring still external).

Remaining beta blockers: items 1, 2, and the external keys for 3.

## Evidence already on file (build-green this pass — 227 pages, tsc clean)
- Schema audit **0** (`scripts/audit-queries.mjs`); RLS **241/241 enabled** (`scripts/audit-rls.mjs`).
- Server-side gates + entitlement service (`src/lib/billing/gates.ts`, `entitlements.ts`).
- Webhook signature + idempotency + full event coverage (`src/app/api/webhooks/stripe/route.ts` + migration).
- Security headers (`next.config.ts`); upload hardening (`src/app/api/upload/route.ts`).
- Correct legal entity (`src/lib/legal/company.ts`; legal pages + footer; ICO ZC160806).
- App-side rate limiting (`src/lib/rate-limit.ts`); audit-log coverage (`src/lib/audit/log.ts`).
- Account deletion + SAR (`/api/account/request` + erasure/export worker, dry-run gated).
- Cookie consent (`src/lib/consent.ts`); maintenance mode + safe error pages; `/api/health`+`/api/ready`.
- Admin ops views (data-requests, bugs, stripe-events, ai-usage); changelog + announcements.
- Account security + TOTP MFA; newsletter (consent/double-opt-in); supplier ratings + tenant complaints.
- Bug-catcher; WCAG first conformance pass (`docs/compliance/wcag-2-2-aa-audit.md`).
- Stripe Connect (Standard, owners' own accounts) scaffold — feature-flagged off (`docs/release/stripe-connect-setup.md`).
- Compliance pack (11 docs in `docs/compliance/`); release docs (`docs/release/`).

## What is NOT done (must close before GA)
Behavioural test suites (RLS leakage E2E, IDOR sweep, role/subscription tests, full browser E2E), external pen-test, and the external/founder items: Cloudflare+Turnstile, Stripe Connect activation, Resend DNS (SPF/DKIM/DMARC), Supabase MFA add-on + backups/DR test, HMRC/MTD. WCAG full AA (first pass done; contrast/SR/keyboard sweeps remain).

## Sign-off record
| Role | Name | Decision | Date |
|------|------|----------|------|
| Founder / Director, Blackwellen Ltd | — | Pending | — |
| Security reviewer | — | Pending | — |
| Data protection (ICO ZC160806) | — | Pending | — |

_No signature below constitutes release approval until every Critical gate above is **Passed**._
