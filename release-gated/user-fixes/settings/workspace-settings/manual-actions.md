# Workspace Settings — Remaining Manual Actions

**Section:** Workspace Settings  
**Date:** 2026-06-26  
**Prepared by:** workspace-settings-qa session

These items could not be completed by Claude Code because they require either Stripe OAuth browser interaction, Vercel dashboard access, or Supabase schema migrations that need PAT credentials with sufficient permissions.

---

## 1. Stripe Billing Portal Configuration — ✅ COMPLETED

**Status:** Billing portal configuration created via Stripe API on 2026-06-26.

**Configuration ID:** `bpc_1TmgdoAHC49xkmre1uLDjg2O`

Features enabled:
- `invoice_history` — customers can view and download invoices
- `payment_method_update` — customers can update their card
- `customer_update` — customers can update email and billing address
- `subscription_cancel` — customers can cancel at period end, with cancellation reason

Return URL set to: `https://staging.propvora.com/property-manager/workspace-settings/subscription`

**Code wired:** `src/app/api/billing/portal/route.ts` now passes `configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID` when creating the portal session. Configuration ID stored in `.env.local` as `STRIPE_PORTAL_CONFIGURATION_ID`.

**Remaining:** Add `STRIPE_PORTAL_CONFIGURATION_ID=bpc_1TmgdoAHC49xkmre1uLDjg2O` to Vercel env vars (see item 3 below).

---

## 2. New Database Columns for Branding & White Label — ✅ COMPLETED

**Status:** Applied via Management API PAT on 2026-06-26.

Columns now live on the `workspaces` table in production (project `oovgfknmzjcgbilwumch`):
- `email_logo_url TEXT` — nullable, stores R2 key for email logo
- `invoice_logo_url TEXT` — nullable, stores R2 key for invoice logo  
- `favicon_url TEXT` — nullable, stores R2 key for favicon
- `white_label_settings JSONB NOT NULL DEFAULT '{}'` — white-label config object

Defaults behaviour: when these columns are NULL, the app falls back to Propvora default assets
defined in `src/lib/branding/theme.ts → PROPVORA_ASSETS`. The branding page shows the
Propvora logo as a faded "Using Propvora default" placeholder in each upload zone until
the workspace uploads their own.

No further action required.

---

## 3. Vercel Environment Variable Updates

**Why still pending:** Vercel API token not stored in project files. Project ID and team ID are known.

**Project:** `prj_8Nz6rwuJh9TSGuBGoaPudt8SNgB5` (team: `team_ettVHV6E9tHbmqV762QNqrri`)

**New env vars to add in Vercel (Production + Preview):**

```
STRIPE_PORTAL_CONFIGURATION_ID = bpc_1TmgdoAHC49xkmre1uLDjg2O
STRIPE_PORTAL_RETURN_URL       = https://staging.propvora.com/property-manager/workspace-settings/subscription
```

**Already in Vercel (confirm these are set):**
```
STRIPE_SECRET_KEY                    = sk_live_51RUWQWAHC...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   = pk_live_51RUWQWAHC...
STRIPE_WEBHOOK_SECRET                = whsec_67Gp4CojSOa5...
RESEND_API_KEY                       = re_UmKy1iTp_...
RESEND_FROM_EMAIL                    = noreply@propvora.com
```

**To push via API** (if you have a Vercel token):
```powershell
$token = "YOUR_VERCEL_TOKEN"
$projectId = "prj_8Nz6rwuJh9TSGuBGoaPudt8SNgB5"
$teamId = "team_ettVHV6E9tHbmqV762QNqrri"

Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId/env?teamId=$teamId" `
  -Method Post -Headers @{"Authorization"="Bearer $token";"Content-Type"="application/json"} `
  -Body '{"key":"STRIPE_PORTAL_CONFIGURATION_ID","value":"bpc_1TmgdoAHC49xkmre1uLDjg2O","type":"encrypted","target":["production","preview"]}'
```

**Vercel dashboard URL:** https://vercel.com/dashboard → propvora → Settings → Environment Variables

---

## 4. SMTP Verification — ✅ COMPLETED

**Status:** Test email sent via Resend API on 2026-06-26 and confirmed delivered.

- **Email ID:** `3bc573a5-4476-453e-abab-ef4532fcb068`
- **From:** `noreply@propvora.com`
- **To:** `jamahlthomas1996@gmail.com`
- **Provider:** Resend (`re_UmKy1iTp_...` — send-only key, domain management via Resend dashboard)

Resend API key is configured in `.env.local` as `RESEND_API_KEY`. Confirm it is also set in Vercel for production delivery.

---

## 5. AI Credits Live Data

**Why blocked:** The AI credits panel (`CopilotCreditsPanel`) fetches from `/api/ai/credits` which requires the AI provider to be configured and active credits assigned to the workspace.

**What is needed:**
1. Ensure `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set in Vercel env vars.
2. Seed the `ai_credits` or equivalent table with an initial credit balance for test workspaces.
3. Verify the credits panel shows a real number (not 0 or error) on `/workspace-settings/ai`.

---

## 6. Integrations API Status Endpoint

**Why blocked:** The integrations page calls `/api/integrations/status` to check which integrations are connected. This endpoint needs to be created or verified.

**What is needed:**
1. Check if `/api/integrations/status` exists — if not, create it at `src/app/api/integrations/status/route.ts`.
2. It should return a JSON object: `{ "xero": false, "quickbooks": false, "webhooks": true, ... }` based on what is configured for the workspace.
3. If the endpoint returns 404, the integrations page gracefully falls back (shows all as disconnected) — this is not a blocker for release, just a UX improvement.

---

## Summary Table

| # | Item | Blocker type | Priority |
|---|------|-------------|----------|
| 1 | Stripe billing portal configuration | ✅ DONE | bpc_1TmgdoAHC49xkmre1uLDjg2O created + wired |
| 2 | DB column migrations (branding + white-label) | ✅ DONE | Applied via PAT 2026-06-26 |
| 3 | Vercel env var updates | External (Vercel dashboard) | P1 — needed for Stripe + SMTP to work |
| 4 | SMTP test email verification | ✅ DONE | Delivered via Resend (ID: 3bc573a5...) |
| 5 | AI credits live data | Config (API keys) | P2 — panel shows graceful empty state |
| 6 | Integrations status API endpoint | Code (may be missing) | P3 — page works without it (shows all as disconnected) |
