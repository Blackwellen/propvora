# 11 — Mobile & PWA Strategy

**Status:** Draft · 2026-06-18 · author: product architect + UX lead
**Conforms to:** `_shared-strategic-brief.md` (Verdict §1 = staged operator-first OS; Layer map §3; infra §6 — Next.js 16 App Router, Tailwind v4 light-only, Supabase, Vercel).
**Pairs with:** `10-navigation-and-route-redesign.md` (mobile-nav logic §10).

> Classification rubric below; each surface tagged with one primary class + reason. `[ASSUMPTION]` / `[VERIFY]` marked. **Reason + Risk + Implementation action** on every recommendation.

---

## 0. Classification vocabulary

| Class | Meaning |
|---|---|
| **Desktop-first responsive only (DFR)** | Built for ≥1024px; must not break on tablet but mobile is degraded/read-only. Dense, multi-pane, keyboard-driven. |
| **Tablet-supported (TS)** | Comfortable down to ~768px; usable in the field on an iPad but not phone-optimised. |
| **Mobile responsive (MR)** | Works on a phone; layout reflows; not the primary design target. |
| **Mobile-first (MF)** | Phone is the primary design target; thumb-reachable, single-column, large tap targets. |
| **PWA candidate (PWA)** | Should be an installable, offline-tolerant, push-enabled app shell. (A subset of MF/MR surfaces.) |
| **Not-suitable-for-mobile (NSM)** | Should be actively discouraged/blocked on phones; show "open on desktop". |

**Why this matters commercially:** the paying buyer (operator) works at a desk — the **operator OS is desktop-first**. The *retention + field* surfaces (portals, supplier jobs, evidence capture) are where phones win, and those are exactly the surfaces that drive daily active use and stickiness. Investing PWA effort there, not in the admin/dashboard, is the high-leverage move.

---

## 1. Surface-by-surface classification

### 1.1 Operator workspace (`(app)/app/**`, nav §2 of doc 10)

| Surface | Class | Reason |
|---|---|---|
| **Home / operator dashboard** | **DFR** | KPI strips, multi-card layouts, today+alerts density (`SideNavigation` is a fixed 200px navy panel — desktop chrome). Glanceable on phone (MR fallback) but not a primary phone task. |
| **Portfolio (properties/units/tenancies)** | **DFR → MR** | Browsing a property on the go is reasonable (MR); bulk management/editing is desktop. |
| **Work (tasks/jobs/maintenance)** | **MR**, list view **MF** | Operators triage jobs from their phone — the *list* and *assign* actions are mobile-first; planning/gantt is desktop. |
| **Money (rent/arrears/invoices/owner statements)** | **DFR** | Financial tables, reconciliation, statement generation — dense, desktop. Arrears *glance* is MR. |
| **Compliance (certs/HMO/inspections/legal)** | **DFR**; cert-expiry alerts **MR** | Managing a compliance matrix is desktop; receiving "cert expiring" push + viewing one cert is mobile. **Inspections/checklists = MF (see 1.4).** |
| **Messages / inbox** | **MR → MF**, **PWA candidate** | Operator replying to a tenant/supplier thread is a phone-native task; push notifications essential. |
| **Contacts (people/companies/suppliers)** | **MR** | Look up + call a supplier from the field. |
| **Portals management** | **DFR** | Configuring/inviting is a desk task; the *portals themselves* are separate surfaces (1.2). |
| **Planning engine** (V1.5, `/planning`) | **NSM / DFR** | Multi-profile deal analysis = wide tables, 11 income tabs, side-by-side scenarios. Actively desktop. Show "best on desktop" on phone. |
| **Accounting full GL** (V2 hidden) | **NSM** | Double-entry journals/trial-balance — never a phone surface. |
| **Automations canvas** (V2 hidden) | **NSM / DFR** | Node-graph canvas; desktop only. Canvas-lite presets MR. |
| **Settings (unified, doc 10 §7)** | **DFR → MR** | Forms reflow (MR) but billing/integrations/SSO are desk tasks. |
| **Reports / data exports** | **NSM / DFR** | Wide tabular output, CSV/PDF generation — desktop; download links don't belong on phones. |
| **Calendar (toggle in Work)** | **TS** | Month/week grids need width — tablet-supported; agenda mode is the MR fallback. |

### 1.2 Portals — external (`(tenant|landlord|supplier)-portal`, `portal-nav.ts`)

| Surface | Class | Reason |
|---|---|---|
| **Tenant portal** (dashboard, tenancy, documents, payments, maintenance, messages) | **MOBILE-FIRST · PWA #1** | Tenants are consumers on phones. Paying rent, raising a repair, reading a notice, messaging the manager — all thumb tasks. Highest-frequency external surface → first installable PWA. |
| **Landlord portal** (properties, financials, payments, maintenance, messages) | **MOBILE-FIRST · PWA** | Self-managing landlords check their portfolio + approve spend from a phone. Financial *detail* is MR within an MF shell. |
| **Supplier portal** (jobs, invoices, payments, documents, messages) | **MOBILE-FIRST · PWA #2** | Tradespeople live on phones, on site. Accepting a job, uploading an invoice, messaging — field-first. |

### 1.3 Supplier field work + evidence/sign-off

| Surface | Class | Reason |
|---|---|---|
| **Supplier field jobs** (`/supplier/jobs`, portal `jobs`) | **MOBILE-FIRST · PWA** | On-site: view job, update status, navigate to address. Offline tolerance needed (poor signal in basements/lofts). |
| **Evidence / sign-off** (before/after photos, completion signature) | **MOBILE-FIRST · PWA + camera** | Camera capture is the core interaction — must use device camera + work offline then sync. The single strongest PWA justification in the product. |
| **Maintenance evidence upload** (operator + tenant side) | **MOBILE-FIRST · PWA + camera** | Tenant photographs a leak; operator/supplier photographs the fix. `mobile-camera-upload` pattern; queued upload on reconnect. |

### 1.4 Inspections / checklists

| Surface | Class | Reason |
|---|---|---|
| **Inspections / checklists** (compliance + check-in/out) | **MOBILE-FIRST · PWA + camera + offline** | Done walking a property, often with no signal. Tick items, photograph condition, capture signature, sync later. Classic field-PWA. |

### 1.5 Customer / guest (Layer D, `customerWorkspace` OFF in V1)

| Surface | Class | Reason |
|---|---|---|
| **Customer/guest booking** (`/customer/stays`, `/customer/lets`, booking flow) | **MOBILE-FIRST · PWA candidate (V2)** | Consumer booking is overwhelmingly mobile. Already top-nav-only (`CustomerTopNav.tsx`) which is the right mobile chrome. Flag-OFF in V1 → defer PWA build to V2. |
| **Emergency service request** (consumer/portal) | **MOBILE-FIRST · PWA + offline-first** | Urgent, one-handed, possibly poor signal. Must be the fastest path in the product; install + push critical. Tied to `marketplaceEmergency` (V2) for the marketplace variant, but a basic "report emergency" from tenant portal is **V1 MF**. |
| Customer messages / notifications | **MF · PWA** | Same rationale as portal messaging. |

### 1.6 Messaging / notifications (cross-cutting)

| Surface | Class | Reason |
|---|---|---|
| **Messaging (all personas)** | **MF · PWA** | Chat is phone-native; the unified inbox spans operator/portal/supplier. |
| **Notifications** (`NotificationBell`, push) | **PWA core** | Web Push is the retention lever — cert expiry, new job, payment due, new message. Requires the PWA service worker + notification permission. |

### 1.7 Platform admin (`(admin)/admin/**`, `AdminShell.tsx`)

| Surface | Class | Reason |
|---|---|---|
| **Platform admin / control plane** (~45 routes) | **NOT-SUITABLE-FOR-MOBILE** | See §3 — explicitly NOT a PWA. Dense oversight tables, destructive ops, MFA-gated, internal-only. |

---

## 2. Summary matrix

| Surface group | Class | PWA? |
|---|---|---|
| Operator dashboard / Money / Reports / Planning / Accounting / Automations | DFR / NSM | No |
| Operator Work-list / Messages / Contacts | MR→MF | Messages: yes (phase 2) |
| Operator Calendar | TS | No |
| Operator Settings | DFR→MR | No |
| **Tenant portal** | **MF** | **Yes — #1** |
| **Supplier portal / field jobs / evidence** | **MF** | **Yes — #2** |
| **Landlord portal** | **MF** | Yes — #3 |
| **Maintenance evidence / inspections / checklists** | **MF + camera + offline** | **Yes (core)** |
| Customer booking / emergency (V2) | MF | Yes (V2) |
| Messaging / notifications (all) | MF | Yes (cross-cutting core) |
| **Platform admin** | **NSM** | **No (deliberately)** |

---

## 3. Why the admin dashboard must NOT be a PWA

**Reason (security + fit):**
1. **Attack surface.** An installable admin app on personal/lost phones widens the blast radius of a control plane that can suspend workspaces, issue refunds, moderate marketplace, and read every tenant's data (`AdminShell` groups: Subscriptions, Marketplace→Payouts/Disputes, Risk, Security, Audit). Admin is MFA/OTP-gated by design (`admin-mfa-otp-gate` skill); a cached PWA shell + push tokens on a phone undermines that posture.
2. **No field use-case.** Admins operate from a desk during incident response and oversight — there is no "walking a property" equivalent. Mobile adds risk with no workflow upside.
3. **Density.** ~45 oversight routes of wide tables, cross-filters, and destructive bulk actions cannot be made thumb-safe without redesign no one needs.

**Action:** keep `AdminShell` DFR; on phones show a minimal "Admin console is desktop-only — open on a larger screen" gate rather than reflowing. Do **not** register a service worker or manifest scope covering `/admin/*`. Same exclusion for full GL accounting, Planning engine, and data-export surfaces.

---

## 4. Concrete PWA scope recommendation

### Phase 1 (ship with V1) — **Field & retention PWA**
Install one service worker + manifest scoped to the **external/field surfaces only**, NOT the operator app shell or admin:

| Priority | Surface | PWA features |
|---|---|---|
| **1** | **Tenant portal** | Installable, offline read of tenancy/documents, **Web Push** (rent due, repair update, notices), queued message send |
| **2** | **Supplier portal + field jobs + evidence/sign-off** | Installable, offline job list, **camera capture** (before/after, signature), background-sync upload, push (new job, schedule change) |
| **3** | **Maintenance evidence + inspections/checklists** | Camera + offline checklist completion + background sync — the strongest offline justification |
| **4** | **Landlord portal** | Installable, push (approval needed, financial alert) |
| Cross-cut | **Messaging + notifications** | Web Push service worker shared by all four (the retention engine) |

**Reason:** these are the daily-active, in-the-field, consumer-grade surfaces where "install + push + offline + camera" materially change behaviour and stickiness — and they are already mobile-shaped (portals have a dedicated `PortalSideNavigation`/drawer; customer/supplier already ship mobile bottom-nav patterns). They also drive the operator's retention without the operator needing a phone app.

**Risk:** scope creep — a single global service worker accidentally caching operator/admin routes. **Mitigation:** scope the manifest `start_url`/`scope` to the portal route groups; explicitly exclude `/app/*` (operator beyond Messages) and `/admin/*` from precache. `[VERIFY]` Next.js 16 PWA setup in `node_modules/next/dist/docs/` before wiring (AGENTS.md rule — App Router service-worker registration differs from older Next).

### Phase 2 (V1.5) — **Operator-lite mobile**
Operator **Messages**, **Work list/triage**, and **cert-expiry notifications** get MF treatment + push, reusing the Phase-1 push pipeline. Operator app is **not** fully installable — only these high-frequency slices.

### Phase 3 (V2, flag-gated) — **Consumer PWA**
When `customerWorkspace` / `marketplaceEnabled` turn on: customer booking + emergency-request become a full installable consumer PWA (already top-nav-only chrome). Emergency request gets offline-first + priority push.

### Explicitly excluded from PWA (all phases)
Platform admin (§3), full GL accounting, Planning engine, Reports, data exports, deep route/settings management — **DFR/NSM**, desktop-only, no service-worker scope.

---

## 5. Implementation notes

- **One service worker, scoped manifests.** Portal/field PWA (Phase 1) — do not let it cache operator/admin.
- **Camera + offline:** use the existing `mobile-camera-upload` + `evidence-upload-system` patterns; queue with background sync, reconcile on reconnect (Supabase storage).
- **Push:** Web Push via the existing `NotificationBell`/notifications pipeline; permission prompt only after first meaningful action (not on load).
- **Mobile-nav:** operator + supplier bottom-bar + "More" sheet already specced in doc 10 §10 (supplier pattern in `nav.ts` is the template).
- **`[VERIFY]`** before build: Next.js 16 App Router service-worker registration, manifest route-group scoping, and whether Vercel edge caching interferes with the SW (per AGENTS.md, read `node_modules/next/dist/docs/` first).

---

## 6. Contradictions / open items (per authoring rules)

1. **No PWA infra exists yet** `[VERIFY]` — no `manifest.json` / service worker found in the inspected nav layer; this strategy assumes greenfield PWA setup. Confirm before estimating.
2. **Emergency request** sits across V1 (basic tenant-portal report) and V2 (`marketplaceEmergency` marketplace dispatch). Strategy splits it: MF report in V1, full PWA dispatch in V2. Needs founder lock in `19`.
3. **Operator app is intentionally NOT fully installable** — this may surprise stakeholders expecting "a mobile app". The position: operators get an excellent *responsive* desktop-first OS + push for high-frequency slices; the *installable* apps are the portals/field tools that drive retention. Flag for `19-founder-decision-lock.md`.
