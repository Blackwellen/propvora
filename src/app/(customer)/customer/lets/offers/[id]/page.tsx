import OfferDetail from "@/features/customer/lets/OfferDetail"
import { findOffer, offers } from "@/features/customer/data/lets"

export const metadata = { title: "Offer · Propvora" }

export default async function CustomerOfferDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const offer = findOffer(id) ?? offers[0]
  return <OfferDetail o={offer} />
}
