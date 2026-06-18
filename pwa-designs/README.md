# Propvora PWA Designs — Master Index

Source of truth for generating high‑quality PWA page designs for **every** non‑admin
surface in Propvora. Each page (and each distinct sub‑tab, detail view, wizard
step, or multi‑view variant) is catalogued as a numbered **Image** with its
current layout, components, menus, and navigation so a designer/generator can
produce a faithful mobile/PWA rendition.

> **Admin is intentionally excluded** — admin surfaces do not get a PWA.

---

## How to use this doc

- Work in **batches of 10 images**. Each `batch-NN-*.md` file owns 10 consecutive
  image numbers and gives a full breakdown per image.
- **Image numbering is global and sequential** (Image 1, Image 2, …). Multi‑stage
  flows (wizards) and multi‑view pages (e.g. calendar month/week/day) get **one
  image number per stage/view**, numbered in order — so they can each be designed.
- Every image entry follows the same template (below) so output is consistent.
- Shared chrome (top nav, sidebars, footer, portal frame) is documented **once**
  here in *Shared Chrome* and referenced by each image as `Chrome: <name>` rather
  than repeated.

### Per‑image template

```
### Image N — <Route> — <Page name>
- **Area / Persona:** …
- **Route:** /path  (dynamic params: …)
- **Chrome:** <Public | Customer top-nav | Supplier sidebar | PM sidebar | Portal | Auth bare>
- **Purpose:** one line.
- **Layout:** page-level structure (header, columns, grid).
- **Primary components:** KPI strip, tables, cards, forms, charts, etc.
- **Local nav / tabs / filters:** in-page tabs, segmented controls, filters.
- **Actions:** primary + secondary buttons, row actions, FAB.
- **States:** empty / loading / error / permission‑gated variants.
- **PWA notes:** mobile-specific behaviour (bottom nav, sheets, offline, install).
- **Multi-stage / multi-view:** if this image is one stage/view of a set, list siblings.
```

---

## Shared Chrome (documented once)

### Chrome: Public (marketing site)
- **`PublicNav`** (`src/components/marketing/PublicNav.tsx`): left Propvora logo;
  centre links — **Stays, Suppliers, Services, Emergency, Features, Pricing,
  About**; right — **Log in** + **Get started** (or **Go to app** when signed in).
  Mobile: hamburger → full-screen menu. Sticky, light theme.
- **`PublicFooter`** (`src/components/marketing/PublicFooter.tsx`): product /
  company / legal columns (Terms, Privacy, Cookies, Acceptable Use, Data
  Processing, Affiliate Terms, AI Disclaimer), newsletter signup, social, logo.

### Chrome: Customer top-nav (no sidebar)
- **`CustomerTopNav`** (`src/features/customer/shell/CustomerTopNav.tsx`):
  full-width white header. Logo left; centred icon+label nav — **Home, Stays,
  Lets, Favourites, Messages, Bookings, Payments, Reviews, Help** (active = blue
  + underline); right — notification bell (badge) + avatar dropdown.
- **Avatar dropdown:** Profile / Account / Finance / Notifications / Privacy /
  Security settings, **Go to property manager** + **Go to supplier** (only if the
  account also belongs to those workspaces), **Log out**.
- **No sidebar** by design. Mobile: `MobileTopBar` + bottom nav.

### Chrome: Supplier sidebar
- **`SupplierAppShell`** → shared `SideNavigation` + `TopNavigation`. Floating
  navy sidebar, groups (`src/components/supplier-workspace/nav.ts`):
  - **Overview:** Home
  - **Work:** Requests, Jobs, Calendar, Services
  - **Comms:** Messages
  - **Finance:** Finance, Accounting
  - **Trust:** Profile/Compliance (+ Reputation on Team/Enterprise)
  - **Control:** Automations (+ Insights on Team/Enterprise)
  - **System:** Account, Workspace settings, Affiliate
  - (nav expands with plan tier — Solo vs Team/Enterprise)
- **TopNavigation:** workspace switcher, command/search, AI bubble, notifications,
  avatar dropdown (**Go to customer site** if account has a customer workspace).
- Mobile: `SupplierMobileBottomNav`.

### Chrome: PM (Property Manager) sidebar
- **`AppShell`** → `SideNavigation` (`src/components/shell/SideNavigation.tsx`)
  groups:
  - **Overview:** Home
  - **Core:** Portfolio, Work, Bookings, Listings, Suppliers, Planning, Contacts,
    Portals, Messages
  - **Finance:** Money, Accounting, Affiliate
  - **Operations:** Calendar, Compliance, Legal, Automations
  - **System:** Workspace, Billing
- **TopNavigation:** workspace switcher, command palette/search, AI ChatBubble,
  notifications, avatar dropdown (**Go to customer site** when applicable).
- Mobile: `MobileBottomNav`.

### Chrome: Portal (magic-link external)
- **`PortalShell`** + **`PortalTopNavigation`**: branded top bar, persona badge
  (TENANT / LANDLORD / SUPPLIER), per-persona nav, **Help & support**, account
  chip, **Sign out**. No app sidebar. Session-scoped, no global account.

### Chrome: Auth bare
- Centered card on gradient; Propvora logo; **Back to home** link; no app nav.

---

## Batch Plan (all non‑admin surfaces)

**Marketing brochure pages are intentionally NOT catalogued** (home, about,
features, pricing, faq, contact, help, changelog, walkthrough, suppliers landing,
legal/*). `batch-01-public-marketing.md` (Images 1–10) is kept only as the
**format template**.

Everything else is produced per‑area, each area in its **own subfolder** with a
reserved **image‑number block** (so parallel authoring never collides). Within a
block, images are numbered sequentially and grouped into `batch-NN.md` files of 10.

| Subfolder | Image block | Area | Status |
|-----------|:-----------:|------|:------:|
| `public-transactional/` | 100–199 | Public booking + marketplace (marketplace-public/*, public-booking stay/*, checkout/*) | ⬜ |
| `auth-onboarding/` | 200–299 | login, register (intent + form), forgot/reset password, verify‑2fa, invite/[token], **operator onboarding (8 steps)**, **supplier onboarding (6 steps)** + in‑workspace onboarding/readiness/complete | ⬜ |
| `customer/` | 300–399 | Customer dashboard (46 routes incl. lets tenancy sub‑tabs + wizards) | ⬜ |
| `pm-portfolio/` | 1000–1199 | PM: portfolio, listings(+wizards), bookings(+disputes wizard) | ⬜ |
| `pm-money/` | 1300–1499 | PM: money, accounting(+ledger), affiliates, orders | ⬜ |
| `pm-planning/` | 1500–1599 | PM: planning (sets sub‑tabs, wizard, profiles, scenarios) | ⬜ |
| `pm-ops/` | 1600–1849 | PM: work, calendar(+views), compliance, legal(+possession wizard), automations | ⬜ |
| `pm-misc/` | 1850–1999 | PM: home, marketplace, contacts, portals, suppliers, messages, network, account, settings, workspace, verification, help, changelog | ⬜ |
| `supplier-a/` | 2000–2349 | Supplier: overview, work (jobs+evidence/sign‑off, requests, quotes, services, leads, schedule, availability, zones, coverage, packages, marketplace) | ⬜ |
| `supplier-b/` | 2350–2699 | Supplier: finance, accounting, calendar(+views), compliance, profile, reputation, insights, automations, team, settings, account, affiliate, messages/inbox, disputes, earnings, payouts, insurance, evidence, notifications, reviews, verification, help | ⬜ |
| `portals/` | 3000–3199 | tenant‑portal, landlord‑portal, supplier‑portal, magic‑link `/portal/[sessionId]/{tenant,landlord,supplier}/*`, shared states | ⬜ |

> Each area's first `batch-NN.md` opens with its block range. A master compile of
> all images is reconciled into this index once areas land.

---

## Conventions captured for design generation
- **No dark mode** — light tokens only (the product ships zero `dark:` classes).
- Brand blue `#2563EB`; navy `#071B4D` / `#0D1B2A`; surfaces white on `#F6F9FE`.
- Cards: `rounded-2xl border border-slate-200 shadow-sm`. Pills/badges rounded‑full.
- Dashboards: KPI strip → content grid (tables/cards) → side rail. Detail pages:
  header (title + status chip + actions) → 2‑col (main + meta rail).
- Multi‑view pages (calendar, planning sets, tenancy) keep a persistent local tab
  bar; each tab is a separate image.
