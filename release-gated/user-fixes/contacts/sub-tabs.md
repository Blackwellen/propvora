# User / Manual Actions — Contacts Sub-Tabs

All code fixes for this drop were applied directly (see `qa-release/implementation-fix-log.md`, `FIX-CONTACTS-*`). The items below are **not** code defects — they are verification follow-ups and one optional data-enrichment item.

## 1. Full 8-viewport authenticated sweep of all 7 sub-tabs (verification-only)
**Status:** Partially done. People (grid + table), Documents and Portal Access were live-verified authenticated at 1536 via Chrome DevTools MCP with seeded data and a clean console. Organisations, Board, Timeline and Activity changes in this drop were dead-button removals only (validated by `tsc --noEmit` + green `npm run build`), so no new visual risk — but they have not yet had a live click-through at all 8 required sizes (1536/1366/1280/1024/768/430/390/375).

**Why not fully automated this session:** the chrome-devtools MCP shares a single Chrome profile with other concurrent QA sessions; the tab was reset mid-pass by another session (cross-session contention). Per the port-ownership rule that Chrome must not be force-killed.

**Exact steps to close:** when no other session holds the MCP Chrome, log in as the PM user, visit each of the 7 sub-tabs, and at each of the 8 viewports confirm: no horizontal overflow, tab strip scroll affordance, KPI/card/table reflow, mobile dropdown nav + filter sheets, and 0 console errors. Capture screenshots into `release-gated/docs/screenshots/contacts/`.

## 2. Timeline / Activity actor name shows "User" / "System" (optional enrichment — NOT a defect)
**Status:** By design for V1. Both feeds read `public.audit_logs`, which stores `user_id` but has no join to a display name, and `resource_type/resource_id` rather than a contact name. The pages therefore label the actor "Team member"/"User"/"System" and link to the contact only when `resource_type = 'contact'`.

**Why not fixed in code now:** resolving real actor names requires a batched lookup against `auth.users`/`profiles` (and, for the "Top Contacts" rail, joining `audit_logs.resource_id` → `contacts`). This is an enhancement, not a broken state — the feeds are honest and links work. Deferred to a follow-up so it can be designed against the profiles table without expanding this drop's scope.

**Exact steps to enhance:** in `timeline/page.tsx` and `activity/page.tsx`, after loading `audit_logs`, batch-fetch distinct `user_id`s from `profiles` (display name) and distinct contact `resource_id`s from `contacts`, then map actor/contactName from those instead of the `user_id ? "User" : "System"` fallback.

No Stripe / Vercel / DNS / Sentry external blockers apply to this section.
