import DisputesClient from "@/features/customer/bookings/DisputesClient"
import { loadDisputesForUser } from "@/lib/disputes/load"
import { mapToCustomerDispute } from "@/features/customer/data/disputes-map"

export const metadata = { title: "Booking disputes · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerBookingDisputesPage() {
  const { items } = await loadDisputesForUser()
  const disputes = items.map(mapToCustomerDispute)
  return <DisputesClient disputes={disputes} />
}
