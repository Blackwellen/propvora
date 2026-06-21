# AI QA Log

Last updated: 2026-06-21 (FIX-289 — Injection hardening, deep DB context, micro-actions, customization, Use AI button wiring)

## Scoring
5 = fully working | 4 = minor issue | 3 = partial | 2 = major issue / broken | 1 = severe | 0 = not implemented

---

## FIX-289 Audit Summary — 2026-06-21

### AREA 1 — Injection Hardening

| Check | Status | Notes |
|-------|--------|-------|
| `fenceUntrusted()` on pageContext | 5 | Applied in route.ts |
| `fenceUntrusted()` on contextRoute | 5 | Fenced inside workspace context block |
| `fenceUntrusted()` on workspace name/plan | 5 | Part of WORKSPACE CONTEXT fence |
| `fenceUntrusted()` on custom instructions | 5 | Applied before injecting into system prompt |
| `fenceUntrusted()` on entity context (property/tenancy) | 5 | Applied in entityContextBlock |
| SECURITY RULES block in system prompt | 5 | Added: identity lock, instruction reveal refusal, bracket injection, DAN |
| INJECTION_PATTERNS count | 5 | 19 patterns total (was 10, added 9) |
| Rate limit check before AI call | 5 | checkRate() runs at step 4 |

### AREA 2 — Deep DB Context

| Metric | Query Table | Status |
|--------|-------------|--------|
| Property count | properties | 5 |
| Unit count | units | 5 |
| Active tenancy count | tenancies (status=active) | 5 |
| Open tasks (not done) | tasks | 5 |
| Overdue tasks (past due_date) | tasks | 5 NEW |
| High-priority tasks | tasks (priority in high/urgent/critical) | 5 NEW |
| Open jobs | jobs | 5 |
| Jobs in progress | jobs (status=in_progress) | 5 NEW |
| Compliance due 30 days | compliance_items | 5 NEW |
| Compliance overdue | compliance_items | 5 NEW |
| Pending automation approvals | automation_approval_queue | 5 NEW |
| Property entity context | properties (with units+tenancies join) | 5 NEW |
| Tenancy entity context | tenancies (with properties+contacts join) | 5 NEW |

### AREA 3 — Response Quality Flow

| Step | Status |
|------|--------|
| 1. parseSlashCommand() dispatch | 5 |
| 2. Command prompt + args assembly | 5 |
| 3. System prompt: IDENTITY + WORKSPACE + PAGE + ENTITY + CUSTOM + SECURITY + SAFETY + JURISDICTION + FORMATTING | 5 |
| 4. Word limit from copilot_response_style | 5 NEW |
| 5. Stream via gateway | 5 |
| 6. CopilotMessageBubble whitespace-pre-wrap render | 5 |
| 7. Thread persisted (ai_chat_threads + ai_chat_messages) | 5 |
| 8. Cap check (checkCaps) | 5 |
| 9. Audit log (ai_audit_log insert, best-effort) | 5 NEW |

### AREA 4 — Micro-actions (Quick-Action Chips)

| Command | Quick Actions | Status |
|---------|---------------|--------|
| /summarise | /issues, /cashflow-forecast, /review-compliance | 5 NEW |
| /issues | /create-task, /escalation-summary | 5 NEW |
| /cashflow-forecast | /chase-arrears, /explain-payout | 5 NEW |
| /review-compliance | /compliance-calendar, /deposit-status | 5 NEW |
| /explain-portfolio | /void-properties, /tenancy-renewals | 5 NEW |

### AREA 5 — Copilot Customization Settings

| Feature | Location | Status |
|---------|----------|--------|
| Custom instructions textarea | /workspace-settings/copilot-inbox | 5 NEW |
| Response style selector (concise/standard/detailed) | /workspace-settings/copilot-inbox | 5 NEW |
| Settings persisted via saveWorkspaceSettings | copilot_instructions, copilot_response_style keys | 5 NEW |
| Settings read in route.ts and injected into system prompt | workspace_settings table lookup | 5 NEW |

### AREA 6 — Use AI Button Wiring

| Page | Was | Now | Status |
|------|-----|-----|--------|
| work/board | unconnected `<button>` | openCopilot({kanban prompt}) | 5 FIXED |
| work/board (insights link) | `<Link href="/app/work">` | openCopilot button | 5 FIXED |
| work/gantt | `<Link href="/app/work">` | openCopilot({gantt prompt}) | 5 FIXED |
| work/page (header) | `<Link href="/app/work">` | openCopilot({/summarise}) | 5 FIXED |
| work/page (overflow) | `href: "/app/work"` | `onClick: openCopilot` | 5 FIXED |
| work/jobs/[id] (overflow) | `href: "/app/work"` | `onClick: openCopilot` | 5 FIXED |
| work/jobs/[id] (desktop) | `<Link href="/app/work">` | openCopilot button | 5 FIXED |
| planning/profiles (AI suggestions) | unconnected `<button>` | openCopilot({/review-planning}) | 5 FIXED |
| portfolio/page | openCopilot (was already wired) | 5 already done |
| work/tasks | openCopilot (was already wired) | 5 already done |
| work/jobs | openCopilot (was already wired) | 5 already done |
| money/invoices/[id] | openCopilot (was already wired) | 5 already done |

---

## Per-Command Audit (all 35 commands)

| Command | Pack | Capability | Prompt Quality | requiresApproval | Score |
|---------|------|------------|----------------|-----------------|-------|
| /summarise | ai-core | always | 5 | No | 5 |
| /upcoming-priorities | ai-core | always | 5 | No | 5 |
| /create-task | ai-core | always | 5 | Yes (task-draft) | 5 |
| /escalation-summary | ai-core | always | 5 | No | 5 |
| /explain-portfolio | portfolio | portfolio | 5 | No | 5 |
| /check-tenancy | portfolio | portfolio | 5 | No | 5 |
| /void-properties | portfolio | portfolio | 5 | No | 5 |
| /tenancy-renewals | portfolio | portfolio | 5 | No | 5 |
| /draft-move-in-letter | portfolio | portfolio | 5 | Yes (document-draft) | 5 |
| /review-compliance | compliance | compliance | 5 | No | 5 |
| /find-missing-docs | compliance | compliance | 5 | No | 5 |
| /compliance-calendar | compliance | compliance | 5 | No | 5 |
| /deposit-status | compliance | compliance | 5 | No | 5 |
| /chase-arrears | money | portfolio | 5 | Yes (message-draft) | 5 |
| /explain-payout | money | payments | 5 | No | 5 |
| /cashflow-forecast | money | payments | 5 | No | 5 |
| /create-work-order | work | portfolio | 5 | Yes (job-draft) | 5 |
| /job-pipeline | work | portfolio | 5 | No | 5 |
| /review-planning | planning | planning | 5 | No | 5 |
| /draft-landlord-offer | planning | planning | 5 | Yes (document-draft) | 5 |
| /draft-listing | bookings | bookings | 5 | Yes (listing-draft) | 5 |
| /summarise-booking | bookings | bookings | 5 | No | 5 |
| /suggest-pricing | bookings | bookings | 5 | No | 5 |
| /draft-marketplace-listing | marketplace | marketplace | 5 | Yes (listing-draft) | 5 |
| /explain-dispute | marketplace | marketplace | 5 | No | 5 |
| /review-orders | marketplace | marketplace | 5 | No | 5 |
| /compare-quotes | supplier | supplier | 5 | No | 5 |
| /draft-supplier-message | supplier | supplier | 5 | Yes (message-draft) | 5 |
| /explain-verification | supplier | supplier | 5 | No | 5 |
| /supplier-quotes | supplier | supplier | 5 | No | 5 |
| /suggest-automation | ai-core | automations | 5 | No | 5 |
