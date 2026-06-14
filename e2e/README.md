# Propvora E2E / Responsive QA

Playwright suite covering public-route loading + **no horizontal scroll** across
desktop / tablet / mobile viewports (see `playwright.config.ts` projects).

## Run
```bash
# 1. Start the app (one of):
npm run dev                 # dev
# or: npm run build && npm run start   # production build

# 2. (first time) install browsers
npx playwright install chromium

# 3. Run
npx playwright test                          # all viewports
npx playwright test --project=mobile-se      # one viewport
npx playwright test e2e/responsive-smoke.spec.ts
```
Override target: `E2E_BASE_URL=https://staging.propvora.com npx playwright test`.
Let Playwright start the app itself: `E2E_WEBSERVER=1 npx playwright test`.

## What's covered now
- `responsive-smoke.spec.ts` — every public route returns < 400 and has ≤ 2px
  horizontal overflow at 7 viewports (1920, 1366, iPad, iPad-mini, iPhone SE,
  iPhone 13, Pixel 5). No auth needed.

## Pending (needs seeded test accounts)
Authenticated flows require fixtures + a `storageState` per role. Add:
- `e2e/auth.setup.ts` — sign in each role (owner/manager/member/tenant/supplier/admin),
  save `storageState` per role. Reuse the accounts from `scripts/test/rls-isolation.mjs`
  (or a dedicated seed) so the data is scoped + disposable.
- `e2e/app-flows.spec.ts` — login → create record per major object → detail page →
  mobile sidebar open/close → bottom nav → settings save → billing page loads.
- `e2e/admin.spec.ts`, `e2e/portals.spec.ts` — per-role + cross-workspace isolation in
  the browser; AI bubble does not block submit/nav on mobile.

Reuse `expectNoHorizontalScroll()` in every authenticated spec.

## Related (already runnable, no browser)
- `node scripts/test/rls-isolation.mjs` — RLS + IDOR (20/20).
- `node scripts/test/billing-gates.mjs` — subscription gates (31/31).
- `node scripts/test/run-all.mjs` — both.
- `node scripts/audit-rls.mjs` / `node scripts/audit-queries.mjs` — coverage gates.
