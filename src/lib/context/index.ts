/**
 * ============================================================================
 * Propvora v2 Context Engine — public barrel.
 * ============================================================================
 * The central resolver every v2 surface reads to learn who/where/what-is-
 * allowed. Consumers should import from here:
 *
 *   import { resolvePropvoraContext, type PropvoraContext } from "@/lib/context"
 *
 * Stable public API: `resolvePropvoraContext` + `PropvoraContext`.
 * ============================================================================
 */

export { resolvePropvoraContext } from "./context-resolver"

export type {
  PropvoraContext,
  ResolveContextArgs,
  RouteContext,
  // Block types
  ActorContext,
  WorkspaceContext,
  CountryContext,
  PropertyContext,
  MoneyContext,
  LegalContext,
  ComplianceContext,
  AiContext,
  AutomationContext,
  PermissionContext,
  RiskContext,
  // Primitive enums
  WorkspaceType,
  PackStatus,
  OfferStatus,
  AiDepth,
  RiskClass,
} from "./context-types"

// Sub-resolvers exported for advanced/standalone use (e.g. re-deriving a single
// block, or unit-testing a sub-resolver in isolation).
export { resolveActorContext } from "./actor-context"
export { resolveWorkspaceContext } from "./workspace-context"
export { resolveCountryContext } from "./country-context"
export { resolvePropertyContext } from "./property-context"
export { resolvePermissionContext } from "./permission-context"
export { resolveRiskContext } from "./risk-context"

// ── Internationalisation / country-pack context engine ──────────────────────
// The full intl bundle + the derived GATES block every surface obeys.
export { resolveCountryPackContext, deriveGates } from "./country-pack-context"
export { resolveSanctionsContext, isHardBlockedCode, HARD_BLOCKED_COUNTRY_CODES } from "./sanctions-context"
export { resolveReleaseGateContext } from "./release-gate-context"
export { resolveTaxContext } from "./tax-context"
export { resolvePrivacyContext } from "./privacy-context"
export { resolveLocaleContext } from "./locale-context"
export { enforceRouteContext } from "./route-enforcement"
export type { RouteVerdict, RouteVerdictKind } from "./route-enforcement"

export type {
  IntlCountryContext,
  CountryGates,
  SanctionsContext,
  ReleaseGateContext,
  TaxContext,
  PrivacyContext,
  LocaleContext,
  ReleaseState,
  SanctionsClassification,
  TaxScheme,
} from "./intl-types"
