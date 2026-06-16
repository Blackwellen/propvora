import {
  LayoutDashboard,
  CalendarCheck,
  MessageSquare,
  Bell,
  CreditCard,
  ShoppingBag,
  Heart,
  UserCircle,
  Compass,
  type LucideIcon,
} from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   Customer WORKSPACE navigation — single source of truth shared by the desktop
   top-nav (CustomerShell) and the dedicated mobile bottom nav / "More" sheet.

   This is the first-class customer/guest-type workspace where a buyer manages
   their bookings, marketplace orders, saved listings, messages and profile.

   URLs are the PUBLIC `/user/*` paths (next.config rewrites `/user/*` →
   `/customer/*` internally). "Explore" is the public stay-search surface
   (/stay/search) — an external route that is still a top-level action.

   Per-trip surfaces (trip details, check-in, house rules, documents, reviews,
   support) live as INTERNAL TABS on the booking detail page — they are not
   top-level nav, which keeps the workspace focused rather than bloated.
─────────────────────────────────────────────────────────────────────────── */

export interface CustomerNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Short label used on the compact mobile bottom bar. */
  short?: string
}

/**
 * PRIMARY top-nav items (desktop horizontal bar).
 * Kept intentionally lean: Home · Explore · My Trips · Messages · Saved.
 * Everything else (Payments, Notifications, Profile, Orders) lives in the
 * account dropdown or the mobile "More" sheet.
 */
export const CUSTOMER_NAV: CustomerNavItem[] = [
  { label: "Home", href: "/user", icon: LayoutDashboard, short: "Home" },
  { label: "Explore", href: "/stay/search", icon: Compass, short: "Explore" },
  { label: "My Trips", href: "/user/bookings", icon: CalendarCheck, short: "Trips" },
  { label: "Messages", href: "/user/messages", icon: MessageSquare, short: "Inbox" },
  { label: "Saved", href: "/user/saved", icon: Heart, short: "Saved" },
]

/** Full list including account-area destinations (used by mobile "More" sheet). */
export const CUSTOMER_ALL: CustomerNavItem[] = [
  ...CUSTOMER_NAV,
  { label: "Notifications", href: "/user/notifications", icon: Bell, short: "Alerts" },
  { label: "Payments", href: "/user/payments", icon: CreditCard, short: "Pay" },
  { label: "Orders", href: "/user/orders", icon: ShoppingBag, short: "Orders" },
  { label: "Profile", href: "/user/profile", icon: UserCircle, short: "Profile" },
]

/** The three primary destinations shown directly on the mobile bottom bar. */
export const CUSTOMER_PRIMARY: CustomerNavItem[] = [
  CUSTOMER_NAV[0], // Home
  CUSTOMER_NAV[2], // My Trips
  CUSTOMER_NAV[3], // Messages
]

/** Everything reachable from the mobile "More" sheet. */
export const CUSTOMER_MORE: CustomerNavItem[] = [
  CUSTOMER_NAV[1], // Explore
  CUSTOMER_NAV[4], // Saved
  ...CUSTOMER_ALL.slice(5), // Notifications, Payments, Orders, Profile
]

export function isCustomerNavActive(pathname: string, href: string): boolean {
  if (href === "/user") return pathname === "/user" || pathname === "/customer"
  if (href === "/stay/search") return pathname.startsWith("/stay")
  return pathname.startsWith(href)
}
