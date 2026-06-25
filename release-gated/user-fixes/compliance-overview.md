# User / Manual Actions — Compliance Overview

Section: Compliance › Overview (`/property-manager/compliance/overview`)
Audited: 2026-06-25

No code defects are deferred — all four fixes (FIX-456…459) are applied in the working tree and covered by a clean production build. The items below are **environmental constraints during this audit pass**, not release blockers.

## 1. Fresh multi-viewport screenshots (non-blocking)

- **What:** A full 8-viewport (1536/1366/1280/1024/768/430/390/375) Chrome-MCP screenshot sweep, plus a post-fix re-capture confirming the −18d items now render in the **Overdue & expired** panel rather than **Expiring soon**.
- **Why not done automatically:** The single shared Chrome-DevTools profile (`C:\Users\PC\.cache\chrome-devtools-mcp\chrome-profile`) was held by a concurrently-active QA session (`money-detail-qa`, registry entry dated today, dev server live on 3004). Relaunching the MCP browser would have killed that peer session's live browser, which the port-ownership rule forbids. A desktop (1440×900) live render was captured before the contention and confirms the page works with live data.
- **How to complete:** When no other session is using Chrome MCP, run the dev server on a free port (3005+), open `/property-manager/compliance/overview`, and screenshot at each viewport. Expected: the four FIX-456-affected items (Annual Gas Safety Certificate, PAT testing, etc.) appear under "Overdue & expired"; "Expiring soon" only lists items with `0 ≤ daysUntilDue ≤ 30`.

## 2. Seed data note (informational)

- The audited workspace already has realistic seed data (20 live compliance items, 8 overdue, across 10 properties) — no seeding was required. A second workspace has 6 items. No action needed.

There are no Stripe / Vercel / DNS / Sentry external blockers for this read-only section.
