# 01 — Repo Audit & Scope Cleanup

> Phase 1+2 agent output. Date: 2026-06-02.

## Starting state

| Item | Before |
|------|--------|
| Route files | 2 (`page.tsx`, `layout.tsx`) |
| CSS | Default Next.js scaffold |
| Components | 0 |
| Lib utilities | 0 |
| Middleware | None |

## What was built (Phase 1 + 2)

### Phase 1 — Route scaffold (81 route files)

All routes created as typed stubs with `export const metadata` and a minimal `<div>` body. Groups and layouts wired:

- `(auth)` group — 6 pages + layout → `AuthShell`
- `(app)` group — 39 pages + layout → `AppShell`
- `(supplier)` group — 6 pages + layout → `SupplierShell`
- `(affiliate)` group — 6 pages + layout → `AffiliateShell`
- `(admin)` group — 17 pages + layout → `AdminShell`
- Public routes — 11 pages (landing, features, pricing, legal x7)
- API routes — 6 handlers

### Phase 2 — Design system

#### globals.css
- Replaced with full Tailwind v4 `@theme` token block
- Propvora colour palette: navy sidebar, brand blue, sky, success, warning, danger, AI violet
- CSS custom properties for light/dark mode (`--bg-base`, `--bg-sidebar`, `--text-primary`, etc.)
- Dark mode driven by `.dark` class (next-themes)
- Inter font from Google Fonts
- Premium scrollbar, selection colours, base reset, utility layers

#### src/lib/utils.ts
- `cn()` helper (clsx + tailwind-merge)
- `formatCurrency()`, `formatDate()`, `truncate()`, `getInitials()`, `debounce()`, `sleep()`, `isDefined()`, `slugify()`

#### src/lib/supabase/
- `client.ts` — `createBrowserClient` for client components
- `server.ts` — `createServerClient` with Next.js cookies() for server components
- `admin.ts` — service-role client for server-only admin operations

#### src/middleware.ts
- Supabase session refresh on every request
- Protects `/app/*`, `/supplier-portal/*`, `/affiliate/*`, `/admin/*`
- Redirects unauthenticated users to `/login?redirectTo=<path>`
- Redirects authenticated users away from `/login`, `/register`

#### Shell components (all `"use client"`)
- `AppShell` — full sidebar nav with collapsible sections, AI panel, topbar with search/create/notifications/profile
- `AdminShell` — admin nav with ADMIN badge
- `SupplierShell` — supplier portal nav with SUPPLIER badge
- `AffiliateShell` — affiliate nav with AFFILIATE badge
- `AuthShell` — centred card layout with logo and legal footer

#### UI Primitives
- `Button` — 11 variants (primary, secondary, soft, outline, ghost, destructive, destructive-soft, success, warning, ai, ai-soft, icon) + 3 size tiers; loading state built in
- `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`
- `Badge` — 7 semantic variants, dot mode
- `Input` — label, hint, error, left/right elements, full a11y
- `Select` — Radix UI Select primitive, fully styled
- `Dialog` — Radix UI Dialog, 5 sizes, animated
- `Tabs` — Radix UI Tabs, underline + pills variants
- `Toast` / `ToastProvider` / `ToastViewport` — success/error/warning/info variants
- `Dropdown` — Radix UI DropdownMenu, full composition
- `Avatar` — Radix UI Avatar, deterministic colour fallbacks
- `Skeleton` / `SkeletonText` / `SkeletonCard` / `SkeletonTable`
- `EmptyState` — icon, title, description, primary + secondary CTAs
- `LoadingPage` / `LoadingSection` / `LoadingRow` / `Spinner`
- `ErrorState` — generic/network/not-found/permission types, retry button

#### Layout helpers
- `DashboardContainer`, `SettingsContainer`, `DetailContainer`, `FormContainer`, `PageHeader`

#### Root layout
- Inter font via `next/font/google`
- ThemeProvider (next-themes, `.dark` class, no system theme)
- Proper metadata with OG + Twitter cards
- `propvora-favicon.png` as icon

## What was deliberately excluded (scope cleanup)

| Item | Decision |
|------|----------|
| shadcn/ui | Removed — all primitives built from scratch with Radix + CVA |
| tailwind.config.js | Not created — Tailwind v4 uses `@theme` in CSS only |
| Geist font | Replaced with Inter |
| Default Next.js boilerplate (next.svg, vercel.svg) | Left in /public; unused |
| Page implementations | Deferred — stubs only; to be filled by section agents |
| DB schema / Supabase migrations | Out of scope for Phase 1+2 |
| Stripe integration | Route stub only |
| AI implementation | Route stubs only |

## Files created summary

```
src/
  middleware.ts
  lib/
    utils.ts
    supabase/client.ts
    supabase/server.ts
    supabase/admin.ts
  app/
    layout.tsx (updated)
    globals.css (replaced)
    page.tsx (stub)
    features/page.tsx
    pricing/page.tsx
    legal/ (7 pages)
    (auth)/ (layout + 6 pages)
    (app)/ (layout + 39 pages)
    (supplier)/ (layout + 6 pages)
    (affiliate)/ (layout + 6 pages)
    (admin)/ (layout + 17 pages)
    api/ (6 route handlers)
  components/
    shells/
      AppShell.tsx
      AdminShell.tsx
      SupplierShell.tsx
      AffiliateShell.tsx
      AuthShell.tsx
    layout/
      PageContainer.tsx
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Input.tsx
      Select.tsx
      Dialog.tsx
      Tabs.tsx
      Toast.tsx
      Dropdown.tsx
      Avatar.tsx
      Skeleton.tsx
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
docs/
  buildmap/ROUTE_WIRING_MATRIX.md
  rebuild/01_REPO_AUDIT_AND_SCOPE_CLEANUP.md
```

## Next steps for subsequent agents

1. **Landing page** (`/`) — hero, features, pricing preview, CTA
2. **Auth pages** — login, register, forgot-password, onboarding flows with Supabase Auth
3. **Dashboard** (`/app`) — KPI cards, activity feed, quick actions
4. **Portfolio section** — properties/units/tenancies list + detail pages
5. **Work section** — tasks/jobs with kanban + list views
6. **Money section** — income/expense/invoice tables with charts
7. **Admin console** — user management, metrics, audit log
8. **Supabase schema** — database migrations, RLS policies, types
