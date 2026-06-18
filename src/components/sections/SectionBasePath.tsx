"use client"

/**
 * SectionBasePath — lets a feature section (Automations, Accounting, Calendar,
 * Messages) be mounted under different URL prefixes without rewriting every
 * hardcoded link inside its page bodies.
 *
 * The Property-Manager sections live under `/property-manager/<section>` (which
 * rewrites to `/app/<section>`). The SAME components are mounted inside the
 * Supplier workspace under `/supplier/<section>`. Wrapping a supplier mount in
 * <SectionBasePathProvider> lets shared tab-navs / in-page links resolve to the
 * supplier prefix; PM routes simply don't wrap (so they keep their defaults).
 *
 * `sectionLink()` rewrites an absolute PM-style href (e.g.
 * "/app/calendar/views/day" or "/property-manager/automations/recipes") onto the
 * active base path. It is a no-op when no provider is mounted, so PM routes are
 * unchanged and fully backward-compatible.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export interface SectionBasePathValue {
  /** Public href base for the section, e.g. "/supplier/calendar". */
  base: string
  /** The canonical PM href base this section maps from, e.g. "/app/calendar". */
  pmBase: string
  /** The public PM prefix variant, e.g. "/property-manager/calendar". */
  pmPublicBase: string
}

const SectionBasePathContext = createContext<SectionBasePathValue | null>(null)

export function SectionBasePathProvider({
  value,
  children,
}: {
  value: SectionBasePathValue
  children: ReactNode
}) {
  return (
    <SectionBasePathContext.Provider value={value}>
      {children}
    </SectionBasePathContext.Provider>
  )
}

export function useSectionBasePath(): SectionBasePathValue | null {
  return useContext(SectionBasePathContext)
}

/**
 * Resolve a single href against the active section base path.
 *
 * Given the PM-style href and the active context, swap the section's PM prefix
 * for the mounted base. Hrefs that don't belong to this section are returned
 * unchanged (cross-section links still go to the PM app).
 */
export function resolveSectionHref(
  href: string,
  ctx: SectionBasePathValue | null,
): string {
  if (!ctx) return href
  if (!href.startsWith("/")) return href
  // Normalise the public PM prefix to the /app prefix for matching.
  const normalised = href.startsWith(ctx.pmPublicBase)
    ? ctx.pmBase + href.slice(ctx.pmPublicBase.length)
    : href
  if (normalised === ctx.pmBase) return ctx.base
  if (normalised.startsWith(ctx.pmBase + "/")) {
    return ctx.base + normalised.slice(ctx.pmBase.length)
  }
  return href
}

/** Hook form: returns a stable resolver bound to the active context. */
export function useSectionLink(): (href: string) => string {
  const ctx = useSectionBasePath()
  return (href: string) => resolveSectionHref(href, ctx)
}

/**
 * A drop-in replacement for next/navigation's useRouter whose `push`/`replace`
 * rebase section-local hrefs onto the active base path. Cross-section links and
 * non-section hrefs pass through untouched. With no provider mounted (PM
 * routes) it behaves exactly like the native router.
 */
type AppRouter = ReturnType<typeof useRouter>

export function useSectionRouter(): AppRouter {
  const router = useRouter()
  const ctx = useSectionBasePath()
  return useMemo<AppRouter>(() => {
    return {
      ...router,
      push: (href, ...rest) =>
        (router.push as (h: string, ...r: unknown[]) => void)(
          resolveSectionHref(href, ctx),
          ...rest,
        ),
      replace: (href, ...rest) =>
        (router.replace as (h: string, ...r: unknown[]) => void)(
          resolveSectionHref(href, ctx),
          ...rest,
        ),
    } as AppRouter
  }, [router, ctx])
}
