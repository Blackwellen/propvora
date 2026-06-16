import Link from "next/link"
import { CalendarCheck, MapPin } from "lucide-react"
import { MobileTopBar } from "@/components/mobile"
import { CustomerPageHeader, CustomerCard, CustomerEmptyState } from "@/components/customer/ui"
import BookingsExplorer from "@/components/customer/BookingsExplorer"
import { requireCustomerContext, listCustomerBookings } from "@/lib/customer"

export const metadata = { title: "My Bookings · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerBookingsPage() {
  const { supabase, workspaceId, email } = await requireCustomerContext()
  const bookings = await listCustomerBookings(supabase, workspaceId, email)

  return (
    <div className="space-y-5">
      <MobileTopBar title="My Bookings" subtitle={`${bookings.length} total`} />

      <CustomerPageHeader
        title="My Bookings"
        subtitle="Your stays — upcoming, past and cancelled. Switch between a list and a calendar, search and re-book in one place."
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
        <BookingsExplorer bookings={bookings} />
      )}
    </div>
  )
}
