import "server-only"

/**
 * P5+ — FX RATES (read + convert). Rates stored as rate_micros (1e6) in
 * `fx_rates`; the DB helper `fx_convert_pence` does the conversion server-side.
 * Money is integer pence.
 */

export interface FxSupabase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc?: (fn: string, params: Record<string, unknown>) => any
}

export interface FxRate {
  id: string
  base_currency: string
  quote_currency: string
  rate_micros: number
  as_of: string
  source: string
  workspace_id: string | null
}

const NOT_PROVISIONED = new Set(["42P01", "PGRST205", "PGRST204", "42703"])
function isNotProvisioned(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return Boolean(code && NOT_PROVISIONED.has(code))
}

/** List the latest rate per pair (global + workspace overrides). */
export async function listFxRates(
  supabase: FxSupabase,
  workspaceId?: string | null
): Promise<{ rates: FxRate[]; provisioned: boolean }> {
  try {
    let q = supabase.from("fx_rates").select("*").order("as_of", { ascending: false })
    if (workspaceId) q = q.or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
    else q = q.is("workspace_id", null)
    const { data, error } = await q
    if (error) {
      if (isNotProvisioned(error)) return { rates: [], provisioned: false }
      throw error
    }
    // De-dupe to latest per pair (workspace override wins).
    const byPair = new Map<string, FxRate>()
    for (const r of (data as FxRate[]) ?? []) {
      const key = `${r.base_currency}/${r.quote_currency}`
      const existing = byPair.get(key)
      if (!existing) byPair.set(key, r)
      else if (r.workspace_id && !existing.workspace_id) byPair.set(key, r)
    }
    return { rates: Array.from(byPair.values()), provisioned: true }
  } catch (err) {
    if (isNotProvisioned(err)) return { rates: [], provisioned: false }
    throw err
  }
}

/** PURE: convert pence using a rate_micros value. */
export function convertPence(amountPence: number, rateMicros: number): number {
  return Math.trunc((Math.trunc(amountPence) * Math.trunc(rateMicros)) / 1_000_000)
}

/** Server-side convert via the DB helper (uses latest rate ≤ today). */
export async function convertViaDb(
  supabase: FxSupabase,
  amountPence: number,
  from: string,
  to: string
): Promise<number | null> {
  if (!supabase.rpc) return null
  try {
    const { data, error } = await supabase.rpc("fx_convert_pence", {
      p_amount_pence: Math.trunc(amountPence),
      p_from: from,
      p_to: to,
    })
    if (error) return null
    const n = Number(data)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}
