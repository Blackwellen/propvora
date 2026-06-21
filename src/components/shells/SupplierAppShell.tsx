"use client"

import React, { useState, useCallback } from "react"
import SideNavigation, { type ShellNavConfig } from "@/components/shell/SideNavigation"
import TopNavigation from "@/components/shell/TopNavigation"
import ShellContent from "@/components/shell/ShellContent"
import SkipLink from "@/components/a11y/SkipLink"
import { useWorkspace } from "@/providers/AuthProvider"
import { GuidedHelpProvider } from "@/guided-help/GuidedHelpProvider"
import FirstUseModal from "@/guided-help/components/FirstUseModal"
import SupplierMobileBottomNav from "@/components/supplier-workspace/SupplierMobileNav"
import { SupplierWorkspaceProvider } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import {
  SupplierPlanProvider,
  useSupplierPlan,
  type SupplierPlanType,
} from "@/components/supplier-workspace/useSupplierPlan"
import { supplierNavGroupsForPlan } from "@/components/supplier-workspace/nav"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierAppShell — the supplier workspace now wears the SAME chrome as the
   Property Manager workspace: the shared SideNavigation + TopNavigation +
   ShellContent components, the identical floating navy sidebar and white top
   toolbar. The only difference is the nav CONFIG (supplier menu, /supplier
   base) and the dedicated supplier mobile bottom nav. No "SUPPLIER" badge.
─────────────────────────────────────────────────────────────────────────── */

const SUPPLIER_BASE = "/supplier"

function SupplierShellChrome({ children }: { children: React.ReactNode }) {
  const { workspace } = useWorkspace()
  const { planType, memberCount } = useSupplierPlan()

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("shell-collapsed") === "true"
    }
    return false
  })
  const handleToggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem("shell-collapsed", String(next))
      return next
    })
  }, [])

  const navGroups = supplierNavGroupsForPlan(planType, { memberCount })
  const navConfig: ShellNavConfig = {
    base: SUPPLIER_BASE,
    groups: navGroups.map((g) => ({
      label: g.label.toUpperCase(),
      items: g.items.map((i) => ({ label: i.label, href: i.href, icon: i.icon })),
    })),
    workspaceHref: `${SUPPLIER_BASE}/settings`,
    accountHref: `${SUPPLIER_BASE}/account`,
  }

  // Sidebar total footprint: width + left-margin + right-gap (matches AppShell).
  const sideOffset = (collapsed ? 76 : 200) + 16 + 16

  return (
    <GuidedHelpProvider workspaceId={workspace?.id}>
      <div className="h-dvh overflow-hidden" style={{ background: "var(--bg-app-shell)" }}>
        <SkipLink />

        {/* Fixed sidebar — shared SideNavigation, supplier config. */}
        <div className="hidden lg:block">
          <SideNavigation collapsed={collapsed} onToggle={handleToggle} navConfig={navConfig} />
        </div>

        <div
          className="flex flex-col h-dvh overflow-hidden transition-[padding-left] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] pl-0 lg:pl-[var(--side-offset)]"
          style={{ "--side-offset": `${sideOffset}px` } as React.CSSProperties}
        >
          {/* Shared TopNavigation toolbar, scoped to /supplier shortcuts. */}
          <div className="hidden lg:block pt-4 pr-4 shrink-0">
            <TopNavigation base={SUPPLIER_BASE} />
          </div>

          <ShellContent>{children}</ShellContent>
        </div>

        {/* Dedicated supplier mobile primary nav (below lg). */}
        <SupplierMobileBottomNav />

        <FirstUseModal />
      </div>
    </GuidedHelpProvider>
  )
}

export default function SupplierAppShell({
  children,
  workspaceId = null,
  teamMemberCount = 1,
  planType,
}: {
  children: React.ReactNode
  workspaceId?: string | null
  teamMemberCount?: number
  planType?: SupplierPlanType
}) {
  return (
    <SupplierWorkspaceProvider workspaceId={workspaceId}>
      <SupplierPlanProvider seedPlanType={planType} seedMemberCount={teamMemberCount}>
        <SupplierShellChrome>{children}</SupplierShellChrome>
      </SupplierPlanProvider>
    </SupplierWorkspaceProvider>
  )
}
