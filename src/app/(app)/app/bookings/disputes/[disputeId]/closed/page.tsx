import ClosedStage from '@/features/bookings/disputes/components/stages/ClosedStage'

export const metadata = { title: 'Dispute · Finalisation' }

export default async function Page({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params
  return <ClosedStage disputeId={disputeId} />
}
