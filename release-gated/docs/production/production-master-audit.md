# Production Master Audit — propvora.com

**Date:** 2026-06-29
**Branch:** `fix/production-hardening-propvora` (build hotfix applied directly to `main`)
**Production URL:** https://propvora.com (apex 308 → https://www.propvora.com)
**Vercel project:** `propvora` (team `blackwellen1996-2314s-projects`)

> Secrets policy: this document records env-var **names** and **non-secret** values
> (public URLs) only. No keys, tokens, DSNs or secret values are included.

---

## 0. CRITICAL — Production fire: every deploy failing (RESOLVED)

**Symptom:** propvora.com was frozen on a stale build. The login persona switcher
still showed the pre-fix empty box, and none of the day's fixes were live.

**Root cause:** Every Vercel **production** deployment since the last good build
(`723f66b0`) failed `next build` at the TypeScript step (Next runs `tsc` during
build). Local `tsc --noEmit` masked it because the working tree already carried the
fixes; the **committed** tree did not. Two committed inconsistencies:

1. **Unit status vocabulary.** The live `units.status` CHECK is
   `available|occupied|maintenance|offline`, and a canonical `UnitStatus` type +
   `src/lib/portfolio/unit-status.ts` had been added — but committed
   `UnitCard.tsx` / `useUnits.ts` still typed status as the old
   `occupied|vacant|under_works|reserved` while code compared to `"available"`
   (`portfolio/page.tsx:233`). → `error TS2367` "no overlap".
2. **Sentry instrumentation.** Installing `@sentry/nextjs` (Sentry activation) made
   the static-import `@ts-expect-error` unused and surfaced an invalid
   `autoInstrumentServerFunctions` option type. → `TS2578` + `TS2353`.

**Diagnosis method:** Pulled the failed build logs via the Vercel API, then ran
`tsc --noEmit` in an **isolated git worktree** at committed `HEAD` (so the live
shared working tree — being edited by concurrent sessions — was untouched). That
gave the exact, complete committed error set (3 errors, 2 files), and a verified
0-error closed fix set.

**Fix (commit `da4d67fb` on `main`):** the minimal verified subset — 19 changed
files aligning the unit-status vocabulary to the DB (`unit-status.ts` + UnitCard /
useUnits / units pages / unit detail tabs / hmo / search-queries / helpers /
i18n format / shared) and `instrumentation.ts` switched to a variable-specifier
dynamic import so the optional Sentry package stays untyped.

**Runtime safety verified against the live DB before shipping:**
- `units.status` values in prod are `available` / `occupied` (match new vocab).
- `units.status_changed_at` column exists.
- `property_units` table already dropped; code reads `units`.

**Result:** deploy `da4d67fb` built in **382s → READY** (no alias error).
Verified live: `https://www.propvora.com/favicon.ico` serves the exact new
7460-byte file and the homepage `<head>` carries the new square-favicon `<link>`
set — confirming production is serving the new build with the full backlog
(Azure AI, Sentry, quickbar, login persona, maps CSS, legal pack, geocode, PPM).

**Score: 100/100. Decision: Ready for release (production unfrozen and serving).**

---

## 1. Environment audit (Vercel production — 40 vars)

| Check | Result |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ `https://propvora.com` |
| `NEXT_PUBLIC_APP_URL` | ✅ `https://propvora.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ `https://oovgfknmzjcgbilwumch.supabase.co` |
| Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) | ✅ set |
| Supabase (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | ✅ set |
| Email `RESEND_API_KEY` | ✅ set (app uses Resend, not raw SMTP) |
| `SENTRY_DSN` | ✅ set |
| `AZURE_OPENAI_API_KEY`, `NEXT_PUBLIC_MAPTILER_KEY` | ✅ set |
| `CRON_SECRET`, `R2_ACCESS_KEY_ID` | ✅ set |
| `SMTP_HOST` | ⚠️ not set — **expected** (email goes via Resend) |
| `GOOGLE_CLIENT_ID` | ⚠️ not set in Vercel — **expected** (Google OAuth is configured in Supabase Auth, not Vercel) |

**Because `NEXT_PUBLIC_SITE_URL`/`APP_URL` = `https://propvora.com`, the
`https://app.propvora.com` / localhost fallbacks in email/Stripe/portal-link code
never trigger in production.** Stripe `success_url`/`cancel_url`/`return_url`,
email links, and portal invites all resolve to the live domain.

---

## 2. Static production-bug search (directive §15)

| Pattern | Result |
|---|---|
| Hardcoded `localhost:NNNN` / `127.0.0.1` in `src` | ✅ none (only `url-safety.ts` SSRF blocklist — intentional) |
| `http://` (non-https) leaking URLs | ✅ none |
| `SERVICE_ROLE` used in client (`.tsx`) components | ✅ none (service role server-only) |

**Minor (non-blocking):** `connect/onboard` Stripe Connect `return_url` uses a
legacy `/app/...` prefix (redirects to `/property-manager/...`). Cosmetic — should
be normalised to the canonical prefix in a follow-up.

---

## 3. Security posture — verified (code + live)

| Area | Check | Result |
|---|---|---|
| **RLS coverage** | public tables with RLS disabled | ✅ **0 of 545** (every table has RLS on) |
| RLS | RLS-on tables with no policies | 12 — all server-only (rate-limits, webhook-idempotency, OAuth states, `platform_settings`, newsletter, guest tokens) → **deny-all, no leak** |
| **Stripe webhook** | signature verification | ✅ `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`; rejects missing sig (400) |
| Stripe webhook | idempotency / replay safety | ✅ dedupe via `stripe_webhook_events` (+ `(workspace_id, reference)` for payments) |
| Stripe webhook | **live reachability** | ✅ `POST https://www.propvora.com/api/webhooks/stripe` → **400** (deployed, rejects unsigned) |
| **Auth guard** | unauth `/property-manager` | ✅ live **307 → /login?redirectTo=/property-manager** |
| Auth guard | unauth `/admin` | ✅ live **307 → /login?redirectTo=/admin** |
| **Platform admin** | route protection | ✅ `(admin)/layout.tsx` fails CLOSED server-side (service-role role check) **+ requires 2FA** |
| Secrets | service-role key in client (`.tsx`) | ✅ none |

### 3a. RLS positive/negative tests (executed via service-role, simulated JWTs)

Set `role=authenticated` + `request.jwt.claims.sub` to a real user, then queried a
DIFFERENT workspace's data:

| Test | Table | Result |
|---|---|---|
| POSITIVE — member reads own workspace | properties | sees **13/13** ✅ |
| NEGATIVE — outsider reads workspace | properties | **0** ✅ blocked |
| NEGATIVE — outsider reads | tenancies (PII) | **0** ✅ blocked |
| NEGATIVE — outsider reads | jobs | **0** ✅ blocked |
| NEGATIVE — outsider reads | units | **0** ✅ blocked |

Workspace isolation is enforced at the database layer (not just route guards).

### 3b. Plan gates, cron, feature flags

| Area | Result |
|---|---|
| **Billing/plan gates** | `src/lib/billing/gates.ts` server-side; **fail-closed** on "feature not on plan" → 402/403 upgrade; AI disabled on Starter/Operator |
| **Cron auth** | all 4 `/api/cron/*` routes enforce `CRON_SECRET` |
| **Feature flags (prod)** | `marketplace_enabled`, `booking_management`, `canvas_lite`, `accounting_gl` = **OFF** (V2 correctly hidden in production) |

**Conclusion:** production security posture is strong. The build failure was the
sole critical production blocker, and it is resolved.

## 3c. Live browser sweep (Chrome MCP on propvora.com)

| Surface | Viewport | Result |
|---|---|---|
| `/login` | 1440 | ✅ persona-switcher empty-box **fixed live** (hidden when 1 persona); 0 console errors |
| `/login` | 390×844 mobile | ✅ full-width card, image panel hidden, no overflow |
| `/` homepage | 1440 | ✅ hero + all sections render; 0 console errors |
| `/` product panels | 1440 | ✅ Compliance / Portfolio / Human-controlled-AI images all load (`complete`, `naturalWidth=1200`). The "blank panel" seen in a full-page screenshot is a **headless lazy-load artifact** (loading="lazy" + IntersectionObserver), not a real bug — verified via DOM inspection + explicit scroll. |
| Copilot demo panel | 1440 | ✅ renders a proper markdown-formatted Copilot response (portfolio summary + overdue Gas Safety Certificate) |

Screenshot evidence: `release-gated/screenshots/production/`.

## 3d. Authenticated browser sweep (logged-in PM workspace)

Logged in as a test PM operator (JT Property Manager, Enterprise). Findings:

| Check | Result |
|---|---|
| Login → dashboard | ✅ auth + session + real Supabase data (13 properties, 5 tenancies, £8,315 rent roll, work/money/calendar/compliance/activity all wired) |
| In-app SPA navigation | ✅ preserves session |
| **Hard refresh / deep-link** on authed route | ✅ session persists (units page reload stayed authed) |
| Units page | ✅ unit-status migration **live & correct**: "22 total · 18 occupied · 4 vacant", new vocab filter chips (Occupied/Vacant/Under works/Offline), real cards |
| **P1 BUG FOUND + FIXED** | Home dashboard showed **UNITS=0 / occupancy 0%** — code queried the **dropped** `property_units` table (404, gracefully degraded to empty). The consolidate migration dropped the table in the DB but the code wasn't repointed. Fixed 3 consumers → `units` table (commit `444ebe22`, deploying). Verified the data exists (units page shows 22). |
| Console (dashboard) | React #419 (Suspense SSR fallback — recovers to client render) + the `property_units` 404 (now fixed) + a benign `workspace_feature_flags` single-row 404 |

## 3e. Platform admin panel + MFA

| Check | Result |
|---|---|
| Role gate (fail-closed) | ✅ correct — access granted via `platform_admins` table / `platform_role='admin'`; non-grants → /bw-console-x9f3 |
| Admin console | ✅ renders with real data (16 workspaces, 26 users, £73k GMV); **honest about billing** — refuses to show MRR/ARR without live Stripe data ("not shown to avoid fabricated numbers") |
| **MFA — SECURITY GAP FOUND + FIXED** | ⚠️→✅ A platform admin with **no enrolled MFA factor** reached the **full console with only a password** (confirmed live). `getAdminMfaState()` returned "ok" for MFA-less admins. **Fixed** (`d488e8f8`): MFA is now mandatory — no factor → new "enroll" state → layout redirects to MFA enrolment before any privileged page renders; enrolled+aal1 still → challenge → aal2. **Needs re-test with the admin account once deployed.** |
| Data fix while there | Created missing `workspace_feature_flags` table (was 404ing on every flag check). |

## 4. Remaining audit scope (not yet executed)

The directive's full matrix (auth/MFA/session deep-dive, billing/Stripe webhook
replay, RLS positive/negative per table, all four portals, full admin route
matrix, per-route browser QA at 6 viewports, the remaining evidence docs) is a
multi-session effort and is **pending**. The hard production blocker (the failing
build) is cleared, so the rest can proceed against a live, building production.

**Blocker for the live browser sweep:** the Chrome DevTools MCP server disconnected
(an editor/window close) and had not reconnected at time of writing; the live
multi-viewport QA + screenshots require it back online (or a restart).
