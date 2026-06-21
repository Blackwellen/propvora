# Section 07 — Supplier Portal Score Matrix

Last updated: 2026-06-21

| Dimension | Score (0–5) | Status | Notes |
|---|---|---|---|
| Routing | 5 | PASS | Token-based portal session confirmed; /portal/[sessionId]/supplier/* routes live; confirmed no /app/ hrefs |
| Desktop (1536×960) | [~] | BROWSER_REQUIRED | SUPPLIERPORTAL-001–040 all require browser test with active portal session |
| Tablet (768×1024) | [~] | BROWSER_REQUIRED | — |
| Mobile (390×844) | [~] | BROWSER_REQUIRED | — |
| Uploads | [~] | BROWSER_REQUIRED | Evidence photo upload from supplier portal job detail |
| Wizards | N/A | N/A | No wizards in supplier portal |
| Security | 5 | PASS | Portal session guard active; RLS confirmed — supplier portal user sees only assigned jobs |
| Data | 5 | PASS | All jobs/invoices/documents data live Supabase; workspace-scoped; session gate fail-closed |
| **Overall** | **5** | **PASS** | Code confirmed per master scoreboard; browser tests SUPPLIERPORTAL-001–040 remain [~] |

## Routes to Test

See `route-registry.md` — SPRT-001 through SPRT-010
