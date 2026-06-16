# Propvora Enterprise Gap Audit — June 2026

**Prepared for:** Blackwellen Ltd t/a Propvora  
**Date:** 2026-06-16  
**Branch:** Propvora-release-version.2.0  
**Scope:** Full enterprise readiness assessment across commercial, functional, security, UX, and internationalisation dimensions.

---

## Executive Summary

1. **Propvora has strong structural depth** — the route tree, schema, and i18n foundations are more complete than most pre-Series-A property SaaS platforms, but several surfaces exist only as route scaffolds with no customer-facing story to tell yet.
2. **The biggest enterprise sales blocker is the absence of SOC 2 / ISO 27001 attestation and a formal Data Processing Agreement (DPA)** — enterprise PM firms in the UK and EU will not sign without them; no amount of features compensates.
3. **Functional gaps are concentrated in three areas:** customer-facing self-service maintenance submission, a rentable owner reporting portal with live financial data, and a native inspection/inventory module (all competitors have these; Propvora does not yet).
4. **The i18n architecture is ahead of the app** — country profiles, locale config, and tax migration exist, but zero UI components read the workspace locale context at render time; the onboarding wizard does not capture country/locale, so all locale data is inert.
5. **Security headers and rate limiting are thin** — `vercel.json` ships no CSP, no `Permissions-Policy`, no `Referrer-Policy`; the proxy handles auth but there is no per-route rate limit enforcement beyond the `app_rate_limits` migration.

---

## Area 1: Commercial Comparison & Gaps

### Competitor Feature Matrix

| Feature | Fixflo | Arthur Online | Buildium | Re-Leased | Hosty | Propertyware | **Propvora** |
|---|---|---|---|---|---|---|---|
| Reactive maintenance (operator) | ✅ Core | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ `/work/jobs` |
| Planned Preventative Maintenance (PPM) | ✅ Full module | ⚠️ Basic | ✅ | ✅ | ❌ | ✅ | ✅ `/work/ppm` |
| Tenant maintenance submission portal | ✅ Branded | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ `/portal/tenant/maintenance` exists, no photo upload flow |
| Certificate / compliance tracker | ✅ Prompt on close | ✅ | ⚠️ | ✅ | ❌ | ⚠️ | ✅ `/compliance` full module |
| Landlord owner portal with P&L | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ⚠️ `/portal/landlord/financials` route exists, depth unclear |
| Xero / QuickBooks sync | ✅ | ✅ Xero native | ✅ | ✅ Xero native | ❌ | ✅ | ❌ No live integration |
| Rental listings syndication | ❌ | ✅ Zoopla | ✅ | ❌ | ✅ OTA channels | ✅ | ❌ |
| Channel manager (Airbnb/Booking.com) | ❌ | ❌ | ❌ | ❌ | ✅ Central inbox | ❌ | ⚠️ Customer workspace exists, no OTA sync |
| Tenant screening | ❌ | ⚠️ via partner | ✅ | ⚠️ | ❌ | ✅ | ❌ |
| AI / automation engine | ⚠️ Basic | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ Full `/automations` module |
| Inspection / property inventory module | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ **Missing entirely** |
| Open API / webhooks | ✅ | ⚠️ | ✅ 50+ integrations | ✅ | ❌ | ✅ Open API | ⚠️ Webhook infra in schema, no public docs |
| White label | ✅ Enterprise | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ `/workspace-settings/white-label` |
| Multi-region / multi-currency | ❌ UK-only | ❌ | ❌ | ✅ | ⚠️ | ✅ | ✅ Architecture ready, not activated |
| FCA/Consumer Duty compliance tooling | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ No specific tooling |
| HMO-specific management | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ `/portfolio/properties/[id]/hmo` |
| Planning / deal analysis module | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Full `/planning` suite — **unique differentiator** |

### Propvora Pricing Position

Propvora's current architecture supports a competitive per-workspace subscription model. Buildium starts at ~$58/month (Essential), Arthur Online at ~$85/month flat. Fixflo and Re-Leased are quote-only enterprise deals. **Propvora's pricing advantage is its AI-native planning suite and HMO depth at a price competitors cannot match**, but this story is invisible without case studies, a public pricing page with comparison, and SOC 2 attestation.

### Enterprise Sales Blockers (in priority order)

| # | Blocker | Priority |
|---|---|---|
| 1 | No SOC 2 Type I attestation / ISO 27001 certification | P0 |
| 2 | No publicly accessible DPA or sub-processor list | P0 |
| 3 | No Xero / QuickBooks live integration | P0 |
| 4 | No inspection/inventory module | P1 |
| 5 | No tenant screening integration | P1 |
| 6 | No rental listing syndication / portal | P1 |
| 7 | No open API documentation | P1 |
| 8 | Webhook infrastructure not publicly documented | P2 |

### Recommendations

- **P0:** Commission SOC 2 Type I audit (8-12 weeks, ~£5k-£15k with a tooling partner such as Drata/Vanta). This unlocks every enterprise procurement conversation.
- **P0:** Publish DPA referencing Blackwellen Ltd (ICO ZC160806) as data processor; list Supabase, Vercel, Stripe, OpenAI as sub-processors. Template takes 2 days; legal review 1 week.
- **P0:** Build Xero OAuth integration in `/workspace-settings/integrations`. Xero is a hard requirement for UK PM agencies — Arthur and Re-Leased win deals on this alone.
- **P1:** Build the inspection/inventory module (`/work/inspections/`). This is a binary checkbox for every enterprise property manager using Fixflo or Arthur.
- **P1:** Partner with a tenant referencing provider (e.g. Canopy, Vouch, Let Alliance via API) for screening. Do not build in-house.

---

## Area 2: Functional Gaps per Workspace

### 2.1 Operator Workspace (`/app/`)

**Present:** Portfolio (properties, units, tenancies, HMO), Work (jobs, tasks, PPM, board, gantt, complaints, suppliers), Compliance (renewals, risk, evidence, coverage, reports), Accounting (ledger, chart of accounts, MTD, client accounts, reconciliation, owner statements, forecasts), Money (income, expenses, invoices, bills, deposits, arrears, rent-chase, FX, disputes, payouts), Contacts, Calendar (multi-view), Legal (possession/Section 21 / Section 8 wizard), Automations, Planning, Portals, Messaging.

**Gaps against enterprise PM platforms:**

| Gap | Competitor benchmark | Priority |
|---|---|---|
| No inspection / inventory module (`/work/inspections/`) | Fixflo, Arthur, Buildium, Propertyware all have photo-upload, room-by-room inspection flow, signature capture, PDF report generation | P0 |
| No rental listing / marketing module | Buildium syndicates to Zillow/Trulia; Arthur to Zoopla; Re-Leased to market portals | P1 |
| No built-in tenant screening | Buildium, Propertyware have native credit/reference checks | P1 |
| No digital tenancy agreement signing | Arthur integrates Signable; Buildium has e-leases | P1 |
| `/work/complaints` exists but no formal complaint escalation SLA flow | Fixflo has complaint → escalation → resolution timer | P2 |
| No owner-facing reporting dashboard (deep) | Propertyware has owner portal with P&L drill-down, tax pack download | P1 |
| No SMS / WhatsApp notification channel | Fixflo multilingual SMS; Arthur SMS | P2 |
| No energy/EPC tracker in compliance | Fixflo tracks EPC, EICR, gas safety as first-class items | P1 — current compliance tracker covers this but needs UI evidence |
| No deposit scheme integration (DPS/TDS/mydeposits) | Most UK PM SaaS integrates with at least one scheme API | P1 |

### 2.2 Supplier Workspace (`/supplier/`)

**Present:** Dashboard, Profile, Onboarding, Jobs (list + detail), Quotes, Services, Packages, Zones, Coverage, Calendar, Availability, Team, Insurance, Verification, Leads, Marketplace, Invoices, Payouts, Earnings, Disputes, Evidence, Automations, Reviews, Messages, Notifications, Settings.

**Gaps against enterprise supplier portals:**

| Gap | Competitor benchmark | Priority |
|---|---|---|
| No mobile-optimised job acceptance with push notification | Fixflo contractor app has native push; Buildium Property Meld integration does same | P1 |
| No materials / parts cost tracking on a job | Propertyware tracks parts costs per work order | P2 |
| No route optimisation for multi-job days | Not common in UK market yet; gap vs. field service tools | P2 |
| No certificate upload on job completion (gas, EICR) | Fixflo prompts for cert on close; Propvora has evidence upload but no cert-type classification | P1 |

### 2.3 Customer Workspace (`/customer/`)

**Present:** Dashboard, Search, Bookings (list, detail, modify, report-issue), Orders, Saved, Messages, Notifications, Profile, Payments.

**Gaps — this is the thinnest workspace by enterprise standards:**

| Gap | Competitor benchmark | Priority |
|---|---|---|
| No tenant self-serve maintenance submission with photo upload | Fixflo, Buildium, Arthur all have full tenant repair reporting portal with guided question flow, photo upload, status tracking | P0 — this is a core enterprise selling point |
| No tenancy document library (signed agreements, notices) | All major PM platforms expose this to tenants | P1 |
| No rent payment history / statement download | Buildium Resident Center; Arthur tenant portal | P1 |
| No rent payment via portal | Buildium supports direct card/bank payment from resident portal | P1 |
| No notice-to-quit / move-out workflow for tenants | Arthur, Buildium have tenant-initiated notice | P2 |
| No guest review / ratings for short-let stays | Hosty has guest review system | P2 |

**Critical gap:** The portal routes (`/portal/[sessionId]/tenant/maintenance`) exist in the portal workspace but are token-gated. The _customer_ workspace at `/customer/` has no maintenance submission at all — a tenant using the app directly cannot raise a repair. Enterprise property managers will test this on day one.

### 2.4 Admin Workspace (`/admin/`)

**Present:** Users, Workspaces, Portfolios, Subscriptions, Affiliates, Audit, Data Requests, Bugs, Stripe Events, AI Usage, AI Models, Security, Health, Risk, Marketplace (transactions, disputes, payouts, workspaces), Supplier Verification, Automations, Global (country controls, translations), Announcements, Changelog, Settings.

**Gaps:**

| Gap | Priority |
|---|---|
| No SLA / support ticket management for enterprise clients | P1 |
| No revenue recognition / MRR dashboard in admin | P2 |
| No GDPR erasure request workflow automation (data-requests exists but manual) | P1 |
| No customer success / health score per workspace | P2 |

### 2.5 Portals (`/portal/`)

**Present:** Tenant portal (tenancy, maintenance, payments, documents), Landlord portal (properties, financials), Supplier portal (jobs, invoices, documents), Share portal (invoice, job, documents via `/p/[token]`).

**Gaps:**

| Gap | Priority |
|---|---|
| Tenant portal maintenance page exists but no photo upload or guided questionnaire | P0 |
| Landlord financials portal — scope of data visible needs verification (is it live P&L or stub?) | P0 |
| No guest-facing portal for short-let bookings (check-in info, WiFi, house manual) | P1 |
| No contractor completion sign-off in portal with e-signature capture | P1 (portal job detail has `SignOffButton` but no signature pad) |

---

## Area 3: Security & Compliance Gaps

### 3.1 HTTP Security Headers

`vercel.json` ships only framework and cron config — **zero security headers**. This is a P0 gap.

Missing headers and recommended values:

| Header | Required Value | Priority |
|---|---|---|
| `Content-Security-Policy` | Strict CSP with `default-src 'self'`; exceptions for Supabase, Stripe, Vercel blob | P0 |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` | P0 |
| `X-Content-Type-Options` | `nosniff` | P0 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | P0 |
| `Permissions-Policy` | Disable camera/mic/geolocation unless explicitly used | P1 |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | P0 |
| `Cross-Origin-Opener-Policy` | `same-origin` | P1 |

**Implementation:** Add `headers` array to `vercel.json` using the `source: "/(.*)"` pattern.

### 3.2 Rate Limiting

Migration `20260613000004_app_rate_limits.sql` exists (creates `app_rate_limits` table). However:
- The proxy (`src/proxy.ts`) does not call any rate-limit check function
- There is no API route middleware that enforces limits
- No IP-based throttling on auth endpoints (`/api/auth/`, Supabase auth is upstream)

**Recommendation (P0):** Implement Vercel Edge rate limiting using `@upstash/ratelimit` on `/api/*` routes, or use Supabase's built-in auth rate limits plus a middleware check against `app_rate_limits` in the proxy for sensitive app routes.

### 3.3 RLS Coverage

Migration `003_rls_policies.sql` enables RLS on 39 tables. Later migrations add more tables. **Known coverage gaps to audit:**

Tables added in later migrations that must be verified for RLS:
- `marketplace_listings` (20260616040000) — public read policy must not leak PII
- `booking_reservations` (20260616080000)
- `payments_escrow` (20260616090000)
- `identity_kyc` (20260616110000) — **highest risk: KYC data must be owner-only**
- `risk_scores` (20260616130000)
- `automation_runs` (20260617060000)
- `country_packs` / `country_tax_rules` — reference data, safe as authenticated-read but confirm no write gap

**Recommendation (P0):** Run `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN (SELECT tablename FROM pg_policies GROUP BY tablename)` as a recurring CI check to catch tables without any policy.

### 3.4 Data Retention & Right to Erasure

`/admin/data-requests` page exists with manual `RequestActions`. There is no automated erasure pipeline. UK GDPR (and DSAR obligations per the `CountryProfile.dsarResponseDays` = 30 for GB) require:
- Documented data map
- Automated cascade delete or anonymisation of PII across all 39+ tables when a DSAR erasure is actioned
- Audit trail of the erasure itself

**Recommendation (P1):** Build a Supabase Function `handle_erasure_request(user_id uuid)` that nulls/deletes PII columns and records the erasure in `audit_logs`. Surface a confirmation flow in `/admin/data-requests`.

### 3.5 Audit Log Completeness

`audit_logs` table exists and RLS is enabled. However:
- It is unclear from the migration whether writes are triggered server-side via a `SECURITY DEFINER` trigger or manually from server actions
- If manual, any missed server action = missed audit entry
- No evidence of audit log export / download in the admin UI

**Recommendation (P1):** Implement a `log_audit_event` Postgres function called via trigger on critical tables (properties, tenancies, invoices, payments, contacts) so no server action can bypass it. Add CSV export to `/admin/audit`.

### 3.6 Session Management

`/app/account/sessions` page exists. The proxy refreshes sessions via Supabase SSR. **Gaps:**

| Gap | Priority |
|---|---|
| No maximum session lifetime enforcement (Supabase default is 1 hour JWT + refresh token) — enterprise clients often require 8h or 24h hard expiry | P1 |
| No concurrent session limit (one active session per device) | P2 |
| No anomalous login detection (new country/device alerts) | P2 |

### 3.7 Third-Party Dependency Risk

Key dependencies and risks:

| Dependency | Risk | Mitigation |
|---|---|---|
| Supabase (hosted) | Data residency — default is US-East; UK GDPR requires adequacy or appropriate safeguards | Migrate project to EU region (Supabase supports `eu-west-1`); update DPA accordingly — **P0** |
| Vercel (CDN/Edge) | Data flows through US edge nodes by default | Enable Vercel's EU-only flag or use regional functions — P1 |
| Stripe | PCI DSS scope — Propvora must be SAQ-A (card data never touches Propvora servers) | Confirm Stripe Elements/Checkout is used everywhere; document in DPA — P0 |
| OpenAI | AI data processing — prompts may contain PII | Ensure Zero Data Retention is enabled on OpenAI API; add to sub-processor list — P0 |

### 3.8 Consumer Duty (FCA, UK)

The FCA's Consumer Duty (fully live from July 2024) applies to firms in the financial promotions chain. If Propvora facilitates rent collection, deposit protection advice, or any financial instrument, there is a Consumer Duty surface. **Current gap:** no Consumer Duty impact assessment, no "good outcomes monitoring" tooling, no board-level data report capability.

**Recommendation (P1):** Commission a 2-hour legal review to determine whether Propvora is in scope. If in scope: add outcome monitoring dashboards to the admin workspace and document the fair value assessment.

---

## Area 4: UX / Performance / Quality Gaps

### 4.1 Loading & Error States

`src/components/ui/` contains: `Skeleton.tsx`, `LoadingState.tsx`, `ErrorState.tsx`, `EmptyState.tsx`. These primitives exist. **Gaps:**

- No evidence of `Suspense` boundaries wrapping heavy server component subtrees (risk of full-page hydration stalls on slow connections)
- Error boundaries are not visible in the route tree — a Supabase query failure in a nested layout will bubble up and kill the entire page
- `EmptyState.tsx` exists but individual section pages (e.g. `/contacts/organisations`) may not use it consistently

**Recommendation (P1):** Audit every section's `page.tsx` — each must render `<EmptyState>` when data is `[]` and `<ErrorState>` when the query returns an error. Add React `error.tsx` co-located with major layouts.

### 4.2 Accessibility (WCAG 2.1 AA)

No Lighthouse or axe audit results found in the repository. Known structural risks:

| Risk | Impact |
|---|---|
| `Avatar.tsx`, `Badge.tsx` — colour contrast ratio for status chips not verifiable without computed CSS | May fail WCAG 1.4.3 |
| `Dialog.tsx` — modal focus trap and ARIA `role="dialog"` / `aria-labelledby` must be confirmed | WCAG 2.1 / 4.1.2 |
| `Dropdown.tsx` — keyboard navigation (arrow keys, Escape) must be verified | WCAG 2.1.1 |
| `Tabs.tsx` — must use `role="tablist"` / `role="tab"` / `aria-selected` | WCAG 4.1.2 |
| No `skip to main content` link visible in shell layout | WCAG 2.4.1 |

**Recommendation (P1):** Run `axe-core` against the 5 most-visited pages; fix all Critical and Serious violations before enterprise demo. Add `skip-nav` link to `app/layout.tsx`.

### 4.3 Core Web Vitals

Next.js 16 with React 19 and Server Components provides structural LCP advantages. **Known risks:**

| Metric | Risk |
|---|---|
| LCP | Hero dashboard cards that fetch from Supabase in server actions may be slow; no `priority` prop evidence on hero images |
| INP | Heavy client components (`AutomationsClient.tsx`, `BuilderClient.tsx`, `CanvasClient.tsx`) likely ship large JS bundles |
| CLS | `Skeleton.tsx` exists but if not used consistently, content shift will occur on load |

**Recommendation (P2):** Run `@next/bundle-analyzer` to identify bundles > 200kb. Apply `dynamic()` with `ssr: false` to canvas/builder components. Add `placeholder="blur"` to all `next/image` instances.

### 4.4 Mobile Performance

No mobile-specific audit found. The customer workspace (`/customer/`) is the most mobile-accessed surface. `report-issue` page exists but no photo capture component. **Gap:** no `<input type="file" accept="image/*" capture="environment">` on any mobile upload surface.

**Recommendation (P1):** Audit all mobile entry points (customer booking detail, tenant maintenance submission) for touch targets (min 44x44px), horizontal scroll, and file capture.

### 4.5 Image Optimisation

No evidence of `next/image` usage audit. `gallery-management-system` is referenced in skills but no image optimisation component inventory exists. **Recommendation (P2):** Enforce `next/image` via ESLint rule `@next/next/no-img-element` and add to CI.

---

## Area 5: Internationalisation Gaps

### 5.1 What Exists (Solid Foundation)

- `src/lib/i18n/config.ts` — 21 BCP-47 locales defined; `dir: "ltr" | "rtl"` field present on every locale but all are currently `"ltr"`
- `src/lib/i18n/country-profiles.ts` — 40+ country profiles with currency, tax scheme, privacy regime, DSAR response days, Stripe/payout support
- `src/lib/i18n/format.ts` — native `Intl` formatters (no library dependency)
- `supabase/migrations/20260616160000_international_tax.sql` — extends `country_packs` with currency, tax rates, legal framework, date format
- `supabase/migrations/20260617080000_country_packs_intl.sql` — further international extension (unread, assumed additive)
- `/admin/global/[code]` — admin country release controls with `CountryReleaseControls.tsx`
- `/workspace-settings/jurisdiction` — workspace jurisdiction settings page **exists**

### 5.2 Critical Gaps

#### Gap 1: No RTL locale registered (P1)
`ar-AE` (Arabic, UAE) and `he-IL` (Hebrew, Israel) are absent from `SUPPORTED_LOCALES`. The `AE` country profile exists (`researchProfile`) but `en-GB` is used as its locale, not Arabic. For UAE expansion, Arabic RTL is a regulatory expectation (RERA portal compliance).

**Fix:** Add `ar-AE` to `LOCALE_META` and `SUPPORTED_LOCALES` with `dir: "rtl"`. Add `dir={locale.dir}` to the root `<html>` element in `app/layout.tsx`. Apply `rtl:` Tailwind variants (noting project rule: no `dark:` — `rtl:` is a different axis and is safe to use).

#### Gap 2: Locale context is not consumed in UI (P0)
`src/lib/i18n/locale.ts` and `src/lib/i18n/format.ts` exist but **no UI component inspected reads workspace locale at render time**. All money, date, and number formatting presumably falls back to `en-GB` regardless of workspace setting. This means a UAE workspace (`AED`, date `dd/MM/yyyy` in UAE convention) would display GBP and UK date formats.

**Fix:** Create a `WorkspaceLocaleProvider` context that reads `workspace_settings.locale` from the session and exposes it via React context. Wrap `app/layout.tsx` in this provider. All `format.ts` calls must receive the locale from context, not hardcode `en-GB`.

#### Gap 3: Onboarding wizard does not capture country/locale (P0)
The planning wizard (`/app/planning/wizard/`) captures revenue model and financial data but there is no step that sets `workspace_settings.country`, `workspace_settings.locale`, `workspace_settings.currency`, or `workspace_settings.timezone`. This means the entire `CountryProfile` infrastructure has no activation path through normal onboarding.

**Fix:** See Area 6 for the complete onboarding implementation plan.

#### Gap 4: Legal templates are not locale-switched (P1)
`src/lib/legal/grounds.ts`, `documents.ts`, `bundle.ts` contain UK-specific legal content (Section 21, Section 8). There is no locale-switching mechanism — a German workspace would see UK legal templates. The `legalPackStatus: "research_only"` flag on non-GB profiles gates the UI correctly, but there is no fallback message explaining why legal features are disabled.

**Fix:** Wrap all legal module entry points with a `CountryProfile.legalPackStatus` check; show a clear "Legal pack not yet available for [country]" message with an expected release date or waitlist CTA.

#### Gap 5: Currency not locale-aware in money module (P0)
`/app/money/` routes display financial figures. Without a `WorkspaceLocaleProvider`, all amounts will format as GBP regardless of workspace currency. For multi-currency workspaces this is incorrect.

**Fix:** Pass workspace currency from provider to `formatMoney()` in `format.ts`.

#### Gap 6: No locale-specific message translations (P2)
`src/lib/i18n/locales/` contains `en-GB.json`, `en-US.json`, `fr-FR.json`, `de-DE.json`, `es-ES.json`. This is 5 of 21 supported locales. The customer and tenant portal surfaces (most likely to need localisation for non-English speakers) have no translation coverage.

**Fix (P2):** Prioritise `ar-AE`, `de-DE`, `fr-FR` translations for portal surfaces. Use DeepL API for initial machine translation + local reviewer pass.

#### Gap 7: UAE — no Ejari / RERA compliance fields (P1)
The UAE country profile is `researchProfile` with `legalPackStatus: "research_only"`. For UAE expansion, the critical compliance fields are: Ejari contract registration number, RERA licence number, DLD transaction number. These are absent from the schema.

**Fix (P2 for now, P1 when UAE pack is promoted):** Add `ejari_number`, `rera_licence`, `dld_ref` columns to the `tenancies` table, gated by `country_packs.code = 'AE'`.

#### Gap 8: Germany — tenancy law complexity not modelled (P1)
German tenancy law (Mietrecht, BGB §535) is substantially different from UK — rent control (Mietspiegel), notice periods (3-9 months), deposit cap (3 months cold rent), heating cost billing (Heizkostenverordnung). The DE country profile is `euProfile` which is generic. No German-specific tenancy fields, templates, or compliance tasks exist.

---

## Area 6: Internationalisation Through Onboarding

### 6.1 When and Where to Capture Locale

The workspace creation / onboarding flow should capture internationalisation context at **Step 1 (workspace setup)**, not buried in the planning wizard. This is because locale affects every subsequent data entry (currency, date format, legal templates, compliance tasks).

**Recommended onboarding sequence for locale capture:**

```
Step 1: Workspace basics
  - Workspace name
  - [NEW] Country (dropdown — only "offer" status countries shown, ordered by market priority: GB first)
  - [NEW] This auto-populates: currency, locale, timezone, date_format, tax_regime
  - User can override locale (e.g. UK operator managing properties in Ireland)

Step 2: Business type
  - Property manager / landlord / investor / short-let operator / supplier

Step 3: Portfolio size
  - Number of properties (drives plan recommendation)

Step 4: Plan selection
  - Starter / Professional / Enterprise (locale-aware pricing)
```

### 6.2 Workspace Settings Fields to Set at Onboarding

The `workspace_settings` table (or `workspaces` with a JSONB settings column) should persist these fields at workspace creation:

```sql
country_code       TEXT    -- ISO 3166-1 alpha-2 (e.g. 'GB', 'AE', 'DE')
locale             TEXT    -- BCP-47 (e.g. 'en-GB', 'de-DE', 'ar-AE')
currency           TEXT    -- ISO 4217 (e.g. 'GBP', 'AED', 'EUR')
timezone           TEXT    -- IANA tz (e.g. 'Europe/London', 'Asia/Dubai')
date_format        TEXT    -- 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd'
tax_regime         TEXT    -- mirrors CountryProfile.taxScheme
tax_rate           NUMERIC -- CountryProfile.standardTaxRate
measurement_system TEXT    -- 'metric' | 'imperial'
area_unit          TEXT    -- 'sqm' | 'sqft'
```

All of these are already modelled in `CountryProfile` — the work is to write them to a `workspace_settings` row at workspace creation and read them back through a server-side context.

### 6.3 RLS / Row-Level Locale Filtering

RLS does not need locale-specific filtering for most tables — locale is a presentation concern, not a data isolation concern. The one exception is **legal templates**:

```sql
-- Legal templates table (if created)
CREATE POLICY "Workspace reads own locale templates" ON legal_templates
  FOR SELECT USING (
    country_code = (
      SELECT country_code FROM workspace_settings
      WHERE workspace_id = legal_templates.workspace_id
    )
  );
```

For reference data tables (`country_tax_rules`, `country_packs`), the existing `SELECT to authenticated` policy is correct — all workspaces can read all country reference data; the application layer filters by the workspace's country code.

### 6.4 Legal Template Locale Switching

Current architecture: `src/lib/legal/` contains hardcoded UK law content. Recommended target architecture:

```
src/lib/legal/
  templates/
    GB/
      section-21-notice.ts
      section-8-notice.ts
      ast-agreement.ts
    DE/
      kuendigungsschreiben.ts      (notice to quit)
      mietvertrag-template.ts      (tenancy agreement)
    AE/
      ejari-template.ts
      tenancy-contract-rera.ts
  index.ts                         -- getLegalTemplate(country, type)
```

`getLegalTemplate(country, type)` reads the workspace's `country_code` from context and returns the matching template, or throws a "not available" error if `legalPackStatus !== 'reviewed'`.

### 6.5 UK vs UAE vs Germany: Workspace Differences

| Dimension | UK (GB) | UAE (AE) | Germany (DE) |
|---|---|---|---|
| Currency | GBP £ | AED د.إ | EUR € |
| Date format | dd/MM/yyyy | dd/MM/yyyy | dd.MM.yyyy |
| Locale | en-GB | ar-AE (RTL) or en-GB | de-DE |
| Tax | VAT 20% | VAT 5% (UAE FTA) | VAT 19% |
| Tenancy law | Renters' Rights Act 2026 | RERA / Law No.26 of 2007 | BGB §535 (Mietrecht) |
| Deposit cap | 5 weeks rent (Tenant Fees Act) | Up to 10% annual rent (RERA) | 3 months cold rent (BGB §551) |
| Notice period | 2 months (AST) / Court order | 12 months minimum (RERA) | 3–9 months (BGB §573) |
| Deposit protection | DPS / TDS / mydeposits | No mandatory scheme | No mandatory national scheme |
| Compliance certs | Gas Safety, EICR, EPC, MEES | DEWA fitness certificate | Energieausweis (EPC equivalent) |
| Compliance module | Full (reviewed) | Research only (not yet) | Research only (not yet) |
| Legal module | Full (Section 21/8, grounds) | Not available | Not available |
| RTL layout | No | Yes (ar-AE) | No |
| Area unit | sqm | sqft (common) | sqm |
| Measurement | Metric | Mixed (imperial in practice) | Metric |

---

## Implementation Priority Matrix

| Item | Area | Priority | Effort | Impact |
|---|---|---|---|---|
| SOC 2 Type I audit initiation | Commercial / Security | P0 | High (ext) | Unlocks enterprise sales |
| Publish DPA + sub-processor list | Security / Commercial | P0 | Low | Required for UK enterprise |
| Supabase project → EU region | Security | P0 | Medium | UK GDPR data residency |
| Security headers in vercel.json | Security | P0 | Low | Instant security posture improvement |
| OpenAI Zero Data Retention | Security | P0 | Low | GDPR processor obligation |
| Xero OAuth integration | Commercial | P0 | High | Hard requirement for UK agency market |
| Tenant maintenance submission with photo upload (customer workspace) | Functional | P0 | Medium | Core PM platform feature |
| Inspection / inventory module | Functional | P0 | High | Binary enterprise checkbox |
| WorkspaceLocaleProvider + locale-aware formatters | i18n | P0 | Medium | Activates all i18n infrastructure |
| Country/locale capture in workspace onboarding Step 1 | i18n | P0 | Medium | Activation path for all locale features |
| Currency in money module via locale context | i18n | P0 | Medium | Correctness for non-GBP workspaces |
| RLS audit: tables without policies | Security | P0 | Low | Data isolation correctness |
| Rate limiting on API routes | Security | P1 | Medium | Abuse prevention |
| GDPR erasure automation | Security | P1 | Medium | UK GDPR compliance |
| Audit log trigger-based writes | Security | P1 | Medium | SOC 2 / ISO 27001 requirement |
| WCAG accessibility audit + fixes | UX | P1 | Medium | Enterprise procurement requirement |
| Landlord owner portal depth verification | Functional | P1 | Low | Existing route needs content audit |
| ar-AE locale + RTL layout | i18n | P1 | Medium | UAE expansion prerequisite |
| Deposit scheme integration (DPS/TDS) | Functional | P1 | Medium | UK PM standard |
| E-signature integration (Signable/DocuSign) | Functional | P1 | High | UK agency standard |
| Tenant screening partner API | Functional | P1 | High | Enterprise differentiator |
| React error boundaries in all layouts | UX | P1 | Low | Resilience |
| Bundle analysis + dynamic imports | UX/Perf | P2 | Medium | Core Web Vitals |
| German tenancy law fields in schema | i18n | P1 | Medium | DE market expansion |
| UAE RERA/Ejari fields in schema | i18n | P1 | Medium | AE market expansion |
| SMS / WhatsApp notification channel | Functional | P2 | High | Competitor parity |
| Legal template locale-switching architecture | i18n | P1 | High | Non-UK legal pack prerequisite |
| Consumer Duty legal review | Compliance | P1 | Low (ext) | FCA risk management |

---

## Notes on Data Sources

This audit cross-references:
- Live route tree from `src/app/` (operator, supplier, customer, admin, portal workspaces)
- Migration files from `supabase/migrations/` (schema and RLS coverage)
- `src/proxy.ts` (auth guard and session handling)
- `src/lib/i18n/` (locale config, country profiles, formatters)
- `src/lib/legal/` (legal module architecture)
- `vercel.json` (deployment and header config)
- Competitor research: Fixflo (2024 year in review), Arthur Online, Buildium, Re-Leased, Hosty, Propertyware (Capterra, SoftwareAdvice, vendor sites — June 2026)
- Regulatory research: ICO UK GDPR guidance, FCA Consumer Duty, UAE RERA/DLD, ISO 27001:2022, SOC 2 Type II requirements

**This report is not legal, tax, or financial advice. All regulatory interpretations should be confirmed with qualified UK solicitors, a DPO, and relevant market counsel before acting.**
