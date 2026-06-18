import { EmergencyCheckout } from "@/features/checkout/screens/EmergencyCheckout"

export const dynamic = "force-dynamic"

export default async function PublicEmergencyCheckoutPage({
  params,
}: {
  params: Promise<{ emergencyOrderId: string }>
}) {
  const { emergencyOrderId } = await params
  return <EmergencyCheckout emergencyOrderId={emergencyOrderId} />
}
