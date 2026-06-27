import { notFound } from "next/navigation"
import OfferDetail from "@/features/customer/lets/OfferDetail"
import { requireCustomerContext } from "@/lib/customer/workspace"
import { getOffer } from "@/lib/customer/lets"

export const metadata = { title: "Offer · Propvora" }
export const dynamic = "force-dynamic"

export default async function CustomerOfferDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireCustomerContext()
  const offer = await getOffer(supabase, id)
  if (!offer) notFound()
  return <OfferDetail o={offer} />
}
