/**
 * Bookings seed data — drives the Bookings manager (images 4-7), disputes (8),
 * completed (9), detail (10) and dispute stages (11).
 *
 * TODO(supabase): replace with RLS-scoped queries against customer_bookings,
 * customer_booking_payments, customer_booking_disputes, etc. Shapes below are
 * what the page components consume.
 */
import { propertyImages as IMG } from "./mock"

export type BookingType = "Stay" | "Let"
export type BookingStatus = "Upcoming" | "Confirmed" | "Completed" | "Cancelled" | "Open dispute"
export type PaymentStatus = "Paid" | "Partially paid" | "Unpaid" | "Refunded"

export interface Booking {
  id: string
  ref: string
  property: string
  location: string
  image: string
  type: BookingType
  checkIn: string
  checkOut: string
  dateRange: string
  guests: number
  status: BookingStatus
  payment: PaymentStatus
  totalPence: number
  host: string
  hostAvatar?: string
  superhost?: boolean
  rating?: number
  reviews?: number
  hasDispute?: boolean
  perNightPence?: number
  nights?: number
  cleaningPence?: number
  servicePence?: number
}

const A = "/property-types"
function hostImg(seed: string) {
  return `${A}/${seed}.jpg`
}

export const bookings: Booking[] = [
  {
    id: "PV-98271", ref: "PV-98271", property: "Lakeview Penthouse", location: "Windermere, LA23", image: IMG.lakeview,
    type: "Stay", checkIn: "24 May 2025", checkOut: "28 May 2025", dateRange: "24 May – 28 May 2025", guests: 2,
    status: "Upcoming", payment: "Paid", totalPence: 85500, host: "James Wilson", superhost: true, rating: 4.9, reviews: 128,
    perNightPence: 20000, nights: 4, cleaningPence: 3000, servicePence: 2500,
  },
  {
    id: "PV-98230", ref: "PV-98230", property: "Riverside Cottage", location: "Bakewell, DE45 1QY", image: IMG.riverside,
    type: "Stay", checkIn: "6 Jun 2025", checkOut: "9 Jun 2025", dateRange: "6 Jun – 9 Jun 2025", guests: 4,
    status: "Confirmed", payment: "Paid", totalPence: 14500, host: "Emily Brown", rating: 4.8, reviews: 96,
    perNightPence: 4500, nights: 3, cleaningPence: 1000,
  },
  {
    id: "PV-98112", ref: "PV-98112", property: "City Loft Apartment", location: "Manchester, M1 2EW", image: IMG.cityLoft,
    type: "Stay", checkIn: "18 Jun 2025", checkOut: "20 Jun 2025", dateRange: "18 Jun – 20 Jun 2025", guests: 2,
    status: "Upcoming", payment: "Paid", totalPence: 13000, host: "David Smith", rating: 4.7,
    perNightPence: 6000, nights: 2,
  },
  {
    id: "PV-98045", ref: "PV-98045", property: "Seaside Cottage", location: "Whitby, YO21", image: IMG.seaside,
    type: "Stay", checkIn: "2 Jul 2025", checkOut: "9 Jul 2025", dateRange: "2 Jul – 9 Jul 2025", guests: 3,
    status: "Upcoming", payment: "Partially paid", totalPence: 11000, host: "Olivia Taylor", rating: 4.7,
    perNightPence: 1500, nights: 7,
  },
  {
    id: "PV-97988", ref: "PV-97988", property: "Harbour Side Apartment", location: "Liverpool, L3 4FP", image: IMG.harbour,
    type: "Let", checkIn: "1 Aug 2025", checkOut: "31 Aug 2025", dateRange: "1 Aug – 31 Aug 2025", guests: 2,
    status: "Upcoming", payment: "Paid", totalPence: 15500, host: "Michael Lee",
  },
  {
    id: "PV-97866", ref: "PV-97866", property: "Meadow View Cottage", location: "Ambleside, LA22", image: IMG.meadow,
    type: "Stay", checkIn: "12 Aug 2025", checkOut: "15 Aug 2025", dateRange: "12 Aug – 15 Aug 2025", guests: 4,
    status: "Confirmed", payment: "Paid", totalPence: 185000, host: "Sophie Martin",
  },
  {
    id: "PV-97750", ref: "PV-97750", property: "Lakeside Cabin", location: "Coniston, LA21", image: IMG.lakeside,
    type: "Stay", checkIn: "5 Sep 2025", checkOut: "8 Sep 2025", dateRange: "5 Sep – 8 Sep 2025", guests: 2,
    status: "Upcoming", payment: "Unpaid", totalPence: 18000, host: "Daniel Carter", hasDispute: true,
  },
  {
    id: "PV-97631", ref: "PV-97631", property: "Riverside Cottage", location: "Bakewell, DE45 1QY", image: IMG.riverside,
    type: "Stay", checkIn: "20 Sep 2025", checkOut: "22 Sep 2025", dateRange: "20 Sep – 22 Sep 2025", guests: 2,
    status: "Completed", payment: "Paid", totalPence: 14500, host: "Emily Brown",
  },
  {
    id: "PV-97512", ref: "PV-97512", property: "Ocean View Suite", location: "St Ives, TR26", image: IMG.seaside,
    type: "Stay", checkIn: "3 Oct 2025", checkOut: "6 Oct 2025", dateRange: "3 Oct – 6 Oct 2025", guests: 2,
    status: "Completed", payment: "Paid", totalPence: 21000, host: "Thomas Reed",
  },
  {
    id: "PV-97401", ref: "PV-97401", property: "Hilltop Retreat", location: "Keswick, CA12", image: IMG.meadow,
    type: "Let", checkIn: "1 Nov 2025", checkOut: "30 Nov 2025", dateRange: "1 Nov – 30 Nov 2025", guests: 1,
    status: "Upcoming", payment: "Paid", totalPence: 16500, host: "Grace Walker",
  },
]

export interface BookingKpi {
  id: string
  label: string
  value: string
  sub: string
  icon: "calendar" | "calendarClock" | "stay" | "check" | "spend" | "star"
  accent: "blue" | "violet" | "emerald" | "amber" | "slate"
}

export const bookingKpis: BookingKpi[] = [
  { id: "all", label: "All bookings", value: "24", sub: "Total bookings", icon: "calendar", accent: "blue" },
  { id: "upcoming", label: "Upcoming", value: "7", sub: "Next 6 months", icon: "calendarClock", accent: "violet" },
  { id: "current", label: "Current stays", value: "2", sub: "Right now", icon: "stay", accent: "violet" },
  { id: "completed", label: "Completed", value: "15", sub: "All time", icon: "check", accent: "emerald" },
  { id: "spend", label: "Total spent", value: "£12,842", sub: "All time", icon: "spend", accent: "blue" },
  { id: "rating", label: "Avg. rating", value: "4.8", sub: "Across all stays", icon: "star", accent: "amber" },
]

export function findBooking(id: string) {
  return bookings.find((b) => b.id === id || b.ref === id)
}

/* ── Disputes (images 8 & 11) ─────────────────────────────────────────────── */
export type DisputeStage = "Opened" | "Evidence submitted" | "Host response" | "Review / mediation" | "Resolution" | "Refund / closure"
export type DisputeStatus = "Awaiting host response" | "Awaiting Propvora" | "Evidence submitted" | "Refund in progress" | "Resolved" | "Closed"

export interface Dispute {
  id: string
  bookingRef: string
  property: string
  location: string
  image: string
  dateRange: string
  nights: number
  bookingTotalPence: number
  claimedPence: number
  refundRequestedPct: number
  reason: string
  reasonDetail: string
  raised: string
  status: DisputeStatus
  since: string
  stageIndex: number
  past?: boolean
  resolvedNote?: string
}

export const disputes: Dispute[] = [
  {
    id: "DP-7K3L9M2N", bookingRef: "BK-9G3H7K2L", property: "Riverside Cottage", location: "Bakewell, DE45 1QY", image: IMG.riverside,
    dateRange: "6 Jun – 9 Jun 2025", nights: 4, bookingTotalPence: 72000, claimedPence: 18000, refundRequestedPct: 100,
    reason: "Property not as described", reasonDetail: "The property was advertised as having a private hot tub, which was not available during our stay.",
    raised: "16 May 2025", status: "Awaiting host response", since: "16 May 2025", stageIndex: 2,
  },
  {
    id: "DP-8J2K1L0M", bookingRef: "BK-J8M2P5Q9", property: "City Loft Apartment", location: "Manchester, M1 2EW", image: IMG.cityLoft,
    dateRange: "24 Apr – 27 Apr 2025", nights: 3, bookingTotalPence: 48000, claimedPence: 12000, refundRequestedPct: 100,
    reason: "Cleanliness issue", reasonDetail: "Apartment was not cleaned to standard on arrival.",
    raised: "10 May 2025", status: "Awaiting Propvora", since: "10 May 2025", stageIndex: 3,
  },
  {
    id: "DP-4X6N9B1D", bookingRef: "BK-4X6N9B1D", property: "Lakeside Cabin", location: "Coniston, LA21", image: IMG.lakeside,
    dateRange: "1 May – 5 May 2025", nights: 4, bookingTotalPence: 76000, claimedPence: 20000, refundRequestedPct: 100,
    reason: "Maintenance issue", reasonDetail: "Heating did not work for two nights.",
    raised: "8 May 2025", status: "Evidence submitted", since: "8 May 2025", stageIndex: 1,
  },
  {
    id: "DP-V7R3T8W5", bookingRef: "BK-V7R3T8W5", property: "Seaside Cottage", location: "Whitby, YO21", image: IMG.seaside,
    dateRange: "12 Apr – 15 Apr 2025", nights: 3, bookingTotalPence: 51000, claimedPence: 12000, refundRequestedPct: 100,
    reason: "Service issue", reasonDetail: "Check-in instructions were never sent.",
    raised: "2 May 2025", status: "Refund in progress", since: "2 May 2025", stageIndex: 4,
  },
  {
    id: "DP-L2K6D4P9", bookingRef: "BK-L2K6D4P9", property: "Meadow View Cottage", location: "Ambleside, LA22", image: IMG.meadow,
    dateRange: "10 Mar – 13 Mar 2025", nights: 3, bookingTotalPence: 45000, claimedPence: 9000, refundRequestedPct: 100,
    reason: "Property not as described", reasonDetail: "Resolved in your favour.",
    raised: "5 Mar 2025", status: "Resolved", since: "28 Mar 2025", stageIndex: 5, past: true, resolvedNote: "Resolved on 28 Mar 2025 · £90 refunded",
  },
  {
    id: "DP-M9H1J3K2", bookingRef: "BK-M9H1J3K2", property: "Harbour Side Apartment", location: "Liverpool, L3 4FP", image: IMG.harbour,
    dateRange: "18 Feb – 21 Feb 2025", nights: 3, bookingTotalPence: 42000, claimedPence: 0, refundRequestedPct: 0,
    reason: "Billing query", reasonDetail: "Closed — no refund due.",
    raised: "20 Feb 2025", status: "Closed", since: "5 Mar 2025", stageIndex: 5, past: true, resolvedNote: "Closed on 5 Mar 2025 · No refund",
  },
]

export const disputeStages: DisputeStage[] = [
  "Opened", "Evidence submitted", "Host response", "Review / mediation", "Resolution", "Refund / closure",
]

export function findDispute(idOrBooking: string) {
  return disputes.find((d) => d.id === idOrBooking || d.bookingRef === idOrBooking)
}
