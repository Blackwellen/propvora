'use client'

// ============================================================================
// FilterBar — shared premium marketplace filter system.
// Renders a horizontally-scrollable chip row; each chip opens a portalled
// popover panel anchored under it (escapes overflow/sticky clipping). Supports
// range sliders, multi-select, steppers, toggles and a sort menu. Fully
// controlled: parent owns `value` and applies it to the data.
// Light tokens only — NEVER `dark:`.
// ============================================================================

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, SlidersHorizontal, X, Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Filter schema ──────────────────────────────────────────────────────────
export type FilterDef =
  | { id: string; label: string; kind: 'range'; min: number; max: number; step?: number; unit?: string; prefix?: string }
  | { id: string; label: string; kind: 'multi'; options: { value: string; label: string }[] }
  | { id: string; label: string; kind: 'stepper'; min?: number; max?: number; suffix?: string }
  | { id: string; label: string; kind: 'toggle'; danger?: boolean }

export type FilterValue = {
  range?: [number, number]
  selected?: string[]
  count?: number
  on?: boolean
}

export type FilterState = Record<string, FilterValue>

export interface SortDef {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}

// ── Active-state helpers ─────────────────────────────────────────────────────
function isActive(def: FilterDef, v: FilterValue | undefined): boolean {
  if (!v) return false
  if (def.kind === 'range') return !!v.range && (v.range[0] > def.min || v.range[1] < def.max)
  if (def.kind === 'multi') return (v.selected?.length ?? 0) > 0
  if (def.kind === 'stepper') return (v.count ?? 0) > (def.min ?? 0)
  if (def.kind === 'toggle') return !!v.on
  return false
}

function chipSummary(def: FilterDef, v: FilterValue | undefined): string | null {
  if (!isActive(def, v) || !v) return null
  if (def.kind === 'range' && v.range) {
    const fmt = (n: number) => `${def.prefix ?? ''}${n.toLocaleString()}${def.unit ?? ''}`
    return `${fmt(v.range[0])}–${fmt(v.range[1])}`
  }
  if (def.kind === 'multi' && v.selected) {
    if (v.selected.length === 1) {
      return def.options.find(o => o.value === v.selected![0])?.label ?? `${v.selected.length}`
    }
    return `${v.selected.length}`
  }
  if (def.kind === 'stepper' && v.count != null) return `${v.count}+${def.suffix ?? ''}`
  return null
}

// ── Dual-thumb range slider (dependency-free) ────────────────────────────────
function RangeControl({
  def, value, onChange,
}: { def: Extract<FilterDef, { kind: 'range' }>; value: FilterValue; onChange: (v: FilterValue) => void }) {
  const lo = value.range?.[0] ?? def.min
  const hi = value.range?.[1] ?? def.max
  const step = def.step ?? 1
  const pct = (n: number) => ((n - def.min) / (def.max - def.min)) * 100
  const fmt = (n: number) => `${def.prefix ?? ''}${n.toLocaleString()}${def.unit ?? ''}`

  const setLo = (n: number) => onChange({ range: [Math.min(n, hi - step), hi] })
  const setHi = (n: number) => onChange({ range: [lo, Math.max(n, lo + step)] })

  return (
    <div className="px-1 pt-1">
      <div className="flex items-center justify-between mb-3">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[13px] font-semibold text-slate-700">{fmt(lo)}</span>
        <span className="text-slate-300">—</span>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[13px] font-semibold text-slate-700">
          {hi >= def.max ? `${fmt(def.max)}+` : fmt(hi)}
        </span>
      </div>
      <div className="relative h-7">
        {/* track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
        {/* selected range */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--brand)]"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range" min={def.min} max={def.max} step={step} value={lo}
          onChange={e => setLo(Number(e.target.value))}
          aria-label={`${def.label} minimum`}
          className="pv-range absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
        />
        <input
          type="range" min={def.min} max={def.max} step={step} value={hi}
          onChange={e => setHi(Number(e.target.value))}
          aria-label={`${def.label} maximum`}
          className="pv-range absolute inset-0 w-full appearance-none bg-transparent pointer-events-none"
        />
      </div>
      <style jsx>{`
        .pv-range::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          height: 20px; width: 20px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #2563eb;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
          cursor: pointer;
        }
        .pv-range::-moz-range-thumb {
          pointer-events: auto;
          height: 20px; width: 20px;
          border-radius: 9999px;
          background: #fff;
          border: 2px solid #2563eb;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}

function MultiControl({
  def, value, onChange,
}: { def: Extract<FilterDef, { kind: 'multi' }>; value: FilterValue; onChange: (v: FilterValue) => void }) {
  const selected = value.selected ?? []
  const toggle = (val: string) => {
    const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]
    onChange({ selected: next })
  }
  return (
    <div className="flex flex-col gap-0.5 max-h-[260px] overflow-y-auto overscroll-contain">
      {def.options.map(opt => {
        const on = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13.5px] text-slate-700 hover:bg-slate-50"
          >
            <span>{opt.label}</span>
            <span className={cn(
              'flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
              on ? 'border-[var(--brand)] bg-[var(--brand)] text-white' : 'border-slate-300',
            )}>
              {on && <Check className="h-3.5 w-3.5" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function StepperControl({
  def, value, onChange,
}: { def: Extract<FilterDef, { kind: 'stepper' }>; value: FilterValue; onChange: (v: FilterValue) => void }) {
  const min = def.min ?? 0
  const max = def.max ?? 20
  const count = value.count ?? min
  const set = (n: number) => onChange({ count: Math.max(min, Math.min(max, n)) })
  return (
    <div className="flex items-center justify-between px-1 py-1">
      <span className="text-[13.5px] font-medium text-slate-700">
        {count <= min ? 'Any' : `${count}+ ${def.suffix ?? ''}`.trim()}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button" onClick={() => set(count - 1)} disabled={count <= min}
          aria-label="Decrease"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-slate-400 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-[15px] font-semibold tabular-nums text-slate-900">{count}</span>
        <button
          type="button" onClick={() => set(count + 1)} disabled={count >= max}
          aria-label="Increase"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-slate-400 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Popover panel (portalled, anchored) ──────────────────────────────────────
function Popover({
  anchor, onClose, children, footer,
}: { anchor: HTMLElement; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect()
    const width = 288
    let left = r.left
    if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12
    if (left < 12) left = 12
    setPos({ top: r.bottom + 8, left })
  }, [anchor])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && !anchor.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [anchor, onClose])

  if (!pos) return null
  return createPortal(
    <div
      ref={ref}
      style={{ top: pos.top, left: pos.left, width: 288 }}
      className="fixed z-[200] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10"
    >
      <div className="mb-2">{children}</div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">{footer}</div>
    </div>,
    document.body,
  )
}

// ── FilterBar ────────────────────────────────────────────────────────────────
export interface FilterBarProps {
  filters: FilterDef[]
  value: FilterState
  onChange: (next: FilterState) => void
  sort?: SortDef
  resultCount?: number
  resultNoun?: string
  className?: string
}

export default function FilterBar({ filters, value, onChange, sort, resultCount, resultNoun = 'results', className }: FilterBarProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState<FilterValue>({})
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const activeCount = filters.reduce((n, f) => n + (isActive(f, value[f.id]) ? 1 : 0), 0)

  const openPopover = useCallback((def: FilterDef) => {
    if (def.kind === 'toggle') {
      onChange({ ...value, [def.id]: { on: !value[def.id]?.on } })
      return
    }
    setDraft(value[def.id] ?? {})
    setOpenId(def.id)
  }, [value, onChange])

  const applyDraft = useCallback((id: string) => {
    onChange({ ...value, [id]: draft })
    setOpenId(null)
  }, [draft, value, onChange])

  const clearOne = useCallback((id: string) => {
    const next = { ...value }
    delete next[id]
    onChange(next)
    setOpenId(null)
  }, [value, onChange])

  const clearAll = useCallback(() => {
    onChange({})
    if (sort) sort.onChange(sort.options[0]?.value ?? '')
  }, [onChange, sort])

  const openDef = filters.find(f => f.id === openId)
  const openAnchor = openId ? chipRefs.current[openId] : null

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]', className)}>
      <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-slate-400">
        <SlidersHorizontal className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[11px] font-bold text-white">{activeCount}</span>
        )}
      </span>

      {filters.map(def => {
        const active = isActive(def, value[def.id])
        const summary = chipSummary(def, value[def.id])
        return (
          <button
            key={def.id}
            ref={el => { chipRefs.current[def.id] = el }}
            type="button"
            onClick={() => openPopover(def)}
            aria-pressed={active}
            aria-expanded={openId === def.id}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]',
              def.kind === 'toggle' && def.danger
                ? active ? 'border-red-600 bg-red-600 text-white' : 'border-red-200 text-red-600 hover:bg-red-50'
                : active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            {def.label}
            {summary && <span className={cn('rounded-full px-1.5 text-[11px] font-bold', active ? 'bg-white/20' : 'bg-[var(--brand-soft)] text-[var(--brand)]')}>{summary}</span>}
            {def.kind !== 'toggle' && <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openId === def.id && 'rotate-180')} />}
          </button>
        )
      })}

      {sort && (
        <div className="ml-auto shrink-0 pl-2">
          <select
            value={sort.value}
            onChange={e => sort.onChange(e.target.value)}
            aria-label="Sort results"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-600 outline-none hover:border-slate-300"
          >
            {sort.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className={cn('shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)] whitespace-nowrap', sort ? '' : 'ml-auto')}
        >
          <X className="h-3.5 w-3.5" /> Clear all
        </button>
      )}

      {openDef && openAnchor && (
        <Popover
          anchor={openAnchor}
          onClose={() => setOpenId(null)}
          footer={
            <>
              <button onClick={() => clearOne(openDef.id)} className="text-[13px] font-medium text-slate-500 hover:text-slate-700">Reset</button>
              <button onClick={() => applyDraft(openDef.id)} className="rounded-lg bg-[var(--brand)] px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-[var(--brand-strong)]">Apply</button>
            </>
          }
        >
          {openDef.kind === 'range' && <RangeControl def={openDef} value={draft} onChange={setDraft} />}
          {openDef.kind === 'multi' && <MultiControl def={openDef} value={draft} onChange={setDraft} />}
          {openDef.kind === 'stepper' && <StepperControl def={openDef} value={draft} onChange={setDraft} />}
        </Popover>
      )}
    </div>
  )
}

// ── Shared predicate helpers for parents ─────────────────────────────────────
export function rangeOf(v: FilterState, id: string): [number, number] | null {
  return v[id]?.range ?? null
}
export function selectedOf(v: FilterState, id: string): string[] {
  return v[id]?.selected ?? []
}
export function countOf(v: FilterState, id: string): number {
  return v[id]?.count ?? 0
}
export function toggleOf(v: FilterState, id: string): boolean {
  return !!v[id]?.on
}
