import MoveIn from "@/features/customer/lets/MoveIn"
import { findTenancy, tenancies } from "@/features/customer/data/lets"

export const metadata = { title: "Move-in checklist · Propvora" }

export default async function Route({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MoveIn t={findTenancy(id) ?? tenancies[0]} />
}
