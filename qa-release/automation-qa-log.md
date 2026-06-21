# Automation QA Log

Last updated: 2026-06-22 (FIX-288 — Deep audit: webhooks CRUD, integrations catalogue, canvas validation, NL builder sync)

## Scoring
5 = fully working | 4 = minor issue | 3 = partial/stub | 2 = major issue | 1 = broken/fake data | 0 = not implemented | N/A = not applicable

---

## FIX-288 (2026-06-22) — Deep audit: webhooks CRUD, integrations catalogue, canvas connection validation, NL builder catalogue sync

### Outbound Webhooks (Area 1)

| ID | Area | Check | Result | Score |
|----|------|-------|--------|-------|
| WH-001 | WebhooksPage.tsx | Real CRUD wired to API | Fully rewritten — list, add, toggle (PATCH), delete, test all call `/api/automations/outbound-webhooks` | 5 |
| WH-002 | outbound-webhooks/route.ts | New API route | GET (list + logs), POST (create), PATCH (toggle/update), DELETE, PUT (test delivery) | 5 |
| WH-003 | migration 20260622010000 | `automation_webhooks` table | Created with RLS, workspace_id FK, event_types[], enabled, last_triggered_at | 5 |
| WH-004 | migration 20260622010000 | `automation_webhook_logs` table | Delivery log with http_status, response_ms, error_msg | 5 |
| WH-005 | WebhooksPage.tsx | "Add webhook" form | URL (https only), description, event type multi-select (46 slugs), secret generation | 5 |
| WH-006 | WebhooksPage.tsx | Test webhook button | Sends real POST, logs delivery, shows HTTP status + latency | 5 |
| WH-007 | WebhooksPage.tsx | Delivery log | Shows last 20 deliveries per webhook with status and latency | 5 |
| WH-008 | WebhooksPage.tsx | Empty state | Honest "no webhooks yet" when list is empty | 5 |
| WH-009 | WebhooksPage.tsx | KPI strip | Real counts from live data (not hardcoded) | 5 |

### Integrations Catalogue (Area 1)

| ID | Area | Check | Result | Score |
|----|------|-------|--------|-------|
| INT-001 | IntegrationsPage.tsx | Real connections from API | GET `/api/automations/integrations` wired, shows real connections | 5 |
| INT-002 | IntegrationsPage.tsx | Connect modal | API key + webhook URL, POST to API, stores connection | 5 |
| INT-003 | IntegrationsPage.tsx | Integration catalogue | 9 integrations: Zapier, Make, Slack, Teams, Google Sheets, QuickBooks, Xero, Stripe, HMRC MTD | 5 |
| INT-004 | IntegrationsPage.tsx | Connected/not-connected state | Real badges based on API data | 5 |
| INT-005 | IntegrationsPage.tsx | KPI strip | Based on real catalogue + connection count | 5 |
| INT-006 | migration 20260622010000 | `automation_integrations` columns | Added provider, status, config, secret_ref, last_used_at, connected_at columns idempotently | 5 |

### Canvas Builder (Area 2)

| ID | Area | Check | Result | Score |
|----|------|-------|--------|-------|
| CAN-001 | useAutomationCanvasState.ts | Circular connection prevention | DFS cycle check — prevents circular connections | 5 |
| CAN-002 | useAutomationCanvasState.ts | Single trigger enforcement | Prevents a second trigger from having outgoing edges | 5 |
| CAN-003 | useAutomationCanvasState.ts | Self-connection prevention | source === target check | 5 |
| CAN-004 | useAutomationValidation.ts | Multiple trigger error | Extra trigger nodes marked invalid | 5 |
| CAN-005 | useAutomationFlow.ts | Save to DB | Saves to `automation_flows` table, 42P01-safe | 5 |
| CAN-006 | useAutomationDryRun.ts | Dry run | Client-side simulation + persists to `automation_dry_runs` | 5 |
| CAN-007 | AutomationPublishReviewModal.tsx | Publish gate | Blocks publish if checklist fails | 5 |

### NL Builder (Area 3)

| ID | Area | Check | Result | Score |
|----|------|-------|--------|-------|
| NL-001 | nl-builder.ts | Catalogue slug lists | Added explicit TRIGGER_SLUGS (46) and ACTION_SLUGS (17+) arrays to system prompt | 5 |
| NL-002 | nl-builder.ts | Node validation | `normaliseGraph()` drops any node types not in `AUTOMATION_NODE_REGISTRY` | 5 |
| NL-003 | nl-builder.ts | Safety contract | Review-required, never saves/runs, draft only | 5 |

### Approvals (Area 4)

| ID | Area | Check | Result | Score |
|----|------|-------|--------|-------|
| APP-001 | ApprovalsPage.tsx | Approve button | Wired to POST `/api/automations/approvals` with decision=approved | 5 |
| APP-002 | ApprovalsPage.tsx | Reject button | Opens reject modal, requires note, POSTs decision=rejected + note | 5 |
| APP-003 | ApprovalsPage.tsx | Loading states | Disabled + spinner while deciding | 5 |
| APP-004 | ApprovalsPage.tsx | Reload after decision | Calls `reload()` from hook after successful decision | 5 |
