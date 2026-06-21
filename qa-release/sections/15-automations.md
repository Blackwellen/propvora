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

## Automation Node Matrix

Last updated: 2026-06-21 (Session 41 — FIX-230/232/246/249: additional automation honesty sweep; FIX-260: node registry placeholder tokens; FIX-264: slash commands real registry; FIX-265: integrations/webhooks live env-check; all builds EXIT:0)

| ID | Workspace | Route / Surface | Node Type | Node Name | Executes? | Security OK? | Plan Gate? | Audit Log? | Score | Status |
|----|-----------|----------------|-----------|-----------|-----------|-------------|-----------|-----------|-------|--------|
| AUTO-PMW-001 | PM | /property-manager/automations | Trigger | Manual trigger | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-002 | PM | /property-manager/automations | Trigger | Schedule trigger | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-003 | PM | /property-manager/automations | Trigger | Record created | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-004 | PM | /property-manager/automations | Trigger | Status changed | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-005 | PM | /property-manager/automations | Trigger | Date approaching | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-006 | PM | /property-manager/automations | Trigger | Rent overdue | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-007 | PM | /property-manager/automations | Trigger | Certificate expiring | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-008 | PM | /property-manager/automations | Logic | If/else condition | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-009 | PM | /property-manager/automations | Logic | Multi-branch | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-010 | PM | /property-manager/automations | Logic | Delay/wait | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-011 | PM | /property-manager/automations | Action | Create task | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-012 | PM | /property-manager/automations | Action | Send notification | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-013 | PM | /property-manager/automations | Action | Send email | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-014 | PM | /property-manager/automations | Action | Update status | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-015 | PM | /property-manager/automations | Action | Create invoice | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-016 | PM | /property-manager/automations | AI Node | AI summarise | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-017 | PM | /property-manager/automations | AI Node | AI draft message | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-PMW-018 | PM | /property-manager/automations | AI Node | AI classify | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-SSW-001 | SSW | /supplier/automations | Trigger | Job created | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-SSW-002 | SSW | /supplier/automations | Action | Send notification | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED |
| AUTO-STW-001 | STW | /supplier/automations | Trigger | Job assigned | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — BLK-010 supplier migration needed |
| AUTO-STW-002 | STW | /supplier/automations | Action | Assign team member | [~] | [~] | [~] | [~] | [~] | BROWSER_REQUIRED — BLK-010 supplier migration needed |

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
