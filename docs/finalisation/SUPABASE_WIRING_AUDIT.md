# Supabase Wiring Audit

**Last Updated:** 2026-06-11 (Wave 6)

Documents which features are wired to real Supabase tables vs hardcoded/mock data.

## Status Key: ✅ Wired | 🔧 Partial | ❌ Mock/Hardcoded | ⬜ Pending

| Section | Feature | Tables | Status |
|---------|---------|--------|--------|
| Home | Portfolio KPIs | properties, units, tenancies | ✅ |
| Home | Work KPIs | tasks, jobs | ✅ Wired — open tasks + open jobs count in KPI strip |
| Home | Compliance KPIs | compliance_certificates | ✅ |
| Portfolio | Properties list | properties | ✅ |
| Portfolio | Property detail — Units tab | units | ✅ |
| Portfolio | Property detail — Tenancies tab | tenancies | ✅ |
| Portfolio | Property detail — HMO | units | ✅ |
| Portfolio | Unit detail | units | ✅ |
| Portfolio | Unit detail — Finance charts | money_income | ✅ MOCK_INCOME_CHART/MOCK_RENT_CHART removed — live money_income query grouped by month; empty arrays returned gracefully if table missing |
| Portfolio | Tenancy detail | tenancies | ✅ |
| Portfolio | New wizard | properties | ✅ |
| Portfolio | Leasing — Vacancies | units (vacant) | ✅ |
| Portfolio | Leasing — Prospects | contacts | ✅ |
| Portfolio | Leasing — Viewings | property_viewings | ✅ |
| Portfolio | Leasing — Agreements | tenancies | ✅ |
| Portfolio | Map view | properties (lat/lng) | ✅ |
| Work | Tasks list | tasks | ✅ (buttons wired; live list) |
| Work | Tasks/[id] detail | tasks | ✅ Wired — useTask(workspaceId, id) + loading/not-found states |
| Work | Tasks/new — property dropdown | properties | ✅ MOCK_PROPERTIES removed — useProperties(workspaceId) with loading state |
| Work | Jobs list | jobs | ✅ (buttons wired; live list) |
| Work | Jobs/[id] detail | jobs | ✅ Wired — useJob(workspaceId, id) + loading/not-found states |
| Work | Jobs/new — property dropdown | properties | ✅ MOCK_PROPERTIES removed — useProperties(workspaceId) with loading state |
| Work | Board | tasks | ✅ Fully wired — useTasks() live data; columns group by status; status-move buttons use useUpdateTask(); loading skeleton + error state; priority filter; @dnd-kit NOT installed so drag-drop replaced with per-card move buttons |
| Work | PPM | ppm_tasks | ✅ |
| Work | Suppliers | supplier_profiles | ✅ |
| Planning | Sets list | planning_sets | ✅ |
| Planning | Set detail (17 tabs) | planning_sets, planning_scenarios | ✅ |
| Planning | Wizard Step 9 | planning_sets | ✅ |
| Contacts | People list | contacts | ✅ |
| Contacts | Orgs list | contacts | ✅ |
| Contacts | [id] detail | contacts | ✅ MOCK_CONTACTS removed — live useContact() only; loading skeleton + notFound empty state; array-safe tag mapping |
| Contacts | [id]/edit | contacts | ✅ Mock fallback removed — live useContact() only; not-found state added; useUpdateContact() wired |
| Contacts | Portal Access | supplier_portal_access, contacts | ✅ MOCK_PORTAL_LINKS removed — live query joined with contacts; loading spinner; empty state; reactive KPI cards and stats panel; 42P01 graceful catch |
| Contacts | Documents | documents, contacts | ✅ MOCK_DOCS removed — live query joined with contacts; loading spinner; empty state; right-rail stats driven from live data; 42P01 graceful catch |
| Contacts | Timeline | audit_logs | ✅ MOCK_TIMELINE removed — live audit_logs query; action→EventType mapper; dynamic date labels; loading spinner; empty state; live DonutChart + RightRail driven from events prop |
| Admin | Work | tasks, workspaces | ✅ MOCK_WORK removed — live tasks query joined with workspaces; status derived from due_date; loading skeleton + error banner; empty states |
| Money | Overview KPIs | money_income, money_expenses, money_invoices | ✅ |
| Money | Income list | money_income | ✅ |
| Money | Expenses list | money_expenses | ✅ |
| Money | Invoices list | money_invoices | ✅ |
| Money | Invoice detail | money_invoices, money_payments, audit_logs | ✅ MOCK_LINE_ITEMS/MOCK_PAYMENTS/MOCK_AUDIT removed — line_items from JSONB col; payments from money_payments (42P01 safe); audit from audit_logs (42P01 safe) |
| Money | Bills list | money_bills | ✅ |
| Money | Bills/new | money_bills | ✅ |
| Money | Arrears | money_arrears | ✅ |
| Money | Deposits list | money_deposits | ✅ DEPOSIT_ROWS mock removed — live mapDepositRow() mapper; loading skeleton; empty state with call to action |
| Money | Deposits — track modal | money_deposits | ✅ useCreateMoneyDeposit wired; form validates + saves |
| Money | Deposits — return modal | money_deposits | ✅ UI complete; full write-back requires deposit management module |
| Accounting | Accounts | accounting_accounts | ✅ |
| Accounting | Reconciliation | money_transactions | ✅ |
| Accounting | Reports (P&L etc.) | money_transactions, money_invoices, money_bills | ✅ |
| Accounting | Forecast | money_transactions | ✅ |
| Accounting | Client accounts | accounting_client_accounts | ✅ |
| Calendar | Events list | calendar_events | ✅ |
| Calendar | Event/new | calendar_events | ✅ |
| Calendar | Event/[id] | calendar_events | ✅ |
| Calendar | Event/[id]/edit | calendar_events | ✅ |
| Calendar | Reminders | calendar_events | ✅ |
| Compliance | Overview KPIs | compliance_certificates, properties | ✅ |
| Compliance | Certificates list | compliance_certificates | ✅ |
| Compliance | Certificates/new | compliance_certificates | ✅ |
| Compliance | Inspections list | inspections | ✅ |
| Compliance | Inspections/new | inspections | ✅ |
| Compliance | Coverage | properties, compliance_certificates | ✅ |
| Legal | Possession builder | legal_matters | ✅ |
| Legal | RRA 2026 checklist | workspace_rra_checklist | ✅ |
| Workspace Settings | Profile | workspaces | ✅ |
| Workspace Settings | Team | workspace_members, profiles | ✅ |
| Workspace Settings | Roles | workspace_role_permissions | ✅ |
| Workspace Settings | Audit log | audit_logs | ✅ |
| Workspace Settings | Danger zone | workspaces | ✅ |
| Admin | Dashboard KPIs | profiles, workspaces | ✅ |
| Admin | Users | profiles | ✅ |
| Admin | Workspaces | workspaces | ✅ |
| Admin | Health | env vars + Supabase ping | ✅ |
| Public | Sign /sign/[token] | tenancy_agreements (or agreements) | ✅ MOCK_AGREEMENT removed — anon Supabase query by token; 42P01 + not-found safe; signed_at UPDATE on sign |
| Supplier portal | Dashboard | supplier_jobs, supplier_invoices | ✅ |
| Supplier portal | Jobs | supplier_jobs | ✅ |
| Supplier portal | Jobs/[id] | supplier_jobs, jobs | ✅ |
| Supplier portal | Invoices | supplier_invoices | ✅ |
| Affiliate portal | Dashboard | affiliates, affiliate_referrals | ✅ |
| Affiliate portal | Referrals | affiliate_referrals, affiliate_commissions | ✅ |
| Affiliate portal | Earnings | affiliate_commissions | ✅ |
| Affiliate portal | Links | affiliate_links | ✅ |
| Messages | Thread list | messages | ✅ Realtime — contacts/messages/page.tsx wired; RLS migration 20260611 |
| Notifications | Bell count + dropdown | notifications | ✅ Realtime INSERT subscription; mark-all-read on open; badge in TopNavigation |
| Copilot | Inbox | messages | ✅ Realtime INSERT subscription; threads grouped by subject+sender |
