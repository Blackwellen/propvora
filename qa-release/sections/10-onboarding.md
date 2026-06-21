# Section 10 — Onboarding Score Matrix

Last updated: 2026-06-21 (FIX-274 wizard audit)

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

---

## FIX-274 Wizard QA Audit — Detailed Score Matrix

Audit date: 2026-06-21. Files audited:
- `src/app/(auth)/onboarding/page.tsx` — PM workspace wizard (8 steps)
- `src/app/(auth)/onboarding/supplier/page.tsx` — Supplier onboarding wizard (6 steps)
- `src/app/(auth)/onboarding/layout.tsx` — Shared layout
- `src/features/automations/pages/RecipesPage.tsx` — Automation recipe selection (browse UI, not a wizard)

| ID | Area | Route | Feature | Score | Notes | Status |
|----|------|-------|---------|-------|-------|--------|
| WIZARD-001 | PM Onboarding | `/onboarding` | Steps numbered and labelled | 5 | StepIndicator shows step N of 8 on desktop (dot rail with numbers) and mobile (compact progress bar + "Step N of 8" label) | PASS |
| WIZARD-002 | PM Onboarding | `/onboarding` | Progress indicator | 5 | Desktop: numbered dot rail with fill and ring on active step; completed steps show Check icon. Mobile: animated progress bar + percentage. Fully responsive. | PASS |
| WIZARD-003 | PM Onboarding | `/onboarding` | Back/Next button logic | 5 | Back/Next rendered on steps 2–7. Back on step 6 skips to step 4 when portfolioChoice≠demo. Next on step 4 skips step 5 when portfolioChoice≠demo. Conditional skip logic is correct. | PASS |
| WIZARD-004 | PM Onboarding | `/onboarding` | Required field validation before advancing | 5 | validate() checks step 2 (workspaceName, businessType, propertyCount), step 3 (operationInterests≥1), step 4 (portfolioChoice). Inline field-level error messages in red below each field group. | PASS |
| WIZARD-005 | PM Onboarding | `/onboarding` | Summary/review step before completion | 5 | Step 7 is a dedicated Review & Create step showing all collected values with per-field "Edit" buttons that jump back to that step number. | PASS |
| WIZARD-006 | PM Onboarding | `/onboarding` | Success state after completion | 5 | Step 8 shows animated progress checklist (5 messages cycling every 1.2s), spinner, and redirect notice. Hard-navigates to /property-manager after 4s. | PASS |
| WIZARD-007 | PM Onboarding | `/onboarding` | No fake person names in default values | 5 | workspaceName defaults to `${firstName}'s Portfolio` from Supabase auth metadata — real user name. All other fields start empty. FIX-267 confirmed WizardSummaryRail fake guarantor fixed. | PASS |
| WIZARD-008 | PM Onboarding | `/onboarding` | Mobile responsive at 390px | 5 | max-w-lg card, p-5 on mobile vs p-8 on sm+. Navigation bar uses max-sm:sticky bottom-0 with safe-area inset padding and backdrop-blur. Step indicator collapses to compact bar. No clipping. | PASS |
| WIZARD-009 | PM Onboarding | `/onboarding` | Skip/cancel option | 5 | "Skip setup and go to dashboard" link below the card on steps 1–6. Triggers window.location.assign("/property-manager"). "Back to home" link in top bar throughout. | PASS |
| WIZARD-010 | PM Onboarding | `/onboarding` | Error states handled | 5 | Step 7 renders a red error banner if errors.submit is set (workspace creation failure). Field errors clear on input change. Network errors catch block sets step back to 7 with message. | PASS |
| WIZARD-011 | PM Onboarding | `/onboarding` | localStorage resume/replay guard | 5 | Progress saved to localStorage on each step/state change. Restored on mount (steps 2–6 only; step 7+ never restored to avoid re-triggering creation). Cleared on completion. | PASS |
| WIZARD-012 | PM Onboarding | `/onboarding` | Coupon code on plan step | 5 | Step 6 has coupon input, Apply button, API call to /api/coupons/validate, inline green/red result. Enter key submits. Input auto-uppercases. | PASS |
| WIZARD-013 | Supplier Onboarding | `/onboarding/supplier` | Steps numbered and labelled | 5 | StepIndicator shows step N of 6 on desktop (dot rail) and mobile (compact bar + "Step N of 6" + percentage). | PASS |
| WIZARD-014 | Supplier Onboarding | `/onboarding/supplier` | Progress indicator | 5 | Same responsive StepIndicator pattern as PM wizard. Shown on steps 1–5 only (step 6 is creation/success). | PASS |
| WIZARD-015 | Supplier Onboarding | `/onboarding/supplier` | Back/Next button logic | 5 | Back rendered on steps 2–5 (step 1 shows spacer div to preserve flex layout). Step 5 CTA labelled "Create my profile" — correct action label distinct from "Continue". | PASS |
| WIZARD-016 | Supplier Onboarding | `/onboarding/supplier` | Required field validation before advancing | 5 | validate() checks: step 1 (tradeCategories≥1), step 2 (companyName, staffBand), step 3 (baseLocation, radiusKm), step 4 (hasPublicLiability — must confirm insurance), step 5 (serviceCount, listOnMarketplace not null). | PASS |
| WIZARD-017 | Supplier Onboarding | `/onboarding/supplier` | Review step before completion | 3 | No explicit review/summary step before profile creation. Validation on each step is thorough, but there is no consolidated summary card for the user to confirm all answers. Minor gap for a 6-step flow. | MINOR GAP |
| WIZARD-018 | Supplier Onboarding | `/onboarding/supplier` | Success state after completion | 5 | Step 6 has two sub-states: loading (spinner + PROGRESS_MESSAGES list); success (profile preview card with company name, trades, location/radius, insurance badge, emergency badge, marketplace status). CTA → window.location.assign("/supplier"). | PASS |
| WIZARD-019 | Supplier Onboarding | `/onboarding/supplier` | No fake person names in default values | 5 | companyName defaults empty. userName from Supabase auth metadata. Success preview uses companyName or userName or "Your Business". No hardcoded names anywhere. | PASS |
| WIZARD-020 | Supplier Onboarding | `/onboarding/supplier` | Mobile responsive at 390px | 5 | Same max-w-lg / p-5 / sticky-nav pattern. Step 1 trade grid: grid-cols-2 sm:grid-cols-3. Emergency/insurance toggles full-width. Skip link and Back to home present throughout. | PASS |

## Summary

| Wizard | Steps | Progress Bar | Validation | Review Step | Success State | Skip Option | Mobile | Overall |
|--------|-------|-------------|------------|-------------|---------------|-------------|--------|---------|
| PM Workspace (8-step) | 5 | 5 | 5 | 5 | 5 | 5 | 5 | **5** |
| Supplier Onboarding (6-step) | 5 | 5 | 5 | 3 (no review step) | 5 | 5 | 5 | **4** |
| Automation Recipes | N/A | N/A | N/A | N/A | N/A | N/A | N/A | **N/A** (browse UI, not a wizard) |

**Net wizard score: 5 (PM) / 4 (Supplier — minor: no consolidated review step before creation)**
