import BookingsClient from "@/features/customer/bookings/BookingsClient"

export const metadata = { title: "Bookings · Propvora" }

type View = "overview" | "cards" | "table" | "map"
const VIEWS: View[] = ["overview", "cards", "table", "map"]

export default async function CustomerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  const initialView = (VIEWS.includes(view as View) ? view : "overview") as View
  return <BookingsClient initialView={initialView} />
}
