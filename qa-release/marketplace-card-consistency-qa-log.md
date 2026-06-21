# Marketplace Card Consistency QA Log

All marketplace cards must be visually consistent, use shared brand tokens, and behave identically across viewports.
Reference primitive: `StayCard` (public-marketplace canonical) — all other cards must align to this standard.

Scoring: 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=not tested | N/A=not applicable

Status values: PENDING | IN PROGRESS | PASS | FAIL | BLOCKED

Section file: `/qa-release/sections/20-marketplace-card-consistency.md`

---

## Card Consistency Matrix

| ID | Card Type | Component Name | Route / Location | Feature Flag | Image Works? | Title Works? | Price Works? | Rating Works? | CTA Works? | Hover Works? | Loading State | Empty State | Desktop Layout | Phone Layout | Brand Token Linked? | Score | Status |
|----|-----------|----------------|------------------|--------------|--------------|--------------|--------------|---------------|------------|--------------|---------------|-------------|----------------|--------------|---------------------|-------|--------|
| MCARD-001 | Stay card | StayCard | /marketplace/stays, /customer/stays | marketplaceStays | ✅ 3:2 ratio | ✅ truncate | ✅ formatPence | ✅ star+count | ✅ Link wrapper | ✅ image scale | ✅ parent skeleton | [~] | ✅ | ✅ | ✅ | 5 | PASS (FIX-121) — Airbnb-style redesign: 3:2 full-bleed image, heart top-right with toggle, status chips, Verified badge, location+rating row, price/night |
| MCARD-002 | Service card | ServiceOfferCard | /marketplace/services, /supplier/services | marketplaceSuppliers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | - | 4 | EXISTING (FIX-019) — horizontal layout with image left + details right; blue border featured variant |
| MCARD-003 | Supplier card | ProviderCard | /marketplace/suppliers, /property-manager/suppliers-hub | marketplaceSuppliers | ✅ avatar 56px | ✅ | ✅ fromPrice | ✅ star inline | ✅ Contact btn | ✅ hover:shadow-md | - | [~] | ✅ | ✅ | ✅ | 5 | PASS (FIX-122) — Upwork/Airtasker-style: 56px avatar, bio snippet, trust badges (Vetted/Insured/24h), response time amber icon, price + blue Contact CTA |
| MCARD-004 | Emergency provider card | EmergencyServiceCard | /services?emergency (filter) | marketplaceEmergency | ✅ 112px side img | ✅ | ✅ baseCalloutPrice | N/A | ✅ phone+request | ✅ hover:shadow-md | - | [~] | ✅ | ✅ | ✅ | 5 | PASS (FIX-123) — Red accent: red-600 header strip, "Available Now" badge, bold red response time, phone CTA visible, bg-red-50 background. NOTE: /emergency route deleted; emergency is now a filter on /services |
| MCARD-005 | Plan card | PlanCard | /pricing, /plans, plan selection modal | None | N/A | No | No | N/A | No | No | No | No | 0 | 0 | No | 0 | PENDING |
| MCARD-006 | Listing card (PM workspace) | ListingCard / PropertyCard | /property-manager/portfolio, /property-manager/properties | None | No | No | No | N/A | No | No | No | No | 0 | 0 | No | 0 | PENDING |
| MCARD-007 | Dashboard preview card | DashboardPreviewCard / KpiCard | /property-manager, /supplier, /customer dashboards | None | N/A | No | No | N/A | No | No | No | No | 0 | 0 | No | 0 | PENDING |

---

## Column Definitions

- **Image Works?** — Card image renders at the correct aspect ratio, has an alt attribute, uses Next.js `<Image>` optimisation, and shows a skeleton/placeholder when loading.
- **Title Works?** — Title text is truncated correctly at all viewport sizes, does not overflow or clip.
- **Price Works?** — Price / rate is displayed in the correct currency format with the correct locale. Blank / 0 prices do not show "£0" unexpectedly.
- **Rating Works?** — Star rating / score badge renders with correct value; hidden gracefully when no rating exists.
- **CTA Works?** — Primary action button or link is visible, labelled correctly, and routes to the right destination.
- **Hover Works?** — Card has a visible hover state (shadow, border, or scale animation) on desktop. No hover artefacts on touch devices.
- **Loading State** — Skeleton card replaces real card while data is fetching. Skeleton matches card dimensions.
- **Empty State** — When the card collection is empty, an appropriate empty-state message and action are shown (not a blank area).
- **Desktop Layout** — Card renders correctly at 1536×960 and 1366×768, correct column grid, no overflow.
- **Phone Layout** — Card renders correctly at 390×844 and 375×812, full-width, touch-friendly CTA, no text overflow.
- **Brand Token Linked?** — Colours, border-radius, shadow, and typography use CSS custom properties / Tailwind tokens from the design system (not hardcoded values).

---

## Cross-Card Consistency Checks

The following must be identical across all card types (unless functionally justified):

| Property | Expected Standard | Notes |
|----------|------------------|-------|
| Image aspect ratio | 16:9 or 3:2 (consistent per card type) | Stays = 3:2, Suppliers = 1:1 avatar |
| Card border-radius | Same token across all cards | Check `var(--radius-card)` or Tailwind class |
| Shadow on hover | Same shadow token | Check `var(--shadow-card-hover)` |
| Title font size | Same heading level (h3 or equivalent) | No card should use h1 or h2 |
| CTA button variant | Same button primitive | Must use shared Button component |
| Loading skeleton | Same SkeletonCard primitive | No bespoke skeletons per card |
| Padding / gap | Same internal spacing scale | Check 4px grid alignment |

---

## Customer ↔ Marketplace Card Alignment

`StayCard` used in `/customer/stays` must be the same component as `/marketplace/stays`. If separate implementations exist, they must be merged or one aliased to the other.

Alignment status: NOT VERIFIED (Score 0, PENDING)

---

---

## ServiceCard Unified Review (2026-06-21)

### Session FIX-145 to FIX-149 — Unified ServiceCard + Emergency-as-filter audit

**ServiceCard (`src/components/public-marketplace/cards/ServiceCard.tsx`)**

Verified against full spec:
- 16:9 hero image (aspect-[16/9], overflow-hidden, gradient overlay) ✅
- Trade badge top-left: bg-white/90 rounded-full shadow-sm ✅
- Emergency chip top-right of image: `bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full` with ⚡ Zap icon ✅
- Heart save button top-right: aria-label, bg-white/90 rounded-full, focus-visible ring ✅
- Provider avatar overlapping bottom-left: `absolute -bottom-5 left-4 w-10 h-10 rounded-full border-2 border-white` (effectively -translate-y-1/2 relative to bottom of image) ✅
- Provider name + rating inline row below avatar clearance ✅
- Service title (bold font-bold, group-hover:text-blue-700, line-clamp-2) ✅
- Location + response time meta row (MapPin + Clock icons) ✅
- Trust badges (Vetted/Insured) ✅
- Divider hr.border-slate-100 ✅
- Footer: From price + dual CTA (Call tel: for emergency, Contact/Request now link) ✅
- Emergency: border-red-200, red price text (text-red-600), red Call button (bg-red-600), "Request now" label ✅
- basePath default corrected: '/services' (was '/marketplace/services') — FIX-145 ✅
- WCAG AA: all images have alt, all interactive elements have aria-label, focus-visible rings ✅
- No dark: classes ✅
- Min-width 260px ✅

**Score: 5/5**

**Emergency filter on /services (`src/app/services/ServicesFilterClient.tsx`)**

- Emergency chip present in CHIPS array: `{ label: 'Emergency', value: 'emergency', red: true }` ✅
- Rendered with ⚡ Zap icon, red border/text styling ✅
- Filter logic: `if (active.has('emergency')) result = result.filter(o => o.urgent)` ✅
- /emergency route directory confirmed absent ✅

**Score: 5/5**

**ProviderCard banner (`src/components/public-marketplace/cards/ProviderCard.tsx`)**

- `bannerImage?: string` prop ✅
- 160px banner: `relative h-[160px] bg-slate-100 overflow-hidden` ✅
- Next.js Image fill + object-cover when bannerSrc available ✅
- Gradient fallback: `bg-gradient-to-br from-slate-500 to-slate-700` when no image ✅
- Gradient scrim overlay (from-black/25) for legibility ✅
- Provider avatar: `absolute -bottom-7 left-4 h-14 w-14 rounded-full border-2 border-white shadow-md` ✅
- pt-10 content area clearing overlapping avatar ✅
- Heart button top-right of banner with aria-label ✅

**Score: 5/5**

**Seed data images**

All SEED_SERVICE_OFFERS and SEED_PROVIDERS use Unsplash trade-matched URLs as specified:
- Cleaning: photo-1581578731548-c64695cc6952 ✅
- Plumbing: photo-1558618666-fcd25c85cd64 ✅
- Electrical: photo-1621905251189-08b45d6a269e ✅
- Gardening: photo-1416879595882-3373a0480b5b ✅
- Handyman: photo-1585771724684-38269d6639fd ✅
- Locksmith/Emergency: photo-1558618047-3c8c76ca6e5b ✅
- next.config.ts images.remotePatterns includes images.unsplash.com ✅
- CSP img-src already permits https://images.unsplash.com ✅

_Last updated: 2026-06-21 (Session — Unified ServiceCard + emergency-as-filter audit FIX-145 to FIX-149)_
