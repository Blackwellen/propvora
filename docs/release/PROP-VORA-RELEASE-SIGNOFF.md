# PROPVORA — RELEASE SIGNOFF

**Product:** Propvora · **Legal owner:** Blackwellen Ltd (Reg. England & Wales No. 16482166; ICO ZC160806)
**Document owner:** Founder (Blackwellen Ltd) · **Last updated:** 2026-06-15

## Decision

> 🟡 **NOT YET PRODUCTION-READY — but materially advanced.** The application, data layer
> and security suite are in strong shape; the remaining blockers are **owner-controlled
> infrastructure, CI gates, and external assurance** (pen-test, WCAG, performance), not
> core application defects.
>
> A **controlled private beta** is supportable now. **General availability is NOT yet
> approved** until the No-Go checklist below is cleared.

The binding rule is unchanged: no sign-off below constitutes GA approval until every
**Go gate** is Passed.

---

## ✅ DONE (verified this cycle)

| Area | Status | Evidence |
|---|---|---|
| **Data layer aligned** — schema-correct, no phantom tables, no mock paths | ✅ | `npm run audit:schema` = **0** · `docs/finalisation/DB_FRONTEND_ALIGNMENT.md` |
| **RLS 7/7** — every `workspace_id` table RLS-enabled | ✅ | **195/195** · `docs/finalisation/RLS_POLICY_MATRIX.md` |
| **Cross-workspace isolation proven live** (IDOR + anon) | ✅ | IDOR **0/96 leaks**, anon **0/31** · `idor-sweep.mjs`, `anon-exposure.mjs` |
| **API defence-in-depth** — auth + membership/role on top of RLS | ✅ | `docs/finalisation/API_SECURITY_MATRIX.md` (32 routes) |
| **Security suite green** (10 suites) | ✅ | `npm run test:security` (`run-all.mjs`) |
| **Billing reconciliation** — app catalog ↔ LIVE Stripe | ✅ | **54/54** · `billing-reconcile.mjs` |
| **Webhook-sourced billing** — signed, idempotent, full lifecycle | ✅ | **17/17** · `billing-webhooks.mjs` |
| **Entitlement gates E2E** — every tier + live storage | ✅ | **66/66** · `billing-entitlements-e2e.mjs` |
| **Admin protected** — server role check + MFA + audit | ✅ | `docs/finalisation/ADMIN_AUDIT.md` |
| **AI safety** — server-only keys, fail-closed caps, metering, human approval | ✅ | `docs/finalisation/AI_SAFETY_AUDIT.md` |
| **The five systems** — AI gateway, double-entry ledger, smart-rules, legal/possession/court-bundle, notifications + ⌘K | ✅ | shipped; see FINAL_PRODUCTION_AUDIT §1 |
| **Recipient portals** — tenant/landlord/supplier + `/p/[token]` share links | ✅ | flag-gated; supplier scope **passes** (`supplier-scope.mjs`) |
| **Affiliate payout ledger** — accrual + refund/dispute reversal (payout flag off) | ✅ | `BILLING_E2E.md` §4 |
| **Mobile component system** | ✅ | `src/components/mobile/*` |
| **Upload hardening** — MIME sniffing, size cap, sanitised key, quota gate | ✅ | `/api/upload`, API matrix |
| **GDPR + consent + maintenance + health/ready** | ✅ | account request flow, `src/lib/consent.ts`, `/api/health`+`/api/ready` |
| **Correct legal entity** | ✅ | `src/lib/legal/company.ts` (ICO ZC160806) |
| **TypeScript clean** | ✅ | `npm run typecheck` = 0 |

---

## ❌ REMAINS before GA (No-Go until cleared)

### Engineering / CI
- ⬜ **Lint + CI gates** — wire `lint`, `typecheck`, and `test:security` into the deploy
  pipeline as **blocking** checks (currently run manually).
- ⬜ **Full browser E2E breadth** (Playwright) across the critical journeys.
- ⬜ **Performance deep-pass** — Core Web Vitals on real routes; bundle/LCP budget.
- ⬜ **Formal WCAG 2.2 AA audit** — first conformance pass done
  (`docs/compliance/wcag-2-2-aa-audit.md`); contrast / screen-reader / keyboard sweeps remain.
- ⬜ **External penetration test** — brief ready (`docs/release/external-pentest-brief.md`).

### Owner infrastructure (external, not code)
- ⬜ **Cloudflare** production R2 + **Turnstile** keys (`docs/release/cloudflare-production-setup.md`).
- ⬜ **Vercel** production environment + custom domain (`docs/release/vercel-production-readiness.md`).
- ⬜ **Supabase** PITR / backups enabled + a **restore test** (`docs/release/disaster-recovery-plan.md`).
- ⬜ **Resend** sending domain verified (SPF / DKIM / DMARC).
- ⬜ **Stripe LIVE** verification — run the TEST-mode card + lifecycle matrix
  (`docs/finalisation/BILLING_E2E.md` §2–3) and register the LIVE webhook endpoint.

### Intentionally OFF for V1 (confirm, don't enable)
- Stripe **Connect** + **affiliate payouts** stay flagged off (accrual/reversal run live).
- External recipient **portals** stay behind `NEXT_PUBLIC_PORTALS_EXTERNAL_ENABLED` until verified.

---

## 🚧 Scope gate — international expansion is POST-V1

The plans in `docs/upgrade/` (country packs, i18n, global marketplace, KYC/escrow,
booking) are **GATED — NOT ELIGIBLE TO START** until UK V1 is signed off, and every
country pack additionally requires **qualified local legal/tax review** before
enablement. **None of it is part of the V1 release surface.**

---

## Go / No-Go checklist (GA)

GA is approved only when **all** of the following are ✅:

1. ⬜ CI runs `lint` + `typecheck` + `test:security` as blocking gates, all green.
2. ⬜ Stripe **LIVE** card + lifecycle matrix passed in TEST mode; LIVE webhook registered.
3. ⬜ Cloudflare/Turnstile + Vercel prod env + domain live.
4. ⬜ Supabase PITR/backups on, restore test passed.
5. ⬜ Resend domain authenticated (SPF/DKIM/DMARC).
6. ⬜ External pen-test completed; criticals/highs closed.
7. ⬜ WCAG 2.2 AA formal audit passed.
8. ⬜ Performance deep-pass within budget.

**Until items 1–8 are ✅, the decision is No-Go for GA (Beta-only).**

---

## Sign-off record

| Role | Name | Decision | Date |
|------|------|----------|------|
| Founder / Director, Blackwellen Ltd | — | Pending | — |
| Security reviewer | — | Pending | — |
| Data protection (ICO ZC160806) | — | Pending | — |

_No signature below constitutes GA approval until every Go gate above is **Passed**._
