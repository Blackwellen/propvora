'use client'

import Link from 'next/link'
import type { Dispute } from '../data/types'
import { useDispute } from '../data/hooks'
import { LoadingState, ErrorState, PermissionDeniedState, EmptyState } from './ui'

/**
 * Loads a dispute and renders state blocks, then hands the resolved dispute
 * (and data source) to the screen via render-prop.
 */
export default function WorkflowGuard({
  disputeId,
  children,
}: {
  disputeId: string
  children: (d: Dispute, source: 'live' | 'seed', reload: () => void) => React.ReactNode
}) {
  const { data, loading, error, source, reload } = useDispute(disputeId)

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50/40">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <LoadingState label="Loading dispute…" />
        </div>
      </div>
    )
  }
  if (error === 'permission-denied') {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-10"><PermissionDeniedState /></div>
    )
  }
  if (error === 'not-found' || !data) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <EmptyState
          title="Dispute not found"
          message="This dispute may have been closed, archived or moved."
          action={<Link href="/property-manager/bookings/disputes" className="text-sm text-blue-600 hover:text-blue-700">Back to disputes</Link>}
        />
      </div>
    )
  }
  if (error) {
    return <div className="max-w-[1400px] mx-auto px-6 py-10"><ErrorState onRetry={reload} /></div>
  }

  return <>{children(data, source, reload)}</>
}
