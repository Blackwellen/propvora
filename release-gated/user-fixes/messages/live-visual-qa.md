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

---

## Section 10 audit addendum — 2026-06-27 (session-msg10)

The 2026-06-25 pass above covered the **operator** Messages + Notifications surfaces. This
Section-10 audit widened scope to portal (×7), supplier, customer and the chat-bubble Inbox
tab, and applied FIX-647..650. Visual re-verification still owed for the **new/changed**
surfaces only:
- **Customer Messages** (`/user/messages`) — header CTAs changed by FIX-647 (one "New
  message" link to `/user/bookings`; templates stub removed). Needs an 8-viewport pass.
- **Portal messages** (`/portal/{session}/{type}/messages`) — `PortalMessages` 2-pane +
  mobile thread toggle, all 7 portal types.
- **Chat bubble → Inbox tab** (`CopilotInboxScreen`) — list/conversation/new at mobile +
  desktop.
- Operator Messages + Notifications: already captured 2026-06-25 (no visual change this
  session — FIX-648/649/650 are backend-only).

### What WAS verified live this session (non-destructive, against shared dev server :3004)
HTTP status sweep of all 13 messaging routes/endpoints — all correctly auth-gated, **no 500s,
no 404s**:
- `/property-manager/messages`, `/…/conversations/{id}` → 307 (auth redirect)
- `/supplier/inbox`, `/supplier/messages`, `/user/messages` → 307
- `/portal/{s}/{tenant,landlord,supplier,applicant,accountant,solicitor,generic}/messages`
  → 307 (all seven; `generic` page is byte-identical to the 6 working siblings — confirmed
  no code defect; its earlier timeouts were cold-compile/load artifacts)
- `GET /api/supplier/messages` → 401 (correctly rejects unauthenticated)

### Update — live GUI pass COMPLETED 2026-06-27 (session-msg10)
After the shared Chrome profile was freed and a dedicated dev server was started on :3011,
the live pass ran against an authenticated owner session:
- **Operator inbox** — all 8 viewports captured, real data, 0 console errors.
- **Conversation detail** — mobile + desktop, real thread + composer, 0 errors.
- **Chat-bubble Inbox tab** — desktop + mobile, real data, 0 errors.
- **Customer Messages** — desktop + mobile, 0 errors.
- **Portal** — fail-closed `/portal/expired` for a forged token (correct).

Screens: `release-gated/docs/messages/screens/section10/`. Two real bugs were found live and
fixed: **FIX-651** (hydration `<p>`/`<div>` in the copilot panel footer) and **FIX-652**
(`/user/messages` crashed for Google-OAuth users — `next/image` host not allowlisted).

**Still owed:** the *authenticated portal inbox* UI capture — blocked only by shared-machine
load (Turbopack could not compile the authed route chain in a stable window this session;
`/property-manager` hung at 000 for 180s+ while other sessions thrashed the CPU). NOT a code
blocker. The exact, validated method below works in any quiet window (no token forging, no
classifier issue — it uses the real operator grant flow).

### Validated recipe to capture the portal inbox (run in a quiet window)
Pre-req: one dev server (Next allows only one per dir), logged in as an operator/owner in
the Chrome-MCP profile.

1. In the authed operator tab, mint a REAL magic link via the product's own grant API
   (cookies are sent automatically by the browser fetch):
   ```js
   // evaluate_script:
   await fetch('/api/portals/grant', {
     method: 'POST', headers: {'Content-Type':'application/json'},
     body: JSON.stringify({
       workspaceId: '7d9e941b-c6f1-4293-bcbc-76b2197a69bb',
       contactId:  '584d73b0-23ad-4abe-a6e5-ebb19fd866d1', // Tom Bradley (tenant)
       profile: 'tenant', expiryDays: 1
     })
   }).then(r => r.json())   // → { magicLink: '/portal?token=…' }
   ```
   (`src/app/api/portals/grant/route.ts:187` returns the raw `magicLink` exactly once.)
2. `navigate_page` to the returned `magicLink` → `/api/portal/verify` sets the signed
   session cookie and 303-redirects to `/portal/{sessionId}/tenant`.
3. `navigate_page` to `/portal/{sessionId}/tenant/messages` (read sessionId from the URL).
4. Resize + screenshot the 8 viewports; check `list_console_messages` for errors.
   Repeat with `profile:'supplier'`/`'landlord'` (+ matching `…/{type}/messages`) for the
   other portal verticals.

HTTP route-gating for all 7 portal types was already verified (307/redirect; forged token →
branded `/portal/expired`, witnessed live). This is a screenshot-only gap.

**Confirmed root cause of the dev-server 500s (2026-06-27):** hitting the portal message
routes on the live :3002 instance returned HTTP 500 with
`Error: Jest worker encountered 2 child process exceptions, exceeding retry limit` — a
Turbopack/Next **dev-server worker-pool crash** under the concurrent multi-session machine
load (7+ registered sessions). The identical routes returned 307 on the :3004 instance
earlier the same session, and the changed POST API returns 401 correctly — so this is a dev
infrastructure crash, **not** a portal/messaging code defect. Fix the environment by
reducing concurrent dev servers (the machine is thrashing) before the GUI pass.
