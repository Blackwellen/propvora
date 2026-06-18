import TenancyDocuments from "@/features/customer/lets/TenancyDocuments"
import { findTenancy, tenancies } from "@/features/customer/data/lets"

export const metadata = { title: "Tenancy documents · Propvora" }

export default async function Route({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TenancyDocuments t={findTenancy(id) ?? tenancies[0]} />
}
