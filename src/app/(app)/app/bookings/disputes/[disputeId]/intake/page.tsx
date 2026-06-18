import IntakeStage from '@/features/bookings/disputes/components/stages/IntakeStage'

export const metadata = { title: 'Dispute · Intake' }

export default async function Page({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params
  return <IntakeStage disputeId={disputeId} />
}
