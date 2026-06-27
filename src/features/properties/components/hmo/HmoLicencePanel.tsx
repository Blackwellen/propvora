import { ShieldCheck } from "lucide-react"

interface HmoLicencePanelProps {
  totalRooms: number
}

export function HmoLicencePanel({ totalRooms }: HmoLicencePanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-green-600" />
        <h3 className="text-sm font-semibold text-slate-900">HMO Licence Status</h3>
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Licence Type</span>
          <span className="text-xs font-semibold text-slate-800">Mandatory</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Max Occupants</span>
          <span className="text-xs font-semibold text-slate-800">{totalRooms || "—"}</span>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <button className="text-xs text-[var(--brand)] hover:underline font-medium">
            View Licence Document →
          </button>
        </div>
      </div>
    </div>
  )
}
