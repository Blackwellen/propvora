import { notFound } from "next/navigation"
import DisputeStagesPage from "@/features/customer/bookings/DisputeStagesPage"
import { loadDisputesForUser } from "@/lib/disputes/load"
import { mapToCustomerDispute } from "@/features/customer/data/disputes-map"

export const metadata = { title: "Dispute · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerDisputeStagesRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { items } = await loadDisputesForUser()
  const key = id.toLowerCase()
  const rich = items.find(
    (d) =>
      d.id.toLowerCase() === key ||
      d.reference.toLowerCase() === key ||
      d.booking_reference.toLowerCase() === key ||
      d.booking_id.toLowerCase() === key,
  )
  if (!rich) notFound()
  return <DisputeStagesPage d={mapToCustomerDispute(rich)} bookingId={rich.booking_reference} />
}
