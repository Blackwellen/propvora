# Auth & onboarding · batch 04 · Images 230–231

The remaining two **in‑workspace** supplier onboarding pages. Both use
**Chrome: Supplier sidebar** (`SupplierWorkspaceShell` floating navy sidebar +
TopNavigation; `MobileTopBar` on mobile). NOT Auth bare. Light theme only; content
is seeded/illustrative (typed stubs for the visibility/start toggles).

---

### Image 230 — `/supplier/onboarding/readiness` — First‑job readiness
- **Area / Persona:** Supplier (in‑app) · go‑live readiness gate.
- **Route:** `/supplier/onboarding/readiness`  (`force-dynamic`)
- **Chrome:** Supplier sidebar (`MobileTopBar` "First‑job readiness").
- **Purpose:** Score how ready the supplier is to receive jobs and surface blockers.
- **Layout:** Page title "First job readiness" → optional success banner → **Overall readiness** card (% + bar + status line + gated CTA) → **What's missing** card (only when blockers) → 2‑col **category grid**.
- **Primary components:** **overall readiness** `SupplierCard` (% from required categories, progress bar turns emerald when ready, **Start receiving jobs** `SupplierButton` disabled until no blockers); **What's missing** red card listing `action` blockers with fix‑it links; **9 category cards** (Availability, Services, Pricing, Coverage, Compliance, Payment setup, Message response, Evidence quality, Job ratings) each with icon, status pill (**Ready** emerald / **Action needed** red / **Recommended** amber) and an action link (e.g. Compliance → Renew insurance).
- **Local nav / tabs / filters:** none; category actions deep‑link to `/supplier/*` pages.
- **Actions:** Start receiving jobs (gated, sets success banner "now visible to customers"); per‑category fix‑it links.
- **States:** ready (CTA enabled, emerald bar) vs blocked (CTA disabled, "What's missing" shown); per‑category complete/action/optional.
- **PWA notes:** category grid → single column on phones; status pills stay inline; `MobileTopBar` summary.
- **Multi-stage / multi-view:** part of the in‑workspace onboarding set (Images 229, 231).

---

### Image 231 — `/supplier/onboarding/complete` — Onboarding complete
- **Area / Persona:** Supplier (in‑app) · celebratory completion.
- **Route:** `/supplier/onboarding/complete`  (`force-dynamic`)
- **Chrome:** Supplier sidebar (`MobileTopBar` "Onboarding complete").
- **Purpose:** Confirm 100% setup and route into first‑job actions.
- **Layout:** Hero card (success) → 4 stat cards → 2‑col split: left = checklist + quick‑start; right = visibility toggle + "Get your first job" card.
- **Primary components:** **hero** `SupplierCard` (emerald check, "You're all set up! 🎉", "Setup 100% complete" pill); **4 stat cards** (Profile: Excellent / Trust badges: 3 active / Services live: 4 / Coverage: 20 miles); **onboarding checklist** (5 completed items); **Quick start** grid (Review incoming requests, Polish your public listing, Add featured work photos, Invite your team — each a deep link); **Marketplace visibility** toggle switch (live vs hidden, typed stub); **Get your first job** card → **First‑job readiness** button (→ Image 230) + "Go to marketplace listing" link.
- **Local nav / tabs / filters:** none; cards deep‑link across `/supplier/*`.
- **Actions:** toggle visibility; quick‑start links; First‑job readiness → `/supplier/onboarding/readiness`; marketplace listing → `/supplier/profile/preview`.
- **States:** visible vs hidden (toggle copy changes); otherwise static celebratory.
- **PWA notes:** stats 2‑col on phones; split layout stacks (checklist above the rail); toggle is a thumb‑sized switch.
- **Multi-stage / multi-view:** terminal of the in‑workspace onboarding set (Images 229, 230).

---
```
