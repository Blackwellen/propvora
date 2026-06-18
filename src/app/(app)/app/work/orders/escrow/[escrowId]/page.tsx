import { OrderEscrowDetailView } from "@/features/orders/components/OrderEscrowDetailView"

export default async function OrderEscrowDetailPage({ params }: { params: Promise<{ escrowId: string }> }) {
  const { escrowId } = await params
  return <OrderEscrowDetailView escrowId={decodeURIComponent(escrowId)} />
}
