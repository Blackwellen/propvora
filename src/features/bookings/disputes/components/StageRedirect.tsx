'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispute } from '../data/hooks'
import { LoadingState, ErrorState, EmptyState } from './ui'
import Link from 'next/link'

const STAGE_PATH: Record<string, string> = {
  intake: 'intake',
  evidence: 'evidence',
  review: 'review',
  resolution: 'resolution',
  closed: 'closed',
}

/** Index route: redirect to the dispute's current stage. */
export default function StageRedirect({ disputeId }: { disputeId: string }) {
  const router = useRouter()
  const { data, loading, error } = useDispute(disputeId)

  useEffect(() => {
    if (!loading && data) {
      const path = STAGE_PATH[data.stage] ?? 'intake'
      router.replace(`/property-manager/bookings/disputes/${disputeId}/${path}`)
    }
  }, [loading, data, disputeId, router])

  if (loading || data) {
    return (
      <div className="h-full bg-slate-50/40">
        <div className="max-w-[1400px] mx-auto px-6 py-6"><LoadingState label="Opening dispute…" /></div>
      </div>
    )
  }
  if (error === 'not-found' || !data) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <EmptyState
          title="Dispute not found"
          message="This dispute may have been closed or archived."
          action={<Link href="/property-manager/bookings/disputes" className="text-sm text-[var(--brand)] hover:text-[var(--brand)]">Back to disputes</Link>}
        />
      </div>
    )
  }
  return <div className="max-w-[1400px] mx-auto px-6 py-10"><ErrorState /></div>
}
