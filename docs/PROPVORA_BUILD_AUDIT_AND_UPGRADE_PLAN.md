# Propvora Build Audit and Upgrade Plan

Generated: 2026-06-13  
Scope: current repository checkout at `propvora-final-release-v.1.0`  
Product: Propvora

## A) Executive Summary

Propvora is a UK property operations SaaS for professional landlords, rent-to-rent/HMO operators, and small property teams who need one workspace for portfolio records, compliance, maintenance, money, portals, planning, and AI-assisted operations.

### What The Product Can Do Today

- Run on Next.js 16 App Router with `src/proxy.ts`, Supabase auth/session refresh, route protection, and production security headers.
- Authenticate users with Supabase and create workspace/membership state through onboarding actions.
- Manage core workspace data in Supabase-backed modules: properties, units, tenancies, contacts, tasks, jobs, calendar, compliance, money, planning, accounting, affiliate, admin, and portals.
- Process Stripe subscription checkout and Stripe webhook updates, including event idempotency and affiliate commission accrual.
- Stream AI Copilot responses from OpenAI with workspace snapshot context, AI metering, rate checks, and plan gating.
- Upload files through a server-proxied Cloudflare R2 route with membership checks, MIME/size validation, private object keys, and internal file-view URLs.
- Provision external portal access through hashed magic-link tokens and signed HTTP-only portal sessions.
- Seed and reset rich demo data scoped to a workspace and marked with demo flags/batch expiry.
- Serve public marketing, legal, pricing, help, affiliate programme, tenant/supplier/landlord portals, and platform admin routes.

### Suitable For Today

- Strong for internal demos, founder-led sales demos, and closed beta with carefully configured Supabase, Stripe, R2, Resend, and OpenAI environments.
- Not ready for broad self-serve public launch until RLS is externally tested, demo-only surfaces are replaced or clearly labelled, and release automation/observability are hardened.

### Biggest Launch Risks

1. RLS and tenant isolation appear broadly implemented, but the RLS test matrix is still documented as TODO; this blocks real customer data confidence.
2. Product breadth is high, but wiring depth varies by module. Some pages use live hooks while others still have local/demo data or no-op settings.
3. Billing checkout/webhooks exist, but plan enforcement is partial and commercial packaging needs final Stripe/catalog/landing-page alignment.
4. Legal/compliance surfaces exist, but product-specific disclaimers, DPA/subprocessor readiness, retention/backup proof, and legal-grade audit evidence workflows need final review.
5. Test coverage is thin: TypeScript passes, but automated route, RLS, billing, upload, portal, and Playwright workflows are not yet sufficient for launch.

### Effort Bands

- Closed beta readiness: M, assuming real Supabase project and envs are configured.
- Paid launch readiness: L, mostly due to RLS verification, QA coverage, billing/support/legal hardening, and replacing demo-only interactions.
- Compliance-grade launch readiness: L/XL, depending on whether legal notice generation, MTD, Open Banking, e-signature, and possession evidence bundles are in day-one scope.

## B) Architecture Map

### Frontend Structure

- `src/app`: Next.js 16 App Router.
- `src/proxy.ts`: request-time auth/maintenance redirect layer. Per Next 16 docs, this replaces older Middleware naming and should remain an optimistic gate, not the only authorization layer.
- Public routes: `/`, `/features`, `/pricing`, `/faq`, `/about`, `/contact`, legal pages, affiliate programme pages.
- Auth routes: `(auth)/login`, `(auth)/register`, reset/forgot password, invite, onboarding.
- Main app routes: `(app)/app/*`, including home, portfolio, compliance, money, accounting, work, planning, contacts, calendar, portals, account/workspace settings.
- External portals: `(tenant)/tenant-portal`, `(supplier)/supplier-portal`, `(landlord)/landlord-portal`, plus token/session portal routes under `(portal)/portal`.
- Admin routes: `(admin)/admin/*` plus `(admin-auth)/admin-login`.
- Shared UI: `src/components/*`, `src/features/*`, `src/hooks/*`, `src/providers/*`.

### Backend Structure

- Supabase client wrappers:
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/admin.ts`
- Route handlers:
  - Billing: `src/app/api/billing/checkout/route.ts`, `portal`, `pay-invoice`.
  - Stripe: `src/app/api/webhooks/stripe/route.ts`.
  - AI: `src/app/api/ai/chat/route.ts`, `actions`.
  - Upload/file access: `src/app/api/upload/route.ts`, `src/app/api/files/[...key]/route.ts`.
  - Portal: `src/app/api/portals/grant/route.ts`, `portal/verify`, `portal/file`, `portal/logout`.
  - Demo: `src/app/api/demo/seed/route.ts`, `demo/reset`.
  - Health/readiness/connect/integrations/email/pdf/account request routes.
- Migrations: 238 `CREATE TABLE` statements across `supabase/migrations`, covering core property ops, compliance, money/accounting, calendar, planning, HMO/R2R, leasing, portals, admin, affiliate, AI metering, demo flags, account deletion/export requests, Stripe Connect, and rate limits.
- Storage: Cloudflare R2 via `src/lib/r2.ts`; no public bucket dependency.
- Email: Resend utilities/templates in `src/lib/email.ts` and `src/lib/emails/*`.
- PDF: `src/lib/pdf/*` and invoice PDF route.

### Auth And Tenancy Model

- Supabase auth user is the identity source.
- `profiles` stores user-level metadata and `current_workspace_id`.
- `workspaces` are tenant containers.
- `workspace_members` links users to workspaces and roles.
- Most business tables are workspace-scoped with `workspace_id`.
- RLS policies generally use `workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())` or helper functions such as `is_workspace_member`.
- Admin access uses `profiles.platform_role`, `platform_admins`, and server-side `createAdminClient`.
- Current limitation: `useWorkspace()` selects the first membership; multi-workspace switching is not yet a complete product workflow.

### Billing Model

- Canonical plan tiers in `src/lib/billing/plans.ts`: `starter`, `operator`, `scale`, `pro_agency`, `enterprise`.
- Stripe price IDs come from `src/lib/billing/catalog.generated.json`, with `NEXT_PUBLIC_STRIPE_PRICE_*` overrides.
- Checkout creates or reuses a Stripe customer per workspace and creates subscription sessions.
- Webhook updates workspace plan/status from subscription lifecycle events.
- Webhook handles `invoice.paid`, refunds, subscription deletion, checkout completion, Connect account updates, payment failures, and disputes.
- Feature gates exist for AI Copilot and storage in `src/lib/billing/gates.ts`; more gates are needed across premium modules.

## C) Feature Inventory

| Feature / Module | Current status | Code areas | Data tables | Known issues |
|---|---|---|---|---|
| Public marketing site | Partially working | `src/app/page.tsx`, `features`, `pricing`, marketing components | Contact/waitlist routes optional | Needs final offer, proof assets, SEO/analytics verification |
| Auth and onboarding | Partially working | `(auth)`, `src/lib/actions/workspace.ts`, `src/proxy.ts` | `profiles`, `workspaces`, `workspace_members`, `workspace_invitations` | Multi-workspace selection incomplete |
| Workspace shell/search/nav | Partially working | `src/components/shell/*`, `src/hooks/useWorkspace.ts` | Profiles, workspace_members, properties, contacts, tasks, notifications | Some shell state is localStorage; first-workspace assumption |
| Portfolio properties | Working / partial | `useProperties`, portfolio routes/components | `properties`, `property_units`, `tenancies`, `activity_logs`, docs/media | Adapter layer indicates schema drift; verify all CRUD/detail edge cases |
| Units and tenancies | Working / partial | `useUnits`, `useTenancies`, unit/tenancy pages | `property_units`, `tenancies`, contacts, compliance/activity | Some detail analytics are derived/fallback |
| Contacts/CRM | Working / partial | `useContacts`, `useContactsEnhanced`, contact pages | `contacts`, `organisations`, `contact_links`, notes/activity/docs | Portal/message/contact detail depth still uneven |
| Work tasks/jobs | Working / partial | `useTasks`, `useJobs`, work pages | `tasks`, `jobs`, `job_documents`, `task_documents`, suppliers | PPM has demo fallback; saved views/evidence need workflow QA |
| PPM/suppliers | Partially working | `src/features/work/ppm/*`, suppliers hooks | `ppm_schedules`, suppliers/contacts, supplier docs | Explicit "showing demo data" fallback in PPM hooks |
| Compliance | Working / partial | `useComplianceData`, compliance pages | `compliance_certificates`, inspections, documents, evidence, reports, settings | Legal-grade evidence/audit proof and expiry automation need QA |
| Money | Working / partial | `useMoneyData`, money pages | `money_*`, bills, payments, deposits, arrears, invoices | Some pages still keep local UI state/fallbacks; Open Banking absent |
| Accounting | Partially working | `src/features/accounting/*` | `accounting_accounts`, journal entries/lines, client accounts, MTD tables | MTD/HMRC appears schema/UI-ready, not HMRC-integrated |
| Calendar | Working / partial | `useCalendarData`, calendar pages | `calendar_events`, reminders, settings, sync connections | External calendar sync not proven |
| Planning engine | Working / partial | planning routes, wizard, `src/lib/planning/*` | `planning_sets`, assumptions, rooms, bills, forecasts, risks, docs | Profile quick scenarios and some AI/deal intelligence are future-state |
| AI Copilot | Working / partial | `api/ai/chat`, `src/components/ai/*`, copilot feature | AI threads/messages, usage/rate tables | Chat route wired; some conversation assist/actions still simulated/no-op |
| Billing/subscriptions | Partially working | billing routes, `src/lib/billing/*`, workspace settings | `workspaces`, `stripe_webhook_events`, subscriptions/addons | Needs live Stripe env validation, checkout E2E, plan gate coverage |
| File uploads/documents | Partially working | `api/upload`, `api/files`, `src/lib/r2.ts`, EvidenceUpload | R2 objects, file/document/link tables | Upload works only when R2 env configured; file metadata consistency needs audit |
| External portals | Partially working | portal routes/libs, tenant/supplier/landlord portal pages | `contact_portal_access`, tokens, sessions, contacts, jobs, invoices | Session flow is strong; portal feature coverage/support flows need QA |
| Affiliate programme | Partially working | affiliate pages, commission lib, Stripe webhook | affiliates, referrals, commissions, payouts/applications | Some settings UI local-only; payout workflow likely incomplete |
| Admin console | Partially working | `src/app/(admin)`, `src/lib/admin/*` | Admin reads via service role; audit logs/platform tables | Needs full admin action audit, impersonation/support policy decisions |
| Legal/compliance pages | Partially working | `src/app/legal/*`, docs/compliance | Static legal pages/docs | Needs lawyer review, jurisdiction assumptions, launch-date policy freeze |

## D) Build Stage Plan

### 1. Initial Build Completeness

- Objective: make the core paid user journey real end-to-end.
- Checklist:
  - Register/login -> create workspace -> load app -> add property -> add unit/tenancy/contact -> create task/job -> upload evidence -> see dashboard update.
  - Remove silent local-only save behaviour from core pages.
  - Add visible unavailable states when a paid integration is not configured.
- Top tasks:
  - Verify each create/edit/delete route for properties, units, tenancies, contacts, tasks, jobs.
  - Replace PPM and messaging demo fallbacks with real empty/error states.
  - Add workspace selector or explicitly constrain v1 to one workspace.
  - Wire notification creation for task/compliance/billing events.
- Dependencies: Supabase project migrations applied; seed/reset stable.
- Done criteria: a new beta user can complete the above workflow without developer intervention.
- Evidence: Playwright recording, screenshots, Supabase rows, uploaded R2 object, live URL.

### 2. Upgrade Depth Build

- Objective: deepen modules users will pay for.
- Checklist:
  - Compliance renewals, evidence, certificate/doc upload.
  - Rent arrears and rent chase status.
  - Supplier job dispatch and invoice approval.
  - Planning set wizard with full persistence and forecast outputs.
- Top tasks:
  - Finish PPM schedules and occurrences.
  - Add audit events for compliance, money, and portal access.
  - Finish supplier portal invoice/job actions.
  - Finish legal possession case workflow from arrears/evidence.
  - Add PDF exports for invoices, compliance reports, and possession bundles.
- Dependencies: file metadata model and audit model.
- Done criteria: each module has at least one complete workflow with reports/exports.
- Evidence: live demo workspace, exported PDFs, audit logs.

### 3. UI Design Upgrade

- Objective: make the product feel premium and operationally dense.
- Checklist:
  - Audit mobile/tablet/desktop layouts.
  - Remove placeholder charts, static mockups, and dead controls.
  - Standardise empty/error/loading states.
  - Confirm accessibility on forms, dialogs, nav, portals.
- Top tasks:
  - Run Playwright screenshots across core routes.
  - Fix text overflow and table/card density.
  - Standardise CTA semantics for save/cancel/delete/approve.
  - Add skeletons and clear error recovery where hooks fail.
- Dependencies: core workflows stable.
- Done criteria: demo script can be run on laptop and mobile without visual breaks.
- Evidence: screenshot set and manual UX QA checklist.

### 4. Commercial Depth And Gap Analysis

- Objective: align feature gates, pricing, and day-one offer.
- Checklist:
  - Lock packages: Starter, Operator, Scale, Pro/Agency, Enterprise.
  - Map every premium feature to a plan gate.
  - Confirm Stripe products/prices match app catalog and pricing page.
  - Add launch offer and support/onboarding terms.
- Top tasks:
  - Gate AI, storage, white-label, SSO, portals, accounting, MTD, advanced reports.
  - Finish upgrade prompts and billing portal paths.
  - Add account request/lead routing for enterprise/contact sales.
  - Produce demo video and 1-page case-study template.
- Dependencies: Stripe live/test catalog, legal copy, support policy.
- Done criteria: a user can self-serve checkout and hit correct plan limits.
- Evidence: Stripe test checkout, webhook logs, pricing page screenshots.

### 5. Security / Compliance And Backend Hardening

- Objective: prove tenant isolation and reduce launch liability.
- Checklist:
  - RLS automated tests for core and high-risk tables.
  - Route handler auth/authorization audit.
  - Service-role usage inventory.
  - Data export/deletion process.
  - Backup/restore and incident runbooks.
- Top tasks:
  - Convert `docs/rebuild/03_RLS_TEST_MATRIX.md` TODO rows into executable tests.
  - Add tests for portal token/session isolation.
  - Validate file download path cannot access another workspace key.
  - Add rate limits to expensive/public routes.
  - Add audit logging for admin actions and destructive user actions.
- Dependencies: test users/workspaces fixtures.
- Done criteria: cross-workspace access tests fail closed for app, API, files, portals, and admin.
- Evidence: CI logs, RLS test output, security audit doc.

### 6. Final Release Readiness

- Objective: ship a controlled paid launch.
- Checklist:
  - CI runs typecheck, lint, build, unit tests, Playwright smoke, RLS tests.
  - Production envs configured and documented.
  - Observability, support escalation, backup, and legal pages ready.
  - Demo data and sample workspace reset are reliable.
- Top tasks:
  - Add deployment checklist and release gate.
  - Add monitoring/error reporting.
  - Verify transactional emails and sender domain.
  - Run founder-led beta with 5-10 target operators.
  - Freeze public pricing and day-one offer.
- Dependencies: stages 1-5.
- Done criteria: beta customers can pay, use core workflows, and get support without direct developer access.
- Evidence: beta runbook, incident drill, Stripe live test, production smoke test.

## E) Security And Compliance Review

### RLS Posture

- Strong foundation: migrations enable RLS broadly and use workspace membership policies on core tables.
- Known improvement: old docs still list RLS tests as TODO; actual policies must be tested rather than assumed.
- High-risk tables to test first: `workspaces`, `workspace_members`, `properties`, `contacts`, `tenancies`, `tasks`, `jobs`, `documents`, `files`, `portal_access_tokens`, `portal_sessions`, `messages`, `ai_chat_messages`, `audit_logs`, `stripe_connect_accounts`.

### File Upload And Access

- Upload route requires auth, workspace membership, MIME allowlist, extension allowlist, 10 MB limit, storage plan gate, server-side R2 upload.
- Download should be tested for path/key tampering because keys start with workspace ID.
- Missing: antivirus/malware scanning, image/PDF content scanning, and document retention/deletion policy enforcement.

### PII Handling

- Product stores names, emails, phone numbers, addresses, tenancy financial records, legal/compliance documents, messages, and portal session metadata.
- Needs explicit PII data map, retention schedule, SAR/export workflow verification, and delete workflow verification.

### Audit Logging

- Admin audit helpers exist, and workspace/admin audit tables exist.
- Needs coverage audit: every admin action, portal grant/revoke, billing change, destructive data action, legal notice generation, and file access should be logged.

### Backups And Disaster Recovery

- Docs reference disaster recovery TODOs.
- Missing evidence: scheduled Supabase backups, restore test, R2 backup/versioning policy, RPO/RTO targets, and owner responsibilities.

### Required Legal Pages / Policies

- Public legal pages exist for terms, privacy, cookies, acceptable use, DPA/data processing, affiliate terms, and AI disclaimer.
- Required before launch:
  - Privacy policy with UK GDPR roles and subprocessor list.
  - Terms with property/compliance/legal advice limitation.
  - DPA and subprocessor register.
  - Cookie policy and consent record.
  - AI disclaimer: no legal/tax advice; human verification required.
  - Refund/cancellation policy.
  - Data export/deletion policy.
  - Product disclaimers for possession notices, MTD/tax, compliance certificates, and HMO/R2R workflows.

## F) QA And Release Readiness

### Current Verification

- `npm run typecheck`: passed on 2026-06-13.
- `npm run build`: passed on 2026-06-13. Next.js 16.2.7 compiled successfully and generated 221 static pages.
- `npm run lint`: failed on 2026-06-13 with 599 total findings: 259 errors and 340 warnings. Main buckets are React Compiler/react-hooks purity and set-state-in-effect rules, explicit `any`, `require()` imports in `src/__tests__/smoke.test.ts`, unescaped JSX entities, and some unused variables.
- `src/__tests__/smoke.test.ts` exists, but `package.json` has no `test` script or Jest/Vitest dependency wired for it.

### Test Coverage Status

- Type safety is good enough to pass `tsc --noEmit`.
- Unit/integration automation is not launch-grade.
- Needed tests:
  - RLS cross-tenant matrix.
  - Billing checkout and webhook idempotency.
  - Portal token/session flow.
  - Upload/download authorization.
  - AI rate/gate/persistence flow.
  - Core CRUD Playwright flows.
  - Legal/compliance report/PDF generation.

### Browser / Device Risks

- Large operational pages use dense tables/cards and should be screenshot-tested on 390px, 768px, 1440px.
- Portal pages need mobile-first testing because tenants/suppliers will use phones.
- Map/Leaflet and Recharts routes need canvas/asset checks in production mode.

### Performance Risks

- Many client-heavy pages and broad route tree.
- Need bundle analysis for Leaflet/Recharts/Framer Motion/OpenAI-related client boundaries.
- Need query batching and route-level loading states for dashboard pages that hit many Supabase tables.

### Observability Gaps

- Console logging exists in some handlers.
- Missing or not evident: Sentry/Logtail-equivalent, structured request IDs, Stripe webhook alerting, AI cost alerts, R2 upload failure alerts, uptime checks, and customer-visible status page.

### Deployment Assumptions

- `.env.example` exists and env validation checks Supabase public values in production.
- Required production envs include Supabase URL/anon/service role, Stripe secret/webhook/price IDs, Resend key/sender, OpenAI key/model, R2 credentials/bucket, app URL, portal signing secret, maintenance flags.
- Need final CI/CD gate to prevent deploy if typecheck/lint/build/tests fail.

## Commercial Summary

Recommended day-one offer: Propvora for UK professional landlords and small property operators who need compliance, maintenance, portfolio, money, portals, and AI operations in one modern workspace.

Suggested packaging:

- Starter: up to 5 properties, basic portfolio/compliance/money.
- Operator: up to 25 properties, reports, work/PPM.
- Scale: up to 100 properties, AI Copilot, portals/accounting.
- Pro/Agency: up to 500 properties, white-label, advanced support.
- Enterprise: custom, SSO/SAML, SLAs, migration.

Day-one sales motion:

- Start assisted self-serve: demo call plus Stripe checkout.
- Beta cohort: 5-10 UK landlords/operators with HMO/R2R or 10+ units.
- Launch blockers: RLS test proof, Stripe live proof, demo video, legal policy freeze, support SLA, onboarding checklist, monitoring.

## Top 10 Missing Pieces By Launch Impact

1. Executable RLS and cross-workspace isolation test suite.
2. Core workflow Playwright tests from signup to paid workspace usage.
3. Complete plan gating across all premium features.
4. Replace/no-label demo-only interactions in AI actions, PPM, affiliate settings, e-signing, notifications, and analytics.
5. Production build/lint stability in CI.
6. Observability and alerting for route handlers, Stripe, AI, Supabase, R2.
7. Backup/restore and data export/deletion operational proof.
8. Legal review of public policies and compliance/tax/legal disclaimers.
9. Support/admin audit coverage and escalation runbook.
10. Final demo data reset and beta onboarding playbook.
