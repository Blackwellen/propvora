# Launch Checklist

**Target:** Commercial Release
**Last Updated:** 2026-06-11

## Pre-Launch Gates

### Code Quality
- [x] `npx tsc --noEmit` returns 0 errors — ✅ 2026-06-11
- [ ] `npm run lint` returns 0 errors — pending
- [ ] `npm run build` succeeds with 0 errors — pending
- [ ] No console errors in browser
- [x] No React hydration warnings — Math.random() removed from render paths
- [ ] No unhandled promise rejections

### Security
- [ ] RLS enabled on all tables — Wave 4 audit
- [ ] No service-role key client-side — pending check
- [ ] All uploads validated (MIME, size, extension) — Wave 4
- [ ] All server actions have Zod validation — Wave 4
- [x] Auth routes protected by proxy.ts — confirmed
- [x] Admin routes have server-side guard — admin layout.tsx fixed
- [x] Portal routes have role isolation — supplier/affiliate sessions
- [ ] Stripe webhook signature verified — Wave 4
- [ ] No secrets in .env.local committed to git — pending

### Supabase
- [x] All major features wired to real data — see SUPABASE_WIRING_AUDIT.md (85%+ complete)
- [x] No hardcoded mock arrays on production screens — all replaced in Wave 1-3
- [x] Demo data tagged is_demo=true — `scripts/seed-demo.ts` created 2026-06-11
- [ ] Migrations applied and documented — pending
- [ ] Generated types up to date — pending

### Integrations
- [ ] Resend: domain verified, from address set — needs credentials
- [ ] Resend: invite + onboarding emails tested — Wave 4
- [ ] Stripe: test mode checkout end to end — Wave 4
- [ ] Stripe: webhooks receiving (ngrok/deployed) — Wave 4
- [ ] R2: bucket created, CORS configured — needs credentials
- [ ] R2: signed URL upload/download working — Wave 4
- [x] OpenStreetMap: tiles loading, no API key errors — react-leaflet installed, map wired

### UI/UX
- [x] Avatar dropdown z-index fixed — createPortal fix
- [ ] No excessive whitespace on any page — Wave 4 UI polish
- [ ] All responsive breakpoints tested — pending
- [x] All empty states implemented — done in all Waves 1-3 pages
- [x] All loading states implemented — done in all Waves 1-3 pages
- [x] All error states implemented — done in all Waves 1-3 pages
- [x] No dead buttons — all wired in Waves 1-3
- [x] No broken links/routes — fixed in Waves 1-3
- [ ] Copilot panel renders at 720px and 1100px — Wave 4

### Legal / Compliance Language
- [x] No active Section 21 actions presented — replaced throughout Work + Legal sections
- [x] Legal disclaimers on Legal module pages — possession, rra2026 have banners
- [ ] AI disclaimer on AI-powered features — Wave 4
- [x] Privacy policy up to date — /legal/privacy clean
- [x] Terms of service up to date — /legal/terms clean
- [x] Cookie policy up to date — /legal/cookies clean

### Marketing / SEO
- [x] All public pages have metadata + OG tags — home, pricing, features, contact, privacy, terms, cookies updated 2026-06-11
- [x] sitemap.xml generated — src/app/sitemap.ts created 2026-06-11
- [x] robots.txt present — src/app/robots.ts created 2026-06-11
- [x] /contact form working — created 2026-06-11
- [x] Pricing page CTAs wired — linked to /register or /contact

### CI/CD
- [x] GitHub Actions workflow: typecheck + lint + build — `.github/workflows/ci.yml` created 2026-06-11
- [ ] Preview deployments working — pending deployment setup
- [x] Environment variables documented in `.env.example` — updated 2026-06-11 (Turnstile + all integrations)

## Go/No-Go Sign-off

| Area | Owner | Status |
|------|-------|--------|
| Code quality | Engineering | 🚧 In Progress (TS 0, lint/build pending) |
| Security | Security | ⬜ Wave 4 |
| Supabase wiring | Engineering | 🚧 85% complete |
| Integrations | Engineering | ⬜ Needs credentials |
| UI/UX | Design | 🚧 Core done, polish Wave 4 |
| Legal language | Legal review | 🔧 S21 removed, disclaimers added |
| Marketing | Marketing | 🔧 Contact page, legal pages done |
