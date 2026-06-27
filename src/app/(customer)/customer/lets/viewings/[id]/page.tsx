import { notFound } from "next/navigation"
import ViewingDetail from "@/features/customer/lets/ViewingDetail"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { getViewing } from "@/lib/customer/lets"

export const metadata = { title: "Viewing · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerViewingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireCustomerContext()
  const viewing = await getViewing(supabase, id)
  if (!viewing) notFound()
  return <ViewingDetail v={viewing} />
}
