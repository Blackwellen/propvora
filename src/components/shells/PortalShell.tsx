"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Building2,
  Home,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react"

// ============================================================================
// PortalShell — the thin external shell for magic-link users.
//
// Deliberately minimal: workspace name + portal-type badge + a sign-out form
// that POSTs to /api/portal/logout. NO app navigation, NO workspace switcher,
// NO links outside /portal/{sessionId}/*. All nav hrefs are built from the
// session id so they can't point at another session.
// ============================================================================

export type PortalKind = "supplier" | "landlord" | "tenant"

interface NavItem {
  label: string
  segment: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV: Record<PortalKind, NavItem[]> = {
  supplier: [
    { label: "Dashboard", segment: "", icon: LayoutDashboard },
    { label: "Jobs", segment: "jobs", icon: Wrench },
    { label: "Invoices", segment: "invoices", icon: FileText },
  ],
  landlord: [
    { label: "Dashboard", segment: "", icon: LayoutDashboard },
    { label: "Properties", segment: "properties", icon: Building2 },
  ],
  tenant: [
    { label: "Dashboard", segment: "", icon: LayoutDashboard },
    { label: "Tenancy", segment: "tenancy", icon: Home },
    { label: "Requests", segment: "maintenance", icon: ClipboardList },
  ],
}

const BADGE: Record<PortalKind, string> = {
  supplier: "SUPPLIER",
  landlord: "LANDLORD",
  tenant: "TENANT",
}

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "PV"
  )
}

export default function PortalShell({
  sessionId,
  kind,
  workspaceName,
  displayName,
  children,
}: {
  sessionId: string
  kind: PortalKind
  workspaceName: string
  displayName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const base = `/portal/${sessionId}/${kind}`
  const items = NAV[kind]

  function hrefFor(segment: string) {
    return segment ? `${base}/${segment}` : base
  }
  function isActive(segment: string) {
    const href = hrefFor(segment)
    return segment ? pathname.startsWith(href) : pathname === base
  }

  return (
    <div className="min-h-screen bg-[#F6FAFF] flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col bg-[#0D1B2A]",
          "transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2 h-16 px-4 border-b border-white/10 shrink-0">
          <div className="relative h-7 w-[128px] shrink-0">
            <Image
              src="/propvora-logo-white.png"
              alt="Propvora"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <span className="ml-1 px-1.5 py-0.5 bg-[#0EA5E9]/20 text-[#38bdf8] text-[10px] font-semibold rounded shrink-0">
            {BADGE[kind]}
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto p-1 rounded text-white/60 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.segment)
            return (
              <Link
                key={item.segment || "home"}
                href={hrefFor(item.segment)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  "text-[#94A3B8] hover:text-white hover:bg-white/10",
                  active && "text-white bg-[#1E3A5F]"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-white/10 px-2 py-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initialsOf(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-[11px] text-[#64748B] truncate">{workspaceName}</p>
            </div>
            <form method="POST" action="/api/portal/logout">
              <button
                type="submit"
                className="p-1 rounded text-[#64748B] hover:text-red-400 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-700 truncate">
            {workspaceName}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[11px] font-semibold">
            {BADGE[kind]} PORTAL
          </span>
        </header>
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
