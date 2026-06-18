import ResolutionStage from '@/features/bookings/disputes/components/stages/ResolutionStage'

export const metadata = { title: 'Dispute · Resolution' }

export default async function Page({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params
  return <ResolutionStage disputeId={disputeId} />
}
