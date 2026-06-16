"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  SUPPLIER_NAV_GROUPS,
  isSupplierNavActive,
} from "@/components/supplier-workspace/nav"
import { LogOut, Menu, X } from "lucide-react"

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SW"
  )
}

export default function SupplierWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("Supplier")

  useEffect(() => {
    let active = true
    const supabase = createClient()
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !active) return

        // Get user's first workspace
        const { data: member } = await supabase
          .from("workspace_members")
          .select("workspace_id, workspaces(name)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle()

        if (active && member) {
          const ws = member as { workspace_id: string; workspaces?: { name?: string } | null }
          const name = ws.workspaces?.name
          if (name) setWorkspaceName(name)
        }
      } catch {
        // silently fail
      }
    })()
    return () => { active = false }
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 h-16 px-4 border-b border-white/10 shrink-0">
        <div className="relative h-8 w-[140px] shrink-0">
          <Image
            src="/propvora-logo-white.png"
            alt="Propvora"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        <span className="ml-1 px-1.5 py-0.5 bg-[#0EA5E9]/20 text-[#38bdf8] text-[9px] font-semibold rounded shrink-0 leading-tight">
          SUPPLIER<br />WORKSPACE
        </span>
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="lg:hidden ml-auto p-2 rounded text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav groups */}
      <nav aria-label="Supplier workspace navigation" className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {SUPPLIER_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#4A6080]">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = isSupplierNavActive(pathname ?? "", item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                      "text-[#94A3B8] hover:text-white hover:bg-white/8",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A]",
                      isActive && "text-white bg-[#1E3A5F]"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User / Sign out */}
      <div className="shrink-0 border-t border-white/10 px-2 py-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initialsOf(workspaceName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{workspaceName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded text-[#64748B] hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#F6FAFF] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Supplier workspace sidebar"
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col bg-[#0D1B2A]",
          "transition-transform duration-250 motion-reduce:transition-none lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-700">Supplier Workspace</span>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
          className="flex-1 min-w-0 overflow-x-hidden px-4 md:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto w-full focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
