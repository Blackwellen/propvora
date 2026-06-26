/**
 * Acquisition / transaction tax engine (dimension 7).
 *
 * Computes purchase-transaction tax per jurisdiction: SDLT (England/NI), LBTT +
 * ADS (Scotland), LTT (Wales), Stamp Duty (Ireland), ITP (Spain),
 * Grunderwerbsteuer (Germany), droits de mutation (France). Rates change at
 * fiscal events → stored as dated/configurable band tables; the operator can
 * override via the override chain. Figures are SOURCED and informational, NOT
 * tax advice (see ALL-45-country-matrix.md + tax-frameworks/property-tax-sourced.md).
 *
 * Federal jurisdictions vary by region — UK splits into England/NI, Scotland
 * and Wales here; ES/DE rates vary by region and are indicative defaults.
 */

import type { SourcedDefault } from "@/lib/jurisdiction/resolve"

/** A progressive band: everything up to `upTo` (exclusive of the prior band) at `rate`. */
interface Band {
  upTo: number // upper bound of the band; use Infinity for the top band
  rate: number // fraction (0.05 = 5%)
}

export interface AcquisitionTaxResult {
  jurisdiction: string
  taxName: string
  /** Total tax in the purchase currency (major units). */
  total: number
  /** Effective rate against the price. */
  effectiveRate: number
  /** Progressive band breakdown lines. */
  breakdown: { band: string; amount: number }[]
  /** Surcharge lines (additional-dwelling, non-resident). */
  surcharges: { label: string; amount: number }[]
  citation: string
}

export interface AcquisitionTaxInput {
  countryCode: string
  region?: string | null
  price: number
  /** Additional dwelling / second home (UK surcharges, Scotland ADS, Wales higher rates). */
  isAdditional?: boolean
  /** Non-resident purchaser (UK +2% SDLT surcharge). */
  isNonResident?: boolean
}

function progressive(price: number, bands: Band[], extraRate = 0) {
  let tax = 0
  let lower = 0
  const lines: { band: string; amount: number }[] = []
  for (const b of bands) {
    if (price <= lower) break
    const upper = Math.min(price, b.upTo)
    const slice = upper - lower
    if (slice > 0) {
      const r = b.rate + extraRate
      const amount = slice * r
      tax += amount
      const upperLabel = b.upTo === Infinity ? "+" : `–${Math.round(b.upTo / 1000)}k`
      lines.push({ band: `${Math.round(lower / 1000)}k${upperLabel} @ ${(r * 100).toFixed(1)}%`, amount })
    }
    lower = b.upTo
  }
  return { tax, lines }
}

// England & Northern Ireland — SDLT residential (2025/26 standard).
const SDLT_BANDS: Band[] = [
  { upTo: 125_000, rate: 0 },
  { upTo: 250_000, rate: 0.02 },
  { upTo: 925_000, rate: 0.05 },
  { upTo: 1_500_000, rate: 0.1 },
  { upTo: Infinity, rate: 0.12 },
]

// Scotland — LBTT residential.
const LBTT_BANDS: Band[] = [
  { upTo: 145_000, rate: 0 },
  { upTo: 250_000, rate: 0.02 },
  { upTo: 325_000, rate: 0.05 },
  { upTo: 750_000, rate: 0.1 },
  { upTo: Infinity, rate: 0.12 },
]

// Wales — LTT main residential rates.
const LTT_MAIN_BANDS: Band[] = [
  { upTo: 225_000, rate: 0 },
  { upTo: 400_000, rate: 0.06 },
  { upTo: 750_000, rate: 0.075 },
  { upTo: 1_500_000, rate: 0.1 },
  { upTo: Infinity, rate: 0.12 },
]
// Wales — LTT higher residential rates (additional dwellings).
const LTT_HIGHER_BANDS: Band[] = [
  { upTo: 180_000, rate: 0.05 },
  { upTo: 250_000, rate: 0.085 },
  { upTo: 400_000, rate: 0.1 },
  { upTo: 750_000, rate: 0.125 },
  { upTo: 1_500_000, rate: 0.15 },
  { upTo: Infinity, rate: 0.17 },
]

function result(
  jurisdiction: string,
  taxName: string,
  price: number,
  base: { tax: number; lines: { band: string; amount: number }[] },
  surcharges: { label: string; amount: number }[],
  citation: string,
): AcquisitionTaxResult {
  const total = base.tax + surcharges.reduce((s, x) => s + x.amount, 0)
  return {
    jurisdiction,
    taxName,
    total,
    effectiveRate: price > 0 ? total / price : 0,
    breakdown: base.lines,
    surcharges,
    citation,
  }
}

/** Compute acquisition tax for a purchase. */
export function acquisitionTax(input: AcquisitionTaxInput): AcquisitionTaxResult {
  const cc = (input.countryCode || "GB").toUpperCase()
  const region = (input.region || "").toUpperCase()
  const { price, isAdditional, isNonResident } = input

  if (cc === "GB" || cc === "UK") {
    if (region === "SCT") {
      const base = progressive(price, LBTT_BANDS)
      const surcharges: { label: string; amount: number }[] = []
      if (isAdditional) surcharges.push({ label: "ADS (additional dwelling 8%)", amount: price * 0.08 })
      return result("GB-SCT", "LBTT", price, base, surcharges, "Revenue Scotland — LBTT + ADS 8%")
    }
    if (region === "WLS" || region === "WALES") {
      const base = progressive(price, isAdditional ? LTT_HIGHER_BANDS : LTT_MAIN_BANDS)
      return result("GB-WLS", "LTT", price, base, [], "Welsh Revenue Authority — LTT (main / higher residential rates)")
    }
    // England & Northern Ireland — SDLT with per-band surcharges.
    const extra = (isAdditional ? 0.05 : 0) + (isNonResident ? 0.02 : 0)
    const base = progressive(price, SDLT_BANDS, extra)
    const surcharges: { label: string; amount: number }[] = []
    // Surcharge contribution is folded into the per-band `extra`; surface it as a note line.
    if (isAdditional) surcharges.push({ label: "Additional dwelling +5% (in bands)", amount: 0 })
    if (isNonResident) surcharges.push({ label: "Non-resident +2% (in bands)", amount: 0 })
    return result("GB-EW", "SDLT", price, base, surcharges, "GOV.UK — Stamp Duty Land Tax (incl. +5% additional, +2% non-resident)")
  }

  // Flat-rate jurisdictions (indicative; rates vary by region/fiscal year).
  const FLAT: Record<string, { name: string; rate: number; citation: string }> = {
    IE: { name: "Stamp Duty", rate: price > 1_000_000 ? 0.02 : 0.01, citation: "revenue.ie — 1% ≤ €1m, 2% above" },
    ES: { name: "ITP", rate: 0.08, citation: "ITP regional 6–13% (8% indicative — set your region's rate)" },
    DE: { name: "Grunderwerbsteuer", rate: 0.05, citation: "Grunderwerbsteuer 3.5–6.5% by Land (5% indicative)" },
    FR: { name: "Droits de mutation", rate: 0.058, citation: "service-public.fr — droits de mutation ~5.8%" },
    IT: { name: "Imposta di Registro", rate: 0.09, citation: "Registration 2% prima casa / 9% other (9% indicative)" },
    PT: { name: "IMT", rate: 0.06, citation: "IMT 0–8% progressive (6% indicative)" },
    NL: { name: "Overdrachtsbelasting", rate: 0.104, citation: "NL transfer tax 10.4% investor" },
    AU: { name: "Stamp Duty", rate: 0.045, citation: "State stamp duty + foreign surcharge 8–9% (set state rate)" },
    AE: { name: "DLD Transfer Fee", rate: 0.04, citation: "Dubai Land Department 4% transfer fee" },
  }
  const flat = FLAT[cc]
  if (flat) {
    const tax = price * flat.rate
    return result(
      cc,
      flat.name,
      price,
      { tax, lines: [{ band: `${(flat.rate * 100).toFixed(1)}% flat`, amount: tax }] },
      [],
      flat.citation,
    )
  }

  // Unknown jurisdiction — no sourced rate; operator sets their own.
  return {
    jurisdiction: cc,
    taxName: "Acquisition tax",
    total: 0,
    effectiveRate: 0,
    breakdown: [],
    surcharges: [],
    citation: "No reviewed acquisition-tax rate for this jurisdiction — set and verify your own figure.",
  }
}

/** SourcedDefault for the total, for use with resolveValue / <SourcedValue>. */
export function acquisitionTaxSourced(input: AcquisitionTaxInput): SourcedDefault<number> {
  const r = acquisitionTax(input)
  return { value: r.total, citation: `${r.taxName} — ${r.citation}` }
}
