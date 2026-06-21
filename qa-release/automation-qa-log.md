# Automation QA Log

Last updated: 2026-06-21 (FIX-282 — Enterprise automation node hardening)

## Scoring
5 = fully working | 4 = minor issue | 3 = partial/stub | 2 = major issue | 1 = broken/fake data | 0 = not implemented | N/A = not applicable

---

## FIX-282 (2026-06-21) — Enterprise node hardening, stress audit, fake-data removal

### Engine hardening

| ID | Area | Check | Result | Score |
|----|------|-------|--------|-------|
| AUTO-ENG-001 | executor.ts | Per-node timeout guard (30 s) | Added `withTimeout()` wrapping each `executeAction` call. Timeout yields a `failed` step and continues — never blocks the queue drainer. | 5 |
| AUTO-ENG-002 | executor.ts | Error isolation per claimed run | Each run wrapped in try/catch in `drainAutomationQueue`. A run that throws unexpectedly is finished 'failed' and the drainer continues with remaining runs. | 5 |
| AUTO-ENG-003 | executor.ts | Idempotency — guarded claim | `.eq('status','queued')` guard in `claimQueuedRuns` — only one concurrent drainer can claim a given run row. Dry runs excluded. | 5 |
| AUTO-ENG-004 | caps.ts | Concurrent increment safety | `incrementRunUsage` used a read-modify-write pattern (race condition under 10+ concurrent runs). Replaced with atomic upsert pattern using `onConflict` and re-read for accuracy. | 4 |
| AUTO-ENG-005 | evaluate.ts | Trigger evaluators error-safe | Top-level `try/catch` returns `[]` on any DB error. One broken trigger never aborts others in the same rule evaluation pass. | 5 |
| AUTO-ENG-006 | execute.ts | Action handlers error-safe | All action branches inside a single `try/catch`; returns `{ok:false, error}` — never throws up the call stack. | 5 |
| AUTO-ENG-007 | engine.ts | N+1 protection | Per-rule query uses `.limit(100)` via `evaluateRule`. Dedup done in-memory with a Set built from a single bulk query of recent runs. No per-match Supabase call. | 5 |
| AUTO-ENG-008 | All tables | RLS + workspace_id scope | All automation tables have RLS enabled. Every Supabase query in the automation path includes `workspace_id` equality filter. | 5 |
| AUTO-ENG-009 | approvals.ts | Audit logging per node | `automation_node_runs`, `automation_run_events`, `automation_errors` all written for every node execution (succeeded/failed/skipped/blocked/awaiting_approval). | 5 |
| AUTO-ENG-010 | Migration | Stress indexes | `20260621230000_automation_stress_hardening.sql` — 8 new partial/covering indexes: queue drain, node-run key lookup, run events workspace scope, errors by definition, approvals by run+status, smart-rule runs gin+triggered_at, smart-rules enabled. | 5 |

### Canvas UI

| ID | Area | Check | Result | Score |
|----|------|-------|--------|-------|
| AUTO-CAN-001 | AutomationNodeCard.tsx | Run-status dot | Added `RunStatusDot` component: green dot = succeeded, red = failed/timeout, pulsing yellow = running, yellow = awaiting_approval, grey = skipped/blocked, no dot = never run. Dot shown with `title` tooltip containing error message. | 5 |
| AUTO-CAN-002 | canvas/types.ts | `lastRunStatus` + `lastRunError` fields | Added to `CanvasFlowNodeData` interface. These are populated by the run-history API when a canvas loads after a workflow execution. | 5 |

### Supplier TeamAutomations (P1 fake data removal)

| ID | Area | Check | Score Before | Score After | Status |
|----|------|-------|-------------|-------------|--------|
| AUTO-STW-002 | TeamAutomations.tsx | RULES cleared (was 5 hardcoded) | 1 | 5 | FIXED |
| AUTO-STW-003 | TeamAutomations.tsx | LOGS cleared (was 3 fake entries) | 1 | 5 | FIXED |
| AUTO-STW-004 | TeamAutomations.tsx | APPROVALS cleared ("Mike Thompson" removed) | 1 | 5 | FIXED |
| AUTO-STW-008 | TeamAutomations.tsx | Logs empty state now reachable | 1 | 5 | FIXED |
| AUTO-STW-009 | TeamAutomations.tsx | Approvals empty state now reachable | 2 | 5 | FIXED |

### Supabase stress audit findings

| Table | Issue | Status |
|-------|-------|--------|
| `automation_v2_runs` | Queue drain query (status+is_dry_run+created_at) had no covering partial index | FIXED — `idx_automation_v2_runs_queue_drain` added |
| `automation_node_runs` | No index on (run_id, node_key) for idempotency path | FIXED — `idx_automation_node_runs_run_key` added |
| `automation_run_events` | No workspace-scoped index for timeline API | FIXED — `idx_automation_run_events_ws_run` added |
| `automation_errors` | No definition_id index for errors surface | FIXED — `idx_automation_errors_def` added |
| `automation_approvals` | No (run_id, status='pending') index for approval-gate path | FIXED — `idx_automation_approvals_run_status` added |
| `smart_rule_runs` | No GIN index for dedupe_key lookup in context jsonb | FIXED — `idx_smart_rule_runs_context_gin` added |
| `smart_rule_runs` | No (workspace_id, triggered_at) index for 30-day window query | FIXED — `idx_smart_rule_runs_ws_triggered` added |
| `smart_rules` | No partial index for enabled=true workspace filter | FIXED — `idx_smart_rules_ws_enabled` added |
| `automation_caps_usage` | UNIQUE constraint serves as index — no change needed | OK |
| `automation_definitions` | `idx_automation_definitions_en` already covers (workspace_id, enabled) | OK |

---

## FIX-276 Audit (2026-06-21) — Code-Read Results

### 1. Canvas System (PM Workspace)

| ID | Surface | Check | Result | Score |
|----|---------|-------|--------|-------|
| AUTO-PMW-001 | AutomationCanvas.tsx | Canvas loads without errors | ReactFlowProvider wraps correctly; @xyflow/react v12 used; EmptyCanvasState renders "Start with a trigger" with 3 CTAs | 5 |
| AUTO-PMW-002 | node-registry.ts | Trigger nodes all present | 29 trigger types across record/portfolio/work/booking/marketplace/supplier/money/compliance/legal/AI/schedule/webhook scopes | 5 |
| AUTO-PMW-003 | node-registry.ts | Action nodes all present | 11 action node types + 3 communication + 3 payment + 3 approval | 5 |
| AUTO-PMW-004 | node-registry.ts | Condition nodes all present | 7 condition types; Branch: 3; Delay: 3; Lookup: 4; Utility: 3; Error: 3; End: 3 | 5 |
| AUTO-PMW-005 | node-registry.ts | All 16 node categories present | Confirmed: trigger, condition, branch, delay, lookup, ai, action, communication, payment, approval, legal, integration, webhook, utility, error, end | 5 |
| AUTO-PMW-006 | AutomationCanvas.tsx | Connection validation | No isValidConnection prop. Triggers block target handles; end nodes block source handles. Trigger→trigger / cross-type still possible. | 3 |
| AUTO-PMW-007 | AutomationNodeCard.tsx | Run-status badges | FIXED (FIX-282) — RunStatusDot component added; lastRunStatus wired to CanvasFlowNodeData | 5 |
| AUTO-PMW-008 | AutomationNodeInspector.tsx | Inspector tabs present | Settings / Inputs / JSON / Code / Test Data — all 5 tabs present | 5 |
| AUTO-PMW-009 | AutomationCanvasPage.tsx | Context variables panel | No dedicated context variables panel; supportsTokens shows token hint | 3 |
| AUTO-PMW-010 | IntegrationsPage.tsx | 22 UK property integrations | KPI shows 22 but SEED has 15; not UK-specific | 2 |
| AUTO-PMW-011 | WebhooksPage.tsx | Webhook CREATE | Toast stub — no form modal | 3 |
| AUTO-PMW-012 | WebhooksPage.tsx | Webhook READ/LIST | Full DataTable with 5 endpoints | 5 |
| AUTO-PMW-013 | WebhooksPage.tsx | Webhook UPDATE | Toggle works; "Configure" is stub | 3 |
| AUTO-PMW-014 | WebhooksPage.tsx | Webhook DELETE | No delete button | 1 |
| AUTO-PMW-015 | WebhooksPage.tsx | Webhook TEST | Toast stub — no real delivery | 3 |
| AUTO-PMW-019 | useAutomationUndoRedo.ts | Undo/redo | canUndo/canRedo exposed; WorkflowHeader wired | 5 |
| AUTO-PMW-020 | seedWorkflow.ts | Canvas seed workflow | 10-node compliance workflow seeded; domain-accurate | 5 |

### 2. Supplier Team Automations

| ID | Surface | Check | Score Before | Score After |
|----|---------|-------|-------------|-------------|
| AUTO-STW-001 | TeamAutomations.tsx | Component renders | 5 | 5 |
| AUTO-STW-002 | TeamAutomations.tsx | RULES cleared | 1 | 5 (FIXED FIX-282) |
| AUTO-STW-003 | TeamAutomations.tsx | LOGS cleared | 1 | 5 (FIXED FIX-282) |
| AUTO-STW-004 | TeamAutomations.tsx | APPROVALS cleared | 1 | 5 (FIXED FIX-282) |
| AUTO-STW-005 | TeamAutomations.tsx | Toggle works | 5 | 5 |
| AUTO-STW-006 | TeamAutomations.tsx | Safety banner present | 5 | 5 |
| AUTO-STW-007 | TeamAutomations.tsx | Templates tab | 4 | 4 |
| AUTO-STW-008 | TeamAutomations.tsx | Logs empty state reachable | 1 | 5 (FIXED FIX-282) |
| AUTO-STW-009 | TeamAutomations.tsx | Approvals empty state reachable | 2 | 5 (FIXED FIX-282) |
