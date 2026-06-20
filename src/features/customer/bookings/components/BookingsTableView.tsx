"use client"

import { Calendar, Users, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { StatusPill, bookingStatusTone, paymentTone } from "../../components/StatusPill"
import type { Booking } from "../data/bookings"

interface Props {
  rows: Booking[]
  selectedId?: string
  onSelect: (id: string) => void
  checked: Record<string, boolean>
  setChecked: (fn: (c: Record<string, boolean>) => Record<string, boolean>) => void
}

export default function BookingsTableView({ rows, selectedId, onSelect, checked, setChecked }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Mobile card list */}
      <ul className="md:hidden divide-y divide-slate-100" role="list">
        {rows.map((b) => {
          const active = b.id === selectedId
          return (
            <li
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={cn(
                "p-3.5 cursor-pointer",
                active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <input
                  type="checkbox"
                  checked={!!checked[b.id]}
                  onChange={() => setChecked((c) => ({ ...c, [b.id]: !c[b.id] }))}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-blue-600 text-[12px]">{b.ref}</span>
                    <StatusPill tone={b.type === "Stay" ? "blue" : "amber"}>{b.type}</StatusPill>
                  </div>
                  <p className="font-semibold text-slate-800 text-[12.5px] truncate">{b.property}</p>
                  <p className="text-[11px] text-slate-400 truncate">{b.location}</p>
                </div>
                <div className="text-right shrink-0">
                  <StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-x-3 text-[11px]">
                <div>
                  <p className="text-slate-400 flex items-center gap-0.5"><Calendar className="w-3 h-3" /> Dates</p>
                  <p className="font-medium text-slate-700">{b.dateRange}</p>
                </div>
                <div>
                  <p className="text-slate-400 flex items-center gap-0.5"><Users className="w-3 h-3" /> Guests</p>
                  <p className="font-medium text-slate-700">{b.guests}</p>
                </div>
                <div>
                  <p className="text-slate-400">Payment</p>
                  <StatusPill tone={paymentTone(b.payment)}>{b.payment}</StatusPill>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatPence(b.totalPence, "GBP")}</p>
                </div>
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
              <th className="py-2.5 pl-4 pr-2 w-8"></th>
              <th className="py-2.5 px-2 font-semibold">Booking ID</th>
              <th className="py-2.5 px-2 font-semibold">Property</th>
              <th className="py-2.5 px-2 font-semibold">Type</th>
              <th className="py-2.5 px-2 font-semibold">Dates</th>
              <th className="py-2.5 px-2 font-semibold">Guests</th>
              <th className="py-2.5 px-2 font-semibold">Status</th>
              <th className="py-2.5 px-2 font-semibold">Payment</th>
              <th className="py-2.5 px-2 font-semibold">Host</th>
              <th className="py-2.5 px-2 font-semibold w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((b) => {
              const active = b.id === selectedId
              return (
                <tr
                  key={b.id}
                  onClick={() => onSelect(b.id)}
                  className={cn(
                    "cursor-pointer text-[12.5px] transition-colors",
                    active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50"
                  )}
                >
                  <td className="py-2.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={!!checked[b.id]} onChange={() => setChecked((c) => ({ ...c, [b.id]: !c[b.id] }))} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="py-2.5 px-2"><span className="font-semibold text-blue-600">{b.ref}</span></td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2 min-w-[170px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0"><p className="font-semibold text-slate-800 truncate">{b.property}</p><p className="text-slate-400 truncate text-[11.5px]">{b.location}</p></div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2"><StatusPill tone={b.type === "Stay" ? "blue" : "amber"}>{b.type}</StatusPill></td>
                  <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{b.dateRange}</td>
                  <td className="py-2.5 px-2 text-slate-600">{b.guests}</td>
                  <td className="py-2.5 px-2"><StatusPill tone={bookingStatusTone(b.status)}>{b.status}</StatusPill></td>
                  <td className="py-2.5 px-2"><div><StatusPill tone={paymentTone(b.payment)}>{b.payment}</StatusPill><p className="text-[11px] text-slate-400 mt-0.5">{formatPence(b.totalPence, "GBP")}</p></div></td>
                  <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{b.host}</td>
                  <td className="py-2.5 px-2 text-right"><MoreHorizontal className="w-4 h-4 text-slate-400 inline" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
