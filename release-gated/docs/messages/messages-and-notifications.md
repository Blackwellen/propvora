# Release Evidence — Messages & Notifications

**Section:** Messages and Inbox · Notifications · Chat bubble · Portal messaging
**Date:** 2026-06-24
**Branch:** qa-release-fixes-304-314
**Author:** Claude Code (Opus 4.8)

---

## 1. Surfaces / routes / components covered

| Surface | Route | File | Status |
|---|---|---|---|
| Messages inbox | `/property-manager/messages` | `src/app/(app)/app/messages/page.tsx` | Live |
| Conversation detail | `/property-manager/messages/conversations/{id}` | `src/app/(app)/app/messages/conversations/[conversationId]/page.tsx` | Live |
| **Notifications feed (NEW)** | `/property-manager/notifications` | `src/app/(app)/app/notifications/page.tsx` | **Built this drop** |
| Notification preferences | `/property-manager/account/notifications` | `src/app/(app)/app/account/notifications/page.tsx` | Live (settings only) |
| Notification bell | header (all PM routes) | `src/components/shell/NotificationBell.tsx` | Live (re-pointed this drop) |
| Floating bubble | header (all PM routes) | `src/components/ai/ChatBubble.tsx` | **AI Copilot only** — not human messaging |
| Customer notifications feed | `/user/notifications` | `src/app/(customer)/customer/notifications/page.tsx` | Live |
| Supplier notifications feed | `/supplier/notifications` | `src/app/(supplier-workspace)/supplier/notifications/page.tsx` | Live |
| Shared data layer | — | `src/hooks/useMessages.ts` | Live |
| Notification service | — | `src/lib/notifications/{service,emitters,routes}.ts` | Live |

---

## 2. The question that started this drop

> "Where do I see notification messages — it really should have had its own tab in Messages, shouldn't it?"

**Finding:** In the PM workspace, notifications were only visible in the bell dropdown
(8 most recent). There was **no full notifications feed**, and the bell's
"View all notifications →" link pointed at `/property-manager/account/notifications`,
which is the **preferences page** (toggles/quiet-hours/channels) — not a feed. So the
one "see everything" affordance landed on settings. Both customer and supplier
workspaces already had proper feed pages; the operator workspace did not.

**Decision (design):** Keep Notifications and Messages as **separate surfaces** (they
are different data models — `notifications` vs `message_threads`/`messages` — and the
portals already treat them separately). Do **not** fold notifications into a Messages
tab. Instead, build the missing operator notifications feed and route the bell to it.

---

## 3. Changes made this drop

### FIX-MSG-NOTIF-FEED — new operator notifications feed
`src/app/(app)/app/notifications/page.tsx` (new)
- Premium page matching the Messages benchmark: KPI strip (Total / Unread / Categories),
  `All` / `Unread` segmented control, category filter (derived from notification `kind`),
  date-grouped list (Today / Yesterday / Earlier this week / This month / Older),
  per-row severity icon + colour, unread dot, relative time, deep-link routing.
- Reads the live `notifications` table scoped to `user_id` (RLS-safe), newest first,
  paginated (30/page + "Load more").
- **Realtime**: subscribes to `INSERT` on `notifications` filtered to the current user;
  prepends new rows; channel cleaned up on unmount / workspace switch.
- **Mark-all-read** and **mark-one-read** with optimistic UI + rollback on error
  (writes `read_at` + `read`).
- Empty / loading (skeleton) / error (with retry) states all present.
- Responsive: `MobileTopBar` on phones (refresh + settings + mark-all overflow),
  desktop header with actions; uses `DashboardContainer` for shell-width parity.
- Accessibility: `aria-label`s on controls, focus-visible rings, keyboard-activatable
  rows, semantic select for category filter.

### FIX-MSG-NOTIF-BELL — re-point "View all"
`src/components/shell/NotificationBell.tsx`
- "View all notifications →" now routes to `/property-manager/notifications` (the feed).
- Added a secondary "Settings" link to `/property-manager/account/notifications`, so the
  preferences page is still one click away but no longer masquerades as the feed.

### FIX-MSG-READ — opening a thread now clears its unread
`src/hooks/useMessages.ts` (new `useMarkThreadRead`), conversation detail page
- The inbox derives a thread's unread count from `messages.read_by` (array of user ids),
  but **nothing ever wrote `read_by`** — so unread counts never cleared after reading.
- Added `useMarkThreadRead`: stamps the current user id into `read_by` of inbound
  messages that don't already contain it (only touches rows that need it), then
  invalidates the inbox query so the badge/count updates without a manual refresh.
  Best-effort + 42P01-safe.
- Wired into the conversation detail page via a guarded effect (per thread + message
  count) so it fires once per open and once when new inbound messages arrive — no loop
  (it invalidates the inbox key, not the messages key).

---

## 4. Audit results (checklist coverage)

### Routes & registration
- Messages registered in side nav: `src/components/shell/SideNavigation.tsx:91`
  (CORE group, label "Messages", icon `MessageSquare`, href `${MANAGER_BASE}/messages`). ✓
- `/property-manager/*` → `/app/*` rewrite confirmed in `next.config.ts`; new feed route
  resolves correctly. ✓
- Note: `qa-release/route-registry.md` referenced in CLAUDE.md does **not exist** in this
  repo (the live QA system is `qa-release/sections/*.md` + `implementation-fix-log.md`).
  Logged the new route here + in the fix log instead.

### Inbox / conversation list (`useConversations`)
- Real data from `message_threads` + `messages` + `contacts`; **no fabricated data**. ✓
- Workspace-scoped (`.eq('workspace_id', …)` + RLS). ✓
- Batched queries (threads → contacts via `.in` → messages via `.in`): **no N+1**. ✓
- Archived threads filtered out. ✓
- Filters (all/unread) + search (name/subject); empty / loading / error states. ✓
- Unread derived from `read_by` (now actually maintained — see FIX-MSG-READ). ✓

### Conversation detail / compose
- Loads correct thread by id; bounded to newest 200, displayed chronologically. ✓
- Send: input disabled while `isPending` (no double-submit duplicate); optimistic clear
  with restore-on-failure. ✓
- Ctrl/Cmd+Enter to send; `aria-label` on textarea. ✓
- Send fans out `notifyMessageReceived` to thread participants (internal users, not the
  sender), best-effort + 42P01-safe. ✓

### Notifications
- Bell: realtime unread count, 8 most recent, mark-all/mark-one, per-row routing via
  `resolveEntityHref`, outside-click + Escape close, portaled (z-index safe). ✓
- New feed: full list, filters, pagination, realtime, mark read. ✓
- Preferences page kept separate and reachable. ✓

### Chat bubble
- The only floating bubble is the **AI Copilot** (`src/components/ai/ChatBubble.tsx`,
  Propvora logo + "thinking"/"new_message" states). There is **no separate human-messaging
  chat bubble** — human messaging is the Messages section + the bell. Because only one
  bubble exists, there is no AI-vs-human ambiguity. Acceptable for V1.

### Portal boundaries
- Portal messaging data layer is `src/lib/portal/messaging.ts` (separate, schema-correct,
  workspace + portal-user scoped). Tenant/landlord/supplier portals have their own
  settings + notification surfaces. Operator inbox and portal threads stay separate. ✓

---

## 4b. Follow-ups completed (second drop)

### FIX-MSG-IDEMPOTENCY — server-side send idempotency
`supabase/migrations/20260624200000_messages_client_token_idempotency.sql` (new, **applied
live via Management API PAT** + checked in), `src/hooks/useMessages.ts`, conversation page
- Added nullable `messages.client_token uuid` + **partial unique index**
  `messages_thread_client_token_uidx (thread_id, client_token) WHERE client_token IS NOT NULL`.
- `useSendMessage` mints/accepts a `clientToken`; on `23505` it fetches and returns the
  already-stored row (idempotent success, no duplicate, no error).
- The conversation page mints one token per composed message and **reuses it on
  retry-after-failure** (`pendingSendRef`), so a send that committed but looked like a
  client failure collapses on the index instead of duplicating. Verified the index exists
  via `pg_indexes`.

### FIX-MSG-THREAD-REALTIME — live push into the open conversation
`src/hooks/useMessages.ts` (new `useThreadRealtime`), conversation page
- Thread-scoped `postgres_changes` INSERT subscription on `messages`
  (`thread_id=eq.{id}`) → invalidates the thread query + inbox; cleaned up on unmount /
  conversation change. New inbound messages render without a manual refresh; the
  read-stamp effect then clears unread.

### FIX-MSG-NAV-BADGE — live unread badge on the side-nav Messages item
`src/components/shell/NavItem.tsx`, `src/components/shell/SideNavigation.tsx`,
`src/hooks/useMessages.ts` (new `useUnreadMessagesCount`)
- `NavItem` gains a `badge` prop: red pill when expanded, count dot over the icon when
  collapsed, `aria-label="{label}, {n} unread"`.
- `useUnreadMessagesCount` reuses the shared `useConversations` cache (no extra query) +
  subscribes to workspace `messages` INSERTs for a live count (cleaned up on unmount / ws
  switch). Updates after read, on new message, and on workspace switch.
- `SideNavigation` tags only the Messages item with `badgeKey: "messagesUnread"`; other
  nav configs (supplier, etc.) are unaffected.

---

## 5. Known gaps / recommended follow-ups (not release blockers)

1. ~~Side-nav Messages unread badge~~ — **DONE** (FIX-MSG-NAV-BADGE).
2. ~~In-thread realtime push~~ — **DONE** (FIX-MSG-THREAD-REALTIME).
3. ~~Server-side send idempotency key~~ — **DONE** (FIX-MSG-IDEMPOTENCY).
4. **Notifications feed is not in the side nav** — reachable via the bell's "View all".
   Optional (the bell is the standard home for notifications); deliberately not added to
   keep the CORE nav uncluttered.

---

## 6. Build / typecheck
- `tsc --noEmit`: **PASS (exit 0, zero errors)** after the follow-ups. Changed files:
  notifications feed page, `NotificationBell`, `useMessages`, conversation detail page,
  `NavItem`, `SideNavigation`.
- Route resolution verified against the running dev server (curl):
  - `GET /property-manager/notifications` → `307 → /login?redirectTo=…` (auth guard +
    route both correct).
  - `GET /app/notifications` → `307 → /property-manager/notifications` (canonical redirect).
- Idempotency index verified present in `pg_indexes`.

## 7. Screen sizes / live visual QA — COMPLETED (Chrome MCP)

Ran live, **authenticated** (jamahl thomas / JT Property Manager, Enterprise) against the
dev server with **real seeded data** (3 notifications: fire-alarm overdue, HMO licence
renewal, rent-due). **Zero console errors / warnings.**

Captured the notifications feed at all 8 required viewports — saved under
`release-gated/docs/messages/screens/`:
`notifications-1536.png`, `-1280.png`, `-1024.png`, `-768.png`, `-430.png`, `-390.png`,
`-375.png` (+ `bell-dropdown-1366.png`). 1366 reviewed inline.

Findings per viewport:
- **≥1024 (1536/1280/1024):** desktop header + KPI 3-up row + segmented control + category
  select + date-grouped list; shell-width parity; severity-coloured icon tiles
  (red/amber/blue); no overflow.
- **768 (tablet):** **BUG FOUND + FIXED** — double header (see FIX-MSG-DOUBLE-HEADER).
  After fix: single `MobileTopBar`, KPI 3-up, mark-all/settings in the overflow menu,
  no horizontal scroll. Re-verified clean.
- **430 / 390 / 375 (phones):** single header, KPIs stack 1-up, row titles truncate
  gracefully, unread dot + relative time aligned right, no horizontal scroll.

Interactive verification:
- **Bell dropdown** — "View all notifications →" now → `/property-manager/notifications`
  (the fix), and the secondary "Settings" → `/property-manager/account/notifications`.
  Both confirmed in the a11y tree.
- Feed controls present + labelled: All / Unread(3) segmented control, "Filter by category"
  combobox (All / Compliance / Money), Mark all read, Actions menu.

## 8. Final score & decision
- **Score: 100/100.** All three reported defects + all three documented follow-ups are
  fixed and type-clean; data/RLS/idempotency/realtime/route wiring verified; the live
  8-viewport visual pass is complete and surfaced + fixed a real double-header regression
  at 768–1023 (which also existed latently on the Messages inbox + conversation pages and
  was fixed in the same pass). Zero console errors. `tsc --noEmit` clean.
- **Decision: Ready for release.**
