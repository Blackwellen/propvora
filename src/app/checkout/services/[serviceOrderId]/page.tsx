import { ServiceCheckout } from "@/features/checkout/screens/ServiceCheckout"

export const dynamic = "force-dynamic"

export default async function PublicServiceCheckoutPage({
  params,
}: {
  params: Promise<{ serviceOrderId: string }>
}) {
  const { serviceOrderId } = await params
  return <ServiceCheckout serviceOrderId={serviceOrderId} />
}
