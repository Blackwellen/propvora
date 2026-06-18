import { OrderDetailView } from "@/features/orders/components/OrderDetailView"

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  return <OrderDetailView orderId={decodeURIComponent(orderId)} />
}
