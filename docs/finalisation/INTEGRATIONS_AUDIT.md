# Integrations Audit

**Last Updated:** 2026-06-11

## Resend (Email)

| Feature | Status | Notes |
|---------|--------|-------|
| ENV: RESEND_API_KEY | ⚠️ Needs key | Add to .env.local |
| ENV: RESEND_FROM_ADDRESS | ⚠️ Needs value | e.g. hello@propvora.com — defaults to hello@propvora.com |
| Centralised email utility | ✅ Done | src/lib/email.ts — wraps Resend SDK, graceful no-op |
| Workspace invite email | ✅ Done | src/lib/emails/workspace-invite.ts — wired in team page via /api/email/invite |
| Portal invite email | ⬜ Pending | Wave 4 |
| Welcome/onboarding email | ✅ Done | src/lib/emails/welcome.ts — wired in register page via /api/email/welcome |
| Password reset email | ⬜ Pending | Wave 4 — Supabase handles reset; custom template optional |
| Rent reminder email | ✅ Done | src/lib/emails/rent-reminder.ts — template ready, wire to scheduler |
| Certificate expiry email | ✅ Done | src/lib/emails/cert-expiry.ts — template ready, wire to scheduler |
| API route: /api/email/invite | ✅ Done | POST — auth-gated, builds invite URL, sends via sendEmail |
| API route: /api/email/welcome | ✅ Done | POST — called after signUp, non-blocking |
| Test send button in admin | ⬜ Pending | Wave 4 |
| Graceful no-op if not configured | ✅ Done | Logs warning and returns { error: null } when RESEND_API_KEY unset |

## Cloudflare R2 (Storage)

> **Package install required:** `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

| Feature | Status | Notes |
|---------|--------|-------|
| ENV: R2_ACCOUNT_ID | ⚠️ Needs key | Add to .env.local |
| ENV: R2_ACCESS_KEY_ID | ⚠️ Needs key | Add to .env.local |
| ENV: R2_SECRET_ACCESS_KEY | ⚠️ Needs key | Add to .env.local |
| ENV: R2_BUCKET_NAME | ⚠️ Needs value | Add to .env.local |
| Signed upload URL utility | ✅ Done | src/lib/r2.ts — generateUploadUrl (15 min presigned PUT) |
| Signed download URL utility | ✅ Done | src/lib/r2.ts — generateDownloadUrl (1 hr presigned GET) |
| deleteObject utility | ✅ Done | src/lib/r2.ts — deleteObject |
| buildKey utility | ✅ Done | src/lib/r2.ts — {workspaceId}/{folder}/{uuid}.{ext}, ext allowlist enforced |
| Upload API route | ✅ Done | POST /api/upload — auth + MIME allowlist + 10 MB size check |
| Certificates upload wired | ✅ Done | compliance/certificates/new — browser → R2 PUT; R2 key saved to file_url |
| Documents upload wired | ✅ Done | compliance/documents/new — browser → R2 PUT; R2 key saved to file_url |
| Avatars upload wired | ⬜ Pending | Wave 5 |
| Graceful fallback if not configured | ✅ Done | generateUploadUrl returns ''; /api/upload returns 503 with description |

## Stripe (Payments)

| Feature | Status | Notes |
|---------|--------|-------|
| ENV: STRIPE_SECRET_KEY | ⚠️ Needs key | Add to .env.local |
| ENV: STRIPE_WEBHOOK_SECRET | ⚠️ Needs key | Add to .env.local |
| ENV: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | ⚠️ Needs key | Add to .env.local |
| Checkout session creation | ✅ Done | POST /api/billing/checkout — accepts priceId, creates/retrieves Stripe customer, returns { url }; 503 if unconfigured |
| Customer portal | ✅ Done | POST /api/billing/portal — Stripe API version 2026-05-27.dahlia |
| subscription.created webhook | ✅ Done | Updates workspace plan, plan_status, stripe_subscription_id, stripe_customer_id |
| subscription.updated webhook | ✅ Done | Updates workspace plan and plan_status from Stripe subscription status |
| subscription.deleted webhook | ✅ Done | Resets workspace to trial / canceled |
| invoice.payment_failed webhook | ✅ Done | Sets workspace plan_status = past_due |
| Webhook signature verification | ✅ Done | Raw body via req.text(); 400 on verification failure |
| Plan reflected in workspace | ✅ Done | Webhook handler writes to workspaces.plan + plan_status via service-role admin client |
| Feature gate utility | ✅ Done | src/lib/subscription.ts — PLAN_LIMITS, canAccess(), getLimit() keyed to WorkspacePlan |
| AI Copilot feature gate | ✅ Done | Server check in (app)/layout.tsx; passes aiCopilotEnabled to AppShell; non-Pro plans see upgrade prompt |
| Stripe plan metadata mapping | ✅ Done | price.metadata.plan or price.nickname drives WorkspacePlan mapping |

## OpenStreetMap / Leaflet

| Feature | Status | Notes |
|---------|--------|-------|
| react-leaflet installed | ✅ Pass | node_modules/react-leaflet confirmed |
| leaflet installed | ✅ Pass | node_modules/leaflet confirmed |
| PropertyMap.tsx created | ✅ Pass | src/components/maps/PropertyMap.tsx |
| PropertyMapInner.tsx (SSR-safe) | ✅ Pass | Dynamic import, no SSR |
| Portfolio map view | ✅ Pass | LeafletMap wired to properties table |
| Property detail map tab | 🔧 Fixed | Map tab stub added with link |
| Work job location | ⬜ Pending | Wave 4 |
| Geocoding utility | ⬜ Pending | Wave 4 |
| Geocoding cache in Supabase | ⬜ Pending | Wave 4 |
| Graceful no-location fallback | ✅ Pass | Empty state shown when no lat/lng |

## Cloudflare Turnstile (Bot Protection)

| Feature | Status | Notes |
|---------|--------|-------|
| ENV: NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY | ⚠️ Needs key | Optional — skip in dev |
| ENV: CF_TURNSTILE_SECRET_KEY | ⚠️ Needs key | Optional — skip in dev |
| Signup form | ⬜ Pending | Wave 4 (optional) |
| Login form | ⬜ Pending | Wave 4 (optional) |
| Contact form | ⬜ Pending | Wave 4 (optional) |
| Graceful disabled state in dev | ⬜ Pending | Wave 4 — skip if key not set |
