import EvidenceStage from '@/features/bookings/disputes/components/stages/EvidenceStage'

export const metadata = { title: 'Dispute · Evidence' }

export default async function Page({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params
  return <EvidenceStage disputeId={disputeId} />
}
