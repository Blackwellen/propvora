"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import SkipLink from "@/components/a11y/SkipLink"
import {
  LayoutDashboard,
  CalendarCheck,
  MessageSquare,
  CreditCard,
  LifeBuoy,
  LogOut,
  Menu,
  X,
} from "lucide-react"

// ============================================================================
// CustomerShell — lightweight workspace shell for the v2 customer / guest
// workspace. Mirrors the SupplierShell pattern (same dark sidebar, same a11y
// affordances) but with a customer-oriented nav.
//
// This shell is ONLY mounted behind the `customerWorkspace` feature flag (OFF
// by default), so it does not appear anywhere in V1.
// ============================================================================

const customerNav = [
  { label: "Home", href: "/customer", icon: LayoutDashboard },
  { label: "My Bookings", href: "/customer/bookings", icon: CalendarCheck },
  { label: "Messages", href: "/customer/messages", icon: MessageSquare },
  { label: "Payments", href: "/customer/payments", icon: CreditCard },
  { label: "Support", href: "/customer/support", icon: LifeBuoy },
]

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CU"
  )
}

export default function CustomerShell({
  children,
  customerName = "Customer",
}: {
  children: React.ReactNode
  customerName?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#F6FAFF] flex">
      <SkipLink />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Customer workspace sidebar"
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
            CUSTOMER
          </span>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="lg:hidden p-2 rounded text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav aria-label="Customer workspace" className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {customerNav.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === "/customer"
                ? pathname === "/customer"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 motion-reduce:transition-none",
                  "text-[#94A3B8] hover:text-white hover:bg-white/8",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A]",
                  isActive && "text-white bg-[#1E3A5F]"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-white/8 px-2 py-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#0EA5E9] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initialsOf(customerName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{customerName}</p>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded text-[#64748B] hover:text-red-400 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]" title="Sign out" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 lg:pl-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="lg:hidden inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg hover:bg-slate-100 text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-700">Customer Workspace</span>
        </header>
        <main id="main-content" tabIndex={-1} aria-label="Main content" className="flex-1 min-w-0 overflow-x-hidden px-4 md:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto w-full bg-[#F6FAFF] focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
