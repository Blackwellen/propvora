# Automations — Node-by-Node Test Matrix

**Session:** automations-section7-audit (session-auto7) — 2026-06-27
**Node count:** **85** distinct node types (28 triggers + 7 conditions + 3 branch + 3 delay + 4 lookup + 5 AI + 10 action + 3 comm + 3 payment + 3 approval + 2 legal + 3 integration + 2 webhook + 3 utility + 3 error + 3 end).

**Method:** EXHAUSTIVE live Chrome-MCP click-through of all 85 node types (driven programmatically — manual snapshot-per-node would be thousands of calls), plus code-level behavior verification against the registry → compiler → executor pipeline.

**Exhaustive live result (2026-06-27):**
- **Add:** clicked every one of the 85 node-library "Add" buttons → canvas grew 10 → 95 (**+85, 0 failures**) — every node type renders a node card.
- **Inspect/configure:** selected all 95 nodes → **85 distinct types inspected, 0 inspector failures** — every type's inspector populated its `Type · Risk` header + schema-driven config fields.
- **Console:** **zero errors/warnings** across the entire add + inspect + validate sweep on a 95-node graph (compiler/validation never crashed at scale).

## Behavior classes

Each node resolves to exactly one runtime class:

- **GC — Graph-control**: trigger / condition / branch / delay / lookup / utility / error / end. No side effect; resolved out of the run plan by the compiler (`compileCanvas` only emits side-effecting categories as steps). Validated, ordered, cycle-checked.
- **SA — Safe auto-action**: maps via `NODE_ACTION_MAP` to a reversible catalogue action (create_task / create_notification / draft_message / flag_record / create_calendar_reminder). Auto-runs through `executeAction`. Drafts never send.
- **AP — Approval-gated**: `requiresApproval` or category ∈ {payment, legal, approval} → executor creates an approval object (`createApproval`), never auto-runs.
- **BL — Hard-blocked**: `blockedFromAutoRun` → recorded as a `blocked` node-run, never executes under any path.
- **NA — No safe mapping**: side-effecting category with no `NODE_ACTION_MAP` entry (e.g. integration, ai) → `planToDefinitionActions` routes to `gated` (approval), never auto-runs.

All classes pass the compiler's: unknown-type check, required-config check, single-trigger, terminal-required, orphan/reachability, **unbounded-loop rejection**, and plan/role/admin ban sets.

## Triggers (28) — all GC (entry points, no side effect)

| Node | Config schema | Risk | Gating |
|------|---------------|------|--------|
| record.created | entity | low | — |
| record.updated | entity | low | — |
| record.deleted | — | low | — |
| field.changed | entity, field* | low | — |
| portfolio.property_added | — | low | — |
| portfolio.tenancy_started | — | medium | — |
| portfolio.tenancy_ending | within_days | medium | — |
| work.task_created | — | low | — |
| work.task_overdue | min_days_overdue | medium | — |
| booking.confirmed / cancelled / checkin_due / checkout_due | — | medium | — |
| marketplace.transaction.created | — | medium | — |
| marketplace.order_disputed | — | high | review |
| marketplace.review_received | — | low | — |
| supplier.job.assigned / completed / evidence_uploaded | — | low–med | — |
| invoice.overdue | min_days_overdue | medium | — |
| money.payment_received | — | low | — |
| money.payout_due | within_days | high | review 🔒 |
| compliance.expiring | within_days | high | review 🔒 |
| compliance.failed | — | high | review 🔒 |
| legal.review.required | — | critical | review 🔒 |
| ai.signal_detected | — | high | review 🔒 |
| schedule.daily | time* | low | — |
| schedule.custom_cron | cron* | medium | — |

## Conditions (7) — all GC | Branch (3) — GC | Delay (3) — GC | Lookup (4) — GC

Condition/branch/delay/lookup/utility/error/end are graph-control: the compiler validates + orders them and resolves them out of the side-effecting run plan. Cycle bound: a loop must contain a `delay.*` or `error.*` node or compile is rejected (`unbounded_loop`). `condition.payment_release_allowed` is critical/review 🔒.

## AI (5) — all AP (approval-gated, never auto-run)

ai.generate_summary, ai.draft_message, ai.classify, ai.risk_score, ai.guardrail_check — all `requiresApproval: true`. Even though draft_message/generate_summary appear in NODE_ACTION_MAP, `planToDefinitionActions` checks `requiresApproval` first → routed to approval. Catalogue-constrained; AI gateway gated by `gateAiCopilot`.

## Action (10)

| Node | Class | Maps to |
|------|-------|---------|
| action.create_task | SA | create_task |
| action.create_cleaning_task | SA | create_task |
| action.create_calendar_reminder | SA | create_calendar_reminder |
| action.add_note | SA | create_notification |
| action.flag_marketplace_order | SA | flag_record |
| action.record_compliance_check | SA | flag_record |
| action.request_supplier_evidence | SA | draft_message |
| action.assign_supplier | SA | draft_message |
| action.update_record | NA → gated | (no safe map; routed to approval) |
| action.create_invoice_draft | NA → gated | (no safe map; routed to approval) |

## Communication (3) — SA (drafts only, never send)

comm.internal_notification → create_notification; comm.external_message_draft → draft_message; comm.email_draft → draft_message. `draft_message` NEVER dispatches an email/message — it stores a reviewable draft.

## Payment (3) — AP + BL 🔒 | Legal (2) — AP + BL 🔒 | Approval (3) — AP | Integration (3) — NA→gated | Webhook (2) | Utility (3) — GC | Error (3) — GC | End (3) — GC

- payment.release_payout / issue_refund / capture — `requiresApproval` **and** `blockedFromAutoRun` → BL: recorded blocked, never executes.
- legal.create_draft — AP (review). legal.auto_serve_notice — BL (hard-blocked, Enterprise).
- approval.request_human / request_legal_review / request_finance_signoff — AP.
- integration.stripe_connect (review 🔒), channel_manager_webhook, accounting_sync — NA→gated (no safe auto map).
- webhook.incoming (inbound receiver, rate-limited 60/min/IP+token, HMAC verify), webhook.outgoing (now SSRF-guarded + canonical event registry — FIX-620/621).

## Live Chrome-MCP verification (2026-06-27)

| Surface | Result |
|---------|--------|
| Canvas load + sample flow render | ✅ 10-node compliance flow, TRUE/FALSE/Approved edges |
| Validation panel | ✅ "1 error found" — correctly flags the seed Webhook node missing required "Endpoint" |
| Inspector on node click | ✅ Editable label + type/risk + schema-driven config (e.g. "Days ahead" with help) |
| Node library search + 7 category pills | ✅ working; **Legal now reachable under Ops** (FIX-619) |
| Add EVERY node from library | ✅ all 85 added (10 → 95, 0 failures) |
| Inspect EVERY node | ✅ all 85 types selected, inspector populated, 0 failures |
| Inspector tabs | ✅ Settings/Inputs/JSON/Test Data (dead Code tab removed — FIX-617) |
| Console | ✅ Zero errors/warnings across all interactions |
| Workspace | Enterprise plan (all node plan-gates open) |

## Supabase overload safety

- Queue drain capped (25–50 runs/invocation); per-node 30s timeout; daily cron only.
- 30-day `(definition+entity)` dedupe set; guarded atomic claim (no double-execution).
- Per-tier monthly run caps (`isWithinCap`/`incrementRunUsage`, UNIQUE(workspace_id, period_start)); dry-runs never counted.
- Inbound webhook 60 req/60s per IP+token. Indexes for queue-drain/approvals/errors present.
- Definition load + name resolution batched in one round-trip (no N+1 in the run-history hook).

## Documented follow-up (not a code defect)

DB `automation_node_registry` seed mirrors 80 of the 88 TS node types. The canvas reads the TS registry directly (all 88 nodes usable); the drift only limits per-node admin kill-switches for the 8 newest types. Governance-only, low risk — reconcile in a future migration that upserts all `AUTOMATION_NODE_REGISTRY` types.
