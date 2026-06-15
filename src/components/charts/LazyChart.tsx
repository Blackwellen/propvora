"use client"

import type { ComponentType } from "react"
import dynamic from "next/dynamic"
import { ChartSkeleton } from "./ChartSkeleton"

/**
 * Shared Recharts code-splitting helper.
 *
 * Recharts (~hundreds of KB) is a client-only visualisation library. Pulling it
 * into the initial bundle of every page that shows a chart is wasteful — most of
 * those charts are below the fold or behind a tab. This module provides the
 * canonical way to defer Recharts so it is fetched on demand.
 *
 * Why a per-CHART boundary (not per-primitive):
 *   Recharts 3 still detects chart children by `type.displayName` (see
 *   recharts util/ReactUtils `findChildByType`). Wrapping individual primitives
 *   (Line, Bar, Pie, XAxis…) in `next/dynamic` would break that detection. So we
 *   lazy-load a whole self-contained chart component behind ONE boundary, which
 *   keeps every chart's internal structure intact while removing Recharts from
 *   the initial chunk.
 *
 * `ssr: false` is correct and required here: these are presentational client
 * charts with no SEO/content value, and Recharts relies on browser layout APIs.
 * It does not affect SSR of the surrounding page.
 */
export function lazyChart<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options?: { skeletonClassName?: string }
): ComponentType<P> {
  return dynamic(loader, {
    ssr: false,
    loading: () => <ChartSkeleton className={options?.skeletonClassName} />,
  }) as ComponentType<P>
}

export { ChartSkeleton }
