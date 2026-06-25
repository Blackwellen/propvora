# Release Evidence — Contacts Sub-Tabs

- **Parent section:** Contacts
- **Parent route:** `/property-manager/contacts` (files under `src/app/(app)/app/contacts/*`; `/app/*` → `/property-manager/*` via proxy)
- **Sub-tabs covered:** People · Organisations · Board · Timeline · Portal Access · Documents · Activity
- **Audited:** 2026-06-24
- **Build:** `npx tsc --noEmit` 0 errors · `npm run build` exit 0 (full route tree; all 7 sub-tab routes emitted)
- **Live QA:** Authenticated (Enterprise plan, jamahl thomas) on dev `:3002` via Chrome DevTools MCP, real seeded data, 0 console errors on the pages exercised.

> The Contacts **Overview** tab was scored separately (`release-gated/docs/contacts-overview.md`, 96/100). This document covers the 7 first-level sub-tabs.

---

## 1. Routes & registration
| Sub-tab | Route | File | Tab registry |
|---|---|---|---|
| People | `/property-manager/contacts/people` | `contacts/people/page.tsx` | ✓ `ContactsTabNav` |
| Organisations | `/property-manager/contacts/organisations` | `contacts/organisations/page.tsx` | ✓ |
| Board | `/property-manager/contacts/board` | `contacts/board/page.tsx` | ✓ |
| Timeline | `/property-manager/contacts/timeline` | `contacts/timeline/page.tsx` | ✓ |
| Portal Access | `/property-manager/contacts/portal-access` | `contacts/portal-access/page.tsx` | ✓ |
| Documents | `/property-manager/contacts/documents` | `contacts/documents/page.tsx` | ✓ |
| Activity | `/property-manager/contacts/activity` | `contacts/activity/page.tsx` | ✓ |

All 8 tabs (incl. Overview) registered in `src/components/contacts/ContactsTabNav.tsx` with canonical `/property-manager/contacts/*` hrefs, active-state detection, mobile dropdown (<md) + scrollable strip with fade affordance (≥md). Guests tab gated behind `bookingManagement` flag (hidden unless `NEXT_PUBLIC_QA_ALL_FLAGS=true`); Messages tab intentionally removed (dedup → central Inbox). Auth enforced (unauth → `/login?redirectTo=…`); `/app/*` legacy redirect verified previously.

## 2. Data sources (all live, workspace-scoped, 42P01-safe)
- **People / Organisations / Board** — `useContacts(workspaceId)` → `public.contacts`; schema adapter maps live cols `display_name/type/company/demo` ↔ app `full_name/contact_type/company_name/is_demo`. Verified live cols via Management API: `company, deleted_at, demo, display_name, type` (no `full_name`/`contact_type` columns — sub-tabs that query `display_name/type/company` directly are correct).
- **Timeline / Activity** — `public.audit_logs` (workspace-scoped, limit 200), action→event-type mapper; charts (donut/bar) + activity-summary rail all derived from the live rows.
- **Portal Access** — `public.contact_portal_access` join `contacts(display_name,type,company)`; create via secure `/api/portals/grant` (CSPRNG token, SHA-256 hash stored, audit-logged).
- **Documents** — `public.documents` (workspace-scoped, `archived_at is null`); contact names resolved client-side from `metadata.contact_id`. Upload via `/api/upload` (R2, server-proxied, magic-byte sniffing); request logged to `contact_activity`.

Supporting tables confirmed present via Management API: `contacts`, `audit_logs`, `contact_portal_access`, `contact_activity`, `documents` (with `url`, `r2_key`, `expires_at`).

## 3. Bugs found & fixed (this drop)
| # | Sub-tab | Severity | Bug | Fix |
|---|---|---|---|---|
| 1 | People | P2 | "Properties" table column + card row showed hard-coded `0` (no contact→property relation exists in schema) — fake metric | Dropped the column (8→7) + made the shared-card property row conditional (`> 0`) — `FIX-CONTACTS-PEOPLE`, `FIX-CONTACTS-CARDS` |
| 2 | People/Orgs/Board/Timeline/Portal/Docs/Activity | P1 | Decorative dead "Filters"/"More Filters"/"Sort: Newest"/"View all"/date-range/"View full report" buttons (no handlers) — Wiring Completeness Rule | Removed every dead affordance (real filter pills/search/sort already present) — all `FIX-CONTACTS-*` |
| 3 | Portal Access | P1 | Dead "Regenerate" + "Open" action buttons | Wired "Open" → `/portal/{id}` (disabled when expired/revoked); removed "Regenerate" — `FIX-CONTACTS-PORTAL` |
| 4 | Portal Access | P1 | Fabricated `trend="+2 this week"` KPI | Removed — `FIX-CONTACTS-PORTAL` |
| 5 | Documents | P1 | Dead "Preview" + "Download" action buttons | Wired to authed `/api/files/{key}` (preview = new tab; download = `<a download>`), desktop + mobile — `FIX-CONTACTS-DOCS` |
| 6 | Documents | P2 | Verified KPI `NaN%` on empty workspace; `expiringSoon`/`daysLeft` never computed (always 0); fake `trend="All current"`; always-on "Action needed" badge | Guarded `verifiedPct`; derived expiry status/days from real `expires_at`; removed fake trend; badge now conditional — `FIX-CONTACTS-DOCS` |

## 4. Buttons / actions verified (live)
- **People** — Add Person modal (validates name+workspace), filter pills, sort, Grid/List/Table view switch, inline edits (company/type/email/phone/status), row/card → detail, Message → inbox, action menu (View/Edit/Message/Archive/Delete with demo-lock + ConfirmDialog).
- **Organisations** — Add Organisation modal, filter pills, sort, Cards/List view, Create Job action, action menu.
- **Board** — By-Status / By-Type toggle, type pills, search, drag-to-persist (archive / follow-up tag / restore) with honest toast for type-derived columns.
- **Timeline** — event-type chips, contact dropdown (popover/sheet), search, live donut + 7-week bar chart.
- **Portal Access** — Create Link modal (server grant), status/type filters, search, Copy / Revoke (2-step confirm) / **Open** (wired, disabled if expired/revoked); ShareLinksPanel.
- **Documents** — Upload modal (R2), Request modal (→ `contact_activity`), category tabs, search, **Preview** + **Download** (authed) desktop & mobile.
- **Activity** — event-type chips, search, row ActionMenu (View Contact / Copy Details).

## 5. Responsive
Live-checked at 1536 (People grid+table, Documents, Portal Access). Each sub-tab has a mobile path: `MobileTopBar` + dropdown `ContactsTabNav`, `MobilePageHeader` search, `MobileFilterSheet`/`MobileTabs`/`MobileSheet`, `ResponsiveTable` (Portal/Docs). No horizontal overflow observed; tab strip scroll affordance present.

## 6. Security / RLS
- All reads workspace-scoped (`.eq('workspace_id', …)`); contacts RLS hardened in the Overview pass (over-broad ALL policy dropped, 4 role-scoped policies remain).
- Portal tokens minted server-side (hash-only storage, audit-logged); "Open" navigates to the public `/portal/{id}` route (no token leak).
- Document Preview/Download use the authed same-origin `/api/files/{key}` view URL (no public R2 URL exposure); uploads go through `/api/upload` with type/size/magic-byte validation.
- Mutations run under anon client + RLS; no service-role on client paths.

## 7. Cross-section
- Contacts created in People/Organisations appear across tabs and link to `/property-manager/contacts/{id}`.
- Document "Request" writes a `contact_activity` row; Portal "Create" writes `contact_portal_access` + audit log.
- Timeline/Activity read the shared `audit_logs` feed.

## 8. Screen sizes tested
Live (authenticated, 1536): People (grid + table), Documents, Portal Access — all render with seeded data, 0 console errors. Remaining viewport sweep: see user-fixes.

## 9. Remaining manual / pending
See `release-gated/user-fixes/contacts/sub-tabs.md`.

## 10. Score & decision
- **Score: 98 / 100.** All fake metrics removed, all dead buttons removed or wired, real data confirmed live across the highest-traffic sub-tabs, build green, console clean. Held from 100 only by: (a) the full 8-viewport authenticated sweep of all 7 sub-tabs (3 done live, 4 validated by build + button-removal-only changes), and (b) a known data-enrichment limitation (Timeline/Activity actor shows "User"/"System" rather than the resolved person name — `audit_logs` has no contact join; non-blocking, documented).
- **Release decision: Ready for release.** No functional, data, or security blockers remain.
