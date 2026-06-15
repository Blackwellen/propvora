# API Security Matrix — Propvora `src/app/api/**`

Generated: 2026-06-15 by static read of every route handler in `src/app/api/**`.
For each route: **Auth** (does it call `supabase.auth.getUser()` / verify a
session?), **Authz** (workspace-membership and/or role/owner/platform-admin
check?), **Validation** (zod schema or explicit type guards on the body?), and
**Rate limit** (per-IP / per-user throttle?).

32 route files analysed. Legend: ✅ present · ⚪ n/a by design · ❌ missing/gap ·
🔓 intentionally public.

## Summary

- Every route that mutates or reads tenant data performs **`getUser()` auth**.
- Every tenant-write route performs an explicit **workspace-membership** check
  (or owner / platform-admin / portal-session check), in addition to RLS — i.e.
  defence in depth, not RLS alone.
- **Sensitive / abuse-prone** routes (auth rate-check, invite, account GDPR
  request, newsletter subscribe, bug report) carry **rate limiting**.
- **Validation**: newer routes use **zod**; several older ones use explicit
  `typeof` type guards (functionally equivalent for their small bodies). Gaps
  noted below are *style* gaps, not auth holes.
- Intentionally public routes (`/health`, auth callback, newsletter
  confirm/unsubscribe, portal verify, Stripe webhook) are public **by design**
  and use alternative trust anchors (signed tokens, webhook signature, neutral
  anti-enumeration responses).

## Matrix

| Route | Method | Auth (getUser) | Authz (membership/role) | Validation | Rate limit | Notes |
|---|---|---|---|---|---|---|
| `auth/callback` | GET | ⚪ (exchanges code) | ⚪ | ✅ redirect allow-list | ⚪ | OAuth/code exchange; `safeRedirect` allow-list prevents open redirect |
| `auth/rate-check` | POST | ⚪ pre-auth | ⚪ | ✅ action enum guard | ✅ per-IP+action | Throttle gate for client-side auth flows; fail-open |
| `health` | GET | 🔓 public | 🔓 | ⚪ | ⚪ | Liveness only; coarse `{status,db}`, never leaks secrets |
| `ready` | GET | ✅ | ✅ **platform-admin** | ⚪ | ⚪ | Presence-only config booleans; service-role admin check, fail-closed |
| `integrations/status` | GET | ✅ | ⚪ (any authed) | ⚪ | ⚪ | Returns booleans only (no secrets); read-only config flags |
| `entitlements` | GET | ✅ | ⚪ (own workspace resolved) | ⚪ | ⚪ | Returns caller's plan flags; cosmetic, server gates are real enforcement |
| `billing/portal` | POST | ✅ | ⚪ (own workspace) | ⚪ no body | ⚪ | Stripe billing portal for caller's workspace customer |
| `billing/checkout` | POST | ✅ | ⚪ (own workspace) | ✅ `priceId` type guard | ⚪ | Stripe Checkout; workspace resolved from profile |
| `billing/pay-invoice` | POST | ✅ | ✅ **membership** of invoice's workspace | ✅ `id` guard | ⚪ | 403 if not a member of the record's workspace |
| `connect/onboard` | POST | ✅ | ✅ **owner-only** | ⚪ no body | ⚪ | Feature-flagged Stripe Connect; owner of workspace only |
| `connect/status` | GET | ✅ | ⚪ (own workspace, RLS-scoped) | ⚪ | ⚪ | Safe "none" when disabled/not onboarded |
| `ai/chat` | POST | ✅ | ✅ **membership** (when ws provided) | ✅ zod | ✅ `checkRate` (AI metering) + `gateAiCopilot` | Demo workspace bypasses membership; OpenAI key server-only |
| `ai/actions` | POST | ✅ | ✅ **membership** (skip demo) | ✅ zod | ✅ metering + `gateAiCopilot` | Action allow-list driven |
| `files/[...key]` | GET | ✅ | ✅ **membership** (key prefix = workspaceId) | ✅ key/segment guard | ⚪ | Streams private R2; workspace bound by key prefix |
| `pdf/invoice/[id]` | GET | ✅ | ✅ **membership** of record's workspace | ✅ id param | ⚪ | 403 if not a member of the invoice/bill workspace |
| `upload` | POST | ✅ | ✅ **membership** of target workspace | ✅ MIME allow-list + size cap + filename | ⚪ | `gateStorage` quota; 10 MB cap; MIME allow-list |
| `email/welcome` | POST | ❌ none | ⚪ | ✅ `email` type guard | ❌ none | Fire-and-forget post-signup; non-critical; only sends to supplied email (see Findings) |
| `email/invite` | POST | ✅ | ⚪ (any authed inviter) | ✅ type guards | ✅ per-inviter+IP | Invite-spam throttle; does not re-check inviter's role (see Findings) |
| `account/request` | POST | ✅ | ⚪ (own account) | ✅ zod + **password re-auth** | ✅ per-user+IP | GDPR export/deletion; re-authenticates password server-side |
| `account-process` (admin) | POST | ✅ | ✅ **platform-admin** | ✅ action/requestId guard | ⚪ | Destructive erasure double-gated by env flag + `confirm` |
| `admin/init` | POST | ⚪ (secret) | ✅ **shared secret** `ADMIN_SETUP_SECRET` | ✅ secret guard | ⚪ | One-time bootstrap; 403 on wrong/missing secret |
| `portals/grant` | POST | ✅ | ✅ **membership** + contact-in-workspace | ✅ field guards | ⚪ | Mints portal magic-link token (hashed at rest; raw returned once) |
| `portal/verify` | POST | ⚪ (magic-link token) | ✅ **token→grant** resolve + scope freeze | ✅ token extract | ✅ `checkVerifyRateLimit` | Anti-enumeration neutral redirects; HttpOnly signed session cookie |
| `portal/logout` | POST | ⚪ (session cookie) | ✅ session token hash | ⚪ | ⚪ | Idempotent; revokes session + clears cookie |
| `portal/file` | GET | ⚪ (portal session) | ✅ **portal-session scope** (key prefix = workspaceId) | ✅ key + traversal guard | ⚪ | Fail-closed 401; rejects `..` and cross-workspace keys |
| `demo/seed` | POST | ✅ | ✅ **owner/admin only** | ✅ zod | ⚪ | RPC `seed_demo_workspace`; 409 if already loaded |
| `demo/reset` | POST | ✅ | ✅ **owner/admin only** | ✅ zod | ⚪ | RPC `delete_demo_data` |
| `bug-report` | POST | ⚪ (anon allowed) | ⚪ | ✅ clamp/sanitise (secret-strip) | ✅ per-IP | Deny-all table via service role; generic 200; never stores secrets/stacks |
| `newsletter/subscribe` | POST | 🔓 public | ⚪ | ✅ zod (`consent: true`) | ✅ per-IP + Turnstile (key-gated) | Double opt-in; anti-enumeration generic success |
| `newsletter/confirm` | GET | 🔓 public | ✅ token (uuid) lookup | ✅ zod uuid | ⚪ | Neutral redirect; suppressed rows never resurrected |
| `newsletter/unsubscribe` | GET | 🔓 public | ✅ token (uuid) lookup | ✅ zod uuid | ⚪ | One-click; neutral outcome |
| `webhooks/stripe` | POST | 🔓 public | ✅ **Stripe signature** verification | ✅ raw-body sig check | ⚪ | 400 on missing sig; 503 if not configured |

## Findings & observations

These are not authorization holes; they are noted for completeness.

1. **`email/welcome` is unauthenticated** (F-API-1, low). It is called
   fire-and-forget right after `supabase.auth.signUp()` and sends a welcome
   email to whatever address is in the body. An attacker could POST arbitrary
   addresses to send Propvora-branded welcome emails (low-severity email-abuse /
   spam vector). It performs no DB writes and reveals nothing. *Suggested
   hardening: add a per-IP rate limit (as `email/invite` has) or require a valid
   session.*

2. **`email/invite` does not re-check the inviter's workspace role** (F-API-2,
   low). Any authenticated user may call it to send a workspace-invite email
   (the email only contains an `invitationId`; the actual invite row and its
   authorization are created elsewhere). It is rate-limited per inviter+IP, so
   abuse is bounded. *Suggested hardening: verify the caller is owner/admin of
   the workspace the `invitationId` belongs to.*

3. **Validation style is mixed** (F-API-3, informational). zod is used in the
   newer routes (`ai/*`, `account/request`, `demo/*`, `newsletter/*`); several
   older routes use explicit `typeof` guards. Both reject malformed input with
   400; no route trusts an unvalidated body for an authorization decision.

4. **Rate limiting is applied selectively** (informational). It is present on
   exactly the abuse-prone surfaces (auth, invite, account GDPR request,
   newsletter, bug report, portal verify, AI metering). CRUD-style tenant routes
   rely on session auth + membership + RLS rather than rate limits, which is
   acceptable for V1.

## Defence-in-depth conclusion

Every tenant-data route enforces **auth + explicit membership/role check on top
of database RLS**. No route relies on RLS alone, and no route was found that
mutates or reads another workspace's data without a membership/owner/platform-
admin/portal-session/Stripe-signature trust anchor. The two findings above are
low-severity email-abuse vectors, not data-exposure or IDOR holes.

---
Static source: `src/app/api/**/route.ts` (32 files), read 2026-06-15.
Companion live evidence: `docs/finalisation/RLS_POLICY_MATRIX.md`,
`scripts/test/{idor-sweep,anon-exposure,role-within-workspace,rls-coverage}.mjs`.
