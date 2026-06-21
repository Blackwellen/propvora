/**
 * Customer workspace seed data.
 *
 * TODO(supabase): this module is the single swap-point. Replace each export
 * with a typed server query (customer_ and let_ tables, RLS-scoped to the
 * signed-in customer) — the page components consume these shapes unchanged.
 */
import type { PropertyCardData } from "../components/PropertyCard"

const IMG = {
  lakeview: "/demo/properties/oakwood-terrace.jpg",
  riverside: "/demo/properties/birchfield-lane.jpg",
  cityLoft: "/demo/properties/maple-court.jpg",
  seaside: "/demo/properties/chestnut-drive.jpg",
  lakeside: "/demo/properties/hawthorn-street.jpg",
  urban: "/demo/properties/sycamore-road.jpg",
  greenQuarter: "/property-types/development.jpg",
  dockside: "/property-types/sa.jpg",
  meadow: "/property-types/holiday.jpg",
  harbour: "/property-types/mixed.jpg",
} as const

// TODO: replace with real Supabase auth.getUser() call — see src/app/(customer)/layout.tsx
export const customerName = ""
export const customerEmail = ""

export interface HomeStat {
  id: string
  label: string
  value: string
  sub: string
  subAccent: "blue" | "amber" | "red" | "violet" | "emerald" | "slate"
  icon: "calendar" | "bag" | "heart" | "chat" | "offer"
  accent: "blue" | "amber" | "red" | "violet" | "emerald"
}

export const homeStats: HomeStat[] = [
  { id: "upcoming", label: "Upcoming stays", value: "—", sub: "No upcoming stays", subAccent: "slate", icon: "calendar", accent: "blue" },
  { id: "active", label: "Active bookings", value: "—", sub: "No active bookings", subAccent: "slate", icon: "bag", accent: "amber" },
  { id: "saved", label: "Saved stays", value: "—", sub: "No favourites yet", subAccent: "slate", icon: "heart", accent: "red" },
  { id: "messages", label: "Messages", value: "—", sub: "No messages", subAccent: "slate", icon: "chat", accent: "violet" },
  { id: "offers", label: "Exclusive offers", value: "—", sub: "No offers available", subAccent: "slate", icon: "offer", accent: "emerald" },
]

export interface UpcomingStay {
  id: string
  title: string
  location: string
  image: string
  status: "Confirmed" | "Upcoming"
  dateRange: string
  guests: number
  checkInDay: string
  checkInTime: string
}

export const upcomingStays: UpcomingStay[] = []

export const recommended: PropertyCardData[] = []

export interface ActivityItem {
  id: string
  icon: "booking" | "message" | "payment" | "document" | "viewing" | "offer"
  title: string
  subtitle: string
  when: string
  accent: "emerald" | "violet" | "amber" | "blue"
}

export const recentActivity: ActivityItem[] = []

// TODO: replace with real Supabase auth.getUser() + profiles query
export const account = {
  fullName: "",
  email: "",
  phone: "",
  memberSince: "",
  verified: false,
}

export const propertyImages = IMG
