import DisputeStagesPage from "@/features/customer/bookings/DisputeStagesPage"
import { findDispute, disputes } from "@/features/customer/data/bookings"

export const metadata = { title: "Dispute · Propvora" }

export default async function CustomerDisputeStagesRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const dispute = findDispute(id) ?? disputes[0]
  return <DisputeStagesPage d={dispute} bookingId={id} />
}
