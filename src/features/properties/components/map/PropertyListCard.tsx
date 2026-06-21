import { cn } from "@/lib/utils"

type HealthStatus = "good" | "at_risk" | "overdue"

interface MapProperty {
  id: string
  name: string
  address: string
  type: string
  status: string
  health: HealthStatus
  units: number
  vacant: number
  rentRoll: number
  lat: number
  lng: number
}

const STATUS_LABELS: Record<string, string> = {
  active:     "Active",
  void:       "Void",
  off_market: "Off Market",
  archived:   "Archived",
}

const HEALTH_CONFIG: Record<HealthStatus, { dot: string; label: string }> = {
  good:     { dot: "bg-emerald-500", label: "Good" },
  at_risk:  { dot: "bg-amber-500",   label: "At Risk" },
  overdue:  { dot: "bg-red-500",     label: "Overdue" },
}

function formatCurrency(n: number) {
  if (n >= 1000) return `£${(n / 1000).toFixed(1)}k`
  return `£${n}`
}

interface PropertyListCardProps {
  property: MapProperty
  isSelected: boolean
  onClick: (id: string) => void
}

export function PropertyListCard({ property, isSelected, onClick }: PropertyListCardProps) {
  const hConfig = HEALTH_CONFIG[property.health]

  return (
    <button
      onClick={() => onClick(property.id)}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors",
        isSelected && "bg-blue-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-900 truncate">{property.name}</p>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{property.address}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn("w-1.5 h-1.5 rounded-full", hConfig.dot)} />
          <span className="text-[10px] font-medium text-slate-500">{hConfig.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-[11px] text-slate-500">{STATUS_LABELS[property.status] ?? property.status}</span>
        <span className="text-[11px] text-slate-400">·</span>
        <span className="text-[11px] text-slate-500">{property.units} units</span>
        {property.vacant > 0 && (
          <>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-amber-600 font-medium">{property.vacant} vacant</span>
          </>
        )}
        <span className="ml-auto text-[11px] font-semibold text-slate-700">
          {formatCurrency(property.rentRoll)}/mo
        </span>
      </div>
    </button>
  )
}
