# Tenant Portal Redesign — Image Manifest

**Source:** `tenant-portal-images/` (9 images, `04_21_xx AM (1)–(9)`).
**Target portal:** the magic-link tenant portal at `src/app/(portal)/portal/[sessionId]/tenant/**` (workspace "JT Property Manager", tenant "Sarah Mitchell" — matches the designs). Shell = `PortalShell` + `PortalSideNavigation` + `PortalTopNavigation` + `portal-nav.ts` (grouped nav already OVERVIEW/TENANCY/FINANCE/SUPPORT, 1:1 with the designs).

## Global fixes (apply to the shared shell, all pages)
- **Remove** any circular help/question button at the bottom of the sidebar.
- **Add "Help & support"** as a clean chip/button in the **top nav** (right side, before the TENANT PORTAL badge) on every page.
- Keep sidebar bottom: workspace chip ("JT Property Manager" / "TENANT PORTAL"), user chip ("Sarah Mitchell" / "Signed in via secure portal"), Sign out, Collapse — nothing floating over them.
- One consistent content max-width + grid rhythm across all 9 pages (fix current inconsistent widths).

## Existing-route status
| exists | route (`…/tenant/`) |
|---|---|
| ✅ | `` (dashboard) · `tenancy` · `documents` · `payments` · `maintenance` · `messages` |
| ❌ NEW | `payments/[paymentId]` · `maintenance/[requestId]` · `maintenance/report` (wizard) |

The 6 existing pages are simpler than the designs → **rebuild to match**. 3 detail/wizard routes are **new**.

## Image map
| # | Image file | Page | Route | Active nav | Key layout |
|---|-----------|------|-------|-----------|-----------|
| 1 | `(1)` | **Dashboard "Welcome home"** | `/portal/[s]/tenant` | Dashboard | Property hero (14 Oak Lane: active, rent £2,150, deposit £2,480, 24 Sep 2025→26, next due 22 May 2026 "6 days", Download agreement / View tenancy) · 5 KPI cards (Next payment £2,750, Total paid £12,900, Open maintenance 2, Unread messages 3, Documents 12) · "What needs attention" · Quick actions · Recent payments · Maintenance overview · Messages · Upcoming timeline · Your contacts |
| 2 | `(2)` | **Tenancy details** | `/portal/[s]/tenant/tenancy` | Tenancy | Back link · hero (rent/deposit/dates/payment day/type/occupancy, Download agreement / Contact manager) · cards: Tenancy summary · Deposit protection · Occupants/named tenants · Included services & utilities · Key contacts · Important dates & milestones · Access & keys · House rules/building guidance · Property details · Recent tenancy events |
| 3 | `(3)` | **Documents** | `/portal/[s]/tenant/documents` | Documents | Back link · 4 summary cards (Total 28, Action required, Recently added 4, Signed 12) · search · filter chips (All/Tenancy/Compliance/Property/Inspections/Payments/Notices/More) · sort · table (name/category/uploaded/version/status/actions) · pagination · right panels: Recently shared, Request a document, Document help, Data secure |
| 4 | `(4)` | **Payments** | `/portal/[s]/tenant/payments` | Payments | Back link · Download statement / Make a payment · 5 KPIs (Next due £2,750, Monthly rent £2,150, Total paid £12,900, Account status, Deposit held £2,480) · payment-method panel · next-scheduled panel · ledger tabs (All/Rent/Credits/Charges/Deposit/Receipts) · date-range/filter/export · ledger table (date/desc/period/category/amount/running balance/status/action) · right panels: Upcoming rent schedule, Downloadable receipts, Recent statements, Payment support · deposit-protection footer |
| 5 | `(5)` | **Maintenance requests** | `/portal/[s]/tenant/maintenance` | Maintenance | Back link · Report a repair CTA · 4 KPIs (Open, Visits scheduled 1, Resolved 90d 3, Emergency) · emergency banner · tabs (Active/Completed) · filter/search · table (ID/issue/area/priority/reported/status/next step/action) · right panels: Quick help & troubleshooting, Preferred access, Upcoming appointment, Out-of-hours emergency · bottom strip (Message team / View messages / View history) |
| 6 | `(6)` | **Messages** | `/portal/[s]/tenant/messages` | Messages | "New message" CTA · search · filter chips (All/Unread/Maintenance/Payments/General) · conversation list (unread badges, timestamps) · thread (Inspection appointment header, Unread chip, Mark as unread, More) · secure banner · bubbles · subject + textarea + attach + quick links + Send · response-time notice · right panel: Linked property (14 Oak Lane), Tenancy details, Quick actions, Attachments in thread |
| 7 | `(7)` | **Payment detail** | `/portal/[s]/tenant/payments/[paymentId]` *(NEW)* | Payments | Back to payments · "June 2026 rent payment" · Download receipt / Download statement · summary (Amount £2,150, Received 16 Jun 2026, Status Received, Period, Property, Reference) · Payment breakdown · Payment timeline (Created/Due/Paid/Received) · Payment method · Linked tenancy · Receipt card · Notes · Payment support |
| 8 | `(8)` | **Maintenance request detail** | `/portal/[s]/tenant/maintenance/[requestId]` *(NEW)* | Maintenance | Back · "Boiler pressure issue" + ID/status badges · metadata (Property/Priority/Reported/Assigned contractor) · actions (Print/Download summary, Message about this request, More) · progress tracker (Reported/Triaged/Assigned/Visit scheduled/Resolved) · status note · cards: Issue summary, Contractor appointment, Activity & updates, Attachments & photos, Resolution & next steps, Charges if applicable, Need urgent help · bottom banner |
| 9 | `(9)` | **Report a repair (wizard)** | `/portal/[s]/tenant/maintenance/report` *(NEW)* | Maintenance | Back · "Report a repair" · stepper (Issue type / Location / Details / Access & contact / Photos / Review & submit) · active step "Tell us more about the issue" (Category, Specific issue, Urgency, Safety-risk toggle, Description, When started, Frequency, Symptom checkboxes) · side cards: Your property (14 Oak Lane), Request summary, Emergency guidance · Back / Save draft / Continue (Submit on final). **Draft persistence + per-step validation + creates a real request → detail page.** |

## Build order
Shell global fixes → primitives → Dashboard → Tenancy → Documents → Payments(+detail) → Maintenance(+detail) → Report wizard → Messages → data/RLS → QA (tsc/build/responsive/click-test).

## Data
Reuse the existing `src/lib/portal/data.ts` + `data-extra.ts` + `messaging-server.ts` (admin-client, session-scoped, RLS via `workspace_members`). Tenant scope = `tenancies.primary_contact_id`/`tenant_contact_id` + tenancy/property ids. Documents/photos via secure storage signed downloads. Maintenance = `jobs` rows (category 'maintenance'). Messages = `message_threads`/`messages`. Migrate only genuine gaps.
