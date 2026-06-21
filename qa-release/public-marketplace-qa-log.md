# Public Marketplace QA Log

All marketplace routes are gated behind the `marketplaceEnabled` feature flag.
QA environment: `NEXT_PUBLIC_QA_ALL_FLAGS=true` must be set before testing.

Scoring: 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=not tested | N/A=not applicable

Status values: PENDING | IN PROGRESS | PASS | FAIL | BLOCKED

Section file: `/qa-release/sections/12-public-marketplace-pages.md`

---

## Route QA Matrix

| ID | Route / Surface | Public Page Type | Feature Flag | Search Works? | Filters Work? | Map Works? | Cards Work? | CTA Works? | Detail Link Works? | Auth Handoff Works? | SEO Checked? | Desktop Score | Tablet Score | Phone Score | Design Score | Fix Required | Status |
|----|-----------------|------------------|--------------|---------------|---------------|------------|-------------|------------|-------------------|---------------------|--------------|---------------|--------------|-------------|--------------|--------------|--------|
| MKT-001 | /marketplace | Hub / Landing | marketplaceEnabled | — | — | — | — | — | — | — | No | 0 | 0 | 0 | 0 | — | PENDING |
| MKT-002 | /marketplace/stays | Stays search listing | marketplaceEnabled, marketplaceStays | No | No | No | No | No | No | No | No | 0 | 0 | 0 | 0 | — | PENDING |
| MKT-003 | /marketplace/stays/[id] | Stay detail page | marketplaceEnabled, marketplaceStays | N/A | N/A | No | No | No | N/A | No | No | 0 | 0 | 0 | 0 | — | PENDING |
| MKT-004 | /marketplace/services | Services search listing | marketplaceEnabled, marketplaceSuppliers | No | No | No | No | No | No | No | No | 0 | 0 | 0 | 0 | — | PENDING |
| MKT-005 | /marketplace/services/[id] | Service detail page | marketplaceEnabled, marketplaceSuppliers | N/A | N/A | No | No | No | N/A | No | No | 0 | 0 | 0 | 0 | — | PENDING |
| MKT-006 | /marketplace/suppliers | Supplier search listing | marketplaceEnabled, marketplaceSuppliers | No | No | No | No | No | No | No | No | 0 | 0 | 0 | 0 | — | PENDING |
| MKT-007 | /marketplace/suppliers/[id] | Supplier public profile | marketplaceEnabled, marketplaceSuppliers | N/A | N/A | No | No | No | N/A | No | No | 0 | 0 | 0 | 0 | — | PENDING |
| MKT-008 | /marketplace/emergency | Emergency provider search | marketplaceEnabled, marketplaceEmergency | No | No | No | No | No | No | No | No | 0 | 0 | 0 | 0 | — | PENDING |
| MKT-009 | /marketplace/emergency/[id] | Emergency provider detail | marketplaceEnabled, marketplaceEmergency | N/A | N/A | No | No | No | N/A | No | No | 0 | 0 | 0 | 0 | — | PENDING |

---

## Column Definitions

- **Search Works?** — Keyword / location search field returns relevant results without errors.
- **Filters Work?** — All filter controls (price, type, availability, radius, etc.) narrow results correctly.
- **Map Works?** — Map view renders pins/clusters, clicking a pin shows a card or navigates to detail.
- **Cards Works?** — All listing cards render with image, title, price/rating and are clickable.
- **CTA Works?** — Primary CTA button (Book, Enquire, View, Request) is visible and routes correctly.
- **Detail Link Works?** — Detail page loads with full data from the listing card.
- **Auth Handoff Works?** — Unauthenticated user prompted to log in before completing a booking/enquiry action; returns to the correct route after auth.
- **SEO Checked?** — Page has correct `<title>`, `<meta name="description">`, Open Graph tags and canonical URL.
- **Desktop Score** — QA score at 1536×960 and 1366×768.
- **Tablet Score** — QA score at 1024×768 and 768×1024.
- **Phone Score** — QA score at 430×932, 390×844, and 375×812.
- **Design Score** — Brand token usage, typography, spacing, card consistency vs shared primitives.

---

## Auth Handoff Flow

For authenticated-only actions (booking, enquiry, save/wishlist):
1. Unauthenticated user clicks CTA.
2. Redirect to `/login?returnTo=/marketplace/...`.
3. After login, user is returned to the original route with their action preserved where possible.
4. Verify the `returnTo` parameter is honoured and no proxy bounce occurs.
5. Verify `window.location.assign` is used (not `router.push`) on login to avoid proxy bounce loop.

---

## SEO Checklist (per route)

- [ ] `<title>` is unique and descriptive
- [ ] `<meta name="description">` present and under 160 characters
- [ ] Open Graph `og:title`, `og:description`, `og:image` set
- [ ] Canonical `<link rel="canonical">` set
- [ ] Structured data (JSON-LD) for listings where applicable
- [ ] robots.txt allows indexing
- [ ] sitemap.xml includes marketplace routes

---

_Last updated: 2026-06-20_
