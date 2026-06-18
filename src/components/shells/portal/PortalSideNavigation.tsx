"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import ShellLogo from "@/components/shell/ShellLogo"
import NavItem from "@/components/shell/NavItem"
import NavSection from "@/components/shell/NavSection"
import type { PortalKind, PortalNavGroup } from "./portal-nav"

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "PV"
}

const BADGE: Record<PortalKind, string> = { supplier: "SUPPLIER", landlord: "LANDLORD", tenant: "TENANT" }

/**
 * PortalSideNavigation — the external-portal sidebar, 1:1 with the operator /
 * supplier workspace SideNavigation (same floating navy panel, same ShellLogo /
 * NavSection / NavItem rows, same collapse). It carries NO auth coupling: the
 * bottom cards show the portal contact + a sign-out (POST /api/portal/logout)
 * instead of the workspace/account cards, and every href is scoped to this
 * session so it can never point at another portal.
 */
export default function PortalSideNavigation({
  base,
  kind,
  groups,
  workspaceName,
  displayName,
  collapsed,
  onToggle,
  onNavigate,
  fixed = true,
}: {
  base: string
  kind: PortalKind
  groups: PortalNavGroup[]
  workspaceName: string
  displayName: string
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
  /** Fixed floating panel (desktop) vs. static fill for the mobile drawer. */
  fixed?: boolean
}) {
  const pathname = usePathname()
  const hrefFor = (segment: string) => (segment ? `${base}/${segment}` : base)
  const isActive = (segment: string) => {
    const href = hrefFor(segment)
    return segment ? pathname.startsWith(href) : pathname === base
  }

  const panelStyle: React.CSSProperties = fixed
    ? {
        position: "fixed", left: 16, top: 16, bottom: 16, width: collapsed ? 76 : 200, zIndex: 30,
        borderRadius: 28, transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }
    : { position: "relative", width: "100%", height: "100%", borderRadius: 0 }

  return (
    <aside
      style={{
        ...panelStyle,
        background:
          "radial-gradient(circle at 30% 0%, rgba(14, 165, 233, 0.22) 0%, transparent 32%), linear-gradient(180deg, #020617 0%, #06142E 45%, #071B4D 100%)",
        border: "1px solid rgba(147, 197, 253, 0.18)",
        boxShadow: fixed ? "0 24px 70px rgba(2, 6, 23, 0.38)" : "none",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ShellLogo collapsed={collapsed} />

      <nav aria-label="Primary" className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden py-2">
        {groups.map((group) => (
          <NavSection key={group.label} label={group.label} collapsed={collapsed}>
            {group.items.map((item) => (
              <NavItem
                key={item.segment || "home"}
                label={item.label}
                href={hrefFor(item.segment)}
                icon={item.icon}
                collapsed={collapsed}
                active={isActive(item.segment)}
                onClick={onNavigate}
              />
            ))}
          </NavSection>
        ))}
      </nav>

      <div className="shrink-0 p-3 border-t border-white/[0.08]">
        {/* Portal/workspace info card (static — external user can't switch) */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.10] mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center shrink-0 shadow-sm text-white text-[10px] font-bold">
              {BADGE[kind].slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-white leading-tight truncate">{workspaceName}</p>
              <p className="text-[10px] text-[#8EA9D8] mt-0.5 truncate">{BADGE[kind]} portal</p>
            </div>
          </div>
        )}

        {/* Contact identity card */}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.10]",
            collapsed ? "px-2 py-2 justify-center" : "px-3 py-2.5"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-sm relative">
            {initialsOf(displayName)}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#06142E]" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-white leading-tight truncate">{displayName}</p>
              <p className="text-[10px] text-[#8EA9D8] truncate">Signed in via secure link</p>
            </div>
          )}
        </div>

        {/* Sign out */}
        <form method="POST" action="/api/portal/logout" className="mt-2">
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className={cn(
              "flex items-center gap-2 w-full min-h-[40px] rounded-xl px-3 py-2 text-[#8EA9D8] hover:text-red-300 hover:bg-white/[0.07] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60 motion-reduce:transition-none",
              collapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-[12px] font-medium">Sign out</span>}
          </button>
        </form>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-1 flex items-center gap-2 w-full min-h-[40px] rounded-xl px-3 py-2 text-[#8EA9D8] hover:text-white hover:bg-white/[0.07] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60 motion-reduce:transition-none",
            collapsed ? "justify-center" : ""
          )}
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : (<><ChevronsLeft className="w-4 h-4" /><span className="text-[12px] font-medium">Collapse</span></>)}
        </button>
      </div>
    </aside>
  )
}
