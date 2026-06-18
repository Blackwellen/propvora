import Maintenance from "@/features/customer/lets/Maintenance"
import { findTenancy, tenancies } from "@/features/customer/data/lets"

export const metadata = { title: "Maintenance · Propvora" }

export default async function Route({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Maintenance t={findTenancy(id) ?? tenancies[0]} />
}
