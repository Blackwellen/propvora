import { notFound } from "next/navigation"
import RentPayments from "@/features/customer/lets/RentPayments"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { getTenancy } from "@/lib/customer/lets"

export const metadata = { title: "Rent payments · Propvora" }
export const dynamic = "force-dynamic"

export default async function Route({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireCustomerContext()
  const t = await getTenancy(supabase, id)
  if (!t) notFound()
  return <RentPayments t={t} />
}
