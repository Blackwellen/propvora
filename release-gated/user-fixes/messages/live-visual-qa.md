# Manual step — Live 8-viewport visual QA for Messages & Notifications

**Status:** ✅ RESOLVED 2026-06-25 — the lock freed, the pass was run live in Chrome MCP.
All 8 viewports captured under `release-gated/docs/messages/screens/`; a double-header bug
at 768–1023 was found and fixed (FIX-MSG-DOUBLE-HEADER). Notifications feed scored 100/100.
The notes below are retained for future reference if the shared-profile lock recurs.
**Section:** Messages & Notifications · **Date:** 2026-06-25

## Why Claude Code could not complete it

Every Chrome-DevTools-MCP browser on this machine shares one profile at
`C:\Users\PC\.cache\chrome-devtools-mcp\chrome-profile`. Its `lockfile` is held open by
**live MCP node processes from other concurrent Claude Code sessions** (confirmed: ~12
`node.exe … chrome-devtools-mcp` processes running; `rm` of the lockfile returns
"Device or resource busy"). The only ways to free it are to kill another session's
process or point a new browser at a different `userDataDir`/port — the first is forbidden
by the **Session Port Ownership rule**, and the second is not exposed through the MCP tools
available to this session. This is purely an environment/tooling constraint; all code,
types, data, RLS, idempotency, realtime and route wiring are complete and verified.

## Exact steps to finish it (any session with a free Chrome MCP)

1. Ensure a dev server is up (one is already running on `http://localhost:3001`), and you
   are logged in as a PM workspace user (owner/admin) with seeded conversations +
   notifications.
2. Open Chrome MCP on a free debugging port (9222–9240 not in `.claude/port-registry.md`).
3. For each viewport — **1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932,
   390×844, 375×812** — resize then screenshot these routes:
   - `/property-manager/notifications` (feed: KPIs, All/Unread, category filter, date
     groups, Load more, empty/loading/error)
   - `/property-manager/messages` (inbox)
   - `/property-manager/messages/conversations/{id}` (thread + composer)
   - Header **notification bell** open (dropdown + "View all" + "Settings" footer)
   - Side-nav **Messages** item showing the unread **badge** (expanded + collapsed rail)
4. Confirm per viewport: no horizontal scroll, no clipped composer/controls, badge pill
   legible, KPI labels not truncated, no console errors / hydration warnings.
5. Save captures under `release-gated/docs/messages/screens/` and tick §7 of
   `release-gated/docs/messages/messages-and-notifications.md` → raise score 98 → 100.

## Functional checks to pair with the capture
- Send a message → appears instantly; side-nav badge + inbox unread update; open thread in
  a second window and confirm **realtime** arrival without refresh.
- Double-click Send / retry after a simulated failure → **no duplicate** message
  (idempotency index `messages_thread_client_token_uidx`).
- Open an unread thread → its unread clears in the inbox and the side-nav badge decrements.
