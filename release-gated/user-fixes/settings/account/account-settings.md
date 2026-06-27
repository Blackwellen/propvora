# User / Manual Actions — Account Settings (Section 9)

These items could **not** be completed in-session because of genuine environment/contention
blockers (not code defects). Each lists the exact reason and the exact steps to complete.

---

## 1. Full build verification (`tsc --noEmit` / `next build`)

**Why deferred:** The machine was at ≈1.8 GB free RAM out of 16 GB, saturated by 5 concurrent
Claude Code sessions (each running a Next dev server). `tsc --noEmit` aborted with V8
"Committing semi space failed — heap out of memory" (exit 134) twice, including with
`--max-old-space-size=8192` — the failure is OS page-commit exhaustion, not a Node heap-limit
or a type error. The changed files were instead verified by static signature review and by an
on-demand route compile (all account routes return HTTP 307 with no 500).

**Exact steps to complete (on a quiet machine):**
1. Close other dev servers / sessions so ≥6 GB RAM is free.
2. From the repo root:
   ```
   $env:NODE_OPTIONS="--max-old-space-size=6144"
   npm run build
   ```
3. Confirm the build completes with **zero** TypeScript errors. The files touched this drop:
   - `src/lib/actions/settings.ts`
   - `src/app/(app)/app/account/activity/page.tsx`
   - `src/app/(app)/app/account/security/page.tsx`
   - `src/app/api/account/request/route.ts`

---

## 2. 8-viewport interactive Chrome MCP pass

**Why deferred:** The shared Chrome-DevTools MCP profile
(`C:\Users\PC\.cache\chrome-devtools-mcp\chrome-profile`) was already running and locked by
another active session. Restarting it would have killed that session's browser, which the
Session Port Ownership rule forbids. Combined with the RAM saturation above, a clean
multi-viewport pass was not possible without disrupting another session.

**Exact steps to complete:**
1. When no other session holds the Chrome profile (check `.claude/port-registry.md`), start
   Chrome MCP on this session's claimed port (9225) — or pass `--isolated` for a private
   profile.
2. Log in as the dev owner (`jamahlthomas1996`, workspace *JT Property Manager*).
3. For each of the 10 account routes, resize and screenshot at: 1536×960, 1366×768, 1280×720,
   1024×768, 768×1024, 430×932, 390×844, 375×812.
4. Specifically verify on **Activity** (`/property-manager/account/activity`): the seeded rows
   render, and clicking the **Login / Profile / AI / Security** filters segments them
   correctly (1 / 1 / 1 / 3 respectively; Settings = 2). This is the FIX-660 regression check.
5. Verify no console errors, no hydration warnings, no failed network calls.
6. Save screenshots under `release-gated/docs/settings/screenshots/account/`.

---

## 3. Notes (NOT blockers — disclosed product limitations)

These are intentional V1 limitations already disclosed honestly in the UI; they are roadmap
items, not release blockers, and require no manual fix:

- **Sessions & Devices** shows the current session + global sign-out only. Full per-device
  history (IP/location) needs a server-side session log (future).
- **Preferences → Theme** offers Light/Dark/System but applies light only, with an honest
  "dark mode not yet available" note (codebase is intentionally zero-`dark:`).
