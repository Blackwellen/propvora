import TenancySetup from "@/features/customer/lets/TenancySetup"
import { findTenancy, tenancies } from "@/features/customer/data/lets"

export const metadata = { title: "Tenancy setup · Propvora" }

export default async function Route({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TenancySetup t={findTenancy(id) ?? tenancies[0]} />
}
