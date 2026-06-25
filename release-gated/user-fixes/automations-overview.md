# User / Manual Actions — Automations: Overview

These items could not be completed inside the coding session and need an action on a
machine/environment Claude Code cannot reach from here. Each states exactly why.

---

## 1. Clean production build (memory-constrained box)

**Why deferred:** `npm run build` aborted at startup on this machine with
`FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of
memory` — the OS could not commit even a ~5 MB semi-space. This is physical-RAM
exhaustion caused by the **other concurrent Claude sessions' dev servers** (ports 3002 &
3004 were live in the port registry) plus the 700+ route static generation, not a code
fault.

**Exact steps to finish:**
1. Stop the other sessions' dev servers (or run on a box with ≥ 16 GB free RAM).
2. From the repo root:
   ```bash
   BUILD_CPUS=2 NODE_OPTIONS=--max-old-space-size=8192 npm run build
   ```
3. Confirm `✓ Compiled successfully` and that these routes appear in the route table:
   - `/property-manager/automations/overview`
   - `/property-manager/workspace-settings/automations`
   and that `/property-manager/automations/home` + `/automations/admin-controls` are
   listed as redirects.

---

## 2. Live browser QA sweep (authenticated session required)

**Why deferred:** requires a running dev server + an authenticated Supabase session in a
real browser; not reproducible headless without credentials in this session.

**Exact steps:**
1. `npm run dev -- -p <free-port>` and sign in to a PM workspace.
2. At each viewport — 1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844,
   375×812 — confirm:
   - **Tab strip is identical on every Automations page.** With `NEXT_PUBLIC_QA_ALL_FLAGS`
     unset/`false`, Canvas Builder / Webhooks / Integrations must NOT appear on Overview,
     Recipes, My Automations, Runs & Logs, Approvals, Errors, AI Builder, or Usage &
     Limits. Click through all of them and verify the strip never changes / never bounces
     to Overview.
   - With `NEXT_PUBLIC_QA_ALL_FLAGS=true`, those three tabs appear consistently on all
     pages and their routes load.
   - `Admin Controls` no longer appears as an Automations tab.
   - `/automations/home` and `/automations/admin-controls` redirect correctly.
3. **Automation Governance** (`/workspace-settings/automations`): toggle each control,
   Save, hard-refresh, confirm values persist (round-trips through
   `workspace_settings.module_settings.automation_governance`). Confirm the deep links to
   Roles & Permissions and Audit Logs work.

---

## 3. RLS verification for governance persistence

**Why deferred:** negative RLS tests need a second workspace + user; run with the PAT
test harness (`scripts/test/*`).

**Exact check:** assert a user in workspace A cannot read or write workspace B's
`workspace_settings` row (positive: own-workspace read/write succeeds; negative:
cross-workspace blocked). The existing `workspace_settings_read` / `workspace_settings_write`
policies (migration `015_settings_level2.sql`) should enforce this — confirm with a
targeted suite.

---

## 4. Full-redesign follow-ups for Automation Governance (product decision)

The governance page persists the core policy set (review-first default, dangerous-action
guardrails, environment separation, publish-permission level, audit retention). If the
product owner wants these to be **enforced at execution time** (not just stored as
workspace policy), the automation engine's run/approval path must read
`workspace_settings.module_settings.automation_governance` when deciding whether to hold
an action for approval. That engine wiring is a separate, larger task and was **not** in
scope for this drop — flagging it so it is not assumed complete.
