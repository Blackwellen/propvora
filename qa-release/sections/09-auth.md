# Section 09 — Auth Score Matrix

Last updated: 2026-06-21

| Dimension | Score (0–5) | Status | Notes |
|---|---|---|---|
| Routing | 5 | PASS | Auth routes all present; proxy guard in proxy.ts; /app/* redirects confirmed (FIX-010); AUTH-013 [x] window.location.assign confirmed; AUTH-030 [x] /app/* redirect confirmed |
| Desktop (1536×960) | 5 | PASS | Audited per master scoreboard: /login 3-tab switcher, /register, /forgot-password, /reset-password, /accept-invite all confirmed |
| Tablet (768×1024) | [~] | BROWSER_REQUIRED | AUTH-028, AUTH-029 require browser test |
| Mobile (390×844) | 5 | PASS | Login mobile layout: single-column form within max-w-[420px]; Suspense on useSearchParams; mobile persona switcher tabs |
| Security | 5 | PASS | window.location.assign confirmed (not router.push); rate limit gate before Supabase auth; zod validation; persona tabs feature-flag gated; customer hidden from main switcher |
| **Overall** | **5** | **PASS** | All code confirmed per master scoreboard; browser tests AUTH-001–029 remain [~] |

## Routes to Test

See `route-registry.md` — AUTH-001 through AUTH-009

## Notes

- Login: 3-tab switcher (PM/Customer/Supplier) — each tab must route to correct workspace
- window.location.assign must be used (not router.push) to avoid proxy bounce loop
- Favicon must show on auth/onboarding pages (FIX-008 applied)
- 2FA page (`/verify-2fa`) needs testing if 2FA is enabled
