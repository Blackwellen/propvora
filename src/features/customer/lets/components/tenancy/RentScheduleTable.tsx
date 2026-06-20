"use client"

import { Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../../../components/toast"
import { StatusPill, type PillTone } from "../../../components/StatusPill"

interface Sched {
  id: string
  month: string
  due: string
  amountPence: number
  status: string
  tone: PillTone
  method: string
}

interface Props {
  schedule: Sched[]
  selectedId: string
  onSelect: (id: string) => void
}

export default function RentScheduleTable({ schedule, selectedId, onSelect }: Props) {
  const { toast } = useCustomerToast()

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-3">Rent schedule</h3>

      {/* Mobile card list */}
      <ul className="md:hidden space-y-2" role="list">
        {schedule.map((s) => {
          const active = s.id === selectedId
          return (
            <li
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={cn(
                "rounded-xl border p-3 cursor-pointer",
                active ? "border-blue-500 bg-blue-50/40" : "border-slate-100 bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-800 text-[13px]">{s.month}</p>
                  <p className="text-[11px] text-slate-400">Due {s.due}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-[14px]">{formatPence(s.amountPence, "GBP")}</p>
                  <StatusPill tone={s.tone}>{s.status}</StatusPill>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{s.method}</span>
                {s.status === "Paid" ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); toast("Downloading receipt…", "info") }}
                    className="text-blue-600 flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Receipt
                  </button>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="py-2 pr-2 font-semibold">Month</th>
              <th className="py-2 px-2 font-semibold">Due date</th>
              <th className="py-2 px-2 font-semibold">Amount</th>
              <th className="py-2 px-2 font-semibold">Status</th>
              <th className="py-2 px-2 font-semibold">Method</th>
              <th className="py-2 px-2 font-semibold w-16">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {schedule.map((s) => {
              const active = s.id === selectedId
              return (
                <tr
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={cn(
                    "text-[12.5px] cursor-pointer",
                    active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50"
                  )}
                >
                  <td className="py-3 pr-2 font-semibold text-slate-800">{s.month}</td>
                  <td className="py-3 px-2 text-slate-500">{s.due}</td>
                  <td className="py-3 px-2 font-semibold text-slate-900">{formatPence(s.amountPence, "GBP")}</td>
                  <td className="py-3 px-2"><StatusPill tone={s.tone}>{s.status}</StatusPill></td>
                  <td className="py-3 px-2 text-slate-500">{s.method}</td>
                  <td className="py-3 px-2">
                    {s.status === "Paid" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); toast("Downloading receipt…", "info") }}
                        className="text-blue-600"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
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
