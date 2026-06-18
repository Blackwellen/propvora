import {
  LayoutDashboard,
  Inbox,
  Wrench,
  Building2,
  CalendarDays,
  Hammer,
  MessagesSquare,
  MessageSquare,
  Wallet,
  Calculator,
  Star,
  ShieldCheck,
  UserCircle,
  Workflow,
  BarChart3,
  Settings,
  SlidersHorizontal,
  LifeBuoy,
  HandCoins,
  type LucideIcon,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier WORKSPACE navigation — single source of truth. The desktop sidebar
   is now the SHARED SideNavigation (via SupplierAppShell, same chrome as the
   Property Manager workspace); this config also feeds the dedicated mobile
   bottom nav / "More" sheet.

   The nav is PLAN-GATED. `plan_type` drives two distinct menus:

     • solo — flat, single-operator. One-word group headers:
         OVERVIEW(Overview) · WORK(Requests, Jobs, Calendar, Services) ·
         COMMS(Messages) · FINANCE(Finance, Accounting) ·
         CONTROL(Automations) · TRUST(Profile, Compliance) ·
         SYSTEM(Affiliate, Workspace settings)

     • team — full multi-member business:
         OVERVIEW(Overview) · WORK(Requests, Jobs, Calendar, Services) ·
         COMMS(Messages) · FINANCE(Finance, Accounting) ·
         TRUST(Compliance, Reputation) · CONTROL(Insights, Automations) ·
         SYSTEM(Account, Workspace settings, Affiliate)

   MERGED surfaces (Property-Manager-consistent): the old "Inbox" + "Messages"
   pair is now a single COMMS → Messages (the PM-ported /supplier/messages), and
   "Schedule" + "Calendar" is a single WORK → Calendar (PM-ported /supplier/
   calendar, high-level PM styling). The bespoke /supplier/inbox and /supplier/
   schedule hubs are kept (reachable by URL) for folding their extra tabs —
   notifications / availability / time-off — into the PM surfaces next.

   Help is intentionally NOT a side-nav item — it stays reachable via the
   top-bar life-buoy and global search (I.help remains in the flat list).

   Marketplace is NOT a side-nav item for either plan — its controls live inside
   Profile (Solo) / Account (Team) as a "Marketplace Preview" / "Public Listing"
   tab. The /supplier/marketplace route is kept but unlinked from the nav.
─────────────────────────────────────────────────────────────────────────── */

// Enterprise uses the same nav as Team (per the "keep current sidebar" decision);
// it's accepted here so callers can pass the workspace plan_type directly.
export type SupplierPlan = "solo" | "team" | "enterprise"

export interface SupplierNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Short label used on the compact mobile bottom bar. */
  short?: string
  /** Optional badge count rendered next to the label (e.g. Team member count). */
  badge?: number
}

export interface SupplierNavGroup {
  label: string
  items: SupplierNavItem[]
}

// ── Canonical destinations (deduped) ───────────────────────────────────────────
const I = {
  overview:   { label: "Overview",   href: "/supplier",            icon: LayoutDashboard, short: "Home" },
  requests:   { label: "Requests",   href: "/supplier/requests",   icon: Inbox,           short: "Reqs" },
  jobs:       { label: "Jobs",       href: "/supplier/jobs",       icon: Wrench,          short: "Jobs" },
  schedule:   { label: "Schedule",   href: "/supplier/schedule",   icon: CalendarDays,    short: "Plan" },
  services:   { label: "Services",   href: "/supplier/services",   icon: Hammer,          short: "Svc" },
  calendar:   { label: "Calendar",   href: "/supplier/calendar",   icon: CalendarDays,    short: "Cal" },
  inbox:      { label: "Inbox",      href: "/supplier/inbox",      icon: MessagesSquare,  short: "Inbox" },
  messages:   { label: "Messages",   href: "/supplier/messages",   icon: MessageSquare,   short: "Msgs" },
  finance:    { label: "Finance",    href: "/supplier/finance",    icon: Wallet,          short: "£" },
  accounting: { label: "Accounting", href: "/supplier/accounting", icon: Calculator,      short: "Acct" },
  profile:    { label: "Profile",    href: "/supplier/profile",    icon: UserCircle,      short: "Profile" },
  compliance: { label: "Compliance", href: "/supplier/compliance", icon: ShieldCheck,     short: "Comply" },
  reputation: { label: "Reputation", href: "/supplier/reputation", icon: Star,            short: "Rep" },
  insights:   { label: "Insights",   href: "/supplier/insights",   icon: BarChart3,       short: "Stats" },
  automations:{ label: "Automations",href: "/supplier/automations",icon: Workflow,        short: "Auto" },
  account:    { label: "Account",    href: "/supplier/account",    icon: Building2,       short: "Account" },
  settings:   { label: "Workspace settings", href: "/supplier/settings", icon: SlidersHorizontal, short: "Settings" },
  affiliate:  { label: "Affiliate",  href: "/supplier/affiliate",  icon: HandCoins,       short: "Affil" },
  help:       { label: "Help",       href: "/supplier/help",       icon: LifeBuoy,        short: "Help" },
} satisfies Record<string, SupplierNavItem>

// ── SOLO menu ───────────────────────────────────────────────────────────────────
export const SUPPLIER_NAV_GROUPS_SOLO: SupplierNavGroup[] = [
  { label: "Overview", items: [I.overview] },
  { label: "Work",     items: [I.requests, I.jobs, I.calendar, I.services] },
  { label: "Comms",    items: [I.messages] },
  { label: "Finance",  items: [I.finance, I.accounting] },
  { label: "Control",  items: [I.automations] },
  { label: "Trust",    items: [I.profile, I.compliance] },
  { label: "System",   items: [I.affiliate, I.settings] },
]

// ── TEAM menu ─────────────────────────────────────────────────────────────────
export const SUPPLIER_NAV_GROUPS_TEAM: SupplierNavGroup[] = [
  { label: "Overview", items: [I.overview] },
  { label: "Work",     items: [I.requests, I.jobs, I.calendar, I.services] },
  { label: "Comms",    items: [I.messages] },
  { label: "Finance",  items: [I.finance, I.accounting] },
  { label: "Trust",    items: [I.compliance, I.reputation] },
  { label: "Control",  items: [I.insights, I.automations] },
  { label: "System",   items: [I.account, I.settings, I.affiliate] },
]

/** Resolve the nav groups for a given plan. Optionally inject a Team badge. */
export function supplierNavGroupsForPlan(
  plan: SupplierPlan,
  opts?: { memberCount?: number }
): SupplierNavGroup[] {
  const base = plan === "solo" ? SUPPLIER_NAV_GROUPS_SOLO : SUPPLIER_NAV_GROUPS_TEAM
  const badge = opts?.memberCount && opts.memberCount > 1 ? opts.memberCount : undefined
  if (!badge || plan === "solo") return base
  return base.map((g) =>
    g.label === "System"
      ? { ...g, items: g.items.map((i) => (i.href === I.account.href ? { ...i, badge } : i)) }
      : g
  )
}

/** Back-compat: default groups (team) for any flat/legacy consumer. */
export const SUPPLIER_NAV_GROUPS: SupplierNavGroup[] = SUPPLIER_NAV_GROUPS_TEAM

/**
 * Back-compat builder used by the shell before plan resolution. Kept so older
 * imports still type-check; prefer `supplierNavGroupsForPlan`.
 */
export function buildSupplierNavGroups(teamMemberCount = 1): SupplierNavGroup[] {
  return supplierNavGroupsForPlan(teamMemberCount > 1 ? "team" : "team", {
    memberCount: teamMemberCount,
  })
}

/** Flat list of every distinct nav item (search, active-detection, mobile More). */
export const SUPPLIER_NAV: SupplierNavItem[] = Object.values(I)

/** The four primary destinations shown directly on the mobile bottom bar. */
export const SUPPLIER_PRIMARY: SupplierNavItem[] = [I.overview, I.requests, I.jobs, I.finance]

/** Mobile "More" groups for a given plan (everything not on the bottom bar). */
export function supplierMoreGroupsForPlan(plan: SupplierPlan): SupplierNavGroup[] {
  return supplierNavGroupsForPlan(plan)
    .map((g) => ({
      label: g.label,
      items: g.items.filter((i) => !SUPPLIER_PRIMARY.some((p) => p.href === i.href)),
    }))
    .filter((g) => g.items.length > 0)
}

/** Back-compat flat exports (team plan). */
export const SUPPLIER_MORE_GROUPS: SupplierNavGroup[] = supplierMoreGroupsForPlan("team")
export const SUPPLIER_MORE: SupplierNavItem[] = SUPPLIER_MORE_GROUPS.flatMap((g) => g.items)

export function isSupplierNavActive(pathname: string, href: string): boolean {
  return href === "/supplier" ? pathname === "/supplier" : pathname.startsWith(href)
}
