/**
 * Right-to-rent / immigration & tenant checks (dimension 13).
 *
 * England operates Right to Rent (immigration status checks) — England ONLY,
 * not Scotland, Wales or Northern Ireland. Elsewhere, anti-discrimination limits
 * apply. SOURCED / indicative — NOT legal advice.
 */

export interface TenantCheck {
  id: string
  name: string
  required: boolean
  note: string
}

export interface TenantChecksResult {
  jurisdiction: string
  checks: TenantCheck[]
  citation: string
}

export function requiredTenantChecks(countryCode: string | null | undefined, region?: string | null): TenantChecksResult {
  const cc = (countryCode || "GB").toUpperCase()
  const rg = (region || "").toUpperCase()

  // Right to Rent applies in ENGLAND only.
  if ((cc === "GB" || cc === "UK") && (rg === "" || rg === "EW" || rg === "ENG" || rg === "ENGLAND")) {
    return {
      jurisdiction: "GB-England",
      checks: [
        { id: "right_to_rent", name: "Right to Rent check", required: true, note: "Verify each adult occupier's immigration status before the tenancy (England only)." },
      ],
      citation: "GOV.UK — Right to Rent (Immigration Act 2014, England only)",
    }
  }

  return {
    jurisdiction: cc + (rg ? `-${rg}` : ""),
    checks: [
      { id: "anti_discrimination", name: "No immigration check", required: false, note: "Right to Rent does not apply here; immigration-status checks may be unlawful discrimination." },
    ],
    citation: rg ? "Right to Rent applies in England only" : "Verify local tenant-check rules",
  }
}
