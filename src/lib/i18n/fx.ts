"use client"

/**
 * FX conversion for reporting-currency roll-ups.
 *
 * A mixed portfolio holds rent/value in several currencies (a UK workspace with
 * ES and AE properties). Roll-ups convert each amount into the workspace's
 * reporting currency while always showing the property's local amount alongside
 * (see <MoneyAmount>/<FxRollup>).
 *
 * Rates come from the `fx_rates` table (stored as integer micros, optionally
 * workspace-scoped). The pure `fxConvert`/`rollup` helpers are dependency-free
 * and unit-tested; `useFxRates` loads the rate map at runtime.
 */

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

/** Rate map keyed "BASE>QUOTE" → rate in major units (e.g. "GBP>EUR" → 1.18). */
export type FxRateMap = Record<string, number>

export function fxKey(base: string, quote: string): string {
  return `${base.toUpperCase()}>${quote.toUpperCase()}`
}

/**
 * Convert a major-unit amount between currencies using a rate map.
 * Resolution: identity → direct rate → inverse rate → pivot via GBP.
 * Returns null when no path exists (caller flags a missing rate).
 */
export function fxConvert(amount: number, from: string, to: string, rates: FxRateMap): number | null {
  const f = (from || "GBP").toUpperCase()
  const t = (to || "GBP").toUpperCase()
  if (f === t) return amount

  const direct = rates[fxKey(f, t)]
  if (direct != null) return amount * direct

  const inverse = rates[fxKey(t, f)]
  if (inverse != null && inverse !== 0) return amount / inverse

  // Pivot through GBP (the seed base) when no direct/inverse pair exists.
  const fToGbp = f === "GBP" ? 1 : rates[fxKey(f, "GBP")]
  const gbpToT = t === "GBP" ? 1 : rates[fxKey("GBP", t)]
  if (fToGbp != null && gbpToT != null) return amount * fToGbp * gbpToT

  return null
}

export interface RollupResult {
  /** Total in the reporting currency (major units); excludes amounts with no rate. */
  total: number
  reportingCurrency: string
  /** Per-currency subtotals in their own currency, for the "local alongside" display. */
  byCurrency: { currency: string; amount: number }[]
  /** True when at least one item had no convertible rate (UI shows a "rate missing" hint). */
  hasMissingRate: boolean
}

/** Sum a set of {amount, currency} items into one reporting-currency total + per-currency breakdown. */
export function rollup(
  items: { amount: number; currency: string }[],
  reportingCurrency: string,
  rates: FxRateMap,
): RollupResult {
  const byCurrency = new Map<string, number>()
  let total = 0
  let hasMissingRate = false

  for (const it of items) {
    const ccy = (it.currency || "GBP").toUpperCase()
    byCurrency.set(ccy, (byCurrency.get(ccy) ?? 0) + it.amount)
    const converted = fxConvert(it.amount, ccy, reportingCurrency, rates)
    if (converted == null) hasMissingRate = true
    else total += converted
  }

  return {
    total,
    reportingCurrency: (reportingCurrency || "GBP").toUpperCase(),
    byCurrency: [...byCurrency.entries()].map(([currency, amount]) => ({ currency, amount })),
    hasMissingRate,
  }
}

/** Load the active FX rate map (latest as_of per pair wins). */
export function useFxRates() {
  const supabase = createClient()
  return useQuery<FxRateMap>({
    queryKey: ["fx-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fx_rates")
        .select("base_currency,quote_currency,rate_micros,as_of")
        .order("as_of", { ascending: false })
      if (error) {
        if (error.code === "42P01") return {}
        throw error
      }
      const map: FxRateMap = {}
      for (const r of (data ?? []) as { base_currency: string; quote_currency: string; rate_micros: number }[]) {
        const k = fxKey(r.base_currency, r.quote_currency)
        // Ordered newest-first, so the first time we see a pair is the latest rate.
        if (!(k in map)) map[k] = Number(r.rate_micros) / 1_000_000
      }
      return map
    },
    staleTime: 60 * 60 * 1000,
  })
}
