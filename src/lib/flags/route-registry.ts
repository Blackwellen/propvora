import type { RouteContext } from "./route-context"

/**
 * ROUTE CONTEXT REGISTRY (v2)
 * ---------------------------
 * Next.js can't read a page's `export const routeContext` from the edge proxy
 * (proxy runs before the route module loads). So routes that need context
 * gating are registered here by path PREFIX. The proxy guard matches the
 * incoming pathname against the longest matching prefix and applies its
 * RouteContext.
 *
 * This registry is INTENTIONALLY EMPTY of constraints that would change V1
 * behaviour. Entries here only ever take effect when the `contextEngine` flag
 * is ON (the guard short-circuits otherwise). It is the seam future v2 work
 * fills in — e.g. the customer route group requiring `customer` workspace type.
 *
 * Keep this file I/O-free and edge-safe.
 */

export interface RouteRegistryEntry {
  /** Path prefix this entry governs (exact path or path + "/" descendants). */
  prefix: string
  context: RouteContext
}

/**
 * Registered route contexts, ordered most-specific-first by convention. The
 * matcher picks the LONGEST matching prefix, so order is for readability only.
 *
 * These declarations describe the v2 INTENT (e.g. the customer workspace shell
 * only makes sense for a `customer` workspace). They are dormant until
 * `contextEngine` is enabled.
 */
export const ROUTE_CONTEXT_REGISTRY: RouteRegistryEntry[] = [
  {
    prefix: "/customer",
    context: {
      requiredWorkspaceTypes: ["customer"],
      supportedActorContexts: ["customer_portal"],
      blockedCountryBehaviour: "warn",
    },
  },
  {
    prefix: "/supplier-portal",
    context: {
      requiredWorkspaceTypes: ["supplier"],
      supportedActorContexts: ["supplier_portal", "supplier_workspace"],
      blockedCountryBehaviour: "warn",
    },
  },
]

/** Find the most specific registered RouteContext for a pathname (or null). */
export function matchRouteContext(pathname: string): RouteContext | null {
  let best: RouteRegistryEntry | null = null
  for (const entry of ROUTE_CONTEXT_REGISTRY) {
    const matches =
      pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
    if (matches && (!best || entry.prefix.length > best.prefix.length)) {
      best = entry
    }
  }
  return best ? best.context : null
}
