# WCAG 2.2 AA — Accessibility Conformance Audit

**Product:** Propvora (Next.js 16 / React 19 / Tailwind v4)
**Scope of this pass:** Task A13 — first AA conformance pass (MAX-RELEASE items 217–219).
**Status:** ✅ First conformance pass complete. This is **not** a claim of full AA
conformance — a comprehensive audit (contrast sweep, screen-reader pass, per-page
keyboard walkthrough) is still required. Remaining items are listed at the end.

This pass was deliberately **conservative**: high-impact, low-regression-risk fixes
only. No brand colours, layouts, copy, data, or business logic were changed.

---

## 1. What was fixed (by WCAG criterion)

### 2.4.1 Bypass Blocks — Skip link
- Added a reusable **`SkipLink`** component (`src/components/a11y/SkipLink.tsx`)
  that renders a "Skip to main content" link, visually hidden until focused
  (`.skip-link` utility in `globals.css`), targeting the `#main-content` landmark.
- Wired into:
  - **App shell** — `src/components/shell/AppShell.tsx` (first focusable element).
  - **Admin shell** — `src/components/shells/AdminShell.tsx`.
  - **Marketing pages** — rendered from `src/components/marketing/PublicNav.tsx`
    (so it appears on every public page that uses the shared nav).
- The skip target (`<main id="main-content" tabIndex={-1}>`) was added to:
  - App content wrapper — `src/components/shell/ShellContent.tsx`
  - Admin content wrapper — `src/components/shells/AdminShell.tsx`
  - Landing page — `src/app/page.tsx`
  - Features — `src/app/features/page.tsx`
  - About — `src/app/about/page.tsx`
  - Pricing — `src/app/pricing/PricingClient.tsx`
  - Auth pages already had a `<main>` landmark (`src/components/shells/AuthShell.tsx`).

### 2.4.7 Focus Visible / 2.4.11 Focus Not Obscured — Global focus ring
- Strengthened the global `:focus-visible` rule in `src/app/globals.css`:
  it now applies a solid **`2px outline (#2563EB, 2px offset)`** *in addition to*
  the existing soft brand box-shadow ring. This guarantees a visible indicator even
  on components whose own `box-shadow` would otherwise mask the previous ring.
- Existing component-level focus styles were left intact (not removed).

### 2.3.3 Animation from Interactions — Reduced motion
- Added a global `@media (prefers-reduced-motion: reduce)` block in `globals.css`
  that neutralises non-essential animation/transition/scroll motion
  (`animation-duration`/`transition-duration` → `0.01ms`, `scroll-behavior: auto`).
  Conservative: it does not remove any functional behaviour, only motion.

### 1.3.1 Info & Relationships / 4.1.2 Name, Role, Value — Landmarks & nav
- Each shell now exposes a single `<main>` landmark (app, admin, auth, marketing).
- Primary navigation regions now carry an accessible name:
  - App side nav → `<nav aria-label="Primary">` (`src/components/shell/SideNavigation.tsx`)
  - Admin side nav → `<nav aria-label="Admin">` (`src/components/shells/AdminShell.tsx`)
  - Marketing nav already used `<nav>` inside `<header>`.

### 4.1.2 Name, Role, Value — Icon-only buttons (accessible names)
Added `aria-label` to icon-only / icon-on-mobile controls in the most-used shared
shell components:
- **Notification bell** — `aria-label` (includes unread count when > 0)
  (`src/components/shell/NotificationBell.tsx`).
- **Quick-create ("New")** button — `aria-label="Create new"` (text is hidden on
  mobile) (`src/components/shell/QuickCreateButton.tsx`).
- **Account menu** button — `aria-label="Account menu"` (name hidden on mobile)
  (`src/components/shell/AccountMenu.tsx`).
- **Sidebar collapse** toggle — dynamic `aria-label` ("Expand/Collapse sidebar")
  in both app and admin sidebars.
- **Admin mobile hamburger** — `aria-label="Open navigation"`
  (the app shell hamburger already had one).
- **Admin sign-out** icon button — `aria-label="Sign out"`.

### 3.3.2 Labels or Instructions / 1.3.1 — Form labels
The **login** and **register** forms render visible `<label>` text as siblings that
were **not** programmatically associated with their inputs (no `htmlFor`/`id` pair,
no wrapping). Added `aria-label` to each affected `Input` so it carries a
programmatic accessible name without restructuring the markup:
- Login — Email address, Password (`src/app/(auth)/login/page.tsx`).
- Register — Full name, Company, Work email, Password, Confirm password
  (`src/app/(auth)/register/page.tsx`).

---

## 2. What was already good (verified, left unchanged)

- **Shared Dialog primitive** (`src/components/ui/Dialog.tsx`) is built on Radix
  `@radix-ui/react-dialog`, which already provides `role="dialog"`, `aria-modal`,
  Escape-to-close, focus trap, focus-into-dialog on open and focus-restore on close,
  and a `<span class="sr-only">Close</span>` on the close button. No changes needed.
- **`ConfirmDialog`** (`src/components/account/ConfirmDialog.tsx`) already has
  `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape handling, and an
  `aria-label="Close"` button.
- **`Input`** primitive (`src/components/ui/Input.tsx`) correctly associates its
  built-in `label` prop via `htmlFor`/`id`, sets `aria-invalid`, `aria-describedby`,
  and `role="alert"` on error text. (The auth forms simply bypassed this prop.)
- **AuthShell** already has a `<main>` landmark and a `<footer>`.
- **Password show/hide** toggles already carry dynamic `aria-label`s.
- **Notification dropdown** uses `role="dialog"` + `aria-label`, with
  `aria-haspopup`/`aria-expanded`/`aria-controls` on the trigger.
- **App-shell hamburger** already had `aria-label="Open navigation"`.
- **No Tailwind `dark:` classes** anywhere (kept at zero, per project rule).
- Global CSS already honoured `prefers-reduced-motion: no-preference` for smooth
  scroll; we added the explicit `reduce` counterpart.

---

## 3. Remaining items for a full AA audit (prioritised)

These were **out of scope** for this conservative pass (would risk visual regressions,
or require manual testing tooling). They must be completed before claiming full AA.

### High priority
1. **Comprehensive colour-contrast review (1.4.3 / 1.4.11).** Sweep all text,
   icons, badges, placeholder text and disabled states against AA ratios
   (4.5:1 text, 3:1 large text & UI components). Several muted slate tones
   (e.g. `#94A3B8` on white, `#8EA9D8` on dark navy) are borderline and need
   measurement. Fixing these may shift colours, so it was deliberately deferred.
2. **Screen-reader test pass (NVDA + VoiceOver).** Verify reading order, live-region
   announcements (toasts, notification updates), and that all interactive widgets
   announce role/name/state correctly.
3. **Per-page keyboard walkthrough (2.1.1 / 2.1.2 / 2.4.3).** Tab through every
   route: confirm logical focus order, no keyboard traps, dropdowns/menus operable
   and dismissable by keyboard, and visible focus everywhere. Custom dropdown menus
   (workspace switcher, quick-create, account menu, notification bell) are
   mouse-/Escape-driven and should add full arrow-key roving-tabindex semantics
   and `role="menu"`/`menuitem` where appropriate.
4. **Remaining form labels across the app.** This pass fixed login/register only.
   Audit create/edit forms (contacts, tasks, jobs, money, compliance, etc.) for the
   same sibling-label pattern and migrate them to the `Input` `label` prop or add
   `aria-label`/`htmlFor`.

### Medium priority
5. **Marketing `<main>` rollout.** `<main id="main-content">` was added to landing,
   features, about, pricing. The remaining public pages (walkthrough, faq, help,
   changelog, contact, legal/*, affiliate-programme/*) still need the same wrapper so
   the shared skip link resolves on every public route. (Affiliate pages already have
   a `<main>` — they just need the `id="main-content"` added.)
6. **Chart & data-viz accessibility (1.1.1).** Dashboards/charts need text
   alternatives or accessible data tables; SVG charts need `role="img"` + `aria-label`
   or an associated summary.
7. **Complex tables (1.3.1).** Verify `<th scope>`, captions, and that sortable/row-
   action controls expose state to assistive tech.
8. **Custom dropdowns/menus full ARIA.** Promote ad-hoc dropdowns to the
   menu/menuitem pattern with arrow-key navigation (see item 3).
9. **Target size (2.5.8 — new in 2.2).** Confirm interactive targets are ≥ 24×24px
   (most shell controls are 40–44px and pass; verify dense table row actions / chips).
10. **Reflow & zoom (1.4.10 / 1.4.4).** Verify 400% zoom and 320px-width reflow with
    no loss of content/function.

### Lower priority
11. **Redundant entry / accessible authentication (3.3.7 / 3.3.8 — new in 2.2).**
    Review multi-step flows (onboarding, registration) for cognitive-load criteria.
12. **Motion/parallax in marketing hero sections** — confirm the new reduced-motion
    rule fully neutralises framer-motion entrance animations (it covers CSS
    transitions/animations; JS-driven motion may need `useReducedMotion()` guards).
13. **Error identification & suggestions (3.3.1 / 3.3.3)** across all forms — verify
    inline errors are announced and suggest corrections.

---

## 4. Verification
- `npx tsc --noEmit` — **0 errors** (run at end of this pass).
- `npx next build` — to be confirmed green by the maintainer in CI (the build step
  was gated in this environment). No new types/imports were introduced beyond the
  `SkipLink` component, which `tsc` validated.

*Honest summary: a first AA conformance pass is complete for skip links, focus
visibility, reduced motion, shell landmarks/nav names, shared dialog primitives,
icon-button names, and the primary auth forms. Full AA conformance still depends on
the remaining items above — chiefly the contrast sweep, screen-reader pass, and
per-page keyboard walkthrough.*
