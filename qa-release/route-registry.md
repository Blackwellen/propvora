# Route Registry

Last updated: 2026-06-20  
Discovery method: App Router folder scan + nav config + proxy.ts analysis

> Total routes discovered: ~600+ (pages + API)  
> Auth guard: `src/proxy.ts` — public path prefix list controls redirect behaviour

---

## Legend

| Column | Values |
|---|---|
| Auth | NONE / COOKIE / TOKEN (magic link) / ADMIN |
| Workspace | PM / SUPPLIER / CUSTOMER / PORTAL / ADMIN / PUBLIC |
| Status | LIVE / REDIRECT / TODO / UNKNOWN |

---

## 1. Property Manager Workspace — `/property-manager/*` (also aliased `/app/*`)

| ID | Route | Auth | Workspace | Parent Nav | Status | Notes |
|---|---|---|---|---|---|---|
| PM-001 | `/property-manager` | COOKIE | PM | Home | LIVE | Main dashboard |
| PM-002 | `/property-manager/portfolio` | COOKIE | PM | Portfolio | LIVE | Portfolio overview |
| PM-003 | `/property-manager/portfolio/properties` | COOKIE | PM | Portfolio | LIVE | Properties list |
| PM-004 | `/property-manager/portfolio/properties/new` | COOKIE | PM | Portfolio | LIVE | Create property wizard |
| PM-005 | `/property-manager/portfolio/properties/[id]` | COOKIE | PM | Portfolio | LIVE | Property detail |
| PM-006 | `/property-manager/portfolio/properties/[id]/overview` | COOKIE | PM | Portfolio | LIVE | Property overview tab |
| PM-007 | `/property-manager/portfolio/properties/[id]/units` | COOKIE | PM | Portfolio | LIVE | Property units tab |
| PM-008 | `/property-manager/portfolio/properties/[id]/tenancies` | COOKIE | PM | Portfolio | LIVE | Property tenancies tab |
| PM-009 | `/property-manager/portfolio/properties/[id]/work` | COOKIE | PM | Portfolio | LIVE | Property work tab |
| PM-010 | `/property-manager/portfolio/properties/[id]/financials` | COOKIE | PM | Portfolio | LIVE | Property financials tab |
| PM-011 | `/property-manager/portfolio/properties/[id]/compliance` | COOKIE | PM | Portfolio | LIVE | Property compliance tab |
| PM-012 | `/property-manager/portfolio/properties/[id]/documents` | COOKIE | PM | Portfolio | LIVE | Property documents tab |
| PM-013 | `/property-manager/portfolio/properties/[id]/settings` | COOKIE | PM | Portfolio | LIVE | Property settings tab |
| PM-014 | `/property-manager/portfolio/tenancies` | COOKIE | PM | Portfolio | LIVE | Tenancies list |
| PM-015 | `/property-manager/portfolio/tenancies/new` | COOKIE | PM | Portfolio | LIVE | Create tenancy wizard |
| PM-016 | `/property-manager/portfolio/tenancies/[id]` | COOKIE | PM | Portfolio | LIVE | Tenancy detail |
| PM-017 | `/property-manager/portfolio/units` | COOKIE | PM | Portfolio | LIVE | Units list |
| PM-018 | `/property-manager/portfolio/units/[id]` | COOKIE | PM | Portfolio | LIVE | Unit detail |
| PM-019 | `/property-manager/portfolio/timeline` | COOKIE | PM | Portfolio | LIVE | Activity timeline |
| PM-020 | `/property-manager/work` | COOKIE | PM | Work | LIVE | Work dashboard |
| PM-021 | `/property-manager/work/tasks` | COOKIE | PM | Work | LIVE | Tasks list |
| PM-022 | `/property-manager/work/tasks/new` | COOKIE | PM | Work | LIVE | Create task |
| PM-023 | `/property-manager/work/tasks/[id]` | COOKIE | PM | Work | LIVE | Task detail |
| PM-024 | `/property-manager/work/jobs` | COOKIE | PM | Work | LIVE | Jobs list |
| PM-025 | `/property-manager/work/jobs/new` | COOKIE | PM | Work | LIVE | Create job wizard |
| PM-026 | `/property-manager/work/jobs/[id]` | COOKIE | PM | Work | LIVE | Job detail |
| PM-027 | `/property-manager/work/board` | COOKIE | PM | Work | LIVE | Work board view |
| PM-028 | `/property-manager/work/gantt` | COOKIE | PM | Work | LIVE | Gantt view |
| PM-029 | `/property-manager/work/suppliers` | COOKIE | PM | Work | LIVE | Suppliers (work context) |
| PM-030 | `/property-manager/bookings` | COOKIE | PM | Bookings | LIVE | Bookings list |
| PM-031 | `/property-manager/listings` | COOKIE | PM | Listings | LIVE | Listings list |
| PM-032 | `/property-manager/marketplace/suppliers-hub` | COOKIE | PM | Suppliers | LIVE | Supplier marketplace hub |
| PM-033 | `/property-manager/planning` | COOKIE | PM | Planning | LIVE | Planning overview |
| PM-034 | `/property-manager/planning/sets` | COOKIE | PM | Planning | LIVE | Planning sets |
| PM-035 | `/property-manager/planning/landlord-offers` | COOKIE | PM | Planning | LIVE | Landlord offers |
| PM-036 | `/property-manager/planning/forecasts` | COOKIE | PM | Planning | LIVE | Forecasts |
| PM-037 | `/property-manager/planning/scenarios` | COOKIE | PM | Planning | LIVE | Scenarios |
| PM-038 | `/property-manager/planning/conversions` | COOKIE | PM | Planning | LIVE | Conversions |
| PM-039 | `/property-manager/planning/activity` | COOKIE | PM | Planning | LIVE | Plan activity |
| PM-040 | `/property-manager/contacts` | COOKIE | PM | Contacts | LIVE | Contacts overview |
| PM-041 | `/property-manager/contacts/people` | COOKIE | PM | Contacts | LIVE | People list |
| PM-042 | `/property-manager/contacts/people/[id]` | COOKIE | PM | Contacts | LIVE | Person detail |
| PM-043 | `/property-manager/contacts/organisations` | COOKIE | PM | Contacts | LIVE | Organisations |
| PM-044 | `/property-manager/contacts/messages` | COOKIE | PM | Contacts | LIVE | Messages |
| PM-045 | `/property-manager/contacts/documents` | COOKIE | PM | Contacts | LIVE | Documents |
| PM-046 | `/property-manager/portals` | COOKIE | PM | Portals | LIVE | Portals hub |
| PM-047 | `/property-manager/messages` | COOKIE | PM | Messages | LIVE | Messages |
| PM-048 | `/property-manager/money` | COOKIE | PM | Money | LIVE | Money overview |
| PM-049 | `/property-manager/money/invoices` | COOKIE | PM | Money | LIVE | Invoices |
| PM-050 | `/property-manager/money/income` | COOKIE | PM | Money | LIVE | Income |
| PM-051 | `/property-manager/money/expenses` | COOKIE | PM | Money | LIVE | Expenses |
| PM-052 | `/property-manager/money/arrears` | COOKIE | PM | Money | LIVE | Arrears |
| PM-053 | `/property-manager/accounting` | COOKIE | PM | Accounting | LIVE | Accounting overview |
| PM-054 | `/property-manager/affiliates` | COOKIE | PM | Affiliate | LIVE | Affiliate programme |
| PM-055 | `/property-manager/calendar` | COOKIE | PM | Calendar | LIVE | Calendar |
| PM-056 | `/property-manager/compliance` | COOKIE | PM | Compliance | LIVE | Compliance |
| PM-057 | `/property-manager/legal` | COOKIE | PM | Legal | LIVE | Legal |
| PM-058 | `/property-manager/automations` | COOKIE | PM | Automations | LIVE | Automations |
| PM-059 | `/property-manager/workspace-settings` | COOKIE | PM | Workspace | LIVE | Workspace settings |
| PM-060 | `/property-manager/workspace/billing` | COOKIE | PM | Billing | LIVE | Billing |
| PM-061 | `/property-manager/account` | COOKIE | PM | Account | LIVE | Account settings |

---

## 2. Supplier Workspace — `/supplier/*`

| ID | Route | Auth | Workspace | Parent Nav | Status | Notes |
|---|---|---|---|---|---|---|
| SUP-001 | `/supplier` | COOKIE | SUPPLIER | Overview | LIVE | Dashboard |
| SUP-002 | `/supplier/requests` | COOKIE | SUPPLIER | Work | LIVE | Requests pipeline |
| SUP-003 | `/supplier/jobs` | COOKIE | SUPPLIER | Work | LIVE | Jobs list |
| SUP-004 | `/supplier/jobs/[id]` | COOKIE | SUPPLIER | Work | LIVE | Job detail |
| SUP-005 | `/supplier/jobs/[id]/evidence` | COOKIE | SUPPLIER | Work | LIVE | Job evidence upload |
| SUP-006 | `/supplier/jobs/[id]/sign-off` | COOKIE | SUPPLIER | Work | LIVE | Job sign-off |
| SUP-007 | `/supplier/calendar` | COOKIE | SUPPLIER | Work | LIVE | Calendar |
| SUP-008 | `/supplier/services` | COOKIE | SUPPLIER | Work | LIVE | Services list |
| SUP-009 | `/supplier/services/[id]` | COOKIE | SUPPLIER | Work | LIVE | Service detail |
| SUP-010 | `/supplier/messages` | COOKIE | SUPPLIER | Comms | LIVE | Messages |
| SUP-011 | `/supplier/messages/conversations/[id]` | COOKIE | SUPPLIER | Comms | LIVE | Message thread |
| SUP-012 | `/supplier/finance` | COOKIE | SUPPLIER | Finance | LIVE | Finance overview |
| SUP-013 | `/supplier/accounting` | COOKIE | SUPPLIER | Finance | LIVE | Accounting |
| SUP-014 | `/supplier/profile` | COOKIE | SUPPLIER | Trust | LIVE | Public profile |
| SUP-015 | `/supplier/profile/preview` | COOKIE | SUPPLIER | Trust | LIVE | Profile preview |
| SUP-016 | `/supplier/compliance` | COOKIE | SUPPLIER | Trust | LIVE | Compliance docs |
| SUP-017 | `/supplier/reputation` | COOKIE | SUPPLIER | Trust | LIVE | Reviews/reputation (team only) |
| SUP-018 | `/supplier/insights` | COOKIE | SUPPLIER | Control | LIVE | Analytics (team only) |
| SUP-019 | `/supplier/automations` | COOKIE | SUPPLIER | Control | LIVE | Automations |
| SUP-020 | `/supplier/account` | COOKIE | SUPPLIER | System | LIVE | Workspace account (team only) |
| SUP-021 | `/supplier/settings` | COOKIE | SUPPLIER | System | LIVE | Workspace settings |
| SUP-022 | `/supplier/affiliate` | COOKIE | SUPPLIER | System | LIVE | Affiliate |
| SUP-023 | `/supplier/availability` | COOKIE | SUPPLIER | — | LIVE | Availability schedule |
| SUP-024 | `/supplier/schedule` | COOKIE | SUPPLIER | — | LIVE | Full schedule |
| SUP-025 | `/supplier/coverage` | COOKIE | SUPPLIER | — | LIVE | Coverage areas |
| SUP-026 | `/supplier/marketplace` | COOKIE | SUPPLIER | — | LIVE | Marketplace listing |
| SUP-027 | `/supplier/quotes` | COOKIE | SUPPLIER | — | LIVE | Quotes |
| SUP-028 | `/supplier/invoices` | COOKIE | SUPPLIER | — | LIVE | Invoices |
| SUP-029 | `/supplier/payouts` | COOKIE | SUPPLIER | — | LIVE | Payouts |
| SUP-030 | `/supplier/team` | COOKIE | SUPPLIER | System | LIVE | Team management (team only) |
| SUP-031 | `/supplier/verification` | COOKIE | SUPPLIER | — | LIVE | Business verification |
| SUP-032 | `/supplier/leads` | COOKIE | SUPPLIER | — | LIVE | Leads |
| SUP-033 | `/supplier/onboarding` | COOKIE | SUPPLIER | — | LIVE | Readiness checks |
| SUP-034 | `/supplier/help` | COOKIE | SUPPLIER | — | LIVE | Help |

---

## 3. Customer Workspace — `/customer/*` (rewrite of `/user/*`)

| ID | Route | Auth | Workspace | Status | Notes |
|---|---|---|---|---|---|
| CUS-001 | `/customer` | COOKIE | CUSTOMER | LIVE | Customer dashboard |
| CUS-002 | `/customer/stays` | COOKIE | CUSTOMER | LIVE | Stay search |
| CUS-003 | `/customer/bookings` | COOKIE | CUSTOMER | LIVE | My bookings |
| CUS-004 | `/customer/bookings/[id]` | COOKIE | CUSTOMER | LIVE | Booking detail |
| CUS-005 | `/customer/messages` | COOKIE | CUSTOMER | LIVE | Messages |
| CUS-006 | `/customer/saved` | COOKIE | CUSTOMER | LIVE | Saved properties |
| CUS-007 | `/customer/payments` | COOKIE | CUSTOMER | LIVE | Payment history |
| CUS-008 | `/customer/profile` | COOKIE | CUSTOMER | LIVE | Customer profile |
| CUS-009 | `/customer/lets` | COOKIE | CUSTOMER | LIVE | Lettings platform |
| CUS-010 | `/customer/lets/properties/[id]` | COOKIE | CUSTOMER | LIVE | Letting property detail |
| CUS-011 | `/customer/maintenance` | COOKIE | CUSTOMER | LIVE | Maintenance requests |
| CUS-012 | `/customer/notifications` | COOKIE | CUSTOMER | LIVE | Notifications |
| CUS-013 | `/customer/help` | COOKIE | CUSTOMER | LIVE | Help |

---

## 4. Tenant Portal — `/portal/[sessionId]/tenant/*` + `/tenant-portal/*`

| ID | Route | Auth | Status | Notes |
|---|---|---|---|---|
| TEN-001 | `/portal/login` | NONE | LIVE | Portal login page |
| TEN-002 | `/portal/expired` | NONE | LIVE | Expired session |
| TEN-003 | `/portal/revoked` | NONE | LIVE | Revoked access |
| TEN-004 | `/p/[token]` | TOKEN | LIVE | Magic link entry |
| TEN-005 | `/portal/[sessionId]/tenant/dashboard` | TOKEN | LIVE | Tenant dashboard |
| TEN-006 | `/portal/[sessionId]/tenant/tenancy` | TOKEN | LIVE | Tenancy details |
| TEN-007 | `/portal/[sessionId]/tenant/documents` | TOKEN | LIVE | Documents |
| TEN-008 | `/portal/[sessionId]/tenant/payments` | TOKEN | LIVE | Payments |
| TEN-009 | `/portal/[sessionId]/tenant/maintenance` | TOKEN | LIVE | Maintenance list |
| TEN-010 | `/portal/[sessionId]/tenant/maintenance/[id]` | TOKEN | LIVE | Maintenance detail |
| TEN-011 | `/portal/[sessionId]/tenant/maintenance/report` | TOKEN | LIVE | Report new issue |
| TEN-012 | `/portal/[sessionId]/tenant/messages` | TOKEN | LIVE | Messages |
| TEN-013 | `/tenant-portal` | COOKIE | LIVE | Dedicated tenant portal home |
| TEN-014 | `/tenant-portal/tenancy` | COOKIE | LIVE | Tenancy |
| TEN-015 | `/tenant-portal/documents` | COOKIE | LIVE | Documents |
| TEN-016 | `/tenant-portal/rent` | COOKIE | LIVE | Rent payments |
| TEN-017 | `/tenant-portal/maintenance` | COOKIE | LIVE | Maintenance |
| TEN-018 | `/tenant-portal/messages` | COOKIE | LIVE | Messages |
| TEN-019 | `/tenant-portal/viewings` | COOKIE | LIVE | Viewings |
| TEN-020 | `/tenant-portal/settings` | COOKIE | LIVE | Settings |

---

## 5. Landlord Portal — `/portal/[sessionId]/landlord/*` + `/landlord-portal/*`

| ID | Route | Auth | Status | Notes |
|---|---|---|---|---|
| LAN-001 | `/portal/[sessionId]/landlord/dashboard` | TOKEN | LIVE | Landlord dashboard |
| LAN-002 | `/portal/[sessionId]/landlord/properties` | TOKEN | LIVE | Properties |
| LAN-003 | `/portal/[sessionId]/landlord/properties/[id]` | TOKEN | LIVE | Property detail |
| LAN-004 | `/portal/[sessionId]/landlord/documents` | TOKEN | LIVE | Documents |
| LAN-005 | `/portal/[sessionId]/landlord/payments` | TOKEN | LIVE | Payments |
| LAN-006 | `/portal/[sessionId]/landlord/payments/[id]` | TOKEN | LIVE | Payment detail |
| LAN-007 | `/portal/[sessionId]/landlord/financials` | TOKEN | LIVE | Financials |
| LAN-008 | `/portal/[sessionId]/landlord/maintenance` | TOKEN | LIVE | Maintenance |
| LAN-009 | `/portal/[sessionId]/landlord/maintenance/[id]` | TOKEN | LIVE | Maintenance detail |
| LAN-010 | `/portal/[sessionId]/landlord/messages` | TOKEN | LIVE | Messages |
| LAN-011 | `/landlord-portal` | COOKIE | LIVE | Dedicated landlord portal home |
| LAN-012 | `/landlord-portal/properties` | COOKIE | LIVE | Properties |
| LAN-013 | `/landlord-portal/properties/[id]` | COOKIE | LIVE | Property detail |
| LAN-014 | `/landlord-portal/documents` | COOKIE | LIVE | Documents |
| LAN-015 | `/landlord-portal/messages` | COOKIE | LIVE | Messages |
| LAN-016 | `/landlord-portal/work` | COOKIE | LIVE | Work/maintenance |
| LAN-017 | `/landlord-portal/statements` | COOKIE | LIVE | Financial statements |
| LAN-018 | `/landlord-portal/settings` | COOKIE | LIVE | Settings |

---

## 6. Supplier Portal — `/portal/[sessionId]/supplier/*`

| ID | Route | Auth | Status | Notes |
|---|---|---|---|---|
| SPRT-001 | `/portal/[sessionId]/supplier/dashboard` | TOKEN | LIVE | Supplier portal dashboard |
| SPRT-002 | `/portal/[sessionId]/supplier/jobs` | TOKEN | LIVE | Jobs list |
| SPRT-003 | `/portal/[sessionId]/supplier/jobs/[id]` | TOKEN | LIVE | Job detail |
| SPRT-004 | `/portal/[sessionId]/supplier/invoices` | TOKEN | LIVE | Invoices |
| SPRT-005 | `/portal/[sessionId]/supplier/invoices/[id]` | TOKEN | LIVE | Invoice detail |
| SPRT-006 | `/portal/[sessionId]/supplier/documents` | TOKEN | LIVE | Documents |
| SPRT-007 | `/portal/[sessionId]/supplier/documents/[id]` | TOKEN | LIVE | Document detail |
| SPRT-008 | `/portal/[sessionId]/supplier/payments` | TOKEN | LIVE | Payments |
| SPRT-009 | `/portal/[sessionId]/supplier/payments/[id]` | TOKEN | LIVE | Payment detail |
| SPRT-010 | `/portal/[sessionId]/supplier/messages` | TOKEN | LIVE | Messages |

---

## 7. Platform Admin — `/admin/*`

| ID | Route | Auth | Status | Notes |
|---|---|---|---|---|
| ADM-001 | `/admin` | ADMIN | LIVE | Admin dashboard |
| ADM-002 | `/admin/affiliates` | ADMIN | LIVE | Affiliate management |
| ADM-003 | `/admin/ai-models` | ADMIN | LIVE | AI model config |
| ADM-004 | `/admin/ai-usage` | ADMIN | LIVE | AI usage stats |
| ADM-005 | `/admin/automations` | ADMIN | LIVE | Automation oversight |
| ADM-006 | `/admin/audit-log` | ADMIN | LIVE | Audit trail |
| ADM-007 | `/admin/customers/[id]` | ADMIN | LIVE | Customer detail |
| ADM-008 | `/admin/feature-flags` | ADMIN | LIVE | Feature flags |
| ADM-009 | `/admin/health` | ADMIN | LIVE | System health |
| ADM-010 | `/admin/maintenance-mode` | ADMIN | LIVE | Maintenance mode |
| ADM-011 | `/admin/marketplace` | ADMIN | LIVE | Marketplace hub |
| ADM-012 | `/admin/marketplace/disputes` | ADMIN | LIVE | Disputes |
| ADM-013 | `/admin/marketplace/lettings` | ADMIN | LIVE | Lettings |
| ADM-014 | `/admin/marketplace/moderation` | ADMIN | LIVE | Moderation |
| ADM-015 | `/admin/marketplace/oversight` | ADMIN | LIVE | Oversight |
| ADM-016 | `/admin/marketplace/payouts` | ADMIN | LIVE | Payouts |
| ADM-017 | `/admin/marketplace/suppliers` | ADMIN | LIVE | Suppliers |
| ADM-018 | `/admin/marketplace/transactions` | ADMIN | LIVE | Transactions |
| ADM-019 | `/admin/marketplace/workspaces` | ADMIN | LIVE | Workspaces |
| ADM-020 | `/admin/marketplace/workspaces/[id]` | ADMIN | LIVE | Workspace detail |
| ADM-021 | `/admin/risk/[workspaceId]` | ADMIN | LIVE | Risk assessment |
| ADM-022 | `/admin/subscriptions/[id]` | ADMIN | LIVE | Subscription detail |
| ADM-023 | `/admin/suppliers/[id]` | ADMIN | LIVE | Supplier verification |

---

## 8. Auth / Onboarding — Public + Post-Auth

| ID | Route | Auth | Status | Notes |
|---|---|---|---|---|
| AUTH-001 | `/login` | NONE | LIVE | Login (PM/Customer/Supplier tabs) |
| AUTH-002 | `/register` | NONE | LIVE | Registration |
| AUTH-003 | `/forgot-password` | NONE | LIVE | Password reset request |
| AUTH-004 | `/reset-password` | NONE | LIVE | Reset form |
| AUTH-005 | `/verify-2fa` | NONE | LIVE | 2FA verification |
| AUTH-006 | `/admin-login` | NONE | LIVE | Admin login |
| AUTH-007 | `/onboarding` | COOKIE | LIVE | PM onboarding wizard |
| AUTH-008 | `/onboarding/supplier` | COOKIE | LIVE | Supplier onboarding wizard |
| AUTH-009 | `/invite/[token]` | TOKEN | LIVE | Invite acceptance |

---

## 9. Marketing / Public Pages

| ID | Route | Auth | Status | Notes |
|---|---|---|---|---|
| MKT-001 | `/` | NONE | LIVE | Homepage |
| MKT-002 | `/about` | NONE | LIVE | About |
| MKT-003 | `/features` | NONE | LIVE | Features |
| MKT-004 | `/pricing` | NONE | LIVE | Pricing |
| MKT-005 | `/contact` | NONE | LIVE | Contact |
| MKT-006 | `/faq` | NONE | LIVE | FAQ |
| MKT-007 | `/affiliate-programme` | NONE | LIVE | Affiliate sign-up |
| MKT-008 | `/services` | NONE | LIVE | Services |
| MKT-009 | `/suppliers` | NONE | LIVE | Supplier discovery |
| MKT-010 | `/stays` | NONE | LIVE | Short-term stays |
| MKT-011 | `/help` | NONE | LIVE | Help centre |
| MKT-012 | `/legal` | NONE | LIVE | Legal hub |
| MKT-013 | `/legal/privacy` | NONE | LIVE | Privacy policy |
| MKT-014 | `/legal/terms` | NONE | LIVE | Terms of service |
| MKT-015 | `/legal/cookies` | NONE | LIVE | Cookie policy |
| MKT-016 | `/changelog` | NONE | LIVE | Changelog |
| MKT-017 | `/roadmap` | NONE | LIVE | Roadmap |
| MKT-018 | `/emergency` | NONE | LIVE | Emergency contacts |

---

## Notes

- `/app/*` routes are aliased/redirected to `/property-manager/*` — both exist but `/property-manager/` is the canonical URL
- The PM home page widgets still link to `/app/*` — this is **BLK-001** (routing bug, NEEDS_FIX)
- Portal magic-link sessions (`/p/[token]`) are verified server-side and redirect to `/portal/[sessionId]/*`
- Supplier workspace is behind `supplierWorkspace` feature flag (currently bypassed for QA)
