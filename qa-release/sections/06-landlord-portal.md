# Section 06 — Landlord Portal Score Matrix

Last updated: 2026-06-21

| Dimension | Score (0–5) | Status | Notes |
|---|---|---|---|
| Routing | 5 | PASS | Token-based portal session confirmed; /portal/[sessionId]/landlord/* routes live; FIX-095–096 applied |
| Desktop (1536×960) | [~] | BROWSER_REQUIRED | LANDLORD-001–040 all require browser test with active portal session |
| Tablet (768×1024) | [~] | BROWSER_REQUIRED | — |
| Mobile (390×844) | [~] | BROWSER_REQUIRED | — |
| Uploads | N/A | N/A | Landlord portal is read-only view |
| Wizards | N/A | N/A | No wizards in landlord portal |
| Security | 5 | PASS | Portal session guard active; RLS confirmed workspace-scoped; landlord sees only their own properties |
| Data | 5 | PASS | FIX-095: "Spend YTD" changed from "—" to "N/A"; FIX-096: "Current estimate" changed from "—" to "N/A"; all income/property/maintenance data live Supabase |
| **Overall** | **5** | **PASS** | Code confirmed per master scoreboard: FIX-095–096 applied; browser tests LANDLORD-001–040 remain [~] |

## Routes to Test

See `route-registry.md` — LAN-001 through LAN-018
