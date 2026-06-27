# Release Evidence — Auth & Onboarding + Public Legal/Policy
**Audit date:** 2026-06-27 · **Auditor:** Claude Code (session-fullaudit) · code-level (live QA pending dev-lock)

## Auth & Onboarding — code-complete / clean
- All flows REAL Supabase Auth: login `signInWithPassword`, register `signUp`+email-verify, reset `resetPasswordForEmail`→`updateUser`, 2FA TOTP `mfa.challenge/verify` (AAL2), Google `signInWithOAuth`, callback `exchangeCodeForSession` (intent-routed + legal-acceptance logged).
- **Proxy nav gotcha handled:** login/register/reset/onboarding/admin use `window.location.assign` (hard nav) not router.push → no proxy bounce loop (confirms reference-auth-nav).
- **Persona switch** (Customer/PM/Supplier, single email multi-membership, localStorage smart default) works; confirms project-auth-personas.
- **Onboarding** (8-step PM, 6-step supplier) creates real workspace + membership via `createWorkspace()`; localStorage resume; demo/manual; coupon validate. CSV import honestly "not in setup" (not a dead control).
- **Admin login** `/bw-console-x9f3` gates on platform_role=admin (signs out non-admins).
- **proxy.ts secure:** protected prefixes, allow-listed `redirectTo` (no open redirect, no `//`), per-IP/user rate limits (auth 10/min), maintenance-mode admin bypass.
- A11y: aria-labels, htmlFor, OTP role=group, focus rings, password-strength meter (Zod-backed). Error states real (Supabase codes). No mock/Math.random/dark:.

## Public Legal/Policy — code-complete / clean
- Pages under `src/app/legal/*`: terms, privacy, cookies, data-processing (DPA), acceptable-use, refund-policy, cancellation, affiliate-terms, booking/guest/host terms. All REAL content (no lorem/TODO), last-updated 16 Jun 2026, SEO metadata + responsive LegalLayout.
- Legal entity correct everywhere: Blackwellen Ltd (Co 16482166), ICO ZC160806, reg office — sourced from `src/lib/legal/company.ts` (Companies-House-verified). Confirms reference-legal-entity.
- GDPR: privacy lawful-basis + sub-processor table; DPA = Art.28 processor terms; cookies policy names cookies + wired to CookieConsent (localStorage consent).

**Decision:** Both **code-complete / clean** (code-level; live QA pending dev-lock).
