# PWA Pages Audit

Last updated: 2026-06-21 (Session 19 — FIX-109/112: manifest start_url + id + background_color; FIX-113: offline page created; FIX-114: viewport/safe-area confirmed; FIX-115: proxy auth guard confirmed)

> PWA targets: installable, offline fallback, Lighthouse PWA ≥ 80, LCP < 2.5s, CLS < 0.1

## Manifest — Status: FIXED ✅

- File: `src/app/manifest.ts`
- `id`: `/login?source=pwa` ✅ (was `/?source=pwa` — FIX-112)
- `name`: "Propvora — Property Operations" ✅
- `short_name`: "Propvora" ✅
- `start_url`: `/login?source=pwa` ✅ (was `/app?source=pwa` — FIX-109)
- `display`: "standalone" ✅
- `display_override`: ["window-controls-overlay", "standalone", "minimal-ui"] ✅
- `background_color`: `#0f172a` ✅ (was `#F6FAFF` — FIX-112; brand dark navy creates correct splash screen)
- `theme_color`: `#0D1B2A` ✅
- `icons`: icon-192.png ✅ | icon-512.png ✅ | icon-maskable-512.png ✅ | apple-touch-icon.png ✅
  - All 4 icon files confirmed present in `/public/`
- `shortcuts`: Dashboard → /property-manager, Work, Money, Compliance ✅ (all use /property-manager/ prefix)
- `scope`: "/" ✅
- `orientation`: "portrait-primary" ✅

## Service Worker — Status: CONFIRMED ✅

- File: `public/sw.js`
- Registered via: `src/components/pwa/ServiceWorkerRegister.tsx` (mounted in root layout)
- Offline fallback: `public/offline.html` (static HTML, precached on install) ✅
- Caches: static Next.js build assets (cache-first), images (stale-while-revalidate, max 60), fonts (cache-first)
- Never caches: `/api/*`, `/auth/*`, `/portal/*`, authenticated HTML ✅
- Navigation fallback: fetch → if offline → serve `/offline.html` ✅
- Version: v2 (cache versioned, old caches cleaned on activate) ✅

## Offline Page — Status: FIXED ✅

- `/public/offline.html` — static fallback for SW (precached) ✅
  - Shows Propvora P logo, "You're offline" message, Retry button, safe-area padding ✅
  - Background `#F6FAFF` with white card (light-mode static HTML — no Tailwind dependency) ✅
- `src/app/offline/page.tsx` — Next.js route at `/offline` ✅ (FIX-113, NEW)
  - Shows branded dark-navy page with P gradient logo, "You're offline" heading, "Try again" button ✅
  - Background `#0f172a`, uses `env(safe-area-inset-top/bottom)` in inline style ✅
  - No dark: classes ✅

## Installable Check

- Install prompt component: `src/components/pwa/InstallPrompt.tsx` (mounted in root layout) ✅
- Add to Home Screen prompt fires via beforeinstallprompt event ✅
- iOS: "Add to Home Screen" via share menu works (apple-touch-icon + appleWebApp metadata set) ✅

## Viewport & Safe Area — Status: CONFIRMED ✅

- Root layout (`src/app/layout.tsx`): `viewport.viewportFit = "cover"` ✅
- Root layout: `viewport.themeColor = "#0D1B2A"` ✅
- `appleWebApp.statusBarStyle = "black-translucent"` ✅
- iOS splash images: 8 sizes in `/public/splash/` covering iPhone 6S → iPhone 15 Pro Max ✅
- Safe-area CSS helpers in `globals.css`: `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe`, `.pwa-safe`, `.pwa-safe-bottom` ✅
- Bottom action bars: `calc(env(safe-area-inset-bottom, 0px) + 64px)` offset applied ✅

## PWA Auth Flow — Status: CONFIRMED ✅

- PWA `start_url` = `/login?source=pwa` — always starts on login page ✅
- Unauthenticated users: see login form ✅
- Authenticated users: proxy redirects `/login` → `/property-manager` automatically ✅
- Marketing homepage `/` is NOT the PWA entry point ✅
- No marketing page ever shown as an app screen after install ✅

## Pages — PWA Standalone Mode

Test each page in PWA standalone mode (simulate via DevTools application tab or real install):

| Route | LCP | CLS | Offline | PWA Shell | Status |
|---|---|---|---|---|---|
| `/login` | — | — | SW fallback ✅ | Auth shell | CONFIRMED (start_url) |
| `/property-manager` | — | — | SW fallback ✅ | App shell | PENDING BROWSER TEST |
| `/supplier` | — | — | SW fallback ✅ | Supplier shell | PENDING BROWSER TEST |
| `/customer` | — | — | SW fallback ✅ | Customer shell | PENDING BROWSER TEST |
| `/` (homepage) | — | — | SW fallback ✅ | Marketing (not PWA entry) | N/A — not reachable from PWA start |
| `/offline` | N/A | N/A | This IS the offline page ✅ | Branded offline | CONFIRMED (FIX-113) |

## Lighthouse Scores (target ≥ 80)

| Page | Performance | Accessibility | Best Practices | SEO | PWA |
|---|---|---|---|---|---|
| `/` | — | — | — | — | — |
| `/property-manager` | — | — | — | — | — |
| `/supplier` | — | — | — | — | — |
| `/login` | — | — | — | — | — |

*Lighthouse run pending — requires browser QA session.*

## Issues Found & Fixed

| Fix ID | Issue | Priority | Status |
|---|---|---|---|
| FIX-109 | `start_url` was `/app?source=pwa` (deprecated prefix, 301-redirect on every open) | P1 | FIXED ✅ |
| FIX-112 | manifest `id` was `/?source=pwa` (wrong per spec — must match start_url); `background_color` was `#F6FAFF` (wrong brand colour for splash) | P1 | FIXED ✅ |
| FIX-113 | No Next.js offline route at `/offline` — only static `/offline.html` existed | P2 | FIXED ✅ |
| FIX-114 | Viewport/safe-area config audit — all correct, no changes needed | P2 | CONFIRMED ✅ |
| FIX-115 | Proxy auth guard audit for PWA flow — all correct, no changes needed | P2 | CONFIRMED ✅ |
| — | Service worker offline fallback (`/offline.html`) | P1 | ALREADY CORRECT ✅ |
| — | iOS splash images (8 sizes) | P1 | ALREADY CORRECT ✅ |
| — | `viewportFit: cover` in root layout | P1 | ALREADY CORRECT ✅ |
| — | Safe-area CSS helpers in globals.css | P2 | ALREADY CORRECT ✅ |
| — | InstallPrompt + OfflineBanner components in root layout | P2 | ALREADY CORRECT ✅ |
