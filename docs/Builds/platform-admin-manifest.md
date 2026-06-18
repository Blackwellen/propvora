# Platform Admin — 45-Image Implementation Manifest

**Status:** In Review · 2026-06-18 · **Source images:** `platform-admin-images/ordered/img-01.png … img-45.png` (45 confirmed, content-verified).
**Spec:** the per-image page requirements live in the build prompt; this manifest maps image → batch → page → route → sidebar item → key components. Implementers MUST open the ordered image and match it 1:1.

## Confirmed batch grouping (by content)
- Batch 1 = img-01…10 · Batch 2 = img-11…20 · Batch 3 = img-21…30 · Batch 4 = img-31…40 · Batch 5 = img-41…45.

## Shell (shared, all pages)
Navy gradient sidebar (logo + red **ADMIN** badge), groups Overview / Platform / Data / Marketplace / Operations / Communications-Settings. Rounded white top header with red **Admin Console** pill (left) and **Audit Log · Health · Help & support · Back to App** (right). No bottom help-circle. Consistent widths/padding/radius. Blue `#2563EB` primary; emerald/amber/red/violet status tones; red admin accent.

| # | Batch | Page | Route (target) | Sidebar item | Key components |
|--:|:--:|------|----------------|--------------|----------------|
| 1 | 1 | Platform Command Centre (Dashboard) | `/admin` | Dashboard | KPI row, Growth & Plan-mix chart, recent signups, recent admin events, verification queue, open disputes, health/risk panels, MRR/ARR honesty banner |
| 2 | 1 | Customers | `/admin/customers` | Customers | data-source banner, count, search, plan/status filters, customer table, states |
| 3 | 1 | Customer/Workspace detail | `/admin/customers/[id]` | Customers | identity summary, plan state, members, usage, billing readiness, portal access, docs, audit trail, admin actions |
| 4 | 1 | Users | `/admin/users` | Users | count, role filters, search, New User, user table, pagination |
| 5 | 1 | User detail | `/admin/users/[id]` | Users | profile, role/permissions, memberships, sessions, MFA, audit, danger zone |
| 6 | 1 | Suppliers | `/admin/suppliers` | Suppliers | coverage cards, verification status, risk flags, supplier table / not-provisioned state |
| 7 | 1 | Supplier detail | `/admin/suppliers/[id]` | Suppliers | profile, team, verification, docs, services, coverage, jobs, payouts, risk, audit |
| 8 | 1 | Workspaces | `/admin/workspaces` | Workspaces | count, New Workspace, search, status+plan filters, table, chips, pagination |
| 9 | 1 | Subscriptions | `/admin/subscriptions` | Subscriptions | billing-not-provisioned banner, plan counts, Stripe sync status, no fabricated MRR |
| 10 | 1 | Affiliates | `/admin/affiliates` | Affiliates | applications, register, commission balances, rate, referrals, New Affiliate |
| 11 | 2 | Portals | `/admin/portals` | Portals | session KPIs, landlord/tenant/supplier tabs, access-grant table, audit right rail |
| 12 | 2 | Documents | `/admin/documents` | Documents | metadata table, access grants, retention, share links, security status (no content exposure) |
| 13 | 2 | Portfolios — All Properties | `/admin/portfolios` | Portfolios | count, search, type filters, property table, read-only diagnostics label |
| 14 | 2 | Stays | `/admin/stays` | Stays | short-stay + long-term, host verification, availability health, moderation queues |
| 15 | 2 | Bookings | `/admin/bookings` | Bookings | reservations, checkout drafts, payment status, refund review, booking audit |
| 16 | 2 | Work — All Tasks | `/admin/work` | Work | count, search, priority filters, task table, read-only diagnostics |
| 17 | 2 | Planning — All Sets | `/admin/planning` | Planning | count, search, profile filters, planning-set table |
| 18 | 2 | Marketplace oversight | `/admin/marketplace/oversight` | Oversight | GMV, revenue, active listings, disputes, payouts cards, charts |
| 19 | 2 | Listing moderation | `/admin/marketplace/moderation` | Moderation | pending count, clear-queue state, approve/reject, decision audit |
| 20 | 2 | Transaction monitor | `/admin/marketplace/transactions` | Transactions | breadcrumb, status tabs, transaction table w/ fee/payout columns, chips |
| 21 | 3 | Dispute queue | `/admin/marketplace/disputes` | Disputes | status tabs, governance note, dispute table, resolve action, detail panel |
| 22 | 3 | Payout monitor | `/admin/marketplace/payouts` | Payouts | tabs, payout table / empty state, retry-with-confirm |
| 23 | 3 | Lettings marketplace | `/admin/marketplace/lettings` | Lettings | listings, host quality, funnel, complaints, safety flags, compliance |
| 24 | 3 | Supplier marketplace | `/admin/marketplace/suppliers` | Marketplace Suppliers | listings, offers, emergency, quote requests, coverage, disputes |
| 25 | 3 | Risk & fraud | `/admin/risk` | Risk | "computed signals not accusations" note, band filters, risk table, high-severity panel |
| 26 | 3 | Identity verification | `/admin/id-verification` | ID Verification | KYC queue, evidence panel, approve/reject/request-info, disclaimer |
| 27 | 3 | Supplier verification | `/admin/supplier-verification` | Supplier Verification | ID/insurance/licence review queue, approve/reject, disclaimer |
| 28 | 3 | Automation engine | `/admin/automations` | Automations | overview tabs, KPI cards, node kill-switch, runs/errors tables |
| 29 | 3 | Automation usage caps | `/admin/automation-usage` | Automation Usage | workspace caps, quotas, AI limits, overage alerts, limit audit |
| 30 | 3 | Cron management | `/admin/cron-management` | Cron Management | scheduled jobs, run history, failed jobs, manual run, pause/resume |
| 31 | 4 | Maintenance mode | `/admin/maintenance-mode` | Maintenance Mode | status, enable toggle, type cards (full/restricted/degraded), message, allowlist, windows table, health checks |
| 32 | 4 | Data requests | `/admin/data-requests` | Data Requests | SAR/deletion/export KPIs, tabs, table, workflow stepper, redaction checklist, SLA chart |
| 33 | 4 | Bug reports | `/admin/bug-reports` | Bug Reports | KPI cards, filters, bug table, selected-bug detail panel, charts |
| 34 | 4 | Stripe events | `/admin/stripe-events` | Stripe Events | webhook health, event tabs, event table, dead-letter queue, replay |
| 35 | 4 | AI usage | `/admin/ai-usage` | AI Usage | date range, totals, usage charts, by-feature/model, top workspaces, anomalies |
| 36 | 4 | AI models | `/admin/ai-models` | AI Models | active models, providers, model table, default routes, fallback chain, guardrails |
| 37 | 4 | Changelog | `/admin/changelog` | Changelog | release KPIs, filters, release timeline, selected release detail, rollback readiness |
| 38 | 4 | Announcements | `/admin/announcements` | Announcements | live/scheduled/draft KPIs, tabs, table, preview, targeting, performance |
| 39 | 4 | Announcement bar | `/admin/announcement-bar` | Announcement Bar | enable toggle, content, severity, CTA, audience, live preview, sticky save bar |
| 40 | 4 | Global settings | `/admin/global` | Global | tabbed defaults (locale/branding/notifications/security/compliance/integrations), save/reset |
| 41 | 5 | Global translations | `/admin/global-translations` | Global Translations | locale KPIs, tabs, translation table, completeness rail, glossary, MT queue |
| 42 | 5 | Audit log | `/admin/audit-log` | Audit Log | event KPIs, retention card, filters/saved views, event table, suspicious-actors rail, export |
| 43 | 5 | Security | `/admin/security` | Security | posture score, MFA/session KPIs, tabs, alerts/incidents, policy grid, monitoring footer |
| 44 | 5 | Health | `/admin/health` | System Health | status, uptime/latency KPIs, services grid, perf chart, incidents, queues, DR readiness |
| 45 | 5 | Platform settings | `/admin/settings` | Settings | config-status KPIs, tabs (General/Platform/Billing/AI/Email/Storage/Compliance/Flags/Rate-limits/Support), sticky save/publish bar |

## Route standardisation (redirects from old → target)
`/admin/verification → /admin/id-verification` · `/admin/maintenance → /admin/maintenance-mode` · `/admin/cron → /admin/cron-management` · `/admin/automations/usage-caps → /admin/automation-usage` · `/admin/bugs → /admin/bug-reports` · `/admin/audit → /admin/audit-log` · `/admin/marketplace → /admin/marketplace/oversight` · `/admin/global/translations → /admin/global-translations` · `/admin/announcements/bar → /admin/announcement-bar`. Implement as `next.config` redirects or thin redirecting pages; keep old data layers.

## Build order
Foundation (shell top-nav + `src/components/admin/*` library) → Batch 1–5 (one agent per batch, each views its `ordered/img-NN.png` set) → data wiring + RLS + audit → tsc/build → browser QA.
