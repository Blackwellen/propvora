import { notFound } from "next/navigation"
import LetDetail from "@/features/customer/lets/LetDetail"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { getLet } from "@/lib/customer/lets"

export const metadata = { title: "Property · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerLetDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireCustomerContext()
  const property = await getLet(supabase, id)
  if (!property) notFound()
  return <LetDetail p={property} />
}
