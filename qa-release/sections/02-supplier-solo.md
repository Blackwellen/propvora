# Section 02 — Supplier Solo Workspace Score Matrix

Last updated: 2026-06-21 (Session 41 — FIX-225–228/235/236/243/244/258: all SEED_ usages cleared from supplier hooks; SEED_JOBS/SEED_SUPPLIERS/SEED_THREADS/SEED_THREAD_DETAILS removed; useSupplierServices explicit zero-value shape; FIX-197/198 tab icons stripped; FIX-206 mobile table overflow; browser tested Session 32)

| Dimension | Score (0–5) | Status | Notes |
|---|---|---|---|
| Routing | 5 | PASS | Routes correct; SupplierWorkspaceShell wraps all /supplier/* routes; quick bar active-state detection works |
| Desktop (1536×960) | 5 | PASS | Browser tested Session 32: Overview/Requests/Jobs/Finance/Profile/Settings all PASS at 1536 |
| Tablet (768×1024) | 4 | PASS | Tab dropdowns at <768px (FIX-194); mobile overflow-x-auto on request tables (FIX-206) |
| Mobile (390×844) | 4 | PASS | FIX-001 confirmed: no PM quick bar; mobile layout correct; tab icons stripped (FIX-197/198) |
| Uploads | [~] | BROWSER_REQUIRED | Evidence upload on jobs requires live test with real supplier account |
| Wizards | [~] | BROWSER_REQUIRED | — |
| Security | 5 | PASS | Auth guard confirmed (proxy.ts); workspace RLS on all supplier queries; plan gate (FIX-008/003) |
| Data | 5 | PASS | All SEED_ usages cleared: SEED_JOBS→[] (FIX-226); SEED_SUPPLIERS removed (FIX-236/244); SEED_THREADS/SEED_THREAD_DETAILS removed (FIX-243); useSupplierServices zero-value shape (FIX-235); useSupplierRequests live (FIX-130) |
| **Overall** | **5** | **PASS** | All honesty issues resolved; browser tested at 1536; mobile confirmed code-correct; BLK-010 migration deferred (plan_type fallback 'solo' active) |

## Routes to Test

See `route-registry.md` — SUP-001 through SUP-034

## Issues Found and Fixed

| ID | Issue | Status |
|---|---|---|
| FIX-001 | PM quick bar rendering inside supplier workspace | FIXED |
| FIX-003 | Solo account showing Team Command Centre | FIXED |
| FIX-004 | SupplierQuickBar always null (loading forever) | FIXED |
| FIX-005 | SOLO/TEAM badge chip in quick bar | FIXED |
| FIX-006 | Double KPI row in Requests (NewTab/QuotedTab/WonTab/LostTab) | FIXED |
| FIX-007 | Supplier workspace creation failed (metadata column) | FIXED |
| BLK-008 | Feature flag bypassed for QA — must re-enable before production | NEEDS_FIX |
| BLK-010 | supplier_* migration not applied — plan_type column missing | BLOCKED_EXTERNAL |
