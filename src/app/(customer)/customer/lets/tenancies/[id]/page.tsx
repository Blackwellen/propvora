import { notFound } from "next/navigation"
import TenancyProfile from "@/features/customer/lets/TenancyProfile"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { getTenancy } from "@/lib/customer/lets"

export const metadata = { title: "Tenancy · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerTenancyProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireCustomerContext()
  const tenancy = await getTenancy(supabase, id)
  if (!tenancy) notFound()
  return <TenancyProfile t={tenancy} />
}
