"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { ChevronLeft, ChevronRight, Ban, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile, useHasMounted } from "@/components/mobile/useBreakpoint"
import MobileSheet from "@/components/mobile/MobileSheet"
import { updateBlockedDates } from "./actions"
import type { BookableListing } from "./server"

/* ──────────────────────────────────────────────────────────────────────────
   BlockedDatesEditor — availability / blocked-date management for one listing.

   Desktop: an inline month calendar; tap days to select, then Block / Unblock.
   Mobile: the SAME month calendar inside a MobileSheet (bottom sheet) so the
   thumb-friendly grid never fights the page. Selected dates persist via the
   updateBlockedDates server action (tolerant of an unprovisioned schema).

   Blocked dates are loaded by the parent for the visible window and passed in;
   the editor reports changes optimistically and asks the parent to refresh.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  listing: BookableListing
  open: boolean
  onClose: () => void
  /** Currently-blocked dates (yyyy-mm-dd) for the window, from the server. */
  initialBlocked: string[]
  ready: boolean
  onChanged: () => void
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"]

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function CalendarBody({
  cursor,
  setCursor,
  blocked,
  selected,
  toggle,
}: {
  cursor: Date
  setCursor: (d: Date) => void
  blocked: Set<string>
  selected: Set<string>
  toggle: (key: string) => void
}) {
  const cells = useMemo(() => {
    const first = startOfMonth(cursor)
    const firstWeekday = (first.getDay() + 6) % 7
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - firstWeekday)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }, [cursor])

  const today = ymd(new Date())

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCursor(addMonths(cursor, -1))}
          aria-label="Previous month"
          className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800">
          {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => setCursor(addMonths(cursor, 1))}
          aria-label="Next month"
          className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-400 uppercase py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const key = ymd(d)
          const inMonth = d.getMonth() === cursor.getMonth()
          const isBlocked = blocked.has(key)
          const isSelected = selected.has(key)
          const isToday = key === today
          const isPast = key < today
          return (
            <button
              key={i}
              disabled={!inMonth || isPast}
              onClick={() => toggle(key)}
              className={cn(
                "aspect-square rounded-lg text-[12px] font-medium flex items-center justify-center transition-colors relative",
                !inMonth && "opacity-0 pointer-events-none",
                isPast && inMonth && "text-slate-300 cursor-not-allowed",
                isSelected
                  ? "bg-[var(--brand)] text-white"
                  : isBlocked
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : !isPast && "text-slate-700 hover:bg-slate-100 border border-transparent",
                isToday && !isSelected && "ring-1 ring-[var(--brand)]/40"
              )}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-50 border border-red-200" /> Blocked
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[var(--brand)]" /> Selected
        </span>
      </div>
    </div>
  )
}

export function BlockedDatesEditor({ listing, open, onClose, initialBlocked, ready, onChanged }: Props) {
  const mounted = useHasMounted()
  const isMobile = useIsMobile()
  const [cursor, setCursor] = useState<Date>(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [blocked, setBlocked] = useState<Set<string>>(new Set(initialBlocked))
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setBlocked(new Set(initialBlocked))
  }, [initialBlocked])

  useEffect(() => {
    if (!open) {
      setSelected(new Set())
      setError(null)
    }
  }, [open])

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function apply(block: boolean) {
    const dates = Array.from(selected)
    if (dates.length === 0) return
    setError(null)
    startTransition(async () => {
      const res = await updateBlockedDates(listing.id, dates, block)
      if (res.ok) {
        setBlocked((prev) => {
          const next = new Set(prev)
          for (const d of dates) {
            if (block) next.add(d)
            else next.delete(d)
          }
          return next
        })
        setSelected(new Set())
        onChanged()
      } else {
        setError(res.error ?? "Could not update availability.")
      }
    })
  }

  const body = (
    <div className="space-y-4">
      {!ready && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-[12px] text-amber-700">
          The availability engine isn&apos;t provisioned yet. Changes will be saved once it&apos;s live.
        </div>
      )}
      <CalendarBody
        cursor={cursor}
        setCursor={setCursor}
        blocked={blocked}
        selected={selected}
        toggle={toggle}
      />
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={() => apply(true)}
          disabled={pending || selected.size === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
          Block {selected.size > 0 ? `(${selected.size})` : ""}
        </button>
        <button
          onClick={() => apply(false)}
          disabled={pending || selected.size === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          Open {selected.size > 0 ? `(${selected.size})` : ""}
        </button>
      </div>
    </div>
  )

  if (!open) return null

  // Mobile → bottom sheet
  if (mounted && isMobile) {
    return (
      <MobileSheet open={open} onClose={onClose} title="Availability" description={listing.title}>
        <div className="pb-2">{body}</div>
      </MobileSheet>
    )
  }

  // Desktop → modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Availability</h3>
          <p className="text-[12px] text-slate-500 truncate">{listing.title}</p>
        </div>
        <div className="px-5 py-4">{body}</div>
      </div>
    </div>
  )
}

export default BlockedDatesEditor
