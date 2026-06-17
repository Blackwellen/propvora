'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function MapSearchToggle() {
  const [enabled, setEnabled] = useState(true)

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors bg-white shadow-sm',
        enabled ? 'border-blue-600 text-blue-600' : 'border-slate-200 text-slate-600',
      )}
    >
      <div className={cn('w-8 h-4.5 rounded-full relative transition-colors', enabled ? 'bg-blue-600' : 'bg-slate-300')}>
        <div className={cn('absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform', enabled ? 'translate-x-4' : 'translate-x-0.5')} />
      </div>
      Search as I move the map
    </button>
  )
}
