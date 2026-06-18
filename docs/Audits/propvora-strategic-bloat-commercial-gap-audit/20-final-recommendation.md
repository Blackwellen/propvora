# 20 — Final Recommendation

**Status:** Approved · 2026-06-18 · synthesises the audit pack. Conforms to
`_shared-strategic-brief.md`. Cross-refs `02`, `04`, `07`, `10`, `18`, `19`.

---

## The one-line answer

**Ship Propvora as a focused, paid UK property-operations + compliance SaaS for
operators (the wedge), with the marketplace / consumer / independent-supplier
layers kept in code behind the existing master feature flags and released in
stages.** This is **Model 2 — a staged property operating system.** It protects
the unicorn path without paying to run four cold-start products at launch.

---

## What Propvora should be called / positioned as now

> **"The operating system for UK property — compliance, maintenance, money and
> portals in one place."**

Positioned as **property-operations software for operators** (landlords, letting
agents, property managers), *not* as a marketplace, *not* as accounting software,
*not* as a booking site. The platform ambition lives in the roadmap, not the
homepage.

## The exact launch wedge

UK lettings/property **operations + compliance**: portfolio/properties/units/
tenancies, work/maintenance + supplier coordination, money basics (rent, arrears,
invoices, expenses, deposits, owner statements), documents/evidence, messaging,
and the **tenant/landlord/supplier portals** — with **compliance/legal depth**
(HMO licensing, possession/RRA-2026, certificate tracking, deposits) as the
headline differentiator.

## The exact first customer (V1 ICP)

The **self-managing portfolio landlord and small letting agent / property manager,
~5–150 units**, frequently with HMO / student / serviced-accommodation exposure.
They buy because of **compliance anxiety** (Renters' Rights Act 2026, HMO
licensing, cert expiries), **maintenance chaos**, and **arrears chasing** — and
today they stitch together spreadsheets + Fixflo + Landlord Vision + email.

---

## Module decisions

### V1 — sell first (Layer A + B)
- **Portfolio / Properties / Units / Tenancies** — core.
- **Work / Tasks / Jobs / Maintenance** + **operator-side supplier coordination**.
- **Compliance** (certs, HMO, inspections, deposits) — the wedge headline.
- **Legal — core** (possession/RRA-2026 essentials; advanced flows → V1.5).
- **Money basics** (rent, arrears, invoices, expenses, deposits, owner statements,
  payouts).
- **Documents / storage**, **Messaging/inbox**, **Calendar (single view-toggle)**,
  **Contacts (simplified)**.
- **Portals — tenant / landlord / supplier** (the retention engine).
- **Clean settings** (one tabbed area), **Billing/subscriptions**, **Auth/onboarding**.
- **Platform admin** (internal control plane — not customer nav).

### V1.5 — premium modules (Layer C, priced/gated)
- **Planning engine** — multi-profile property strategy & profitability (HMO, R2R,
  serviced accommodation, student, BRRR, lease option, assisted sale, flip,
  commercial/mixed-use). **This is the differentiator — protect and monetise it.**
- **Automations — presets/recipes/approvals only** (`canvasLite`).
- **Advanced compliance/legal**, **AI Copilot** (entitlement-gated), **advanced
  reporting / portfolio intelligence**, **white-label/agency**.

### V2 — platform layers (Layer D, flag-gated, already built)
- **Consumer stays-booking marketplace**, **public supplier/services marketplace**,
  **emergency services**, **independent supplier SaaS workspace**, **escrow**,
  **full accounting general ledger** (reposition as a **Xero/QuickBooks
  integration**, not in-app ERP), **automation marketplace**.

---

## What NOT to launch yet (remove from primary nav; keep in code behind flags)
- Marketplace (`marketplaceEnabled` OFF) and all sub-flags (stays/suppliers/
  emergency/payments/escrow/disputes).
- Customer/guest workspace (`customerWorkspace` OFF).
- Independent supplier workspace's **mirrored** accounting, automation canvas, and
  multi-view calendar (`supplierWorkspace` scoped to portal-grade essentials).
- Full accounting GL (journal, trial-balance, chart, MTD, reconciliation).
- Automation canvas / webhooks / integrations / usage-marketplace.
- Public booking/stays/services/providers/emergency consumer pages.

## What to delete/archive (only after dependency check — see `17`)
- Genuinely duplicated routes (e.g. `calendar/day` vs `calendar/views/day`;
  `marketplace/suppliers` vs `marketplace/suppliers-hub`) — **merge**, then archive
  the loser.
- Decorative settings pages once consolidated into the tabbed settings area.
- (No mass deletion. Default disposition for Layer-D scope is **flag-hide**, not
  delete, to preserve the platform optionality.)

---

## Commercial summary (detail in `04`)
- Anchor on the existing 5 tiers (`starter / operator / scale / pro_agency /
  enterprise`). Wedge buyer lands on **Operator** tier.
- **Planning** and **advanced compliance/AI** are the premium upsell that justifies
  Scale/Pro-Agency.
- Marketplace take-rate, supplier lead fees, booking fees = **V2 revenue**, not V1.
- Fastest path to first paying customers: compliance-led outbound to HMO/portfolio
  landlords + letting-agent referrals + the affiliate programme.

## What makes it worth paying for immediately
Compliance peace-of-mind (RRA-2026/HMO/cert deadlines never missed) + one place for
maintenance + money + portals that replaces 3–4 tools. What would make it look
bloated/unserious: leading with a half-built marketplace, an in-app general ledger,
a Zapier clone, and 45 settings pages.

---

## Route-count verdict
- **Is the current count commercially dangerous? Yes** — 350 operator routes + a
  112-route mirrored supplier workspace makes the product look like unfinished ERP
  and buries the wedge.
- **Target — V1 visible operator surface:** **~110–130 routes**, story told in **≤8
  sidebar items**.
- **Target — V1.5:** +~50 (planning premium, automations-lite, advanced
  compliance/AI).
- **Target — long-term platform (V2, flags on):** the existing ~600+ surface, but
  *revealed in stages*, never all at once.

## Build next (priority order — detail in `18`)
1. Nav + settings + calendar trim (instant clarity win, low risk — mostly flags &
   merges per `17`).
2. Harden the V1 wedge (compliance, money basics, portals) to paid-launch gate
   (`16`).
3. Package + price Planning as the premium hook (`04`).
4. Stage marketplace/customer/supplier behind flags with explicit liquidity/GTM
   triggers (`15`).

**Decisions to sign off:** see `19-founder-decision-lock.md`.
