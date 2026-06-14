# Cookie & Local-Storage Audit

Controller: Blackwellen Ltd (Propvora), Company No. 16482166, ICO ZC160806.
Contact: legal@propvora.com.

This audit inventories cookies and equivalent client-side storage set by Propvora,
under UK GDPR + **PECR** (the Privacy and Electronic Communications Regulations,
which govern cookies). **Strictly necessary** cookies need no consent; all others
require prior opt-in consent.

> **Status — consent gating is NOT yet built.** A cookie-consent banner with
> necessary-only-pre-consent gating is **MAX-RELEASE build item A2 (Pending)**.
> Until it ships, Propvora must run **only strictly necessary cookies** and must
> NOT load analytics/marketing tags. See the analytics note below.

## Cookie inventory

| Name | Set by | Purpose | Duration | Category | Consent |
|------|--------|---------|----------|----------|---------|
| `sb-<project>-auth-token` (+ chunked `.0`/`.1`) | Supabase auth (`@supabase/ssr`) | Authenticated user session (access + refresh token) | Session / refresh-token lifetime | Strictly necessary | Not required |
| `sb-<project>-auth-token-code-verifier` | Supabase auth | PKCE code verifier during OAuth/login | Short-lived (login flow) | Strictly necessary | Not required |
| `pv_portal_session` | Propvora (`src/lib/portal/session.ts`) | Signed (HMAC) external-portal session for tenant/landlord/supplier magic-link access; constant-time validated, fail-closed | Until `expires_at` / revocation | Strictly necessary | Not required |
| CSRF / action-safety token | Propvora server actions (Next.js) | Cross-site request forgery protection on mutating actions | Session | Strictly necessary | Not required |

Notes:
- Propvora stores **no card data**; Stripe Checkout/Elements may set their own
  cookies **on Stripe's domain** when a hosted checkout is opened — those are
  Stripe's responsibility as a separate controller/processor and are
  payment-necessary.
- Map tiles (CartoDB/OSM) and geocoding (Nominatim) are loaded as resources and
  do not set first-party Propvora cookies.

## Analytics — present in policy, NOT active in code
The Content-Security-Policy in `next.config.ts` **allows** Google Tag Manager /
Google Analytics origins (`googletagmanager.com`, `google-analytics.com`), and the
cookies/privacy pages reference analytics. **However, no GTM/GA tag is currently
loaded in the application root layout** (`src/app/layout.tsx` contains no analytics
script). So today there are **no analytics cookies in production**.

When analytics is introduced it MUST be:
1. gated behind the A2 consent banner (off until opt-in), and
2. added to this table with name/purpose/duration before going live.

Expected analytics cookies *once enabled* (for reference, do not treat as live):

| Name (example) | Purpose | Typical duration | Category |
|----------------|---------|------------------|----------|
| `_ga` | Google Analytics client id | 2 years | Analytics — consent required |
| `_ga_<container>` | GA4 session state | 2 years | Analytics — consent required |

## Marketing cookies
None currently. Newsletter signup (build item A4) is email-based with explicit
consent + suppression and does not itself require marketing cookies.

## Compliance actions
- [ ] **A2 — build cookie-consent banner** (necessary-only pre-consent; analytics/
      marketing post-consent; granular preferences + withdrawal).
- [ ] Do not load GTM/GA until the banner gates it.
- [ ] Keep this table in sync with what is actually set; re-audit before GA and
      whenever a new third-party script is added.
- [ ] Ensure the cookies policy page (`/legal/cookies`) matches this inventory.

> **Legal review required.** Engineering-prepared audit. Confirm PECR consent
> design and the cookie table with a qualified adviser before GA.
