"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Map,
  Users,
  Wallet,
  Calculator,
  Calendar,
  ShieldCheck,
  Scale,
  MessageSquare,
  Globe,
  Settings,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ShellLogo from "./ShellLogo"
import NavItem from "./NavItem"
import NavSection from "./NavSection"

interface SideNavigationProps {
  collapsed: boolean
  onToggle: () => void
}

const NAV_GROUPS = [
  {
    label: "OVERVIEW",
    items: [{ label: "Home", href: "/app", icon: LayoutDashboard }],
  },
  {
    label: "CORE",
    items: [
      { label: "Portfolio", href: "/app/portfolio", icon: Building2 },
      { label: "Work", href: "/app/work", icon: Briefcase },
      { label: "Planning", href: "/app/planning", icon: Map },
      { label: "Contacts", href: "/app/contacts", icon: Users },
      { label: "Portals", href: "/app/portals", icon: Globe },
      { label: "Messages", href: "/app/messages", icon: MessageSquare },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { label: "Money", href: "/app/money", icon: Wallet },
      { label: "Accounting", href: "/app/accounting", icon: Calculator },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Calendar", href: "/app/calendar", icon: Calendar },
      { label: "Compliance", href: "/app/compliance", icon: ShieldCheck },
      { label: "Legal", href: "/app/legal", icon: Scale },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Workspace", href: "/app/workspace-settings", icon: Settings },
    ],
  },
]

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter plan",
  operator: "Operator plan",
  scale: "Scale plan",
  pro_agency: "Pro / Agency plan",
  enterprise: "Enterprise plan",
}

function initialsOf(name: string): string {
  return (
    name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "U"
  )
}

export default function SideNavigation({
  collapsed,
  onToggle,
}: SideNavigationProps) {
  const pathname = usePathname()
  const { workspace } = useWorkspace()
  const [user, setUser] = useState<{ name: string; email: string | null }>({ name: "Your account", email: null })

  // Live signed-in user for the account card (no fake placeholder data).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) return
        let name = (u.user_metadata?.display_name as string) || ""
        try {
          const { data: p } = await supabase.from("profiles").select("display_name, first_name, last_name").eq("id", u.id).maybeSingle()
          if (p) name = (p.display_name as string) || [p.first_name, p.last_name].filter(Boolean).join(" ") || name
        } catch { /* ignore */ }
        if (!name) name = u.email?.split("@")[0] ?? "Your account"
        if (!cancelled) setUser({ name, email: u.email ?? null })
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [])

  const workspaceName = workspace?.name ?? "Your workspace"
  const planLabel = workspace?.plan ? (PLAN_LABEL[workspace.plan] ?? "Active plan") : "—"

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
      {/* Logo area */}
      <ShellLogo collapsed={collapsed} />

      {/* Nav scroll area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden py-2">
        {NAV_GROUPS.map((group) => (
          <NavSection
            key={group.label}
            label={group.label}
            collapsed={collapsed}
          >
            {group.items.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.href)
              return (
                <NavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  collapsed={collapsed}
                  active={active}
                />
              )
            })}
          </NavSection>
        ))}
      </div>

      {/* Bottom section: workspace + account cards */}
      <div className="shrink-0 p-3 border-t border-white/[0.08]">
        {/* Workspace card — live workspace, links to workspace settings */}
        {!collapsed && (
          <Link
            href="/app/workspace-settings"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.10] mb-2 hover:bg-white/[0.09] transition-colors"
            title="Workspace settings"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-white leading-tight truncate">{workspaceName}</p>
              <p className="text-[10px] text-[#8EA9D8] mt-0.5 truncate">{planLabel}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#8EA9D8] shrink-0" />
          </Link>
        )}

        {/* Account card — live user, links to account settings */}
        <Link
          href="/app/account-settings"
          title="Account settings"
          className={cn(
            "flex items-center gap-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.09] transition-colors",
            collapsed ? "px-2 py-2 justify-center" : "px-3 py-2.5"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-sm relative">
            {initialsOf(user.name)}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#06142E]" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-white leading-tight truncate">{user.name}</p>
              <p className="text-[10px] text-[#8EA9D8] truncate">{user.email ?? "View account"}</p>
            </div>
          )}
        </Link>

        {/* Collapse toggle button */}
        <button
          onClick={onToggle}
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
