# Release Evidence — Shell Global Controls + Page-Width Parity

**Scope:** Operator app shell (`src/components/shell/*`, `src/components/layout/PageContainer.tsx`) — the quick action bar, global search, notifications, and the page-width system shared by every section.
**Audit date:** 2026-06-27 · **Auditor:** Claude Code (session-fullaudit) · **Verification:** code-level + `tsc --noEmit` clean (live browser QA pending dev-slot).

---

## 1. Page-Width Parity (FIX-637)

**Requirement:** main page, sub-tab, detail page and wizard must all share ONE width, and that width must match the quick action bar at every viewport.

**Architecture:** content lives in `ShellContent` → `px-4 sm:px-6` inside a column offset by the sidebar (`lg:pl-[var(--side-offset)]`). No max-width → full content width. The quick action bar (`TopNavigation`) renders in the same column.

**Findings & fixes:**
| Element | Before | After |
|---|---|---|
| Quick action bar wrapper (`AppShell`) | `pt-4 pr-4` (no left gutter; right gutter 16px) — edges did not match content | `pt-4 px-4 sm:px-6` — left/right edges align exactly with `ShellContent` at all breakpoints |
| `WizardShell` | `max-w-4xl mx-auto` (896px, centred) — narrow at every viewport, rail floated mid-left | `w-full`; rail flush at page left edge; form panel capped `max-w-3xl` for readability |
| `DashboardContainer` (69 pages) | `max-w-[1600px] mx-auto` — narrower than the full-width bar above ~1832px | `w-full` — matches the bar at every viewport |
| `DetailContainer` | `w-full` (already correct) | unchanged |
| Home page | full-width (no container) | unchanged — already correct |

**Note on viewports:** at the 8 required QA viewports (≤1536px) the old `DashboardContainer` cap had no visible effect (content was already <1600px after the sidebar offset); the cap only diverged on ultrawide. The wizard centring, by contrast, was visible at **every** viewport — that was the primary defect.

**`SettingsContainer` (`max-w-[960px]`)** is intentionally left narrow/centred — settings pages are a deliberate reading-width layout, not part of the "main/sub-tab/detail/wizard" parity set. **`FormContainer`** is an unused dead export (0 usages) — wizards use `WizardShell`.

**Back-fill:** because all three fixes are in **shared primitives**, every already-audited section (Home, Portfolio, Work, Planning, Contacts, Portals) inherits the corrected widths automatically — no per-section rework needed.

---

## 2. Quick Action Bar (`QuickCreateButton`) — PASS

`src/components/shell/QuickCreateButton.tsx`. The blue **New ▾** button in the toolbar.
- 14 create actions, **all route to real create wizards/pages** (property, tenancy, task, job, income, expense, invoice, bill, certificate, inspection, event, reminder, contact, portal grant). No dead items.
- **Contextual ordering:** actions whose `context` prefix matches the current path float to an "On this page" group; the rest under "Create anything".
- Portaled menu (escapes the toolbar's `backdrop-filter` stacking context), outside-click + Escape close.
- A11y: `aria-label`/`aria-expanded`/`aria-haspopup`, `role="menu"`/`menuitem`, focus-visible rings.
- A few actions use `?new=1` query patterns (`/money/income?new=1`, `/contacts?new=1`, `/portals?new=1`) handled by the target page's create modal — verified for Contacts/Portals. **No dead controls.**

---

## 3. Notifications (`NotificationBell`) — PASS

`src/components/shell/NotificationBell.tsx`.
- Real `notifications` table: unread count on mount (`count: exact, head`), **realtime INSERT subscription** scoped `user_id=eq.{user}` (channel cleaned up on unmount).
- Dropdown loads 8 most recent (read+unread); **mark-all-read** and per-item **mark-read on click** then **route to source record** via stamped `href` ↦ `resolveEntityHref(resource_type, resource_id)` fallback.
- Empty ("You're all caught up"), loading (spinner), and realtime states all handled. Portaled dropdown; outside-click + Escape close (refocuses trigger).
- A11y: `aria-label` reflects unread count, `aria-haspopup`/`expanded`/`controls`, `role="dialog"`.
- Footer: "View all notifications" → `/property-manager/notifications`; "Settings" → `/property-manager/account/notifications`. **No dead controls.**

---

## 4. Search (`GlobalSearch` → `CommandPalette`) — PASS

`src/components/shell/GlobalSearch.tsx` + `src/components/search/CommandPalette.tsx`.
- Single search surface: the toolbar search field is an affordance that opens the global **⌘K command palette** (`openCommandPalette`) — no duplicated query logic.
- A11y: `aria-keyshortcuts="Meta+K Control+K"`, descriptive `aria-label`, visible ⌘K kbd hint.
- CommandPalette uses **real Supabase** (`createClient`, resolves active workspace via `profiles.current_workspace_id`) and searches properties/contacts/tasks/invoices + runs commands. Not mock. **No dead controls.**

---

## 5. Result

- **Quick Action Bar / Notifications / Search:** production-grade, real data, real routes, accessible, portaled dropdowns, empty/loading states — **PASS, no fixes required.**
- **Page-width parity:** FIX-637 aligns the bar, all dashboards/list pages, and all wizards to one full content width; wizard side-rail left-aligned. tsc clean.
- **Pending:** live Chrome-MCP visual confirmation at the 8 viewports (dev-slot held by concurrent sessions) — to confirm the wizard rail/form balance and ultrawide dashboard width read well.

**Decision:** Ready for release (global controls); width-parity fix code-complete, pending live visual sign-off.
