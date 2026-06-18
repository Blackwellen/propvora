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

export const customerName = "Sarah Johnson"
export const customerEmail = "sarah.johnson@email.com"

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
  { id: "upcoming", label: "Upcoming stays", value: "2", sub: "Next: 24 May 2025", subAccent: "blue", icon: "calendar", accent: "blue" },
  { id: "active", label: "Active bookings", value: "2", sub: "2 ongoing", subAccent: "amber", icon: "bag", accent: "amber" },
  { id: "saved", label: "Saved stays", value: "12", sub: "Favourites", subAccent: "red", icon: "heart", accent: "red" },
  { id: "messages", label: "Messages", value: "3", sub: "3 unread", subAccent: "violet", icon: "chat", accent: "violet" },
  { id: "offers", label: "Exclusive offers", value: "4", sub: "New for you", subAccent: "emerald", icon: "offer", accent: "emerald" },
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

export const upcomingStays: UpcomingStay[] = [
  {
    id: "PV-7BD2K9",
    title: "Modern 2 Bed Apartment",
    location: "Manchester City Centre, M1 2EW",
    image: IMG.cityLoft,
    status: "Confirmed",
    dateRange: "24 – 28 May 2025",
    guests: 2,
    checkInDay: "24 May",
    checkInTime: "15:00",
  },
  {
    id: "PV-KL9M3P",
    title: "Riverside Cottage",
    location: "Bakewell, Derbyshire, DE45 1QY",
    image: IMG.riverside,
    status: "Upcoming",
    dateRange: "6 – 9 Jun 2025",
    guests: 4,
    checkInDay: "6 Jun",
    checkInTime: "16:00",
  },
]

export const recommended: PropertyCardData[] = [
  { id: "luxe-city-loft", title: "Luxe City Loft", location: "Manchester, M1", image: IMG.cityLoft, pricePence: 12000, rating: 4.9, reviews: 128, saved: true },
  { id: "lakeview-cabin", title: "Lakeview Cabin", location: "Windermere, LA23", image: IMG.lakeside, pricePence: 14500, rating: 4.8, reviews: 96, saved: true },
  { id: "seaside-cottage", title: "Seaside Cottage", location: "Whitby, YO21", image: IMG.seaside, pricePence: 11000, rating: 4.7, reviews: 73, saved: true },
  { id: "urban-penthouse", title: "Urban Penthouse", location: "Leeds, LS1", image: IMG.urban, pricePence: 16000, rating: 4.6, reviews: 54, saved: true },
]

export interface ActivityItem {
  id: string
  icon: "booking" | "message" | "payment" | "document" | "viewing" | "offer"
  title: string
  subtitle: string
  when: string
  accent: "emerald" | "violet" | "amber" | "blue"
}

export const recentActivity: ActivityItem[] = [
  { id: "a1", icon: "booking", title: "Booking confirmed", subtitle: "Modern 2 Bed Apartment", when: "Today, 10:24", accent: "emerald" },
  { id: "a2", icon: "message", title: "Message from host", subtitle: "Riverside Cottage", when: "Yesterday, 14:18", accent: "violet" },
  { id: "a3", icon: "payment", title: "Payment successful", subtitle: "Riverside Cottage", when: "12 May 2025", accent: "amber" },
]

export const account = {
  fullName: "Sarah Johnson",
  email: "sarah.johnson@email.com",
  phone: "+44 7700 900123",
  memberSince: "March 2024",
  verified: true,
}

export const propertyImages = IMG
