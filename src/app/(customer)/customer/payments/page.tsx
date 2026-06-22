import PaymentsClient, { type Pay } from "@/features/customer/payments/PaymentsClient"
import { type PaymentsKpis } from "@/features/customer/payments/components/PaymentsKpiStrip"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { listCustomerBookings } from "@/lib/customer/data"
import { type PillTone } from "@/features/customer/components/StatusPill"

export const metadata = { title: "Payments · Propvora" }
export const dynamic = "force-dynamic"

const PLACEHOLDER = "/property-types/holiday.jpg"
const fmt = (iso: string | null) => {
  if (!iso) return ""
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) } catch { return "" }
}

function payStatus(s: string | null): { label: string; tone: PillTone; unpaid: boolean } {
  switch ((s ?? "").toLowerCase()) {
    case "paid": return { label: "Paid", tone: "emerald", unpaid: false }
    case "partially_paid":
    case "partial": return { label: "Part-paid", tone: "amber", unpaid: true }
    case "refunded": return { label: "Refunded", tone: "slate", unpaid: false }
    default: return { label: "Unpaid", tone: "amber", unpaid: true }
  }
}

export default async function CustomerPaymentsPage() {
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const bookings = await listCustomerBookings(supabase, workspaceId, email)

  const payments: Pay[] = bookings.map((b) => {
    const st = payStatus(b.payment_status)
    return {
      id: b.id,
      property: b.listing_title ?? "Booking",
      desc: b.check_in && b.check_out ? `${fmt(b.check_in)} – ${fmt(b.check_out)}` : (b.booking_ref ?? "Stay"),
      image: PLACEHOLDER,
      amountPence: b.total_pence ?? 0,
      due: st.unpaid ? (b.check_in ? `Due ${fmt(b.check_in)}` : "Due") : `Paid`,
      status: st.label,
      tone: st.tone,
      method: "Card",
      canPay: st.unpaid,
    }
  })

  const kpis: PaymentsKpis = {
    upcomingPence: bookings.filter((b) => payStatus(b.payment_status).unpaid).reduce((s, b) => s + (b.total_pence ?? 0), 0),
    paidPence: bookings.filter((b) => (b.payment_status ?? "").toLowerCase() === "paid").reduce((s, b) => s + (b.total_pence ?? 0), 0),
    depositsPence: bookings.reduce((s, b) => s + (b.deposit_pence ?? 0), 0),
    refundsPence: bookings.filter((b) => (b.payment_status ?? "").toLowerCase() === "refunded").reduce((s, b) => s + (b.total_pence ?? 0), 0),
    receipts: bookings.filter((b) => (b.payment_status ?? "").toLowerCase() === "paid").length,
  }

  return <PaymentsClient payments={payments} kpis={kpis} />
}
