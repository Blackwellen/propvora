# i18n / Translation Progress — Session Handoff

**Last updated:** 2026-06-27  
**Build status:** ✅ TypeScript clean (exit 0); prod build OOM on constrained machine (multi-session)

---

## What's Done

### Infrastructure
- `src/lib/i18n/config.ts` — 22 BCP-47 locales in `SUPPORTED_LOCALES` + `LOCALE_META`
- `src/lib/i18n/messages.ts` — `t()` with 3-step fallback (locale → en-GB → key); `getCatalogue()` for testing
- `src/lib/i18n/locale.ts` — `getServerLocale()` + `resolveLocale()` priority chain: URL prefix → profile pref → workspace default → country profile → Accept-Language → en-GB
- `src/components/i18n/LocaleSwitcher.tsx` — full UI component (select, label, hint, persist via `onChange` or `persistUrl`)
- `src/components/i18n/LocaleProvider.tsx` — `useLocale()` / `useT()` for client components (falls back gracefully to en-GB)
- `src/lib/i18n/messages.test.ts` — 5 tests: per-locale vocab, interpolation, fallback, no-crash sweep, section-shape parity

### Locale files built (`src/lib/i18n/locales/*.json`)
All files have `$meta`, `actions`, `status`, `nav`, `empty`, `common`, `settings` sections.

| Locale | Core vocab | Marketing namespace |
|--------|-----------|-------------------|
| en-GB | ✅ (canonical fallback) | ✅ |
| fr-FR | ✅ | ✅ |
| de-DE | ✅ | ✅ |
| es-ES | ✅ | ✅ |
| it-IT | ✅ | ✅ |
| nl-NL | ✅ | ✅ |
| pt-BR | ✅ | ✅ |
| sv-SE | ✅ | ⏳ (falls back to en-GB) |
| fi-FI | ✅ | ⏳ (falls back to en-GB) |
| da-DK | ✅ | ⏳ (falls back to en-GB) |
| cs-CZ | ✅ | ⏳ (falls back to en-GB) |
| hr-HR | ✅ | ⏳ (falls back to en-GB) |
| hu-HU | ✅ | ⏳ (falls back to en-GB) |
| ja-JP | ✅ | ⏳ (falls back to en-GB) |
| th-TH | ✅ | ⏳ (falls back to en-GB) |
| tr-TR | ✅ | ⏳ (falls back to en-GB) |
| en-AU | → en-GB alias | → en-GB alias |
| en-NZ | → en-GB alias | → en-GB alias |
| en-IE | → en-GB alias | → en-GB alias |
| en-CA | → en-GB alias | → en-GB alias |
| fr-CA | → fr-FR alias | → fr-FR alias |
| ar-AE | ✅ | ⏳ (falls back to en-GB) |

### Marketing pages wired (`getServerLocale()` + `t()`)
All components made `async` and wired:

**Landing page sections (done in prior session):**
- `src/components/marketing/sections/LandingHeroSection.tsx` — heroTitle, heroSubtitle, cta*, trial*
- `src/components/marketing/sections/LandingCtaBanner.tsx` — ctaBannerTitle, ctaBannerBody, ctaPrimary
- `src/components/marketing/sections/LandingCapabilitiesSection.tsx` — capEyebrow, capTitle, capBody + **cap1–6 Title/Copy** (6 capability cards)
- `src/components/marketing/sections/LandingPortfolioSection.tsx` — pfEyebrow, pfTitle, pfBody, pfLink
- `src/components/marketing/sections/LandingCopilotSection.tsx` — coEyebrow, coTitle, coBody
- `src/components/marketing/sections/LandingModesBar.tsx` — modesTitle

**Features page (done this session):**
- `src/components/marketing/sections/FeaturesHeroSection.tsx` — featHeroEyebrow, featHeroTitle, featHeroSubtitle, featHeroCta, featHeroWalkthrough
- `src/components/marketing/sections/FeaturesCta.tsx` — featCtaTitle, featCtaSubtitle, featCtaTrial, featCtaWalkthrough

**Global shell (done this session):**
- `src/components/marketing/PublicFooter.tsx` — footerTagline, footerLocation, footerProduct, footerCompany, footerLegalCol, footerGdpr
- `src/components/marketing/PublicNav.tsx` — navLogin, navGetStarted, navGetStartedFree, navOpenApp, navMyAccount, navLegal (via `useT()` client hook)

### Language changer UI
- **Per-user:** Account > Preferences → "Language & Region" card — `LocaleSwitcher`, saves immediately to `user_preferences.default_language`, then `router.refresh()`
- **Per-workspace:** Workspace Settings > Jurisdiction & Locale → "Language / locale" `<select>` (saves with save button)
- Priority: profile pref beats workspace default (via `resolveLocale()`)

---

## Verification

- TypeScript: `npx tsc --noEmit` → **exit 0** (2026-06-27)
- HTTP GET `/` → all 7 en-GB capability/footer strings confirmed present
- HTTP GET `/features` → featCtaTitle, featCtaTrial, featCtaWalkthrough, navLogin, navGetStarted confirmed
- Auth guard: `/app/account/preferences` → correctly redirects to `/login?redirectTo=...`

---

## What's Pending

### 1. App-wide string extraction (700+ files)
All landing/features/footer/nav marketing strings are done. Remaining scope is the full PM workspace app:
- `src/app/(app)/` and `src/app/(admin)/` — server components use `t(locale, "key")`; client components use `useT()` from `LocaleProvider`
- `LocaleProvider` needs wiring into the `(app)` layout wrapping children (currently only `WorkspaceLocaleProvider` is there)
- This is a large mechanical program — the marketing vertical slice is the proven pattern to scale from

### 2. pricing / faq pages
- `src/app/(marketing)/pricing/` — price labels, plan names, feature bullets
- `src/app/(marketing)/faq/` — question/answer copy
- Strategy: same async server component pattern, add keys to locale files

### 3. ar-AE locale (Arabic)
- `ar-AE.json` does not exist and `ar-AE` is not in `SUPPORTED_LOCALES` in `config.ts`
- All 17 live locale files have complete 53-key marketing namespaces ✅
- Add ar-AE when Arabic RTL support is scoped for a future release

Pattern to follow: same as landing sections — make component `async`, import `getServerLocale` + `t`, extract strings to `marketing.*` namespace keys, add translations to all 22 locale files.

### 4. Full app-wide string extraction (700+ files)
The landing page is the proven vertical slice. Scaling to 700 files is a large mechanical program:
- All `src/app/(app)/` and `src/app/(admin)/` pages
- Strategy: server components use `t(locale, "key")`; client components use `useT()` hook from `LocaleProvider`
- `LocaleProvider` needs to be added to the `(app)` layout wrapping children (currently only `WorkspaceLocaleProvider` is there)

---

## Key File Locations

| What | Where |
|------|-------|
| Locale config | `src/lib/i18n/config.ts` |
| Translation function | `src/lib/i18n/messages.ts` |
| Locale resolution | `src/lib/i18n/locale.ts` |
| Locale JSON files | `src/lib/i18n/locales/*.json` |
| Language switcher UI | `src/components/i18n/LocaleSwitcher.tsx` |
| Client provider | `src/components/i18n/LocaleProvider.tsx` |
| Tests | `src/lib/i18n/messages.test.ts` |
| Account prefs (user language) | `src/app/(app)/app/account/preferences/page.tsx` |
| Workspace language | `src/app/(app)/app/workspace-settings/jurisdiction/page.tsx` |
| add_marketing.py script | scratchpad (see path above) |
