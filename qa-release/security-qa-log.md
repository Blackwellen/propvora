# Security QA Log

Last updated: 2026-06-20

> Auth guard is `src/proxy.ts`. Public routes defined by prefix list. All private routes require valid Supabase session cookie.

## Auth Guard Tests

| Test | Expected | Actual | Status |
|---|---|---|---|
| GET `/property-manager` unauthenticated | Redirect to `/login` | — | PENDING |
| GET `/supplier` unauthenticated | Redirect to `/login` | — | PENDING |
| GET `/customer` unauthenticated | Redirect to `/login` | — | PENDING |
| GET `/admin` unauthenticated | Redirect to `/admin-login` | — | PENDING |
| GET `/portal/login` unauthenticated | Page loads (public) | — | PENDING |
| GET `/` unauthenticated | Page loads (public) | — | PENDING |

## Role Isolation Tests

| Test | Expected | Status |
|---|---|---|
| PM user accessing `/supplier` | Redirect or 403 | PENDING |
| PM user accessing `/admin` | Redirect to `/admin-login` | PENDING |
| Supplier user accessing `/property-manager` | Redirect or 403 | PENDING |
| Customer user accessing `/supplier` | Redirect or 403 | PENDING |

## Portal Token Security

| Test | Expected | Status |
|---|---|---|
| Valid magic link token | Session created, routed to dashboard | PENDING |
| Expired token | Redirected to `/portal/expired` | PENDING |
| Revoked token | Redirected to `/portal/revoked` | PENDING |
| Tampered token (manual URL edit) | Rejected, error page | PENDING |
| Token reuse after session expiry | Rejected | PENDING |

## API Route Auth Tests

| Route | Method | Expected (unauthed) | Status |
|---|---|---|---|
| `/api/workspace/*` | GET | 401 | PENDING |
| `/api/properties/*` | GET | 401 | PENDING |
| `/api/supplier/*` | GET | 401 | PENDING |
| `/api/portal/*` | GET | 401 or token-check | PENDING |

## CSS Audit — No dark: Classes

| Check | Status |
|---|---|
| `grep -r "dark:" src/` returns 0 | PENDING |
| Built CSS contains no dark: variants | PENDING |

## Secrets Audit

| Check | Status |
|---|---|
| No API keys hardcoded in src/ | PENDING |
| `.env.local` not committed to git | PENDING |
| `SUPABASE_SERVICE_ROLE_KEY` not in client bundle | PENDING |

## Issues Found

None yet — all tests pending.
