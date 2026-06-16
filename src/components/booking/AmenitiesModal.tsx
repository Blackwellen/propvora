"use client"

import { useState } from "react"
import { X, CheckCircle2 } from "lucide-react"

interface AmenitiesModalProps {
  amenityGroups: Record<string, string[]>
  totalCount: number
}

export default function AmenitiesModal({ amenityGroups, totalCount }: AmenitiesModalProps) {
  const [open, setOpen] = useState(false)

  if (totalCount === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-[13.5px] font-semibold text-[#0B1B3F] hover:bg-slate-50 transition-colors"
      >
        Show all {totalCount} amenities
      </button>

      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <h2 className="text-[17px] font-bold text-[#0B1B3F]">What this place offers</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close amenities"
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-5 space-y-7">
              {Object.entries(amenityGroups).map(([group, items]) => (
                <div key={group}>
                  <h3 className="text-[14px] font-bold text-[#0B1B3F] mb-3">{group}</h3>
                  <ul className="space-y-3">
                    {items.map((it, i) => (
                      <li key={i} className="flex items-center gap-3 text-[14px] text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
