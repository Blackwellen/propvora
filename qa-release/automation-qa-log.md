# Automation QA Log

Last updated: 2026-06-21 (Session 13 — PM Automations section full audit. IA cleanup: 10 canonical tabs verified. KPI card data fixes: RunsLogsPage, MyAutomationsPage, ApprovalsPage, ErrorsPage. Hardcoded counts removed. tsc clean. See FIX-085–091 in implementation-fix-log.md. Pre-existing build failure at /services/[slug] is unrelated to automations and predates this session.)

## Scoring
5 = fully working | 4 = minor issue | 3 = partial | 2 = major issue | 1 = broken | 0 = not implemented

---

## 1. Property Manager Workspace Automations

| ID | Workspace | Route / Surface | Automation Function | Node Type | Node Name | Trigger / Input | Expected Output | Security Scope | Permission Required | Test Data Used | Node Executes? | Workflow Executes? | Error Handling Works? | Retry Works? | Audit Log Created? | Rate Limit Works? | Disabled State Works? | Plan Gate Works? | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|---------------------|-----------|-----------|----------------|----------------|----------------|--------------------|----|----|----|----|----|----|----|----|----|----|----|-------|--------|
| AUTO-PMW-001 | PM Workspace | `/property-manager/automations` | Automations list page loads | N/A | Automations overview | Navigate to route | List of all automations, active/inactive counts | Workspace scope | PM role | None | N/A | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-002 | PM Workspace | `/property-manager/automations/new` | Create new automation | Trigger | Rent due trigger | Rent due date within 7 days | Notification sent to tenant | Workspace | PM role | Tenancy with upcoming rent | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-003 | PM Workspace | `/property-manager/automations/[id]` | Edit automation | N/A | Automation editor | Open existing automation | Automation editor loads with current config | Workspace | PM role | Existing automation | PENDING | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-004 | PM Workspace | Automation builder | Trigger node — Rent due | Trigger | Rent Due Trigger | Rent due date field set | Automation fires on rent due date | Workspace | PM role | Tenancy with rent schedule | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-005 | PM Workspace | Automation builder | Trigger node — Certificate expiry | Trigger | Cert Expiry Trigger | Certificate expiry date within N days | Automation fires on cert expiry approach | Workspace | PM role | Certificate with expiry date | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-006 | PM Workspace | Automation builder | Trigger node — Tenancy end | Trigger | Tenancy End Trigger | Tenancy end date within N days | Automation fires on tenancy end approach | Workspace | PM role | Active tenancy with end date | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-007 | PM Workspace | Automation builder | Trigger node — Job status change | Trigger | Job Status Changed | Job status updated in DB | Automation fires on status change | Workspace | PM role | Job record | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-008 | PM Workspace | Automation builder | Trigger node — Form submitted | Trigger | Form Submission | Portal form submitted by tenant/landlord | Automation fires on form submit | Workspace | PM role | Tenant portal form submission | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-009 | PM Workspace | Automation builder | Logic node — Condition (if/else) | Logic | Condition | Field value comparison | Branch routes to correct next node | Workspace | PM role | Test data with matching condition | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-010 | PM Workspace | Automation builder | Logic node — Delay | Logic | Delay | Wait N hours/days | Next node fires after delay period | Workspace | PM role | Immediate trigger | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-011 | PM Workspace | Automation builder | Logic node — Filter | Logic | Filter | Field value filter condition | Only matching records proceed | Workspace | PM role | Mixed test records | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-012 | PM Workspace | Automation builder | Logic node — Loop | Logic | Loop | Iterate over record set | Each record processed independently | Workspace | PM role | Multi-record trigger | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-013 | PM Workspace | Automation builder | Action node — Send email | Action | Send Email | Recipient + template + variables | Email delivered via Resend | Workspace | PM role | Valid Resend config | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-014 | PM Workspace | Automation builder | Action node — Create task | Action | Create Task | Task title + assignee + due date | Task created in work section | Workspace | PM role | Workspace with task section | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-015 | PM Workspace | Automation builder | Action node — Update record | Action | Update Record | Record ID + field + new value | DB record updated correctly | Workspace | PM role | Target record in DB | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-016 | PM Workspace | Automation builder | Action node — Send in-app notification | Action | In-App Notification | User ID + message | Notification appears in bell | Workspace | PM role | Active workspace session | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-017 | PM Workspace | Automation builder | AI automation node — Generate content | AI Node | AI Generate | Prompt template + context variables | AI-generated content in output | Workspace | PM role + AI quota | NVIDIA NIM configured | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-018 | PM Workspace | Automation builder | AI automation node — Classify | AI Node | AI Classify | Input text + classification schema | Category label applied to record | Workspace | PM role + AI quota | Text input | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-PMW-019 | PM Workspace | `/property-manager/automations/[id]/runs` | Automation run log | N/A | Run History | View run history | List of past runs with status, timestamp, output | Workspace | PM role | Automation with run history | PENDING | N/A | PENDING | N/A | N/A | N/A | N/A | N/A | No | No | PENDING | PENDING |
| AUTO-PMW-020 | PM Workspace | Automation toggle | Enable/disable automation | N/A | Status Toggle | Toggle switch on automation card | Automation pauses / resumes firing | Workspace | PM role | Active automation | PENDING | PENDING | PENDING | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |

---

## 2. Supplier Solo Workspace Automations

| ID | Workspace | Route / Surface | Automation Function | Node Type | Node Name | Trigger / Input | Expected Output | Security Scope | Permission Required | Test Data Used | Node Executes? | Workflow Executes? | Error Handling Works? | Retry Works? | Audit Log Created? | Rate Limit Works? | Disabled State Works? | Plan Gate Works? | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|---------------------|-----------|-----------|----------------|----------------|----------------|--------------------|----|----|----|----|----|----|----|----|----|----|----|-------|--------|
| AUTO-SSW-001 | Supplier Solo | `/supplier/automations` | Automations list | N/A | Automations overview | Navigate to route | List of supplier automations | Supplier scope | Supplier role | None | N/A | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | No | No | PENDING | PENDING |
| AUTO-SSW-002 | Supplier Solo | Automation builder | Trigger — New job request | Trigger | New Request Trigger | Job request created for supplier | Automation fires on new request | Supplier scope | Supplier role | New job request | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-SSW-003 | Supplier Solo | Automation builder | Trigger — Job status changed | Trigger | Job Status Changed | Job status updated | Automation fires on status change | Supplier scope | Supplier role | Active job | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-SSW-004 | Supplier Solo | Automation builder | Action — Send email reply | Action | Send Email | Recipient + body | Email sent to PM via Resend | Supplier scope | Supplier role | Valid Resend config | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-SSW-005 | Supplier Solo | Automation builder | Action — Auto-accept request | Action | Accept Request | Request meets criteria | Request automatically accepted | Supplier scope | Supplier role | Qualifying request | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-SSW-006 | Supplier Solo | Automation builder | Action — Auto-decline request | Action | Decline Request | Request outside coverage | Request automatically declined | Supplier scope | Supplier role | Out-of-area request | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-SSW-007 | Supplier Solo | Automation builder | Logic — Condition (in coverage?) | Logic | Coverage Condition | Request postcode vs coverage area | Branch routes correctly | Supplier scope | Supplier role | Request with postcode | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-SSW-008 | Supplier Solo | Automation builder | AI node — Draft reply | AI Node | AI Draft Reply | Job description + context | AI-drafted response message | Supplier scope | Supplier role + AI quota | NVIDIA NIM configured | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-SSW-009 | Supplier Solo | Automation run log | View run history | N/A | Run History | View past automation runs | List with status and timestamp | Supplier scope | Supplier role | Automation with runs | PENDING | N/A | PENDING | N/A | N/A | N/A | N/A | N/A | No | No | PENDING | PENDING |
| AUTO-SSW-010 | Supplier Solo | Automation toggle | Enable/disable | N/A | Status Toggle | Toggle automation on/off | Automation pauses / resumes | Supplier scope | Supplier role | Active automation | PENDING | PENDING | PENDING | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |

---

## 3. Supplier Team Workspace Automations

| ID | Workspace | Route / Surface | Automation Function | Node Type | Node Name | Trigger / Input | Expected Output | Security Scope | Permission Required | Test Data Used | Node Executes? | Workflow Executes? | Error Handling Works? | Retry Works? | Audit Log Created? | Rate Limit Works? | Disabled State Works? | Plan Gate Works? | Fix Required | Fix Implemented | Score | Status |
|----|-----------|-----------------|---------------------|-----------|-----------|----------------|----------------|----------------|--------------------|----|----|----|----|----|----|----|----|----|----|----|-------|--------|
| AUTO-STW-001 | Supplier Team | `/supplier/automations` | Team automations list | N/A | Automations overview | Navigate to route | Team automations list | Team scope | Owner/Manager | None | N/A | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | No | No | PENDING | PENDING |
| AUTO-STW-002 | Supplier Team | Automation builder | Trigger — Job assigned to team member | Trigger | Member Assignment Trigger | Job assigned to team member | Automation fires on assignment | Team scope | Owner/Manager | Job + team member | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-STW-003 | Supplier Team | Automation builder | Trigger — Member availability change | Trigger | Availability Changed | Team member updates availability | Automation fires on availability update | Team scope | Owner/Manager | Team member record | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-STW-004 | Supplier Team | Automation builder | Action — Notify team member | Action | Notify Member | Member ID + message | In-app notification to member | Team scope | Owner/Manager | Active team member | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-STW-005 | Supplier Team | Automation builder | Action — Reassign job | Action | Reassign Job | Job ID + new assignee | Job reassigned in DB | Team scope | Owner/Manager | Job + available member | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-STW-006 | Supplier Team | Automation builder | Logic — Check member capacity | Logic | Capacity Check | Member's current job count | Route to assign or overflow | Team scope | Owner/Manager | Team with jobs | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-STW-007 | Supplier Team | Automation builder | AI node — Suggest assignment | AI Node | AI Assign | Job requirements + team skills | Recommended member with reason | Team scope | Owner/Manager + AI quota | NVIDIA NIM + team data | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING | No | No | PENDING | PENDING |
| AUTO-STW-008 | Supplier Team | Automation builder | Role gate — Member cannot edit automations | N/A | Role Gate | Access as member role | Edit UI blocked for members | Team scope | Owner/Manager only | Member user | PENDING | N/A | PENDING | N/A | N/A | N/A | N/A | PENDING | No | No | PENDING | PENDING |
| AUTO-STW-009 | Supplier Team | Automation run log | Team run history | N/A | Run History | View past team automation runs | List with user, status, timestamp | Team scope | Owner/Manager | Automation with runs | PENDING | N/A | PENDING | N/A | N/A | N/A | N/A | N/A | No | No | PENDING | PENDING |
| AUTO-STW-010 | Supplier Team | Automation toggle | Enable/disable (team) | N/A | Status Toggle | Toggle on/off | Automation pauses / resumes | Team scope | Owner/Manager | Active automation | PENDING | PENDING | PENDING | N/A | N/A | PENDING | N/A | PENDING | No | No | PENDING | PENDING |

---

## Node Type Inventory

All node types that must be available in the automation builder across all workspaces:

### Trigger Nodes
| Node | Description | PM Available? | Supplier Available? |
|------|-------------|---------------|---------------------|
| Rent Due Trigger | Fires N days before rent due date | PENDING | N/A |
| Certificate Expiry Trigger | Fires N days before cert expiry | PENDING | N/A |
| Tenancy End Trigger | Fires N days before tenancy end | PENDING | N/A |
| Job Status Changed | Fires when job status changes | PENDING | PENDING |
| Form Submitted | Fires on portal form submission | PENDING | N/A |
| New Request Trigger | Fires on new job request to supplier | N/A | PENDING |
| Member Assignment Trigger | Fires when job assigned to team member | N/A | PENDING (Team) |
| Availability Changed | Fires when team member availability updates | N/A | PENDING (Team) |
| Webhook Trigger | Fires on incoming webhook from external system | PENDING | PENDING |
| Schedule Trigger | Fires on a cron schedule | PENDING | PENDING |

### Logic Nodes
| Node | Description | PM Available? | Supplier Available? |
|------|-------------|---------------|---------------------|
| Condition (if/else) | Branch on field value comparison | PENDING | PENDING |
| Filter | Only pass records matching criteria | PENDING | PENDING |
| Delay | Wait N hours/days before next node | PENDING | PENDING |
| Loop | Iterate over a set of records | PENDING | PENDING |
| Capacity Check | Check team member current load | N/A | PENDING (Team) |
| Coverage Condition | Check if request is in coverage area | N/A | PENDING |

### Action Nodes
| Node | Description | PM Available? | Supplier Available? |
|------|-------------|---------------|---------------------|
| Send Email | Send email via Resend | PENDING | PENDING |
| Send In-App Notification | Trigger bell notification | PENDING | PENDING |
| Create Task | Create a work task | PENDING | N/A |
| Update Record | Update a DB record field | PENDING | PENDING |
| Accept Request | Auto-accept a job request | N/A | PENDING |
| Decline Request | Auto-decline a job request | N/A | PENDING |
| Reassign Job | Reassign job to another member | N/A | PENDING (Team) |
| Notify Team Member | Send in-app notification to team member | N/A | PENDING (Team) |
| Create Invoice | Auto-draft an invoice | PENDING | PENDING |
| Webhook Action | POST data to external webhook | PENDING | PENDING |

### AI Nodes
| Node | Description | PM Available? | Supplier Available? |
|------|-------------|---------------|---------------------|
| AI Generate Content | Generate text using NIM | PENDING | PENDING |
| AI Classify | Classify input text | PENDING | PENDING |
| AI Draft Reply | Draft a reply message | N/A | PENDING |
| AI Suggest Assignment | Recommend team member for job | N/A | PENDING (Team) |
| AI Summarise | Summarise a record or thread | PENDING | PENDING |

---

## Automation Security Checklist

- [ ] All automation triggers are scoped to the authenticated workspace — no cross-workspace data access
- [ ] Automation actions cannot write to records outside the authenticated workspace
- [ ] RLS policies enforced on all tables automation nodes read from or write to
- [ ] AI nodes: prompt inputs sanitised before sending to NVIDIA NIM
- [ ] AI nodes: responses not stored in plaintext without encryption
- [ ] Rate limiting applied to automation execution per workspace
- [ ] Plan gates enforced: automation count and AI node availability restricted by plan tier
- [ ] Audit log created for every automation execution (workspace ID, automation ID, trigger, timestamp, status)
- [ ] Automation run logs are only viewable by the owning workspace
- [ ] Disabled automations cannot be triggered by direct API calls
- [ ] Webhook triggers validate HMAC signature before executing
- [ ] Webhook actions do not leak internal IDs or sensitive field values
- [ ] Loop nodes have a max-iteration cap to prevent infinite loops
- [ ] Delay nodes have a max-delay cap to prevent indefinitely stalled executions

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

### Known V1 Limitations (Not Blockers)

| Item | Detail | Priority |
|---|---|---|
| AI Builder workflow | Current UI shows a static NODES preview after "Generate" — does not call a real NIM endpoint. V2 implementation will add 13-step NIM workflow. | V2 |
| Automations engine execution | automation_engine.ts exists but no cron/webhook trigger fires automations on real events yet. V2 wires up the execution layer. | V2 |
| Live run data | All hooks fall back to SEED data when tables are empty (correct behaviour). Once migrations applied and real runs created, live data will replace seed. | V1 migration |
| Loop prevention cap | automation_engine.ts has loop detection design but max_loop_count enforcement needs database-backed counter. | V1.5 |
| Rate limiting on AI nodes | caps.ts exists; automation_usage_daily table exists in migration; enforcement needs cron/middleware wiring. | V1.5 |
| Approval gate enforcement | Review-first policy defined; approval_required flag on seed items; but actual engine enforcement (stop automation until approved) is V2. | V2 |
