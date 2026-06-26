/**
 * Possession routes per jurisdiction (dimension 1, beyond England & Wales).
 *
 * England & Wales keeps its rich Section 8 / Section 21 wizard (src/lib/legal/
 * grounds.ts). This pack provides the equivalent notice routes + indicative
 * notice periods + key grounds for the other reviewed UK nations and Ireland,
 * so the possession wizard isn't E&W-only. Figures are SOURCED/indicative — NOT
 * legal advice; the operator verifies and can override the notice period.
 *
 * Sources: legal-frameworks/tier-a-notice-periods-sourced.md.
 */

export interface PossessionRoute {
  id: string
  name: string
  basis: string
  /** Indicative notice period in days (null = set your own). */
  noticeDays: number | null
  note?: string
  /** Key grounds (optional checklist). */
  grounds?: { id: string; name: string }[]
}

export interface PossessionRoutesPack {
  jurisdiction: string
  regionName: string
  authority: string
  citation: string
  routes: PossessionRoute[]
}

const SCOTLAND_GROUNDS: { id: string; name: string }[] = [
  { id: "rent_arrears", name: "Rent arrears (3+ consecutive months)" },
  { id: "landlord_sell", name: "Landlord intends to sell" },
  { id: "landlord_live", name: "Landlord/family member intends to live in the let property" },
  { id: "refurbishment", name: "Refurbishment" },
  { id: "asb", name: "Anti-social or criminal behaviour" },
  { id: "breach", name: "Breach of tenancy agreement" },
]

const SCOTLAND: PossessionRoutesPack = {
  jurisdiction: "GB-SCT",
  regionName: "Scotland",
  authority: "First-tier Tribunal (Housing and Property Chamber)",
  citation: "Private Housing (Tenancies) (Scotland) Act 2016 — Notice to Leave (28 or 84 days)",
  routes: [
    { id: "ntl_28", name: "Notice to Leave — tenant resident < 6 months", basis: "Private Residential Tenancy", noticeDays: 28, grounds: SCOTLAND_GROUNDS },
    { id: "ntl_84", name: "Notice to Leave — tenant resident ≥ 6 months", basis: "Private Residential Tenancy", noticeDays: 84, grounds: SCOTLAND_GROUNDS },
  ],
}

const NI: PossessionRoutesPack = {
  jurisdiction: "GB-NI",
  regionName: "Northern Ireland",
  authority: "County Court (eviction order)",
  citation: "Private Tenancies Act (NI) 2022 — Notice to Quit (4 / 8 / 12 weeks by tenure length)",
  routes: [
    { id: "ntq_4", name: "Notice to Quit — tenancy ≤ 12 months", basis: "Private tenancy", noticeDays: 28 },
    { id: "ntq_8", name: "Notice to Quit — tenancy 1–10 years", basis: "Private tenancy", noticeDays: 56 },
    { id: "ntq_12", name: "Notice to Quit — tenancy > 10 years", basis: "Private tenancy", noticeDays: 84 },
  ],
}

const IRELAND: PossessionRoutesPack = {
  jurisdiction: "IE",
  regionName: "Ireland",
  authority: "Residential Tenancies Board (RTB) / courts",
  citation: "Residential Tenancies Act 2004 (as amended) — Notice of Termination (90–224 days); arrears 28-day warning then 28-day notice",
  routes: [
    { id: "not_arrears", name: "Termination for rent arrears", basis: "RTB tenancy", noticeDays: 28, note: "Requires a 14/28-day rent-arrears warning notice first" },
    { id: "not_90", name: "Notice of Termination — tenancy < 6 months", basis: "RTB tenancy", noticeDays: 90 },
    { id: "not_152", name: "Notice of Termination — 6 months to 1 year", basis: "RTB tenancy", noticeDays: 152 },
    { id: "not_180", name: "Notice of Termination — 1 to 3 years", basis: "RTB tenancy", noticeDays: 180 },
    { id: "not_196", name: "Notice of Termination — 3 to 7 years", basis: "RTB tenancy", noticeDays: 196 },
    { id: "not_224", name: "Notice of Termination — 7+ years", basis: "RTB tenancy", noticeDays: 224 },
  ],
}

/**
 * Resolve the possession routes pack for a jurisdiction. Returns `null` for
 * England & Wales (use the dedicated Section 8 / Section 21 wizard) and a
 * generic single-route pack for jurisdictions without a reviewed set.
 */
export function possessionRoutes(countryCode: string | null | undefined, region?: string | null): PossessionRoutesPack | null {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()

  if (cc === "GB" || cc === "UK") {
    if (rg === "SCT") return SCOTLAND
    if (rg === "NI") return NI
    return null // England & Wales → use the Section 8 / Section 21 wizard
  }
  if (cc === "IE") return IRELAND

  return {
    jurisdiction: cc,
    regionName: cc,
    authority: "Local court / tribunal",
    citation: "No reviewed possession route for this jurisdiction — set the notice period and verify locally.",
    routes: [{ id: "notice", name: "Notice of possession", basis: "Local tenancy law", noticeDays: null, note: "Set the required notice period for this jurisdiction." }],
  }
}
