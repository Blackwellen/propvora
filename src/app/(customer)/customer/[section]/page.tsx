import Link from "next/link"
import {
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  FileText,
  Headphones,
  KeyRound,
  LifeBuoy,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  CustomerCard,
  CustomerEmptyState,
  CustomerPageHeader,
} from "@/components/customer/ui"
import { requireCustomerContext, listCustomerBookings } from "@/lib/customer"

export const dynamic = "force-dynamic"

const CUSTOMER_BOOKING_SECTIONS = {
  trip: {
    title: "Trip Details",
    icon: CalendarCheck,
    body: "Dates, address visibility, host details, house rules, cancellation policy, payment summary, local guide and emergency contact live here.",
    actions: ["Review dates and guests", "Request change or cancellation", "View host and local guide"],
  },
  payments: {
    title: "Payments",
    icon: CreditCard,
    body: "Guests can view receipts, balances, deposits, refund status, tax invoices and saved payment method prompts without seeing manager workspace data.",
    actions: ["Pay balance", "View receipts", "Request refund"],
  },
  "check-in": {
    title: "Check-in",
    icon: KeyRound,
    body: "Sensitive access instructions are released only when the reservation, payment, ID and risk conditions are satisfied.",
    actions: ["Confirm arrival time", "View released instructions", "Acknowledge access rules"],
  },
  "house-rules": {
    title: "House Rules",
    icon: ShieldCheck,
    body: "Guests can review accepted rules, no-party attestations, pet/child policies, quiet hours and local compliance notices.",
    actions: ["Read house rules", "Review policy versions", "Confirm guest count"],
  },
  documents: {
    title: "Documents",
    icon: FileText,
    body: "Booking receipts, guest registration, optional ID upload status, invoices and stay documents are separated from tenant documents.",
    actions: ["Upload required documents", "Download receipt", "View invoice details"],
  },
  "report-issue": {
    title: "Report Issue",
    icon: LifeBuoy,
    body: "Issue reporting collects type, description, photos, urgency and property access permission before manager triage.",
    actions: ["Select issue type", "Add photos or video", "Submit urgent support request"],
  },
  extras: {
    title: "Extras",
    icon: Sparkles,
    body: "Guests can request late checkout, extra cleaning, pets, accessibility support, invoice changes and add-on services.",
    actions: ["Request late checkout", "Buy extras", "Ask for accessibility support"],
  },
  reviews: {
    title: "Reviews",
    icon: Star,
    body: "Reviews unlock after checkout and capture cleanliness, accuracy, check-in, communication, location, value and private feedback.",
    actions: ["Leave review after checkout", "Add private feedback", "Rate issue resolution"],
  },
  support: {
    title: "Support",
    icon: Headphones,
    body: "Customer support routes stay-specific questions to the property manager while preserving the booking timeline and audit record.",
    actions: ["Contact support", "Open booking help", "View emergency contacts"],
  },
  messages: {
    title: "Messages",
    icon: MessageSquare,
    body: "Booking messages, automated reminders and support threads are grouped by reservation.",
    actions: ["Message host", "View automated reminders", "Open support thread"],
  },
} satisfies Record<string, { title: string; icon: LucideIcon; body: string; actions: string[] }>

export default async function CustomerBookingSectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  const config = CUSTOMER_BOOKING_SECTIONS[section as keyof typeof CUSTOMER_BOOKING_SECTIONS]
  if (!config) {
    return (
      <div className="space-y-5">
        <MobileTopBar title="Customer workspace" showBack backHref="/customer" />
        <CustomerCard>
          <CustomerEmptyState
            icon={CalendarCheck}
            title="Workspace area not found"
            description="This customer booking workspace area is not available."
            action={
              <Link href="/customer/bookings" className="inline-flex items-center rounded-xl bg-[#2563EB] px-3.5 py-2 text-sm font-semibold text-white">
                My bookings
              </Link>
            }
          />
        </CustomerCard>
      </div>
    )
  }

  const { supabase, workspaceId, email } = await requireCustomerContext()
  const bookings = await listCustomerBookings(supabase, workspaceId, email)
  const Icon = config.icon

  return (
    <div className="space-y-5">
      <MobileTopBar title={config.title} subtitle="Booking workspace" showBack backHref="/customer/bookings" />

      <CustomerPageHeader
        title={config.title}
        subtitle="Booking guest workspace, separate from tenant portal workflows."
      />

      <CustomerCard className="overflow-hidden">
        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 border-b border-slate-100">
          <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{config.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 max-w-2xl">{config.body}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100">
          {config.actions.map((action) => (
            <div key={action} className="bg-white p-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="mt-2 text-sm font-medium text-slate-800">{action}</p>
            </div>
          ))}
        </div>
      </CustomerCard>

      <CustomerCard>
        {bookings.length === 0 ? (
          <CustomerEmptyState
            icon={CalendarCheck}
            title="No stay selected"
            description="When a booking exists, this workspace shows the active trip data, payment status, check-in gates and support actions for that reservation."
            action={
              <Link href="/stay/search" className="inline-flex items-center rounded-xl bg-[#2563EB] px-3.5 py-2 text-sm font-semibold text-white">
                Find a stay
              </Link>
            }
          />
        ) : (
          <div className="p-5">
            <p className="text-sm font-semibold text-slate-900">Connected bookings</p>
            <p className="mt-1 text-sm text-slate-500">
              {bookings.length} booking{bookings.length === 1 ? "" : "s"} can use this workspace area.
            </p>
          </div>
        )}
      </CustomerCard>
    </div>
  )
}
