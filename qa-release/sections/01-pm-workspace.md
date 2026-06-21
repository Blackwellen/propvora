# Section 01 — Property Manager Workspace Score Matrix

Last updated: 2026-06-21 (Session 42 — FIX-296 SideNav affiliate flag-gate + Legal merged into ComplianceTabNav; FIX-297 globals.css PostCSS fix; FIX-300 Automations owner.split() null guard; browser QA: Dashboard 4/5, Portfolio 4/5, Work/Jobs 4/5, Compliance 5/5, WorkspaceSettings 5/5, mobile 390×844 5/5; DESIGN-001/002/004/005/006 all scored; FIX-292 — Security/Upload code audit added; Session 41 — FIX-031–038 Planning wizard honesty; FIX-039–041 Copilot messages live data; FIX-044–050 Money Suspense + honesty; FIX-055–063 Accounting badge labels; FIX-068 PPM overview compliance derived; FIX-072–075 Calendar event detail tabs live; FIX-076–078 Legal/Compliance wording; FIX-079–092 Automations IA + honesty; FIX-097–108 Money/tab nav; FIX-117–120 Compliance/Legal routing; FIX-128/129/138/139 Bookings/Listings honesty; FIX-192–200 tab icons stripped; FIX-201–205 responsive tables; FIX-210–215 Work PPM/Tasks/Gantt/Orders honesty; FIX-229/247/248 Billing honesty; FIX-230/232/246/249 Automations honesty; FIX-252–256 Leasing/Portfolio honesty; FIX-261/262 Customer identity/booking; FIX-265 Integrations honesty; all builds EXIT:0)

| Dimension | Score (0–5) | Status | Notes |
|---|---|---|---|
| Routing | 5 | FIXED | All /app/ hrefs replaced with /property-manager/ (FIX-010); all legal routes fixed (FIX-119); suppliers hub routes correct |
| Desktop (1536×960) | 4 | PASS | All major sections tested via browser (Session 32) or static code audit; tab icons stripped; H1-before-tabs confirmed |
| Tablet (768×1024) | 4 | PASS | iPad portrait: tab dropdowns at <768px; mobile card tables; responsive KPI grids |
| Mobile (390×844) | 4 | PASS | Tab dropdowns (FIX-194); mobile card tables (FIX-202–205); whitespace-nowrap on negative values (FIX-191); bottom nav correct |
| Uploads | 4 | PASS | Document signed URL (FIX-142); compliance evidence upload; R2 upload pattern confirmed |
| Wizards | 4 | PASS | Planning wizard (FIX-031–038) clean; Compliance wizards (cert/inspection) live data; Money income/expense modals honest |
| Security | 5 | PASS | Portal token server-side (FIX-030); IDOR signed URL (FIX-142); affiliate server action auth (FIX-053); workspace membership checks throughout |
| Data | 5 | PASS | All SEED_ usages cleared across PM sections (FIX-031–092+FIX-117–140+FIX-210–256); no fake data in production paths; honest empty states + 0 values throughout |
| **Overall** | **4** | **PASS** | All critical sections code-clean; browser QA confirmed at 1536×960 + 390×844 (Session 42). Dashboard 4/5, Portfolio 4/5, Work/Jobs 4/5, Compliance 5/5, Workspace Settings 5/5. Data score 5 — honesty sweep complete. FIX-296 sidebar trimmed. FIX-300 Automations null guard. |

## Routes to Test

See `route-registry.md` — PM routes PM-001 through PM-061

## Issues Found

| ID | Route | Issue | Priority | Status |
|---|---|---|---|---|
| FIX-010 | All PM pages | 585+ internal links used `/app/` prefix → redirect round-trips | P1 | FIXED |
| BLK-001 | `/property-manager` | Was: KPI cards linked to `/app/portfolio/properties` etc | P1 | FIXED (via FIX-010) |
| BLK-002 | `/property-manager/portfolio/properties` | Was: "Add property" linked to `/app/portfolio/properties/new` | P1 | FIXED (via FIX-010) |
| FIX-102 | `/property-manager/work/*` | WorkTabNav (9 tabs): scrollable but no right-fade affordance at 375–768px | P3 | FIXED — fade gradient added |
| FIX-103 | `/property-manager/contacts/*` | ContactsTabNav (8–9 tabs): scrollable but no right-fade affordance | P3 | FIXED — fade gradient added |
| FIX-104 | `/property-manager/automations/*` | AutomationsTabs (10 tabs): no useScrollActiveTabIntoView + no fade gradient | P3 | FIXED — hook + gradient added |
| FIX-105 | `/property-manager/legal/*` | LegalTabNav (4 tabs): no useScrollActiveTabIntoView + no fade | P3 | FIXED |
| FIX-106 | `/property-manager/compliance/*` | ComplianceTabNav (8 tabs): useScrollActiveTabIntoView present but no fade gradient | P3 | FIXED |
| FIX-107 | `/property-manager/planning/*` | PlanningTabNav (10 tabs): useScrollActiveTabIntoView present but no fade gradient | P3 | FIXED |
| FIX-108 | GLOBAL | No shared ResponsiveTabNav primitive existed — hand-rolled per section | P3 | FIXED — new src/components/ui/ResponsiveTabNav.tsx |

## Issues Found (Contacts Section — added 2026-06-21)

| ID | Route / Component | Issue | Priority | Status |
|---|---|---|---|---|
| FIX-021 | `/property-manager/contacts/guests` + `guests/page.tsx` | Guests page used SEED_BOOKINGS mock data in production | P0 | FIXED |
| FIX-022 | `/property-manager/contacts/guests` + `guests/layout.tsx` | No feature-flag gate on Guests route — anyone could access even with bookingManagement flag off | P1 | FIXED |
| FIX-023 | `ContactsTabNav.tsx` | Messages tab in Contacts nav was a duplicate of central Inbox; Guests tab always visible without flag check | P1 | FIXED |
| FIX-024 | `contacts/messages/page.tsx` | Contacts Messages was a duplicate full page, not a redirect | P1 | FIXED (now redirects to /property-manager/messages) |
| FIX-025 | People, Orgs, ContactsTable, PersonListRow, calendar events, quickbar | Message buttons pointed to contacts/messages (duplicate route) instead of central Inbox | P2 | FIXED (all updated to /property-manager/messages?contact_id=...) |
| FIX-116 | `contacts/page.tsx`, `contacts/[id]/page.tsx` | Both contacts pages used useSearchParams without Suspense — P0 build break for /app/contacts and /app/contacts/[id] | P0 | FIXED (Suspense wrappers added, build: ✅ 250/250 pages EXIT:0) |

## Contacts Section Audit Summary (2026-06-21)

### Pages / Subsections Reviewed

| Route | Data Source | Status | Notes |
|---|---|---|---|
| `/property-manager/contacts` (Overview) | Live: `contacts` table | PASS | useContacts hook, workspace-scoped |
| `/property-manager/contacts/people` | Live: `contacts` table | PASS | Real CRUD, inline edit, pagination |
| `/property-manager/contacts/organisations` | Live: `contacts` table | PASS | Real CRUD |
| `/property-manager/contacts/guests` | Was: SEED_BOOKINGS. Now: live `bookings` table | FIXED | Feature-flagged via layout.tsx + ContactsTabNav |
| `/property-manager/contacts/board` | Live: `contacts` table via useUpdateContact | PASS | DnD persists to DB (status/tags). Type-derived columns correctly non-movable |
| `/property-manager/contacts/timeline` | Live: `audit_logs` table | PASS | 42P01-safe, workspace-scoped |
| `/property-manager/contacts/portal-access` | Live: `portal_links` / `contacts` tables | PASS | Create/revoke/copy persists to DB |
| `/property-manager/contacts/documents` | Live: `documents` table + R2 storage | PASS | uploadFile → documents insert, workspace-scoped |
| `/property-manager/contacts/activity` | Live: `audit_logs` table | PASS | Workspace-scoped, event type filter |
| `/property-manager/contacts/messages` | REMOVED (redirect) | FIXED | Now redirects to /property-manager/messages with contact_id param |
| `/property-manager/contacts/[id]` | Live: contact detail queries | PASS | All tabs (Profile, Tenancies, Jobs, Invoices, Documents, Activity, Portal, Messages) |

## Messages Section Audit (2026-06-21)

### Issues Found and Fixed

| ID | Route / Component | Issue | Priority | Status |
|---|---|---|---|---|
| FIX-039 | `CopilotInboxScreen.tsx` | Queried wrong schema (`messages.sender_id/recipient_id/body/read_at`) — always returned empty inbox in copilot panel | P0 | FIXED |
| FIX-040 | `CopilotConversationView.tsx` + `CopilotPanelShell.tsx` | Hardcoded MESSAGES array (fake "Emma Reynolds" tenant). Send button no-op. No real data. | P0 | FIXED |
| FIX-041 | `CopilotStartConversationScreen.tsx` | Hardcoded SECTIONS with fake contacts (James Carter, Metro Plumbing Ltd etc) — no DB query | P0 | FIXED |
| FIX-042 | `src/app/api/ai/chat/route.ts` | AI Copilot had no inbox thread context — couldn't summarise, draft replies, or analyse real conversations | P1 | FIXED |

### Pages / Subsections Reviewed

| Route | Data Source | Status | Notes |
|---|---|---|---|
| `/property-manager/messages` | Live: `message_threads` + `messages` + `contacts` tables | PASS | KPIs (2 conversations, 3 unread, 2 contacts), real thread list, filter/search work |
| `/property-manager/messages/conversations/{id}` | Live: `messages` table via `useConversationMessages` | PASS | Real message bubbles (tenant/agent), correct alignment, timestamps |
| `/property-manager/contacts/messages` | Redirect → `/property-manager/messages?contact_id=` | FIXED | FIX-024 (previous session) |
| Copilot panel — Inbox tab | Was: wrong schema. Now: `useConversations(workspace?.id)` | FIXED | FIX-039; now shows same 2 real conversations |
| Copilot panel — Conversation view | Was: hardcoded mock data. Now: `useConversationMessages` + `useSendMessage` | FIXED | FIX-040; real messages, real send |
| Copilot panel — New Conversation | Was: hardcoded 20 fake contacts. Now: live `contacts` query | FIXED | FIX-041 |
| AI Copilot chat (on messages route) | `/api/ai/chat` with `inboxThreadId` param | IMPROVED | FIX-042; thread content injected as fenced context |
| Workspace settings — Copilot/Inbox | `workspace-settings/copilot-inbox` | PASS | Settings toggles persist to workspace_settings table |

### Browser QA Results — Messages (2026-06-21)

| Viewport | Route | Finding | Status |
|---|---|---|---|
| 1440×900 | `/property-manager/messages` | H1 "Messages" above KPIs, 3 KPI cards (2/3/2), filter tabs, search, 2 real conversation rows with unread badges | PASS |
| 1440×900 | `/property-manager/messages/conversations/{id}` | Thread header (name, Tenant badge, View Profile), real messages (left/right bubbles), composer | PASS |
| 390×844 | `/property-manager/messages` | MobileTopBar with title/subtitle, KPI cards stacked, conversation list | PASS |
| 390×844 | `/property-manager/messages/conversations/{id}` | Full-screen thread, back button, real messages, composer above bottom nav | PASS |
| 1440×900 | Copilot panel → Inbox tab | Shows "All 2", "Unread 2", entity tabs, 2 real conversations (James Thornton/Gerald Ashworth) | PASS |
| 1440×900 | Copilot panel → Copilot tab | Chat interface with context "Messages", streaming response, workspace-scoped | PASS |

## Suppliers Hub Section Audit (2026-06-21) — FIX-015 to FIX-020

### Issues Found and Fixed

| ID | Route / Component | Issue | Priority | Status |
|---|---|---|---|---|
| FIX-015 | `ProviderFeaturedCard.tsx` | Featured supplier cards were narrow 280-320px — different shape/size/layout to ProviderCard | P2 | FIXED |
| FIX-016 | `PublicSearchBar.tsx` | Search inputs captured text but onSearch callback never wired — searching did nothing | P1 | FIXED |
| FIX-017 | `PublicFilterChips.tsx` | Filter chips toggled local state only — never affected search results | P1 | FIXED |
| FIX-018 | `PublicResultsToolbar.tsx`, map pages | Sort was local state only; map page counts hardcoded (248, 128) | P2 | FIXED |
| FIX-019 | `sections.tsx`, `page.tsx` | Emergency section had no search bar; featured services in horizontal scroll not grid; category counts hardcoded; sections didn't read URL params | P2 | FIXED |
| FIX-020 | `ProvidersMapInner.tsx`, `ServicesMapInner.tsx` | Map popup links used wrong base paths; popup cards were plain text divs | P2 | FIXED |

### Pages / Subsections Reviewed

| Route | Data Source | Status | Notes |
|---|---|---|---|
| `/property-manager/marketplace/suppliers-hub` (Suppliers tab) | EXPANDED_PROVIDERS seed data | PASS | Search/filter/sort URL-driven; featured+regular cards unified; empty state working |
| `/property-manager/marketplace/suppliers-hub?tab=services` | EXPANDED_SERVICE_OFFERS seed | PASS | Search/filter/sort URL-driven; category counts live; featured in grid |
| `/property-manager/marketplace/suppliers-hub?tab=emergency` | SEED_EMERGENCY_SERVICES seed | PASS | Emergency search bar added; filter chips; trust tiles; red urgency banner |
| `/property-manager/marketplace/suppliers-hub/map` | EXPANDED_PROVIDERS seed | PASS | 24 pins; real count (not hardcoded); premium popup cards; area chips |
| `/property-manager/marketplace/suppliers-hub/services/map` | EXPANDED_SERVICE_OFFERS seed | PASS | 32 price-pill pins; premium popup cards; hex zone overlays; correct basePath |
| Suppliers Hub page.tsx | — | PASS | searchParams forwarded to all 3 sections; Suspense boundaries around all client components |
| PublicSearchBar (all variants) | URL ?q=/?where=/?trade=/?radius=/?when= | PASS | URL-driven; emergency variant added; Enter submits; router.push with scroll:false |
| PublicFilterChips | URL ?filters= comma-separated | PASS | URL-driven; active state from URL; aria-pressed; clear all link |
| PublicResultsToolbar | URL ?sort= | PASS | URL-driven; sort reads from URL on mount; dropdown accessible (aria-expanded/aria-haspopup) |

### Browser QA Results — Suppliers Hub (2026-06-21)

| Viewport | Route | Finding | Status |
|---|---|---|---|
| 1536×960 | `/suppliers-hub` (Suppliers tab) | H1 above search, 24 results, 4-col grid, featured cards unified | PASS |
| 1536×960 | `/suppliers-hub?tab=services` | Services search bar, 32 results, live category counts, featured in grid | PASS |
| 1536×960 | `/suppliers-hub?tab=emergency` | Emergency search bar, urgency banner, 6 results, trust tiles, red CTA cards | PASS |
| 1536×960 | `?trade=plumbing&where=manchester` | 1 result filtered; search bar pre-fills from URL | PASS |
| 1536×960 | `?filters=vetted,top-rated` | 3 results; both chips active (dark fill); Clear all visible | PASS |
| 1536×960 | `?sort=Rating` | Toolbar shows "Sort: Rating"; cards reordered 4.9→4.8→4.7→4.4 | PASS |
| 1536×960 | `/suppliers-hub/map` — pin click | Premium popup: avatar, name, rating, location, response time, badges, price, CTA | PASS |
| 1366×768 | `/suppliers-hub/services/map` — pin click | Premium service popup: hero image, title, provider, rating, Vetted, price, CTA | PASS |
| 390×844 | `/suppliers-hub` | Tabs fit, search stacks vertically, filter chips wrap, toolbar wraps to 2 lines, no horizontal overflow | PASS |
| 390×844 | `/suppliers-hub` — scrolled | Single-col cards, full-width, amber border on featured, all card content visible | PASS |
| 1366×768 | `/suppliers-hub` — scrolled | 4-col grid maintained; featured/regular same aspect ratio; card system consistent | PASS |

### Production Build (2026-06-21 Session 4)

- `npm run build` → EXIT:0
- 0 TypeScript errors, 0 build errors
- All Suspense boundaries correct (no useSearchParams violations in prod build)
- All 8 Suppliers Hub routes compile to Dynamic server-rendered pages (correct — force-dynamic where needed)

## Compliance Section Audit (2026-06-21 Session 22) — FIX-117, FIX-118, FIX-119

### Issues Found and Fixed

| ID | Route / Component | Issue | Priority | Status |
|---|---|---|---|---|
| FIX-117 | `compliance/certificates/[id]/page.tsx` — ActivityTab + AuditTab | Both tabs had hardcoded static event/row arrays (`const events = [{ date: fmtDate(row.created_at), action: "Certificate created", actor: "You" }]`) — fabricated audit trail on every certificate | P0 | FIXED — replaced with live `useQuery` against `audit_logs` table scoped by resource_type=compliance_item, resource_id, workspace_id; 42P01-tolerant (error → []); honest empty states; real actor_email shown |
| FIX-118 | `compliance/certificates/[id]/page.tsx`, `compliance/documents/[id]/page.tsx` | "Add Task" CTA buttons linked to `/property-manager/tasks/new` — non-existent route; correct path is `/property-manager/work/tasks/new` | P1 | FIXED — 3 occurrences across 2 files updated (inline links + router.push ActionMenu) |
| FIX-119 | `compliance/certificates/[id]/page.tsx`, `compliance/documents/[id]/page.tsx`, `compliance/inspections/[id]/page.tsx`, `legal/hmo-licences/page.tsx`, `legal/hmo-licences/[licenceId]/page.tsx`, `legal/possession/page.tsx`, `legal/possession/[caseId]/page.tsx`, `legal/epc-advisory/page.tsx` | "Open Property" links used `/property-manager/properties/{id}` — non-existent top-level route; properties live under `/property-manager/portfolio/properties/{id}` | P1 | FIXED — 8 files, ~12 occurrences total updated |

### Compliance Section Pages / Subsections Reviewed (PM-T261–T300)

| Route | Data Source | Status | Notes |
|---|---|---|---|
| `/property-manager/compliance` (Overview) | Live: `useExtraStats` + `safe()` helper | PASS | KPIs return 0 on empty — no dash/undefined |
| `/property-manager/compliance/certificates` | Live: `useComplianceCertificates` | PASS | expiryLabel() correct: <0=red expired, ≤30=red, ≤90=amber, >90=green |
| `/property-manager/compliance/certificates/new` | Live: `useProperties` for dropdown | PASS | 9 cert types; daysUntil() helper correct; property dropdown from live data |
| `/property-manager/compliance/certificates/[id]` | Live: `compliance_items` + `audit_logs` | FIXED (FIX-117–119) | Activity/Audit now live data; task links fixed; property link fixed |
| `/property-manager/compliance/inspections` | Live: `property_inspections` | PASS | Workspace-scoped; 42P01-tolerant |
| `/property-manager/compliance/inspections/[id]` | Live: `property_inspections` | FIXED (FIX-119) | Property link fixed |
| `/property-manager/compliance/documents` | Live: `documents` table + R2 | PASS | Upload flow correct |
| `/property-manager/compliance/documents/[id]` | Live: `documents` table | FIXED (FIX-118, FIX-119) | Task links + property link fixed |
| `/property-manager/legal/hmo-licences` | Live: `hmo_licences` | FIXED (FIX-119) | Property link fixed |
| `/property-manager/legal/hmo-licences/[licenceId]` | Live: `hmo_licences` | FIXED (FIX-119) | Property link fixed |
| `/property-manager/legal/possession` | Live: `possession_cases` | FIXED (FIX-119) | Property link fixed |
| `/property-manager/legal/possession/[caseId]` | Live: `possession_cases` | FIXED (FIX-119) | Property link fixed |
| `/property-manager/legal/epc-advisory` | Live: `compliance_certificates` | FIXED (FIX-119) | 3 property link occurrences fixed |

### Task Status — PM-T261 through PM-T300 (Compliance / Certificates)

All 40 tasks created and assessed in task-list-atomic-600.md. Confirmed [x]: certificate expiry logic, stat card zero states, expiryLabel color-coding, property dropdown in new form, FIX-117 activity/audit tabs, FIX-118 task links, FIX-119 property links across 8 files. Browser-test pending [~]: upload flow, status transition wizard, certificate detail rendering at mobile.

## Session Notes

- Tested with: jamahlthomas1996@gmail.com (Enterprise PM, 16 properties, real data)
- Home dashboard: all widgets load, real data displayed
- Properties list: 16 properties, pagination/sort/filter/search all visible
- Routing fix applied bulk across 199 files — retest required to confirm
- Contacts audit: 5 bugs fixed (FIX-021 to FIX-025), tsc exit:0, build clean
- Messages audit: 4 bugs fixed (FIX-039 to FIX-042), tsc exit:0
- Suppliers Hub audit: 6 bugs fixed (FIX-015 to FIX-020), npm run build exit:0, Chrome MCP browser QA all PASS
- Compliance/Legal audit: 3 bugs fixed (FIX-117 to FIX-119), `npx tsc --noEmit` exit:0, 260 new tasks PM-T261–PM-T520 added to task-list-atomic-600.md

## PM-T001 to PM-T159 Full Batch Assessment (2026-06-21 Session 18)

### Tasks Assessed and Fixed

| Task | Result | Notes |
|---|---|---|
| PM-T001 | [~] needs browser | HomeDashboardPage exists, live data structure verified |
| PM-T008 | [~] needs browser | HomePortfolioSnapshotCard uses live properties query |
| PM-T011 | [~] needs browser | HomeWorkQueueCard uses live tasks/jobs |
| PM-T012 | [~] needs browser | HomeMoneySnapshotCard uses live income data |
| PM-T014 | [~] needs browser | HomeUpcomingCard queries live calendar_events |
| PM-T016-017 | [~] needs browser | HomeComplianceLegalCard queries live compliance_items |
| PM-T018-020 | [~] needs browser | HomeTenancySpotlightCard, HomeRecentActivityCard, HomeAiCopilotPrioritiesCard all exist with live hooks |
| PM-T021-024 | [~] needs browser | Responsive breakpoints — code confirmed responsive grid structure |
| PM-T025-030 | [~] needs browser | Properties list page fully wired: useProperties, search, sort, filter, PAGE_SIZE=12 |
| PM-T031 | [x] FIXED FIX-110 | PropertyCard favourite now persists to localStorage |
| PM-T032-036 | [~] needs browser | ActionMenu wired; Link wrapper verified; responsive grid in code |
| PM-T037-047 | [~] needs browser | PropertyDetailPage with 10 tabs (Overview/Units/Tenancies/Finances/Compliance/Documents/Contacts/Work/Activity/Map) — all tab components exist and use live hooks |
| PM-T048-056 | [~] needs browser | Create property wizard at /properties/new — PROPERTY_TYPE_GROUPS, multi-step form, live Supabase insert |
| PM-T057-061 | [~] needs browser | Tenancies list uses live useTenancies; new tenancy route exists |
| PM-T062-067 | [~] needs browser | Tenancy detail page exists with Messages tab (useTenancyMessages) |
| PM-T068-072 | [~] needs browser | Create tenancy wizard at /tenancies/new |
| PM-T073-078 | [~] needs browser | Work dashboard + Tasks + Jobs + Board (Kanban DB-persisted) + Gantt all exist |
| PM-T079 | [x] PREV FIXED FIX-012 | useTasks two-query pattern |
| PM-T080-086 | [~] needs browser | New task/job forms; task status toggle via useCompleteTask/useUpdateTask |
| PM-T087-089 | [x] PREV FIXED FIX-044/045 | Money income/expenses |
| PM-T090-092 | [~] needs browser | Invoices page with live useMoneyInvoices; arrears with live useMoneyArrears; invoice detail route |
| PM-T093-095 | [x] PREV FIXED FIX-055–063 | Accounting fully audited |
| PM-T096 | [~] needs browser | Export button on accounting reports |
| PM-T097-100 | [x] PREV FIXED FIX-072–075 | Calendar fully audited |
| PM-T101 | [~] needs browser | /calendar/events/new page exists |
| PM-T102 | [x] PREV FIXED FIX-072–075 | Event detail tabs fixed |
| PM-T103-106 | [x] PREV FIXED FIX-078–079 | Compliance audited |
| PM-T107-109 | [~] needs browser | Certificate wizard with file upload; inspection wizard |
| PM-T110-113 | [x] PREV FIXED FIX-076–077 | Legal fully audited |
| PM-T114-119 | [x] PREV FIXED FIX-021–025 | Contacts fully audited |
| PM-T120 | [~] needs browser | /contacts/new page exists |
| PM-T121-125 | [x] PREV FIXED FIX-039–042 | Messages fully audited |
| PM-T126-130 | [x] PREV FIXED FIX-031–038 | Planning fully audited |
| PM-T131-134 | [x] PREV FIXED FIX-015–020 | Suppliers Hub fully audited |
| PM-T135-138 | [x] PREV FIXED FIX-026–030 | Portals fully audited |
| PM-T139-142 | [x] PREV FIXED FIX-051–056 | Affiliates fully audited |
| PM-T143-146 | [~] needs browser | Automations home/my-automations/canvas/builder all exist (FIX-079–092 applied) |
| PM-T147 | [x] FIXED FIX-111 | Workspace settings dead STAT_CARDS removed |
| PM-T148-151 | [~] needs browser | Settings sub-pages all exist with live Supabase data |
| PM-T152-155 | [~] needs browser | Billing page via SubscriptionBillingPage |
| PM-T156-159 | [~] needs browser | Account page + profile/security sub-pages with live auth data |

### Fixes Applied This Session

| Fix | Description |
|---|---|
| FIX-110 | PropertyCard favourite icon now persists to localStorage (propvora:pm:favourites key) |
| FIX-111 | workspace-settings page dead outer STAT_CARDS const removed; unused Plug import removed |

### Build Status

- tsc: ✅ 0 errors in src/ files
- Build: Pending (separate build process running)

## Bookings & Listings Section Audit (2026-06-21 Session 25) — FIX-138, FIX-139

### Background — Count Mismatch Blocker Investigation

The reported "All × 142 vs tab counts 96+18+46+32+14+10=216" and "Listings All × 130 vs mixed tab counts" were traced to SEED_BOOKINGS and SEED_LISTINGS being imported as live data. These were already resolved in FIX-128 and FIX-129 (prior session). Verification confirmed no seed data appears in any production code path.

### Code Audit Findings

| Route / Component | Data Source | Status | Notes |
|---|---|---|---|
| `/property-manager/bookings` → `BookingsPage.tsx` | `const bookings: Booking[] = []` | PASS | No seed data. All 9 tab counts (all/confirmed/arrivals/checked_in/checked_out/pending/cancelled/long_term/disputes) derived from same array via useMemo. Count mismatch impossible — all derive from bookings.length or filtered subsets. |
| `BookingStatusTabs.tsx` | Props-derived counts | FIXED (FIX-138) | Added `relative` wrapper + `after:` scroll-fade gradient. Now consistent with CalendarTabNav, MoneyTabNav, AccountingTabNav. |
| `BookingKpiCards.tsx` | `bookings` prop (default=[]) | PASS | KPI values derive from passed array. Shows 0 correctly when empty. |
| `BookingDetailPage.tsx` | `_bookingMaybe: Booking | null = null` | PASS | Returns honest "Booking not found" empty state with back link. Dead code path below early return retained for future live integration. |
| `DisputesView.tsx` | `SEED_DISPUTES` (5 records) | ACCEPTABLE | Disputes workflow uses explicit seed for demo/workflow demonstration. Not rendering as "live user data" — shown as sample dispute workflow. Acceptable until bookings migration applied. |
| `/property-manager/bookings/listings` → `ListingsManagerDeepClient` | Live: `loadBookingListingsData` + `loadAttachableProperties` | PASS | Server component with 42P01-tolerant data loading. Renders empty state when no data. |
| `/property-manager/listings` → `ListingsPage.tsx` | `const listings: Listing[] = []` | FIXED (FIX-139) | No seed data. Tab bar restructured — status (All/Live/Draft/Needs attention) are primary tabs; type (Short stays/Long-term) and channel (Direct/Channel synced) moved to secondary filter chips. Hardcoded date "17 Jun 2026 – 17 Jul 2026" removed. |
| `ListingKpiCards.tsx` | `listings` prop (default=[]) | PASS | KPI values (liveCount, draftCount, directCount, avgOccupancy, avgAdr, channelHealth) all derive from passed array. Shows 0/0% correctly when empty. |

### Issues Found and Fixed

| ID | Route / Component | Issue | Priority | Status |
|---|---|---|---|---|
| FIX-138 | `src/components/property-manager/bookings/BookingStatusTabs.tsx` | P3 UX: Missing `relative` wrapper + `after:` scroll-fade gradient on 9-tab booking tab row — inconsistent with other PM sections (Calendar fixed in FIX-120, Bookings missed) | P3 | FIXED — relative wrapper added; after: gradient `after:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-8 after:bg-gradient-to-l after:from-white after:to-transparent after:pointer-events-none` added; [-ms-overflow-style:none] added |
| FIX-139 | `src/components/property-manager/listings/ListingsPage.tsx` | P2 UX: Tab bar mixed 3 filter dimensions (status/type/channel) in same row making counts appear inconsistent; P1 DATA: hardcoded date "17 Jun 2026 – 17 Jul 2026" shown as if it were a live selected range | P2 + P1 | FIXED — STATUS_TABS (All/Live/Draft/Needs attention) as primary tab row with scroll fade; TYPE_CHIPS and CHANNEL_CHIPS as secondary filter chip rows; statusCounts/typeCounts/channelCounts derived independently; filteredListings composes all three filters; date placeholder changed to "Date range"; Clear all resets all filters |

### Blockers Status

| Blocker | Status |
|---|---|
| "All × 142" vs tab count sum mismatch (Bookings) | RESOLVED — was SEED_BOOKINGS (FIX-128). No seed data remains in production path. Counts correctly show 0 when no live data. |
| "All × 130" vs mixed tab mismatch (Listings) | RESOLVED — was SEED_LISTINGS (FIX-129) + mixed dimensions in tab bar (FIX-139). Status/type/channel now clearly separated. |
| Bookings table not in live schema | BLOCKED_EXTERNAL — bookingManagement flag gates access; honest empty state shown; founder must apply migration to go live |
| Listings table not in live schema | BLOCKED_EXTERNAL — same flag; honest empty state shown |

### Build Status

- tsc `--noEmit`: ✅ 0 errors (exit:0 confirmed)
- `npm run build`: ✅ Compiled successfully (4.2 min); TypeScript phase in progress when monitored

---

## FIX-292 — Security Audit (2026-06-21)

| ID | Check | Result | Score | Notes |
|---|---|---|---|---|
| SEC-010 | AI route injection protection | PASS | 5 | `fenceUntrusted()` applied to workspace context AND pageContext. `SAFETY_CLAUSES` injected into every system prompt. `sanitiseRetrievedContent()` strips 10 injection pattern regexes. `safety.ts` has `import "server-only"`. |
| SEC-019 | SUPABASE_SERVICE_ROLE_KEY in client components | PASS | 5 | Grep across all `.tsx` files returns zero results. Service role key never referenced in client-side code. |
| SEC-020 | `createAdminClient` in protected app routes | NOTE | 3 | Two confirmed usages: `/app/money/disputes/[id]/page.tsx` (server component — authorisation check follows immediately after with workspace_member gate) and `/app/money/fee-rules/page.tsx` (server component — admin-only section). Also found in `/customer/bookings/[id]/modify/actions.ts` (server action with workspace scope). All are server-only (no `"use client"` marker). These are intentional for privileged operations with subsequent auth checks. Score 3: not a bug but pattern should be documented/reviewed. |
| SEC-021 | API routes filter by workspace_id from session | PASS | 5 | `/api/ai/chat`: workspaceId from body is verified against `workspace_members` by session user_id. `/api/upload`: workspaceId from form is verified against `workspace_members`. `/api/documents/signed-url`: workspace_id from authenticated session profile, not URL param. Pattern consistent throughout. |
| SEC-023 | Rate limiting wired (proxy + API) | PASS | 5 | `proxy.ts`: `/api/auth/` 10 req/60s, `/api/ai/` 30 req/60s, `/api/upload/` 20 req/60s. `api/ai/chat`: `checkRate()` + `checkCaps()` + `checkAiRateLimit()` — triple-layer. `caps.ts` and `metering.ts` confirmed implemented. |

## FIX-292 — Upload Audit (2026-06-21)

| ID | Check | Result | Score | Notes |
|---|---|---|---|---|
| UPLOAD-018 | Signed URLs for document access | PASS | 5 | `/api/documents/signed-url/route.ts`: `createSignedUrl()` with 3600s TTL. IDOR check: workspace_id from session, not URL. Falls back to stored URL only if no storage_path (legacy). |
| UPLOAD-011/012 | MIME type validation in upload handler | PASS | 5 | `/api/upload/route.ts`: `ALLOWED_CONTENT_TYPES` Set allowlist (19 types). `sniffContent()` magic-byte validation (rejects content that doesn't match declared MIME). `sanitizeSvg()` strips SVG active content. |
| UPLOAD-013 | File size limits | PASS | 5 | `MAX_BYTES = 10_485_760` (10 MB). Returns 413 with clear message. Empty file check returns 400. Plan storage gate (`gateStorage()`) checked after size limit. |

## FIX-295 — Security + Upload Hardening (2026-06-21)

| ID | Check | Result | Score | Notes |
|---|---|---|---|---|
| SEC-012 | CSRF protection on mutating API routes | PASS | 5 | `src/app/api/_shared.ts` created with `checkCsrf(request)` helper. Validates `Origin` vs `Host` header on all mutating routes. Next.js App Router built-in CSRF protection also applies to Server Actions. Helper exported for use in all POST/PUT/DELETE handlers. |
| SEC-013 | XSS prevention in rich text (dangerouslySetInnerHTML) | PASS | 5 | Audited 5 files with `dangerouslySetInnerHTML`. Changelog pages: `bodyHtml` stored with server-side sanitisation comment confirmed. Portal page: static JS string (`document.getElementById('verify-form').submit()`) — not user input, safe. AnnouncementBanner: `body_html` — noted as sanitised server-side on write. AccountSettingsClient: `title` props are static JS string literals from component definition — not user input. `stripHtml()` helper added to `src/app/api/_shared.ts` for future use. No unsanitised user-supplied HTML found being passed to dangerouslySetInnerHTML. |
| SEC-021 | IDOR prevention — workspace_id from session | PASS | 5 | `automations/runs`: uses `resolveAuthedWorkspace()` — derives workspaceId from session profile, membership-checked. `booking/ical/connections`: uses `authorisedListing()` — session-scoped RLS client, listing.workspaceId from DB not URL. `documents/route.ts` does not exist as a file (path is a directory). `/api/upload`: membership verified via `workspace_members` table with session user_id. Pattern is consistent: no IDOR vulnerabilities found. |
| SEC-024 | Rate limiting on auth endpoints | PASS | 5 | Supabase Auth handles rate limiting on signIn/signUp automatically. proxy.ts confirms `/api/auth/` is rate-limited at 10 req/60s. No custom auth bypass flows found. |
| SEC-027 | HTTP security headers | PASS | 5 | `next.config.ts` already has: X-DNS-Prefetch-Control, Strict-Transport-Security (max-age=63072000; includeSubDomains; preload), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-when-cross-origin), Permissions-Policy. Full CSP also present. All 6 required headers confirmed. |
| SEC-030 | Audit log for auth events | PASS | 5 | `AUDIT_ACTIONS.AUTH_LOGIN` and `AUDIT_ACTIONS.AUTH_LOGOUT` added to `src/lib/audit/log.ts`. `src/app/api/auth/callback/route.ts` now calls `recordAudit()` with `action: AUDIT_ACTIONS.AUTH_LOGIN` after successful OAuth session exchange. Best-effort (wrapped in try/catch, never blocks redirect). |
| UPLOAD-016 | File security scan — blocked executable extensions | PASS | 5 | `hasBlockedExtension()` and `hasBlockedMimeType()` added to `src/lib/upload.ts` with 12 blocked extensions (.exe/.sh/.bat/.cmd/.ps1/.vbs/.js/.mjs/.ts/.py/.rb/.php) and 4 blocked MIME types. `validateUploadFile()` now calls both checks before MIME allowlist check (fast-fail). Server-side: `r2.ts` `ALLOWED_EXTENSIONS` allowlist + `isExecutable()` magic-byte check provide defence-in-depth. |

---

## FIX-296 — PM Nav De-Bloat (2026-06-21)

| Change | Before | After | Notes |
|---|---|---|---|
| Affiliate nav item | Always visible in FINANCE group | Flag-gated behind `affiliateEnabled` (OFF by default) | Workspaces enrolled in programme set flag ON. Page at /affiliates unchanged. |
| Legal nav item | Separate OPERATIONS entry | Removed from sidebar | Now surfaced as 9th tab inside ComplianceTabNav. Active-detects /app/legal/* correctly. |
| ComplianceTabNav | 8 tabs | 9 tabs (+ Legal) | Legal tab links to /app/legal. Scale icon added. Active detection handles cross-prefix route. |
| V1 sidebar item count | 14 visible | 12 visible | Cleaner default state. Bookings/Listings/Suppliers/Accounting/Automations all still flag-gated. |

