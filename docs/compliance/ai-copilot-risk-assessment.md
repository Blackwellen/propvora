# AI Copilot — Risk Assessment (Art. 35 record)

Controller: Blackwellen Ltd (Propvora), Company No. 16482166, ICO ZC160806.
Contact: legal@propvora.com.

This is the focused DPIA/risk assessment for the Propvora **AI Copilot**, the one
processing activity flagged for assessment in `dpia-screening.md`. Lawful basis:
legitimate interest with controls (see `lawful-basis-register.md`, LIA-1).

## Feature description
- **Model:** OpenAI `gpt-4o-mini`, called server-side from `/api/ai/chat` and
  `/api/ai/actions`. No model keys reach the client.
- **Context:** a compact, factual **workspace snapshot** built by
  `src/lib/ai/workspace-context.ts` — head-only COUNT queries (properties, units,
  active tenancies, open tasks/jobs, contacts, documents) run under the **caller's
  RLS-scoped Supabase client**. No record bodies are bulk-loaded into the prompt.
- **Scope:** strictly the caller's active workspace. `demo-workspace` returns an
  empty snapshot.
- **Purpose:** assistive answers within the operator's own data — never final
  legal/financial advice and no autonomous risky actions.

## Data flow
User prompt → server route → `gateAiCopilot` (plan check) → `checkRate`
(per-workspace limit) → RLS-scoped snapshot → OpenAI API → response →
`recordUsage` (metering) → user. Personal data leaving the UK/EU: the prompt
text + workspace counts go to OpenAI (US) — see `international-transfer-assessment.md`.

## Risk register

| Risk | Description | Likelihood | Impact | Mitigation (status) |
|------|-------------|-----------|--------|---------------------|
| Workspace-boundary breach | AI exposes another workspace's data | Low | High | Snapshot queries run under caller's RLS client; `workspace_id` filter on every count; `demo-workspace` short-circuits. **Implemented.** Cross-workspace E2E proof **pending** (TODO item 17). |
| Prompt injection | Malicious content in stored records steers the model | Med | Med | Only **counts** are injected, not free-text record bodies, sharply limiting injection surface; no tool/agent executes destructive actions from model output (no autonomous risky actions). Adversarial injection test suite **pending** (TODO 158–164). |
| Data leakage to provider | Personal data sent to OpenAI (US) | Med | Med | Minimised payload (counts + user's own prompt); OpenAI DPA + SCCs; provider states no training on API data (**verify current terms**). Free-text the *user types* is their choice; disclaimer warns against pasting sensitive data. |
| Excessive cost / abuse | Runaway token spend or scraping | Med | Med | `checkRate` fixed-window per-workspace limit (default 20/min); `recordUsage` per-call + daily rollup metering (`ai_usage_metering`, `ai_token_usage`); plan gate restricts to Scale+. **Implemented (app-level).** Hard edge limits (Cloudflare/Upstash) **pending**. |
| Over-reliance / bad advice | User treats output as authoritative | Med | Med | "Not final advice" disclaimer in UI; assistive framing; no automated execution. **Implemented.** |
| Hallucinated figures | Model invents numbers | Med | Low–Med | Factual snapshot grounds answers in real counts; counts labelled "scoped to this workspace only". Residual risk accepted with disclaimer. |
| Plan-gate bypass | Lower tier reaches AI | Low | Low | `gateAiCopilot` server-side 402 on non-eligible plans; client cannot unlock. **Implemented.** |
| Provider outage / errors | OpenAI unavailable | Med | Low | Best-effort; metering/limit failures fail-open so chat isn't blocked by logging issues; UI surfaces errors. |

## Technical & organisational measures (implemented)
- `gateAiCopilot` — server-side plan gate (`src/lib/billing/gates.ts`).
- `workspace-context.ts` — RLS-scoped, head-only counts, 42P01/42703-safe.
- `metering.ts` — per-workspace rate limit + cost/token metering.
- Keys server-only; CSP restricts script/connect origins; no client model calls.

## Measures pending (tracked in MAX-RELEASE TODO)
- Adversarial **prompt-injection test suite** (items 158–164).
- **Cross-workspace leakage E2E** for AI surfaces (item 17).
- **Human-approval flow** for any future write-capable AI action.
- Hard rate limiting at the edge (Cloudflare/Upstash, item 52).
- Confirm current OpenAI **API data-usage/training terms** and file the DPA ref.

## Residual risk
With implemented controls, residual risk is **Low–Medium**, acceptable for beta.
The largest open items are the injection test suite and cross-workspace E2E proof;
both are gating before GA.

> **Legal review required.** Engineering-prepared. Confirm with a data protection
> adviser; treat as the Art. 35 record for the AI feature.
