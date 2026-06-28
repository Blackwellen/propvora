# Release Evidence — Public Marketing Site
**Audit date:** 2026-06-28 · **Auditor:** Claude Code (session-fullaudit) · read-only (heavily worked by dedicated session-mktgfinal; verification only)

Pages: `/` (landing), `/about`, `/pricing`, `/features`, `/services`, `/contact`, `/faq`(→/help), `/roadmap`, `/changelog`, `/help` + PublicNav/PublicFooter. **Code-complete / clean — no blockers.**
- **Pricing:** sourced from canonical `src/lib/billing/plans.ts` → `catalog.generated.json` (Stripe), formatted via `Intl.NumberFormat` `gbp()`; no hardcoded price dupes; add-ons feature-flagged.
- **No dead controls:** all CTAs route to real pages (register/contact/features/login/pricing/help/roadmap/changelog; marketplace nav conditional on flag). Footer/legal links → real `/legal/*`.
- **Landing honesty (rule satisfied):** no fake logos/adoption stats/case studies; testimonials are clearly-labelled placeholders and NOT rendered; product images labelled "illustrative demo data"; About page explicitly disclaims invented stories.
- **Forms REAL:** contact (`submitContactRequest` → `contact_requests` + 2 emails + IP rate-limit + ref id), newsletter (`/api/newsletter/subscribe` → Turnstile CAPTCHA + double opt-in + consent + rate-limit), waitlist (`submitWaitlistEntry`, dup-safe). All via Resend.
- **SEO:** dynamic sitemap (marketplace-aware), robots (disallows app/admin/portals, allows AI crawlers), metadata + OG/Twitter on all pages, canonical URLs.
- Responsive (mobile hamburger drawer), a11y (SkipLink, labels, aria), no `dark:`, no raw currency concat.

**Decision:** Ready for release.
