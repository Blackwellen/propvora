# 10 — Navigation & Route Redesign

**Status:** Draft · 2026-06-18 · author: product architect + UX lead
**Conforms to:** `_shared-strategic-brief.md` (Verdict §1 = Model 2 staged OS; Layer map §3; route targets §4; flag registry §6).
**Binding constraint:** a new operator must understand the product in **30 seconds** → **≤8 sidebar items**, zero ERP jargon on the surface.

> Every recommendation below is **Reason + Risk + Implementation action**. Assumptions are `[ASSUMPTION]`; items needing live verification are `[VERIFY]`. Contradictions with the brief are flagged in §12.

---

## 0. What exists today (deep inspection — cited)

### 0.1 Operator side-nav — `src/components/shell/SideNavigation.tsx`
The `NAV_GROUPS` const (lines 68–111) ships **18 destinations across 5 groups**:

| Group | Items (real `href`s) |
|---|---|
| OVERVIEW | Home `/property-manager` |
| CORE | Portfolio, Work, **Bookings** `/bookings`, **Listings** `/listings`, Suppliers (`/marketplace/suppliers-hub`), **Planning**, Contacts, **Portals**, Messages |
| FINANCE | Money, **Accounting** `/accounting`, **Affiliate** `/affiliates` |
| OPERATIONS | **Calendar** `/calendar`, Compliance, Legal, **Automations** `/automations` |
| SYSTEM | Workspace (`/workspace-settings`), **Billing** (`/workspace/billing`) |

**Problem:** 18 top-level items is more than double the 30-second budget. It surfaces V2 marketplace concepts (Bookings, Listings, Suppliers→marketplace hub), a full GL (Accounting), the full Automations canvas, and a premium engine (Planning) all flat, with no staging. CORE alone is 9 items.

### 0.2 Supplier workspace nav — `src/components/supplier-workspace/nav.ts`
Plan-gated (`solo` / `team` / `enterprise`) — `SUPPLIER_NAV_GROUPS_SOLO` (lines 102–110) and `_TEAM` (113–121). Both **mirror the operator** with their own **Finance + Accounting** (`/supplier/accounting`, line 89), **Automations** (`/supplier/automations`, 94), and **Calendar** (`/supplier/calendar`, 85, plus a bespoke `/supplier/schedule` hub at line 83 that the file's own comment admits is "kept (reachable by URL)"). This is the "supplier accounting mirror" the brief (§3) says to **CUT** — in V1 suppliers act via the portal + operator coordination.

### 0.3 Customer top-nav — `src/features/customer/shell/CustomerTopNav.tsx`
9-item top nav (`NAV`, lines 52–62): Home, Stays, Lets, Favourites, Messages, Bookings, Payments, Reviews, Help. **Top-nav only, no sidebar** (comment lines 38–40). Account menu (lines 64–71) already routes a **single** `/customer/account-settings` with `?tab=` params — the clean-settings pattern we want operator to adopt. Customer = Layer D, `customerWorkspace` flag **OFF** for V1.

### 0.4 Operator top-nav — `src/components/shell/TopNavigation.tsx`
`WorkspaceSwitcher` (lines 55–259): reads `workspace_members` → groups by `type` (operator/supplier/customer), but **filters customer out** (line 123 — "buyer/guest identity, not a workspace you switch into"). Cross-type switch does a **hard `window.location.assign`** (line 148) to cross route-group layouts. `TopNavigation` (261–307) = switcher + `GlobalSearch` + `QuickCreateButton` + `NotificationBell` + `TutorialLauncher` + a **standalone Calendar shortcut button** (lines 295–301 → `${base}/calendar`) + `AccountMenu`.

### 0.5 Cross-persona links — `src/components/shell/PersonaLinks.tsx`
**Already built.** Reads `workspace_members` → `workspaces.type`, renders "Go to customer/property-manager/supplier" only for personas the account actually has (no dead links), and switches via `switchToPersona()` (`src/lib/actions/workspace`) + hard nav. Used in `AccountMenu` (targets `["customer"]`, line 143) and `CustomerTopNav` (targets `["operator","supplier"]`, line 237). **This is the app-launcher primitive — reuse it, do not rebuild.**

### 0.6 Portal nav — `src/components/shells/portal/portal-nav.ts` + `PortalSideNavigation.tsx`
Three external portals (`tenant` / `landlord` / `supplier`) with tight, correct nav configs (`PORTAL_NAV`, lines 29–65): tenant = Dashboard/Tenancy/Documents/Payments/Maintenance/Messages; landlord = +Properties/Financials; supplier-portal = Jobs/Invoices/Payments/Documents/Messages. **No auth coupling, secure-link session, sign-out via `POST /api/portal/logout`.** This is already lean and Layer B — keep.

### 0.7 Admin nav — `src/components/shells/AdminShell.tsx`
`ADMIN_NAV_GROUPS` (lines 47–123): **~45 items / 7 groups** (Overview, Platform, Data, Marketplace, Ops, Comms, System). This is the **control plane** (Layer Ops) — internal, never customer nav. Keep as-is structurally; only note marketplace-moderation items stay dark until `marketplaceEnabled`.

### 0.8 The 45 settings routes (the mess) — `src/app/(app)/app/**`
Four parallel trees:
- **`workspace-settings/*` (22):** root, profile, branding, white-label, navigation, team, roles, security, sso, integrations, email, notifications, ai, copilot-inbox, storage, data, demo-data, jurisdiction, audit, danger-zone, addons, subscription, invoices, billing.
- **`account/*` (11):** root, profile, preferences, notifications, security, sessions, login, connected-accounts, data-privacy, activity.
- **`workspace/*` (9):** workspace/billing (+checkout, renewals, add-ons, cancellation, history), workspace/global (+privacy).
- **`settings/*` (3):** compliance, payments-stripe, calendar-notifications.

Plus `compliance/settings`, `calendar/settings`, `affiliates/settings`, `automations/settings` (section-local). **Billing exists in THREE places**: `workspace-settings/billing`, `workspace-settings/subscription`, `workspace-settings/invoices`, AND `workspace/billing/*`. This is the single worst nav-clarity defect in the operator app.

### 0.9 Calendar duplication — `src/app/(app)/app/calendar/**`
**~22 operator calendar routes** for what is one surface: `calendar/{month,week,day,agenda,gantt,timeline,schedule,agenda}` AND a **nested duplicate** `calendar/views/{month,week,day,agenda,gantt}`, plus `calendar/events/*`, `calendar/reminders/*`, `calendar/settings`. Then **two more** calendar entry points exist outside `/calendar`: `work/calendar` and `bookings/calendar`. Supplier mirrors the whole thing again under `supplier/calendar/**` (~16 routes). The brief (§3) is explicit: **MERGE views to toggles, not N routes.**

---

## 1. Target architecture overview

```
TOP NAV (chrome, all operator routes)
  WorkspaceSwitcher · GlobalSearch · QuickCreate · Notifications · Help · AccountMenu(+PersonaLinks)
SIDE NAV (operator) — ≤8 items, staged by V-tier + flags
PORTAL NAV (external, secure-link) — unchanged, lean
ADMIN NAV (control plane) — unchanged, internal only
MOBILE NAV — bottom bar (4) + "More" sheet, driven by the SAME config
```

The redesign is **90% flag config + nav-list trimming + redirects**, not code deletion — every V2 surface already sits behind the registry in `src/lib/flags/registry.ts` (brief §6).

---

## 2. V1 CORE operator side-nav — **8 items** (the 30-second story)

Replace `NAV_GROUPS` in `SideNavigation.tsx`. Two groups only (the 5-group taxonomy is itself over-structured for 8 items). Each item is a **section with child routes** reached via in-page tabs, not extra sidebar rows.

| # | Item | `href` | Layer | Child routes (in-page tabs / sub-pages, NOT sidebar rows) |
|---|---|---|---|---|
| **WORKSPACE** | | | | |
| 1 | **Home** | `/property-manager` | A | dashboard only (KPIs, today, alerts) |
| 2 | **Portfolio** | `/property-manager/portfolio` | A | properties · units · tenancies · documents (property-scoped) · contacts (people on a property) |
| 3 | **Work** | `/property-manager/work` | A | tasks · jobs · maintenance · **work calendar (toggle, see §8)** |
| 4 | **Money** | `/property-manager/money` | A | rent · arrears · invoices · expenses · owner statements · deposits · payouts |
| 5 | **Compliance** | `/property-manager/compliance` | A | certificates · HMO licensing · inspections · deposits-protection · **Legal sub-tab** (possession/RRA-2026) |
| **OPERATE** | | | | |
| 6 | **Messages** | `/property-manager/messages` | A | unified inbox (tenant/landlord/supplier threads) · notifications |
| 7 | **Portals** | `/property-manager/portals` | B | tenant · landlord · supplier portal management + invites |
| 8 | **Contacts** | `/property-manager/contacts` | A | people · companies · **suppliers (operator-side coordination)** |

**Why these 8:** they are the entire Layer-A/B operating loop (run the portfolio → do the work → collect money → stay compliant → talk to people → extend via portals). Every one scores KEEP on the §5 rubric (high pain/USP/frequency, V1-ready). Zero ERP jargon, zero marketplace words.

**Moved/merged into the 8 (not deleted):**
- **Legal** → sub-tab of **Compliance** (Layer A/C; advanced possession gated to V1.5). *Reason:* legal is compliance-adjacent and not a daily standalone destination. *Risk:* discoverability — mitigate with a Compliance landing tile. *Action:* keep `/legal/*` routes, link from Compliance, drop the sidebar row.
- **Suppliers** (`/marketplace/suppliers-hub`) → tab inside **Contacts**. *Reason:* in V1 suppliers are coordinated, not transacted with via marketplace. *Action:* redirect (see §6); the `/marketplace/*` hub stays in code behind `marketplaceEnabled`.

**Removed from V1 sidebar (flag-hidden, see §4):** Bookings, Listings, Planning, Accounting, Affiliate, Calendar (standalone), Automations.

> Settings is **NOT a sidebar item** — it lives in the bottom workspace/account cards (already wired, `SideNavigation.tsx` lines 219–259) → one settings area (§7).

---

## 3. V1.5 premium nav additions (gated, +1–2 items max)

Unlock as the operator upgrades; never on the V1 starter surface.

| Item | `href` | Layer | Gate | Notes |
|---|---|---|---|---|
| **Planning** | `/property-manager/planning` | C | plan ≥ `scale` **[VERIFY plan tier]** + premium upsell | The profitability/strategy engine — **PROTECT** (brief §2). Simplify entry to a single "New analysis" CTA; the 11 income tabs live inside, not on the sidebar. This is the premium hook — it earns its own item once unlocked. |
| **Automations** | `/property-manager/automations` | C-lite | `canvasLite` flag | Preset recipes + approvals only. Full canvas/webhooks/usage/marketplace = Layer D, stays hidden (§4). Appears as a sub-area of **Work** until unlocked, then promotes to its own item. |
| Advanced Compliance / AI Copilot | within Compliance / top-nav | C | `aiCopilot` entitlement + advanced compliance flag | No new sidebar row — surfaces inside Compliance and the Copilot panel. |

**Net V1.5 sidebar = 8–10 items.** Still inside budget because Automations folds into Work until gated on.

---

## 4. V2 platform nav (flags ON — already built)

When the staged platform turns on, these promote from hidden to visible via the **existing registry** (`src/lib/flags/registry.ts`). No new build.

| Surface | Flag(s) | Nav effect |
|---|---|---|
| **Bookings** | `bookingManagement` (+`icalSync`, `directBookingPages`) | New "Bookings" sidebar item; `/bookings/*` + `/listings/*` un-hide |
| **Marketplace** (stays/suppliers/emergency/escrow/disputes) | `marketplaceEnabled` (master) + sub-flags | "Suppliers" tab in Contacts expands to full marketplace hub; `/marketplace/*` un-hides |
| **Customer/guest workspace** | `customerWorkspace` | `/customer/*` route group + `TYPE_HOME.customer` switch + PersonaLinks `customer` target activate |
| **Independent Supplier workspace (SaaS)** | `supplierWorkspace` | Full `/supplier/*` workspace beyond the portal; supplier nav **trimmed** (no accounting/automations mirror — §12) |
| **Accounting (full GL)** | — **HIDE+FLAG** (`[ASSUMPTION]` add `accountingGl` flag — not yet in registry) | Position as **Xero/QuickBooks integration** in Settings → Integrations, not an in-app sidebar item |
| Affiliates | existing affiliate flag (payouts off) | Promotes to a sub-tab of Money or its own item at V1.5+ |

---

## 5. Hidden / feature-flagged & deprecated modules

### 5.1 Hidden in V1 (in code, flag-controlled — NOT deleted)
| Module | Routes | Flag / disposition |
|---|---|---|
| Bookings | `app/bookings/*`, `bookings/calendar` | `bookingManagement` OFF |
| Listings | `app/listings/*` | `bookingManagement` / `directBookingPages` OFF |
| Marketplace (operator) | `app/marketplace/*` incl. `suppliers-hub`, `orders` | `marketplaceEnabled` OFF |
| Customer workspace | `(customer)/customer/*` | `customerWorkspace` OFF |
| Independent supplier workspace | `(supplier-workspace)/supplier/*` | `supplierWorkspace` OFF; accounting/automations/calendar mirror **CUT from nav** |
| Automations (full canvas) | `app/automations/*` beyond presets | `canvasLite` gates lite; full = Layer D hidden |
| Accounting full GL | `app/accounting/*` | HIDE+FLAG, reposition as integration |

### 5.2 Deprecated routes (redirect, then delete after one release — verify no inbound deps)
| Route | Reason |
|---|---|
| `app/calendar/views/**` (5 nested view pages) | duplicate of `app/calendar/{month,week,…}`; both duplicate the toggle target |
| `app/calendar/{month,week,day,agenda,gantt,timeline,schedule}` (7 view-as-route pages) | views become toggles (§8), not routes |
| `app/work/calendar`, `app/bookings/calendar` | secondary calendar entry points; fold into one workspace |
| `app/settings/{compliance,payments-stripe,calendar-notifications}` | orphan third settings tree; merge into unified Settings (§7) |
| `app/workspace-settings/{subscription,invoices}` + `app/workspace-settings/billing` | triplicate billing; canonical = `workspace/billing/*` |
| `supplier/schedule`, `supplier/inbox` (bespoke hubs) | nav.ts comment already concedes these are superseded by `supplier/calendar` + `supplier/messages` |

---

## 6. Route REDIRECTS table (old → new)

Implement in `src/proxy.ts` (the Next 16 auth-guard/proxy — brief §6) or a `redirects()` block in `next.config`. **301 once stable; 308 (preserve method) while transitional.** `[VERIFY]` each target page renders the merged tab.

| Old route | New route | Type |
|---|---|---|
| `/property-manager/legal` | `/property-manager/compliance?tab=legal` | 308 |
| `/property-manager/legal/*` | `/property-manager/compliance/legal/*` | 308 |
| `/property-manager/marketplace/suppliers-hub` | `/property-manager/contacts?tab=suppliers` | 308 |
| `/property-manager/calendar` | `/property-manager/work?view=calendar` | 308 |
| `/property-manager/calendar/month` | `/property-manager/work?view=calendar&mode=month` | 308 |
| `/property-manager/calendar/week\|day\|agenda\|gantt\|timeline\|schedule` | `…?view=calendar&mode={x}` | 308 |
| `/property-manager/calendar/views/*` | `…?view=calendar&mode={x}` | 308 |
| `/property-manager/work/calendar` | `/property-manager/work?view=calendar` | 308 |
| `/property-manager/bookings/calendar` | `/property-manager/work?view=calendar` (until `bookingManagement` ON) | 308 |
| `/property-manager/accounting` | `/property-manager/money` (V1) / Settings→Integrations (GL) | 308 |
| `/property-manager/affiliates` | `/property-manager/money?tab=affiliate` (V1.5) | 308 |
| `/property-manager/bookings`, `/listings` | `/property-manager/portfolio` (until flag ON) | 308 |
| `/app/settings/compliance` | `/property-manager/settings?tab=compliance` | 308 |
| `/app/settings/payments-stripe` | `/property-manager/settings?tab=integrations§ion=payments` | 308 |
| `/app/settings/calendar-notifications` | `/property-manager/settings?tab=notifications` | 308 |
| `/app/workspace-settings/subscription` | `/property-manager/settings?tab=billing` | 308 |
| `/app/workspace-settings/invoices` | `/property-manager/settings?tab=billing§ion=invoices` | 308 |
| `/app/workspace-settings/billing` | `/property-manager/settings?tab=billing` | 308 |
| `/app/workspace/billing/*` | `/property-manager/settings?tab=billing§ion={x}` | 308 |
| `/app/account/*` (11) | `/property-manager/settings?tab=account§ion={x}` | 308 |
| `/app/workspace-settings/*` (22) | `/property-manager/settings?tab={mapped}` (§7) | 308 |
| `/supplier/accounting`, `/supplier/automations` | hidden (no redirect; route stays, unlinked) | — |
| `/supplier/schedule`, `/supplier/inbox` | `/supplier/calendar`, `/supplier/messages` | 308 |

---

## 7. CLEAN SETTINGS — one area, ~6 tabs (45 → tabbed)

**One route:** `/property-manager/settings` with `?tab=` (mirror the customer pattern in `CustomerTopNav.tsx` `ACCOUNT_MENU`, which already does `/customer/account-settings?tab=…`). Reached from the **workspace card** (→ workspace tabs) and **account card** (→ account tab) in `SideNavigation.tsx`.

| Tab | Absorbs (from the 45) |
|---|---|
| **1. Account** (personal) | account/{profile, preferences, notifications, security, sessions, login, connected-accounts, data-privacy, activity} (11) |
| **2. Workspace** (org) | workspace-settings/{profile, branding, white-label, navigation, jurisdiction}; workspace/global(+privacy) |
| **3. Team & Roles** | workspace-settings/{team, roles, sso, security, audit, danger-zone} |
| **4. Billing** | workspace/billing/{root, checkout, renewals, add-ons, cancellation, history}; workspace-settings/{billing, subscription, invoices, addons} — **single source of truth** |
| **5. Integrations & Data** | workspace-settings/{integrations, email, storage, data, demo-data}; settings/payments-stripe |
| **6. AI & Automation** | workspace-settings/{ai, copilot-inbox}; automations/settings |
| (Compliance & Calendar prefs) | compliance/settings → Compliance section; calendar/settings + settings/calendar-notifications → Account→Notifications. *Section-local settings stay near their section; only global app settings live here.* |

**Reason:** collapses 45 routes + 3 billing locations into 1 page / ~6 tabs → meets brief §4 "trimmed settings ~8". **Risk:** deep-links break → mitigated by the §6 redirect table mapping every old path to `?tab=&section=`. **Action:** build `settings/page.tsx` as a tabbed shell; each tab lazy-loads its existing form component (no UI rebuild, just relocation).

---

## 8. Calendar — one workspace + view toggle

**One route:** `/property-manager/work?view=calendar` (calendar is a view of Work, not a peer module). View mode is a **toggle in the page header**, URL-synced via `?mode=`:

`[ Month | Week | Day | Agenda | Timeline | Gantt ]` ← segmented control, default Month.

- All 22 calendar route-files collapse to **one** calendar component that reads `?mode=`.
- Events/reminders become **drawers/modals** over the calendar (already a pattern in the codebase), not `calendar/events/*` routes — keep `events/[id]` as a deep-linkable detail only.
- **Top-nav calendar shortcut** (`TopNavigation.tsx` lines 295–301) re-points to `${base}/work?view=calendar`.
- Supplier: identical pattern at `/supplier/calendar` with the same toggle; **delete** `supplier/calendar/views/*` and `supplier/schedule`.

**Reason:** brief §3 "MERGE views to toggles (not N routes)". **Risk:** SSR of heavy calendar per-mode — mitigate by client-side mode switch (no route change). **Action:** redirect old view-routes (§6), build the toggle, URL-sync `?mode` per `view-state-url-sync` conventions.

---

## 9. Top-nav logic

Keep `TopNavigation.tsx` structure; three changes:
1. **Calendar shortcut** → `…/work?view=calendar` (was `…/calendar`).
2. **Add a "Help" / app-launcher affordance** — but the cross-persona switch already lives in `AccountMenu` via `PersonaLinks`; do **not** add a separate grid launcher (avoid duplication). The WorkspaceSwitcher (same-type) + PersonaLinks (cross-type) together = the launcher.
3. WorkspaceSwitcher unchanged: same-type = soft nav, cross-type = hard `window.location.assign` (correct — crosses route-group layouts). Customer stays filtered out of the switcher (line 123) and reachable only via PersonaLinks — keep.

---

## 10. Side-nav / portal-nav / admin-nav / mobile-nav logic

- **Side-nav (`SideNavigation.tsx`):** swap `NAV_GROUPS` for the §2 8-item config; gate V1.5 items (§3) by plan/flag at the `groups` build step (it already accepts a `navConfig` prop, lines 64–66 — pass a flag-filtered config). Bottom cards already route to settings — re-point to `/settings?tab=workspace` / `?tab=account`.
- **Portal-nav (`portal-nav.ts`):** **no change** — already lean, Layer B, secure-link. This is the retention engine; keep tenant/landlord/supplier configs verbatim.
- **Admin-nav (`AdminShell.tsx`):** **no change** structurally (control plane, internal). Marketplace group items render but their data is empty until `marketplaceEnabled` — acceptable for an internal console; optionally dim them.
- **Mobile-nav:** reuse the supplier pattern — a **bottom bar of 4** + a **"More" sheet** generated from the same config (`SUPPLIER_PRIMARY` + `supplierMoreGroupsForPlan`, nav.ts lines 154–165). Operator bottom 4 = **Home · Portfolio · Work · Money**; everything else (Compliance, Messages, Portals, Contacts, Settings) in "More". `[ASSUMPTION]` operator has no dedicated mobile bottom bar yet — build it mirroring supplier's.

---

## 11. App-launcher / persona-switch logic (reuse, don't rebuild)

- **Same-type workspaces** (e.g. two operator workspaces): `WorkspaceSwitcher` (`TopNavigation.tsx`) — soft nav.
- **Cross-persona** (operator↔supplier↔customer, same email): `PersonaLinks.tsx` — renders only personas the account holds; switch via `switchToPersona()` + hard nav. Already wired into `AccountMenu` (`["customer"]`) and `CustomerTopNav` (`["operator","supplier"]`).
- **Action:** extend `AccountMenu`'s `PersonaLinks targets` to `["operator","supplier","customer"]` so the operator can reach any persona they hold from one place. No new component.

---

## 12. Contradictions with the brief (flag explicitly per §authoring rules)

1. **Supplier nav ships a full accounting + automations mirror** (`nav.ts` lines 89, 94, 117, 120) — directly contradicts brief §3 ("mirrored accounting/automations/calendar = CUT from supplier"). **Resolution proposed:** in V1 the independent supplier workspace is flag-OFF (`supplierWorkspace`); when V2-on, ship the **trimmed** supplier nav (Overview/Work/Comms/Trust only — no Finance-Accounting, no Automations). Needs founder lock in `19`.
2. **Operator sidebar currently surfaces Bookings, Listings, Planning, Accounting, Affiliate, Automations flat** — contradicts the ≤8 / 30-second target (§4). Resolved by §2–§4 staging.
3. **Three billing locations** (`workspace-settings/billing` + `…/subscription` + `…/invoices` + `workspace/billing/*`) — no single source of truth; resolved by §7 Tab 4.
4. **`accountingGl` flag does not exist** in `registry.ts` though the brief treats full GL as HIDE+FLAG (§3). `[ASSUMPTION]` add it, or gate `/accounting/*` off via route-group guard. Needs a registry addition decision.
5. **Customer top-nav has 9 items** including Stays/Lets/Bookings/Reviews (Layer D) — fine because the whole workspace is `customerWorkspace`-OFF in V1; no V1 trimming needed, but noted so it isn't mistaken for live V1 surface.

---

## 13. Implementation sequencing (V1 ship)

1. Add redirect table (§6) to `proxy.ts` / `next.config` — **non-destructive, do first.**
2. Build unified `settings/page.tsx` (§7) + relocate forms (no rebuild).
3. Build calendar toggle in Work (§8); redirect view-routes.
4. Swap `NAV_GROUPS` → 8-item config (§2) with flag-gated V1.5 promotion (§3).
5. Build operator mobile bottom bar mirroring supplier (§10).
6. Leave all V2 routes in place, flags OFF (§4–§5) — **no deletions in V1**; archive deprecated duplicates one release after redirects prove stable.
