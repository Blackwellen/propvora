"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import AutomationsHeader from "./AutomationsHeader"
import AutomationsTabs from "./AutomationsTabs"
import AutomationsSafetyBanner from "./AutomationsSafetyBanner"
import { ToastProvider } from "./primitives"

/**
 * Wraps an Automations page: header + tab strip + optional safety banner + children.
 * Content width max-w-[1500px] mx-auto px-6. The dark sidebar / top bar comes from
 * AppShell — this only owns the module surface.
 */
export default function AutomationsModuleShell({
  title,
  subtitle,
  icon,
  iconTone,
  actions,
  showSafetyBanner = false,
  hiddenTabs,
  children,
}: {
  title: string
  subtitle: string
  icon?: LucideIcon
  iconTone?: "violet" | "red"
  actions?: ReactNode
  showSafetyBanner?: boolean
  /**
   * Tab labels to hide from the Automations tab strip.
   * Passed down from pages that resolve feature flags server-side.
   * e.g. ["Canvas Builder"] when canvasLite=OFF, ["Webhooks","Integrations"] when automationsFull=OFF
   */
  hiddenTabs?: string[]
  children: ReactNode
}) {
  return (
    <ToastProvider>
      <div className="mx-auto max-w-[1500px] space-y-5 px-6 pb-12">
        <AutomationsHeader title={title} subtitle={subtitle} icon={icon} iconTone={iconTone} actions={actions} />
        <AutomationsTabs hiddenTabs={hiddenTabs} />
        {showSafetyBanner && <AutomationsSafetyBanner />}
        <div className="pt-1">{children}</div>
      </div>
    </ToastProvider>
  )
}
