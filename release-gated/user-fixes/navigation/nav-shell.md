# Navigation Shell — Remaining Manual / Live-Verification Actions

**Section:** Top Nav, Side Navigation, Search, Notifications, Avatar Menu, Workspace Switcher, Sidebar Cards
**Last updated:** 2026-06-27

All code-level defects found in this audit were fixed directly (FIX-544..556,
FIX-651..653 — see `qa-release/implementation-fix-log.md`). The items below are
**not code blockers** — they are live-environment confirmations that require a
running dev server + Chrome MCP + multi-role test accounts, which were exercised
in the 2026-06-26 Chrome MCP sweep but are worth re-confirming on the release
candidate build. None require a code change.

## Why these are not auto-completable by Claude Code in this session

The 2026-06-27 follow-up was a code + type + build audit of the sidebar-card
surface. The edits were presentational/type-only (removed two static dots; added
a status pill driven by data already in context), so they cannot regress the
live RLS / multi-role / multi-viewport behaviour that the prior sweep confirmed.
Re-running the full live matrix needs the multi-session dev-server + Chrome MCP
environment to be free (see AGENTS.md port-ownership rule) and a set of seeded
test accounts per role.

## Live re-verification checklist (release candidate)

1. **Sidebar plan-card states (FIX-652)** — seed a workspace with each
   `plan_status` value (`trialing` + `trial_ends_at` 10d / 2d / past, `past_due`,
   `canceled`, `suspended`, `active`) and confirm the pill renders
   `Trial · Nd left` / `Payment due` / `Cancelled` / `Suspended` / no-pill
   respectively. SQL: `UPDATE workspaces SET plan_status=$1, trial_ends_at=$2 WHERE id=$ws`.
2. **Role matrix (checklist §1 items 40–45)** — log in as Owner / Admin /
   Manager / Team Member / Read-only / Accountant and confirm each sees only
   permitted nav sections, and that the plan card never exposes billing data to
   non-billing roles (it currently shows plan name + status only — no amounts).
3. **Search workspace isolation (items 227, 624)** — with two workspaces, confirm
   global search in workspace A never returns workspace B records (RLS negative
   test; the query is `eq("workspace_id", …)` + RLS).
4. **Notification cross-user/workspace isolation (items 327–328, 625–626)** —
   confirm user A cannot read user B's notifications and that the unread badge
   resets correctly after a workspace switch.
5. **Workspace switcher RLS (items 418–419)** — confirm the switcher lists only
   workspaces the user is a member of and cannot be coerced to switch into a
   non-member workspace via client payload manipulation.
6. **8-viewport sweep** — 1536×960, 1366×768, 1280×720, 1024×768, 768×1024,
   430×932, 390×844, 375×812 for the four nav dropdowns (search, notifications,
   account menu, workspace switcher) + sidebar cards. No clipping/overlap.

## External blockers

None for navigation. All nav data (workspaces, profiles, notifications, search)
is wired to Supabase with RLS; no Stripe/Vercel/DNS dependency gates this section.
