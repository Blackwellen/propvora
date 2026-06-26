# Automations — Section 7 Audit — Deferred / Manual Items

**Session:** automations-section7-audit (session-auto7) — 2026-06-26

All code defects found in this audit were fixed in-session (FIX-610 … FIX-616) and the project type-checks clean (`tsc --noEmit` → 0 errors). The items below could **not** be completed in-session for the exact reasons stated — none are code defects.

---

## 1. Live multi-viewport browser QA — DEFERRED (tooling contention)

**What:** Click-through QA of all Automations sub-tabs at the 8 required viewports (1536×960, 1366×768, 1280×720, 1024×768, 768×1024, 430×932, 390×844, 375×812), capturing screenshots and console-error checks.

**Why Claude Code could not do it now:** The Chrome DevTools MCP server is configured with a **single shared user-data profile** (`~/.cache/chrome-devtools-mcp/chrome-profile`). A concurrent Claude Code session currently holds that profile open. The MCP server refuses to launch a second browser instance against the same profile (`"The browser is already running … Use --isolated"`), and `new_page` / `isolatedContext` both route through the same locked profile. `--isolated` is a **server-launch flag** that must be set when the MCP server starts — it is not controllable from the tool call. Killing the other session's Chrome would disrupt another active session's work, which the multi-session rules forbid.

**Exact manual steps to complete:**
1. Wait until no other session is using Chrome MCP (or relaunch the Chrome DevTools MCP server with `--isolated` / a distinct `userDataDir` for this session).
2. Ensure a dev server is serving this repo (Next 16 allows only one `next dev` per repo dir — reuse the running one or stop it first; this session's claimed port is 3010, Chrome 9228).
3. Navigate each route and resize to all 8 viewports:
   - `/property-manager/automations/overview` — confirm **Run now** executes (toast reports executed/queued), review-queue + activity feeds populate from real data.
   - `/property-manager/automations/my-automations` — select rows → sticky bar **Enable/Pause/Export** work; **Delete** opens confirm modal then removes rows.
   - `/property-manager/automations/errors` — tab filters work; **Export errors** downloads CSV; **Mark as resolved** clears the row.
   - `/property-manager/automations/runs-logs` — **Export logs** downloads CSV; detail panel populates on load; payload shows real run fields.
   - `/property-manager/automations/approvals` — **Bulk approve** (low-risk selection) records decisions; Rules policy/SLA route to governance.
   - `/property-manager/automations/activity` — feed populates; **Export log** downloads CSV.
   - `/property-manager/automations/recipes` — "Recommended by AI" card renders safely even with < 3 featured recipes.
4. Confirm zero console errors / React / hydration warnings at each viewport and save screenshots under `release-gated/docs/automations/screenshots/`.

**Not a release blocker:** routes are confirmed to compile and serve; all wiring is verified at the code + type level.

---

## 2. Full `next build` static-generation pass — ✅ DONE

Re-ran fully green once concurrent build load eased: **"✓ Compiled successfully in 73s"** → **"✓ Generating static pages using 27 workers (438/438) in 6.8s"** → Finalizing page optimization → **BUILD_EXIT=0**. No code action remains. (Earlier same-session OOMs in the static-gen worker were confirmed host-memory contention from 3+ concurrent session builds, not a code defect.)

---

_No Supabase/RLS/migration items are deferred — the automation schema and policies were verified in-session and require no changes._
