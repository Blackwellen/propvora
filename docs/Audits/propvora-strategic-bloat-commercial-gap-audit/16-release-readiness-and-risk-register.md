# 16 — Release Readiness & Risk Register

**Status:** Draft · 2026-06-18 · conforms to `_shared-strategic-brief.md` (Model 2,
staged property OS). Tied to the gaps in `06-gap-analysis.md` (referenced as G06-#).

This document defines **two release gates** — **BETA-ready** and
**PAID-LAUNCH-ready** — and a **risk register**. It reconciles the existing
`docs/Release-Readiness-Takslist.md`, which is currently a **1-line stub**
(`[VERIFY]` — effectively empty): this document **supersedes** it. Update its status
to *Deprecated → see this file* in the founder lock (`19`).

**Current objective evidence (captured 2026-06-18, this audit run):**
- `node scripts/audit-queries.mjs` → **GREEN** ("0 misaligned column refs in 0 files").
- `npm run test` (vitest) → **GREEN** — **183 tests / 13 files passed**.
- Mature controls verified in code: Stripe webhook (signature + idempotency + audit),
  R2 upload (magic-byte + SVG sanitise + exec-block + private presigned), GDPR
  erasure worker (dry-run + double kill-switch + retention schedule), DSAR
  (`src/lib/privacy/dsar.ts`), rate-limit (`src/lib/rate-limit.ts`), maintenance mode
  (`src/proxy.ts`), observability scaffold (`src/lib/observability`), SEO/AI files
  (`public/{robots.txt,sitemap.xml,llms.txt}`).
- **Not yet captured / open:** RLS isolation green run, observability sink wiring,
  AI hard-cap, DR restore drill, CI release gate, flag-leak render-guards.

Verdict format: each gate item is **PASS** (evidenced), **PARTIAL** (built, needs
verify/wire), or **OPEN** (not done).

---

## GATE 1 — BETA-READY (invited operators, real data, no public sign-up at scale)

Beta tolerates rough edges and missing premium features, but **must not** risk
tenant-data leakage, silent auth-email failure, undetected outages, or runaway cost.

| # | Gate item | Tied to | Status | Evidence / what's left |
|---|-----------|---------|--------|------------------------|
| B1 | Multi-tenant **RLS isolation proven** across the 433-table schema | G06-G1 | **OPEN** | Run `npm run audit:rls` + `npm run test:rls`; capture clean output into release pack. Gate scripts exist (`scripts/audit-rls.mjs`, `scripts/test/rls-isolation.mjs`). |
| B2 | **Service-role key cannot reach client bundle** | G06-G2 | **PARTIAL** | Add `import "server-only"` guard + CI service-role-exposure check across `createAdminClient()` callers. |
| B3 | **Auth endpoints rate-limited** (login, signup, reset, OTP, invite, data-request) | G06-C2 | **PARTIAL** | `rateLimit()` exists; only ~14 routes wired. Cover all auth/sensitive endpoints; assert 429. |
| B4 | **Auth emails never fail silently** | G06-F1 | **OPEN** | `src/lib/email.ts` returns success-shaped on missing key. Make prod missing-key a hard/observability error + startup health check. |
| B5 | **Production errors captured externally** | G06-F2 | **OPEN** | Register an observability sink (`registerSink()`) behind env DSN; verify a test event in staging. |
| B6 | **AI Copilot workspace isolation proven** | G06-E2 | **OPEN** | Extend `scripts/test/copilot-functions.mjs`: cross-workspace query returns nothing foreign. Backs the llms.txt "scoped strictly to own workspace" claim. |
| B7 | **V2 / marketplace flag-leak closed** (all flags OFF → nothing reachable/linked) | G06-I9 | **PARTIAL** | Defaults OFF confirmed in `registry.ts`; add render-guards + flag-OFF reachability test. |
| B8 | **Schema alignment green** | G06 intro | **PASS** | `audit:schema` → 0 misaligned (this run). |
| B9 | **Unit test suite green** | G06-I8 | **PASS** | 183/13 pass (this run). |
| B10 | **CI release gate composing all checks** | G06-I8 | **OPEN** | One pipeline: typecheck + lint + test + audit:schema + audit:rls + test:rls + test:gates + test:e2e + build. Deploy blocked on failure. |
| B11 | **Maintenance mode + rollback path** | G06-H3 | **PASS (mode)** / PARTIAL (rollback doc) | Maintenance mode works (`src/proxy.ts`); document a rollback procedure. |
| B12 | **`dark:` regression guard** | G06-B3 | **OPEN** | Add CI grep-gate (codebase currently 0). |

**Beta exit criterion:** B1–B7 + B10 must be PASS; B8/B9/B11 already PASS; B12 PASS.

---

## GATE 2 — PAID-LAUNCH-READY (public sign-up, taking money, SLA in force)

Everything in Gate 1 **plus** money-safety, cost-safety, data-durability, legal,
and the focused-product surface discipline the brief mandates.

| # | Gate item | Tied to | Status | Evidence / what's left |
|---|-----------|---------|--------|------------------------|
| P1 | **All of Gate 1 PASS** | — | depends | — |
| P2 | **AI hard spend-cap enforced** (per-workspace monthly token/£ ceiling, blocks at limit) | G06-E1 | **OPEN** | Currently fails OPEN; hard cap deferred to "MAX RELEASE phase". Enforce in `src/lib/ai/gateway.ts`. **Cost-runaway blocker.** |
| P3 | **Stripe plan mapping deterministic** (every price carries `metadata.plan`; fallback alerts) | G06-D1 | **PARTIAL** | Webhook robust; remove reliance on nickname heuristic. |
| P4 | **Plan/add-on gates enforced server-side** (no client-only gating on paid surfaces) | G06-D2 | **PARTIAL** | `gates.ts`/`entitlements.ts` tested; extend `test:gates` to add-ons + marketplace. |
| P5 | **Past-due / dunning UX** (banner + grace + portal retry) | G06-D3 | **OPEN** | Webhook sets `past_due`; surface it. |
| P6 | **Storage quota enforced at upload** | G06-F3 | **OPEN** | `entitlements.storageBytes` exists; enforce on `/api/upload`. |
| P7 | **DR runbooks filled + one tested restore (DB + R2)** with documented RTO/RPO | G06-H1 | **OPEN** | `docs/Disaster Recovery Guide/**` folders are scaffolds; rehearse one restore. **Existential blocker.** |
| P8 | **Backups/redundancy configured** (Supabase PITR + R2 versioning/lifecycle) | G06-H2 | **OPEN** | Verify + document cadence/retention. |
| P9 | **DSAR statutory clock + erasure live** (1-month due-date tracking; `ACCOUNT_ERASURE_ENABLED` enabled w/ runbook) | G06-H4, H5 | **PARTIAL** | Queues + worker exist; add due-date alerting; enable erasure deliberately; verify self-serve flow. |
| P10 | **CSRF / action-safety verified** on mutating API routes & server actions | G06-G4 | **OPEN** | Document + test same-site/origin posture across 150 routes. |
| P11 | **Subprocessor / DPA accuracy** = {Supabase, Vercel, Stripe, Cloudflare R2, Resend} | G06-I6 | **PARTIAL** | Reconcile `/legal` subprocessor page with real stack; DPAs on file. |
| P12 | **Accessibility** — key flows pass axe (no critical) | G06-I2 | **OPEN** | Add a11y gate. |
| P13 | **Mobile/PWA SW never serves stale authed data** | G06-I3 | **PARTIAL** | Review `public/sw.js` caching (network-first for authed data). |
| P14 | **Performance budget met** on key routes (LCP/CLS) | G06-I4 | **OPEN** | Lighthouse CI. |
| P15 | **Audit log covers all sensitive mutations** | G06-I5 | **PARTIAL** | `recordAudit` infra solid; map full coverage. |
| P16 | **Surface discipline** — operator nav ≤8 items; settings merged; calendar de-duplicated | G06-A1, A2, A3 | **OPEN** | Brief §4 targets; render-guard/merge per `17`. |
| P17 | **Support SLA documented + surfaced** | G06-H6 | **OPEN** | Define per-plan SLA; link from app + marketing. |
| P18 | **Changelog + announcements live** for customers | G06-H4 | **PARTIAL** | Admin surfaces exist; confirm customer-facing publish path. |

**Paid-launch exit criterion:** P1–P11 PASS (money, data-durability, legal, cost,
security). P12–P18 may run a short fast-follow window if explicitly accepted in `19`,
**except P2 and P7 which are hard blockers** and may not be deferred.

---

## RISK REGISTER

Likelihood (L) and Impact (I) 1–5; **Score = L × I**. Owner roles are functional
(founder is currently all of them — assign before launch).

| ID | Risk | L | I | Score | Mitigation (status) | Owner | Trigger / early signal |
|----|------|---|---|-------|---------------------|-------|------------------------|
| R1 | **Cross-tenant data leak via RLS gap** (433 tables) | 3 | 5 | **15** | `audit-rls.mjs` + `rls-isolation.mjs` gates exist but no captured green run (G06-G1). Run + remediate + put in CI (B1/B10). | Security | Any table holding tenant data with RLS-off or 0 policies; a user reports seeing foreign data. |
| R2 | **AI cost runaway** | 4 | 4 | **16** | Metering exists but **fails open**; hard cap deferred (G06-E1/P2). Enforce server-side ceiling in `gateway.ts`. | Eng/Finance | Daily `ai_token_usage`/`cost_pence` spikes; one workspace dominating spend. |
| R3 | **DR / data-loss with no proven recovery** | 2 | 5 | **10** | DR runbooks are stubs; no rehearsed restore (G06-H1/H2). Fill runbooks; PITR + R2 versioning; one drill (P7/P8). | Ops | A failed deploy/migration with no tested rollback; backup age unknown. |
| R4 | **Payment-security / billing integrity** (replay, double-charge, mis-tier) | 2 | 4 | **8** | Webhook **already** verifies signature + idempotent via `stripe_webhook_events` unique index + audits (G06-G3). Residual: deterministic plan mapping (P3). | Eng/Finance | Webhook 500 rate; affiliate commission anomalies; plan ≠ price. |
| R5 | **Schema drift** (app queries vs live schema) | 2 | 4 | **8** | `audit:schema` green now; make it a blocking CI gate (B10). | Eng | `audit:schema` non-zero; runtime "column does not exist". |
| R6 | **Marketplace / V2 flag-leak** (unfinished Layer-D reachable when OFF) | 3 | 3 | **9** | Flags default OFF (`registry.ts`); render-guards incomplete (G06-I9/B7). Add reachability test. | Eng/Product | A marketplace/customer/independent-supplier link visible with flags OFF. |
| R7 | **Support / DSAR overload & missed statutory deadline** | 3 | 3 | **9** | Admin queues + `dsar.ts` exist; no SLA/clock (G06-H4/P9). Add due-date alerting + SLA. | Ops/Legal | DSAR aging past 30 days; bug queue unattended. |
| R8 | **Silent email failure** (invites/reset/billing dropped) | 3 | 4 | **12** | `sendEmail` no-ops on missing key (G06-F1/B4). Hard-fail in prod + health check. | Eng | Resend dashboard send count drops; "didn't get email" reports. |
| R9 | **Blind in production** (no APM sink) | 4 | 3 | **12** | Observability scaffold present but no sink registered (G06-F2/B5). Wire Sentry. | Eng | Incidents discovered via users, not alerts. |
| R10 | **Service-role key exposure** | 1 | 5 | **5** | Admin client server-side; add `server-only` + CI graph check (G06-G2/B2). | Security | Admin client appears in a client chunk. |
| R11 | **Surface-overload kills the wedge story** (commercial, not technical) | 3 | 3 | **9** | Brief §4 targets; flag-hide/merge (G06-A1/A2/A3/P16). | Product | Demo feedback: "what does this actually do?"; low trial activation. |

**Top scores to burn down first:** R2 (16) AI cost, R1 (15) RLS leak, R8 (12) silent
email, R9 (12) no APM. R1/R8/R9 are **beta blockers**; R2 + R3 are **paid-launch
hard blockers**.

---

## Reconciliation with existing release material

- `docs/Release-Readiness-Takslist.md` — **stub (1 line)**. This document is the
  authoritative gate; mark the old file Deprecated and link here (do in `19`).
- `docs/_coverage matrix.md` — `[VERIFY]` feed its section-coverage status into
  P15 (audit coverage) and P16 (surface discipline).
- MEMORY `project-max-release.md` notes the signoff is *NOT release-ready* with gates
  open — this register is consistent: the **product build** is largely done; the
  **operational/evidence gates** (RLS run, APM, AI cap, DR drill, CI gate) are what
  remain. Several "MAX-RELEASE phase" deferrals (AI hard limits, edge rate-limit) are
  exactly the open paid-launch blockers above.
