import StageRedirect from '@/features/bookings/disputes/components/StageRedirect'

export default async function Page({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params
  return <StageRedirect disputeId={disputeId} />
}
