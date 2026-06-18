# 17 — Deprecation & Feature-Flag Plan (SAFE, staged, non-destructive)

**Status:** Draft · 2026-06-18 · conforms to `_shared-strategic-brief.md` (Model 2
staged property OS; Layer map §3; flag registry §6). **This is a PLAN — it deletes
nothing.** Every item = **Reason + Risk + Implementation action.**

## 0. Governing principle

Brief §6: *"The deprecation plan is mostly flag config, not code deletion."* Mostly
true — **with one correction surfaced in doc 01 §O.2:** the 16-key registry
(`src/lib/flags/registry.ts`, all default OFF) exists and is excellent, **but it is
not yet consumed by nav or the proxy.** `SideNavigation.tsx` hardcodes every group;
`src/lib/flags/route-registry.ts` is dormant unless `contextEngine` is ON
(`src/proxy.ts:188–217`). So "nav hide via flags" requires first writing a thin
flag-consumption layer. That work is **additive and reversible** — it never deletes a
route, it only decides whether to *render a nav link* / *redirect a URL*. The plan
stays flag-first and safe.

**Order of safety (apply in this order, never skip ahead):**
inventory → dependency map → **nav hide** (reversible, no route change) → **feature
flags** (gate render/route) → **redirects** (collapse duplicates) → **merge duplicate
UI** (shared components) → **remove dead routes** (only after tests) → update docs →
update release checklist → browser test.

---

## (a) Flag → V-stage mapping

Every existing key in `src/lib/flags/registry.ts` (`V2_FLAG_KEYS`), each `defaultEnabled:
false`. Target state per release. "ON" = global `platform_feature_flags` row enabled.

| Flag key | dbKey | Unlocks | V1 | V1.5 | V2 | Reason |
|---|---|---|---|---|---|---|
| `contextEngine` | `context_engine` | routeContext gating (proxy guard active) | OFF | OFF | **ON** | Brief §6: "Off = V1 single-context." Needed before customer/supplier route-type enforcement |
| `marketplaceEnabled` | `marketplace_enabled` | master marketplace switch | OFF | OFF | **ON** | Layer D; needs liquidity plan (brief §1) |
| `marketplaceStays` | `marketplace_stays` | stay listings | OFF | OFF | **ON** | Child of master |
| `marketplaceSuppliers` | `marketplace_suppliers` | supplier service listings | OFF | OFF | **ON** | Child |
| `marketplaceEmergency` | `marketplace_emergency` | emergency dispatch | OFF | OFF | **ON** | Child; highest trust/safety burden |
| `marketplacePayments` | `marketplace_payments` | capture/payout/commission | OFF | OFF | **ON** | Needs Stripe Connect liquidity |
| `marketplaceEscrow` | `marketplace_escrow` | holds/delayed capture | OFF | OFF | **ON** | Depends on payments |
| `marketplaceDisputes` | `marketplace_disputes` | dispute lifecycle | OFF | OFF | **ON** | Depends on payments+escrow |
| `bookingManagement` | `booking_management` | reservation ops (calendar/turnover) | OFF | **ON (gated)** | ON | Brief §3 Layer B/C V1.5 |
| `directBookingPages` | `direct_booking_pages` | public direct-booking pages | OFF | **ON (gated)** | ON | V1.5 SA/serviced accommodation |
| `customerWorkspace` | `customer_workspace` | `(customer)` group + `/user/*` | OFF | OFF | **ON** | Brief §3 Layer D consumer = V2 |
| `supplierWorkspace` | `supplier_workspace` | full `(supplier-workspace)` | OFF | OFF | **ON** | Brief §3: V1 suppliers act via portal only |
| `icalSync` | `ical_sync` | channel iCal import/export | OFF | **ON (gated)** | ON | Pairs with bookingManagement |
| `canvasLite` | `canvas_lite` | preset recipes/approvals (Layer C-lite) | OFF | **ON** | ON | Brief §3 KEEP small at V1.5 |
| `multiCountryPortfolio` | `multi_country_portfolio` | per-property country/currency | OFF | OFF | **ON** | UK-first wedge (brief §2) |
| `globalCountryPacks` | `global_country_packs` | country legal/tax packs | OFF | OFF | **ON** | UK-first |

### Proposed NEW flag keys (gap from doc 01 §O.3)

| New key | dbKey | Unlocks | V1 | Reason | Risk |
|---|---|---|---|---|---|
| `accountingGl` | `accounting_gl` | full double-entry GL (`accounting/ledger/*`, `mtd`, `reconciliation`, `accounts/journal-ledger`) — 22 routes | OFF | Brief §3 binding: HIDE+FLAG, reframe as Xero/QuickBooks integration. No key exists today | Low — additive; defaults OFF; Money basics (invoices/expenses/owner-statements) stay outside the flag |
| `automationsFull` | `automations_full` | canvas/builder/webhooks/usage/integrations (~12 routes) vs `canvasLite` recipes | OFF | Brief §3: full canvas = Layer D V2; `canvasLite` covers V1.5 recipes only | Low — additive |

> `aiCopilot` is **not** a registry flag — it is an entitlement in
> `src/lib/billing/entitlements.ts` (per-plan). Keep it there; do not duplicate into
> the flag registry. Gate AI routes/nav via the existing entitlement (brief §3).

---

## (b) Per-route disposition: remove-from-nav-now / hide-behind-flag / merge / redirect / archive

| Area (doc 01 ref) | Disposition | Flag / action | Reason | Risk |
|---|---|---|---|---|
| Accounting GL (E5, 22) | **HIDE-BEHIND-FLAG** | new `accountingGl` OFF | Layer D ERP scope on a compliance wedge muddies 30-sec story (brief §4) | Low (additive); some Money pages import accounting helpers → keep lib, hide routes only [VERIFY imports] |
| Bookings + Listings (E6, 28) | **HIDE-BEHIND-FLAG** | `bookingManagement`/`directBookingPages` OFF (ON V1.5) | Layer B/C V1.5 | Low |
| Operator marketplace consumer (E8, ~13) | **HIDE-BEHIND-FLAG** + redirect dup | `marketplaceEnabled` OFF | Layer D; dup-of public MP | Low |
| Public marketplace + booking (C, ~38) | **HIDE-BEHIND-FLAG** | `marketplaceEnabled`/`directBookingPages` OFF | Layer D consumer = V2 | Med — public URLs may be indexed/linked; return 404/redirect to `/` when flag OFF |
| Customer workspace (I, 46) | **HIDE-BEHIND-FLAG** | `customerWorkspace` OFF | Layer D V2 | Low |
| Supplier workspace genuine (J, ~63) | **HIDE-BEHIND-FLAG** | `supplierWorkspace` OFF | Brief §3 V1 = portal only | Low |
| Supplier shims (J, 50 re-exports) | **ARCHIVE** (after dep check) | move to `_archive/` or delete | Brief §3: mirrored accounting/automations CUT | Med — they `export { default } from` operator pages; verify no inbound links/tests reference `/supplier/accounting/*` first |
| Automations full canvas (E10, ~12) | **HIDE-BEHIND-FLAG** | new `automationsFull` OFF; keep `canvasLite` recipes | Brief §3 Layer D | Low |
| Automations lite (E10, 7) | **REMOVE-FROM-NAV-NOW until V1.5** | `canvasLite` OFF in V1, ON V1.5 | KEEP small but not a V1 launch story | Low |
| Money escrow/holds/disputes (E5) | **HIDE-BEHIND-FLAG** | `marketplaceEscrow`/`Disputes` OFF | Depends on payments | Low |
| Booking/host/guest legal (B, 22) | **REMOVE-FROM-`/legal`-INDEX-NOW** | conditional render on parent flag | Listing host/booking terms on a compliance product confuses the wedge | Low — pages stay reachable by direct URL, just unlinked |
| Calendar views (E9, 21) | **MERGE→toggles** | redirect `views/*` ↔ top-level to one switcher | Brief §3 "merge views to toggles, not N routes" | Med — two parallel trees; pick canonical, redirect other |
| Settings + billing (E1, ~35) | **MERGE→~8 tabs** | redirect old paths to tabbed structure | Brief §3 "45 routes → clean tabbed" | Med — many inbound links; redirect, don't delete |
| Supplier surface ×3 (E8) | **MERGE** | `suppliers/*`→`suppliers-hub`+`work/suppliers` | Brief §5 MERGE | Med |
| Listings ×2 (E6) | **MERGE** | one editor behind booking flags | Dedupe | Low (both flagged off anyway) |
| Public discovery ×2 (C5) | **MERGE + redirect** | extend existing `next.config.ts` redirects | Two parallel stacks | Low (redirects partly exist) |
| `account` vs `account-settings` (E1) | **MERGE→redirect** | `account-settings`→`/account` | Duplicate | Low |
| `(states)/portal-expired` vs `(portal)/portal/expired` (M) | **MERGE→redirect** | one canonical | Duplicate | Low |
| Network/agency (E9) | **REMOVE-FROM-NAV-NOW** | hide link | Unclear V1 value (brief §5 DEFER) | Low |
| Admin marketplace moderation (K) | **KEEP, no nav weight** | dormant until `marketplaceEnabled` | Control plane; brief §6 KEEP | None |
| Operator core / portals / compliance / legal / planning / money-basics | **KEEP** | — | Layer A/B/C V1 | None |
| Planning engine (E7, 43) | **KEEP + SPLIT-OUT premium** | entitlement gate V1.5, NOT a registry flag | Brief §2 protect | None — do not flag-hide; gate by plan |
| All 150 API routes (L) | **KEEP (dormant)** | no change | Fail-closed when feature OFF | None |

---

## (c) Dependency-map note (build before any hide/merge)

Before hiding or merging, build a dependency map so nothing breaks. Inputs:

1. **Inbound links** — grep `href=`/`Link`/`router.push`/`redirect(` for each route to
   be hidden/merged. e.g. `grep -rn "accounting/ledger" src/` before flagging GL.
2. **Shared libs** — `src/lib/accounting/*`, `src/lib/payments/*`, `src/lib/supplier/*`
   are imported by KEEP surfaces too (e.g. Money basics may use `src/lib/accounting`).
   **Hide routes, never delete the lib.** [VERIFY] which Money pages import accounting.
3. **Re-export shims** — the 50 supplier pages `export { default } from "@/app/(app)/app/…"`.
   Deleting the *operator* target would break the supplier shim and vice-versa. Map the
   shim→target edges first (`grep -rn 'export { default } from' src/app/\(supplier-workspace\)`).
4. **Flag consumers** — currently almost none in nav. The new nav-consumption layer
   (step 3 below) is the single chokepoint; centralise flag reads in one
   `getNavForWorkspace(flags)` helper so a flag flip can't half-hide a section.
5. **Proxy redirects** — `route-registry.ts` + `proxy.ts` already provide a guard seam;
   reuse it for flag-off URL redirects instead of inventing a parallel mechanism.
6. **API ↔ surface** — confirm no KEEP surface calls a flagged-off API. e.g. tenant
   portal must not call `supplier/*` endpoints. [VERIFY] per `(b)` HIDE rows.

Deliverable: a `dependency-map.json` (route → {inboundLinks[], sharedLibs[], apis[],
flag}). Gate every subsequent step on it.

---

## (d) Staged sequence (the safe path)

| Step | Action | Output | Reversible? |
|---|---|---|---|
| 1 | **Inventory** | doc 01 (this pack) | n/a |
| 2 | **Dependency map** | `dependency-map.json` (per §c) | n/a |
| 3 | **Nav hide** — write `getNavForWorkspace(flags)` consuming `isFeatureEnabled`; remove hardcoded Bookings/Listings/Marketplace/Automations(full) links from `SideNavigation.tsx`; conditionally render `/legal` index entries | Operator nav = 8 V1 stories; no route deleted | ✅ flip flag/back |
| 4 | **Feature flags** — seed `platform_feature_flags` rows (all OFF) incl. new `accountingGl`,`automationsFull`; add flag check to page shells of HIDE areas (render "not available" / redirect) | Flagged surfaces dark by default | ✅ |
| 5 | **Redirects** — extend `next.config.ts` redirects + `route-registry.ts` guard: dup paths → canonical (calendar views, settings, account-settings, public discovery, portal-expired) | Duplicates collapse to one URL | ✅ (redirects, not deletes) |
| 6 | **Merge duplicate UI** — extract shared components (calendar view switcher, settings tabs, portal role pages, supplier hub); point both old paths at shared comp | One implementation, two entry URLs | ⚠️ code change, revert via git |
| 7 | **Remove dead routes** — ONLY the 50 supplier shims + truly orphaned dup pages, **only after** §c dep-map shows zero inbound + tests green. Move to `docs/_archive/` or delete in a dedicated PR | Surface shrinks to ~225 visible (brief §4) | ⚠️ git-revertible; do last |
| 8 | **Update docs** — refresh `docs/_coverage matrix.md`, this pack, `00-route-inventory` deltas | Docs match reality | n/a |
| 9 | **Update release checklist** — `docs/Release-Readiness-Takslist.md`: add "all V2 flags OFF in prod", "nav = 8 items", "no booking/host legal in /legal index" gates | Release gate encodes the plan | n/a |
| 10 | **Browser test** — crawl V1 nav with all flags OFF (use `route-crawl-skill`/`browse`); confirm zero marketplace/customer/supplier/GL surface reachable from nav; flip each flag in staging and confirm surface lights up | Evidence pack | n/a |

> **Steps 3–5 are 100% reversible** (flag flips + redirects). The only irreversible-ish
> step (7) is gated on tests and confined to shims/orphans, in its own PR. This matches
> brief §6: "mostly flag config."

---

## (e) Rollback plan

| Failure | Detection | Rollback |
|---|---|---|
| Nav hide removes a needed V1 link | Operator can't reach Compliance/Money etc. (smoke test step 10) | Re-add link in `getNavForWorkspace`; nav config is data, instant revert |
| Flag flip darkens a V1 surface | 404/redirect on a KEEP route | Set `platform_feature_flags` row back / delete row → registry default OFF means *V1* stays lit (V1 surfaces are NOT flagged); flags only gate V2 — so a bad flag can only over-hide V2, never V1 |
| Redirect loop / wrong canonical | Crawl shows 308 loop | Remove the redirect entry in `next.config.ts` (config-only, redeploy) |
| Merge breaks shared component | Visual/functional regression in both entry URLs | `git revert` the merge PR; old per-route files still present until step 7 |
| Shim removal breaks an inbound link missed by dep-map | 404 on `/supplier/accounting/*` | `git revert` the deletion PR; shims restored. (Why step 7 is last + isolated) |
| Whole plan needs abort | — | Because nothing V1 is flagged and removals are last+isolated, aborting = revert nav PR + clear flag rows; app returns to today's behaviour exactly (registry defaults OFF ⇒ "look and behave exactly as V1" per `registry.ts` header) |

**Master safety net:** the registry header guarantees *all flags OFF ⇒ V1 unchanged*.
As long as V1 surfaces are never put behind a flag, the worst a misconfiguration does is
hide a V2 surface that was meant to be hidden anyway.

---

## (f) DB tables: keep / likely-unused / future-flag

Cross-ref `docs/final-wiring/live-schema.md` (433 tables). **Do not drop any table** —
this is a plan; dormant tables are cheap and the V2 path needs them. Best-effort buckets
([VERIFY] all against live-schema):

| Bucket | Example tables (inferred) | Disposition | Reason |
|---|---|---|---|
| **KEEP (V1 core)** | workspaces, workspace_members, properties, units, tenancies, tasks, jobs, ppm_*, compliance_*, certificates, inspections, possession_cases, hmo_licences, documents, invoices, expenses, bills, owner_statements, portal_sessions, portal_messages, profiles, subscriptions, plans, stripe_*, audit_log, notifications, newsletter_subscribers | Active | Wedge + portals + billing |
| **KEEP (config, low write)** | platform_feature_flags, workspace_feature_flags, country_packs [V], jurisdictions [V] | Active (flags), dormant (packs) | Flag engine + future packs |
| **FUTURE-FLAG (V1.5)** | planning_sets, planning_profiles, forecasts, scenarios, landlord_offers, booking_*, listings, listing_channels, ical_connections, automation_definitions, automation_runs, automation_recipes | Keep; populated when `bookingManagement`/`canvasLite`/planning entitlement ON | Layer C V1.5 |
| **FUTURE-FLAG (V2)** | marketplace_listings, marketplace_orders, marketplace_enquiries, escrow_*, holds, disputes, payouts, commissions, customer_*/let_* (per memory: migration `20260617230000` NOT applied), supplier_workspace_*, supplier_services, supplier_packages, supplier_payouts, supplier_team, reviews, ratings | Keep; populated when `marketplaceEnabled`/`customerWorkspace`/`supplierWorkspace` ON | Layer D V2 |
| **LIKELY-UNUSED (verify)** | accounting GL tables (journal_entries, ledger_accounts, trial_balance snapshots, mtd_*, reconciliation_*) | Keep but mark `accountingGl`-gated; **[VERIFY] whether any have rows / are written by Money basics** | Brief §3 reframes GL as integration; tables may be empty scaffolds |
| **VERIFY (orphans)** | any table referenced only by the 50 supplier shims or by `network/agency` pages | Keep until dep-map proves zero references | Don't drop on suspicion (standards: "do not delete a gap") |

> RLS note: every KEEP/portal table is RLS-scoped (brief §6). When flag-hiding a
> surface, **do not relax RLS** — a dormant table with strict RLS is the safe state.
> The flag accessor (`src/lib/flags/index.ts`) already fails closed on RLS denial.

---

## (g) Acceptance gates (add to release checklist)

1. `grep -rn "isFeatureEnabled\|getNavForWorkspace" src/components/shell` returns the new
   consumption layer (currently 0 — the gap from §0).
2. With all `platform_feature_flags` rows OFF/absent: operator nav shows exactly the 8
   V1 stories; no marketplace/customer/supplier/GL/full-automation link rendered.
3. `/legal` index lists only the 10 core/affiliate policies; booking/host/guest terms
   reachable by direct URL only.
4. Crawl (browser test) of every KEEP route returns 200; every HIDE route returns
   redirect-to-`/` or "not available" while its flag is OFF.
5. Visible route count ≈ **225** (brief §4); operator-visible ≈ **110–130**.
6. No V1 surface sits behind any flag (verified by listing flagged page shells).

---

## (h) Brief contradictions carried from doc 01

- **§O.2 (flag wiring):** registry exists but is not consumed by nav/proxy → "nav hide"
  step needs net-new (additive, reversible) wiring. Plan still flag-first/safe.
- **§O.3 (missing keys):** propose adding `accountingGl` + `automationsFull` to
  `registry.ts` (defaults OFF) to honour brief §3's HIDE/FLAG for GL and automation
  canvas. Without them those areas can only be nav-hidden, not flag-gated.
- **Reconcile in `19-founder-decision-lock.md`.**
