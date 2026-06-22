import BookingsClient from "@/features/customer/bookings/BookingsClient"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { listCustomerBookings } from "@/lib/customer/data"
import { mapCustomerBookingToUi } from "@/features/customer/bookings/data/map"

export const metadata = { title: "Bookings · Propvora" }
export const dynamic = "force-dynamic"

type View = "overview" | "cards" | "table" | "map"
const VIEWS: View[] = ["overview", "cards", "table", "map"]

export default async function CustomerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const initialView = (VIEWS.includes(view as View) ? view : "overview") as View

  const { supabase, workspaceId, email } = await requireCustomerContext()
  const raw = await listCustomerBookings(supabase, workspaceId, email)
  const bookings = raw.map((b) => mapCustomerBookingToUi(b))

  return <BookingsClient initialView={initialView} bookings={bookings} />
}
