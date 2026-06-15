# Mobile / PWA Final UX Audit — Shell, Nav, Tabs, Chrome

Scope of this pass: **A4 (mobile bottom nav + centre Copilot)**, **A5 (help collision
+ quick/task rail)**, **A6 (unified tabs + header order + automations width)**.
Presentation/UX only — no data, RLS, or section-page-body changes. Verified with
`npx tsc --noEmit` → **0 errors** (whole project).

---

## A4 — Premium mobile bottom nav + centre Copilot button

**File:** `src/components/mobile/MobileBottomNav.tsx` (rewritten),
`src/components/shell/AppShell.tsx`, `src/components/ai/ChatBubble.tsx` (left intact,
now desktop-gated by AppShell).

- **5-slot premium layout:** `Home · Portfolio · [Copilot/Inbox centre] · Work · More`,
  laid out on a `grid-cols-5` so the centre slot is perfectly centred.
- **Raised centre button:** 56px (`w-14 h-14`) circular button, lifted `-mt-7` above
  the bar with a premium blue shadow + top-gloss sheen + `ring-1` brand ring. Uses the
  Propvora logo mark (`/propvora-favicon.png`). Label "AI" beneath.
  - `aria-label="Open Propvora Copilot and Inbox"`, `aria-haspopup="dialog"`,
    `aria-expanded={chatOpen}`.
  - **Opens the ChatPanel — does NOT navigate.** Calls `onOpenChat` prop.
  - **Unread badge** preserved (red pill, `99+` cap) driven by the `unreadCount` prop.
  - Works in installed PWA (fixed bar with `env(safe-area-inset-bottom)` padding).
  - ≥44px target (56px).
- **Props are additive / backward-compatible** (all optional):
  `chatOpen?: boolean`, `onOpenChat?: () => void`, `unreadCount?: number`.
  Existing callers that render `<MobileBottomNav />` with no props still compile and
  behave (centre button is inert until wired, but AppShell wires it).
- **AppShell wiring:** passes `chatOpen`, `onOpenChat={() => setChatOpen(true)}`,
  `unreadCount` into `MobileBottomNav`. `ChatPanel` stays globally mounted.

### Floating chat removed on mobile
- In `AppShell`, the floating `ChatBubble` is now wrapped in `hidden lg:block` so it
  renders **only on lg+/desktop**. Below lg the raised centre button is the sole
  Copilot entry point, so the bubble never collides with the bottom nav or safe area.
- `ChatPanel` remains globally mounted at all breakpoints. On phones,
  `CopilotPanelShell` already resolves to a true full-screen sheet
  (`top/bottom/left/right: 0`, `height: 100dvh`, safe-area insets, `borderRadius: 0`)
  at `z-50` above the `z-40` nav, so it does not get trapped under the bar.

### Premium "More" sheet
- Grouped into **Core / Finance / Operations / System** mirroring the desktop
  `SideNavigation` groups, **plus a Support group with "Help & Guides"** (links to
  `/help`). Money now lives here (it was moved off the bar to make room for the centre
  button); nothing from the desktop nav is lost.
- 3-col grid of ≥76px tiles (≥44px), active-route highlight via `aria-current="page"`,
  **closes after route select**, scrollable when tall (`MobileSheet` scroll body),
  safe-area aware (`MobileSheet` footer inset). `role=dialog` + focus-trap + Esc +
  focus-return all provided by `MobileSheet`.

---

## A5 — Help/tutorial collision + quick/task rail

**Files:** `src/guided-help/components/TutorialLauncher.tsx`,
`src/components/shell/ShellTabsRail.tsx`, `src/components/shell/ShellContent.tsx`.

### Guided-help launcher no longer blocks mobile chrome
- `TutorialLauncher` output is now wrapped in `hidden lg:block`, so the floating
  bottom-left help button and its popover render **desktop/lg+ only**. On mobile/PWA it
  is fully suppressed — it can no longer overlap the fixed bottom nav, sticky save bars,
  the raised Copilot centre button, or row actions.
- Mobile users reach the same content via **"Help & Guides" in the More sheet**
  (deep-links to `/help`). The desktop floating launcher stays (bottom-left, z-40,
  clear of the bottom-right AI bubble — collision-free).

### Quick/task rail aligned + de-stickied on mobile
- `ShellTabsRail` is now `hidden lg:block`: below lg it no longer renders a second
  sticky bar fighting the `MobileTopBar` + tabs. Quick actions on mobile are owned by
  the page header / its overflow sheet, not a sticky rail.
- **Width fix:** removed the `mr-4` right-margin mismatch so the rail spans the content
  column flush. Inner padding changed `px-3` → `px-4 sm:px-6` so the quick chips line
  up under the page content gutters (no margin mismatch, no overflow). The rail sits
  above the header in scroll flow, so it never covers headers/tabs.
- **Scroll transparency fix:** added `data-shell-content` to the `<main>` scroll
  container in `ShellContent` so the rail's scroll listener actually targets the right
  element (previously it silently fell back to `window`, which never scrolls here).

---

## A6 — Unified tabs + header ordering + automations width

### Shared tab components (new) — for section-owning agents to adopt
**Files:** `src/components/navigation/AppSectionTabs.tsx`,
`src/components/navigation/DetailPageTabs.tsx`, `src/components/navigation/index.ts`.

ONE consistent tab presentation across breakpoints — never a double tab bar, never a
clipped/merged label. Both are **controlled view switchers** (own no routing); pass the
same `value` / `onChange` state the desktop strip already uses.

```ts
import { AppSectionTabs, DetailPageTabs, type SectionTabItem } from "@/components/navigation"

interface SectionTabItem {
  id: string
  label: string
  icon?: React.ElementType   // lucide icon, optional
  badge?: number | string    // optional count badge
}

// Top-level section tabs (place directly under the page header, above filters):
<AppSectionTabs tabs={tabs} value={tab} onChange={setTab} aria-label="Money sections" />

// In-page detail sub-tabs (place inside the detail hero/card):
<DetailPageTabs tabs={subtabs} value={sub} onChange={setSub} aria-label="Property details" />
```

- `AppSectionTabs`: desktop = clean underline strip; mobile = shared scrollable
  `MobileTabs` pill control.
- `DetailPageTabs`: desktop = compact segmented pill group (sits inside a card);
  mobile = shared `MobileTabs`.
- a11y on both: desktop is a real `role=tablist` with `aria-selected` + roving
  `tabindex` + arrow/Home/End keys; mobile delegates to `MobileTabs` (auto-scroll active
  tab into view, ≥44px targets, reduced-motion respected).
- **Adoption note for section agents:** replace any bespoke `hidden md:flex … border-b`
  strip + separate `MobileTabs` block (as currently hand-rolled in
  `automations/AutomationsClient.tsx`) with a single `<AppSectionTabs />`. The shell
  cannot edit section bodies, so this is opt-in — but it is the standard.

### Page-order standard (enforce where shell controls it; document for sections)
- **Desktop (lg+):** shell-nav (fixed `SideNavigation`) → quick-rail (`ShellTabsRail`,
  sticky top) → header (title / subtitle / actions) → tabs (`AppSectionTabs`) →
  filters → content. Shell owns nav + quick-rail; sections own header→content.
- **Mobile (<lg):** `MobileTopBar` (sticky) → title → `MobileTabs` /
  `AppSectionTabs` (mobile arm) → compact filters → content → **bottom-nav clear**.
  `ShellContent` already provides the bottom-nav clearance
  (`pb-[calc(env(safe-area-inset-bottom)+72px)]` below lg).

### Automations width fix
**File:** `src/app/(app)/app/automations/AutomationsClient.tsx`.
- Removed the narrow self-imposed container `mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8`
  (which double-padded against `ShellContent` and made the page narrower than every
  other `/app` section). It now uses the **same `ShellContent` width/padding** as the
  rest of the app — aligns flush under the quick-rail, no narrow container.
- Logs/Rules/Inbox/Activity lists already render as mobile cards (`flex-col sm:flex-row`,
  per-row stacking) — no clipped right actions, no horizontal overflow.
- Builder modal (`RuleBuilder`) is mobile-safe (`p-4`, `max-w-3xl`, horizontally
  scrollable stepper, scrollable body, footer always reachable).
- Toast lifted above the bottom-nav clearance on mobile
  (`bottom-[calc(env(safe-area-inset-bottom)+84px)] lg:bottom-6`).

---

## Cross-section note (not edited — owned by other agents)
Several settings/account pages use sticky save bars `fixed bottom-0 … z-30` (some
`z-50`). On mobile these stack against the `MobileBottomNav` (`z-40`). The shell help
launcher no longer competes with them (now desktop-only), but section agents should
ensure their sticky save bars either sit **above** the bottom nav (z ≥ 41) with bottom
offset clearing it, or hide the bottom nav on those full-screen edit surfaces. This is a
section-body concern outside this pass's edit scope.

## Verification
- `npx tsc --noEmit` → **0 errors** (full project).
- No `dark:` classes introduced.
- Desktop output unchanged: all mobile-only changes are gated `lg:hidden` / `hidden
  lg:block`; desktop nav, top nav, quick-rail, and floating chat bubble behave exactly
  as before on lg+.


---

# Final-release pass — A7 infra + A2/A3 inline edit (2026-06-15)

## A7.1 — PWA install prompt (single-show, centralised)
- **New `src/components/pwa/installPromptLogic.ts`** — pure, unit-tested policy:
  - `canShowInstallPrompt({ standalone, pathname, dismissedAt, installed, now })`.
  - Never in `display-mode: standalone` or iOS standalone; never once installed.
  - Dismissal stores a **timestamp** (`propvora.pwa.installDismissed.at`) and
    suppresses for **21 days** (`SUPPRESS_DAYS`, inside the 14–30 day window) —
    previously stored only `"1"` with no cooldown.
  - `isBlockedPath()` blocks forms/wizards/checkout/onboarding/auth/apply/new/create
    + `planning/*/build|edit` — never interrupts those flows.
- **Rewrote `src/components/pwa/InstallPrompt.tsx`** (the single owner, still mounted
  once in `src/app/layout.tsx`):
  - One-shot `decidedRef` guard — captures `beforeinstallprompt`/`appinstalled` once,
    **does not re-fire on route changes**.
  - Route-aware via `usePathname`: hides the banner the moment the user enters a
    blocked route; never auto-re-shows.
  - On `appinstalled` / accepted choice persists `propvora.pwa.installed` (suppress
    forever).
- **Test:** `src/__tests__/pwa-install-prompt.test.ts` (10 cases) — standalone,
  installed, cooldown boundaries, blocked routes.

## A7.2 — Image-upload persistence (infra + shared components)
- **`src/lib/upload.ts`** — hardened the shared client helper:
  - Persistence contract documented: callers persist the durable `key` (and/or the
    authed `/api/files/{key}` URL), **never a blob/object URL**.
  - Added `validateUploadFile(file, { imagesOnly })` (size + MIME mirror of the server
    allowlist) and `MAX_UPLOAD_BYTES` / `ACCEPTED_IMAGE_TYPES`.
  - `uploadFile()` now uses **XHR with upload-progress** (`onProgress`) + abort signal;
    return shape unchanged (`{ key, url, name, type, size, scanStatus }`) so all 10
    existing call-sites compile untouched.
- **`src/components/work/EvidenceUpload.tsx`** (shared uploader):
  - Uses `uploadFile()`; stores the persisted **`key`** on the doc and on the metadata
    row (`file_key`, with a `42703` fallback for legacy tables lacking the column).
  - **Image thumbnails render from the persisted signed URL** (`/api/files/{key}`) —
    survive website/PWA refresh; no leftover blob preview.
  - Client-side validation, **per-upload progress bar**, error surfaced (`role=alert`),
    and a **mobile/PWA camera capture** path (`capture="environment"`, `sm:hidden`).
  - New optional `imagesOnly` prop for avatar/photo contexts.
- **`src/app/(app)/app/workspace-settings/branding/page.tsx`** (logo/avatar uploader,
  in scope): logo zone now **renders the stored logo from its authed URL**
  (`keyToUrl`) so the preview survives refresh; added image validation (SVG allowed).
- The `/api/upload` route + `src/lib/r2.ts` were already correct (server-proxied to R2,
  magic-byte sniffing, SVG sanitisation, returns persisted key + authed view URL) — no
  changes needed there.
- **Follow-up (other agents own these detail pages):** `compliance/certificates/new`,
  `compliance/documents/new`, `money/deposits`, `money/invoices/[id]`,
  `portfolio/properties/[id]` and the contacts pages call `uploadFile` directly and
  already store `url`/`key`. They now also receive progress capability for free but
  their preview wiring should be confirmed by the owning agents.

## A7.3 — Demo-data settings (wired to SQL seed RPCs)
- **New migration `supabase/migrations/20260615090000_demo_status_and_preserve.sql`:**
  - `demo_data_status(workspace_id) -> jsonb` — owner/admin-gated (`42501` otherwise),
    returns `{ loaded, injected_at, expires_at, total_count, edited_count, counts:{…} }`.
  - **"Preserve edited demo records" rule** — helper `_demo_row_edited(created_at,
    updated_at)`: a demo row is *edited* when `updated_at > created_at + 60s` (the seeder
    writes every row in one transaction, so untouched rows have `updated_at ≈
    created_at`).
  - `delete_demo_data(workspace_id, p_preserve_edited boolean default false)` — opt-in
    keep of edited rows (default false preserves old single-arg callers).
  - `expire_demo_data()` rewritten to **preserve edited rows** on 30-day auto-expiry
    (only untouched expired rows are deleted); properties kept while demo children remain.
- **New `src/app/api/demo/status/route.ts`** (GET, owner/admin via RPC gate).
- **`src/app/api/demo/reset/route.ts`** now accepts `preserveEdited` and forwards it.
- **`src/app/(app)/app/workspace-settings/demo-data/page.tsx`** rewritten:
  - Loads live status from `/api/demo/status`; shows **record counts per type**,
    **injected date**, **expiry date (+ days left)** and **edited-record count**.
  - "Keep records I've edited" checkbox -> preserve-reset; confirm modal copy reflects it.
  - Loading / error / success states preserved.
- **`src/types/database.ts`** — typed `seed_demo_workspace`, `delete_demo_data`
  (+ `p_preserve_edited?`), `demo_data_status` in the Functions block.

### Demo RPC proof (live workspace `7ee76842-a0ee-4ef6-8cb0-cc07c0efd6b4`)
- `node scripts/test/demo-data-rpc.mjs` ->
  - PASS: `seed_demo_workspace` ran (batch `3a06deb2-…`), **6 demo properties** created.
  - PASS: `delete_demo_data` cleaned the workspace, `demo_data_loaded` -> false.
  - The new `demo_data_status` / 2-arg `delete_demo_data` were correctly detected as
    **not yet deployed** to remote (skipped) — the remote migration-history table is
    out of sync with the local dir (pre-existing project state), so `supabase db push`
    is unsafe without a `migration repair`. **The migration is authored + idempotent
    and will pass the full proof once deployed via the team's normal migration flow.**
  - Workspace verified clean afterwards (0 demo properties, `demo_data_loaded=false`).
- **Unit tests:** `src/__tests__/demo-data-rules.test.ts` (6 cases) cover the edited-row
  rule + the inject/reset/preserve-reset/expire deletion policy.

## A2/A3 — inline editing applied
- **Portal (tenant) — `src/app/(tenant)/tenant-portal/settings/page.tsx`:** "Your
  Details" card converted from a bulk form to **visible-pen `InlineEditField`** per field
  (full name, company, email, phone, address). Per-field `saveField()` writes the single
  live `contacts` column (RLS-scoped to the linked tenant contact), `useSheetOnMobile`
  for mobile, `permission` gated on a linked contact with a clear locked reason. Removed
  the now-dead bulk-save handler + unused imports.
- **Deliberately NOT forced (documented decisions):**
  - `workspace-settings/profile`, `account/profile`, `account/preferences` already have
    robust **batch form + sticky save-bar** editing of the same fields — adding a second
    inline-edit affordance would create a confusing dual-edit UX. Left as-is.
  - **Admin tables** (`(admin)/admin/users`, `/workspaces`, …) are server components
    rendering client filters with **no client mutation hooks**; safe inline edits there
    require new privileged server actions (service-role, audited) — higher-risk and
    beyond a safe additive pass. Flagged for a dedicated admin-mutation follow-up.
  - **Messages** conversation title is rendered by a shared read-only header with no
    thread-subject mutation hook; left for the messaging owner.

## Verification (this pass)
- `npx tsc --noEmit` -> **0 errors** (full project).
- `npx vitest run` -> **89 passed** (incl. the 16 new PWA + demo-rule tests).
- No `dark:` classes introduced. No secrets added. Privileged demo actions stay
  server-side via SECURITY-DEFINER RPCs (owner/admin gated). Desktop unaffected
  (camera button is `sm:hidden`; inline pen reuses the existing accessible system).


---

# A8 — Final UX phase: PWA warping, polish, a11y, tests, release report (2026-06-15)

> This is the closing UX pass for Block A. It runs after A1–A7 (global inline-edit
> system, mobile bottom nav with centre Copilot, PWA/upload/demo infra). It is
> **presentation / test / docs only** — no data, query, or RLS changes. All 23
> required audit sections below are filled with the actual routes, files, and
> components touched, and are explicit about what was browser-verified vs.
> static/code-verified.

## 1. Executive verdict
The mobile / PWA / inline-edit UX layer is **GO for release** at the code level.
The dominant warping risk across the app — sticky "unsaved changes" save bars
stacking on (or hiding behind) the fixed mobile bottom nav — is resolved
app-wide via one shared `.app-save-bar` utility applied to **all 15** save bars,
plus matching content bottom-clearance. Inline-edit and mobile-nav behaviour is
now covered by **24 new component tests** (113 total, all green). `tsc` is clean,
`next build` succeeds. The only residual item is **device-level confirmation on
real installed PWAs** (iOS Safari home-screen + Android), which requires the
owner to run on physical hardware — see §17 and §18.

## 2. Routes / surfaces inspected
- **Shell chrome (all `/app/*`):** `AppShell`, `ShellContent`, `MobileBottomNav`,
  `MobileTopBar`, `MobileSheet`, `MobileTabs`, `MobileSectionNav`,
  `ShellTabsRail`, `TutorialLauncher`.
- **Settings save-bar surfaces (`/app/workspace-settings/*`):** `profile`,
  `roles`, `security`, `ai`, `notifications`, `copilot-inbox`, `branding`
  (7 pages) + the shared `SettingsCard` `SettingsSaveBar`.
- **Account save-bar surfaces (`/app/account/*`):** `profile`, `notifications`,
  `preferences` (3 pages).
- **Detail-edit save-bar surfaces:** `calendar/events/[id]/edit`,
  `compliance/certificates/[id]/edit`, `compliance/inspections/[id]/edit`,
  `money/invoices/[id]/edit`, `money/bills/[id]/edit` (5 pages).
- **Inline-edit callers (spot-checked):** `(tenant)/tenant-portal/settings`,
  portfolio/work fields via the unified shims, dense table cells.
- **Toast surfaces:** the inline-edit toast portal, the shared `ui/Toast`
  viewport, plus the page-level accounting/contacts toasts (catalogued in §16).

## 3. Inline-edit issues found + fixes
- **Finding:** No correctness defects in the engine. `useInlineEdit` already
  implements the full contract — always-visible pen, value/pen click to edit,
  Enter-to-save, Esc-cancel, unchanged-value no-op, optimistic flip, rollback +
  inline `role=alert` on failure, validation gating, and `permission`/`readOnly`
  lock with a `Lock` icon + sr-only reason.
- **Fix (regression guard, not a bug fix):** added **17 component tests** in
  `src/__tests__/inline-edit-system.test.tsx` that lock these behaviours in
  (pen always visible; pen-click and value-click both enter edit; Save calls
  `onSave(next)`; Enter saves; Esc cancels without calling `onSave`; unchanged =
  no call; failed save rolls back to the prior value and shows the error;
  validation blocks the save; readOnly/permission=false render no pen; optimistic
  value shows while in flight; relationship select **never** renders a raw UUID).
- **Toast position fix:** the inline-edit toast portal (`inlineEditToast.tsx`)
  was anchored at `bottom:16px`, putting it **behind the mobile bottom nav**.
  Now lifted to `calc(env(safe-area-inset-bottom)+84px)` below `lg`, dropping to
  `16px` on `lg+`.

## 4. Tables / dense surfaces audited + fixed
- `InlineEditCell` (the dense table variant) forwards to `InlineEditField` with
  `dense + useSheetOnMobile + silentToast`, so editing inside a horizontally
  scrolling table opens a full `MobileSheet` editor on phones rather than a
  cramped in-cell input. **No change needed** — verified correct by reading the
  component and exercising the relationship-select sheet path in tests.
- Global overflow guard `:where(.flex)>*, :where(.grid)>* { min-width:0 }` in
  `globals.css` keeps long unbreakable strings / wide cells from forcing
  page-level horizontal scroll, while `shrink-0` opt-outs keep wide tables
  scrollable. **No change needed.**

## 5. Mobile menu (bottom nav + More sheet)
- `MobileBottomNav`: 5-slot `grid-cols-5` — Home · Portfolio · [raised Copilot] ·
  Work · More. Centre button **opens** the Copilot/Inbox panel (`onOpenChat`),
  never navigates; carries the unread badge (caps `99+`, hidden at 0);
  `aria-haspopup="dialog"`, `aria-expanded`, descriptive `aria-label`. The More
  sheet groups everything else (Core / Finance / Operations / System / Support)
  via `MobileSheet` (full dialog semantics).
- **Fix (regression guard):** **7 tests** in
  `src/__tests__/mobile-bottom-nav.test.tsx` assert the centre button is a
  `<button>` with no `href`, calls `onOpenChat` on click, reflects `chatOpen` in
  `aria-expanded`; the badge renders/caps/hides correctly; Home/Portfolio/Work
  are real links with the right `href`; `aria-current="page"` marks the active
  tab; More exposes `aria-haspopup="dialog"`.

## 6. PWA fixes (warping pass — the core of A8.1)
**Root cause:** 15 sticky save bars across settings/account/detail-edit pages were
`fixed bottom-0` with inconsistent z-indexes (`z-30`, `z-40`, `z-50`). The fixed
`MobileBottomNav` is `z-40` and ~64px tall (+ safe-area). So `z-50` bars stacked
**on top of** the nav (nav unusable while the bar showed) and `z-30`/`z-40` bars
hid **behind** the nav (save action unreachable).

**Fix — one shared utility** (`src/app/globals.css`):
```css
.app-save-bar { bottom: calc(env(safe-area-inset-bottom,0px) + 64px); z-index: 41; }
@media (min-width: 1024px) { .app-save-bar { bottom: 0; z-index: 30; } }
```
Below `lg` the bar sits cleanly **above** the nav and above its z-index; on `lg+`
(no bottom nav) it collapses to a flush `bottom:0` desktop bar. Applied to all
15 bars (replacing their bespoke `bottom-0`/`z-*`/`pwa-safe-bottom`):
- `components/settings/SettingsCard.tsx` (`SettingsSaveBar`, shared)
- `account/profile`, `account/notifications`, `account/preferences`
- `workspace-settings/`: `profile`, `roles`, `security`, `ai`, `notifications`,
  `copilot-inbox`, `branding`
- `calendar/events/[id]/edit`, `compliance/certificates/[id]/edit`,
  `compliance/inspections/[id]/edit`, `money/invoices/[id]/edit`,
  `money/bills/[id]/edit`

**Content clearance** so the lifted bar never covers the last form row below `lg`:
- `workspace-settings/layout.tsx` content wrapper → `pb-[120px] lg:pb-0`
- `account/layout.tsx` content wrapper → `pb-[120px] lg:pb-8`
- detail-edit bodies bumped to clear the higher bar: `money/bills` `pb-24→pb-32
  lg:pb-24`, `money/invoices` form `pb-28→pb-32 lg:pb-28`, `calendar/events`
  `pb-24→pb-32 lg:pb-24`, `compliance/certificates` `pb-28→pb-32 lg:pb-28`,
  `compliance/inspections` body → `pb-[120px] lg:pb-0`.

**Other PWA warping checks:**
- Safe-area top/bottom: `MobileBottomNav` pads `env(safe-area-inset-bottom)`;
  `MobileSheet` footer + filler use it; `ShellContent` bottom clearance includes
  it; `.app-save-bar` mobile offset includes it. **OK.**
- Sheets/modals overflowing: `MobileSheet` is `maxHeight: 85vh` with an internal
  `overflow-y-auto overscroll-contain` body and a `shrink-0` sticky footer —
  cannot overflow the viewport. **OK.**
- Toasts behind nav: inline-edit toast and shared `ui/Toast` viewport both lifted
  above the nav on mobile (see §3, §16). **Fixed.**
- Floating help launcher / chat bubble overlapping the nav: already gated
  `hidden lg:block` (A4/A5). **OK.**

## 7. Tablet fixes (768–1024 band)
- The shell switches at `lg` (1024px), so the **tablet band uses the mobile
  bottom nav + mobile section nav**. The same `.app-save-bar` mobile arm
  (active below 1024px) gives tablets identical save-bar clearance. Settings
  side-rail is `hidden lg:flex`, replaced by `MobileSectionNav` pills < lg, so
  tablets get the pill nav, not a cramped desktop rail. **No tablet-specific
  regression found; covered by the same responsive rules.**

## 8. AI / Copilot bottom-nav migration
- The floating `ChatBubble` is `hidden lg:block` (desktop only). Below `lg` the
  **raised centre nav button is the sole Copilot entry point** and opens the
  globally-mounted `ChatPanel` (which resolves to a full-screen sheet on phones,
  `z-50` over the `z-40` nav). `AppShell` wires `chatOpen` / `onOpenChat` /
  `unreadCount`. Any page can open it via the `OPEN_COPILOT_EVENT`. Verified by
  reading `AppShell` + tested in `mobile-bottom-nav.test.tsx`. **OK.**

## 9. Help / tutorial collision
- `TutorialLauncher` is `hidden lg:block` — the floating help button/popover is
  desktop-only and cannot collide with the bottom nav, save bars, or the raised
  Copilot button on mobile. Mobile users reach help via **"Help & Guides" in the
  More sheet** (`/help`). **OK (from A5; re-verified).**

## 10. Quick-nav / task rail
- `ShellTabsRail` is `hidden lg:block` below `lg`; quick actions on mobile are
  owned by the page header / its overflow sheet, not a second sticky bar. Width
  aligned to the content gutters (`px-4 sm:px-6`, `mr-4` mismatch removed in A5).
  **OK.**

## 11. Header / tab ordering
- Standard order enforced where the shell controls it and documented for section
  bodies (A6): desktop = side-nav → quick-rail → header → tabs → filters →
  content; mobile = `MobileTopBar` → title → `MobileTabs`/`AppSectionTabs` →
  filters → content → bottom-nav clearance. Shared `AppSectionTabs` /
  `DetailPageTabs` give one tab presentation per breakpoint (never a double tab
  bar). **OK.**

## 12. Automations width
- `automations/AutomationsClient.tsx`: the narrow self-imposed
  `mx-auto max-w-6xl …` container was removed (A6) so the page uses the same
  `ShellContent` width as every other `/app` section. Its toast already uses the
  correct lifted pattern: `bottom-[calc(env(safe-area-inset-bottom)+84px)]
  lg:bottom-6`. **OK — used as the reference pattern for the §16 sweep.**

## 13. Upload persistence
- `lib/upload.ts` + `components/work/EvidenceUpload.tsx` persist the durable R2
  `key` (never a blob URL), render thumbnails from the authed `/api/files/{key}`
  URL (survive PWA refresh), validate client-side (size + MIME), show a
  per-upload progress bar, surface errors via `role=alert`, and expose a mobile
  camera-capture path (`capture="environment"`, `sm:hidden`). Branding logo
  uploader renders the stored logo from its authed URL. **OK (from A7.2).**

## 14. Demo-data
- `workspace-settings/demo-data` loads live status from `/api/demo/status`
  (owner/admin RPC-gated), shows per-type counts / injected date / expiry +
  days-left / edited-record count, with a "keep records I've edited"
  preserve-reset. The "preserve edited rows" rule is unit-tested
  (`demo-data-rules.test.ts`). The 2-arg `delete_demo_data` + `demo_data_status`
  migration is authored + idempotent; **deploy is gated on the team's normal
  migration flow** (remote history out of sync — see A7.3). **OK at app level.**

## 15. PWA install prompt
- Single owner `components/pwa/InstallPrompt.tsx` mounted once in
  `app/layout.tsx`; pure policy in `installPromptLogic.ts` (never in standalone /
  once installed; 21-day dismissal cooldown stored as a timestamp; blocked on
  forms/wizards/checkout/onboarding/auth/apply/new/create + planning build/edit).
  One-shot `decidedRef` guard so it does not re-fire on route changes.
  Unit-tested (`pwa-install-prompt.test.ts`, 10 cases). **OK (from A7.1).**

## 16. Toast-behind-nav sweep
- **Fixed (shared, in scope):**
  - `components/editing/inlineEditToast.tsx` — the global inline-edit toast
    portal, lifted above the nav < lg.
  - `components/ui/Toast.tsx` — the shared Radix toast viewport, lifted above
    the nav < lg (`bottom-[calc(env(safe-area-inset-bottom)+84px)] lg:bottom-4`).
- **Already correct:** `automations` toast; `pwa/InstallPrompt`,
  `pwa/ServiceWorkerRegister` (both `pwa-safe-bottom`, left/centre anchored).
- **Documented follow-up (section-owned, page-level toasts):** ~20 bespoke
  `fixed bottom-6 right-6 z-50` toasts across `accounting/*` and `contacts/*`
  pages. They are `z-50` so they paint **above** the `z-40` nav (action stays
  reachable), but on a phone they visually overlap the nav's bottom edge. The
  fix is mechanical — swap `bottom-6` for the
  `bottom-[calc(env(safe-area-inset-bottom)+84px)] lg:bottom-6` pattern (exactly
  as `AutomationsClient` already does). Left to the owning section agents to keep
  this pass within its shell/shared-component scope; **not a release blocker**
  (toasts are transient and remain on top).

## 17. Test results
- New: `src/__tests__/inline-edit-system.test.tsx` (17) +
  `src/__tests__/mobile-bottom-nav.test.tsx` (7) = **24 new component tests**.
- Harness: added `@testing-library/react@16`, `@testing-library/dom@10`,
  `jsdom@25` as **devDependencies**; both new suites opt into jsdom via a
  per-file `// @vitest-environment jsdom` docblock and a shared
  `src/__tests__/__stubs__/jsdom-setup.ts` (matchMedia polyfill + RTL cleanup).
  The global vitest environment stays `node` so the pure suites are untouched.
- Full run: **`npx vitest run` → 113 passed (10 files)**, up from 89. No
  Playwright run (e2e config exists but was not in scope; no new e2e added).

## 18. What was browser-verified vs static-only
- **Code/static-verified (this pass):** every save-bar and toast edit, the
  shared `.app-save-bar` CSS math, the layout clearance, and all 24 tests run
  green in jsdom. `tsc`, `vitest`, and `next build` gates all pass.
- **NOT yet device-verified (requires the owner on real hardware):** the
  installed-PWA standalone display (iOS Safari "Add to Home Screen" +
  Android/Chrome install), real notch / home-indicator safe-area rendering, and
  the live save-bar-above-nav interaction on physical 360 / 375 / 390 / 414
  viewports. The CSS uses standard `env(safe-area-inset-*)` + the documented
  64px nav height, so behaviour is expected-correct, but a device pass is the
  honest final sign-off step and is **recommended before public launch**.

## 19. Remaining risks
- **Low:** the ~20 page-level accounting/contacts toasts (§16) overlap the nav
  edge on phones until the owning agents apply the one-line pattern. Cosmetic,
  transient, non-blocking.
- **Low:** `MobileTabs` pill targets are `min-h-[40px]` (just under the 44px
  ideal) — acceptable for a segmented pill control; flagged, not changed, to
  avoid restyling the shared control late in the cycle.
- **External (not UX):** the demo-data 2-arg RPC migration still needs deploying
  via the team's migration flow (A7.3) — independent of this UX pass.

## 20. Accessibility summary (A8.3)
- Inline-edit pens: `aria-label="Edit {label}"` on both the value button and the
  pen button; Save/Cancel have `aria-label`s; errors are `role=alert`; locked
  fields expose a `Lock` icon + sr-only reason. **Verified in code + tests.**
- Centre Copilot button: `aria-label="Open Propvora Copilot and Inbox"`,
  `aria-haspopup="dialog"`, `aria-expanded`. **Tested.**
- More sheet & all `MobileSheet` dialogs: `role=dialog`, `aria-modal`,
  `aria-labelledby`, focus moved in on open + **focus-trap** (Tab cycles) +
  **Esc to close** + **focus-return** to the trigger + body-scroll-lock +
  safe-area. **Verified in code.**
- `MobileTabs`: `role=tablist`, roving `tabindex`, Arrow/Home/End keys,
  `aria-selected`, active-tab auto-scroll, reduced-motion respected. **Verified.**
- Visible focus rings (`focus-visible:ring-*`) on every interactive control;
  no button-looking `div`s in the touched surfaces (all are real `<button>` /
  `<a>` / `role=switch`). Reduced-motion honoured (`motion-reduce:*`,
  `motion-safe:*`) on nav, sheet, tabs, spinners, and toasts.

## 21. Visual polish summary (A8.2)
- Biggest consistency win: **15 save bars unified** from 3 different z-indexes +
  ad-hoc anchoring to one `.app-save-bar` contract (identical stacking, offset,
  and safe-area behaviour everywhere).
- Identity preserved (white / navy `#071B4D` / blue `#2563EB`); no redesign,
  no `dark:` classes introduced. Inline-edit fields reserve the control slot so
  there is **no layout shift** between display and edit. `SettingsCard`,
  `MobileSheet`, `MobileTabs` already share radius / padding / target sizing —
  left as-is (already consistent).

## 22. Files changed (this pass)
**Edited:**
- `src/app/globals.css` (added `.app-save-bar`)
- `src/components/settings/SettingsCard.tsx`
- `src/components/editing/inlineEditToast.tsx`
- `src/components/ui/Toast.tsx`
- `src/app/(app)/app/account/{profile,notifications,preferences}/page.tsx`
- `src/app/(app)/app/account/layout.tsx`
- `src/app/(app)/app/workspace-settings/{profile,roles,security,ai,notifications,copilot-inbox,branding}/page.tsx`
- `src/app/(app)/app/workspace-settings/layout.tsx`
- `src/app/(app)/app/calendar/events/[id]/edit/page.tsx`
- `src/app/(app)/app/compliance/{certificates,inspections}/[id]/edit/page.tsx`
- `src/app/(app)/app/money/{invoices,bills}/[id]/edit/page.tsx`

**Added:**
- `src/__tests__/inline-edit-system.test.tsx`
- `src/__tests__/mobile-bottom-nav.test.tsx`
- `src/__tests__/__stubs__/jsdom-setup.ts`
- devDeps: `@testing-library/react`, `@testing-library/dom`, `jsdom`

## 23. Final release recommendation (Block A UX layer)
**GO (code-complete).** The UX layer — global inline-edit system, mobile bottom
nav + centre Copilot, PWA warping, save-bar/nav stacking, toasts, a11y — is
release-ready: `tsc` = 0, `vitest` = 113 green, `next build` succeeds, no `dark:`
classes, no data/RLS changes. The single gating step before **public** launch is
the owner's **real-device installed-PWA pass** (§18) and, separately, deploying
the demo-data migration via the normal flow (§19). Neither is a code defect in
this layer. Recommendation: **ship the UX layer; schedule the device pass +
migration deploy as the final pre-launch checklist items.**

## Verification (A8 pass)
- `npx tsc --noEmit` → **0 errors** (full project).
- `npx vitest run` → **113 passed (10 files)** (89 prior + 24 new).
- `npx next build` → **succeeds** (run as the last A8 agent).
- No `dark:` classes introduced. No data / query / RLS changes. Desktop output
  unchanged — every mobile change is gated `lg:`/`hidden lg:block` or collapses
  to the prior desktop value at `min-width:1024px`.
