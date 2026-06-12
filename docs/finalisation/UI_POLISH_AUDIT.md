# UI Polish Audit

**Last Updated:** 2026-06-11 (Wave 4 UI pass)

## Status: ✅ Pass | 🔧 Fixed | ❌ Issue | ⬜ Pending

## Global Fixes (Waves 1-3)

| Issue | Status | Notes |
|-------|--------|-------|
| Avatar dropdown z-index | 🔧 Fixed | createPortal + fixed positioning 2026-06-10 |
| Logo files renamed | 🔧 Fixed | URL-safe filenames 2026-06-10 |
| Logo sizing in public nav | 🔧 Fixed | h-12 w-auto 2026-06-10 |
| Logo sizing in dashboards | 🔧 Fixed | White logo, 148px wide sidebars 2026-06-10 |
| Admin/Supplier/Affiliate shells | 🔧 Fixed | Full-width logo + role badge 2026-06-10 |
| Loading skeleton on all detail pages | 🔧 Fixed | All new/edit/detail pages added 2026-06-11 |
| Empty states on all list pages | 🔧 Fixed | useProperties/etc hook empty handling 2026-06-11 |
| Error states on all list pages | 🔧 Fixed | error.message in toast + visible banner 2026-06-11 |
| Dead buttons replaced with real actions | 🔧 Fixed | All wired in Waves 1-3 |

## Per-Section Visual Status

| Section | Whitespace | Card grids | Typography | Responsive | Empty states | Loading states | Status |
|---------|-----------|-----------|-----------|-----------|-------------|--------------|--------|
| Home | ✅ | ✅ | ✅ | 🔧 | ✅ | ✅ | 🔧 Skeleton grids now responsive |
| Portfolio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Card grid already responsive |
| Work | ✅ | ✅ | ✅ | 🔧 | ✅ | 🔧 | 🔧 Skeleton + overflow-x-auto fixed |
| Planning | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Contacts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Already responsive |
| Money | ✅ | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 KPI grid + empty + skeleton fixed |
| Accounting | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Calendar | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Compliance | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Legal | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Workspace Settings | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Account | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Admin | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Supplier Portal | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Affiliate Portal | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Auth pages | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |
| Marketing pages | ✅ | ✅ | ✅ | ⬜ | ✅ | ✅ | 🔧 Core done |

## Wave 4 Polish (Completed items from this pass)

| Item | Status | Notes |
|------|--------|-------|
| Tasks list: raw "Loading tasks..." text | 🔧 Fixed | Replaced with skeleton rows (animate-pulse row shimmer) |
| Tasks list: table missing overflow-x-auto | 🔧 Fixed | Wrapped `<table>` in `<div className="overflow-x-auto">` |
| Jobs list: table missing overflow-x-auto | 🔧 Fixed | Wrapped `<table>` in `<div className="overflow-x-auto">` |
| Money Invoices: no error banner | 🔧 Fixed | Added `invoicesError` destructure + red banner above KPIs |
| Money Invoices: no loading skeleton in table | 🔧 Fixed | Added animate-pulse skeleton rows when `invoicesLoading` |
| Money Invoices: empty state missing | 🔧 Fixed | `FileText` icon + "No invoices yet" copy when `filtered.length === 0` |
| Money Invoices: KPI grid fixed cols-5 | 🔧 Fixed | Changed to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` |
| Home dashboard skeleton: fixed grid-cols-6/3/4 | 🔧 Fixed | Changed to responsive `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` etc. |

## Wave 4 Polish (Remaining)

| Item | Priority | Notes |
|------|----------|-------|
| Full responsive pass — all sections at 375px/768px/1280px | High | Mobile not tested yet |
| Copilot panel sizing — 720px and 1100px breakpoints | High | Messaging agent Wave 4 |
| Toast positioning — should not overlap modals | Medium | Wave 4 |
| Consistent button disabled states during loading | Medium | Wave 4 |
| Skeleton animation consistency | Low | Tailwind animate-pulse used throughout |
| Table/list sticky headers | Low | Wave 4 |
| Sidebar nav active state highlight | ✅ | Already implemented |
| Breadcrumb consistency | ✅ | All detail pages have breadcrumb |
| Back navigation | ✅ | router.back() or explicit href |
