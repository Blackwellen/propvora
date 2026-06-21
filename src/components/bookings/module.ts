import {
  BarChart3,
  BedDouble,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  Flag,
  GanttChart,
  HeartHandshake,
  Home,
  KeyRound,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  Receipt,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { BookingRow, BookableListing, ReservationStatus } from "./server"

export type BookingSectionKey =
  | "dashboard"
  | "calendar"
  | "listings"
  | "availability"
  | "pricing"
  | "reservations"
  | "guests"
  | "payments"
  | "messages"
  | "check-in"
  | "rules"
  | "cleaning"
  | "maintenance"
  | "issues"
  | "reviews"
  | "channel-sync"
  | "direct-pages"
  | "reports"
  | "settings"

export interface BookingModule {
  key: BookingSectionKey
  label: string
  href: string
  icon: LucideIcon
  summary: string
  phase: "live" | "foundation" | "ops" | "legal"
}

export const BOOKING_MODULES: BookingModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/property-manager/bookings", icon: BarChart3, summary: "Arrivals, revenue, risk and operations health.", phase: "live" },
  { key: "calendar", label: "Calendar", href: "/property-manager/bookings/calendar", icon: CalendarDays, summary: "Month, week, timeline and listing-grid planning.", phase: "live" },
  { key: "listings", label: "Listings", href: "/property-manager/bookings/listings", icon: Home, summary: "Booking listings separate from property records.", phase: "live" },
  { key: "availability", label: "Availability", href: "/property-manager/bookings/availability", icon: CalendarRange, summary: "Blocks, holds, buffers, min nights and conflict rules.", phase: "foundation" },
  { key: "pricing", label: "Pricing", href: "/property-manager/bookings/pricing", icon: Tags, summary: "Nightly, seasonal, fees, deposits and tax profiles.", phase: "foundation" },
  { key: "reservations", label: "Reservations", href: "/property-manager/bookings/reservations", icon: BedDouble, summary: "Approvals, modifications, cancellations and registers.", phase: "live" },
  { key: "guests", label: "Guests / Customers", href: "/property-manager/bookings/guests", icon: Users, summary: "Guest CRM, identity status and stay history.", phase: "foundation" },
  { key: "payments", label: "Payments & Deposits", href: "/property-manager/bookings/payments", icon: CreditCard, summary: "Payment status, deposits, refunds, payouts and ledger links.", phase: "foundation" },
  { key: "messages", label: "Messages", href: "/property-manager/bookings/messages", icon: MessageSquare, summary: "Guest, automated and internal stay messaging.", phase: "ops" },
  { key: "check-in", label: "Check-in / Checkout", href: "/property-manager/bookings/check-in", icon: KeyRound, summary: "Access methods, release gates and checkout inspection.", phase: "ops" },
  { key: "rules", label: "House Rules", href: "/property-manager/bookings/rules", icon: ShieldCheck, summary: "House rules, policies and legal acceptance snapshots.", phase: "legal" },
  { key: "cleaning", label: "Cleaning & Turnover", href: "/property-manager/bookings/cleaning", icon: ClipboardCheck, summary: "Turnover tasks, linen, inspection and cleaner schedule.", phase: "ops" },
  { key: "maintenance", label: "Maintenance During Stay", href: "/property-manager/bookings/maintenance", icon: Wrench, summary: "In-stay jobs, emergency callouts and supplier dispatch.", phase: "ops" },
  { key: "issues", label: "Issues & Claims", href: "/property-manager/bookings/issues", icon: LifeBuoy, summary: "Issue triage, evidence, disputes, refunds and damage claims.", phase: "foundation" },
  { key: "reviews", label: "Reviews", href: "/property-manager/bookings/reviews", icon: Star, summary: "Guest reviews, private feedback and rating quality.", phase: "foundation" },
  { key: "channel-sync", label: "Channel Sync", href: "/property-manager/bookings/channel-sync", icon: RefreshCcw, summary: "iCal import/export, sync logs and channel holds.", phase: "foundation" },
  { key: "direct-pages", label: "Direct Booking Pages", href: "/property-manager/bookings/direct-pages", icon: Sparkles, summary: "Public pages, checkout, confirmation and guest portal links.", phase: "foundation" },
  { key: "reports", label: "Reports", href: "/property-manager/bookings/reports", icon: Receipt, summary: "Occupancy, ADR, RevPAR, channel mix and margin.", phase: "foundation" },
  { key: "settings", label: "Settings", href: "/property-manager/bookings/settings", icon: Settings2, summary: "Feature flags, booking modes, legal and automation defaults.", phase: "legal" },
]

export const BOOKING_SECTION_KEYS = new Set(BOOKING_MODULES.map((m) => m.key))

export interface BookingOpsSnapshot {
  arrivalsToday: BookingRow[]
  departuresToday: BookingRow[]
  currentGuests: BookingRow[]
  pendingApprovals: BookingRow[]
  paymentIssues: BookingRow[]
  disputes: BookingRow[]
  checkoutQueue: BookingRow[]
  conversionReadyListings: BookableListing[]
  occupancyPct: number
  adrPence: number
  revenuePence: number
  currency: string
  readiness: { label: string; done: boolean; blocker?: string }[]
}

function todayYmd(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isActiveStay(status: ReservationStatus) {
  return status === "confirmed" || status === "checked_in"
}

export function buildBookingOpsSnapshot(bookings: BookingRow[], listings: BookableListing[]): BookingOpsSnapshot {
  const today = todayYmd()
  const liveBookings = bookings.filter((b) => b.status !== "cancelled")
  const bookedNights = liveBookings.reduce((sum, b) => sum + b.nights, 0)
  const paidBookings = liveBookings.filter((b) => b.totalPence > 0)
  const revenuePence = paidBookings.reduce((sum, b) => sum + b.totalPence, 0)
  const listingCapacityNights = Math.max(1, listings.length * 30)
  const occupancyPct = Math.min(100, Math.round((bookedNights / listingCapacityNights) * 100))
  const adrPence = bookedNights > 0 ? Math.round(revenuePence / bookedNights) : 0

  return {
    arrivalsToday: liveBookings.filter((b) => b.checkIn === today),
    departuresToday: liveBookings.filter((b) => b.checkOut === today),
    currentGuests: liveBookings.filter((b) => isActiveStay(b.status) && (b.checkIn ?? "") <= today && (b.checkOut ?? "") > today),
    pendingApprovals: bookings.filter((b) => b.status === "hold" || b.status === "pending"),
    paymentIssues: liveBookings.filter((b) => b.totalPence > 0 && b.amountPaidPence < b.totalPence),
    disputes: bookings.filter((b) => b.status === "cancelled"),
    checkoutQueue: liveBookings.filter((b) => b.status === "checked_out"),
    conversionReadyListings: listings.filter((l) => l.status === "published" && l.baseNightlyPence != null),
    occupancyPct,
    adrPence,
    revenuePence,
    currency: bookings[0]?.currency ?? listings[0]?.currency ?? "GBP",
    readiness: [
      { label: "Booking listings created", done: listings.length > 0, blocker: "Create at least one stay listing." },
      { label: "Published direct-booking inventory", done: listings.some((l) => l.status === "published"), blocker: "Publish a listing before accepting bookings." },
      { label: "Pricing attached", done: listings.some((l) => l.baseNightlyPence != null), blocker: "Set nightly pricing and fee defaults." },
      { label: "Availability open", done: listings.length > 0, blocker: "Open bookable dates and define blocked dates." },
      { label: "Guest workflow visible", done: true },
      { label: "Legal acceptance tracked", done: true },
      { label: "Channel sync foundation", done: true },
      { label: "Operations tasks mapped", done: true },
    ],
  }
}

export const BOOKING_LIFECYCLE = [
  { label: "Listing setup", icon: Home, detail: "Property/unit, content, photos, rules, legal, pricing and publish gates." },
  { label: "Discovery", icon: Sparkles, detail: "Public listing, fees, tax estimate, host identity and compliance notes." },
  { label: "Booking intent", icon: CalendarRange, detail: "Availability, min/max nights, risk, country and payment profile checks." },
  { label: "Checkout", icon: CreditCard, detail: "Guest details, additional guests, acceptance events and payment intent." },
  { label: "Confirmation", icon: CheckCircle2, detail: "Reservation, calendar block, cleaning task, messages, ledger and audit rows." },
  { label: "Pre-arrival", icon: ListChecks, detail: "Payment, ID, arrival time, access code and cleaner assignment gates." },
  { label: "Check-in", icon: KeyRound, detail: "Safe release of sensitive instructions with every access audited." },
  { label: "In-stay", icon: HeartHandshake, detail: "Messages, issues, extras, maintenance and emergency supplier dispatch." },
  { label: "Checkout", icon: Flag, detail: "Departure, cleaner inspection, damage review and deposit release workflow." },
  { label: "Post-booking", icon: FileCheck2, detail: "Refunds, payouts, owner statements, reviews, accounting and archive." },
]

export const BOOKING_FEATURE_FLAGS = [
  "booking_management_enabled",
  "direct_booking_pages_enabled",
  "customer_workspace_enabled",
  "ical_sync_enabled",
  "supplier_workspace_enabled",
  "supplier_marketplace_enabled",
  "property_booking_marketplace_enabled",
  "escrow_enabled",
  "disputes_enabled",
]

export const SECTION_WORKFLOWS: Record<BookingSectionKey, string[]> = {
  dashboard: ["Monitor arrivals and departures", "Clear payment and approval blockers", "Track occupancy, ADR and direct conversion"],
  calendar: ["Block or unblock dates", "Set overrides and buffers", "Detect channel conflicts"],
  listings: ["Create listing records separate from properties", "Run publish-readiness checks", "Manage tabs for content, photos, rules, legal and channels"],
  availability: ["Manual, owner, maintenance and channel blocks", "Min/max nights and advance notice", "Preparation buffers and linked-unit conflicts"],
  pricing: ["Base, weekend, weekly and monthly pricing", "Seasonal, event and gap-night rules", "Cleaning, linen, pet, tax and deposit fees"],
  reservations: ["All, arrivals, departures and in-house registers", "Approve, reject, modify, cancel and refund workflows", "Open reservation timeline and audit tabs"],
  guests: ["Primary and additional guests", "Identity, risk, marketing consent and stay history", "Customer profile and privacy region controls"],
  payments: ["Payment intents and checkout sessions", "Deposits, holds, refunds and chargebacks", "Payout, platform fee, tax and ledger mapping"],
  messages: ["Guest thread and automated messages", "Internal notes and templates", "AI drafts with approval for sensitive content"],
  "check-in": ["Access method and code rotation", "Release rules for payment, ID and risk status", "Checkout reminders and inspection confirmation"],
  rules: ["House rules, cancellation and deposit policies", "Terms and privacy version acceptance", "Local compliance warnings per listing"],
  cleaning: ["Turnover tasks on confirmation and checkout", "Cleaner schedule and linen status", "Inspection, photos and proof upload"],
  maintenance: ["In-stay maintenance requests", "Supplier dispatch and emergency callout", "Status updates, photos and invoices"],
  issues: ["Guest issue wizard and manager triage", "Evidence, refund, charge and damage decisions", "Dispute status and legal escalation flags"],
  reviews: ["Review unlock after checkout", "Public ratings and private feedback", "Listing quality and response tracking"],
  "channel-sync": ["iCal import/export tokens", "Manual refresh and sync logs", "Imported booking placeholders and conflict detector"],
  "direct-pages": ["Search, listing, checkout and confirmation pages", "Magic-link guest portal", "Cancellation, issue and review public flows"],
  reports: ["Occupancy, ADR, RevPAR and booking window", "Cancellation, channel mix and margin", "Owner and investor reporting exports"],
  settings: ["Booking modes and manual approval thresholds", "Feature flags and country-pack blocks", "Legal, automation and notification defaults"],
}
