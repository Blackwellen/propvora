# Manual actions — Settings ▸ Account Settings (Section 9)

All code, data and schema fixes for this section were applied directly (PAT migration + code).
The items below require external dashboard access Claude Code cannot perform.

## 1. Enable OAuth providers for Login Methods / Connected Accounts (external — Supabase dashboard)

**Why Claude Code can't do it:** Enabling Google/Apple sign-in requires creating OAuth apps in the
Google Cloud / Apple Developer consoles and pasting client id/secret into the Supabase Auth dashboard,
plus toggling **Manual linking** (Authentication ▸ Providers / Settings). These are browser-auth'd
external consoles, not reachable via the Supabase Management API PAT.

**Exact steps:**
1. Supabase dashboard → project `oovgfknmzjcgbilwumch` → **Authentication ▸ Providers**.
2. Enable **Google** (and optionally **Apple**); paste the OAuth client id + secret from the provider console.
3. Authentication ▸ **Sign In / Up** (or URL config) → enable **Manual linking** so `linkIdentity` works.
4. Add the redirect URL `https://<your-domain>/property-manager/account/connected-accounts`
   (and the localhost equivalent for dev) to the provider's allowed redirect URIs.

**Until then:** the Connect / Add-Google buttons are wired and call `linkIdentity`, but show a clear inline
message ("… isn't configured for this workspace yet"). No broken UI — graceful degradation only.

## 2. (Optional) Confirm Supabase MFA add-on

The Security page TOTP enrol/verify/disable flow is fully wired. If `mfa.listFactors()` returns an error
(MFA not enabled on the project) the page shows an honest "MFA not enabled for this project" note instead
of a broken control. Enable MFA in **Authentication ▸ Multi-Factor** if you want 2FA available to users.

## 3. (Resolved) Login Methods / Connected Accounts screenshots — captured

Both pages were visually verified live and screenshotted at 1440px (plus Profile at 390px mobile):
`release-gated/docs/screenshots/section9-login-methods-1440.jpeg`,
`section9-connected-accounts-1440.jpeg`, `section9-account-overview-1440.jpeg`,
`section9-profile-mobile-390.jpeg`. Connected Accounts correctly shows the live Google identity as
"Connected as jamahlthomas1996@gmail.com". No action required.
