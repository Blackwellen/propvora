import type { RouteContext } from "./context-types"
import type { IntlCountryContext } from "./intl-types"

/**
 * ============================================================================
 * ROUTE-CONTEXT enforcement against the country-pack gates.
 * ============================================================================
 * A v2 surface declares what it needs (RouteContext) and passes the resolved
 * country pack. This returns a verdict the surface acts on (render / generic /
 * deny). It performs NO redirects itself — surfaces decide.
 *
 * GB always satisfies every requirement (the reviewed baseline). Non-GB
 * countries are checked against their gates: a route that requires a legal pack
 * is denied (or downgraded to generic, per blockedCountryBehaviour) for a
 * country whose legal pack is not reviewed; a banned/sanctioned country is
 * always denied for any gated route.
 * ============================================================================
 */

export type RouteVerdictKind = "allow" | "generic" | "deny"

export interface RouteVerdict {
  kind: RouteVerdictKind
  reasons: string[]
  /** Convenience flags for the surface. */
  showGenericOnly: boolean
  blocked: boolean
}

export function enforceRouteContext(
  route: RouteContext | null | undefined,
  intl: IntlCountryContext
): RouteVerdict {
  const reasons: string[] = []
  const isGB = intl.countryCode === "GB"
  const behaviour = route?.blockedCountryBehaviour ?? "generic"

  // Hard block first — a sanctioned/banned country is denied for any gated route.
  if (intl.sanctions.isHardBlocked || intl.offerStatus === "banned") {
    return {
      kind: "deny",
      reasons: [intl.gates.blockedReason ?? "Country unavailable."],
      showGenericOnly: false,
      blocked: true,
    }
  }

  if (!route || isGB) {
    return { kind: "allow", reasons: [], showGenericOnly: false, blocked: false }
  }

  let downgrade = false
  let deny = false

  if (route.countryPackRequired && !intl.gates.canUsePropertyPack) {
    reasons.push("Country pack features are not available for this country.")
    deny = true
  }
  if (route.legalPackRequired && !intl.gates.canShowLegalPack) {
    reasons.push("The legal pack for this country is not reviewed.")
    downgrade = true
  }
  if (route.moneyContextRequired && !intl.gates.canBill && !intl.gates.canTakePayouts) {
    reasons.push("Billing and payouts are not available for this country.")
    deny = true
  }
  if (
    !route.allowResearchOnlyCountry &&
    intl.gates.requiresManualReview &&
    intl.offerStatus !== "offer"
  ) {
    reasons.push("This country requires manual review before it can be used.")
    deny = true
  }

  if (deny && behaviour === "deny") {
    return { kind: "deny", reasons, showGenericOnly: false, blocked: true }
  }
  if (deny || downgrade) {
    // Default & 'warn'/'generic' behaviours downgrade to generic rather than 403.
    if (behaviour === "deny") {
      return { kind: "deny", reasons, showGenericOnly: false, blocked: true }
    }
    return { kind: "generic", reasons, showGenericOnly: true, blocked: false }
  }

  return { kind: "allow", reasons: [], showGenericOnly: false, blocked: false }
}
