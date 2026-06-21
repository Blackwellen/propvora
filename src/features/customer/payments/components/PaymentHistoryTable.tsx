"use client"

import { Search, Filter, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { StatusPill, type PillTone } from "../../components/StatusPill"
import { useCustomerToast } from "../../components/toast"

interface Pay {
  id: string; property: string; desc: string; image: string; amountPence: number; due: string
  status: string; tone: PillTone; method: string; canPay?: boolean
}

interface Props {
  payments: Pay[]
  selectedId: string
  onSelect: (id: string) => void
}

export default function PaymentHistoryTable({ payments, selectedId, onSelect }: Props) {
  const { toast } = useCustomerToast()

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-bold text-slate-900">Recent &amp; upcoming payments</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input placeholder="Search" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-32" />
          </div>
          <button className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
      </div>

      {/* Mobile card list */}
      <ul className="md:hidden space-y-2.5" role="list">
        {payments.map((p) => {
          const active = p.id === selectedId
          return (
            <li
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "rounded-xl border p-3.5 cursor-pointer",
                active ? "border-blue-500 bg-blue-50/40" : "border-slate-100 bg-slate-50"
              )}
            >
              <div className="flex items-center gap-2.5 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-[13px] truncate">{p.property}</p>
                  <p className="text-[11px] text-slate-400 truncate">{p.desc}</p>
                </div>
                <StatusPill tone={p.tone}>{p.status}</StatusPill>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-[11px]">
                <div>
                  <p className="text-slate-400">Amount</p>
                  <p className="font-semibold text-slate-900">{formatPence(p.amountPence, "GBP")}</p>
                </div>
                <div>
                  <p className="text-slate-400">Due</p>
                  <p className="font-medium text-slate-700">{p.due}</p>
                </div>
                <div>
                  <p className="text-slate-400">Method</p>
                  <p className="font-medium text-slate-700 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />{p.method}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                {p.canPay ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); toast("Opening payment…", "info") }}
                    className="bg-[#2563EB] text-white rounded-lg px-3 py-1.5 text-[11.5px] font-semibold"
                  >
                    Pay now
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); toast("Opening receipt…", "info") }}
                    className="text-[11.5px] font-semibold text-blue-600"
                  >
                    View receipt
                  </button>
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
              <th className="py-2 pr-2 font-semibold">Payment</th>
              <th className="py-2 px-2 font-semibold">Amount</th>
              <th className="py-2 px-2 font-semibold">Due</th>
              <th className="py-2 px-2 font-semibold">Status</th>
              <th className="py-2 px-2 font-semibold">Method</th>
              <th className="py-2 px-2 font-semibold w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {payments.map((p) => {
              const active = p.id === selectedId
              return (
                <tr key={p.id} onClick={() => onSelect(p.id)} className={cn("text-[12.5px] cursor-pointer", active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50")}>
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2.5 min-w-[170px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{p.property}</p>
                        <p className="text-[11px] text-slate-400 truncate">{p.desc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-semibold text-slate-900">{formatPence(p.amountPence, "GBP")}</td>
                  <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{p.due}</td>
                  <td className="py-3 px-2"><StatusPill tone={p.tone}>{p.status}</StatusPill></td>
                  <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{p.method}</td>
                  <td className="py-3 px-2">
                    {p.canPay ? (
                      <button onClick={(e) => { e.stopPropagation(); toast("Opening payment…", "info") }} className="bg-[#2563EB] text-white rounded-lg px-2.5 py-1 text-[11.5px] font-semibold">Pay now</button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); toast("Opening receipt…", "info") }} className="text-[11.5px] font-semibold text-blue-600">View</button>
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
