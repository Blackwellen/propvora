"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUnreadMessagesCount } from "@/hooks/useMessages"
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
  Store,
  ListChecks,
  Workflow,
  Settings,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  HandCoins,
  MessageSquareMore,
  CreditCard,
  LifeBuoy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import ShellLogo from "./ShellLogo"
import NavItem from "./NavItem"
import NavSection from "./NavSection"

const MANAGER_BASE = "/property-manager"

/** A workspace-agnostic nav config so the same chrome serves operator, supplier,
 *  etc. When omitted, SideNavigation falls back to the Property Manager config. */
export interface ShellNavItem {
  label: string
  href: string
  icon: React.ElementType
  /** When set, the item is only shown if navFlags[flag] === true (V2/V1.5 gating). */
  flag?: string
  /** When set, a live count badge is rendered for this item. "messagesUnread" → workspace unread messages. */
  badgeKey?: "messagesUnread"
}
export interface ShellNavGroup {
  label: string
  items: ShellNavItem[]
}
export interface ShellNavConfig {
  /** Home/root href — active-detected by exact match (not prefix). */
  base: string
  groups: ShellNavGroup[]
  /** Bottom workspace card destination. */
  workspaceHref: string
  /** Bottom account card destination. */
  accountHref: string
}

interface SideNavigationProps {
  collapsed: boolean
  onToggle: () => void
  /** Called when a nav link is followed — used to close the mobile drawer. */
  onNavigate?: () => void
  /** Optional workspace nav config; defaults to the Property Manager menu. */
  navConfig?: ShellNavConfig
  /** Server-resolved feature flags; items tagged with a `flag` are hidden when off. */
  navFlags?: Record<string, boolean>
  /** Optional workspace brand logo URL; falls back to Propvora logo when not set. */
  brandLogoUrl?: string | null
}

const NAV_GROUPS: ShellNavGroup[] = [
  {
    label: "OVERVIEW",
    items: [{ label: "Home", href: MANAGER_BASE, icon: LayoutDashboard }],
  },
  {
    label: "CORE",
    items: [
      { label: "Portfolio",  href: `${MANAGER_BASE}/portfolio`,   icon: Building2 },
      { label: "Work",       href: `${MANAGER_BASE}/work`,        icon: Briefcase },
      // Bookings/Listings are V2 direct-booking surfaces — hidden until flagged on.
      { label: "Bookings",   href: `${MANAGER_BASE}/bookings`,    icon: Calendar, flag: "bookingManagement" },
      { label: "Listings",   href: `${MANAGER_BASE}/listings`,    icon: ListChecks, flag: "directBookingPages" },
      // Suppliers hub — PM's own supplier network (directory, compliance, performance).
      // Marketplace procurement tab is a secondary action inside the hub page itself.
      { label: "Suppliers",  href: `${MANAGER_BASE}/suppliers`, icon: Store, flag: "marketplaceEnabled" },
      { label: "Planning",   href: `${MANAGER_BASE}/planning`,   icon: Map, flag: "planningEnabled" },
      { label: "Contacts",   href: `${MANAGER_BASE}/contacts`,    icon: Users },
      { label: "Portals",    href: `${MANAGER_BASE}/portals`,     icon: MessageSquareMore },
      { label: "Messages",   href: `${MANAGER_BASE}/messages`,    icon: MessageSquare, badgeKey: "messagesUnread" },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { label: "Money", href: `${MANAGER_BASE}/money`, icon: Wallet },
      // Full double-entry GL — V2; Money basics cover V1. Hidden until flagged on.
      { label: "Accounting", href: `${MANAGER_BASE}/accounting`, icon: Calculator, flag: "accountingGl" },
      // Affiliate programme — shown only when the feature is enabled for this workspace.
      { label: "Affiliate", href: `${MANAGER_BASE}/affiliates`, icon: HandCoins, flag: "affiliateEnabled" },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Calendar", href: `${MANAGER_BASE}/calendar`, icon: Calendar },
      { label: "Compliance", href: `${MANAGER_BASE}/compliance`, icon: ShieldCheck },
      // Legal (HMO licences, EPC, possession, RRA 2026) — its own nav location under
      // Compliance. V1 operational kill-switch (legalSection), default ON.
      { label: "Legal", href: `${MANAGER_BASE}/legal`, icon: Scale, flag: "legalSection" },
      // Automations-lite (presets) is V1.5 under canvasLite; full canvas is automationsFull.
      { label: "Automations", href: `${MANAGER_BASE}/automations`, icon: Workflow, flag: "canvasLite" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Workspace", href: `${MANAGER_BASE}/workspace-settings`, icon: Settings },
      { label: "Billing", href: `${MANAGER_BASE}/workspace/billing`, icon: CreditCard },
      { label: "Help & Support", href: `${MANAGER_BASE}/help`, icon: LifeBuoy, flag: "helpCentre" },
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

/** Map the workspace subscription state to a compact pill. Returns null for a
 *  healthy active/free plan (no pill shown). "warn" = amber, "alert" = red. */
function resolveSubState(
  planStatus: string | null,
  trialEndsAt: string | null,
): { label: string; tone: "warn" | "alert" } | null {
  const status = (planStatus ?? "").toLowerCase()
  if (status === "past_due" || status === "unpaid") return { label: "Payment due", tone: "alert" }
  if (status === "canceled" || status === "cancelled") return { label: "Cancelled", tone: "alert" }
  if (status === "suspended") return { label: "Suspended", tone: "alert" }
  if (status === "trialing" || status === "trial") {
    if (trialEndsAt) {
      const days = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000)
      if (Number.isFinite(days)) {
        if (days <= 0) return { label: "Trial ended", tone: "alert" }
        return { label: `Trial · ${days}d left`, tone: days <= 3 ? "alert" : "warn" }
      }
    }
    return { label: "Trial", tone: "warn" }
  }
  return null
}

export default function SideNavigation({
  collapsed,
  onToggle,
  onNavigate,
  navConfig,
  navFlags,
  brandLogoUrl,
}: SideNavigationProps) {
  const pathname = usePathname()
  const { workspace } = useWorkspace()
  // Live workspace unread-message count for the Messages nav badge.
  const messagesUnread = useUnreadMessagesCount(workspace?.id)

  // Resolve the active workspace config (defaults to Property Manager).
  const base = navConfig?.base ?? MANAGER_BASE
  const rawGroups: ShellNavGroup[] = navConfig?.groups ?? NAV_GROUPS
  // Menu Builder: modules the workspace owner has hidden via Workspace Settings →
  // Navigation. Matched by the nav item's href trailing segment (e.g. /work → "work").
  const hiddenModules = new Set(workspace?.settings?.nav?.hiddenModules ?? [])
  const moduleKeyOf = (href: string) => href.split("/").filter(Boolean).pop() ?? ""
  // Flag gating: drop items tagged with a `flag` that isn't enabled in navFlags,
  // then drop any module hidden by the Menu Builder, then drop any group left
  // empty. With all V2/V1.5 flags off (default) this hides Bookings, Listings,
  // Accounting (full GL) and Automations from V1.
  const groups: ShellNavGroup[] = rawGroups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => (!i.flag || navFlags?.[i.flag] === true) && !hiddenModules.has(moduleKeyOf(i.href)),
      ),
    }))
    .filter((g) => g.items.length > 0)
  const workspaceHref = navConfig?.workspaceHref ?? `${MANAGER_BASE}/workspace-settings`
  const accountHref = navConfig?.accountHref ?? `${MANAGER_BASE}/account`
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
  // Real subscription-state pill (no fabricated states) — driven by the workspace
  // plan_status/trial_ends_at resolved server-side. Returns null for a healthy
  // active/free plan so the card stays clean.
  const subState = resolveSubState(workspace?.plan_status ?? null, workspace?.trial_ends_at ?? null)

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
      <ShellLogo collapsed={collapsed} brandLogoUrl={brandLogoUrl} />

      {/* Nav scroll area */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden py-2">
        {groups.map((group) => (
          <NavSection
            key={group.label}
            label={group.label}
            collapsed={collapsed}
          >
            {group.items.map((item) => {
              const active =
                item.href === base
                  ? pathname === base
                  : pathname.startsWith(item.href)
              return (
                <NavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  collapsed={collapsed}
                  active={active}
                  onClick={onNavigate}
                  badge={item.badgeKey === "messagesUnread" ? messagesUnread : undefined}
                />
              )
            })}
          </NavSection>
        ))}
      </nav>

      {/* Bottom section: workspace + account cards */}
      <div className="shrink-0 p-3 border-t border-white/[0.08]">
        {/* Workspace card — live workspace, links to workspace settings */}
        {!collapsed && (
          <Link
            href={workspaceHref}
            onClick={onNavigate}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.10] mb-2 hover:bg-white/[0.09] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60"
            title="Workspace settings"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[#0EA5E9] flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-white leading-tight truncate">{workspaceName}</p>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <p className="text-[10px] text-[#8EA9D8] truncate">{planLabel}</p>
                {subState && (
                  <span
                    className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-semibold leading-none"
                    style={
                      subState.tone === "alert"
                        ? { background: "rgba(248,113,113,0.18)", color: "#FCA5A5" }
                        : { background: "rgba(251,191,36,0.18)", color: "#FCD34D" }
                    }
                  >
                    {subState.label}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#8EA9D8] shrink-0" />
          </Link>
        )}

        {/* Account card — live user, links to account settings */}
        <Link
          href={accountHref}
          onClick={onNavigate}
          title="Account settings"
          className={cn(
            "flex items-center gap-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.09] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60",
            collapsed ? "px-2 py-2 justify-center" : "px-3 py-2.5"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand)] to-[#0EA5E9] flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-sm">
            {initialsOf(user.name)}
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
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-2 flex items-center gap-2 w-full min-h-[40px] rounded-xl px-3 py-2 text-[#8EA9D8] hover:text-white hover:bg-white/[0.07] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60 motion-reduce:transition-none",
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
