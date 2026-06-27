'use client'

import type { BookingStatus } from '@/lib/property-manager/bookings/types'
import { cn } from '@/lib/utils'

interface BookingStatusBadgeProps {
  status: BookingStatus
  className?: string
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  checked_in: {
    label: 'Checked in',
    className: 'bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]',
  },
  checked_out: {
    label: 'Checked out',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
  active: {
    label: 'Active',
    className: 'bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--color-brand-100)]',
  },
}

export default function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
