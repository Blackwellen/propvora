# Release‑Readiness Verdict

**Date:** 2026-06-18 · **Verdict: BETA‑READY for the V1 wedge, NOT yet paid‑launch‑ready.**

Honest call: the **staging architecture and V1 product surface are in place and
verified**, but paid launch is gated on founder‑only infra steps (Stripe live,
flag‑table migration, DR evidence, deploy) and a few remaining code merges. Do
not bill customers until §"Open before paid launch" clears.

## ✅ Done & verified this engagement (tsc‑clean, runtime‑checked)
- **Strategy locked** — staged property OS (Model 2); full 23‑doc audit pack.
- **Flag system is now live & enforced** (was inert — the audit's #1 finding):
  20 flags with parent/child dependency rules, enforced across operator sidebar +
  mobile nav, public site (route groups, root pages, PublicNav, PublicFooter),
  escrow/dispute + **accounting‑GL + automation‑canvas** operator routes, and
  critical V2 write APIs. **Flags‑off reachability sweep PASSES** (no nav/URL/API leak).
- **Admin `/admin/feature-flags` manager** — grouped by stage (V1/Ops/V1.5/V2) +
  module, with KPIs, risk/status chips, dependency safety, confirm+reason toggle,
  and **audit logging**.
- **Platform Admin (45 pages)** recovered after a mid‑build crash; all routes 307,
  redirects work, tsc‑clean. (Visual pixel‑QA pending admin login — see founder tasks.)
- **Auth segments feature‑flagged** — V1 `/login` shows only Property Manager;
  `/register` shows only the operator card; Customer/Supplier appear when
  `registrationCustomer`/`registrationSupplier` flip on.
- **Portal feature flags** added (`portalTenant/Landlord/Supplier`, default‑on
  kill‑switches).
- **Email silent‑failure fixed** — no more success‑shaped result when
  `RESEND_API_KEY` is missing (surfaces in prod logs).
- **Public roadmap page** (`/roadmap`) built + linked, staged V1/V1.5/V2.
- **Pre‑existing strengths confirmed:** schema‑alignment gate green, 183 tests
  pass, Stripe webhook hardened (sig+idempotency), R2 upload sniffing, GDPR erasure.

## 🟧 Open before PAID launch (mix of code + founder)
- **Founder/infra (see `docs/Manuals/manual-founder-tasks.md`):** complete Stripe +
  Cloudflare OAuth; **`platform_feature_flags` migration** (so flags persist/toggle);
  Stripe live products/prices + webhook secret + price metadata; Sentry DSN;
  Resend domain; DR/PITR test‑restore evidence; Vercel env + deploy; admin/operator
  **visual QA**.
- **Code still to do (need more build budget):**
  - **Settings merge** (45 routes → one `/property-manager/settings` 8‑tab area).
  - **Calendar merge** (≈21 routes → one view‑toggle).
  - **AI hard cost caps** (metering currently fails open — paid‑launch hard blocker).
  - **Observability `registerSink()`** call (needs the DSN above).
  - **Planning wired to real data** + premium gating; **mock→live data sweep**.
  - **customerWorkspace / independent‑supplier‑SaaS** route‑group guards (nav already gated; add layout guards like the GL/escrow ones).
  - **RLS captured green run** + portal scoping audit; **CI release pipeline**.

## Recommendation
1. Founder clears §🟧 infra items (esp. the **flag table migration** + **AI cost cap**
   + **Stripe live**).
2. Resume code: settings merge → calendar merge → AI caps → mock→live → planning.
3. Then: green RLS run, deploy to a staging Vercel, run the admin/operator browser
   QA, and only then flip to paid launch — with **all V2 flags OFF**.

The product is a coherent, sellable **UK property‑ops + compliance V1** behind a
clean staged‑platform architecture. It is **beta‑ready** to put in front of design
partners now; **paid‑launch‑ready** once the above clears. Do not mark paid‑launch
ready until the AI cost cap and Stripe live billing are proven.
