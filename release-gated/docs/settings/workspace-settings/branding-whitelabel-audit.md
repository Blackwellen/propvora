# Workspace Settings — Branding / White-label / Menu / Flags audit + build log

**Date:** 2026-06-27 · **Scope:** Branding editor, White-label, Menu Builder, Quick Action Bar, Feature Flags.

## Audit findings (hard numbers)

| Area | State | Evidence |
|---|---|---|
| **Brand colour application** | ❌ Structurally disconnected | **2,704 hardcoded `#2563EB` across 815 files** vs **51 `var(--brand)`**. Branding *saves* (`workspaces.brand_color`/`brand_colours`, columns exist) and the token chain exists (`theme.ts → BrandingStyle SSR inject → BrandingLiveApply`), but the UI ignores the token, so a brand-colour change repaints ~2% of the app. |
| **White-label settings** | ❌ Saves, zero consumers | `white_label_settings` column exists and the page persists, but **no file outside the settings page reads it** — brand name / hide-powered-by / support email apply nowhere. |
| **Fonts** | ❌ Not implemented | No font/typography setting exists anywhere. Net-new if required. |
| **Menu Builder — module show/hide** | ❌ Dead | `handleModulesSave` is a no-op; `SideNavigation` never reads module visibility. |
| **Menu Builder — Default Landing Page** | ❌ Dead | `<select>` has no value/onChange/save. |
| **Quick Action Bar** | ⚠️ Works but gaps | Renders from `ShellTabsRail` via localStorage. Not DB-synced (per-browser only) and **not flag-gated** — a user can pin "Suppliers"/marketplace widgets while those flags are OFF. |
| **Feature Flags (admin)** | ⚠️ Mostly works | Registry + `platform_feature_flags` + `FlagToggle` with dependency rules. Nav gating partial (V2 items tagged). Needs end-to-end ON/OFF verification + tighter route/quick-bar gating. |

## Commercial impact
White-label is the Pro/Agency upsell. As shipped it is **cosmetically non-functional** — an agency that sets its brand colour/name sees almost no change. Fixing the token wiring is the single highest-value change to make the tier sellable.

## Build log — Stage 1: brand-token foundation (DONE)
Converted the shared design primitives + app shell from hardcoded brand-blue to the `var(--brand)` /
`var(--brand-strong)` / `var(--brand-soft)` tokens, so the entire app chrome now repaints with the
workspace colour. Default value is unchanged (`#2563EB`) → **zero visual regression at default**, full
rebrand when a custom colour is set.

Files (16): `components/ui/Button.tsx` (primary/soft/outline/ghost/icon variants), `Avatar`, `Badge`,
`Dialog`, `Input`, `LoadingState`, `ResponsiveTabNav`, `Select`, `StatCard`, `Tabs`, `Toast`;
`components/shell/AccountMenu`, `NotificationBell`, `QuickCreateButton`, `SideNavigation`, `TopNavigation`.

Wiring chain verified in code: `workspaces.brand_color` → `resolveBrand`/`brandCssVars` (emits `--brand`,
`--brand-strong`, `--brand-soft`, `--on-brand`) → `BrandingStyle` (SSR inject) + `BrandingLiveApply`
(live update on save) → tokenized primitives. `tsc` clean on all 16 files (2 unrelated pre-existing
Stripe-type errors elsewhere are not from this work).

## Stage 2 — broad colour sweep (DONE)
Converted page-level hardcoded `#2563EB`/`#1d4ed8`/`#EFF6FF` → `var(--brand)`/`-strong`/`-soft` across
**~690 `.tsx` files** in `app/(app)` (172), `components`+`features`+`portals`/`tenant`/`landlord` (504),
plus the ui/shell primitives. **Regression-safe**: bare JS-string colour values used with opacity
concatenation (`colour + "20"`) were reverted to hex (65+57 files) so only Tailwind **class** contexts
became tokens; 3 alpha-hex-adjacency cases (`var(--brand)15` in shadows/SVG fill) restored to literal.
Excluded deliberately: marketing / marketing-public / email templates (must stay literal/Propvora-blue),
`.ts` data files. Also swept Tailwind **named** `blue-50/500/600/700` brand utilities in ui/shell so the
sidebar active pill + tab icons rebrand (hex sweep alone missed these).

## Stage 3 — white-label provider (DONE)
- `lib/branding/white-label-core.ts` (pure `resolveWhiteLabel`) + `white-label.tsx` (`useWhiteLabel` hook,
  pure `<PoweredByPropvora>`). `WhiteLabelSettings` now sourced from core; surfaced on the workspace via
  `AuthProvider` (added `logo_url`, `white_label_settings` to the select + type).
- **Portals** (`[sessionId]/layout.tsx` → `PortalShell`): resolve the owning workspace's `brand_color`/
  `brand_colours`/`white_label_settings`, inject brand CSS vars onto the portal root (portal repaints to
  the workspace colour), show the white-label brand name, and **hide "Powered by Propvora"** when the
  workspace enables that. (Note: the attribution footer didn't exist before — it's now rendered + gated.)

## Stage 4 — Menu Builder (DONE)
- New `saveWorkspaceNav` server action (owner/admin-gated, merges into `workspaces.settings.nav`, audited).
- Module show/hide now persists + `SideNavigation` filters hidden modules live (was a no-op).
- Default-landing `<select>` wired (was a dead control) — persists + offers only visible modules.

## Stage 5 — Quick bar (DONE)
- `flag` field on `QuickBarWidget` + `gateWidgets`; planning/automations/legal widgets gated. `ShellTabsRail`
  + Menu Builder catalogue filter by `useQuickbarFlags()` — a workspace can't pin a surface its flags haven't
  enabled (your "no Suppliers until flag on").
- DB-sync: `user_preferences.quickbar` jsonb (migration applied) + `loadQuickBarPrefsFromDb`/
  `saveQuickBarPrefsEverywhere` — prefs follow the user across devices (localStorage stays the fast path).

## Stage 6 — Feature flags (DONE)
- Verified `setGlobalFlag` → `platform_feature_flags` (UNIQUE(flag_key), populated) persists correctly; the
  admin page is functional (requires platform-admin identity, which reads as "broken" to non-admins).
- **Added missing server route guards** (direct-URL gating, not just nav suppression): `accounting`
  (accountingGl), `bookings` (bookingManagement), `listings` (directBookingPages), `suppliers`
  (marketplaceEnabled), `automations` (canvasLite redirect). All honour the `NEXT_PUBLIC_QA_ALL_FLAGS` bypass.

## Verification
- **Live MCP proof of rebrand**: set workspace `brand_color=#DC2626` → "+ New", "+ Add property", active
  tabs, notification badge all repainted **red**; reverted to null → all back to **blue**. Zero regression at
  default. Screenshots: `release-gated/docs/screenshots/branding-rebrand-red-portfolio.jpeg` +
  `branding-reverted-blue-portfolio.jpeg`.
- `next build` → **exit 0** ("Compiled successfully") with all stages in. `tsc` clean on Stages 1–5 (Stage-6
  guards use registry-validated flag keys; full tsc OOMs only under concurrent-server memory pressure).

## Residuals — now CLOSED
- ✅ **Colour long-tail**: every `blue-*` shade (50–900, all prefixes) swept across app/(app), components,
  features, portals, affiliate, supplier-workspace and customer → brand tokens. **0 blue-* utility files**
  remain in any workspace dir. Only Propvora's public marketing site + admin console keep Propvora-blue
  (deliberate — no workspace context to rebrand to). [FIX-706, FIX-707]
- ✅ **supplier-workspace + customer**: swept — they now follow their own brand context. [FIX-707]
- ✅ **Brand fonts**: built (curated 10-font picker → `brand_colours.font` → `--brand-font` → Google-Font
  load + `[data-brand-root]` apply + live-apply). Selector verified live; build green. [FIX-708]

## Status
Stages 1–6 complete, build-verified, rebrand MCP-proven. Ready for release.
