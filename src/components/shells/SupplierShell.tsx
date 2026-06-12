"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { resolveSupplierContext } from "@/app/(supplier)/supplier-portal/_lib/supplier-context"
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"

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

const supplierNav = [
  { label: "Dashboard", href: "/supplier-portal",            icon: LayoutDashboard },
  { label: "Jobs",      href: "/supplier-portal/jobs",       icon: Wrench },
  { label: "Invoices",  href: "/supplier-portal/invoices",   icon: FileText },
  { label: "Settings",  href: "/supplier-portal/settings",   icon: Settings },
]

export default function SupplierShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [supplierName, setSupplierName] = useState("Supplier")

  useEffect(() => {
    let active = true
    resolveSupplierContext()
      .then((ctx) => {
        if (active && ctx?.displayName) setSupplierName(ctx.displayName)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
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
          "transition-transform duration-250 lg:translate-x-0",
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
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {supplierNav.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === "/supplier-portal"
                ? pathname === "/supplier-portal"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  "text-[#94A3B8] hover:text-white hover:bg-white/8",
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
              {initialsOf(supplierName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{supplierName}</p>
            </div>
            <button onClick={handleSignOut} className="p-1 rounded text-[#64748B] hover:text-red-400 transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-700">Supplier Portal</span>
        </header>
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto w-full bg-[#F6FAFF]">
          {children}
        </main>
      </div>
    </div>
  )
}
