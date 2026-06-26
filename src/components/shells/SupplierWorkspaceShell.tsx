"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import SkipLink from "@/components/a11y/SkipLink"
import { LogOut, Menu, X, LifeBuoy } from "lucide-react"
import { supplierNavGroupsForPlan, isSupplierNavActive } from "@/components/supplier-workspace/nav"
import SupplierMobileBottomNav from "@/components/supplier-workspace/SupplierMobileNav"
import { SupplierWorkspaceProvider } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import {
  SupplierPlanProvider,
  useSupplierPlan,
  type SupplierPlanType,
} from "@/components/supplier-workspace/useSupplierPlan"
import SupplierNotificationBell from "@/components/supplier-workspace/SupplierNotificationBell"
import SupplierGlobalSearch from "@/components/supplier-workspace/SupplierGlobalSearch"
import { WorkspaceSwitcher } from "@/components/shell/TopNavigation"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierWorkspaceShell — chrome for the first-class supplier-type workspace.

   Styling parity with the Property Manager AppShell / SideNavigation: a deep
   navy ROUNDED sidebar PANEL that floats over a #F6FAFF workspace, one-word
   group headers, account/workspace cards at the bottom, white top bar.

   The nav is PLAN-GATED (Solo vs Team) — see nav.ts.
─────────────────────────────────────────────────────────────────────────── */

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SP"
  )
}

function SupplierSidebarInner({
  supplierName,
  onNavigate,
  onSignOut,
}: {
  supplierName: string
  onNavigate: () => void
  onSignOut: () => void
}) {
  const pathname = usePathname()
  const { planType, memberCount } = useSupplierPlan()
  const navGroups = supplierNavGroupsForPlan(planType, { memberCount })
  const planLabel = planType === "team" ? "Team plan" : "Solo plan"

  return (
    <>
      <nav aria-label="Supplier workspace" className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden px-3 py-3 space-y-3">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#5B7299]">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = isSupplierNavActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 motion-reduce:transition-none",
                    "text-[#8EA9D8] hover:text-white hover:bg-white/[0.07]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60",
                    isActive && "text-white bg-white/[0.10] shadow-sm"
                  )}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && item.badge > 1 && (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#0EA5E9]/20 text-[#38BDF8] text-[10px] font-semibold tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: workspace + account cards (PM parity). */}
      <div className="shrink-0 p-3 border-t border-white/[0.08]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.10] mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center shrink-0 shadow-sm text-white text-[12px] font-bold">
            {initialsOf(supplierName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-white leading-tight truncate">{supplierName}</p>
            <p className="text-[10px] text-[#8EA9D8] mt-0.5 truncate">{planLabel}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-lg text-[#8EA9D8] hover:text-red-400 hover:bg-white/[0.07] transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}

export default function SupplierWorkspaceShell({
  children,
  supplierName = "Supplier",
  workspaceId = null,
  teamMemberCount = 1,
  planType,
  brandLogoUrl,
}: {
  children: React.ReactNode
  supplierName?: string
  workspaceId?: string | null
  teamMemberCount?: number
  planType?: SupplierPlanType
  /** Optional workspace brand logo; falls back to Propvora logo when not set. */
  brandLogoUrl?: string | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign("/login")
  }

  return (
    <SupplierWorkspaceProvider workspaceId={workspaceId}>
      <SupplierPlanProvider seedPlanType={planType} seedMemberCount={teamMemberCount}>
        <div className="min-h-screen bg-[#F6FAFF] flex">
          <SkipLink />
          {mobileOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Desktop sidebar — navy ROUNDED floating panel (PM parity). */}
          <aside
            aria-label="Supplier workspace sidebar"
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden",
              "transition-transform duration-250 motion-reduce:transition-none",
              "top-0 left-0 bottom-0 w-64 lg:top-4 lg:left-4 lg:bottom-4 lg:w-[232px] lg:rounded-[28px]",
              mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
            style={{
              background:
                "radial-gradient(circle at 30% 0%, rgba(14, 165, 233, 0.22) 0%, transparent 32%), linear-gradient(180deg, #020617 0%, #06142E 45%, #071B4D 100%)",
              border: "1px solid rgba(147, 197, 253, 0.18)",
              boxShadow: "0 24px 70px rgba(2, 6, 23, 0.38)",
            }}
          >
            <div className="flex items-center gap-2 h-16 px-4 border-b border-white/[0.08] shrink-0">
              <div className="relative h-8 w-[132px] shrink-0">
                <Image
                  src={brandLogoUrl ?? "/propvora-logo-white.png"}
                  alt={brandLogoUrl ? "Workspace logo" : "Propvora"}
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
              <span className="ml-1 px-1.5 py-0.5 bg-[#0EA5E9]/20 text-[#38BDF8] text-[10px] font-semibold rounded shrink-0">
                SUPPLIER
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="lg:hidden ml-auto p-2 rounded text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SupplierSidebarInner
              supplierName={supplierName}
              onNavigate={() => setMobileOpen(false)}
              onSignOut={handleSignOut}
            />
          </aside>

          <div className="flex-1 min-w-0 lg:pl-[264px] flex flex-col min-h-screen">
            <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="lg:hidden inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg hover:bg-slate-100 text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                <Menu className="w-5 h-5" />
              </button>
              <WorkspaceSwitcher />
              <div className="flex-1 flex justify-center px-2">
                <SupplierGlobalSearch />
              </div>
              <Link
                href="/supplier/help"
                className="hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Help & guides"
                aria-label="Help & guides"
              >
                <LifeBuoy className="w-4 h-4" />
              </Link>
              <SupplierNotificationBell />
            </header>

            <main
              id="main-content"
              tabIndex={-1}
              aria-label="Main content"
              className="flex-1 min-w-0 overflow-x-hidden px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 pb-24 lg:pb-8 max-w-[1400px] mx-auto w-full bg-[#F6FAFF] focus:outline-none"
            >
              {children}
            </main>
          </div>

          <SupplierMobileBottomNav />
        </div>
      </SupplierPlanProvider>
    </SupplierWorkspaceProvider>
  )
}
