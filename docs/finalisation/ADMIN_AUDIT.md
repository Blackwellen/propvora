# Admin Console Audit — Propvora

**Generated:** 2026-06-15 · Scope: `src/app/(admin)`, `src/app/(admin-auth)`,
`src/lib/admin`, `/api/admin/*`, `/api/ready`.

## Verified state

| Control | State | Evidence |
|---|---|---|
| Server-side platform-admin guard on every `/admin` route | ✅ | `platform_role = "admin"` checked server-side before render. |
| Admin MFA / OTP gate on the admin auth surface | ✅ | `(admin-auth)` group; `admin-mfa-otp-gate`. |
| Bootstrap is secret-gated, one-time | ✅ | `POST /api/admin/init` requires `ADMIN_SETUP_SECRET`; 403 otherwise. |
| `/api/ready` is admin-gated and fail-closed | ✅ | Returns presence-only booleans; never leaks secret values. |
| Admin uses service role **server-only** | ✅ | No service-role key reaches the client; API security matrix. |
| Destructive GDPR erasure double-gated | ✅ | DRY-RUN unless `ACCOUNT_ERASURE_ENABLED=true` **and** explicit confirm. |
| Sensitive actions audited | ✅ | `src/lib/audit/log.ts`; admin **Audit** views. |

## Console coverage

Dashboard, Users, Workspaces, Customers, Subscriptions, Portfolios, Work, Planning,
AI models, AI usage, Affiliates (incl. payout review), Stripe events, Data requests,
Bugs, Announcements, Changelog, Security, Settings, Health — all present and wired to
live data via the service role.

## Notes / residual

- Admin actions inherit the same low-severity `email/invite` observation as the app
  (role re-check not enforced on the invite *email* route; the invite row authz is
  elsewhere). Tracked, low.
- No admin route was found that exposes a secret value or another workspace's data
  outside the intended platform-admin scope.

**Conclusion:** the admin console is protected by a server-side role check **and** an MFA
gate, uses the service role only on the server, and audits sensitive actions. No
privilege-boundary or secret-exposure defect found.
