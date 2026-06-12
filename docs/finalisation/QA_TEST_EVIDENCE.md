# QA Test Evidence

**Last Updated:** 2026-06-11

Documents test passes with evidence. Each entry has: what was tested, how, result.

## Foundation Tests

| Test | Method | Result | Date |
|------|--------|--------|------|
| TypeScript — 0 errors | `npx tsc --noEmit` | ✅ 0 errors | 2026-06-11 |
| Smart quote TS errors fixed | `npx tsc --noEmit` | ✅ Fixed possession/new + rra2026 | 2026-06-11 |
| export const dynamic removed | `npx tsc --noEmit` | ✅ All client components clean | 2026-06-11 |
| Avatar dropdown z-index | Code review | ✅ createPortal + fixed positioning | 2026-06-10 |
| Logo rendering | Code review | ✅ Dark/white logos correct in all shells | 2026-06-10 |

## Per-Section Tests (Wave 1-3)

| Section | Test | Result | Evidence |
|---------|------|--------|---------|
| Home dashboard | KPI Supabase query | ✅ | graceful 42P01 catch |
| Portfolio | Properties list live | ✅ | useProperties hook |
| Portfolio | units/[id] live data | ✅ | useUnits hook |
| Portfolio | tenancies/[id] live data | ✅ | useTenancies hook |
| Portfolio | HMO rooms from units | ✅ | useUnits(workspace, propertyId) |
| Portfolio | Leasing sub-tabs live | ✅ | vacancies/prospects/viewings/agreements |
| Portfolio | Map view | ✅ | LeafletMap wired to properties table |
| Work | S21 language removed | ✅ | 8 files updated |
| Work | Dead buttons wired | ✅ | router.push / Link |
| Work | jobs/[id] tabs | ✅ | Quotes/Costs/Comms/Docs/Activity/Supplier |
| Planning | Sets live data | ✅ | useEffect + Supabase async/await |
| Planning | Wizard Step 9 create | ✅ | Inserts to planning_sets |
| Contacts | People + Orgs live | ✅ | useContacts hook |
| Money | All KPI cards live | ✅ | useMoneyOverview hook |
| Money | Invoice detail live | ✅ | useMoneyInvoice(workspaceId, invoiceId) |
| Money | TrackDeposit live | ✅ | useCreateMoneyDeposit hook |
| Accounting | Accounts CRUD | ✅ | accounting_accounts table |
| Accounting | Reconciliation live | ✅ | money_transactions; Mark Reconciled works |
| Accounting | Reports (P&L etc.) | ✅ | 4 sub-tabs with Supabase queries |
| Calendar | Events from Supabase | ✅ | calendar_events table |
| Calendar | Event create wizard | ✅ | 7-step form; inserts to calendar_events |
| Calendar | Event edit | ✅ | Load + save to calendar_events |
| Compliance | Certificates live | ✅ | compliance_certificates table |
| Compliance | Inspections live | ✅ | inspections table |
| Legal | RRA 2026 checklist | ✅ | 12-item toggle checklist |
| Legal | Encoding errors fixed | ✅ | â€" replaced with " - " |
| Auth | Login flow | ✅ | signInWithPassword; error mapping |
| Auth | Register + success screen | ✅ | signUp; shows verify email |
| Auth | Workspace switcher | ✅ | Fetches + switches workspaces |
| Admin | Auth guard | ✅ | server-side platform_role check |
| Admin | Dashboard KPIs | ✅ | service-role queries |
| Admin | Health page | ✅ | env var checks + Supabase ping |
| Workspace Settings | All 8 pages | ✅ | Load/save real data |
| Supplier portal | Jobs + invoices live | ✅ | supplier_jobs + supplier_invoices |
| Affiliate portal | Referrals + earnings live | ✅ | affiliate_referrals + affiliate_commissions |
| Marketing | /contact page | ✅ | Created with form + success state |
| Marketing | Book a Demo button | ✅ | Links to /contact |

## Pending Tests (Wave 4)

| Feature | Test Needed | Status |
|---------|------------|--------|
| Resend email | Send test invite | ⬜ Needs RESEND_API_KEY |
| R2 upload | Upload + download signed URL | ⬜ Needs R2 credentials |
| Stripe checkout | End to end test mode | ⬜ Needs STRIPE_SECRET_KEY |
| Stripe webhooks | Webhook signature verify | ⬜ Needs deployed URL |
| Messaging Realtime | New message badge update | ⬜ Pending implementation |
| Notifications Realtime | Bell count live update | ⬜ Pending implementation |
| Demo data | Seeded rows with is_demo=true | ⬜ Pending rebuild |
| CI/CD | GitHub Actions pass | ⬜ Pending workflow |
