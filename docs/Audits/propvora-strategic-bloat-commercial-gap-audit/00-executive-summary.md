# 00 — Executive Summary

**Date:** 2026-06-18 · **Audience:** founder · **Conforms to:** `_shared-strategic-brief.md`
· **Synthesises:** docs `01`–`18` (9 specialist audits, all repo-grounded).

---

## The verdict (in one paragraph)

Propvora has outgrown "a SaaS" and become a **multi-sided property platform built
all at once** — that is the root cause of the surface bloat, not a coding failure.
The right move is **Model 2: a staged property operating system.** Ship a focused,
paid **UK property-operations + compliance SaaS wedge** for operators first; keep
the marketplace, consumer, and independent-supplier layers **in code behind feature
flags** and release them in stages once the wedge has traction. Two independent
agents scored the models the same way: **Model 2 wins (82/100 and 77/100)** vs
Focused-SaaS (69/67) and Full-platform (39/41). The platform ambition is preserved;
it is simply *sequenced* instead of launched cold on four sides simultaneously.

**This is well-timed, not just well-reasoned:** MTD-ITSA becomes mandatory **April
2026** and the Renters' Rights Act / Section 21 abolition lands **May 2026** — the
compliance USP is a regulatory moat with a clock on it.

---

## The shape of the problem (measured, reconciled)

| Metric | Measured |
|---|---|
| Total `page.tsx` routes | **725** (670 non-admin + ~52 admin [some overlap]) |
| Next API routes | **150** (no Supabase edge functions) |
| Operator app | **351** routes |
| Independent supplier workspace | **113–124** routes (**50 are 1-line re-export shims of the operator app**) |
| Customer/guest workspace | **46** routes |
| Platform admin | **52** routes (~22 essential for V1) |
| DB tables | **431** (+42 enums); ~190 back the V1 wedge, ~240 are flag-staged C/D |
| Operator sidebar today | **18 items / 5 groups** (target ≤8) |
| Settings | **45–46 routes across 4 trees** (billing duplicated 3×) |
| Calendar | **~21 operator routes for one surface** (`/calendar/*` + a literal `/calendar/views/*` duplicate), mirrored again under supplier |

**Four separate companies are hiding inside the sidebar:** a full double-entry GL
(= Xero), an automation canvas/webhooks engine (= Zapier), the consumer
marketplace/bookings (= Airbnb), and the independent supplier workspace (=
Tradify/Jobber) — the last of which *re-mirrors* the GL and automations a second
time, largely via re-export shims.

---

## What is genuinely strong (do not "fix" these)

The product is **far more built than a typical pre-beta** (gap audit, doc `06`):
- Schema-alignment gate **green** (`scripts/audit-queries.mjs` → 0 misaligned).
- **183 tests pass** (vitest, 13 files).
- Stripe webhook: full signature verification + idempotency (`stripe_webhook_events`).
- R2 uploads: magic-byte sniffing, SVG sanitisation, private presigned GETs.
- GDPR erasure: dry-run + double kill-switch worker.
- Escrow/holds/payouts are **production-grade**, not stubs.
- Pricing ladder is sound: **Starter £29 / Operator £79 / Scale £149 / Pro-Agency
  £299 / Enterprise** — no re-pricing needed; the £79→£149 step is the monetisation
  engine.

---

## The wedge, the buyer, the USP (validated by competitor + buyer audits)

- **Wedge:** *"Run your UK lettings/property operation — compliance, maintenance,
  money and portals — in one place."*
- **V1 ICP:** portfolio landlords + small letting agents + **HMO operators (5–150
  units)**; HMO is the sharpest beachhead (forced compliance buyers).
- **USP (protect):** UK **compliance/legal depth** (HMO, possession/RRA-2026,
  certs) + the **multi-profile Planning engine** (HMO/R2R/SA/student/BRRR/lease-
  option/commercial). The market openly concedes *no true all-in-one exists*;
  Propvora's wedge is literally "Arthur Online for the smaller operator, with
  compliance + MTD + planning" — and nearest threat **COHO** must be out-scoped on
  planning + RRA depth, not undercut on price.

---

## The cuts (ruthless, but reversible — full detail in `07`, `17`)

| Action | Items | Layer |
|---|---|---|
| **MERGE** | 45 settings routes → one `/settings?tab=` (6 tabs); ~21 calendar routes → one component + view toggle; duplicate `owner-statements`, `suppliers`/`suppliers-hub`, listings/billing/account paths | A |
| **CUT/ARCHIVE** (after dep-check) | the **50 supplier re-export shims**; the literal `/calendar/views/*` duplicate tree; the **23 standalone `(tenant)/(landlord)/(supplier)` portals** that duplicate the canonical session portals | — |
| **HIDE + FLAG** | full accounting GL (→ position as **Xero/QuickBooks integration**), automation canvas/webhooks, marketplace (all sub-flags), customer workspace, independent supplier workspace | C/D |
| **PROTECT + MONETISE** (do NOT cut) | **Planning engine** (43 routes — the USP, currently free + ungated) → premium V1.5; **Compliance** (22 routes) | C / A |

**Route-count target:** operator-visible surface **351 → ~110–130**, story told in
**≤8 sidebar items**; the rest flag-hidden, not deleted.

---

## Release blockers (must fix before paid launch — doc `16`)

1. **AI cost runaway = top risk (16/25):** `ai/metering.ts` rate-limiting **fails
   open**; no enforced per-workspace token/£ cap. **Hard blocker.**
2. **Silent email failure:** `email.ts` returns a success-shaped result when
   `RESEND_API_KEY` is unset — auth/reset/invite emails vanish with no signal.
3. **Observability dark:** `registerSink()` never called → prod errors only hit
   console.
4. **RLS: evidence missing, not mechanism:** isolation tests exist but no captured
   green run / CI gate; **portal paths run on `portal_sessions` with no RLS
   backstop** (fail-closed, but an unscoped `.from()` there would leak cross-
   workspace).
5. **Flag-leak:** V2 flags default-OFF but **render-guards incomplete** + flags
   **inert** (not consumed by nav/proxy) → Layer-D surfaces URL-reachable today.

---

## Contradictions register (for `19-founder-decision-lock.md`)

**Resolved during reconciliation:**
- ✅ Operator sidebar `/property-manager/*` links — **NOT broken**; `next.config`
  rewrites `/property-manager ↔ /app`.
- ✅ Table count **431 (+42 enums)**, corrected from 433.
- ✅ Counts: **725 total / 670 non-admin pages**; supplier workspace 113–124.
- ✅ "Deprecation = pure flag config" — **refined**: flags are inert + 2 keys
  missing, so it needs render-guard/nav wiring + `accountingGl`/`automationsFull`
  (still flag-first, reversible, no migrations).

**Open — need a founder decision:**
1. **Planning is free + in core nav today** vs. the plan to price it as premium.
   Gate now, or grandfather V1 users and gate new value later?
2. **≤8-item nav** — hard launch gate, or V1.5 goal? (Ships at 18 today.)
3. **Compliance "core vs advanced" boundary is undefined** — tag the 22 routes
   before gating, or you risk gating the moat.
4. **`(customer)` gates by membership, not the `customerWorkspace` flag** ("no
   feature flags" in its layout) — align to flag, or keep membership-gated?
5. **Dual portal systems** — confirm nothing depends on the 23 standalone portals
   before archiving in favour of the session portals.
6. **17 of 22 add-ons are `priceId: null`** (displayed, unsellable) — fix or hide.

---

## Bottom line + next actions

Propvora is **not over-built in value — it is over-*exposed* in navigation.** The
fix is mostly **flag-wiring, nav collapse, and merges**, not deletion or a rebuild;
the platform optionality stays intact behind flags.

**Recommended sequence (detail in `18`):**
1. **Decide** `19` (positioning, scope, route targets).
2. **Nav/settings/calendar trim** + wire the inert flags + add 2 flag keys + render-guards (instant clarity, low risk).
3. **Harden the wedge to the paid-launch gate** (`16`): AI cost cap, email/observability fixes, captured RLS green run.
4. **Package + price Planning** as the premium hook (`04`).
5. **Stage Layer-D** behind flags with explicit liquidity/GTM triggers (`15`).

Read next: `20-final-recommendation.md` → `19-founder-decision-lock.md` → `07` / `10` / `16` / `17`.
