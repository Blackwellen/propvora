"use client"

import { useFeatureFlag } from "@/hooks/useFeatureFlag"
import type { V2FlagKey } from "@/lib/flags/registry"

/**
 * Resolves the fixed set of feature flags that quick-bar widgets depend on.
 * Each flag is read via a top-level `useFeatureFlag` call (hooks-rule safe — the
 * set is static), returning a map for `gateWidgets`. Off-by-default V2 widgets
 * (planning, automations, legal, marketplace) stay hidden until their flag is ON,
 * so users can't pin a surface their workspace hasn't enabled.
 */
export function useQuickbarFlags(): Partial<Record<V2FlagKey, boolean>> {
  const planningEnabled = useFeatureFlag("planningEnabled")
  const canvasLite = useFeatureFlag("canvasLite")
  const legalSection = useFeatureFlag("legalSection")
  const marketplaceEnabled = useFeatureFlag("marketplaceEnabled")
  return { planningEnabled, canvasLite, legalSection, marketplaceEnabled }
}
