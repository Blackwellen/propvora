"use client"

import { createContext, useContext, type ReactNode } from "react"

/**
 * AutomationsFlagsContext — single source of truth for feature-flag-derived
 * tab visibility across the whole Automations module.
 *
 * Why this exists: the module tab strip (AutomationsTabs) is rendered on every
 * Automations page. Previously each page had to resolve flags itself and pass
 * `hiddenTabs` down; pages that forgot (Runs & Logs, Approvals, Errors, AI
 * Builder, Usage & Limits) rendered the FULL strip, so the flag-gated Canvas
 * Builder / Integrations tabs re-appeared the moment you clicked into them —
 * and clicking a gated tab bounced the user. The PM Automations layout now
 * resolves the flags ONCE and provides them here, so every page renders an
 * identical, correctly-gated strip.
 *
 * Note: "Webhooks" is a sub-tab inside Integrations, not a separate main tab.
 * Gating "Integrations" covers Webhooks automatically.
 *
 * The Supplier workspace mounts a couple of these pages OUTSIDE this provider,
 * so consumers must fall back to their own props when the context is absent.
 */
export interface AutomationsFlagsValue {
  /** Tab labels to hide from the strip, e.g. ["Canvas Builder", "Integrations"]. */
  hiddenTabs: string[]
  /** Whether canvasLite is ON — controls the Canvas shortcut buttons. */
  canvasEnabled: boolean
}

const AutomationsFlagsContext = createContext<AutomationsFlagsValue | null>(null)

export function AutomationsFlagsProvider({
  value,
  children,
}: {
  value: AutomationsFlagsValue
  children: ReactNode
}) {
  return (
    <AutomationsFlagsContext.Provider value={value}>
      {children}
    </AutomationsFlagsContext.Provider>
  )
}

/** Returns the flag context, or null when rendered outside the provider. */
export function useAutomationsFlags(): AutomationsFlagsValue | null {
  return useContext(AutomationsFlagsContext)
}
