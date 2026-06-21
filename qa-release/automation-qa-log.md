# Automation QA Log

Last updated: 2026-06-21 (FIX-276 — full code-read QA audit across PM/Supplier/Customer automation surfaces)

## Scoring
5 = fully working | 4 = minor issue | 3 = partial/stub | 2 = major issue | 1 = broken/fake data | 0 = not implemented | N/A = not applicable

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
| AUTO-PMW-006 | AutomationCanvas.tsx | Connection validation (isValidConnection) | NO isValidConnection prop on ReactFlow. Triggers block target handles correctly; end nodes block source handles. But trigger→trigger and cross-type invalid connections are NOT rejected. | 3 |
| AUTO-PMW-007 | AutomationNodeCard.tsx | Config badges on incomplete nodes | ValidationIcon renders based on data.validationStatus. New nodes start as "unchecked". useAutomationValidation checks required fields but NEVER writes back to node.data.validationStatus. Visual badge does not reflect live config state. | 2 |
| AUTO-PMW-008 | AutomationNodeInspector.tsx | Inspector tabs present | Settings / Inputs / JSON / Code / Test Data — all 5 tabs present and functional. Config schema renders per node type. | 5 |
| AUTO-PMW-009 | AutomationCanvasPage.tsx | Context variables panel | No dedicated context variables panel. Inputs tab shows schema fields. supportsTokens shows token hint. No per-trigger context variable listing. | 3 |
| AUTO-PMW-010 | IntegrationsPage.tsx | 22 UK property integrations | KPI shows 22 but SEED_INTEGRATIONS has 15 entries. Not UK-property-specific (Gmail, Stripe, etc.). Missing: Rightmove, Fixflo, Arthur Online, Starling, Zoopla | 2 |
| AUTO-PMW-011 | WebhooksPage.tsx | Webhook CREATE | Toast stub "New endpoint — opens endpoint form". No form modal. | 3 |
| AUTO-PMW-012 | WebhooksPage.tsx | Webhook READ/LIST | Full DataTable with 5 endpoints, all columns populated from seed | 5 |
| AUTO-PMW-013 | WebhooksPage.tsx | Webhook UPDATE | Enable/disable toggle works. "Configure" is toast stub. No edit form. | 3 |
| AUTO-PMW-014 | WebhooksPage.tsx | Webhook DELETE | No delete button or confirmation anywhere. | 1 |
| AUTO-PMW-015 | WebhooksPage.tsx | Webhook TEST | "Test event" button fires toast. No real delivery. Endpoint detail panel shows signing secret with show/hide + rotate. | 3 |
| AUTO-PMW-016 | AutomationShortcutBanner.tsx | Shortcut banners on PM pages | File does not exist. Only AutomationRegistryPanels.tsx and AutomationSectionNav.tsx in /components/automations/. | 0 |
| AUTO-PMW-017 | seed.ts + hooks.ts | Honest empty states on automation list | SEED_MY_AUTOMATIONS (8 entries) fills when DB empty. source="seed" returned but not shown in UI. No "create your first automation" empty state when tables unmigrated. | 3 |
| AUTO-PMW-018 | RunsLogsPage.tsx / ErrorsPage.tsx | Run log honest empty state | SEED_RUNS (10) + SEED_ERRORS (8) fill when DB empty. Honest RUN refs (RUN-2024-05-24-*) are not fake person data but illustrative run IDs. Acceptable V1 seed pattern. | 3 |
| AUTO-PMW-019 | useAutomationUndoRedo.ts | Undo/redo functional | useAutomationUndoRedo hook present; canUndo/canRedo exposed; WorkflowHeader wired. | 5 |
| AUTO-PMW-020 | seedWorkflow.ts | Canvas seed workflow | 10-node compliance workflow seeded: trigger → condition → dual-branch → actions/approval/webhook/invoice → end. Domain-accurate, no fake person names. | 5 |

---

### 2. Supplier Team Workspace Automations

| ID | Surface | Check | Result | Score |
|----|---------|-------|--------|-------|
| AUTO-STW-001 | TeamAutomations.tsx | Component renders | 4 tabs: Rules / Templates / Logs / Approvals. Review-first safety banner. | 5 |
| AUTO-STW-002 | TeamAutomations.tsx | RULES: empty arrays (no fake data)? | FAIL — RULES has 5 hardcoded entries. FIX-267 marked complete but RULES array was NOT cleared. | 1 |
| AUTO-STW-003 | TeamAutomations.tsx | LOGS: empty arrays (no fake data)? | FAIL — LOGS has 3 hardcoded entries. FIX-267 marked complete but LOGS was NOT cleared. | 1 |
| AUTO-STW-004 | TeamAutomations.tsx | APPROVALS: fake person names removed? | FAIL — APPROVALS has 1 entry with requestedBy: "Mike Thompson". FIX-267 should have cleared this. | 1 |
| AUTO-STW-005 | TeamAutomations.tsx | Toggle works? | toggle() correctly switches active/paused with toast feedback. | 5 |
| AUTO-STW-006 | TeamAutomations.tsx | Safety banner present? | Blue review-first safety banner present and correct copy. | 5 |
| AUTO-STW-007 | TeamAutomations.tsx | Templates tab? | 4 templates with customer-impacting badges and stub "Use template" buttons. | 4 |
| AUTO-STW-008 | TeamAutomations.tsx | Logs empty state? | Empty state coded (renders if LOGS.length===0) but never shown since LOGS has entries. | 1 |
| AUTO-STW-009 | TeamAutomations.tsx | Approvals empty state reachable? | Empty state coded and correct. Hidden behind 1 fake approval entry. | 2 |

---

### 3. Supplier Solo Workspace Automations

| ID | Surface | Check | Result | Score |
|----|---------|-------|--------|-------|
| AUTO-SSW-001–010 | Supplier Solo | All checks | No automation section exists in supplier solo workspace. Only supplier TEAM has TeamAutomations.tsx. | N/A |

---

### 4. Customer Workspace Automations

| ID | Surface | Check | Result | Score |
|----|---------|-------|--------|-------|
| AUTO-CTW-001–010 | Customer | All checks | Customer workspace (/customer/*) has no automation pages. Routes: home, lets, lets/search, lets/journey, stays only. | N/A |

---

## Previous Audit (Session 13 — 2026-06-21)

| ID | Workspace | Route / Surface | Automation Function | Node Type | Node Name | Trigger / Input | Expected Output | Security Scope | Permission Required | Test Data Used | Node Executes? | Workflow Executes? | Error Handling Works? | Retry Works? | Audit Log Created? | Rate Limit Works? | Disabled State Works? | Plan Gate Works? | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|---------------------|-----------|-----------|----------------|----------------|----------------|--------------------|----|----|----|----|----|----|----|----|----|----|----|-------|--------|
| AUTO-PMW-001 | PM Workspace | `/property-manager/automations` | Automations list page loads | N/A | Automations overview | Navigate to route | List of all automations, active/inactive counts | Workspace scope | PM role | None | N/A | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-002 | PM Workspace | `/property-manager/automations/new` | Create new automation | Trigger | Rent due trigger | Rent due date within 7 days | Notification sent to tenant | Workspace | PM role | Tenancy with upcoming rent | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-003 | PM Workspace | `/property-manager/automations/[id]` | Edit automation | N/A | Automation editor | Open existing automation | Automation editor loads with current config | Workspace | PM role | Existing automation | PENDING | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-004 | PM Workspace | Automation builder | Trigger node — Rent due | Trigger | Rent Due Trigger | Rent due date field set | Automation fires on rent due date | Workspace | PM role | Tenancy with rent schedule | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-005 | PM Workspace | Automation builder | Trigger node — Certificate expiry | Trigger | Cert Expiry Trigger | Certificate expiry date within N days | Automation fires on cert expiry approach | Workspace | PM role | Certificate with expiry date | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |

---

## Issues Requiring Fix (FIX-276 Findings)

| Priority | Issue | File | Recommended Action |
|---|---|---|---|
| P1 | TeamAutomations RULES not cleared — contains 5 fake hardcoded rules | `src/features/supplier/team/automations/TeamAutomations.tsx` | Clear RULES to `[]`; add empty state "No automation rules yet" |
| P1 | TeamAutomations LOGS not cleared — contains 3 fake log entries | `src/features/supplier/team/automations/TeamAutomations.tsx` | Clear LOGS to `[]`; add empty state "No automation logs yet" |
| P1 | TeamAutomations APPROVALS not cleared — "Mike Thompson" in requestedBy | `src/features/supplier/team/automations/TeamAutomations.tsx` | Clear APPROVALS to `[]`; empty state already coded (just unreachable) |
| P2 | validationStatus never updated from validation hook — incomplete nodes stay "unchecked" | `src/features/automations/hooks/useAutomationValidation.ts`, `src/features/automations/hooks/useAutomationCanvasState.ts` | After `useAutomationValidation` runs, apply status back to nodes via `updateNodeConfig` or dedicated `updateNodeValidation` |
| P2 | No isValidConnection guard on canvas | `src/features/automations/canvas/AutomationCanvas.tsx` | Add `isValidConnection` prop: block trigger→trigger, end→anything, allow source→target only |
| P2 | Integrations KPI card shows 22 but only 15 in seed | `src/features/automations/pages/IntegrationsPage.tsx` | Change KPI value to `integrations.length` (dynamic); add UK property integrations to seed |
| P2 | Webhook delete missing | `src/features/automations/pages/WebhooksPage.tsx` | Add delete button + confirmation modal in endpoint detail panel |
| P3 | AutomationShortcutBanner component missing | New file needed | Create `src/components/automations/AutomationShortcutBanner.tsx` and mount on PM section pages |
| P3 | No context variables panel in canvas inspector | `src/features/automations/canvas/AutomationNodeInspector.tsx` | Add "Context Vars" tab showing per-trigger-type available variables |
