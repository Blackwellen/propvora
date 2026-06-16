import Link from "next/link"
import { CalendarCheck, Users, ChevronRight, MapPin } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import {
  CustomerPageHeader,
  CustomerCard,
  CustomerEmptyState,
  CustomerStatusBadge,
} from "@/components/customer/ui"
import { moneyPence, shortDate, dayMonth, humanise, toneForStatus, isUpcoming } from "@/components/customer/format"
import { requireCustomerContext, listCustomerBookings } from "@/lib/customer"
import type { CustomerBooking } from "@/lib/customer"

export const metadata = { title: "My Bookings · Propvora" }
export const dynamic = "force-dynamic"

function BookingRow({ b }: { b: CustomerBooking }) {
  return (
    <Link
      href={`/customer/bookings/${b.id}`}
      className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors"
    >
      <div className="w-14 shrink-0 rounded-lg bg-blue-50 py-2 text-center">
        <p className="text-[10px] font-bold text-blue-600 leading-none">{dayMonth(b.check_in)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {b.listing_title ?? (b.nights ? `${b.nights} night${b.nights === 1 ? "" : "s"} stay` : "Stay")}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {shortDate(b.check_in)} → {shortDate(b.check_out)}
          {b.guests_count ? ` · ${b.guests_count} guest${b.guests_count === 1 ? "" : "s"}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-slate-800">{moneyPence(b.total_pence, b.currency)}</p>
        {["hold", "pending_payment"].includes(b.status) && (b.payment_status ?? "unpaid") === "unpaid" ? (
          <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Payment due
          </span>
        ) : (
          <CustomerStatusBadge tone={toneForStatus(b.status)}>{humanise(b.status)}</CustomerStatusBadge>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </Link>
  )
}

export default async function CustomerBookingsPage() {
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const bookings = await listCustomerBookings(supabase, workspaceId, email)

  const upcoming = bookings
    .filter((b) => isUpcoming(b.check_in, b.status))
    .sort((a, b) => (a.check_in ?? "").localeCompare(b.check_in ?? ""))
  const past = bookings
    .filter((b) => !isUpcoming(b.check_in, b.status))
    .sort((a, b) => (b.check_in ?? "").localeCompare(a.check_in ?? ""))

  return (
    <div className="space-y-5">
      <MobileTopBar title="My Bookings" subtitle={`${bookings.length} total`} />

      <CustomerPageHeader
        title="My Bookings"
        subtitle="Your stays — confirmed, pending and past. Status shown reflects the real booking state."
      />

      {bookings.length === 0 ? (
        <CustomerCard>
          <CustomerEmptyState
            icon={CalendarCheck}
            title="No bookings yet"
            description="When you reserve a property, your stays appear here with dates, guests and the exact price you paid. Browse the marketplace to find your next place."
            action={
              <Link
                href="/stay/search"
                className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
              >
                <MapPin className="w-4 h-4" /> Find a stay
              </Link>
            }
          />
        </CustomerCard>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-slate-400" /> Upcoming
              <span className="text-slate-400 font-normal">({upcoming.length})</span>
            </h2>
            <CustomerCard className="p-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-500 px-2 py-4 text-center">No upcoming stays.</p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((b) => (
                    <li key={b.id}><BookingRow b={b} /></li>
                  ))}
                </ul>
              )}
            </CustomerCard>
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" /> Past &amp; cancelled
                <span className="text-slate-400 font-normal">({past.length})</span>
              </h2>
              <CustomerCard className="p-3">
                <ul className="space-y-2">
                  {past.map((b) => (
                    <li key={b.id}><BookingRow b={b} /></li>
                  ))}
                </ul>
              </CustomerCard>
            </section>
          )}
        </>
      )}
    </div>
  )
}
