# Section 15 — Automations

Coverage for all automation nodes across PM workspace, Supplier Solo (SSW), and Supplier Team (STW). Each row tests a specific node type in isolation, then full workflow execution. Feature flag `canvasLite` (and optionally `automationsFull`) must be ON.

**Scoring:** 5=perfect | 4=minor issue | 3=usable but inconsistent | 2=harms UX | 1=severe | 0=broken/not implemented | N/A=not applicable

---

## IA / Navigation Audit (2026-06-21)

| Item | Before | After | Score Before | Score After | Fix |
|------|--------|-------|-------------|-------------|-----|
| Nav tab count | 12 tabs | 10 tabs | 2 | 5 | FIX-079 |
| "Approvals" label | "Approvals" | "Review Inbox" | 3 | 5 | FIX-079/082 |
| AI Builder position | Tab 10 | Tab 5 | 3 | 5 | FIX-079 |
| Admin Controls in nav | Separate nav tab | Consolidated into Usage & Limits | 2 | 5 | FIX-083 |
| Integrations in nav | Top-level nav tab | Removed from nav (route remains) | 2 | 4 | FIX-079 |
| Webhooks in nav | Top-level nav tab | Removed from nav (route remains) | 2 | 4 | FIX-079 |
| "Review inbox18" badge | `reviewQueue.length + 15` = 18 in badge | Real count, no padding | 0 | 5 | FIX-080 |
| Home KPI cards | All hardcoded static values | Derived from hook data, honest "—" for unavailable | 2 | 4 | FIX-081 |
| Activity tab | In nav but no route existed | Route + page created | 0 | 4 | FIX-084 |

**Overall IA Score: 4/5** (minor: Integrations/Webhooks routes remain accessible but not in nav; canvas save-to-DB not yet proven with live migration)

---

## Automation Node Matrix — FIX-276 (2026-06-21)

Last updated: 2026-06-21 (FIX-276 — full code-read QA audit of PM/Supplier/Customer automation systems)

### AUTO-PMW — Property Manager Workspace

| ID | Workspace | Route / Surface | Check | Findings | Score | Status |
|----|-----------|----------------|-------|----------|-------|--------|
| AUTO-PMW-001 | PM | Canvas — `AutomationCanvas.tsx` | Canvas loads without errors | ReactFlowProvider wraps correctly; `@xyflow/react` v12 imports present; EmptyCanvasState renders with "Start with a trigger" prompt; nodeTypes cast correct | 5 | PASS |
| AUTO-PMW-002 | PM | Canvas | Node types: triggers present? | Registry has 29 trigger nodes: record.created/updated/deleted, field.changed, portfolio.*, work.*, booking.*, marketplace.*, supplier.*, invoice.overdue, money.*, compliance.expiring/failed, legal.review.required, ai.signal_detected, schedule.daily/cron, webhook.incoming | 5 | PASS |
| AUTO-PMW-003 | PM | Canvas | Node types: actions present? | Actions: create_task, update_record, add_note, create_calendar_reminder, create_cleaning_task, request_supplier_evidence, assign_supplier, flag_marketplace_order, create_invoice_draft, record_compliance_check | 5 | PASS |
| AUTO-PMW-004 | PM | Canvas | Node types: conditions present? | Conditions: if_else, field_compare, entity_state, plan_allows, within_caps, business_context, payment_release_allowed | 5 | PASS |
| AUTO-PMW-005 | PM | Canvas | Node types: utilities present? | Utilities: redact_sensitive_data, set_variable, format_text; Error: retry_with_backoff, pause_after_threshold, fallback_path; Branch: match_country, switch, split_parallel; Delay: fixed, until_date, business_hours | 5 | PASS |
| AUTO-PMW-006 | PM | Canvas | Connection validation (isValidConnection) | No `isValidConnection` prop passed to ReactFlow — connections between any nodes are permitted. Triggers have no target handle (correct); end nodes have no source handle (correct). Missing: type-level connection guards (e.g. trigger→trigger connections not blocked). | 3 | CODE ISSUE |
| AUTO-PMW-007 | PM | Canvas / Inspector | Config badges show "Configuration required" on incomplete nodes | `validationStatus` field on `CanvasFlowNodeData` controls icons: CheckCircle (valid), AlertCircle (warning), XCircle (error), circle (unchecked). New nodes from library get `unchecked`. `useAutomationValidation` checks required fields and sets `errors[]`. However, the `validationStatus` field on canvas nodes is NOT updated by the validation hook — it is set once at creation and never mutated. Badge icons therefore reflect seed state, not live validation. | 2 | CODE GAP |
| AUTO-PMW-008 | PM | Canvas / Inspector | Config badges — "Configuration required" on incomplete nodes | The NodeCard body shows ValidationIcon based on `data.validationStatus`. The validation hook produces a `ValidationSummary` but never writes back to `data.validationStatus`. `useAutomationPublishReviewModal` uses validation for publish gate, not card UI. Config fields exist for most nodes (NODE_CONFIG_SCHEMAS). Missing visual feedback loop between validation and canvas node status. | 2 | CODE GAP |
| AUTO-PMW-009 | PM | Canvas / Inspector | Context variables panel per trigger | No dedicated context variables panel exists. `AutomationNodeInspector` has: Settings / Inputs / JSON / Code / Test Data tabs. Inputs tab shows config schema fields. `supportsTokens` flag on fields shows token hint (`{{summary}}`, `{{trigger_id}}`). No panel listing all available context vars per trigger type. | 3 | MINOR GAP |
| AUTO-PMW-010 | PM | `IntegrationsPage.tsx` | 22 UK property integrations present? | KPI card shows "22 Connected apps"; SEED_INTEGRATIONS array has 15 entries (i1–i15: Gmail, Outlook, Twilio, Stripe, Xero, QuickBooks, OpenAI, Slack, Teams, HMRC MTD, Google Calendar, DocuSign, Google Drive, Dropbox, Amazon S3). KPI count (22) does not match seed data count (15). Not UK-property-specific integrations — generic enterprise tooling. Missing UK-specific: Rightmove, Zoopla, OpenRent, Fixflo, Arthur Online, Starling, Monzo, Lettings specific tools. | 2 | DATA MISMATCH |
| AUTO-PMW-011 | PM | `WebhooksPage.tsx` | Webhook CRUD: create present? | "New endpoint" button shows toast "New endpoint — opens endpoint form" — no actual form modal. Create is a toast stub. | 3 | STUB |
| AUTO-PMW-012 | PM | `WebhooksPage.tsx` | Webhook CRUD: read/list present? | SEED_WEBHOOK_ENDPOINTS (5 entries) shown in DataTable with full columns: name, URL, event groups, signing secret status, environment, last delivery, success rate, enabled toggle. | 5 | PASS |
| AUTO-PMW-013 | PM | `WebhooksPage.tsx` | Webhook CRUD: update present? | Enable/disable toggle is live state (useState). "Configure" button is toast stub. No edit form. Partial. | 3 | PARTIAL |
| AUTO-PMW-014 | PM | `WebhooksPage.tsx` | Webhook CRUD: delete present? | No delete button present anywhere in WebhooksPage. | 1 | MISSING |
| AUTO-PMW-015 | PM | `WebhooksPage.tsx` | Webhook CRUD: test present? | "Test event" button fires toast "Test event sent". Stub — no real delivery. | 3 | STUB |
| AUTO-PMW-016 | PM | `AutomationShortcutBanner.tsx` | Shortcut banners on PM pages | File `src/components/automations/AutomationShortcutBanner.tsx` does not exist. No automation shortcut banners found in components/automations/ directory. Only `AutomationRegistryPanels.tsx` and `AutomationSectionNav.tsx` exist. | 0 | NOT IMPLEMENTED |
| AUTO-PMW-017 | PM | `MyAutomationsPage.tsx` / `HomePage.tsx` | Automation list empty states | SEED data is used as fallback. SEED_MY_AUTOMATIONS has 8 named automations with realistic names (Rent overdue → draft chase, Lease expiry → renew reminder, etc.). These are not "fake person names" but domain-relevant automation titles. Empty state: when live DB returns empty, seed shows instead of blank. No user-facing honest "no automations yet" state when DB is empty. | 3 | SEED HONESTY |
| AUTO-PMW-018 | PM | `RunsLogsPage.tsx` / `ErrorsPage.tsx` | Run log / activity empty state honest | Seed fallback shows SEED_RUNS (10 runs with realistic refs RUN-2024-05-24-*) and SEED_ERRORS (8 errors). No honest "no runs yet" empty state when DB tables are empty/unmigrated — seed fills in. DB tables: automation_runs, automation_errors (seed-fallback pattern). | 3 | SEED HONESTY |
| AUTO-PMW-019 | PM | Canvas `useAutomationCanvasState.ts` | Undo/redo present | `useAutomationUndoRedo` hook present; `canUndo`/`canRedo` exposed; WorkflowHeader wired with `onUndo`/`onRedo` buttons. | 5 | PASS |
| AUTO-PMW-020 | PM | Canvas | Canvas seed workflow present | `buildSeedWorkflow()` seeds a 10-node compliance workflow on canvas open: trigger → condition → TRUE/FALSE branches with action, communication, approval, update record, webhook, invoice, end nodes. Realistic and honest domain data. | 5 | PASS |

---

### AUTO-SSW — Supplier Solo Workspace

| ID | Workspace | Route / Surface | Check | Findings | Score | Status |
|----|-----------|----------------|-------|----------|-------|--------|
| AUTO-SSW-001 | Supplier Solo | No dedicated automation page in supplier solo | Supplier solo automation exposure? | No `/supplier/automations` route was found. Supplier solo workspace uses `SupplierWorkspaceShell` with 7 nav groups. Automation is only in supplier TEAM workspace (`TeamAutomations.tsx`). Supplier Solo does not have an automation section. | N/A | NOT APPLICABLE |
| AUTO-SSW-002 | Supplier Solo | N/A | Empty arrays (not fake data) | N/A — no supplier solo automation surface exists | N/A | NOT APPLICABLE |
| AUTO-SSW-003 through AUTO-SSW-010 | Supplier Solo | N/A | All supplier solo automation checks | N/A — supplier solo has no automation section | N/A | NOT APPLICABLE |

---

### AUTO-STW — Supplier Team Workspace

| ID | Workspace | Route / Surface | Check | Findings | Score | Status |
|----|-----------|----------------|-------|----------|-------|--------|
| AUTO-STW-001 | Supplier Team | `TeamAutomations.tsx` | Component exists and renders? | `TeamAutomations.tsx` exists in `src/features/supplier/team/automations/`. Component renders 4 tabs: Rules / Templates / Logs / Approvals. Review-first safety banner present. | 5 | PASS |
| AUTO-STW-002 | Supplier Team | `TeamAutomations.tsx` | RULES data — empty arrays or fake? | RULES array has 5 hardcoded rules: "Auto-assign by trade & area", "Remind worker to upload evidence", "Notify customer after completion", "Flag invoice overdue", "Insurance renewal reminder". These are fake hardcoded stubs. FIX-267 was supposed to clear these but RULES was NOT cleared — only LOGS and APPROVALS were cleared per fix log. RULES still has fake data. | 1 | REGRESSION |
| AUTO-STW-003 | Supplier Team | `TeamAutomations.tsx` | LOGS data — empty arrays? | FIX-267 was applied: "TeamAutomations RULES/LOGS/APPROVALS → empty arrays with empty states". Checking source code: LOGS still has 3 hardcoded entries (l1, l2, l3) with fake data. APPROVALS has 1 hardcoded entry. FIX-267 did NOT clear these arrays — the fix log says "empty arrays" but the file still contains inline const data. | 1 | FIX-267 INCOMPLETE |
| AUTO-STW-004 | Supplier Team | `TeamAutomations.tsx` | APPROVALS — empty state present? | APPROVALS has 1 entry. Empty state EXISTS in code: `APPROVALS.length === 0` shows `<SupplierCard>` with CheckCircle "No approvals pending". But APPROVALS is not empty — it has `{id:"ap1", name:"Notify customer after completion", ...requestedBy: "Mike Thompson"}`. FIX-267 was supposed to remove "Mike Thompson" from requestedBy. | 1 | FIX-267 INCOMPLETE |
| AUTO-STW-005 | Supplier Team | `TeamAutomations.tsx` | Toggle rule enable/disable works? | `toggle(r)` function correctly toggles status active/paused and shows toast. SupplierButton and Pause/Play icons correctly switch on toggle. Functional. | 5 | PASS |
| AUTO-STW-006 | Supplier Team | `TeamAutomations.tsx` | Review-first safety banner present? | Blue `ShieldCheck` banner: "Review-first safety — Automations that touch customers, payments, the platform or public listings require approval and never bypass Propvora review-first safety." Present and correct. | 5 | PASS |
| AUTO-STW-007 | Supplier Team | `TeamAutomations.tsx` | Templates tab present? | 4 templates: "Auto-assign jobs by trade/area", "Notify team on new request", "Customer completion message", "SLA breach warning". Customer-impacting template correctly shows "Approval" badge. "Use template" button fires toast. Present and functional. | 4 | PASS (stubs) |
| AUTO-STW-008 | Supplier Team | `TeamAutomations.tsx` | Logs tab empty state? | Logs tab renders a table with 3 hardcoded log entries. No empty state for "no logs yet". Should be empty array with honest empty state per FIX-267. | 1 | FIX-267 INCOMPLETE |
| AUTO-STW-009 | Supplier Team | `TeamAutomations.tsx` | Approval rules empty state correct? | Empty state correctly coded but never shown because APPROVALS has 1 entry. Entry shows "Mike Thompson" as requestedBy — fake person name not cleared by FIX-267. | 1 | FIX-267 INCOMPLETE |
| AUTO-STW-010 | Supplier Team | N/A | Customer workspace automation exposure? | Customer workspace (`src/app/(customer)/customer/`) has no automation pages. Customer does not have access to automation builder. Correct — N/A. | N/A | NOT APPLICABLE |

---

### AUTO-STW (Customer) — Confirmed N/A

Customer workspace has no automation exposure. Checked `src/app/(customer)/customer/` — no automation routes exist. Customer workspace routes are: home, lets, lets/search, lets/journey, stays. No automation section. **N/A across all AUTO-STW (Customer) checks.**

---

## QA Protocol for Automations

1. Enable `canvasLite` flag (and `automationsFull` for webhook/advanced nodes).
2. Test each trigger node in isolation: fire the trigger condition, confirm the automation run starts.
3. Test each logic node: set up a workflow with the logic node, verify branching/delay behaves correctly.
4. Test each action node: confirm the downstream action executes (task created, email sent, status updated).
5. Test AI nodes: confirm NIM call fires within the automation context, output is used in subsequent node.
6. Confirm plan gate blocks automation creation when workspace is on a lower tier.
7. Check `automation_run_logs` table for every execution with correct status.
8. Attempt cross-workspace automation trigger — confirm RLS blocks it.

---

## Session 14 — 2026-06-21 — PM Automations Section Subsection Score Matrix

| Subsection | Route | IA Score | Header/Title | KPI Honesty | Data Source | Safety | Canvas/Builder | Score | Status |
|---|---|---|---|---|---|---|---|---|---|
| Home | /property-manager/automations/home | 5 | 5 (H1 above tabs) | 4 (KPIs from data; SLA/ROI honest "—") | Seed fallback | 5 (review-first banner) | N/A | **72/100** | PASS |
| Recipes | /property-manager/automations/recipes | 5 | 5 (H1 above tabs) | 4 (count now accurate) | Seed fallback | 5 (draft-first on use) | N/A | **76/100** | PASS |
| My Automations | /property-manager/automations/my-automations | 5 | 5 (H1 above tabs) | 4 (all KPIs from data) | Seed fallback | 5 (toggle toast) | N/A | **76/100** | PASS |
| Canvas Builder | /property-manager/automations/canvas | 5 | 4 (WorkflowHeader is H1; tabs above it) | N/A | Live save (useAutomationFlow) | 5 (plan gate, dry-run, publish-for-review only) | 4 (saves drafts, Suspense-wrapped) | **80/100** | PASS |
| AI Builder | /property-manager/automations/ai-builder | 5 | 5 (H1 above tabs) | 3 (model usage donut = illustrative seed) | Seed fallback | 5 (draft-only safety card) | 4 (structured preview, no auto-enable) | **70/100** | PASS |
| Runs & Logs | /property-manager/automations/runs-logs | 5 | 5 (FIXED: H1 now "Runs & Logs") | 4 (derived from data; avg duration "—") | Seed fallback | 4 (no mutation risk) | N/A | **76/100** | PASS |
| Review Inbox | /property-manager/automations/approvals | 5 | 5 (H1 "Review Inbox") | 4 (pending/high-risk from data; SLA honest "—") | Seed fallback | 5 (approve/reject gates, low-risk bulk only) | N/A | **76/100** | PASS |
| Errors | /property-manager/automations/errors | 5 | 5 (H1 "Errors") | 3 (KPIs from seed hook; tab counts removed) | Seed fallback | 4 (safe-to-retry gate) | N/A | **68/100** | PASS |
| Usage & Limits | /property-manager/automations/usage-limits | 5 | 5 (H1 above tabs) | 3 (usage KPIs from seed; GBP fixed) | Seed fallback | 5 (admin modal permission-gated) | N/A | **70/100** | PASS |
| Activity | /property-manager/automations/activity | 5 | 5 (H1 above tabs) | 4 (counts from SEED_ACTIVITY) | Seed fallback | 5 (read-only view) | N/A | **76/100** | PASS |
| **Overall** | All 10 routes | **5** | **5** | **4** | **3** (seed until migrations applied) | **5** | **4** | **74/100** | **PASS** |

---

## FIX-276 Audit Summary — Key Issues Found

| Priority | Issue | ID | Fix Action |
|---|---|---|---|
| P1 | `TeamAutomations.tsx` RULES/LOGS/APPROVALS contain fake hardcoded data — FIX-267 was marked FIXED but code still has the arrays | AUTO-STW-002/003/004 | Clear RULES, LOGS, APPROVALS to empty arrays; add empty states |
| P2 | Canvas `validationStatus` on node cards never updated by validation hook — incomplete config nodes show `unchecked` not `error` | AUTO-PMW-007/008 | Wire `useAutomationValidation` results back to node `validationStatus` via canvas state |
| P2 | No `isValidConnection` guard on ReactFlow — trigger→trigger connections are not blocked | AUTO-PMW-006 | Add `isValidConnection` to `<ReactFlow>` that prevents trigger-to-trigger and end-to-anything edges |
| P2 | Integrations KPI card shows 22 but seed has 15 integrations; not UK-property-specific | AUTO-PMW-010 | Align KPI to seed count; add UK property integrations (Rightmove, Fixflo, etc.) |
| P2 | Webhook create/edit/delete all stubs — only list and toggle work | AUTO-PMW-011/013/014/015 | Implement endpoint form modal for create/edit; add delete confirmation |
| P3 | No context variables panel per trigger type | AUTO-PMW-009 | Add context vars panel to Inspector or as a collapsible section |
| P3 | No `AutomationShortcutBanner` component exists | AUTO-PMW-016 | Create and mount shortcut banners on relevant PM pages |
| P3 | Seed data fills automation list/runs when no live data — no honest "no automations yet" state | AUTO-PMW-017/018 | V2: implement empty state detection when source="seed" |

---

## Known V1 Limitations (Not Blockers)

| Item | Detail | Priority |
|---|---|---|
| AI Builder workflow | Current UI shows a static NODES preview after "Generate" — does not call a real NIM endpoint. V2 implementation will add 13-step NIM workflow. | V2 |
| Automations engine execution | automation_engine.ts exists but no cron/webhook trigger fires automations on real events yet. V2 wires up the execution layer. | V2 |
| Live run data | All hooks fall back to SEED data when tables are empty (correct behaviour). Once migrations applied and real runs created, live data will replace seed. | V1 migration |
| Loop prevention cap | automation_engine.ts has loop detection design but max_loop_count enforcement needs database-backed counter. | V1.5 |
| Rate limiting on AI nodes | caps.ts exists; automation_usage_daily table exists in migration; enforcement needs cron/middleware wiring. | V1.5 |
| Approval gate enforcement | Review-first policy defined; approval_required flag on seed items; but actual engine enforcement (stop automation until approved) is V2. | V2 |
