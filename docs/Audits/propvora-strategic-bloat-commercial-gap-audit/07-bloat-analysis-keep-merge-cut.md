# 07 — Bloat Analysis: Keep / Merge / Cut

**Status:** Draft · 2026-06-18 · Author: Product Strategy (bloat audit)
**Aligns to:** `_shared-strategic-brief.md` (Verdict §1 = Model 2 staged OS; Layer map §3; Route targets §4; Rubric §5)
**Scope:** Every operator workspace section + supplier workspace mirroring + cross-cutting sprawl.
**Method:** Counts and routes verified live in repo on 2026-06-18 (see Evidence Appendix). Decisions tie to the canonical layer map.

---

## 0. Executive verdict

Propvora's code is a **four-company stack wearing one sidebar**. Inside one app live:

- **An ERP/accounting product** (Xero/QuickBooks clone): full double-entry GL, journal, trial balance, chart of accounts, MTD, reconciliation, client money, forecasting.
- **An automation platform** (Zapier/Make clone): node canvas, webhooks, integrations, run logs, usage limits, AI builder, template marketplace.
- **A deal-analysis product** (a standalone "property strategy" SaaS): 43 planning routes, multi-profile income models, AI review, landlord offers.
- **A field-service SaaS** (Tradify/Jobber clone): the entire `(supplier-workspace)` — 113 routes — *which re-mirrors accounting (22), automations (14) and calendar (16) a second time.*
- **A consumer booking marketplace** (Airbnb clone): marketplace, listings, bookings, escrow, disputes, customer workspace.

The operator app alone is **351 route files** (`src/app/(app)/**/page.tsx`). The supplier workspace is **113**. The current sidebar already exposes **~20 items across 5 groups** — versus the §4 target of **≤8 top-level items / ~110–130 visible operator routes**.

**The core finding:** almost none of this needs deletion. The §6 flag registry already exists (`src/lib/flags/registry.ts`, everything defaults OFF). The bloat problem is a **navigation and packaging problem, not a code problem.** The fix is ~80% flag config + nav collapse, ~15% MERGE of genuine duplicates (settings ×5 surfaces, calendar ×2 view trees), ~5% true DELETE (decorative duplicates only).

### The 9 questions, answered up front

| Question | Answer |
|---|---|
| **What can be stripped without losing site / USP / platform?** | Full GL accounting, automation canvas/webhooks, supplier-workspace-as-SaaS, marketplace/customer consumer layers. All flag-hideable; all preserve USP because USP = compliance + planning + portals, not ERP. |
| **What's only there to look impressive?** | Trial balance, chart of accounts, MTD, journal-ledger; automation node canvas + webhooks + usage-limits; supplier reputation/insights/zones; yield-intelligence/portfolio-intelligence as separate routes. |
| **What's duplicated?** | Settings across **5 surfaces** (`settings` 3, `account` 10, `account-settings` 1, `workspace` 8, `workspace-settings` 24 = 46 routes). Calendar views **twice** (`/calendar/{day,week,month,agenda,gantt}` AND `/calendar/views/{...}`). Money vs Accounting overlap. Supplier accounting/automations/calendar mirror the operator's. |
| **What's too shallow to show?** | `network` (2), `orders` (1), `verification` (1), `messages` (2 — overlaps `portals`), `settings` (3 stragglers), `money/fx`, `money/holds` — thin pages that imply depth that isn't there. |
| **What's too advanced for the first buyer?** | Full GL/MTD, automation canvas, escrow/disputes, FX/multi-country, SSO/white-label/SCIM. A 5–150-unit landlord does not double-entry-book or build webhook DAGs. |
| **What confuses the story?** | Two finance modules (Money + Accounting), Planning sitting in CORE nav un-gated, marketplace/listings/bookings shown to operators who can't transact, supplier-as-SaaS visible at all in V1. |
| **What's expensive to support?** | GL reconciliation correctness, MTD HMRC filing liability, automation webhook reliability, escrow/disputes money-movement, multi-country FX — each a compliance/financial-liability surface. |
| **What separate company is hiding inside?** | Accounting = **Xero**; Automations = **Zapier**; Supplier workspace = **Tradify/Jobber**; Consumer booking = **Airbnb**; Planning = a **deal-analysis SaaS** (BiggerPockets/Lendlord). |
| **Minimum + target route count for paid launch?** | **Minimum strong paid launch: ~110 visible operator routes** behind **8 nav items**. **Target visible surface ~225** (operator 120 + portals 25 + auth 12 + settings 8 + marketing 15 + admin 45). Rest **in code, flag-hidden** (~440 routes). |

---

## 1. The 8-item launch nav (target end-state)

Per §4, the operator must understand the product in 30 seconds. Proposed V1 sidebar (collapses the current 5-group / ~20-item sprawl):

| # | Nav item | Routes folded in | Layer |
|---|---|---|---|
| 1 | **Portfolio** | portfolio, units, tenancies | A |
| 2 | **Work** | work, tasks, jobs, maintenance, suppliers (operator coordination) | A / B |
| 3 | **Compliance** | compliance, legal (RRA-2026, HMO, certs, deposits) | A / C-advanced |
| 4 | **Money** | money (rent, arrears, invoices, expenses, owner statements, deposits, payouts) — **Accounting GL flag-hidden** | A |
| 5 | **Planning** | planning (premium-gated entry) | **C** |
| 6 | **Portals** | portals, messages (tenant/landlord/supplier) | B |
| 7 | **Calendar** | calendar (single tree, views = toggles) | A |
| 8 | **Settings** | one merged settings shell (was 5 surfaces) | A |

Everything else (Accounting GL, Automations canvas, Marketplace, Listings, Bookings, Network, Orders, Affiliates, Customer WS, Supplier-as-SaaS) → **in code, behind existing flags, off primary nav.**

---

## 2. Per-section disposition table (operator app)

Disposition codes: KEEP · SIMPLIFY (keep-but-simplify) · MERGE · HIDE (hide-flag) · DEFER · SPLIT (split-out) · DELETE (delete-archive).

| Section | Routes | Layer | Disposition | Rationale |
|---|---|---|---|---|
| `portfolio` | 25 | A | **KEEP** | Core spine; the reason the buyer pays. |
| `work` | 26 | A | **KEEP** (simplify sub-tabs) | Maintenance/jobs = daily pain. |
| `compliance` | 22 | A→C | **KEEP**; gate advanced (possession packs, RRA flows) to C | The moat. Protect (see doc 09). |
| `legal` | — | A/C | **KEEP**; advanced V1.5 | RRA-2026/HMO licensing = moat. |
| `money` | 29 | A | **SIMPLIFY** | Keep rent/arrears/invoices/expenses/deposits/payouts/owner-statements. **HIDE** escrow, disputes, holds, fx, fee-rules, refunds (marketplace-money, Layer D). |
| `accounting` | 22 | **D** | **HIDE+FLAG** | Full GL = Xero clone. Position as **integration**, not in-app ERP. Keep `owner-statements` link via Money. |
| `contacts` | 14 | A | **SIMPLIFY** | Keep list+detail; collapse thin sub-pages. |
| `suppliers` | 4 | B | **KEEP** (operator coordination) | Not the supplier SaaS — operator's view. |
| `messages` | 2 | A | **MERGE** into Portals/inbox | Too shallow to stand alone. |
| `portals` | 5 | B | **KEEP** | Retention engine; tenant/landlord/supplier. |
| `planning` | 43 | **C** | **SPLIT-OUT + PROTECT** | Premium module; simplify entry (wizard), keep depth. **Do not cut.** See doc 09. |
| `automations` | 20 | C-lite / **D** | **SIMPLIFY→HIDE** | Keep preset recipes + approvals (`canvasLite`). **HIDE** canvas, webhooks, integrations, usage-limits, ai-builder, templates marketplace = Zapier scope. |
| `calendar` | 21 | A | **MERGE** | Two view trees → one; views = toggles. |
| `bookings` | 15 | B/C | **HIDE+FLAG** (`bookingManagement`) | Direct-let ops, V1.5 gated. |
| `listings` | 13 | B/C | **HIDE+FLAG** (`directBookingPages`) | Consumer-facing, not V1 operator. |
| `marketplace` | 19 | **D** | **HIDE+FLAG** (`marketplaceEnabled` OFF) | Airbnb/escrow clone. Keep code. |
| `network` | 2 | B/D | **HIDE** | Too shallow; marketplace-adjacent. |
| `orders` | 1 | D | **HIDE** | One page; marketplace transaction. |
| `verification` | 1 | B | **HIDE** | Supplier-verification; admin-side concern. |
| `affiliates` | 5 | B/C | **KEEP**, payouts flag OFF | Growth lever, low surface. |
| `help` | 1 | A | **KEEP** | Guided-help mount. |
| `changelog` | — | Ops | **KEEP** (passive) | Low cost. |
| `settings` (5 surfaces) | 46 | A | **MERGE** | See §3. |

---

## 3. Settings sprawl — the worst duplication

**Five** distinct settings surfaces, **46 route files** total:

| Surface | Routes | Verdict |
|---|---|---|
| `settings` | 3 (calendar-notifications, compliance, payments-stripe) | **MERGE** — orphan stragglers. |
| `account` | 10 (profile, security, sessions, notifications, preferences, login, activity, connected-accounts, data-privacy, +root) | **MERGE** → user-account tab. |
| `account-settings` | 1 | **DELETE/redirect** — stub duplicate of `account`. |
| `workspace` | 8 (billing ×5 + global ×2) | **MERGE** → Billing tab. |
| `workspace-settings` | 24 (ai, audit, billing, branding, copilot-inbox, danger-zone, data, demo-data, email, integrations, invoices, jurisdiction, navigation, notifications, profile, roles, security, sso, storage, subscription, team, white-label, addons) | **MERGE** → workspace tab; **HIDE** sso/white-label/addons (enterprise, plan-gated). |

**Target:** one `Settings` shell, ~8 tabbed sections (Account · Workspace · Team · Billing · Integrations · Compliance/Jurisdiction · Notifications · Data/Privacy). Enterprise items (SSO, white-label, SCIM) stay in code, plan-gated. **46 → ~8 visible.** Note: `billing` appears in *both* `workspace/billing` and `workspace-settings/billing` and `workspace-settings/subscription` — three billing surfaces; pick one.
> **Reason:** five settings homes is the single clearest "this product was built by committee" signal to a buyer. **Risk:** redirect churn on bookmarks; mitigate with `redirect()` from old paths. **Action:** new `settings/(tabs)` route group; `redirect()` shims from all 5 old roots.

---

## 4. Calendar duplication — delete one tree

Verified: `/calendar/{day,week,month,agenda,gantt,timeline,schedule}` exist at top level **AND** `/calendar/views/{day,week,month,agenda,week,gantt}` exist again under `/views/`. That is **5–6 view renderers built twice**.

| Keep | Cut/merge |
|---|---|
| `calendar/page.tsx` (host) with **view toggle** (day/week/month/agenda/gantt/timeline as in-page state) | **DELETE** the entire `calendar/views/*` subtree (6 routes) — pure duplicate. |
| `calendar/events/*`, `calendar/reminders/*` (CRUD) | Keep. |
| `calendar/settings` | **MERGE** into Settings. |

> **Reason:** §3 binds "Calendar → MERGE views to toggles (not N routes)". **Risk:** none — `/views/*` is a parallel implementation; **[VERIFY]** no nav links to `/views/` before delete (grep `calendar/views`). **Action:** route-state `?view=` param; delete `views/` tree; 21 → ~6 routes.

---

## 5. Supplier workspace — a second company mirrored

`(supplier-workspace)/supplier/` = **113 routes**, including a **full second copy** of:

- `supplier/accounting` — **22 routes** (mirrors operator GL)
- `supplier/automations` — **14 routes** (mirrors operator Zapier)
- `supplier/calendar` — **16 routes** (mirrors operator calendar)

Plus reputation, insights, zones, coverage, packages, leads, earnings, finance, payouts, escrow-adjacent disputes — i.e. a complete **Tradify/Jobber field-service SaaS**.

| Disposition | Detail |
|---|---|
| **HIDE+FLAG** entire `supplierWorkspace` (flag exists, default OFF) | In V1 suppliers act via **portal + operator coordination** (`portals`, operator `suppliers`). §3 is explicit: "mirrored accounting/automations/calendar = CUT from supplier". |
| **CUT from supplier** (do not ship even when supplier WS turns on later without review): `supplier/accounting` (22), `supplier/automations` (14) | A supplier does not need double-entry GL or a webhook builder inside Propvora. This is the clearest "looks impressive, supports nothing" bloat. |
| **SPLIT-OUT** | The independent-supplier SaaS is a *future separate app* (§3 Layer D/C). Keep code, flag OFF, do not put in any V1 story. |

> **Reason:** 50 of 113 supplier routes are mirrored back-office clones. **Risk:** none for V1 (flag OFF). **Action:** confirm `supplierWorkspace` flag gates the route group at the shell; mark accounting/automations subtrees as deferred-even-on-flag.

---

## 6. 10-axis scoring — major features

Scores 1–10 (10 = strongest case). Axes per §5: Customer-pain (CP), Revenue (Rev), USP, Frequency (Freq), Complexity (Cx — *higher = more complex = worse*), Support-burden (SB — *higher = worse*), Data/compliance-risk (DR — *higher = worse*), Launch-readiness (LR), Nav-clarity (NC — value of having it clearly in nav), Strategic-fit (SF).

| Feature | CP | Rev | USP | Freq | Cx | SB | DR | LR | NC | SF | **Decision** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Compliance (certs/HMO/deposits)** | 10 | 8 | 10 | 9 | 6 | 5 | 8 | 8 | 9 | 10 | **KEEP** — the moat |
| **Legal / RRA-2026 possession** | 9 | 7 | 10 | 5 | 7 | 6 | 9 | 6 | 8 | 10 | **KEEP** core, gate advanced → C |
| **Portfolio / tenancies** | 10 | 9 | 6 | 10 | 5 | 4 | 5 | 9 | 10 | 9 | **KEEP** |
| **Work / maintenance** | 9 | 7 | 5 | 9 | 5 | 5 | 4 | 8 | 9 | 8 | **KEEP** |
| **Money basics** | 9 | 8 | 5 | 9 | 5 | 6 | 6 | 8 | 9 | 8 | **KEEP** (simplify) |
| **Planning engine** | 7 | 9 | 10 | 4 | 8 | 6 | 4 | 6 | 7 | 10 | **SPLIT-OUT + PROTECT** (premium C) |
| **Portals** | 8 | 7 | 8 | 7 | 6 | 5 | 5 | 7 | 8 | 9 | **KEEP** |
| **Calendar** | 6 | 4 | 3 | 7 | 5 | 4 | 3 | 7 | 6 | 5 | **MERGE** views→toggles |
| **Contacts** | 6 | 4 | 3 | 6 | 3 | 3 | 4 | 8 | 6 | 5 | **SIMPLIFY** |
| **Settings (×5)** | 5 | 3 | 2 | 4 | 7 | 7 | 6 | 6 | 3 | 4 | **MERGE** → 8 tabs |
| **Accounting full GL/MTD** | 4 | 5 | 2 | 3 | 10 | 9 | 10 | 4 | 3 | 3 | **HIDE+FLAG** (Xero integration) |
| **Automations canvas/webhooks** | 4 | 4 | 3 | 3 | 10 | 9 | 7 | 4 | 3 | 3 | **HIDE+FLAG**; keep `canvasLite` recipes |
| **Automations recipes/approvals** | 6 | 5 | 5 | 5 | 4 | 4 | 4 | 6 | 5 | 6 | **KEEP small** (canvasLite) |
| **Marketplace (stays/escrow/disputes)** | 3 | 6 | 4 | 2 | 9 | 9 | 9 | 5 | 2 | 5 | **HIDE+FLAG** (Airbnb, V2) |
| **Bookings / listings** | 4 | 5 | 4 | 3 | 7 | 6 | 6 | 5 | 3 | 5 | **HIDE+FLAG** (V1.5) |
| **Supplier workspace (SaaS)** | 3 | 5 | 4 | 2 | 9 | 9 | 6 | 5 | 2 | 4 | **HIDE+FLAG / SPLIT** (Tradify, V2) |
| **Supplier accounting/automations** | 2 | 2 | 1 | 1 | 9 | 9 | 8 | 4 | 1 | 2 | **CUT** (mirror bloat) |
| **Customer/guest workspace** | 2 | 5 | 3 | 2 | 8 | 7 | 6 | 5 | 2 | 4 | **HIDE** (`customerWorkspace` OFF) |
| **Affiliates** | 5 | 6 | 4 | 3 | 4 | 4 | 4 | 6 | 5 | 6 | **KEEP**, payouts OFF |
| **AI Copilot/inbox** | 7 | 7 | 7 | 6 | 7 | 6 | 6 | 6 | 6 | 8 | **KEEP**, entitlement-gated (`aiCopilot`) |
| **Network / Orders / Verification** | 2 | 3 | 2 | 2 | 4 | 4 | 4 | 4 | 2 | 3 | **HIDE** (thin/marketplace) |

---

## 7. Disposition rollup

| Disposition | Count of sections/features | Examples |
|---|---|---|
| **KEEP** | 9 | Portfolio, Work, Compliance, Legal, Money-basics, Portals, Affiliates, Help, AI Copilot |
| **SIMPLIFY** | 4 | Money, Contacts, Work sub-tabs, automations-recipes |
| **MERGE** | 3 | Settings (5→1), Calendar (2 trees→1), Messages→Portals |
| **HIDE+FLAG** | 8 | Accounting GL, Automations canvas, Marketplace, Bookings, Listings, Customer WS, Supplier WS, Network/Orders |
| **DEFER** | 2 | Consumer booking, emergency marketplace |
| **SPLIT-OUT** | 2 | Planning (premium module), Supplier-as-SaaS (future app) |
| **DELETE/ARCHIVE** | 2 | `calendar/views/*` (dup tree), `account-settings` (stub dup) |

**DELETE is deliberately tiny.** The brief's §6 insight holds: this is a flag/nav exercise, not demolition.

---

## 8. Route math — does it hit target?

| Bucket | Current | After |
|---|---|---|
| Operator app | 351 | ~110–120 visible (rest flag-hidden) |
| Settings (5 surfaces) | 46 | ~8 |
| Calendar | 21 | ~6 |
| Accounting | 22 | 0 visible (flag) |
| Automations | 20 | ~4 visible (recipes/approvals), 16 flag |
| Marketplace/listings/bookings/network/orders | ~55 | 0 visible (flags) |
| Supplier WS | 113 | 0 visible V1 (flag); accounting/automations CUT |
| **Visible operator** | **~351** | **~110–130 ✅ (§4 target)** |
| **Total visible surface** (op+portals+auth+settings+marketing+admin) | — | **~225 ✅ (§4)** |

---

## 9. Implementation order (every item = Reason + Risk + Action)

1. **Nav collapse to 8 items** — *Reason:* 30-second comprehension (§4). *Risk:* operators lose muscle-memory links. *Action:* rewrite `SideNavigation.tsx NAV_GROUPS`; flag-gate hidden items.
2. **Settings merge (46→8)** — *Reason:* worst duplication signal. *Risk:* bookmark breakage. *Action:* `settings/(tabs)` group + `redirect()` shims from `account`, `account-settings`, `workspace`, `workspace-settings`, `settings`.
3. **Delete `calendar/views/*` + merge to toggles** — *Reason:* literal duplicate tree. *Risk:* low. *Action:* `[VERIFY]` no inbound links; `?view=` param; delete subtree.
4. **Flag-hide Accounting GL / Automations canvas / Marketplace / Bookings / Listings / Customer / Supplier WS** — *Reason:* four hidden companies. *Risk:* none (flags exist, default OFF). *Action:* confirm shell-level gating; position Accounting as Xero **integration** in copy.
5. **Money simplify** — *Reason:* split A-layer money from D-layer marketplace money. *Action:* hide escrow/disputes/holds/fx/fee-rules/refunds behind `marketplacePayments`.
6. **Planning → premium gate, simplify entry** — *Reason:* protect USP, monetise. *Action:* gate by entitlement; wizard as default entry (see doc 09).

---

## 10. Contradictions flagged (for `19-founder-decision-lock.md`)

- **[VERIFY] Sidebar already exceeds target.** Brief §6 describes nav as "Overview/Core/Finance/Operations/System"; live `SideNavigation.tsx` confirms ~20 items / 5 groups — *already* over the ≤8 target. The brief states the goal as if aspirational; in reality the regression is live and shipping. Reconcile: is 8 items a hard launch gate or a V1.5 goal?
- **[VERIFY] Planning is in CORE nav today, un-gated.** Live nav puts `Planning` in CORE alongside Portfolio. Brief §3 says Planning = Layer C / V1.5 / premium-gated. Contradiction: it is currently a free, primary-nav item. Decision needed: ship gated in V1.5 vs. leave free in V1.
- **[VERIFY] `account-settings` (1 route) vs `account` (10) vs `workspace-settings` (24).** Three of the five settings surfaces overlap in purpose (profile, security, notifications appear in multiple). Need a single owner before redirect shims.
- **[ASSUMPTION] Supplier `accounting`/`automations` have no operator dependency.** Assumed isolated to supplier shell; verify no shared imports before treating as CUT.
- **[ASSUMPTION] Money's escrow/disputes/holds are gated by `marketplacePayments`/`marketplaceEscrow`.** The flag registry has these keys; verify the Money routes actually read them (some may render unconditionally today).

---

## Evidence Appendix (verified 2026-06-18)

- Operator app routes: **351** (`find src/app/(app) -name page.tsx`).
- Supplier workspace routes: **113**; mirrored: accounting **22**, automations **14**, calendar **16**.
- Accounting: **22** routes incl. `ledger/{journal,chart,trial-balance}`, `mtd`, `reconciliation`, `client-accounts`, `forecast` — verified.
- Automations: **20** routes incl. `canvas`, `webhooks`, `integrations`, `usage-limits`, `ai-builder`, `templates`, `runs` — verified.
- Planning: **43** routes (profiles, sets, wizard, yield-/portfolio-intelligence, landlord-offers) — verified.
- Calendar: **21** routes; duplicate `views/*` subtree (6) confirmed alongside top-level views.
- Settings surfaces: `settings` 3 · `account` 10 · `account-settings` 1 · `workspace` 8 · `workspace-settings` 24 = **46** — verified.
- Money: **29** routes (basics + escrow/disputes/holds/fx/fee-rules) — verified.
- Flag registry: `src/lib/flags/registry.ts` — all V2 flags default OFF — verified.
- Nav: `SideNavigation.tsx NAV_GROUPS` = 5 groups / ~20 items — verified.
