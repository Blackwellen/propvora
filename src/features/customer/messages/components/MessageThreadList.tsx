"use client"

import { Search, SlidersHorizontal, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusPill } from "../../components/StatusPill"

type Role = "Host" | "Property Manager" | "Support" | "Long-let Manager"
interface Convo {
  id: string; name: string; role: Role; subject: string; preview: string; time: string; unread: number
}
const ROLE_TONE: Record<Role, "violet" | "blue" | "amber" | "emerald"> = {
  Host: "violet", "Property Manager": "blue", Support: "amber", "Long-let Manager": "emerald",
}
const FILTERS = ["All", "Unread", "Hosts", "Support"] as const

interface Props {
  convos: Convo[]
  selectedId: string
  filter: (typeof FILTERS)[number]
  onSelect: (id: string) => void
  onFilterChange: (f: (typeof FILTERS)[number]) => void
}

export default function MessageThreadList({ convos, selectedId, filter, onSelect, onFilterChange }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input placeholder="Search messages" className="w-full bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12.5px] outline-none" /></div>
          <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400"><SlidersHorizontal className="w-4 h-4" /></button>
          <button className="inline-flex items-center gap-1 text-[12px] text-slate-500">All <ChevronDown className="w-3.5 h-3.5" /></button>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => onFilterChange(f)} className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-semibold inline-flex items-center gap-1", filter === f ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100")}>
              {f}{f === "All" && <span className="opacity-70">12</span>}{f === "Unread" && <span className="opacity-70">3</span>}{f === "Hosts" && <span className="opacity-70">6</span>}{f === "Support" && <span className="opacity-70">2</span>}
            </button>
          ))}
        </div>
      </div>
      <ul className="max-h-[640px] overflow-y-auto divide-y divide-slate-50">
        {convos.map((c) => {
          const active = c.id === selectedId
          return (
            <li key={c.id}>
              <button onClick={() => onSelect(c.id)} className={cn("w-full text-left flex gap-2.5 p-3 transition-colors", active ? "bg-blue-50/50" : "hover:bg-slate-50")}>
                <span className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><p className="text-[12.5px] font-semibold text-slate-800 truncate">{c.name}</p><StatusPill tone={ROLE_TONE[c.role]}>{c.role}</StatusPill></div>
                  <p className="text-[11.5px] font-medium text-slate-600 truncate">{c.subject}</p>
                  <p className="text-[11px] text-slate-400 truncate">{c.preview}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0"><span className="text-[10.5px] text-slate-400">{c.time}</span>{c.unread > 0 && <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{c.unread}</span>}</div>
              </button>
            </li>
          )
        })}
      </ul>
      <button className="w-full py-3 text-[12px] font-semibold text-blue-600 border-t border-slate-100">View archived conversations</button>
    </div>
  )
}
