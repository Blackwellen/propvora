# PROPVORA — ROUTE INVENTORY

> **Auto-derived 2026-06-14** by a code crawl of `src/app/**` (Next.js 16 App Router).
> Best-effort — tables/forms/issues are inferred from sampled file reads + grep, not an
> exhaustive read of all 344 pages. **Needs a human pass** before being treated as canonical.

## Totals
- **Page routes (`page.tsx`):** 344
- **API routes (`route.ts`):** 33
- **Route groups:** `(app)` `(admin)` `(admin-auth)` `(auth)` `(affiliate)` `(landlord)` `(tenant)` `(supplier)` `(portal)` `(states)` + un-grouped marketing/`api`.

## Auth / gating model (where it lives)
| Surface | Guard | Mechanism |
|---|---|---|
| `(app)/app/**` | `src/app/(app)/layout.tsx` | `getUser()` → resolve `current_workspace_id` → redirect `/onboarding` if none; resolves plan for AI gate. |
| `(admin)/admin/**` | `src/app/(admin)/layout.tsx` | `getAdminIdentity()` (service-role check of `platform_role='admin'` / `platform_admin`). Fail-closed → `/admin-login`. |
| `(portal)/portal/[sessionId]/**` | `[sessionId]/layout.tsx` | `getSessionForRoute()` validates session cookie == URL sessionId; feature-flagged (`isExternalPortalEnabled`). |
| `(tenant)/(landlord)/(supplier)` portals | shell components (`TenantShell` etc.) | client-side context resolve (`resolveTenantContext`) — primary external-portal gate is the `(portal)` group + `/api/portal/verify`. |
| `(affiliate)/affiliate/**` | `src/proxy.ts` | path-prefix auth guard (`/affiliate` exact + `/affiliate/*`), not `/affiliate-programme`. |
| `/app`, `/supplier-portal`, `/admin` | `src/proxy.ts` | unauthenticated → `/login?redirectTo=`. Plus maintenance-mode redirect. |
| Marketing / `(auth)` / `(states)` | none | public. |

**Legend:** Auth = needs login · WS = needs workspace · Admin = platform-admin · Portal role = external portal persona.

---

## Area: Marketing (public, un-grouped)
| Path | Purpose | Auth | WS | Admin | Forms |
|---|---|---|---|---|---|
| `/` | Landing (hero, tools, pricing, why-teams) | – | – | – | newsletter signup |
| `/features` | Feature marketing | – | – | – | – |
| `/pricing` | Pricing tiers → checkout/register | – | – | – | – |
| `/about` | About company | – | – | – | – |
| `/contact` | Contact sales (`ContactClient`) | – | – | – | contact form |
| `/faq` | FAQ accordion sections | – | – | – | – |
| `/help` | Public help centre | – | – | – | – |
| `/changelog` | Public changelog | – | – | – | – |
| `/walkthrough` | Product walkthrough | – | – | – | – |
| `/maintenance` | Maintenance-mode landing (proxy target) | – | – | – | – |
| `/affiliate-programme` | Affiliate marketing home | – | – | – | – |
| `/affiliate-programme/apply` | Affiliate application | – | – | – | apply form |
| `/affiliate-programme/earnings` | Earnings explainer | – | – | – | – |
| `/affiliate-programme/faq` | Affiliate FAQ | – | – | – | – |
| `/affiliate-programme/terms` | Affiliate terms | – | – | – | – |
| `/legal` | Legal index | – | – | – | – |
| `/legal/terms` `/privacy` `/cookies` `/acceptable-use` `/affiliate-terms` `/ai-disclaimer` `/data-processing` | Policy pages (`LegalLayout`) | – | – | – | – |
| `/newsletter/confirmed` `/newsletter/unsubscribed` | Newsletter result pages | – | – | – | – |
| `/sign/[token]` | Public e-signature flow (signatory enters name) | token | – | – | signature capture |

## Area: Auth `(auth)` + `(admin-auth)` + `(states)`
| Path | Purpose | Auth | Forms | Tables (best-effort) |
|---|---|---|---|---|
| `/login` | Sign in (RHF + zod) | – | login form | supabase auth |
| `/register` | Sign up (RHF + zod) | – | register form | supabase auth, `profiles` |
| `/forgot-password` | Request reset (RHF) | – | email form | supabase auth |
| `/reset-password` | Set new password (RHF) | session | password form | supabase auth |
| `/verify-2fa` | TOTP MFA gate | partial | OTP form | MFA factors |
| `/onboarding` | First workspace creation (has a "Coming soon" option) | login | workspace form | `workspaces`, `workspace_members` |
| `/invite/[token]` | Accept team invite | token | accept form | `workspace_members`, invites |
| `/admin-login` | Admin console login (public per proxy) | – | login form | supabase auth + admin guard |
| `/invite-expired` `/payment-required` `/portal-expired` `/subscription-inactive` `/workspace-not-found` | `(states)` `StatePage` info screens | – | – | – |

## Area: App `(app)/app/**` (Auth=yes, WS=yes for all unless noted)
Grouped by section. Detail (`[id]`) routes share their section's tables.

### Home & account
| Path | Purpose | Forms | Tables (best-effort) |
|---|---|---|---|
| `/app` | Home dashboard (KPI strip + widgets) | – | aggregate (work, money, calendar, planning) |
| `/app/account` + `/profile /security /sessions /login /notifications /preferences /connected-accounts /data-privacy /activity` | Personal account settings (own `layout.tsx`, `AccountSideNav`) | profile/security/MFA/SAR forms | `profiles`, auth sessions, MFA, `account_requests`, audit |
| `/app/account-settings` | Legacy/combined account settings (RHF) | profile form | `profiles` |
| `/app/help` | In-app help | – | – |
| `/app/changelog` | In-app changelog | – | `changelog_entries` |

### Portfolio
| Path | Purpose | Forms/Wizard | Tables |
|---|---|---|---|
| `/app/portfolio` | Portfolio overview (AI review = "coming soon") | – | `properties`, `units`, `tenancies` |
| `/app/portfolio/properties` · `/new` · `/[id]` · `/[id]/edit` | Properties list/create-wizard/detail/edit | property wizard (multi-step), edit (RHF) | `properties`, `property_units` |
| `/app/portfolio/properties/[id]/hmo` + `/rooms /utilities /analytics` | HMO management subtabs | room/utility forms | hmo rooms/utilities |
| `/app/portfolio/units` · `/new` · `/[id]` · `/[id]/edit` | Units CRUD | unit forms (edit RHF) | `units` |
| `/app/portfolio/tenancies` · `/new` · `/[id]` · `/[id]/edit` | Tenancies CRUD (detail: msg "coming soon") | tenancy forms (edit RHF) | `tenancies` |
| `/app/portfolio/leasing` + `/prospects /viewings /agreements /vacancies` | Leasing pipeline (own `layout.tsx`, `LeasingTabNav`) | – | prospects, viewings, agreements |
| `/app/portfolio/gallery` `/map` `/timeline` | Gallery / map / timeline views | – | `properties` |

### Work
| Path | Purpose | Forms | Tables |
|---|---|---|---|
| `/app/work` · `/board` `/calendar` `/gantt` | Work hub + view types (some "view coming soon") | – | `jobs`, `tasks` |
| `/app/work/jobs` · `/new` · `/[id]` | Jobs list/create/detail | job form | `jobs` |
| `/app/work/tasks` · `/new` · `/[id]` | Tasks (detail subtab "content coming soon") | task form | `tasks` |
| `/app/work/ppm` + `/overview /schedules /schedules/new /timeline` · `/[id]` | Planned maintenance (seed fallback) | schedule form | ppm schedules |
| `/app/work/suppliers` · `/preferred` · `/[id]` | Suppliers (detail tab "coming soon") | rating/preference panels | `suppliers`, ratings, preferences |
| `/app/work/marketplace` | Supplier marketplace | – | suppliers |
| `/app/work/complaints` `/reports` | Complaints / reports | complaint form | complaints |

### Money
| Path | Purpose | Forms | Tables |
|---|---|---|---|
| `/app/money` | Money hub (`MoneyTabNav`) | quick-add form | invoices, bills, expenses |
| `/app/money/invoices` · `/new` · `/[id]` · `/[id]/edit` | Invoices (detail: upload/resend "coming soon") | invoice form | `invoices` |
| `/app/money/bills` · `/new` · `/[id]` · `/[id]/edit` | Bills (bulk actions "coming soon") | bill form | `bills` |
| `/app/money/expenses` `/income` `/arrears` `/deposits` `/rent-chase` `/activity` | Finance subviews (deposits & rent-chase have "coming soon" actions) | – | expenses, income, deposits, arrears |
| `/app/money/supplier-payments` | Stripe Connect payouts ("not yet configured") | – | connect accounts |
| `/app/money/stripe` | Stripe billing entry | – | – |
| `/app/money/affiliate` | Affiliate cash ledger | – | affiliate ledger |

### Accounting
| Path | Purpose | Forms | Tables |
|---|---|---|---|
| `/app/accounting` (+ `layout.tsx`, `AccountingTabNav`) | Accounting hub | – | ledger |
| `/app/accounting/accounts` · `/new` · `/overview` · `/journal-ledger` · `/[accountId]` | Chart of accounts + ledger | account form | accounts, journal |
| `/app/accounting/client-accounts` · `/disbursements/new` | Client money accounts | disbursement form | client accounts |
| `/app/accounting/reconciliation` · `/manual-transaction/new` | Bank reconciliation | manual txn form | transactions |
| `/app/accounting/forecast` · `/scenarios/new` | Forecasting | scenario form | forecasts |
| `/app/accounting/reports` · `/generate` | Reports | generate form | – |
| `/app/accounting/mtd` | HMRC MTD ("coming soon — flagged off") | – | – |

### Planning (largest section; sets have own `[id]/layout.tsx` + profiles `[slug]/layout.tsx`)
| Path | Purpose | Forms/Wizard | Tables |
|---|---|---|---|
| `/app/planning` | Planning hub (`PlanningTabNav`) | – | planning sets |
| `/app/planning/wizard` · `/[draftId]` | **9-step deal planning wizard** | full wizard (`WizardContext`) | planning sets, drafts |
| `/app/planning/sets` · `/new` · `/[id]` + 16 subtabs (`overview income expenses bills upfront-costs rooms-units compliance assumptions landlord-offer conversion forecasts scenarios risk ai-review tasks activity documents`) | Planning set detail subtabs | per-tab forms | planning sets + lines |
| `/app/planning/profiles` · `/[slug]` + 8 subtabs (`overview income-model cost-drivers compliance example-forecast starter-checklist risks ai-questions`) | Operating-profile reference pages | – | profile content |
| `/app/planning/landlord-offers` · `/new` · `/[id]` | LL offers (detail: duplicate "coming soon") | offer form | landlord_offers |
| `/app/planning/forecasts` `/scenarios` `/conversions` `/documents` `/activity` | Planning subviews | – | forecasts, scenarios |
| `/app/planning/portfolio-intelligence` `/yield-intelligence` | Intelligence dashboards (feature hooks) | – | aggregate |

### Compliance (own `layout.tsx`, `ComplianceTabNav`)
| Path | Purpose | Forms | Tables |
|---|---|---|---|
| `/app/compliance` `/overview` `/coverage` `/property-coverage` `/renewals` `/risk` `/reports` `/activity` `/evidence` `/supplier-docs` `/settings` | Compliance dashboards/subviews | – | certificates, inspections, documents |
| `/app/compliance/certificates` · `/new` · `/[id]` · `/[id]/edit` | Certificates CRUD | certificate form | `compliance_certificates` |
| `/app/compliance/inspections` · `/new` · `/[id]` · `/[id]/edit` | Inspections CRUD | inspection form | inspections |
| `/app/compliance/documents` · `/new` · `/[id]` | Compliance docs | document form + upload | documents |

### Legal (own `layout.tsx`, `LegalTabNav`)
| Path | Purpose | Forms/Wizard | Tables |
|---|---|---|---|
| `/app/legal` `/epc-advisory` `/rra-2026` `/rra2026` | Legal hub + advisory (⚠ `rra-2026` and `rra2026` look like duplicate routes) | – | – |
| `/app/legal/hmo-licences` · `/[licenceId]` | HMO licences | – | licences |
| `/app/legal/possession` · `/[caseId]` · `/new` + steps (`select-tenancy select-grounds review-evidence record-service notice-preview`) | **Possession-case wizard** (`PossessionWizardShell`) | multi-step wizard | possession cases |

### Contacts
| Path | Purpose | Forms | Tables |
|---|---|---|---|
| `/app/contacts` · `/people` `/organisations` `/board` `/map` `/timeline` `/activity` `/messages` `/documents` | Contacts hub + views (`ContactsTabNav`) | – | `contacts` |
| `/app/contacts/new` · `/[id]` · `/[id]/edit` | Contact CRUD (detail: 3 "coming soon" actions, edit RHF) | contact form | `contacts` |
| `/app/contacts/portal-access` | Grant external portal access | grant form | portal tokens |

### Calendar
| Path | Purpose | Forms | Tables |
|---|---|---|---|
| `/app/calendar` + `/day /week /month /agenda /gantt /timeline /schedule /views(+day/week/month/agenda/gantt)` | Calendar views (⚠ `/views/*` duplicates top-level view routes) | – | calendar items |
| `/app/calendar/events` · `/new` · `/[id]` · `/[id]/edit` | Events CRUD (detail: messaging "coming soon") | event form | events |
| `/app/calendar/reminders` · `/new` | Reminders | reminder form | reminders |
| `/app/calendar/settings` | Calendar prefs ("full persistence coming soon") | local prefs | – |

### Portals management (in-app side)
| Path | Purpose | Forms | Tables |
|---|---|---|---|
| `/app/portals` · `/access` · `/access/[id]` · `/profiles` · `/purposes` | Manage external portal grants (`PortalsTabNav`) | grant modal | portal_access_tokens |

### Messages
| Path | Purpose | Tables |
|---|---|---|
| `/app/messages` · `/conversations/[conversationId]` | Internal messaging surface | conversations, messages |

### Settings (split across two trees ⚠ redundancy)
| Path | Purpose | Tables |
|---|---|---|
| `/app/settings/compliance` `/calendar-notifications` `/payments-stripe` | Scattered settings pages | – |
| `/app/workspace-settings` + 24 subpages (`profile branding white-label team roles security sso billing subscription invoices addons storage data danger-zone audit ai copilot-inbox demo-data integrations email notifications navigation`) | Workspace settings (own `layout.tsx`, `WorkspaceSideNav`) — billing "alert()" if Stripe unset; email template editor "coming soon"; notifications push "coming soon"; SSO read-only placeholder | `workspaces`, `workspace_members`, audit, etc. |

## Area: Admin `(admin)/admin/**` (Admin=yes, AdminShell)
| Path | Purpose | Tables |
|---|---|---|
| `/admin` | Admin dashboard | aggregate |
| `/admin/customers` `/users` · `/users/[id]` | Customer/user management | `profiles`, auth |
| `/admin/workspaces` · `/[id]` `/portfolios` | Workspace/portfolio diagnostics | `workspaces` |
| `/admin/subscriptions` · `/[id]` `/stripe-events` `/affiliates` · `/[id]` | Billing/affiliate ops | subscriptions, stripe_events |
| `/admin/audit` `/security` `/health` `/ai-usage` | Ops & monitoring (security: "not yet wired" notice) | audit logs, health |
| `/admin/announcements` `/changelog` `/bugs` `/data-requests` | Content + GDPR ops | announcements, changelog, bug_reports, account_requests |
| `/admin/planning` `/work` `/settings` | Section admin views | – |

## Area: External portals
### `(portal)/portal/**` (session-cookie gated, feature-flagged)
| Path | Portal role | Purpose |
|---|---|---|
| `/portal` `/portal/login` `/portal/expired` `/portal/revoked` | – | Magic-link entry + states |
| `/portal/[sessionId]` | any | Session home |
| `/portal/[sessionId]/tenant` + `/tenancy /maintenance` | tenant | Tenant portal |
| `/portal/[sessionId]/landlord` + `/properties` | landlord | Landlord portal |
| `/portal/[sessionId]/supplier` + `/jobs /jobs/[id] /invoices` | supplier | Supplier portal |

### Persona shells `(tenant)/(landlord)/(supplier)` (authenticated-account portals)
| Path | Role | Purpose | Forms |
|---|---|---|---|
| `/tenant-portal` + `/tenancy /rent /maintenance /documents /viewings /messages /settings` | tenant | Tenant self-service | maintenance request, message |
| `/landlord-portal` + `/properties /properties/[id] /work /statements /documents /messages /settings` | landlord | Landlord self-service | message |
| `/supplier-portal` + `/jobs /jobs/[id] /invoices /invoices/[id] /settings` | supplier | Supplier self-service | quote/invoice forms |

### Affiliate `(affiliate)/affiliate/**` (Auth via proxy)
| Path | Purpose | Forms |
|---|---|---|
| `/affiliate` `/earnings` `/links` `/referrals` `/settings` `/signup` | Affiliate dashboard | link builder, settings |

---

## Area: API routes (`src/app/api/**`)
| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/auth/callback` · `/auth/callback` | GET | Supabase OAuth/email callback | session exchange |
| `/api/auth/rate-check` | POST | Login rate-limit check | public (rate-limited) |
| `/api/admin/init` | POST | One-time set `platform_role='admin'` for ADMIN_EMAIL | secret (`ADMIN_SETUP_SECRET`) |
| `/api/admin/account-process` | POST | GDPR worker driver (export/delete) | platform-admin |
| `/api/account/request` | POST | Create SAR / deletion request | user + password re-auth |
| `/api/billing/checkout` | POST | Create Stripe Checkout session | user |
| `/api/billing/portal` | POST | Open Stripe billing portal | user |
| `/api/billing/pay-invoice` | POST | Shareable Stripe pay link for invoice/bill | user |
| `/api/webhooks/stripe` | POST | Stripe webhook (sig-verified, idempotent, maps plan/status) | Stripe signature |
| `/api/connect/onboard` | POST | Create/resume Stripe Connect Standard (owner-only, flagged) | user (owner) |
| `/api/connect/status` | GET | Connect status for workspace | user (RLS) |
| `/api/entitlements` | GET | Safe client entitlement flags | user |
| `/api/ai/chat` | POST | AI Copilot chat (zod, gated, metered) | user + WS member |
| `/api/ai/actions` | POST | AI suggested-actions | user |
| `/api/upload` | POST | Server-proxied R2 upload (MIME allowlist, 10MB, storage gate, audit) | user |
| `/api/files/[...key]` | GET | Stream private R2 object (member-verified) | user (member) |
| `/api/pdf/invoice/[id]` | GET | Branded invoice/bill PDF | user |
| `/api/portals/grant` | POST | Provision portal magic-link (SHA-256 token, raw returned once) | user |
| `/api/portal/verify` | POST/GET | Consume magic-link token / verify session | token |
| `/api/portal/logout` | POST | Clear portal session cookie | session |
| `/api/portal/file` | GET | Stream file for portal session | portal session |
| `/api/email/welcome` | POST | Send welcome email post-signup | user (self) |
| `/api/email/invite` | POST | Send team invite email | user |
| `/api/newsletter/subscribe` | POST | Double opt-in signup (consent + Turnstile) | public |
| `/api/newsletter/confirm` | GET | Confirm opt-in via token | token |
| `/api/newsletter/unsubscribe` | GET | One-click unsubscribe via token | token |
| `/api/bug-report` | POST | Capture sanitised bug report | public (sanitised) |
| `/api/demo/seed` · `/demo/reset` | POST | Seed / reset demo workspace data | user |
| `/api/integrations/status` | GET | Which integrations are configured (booleans) | user |
| `/api/health` | GET | Public liveness probe (no secrets) | public |
| `/api/ready` | GET | Readiness probe (config presence booleans) | platform-admin |

## Known issues / flags surfaced during crawl
- **Duplicate-looking routes:** `/app/legal/rra-2026` vs `/app/legal/rra2026`; `/app/calendar/views/*` duplicating top-level `/app/calendar/{day,week,month,agenda,gantt}`; settings split between `/app/settings/*` and `/app/workspace-settings/*` (P7 redundancy candidate).
- **"Coming soon" / not-wired surfaces** (see Button & Action inventory): contacts detail, money deposits/bills/invoices/supplier-payments, calendar settings/events, planning landlord-offer duplicate, work tasks/suppliers/jobs view tabs, accounting MTD, admin security, workspace-settings email/notifications/SSO, onboarding option.
- **External-dependency gating:** Stripe Connect (supplier-payments, MTD), R2 storage (uploads/doc actions), push notifications — all degrade to messages when env unset.
- Tenant/landlord/supplier persona shells gate client-side; authoritative external-portal gate is the `(portal)/[sessionId]` layout + `/api/portal/verify`.
