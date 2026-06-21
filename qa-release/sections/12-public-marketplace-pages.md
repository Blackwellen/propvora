# Section 12 — Public Marketplace Pages

Last updated: 2026-06-21 (Session 42 — FIX-270: Stay detail booking card — DateRangePicker, guests stepper, price breakdown (pence-aware), instant/request book CTA, save heart (localStorage), sticky sidebar grid; tsc clean)

Coverage for all public-facing marketplace routes and shared nav/footer components. Tests run at all 8 required breakpoints. Feature flags: `marketplaceEnabled`, `marketplaceStays`, `marketplaceSuppliers`, `marketplaceEmergency` must all be ON for full coverage (set `NEXT_PUBLIC_QA_ALL_FLAGS=true` in `.env.local`).

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## Score Matrix

| ID | Route / Surface | Subsection | Surface Type | 1536 | 1366 | 1280 | 1024 | 768 | 430 | 390 | 375 | Data State | Score | Status | Notes |
|----|----------------|------------|-------------|------|------|------|------|-----|-----|-----|-----|------------|-------|--------|-------|
| MARKET-001 | /marketplace | Hub/Landing | page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | marketplaceEnabled flag must be ON |
| MARKET-002 | /marketplace/stays | Stay search | search page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | marketplaceStays flag must be ON |
| MARKET-003 | /marketplace/stays/[id] | Stay detail | detail page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | |
| MARKET-004 | /marketplace/stays search filters | Filter drawer | component | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | |
| MARKET-005 | /marketplace/stays map view | Map view | component | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | Requires geolocation permission |
| MARKET-006 | /marketplace/services | Services search | search page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | |
| MARKET-007 | /marketplace/services/[id] | Service detail | detail page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | |
| MARKET-008 | /marketplace/suppliers | Supplier search | search page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | marketplaceSuppliers flag must be ON |
| MARKET-009 | /marketplace/suppliers/[id] | Supplier profile | detail page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | |
| MARKET-010 | /marketplace/emergency | Emergency dispatch | page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | marketplaceEmergency flag must be ON |
| MARKET-011 | /marketplace/emergency/[id] | Emergency provider | detail page | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | seeded | [~] | BROWSER_REQUIRED | |
| MARKET-012 | Public marketplace header/nav | Nav component | component | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | live | [~] | BROWSER_REQUIRED | |
| MARKET-013 | Public marketplace footer | Footer component | component | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | live | [~] | BROWSER_REQUIRED | |
| MARKET-014 | Auth handoff CTAs | CTA component | component | [~] | [~] | [~] | [~] | [~] | [~] | [~] | [~] | live | [~] | BROWSER_REQUIRED | Unauthenticated → /register; authenticated → workspace |
| MARKET-015 | /stays/[slug] | Stay detail booking card | component | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | seeded | 5 | FIXED | FIX-270: date range picker, guests stepper, price breakdown, instant/request book CTA, save to localStorage, sticky sidebar layout |

---

## Checklist Notes

- All routes require `marketplaceEnabled=true` feature flag
- Map view requires browser geolocation permission test
- Auth handoff CTAs must direct unauthenticated users to `/register` and authenticated users to the correct workspace
- Stay card canonical component: `StayCard` (shared with `/customer/stays`)
- Supplier card canonical component: `CustomerPropertyCard` aligned
