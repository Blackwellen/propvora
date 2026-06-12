# Propvora Route Wiring Matrix

> Phase 1+2 scaffold. Status: **STUB** = page.tsx exists, no real UI yet.

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Built & styled |
| 🔧 | Stub — needs implementation |
| 🔒 | Auth-guarded (middleware) |
| 👁 | Public |

---

## Public Routes

| Route | File | Shell | Guard | Status |
|-------|------|-------|-------|--------|
| `/` | `src/app/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/features` | `src/app/features/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/pricing` | `src/app/pricing/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/legal` | `src/app/legal/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/legal/terms` | `src/app/legal/terms/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/legal/privacy` | `src/app/legal/privacy/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/legal/cookies` | `src/app/legal/cookies/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/legal/acceptable-use` | `src/app/legal/acceptable-use/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/legal/data-processing` | `src/app/legal/data-processing/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/legal/affiliate-terms` | `src/app/legal/affiliate-terms/page.tsx` | None | 👁 Public | 🔧 Stub |
| `/legal/ai-disclaimer` | `src/app/legal/ai-disclaimer/page.tsx` | None | 👁 Public | 🔧 Stub |

---

## Auth Routes — group `(auth)`

Shell: `AuthShell` · Layout: `src/app/(auth)/layout.tsx`

| Route | File | Guard | Status |
|-------|------|-------|--------|
| `/login` | `(auth)/login/page.tsx` | 👁 Public (redirect if authed) | 🔧 Stub |
| `/register` | `(auth)/register/page.tsx` | 👁 Public (redirect if authed) | 🔧 Stub |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | 👁 Public | 🔧 Stub |
| `/reset-password` | `(auth)/reset-password/page.tsx` | 👁 Public | 🔧 Stub |
| `/verify-2fa` | `(auth)/verify-2fa/page.tsx` | 👁 Public | 🔧 Stub |
| `/onboarding` | `(auth)/onboarding/page.tsx` | 🔒 Auth | 🔧 Stub |

---

## App Routes — group `(app)`

Shell: `AppShell` · Layout: `src/app/(app)/layout.tsx`

| Route | File | Guard | Status |
|-------|------|-------|--------|
| `/app` | `(app)/app/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/portfolio` | `(app)/app/portfolio/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/portfolio/properties` | `(app)/app/portfolio/properties/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/portfolio/properties/new` | `(app)/app/portfolio/properties/new/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/portfolio/properties/[id]` | `(app)/app/portfolio/properties/[id]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/portfolio/units` | `(app)/app/portfolio/units/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/portfolio/units/[id]` | `(app)/app/portfolio/units/[id]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/portfolio/tenancies` | `(app)/app/portfolio/tenancies/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/portfolio/tenancies/[id]` | `(app)/app/portfolio/tenancies/[id]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/work` | `(app)/app/work/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/work/tasks` | `(app)/app/work/tasks/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/work/tasks/new` | `(app)/app/work/tasks/new/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/work/tasks/[id]` | `(app)/app/work/tasks/[id]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/work/jobs` | `(app)/app/work/jobs/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/work/jobs/new` | `(app)/app/work/jobs/new/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/work/jobs/[id]` | `(app)/app/work/jobs/[id]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/planning` | `(app)/app/planning/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/planning/profiles` | `(app)/app/planning/profiles/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/planning/profiles/[profileKey]` | `(app)/app/planning/profiles/[profileKey]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/planning/sets` | `(app)/app/planning/sets/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/planning/sets/new` | `(app)/app/planning/sets/new/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/planning/sets/[id]` | `(app)/app/planning/sets/[id]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/planning/landlord-offers` | `(app)/app/planning/landlord-offers/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/contacts` | `(app)/app/contacts/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/contacts/new` | `(app)/app/contacts/new/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/contacts/[id]` | `(app)/app/contacts/[id]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/money` | `(app)/app/money/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/money/income` | `(app)/app/money/income/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/money/expenses` | `(app)/app/money/expenses/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/money/invoices` | `(app)/app/money/invoices/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/money/bills` | `(app)/app/money/bills/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/money/arrears` | `(app)/app/money/arrears/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/money/reconcile` | `(app)/app/money/reconcile/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/calendar` | `(app)/app/calendar/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/account-settings` | `(app)/app/account-settings/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/app/workspace-settings` | `(app)/app/workspace-settings/page.tsx` | 🔒 Auth | 🔧 Stub |

---

## Supplier Portal — group `(supplier)`

Shell: `SupplierShell` · Layout: `src/app/(supplier)/layout.tsx`

| Route | File | Guard | Status |
|-------|------|-------|--------|
| `/supplier-portal` | `(supplier)/supplier-portal/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/supplier-portal/jobs` | `(supplier)/supplier-portal/jobs/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/supplier-portal/jobs/[id]` | `(supplier)/supplier-portal/jobs/[id]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/supplier-portal/invoices` | `(supplier)/supplier-portal/invoices/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/supplier-portal/invoices/[id]` | `(supplier)/supplier-portal/invoices/[id]/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/supplier-portal/settings` | `(supplier)/supplier-portal/settings/page.tsx` | 🔒 Auth | 🔧 Stub |

---

## Affiliate Programme — group `(affiliate)`

Shell: `AffiliateShell` · Layout: `src/app/(affiliate)/layout.tsx`

| Route | File | Guard | Status |
|-------|------|-------|--------|
| `/affiliate` | `(affiliate)/affiliate/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/affiliate/signup` | `(affiliate)/affiliate/signup/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/affiliate/links` | `(affiliate)/affiliate/links/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/affiliate/referrals` | `(affiliate)/affiliate/referrals/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/affiliate/earnings` | `(affiliate)/affiliate/earnings/page.tsx` | 🔒 Auth | 🔧 Stub |
| `/affiliate/settings` | `(affiliate)/affiliate/settings/page.tsx` | 🔒 Auth | 🔧 Stub |

---

## Admin Console — group `(admin)`

Shell: `AdminShell` · Layout: `src/app/(admin)/layout.tsx`

| Route | File | Guard | Status |
|-------|------|-------|--------|
| `/admin` | `(admin)/admin/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/users` | `(admin)/admin/users/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/users/[id]` | `(admin)/admin/users/[id]/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/workspaces` | `(admin)/admin/workspaces/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/workspaces/[id]` | `(admin)/admin/workspaces/[id]/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/subscriptions` | `(admin)/admin/subscriptions/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/subscriptions/[id]` | `(admin)/admin/subscriptions/[id]/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/affiliates` | `(admin)/admin/affiliates/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/affiliates/[id]` | `(admin)/admin/affiliates/[id]/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/portfolios` | `(admin)/admin/portfolios/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/work` | `(admin)/admin/work/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/planning` | `(admin)/admin/planning/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/settings` | `(admin)/admin/settings/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/audit` | `(admin)/admin/audit/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/security` | `(admin)/admin/security/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |
| `/admin/health` | `(admin)/admin/health/page.tsx` | 🔒 Auth + Admin role | 🔧 Stub |

---

## API Routes

| Route | File | Method | Status |
|-------|------|--------|--------|
| `/api/auth/callback` | `src/app/api/auth/callback/route.ts` | GET | ✅ Wired |
| `/api/webhooks/stripe` | `src/app/api/webhooks/stripe/route.ts` | POST | 🔧 Stub |
| `/api/ai/chat` | `src/app/api/ai/chat/route.ts` | POST | 🔧 Stub |
| `/api/ai/actions` | `src/app/api/ai/actions/route.ts` | POST | 🔧 Stub |
| `/api/demo/seed` | `src/app/api/demo/seed/route.ts` | POST | 🔧 Stub |
| `/api/demo/reset` | `src/app/api/demo/reset/route.ts` | POST | 🔧 Stub |
