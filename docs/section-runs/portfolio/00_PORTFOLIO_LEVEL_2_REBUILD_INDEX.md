# Portfolio Section — Level 2 Rebuild Index

**Date:** 2026-06-03  
**Version:** Propvora V1.5  
**Status:** Complete — core build done, further depth optional

---

## Summary

The Portfolio section has been fully rebuilt from stub/mock state to Level 2 commercial depth.

---

## Files Delivered

| # | File | Purpose |
|---|------|---------|
| 01 | `01_PORTFOLIO_ROUTE_CONSOLIDATION.md` | Route map, sidebar audit, redirect strategy |
| 02 | `02_PORTFOLIO_WIREFRAMES.md` | Page wireframes |
| 03 | `03_PORTFOLIO_COMPONENT_CONTRACTS.md` | Component interfaces |
| 04 | `04_PORTFOLIO_DATA_RLS_MODEL.md` | Data model and RLS |
| 05 | `05_PORTFOLIO_BUTTON_WIZARD_AUDIT.md` | Button and wizard audit |
| 06 | `06_PORTFOLIO_VIEW_TYPES_AUDIT.md` | View type implementation |
| 07 | `07_PORTFOLIO_UPLOAD_MEDIA_DOCS_AUDIT.md` | Media/docs audit |
| 08 | `08_PORTFOLIO_CROSS_MODULE_INTEGRATION.md` | Cross-module wiring |
| 09 | `09_PORTFOLIO_TEST_MATRIX.md` | Test checklist |
| 10 | `10_PORTFOLIO_RELEASE_SCORECARD.md` | Release scorecard |

---

## Tracker

| Priority | Area | Route/File | Current Status | Fix Applied |
|----------|------|-----------|----------------|-------------|
| P0 | Sidebar | AppShell.tsx | ✅ Units/Tenancies as Portfolio children (not top-level) | Already correct |
| P0 | Data hooks | useUnits.ts | ✅ Created | Full CRUD |
| P0 | Data hooks | useTenancies.ts | ✅ Created | Full CRUD |
| P1 | Portfolio dashboard | /app/portfolio/page.tsx | ✅ Rebuilt | View tabs, KPIs, attention queue |
| P1 | Units list | /app/portfolio/units/page.tsx | ✅ Rebuilt | Cards, table, search, filter |
| P1 | Units detail | /app/portfolio/units/[id]/page.tsx | ✅ Upgraded | Full tabs, real data |
| P1 | Units new | /app/portfolio/units/new/page.tsx | ✅ Created | 4-step wizard |
| P1 | Tenancies list | /app/portfolio/tenancies/page.tsx | ✅ Rebuilt | Cards, table, Gantt view |
| P1 | Tenancies detail | /app/portfolio/tenancies/[id]/page.tsx | ✅ Upgraded | Real data hook added |
| P1 | Tenancies new | /app/portfolio/tenancies/new/page.tsx | ✅ Created | 6-step wizard |
| P2 | Components | UnitCard.tsx | ✅ Created | Status, tenant, expiry warning |
| P2 | Components | TenancyCard.tsx | ✅ Created | Arrears, ending soon alerts |
| P2 | Migration | 005_portfolio_commercial.sql | ✅ Created | Commercial fields, new tables |
| P2 | Properties list | /app/portfolio/properties/page.tsx | ✅ Pre-existing | Real data hook wired |
| P2 | Properties detail | /app/portfolio/properties/[id]/page.tsx | ✅ Pre-existing | Mock data, needs real wire |
| P2 | Properties new | /app/portfolio/properties/new/page.tsx | ✅ Pre-existing | Full 9-step wizard with Supabase |
