<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:propvora-routing-rules -->
# Propvora Routing Rules

- Canonical PM workspace prefix: `/property-manager/` (NOT `/app/`)
- `/app/*` redirects to `/property-manager/*` — never use `/app/` in hrefs or router.push calls
- Canonical customer prefix: `/user/*` (files) — `/customer/*` rewrites to `/user/*`
- Auth guard: `src/proxy.ts` — public route prefixes defined there
- Login must use `window.location.assign` not `router.push` to avoid proxy bounce loop
<!-- END:propvora-routing-rules -->

<!-- BEGIN:propvora-agent-qa-rule-v2 -->
# Agent QA Rule — v2
Before changing code: read /qa-release/master-scoreboard.md and the relevant /qa-release/sections/*.md.
After changing code: update section score file, implementation-fix-log.md, task-list completion, run npm run build, browser-test at desktop and phone.
Every TODO must name the QA tracking file.
<!-- END:propvora-agent-qa-rule-v2 -->

<!-- BEGIN:propvora-styling-rules -->
# Propvora Styling Rules

- NEVER use `dark:` Tailwind classes — the codebase has zero `dark:` classes by design
- Tailwind v4 is in use — check v4 docs before using utility classes that may have changed
<!-- END:propvora-styling-rules -->

<!-- BEGIN:propvora-qa-protocol -->
# Propvora Release QA Protocol

QA system lives in `qa-release/`. Key files:
- `qa-release/README.md` — scoring guide and screen size table
- `qa-release/master-scoreboard.md` — overall scores per product area
- `qa-release/release-blockers.md` — P0/P1/P2 blockers
- `qa-release/implementation-fix-log.md` — all fixes applied
- `qa-release/route-registry.md` — all ~600+ routes
- `qa-release/task-list-atomic-600.md` — atomic test checklist
- `qa-release/sections/01-11-*.md` — per-area score matrices
- `qa-release/browser-qa-log.md` — running browser test log

When running browser QA:
1. Test EVERY route in route-registry.md
2. Test at ALL required screen sizes: 1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812
3. Click EVERY interactive element — cards, buttons, tabs, links, modals, forms
4. Log EVERY finding in browser-qa-log.md
5. Update section score matrix after each section
6. Mark fix tasks in implementation-fix-log.md when bugs are fixed
7. Never skip a route — every route must have at least one QA entry in the log
<!-- END:propvora-qa-protocol -->

<!-- BEGIN:propvora-addendum-qa-rule -->
# Addendum QA Rule

All future Propvora work must include:
1. Design consistency scoring (header/breadcrumb/tab/H1/H2 + shell width + quick-nav alignment).
2. KPI/card/button/Kanban/table/form consistency checks against shared primitives.
3. Brand token and white-label setting linkage checks.
4. AI function testing where AI is touched (NVIDIA NIM, chat, caps, rate limits, security, audit logs).
5. Automation node/function testing where automation is touched (node individually, then full workflow).
6. Settings/account/workspace/billing/profile testing where settings are touched.
7. Internationalisation/currency/legal-context checks where copy, money, dates, legal wording or calculations are touched.
8. Markdown matrix updates in the relevant qa-release/ file before and after implementation.

QA files:
- `/qa-release/design-consistency-qa-log.md` — design consistency
- `/qa-release/ai-qa-log.md` — AI testing
- `/qa-release/automation-qa-log.md` — automation testing
- `/qa-release/settings-account-billing-profile-qa-log.md` — settings/billing/profile
- `/qa-release/internationalization-currency-qa-log.md` — i18n/currency

Rules:
- Every TODO must name the QA file it updates.
- Every completed fix must update the relevant score in the matrix.
- Every design inconsistency must be fixed through shared primitives/tokens where possible, not one-off page patches.
- No component is release-ready unless the relevant matrix has been updated.
- Design system shared primitives: AppPageShell, PageHeader, PageBreadcrumbs, PageQuickNav, PageTabs, DashboardGrid, KpiCard, SectionCard, DetailPageShell, WizardShell, KanbanShell, TableShell, PortalPageShell, AdminPageShell, MobilePageShell, PwaActionBar.
- Use consistent scoring: 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable.
<!-- END:propvora-addendum-qa-rule -->

<!-- BEGIN:propvora-release-qa-protocol-v2 -->
# Propvora Release QA Protocol — v2
Every code change must update the matching /qa-release/*.md file.
Required QA files: sections/01-20, feature-flag-registry.md, public-marketplace-qa-log.md, marketplace-card-consistency-qa-log.md, task-list-atomic-900-plus.md, pwa-pages.md, design-consistency-qa-log.md, ai-qa-log.md, automation-qa-log.md, settings-account-billing-profile-qa-log.md, internationalization-currency-qa-log.md
Feature flags: NEXT_PUBLIC_QA_ALL_FLAGS=true in .env.local enables all 23 v2 flags for QA testing.
No route is release-ready until scored 5/5 or documented with external blocker.
<!-- END:propvora-release-qa-protocol-v2 -->

<!-- BEGIN:propvora-task-recording-rule -->
# Task Recording Rule — MANDATORY
Every task in task-list-atomic-600.md and task-list-atomic-900-plus.md MUST be:
1. Attempted or assessed
2. Recorded with a result entry in the relevant /qa-release/sections/*.md file
3. Ticked off with [x] in the task list file when complete
4. Logged as FIX-NNN in implementation-fix-log.md if a code change was made
NO task is complete until it is ticked [x] in the task list AND recorded in the relevant QA doc.
This is the extensive rule. It applies to every agent, every session, every change.
<!-- END:propvora-task-recording-rule -->

<!-- BEGIN:propvora-tab-system-rule -->
# Tab System Rule — MANDATORY
Pages with 8+ tabs MUST have a responsive tab solution for mobile/PWA:
- At 768px+: standard horizontal tab bar (scrollable with overflow-x-auto + fade gradient)
- At <768px: tabs collapse to a dropdown select or a scrollable chip row with visible scroll indicators
- NEVER allow tabs to clip off-screen without a scroll/overflow affordance
- For 12+ tabs: consider a two-level grouping (primary tabs + sub-tabs) or a mobile section-switcher dropdown
Affected sections: Money (14 tabs), Automations, Work, Contacts, Planning, Settings
<!-- END:propvora-tab-system-rule -->

<!-- BEGIN:propvora-pwa-rule -->
# PWA Rule — MANDATORY
- PWA entry point is the LOGIN page — NOT the home/marketing page
- PWA manifest start_url must be /login
- PWA must have a splash screen (name, logo, brand colour)
- PWA must NOT show marketing/public pages as the first screen
- PWA offline page must be branded and useful
- src/app/manifest.ts (or manifest.json) controls this
<!-- END:propvora-pwa-rule -->

<!-- BEGIN:propvora-marketplace-card-rule -->
# Marketplace Card Design Rule
- Stays marketplace cards: Airbnb-style (full-bleed image, price bottom-left, rating chip, favourite heart, location tag)
- Supplier/services cards: Airtasker/Upwork-style (avatar/logo, name, trade badge, rating, price/day-rate, response time, verified badges, CTA button)
- Emergency services cards: urgent-red accent, response time prominent, available-now badge
- All cards MUST be WCAG AA compliant (contrast ratios, focus states, alt text)
- Cards must work at all viewports without clipping text or buttons
<!-- END:propvora-marketplace-card-rule -->

<!-- BEGIN:propvora-i18n-rule -->
# Internationalisation Rule
- i18n locale, currency, date format and legal context must be configurable in Workspace Settings > Preferences
- Currency display must use the workspace locale setting (default: GBP £)
- Date formats must respect locale (default: DD/MM/YYYY for UK)
- Legal disclaimers must adapt to jurisdiction (default: England & Wales)
- i18n settings must be visible and editable in Settings — not hidden
- All money values must use a central formatCurrency(amount, locale) utility — never raw £ string concatenation
<!-- END:propvora-i18n-rule -->
