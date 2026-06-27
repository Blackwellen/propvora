import Link from "next/link"
import { Sparkles } from "lucide-react"

interface HmoQuickActionsPanelProps {
  propertyId: string
}

export function HmoQuickActionsPanel({ propertyId }: HmoQuickActionsPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[var(--brand)]" />
        <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
      </div>
      <div className="px-4 py-4 flex flex-col gap-2">
        <Link
          href={`/property-manager/portfolio/properties/${propertyId}/hmo/rooms`}
          className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center"
        >
          Onboard New Tenant
        </Link>
        <Link
          href={`/property-manager/portfolio/properties/${propertyId}/hmo/utilities`}
          className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center"
        >
          Add Utility Bill
        </Link>
        <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center">
          Run Rent Chase
        </button>
        <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center">
          Generate HMO Report
        </button>
        <Link
          href={`/property-manager/portfolio/properties/${propertyId}/hmo/analytics`}
          className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center"
        >
          View Analytics
        </Link>
      </div>
    </div>
  )
}
