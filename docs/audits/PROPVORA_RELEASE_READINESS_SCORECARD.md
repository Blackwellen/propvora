# Propvora — Release Readiness Scorecard

**Date:** 2026-06-14 · **Build:** green (227 pages, tsc clean) · **Verdict:** controlled-beta track, **not GA**.
Scores are honest engineering estimates of how release-ready each area is (0–100), with the
gating blocker(s). "Evidence" points to in-repo proof. Updated as the FINAL-AUDIT phases land.

| Area | Score | Blockers / remaining | Evidence |
|------|:----:|----------------------|----------|
| Data / schema alignment | **95** | none material | `audit:schema` = 0; `audit:rls` = 241/241 |
| Security — isolation | **90** | external pen-test; role-within-workspace tests | `test:rls` 20/20; `external-pentest-brief.md` |
| Security — billing/entitlement | **88** | manual Stripe replay/failed-payment test | `test:gates` 31/31; webhook sig+idempotency |
| Security — headers/upload/rate-limit | **85** | Turnstile keys; shared edge store | next.config CSP/HSTS; `rate-limit.ts`; upload hardening |
| Auth | **80** | Supabase MFA add-on (TOTP); full E2E | account security page; `proxy.ts` guard |
| Onboarding | **70** | browser E2E pass; demo-data edge cases | onboarding flow exists |
| /app core workflows | **78** | mobile rebuild (P2); click-through QA (P3) | CRUD + saved views + bulk + card/kanban |
| /admin | **80** | mobile layout; some KPIs need live wiring review | ops views (data-requests/bugs/stripe/ai-usage) |
| /portals | **70** | commercial-depth pass; mobile; E2E isolation | portal messaging rebuilt; supplier/tenant flows |
| **Mobile / tablet** | **40** | **full responsive rebuild (P2) — gating** | P2a first-pass in progress |
| AI Copilot | **72** | provider/model gateway + per-6h/weekly limits (P4); mobile bubble | workspace-scoped + rate-limited + plan-gated |
| Inbox / messages | **65** | consolidation to one surface (P5) | portal messaging done |
| Search | **55** | global cross-entity search pass (P6) | top-bar search exists |
| Notifications | **70** | mobile layout; preferences depth | bell portaled; live data |
| Settings (account/workspace) | **82** | mobile forms; minor wiring review | real KPIs; deletion+SAR; MFA |
| Billing / pricing / add-ons | **80** | pricing↔catalog parity check; Connect activation | live catalog; entitlement service; gates |
| Uploads / files | **82** | per-role access E2E; scan pipeline (placeholder) | R2 proxied + authed stream + hardening |
| Performance / Vercel | **70** | bundle/N+1 pass (P9); monitoring wiring | readiness doc; health/ready |
| Disaster recovery | **70** | restore test (founder); status page | DR plan; maintenance mode; backups doc |
| Documentation | **75** | user/admin/portal/AI manuals (P12) | compliance pack (11) + release docs |
| Tests | **60** | browser E2E run; role tests; CI wiring | RLS/IDOR + gates suites runnable |
| HMRC readiness | **20** | scaffold + founder dev-app (P11) | flagged-off plan only |
| Stripe readiness | **80** | prod webhook + Connect activation (founder) | catalog + webhook + connect scaffold |
| SEO | **80** | structured data; GSC submit | robots/sitemap/llms/brand files |

## Top blockers to controlled beta
1. **Mobile/tablet rebuild (P2)** + browser click-through (P3) — the lowest scores and the gating UX work.
2. **Behavioural test execution** — run the E2E across viewports + add role tests.
3. **Founder/external** — Supabase MFA add-on, Stripe prod webhook, Turnstile, Resend DNS, Cloudflare (see `PROPVORA_MANUAL_TASKS_FOR_OWNER.md`).

## Not blocking beta (but pre-GA)
External pen-test, HMRC/MTD, AI model-gateway depth, full WCAG AA, status page, perf deep-dive.
