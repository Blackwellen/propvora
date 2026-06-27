"use client"

import { ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusPill, type PillTone } from "../../../components/StatusPill"

interface Req {
  id: string
  title: string
  category: string
  reported: string
  status: string
  tone: PillTone
  priority: string
  pTone: PillTone
}

interface Props {
  requests: Req[]
  selectedId: string
  onSelect: (id: string) => void
}

export default function MaintenanceList({ requests, selectedId, onSelect }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-slate-900">Your maintenance requests</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input placeholder="Search" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)] w-36" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="py-2 pr-2 font-semibold">Issue</th>
              <th className="py-2 px-2 font-semibold">Category</th>
              <th className="py-2 px-2 font-semibold">Reported</th>
              <th className="py-2 px-2 font-semibold">Priority</th>
              <th className="py-2 px-2 font-semibold">Status</th>
              <th className="py-2 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests.map((r) => {
              const active = r.id === selectedId
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    "text-[12.5px] cursor-pointer",
                    active ? "bg-[var(--brand-soft)]/40 outline outline-2 -outline-offset-2 outline-[var(--brand)]" : "hover:bg-slate-50"
                  )}
                >
                  <td className="py-3 pr-2">
                    <p className="font-semibold text-slate-800">{r.title}</p>
                    <p className="text-[10.5px] text-slate-400">{r.id}</p>
                  </td>
                  <td className="py-3 px-2 text-slate-500">{r.category}</td>
                  <td className="py-3 px-2 text-slate-500">{r.reported}</td>
                  <td className="py-3 px-2">
                    <StatusPill tone={r.pTone}>{r.priority}</StatusPill>
                  </td>
                  <td className="py-3 px-2">
                    <StatusPill tone={r.tone}>{r.status}</StatusPill>
                  </td>
                  <td className="py-3 px-2">
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
