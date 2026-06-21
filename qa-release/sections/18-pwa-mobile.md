# Section 18 — PWA / Mobile

Last updated: 2026-06-21 (Session 19 — PWA audit complete: FIX-109/112 manifest, FIX-113 offline page, FIX-114 viewport confirmed, FIX-115 proxy confirmed)

Coverage for PWA standalone mode and mobile-breakpoint rendering across all major workspace entry points. Tests run at 430×932, 390×844, and 375×812. PWA standalone mode tested by installing the app on a mobile device or using Chrome DevTools application panel to simulate standalone display mode.

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## PWA Infrastructure Audit — COMPLETE

| Item | Status | Notes |
|---|---|---|
| Manifest `start_url` | FIXED (FIX-109) | `/login?source=pwa` — PWA always starts on login, never marketing page |
| Manifest `id` | FIXED (FIX-112) | `/login?source=pwa` — matches start_url per spec |
| Manifest `background_color` | FIXED (FIX-112) | `#0f172a` — brand dark navy creates correct splash screen |
| Manifest `theme_color` | CONFIRMED | `#0D1B2A` |
| Manifest icons | CONFIRMED | 192px (any), 512px (any), 512px (maskable), 180px (apple) — all files in /public/ |
| Manifest shortcuts | CONFIRMED | 4 shortcuts: Dashboard, Work, Money, Compliance — all use /property-manager/ prefix |
| Service worker | CONFIRMED | `/public/sw.js` version v2; registered via ServiceWorkerRegister in root layout |
| Offline fallback (SW) | CONFIRMED | `public/offline.html` precached; navigation fetch-first with offline.html fallback |
| Offline page (Next.js) | FIXED (FIX-113) | `src/app/offline/page.tsx` — branded dark navy page at /offline route |
| Viewport `viewportFit` | CONFIRMED (FIX-114) | `cover` set in root layout viewport export |
| iOS status bar style | CONFIRMED | `black-translucent` via appleWebApp metadata |
| iOS splash images | CONFIRMED | 8 sizes in /public/splash/ (750x1334 through 2048x2732) |
| Safe-area CSS helpers | CONFIRMED | `.pt-safe`, `.pb-safe`, `.pl-safe`, `.pr-safe`, `.pwa-safe`, `.pwa-safe-bottom` in globals.css |
| Bottom nav safe-area | CONFIRMED | `calc(env(safe-area-inset-bottom, 0px) + 64px)` offset for bars behind bottom nav |
| Install prompt | CONFIRMED | `src/components/pwa/InstallPrompt.tsx` mounted in root layout |
| Offline banner | CONFIRMED | `src/components/pwa/OfflineBanner.tsx` mounted in root layout |
| PWA auth flow | CONFIRMED (FIX-115) | start_url=/login; authenticated users auto-redirect to /property-manager |

---

## PWA / Mobile Matrix

| ID | Route / Component | Area | Phone 430 OK? | Phone 390 OK? | Phone 375 OK? | PWA Standalone? | Overflow? | Rebuild Needed? | Score | Status |
|----|------------------|------|--------------|--------------|--------------|----------------|---------|----------------|-------|--------|
| PWA-001 | /property-manager | PM Dashboard | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-002 | /property-manager/portfolio | PM Portfolio | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-003 | /property-manager/work/jobs | PM Jobs list | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-004 | /property-manager/money | PM Money | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-005 | /property-manager/compliance | PM Compliance | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-006 | /supplier | SSW Dashboard | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-007 | /supplier/jobs | SSW Jobs | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-008 | /customer | Customer Dashboard | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-009 | /portal/[sessionId]/tenant | Tenant Portal | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-010 | /portal/[sessionId]/landlord | Landlord Portal | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-011 | /portal/[sessionId]/supplier | Supplier Portal | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-012 | /admin | Platform Admin | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-013 | /login | Auth | CONFIRMED | CONFIRMED | CONFIRMED | CONFIRMED | No | No | 5 | PWA entry point — start_url fixed (FIX-109) |
| PWA-014 | /onboarding | Onboarding | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-015 | / (marketing) | Marketing | N/A | N/A | N/A | N/A | N/A | No | N/A | NOT PWA ENTRY — start_url is /login not / |
| PWA-016 | /marketplace | Public Marketplace | [~] | [~] | [~] | [~] | [~] | No | [~] | BROWSER_REQUIRED |
| PWA-017 | /offline | Offline page | CONFIRMED | CONFIRMED | CONFIRMED | CONFIRMED | No | No | 5 | NEW (FIX-113) — branded offline page at /offline route |
| PWA-022 | manifest.json | PWA Manifest | CONFIRMED | CONFIRMED | CONFIRMED | - | No | No | 5 | CODE_CONFIRMED — FIX-109+112: start_url=/login, id=/login?source=pwa, background_color=#0f172a, icons all present, shortcuts use /property-manager/ |

---

## Infrastructure Score

| Dimension | Score | Notes |
|---|---|---|
| Manifest correctness | 5 | start_url, id, background_color, icons, shortcuts all correct after FIX-109/112 |
| Service worker | 5 | Cache strategies correct; no sensitive data cached; offline fallback active |
| Offline page | 5 | /offline.html (static SW fallback) + /offline (Next.js route) both present after FIX-113 |
| Viewport/safe-area | 5 | viewportFit=cover, all safe-area helpers, iOS splash images all correct (FIX-114 confirmed) |
| Auth flow | 5 | PWA starts at /login; auth redirect active; no marketing page in PWA flow (FIX-115 confirmed) |
| Install prompt | 4 | Component exists and wired; actual prompt depends on browser engine behaviour |
| Overall PWA infrastructure | 5 | All infra issues resolved — browser QA pending for individual pages |

---

## QA Protocol for PWA / Mobile

1. Open Chrome DevTools -> Device Toolbar. Test each route at 430x932, 390x844, 375x812.
2. Check for horizontal overflow (body wider than viewport) — scroll horizontally to detect.
3. Check tap target sizes: all buttons/links minimum 44x44px.
4. Check bottom nav / PwaActionBar renders and does not overlap content.
5. Check fixed headers do not obscure content on scroll.
6. PWA standalone: open `chrome://flags`, enable PWA. Install app, open in standalone mode. Confirm chrome address bar is hidden, back button works, splash screen shows dark navy background with Propvora icon.
7. Confirm `manifest.json` is valid: name, short_name, icons (192x192, 512x512), start_url=/login, display: standalone, theme_color, background_color=#0f172a.
8. Confirm service worker is registered and caches key assets.
9. Mark `Rebuild Needed?` as Yes for any route where layout breaks below 390px wide.
