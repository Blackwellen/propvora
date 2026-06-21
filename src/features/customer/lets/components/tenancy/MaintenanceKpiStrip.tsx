import { AlertTriangle, CheckCircle2, Clock, Loader, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

const KPIS = [
  { id: "open", label: "Open requests", value: "4", icon: Wrench, bg: "bg-blue-50 text-blue-600" },
  { id: "progress", label: "In progress", value: "2", icon: Loader, bg: "bg-amber-50 text-amber-600" },
  { id: "emergency", label: "Emergency issues", value: "1", icon: AlertTriangle, bg: "bg-rose-50 text-rose-500" },
  { id: "awaiting", label: "Awaiting landlord", value: "1", icon: Clock, bg: "bg-violet-50 text-violet-600" },
  { id: "resolved", label: "Resolved this month", value: "3", icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
]

export default function MaintenanceKpiStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {KPIS.map((k) => {
        const Icon = k.icon
        return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
            <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
          </div>
        )
      })}
    </div>
  )
}
