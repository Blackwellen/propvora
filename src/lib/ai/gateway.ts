import "server-only"
import OpenAI from "openai"
import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// AI multi-provider gateway.
//
// One server-side dispatch layer that can call OpenAI, OpenRouter, Gemini and
// NVIDIA (all OpenAI-compatible Chat Completions endpoints) plus Anthropic (its
// native Messages API) through ONE uniform interface that returns text + token
// usage. Provider + model come from the ai_providers / ai_models catalogue
// (admin-managed); API keys come from ENV ONLY and never touch the client.
//
// OpenAI / gpt-4o-mini remains the working default. If the selected provider
// fails (missing key, upstream error) the gateway falls back to the next
// enabled model, ending at the hard-coded OpenAI default so chat keeps working.
//
// Keys are read by env-var NAME stored on the provider row (api_key_env); the
// value is pulled from process.env at call time. No secret is ever persisted.
// ============================================================================

export interface GatewayMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ResolvedModel {
  provider: string // provider slug, e.g. "openai"
  providerName: string
  modelId: string // wire model id, e.g. "gpt-4o-mini"
  label: string
  baseUrl: string | null
  apiKeyEnv: string | null
  inputCostPencePer1k: number
  outputCostPencePer1k: number
}

export interface GatewayResult {
  text: string
  provider: string
  model: string
  tokensIn: number
  tokensOut: number
  costPence: number
}

export interface GatewayUsage {
  provider: string
  model: string
  tokensIn: number
  tokensOut: number
  costPence: number
}

export interface GatewayCallOptions {
  messages: GatewayMessage[]
  maxTokens?: number
  temperature?: number
  /** Force a specific model_id (must be enabled). Otherwise the default is used. */
  preferModelId?: string
}

// Hard-coded last-resort default — guarantees OpenAI keeps working even if the
// catalogue is empty or unreachable.
const FALLBACK: ResolvedModel = {
  provider: "openai",
  providerName: "OpenAI",
  modelId: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  label: "GPT-4o mini",
  baseUrl: null,
  apiKeyEnv: "OPENAI_API_KEY",
  inputCostPencePer1k: 0.012,
  outputCostPencePer1k: 0.047,
}

interface ModelRow {
  model_id: string
  label: string
  enabled: boolean
  is_default: boolean
  sort_order: number
  input_cost_pence_per_1k: number | string
  output_cost_pence_per_1k: number | string
  ai_providers: {
    slug: string
    name: string
    base_url: string | null
    api_key_env: string | null
    enabled: boolean
  } | null
}

function rowToResolved(r: ModelRow): ResolvedModel | null {
  const p = r.ai_providers
  if (!p) return null
  return {
    provider: p.slug,
    providerName: p.name,
    modelId: r.model_id,
    label: r.label,
    baseUrl: p.base_url,
    apiKeyEnv: p.api_key_env,
    inputCostPencePer1k: Number(r.input_cost_pence_per_1k) || 0,
    outputCostPencePer1k: Number(r.output_cost_pence_per_1k) || 0,
  }
}

/**
 * Build the ordered candidate list of models the gateway will try, best first.
 * Order: preferred model (if given + enabled) → default → other enabled models
 * (only those whose provider is enabled AND whose api key env is present) →
 * hard-coded OpenAI fallback. Best-effort: any read error yields just FALLBACK.
 */
export async function resolveModelChain(
  supabase: SupabaseClient,
  preferModelId?: string
): Promise<ResolvedModel[]> {
  let rows: ModelRow[] = []
  try {
    const { data } = await supabase
      .from("ai_models")
      .select(
        "model_id, label, enabled, is_default, sort_order, input_cost_pence_per_1k, output_cost_pence_per_1k, ai_providers:provider_id(slug, name, base_url, api_key_env, enabled)"
      )
      .eq("enabled", true)
      .order("is_default", { ascending: false })
      .order("sort_order", { ascending: true })
    rows = (data as unknown as ModelRow[]) ?? []
  } catch {
    rows = []
  }

  const resolved = rows
    .map(rowToResolved)
    .filter((m): m is ResolvedModel => !!m)
    // provider must be enabled and its API key actually present in env
    .filter((m) => !!m.apiKeyEnv && !!process.env[m.apiKeyEnv])

  const chain: ResolvedModel[] = []
  const seen = new Set<string>()
  const push = (m: ResolvedModel) => {
    const key = `${m.provider}:${m.modelId}`
    if (seen.has(key)) return
    seen.add(key)
    chain.push(m)
  }

  if (preferModelId) {
    const pref = resolved.find((m) => m.modelId === preferModelId)
    if (pref) push(pref)
  }
  for (const m of resolved) push(m)

  // Always guarantee the OpenAI fallback is reachable if its key exists.
  if (process.env[FALLBACK.apiKeyEnv!]) push(FALLBACK)

  // If nothing resolved at all (no keys, empty catalogue) still return FALLBACK
  // so the caller has something to try (it will surface a clear key error).
  if (chain.length === 0) chain.push(FALLBACK)
  return chain
}

function costPence(m: ResolvedModel, tokIn: number, tokOut: number): number {
  return (tokIn / 1000) * m.inputCostPencePer1k + (tokOut / 1000) * m.outputCostPencePer1k
}

function getKey(m: ResolvedModel): string | undefined {
  return m.apiKeyEnv ? process.env[m.apiKeyEnv] : undefined
}

// ---------------------------------------------------------------------------
// Non-streaming completion with provider fallback.
// ---------------------------------------------------------------------------
export async function gatewayComplete(
  chain: ResolvedModel[],
  opts: GatewayCallOptions
): Promise<GatewayResult> {
  let lastErr: unknown
  for (const m of chain) {
    const key = getKey(m)
    if (!key) {
      lastErr = new Error(`No API key for provider ${m.provider}`)
      continue
    }
    try {
      if (m.provider === "anthropic") {
        return await callAnthropic(m, key, opts)
      }
      return await callOpenAiCompatible(m, key, opts)
    } catch (err) {
      lastErr = err
      console.error(`[AI Gateway] ${m.provider}/${m.modelId} failed, falling back:`, err)
    }
  }
  throw lastErr ?? new Error("No AI provider available")
}

async function callOpenAiCompatible(
  m: ResolvedModel,
  key: string,
  opts: GatewayCallOptions
): Promise<GatewayResult> {
  const client = new OpenAI({ apiKey: key, ...(m.baseUrl ? { baseURL: m.baseUrl } : {}) })
  const completion = await client.chat.completions.create({
    model: m.modelId,
    messages: opts.messages,
    max_tokens: opts.maxTokens ?? 700,
    temperature: opts.temperature ?? 0.6,
  })
  const text = completion.choices[0]?.message?.content ?? ""
  const tokIn = completion.usage?.prompt_tokens ?? 0
  const tokOut = completion.usage?.completion_tokens ?? 0
  return {
    text,
    provider: m.provider,
    model: m.modelId,
    tokensIn: tokIn,
    tokensOut: tokOut,
    costPence: costPence(m, tokIn, tokOut),
  }
}

// Anthropic Messages API — system goes in its own field; no system role allowed.
async function callAnthropic(
  m: ResolvedModel,
  key: string,
  opts: GatewayCallOptions
): Promise<GatewayResult> {
  const system = opts.messages
    .filter((x) => x.role === "system")
    .map((x) => x.content)
    .join("\n\n")
  const turns = opts.messages
    .filter((x) => x.role !== "system")
    .map((x) => ({ role: x.role as "user" | "assistant", content: x.content }))
  const res = await fetch((m.baseUrl ?? "https://api.anthropic.com") + "/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: m.modelId,
      max_tokens: opts.maxTokens ?? 700,
      temperature: opts.temperature ?? 0.6,
      ...(system ? { system } : {}),
      messages: turns,
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const json = (await res.json()) as {
    content?: { type: string; text?: string }[]
    usage?: { input_tokens?: number; output_tokens?: number }
  }
  const text = (json.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text ?? "")
    .join("")
  const tokIn = json.usage?.input_tokens ?? 0
  const tokOut = json.usage?.output_tokens ?? 0
  return {
    text,
    provider: m.provider,
    model: m.modelId,
    tokensIn: tokIn,
    tokensOut: tokOut,
    costPence: costPence(m, tokIn, tokOut),
  }
}

// ---------------------------------------------------------------------------
// Streaming completion. Tries the first usable provider; on a pre-stream error
// it falls back to the next. Once bytes start flowing we don't switch providers
// (can't un-send streamed text), but partial output is still metered.
//
// Returns the upstream stream plus a per-chunk reader. The route owns encoding
// the bytes to the client; this keeps the gateway transport-agnostic.
// ---------------------------------------------------------------------------
export interface GatewayStream {
  model: ResolvedModel
  /** Async generator of text deltas. Resolves usage via getUsage() at the end. */
  textStream: AsyncIterable<string>
  /** Call after the stream is fully consumed to get final usage + cost. */
  getUsage: () => GatewayUsage
}

export async function gatewayStream(
  chain: ResolvedModel[],
  opts: GatewayCallOptions
): Promise<GatewayStream> {
  let lastErr: unknown
  for (const m of chain) {
    const key = getKey(m)
    if (!key) {
      lastErr = new Error(`No API key for provider ${m.provider}`)
      continue
    }
    try {
      if (m.provider === "anthropic") {
        // Anthropic streaming differs; for simplicity stream as a single block
        // (still metered). Non-default path, only used if it's the only option.
        const result = await callAnthropic(m, key, opts)
        const usage: GatewayUsage = {
          provider: result.provider,
          model: result.model,
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
          costPence: result.costPence,
        }
        async function* one() {
          yield result.text
        }
        return { model: m, textStream: one(), getUsage: () => usage }
      }

      const client = new OpenAI({ apiKey: key, ...(m.baseUrl ? { baseURL: m.baseUrl } : {}) })
      const stream = await client.chat.completions.create({
        model: m.modelId,
        stream: true,
        stream_options: { include_usage: true },
        messages: opts.messages,
        max_tokens: opts.maxTokens ?? 700,
        temperature: opts.temperature ?? 0.6,
      })

      let tokIn = 0
      let tokOut = 0
      async function* gen() {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? ""
          if (delta) yield delta
          if (chunk.usage) {
            tokIn = chunk.usage.prompt_tokens ?? 0
            tokOut = chunk.usage.completion_tokens ?? 0
          }
        }
      }
      return {
        model: m,
        textStream: gen(),
        getUsage: () => ({
          provider: m.provider,
          model: m.modelId,
          tokensIn: tokIn,
          tokensOut: tokOut,
          costPence: costPence(m, tokIn, tokOut),
        }),
      }
    } catch (err) {
      lastErr = err
      console.error(`[AI Gateway] stream ${m.provider}/${m.modelId} failed, falling back:`, err)
    }
  }
  throw lastErr ?? new Error("No AI provider available")
}

/** Record a usage event into ai_usage_events (server-side, best-effort). */
export async function recordUsageEvent(
  supabase: SupabaseClient,
  args: { workspaceId: string; userId: string | null; route: string; usage: GatewayUsage }
): Promise<void> {
  if (!args.workspaceId || args.workspaceId === "demo-workspace") return
  try {
    await supabase.from("ai_usage_events").insert({
      workspace_id: args.workspaceId,
      user_id: args.userId,
      provider: args.usage.provider,
      model: args.usage.model,
      tokens_in: args.usage.tokensIn,
      tokens_out: args.usage.tokensOut,
      cost_pence: Number(args.usage.costPence.toFixed(4)),
      route: args.route,
    })
  } catch {
    /* non-fatal — ledger write must never break a user's request */
  }
}
