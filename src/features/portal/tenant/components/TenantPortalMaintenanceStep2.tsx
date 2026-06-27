"use client"

/**
 * TenantPortalMaintenanceStep2
 *
 * Step 2 of the tenant repair reporting wizard: confirm access and availability.
 */

interface Props {
  accessNotes: string
  preferredDate: string
  onAccessNotes: (v: string) => void
  onPreferredDate: (v: string) => void
}

export function TenantPortalMaintenanceStep2({ accessNotes, preferredDate, onAccessNotes, onPreferredDate }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-0.5">Step 2 — Access &amp; availability</h2>
        <p className="text-xs text-slate-500">Help your property manager arrange access smoothly.</p>
      </div>

      <div>
        <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">Access notes (optional)</label>
        <textarea
          value={accessNotes}
          onChange={(e) => onAccessNotes(e.target.value)}
          rows={3}
          placeholder="e.g. Key is with neighbour, dog in property, best access via rear gate…"
          className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none resize-none focus:ring-2 focus:ring-[var(--color-brand-100)]"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">Preferred date (optional)</label>
        <input
          type="date"
          value={preferredDate}
          onChange={(e) => onPreferredDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-brand-100)]"
        />
        <p className="text-[11px] text-slate-400 mt-1">A preference, not a guarantee — your manager will confirm the schedule.</p>
      </div>
    </div>
  )
}
