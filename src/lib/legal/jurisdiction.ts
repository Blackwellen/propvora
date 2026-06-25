// ============================================================
// Per-jurisdiction LEGAL module applicability + disclaimers.
//
// The Legal section's four statutory tools are, by design, England & Wales
// constructs:
//   - Possession   → Section 8 / Housing Act 1988 grounds (E&W)
//   - HMO Licences → Housing Act 2004 mandatory/additional/selective (E&W)
//   - EPC Advisory → Energy Performance Certificate (UK; EU has equivalents)
//   - RRA 2026     → Renters' Rights Act 2026 (England & Wales statute ONLY)
//
// Rendering this E&W tooling unchanged for a French, Australian or US workspace
// is incorrect and unsafe — the statutory names, grounds and notice periods do
// not exist there. This module is the single source of truth for "does this
// legal module apply in this jurisdiction, what is it called locally, and what
// disclaimer must we show".
//
// It mirrors src/lib/compliance/requirements.ts (the already-shipped compliance
// jurisdiction catalogue) so the two sections behave consistently.
//
// GB England & Wales is the reviewed V1 baseline. Every other jurisdiction is
// research-only: Propvora provides generic record-keeping and surfaces a
// "verify with a qualified local professional" disclaimer. Sanctioned countries
// are blocked entirely.
// ============================================================

export type LegalModuleKey = "possession" | "hmo" | "epc" | "rra"

export interface LegalModuleInfo {
  key: LegalModuleKey
  /** Whether this statutory module is meaningful in this jurisdiction. */
  applies: boolean
  /** Jurisdiction-appropriate display label for the module. */
  label: string
  /** One-line note about the local equivalent / why it does or does not apply. */
  note: string
  /** True when a workspace custom pack has turned this module off (Overview card hidden). */
  disabled?: boolean
  /** True for a workspace-authored custom module (informational card only). */
  custom?: boolean
}

export interface LegalJurisdiction {
  /** ISO-3166-1 alpha-2 country code (upper-cased, GB default). */
  countryCode: string
  /** Region/country label shown in headers and disclaimers. */
  regionName: string
  /** True only for the reviewed England & Wales baseline. */
  reviewed: boolean
  /** True for sanctioned/blocked countries — no legal tooling at all. */
  blocked: boolean
  /** Non-dismissible legal disclaimer for this jurisdiction. */
  legalDisclaimer: string
  /** Per-module applicability + labels. */
  modules: Record<LegalModuleKey, LegalModuleInfo>
}

// Sanctioned / blocked country codes — kept in sync with the bannedProfile set
// in src/lib/i18n/country-profiles.ts. NOTE: "NI" here is the country code for
// Nicaragua, NOT the Northern Ireland region (region is a separate argument).
const BLOCKED_CODES = new Set([
  "RU", "IR", "KP", "SY", "CU", "BY", "VE", "NI", "AF", "MM", "YE", "SD", "SO", "CN",
])

// EU member states with an EPC-equivalent under the Energy Performance of
// Buildings Directive — EPC advisory is meaningful (generic) for these.
const EU_EPC_CODES = new Set([
  "FR", "ES", "DE", "IT", "NL", "BE", "AT", "PT", "SE", "FI", "DK", "CZ", "HR", "HU", "RO", "GR", "IE",
])

const REVIEWED_DISCLAIMER =
  "Legal tools shown reflect England & Wales statute and are Propvora's reviewed V1 baseline. " +
  "This is not legal advice — verify current grounds, notice periods and licensing duties with a " +
  "qualified solicitor before acting. Scotland and Northern Ireland have different regimes."

const RESEARCH_DISCLAIMER = (region: string) =>
  `Propvora has not had ${region}'s residential-tenancy, possession or licensing law professionally ` +
  `reviewed. The England & Wales possession, HMO and Renters' Rights workflows do NOT apply in ${region}. ` +
  `Propvora provides generic record-keeping only in your jurisdiction — verify every requirement, notice ` +
  `period and licence with a qualified local professional before relying on it. ` +
  `This is not legal, tax or financial advice.`

const BLOCKED_DISCLAIMER = (region: string) =>
  `${region} is blocked for onboarding and country-specific features pending sanctions and legal review. ` +
  `Legal tooling is unavailable for this jurisdiction.`

/** Build the England & Wales (reviewed) module set. */
function ewModules(): Record<LegalModuleKey, LegalModuleInfo> {
  return {
    possession: {
      key: "possession",
      applies: true,
      label: "Possession (Section 8)",
      note: "Fault-based possession under Housing Act 1988 grounds, served via Section 8 notice.",
    },
    hmo: {
      key: "hmo",
      applies: true,
      label: "HMO Licences",
      note: "Mandatory, additional and selective licensing under the Housing Act 2004.",
    },
    epc: {
      key: "epc",
      applies: true,
      label: "EPC Advisory",
      note: "Energy Performance Certificate coverage and minimum-standard readiness.",
    },
    rra: {
      key: "rra",
      applies: true,
      label: "RRA 2026",
      note: "Renters' Rights Act 2026 readiness — periodic tenancies, Section 8-only possession.",
    },
  }
}

/** Build a research-only (non-E&W) module set with honest, generic labels. */
function genericModules(region: string, countryCode: string): Record<LegalModuleKey, LegalModuleInfo> {
  const epcApplies = EU_EPC_CODES.has(countryCode)
  return {
    possession: {
      key: "possession",
      applies: true, // record-keeping is universally useful, but generic only
      label: "Possession / Eviction",
      note: `Possession and eviction procedure in ${region} differs from England & Wales — Section 8 grounds do not apply. Track cases as generic records only.`,
    },
    hmo: {
      key: "hmo",
      applies: false,
      label: "Shared-Occupancy Licensing",
      note: `"HMO licensing" is an England & Wales concept. ${region} may have its own shared-occupancy or rental-registration rules — record any local licence as a compliance document.`,
    },
    epc: {
      key: "epc",
      applies: epcApplies,
      label: epcApplies ? "Energy Certificate" : "Energy Certificate (local equivalent)",
      note: epcApplies
        ? `${region} issues an energy-performance certificate under EU rules. Coverage tracking applies; minimum-standard thresholds differ from the UK.`
        : `Energy-certificate rules vary in ${region}. Track any local energy certificate as a compliance document.`,
    },
    rra: {
      key: "rra",
      applies: false,
      label: "Renters' Rights",
      note: `The Renters' Rights Act 2026 is an England & Wales statute and does not apply in ${region}.`,
    },
  }
}

/**
 * Resolve the legal jurisdiction for a workspace country.
 * `countryCode` is ISO-3166-1 alpha-2 (GB default). Optional `region`
 * ("EW", "SCT", "NI") refines GB.
 */
export function getLegalJurisdiction(
  countryCode: string | null | undefined,
  region?: string | null
): LegalJurisdiction {
  const code = (countryCode || "GB").trim().toUpperCase()
  const reg = (region || "").trim().toUpperCase()

  // ── England & Wales: the reviewed baseline ──────────────────────────────
  if (code === "GB" || code === "UK") {
    if (reg === "SCT" || reg === "SCOTLAND") {
      const mods = genericModules("Scotland", "GB")
      // Scotland has a real HMO licensing regime and EPCs, but a different
      // possession route (First-tier Tribunal) and no RRA 2026.
      mods.hmo = { key: "hmo", applies: true, label: "HMO Licences", note: "Scotland operates mandatory HMO licensing under its own regime — verify conditions locally." }
      mods.epc = { key: "epc", applies: true, label: "EPC Advisory", note: "Energy Performance Certificates apply in Scotland; minimum-standard rules differ from England & Wales." }
      return {
        countryCode: "GB",
        regionName: "Scotland",
        reviewed: false,
        blocked: false,
        legalDisclaimer: RESEARCH_DISCLAIMER("Scotland"),
        modules: mods,
      }
    }
    if (reg === "NI" || reg === "NORTHERN IRELAND") {
      const mods = genericModules("Northern Ireland", "GB")
      mods.hmo = { key: "hmo", applies: true, label: "HMO Licences", note: "Northern Ireland operates HMO licensing under its own regime — verify conditions locally." }
      mods.epc = { key: "epc", applies: true, label: "EPC Advisory", note: "Energy Performance Certificates apply in Northern Ireland; minimum-standard rules differ." }
      return {
        countryCode: "GB",
        regionName: "Northern Ireland",
        reviewed: false,
        blocked: false,
        legalDisclaimer: RESEARCH_DISCLAIMER("Northern Ireland"),
        modules: mods,
      }
    }
    return {
      countryCode: "GB",
      regionName: "England & Wales",
      reviewed: true,
      blocked: false,
      legalDisclaimer: REVIEWED_DISCLAIMER,
      modules: ewModules(),
    }
  }

  // ── Sanctioned / blocked ────────────────────────────────────────────────
  if (BLOCKED_CODES.has(code)) {
    const blockedMods = genericModules(code, code)
    for (const k of Object.keys(blockedMods) as LegalModuleKey[]) blockedMods[k].applies = false
    return {
      countryCode: code,
      regionName: code,
      reviewed: false,
      blocked: true,
      legalDisclaimer: BLOCKED_DISCLAIMER(code),
      modules: blockedMods,
    }
  }

  // ── Any other country → research-only generic set ───────────────────────
  return {
    countryCode: code,
    regionName: code,
    reviewed: false,
    blocked: false,
    legalDisclaimer: RESEARCH_DISCLAIMER(code),
    modules: genericModules(code, code),
  }
}

/** Convenience: does a given legal module apply in this jurisdiction? */
export function legalModuleApplies(
  module: LegalModuleKey,
  countryCode: string | null | undefined,
  region?: string | null
): boolean {
  return getLegalJurisdiction(countryCode, region).modules[module].applies
}
