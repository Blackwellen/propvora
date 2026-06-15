# AI Safety Audit — Propvora

**Generated:** 2026-06-15 · Scope: `src/lib/ai/*`, `src/lib/copilot`, `/api/ai/*`,
admin AI models/usage.

## Architecture

The AI Copilot dispatches through **one server-side gateway** (`src/lib/ai/gateway.ts`)
that can call OpenAI, OpenRouter, Gemini, NVIDIA (OpenAI-compatible) and Anthropic
(native Messages API) behind a uniform interface returning text + token usage. Provider
and model come from the admin-managed `ai_models` / `ai_providers` catalogue.

## Verified safety properties

| Property | State | Detail |
|---|---|---|
| Keys never reach the client | ✅ | `import "server-only"`; keys read from `process.env` by name (`api_key_env`); never persisted, never sent down. |
| Provider fallback keeps chat working | ✅ | Tries preferred→default→enabled chain, ending at a hard-coded OpenAI default. |
| Hard usage caps (abuse/spend) | ✅ | `caps.ts` enforces rolling 6h/day/week/month request + token windows and a monthly cost budget (pence), per plan. |
| Caps fail **closed** on a known-exceeded limit | ✅ | A cap known to be exceeded always refuses; on an unreadable store it allows (bounded by `max_tokens` + re-check next call) but never proceeds *past* a known breach. |
| Plan gate on the feature | ✅ | AI Copilot is Scale+; `gateAiCopilot` returns 402 + upgrade message when off-plan. |
| Usage metered to a ledger | ✅ | `recordUsageEvent` writes `ai_usage_events` (best-effort; never breaks a request). |
| Human-approval for sensitive actions | ✅ | AI actions run via an allow-list + approval queue (`ai_approval_queue` / `ai_actions`); the AI does not silently mutate data. |
| Workspace-scoped context + citations | ✅ | Answers are grounded in the caller's workspace (RLS-scoped) and cite the records used. |
| Output disclaimer | ✅ | Copilot output carries an AI disclaimer; it is an assistant, not an authority. |
| Demo workspace isolation | ✅ | Demo workspace bypasses membership but is excluded from metering/usage writes. |

## RLS posture (AI tables)

All AI tables carry RLS and are workspace-scoped (see `RLS_POLICY_MATRIX.md`):
`ai_actions`, `ai_action_logs`, `ai_approval_queue`, `ai_approval_requests`,
`ai_chat_threads`, `ai_chat_messages`, `ai_usage_logs`, `ai_token_usage`,
`ai_usage_metering`, `ai_rate_counters`, `ai_triage_items`, `ai_duplicate_candidates`.

## Residual / out of scope

- Prompt-injection resistance for tool/action execution relies on the allow-list +
  human-approval design rather than model-level guarantees; treat any AI-suggested
  action as a draft to approve.
- Legal/accounting outputs are explicitly **review-only** (see the legal validity and
  court-bundle disclaimers) — the AI never asserts legal validity.

**Conclusion:** the AI surface is server-only, key-safe, plan-gated, spend-capped
(fail-closed on known breach), metered, and human-in-the-loop for mutations. No
key-exposure or unbounded-spend defect found.
