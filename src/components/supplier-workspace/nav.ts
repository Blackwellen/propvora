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
} from "lucide-react"

export interface SupplierNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export interface SupplierNavGroup {
  label: string
  items: SupplierNavItem[]
}

// Re-export React type so icon type resolves without importing React
import type React from "react"

export const SUPPLIER_NAV_GROUPS: SupplierNavGroup[] = [
  {
    label: "WORK",
    items: [
      { label: "Dashboard",    href: "/supplier",             icon: LayoutDashboard },
      { label: "Leads",        href: "/supplier/leads",       icon: Inbox },
      { label: "Jobs",         href: "/supplier/jobs",        icon: Wrench },
      { label: "Calendar",     href: "/supplier/calendar",    icon: CalendarDays },
      { label: "Availability", href: "/supplier/availability",icon: CalendarClock },
    ],
  },
  {
    label: "CATALOGUE",
    items: [
      { label: "Services",       href: "/supplier/services",  icon: Hammer },
      { label: "Packages",       href: "/supplier/packages",  icon: Package },
      { label: "Quotes",         href: "/supplier/quotes",    icon: FileText },
      { label: "Coverage areas", href: "/supplier/coverage",  icon: MapPin },
    ],
  },
  {
    label: "DELIVERY",
    items: [
      { label: "Messages",  href: "/supplier/messages",  icon: MessagesSquare },
      { label: "Evidence",  href: "/supplier/evidence",  icon: Images },
      { label: "Disputes",  href: "/supplier/disputes",  icon: AlertTriangle },
    ],
  },
  {
    label: "MONEY",
    items: [
      { label: "Invoices", href: "/supplier/invoices", icon: ReceiptText },
      { label: "Payouts",  href: "/supplier/payouts",  icon: Wallet },
    ],
  },
  {
    label: "TRUST",
    items: [
      { label: "Reviews",             href: "/supplier/reviews",      icon: Star },
      { label: "Verification",        href: "/supplier/verification", icon: ShieldCheck },
      { label: "Insurance & licences",href: "/supplier/insurance",    icon: FileBadge },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { label: "Marketplace", href: "/supplier/marketplace", icon: Store },
      { label: "Profile",     href: "/supplier/profile",     icon: UserCircle },
      { label: "Team",        href: "/supplier/team",        icon: Users },
      { label: "Settings",    href: "/supplier/settings",    icon: Settings },
    ],
  },
]

/** Flat list of all nav items */
export const SUPPLIER_NAV: SupplierNavItem[] = SUPPLIER_NAV_GROUPS.flatMap((g) => g.items)

/** First 4 items for a compact primary bar */
export const SUPPLIER_PRIMARY: SupplierNavItem[] = SUPPLIER_NAV.slice(0, 4)

/** All groups except WORK (for "More" overflow) */
export const SUPPLIER_MORE_GROUPS: SupplierNavGroup[] = SUPPLIER_NAV_GROUPS.slice(1)

/**
 * Returns true when `href` should be highlighted given the current `pathname`.
 * The root `/supplier` is only highlighted when pathname is exactly `/supplier`.
 */
export function isSupplierNavActive(pathname: string, href: string): boolean {
  if (href === "/supplier") return pathname === "/supplier"
  return pathname.startsWith(href)
}
