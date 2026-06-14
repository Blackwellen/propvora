# Propvora — Manual Tasks for Owner (external/founder actions)

Everything below needs **you** (keys, provider dashboards, DNS, legal) — agents have built and
documented the code side; these can't be self-performed. Each links to its setup doc.

## Stripe
- [ ] Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Vercel (prod + preview = test keys).
- [ ] Add the production webhook endpoint → `https://propvora.com/api/webhooks/stripe`; subscribe to the events the handler covers (subscription.*, invoice.*, checkout.session.completed, payment_intent.*, charge.dispute.created, account.updated).
- [ ] **Stripe Connect** (owners' own accounts) — enable Connect (Standard) in the dashboard, then set `NEXT_PUBLIC_FF_STRIPE_CONNECT=true`. Full steps + acceptance: `docs/release/stripe-connect-setup.md`.
- [ ] Confirm pricing page ↔ Stripe product/price catalog parity (catalog built by `scripts/stripe-setup-catalog.mjs`).

## Cloudflare / Turnstile / WAF
- [ ] Configure Cloudflare per `docs/release/cloudflare-production-setup.md` (SSL Full-strict, HSTS, Bot Fight, WAF, rate-limit rules).
- [ ] Create Turnstile keys → set `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; newsletter + public forms auto-enable the widget when present.

## Resend (email)
- [ ] Verify sending domain (SPF, DKIM, DMARC) per `docs/compliance/subprocessor-register.md` + the email guide. Set `RESEND_API_KEY` + from-addresses.

## Supabase
- [ ] Confirm project region (UK/EU) for data residency; document.
- [ ] Enable the **MFA add-on** so TOTP enrolment is available (account security page degrades gracefully until then).
- [ ] Backups: confirm plan-level PITR/backups; run a restore test (`docs/release/disaster-recovery-plan.md`).
- [ ] Apply any new migrations on deploy: `supabase/migrations/2026061300000{1..8}*.sql` (all already applied to the live project this session — re-confirm in prod).

## Cloudflare R2 (storage)
- [ ] Confirm bucket(s) + region; keys `R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET`.

## HMRC / MTD
- [ ] HMRC developer app (sandbox first), OAuth credentials + redirect URIs; keep feature-flagged OFF until tested. (Code scaffold pending — P11.)

## Vercel
- [ ] Env matrix per `docs/release/vercel-production-readiness.md`; confirm prod domain `propvora.com`, SSL, `NEXT_PUBLIC_SITE_URL=https://propvora.com` (currently localhost in env).
- [ ] Set `MAINTENANCE_MODE` toggle availability; `ACCOUNT_ERASURE_ENABLED=false` until erasure go-live.

## Legal / compliance
- [ ] Have a qualified data-protection adviser review the `docs/compliance/` pack before relying on it externally.
- [ ] Commission the external pen-test per `docs/release/external-pentest-brief.md`.

## SEO
- [ ] Confirm `NEXT_PUBLIC_MAPS_API_KEY` (if used) is domain-restricted in Google Cloud Console.
- [ ] Submit `sitemap.xml` in Google Search Console once the domain is live.
