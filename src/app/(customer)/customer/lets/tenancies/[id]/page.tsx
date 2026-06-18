import TenancyProfile from "@/features/customer/lets/TenancyProfile"
import { findTenancy, tenancies } from "@/features/customer/data/lets"

export const metadata = { title: "Tenancy · Propvora" }

export default async function CustomerTenancyProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tenancy = findTenancy(id) ?? tenancies[0]
  return <TenancyProfile t={tenancy} />
}
