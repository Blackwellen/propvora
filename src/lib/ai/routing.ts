import "server-only"
import type { ResolvedModel } from "./gateway"

// ============================================================================
// AI model routing — cheapest-capable model per task, data-residency aware.
//
// The gateway (src/lib/ai/gateway.ts) resolves the catalogue of ENABLED + KEYED
// models into an ordered chain. This module re-orders that chain for a given
// TASK ROLE so the cheapest model that can do the job is tried first, while
// keeping the catalogue as the single source of truth (we never invent a model
// that isn't enabled/keyed — we only reprioritise what the gateway already
// found usable).
//
// GDPR / UK COMPLIANCE (hard rule): tenant data is UK personal data. We ONLY
// use providers that offer a UK/EU-acceptable Data Processing Agreement:
//   • OpenAI, Anthropic, Google Gemini — DPA + EU data-handling available.
//   • NVIDIA NIM — US/global infrastructure under standard contractual clauses.
//     This is how we run cheap Kimi-class models COMPLIANTLY: the model weights
//     are Chinese-origin but inference runs on NVIDIA's own infra, NOT in China.
// We do NOT use DeepSeek-direct or Moonshot-direct (data processed in China) —
// they are excluded from the catalogue and hard-blocked here as a backstop.
//
// Roles (cheapest → most capable, all on compliant providers):
//   • workhorse — chat turns, classification, slash-command parsing, form hints,
//                 summaries. High volume, must be near-free. Gemini Flash-Lite /
//                 NVIDIA-hosted Kimi / 4o-mini class.
//   • agentic   — planning, multi-step agent runs, document understanding,
//                 multi-context comparison. Strong tool-use/reasoning, kept
//                 cheap via NVIDIA-hosted Kimi, escalating to Sonnet.
//   • premium   — high-stakes, customer-facing legal/financial output where
//                 quality is worth the spend. Claude Sonnet class. Used rarely.
// ============================================================================

export type ModelRole = "workhorse" | "agentic" | "premium"

// ── SINGLE-PROVIDER STRATEGY (easy budget control) ──────────────────────────
// Production runs on ONE vendor family for a single, controllable API budget:
// OpenAI (GDPR DPA + EU residency, simplest hard spend caps, cheapest small
// tier). NVIDIA NIM (US-hosted Llama, compliant) is the TEST provider while
// OpenAI quota is being sorted (currently 429). We deliberately do NOT span
// Gemini/Anthropic/Kimi — no constant model-source switching.
//
// To flip fully to OpenAI once its quota is restored, just disable the NVIDIA
// models in the catalogue (or reorder PROD ahead of TEST below) — no code change
// needed elsewhere; the gateway only offers enabled+keyed models anyway.
const PROD = {
  // Azure OpenAI deployment names (EU region). 2-tier: nano = cheap high-volume
  // workhorse; mini = heavy agentic + premium (nano is too weak for multi-step
  // reasoning, tool selection and legal/financial nuance — GPT-5.4 mini leads on
  // the GDPval real-world legal/financial benchmark, which is what we care about).
  workhorse: "gpt-5.4-nano",
  agentic: "gpt-5.4-mini",
  premium: "gpt-5.4-mini",
}
// Same-provider fallback within Azure. The resource only has the GPT-5.4
// deployments (nano + mini) — the old 4o deployments don't exist (404) and are
// disabled in the catalogue — so mini is the workhorse fallback for nano, then
// the chain drops to TEST (NVIDIA NIM) below.
const PROD_FALLBACK = { workhorse: "gpt-5.4-mini", agentic: "gpt-5.4-mini", premium: "gpt-5.4-mini" }
const TEST = {
  workhorse: "meta/llama-3.1-8b-instruct", // NIM, cheap + fast
  agentic: "meta/llama-3.3-70b-instruct", //  NIM, strong (live default now)
  premium: "meta/llama-3.3-70b-instruct",
}

/**
 * Preferred wire model_ids per role: PROD (Azure OpenAI) first, then its 4o
 * deployment fallback, then TEST (NVIDIA NIM Llama). Models without an enabled
 * provider + present key are filtered out upstream, so with no Azure key set the
 * chain falls through to NIM today, and flips to Azure the instant its key
 * exists — self-healing, zero code change.
 */
export const ROLE_PRIORITY: Record<ModelRole, string[]> = {
  workhorse: [PROD.workhorse, PROD_FALLBACK.workhorse, TEST.workhorse],
  agentic: [PROD.agentic, PROD_FALLBACK.agentic, TEST.agentic],
  premium: [PROD.premium, PROD_FALLBACK.premium, TEST.premium],
}

/**
 * Provider slugs WITHOUT a UK/EU-acceptable data-processing agreement (data
 * processed in China). HARD-BLOCKED for all tenant data, not just reprioritised.
 * These are also excluded from the seeded catalogue; this set is a defence-in-
 * depth backstop in case one is ever added. NVIDIA NIM is NOT here — Kimi runs
 * compliantly on NVIDIA's US infrastructure under standard contractual clauses.
 */
export const NON_DPA_PROVIDERS = new Set<string>(["deepseek", "moonshot"])

export interface RouteOptions {
  /** Set when the prompt/context carries tenant PII (names, addresses, etc.). */
  containsPII?: boolean
  /**
   * When the workspace brings its own key (BYOK), only that provider's models
   * should be used. Other providers are filtered out entirely.
   */
  byokProvider?: string | null
}

const priorityIndex = (modelId: string, role: ModelRole): number => {
  const i = ROLE_PRIORITY[role].indexOf(modelId)
  // Unlisted models sort after every listed one but keep their relative order.
  return i === -1 ? ROLE_PRIORITY[role].length : i
}

/**
 * Re-order the gateway's resolved chain for a task role. Pure + deterministic.
 *
 * Order of operations:
 *   1. ALWAYS drop non-DPA (China-based) providers — UK GDPR hard rule.
 *   2. If BYOK is active, keep only that provider's models.
 *   3. Stable-sort the survivors by role priority (cheapest-capable first).
 *   4. If a filter emptied the chain, fall back to the original resolved chain
 *      so the user is never left with no model.
 */
export function orderChainForRole(
  chain: ResolvedModel[],
  role: ModelRole,
  opts: RouteOptions = {}
): ResolvedModel[] {
  if (chain.length === 0) return chain

  // GDPR/UK: China-direct providers are never permitted for tenant data.
  let pool = chain.filter((m) => !NON_DPA_PROVIDERS.has(m.provider))
  if (pool.length === 0) pool = chain // backstop: never leave the user with no model

  if (opts.byokProvider) {
    const only = pool.filter((m) => m.provider === opts.byokProvider)
    if (only.length > 0) pool = only
  }

  // Stable sort: decorate with original index so equal-priority models keep
  // their catalogue order (which already honours is_default + sort_order).
  return pool
    .map((m, i) => ({ m, i }))
    .sort((a, b) => {
      const pa = priorityIndex(a.m.modelId, role)
      const pb = priorityIndex(b.m.modelId, role)
      return pa !== pb ? pa - pb : a.i - b.i
    })
    .map((x) => x.m)
}

/**
 * Lightweight, conservative PII heuristic for routing decisions. We default to
 * TRUE (treat as sensitive) whenever a live workspace context is attached,
 * because operator context almost always contains tenant/contact PII. Pass an
 * explicit override when a call is known to be PII-free (e.g. a generic web
 * search or a market-rate lookup with no names/addresses).
 */
export function turnLikelyContainsPII(args: {
  hasWorkspaceContext: boolean
  text?: string
}): boolean {
  if (args.hasWorkspaceContext) return true
  const t = args.text ?? ""
  // Cheap signals: UK postcode, email, or @-handle in the free text.
  return (
    /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(t) ||
    /[\w.+-]+@[\w-]+\.[\w.-]+/.test(t)
  )
}
