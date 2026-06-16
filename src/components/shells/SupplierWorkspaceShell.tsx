"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import SkipLink from "@/components/a11y/SkipLink"
import { LogOut, Menu, X, LifeBuoy } from "lucide-react"
import { buildSupplierNavGroups, isSupplierNavActive } from "@/components/supplier-workspace/nav"
import SupplierMobileBottomNav from "@/components/supplier-workspace/SupplierMobileNav"
import { SupplierWorkspaceProvider } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import SupplierNotificationBell from "@/components/supplier-workspace/SupplierNotificationBell"
import SupplierGlobalSearch from "@/components/supplier-workspace/SupplierGlobalSearch"

/* ──────────────────────────────────────────────────────────────────────────
   SupplierWorkspaceShell — chrome for the first-class supplier-type workspace
   (route group `(supplier-workspace)`). Distinct from:
     • the operator AppShell (property managers), and
     • the V1 invited supplier-portal (`SupplierShell` → /supplier-portal).

   Desktop: dark fixed sidebar (matching CustomerShell / SupplierShell tokens)
   with the full supplier section nav.
   Mobile (<lg): the sidebar is hidden and a dedicated bottom tab bar
   (SupplierMobileBottomNav) takes over — Dashboard · Jobs · Quotes · More.
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

export default function SupplierWorkspaceShell({
  children,
  supplierName = "Supplier",
  workspaceId = null,
  teamMemberCount = 1,
}: {
  children: React.ReactNode
  supplierName?: string
  /** Resolved server-side by the group layout; threaded to client pages via context. */
  workspaceId?: string | null
  /**
   * Total workspace_members for this workspace, fetched server-side by the
   * group layout. When > 1, a "Team" nav item with a member-count badge is
   * shown in the Account section. Solo suppliers (1 member) see no Team link.
   */
  teamMemberCount?: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Build nav groups dynamically so Team is only shown for team workspaces.
  const navGroups = buildSupplierNavGroups(teamMemberCount)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <SupplierWorkspaceProvider workspaceId={workspaceId}>
    <div className="min-h-screen bg-[#F6FAFF] flex">
      <SkipLink />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar (also the drawer target on tablet/landscape via the
          header hamburger; on phones the bottom nav is the primary nav). */}
      <aside
        aria-label="Supplier workspace sidebar"
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col bg-[#0D1B2A]",
          "transition-transform duration-250 motion-reduce:transition-none lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 h-16 px-4 border-b border-white/8 shrink-0">
          <div className="relative h-8 w-[148px] shrink-0">
            <Image src="/propvora-logo-white.png" alt="Propvora" fill className="object-contain object-left" priority />
          </div>
          <span className="ml-2 px-1.5 py-0.5 bg-[#0EA5E9]/20 text-[#38bdf8] text-[10px] font-semibold rounded shrink-0">
            SUPPLIER
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="lg:hidden p-2 rounded text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav aria-label="Supplier workspace" className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-0.5">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#475569]">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = isSupplierNavActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 motion-reduce:transition-none",
                      "text-[#94A3B8] hover:text-white hover:bg-white/8",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A]",
                      isActive && "text-white bg-[#1E3A5F]"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge != null && item.badge > 1 && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#0EA5E9]/20 text-[#38bdf8] text-[10px] font-semibold tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          <Link
            href="/help"
            onClick={() => setMobileOpen(false)}
            className="mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-white hover:bg-white/8 transition-all duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A]"
          >
            <LifeBuoy className="w-[18px] h-[18px] shrink-0" />
            <span>Help &amp; Guides</span>
          </Link>
        </nav>

        <div className="shrink-0 border-t border-white/8 px-2 py-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initialsOf(supplierName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{supplierName}</p>
              <p className="text-[11px] text-[#64748B] truncate">Supplier workspace</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded text-[#64748B] hover:text-red-400 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen">
        {/* Desktop/tablet header — on phones the MobileTopBar in each page +
            the bottom nav own navigation, so this slim bar is lg-only chrome
            plus a tablet hamburger to reveal the drawer. */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="lg:hidden inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg hover:bg-slate-100 text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-700 shrink-0 hidden lg:inline">Supplier Workspace</span>
          <div className="flex-1 flex justify-center px-2">
            <SupplierGlobalSearch />
          </div>
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

      {/* Dedicated mobile bottom nav (below lg only). */}
      <SupplierMobileBottomNav />
    </div>
    </SupplierWorkspaceProvider>
  )
}
