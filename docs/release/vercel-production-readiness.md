# Vercel Production Readiness

**Product:** Propvora · **Owner:** Blackwellen Ltd. **Status:** In progress
(MAX-RELEASE section R, items 179–187). Health/readiness probes are
**implemented**; env audit, preview isolation, monitoring, and safe error pages
are partly pending.

> Framework on Vercel **must be detected as Next.js** (Next 16 App Router; the auth
> guard is `src/proxy.ts`, Next 16's renamed `middleware`). Do not override the
> build to a static export.

## 1. Environment variable matrix
Set per environment in Vercel → Project → Settings → Environment Variables.
`NEXT_PUBLIC_*` are exposed to the browser (no secrets there). Everything else is
server-only.

| Var | Secret? | Production | Preview | Development |
|-----|:-------:|:----------:|:-------:|:-----------:|
| `NEXT_PUBLIC_SUPABASE_URL` | No | live project | **test/staging project** | local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | live | test | local |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | live | test | local |
| `STRIPE_SECRET_KEY` | **Yes** | **live key** | **test key** | test key |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | live endpoint secret | test endpoint secret | test |
| `RESEND_API_KEY` | **Yes** | live | sandbox/test | sandbox |
| `OPENAI_API_KEY` | **Yes** | live | live (low limit) | live (low limit) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | **Yes** | live bucket | test bucket | test |
| `R2_BUCKET` / `R2_BUCKET_NAME` | No | live | test | test |
| `COMPANIES_HOUSE_API_KEY` | **Yes** | live | live | live |
| `NEXT_PUBLIC_SITE_URL` | No | `https://propvora.com` | preview URL | `http://localhost:3000` |
| Portal-session signing secret | **Yes** | live | test | local |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | site=No / secret=**Yes** | live | test keys | test keys |

**Golden rule:** Preview/Dev must point at **test Stripe** and a **test/staging
Supabase project + test R2 bucket** so preview deploys can never mutate live
customer data, take real payments, or send from the production email domain.

## 2. Build settings
- Framework preset: **Next.js** (auto). Node version: match local (`package.json`
  engines if set).
- Build command: default (`next build`). Output: managed by Vercel (do not force
  static export — there are server routes + the `src/proxy.ts` guard).
- Install command: default; commit a clean lockfile.
- Treat lint/type errors as **build-breaking** for production (no `ignoreBuildErrors`).

## 3. Preview isolation
- Separate env scope for Preview (matrix above) — test providers only.
- Vercel **Deployment Protection** on preview URLs (password/SSO) so previews
  aren't public.
- Stripe **test-mode** webhook endpoint pointed at preview, distinct secret.

## 4. Production domain / SSL / redirects / headers
- Domain `propvora.com` (+ `www`) attached; fronted by Cloudflare (see
  `cloudflare-production-setup.md`); SSL **Full (strict)**.
- Canonical redirect `www → apex` (or chosen canonical) configured once, at one
  layer, to avoid redirect loops with Cloudflare.
- Security headers (CSP, HSTS, X-Frame DENY, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy, COOP) are emitted by the app
  (`next.config.ts`) on every route — verify they survive the edge.

## 5. Health checks & readiness
- **`/api/health`** — public liveness; coarse `status`/`db` only, no secrets.
  Wire an uptime monitor to it (expect 200; 503 = DB unreachable).
- **`/api/ready`** — **platform-admin only**; presence-only booleans for required
  config (supabase/stripe/webhook/resend/openai/r2/companiesHouse/siteUrl) +
  `lastWebhookAt`. Use after each deploy to confirm the environment is wired.
  Required set for `ready: true` = db + supabase + stripe + stripeWebhook.

## 6. Monitoring (pending — items 186, A7)
- Vercel Analytics / log drains for request + error visibility.
- External uptime monitor on `/api/health`.
- Error boundary + bug-catcher (route context, safe refs, admin bug inbox) is
  build item **A7 (pending)**.
- Ensure prod errors do **not** leak stack traces/secrets (items 47–48, pending).

## 7. Error pages
Safe error pages are implemented under **MAX-RELEASE A1** (404/403/500/
maintenance/payment-required/workspace-not-found/subscription-inactive/
portal-expired/invite-expired). Confirm they render on Vercel for both app and
edge-level failures, and that the maintenance flag works in production.

## 8. Pre-go-live checklist
- [ ] All production env vars set; secrets marked secret; no `localhost` in `NEXT_PUBLIC_SITE_URL`.
- [ ] Preview/Dev point at **test** Stripe + Supabase + R2 (verified).
- [ ] `/api/ready` returns `ready: true` against production.
- [ ] Stripe **live** webhook endpoint + secret configured; test event delivered.
- [ ] Security headers verified at the edge; CSP not broken by Cloudflare.
- [ ] Uptime monitor on `/api/health`.
- [ ] Deployment protection on preview; production rollback (last good deploy) confirmed.

> Founder/external actions: live provider keys, Stripe live webhook, domain DNS,
> monitoring sign-up. The rest is in-repo and verified above.
