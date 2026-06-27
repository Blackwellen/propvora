"use client"

import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusPill, type PillTone } from "../../../components/StatusPill"

interface Doc {
  id: string
  name: string
  category: string
  date: string
  size: string
  status: string
  tone: PillTone
}

interface Props {
  docs: Doc[]
  selectedId: string
  onSelect: (id: string) => void
}

export default function DocumentList({ docs, selectedId, onSelect }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <button className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-600">
          All categories
        </button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            placeholder="Search documents"
            className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)] w-44"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="py-2 pr-2 font-semibold">Document</th>
              <th className="py-2 px-2 font-semibold">Category</th>
              <th className="py-2 px-2 font-semibold">Date</th>
              <th className="py-2 px-2 font-semibold">Status</th>
              <th className="py-2 px-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {docs.map((d) => {
              const active = d.id === selectedId
              return (
                <tr
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className={cn(
                    "text-[12.5px] cursor-pointer",
                    active ? "bg-[var(--brand-soft)]/40 outline outline-2 -outline-offset-2 outline-[var(--brand)]" : "hover:bg-slate-50"
                  )}
                >
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center text-[9px] font-bold shrink-0">
                        PDF
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{d.name}</p>
                        <p className="text-[10.5px] text-slate-400">{d.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-slate-500">{d.category}</td>
                  <td className="py-3 px-2 text-slate-500">{d.date}</td>
                  <td className="py-3 px-2">
                    <StatusPill tone={d.tone}>{d.status}</StatusPill>
                  </td>
                  <td className="py-3 px-2">
                    <Download className="w-4 h-4 text-slate-400" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-[12px] text-slate-500">
        <span>Showing 7 of 38 documents</span>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold">1</button>
          <button className="w-7 h-7 rounded-lg border border-slate-200 text-[12px]">2</button>
          <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
