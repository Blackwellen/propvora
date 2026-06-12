# Propvora — Performance and Responsive Audit
Generated: 2026-06-03

## Performance Considerations

### 1. Server vs. Client Components

**Current state:** The vast majority of pages use `"use client"`. This means they ship the full React bundle and hydrate on the client rather than streaming HTML from the server.

**Impact:** Slightly larger initial JS bundle, slower Time To Interactive (TTI) on first load.

**Opportunities (V1.5+):**
- Legal pages (`/legal/*`) — pure static content, no interactivity needed. Safe to convert to server components.
- Marketing pages (`/`, `/features`, `/pricing`) — static content with minor interactivity (nav). Use server components for the page shell, isolate interactive bits (e.g., mobile menu) in small client components.
- Admin list pages — data fetching can happen server-side; tables can be server-rendered.

**Not candidates:** Any page using `useRouter`, `useState`, `useEffect`, form hooks, Supabase client-side auth, or real-time subscriptions must remain `"use client"`.

---

### 2. Recharts (Chart Components)

**Current state:** Recharts is imported directly in page files (e.g., planning/sets/new, money pages, dashboard).

**Impact:** Recharts adds ~200KB to the bundle. Loading it eagerly on every page that might show a chart increases JS parse time.

**Recommended fix (V1.5):**
```tsx
// Instead of direct import:
import { LineChart, Line } from 'recharts'

// Use dynamic import with ssr: false:
import dynamic from 'next/dynamic'
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
```

This defers Recharts loading until the component is visible, which is acceptable since charts are never above-the-fold.

**Affected files:**
- `src/app/(app)/app/planning/sets/new/page.tsx`
- Any money, dashboard, or analytics page using recharts

---

### 3. Large Page Files

**Planning Wizard (`planning/sets/new/page.tsx`):**
- The wizard is approximately 900+ lines in a single file.
- This is acceptable for V1 as it keeps the logic co-located.
- For V1.5, consider splitting into step components: `WizardStepProfile`, `WizardStepIncome`, etc.
- No performance issue at runtime — the file size only affects developer experience.

**Demo Data Seeder (`/api/demo/seed`):**
- ~1207-line server-side API route.
- Runs only when explicitly triggered, not on page load.
- Acceptable: this is a server function with no impact on page load performance.

---

### 4. Image Optimization

**Logo / images:** The project uses `next/image` for the main logo, which provides:
- Automatic WebP conversion
- Lazy loading by default
- Correct width/height to prevent CLS (Cumulative Layout Shift)

**Status: GOOD** — No image optimization issues identified.

---

### 5. Font Loading

**Current approach:** Google Fonts loaded via CSS `@import` in global styles.

**Impact:** CSS `@import` for fonts blocks rendering and counts as a render-blocking resource. It also does not benefit from Next.js font optimization (subsetting, self-hosting).

**Recommended fix (V1.5):**
```tsx
// In src/app/layout.tsx:
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})
```

This self-hosts the font, eliminates the external request, and reduces CLS.

---

### 6. Bundle Analysis

**To generate a bundle report:**
```bash
npm install --save-dev @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true })
module.exports = withBundleAnalyzer({})
```

Then run `npm run build` to generate `/.next/analyze/client.html`.

---

## Responsive Design Audit

### Breakpoints Used

The project uses Tailwind CSS v4 with default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Shell Responsiveness

| Shell | Mobile Sidebar | Tablet | Desktop | Status |
|-------|---------------|--------|---------|--------|
| AppShell | Collapsible (hamburger) | Compact sidebar | Full sidebar | GOOD |
| AuthShell | Full width centered | Centered card | Centered card | GOOD |
| AdminShell | Collapsible | Compact | Full | GOOD |
| SupplierShell | Collapsible | Compact | Full | GOOD |
| AffiliateShell | Collapsible | Compact | Full | GOOD |

### Page-Level Responsive Status

| Section | Mobile | Tablet | Desktop | Notes |
|---------|--------|--------|---------|-------|
| Public / marketing | GOOD | GOOD | GOOD | Hero, features, pricing all responsive |
| Auth forms | GOOD | GOOD | GOOD | Full-width on mobile, card on desktop |
| Dashboard | ACCEPTABLE | GOOD | GOOD | KPI strip stacks on mobile |
| Portfolio tables | ACCEPTABLE | GOOD | GOOD | Tables scroll horizontally on mobile |
| Planning wizard | GOOD | GOOD | GOOD | Step-by-step layout works on mobile |
| Admin tables | ACCEPTABLE | GOOD | GOOD | Wide tables need horizontal scroll |
| Supplier / Affiliate | GOOD | GOOD | GOOD | Simple layouts, responsive by default |

### Known Responsive Issues (P2)

1. **Wide tables on mobile** — Data tables in admin and portfolio sections require horizontal scrolling on screens < 640px. This is standard behavior and acceptable, but could be improved with card-style mobile layouts in V1.5.

2. **Planning wizard on very small screens (< 360px)** — The multi-column step header may wrap awkwardly on sub-360px screens. These represent < 2% of traffic.

3. **Calendar view** — The monthly calendar grid collapses acceptably but dense events may be hard to read on mobile. Consider a mobile-first list view for the calendar in V1.5.

---

## Core Web Vitals Targets

| Metric | Target | Risk |
|--------|--------|------|
| LCP (Largest Contentful Paint) | < 2.5s | MEDIUM — client-side rendering may slow LCP. Mitigate with server components for marketing pages. |
| FID / INP (Interaction to Next Paint) | < 200ms | LOW — UI interactions are local state changes. |
| CLS (Cumulative Layout Shift) | < 0.1 | LOW — next/image used, explicit dimensions on most elements. Font swap may cause minor CLS. |
| TTFB (Time to First Byte) | < 800ms | LOW — Next.js on Vercel/edge typically < 100ms TTFB. |

---

## Recommendations Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P1 | Add `npm test` script + Jest setup | Low | Medium |
| P2 | Convert legal/marketing pages to server components | Medium | Medium |
| P2 | Lazy-load Recharts with `next/dynamic` | Low | High (bundle size) |
| P2 | Switch Google Fonts to `next/font/google` | Low | Medium (LCP) |
| P2 | Add `@next/bundle-analyzer` to analyze bundle | Low | High (diagnostics) |
| P3 | Split planning wizard into step components | High | Low (DX only) |
| P3 | Mobile card view for wide tables | High | Medium (mobile UX) |
