import ReviewStage from '@/features/bookings/disputes/components/stages/ReviewStage'

export const metadata = { title: 'Dispute · Review' }

export default async function Page({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params
  return <ReviewStage disputeId={disputeId} />
}
