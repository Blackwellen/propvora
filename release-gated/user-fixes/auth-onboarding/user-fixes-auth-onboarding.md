# Auth / Onboarding — Manual Actions Required

**Section:** Auth, Login, Signup, MFA, Sessions, Invites & Onboarding
**Date:** 2026-06-25
**Session:** fded593c

These items cannot be completed by Claude Code because they require browser-based logins
to external services (Supabase Dashboard, Google Cloud Console) or DNS-level access.
Each item includes the exact steps to complete it.

---

## UFX-AUTH-001 — Configure production SMTP in Supabase

**Why needed:** Without SMTP configured, Supabase falls back to its own (rate-limited)
email relay. For production: email confirmation + password-reset emails must arrive
reliably and come from a Propvora-branded sender address.

**External gate:** Supabase Dashboard → Auth → Email → SMTP settings.

**Steps:**
1. Go to https://supabase.com/dashboard/project/oovgfknmzjcgbilwumch/auth/email
2. Enable "Custom SMTP" toggle.
3. Enter:
   - **Host:** your SMTP host (e.g. `smtp.resend.com` or SendGrid)
   - **Port:** 465 (SSL) or 587 (TLS)
   - **Username:** your SMTP username
   - **Password:** your SMTP password
   - **Sender name:** `Propvora`
   - **Sender email:** `noreply@propvora.com`
4. Send a test email to verify delivery.

**Risk if not done:** Email confirmation and password reset may be rate-limited or
come from `noreply@mail.supabase.io` which looks untrustworthy.

---

## UFX-AUTH-002 — Enable Google OAuth provider in Supabase

**Why needed:** The login and register pages offer "Continue with Google" which calls
`supabase.auth.signInWithOAuth({ provider: "google" })`. This will fail with a
"provider not enabled" error if Google is not configured in Supabase.

**External gate:** Google Cloud Console + Supabase Dashboard.

**Steps:**
1. In Google Cloud Console (console.cloud.google.com):
   - Create or select your project
   - APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorised redirect URIs: `https://oovgfknmzjcgbilwumch.supabase.co/auth/v1/callback`
   - Also add your custom domain if using one: `https://staging.propvora.com/auth/callback`
   - Save and copy **Client ID** and **Client Secret**

2. In Supabase Dashboard:
   - Go to https://supabase.com/dashboard/project/oovgfknmzjcgbilwumch/auth/providers
   - Enable **Google**
   - Paste Client ID and Client Secret
   - Save

**Risk if not done:** "Continue with Google" button fails for all users.

---

## UFX-AUTH-003 — Fix audit_logs INSERT RLS policy

~~**RESOLVED 2026-06-25:** Second query with explicit `with_check` column confirmed the `WITH CHECK` clause is already present. Policy is correctly scoped to `workspace_id IN (SELECT workspace_members.workspace_id FROM workspace_members WHERE workspace_members.user_id = auth.uid())`. No manual action required.~~

---

## UFX-AUTH-004 — Affiliate login route audit

~~**RESOLVED 2026-06-26:** Audited in session fded593c-resume. Findings:~~
- ~~Route confirmed at `src/app/(affiliate)/affiliate-login/page.tsx`~~
- ~~`window.location.assign("/affiliate")` confirmed (no router.push)~~
- ~~Google OAuth → `/auth/callback?next=/affiliate` wired; `/affiliate` in ALLOWED_REDIRECTS~~
- ~~Proxy correctly gates `/affiliate/*` → `/affiliate-login` for unauthenticated~~
- ~~Rate limiting added (FIX-563)~~
- ~~Forgot password link added (FIX-564)~~
- ~~Tested at 390×844, 768×1024, 1280px desktop~~

---

## UFX-AUTH-005 — Mobile responsive visual testing

~~**RESOLVED 2026-06-26:** Mobile testing completed in session fded593c-resume using Chrome MCP:~~
- ~~390×844: `/login` ✅, `/register` ✅ (all 3 intent cards), `/forgot-password` ✅, `/verify-2fa` ✅, `/affiliate-login` ✅~~
- ~~768×1024: `/login` ✅, `/affiliate-login` ✅ (single-column, panel hidden correctly)~~
- ~~1280px: `/affiliate-login` ✅ (split panel renders)~~
- ~~No horizontal scroll, no clipped elements, no layout breaks at any viewport~~

---

## UFX-AUTH-006 — MFA enrollment page

**Why needed:** The `/verify-2fa` page handles TOTP code entry for already-enrolled
users. There is no in-app MFA enrollment page (where a user would scan a QR code and
register their authenticator app). Without this, users cannot enable MFA unless an
admin enables it for them via the Supabase Dashboard.

**Steps for Phase 2:**
1. Create `/app/account/security/mfa` page with:
   - `supabase.auth.mfa.enroll({ factorType: "totp" })` to generate QR code
   - Display QR code image (`totp.qr_code`) + manual entry key (`totp.secret`)
   - Input for verification code
   - `supabase.auth.mfa.challenge()` + `supabase.auth.mfa.verify()` to complete enrollment
   - Store factor ID; redirect to account security page on success
2. Add "Enable two-factor authentication" button to `/app/account/security`
3. Test enroll → verify → unenroll cycle

**Risk if not done:** Users cannot self-enroll in MFA. MFA is only enforceable by
platform admin via Supabase Dashboard.
