# Cloudflare Production Setup

**Product:** Propvora · **Owner:** Blackwellen Ltd. **Owner key:** Founder/External
(MAX-RELEASE items 56–58, X1). The app runs on **Vercel**; Cloudflare sits in front
for DNS, TLS posture, and edge protection.

> This is a runbook for the founder to execute in the Cloudflare dashboard. None of
> it is code in this repo. Work through the **do-not-break list (section 8) first**
> so protections don't take down Stripe webhooks, Supabase, Resend, or Vercel.

## 1. DNS records
Point the apex + `www` (and `staging`) at Vercel. Use the targets Vercel shows in
**Project → Settings → Domains** (do not guess — Vercel may issue an A record or a
CNAME).

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A or CNAME | `@` (propvora.com) | Vercel-provided target | Proxied (orange cloud) |
| CNAME | `www` | Vercel-provided target | Proxied |
| CNAME | `staging` | Vercel-provided target | Proxied |
| TXT/CNAME | (Resend) SPF, DKIM, DMARC | Per Resend dashboard | DNS only |
| TXT | Domain verification (Vercel/Google) | As issued | DNS only |

## 2. SSL/TLS
- SSL mode: **Full (strict)** — Vercel presents a valid cert, so strict is correct.
  Never use Flexible (it allows http origin and breaks HSTS guarantees).
- **Always Use HTTPS:** On.
- **Automatic HTTPS Rewrites:** On.
- **Minimum TLS version:** 1.2.
- **HSTS:** enable in Cloudflare **only after** confirming HTTPS works on apex +
  subdomains. The app already sends `Strict-Transport-Security` from
  `next.config.ts` (`max-age=63072000; includeSubDomains; preload`); Cloudflare's
  HSTS setting should match and not undercut it. Only enable `preload` when ready
  to commit (hard to undo).

## 3. Security / bot
- **Bot Fight Mode:** On (or Super Bot Fight Mode on paid plans).
- **WAF managed rulesets:** enable Cloudflare Managed Ruleset + OWASP Core Ruleset
  at a sensible sensitivity; monitor for false positives on `/api/*` first.
- **Security level:** Medium.

## 4. Rate-limiting rules (edge — complements app-level limits)
Create rules (Security → WAF → Rate limiting). Suggested starting points:

| Rule | Match | Threshold | Action |
|------|-------|-----------|--------|
| Login | `POST` to auth/login paths | 10 / min / IP | Managed challenge |
| Signup | `POST` to signup | 5 / min / IP | Block |
| Password reset / OTP | `POST` to reset/OTP | 5 / min / IP | Managed challenge |
| AI endpoints | `/api/ai/*` | 30 / min / IP | Block (app also limits per-workspace) |
| Public forms | contact/support/newsletter/affiliate | 10 / min / IP | Managed challenge |

Tune thresholds against real traffic; start in **Log** then switch to enforce.

## 5. Cloudflare Turnstile (CAPTCHA)
- Create a Turnstile widget; capture **site key** (public) + **secret key** (server).
- Wire to: **signup, password reset, contact/support, newsletter (A4), affiliate
  enrolment**. The app has a key-gated Turnstile hook planned (items 31, 55, A4) —
  do **not** add Turnstile to authenticated in-app actions.
- Store keys as env vars (section 7), not in the repo.

## 6. Page rules / caching
- Do **not** cache `/api/*`, authenticated pages, or anything with `Set-Cookie`.
- Respect origin cache headers; the app sends `Cache-Control: no-store` on health/
  ready and auth responses.

## 7. Environment variables (set in Vercel, referenced by Cloudflare/forms)

| Var | Where set | Purpose |
|-----|-----------|---------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Vercel (public) | Turnstile widget render |
| `TURNSTILE_SECRET_KEY` | Vercel (secret) | Server-side Turnstile verify |
| `NEXT_PUBLIC_SITE_URL` | Vercel | Canonical URL (https, non-localhost in prod) |

(Stripe/Supabase/Resend/OpenAI/R2 vars are in `docs/release/vercel-production-readiness.md`.)

## 8. Do-not-break list (verify after every change)
- **Stripe webhooks** (`/api/webhooks/stripe`): authenticated by **signature, not
  IP** — do NOT rely on Cloudflare IP allowlisting; do NOT challenge/block this
  path (Stripe can't solve a CAPTCHA). Exempt it from rate-limit + WAF challenges.
- **Supabase**: REST + realtime websockets (`wss://*.supabase.co`) must remain
  reachable from the browser — already in CSP `connect-src`. Don't proxy-break WS.
- **Resend**: outbound email; DNS auth records (SPF/DKIM/DMARC) must be **DNS-only**
  (grey cloud), not proxied.
- **Vercel**: keep SSL Full (strict) so the Vercel origin cert validates.
- **Map tiles / geocoding** (CartoDB, OSM, Nominatim) and **Stripe.js** must stay
  loadable — already in CSP.
- After enabling WAF/Bot Fight, smoke-test: login, upload, AI chat, a Stripe test
  checkout + webhook, a portal magic-link, and a transactional email.

## 9. DNS-based filtering — guidance (protects devices, NOT the app)
The founder may use a DNS resolver/filter on their **own devices/network** for
malware/ad/tracker blocking. This is a **personal/endpoint** control and does
**not** protect or harden the Propvora application or its users.

| Option | Notes |
|--------|-------|
| **Quad9** (9.9.9.9) | Free malware-blocking resolver; easy, no account. |
| **NextDNS** | Configurable blocklists + logging per profile; good for a small team. |
| **AdGuard DNS / Pi-hole** | Network-wide ad/tracker blocking; Pi-hole is self-hosted. |
| **Cloudflare Gateway (Zero Trust)** | Policy-based DNS filtering for an org; separate from the WAF above. |

Clarification: these filter DNS on the **client side**. They are unrelated to the
Cloudflare WAF/proxy that protects the **propvora.com application**. Do not confuse
the two when reasoning about app security.

> Founder/External action. Record the chosen settings + Turnstile key IDs in the
> ops vault after configuring.
