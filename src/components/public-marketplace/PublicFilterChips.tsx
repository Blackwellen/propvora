'use client'

import { useState } from 'react'
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterChip {
  id: string
  label: string
  dropdown?: boolean
  danger?: boolean
  active?: boolean
}

interface PublicFilterChipsProps {
  chips: FilterChip[]
  onChipToggle?: (id: string) => void
  onClear?: () => void
}

export default function PublicFilterChips({ chips, onChipToggle, onClear }: PublicFilterChipsProps) {
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setActiveChips(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    onChipToggle?.(id)
  }

  const clear = () => {
    setActiveChips(new Set())
    onClear?.()
  }

  const hasActive = activeChips.size > 0

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
      {chips.map(chip => {
        const isActive = activeChips.has(chip.id)
        return (
          <button
            key={chip.id}
            onClick={() => toggle(chip.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
              chip.danger
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : isActive
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            {chip.label}
            {chip.dropdown && <ChevronDown className="h-3 w-3" />}
          </button>
        )
      })}
      {hasActive && (
        <button
          onClick={clear}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="h-3 w-3" />
          Clear all
        </button>
      )}
    </div>
  )
}
