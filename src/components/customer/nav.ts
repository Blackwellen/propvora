import {
  LayoutDashboard,
  CalendarCheck,
  MessageSquare,
  Bell,
  CreditCard,
  ShoppingBag,
  Heart,
  UserCircle,
  type LucideIcon,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Customer WORKSPACE navigation — single source of truth shared by the desktop
   sidebar (CustomerShell) and the dedicated mobile bottom nav / "More" sheet.

   This is the first-class customer/guest-type workspace where a buyer manages
   their bookings, marketplace orders, saved listings, messages and profile.

   URLs are the PUBLIC `/user/*` paths (next.config rewrites `/user/*` →
   `/customer/*` internally). Per-trip surfaces (trip details, check-in, house
   rules, documents, reviews, support) live as INTERNAL TABS on the booking
   detail page — they are not top-level nav, which keeps the workspace focused
   rather than bloated with one route per booking sub-section.
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
  { label: "Messages", href: "/user/messages", icon: MessageSquare, short: "Inbox" },
  { label: "Notifications", href: "/user/notifications", icon: Bell, short: "Alerts" },
  { label: "Payments", href: "/user/payments", icon: CreditCard, short: "Pay" },
  { label: "Orders", href: "/user/orders", icon: ShoppingBag, short: "Orders" },
  { label: "Saved", href: "/user/saved", icon: Heart, short: "Saved" },
  { label: "Profile", href: "/user/profile", icon: UserCircle, short: "Profile" },
]

/** The three primary destinations shown directly on the mobile bottom bar. */
export const CUSTOMER_PRIMARY: CustomerNavItem[] = [
  CUSTOMER_NAV[0], // Dashboard
  CUSTOMER_NAV[1], // Bookings
  CUSTOMER_NAV[2], // Messages
]

/** Everything reachable from the mobile "More" sheet. */
export const CUSTOMER_MORE: CustomerNavItem[] = [
  ...CUSTOMER_NAV.slice(3),
]

export function isCustomerNavActive(pathname: string, href: string): boolean {
  return href === "/user" ? pathname === "/user" : pathname.startsWith(href)
}
