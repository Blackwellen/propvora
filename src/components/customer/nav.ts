import {
  LayoutDashboard,
  CalendarCheck,
  ShoppingBag,
  Heart,
  MessageSquare,
  UserCircle,
  CreditCard,
  KeyRound,
  ShieldCheck,
  FileText,
  LifeBuoy,
  Sparkles,
  Star,
  Headphones,
  type LucideIcon,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Customer WORKSPACE navigation — single source of truth shared by the desktop
   sidebar (CustomerShell) and the dedicated mobile bottom nav / "More" sheet.
   This is the first-class customer/guest-type workspace where a buyer manages
   their bookings, marketplace orders, saved listings, messages and profile.
─────────────────────────────────────────────────────────────────────────── */

export interface CustomerNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Short label used on the compact mobile bottom bar. */
  short?: string
}

export const CUSTOMER_NAV: CustomerNavItem[] = [
  { label: "Dashboard", href: "/user", icon: LayoutDashboard, short: "Home" },
  { label: "My Bookings", href: "/user/bookings", icon: CalendarCheck, short: "Stays" },
  { label: "Trip Details", href: "/user/trip", icon: CalendarCheck, short: "Trip" },
  { label: "Messages", href: "/user/messages", icon: MessageSquare, short: "Inbox" },
  { label: "Payments", href: "/user/payments", icon: CreditCard, short: "Pay" },
  { label: "Check-in", href: "/user/check-in", icon: KeyRound, short: "Access" },
  { label: "House Rules", href: "/user/house-rules", icon: ShieldCheck, short: "Rules" },
  { label: "Documents", href: "/user/documents", icon: FileText, short: "Docs" },
  { label: "Report Issue", href: "/user/report-issue", icon: LifeBuoy, short: "Issue" },
  { label: "Extras", href: "/user/extras", icon: Sparkles, short: "Extras" },
  { label: "Reviews", href: "/user/reviews", icon: Star, short: "Review" },
  { label: "Support", href: "/user/support", icon: Headphones, short: "Help" },
  { label: "Orders", href: "/user/orders", icon: ShoppingBag, short: "Orders" },
  { label: "Saved", href: "/user/saved", icon: Heart, short: "Saved" },
  { label: "Profile", href: "/user/profile", icon: UserCircle, short: "Profile" },
]

/** The four primary destinations shown directly on the mobile bottom bar. */
export const CUSTOMER_PRIMARY: CustomerNavItem[] = [
  CUSTOMER_NAV[0], // Dashboard
  CUSTOMER_NAV[1], // Bookings
  CUSTOMER_NAV[2], // Orders
]

/** Everything reachable from the mobile "More" sheet. */
export const CUSTOMER_MORE: CustomerNavItem[] = [
  ...CUSTOMER_NAV.slice(3),
]

export function isCustomerNavActive(pathname: string, href: string): boolean {
  return href === "/user" ? pathname === "/user" : pathname.startsWith(href)
}
