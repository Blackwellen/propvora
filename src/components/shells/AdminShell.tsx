"use client"

import { useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import SkipLink from "@/components/a11y/SkipLink"
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  UserCheck,
  BarChart2,
  Wrench,
  Map,
  FileText,
  ShieldCheck,
  Activity,
  Megaphone,
  Newspaper,
  Bug,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  ExternalLink,
  Shield,
  Sparkles,
} from "lucide-react"

// ─── Nav config ──────────────────────────────────────────────────────────────

const ADMIN_NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "PLATFORM",
    items: [
      { label: "Customers",     href: "/admin/customers",     icon: UserCheck },
      { label: "Users",         href: "/admin/users",         icon: Users },
      { label: "Workspaces",    href: "/admin/workspaces",    icon: Building2 },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
      { label: "Affiliates",    href: "/admin/affiliates",    icon: UserCheck },
    ],
  },
  {
    label: "DATA",
    items: [
      { label: "Portfolios", href: "/admin/portfolios", icon: BarChart2 },
      { label: "Work",       href: "/admin/work",       icon: Wrench },
      { label: "Planning",   href: "/admin/planning",   icon: Map },
    ],
  },
  {
    label: "OPS",
    items: [
      { label: "Data Requests", href: "/admin/data-requests", icon: FileText },
      { label: "Bug Reports",    href: "/admin/bugs",          icon: Bug },
      { label: "Stripe Events",  href: "/admin/stripe-events",  icon: CreditCard },
      { label: "AI Usage",       href: "/admin/ai-usage",       icon: Activity },
      { label: "AI Models",      href: "/admin/ai-models",      icon: Sparkles },
    ],
  },
  {
    label: "COMMS",
    items: [
      { label: "Changelog",     href: "/admin/changelog",     icon: Newspaper },
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Audit Log", href: "/admin/audit",     icon: FileText },
      { label: "Security",  href: "/admin/security",  icon: ShieldCheck },
      { label: "Health",    href: "/admin/health",    icon: Activity },
      { label: "Settings",  href: "/admin/settings",  icon: Settings },
    ],
  },
]

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function AdminSidebar({
  collapsed,
  onToggle,
  onSignOut,
}: {
  collapsed: boolean
  onToggle: () => void
  onSignOut: () => void
}) {
  const pathname = usePathname()

  return (
    <aside
      style={{
        position: "fixed",
        left: 16,
        top: 16,
        bottom: 16,
        width: collapsed ? 76 : 200,
        zIndex: 30,
        borderRadius: 28,
        background:
          "radial-gradient(circle at 30% 0%, rgba(14, 165, 233, 0.22) 0%, transparent 32%), linear-gradient(180deg, #020617 0%, #06142E 45%, #071B4D 100%)",
        border: "1px solid rgba(147, 197, 253, 0.18)",
        boxShadow: "0 24px 70px rgba(2, 6, 23, 0.38)",
        transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo + Admin badge */}
      <div
        className={cn(
          "flex items-center h-[72px] shrink-0",
          collapsed ? "justify-center px-0" : "px-6 gap-3"
        )}
      >
        {collapsed ? (
          <img
            src="/propvora-favicon.png"
            alt="Propvora"
            style={{ width: 36, height: 36, objectFit: "contain" }}
          />
        ) : (
          <>
            <img
              src="/propvora-logo-white.png"
              alt="Propvora"
              style={{ width: 148, height: "auto", maxHeight: 40, objectFit: "contain" }}
            />
            <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded tracking-wide shrink-0">
              ADMIN
            </span>
          </>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Admin" className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden py-2">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed ? (
              <p className="text-[10px] font-bold text-[#8EA9D8] uppercase tracking-[0.08em] px-5 mb-1.5 mt-3">
                {group.label}
              </p>
            ) : (
              <div className="h-[1px] bg-white/10 mx-3 my-2" />
            )}
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 motion-reduce:transition-none group relative mx-2 mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]",
                    collapsed ? "justify-center px-0" : "gap-3 px-3",
                    active
                      ? "bg-[rgba(37,99,235,0.26)] border border-[rgba(56,189,248,0.55)] text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                      : "text-[#DCEBFF] hover:bg-white/[0.07] hover:text-white border border-transparent"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0 transition-colors",
                      active ? "text-[#38BDF8]" : "text-[#93C5FD] group-hover:text-[#DCEBFF]"
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0F172A] text-white text-[12px] font-medium rounded-xl whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl border border-white/10">
                      {item.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: account + sign out + collapse */}
      <div className="shrink-0 p-3 border-t border-white/[0.08]">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.10]",
            collapsed ? "px-2 py-2 justify-center" : "px-3 py-2.5"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-white leading-tight truncate">Platform Admin</p>
              <p className="text-[10px] text-[#8EA9D8] truncate">Full access</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onSignOut}
              className="p-1 rounded-lg text-[#8EA9D8] hover:text-red-400 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-2 flex items-center gap-2 w-full rounded-xl px-3 py-2 text-[#8EA9D8] hover:text-white hover:bg-white/[0.07] transition-all",
            collapsed ? "justify-center" : ""
          )}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronsLeft className="w-4 h-4" />
              <span className="text-[12px] font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

// ─── Top nav ─────────────────────────────────────────────────────────────────

function AdminTopNav() {
  return (
    <header
      style={{
        height: 72,
        borderRadius: 24,
        background: "rgba(255, 255, 255, 0.94)",
        border: "1px solid #E2EAF6",
        boxShadow: "0 14px 40px rgba(15, 23, 42, 0.06)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
      className="flex items-center gap-4 px-5 mb-4 shrink-0"
    >
      {/* Left: Admin badge */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-red-50 border border-red-200">
          <Shield className="w-4 h-4 text-red-500" />
          <span className="text-[13px] font-semibold text-red-600">Admin Console</span>
        </div>
      </div>

      {/* Center spacer */}
      <div className="flex-1" />

      {/* Right: back to app */}
      <Link
        href="/app"
        className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-[#F8FBFF] border border-[#DDE8F7] text-[13px] font-medium text-[#2563EB] hover:bg-[#EBF2FF] hover:border-[#B9D2F3] transition-all"
      >
        <ExternalLink className="w-4 h-4" />
        <span>Back to App</span>
      </Link>
    </header>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin-shell-collapsed") === "true"
    }
    return false
  })

  const handleToggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem("admin-shell-collapsed", String(next))
      return next
    })
  }, [])

  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin-login")
  }

  const sideOffset = (collapsed ? 76 : 200) + 16 + 16

  return (
    <div className="h-dvh overflow-hidden" style={{ background: "#F6FAFF" }}>
      {/* Skip to main content — first focusable element (WCAG 2.4.1) */}
      <SkipLink />

      {/* Fixed sidebar — desktop */}
      <div className="hidden lg:block">
        <AdminSidebar collapsed={collapsed} onToggle={handleToggle} onSignOut={handleSignOut} />
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer — conditionally mounted (the fixed-position sidebar
          can't be hidden by a translate wrapper of auto width). */}
      {mobileOpen && (
        <div className="lg:hidden animate-[slideInLeft_0.2s_ease-out]">
          <AdminSidebar collapsed={false} onToggle={() => setMobileOpen(false)} onSignOut={handleSignOut} />
        </div>
      )}

      {/* Content column — offset for the sidebar on lg+ only; full width on
          mobile/tablet where the sidebar is a hidden drawer. */}
      <div
        className="flex flex-col h-dvh overflow-hidden transition-[padding-left] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] pl-0 lg:pl-[var(--side-offset)]"
        style={{ "--side-offset": `${sideOffset}px` } as React.CSSProperties}
      >
        {/* Top nav */}
        <div className="pt-4 pr-4 shrink-0">
          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center gap-3 mb-2 pl-4">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="w-[40px] h-[40px] rounded-xl bg-white border border-[#E2EAF6] flex items-center justify-center hover:bg-[#F0F7FF] transition-all shadow-sm"
            >
              <Menu className="w-5 h-5 text-[#071B4D]" />
            </button>
          </div>
          <AdminTopNav />
        </div>

        {/* Page content — no tabs rail */}
        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden focus:outline-none"
        >
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
