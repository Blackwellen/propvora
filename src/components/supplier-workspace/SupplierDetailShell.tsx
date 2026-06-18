"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { SupplierTabs, type SupplierTabItem } from "@/components/supplier-workspace/ui"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierDetailShell — route-backed detail page chrome: a back link, a title
   row with status + actions, an internal tab strip, and the active panel.
   Pair with <SupplierActionBar> from ui.tsx for the sticky action row.
─────────────────────────────────────────────────────────────────────────── */

export interface SupplierDetailTab extends SupplierTabItem {
  render: () => React.ReactNode
}

interface SupplierDetailShellProps {
  backHref: string
  backLabel: string
  title: string
  subtitle?: string
  status?: React.ReactNode
  actions?: React.ReactNode
  tabs: SupplierDetailTab[]
  /** Sticky action bar (e.g. <SupplierActionBar>…</SupplierActionBar>). */
  actionBar?: React.ReactNode
}

export function SupplierDetailShell({
  backHref,
  backLabel,
  title,
  subtitle,
  status,
  actions,
  tabs,
  actionBar,
}: SupplierDetailShellProps) {
  const [active, setActive] = useState(tabs[0]?.key)
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <div className="space-y-5">
      <MobileTopBar title={title} subtitle="Supplier workspace" />

      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> {backLabel}
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {status}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      <SupplierTabs active={active} onChange={setActive} tabs={tabs} />

      <div>{activeTab?.render()}</div>

      {actionBar}
    </div>
  )
}
