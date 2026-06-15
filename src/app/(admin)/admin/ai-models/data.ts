import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Read layer for the admin AI model-controls page. Service-role reads (gated by
 * the (admin) layout). Schema-gap safe: a missing relation yields an empty,
 * honest "not provisioned" state rather than throwing.
 */

const MISSING = new Set(["42P01", "42703", "PGRST205", "PGRST204"])
function isGap(code?: string) {
  return !!code && MISSING.has(code)
}

export interface ProviderRow {
  id: string
  slug: string
  name: string
  baseUrl: string | null
  apiKeyEnv: string | null
  enabled: boolean
  keyPresent: boolean
  sortOrder: number
}

export interface ModelRow {
  id: string
  providerId: string
  providerSlug: string
  providerName: string
  modelId: string
  label: string
  inputCostPencePer1k: number
  outputCostPencePer1k: number
  enabled: boolean
  isDefault: boolean
  sortOrder: number
}

export interface UsageByWorkspaceRow {
  workspaceId: string
  workspaceName: string
  requests: number
  tokensIn: number
  tokensOut: number
  costPence: number
}

export interface AiGatewayAdminData {
  available: boolean
  providers: ProviderRow[]
  models: ModelRow[]
  usage: UsageByWorkspaceRow[]
  totals: { requests: number; tokensIn: number; tokensOut: number; costPence: number }
  windowDays: number
}

export async function getAiGatewayAdminData(windowDays = 30): Promise<AiGatewayAdminData> {
  const admin = createAdminClient()
  const empty: AiGatewayAdminData = {
    available: false,
    providers: [],
    models: [],
    usage: [],
    totals: { requests: 0, tokensIn: 0, tokensOut: 0, costPence: 0 },
    windowDays,
  }

  // Providers
  let providers: ProviderRow[] = []
  try {
    const { data, error } = await admin
      .from("ai_providers")
      .select("id, slug, name, base_url, api_key_env, enabled, sort_order")
      .order("sort_order", { ascending: true })
    if (error) {
      if (isGap(error.code)) return empty
    } else {
      providers = (data ?? []).map((r) => ({
        id: r.id as string,
        slug: r.slug as string,
        name: r.name as string,
        baseUrl: (r.base_url as string | null) ?? null,
        apiKeyEnv: (r.api_key_env as string | null) ?? null,
        enabled: !!r.enabled,
        // Surface whether the env key is actually configured (boolean only — the
        // value is never read into the response).
        keyPresent: !!(r.api_key_env && process.env[r.api_key_env as string]),
        sortOrder: Number(r.sort_order ?? 0),
      }))
    }
  } catch {
    return empty
  }

  // Models
  let models: ModelRow[] = []
  try {
    const { data } = await admin
      .from("ai_models")
      .select(
        "id, provider_id, model_id, label, input_cost_pence_per_1k, output_cost_pence_per_1k, enabled, is_default, sort_order, ai_providers:provider_id(slug, name)"
      )
      .order("sort_order", { ascending: true })
    type Joined = {
      id: string; provider_id: string; model_id: string; label: string
      input_cost_pence_per_1k: number | string; output_cost_pence_per_1k: number | string
      enabled: boolean; is_default: boolean; sort_order: number
      ai_providers: { slug: string; name: string } | null
    }
    models = ((data as unknown as Joined[]) ?? []).map((r) => ({
      id: r.id,
      providerId: r.provider_id,
      providerSlug: r.ai_providers?.slug ?? "",
      providerName: r.ai_providers?.name ?? "",
      modelId: r.model_id,
      label: r.label,
      inputCostPencePer1k: Number(r.input_cost_pence_per_1k) || 0,
      outputCostPencePer1k: Number(r.output_cost_pence_per_1k) || 0,
      enabled: !!r.enabled,
      isDefault: !!r.is_default,
      sortOrder: Number(r.sort_order ?? 0),
    }))
  } catch {
    /* models stay empty */
  }

  // Usage by workspace over the window (aggregate ai_usage_events).
  const usageMap: Record<string, UsageByWorkspaceRow> = {}
  try {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await admin
      .from("ai_usage_events")
      .select("workspace_id, tokens_in, tokens_out, cost_pence")
      .gte("created_at", since)
      .limit(100_000)
    for (const r of data ?? []) {
      const wid = r.workspace_id as string
      if (!usageMap[wid]) {
        usageMap[wid] = { workspaceId: wid, workspaceName: wid.slice(0, 8), requests: 0, tokensIn: 0, tokensOut: 0, costPence: 0 }
      }
      usageMap[wid].requests += 1
      usageMap[wid].tokensIn += Number(r.tokens_in ?? 0)
      usageMap[wid].tokensOut += Number(r.tokens_out ?? 0)
      usageMap[wid].costPence += Number(r.cost_pence ?? 0)
    }
    // Resolve workspace names.
    const ids = Object.keys(usageMap)
    if (ids.length) {
      const { data: ws } = await admin.from("workspaces").select("id, name").in("id", ids)
      for (const w of ws ?? []) {
        const row = usageMap[w.id as string]
        if (row) row.workspaceName = (w.name as string) ?? row.workspaceName
      }
    }
  } catch {
    /* usage stays empty */
  }

  const usage = Object.values(usageMap).sort((a, b) => b.costPence - a.costPence)
  const totals = usage.reduce(
    (acc, r) => ({
      requests: acc.requests + r.requests,
      tokensIn: acc.tokensIn + r.tokensIn,
      tokensOut: acc.tokensOut + r.tokensOut,
      costPence: acc.costPence + r.costPence,
    }),
    { requests: 0, tokensIn: 0, tokensOut: 0, costPence: 0 }
  )

  return { available: true, providers, models, usage, totals, windowDays }
}
