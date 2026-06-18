import RentPayments from "@/features/customer/lets/RentPayments"
import { findTenancy, tenancies } from "@/features/customer/data/lets"

export const metadata = { title: "Rent payments · Propvora" }

export default async function Route({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RentPayments t={findTenancy(id) ?? tenancies[0]} />
}
