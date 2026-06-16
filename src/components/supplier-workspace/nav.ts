import {
  LayoutDashboard,
  Inbox,
  Wrench,
  CalendarDays,
  CalendarClock,
  Hammer,
  Package,
  FileText,
  MessagesSquare,
  Images,
  ReceiptText,
  Wallet,
  Star,
  Users,
  MapPin,
  ShieldCheck,
  FileBadge,
  AlertTriangle,
  Settings,
  Store,
  UserCircle,
  Workflow,
  Bell,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier WORKSPACE navigation — single source of truth shared by the
   desktop sidebar (SupplierWorkspaceShell) and the dedicated mobile bottom
   nav / "More" sheet. First-class supplier-type workspace (NOT the V1 invited
   supplier-portal at /supplier-portal).

   Grouped into sections for the desktop sidebar; the mobile bar surfaces the 4
   highest-frequency destinations and routes everything else through "More".

   Team item is conditional: solo suppliers (1 member) don't need the Team
   section. Use `buildSupplierNavGroups(teamMemberCount)` when you need to
   inject it dynamically; SUPPLIER_NAV_GROUPS omits Team for mobile/fallback.
─────────────────────────────────────────────────────────────────────────── */

export interface SupplierNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Short label used on the compact mobile bottom bar. */
  short?: string
  /** Optional badge count rendered next to the label (Team member count). */
  badge?: number
}

export interface SupplierNavGroup {
  label: string
  items: SupplierNavItem[]
}

/** Base nav groups WITHOUT the Team item (used by mobile nav and as a base). */
export const SUPPLIER_NAV_GROUPS: SupplierNavGroup[] = [
  {
    label: "Work",
    items: [
      { label: "Dashboard", href: "/supplier", icon: LayoutDashboard, short: "Home" },
      { label: "Leads & requests", href: "/supplier/leads", icon: Inbox, short: "Leads" },
      { label: "Jobs", href: "/supplier/jobs", icon: Wrench, short: "Jobs" },
      { label: "Calendar", href: "/supplier/calendar", icon: CalendarDays, short: "Calendar" },
      { label: "Availability", href: "/supplier/availability", icon: CalendarClock, short: "Hours" },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { label: "Services", href: "/supplier/services", icon: Hammer, short: "Services" },
      { label: "Packages", href: "/supplier/packages", icon: Package, short: "Packages" },
      { label: "Quotes", href: "/supplier/quotes", icon: FileText, short: "Quotes" },
      { label: "Coverage areas", href: "/supplier/coverage", icon: MapPin, short: "Coverage" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { label: "Messages", href: "/supplier/messages", icon: MessagesSquare, short: "Inbox" },
      { label: "Notifications", href: "/supplier/notifications", icon: Bell, short: "Alerts" },
      { label: "Evidence", href: "/supplier/evidence", icon: Images, short: "Evidence" },
      { label: "Automations", href: "/supplier/automations", icon: Workflow, short: "Auto" },
      { label: "Disputes", href: "/supplier/disputes", icon: AlertTriangle, short: "Disputes" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Earnings", href: "/supplier/earnings", icon: TrendingUp, short: "Earnings" },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Invoices", href: "/supplier/invoices", icon: ReceiptText, short: "Invoices" },
      { label: "Payouts", href: "/supplier/payouts", icon: Wallet, short: "Payouts" },
    ],
  },
  {
    label: "Trust",
    items: [
      { label: "Reviews", href: "/supplier/reviews", icon: Star, short: "Reviews" },
      { label: "Verification", href: "/supplier/verification", icon: ShieldCheck, short: "Verify" },
      { label: "Insurance & licences", href: "/supplier/insurance", icon: FileBadge, short: "Insurance" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Marketplace", href: "/supplier/marketplace", icon: Store, short: "Listing" },
      { label: "Profile", href: "/supplier/profile", icon: UserCircle, short: "Profile" },
      { label: "Settings", href: "/supplier/settings", icon: Settings, short: "Settings" },
    ],
  },
]

/**
 * Build the desktop sidebar nav groups with optional Team item injection.
 *
 * @param teamMemberCount - total workspace_members for this workspace (from
 *   the server layout). When > 1 a "Team" item is inserted into the Account
 *   group with a member-count badge. Solo suppliers (1 member) see no Team
 *   section since there's nothing to manage.
 */
export function buildSupplierNavGroups(teamMemberCount = 1): SupplierNavGroup[] {
  return SUPPLIER_NAV_GROUPS.map((group) => {
    if (group.label !== "Account") return group
    const teamItem: SupplierNavItem | null =
      teamMemberCount > 1
        ? { label: "Team", href: "/supplier/team", icon: Users, short: "Team", badge: teamMemberCount }
        : null
    return {
      ...group,
      items: teamItem
        ? [
            ...group.items.filter((i) => i.href !== "/supplier/settings"),
            teamItem,
            group.items.find((i) => i.href === "/supplier/settings")!,
          ]
        : group.items,
    }
  })
}

/** Flat list of every nav item (search, active-detection, mobile "More"). */
export const SUPPLIER_NAV: SupplierNavItem[] = SUPPLIER_NAV_GROUPS.flatMap((g) => g.items)

function find(href: string): SupplierNavItem {
  const item = SUPPLIER_NAV.find((i) => i.href === href)
  if (!item) throw new Error(`SUPPLIER_NAV missing ${href}`)
  return item
}

/** The four primary destinations shown directly on the mobile bottom bar. */
export const SUPPLIER_PRIMARY: SupplierNavItem[] = [
  find("/supplier"),
  find("/supplier/leads"),
  find("/supplier/jobs"),
  find("/supplier/quotes"),
]

/** Everything else, reachable from the mobile "More" sheet (grouped). */
export const SUPPLIER_MORE_GROUPS: SupplierNavGroup[] = SUPPLIER_NAV_GROUPS.map((g) => ({
  label: g.label,
  items: g.items.filter((i) => !SUPPLIER_PRIMARY.some((p) => p.href === i.href)),
})).filter((g) => g.items.length > 0)

/** Flat "More" list (back-compat for any flat consumer). */
export const SUPPLIER_MORE: SupplierNavItem[] = SUPPLIER_MORE_GROUPS.flatMap((g) => g.items)

export function isSupplierNavActive(pathname: string, href: string): boolean {
  return href === "/supplier" ? pathname === "/supplier" : pathname.startsWith(href)
}
