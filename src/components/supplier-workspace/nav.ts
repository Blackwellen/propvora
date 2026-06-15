import {
  LayoutDashboard,
  UserCircle,
  Store,
  FileText,
  Wrench,
  Wallet,
  Star,
  type LucideIcon,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Supplier WORKSPACE navigation — single source of truth shared by the
   desktop sidebar (SupplierWorkspaceShell) and the dedicated mobile bottom
   nav / "More" sheet. This is the first-class supplier-type workspace, NOT the
   V1 invited supplier-portal (/supplier-portal) — that is left untouched.
─────────────────────────────────────────────────────────────────────────── */

export interface SupplierNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Short label used on the compact mobile bottom bar. */
  short?: string
}

export const SUPPLIER_NAV: SupplierNavItem[] = [
  { label: "Dashboard", href: "/supplier", icon: LayoutDashboard, short: "Home" },
  { label: "Profile", href: "/supplier/profile", icon: UserCircle, short: "Profile" },
  { label: "Marketplace", href: "/supplier/marketplace", icon: Store, short: "Listings" },
  { label: "Quotes", href: "/supplier/quotes", icon: FileText, short: "Quotes" },
  { label: "Jobs", href: "/supplier/jobs", icon: Wrench, short: "Jobs" },
  { label: "Earnings", href: "/supplier/earnings", icon: Wallet, short: "Earnings" },
  { label: "Reviews", href: "/supplier/reviews", icon: Star, short: "Reviews" },
]

/** The four primary destinations shown directly on the mobile bottom bar. */
export const SUPPLIER_PRIMARY: SupplierNavItem[] = [
  SUPPLIER_NAV[0], // Dashboard
  SUPPLIER_NAV[4], // Jobs
  SUPPLIER_NAV[3], // Quotes
]

/** Everything reachable from the mobile "More" sheet. */
export const SUPPLIER_MORE: SupplierNavItem[] = [
  SUPPLIER_NAV[1], // Profile
  SUPPLIER_NAV[2], // Marketplace
  SUPPLIER_NAV[5], // Earnings
  SUPPLIER_NAV[6], // Reviews
]

export function isSupplierNavActive(pathname: string, href: string): boolean {
  return href === "/supplier" ? pathname === "/supplier" : pathname.startsWith(href)
}
