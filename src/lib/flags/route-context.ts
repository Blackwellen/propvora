/**
 * ROUTE CONTEXT CONVENTION (v2)
 * -----------------------------
 * A route (page / layout / API segment) may export a `routeContext` constant
 * describing the contexts in which it is valid. The additive proxy guard in
 * `src/proxy.ts` reads this declaration (via a route registry) and, when the
 * context engine is enabled, composes the central `resolvePropvoraContext`
 * result against it to decide whether to allow, redirect or block.
 *
 * This file defines ONLY the type/convention and pure helpers. It performs no
 * I/O and imports nothing from `@/lib/context` (owned by another agent), so it
 * is safe to import from the edge proxy. The actual resolver is imported
 * lazily by the proxy guard.
 *
 * With the `contextEngine` flag OFF (the v2 default) the guard is inert and no
 * route is affected — V1 behaviour is unchanged.
 */

/** Workspace types, mirroring the audit (§2.2 / §14.1). */
export type WorkspaceType = "operator" | "supplier" | "customer" | "platform_admin"

/** Actor / interaction contexts (audit §2.3). */
export type ActorContext =
  | "internal"
  | "supplier_portal"
  | "supplier_workspace"
  | "customer_portal"
  | "tenant_portal"
  | "public_booking"
  | "public_supplier"
  | "marketplace_admin"
  | "platform_admin"

/** What to do when a property/workspace country is blocked/unsupported. */
export type BlockedCountryBehaviour = "deny" | "research_only" | "warn" | "allow"

/**
 * Declarative context requirements a route can export as `routeContext`.
 * All fields are OPTIONAL: an omitted field means "no constraint", so a route
 * with no declaration (or an empty object) is unconstrained — exactly today's
 * V1 behaviour.
 */
export interface RouteContext {
  /** Workspace types allowed to access this route. Omitted = any. */
  requiredWorkspaceTypes?: WorkspaceType[]
  /** Actor contexts this route supports. Omitted = any. */
  supportedActorContexts?: ActorContext[]
  /** Route requires a supported country pack for the active context. */
  countryPackRequired?: boolean
  /** Route requires a reviewed/enabled legal pack for the active context. */
  legalPackRequired?: boolean
  /** Route requires a money/payment context to be supported. */
  moneyContextRequired?: boolean
  /** Allow access in a research-only country (read-only depth). */
  allowResearchOnlyCountry?: boolean
  /** Behaviour when the country is blocked/unsupported. Default: 'deny'. */
  blockedCountryBehaviour?: BlockedCountryBehaviour
}

/** Outcome of evaluating a RouteContext against a resolved context. */
export type RouteGateOutcome =
  | { ok: true }
  | { ok: false; reason: string; redirectTo?: string }

/**
 * Minimal shape the guard needs from `resolvePropvoraContext`. Kept structural
 * and loose so a concurrently-evolving resolver never breaks compilation here.
 */
export interface ResolvedContextLike {
  workspace?: {
    type?: WorkspaceType | string | null
  } | null
  actor?: {
    context?: ActorContext | string | null
  } | null
  countryPack?: {
    supportStatus?: string | null
  } | null
  legal?: {
    templatesEnabled?: boolean | null
  } | null
}

/**
 * Pure evaluation: given a route's declared context requirements and a resolved
 * context, decide allow / block. No I/O. Defensive: anything it can't determine
 * is treated as "no constraint violated" so the guard fails OPEN on partial
 * data (it only blocks on a CLEAR mismatch). Country-block is the one exception
 * where the declared `blockedCountryBehaviour` governs.
 */
export function evaluateRouteContext(
  route: RouteContext | undefined,
  ctx: ResolvedContextLike | null | undefined
): RouteGateOutcome {
  if (!route) return { ok: true }
  if (!ctx) return { ok: true } // resolver gave us nothing — don't block.

  // Workspace type constraint.
  if (route.requiredWorkspaceTypes && route.requiredWorkspaceTypes.length > 0) {
    const wt = ctx.workspace?.type
    if (wt && !route.requiredWorkspaceTypes.includes(wt as WorkspaceType)) {
      return {
        ok: false,
        reason: `Workspace type "${wt}" is not permitted on this route`,
        redirectTo: "/property-manager",
      }
    }
  }

  // Actor context constraint.
  if (route.supportedActorContexts && route.supportedActorContexts.length > 0) {
    const ac = ctx.actor?.context
    if (ac && !route.supportedActorContexts.includes(ac as ActorContext)) {
      return {
        ok: false,
        reason: `Actor context "${ac}" is not supported on this route`,
        redirectTo: "/property-manager",
      }
    }
  }

  // Country pack constraint.
  if (route.countryPackRequired) {
    const status = ctx.countryPack?.supportStatus
    if (status === "blocked" || status === "unsupported") {
      const behaviour = route.blockedCountryBehaviour ?? "deny"
      if (behaviour === "deny") {
        return { ok: false, reason: "Country is not supported", redirectTo: "/property-manager" }
      }
      if (behaviour === "research_only" && !route.allowResearchOnlyCountry) {
        return { ok: false, reason: "Country is research-only", redirectTo: "/property-manager" }
      }
      // 'warn' / 'allow' / allowed research-only → pass (banner handled in UI).
    }
  }

  // Legal pack constraint.
  if (route.legalPackRequired) {
    const enabled = ctx.legal?.templatesEnabled
    if (enabled === false) {
      return { ok: false, reason: "Legal pack is not available for this context", redirectTo: "/property-manager" }
    }
  }

  return { ok: true }
}
