import type {
  CountryContext,
  MoneyContext,
  PropertyContext,
  RiskClass,
  RiskContext,
} from "./context-types"

/**
 * Derive the RISK block (pure — no I/O).
 *
 * Produces a coarse risk classification + flags from the resolved country/
 * money/property posture, so surfaces can show warning banners and so
 * automations can refuse to auto-run risky classes. This is advisory, not a
 * security control.
 */
export function resolveRiskContext(args: {
  country: CountryContext
  money: MoneyContext
  property: PropertyContext | null
}): RiskContext {
  const { country, money } = args
  const flags: string[] = []

  if (country.offerStatus === "banned") flags.push("country_banned")
  if (country.offerStatus === "restricted") flags.push("country_restricted")
  if (country.offerStatus === "unknown") flags.push("country_offer_unknown")
  if (country.isFallback) flags.push("country_pack_missing")
  if (country.propertyFeaturesStatus === "generic_only") flags.push("generic_country_mode")
  if (country.legalStatus !== "enabled" && country.legalStatus !== "reviewed") {
    flags.push("legal_local_review_required")
  }
  if (money.fxApplies) flags.push("fx_exposure")

  let cls: RiskClass = "low"
  if (flags.includes("country_banned") || flags.includes("country_restricted")) {
    cls = "high"
  } else if (
    flags.includes("legal_local_review_required") ||
    flags.includes("country_offer_unknown") ||
    flags.includes("fx_exposure")
  ) {
    cls = "medium"
  }

  return { class: cls, flags }
}
