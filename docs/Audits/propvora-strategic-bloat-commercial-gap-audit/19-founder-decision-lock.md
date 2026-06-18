# 19 — Founder Decision Lock

**Purpose:** the explicit decisions to sign off so the build stops drifting. Each
is a yes/no with a default (the audit's recommendation). Tick to lock. Conforms to
`_shared-strategic-brief.md`; rationale in `20`, `02`, `07`.

> How to use: accept the **Recommended** column or override in **Decision**. Once
> locked, `17` (deprecation) and `18` (roadmap) execute against these.

## A. Positioning & model

| # | Decision | Recommended | Decision | Owner |
|---|----------|-------------|----------|-------|
| A1 | Product identity | **Staged property OS (Model 2)** — UK property-ops SaaS wedge first | ☐ | Founder |
| A2 | Homepage positioning | "Operating system for UK property — compliance, maintenance, money, portals" | ☐ | Founder |
| A3 | V1 ICP | Self-managing portfolio landlord & small letting agent/PM, 5–150 units | ☐ | Founder |
| A4 | Headline USP | UK compliance/legal depth (RRA-2026/HMO/certs) | ☐ | Founder |
| A5 | Premium hook | Planning engine (multi-profile strategy/profitability) | ☐ | Founder |

## B. Scope — what ships in V1 (Layer A+B)

| # | Decision | Recommended | Decision |
|---|----------|-------------|----------|
| B1 | Portfolio/Properties/Units/Tenancies | KEEP | ☐ |
| B2 | Work/Maintenance + operator supplier coordination | KEEP | ☐ |
| B3 | Compliance (core) + Legal (core) | KEEP — headline | ☐ |
| B4 | Money basics (rent/arrears/invoices/expenses/deposits/owner statements) | KEEP | ☐ |
| B5 | Documents, Messaging, Contacts | KEEP (simplify) | ☐ |
| B6 | Calendar | KEEP but MERGE views to a single toggle | ☐ |
| B7 | Tenant / Landlord / Supplier portals | KEEP (retention engine) | ☐ |
| B8 | Settings | MERGE 45 routes → one tabbed area (~6 tabs) | ☐ |
| B9 | Platform admin | KEEP (internal control plane) | ☐ |

## C. Defer / flag-hide (Layer C/D — stays in code, leaves primary nav)

| # | Decision | Recommended | Decision |
|---|----------|-------------|----------|
| C1 | Marketplace (all sub-flags) | `marketplaceEnabled` OFF for V1 | ☐ |
| C2 | Customer/guest workspace | `customerWorkspace` OFF for V1 | ☐ |
| C3 | Independent supplier workspace | Scope to portal-grade; **cut mirrored accounting/automations/calendar** | ☐ |
| C4 | Full accounting GL (journal/trial-balance/chart/MTD/recon) | HIDE+FLAG; reposition as **Xero/QuickBooks integration** | ☐ |
| C5 | Automation canvas/webhooks/integrations | HIDE+FLAG; ship **presets-only** (`canvasLite`) in V1.5 | ☐ |
| C6 | Planning engine | KEEP IN CODE; **release as priced V1.5 premium**, not V1 nav | ☐ |
| C7 | Consumer booking/stays/services/emergency public pages | DEFER to V2 (flags OFF) | ☐ |

## D. Pricing & monetisation (detail in `04`)

| # | Decision | Recommended | Decision |
|---|----------|-------------|----------|
| D1 | Keep 5-tier model (starter→enterprise) | YES | ☐ |
| D2 | Wedge buyer default tier | **Operator** | ☐ |
| D3 | Planning + advanced compliance/AI as premium upsell | YES (Scale/Pro-Agency) | ☐ |
| D4 | Marketplace take-rate / supplier leads / booking fees | **V2 revenue only** | ☐ |
| D5 | Affiliate programme | KEEP (payouts flag OFF until V1.5) | ☐ |

## E. Mobile / PWA (detail in `11`)

| # | Decision | Recommended | Decision |
|---|----------|-------------|----------|
| E1 | PWA scope V1 | Portals + supplier field jobs/evidence + maintenance + emergency only | ☐ |
| E2 | Operator dashboard | Responsive web, **not** a mobile app clone | ☐ |
| E3 | Admin | Desktop-first only | ☐ |

## F. Route-count targets (detail in `10`, `07`)

| # | Decision | Recommended | Decision |
|---|----------|-------------|----------|
| F1 | V1 visible operator routes | ~110–130 (≤8 nav items) | ☐ |
| F2 | V1.5 additions | ~+50 | ☐ |
| F3 | Default disposition for Layer-D scope | **Flag-hide, not delete** | ☐ |

## G. Release gating (detail in `16`)

| # | Decision | Recommended | Decision |
|---|----------|-------------|----------|
| G1 | Beta gate before paid launch | YES — pass `16` beta checklist | ☐ |
| G2 | No marketplace/customer flags ON at paid launch | YES | ☐ |

---

### Sign-off
- Decided by: ______________________  Date: __________
- Any overrides above propagate to `17-deprecation-and-feature-flag-plan.md` and
  `18-implementation-roadmap.md`. Open contradictions raised by any audit doc are
  listed at the bottom of `00-executive-summary.md` for resolution here.
