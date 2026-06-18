import { ManagedEscrowDetailView } from "@/features/escrow/components/ManagedEscrowDetailView"

export default async function MoneyEscrowDetailPage({ params }: { params: Promise<{ escrowId: string }> }) {
  const { escrowId } = await params
  return <ManagedEscrowDetailView escrowId={decodeURIComponent(escrowId)} />
}
