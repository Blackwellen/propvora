import { Calendar, FileText, Heart, Key, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

const KPIS = [
  { id: "saved", label: "Saved lets", value: "18", icon: Heart, bg: "bg-rose-50 text-rose-500" },
  { id: "viewings", label: "Upcoming viewings", value: "4", icon: Calendar, bg: "bg-blue-50 text-blue-600" },
  { id: "apps", label: "Active applications", value: "3", icon: FileText, bg: "bg-violet-50 text-violet-600" },
  { id: "offers", label: "Offers in progress", value: "2", icon: Tag, bg: "bg-amber-50 text-amber-600" },
  { id: "tenancies", label: "Active tenancies", value: "1", icon: Key, bg: "bg-emerald-50 text-emerald-600" },
]

export default function LetsKpiStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {KPIS.map((k) => {
        const Icon = k.icon
        return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}>
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-[18px] font-bold text-slate-900 leading-none">{k.value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{k.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
