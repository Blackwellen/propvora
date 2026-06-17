"use client"

import React, { Suspense, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  SupplierTabs,
  SupplierUpgradeCard,
  type SupplierTabItem,
} from "@/components/supplier-workspace/ui"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierTabHub — a merged top-level supplier page. Each section of the old
   flat menu becomes a TAB here. The active tab is reflected in the URL
   (`?tab=`) so tabs are deep-linkable and back-button friendly.

   `gated` tabs render a premium "Upgrade to Team" lock card for Solo suppliers
   instead of a broken surface (see useSupplierPlan / SupplierPlanGate).
─────────────────────────────────────────────────────────────────────────── */

export interface SupplierHubTab extends SupplierTabItem {
  /** Rendered when this tab is active. */
  render: () => React.ReactNode
  /** When true and the supplier is on Solo, show an upgrade lock instead. */
  teamOnly?: boolean
  /** Upgrade-card copy when teamOnly + Solo. */
  upgradeTitle?: string
  upgradeDescription?: string
  upgradeFeatures?: string[]
}

interface SupplierTabHubProps {
  title: string
  subtitle?: string
  tabs: SupplierHubTab[]
  /** Optional right-aligned header actions. */
  actions?: React.ReactNode
  /** Current plan — drives team-only gating. */
  isTeam: boolean
}

export function SupplierTabHub(props: SupplierTabHubProps) {
  return (
    <Suspense fallback={<div className="min-h-[420px] rounded-xl border border-slate-200 bg-white" />}>
      <SupplierTabHubInner {...props} />
    </Suspense>
  )
}

function SupplierTabHubInner({ title, subtitle, tabs, actions, isTeam }: SupplierTabHubProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const urlTab = params.get("tab")
  const validKeys = tabs.map((t) => t.key)
  const initial = urlTab && validKeys.includes(urlTab) ? urlTab : tabs[0]?.key
  const [active, setActive] = useState<string>(initial)

  function selectTab(key: string) {
    setActive(key)
    const next = new URLSearchParams(Array.from(params.entries()))
    next.set("tab", key)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <div className="space-y-5">
      {/* Desktop hub header. On mobile the embedded section's own MobileTopBar
          provides the title, so we don't double up sticky bars here. */}
      <div className="hidden md:flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>

      {/* Mobile: a single non-sticky title row + horizontally scrollable tabs. */}
      <div className="md:hidden">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <SupplierTabs active={active} onChange={selectTab} tabs={tabs} />
      </div>

      <div>
        {activeTab &&
          (activeTab.teamOnly && !isTeam ? (
            <SupplierUpgradeCard
              title={activeTab.upgradeTitle ?? `${activeTab.label} is a Team feature`}
              description={
                activeTab.upgradeDescription ??
                "Upgrade to the Team plan to unlock this for your supplier business."
              }
              features={activeTab.upgradeFeatures}
            />
          ) : (
            activeTab.render()
          ))}
      </div>
    </div>
  )
}
