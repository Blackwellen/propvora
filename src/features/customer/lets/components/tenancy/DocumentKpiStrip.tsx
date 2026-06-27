import { Clock, FilePlus2, FileSignature, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const KPIS = [
  { id: "total", label: "Total documents", value: "38", icon: FileText, bg: "bg-[var(--brand-soft)] text-[var(--brand)]" },
  { id: "sign", label: "Awaiting signature", value: "2", icon: FileSignature, bg: "bg-amber-50 text-amber-600" },
  { id: "recent", label: "Recently added", value: "4", icon: FilePlus2, bg: "bg-violet-50 text-violet-600" },
  { id: "expiring", label: "Expiring soon", value: "1", icon: Clock, bg: "bg-rose-50 text-rose-500" },
]

export default function DocumentKpiStrip() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
