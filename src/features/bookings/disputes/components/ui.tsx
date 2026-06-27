'use client'

// ============================================================
// Shared dispute UI primitives — badges, stepper, state blocks,
// confirm modal, and formatting helpers. House style: white surfaces,
// rounded-2xl cards, 1px slate borders, blue/emerald/amber/red/violet.
// ============================================================
import { useState } from 'react'
import { AlertTriangle, Check, Loader2, Lock, Inbox, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DISPUTE_STAGES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type DisputePriority,
  type DisputeStageKey,
  type DisputeStatus,
} from '../data/types'

// ── formatting ────────────────────────────────────────────
export function fmtDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function daysRemaining(iso?: string): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

// ── badges ────────────────────────────────────────────────
const PRIORITY_STYLES: Record<DisputePriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-[var(--brand-soft)] text-[var(--brand)]',
  high: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
}

export function PriorityBadge({ priority }: { priority: DisputePriority }) {
  return (
    <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', PRIORITY_STYLES[priority])}>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

const STATUS_STYLES: Record<DisputeStatus, string> = {
  open: 'bg-[var(--brand-soft)] text-[var(--brand)]',
  awaiting_evidence: 'bg-amber-50 text-amber-700',
  in_review: 'bg-violet-50 text-violet-700',
  proposed: 'bg-sky-50 text-sky-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
  reopened: 'bg-red-50 text-red-700',
}

export function StatusBadge({ status }: { status: DisputeStatus }) {
  return (
    <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}

// ── stage stepper ─────────────────────────────────────────
function stageIndex(key: DisputeStageKey): number {
  return DISPUTE_STAGES.findIndex((s) => s.key === key)
}

export function StageStepper({
  current,
  orientation = 'horizontal',
  onStageClick,
}: {
  current: DisputeStageKey
  orientation?: 'horizontal' | 'vertical'
  onStageClick?: (key: DisputeStageKey) => void
}) {
  const currentIdx = stageIndex(current)

  if (orientation === 'vertical') {
    return (
      <ol className="space-y-3">
        {DISPUTE_STAGES.map((stage, idx) => {
          const done = idx < currentIdx
          const active = idx === currentIdx
          return (
            <li key={stage.key} className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  done && 'bg-emerald-500 text-white',
                  active && 'bg-[var(--brand)] text-white',
                  !done && !active && 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </span>
              <div className="min-w-0">
                <p className={cn('text-sm font-medium', active ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400')}>
                  {stage.label}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <ol className="flex items-center w-full">
      {DISPUTE_STAGES.map((stage, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        const clickable = !!onStageClick
        return (
          <li key={stage.key} className={cn('flex items-center', idx < DISPUTE_STAGES.length - 1 && 'flex-1')}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onStageClick?.(stage.key)}
              className={cn('flex items-center gap-2 shrink-0', clickable && 'cursor-pointer')}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  done && 'bg-emerald-500 text-white',
                  active && 'bg-[var(--brand)] text-white ring-4 ring-[var(--color-brand-100)]',
                  !done && !active && 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : idx + 1}
              </span>
              <span className={cn('text-sm font-medium whitespace-nowrap', active ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400')}>
                {stage.label}
              </span>
            </button>
            {idx < DISPUTE_STAGES.length - 1 && (
              <span className={cn('mx-3 h-px flex-1', done ? 'bg-emerald-300' : 'bg-slate-200')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ── section card ──────────────────────────────────────────
export function SectionCard({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('bg-white border border-slate-200 rounded-2xl shadow-sm', className)}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

// ── state blocks (loading / empty / error / permission) ───
export function LoadingState({ label = 'Loading disputes…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Loader2 className="h-7 w-7 text-[var(--brand)] animate-spin" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="h-11 bg-slate-50 border-b border-slate-200" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-9 w-9 rounded-full bg-slate-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-slate-100 animate-pulse" />
              <div className="h-2.5 w-1/4 rounded bg-slate-100 animate-pulse" />
            </div>
            <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
            <div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function EmptyState({
  title = 'No disputes',
  message = 'There are no disputes matching your filters.',
  action,
}: {
  title?: string
  message?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-200 rounded-2xl">
      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
        <Inbox className="h-6 w-6 text-slate-400" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-red-100 rounded-2xl">
      <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">Something went wrong</p>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{message ?? 'We could not load this dispute. Please try again.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      )}
    </div>
  )
}

export function PermissionDeniedState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-amber-100 rounded-2xl">
      <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
        <Lock className="h-6 w-6 text-amber-500" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">You don’t have access</p>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        Your role doesn’t permit viewing disputes for this workspace. Contact a workspace admin.
      </p>
    </div>
  )
}

export function SourceBadge({ source }: { source: 'live' | 'seed' }) {
  if (source === 'live') return null
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
      Demo data
    </span>
  )
}

// ── confirm modal ─────────────────────────────────────────
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-4">
          <button
            onClick={onClose}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={cn(
              'rounded-xl px-3.5 py-2 text-sm font-medium text-white transition-colors',
              tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--brand)] hover:bg-[var(--brand-strong)]',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── lightweight info drawer (for stub actions) ────────────
export function StubDrawer({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children?: React.ReactNode
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 text-sm text-slate-600">
          {children ?? (
            <p>This action is available in your workspace. Wire it to your live handler to complete the flow.</p>
          )}
        </div>
      </aside>
    </div>
  )
}

/** Small hook to manage a named toast/feedback line without a full toast system. */
export function useActionFeedback() {
  const [msg, setMsg] = useState<string | null>(null)
  const fire = (text: string) => {
    setMsg(text)
    window.setTimeout(() => setMsg(null), 2600)
  }
  return { msg, fire }
}

export function FeedbackToast({ msg }: { msg: string | null }) {
  if (!msg) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-sm rounded-xl px-4 py-2.5 shadow-lg">
      <Check className="h-4 w-4 text-emerald-400" />
      {msg}
    </div>
  )
}
