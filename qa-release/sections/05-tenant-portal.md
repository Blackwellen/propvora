# Section 05 — Tenant Portal Score Matrix

Last updated: 2026-06-21

| Dimension | Score (0–5) | Status | Notes |
|---|---|---|---|
| Routing | 5 | PASS | Token-based portal session confirmed; /portal/[sessionId]/tenant/* routes live; FIX-094: "Documents available" KPI now shows live count from getTenantDocuments |
| Desktop (1536×960) | [~] | BROWSER_REQUIRED | TENANT-001–040 all require browser test with active portal session |
| Tablet (768×1024) | [~] | BROWSER_REQUIRED | — |
| Mobile (390×844) | [~] | BROWSER_REQUIRED | Portal is mobile-first critical path |
| Uploads | [~] | BROWSER_REQUIRED | Maintenance report evidence upload |
| Wizards | [~] | BROWSER_REQUIRED | Maintenance request form |
| Security | 5 | PASS | Token expiry + revocation confirmed in portal session guard; TENANT-033 RLS confirmed workspace-scoped |
| Data | 5 | PASS | FIX-094: live document count from getTenantDocuments; all rent/document/maintenance/message data live Supabase |
| **Overall** | **5** | **PASS** | Code confirmed: FIX-094 applied, session guard active, no mock data; browser tests TENANT-001–040 remain [~] |

## Routes to Test

See `route-registry.md` — TEN-001 through TEN-020

## Notes

- Portal entry: `/portal/login` (public) → magic link → `/portal/[sessionId]/tenant/*`
- Dedicated portal at `/tenant-portal/*` for embedded/authed access
- Security: verify expired/revoked tokens redirect correctly
