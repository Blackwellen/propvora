# Propvora — Test Results
Generated: 2026-06-03

## Summary

| Check | Status | Details |
|-------|--------|---------|
| TypeScript (`npx tsc --noEmit`) | REQUIRES MANUAL RUN | See notes below |
| ESLint (`npm run lint`) | REQUIRES MANUAL RUN | See notes below |
| Production build (`npm run build`) | REQUIRES MANUAL RUN | See notes below |
| Smoke tests | NOT YET WIRED | No test runner configured |

---

## TypeScript

**Script:** `npm run typecheck` (added to package.json in this run)

**Pre-run static findings fixed:**
- `src/app/(auth)/login/page.tsx` — `useSearchParams()` used without Suspense boundary. Fixed by extracting `LoginForm` component and wrapping in `<Suspense>` in the exported `LoginPage`.

**Known-clean files (validated by static analysis):**
- All layout files use correct shells (AppShell / AuthShell / AdminShell / SupplierShell / AffiliateShell)
- No `window`/`localStorage` access found outside `"use client"` components
- No unguarded `useSearchParams()` calls after login page fix
- `src/app/(app)/app/planning/sets/new/page.tsx` — already wrapped in Suspense
- No `as any` or `: any` escape hatches found in the codebase

**To verify:** Run `npm run typecheck` from the project root. Prior to second-run agent changes the count was 0 errors.

---

## ESLint

**Script:** `npm run lint`

**Static observations:**
- ESLint config is `eslint-config-next` (Next.js default rules)
- No obvious lint violations found during static analysis
- React JSX key props are present on all mapped elements reviewed

**To verify:** Run `npm run lint` from the project root.

---

## Production Build

**Script:** `npm run build`

**Route inventory (static count):**

| Group | Count |
|-------|-------|
| Public / marketing | 9 (page, features, pricing, legal/*, legal page) |
| Auth | 6 (login, register, forgot-password, reset-password, verify-2fa, onboarding) |
| App (main workspace) | 38 |
| Admin | 16 |
| Supplier portal | 6 |
| Affiliate area | 6 |
| API routes | 6 (auth/callback, ai/chat, ai/actions, demo/seed, demo/reset, webhooks/stripe) |
| **Total page routes** | **81** |

**To verify:** Run `npm run build` and confirm 80+ pages compile successfully.

---

## Smoke Tests

**File:** `src/__tests__/smoke.test.ts`

**Status:** Written and ready. No test runner configured in package.json yet.

**To enable tests, add to package.json devDependencies:**
```json
"jest": "^29",
"ts-jest": "^29",
"@types/jest": "^29"
```

**And add to package.json scripts:**
```json
"test": "jest"
```

**And create `jest.config.ts`:**
```ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default config
```

**Test cases written:**
1. `.env.example` file exists
2. `calculatePlanningSet` is exported as a function
3. `calculatePlanningSet` returns correct structure with `grossMonthlyIncome`, `netMonthlyIncome`, `riskScore`, `totalUpfrontCash`, `monthlyProjection`
4. `riskScore` is a number between 0 and 100

---

## P0 Issues Found During QA Pass

1. **login/page.tsx — missing Suspense around useSearchParams** — FIXED in this run
   - File: `src/app/(auth)/login/page.tsx`
   - Fix: Extracted `LoginForm` inner component, exported `LoginPage` wraps it in `<Suspense fallback={null}>`

## P1 Issues Found

None identified via static analysis.

## Notes

- Command execution (tsc, eslint, next build) was not available in this environment. Results marked "REQUIRES MANUAL RUN" should be executed by the developer before final release.
- Static analysis covered: layout shells, window/localStorage usage, useSearchParams usage, TypeScript any escapes, route inventory.
