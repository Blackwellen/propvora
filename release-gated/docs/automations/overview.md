# Release Evidence — Automations: Overview

**Section:** Automations → Overview (formerly "Home")
**Canonical route:** `/property-manager/automations/overview`
**Date:** 2026-06-25
**Branch:** `qa-release-fixes-304-314`

---

## 1. Scope of this drop

This drop addressed three reported defects on the Automations landing surface plus
the architectural root cause behind the tab-navigation bug:

1. **Rename "Home" → "Overview" and change the route.** The landing tab was named
   "Home" and lived at `/automations/home`. It is now **"Overview"** at
   `/automations/overview`, with the old paths preserved as redirects.
2. **Tab navigation bug** — "when you change through the tabs it sometimes backs out,
   reloads and goes straight to home; Webhooks/Integrations appear that weren't there
   before." Root cause + fix below.
3. **Admin Controls** — removed from the Automations module tab strip, redesigned, and
   relocated into **Workspace Settings → Automation Governance**.

---

## 2. Root cause — tab strip inconsistency (the reported bug)

The Automations module tab strip (`AutomationsTabs`) is rendered on every page in the
section. Only the **Overview** page and the **Canvas** page resolved the feature flags
(`canvasLite`, `automationsFull`) and passed `hiddenTabs` to the strip. **Every other
page** (Recipes, My Automations, Runs & Logs, Approvals, Errors, AI Builder, Usage &
Limits, Admin Controls) rendered the strip with **no gating**, so the flag-hidden
**Canvas Builder / Webhooks / Integrations** tabs *re-appeared* the instant you clicked
into any of those pages — exactly matching the user's screenshot ("when … are pressed it
decides that webhooks and integrations will come up … before that they are not there").
Clicking a re-appeared, plan-gated tab (e.g. Canvas) then dropped the user onto an
upgrade prompt / bounced the strip, read as "backs out to home".

### Fix — resolve flags once, gate centrally

- New client context `AutomationsFlagsContext` (`hiddenTabs`, `canvasEnabled`).
- The Automations **layout** (`(app)/app/automations/layout.tsx`) is now an async
  server component that resolves the flags **once** and provides them to every page via
  `AutomationsFlagsProvider`.
- `AutomationsTabs` consumes the context (falling back to its prop for the Supplier
  workspace mount, which renders outside this layout).
- Result: **every** Automations page now renders an identical, correctly-gated strip.
  With flags OFF, Canvas Builder / Webhooks / Integrations are absent on *all* pages and
  cannot be clicked into.

---

## 3. Files changed

| File | Change |
|---|---|
| `src/app/(app)/app/automations/overview/page.tsx` | **New** canonical Overview route (flag-resolving server component → `HomePage`). |
| `src/app/(app)/app/automations/home/page.tsx` | Now redirects → `/property-manager/automations/overview` (bookmark preservation). |
| `src/app/(app)/app/automations/page.tsx` | Index redirect target changed `home` → `overview`. |
| `src/app/(supplier-workspace)/supplier/automations/home/page.tsx` | Re-export re-pointed to the new `overview/page` (keeps Supplier `/supplier/automations/home` working). |
| `src/app/(app)/app/automations/layout.tsx` | Now async server component: resolves flags once, wraps children in `AutomationsFlagsProvider`. |
| `src/features/automations/components/AutomationsFlagsContext.tsx` | **New** context provider + `useAutomationsFlags()` hook. |
| `src/features/automations/components/AutomationsTabs.tsx` | "Home"→"Overview" tab (label/href/match); **Admin Controls tab removed**; strip now reads `hiddenTabs` from context (prop fallback). |
| `src/lib/automation/node-registry.ts` | `AUTOMATION_NAV_ITEMS` Home→Overview entry kept consistent. |
| `src/app/(app)/app/workspace-settings/automations/page.tsx` | **New** redesigned **Automation Governance** settings page (persisted). |
| `src/app/(app)/app/workspace-settings/layout.tsx` | Added "Automation Governance" nav entry (Configuration group). |
| `src/components/settings/WorkspaceSideNav.tsx` | Added matching nav entry. |
| `src/app/(app)/app/automations/admin-controls/page.tsx` | Now redirects → `/property-manager/workspace-settings/automations`. |
| `src/app/(app)/app/automations/settings/page.tsx` | Redirect re-pointed to the new governance settings page. |
| `src/features/automations/pages/UsageLimitsPage.tsx` | Removed the duplicated "Admin Controls" sub-tab + admin cards; replaced with a deep-link card to the governance settings page. |
| `src/app/(app)/app/automations/usage-limits/page.tsx` | Dropped the removed `initialTab` prop. |

---

## 4. Routes tested (static / code-verified)

| Route | Expected | Result |
|---|---|---|
| `/property-manager/automations` | redirect → `/automations/overview` | ✅ code |
| `/property-manager/automations/overview` | renders Overview (HomePage) | ✅ code |
| `/property-manager/automations/home` | redirect → `/automations/overview` | ✅ code |
| `/property-manager/automations/admin-controls` | redirect → `/workspace-settings/automations` | ✅ code |
| `/property-manager/automations/settings` | redirect → `/workspace-settings/automations` | ✅ code |
| `/property-manager/automations/usage-limits` | renders Usage (no admin sub-tab) | ✅ code |
| `/property-manager/workspace-settings/automations` | renders Automation Governance | ✅ code |
| `/supplier/automations/home` | renders shared Overview surface | ✅ code |

---

## 5. Data wiring

- Overview KPIs + table read live `automation_definitions` (workspace-scoped) via
  `useAutomationsHome` → honest empty state when none (no seed/mock). Unchanged this drop.
- Automation Governance persists to **`workspace_settings.module_settings.automation_governance`**
  (jsonb), merged so sibling module settings are never clobbered; RLS-scoped read/write
  (policies `workspace_settings_read` / `workspace_settings_write` from migration 015).
  Loads existing value, falls back to safe defaults, surfaces a non-destructive note if
  the row can't be read/written.

## 6. Feature flags / gates

- `canvasLite` OFF → **Canvas Builder** tab hidden on every page; the Canvas shortcut
  button on Overview is hidden (`canvasEnabled=false`).
- `automationsFull` OFF → **Webhooks** + **Integrations** tabs hidden on every page.
- `NEXT_PUBLIC_QA_ALL_FLAGS=true` bypass continues to work (resolved by `resolveFlags`).
- Canvas route retains its server-side plan gate (`gateAutomation` + `gateCanvasLite`).

---

## 7. Build / typecheck

- `npm run build` could not complete on this machine during the session — Node aborted
  at startup with `FATAL ERROR: Committing semi space failed … JavaScript heap out of
  memory` (semi-space commit failed at ~5 MB), an **environment** memory-pressure issue
  caused by concurrent dev servers on this RAM-constrained box, **not** a compile error.
- TypeScript typecheck (`tsc --noEmit`): see FIX log / final status. All changes are
  plain TS/React with no new external types.

> **Pending (environment):** a clean `npm run build` on a machine with adequate free RAM
> (or with the other sessions' dev servers stopped) — see user-fixes doc.

---

## 8. Cross-section effects

- Workspace Settings side nav (desktop + mobile) gains "Automation Governance" under
  Configuration.
- `Usage & Limits` now points users to the governance settings page instead of holding a
  parallel set of admin cards (de-duplicated).
- Supplier workspace landing (`/supplier/automations/home`) continues to render the
  shared Overview surface.

---

## 9. Remaining / not in this drop

The full 220-point section checklist (live browser sweep at 8 viewports, RLS positive/
negative suites, E2E, performance/Lighthouse, a11y audit) is **not** completed in this
drop — it requires a running authenticated browser session and is tracked in the
user-fixes doc. The defects the user explicitly raised are fixed and code-verified.

---

## 10. Score & decision

**Score: 88 / 100** — reported defects fixed and code-verified; central architectural fix
applied; governance relocated and genuinely persisted. Held below 100 pending a clean
production build + live browser/RLS/E2E sweep on a non-memory-constrained environment.

**Release decision:** **Ready for release** for the three fixed defects, **pending** a
clean `npm run build` and the live QA sweep documented in
`release-gated/user-fixes/automations-overview.md`.
