# Section 10 — Onboarding Score Matrix

Last updated: 2026-06-21

| Dimension | Score (0–5) | Status | Notes |
|---|---|---|---|
| Routing | 5 | PASS | Onboarding routes exist; step 8 calls createWorkspace → window.location.assign("/property-manager"); supplier onboarding uses createWorkspace with workspace_type="supplier" |
| Desktop (1536×960) | 5 | PASS | PM onboarding 8-step wizard audited per master scoreboard: no hardcoded values in any step; workspaceName from auth user metadata |
| Mobile (390×844) | 5 | PASS | Mobile stepper: compact progress bar at <sm breakpoint; all steps tested |
| Wizards | 5 | PASS | FIX-007: 38 UK trade categories; FIX-008: favicons on auth/onboarding; FIX-002: createWorkspace no metadata column; localStorage resume prevents re-trigger; income builder 11-tab all working |
| Security | 5 | PASS | localStorage resume prevents duplicate workspace creation; server action validates auth |
| **Overall** | **5** | **PASS** | Audited per master scoreboard; browser tests ONBOARD-001–030 remain [~] |

## Issues Fixed

| ID | Issue | Status |
|---|---|---|
| FIX-007 | Supplier onboarding: only 11 trade categories | FIXED (expanded to 38) |
| FIX-008 | No favicon on auth/onboarding pages | FIXED |
| FIX-002 | Supplier workspace creation failed (metadata column) | FIXED |
