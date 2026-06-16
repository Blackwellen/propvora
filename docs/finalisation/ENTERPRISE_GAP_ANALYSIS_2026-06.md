# Propvora v2 — Enterprise / Functional Gap Analysis

**Date:** 2026-06-15
**Branch:** `Propvora-release-version.2.0`
**Scope:** Judges Propvora v2 (multi-sided marketplace: operator + supplier + customer
workspaces, marketplace, booking, escrow payments via Stripe Connect, KYC, automation,
admin control plane + risk, international framework) against what an **enterprise-grade
multi-sided platform** requires.
**Nature:** Analysis only — no app code was modified.

> Method: read the v2 substrate directly (`src/lib/payments`, `marketplace`, `booking`,
> `identity`, `risk`, `automation`, `context`, `observability`, `account`, `international`),
> the route handlers under `src/app/api/*`, the proxy guard, CI, and the existing audit
> docs. Findings are file-grounded. Where a module *records intent but never executes it*,
> or is a **signal masquerading as a control**, it is called out explicitly.

---

## 1. Executive summary

Propvora v2 is an unusually **honest** and **well-isolated** codebase. The data-isolation
story is genuinely strong: 48/48 v2 tables have RLS enabled with zero cross-workspace or
anon leaks proven by a live probe (`docs/finalisation/V2_RLS_ISOLATION_MATRIX.md`,
`scripts/test/v2-rls-matrix.mjs`). The money state-machine is idempotent and append-only,
the webhook handlers verify signatures and dedupe, and modules are candid in their own
docstrings about being "signals, not determinations." That candour is the platform's best
quality — but it also pinpoints exactly where the enterprise gaps are: **several v2
surfaces record intent and stop there.**

The three structural gaps that most separate this from an enterprise platform:

1. **Automation v2 has no executor.** The inbound webhook receiver enqueues
   `automation_v2_runs` rows with `status='queued'` and returns `202` — but **nothing ever
   consumes a queued run.** There is no worker, cron, or queue drainer. (The *v1*
   `smart_rules` engine executes synchronously and is fine; the *v2* definition/run system
   is record-only.) This is the single clearest "intent without an executor" in the repo.
2. **Trust & safety is a signal layer, not a compliance layer.** Sanctions "screening" is a
   banned-country list + naive substring name match (`src/lib/identity/screening.ts`, which
   says so itself). There is no licensed sanctions/PEP/AML provider, no real-time fraud
   engine, and no marketplace content moderation. KYC *plumbing* for Stripe Identity exists
   but the session-create call is left to "a future server action."
3. **No background-job / scheduling infrastructure at all.** No `vercel.json` cron, no
   queue, no worker process. Reconciliation, payout sweeps, retention/erasure, dispute SLAs,
   and digests are all either manual-trigger or unbuilt. An enterprise platform cannot run
   escrow + payouts + GDPR timers off synchronous request handlers alone.

Everything else ranges from solid (RLS, money ledger, observability shape, GDPR erasure
worker, MFA) to thin-but-present (search is ILIKE; integrations are status-only; testing is
real but narrow). Nothing critical is *faked* — the issues are missing executors and missing
external providers, not lies.

### Overall enterprise-readiness scorecard

| # | Dimension | Rating |
|---|-----------|--------|
| 1 | Identity, auth & access | **Adequate** |
| 2 | Multi-tenancy & data isolation | **Strong** |
| 3 | Payments & financial integrity | **Adequate** (one P0: no payout/recon scheduler) |
| 4 | Trust & safety (KYC/AML/fraud/moderation) | **Critical Gap** |
| 5 | Reliability & ops (jobs/queues/observability) | **Gap** (no worker = P0) |
| 6 | Compliance & legal (GDPR/audit/residency) | **Adequate** |
| 7 | Notifications & comms | **Gap** |
| 8 | Search & scale | **Gap** |
| 9 | Testing & CI | **Adequate** |
| 10 | Admin & governance | **Adequate** |
| 11 | APIs & integrations (OTA/accounting/calendar) | **Critical Gap** |

Rating key: **Strong** = enterprise-ready · **Adequate** = works, needs hardening ·
**Gap** = partially built / thin · **Critical Gap** = absent or signal-only where a real
control is required.

---

## 2. Per-dimension findings

### 1 — Identity, auth & access — *Adequate*

**Exists**
- **Proxy auth guard** (`src/proxy.ts`): fail-closed maintenance mode, precise protected-prefix
  matching (`/app`, `/supplier-portal`, `/admin`, exact `/affiliate`), auth→app redirect, and
  an additive, fail-open v2 `routeContext` guard that enforces workspace-type/country rules via
  `@/lib/context`. The affiliate-vs-affiliate-programme prefix gotcha is handled correctly.
- **RBAC / permission model** (`src/lib/context/permission-context.ts`,
  `actor-context.ts`): coarse capability booleans (`canManageWorkspace`, `canManageMoney`,
  `canAdminister`, …) derived from workspace role + workspace type + country posture. The
  docstring is explicit that **RLS is the real boundary** and these are UI/pre-empt gates —
  correct posture.
- **MFA is real**, not a stub: `src/app/(app)/app/account/security/page.tsx` uses
  `supabase.auth.mfa.enroll/challenge/verify/listFactors` (TOTP, QR data-URI, recovery codes).
  Admin console enforces **aal2 step-up** (`src/lib/admin/guard.ts` →
  `getAuthenticatorAssuranceLevel`, `challenge` when a factor is enrolled but session is aal1).

**Gaps / thin**
- **MFA is opt-in for everyone except admins.** A workspace user with no enrolled factor is
  never required to add one; there is no org-level "require MFA" policy. Enterprise buyers
  expect a tenant-enforceable MFA mandate. *(M, P1)*
- **SSO / SAML is entitlement-only.** `ssoSaml: true` exists in `TIER_FEATURES`
  (`src/lib/billing/entitlements.ts`) for `pro_agency`/`enterprise`, but **there is no SAML/OIDC
  implementation** — no IdP metadata, no SCIM, no enforced-domain login. Selling an "enterprise
  SSO" entitlement with no backing implementation is a roadmap-vs-reality risk. *(L, P1)*
- **Session security**: relies on Supabase defaults. No documented session-revocation-on-role-change,
  no device/session list management surfaced, no configurable idle timeout. *(M, P2)*

**Requirement to close:** (a) tenant-level "enforce MFA" policy + proxy/guard step-up for
member routes; (b) either implement SAML/OIDC SSO + SCIM provisioning, or relabel the
entitlement as roadmap until built; (c) session inventory + revoke-all + role-change session
invalidation.

---

### 2 — Multi-tenancy & data isolation — *Strong*

**Exists**
- `docs/finalisation/V2_RLS_ISOLATION_MATRIX.md` + `scripts/test/v2-rls-matrix.mjs`: a **live**
  probe over **48 v2 tables** — 48/48 present, 48/48 RLS-enabled, **0 cross-workspace/anon leaks,
  0 failures.** Append-only ledgers (`marketplace_commission_ledger`, `payout_ledger`) have
  `BEFORE UPDATE/DELETE` immutability triggers, verified present.
- Seeded cross-tenant proofs exist separately: `scripts/test/idor-sweep.mjs`,
  `scripts/test/anon-exposure.mjs`, `scripts/test/role-within-workspace.mjs`.
- Workspace context resolution (`src/lib/context/workspace-context.ts`) + the route-context
  guard give a clean per-request tenant boundary.

**Gaps / thin (hygiene, not isolation defects — from the matrix's own "Gaps found")**
- **Duplicate anon public-read policies** on `marketplace_listings`
  (`marketplace_listings_public_read` + `public_read`, both `status='active'`) — consolidate to
  one named policy to prevent future drift. *(S, P2)*
- **Publish-state mismatch**: anon browse is keyed to `status='active'`, but the workspace UI
  publishes to `status='published'` (and `searchListings` filters on `'published'`). Anonymous
  shoppers may therefore see *nothing* even when operators have "published." Confirm the single
  canonical live-state and align the policy + publish flow + search filter. *(S, P1 — product-blocking)*
- Several `live=0` tables (e.g. `partner_relationships`) are proven isolated *structurally* only;
  re-run seeded proofs once populated. *(S, P2)*

**Requirement to close:** consolidate the listing policies and unify the
`published`/`active` state across RLS policy, publish action, and `searchListings`.

---

### 3 — Payments & financial integrity — *Adequate*

**Exists (genuinely good)**
- **Verified-event state machine** (`src/lib/payments/webhooks.ts`): the *only* place money
  state flips. Driven exclusively by signature-verified Stripe events; every transition is a
  **conditional/idempotent UPDATE** (`.in("status", [...])` / `.neq(...)`) so a replay can't
  double-apply; ledgers are **append-only INSERT only**. Handles capture, manual-capture auth,
  refund (+ partial), transfer/escrow-release, payout settlement, and `account.updated` Connect
  sync.
- **Idempotency**: `src/app/api/payments/webhook/route.ts` dedupes on `event.id` via
  `payments_webhook_events` (RLS deny-all, service-role write) with a unique-index backstop, and
  **does not record the event id on failure** so Stripe retries reprocess. Raw-body signature
  verification is correct; dedicated `STRIPE_PAYMENTS_WEBHOOK_SECRET` with fallback.
- **Reconciliation** (`src/lib/payments/reconciliation.ts`): read-only drift report — transaction
  vs commission-ledger sum, payout vs payout-ledger sum, captured-without-escrow,
  payout-without-transaction. Refund/dispute statuses are correctly excluded from mismatch flags.
- **Connect onboarding** (`src/app/api/connect/onboard/route.ts`): owner-only, Standard accounts,
  resume-or-create, hosted account links, status sync. Propvora never custodies funds.
- `marketplace-fees.test.ts` + `ledger.test.ts` cover fee math and ledger invariants.

**Gaps / thin**
- **No payout / reconciliation scheduler (P0).** `reconcilePayments` and payout summaries are
  read-only and **only run when something calls them** (`/api/payments/reconcile`). There is no
  scheduled sweep to detect drift, no automatic escrow-release-on-condition timer, no retry of
  failed transfers. An escrow platform needs a recurring reconciliation + payout job. *(M, P0)*
- **Tax handling is jurisdiction reference data, not transaction tax.** `country_tax_rules` /
  `src/lib/international/tax.ts` describe rates; there is **no VAT/GST calculation, invoicing
  with tax lines, or tax reporting** on actual marketplace transactions. No Stripe Tax. *(L, P1)*
- **Refund initiation is webhook-reactive only.** The handler processes `charge.refunded`, but the
  operator-initiated refund *action* (`src/lib/payments/refunds.ts`) should be audited for partial-
  refund + commission-clawback edge cases against the ledger. *(M, P1)*
- **Double-entry is single-sided in practice.** Ledgers are append-only and signed (negatives for
  reversals), which is good, but there is no enforced balanced double-entry (debits == credits)
  invariant or a periodic trial-balance assertion. *(M, P2)*
- Reconciliation is **read-only by design** — it reports drift but nothing acts on a discrepancy
  (no alert, no auto-quarantine). *(S, P1)*

**Requirement to close:** a scheduled worker that (a) runs platform-wide reconciliation and
raises alerts/risk-events on any discrepancy, (b) releases escrow when release conditions are met,
(c) retries failed payouts; plus real transaction-level tax (Stripe Tax or equivalent) and a
trial-balance check.

---

### 4 — Trust & safety — *Critical Gap*

**Exists**
- **KYC plumbing** (`src/lib/identity/verification.ts`): records the verification trail, builds
  Stripe Identity `VerificationSession` params, maps `identity.verification_session.*` webhooks to
  status, and gates selling via `requireVerifiedForSelling` (Connect-enabled **or** standalone
  verified). `setVerificationStatus` is the only mutator and is never client-driven. Honest.
- **Dispute engine** (`src/lib/marketplace/disputes.ts`): real lifecycle
  (`open→under_review→resolved/rejected/escalated`), `can_resolve_dispute` SECURITY DEFINER
  authority, audited, and explicitly refuses to report a resolution unless the DB write succeeded.
  Admin UI exists (`src/app/(admin)/admin/marketplace/disputes`).
- **Risk engine** (`src/lib/risk/*`: `engine.ts`, `rules.ts`, `signals.ts`) + `risk_events` /
  `risk_scores` tables (RLS admin-scoped).

**Gaps / thin — the core problem**
- **Sanctions/AML screening is a signal, not a control (Critical).** `screenAgainstSanctions`
  (`src/lib/identity/screening.ts`) checks a country against the `country_packs` banned list
  (RU/IR/KP/SY) and does a **naive case-insensitive substring** match against a caller-supplied
  watchlist. The module's own header says: *"NOT sanctions/AML clearance … Definitive
  sanctions/PEP screening requires a licensed provider and legal review."* There is **no
  ComplyAdvantage / Onfido / Sumsub / Refinitiv** integration. *(L, P0 for a money platform)*
- **Stripe Identity is wired but not invoked.** `buildVerificationSessionParams` assembles params
  but the `verificationSessions.create` call is left to "a future server action" — so end-to-end
  document KYC is **not actually runnable** today. *(M, P0)*
- **No marketplace content moderation.** Listings/reviews/messages have no profanity/abuse/illegal-
  content screening, no image moderation, no report-and-takedown queue. For a public,
  cross-workspace marketplace this is a launch blocker. *(L, P1)*
- **Fraud engine is rules-only and not real-time.** `risk/engine.ts` evaluates signals but there's
  no velocity/anomaly detection on transactions, no device fingerprinting, no Stripe Radar wiring,
  and (per dimension 5) no scheduled re-scoring. *(M/L, P1)*

**Requirement to close:** integrate a licensed sanctions/PEP/AML provider with ongoing
monitoring; finish the Stripe Identity session-create + webhook loop so document KYC actually
runs; add a content-moderation + report/takedown pipeline; wire Stripe Radar and add transaction
velocity/anomaly rules with scheduled re-scoring.

---

### 5 — Reliability & ops — *Gap (no worker is P0)*

**Exists**
- **Observability** (`src/lib/observability/index.ts`): Sentry-ready (`registerSink`), degrades to
  structured `console.*`, PII-scrubbing tag allowlist, request-id correlation
  (`requestIdFrom`/`newRequestId`). Used across route handlers (`captureException`). Solid shape —
  **but no sink is actually registered** (Sentry DSN integration is "later").
- **Rate limiting** (`src/lib/rate-limit.ts`): Supabase-backed fixed-window limiter (RLS deny-all
  store), applied to sensitive endpoints incl. the public automation webhook receiver. Fails open
  on store error.
- **Idempotency**: payments + billing webhooks dedupe on event id (see dimension 3).
- Tolerant DB access everywhere (42P01/PGRST205 swallowed) so cold/migrating DBs render empty
  states, not 500s.

**Gaps / thin — the structural hole**
- **No background-job / queue / scheduler infrastructure at all (P0).** No `vercel.json`
  (confirmed absent), no cron route, no worker, no queue. **Consequence:** the
  `automation_v2_runs` queue is never drained (dimension 4-of-automation below), reconciliation/
  payout sweeps don't run, GDPR erasure/retention timers don't fire, dispute SLAs aren't enforced,
  digests aren't sent. This is the single biggest ops gap. *(L, P0)*
- **Automation v2 "queued" runs have no executor (P0 — intent without executor).** The public
  receiver (`src/app/api/automations/trigger/[token]/route.ts`) inserts a run with `status='queued'`
  and returns `202 {status:"queued"}`. Grep confirms the **only** code touching
  `automation_v2_runs` is the inserter + the read-side `runs.ts` lib — **nothing transitions a
  queued run to running/succeeded.** The route's own comment ("downstream review/approval decides
  whether any action ever executes") describes a downstream that **does not exist** for the v2
  system. Inbound webhooks are therefore accepted and silently parked forever. *(M, P0)*
- **Observability sink not wired.** Errors only reach `console` until a Sentry/APM adapter is
  registered at startup. No alerting, no uptime SLO dashboards. *(S, P1)*
- **Rate limiter fails open** and is fixed-window (burst-prone at boundaries); no distributed
  token-bucket, no per-tenant quotas. Acceptable for V1, thin for enterprise. *(M, P2)*
- No documented caching strategy (search/listings/reference data are uncached). *(M, P2)*

**Requirement to close:** introduce a real job runner (Vercel Cron + a `/api/jobs/*` worker set,
or a queue like QStash/Inngest/pg-cron) and wire: the automation-v2 run executor, scheduled
reconciliation/payout/escrow-release, retention/erasure timers, dispute SLA escalation, and
digests. Register a Sentry sink and add alerting.

---

### 6 — Compliance & legal — *Adequate*

**Exists (strong for its size)**
- **GDPR erasure worker** (`src/lib/account/erasure.ts`): `previewErasure` is always a dry run;
  `executeErasure` is **double-gated** (`ACCOUNT_ERASURE_ENABLED` env kill-switch **and** explicit
  `confirm`), per-step audited, fail-isolated, deletes/anonymises a documented PII plan, **retains**
  financial/audit/legal records with stated reasons, and removes the auth identity last. This is a
  genuinely careful implementation.
- **Data export** (`src/lib/account/export.ts`) exists alongside erasure.
- **Audit log** (`src/lib/audit/log.ts` via `recordAudit`) is called consistently across automation,
  disputes, erasure, payments-adjacent flows; retained as tamper-evident record.
- **International framework** (`src/lib/international/*`): country packs, jurisdiction profiles,
  tax-rule reference, guardrails; `data_region`/`data_residency` reference data present in the schema
  (`jurisdiction_profiles`, `country_packs` are anon-public reference).
- Marketplace legal docs surfaced publicly (`marketplace_legal_documents`, anon-readable).

**Gaps / thin**
- **Erasure has no scheduler** — it's an on-demand admin/API action; the 30-day deletion SLA
  implied by `account_deletion_requests.status='scheduled'` is **not enforced by any timer**
  (depends on the missing job runner). *(M, P1)*
- **Data residency is descriptive, not enforced.** `data_region` exists as reference data but the
  app stores everything in one Supabase region — there's no per-tenant regional routing or storage
  partitioning. Enterprise/EU buyers may require real residency. *(L, P2 unless contractually needed)*
- **Consent** (`src/lib/consent.ts`, `/api/consent`) exists but audit completeness for marketing/
  cookie/processing-basis changes should be verified end-to-end. *(S, P2)*
- No DPA/sub-processor register surfaced as data (only UI pages). *(S, P2)*

**Requirement to close:** schedule erasure/retention timers; decide on real data residency vs
documented single-region; verify consent-change audit coverage.

---

### 7 — Notifications & comms — *Gap*

**Exists**
- **In-app notifications**: real table + writes (automation `executeAction` inserts
  `notifications`; severity, entity linkage, dedupe via metadata).
- **Email via Resend**: `src/lib/emails/*`, `/api/email`, `RESEND_API_KEY` status surfaced.
- **Outbound webhooks**: `automation_webhook_endpoints` / `automation_webhook_deliveries` exist —
  but these are **inbound** receivers; see gap below.

**Gaps / thin**
- **No webhooks-OUT to customers.** The "webhook" system is an *inbound* trigger receiver. There is
  no platform→customer outbound event delivery (signed payloads, retries, delivery log) that an
  enterprise integrator expects. *(M, P1)*
- **No digests / scheduled emails** (depends on the missing job runner): no daily/weekly summaries,
  no dunning emails, no dispute/payout notifications on a schedule. *(M, P1)*
- **Notification preferences** exist as a table but channel routing (email vs in-app vs none per
  event type) and quiet-hours are thin. *(S, P2)*
- Email deliverability hardening (DKIM/SPF/DMARC verification status surfaced, bounce handling) not
  evidenced in-app. *(S, P2)*

**Requirement to close:** build an outbound-webhook delivery service (signing + retry + log);
scheduled digest/transactional email jobs; richer per-event preference routing.

---

### 8 — Search & scale — *Gap*

**Exists**
- `src/lib/marketplace/search.ts`: cross-workspace search over `status='published'` listings,
  safe public-column projection, single-thumbnail join, clamped pagination
  (`page`/`pageSize`, max 100), filters (category, type, country, price range, location), and
  PostgREST-injection-safe ILIKE sanitisation (`sanitizeIlikeTerm`). Tolerant on cold DB. Ordered
  by `published_at` then `created_at`.

**Gaps / thin**
- **Search is ILIKE substring, not real search.** `title.ilike.%term% , description.ilike.%term%`
  — no full-text (`tsvector`/`websearch_to_tsquery`), no relevance ranking, no typo tolerance, no
  facets/aggregations, no geo radius (lat/long are returned but not queried). At scale this is both
  slow (no usable index on `ILIKE %x%`) and low-quality. *(M, P1)*
- **N+1 risk**: thumbnails are fetched in a second query keyed by listing ids — fine per page, but
  there's no evidence of DB indexes on the filter/sort columns (`status`, `published_at`,
  `category`, `country_code`, `base_price_pence`). *(M, P1)*
- **Pagination is offset-based** (`.range(from,to)`) — degrades on deep pages; no keyset/cursor
  option. *(S, P2)*
- The `published` vs `active` status mismatch (dimension 2) directly breaks search visibility today.

**Requirement to close:** move to Postgres FTS (or a search service) with a generated `tsvector` +
GIN index and relevance ranking; add the filter/sort indexes; add geo radius; offer cursor
pagination.

---

### 9 — Testing & CI — *Adequate*

**Exists**
- **CI** (`.github/workflows/ci.yml`): hard gates on `tsc --noEmit`, ESLint (no `|| true` mask),
  `vitest run`, and `next build`. Runs on push to main/develop + PRs.
- **Unit tests** (`src/__tests__/*`): ledger invariants, marketplace fees, billing entitlements,
  AI caps, i18n, planning calcs, legal grounds, inline-edit, PWA, smoke (~13 files).
- **Live integration probes** (`scripts/test/*`): RLS coverage/isolation, IDOR sweep, anon
  exposure, v2 RLS matrix, billing webhooks/reconcile/gates, supplier scope, role-within-workspace.

**Gaps / thin**
- **Integration suites are NOT in CI** — they require live Supabase/Stripe secrets and are
  commented out (the `integration:` job in `ci.yml` is a disabled stub). So RLS/IDOR/billing proofs
  only run when someone runs them manually. *(M, P1)*
- **No E2E in CI**: Playwright is a dependency (`test:e2e`) but there are no committed specs / no CI
  job exercising real user journeys (signup→list→book→pay→payout→dispute). *(L, P1)*
- **Thin coverage of v2 money/automation logic in unit tests** beyond fees/ledger — the payments
  webhook state machine, reconciliation discrepancy detection, and dispute authority have no unit
  tests. *(M, P1)*
- No coverage threshold enforced. *(S, P2)*

**Requirement to close:** gate the integration probes behind a scheduled/dispatched CI job with
secrets; add Playwright E2E for the core marketplace money journey; unit-test the webhook state
machine + reconciliation; set a coverage floor.

---

### 10 — Admin & governance — *Adequate*

**Exists**
- **Admin control plane**: broad surface under `src/app/(admin)/admin/*` — dashboard, billing,
  feature flags, security, audit log, system health, usage monitoring, support ops, marketplace
  disputes, data-requests, workspaces, AI models/usage, announcements, changelog, affiliates.
- **Admin guard** (`src/lib/admin/guard.ts`): platform-admin check **plus aal2 MFA enforcement**
  (challenge redirect when a factor is enrolled but session is aal1).
- **Feature/entitlement management**: `src/lib/billing/entitlements.ts` `TIER_FEATURES` map +
  `gates.ts` server-side plan gates (seat/AI/storage/automation) — real enforcement, not UI-only.
- **Risk/governance**: `risk_events`/`risk_scores`, admin disputes resolution.

**Gaps / thin**
- **No support impersonation tooling.** Grep finds no impersonation flow — admins cannot "view as
  tenant" for support without a real implementation (and there's no audited, time-boxed,
  consent-gated impersonation, which enterprise support desks need). *(M, P1)*
- **Platform config is code/env, not a runtime control plane.** Feature flags exist
  (`admin/feature-flags`) but global platform settings (fee schedule edits, country enablement,
  maintenance windows) are largely env/migration-driven. *(M, P2)*
- Admin actions are audited via `recordAudit`, but a dedicated **admin action review/4-eyes**
  workflow for high-impact actions (refunds, manual payout, erasure execute) isn't present. *(M, P2)*

**Requirement to close:** add audited, time-boxed, consented impersonation; a runtime platform-
config surface for fees/country/maintenance; 4-eyes approval on destructive admin actions.

---

### 11 — APIs & integrations — *Critical Gap*

**Exists**
- **Internal API surface**: a coherent `src/app/api/*` set (account, admin, ai, auth, automations,
  billing, booking, connect, consent, identity, marketplace, payments, portals, supplier, upload,
  webhooks, health). Stripe (payments + billing + Connect + Identity-params), Resend, R2, Companies
  House, OpenStreetMap are integrated.
- **Integration status** (`src/app/api/integrations/status/route.ts`): honest boolean readout of
  which providers are configured (no secrets exposed).

**Gaps / thin — large for a booking platform**
- **No channel managers / OTA connections (Critical).** Grep confirms **no** Airbnb / Booking.com /
  Guesty / Hostaway / Smoobu / iCal sync anywhere. For a property **booking** platform with
  `rate_plans` and `booking_blocked_dates`, the absence of OTA/iCal calendar sync means double-
  booking risk and no real distribution. *(L, P1)*
- **No calendar sync (iCal/CalDAV/Google).** Availability lives only in Propvora; cannot import/
  export calendars. *(M, P1)*
- **No accounting integrations.** `src/lib/accounting/*` is an *internal* ledger/money-mapping
  module — there is **no Xero / QuickBooks / Sage** OAuth/export despite the marketplace generating
  invoices and payouts. *(L, P2)*
- **No public/partner API.** No API keys, no documented REST/GraphQL for customers/integrators, no
  OpenAPI spec. The only public surface is the per-endpoint automation webhook token. *(L, P2)*
- **Outbound webhooks for integrators** missing (see dimension 7). *(M, P1)*

**Requirement to close:** iCal import/export + at least one OTA channel-manager connector for
booking; a public API with keys + OpenAPI; outbound webhooks; optional accounting export (Xero/QBO).

---

## 3. Consolidated "requirements remaining" backlog (single source of what's left)

Priority: **P0** = blocks enterprise/marketplace launch · **P1** = needed for enterprise
credibility · **P2** = hardening. Effort: **S** ≤ 2d · **M** ≤ 1–2wk · **L** > 2wk.

| ID | Requirement | Dimension | Effort | Priority |
|----|-------------|-----------|:------:|:--------:|
| R1 | **Build a background-job/scheduler runtime** (Vercel Cron + `/api/jobs/*` worker, or QStash/Inngest/pg-cron). Foundation for R2–R6, R12, R16. | 5 Ops | L | **P0** |
| R2 | **Automation v2 run executor** — drain `automation_v2_runs` `status='queued'`, run actions (or route to review), transition status. Today nothing executes queued runs. | 5 Ops / Automation | M | **P0** |
| R3 | **Scheduled reconciliation + payout/escrow worker** — periodic `reconcilePayments`, alert/risk-event on drift, escrow-release-on-condition, failed-payout retry. | 3 Payments | M | **P0** |
| R4 | **Licensed sanctions/PEP/AML provider** + ongoing monitoring (replace banned-list+substring signal in `identity/screening.ts`). | 4 Trust | L | **P0** |
| R5 | **Finish Stripe Identity loop** — implement `verificationSessions.create` server action + webhook end-to-end so document KYC actually runs. | 4 Trust | M | **P0** |
| R6 | **Marketplace content moderation** — listing/review/message screening, image moderation, report-and-takedown queue. | 4 Trust | L | **P1** |
| R7 | **Unify listing publish-state** (`published` vs `active`) across RLS policy, publish action, and `searchListings`; consolidate duplicate anon read policies. | 2/8 | S | **P1** |
| R8 | **Real search** — Postgres FTS (`tsvector` + GIN), relevance ranking, geo radius, filter/sort indexes, cursor pagination. | 8 Search | M | **P1** |
| R9 | **OTA / channel-manager + iCal calendar sync** for booking (import/export + ≥1 connector). | 11 Integrations | L | **P1** |
| R10 | **Tenant-enforceable MFA policy** + member step-up (beyond opt-in). | 1 Identity | M | **P1** |
| R11 | **SSO/SAML+SCIM** implementation (or relabel the `ssoSaml` entitlement as roadmap). | 1 Identity | L | **P1** |
| R12 | **Outbound webhooks + scheduled digests/transactional email** (signing, retry, delivery log). | 7 Comms | M | **P1** |
| R13 | **Integration probes in CI** (scheduled job w/ secrets) + **Playwright E2E** for signup→book→pay→payout→dispute + unit tests for webhook state machine & reconciliation. | 9 Testing | M | **P1** |
| R14 | **Audited, time-boxed, consented admin impersonation** ("view as tenant"). | 10 Admin | M | **P1** |
| R15 | **Transaction-level tax** (Stripe Tax / VAT-GST with tax lines + reporting). | 3 Payments | L | **P1** |
| R16 | **Schedule GDPR erasure/retention timers** (enforce the 30-day SLA). | 6 Compliance | M | **P1** |
| R17 | **Register Sentry/APM sink** + alerting + uptime/SLO dashboards. | 5 Ops | S | **P1** |
| R18 | **Public/partner API** (keys + OpenAPI) + accounting export (Xero/QBO). | 11 Integrations | L | **P2** |
| R19 | **Fraud hardening** — Stripe Radar, velocity/anomaly rules, scheduled re-scoring, device fingerprinting. | 4 Trust | M | **P2** |
| R20 | **Session governance** — session inventory, revoke-all, role-change invalidation; distributed/token-bucket rate limiting + per-tenant quotas; caching strategy. | 1/5 | M | **P2** |
| R21 | **Decide data residency** — real per-region routing vs documented single-region; consent-change audit verification. | 6 Compliance | M | **P2** |
| R22 | **4-eyes approval** on destructive admin actions (refund/manual-payout/erasure) + runtime platform-config surface. | 10 Admin | M | **P2** |
| R23 | **Trial-balance / balanced double-entry assertion** over the ledgers (periodic). | 3 Payments | S | **P2** |

---

## 4. Stubs / scaffolds / intent-without-executor (explicit call-outs)

These are the items where the code **records intent but does not carry it out**, or is a
**signal presented where a control is required**. None are dishonest in their docstrings — the
risk is that a reader assumes "queued/recorded" means "done."

1. **Automation v2 queue has no consumer** *(intent without executor — highest concern).*
   `src/app/api/automations/trigger/[token]/route.ts` enqueues `automation_v2_runs`
   `status='queued'` → `202`. **No worker, cron, or any other code transitions a queued run.**
   `runs.ts` defines a `"queued"`→`"running"`→`"succeeded"` lifecycle that nothing drives for the
   v2 path. (The v1 `smart_rules` engine in `automation/engine.ts` *does* execute synchronously and
   is fine — the gap is strictly the v2 definition/run system.)

2. **Sanctions screening is a signal, not AML clearance** *(signal masquerading risk — mitigated by
   honest framing).* `src/lib/identity/screening.ts` self-documents this, and writes
   `verification_checks.result='pass'` meaning only "no list match." Enterprise/regulated use
   **must not** treat this as compliance.

3. **Stripe Identity session is assembled but never created.**
   `identity/verification.ts::buildVerificationSessionParams` builds params and defers
   `verificationSessions.create` to "a future server action" — so document KYC is **not runnable**
   end-to-end yet.

4. **Reconciliation reports drift but acts on nothing.** `payments/reconciliation.ts` is read-only
   by design; without R3 a discrepancy is detected only if someone manually runs it, and triggers
   no alert/quarantine.

5. **Observability sink is never registered.** `observability/index.ts` is "Sentry-ready" but no
   `registerSink` call exists at startup → errors reach `console` only, no APM/alerting.

6. **`ssoSaml` entitlement with no SSO implementation.** `entitlements.ts` grants `ssoSaml: true` to
   `pro_agency`/`enterprise`; there is no SAML/OIDC/SCIM code behind it.

7. **The proxy v2 routeContext guard is fail-open and lazy-imported.** `src/proxy.ts`
   `maybeApplyRouteContextGuard` returns `null` (allow) on any missing export/error. Intentional for
   resilience, but it means a broken resolver silently disables context routing — acceptable as a
   guard *layer* only because RLS is the real boundary.

8. **CI integration job is a commented-out stub.** `.github/workflows/ci.yml` ships the
   `integration:` job disabled; the strong RLS/IDOR/billing proofs are not actually gating PRs.

---

## 5. What is genuinely strong (so the backlog is read in context)

- **Data isolation**: 48/48 v2 tables RLS-enabled, 0 leaks, immutable ledgers, live-probed.
- **Money state machine**: idempotent, append-only, signature-verified, replay-safe.
- **GDPR erasure**: double-gated, audited, retention-aware, identity-removed-last.
- **MFA**: real TOTP + aal2 admin step-up.
- **Honesty discipline**: modules name their own limits; no fabricated success states; tolerant DB
  access avoids fake 500s. This makes the remaining gaps *findable and closable* rather than hidden.

**Bottom line:** the substrate (isolation, money integrity, audit, GDPR) is enterprise-shaped and
trustworthy. The platform is **not yet enterprise-ready** primarily because it lacks an **execution
tier** (no jobs/queue/worker → unexecuted automations, unscheduled reconciliation/erasure/digests)
and a **trust-&-safety tier with real providers** (sanctions/AML, runnable KYC, moderation), plus the
**booking-distribution integrations** (OTA/iCal) a property marketplace needs. Close R1–R5 (the P0s)
and the platform moves from "honest, well-isolated MVP" to "operable enterprise marketplace."
