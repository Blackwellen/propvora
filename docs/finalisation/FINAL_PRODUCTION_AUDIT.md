# Propvora — Final Production Audit

**Product:** Propvora · **Legal owner:** Blackwellen Ltd (Co. 16482166; ICO ZC160806)
**Generated:** 2026-06-15 · **Build:** Next.js 16.2 / React 19.2 / Tailwind v4 / Supabase

This is the consolidated, honest snapshot of what is **built**, what is **verified**, and
what **remains** before general availability. It supersedes the earlier stage-trackers
(`FINAL_RELEASE_AUDIT.md` reflected the Wave-3 state). The authoritative go/no-go is
`docs/release/PROP-VORA-RELEASE-SIGNOFF.md`.

---

## 1. What is built

### Application surface
- Full `/app` workspace: Portfolio, Money, Work, Compliance, Planning, Legal, Accounting,
  Automations, Contacts, Calendar, Messages, plus Account/Workspace settings — all wired
  to the live Supabase schema (no mock data; no phantom tables).
- Public/marketing site, auth flows (login/register/reset/onboarding/invite), and a
  platform admin console (`/admin`).
- AI Copilot panel + `⌘K` command palette; Guided Help engine.

### Five systems added this cycle
| System | Where | Notes |
|---|---|---|
| Multi-provider AI gateway + caps | `src/lib/ai/*`, `/api/ai/*` | OpenAI default; OpenRouter/Gemini/NVIDIA/Anthropic; env-only keys; fail-closed hard caps + metering. |
| Double-entry accounting ledger | `src/lib/accounting/*`, `/app/accounting` | Balanced, ≥2 lines, immutable posted entries; pence integers; DB-enforced. |
| Smart-rules automation engine | `src/lib/automation/*`, `/app/automations` | Trigger→condition→action; review-first with human approve/skip; run log. |
| Legal hardening + possession wizard + court bundle | `src/lib/legal/*`, `/app/legal` | Validity snapshots from live data; DRAFT-watermarked court bundle; review-only. |
| Notifications + command palette | `src/lib/notifications/*`, `src/lib/copilot` | RLS-safe notify across the workspace; `⌘K` palette. |

### Portals & affiliate
- Account-based tenant/landlord/supplier portals + recipient magic-link share links
  (`/p/[token]`), all behind `NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED`.
- Affiliate programme (two enrolment doors, one cash-commission ledger); payouts
  feature-flagged off; commission accrues and reverses on refund/dispute.

### Platform & infra surfaces
- Stripe billing (Checkout, Billing Portal, signed/idempotent webhooks; Connect off).
- Cloudflare R2 private file storage with workspace-prefixed, fail-closed access.
- Resend email; `/api/health` + `/api/ready`; maintenance mode; safe error pages.
- Dedicated **mobile component system** (`src/components/mobile/*`: bottom nav, sheets,
  responsive tables, breakpoint hook) for phone/tablet layouts.
- Security hardening: admin MFA, upload MIME sniffing/size caps, supplier RLS, app-side
  rate limiting, cookie consent, GDPR export/erasure request flows.

---

## 2. What is verified (live evidence)

Run with `npm run test:security` (`scripts/test/run-all.mjs`, 10 suites). Latest results:

| Area | Result | Source |
|---|---|---|
| Schema alignment | **0** mismatches | `npm run audit:schema` |
| RLS coverage | **195/195** `workspace_id` base tables RLS-enabled | `docs/finalisation/RLS_POLICY_MATRIX.md` |
| Cross-workspace IDOR | **0 leaks / 96 assertions** | `scripts/test/idor-sweep.mjs` |
| Anonymous exposure | **0 rows / 31 assertions** | `scripts/test/anon-exposure.mjs` |
| API auth/authz | every tenant route = auth + membership/role on top of RLS | `docs/finalisation/API_SECURITY_MATRIX.md` |
| Billing catalog ↔ LIVE Stripe | **54/54** checks | `scripts/test/billing-reconcile.mjs` |
| Stripe webhook coverage | **17/17** checks | `scripts/test/billing-webhooks.mjs` |
| Entitlement gates E2E | **66/66** (every tier + live storage) | `scripts/test/billing-entitlements-e2e.mjs` |
| TypeScript | 0 errors | `npm run typecheck` |

Defence-in-depth conclusion (API matrix): no route reads/writes another workspace's data
without a membership / owner / platform-admin / portal-session / Stripe-signature trust
anchor. No route relies on RLS alone.

---

## 3. Known gaps & observations

These are tracked, not hidden. None are data-exposure or IDOR holes.

- **4 default-deny tables** (`activity_logs`, `bug_reports`, `mail_oauth_states`,
  `share_link_rate_limits`) have RLS on but **0 policies** — safe (service-role-only
  write surfaces), but mark unfinished surfaces.
- **`email/welcome`** is unauthenticated (low; email-spam vector, no DB writes). Suggested
  hardening: per-IP rate limit.
- **`email/invite`** does not re-check the inviter's workspace role (low; rate-limited).
- **Validation style is mixed** — newer routes use zod, older ones use `typeof` guards;
  functionally equivalent, no auth hole.
- **Behavioural test depth** — automated suites are green, but full browser E2E breadth,
  an external pen-test, and a formal WCAG AA sweep are still outstanding (see §4).

---

## 4. What remains before GA (owner / external)

- **Lint/CI gates** wired into the pipeline (block on `lint` + `typecheck` + `test:security`).
- **Owner infrastructure:** Cloudflare + Turnstile keys, Vercel **production** env +
  custom domain, Supabase PITR/backups + restore test, Resend domain (SPF/DKIM/DMARC),
  Stripe **LIVE** verification (TEST-mode card/lifecycle matrix in `BILLING_E2E.md` §2–3).
- **Performance deep-pass** (Core Web Vitals on real routes) and a **formal WCAG 2.2 AA
  audit** (first conformance pass done — `docs/compliance/wcag-2-2-aa-audit.md`).
- **External penetration test** (brief: `docs/release/external-pentest-brief.md`).

---

## 5. Explicit scope gate

**International expansion is a post-V1 upgrade.** The plans in `docs/upgrade/` (country
packs, i18n, global marketplace, KYC/escrow) are **GATED — NOT ELIGIBLE TO START** until
UK V1 is signed off, and every country pack requires qualified local legal/tax review.
Nothing in the international plan is part of the V1 release surface.

---

## 6. Verdict

The **product and data layer are in strong shape**: schema-aligned, RLS 7/7 with live
isolation proof, every section wired, billing reconciled, the five systems and portals
shipped, and a mobile system in place. Propvora is **not yet production-ready** — the
remaining blockers are owner-controlled infrastructure, CI gates, and external assurance
(pen-test, WCAG, performance), not core application defects. See the sign-off for the
binding checklist.
