# User / Manual Actions — Compliance Wizards

These items could not be completed headlessly by Claude Code this session. Each
states exactly why and the precise steps to run.

## 1. Live browser sweep (Chrome MCP) — items 271–273
**Why not done:** No dev server was started in this session (concurrent sessions
own ports; AGENTS.md port-ownership rule). A headless code audit + build was run instead.
**Steps:**
1. Claim a dev port (3002–3019) + Chrome port (9222–9240) in `.claude/port-registry.md`.
2. `NODE_OPTIONS=--max-old-space-size=4096 npm run dev -- -p <PORT>`.
3. Open each wizard route and walk every step at 1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812.
4. Capture a screenshot per step; confirm no console errors / hydration warnings / clipped footers.

## 2. RLS negative tests — items 164–173, 348–349
**Why not done:** Requires the Supabase Management API PAT and test users in non-owner roles.
**Steps (Management API `POST /v1/projects/oovgfknmzjcgbilwumch/database/query`):**
1. As a `read-only`/`team_member` member, attempt `INSERT` into `compliance_items`, `property_inspections`, `documents`, `compliance_evidence` → must be **denied** (013 policies restrict INSERT to owner/admin/manager).
2. As a member of workspace B, attempt to insert with workspace A's `workspace_id` → must be **denied**.
3. Record both as positive (allowed) and negative (blocked) rows in `qa-release/sections/` compliance matrix.

## 3. End-to-end story — items 160, 338
**Steps:** Create a certificate with "Create renewal work task" ON and a reminder →
confirm (a) the cert appears in the Certificates list/KPIs, (b) a task appears in
`/property-manager/work/tasks` with the correct due date, (c) a `compliance_renewal_reminders`
row exists with `remind_at = expiry − reminderDays`. Repeat for Inspection (linked Work job)
and Document (review/reminder metadata).

## 4. R2 upload round-trip — items 197–201
**Steps:** With R2 configured, upload a real PDF in each wizard, confirm the object lands in the
`propvora` bucket scoped to the workspace, and that the stored URL opens via signed access
(Evidence "Open File" now enabled after FIX-CMP-WIZ-07).
