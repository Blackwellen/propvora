"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Wallet, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import { PayoutStatusBadge } from "./PaymentStatusBadge"
import { EscrowTimeline } from "./EscrowTimeline"
import { formatPence } from "./status"

export interface PayoutTableRow {
  id: string
  reference: string
  guestName: string | null
  listingTitle: string | null
  checkIn: string | null
  checkOut: string | null
  grossPence: number
  feePence: number
  netPence: number
  currency: string
  status: string
  expectedReleaseAt: string | null
}

function fmtDate(d: string | null): string {
  if (!d) return "—"
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return d
  }
}

/* Desktop table → mobile card list. Each row expands to its escrow timeline. */
export default function PayoutsTable({ rows }: { rows: PayoutTableRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-100">
        <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-600 text-sm font-medium">No payouts yet</p>
        <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
          When guests pay for confirmed bookings, the funds appear here — held in
          escrow until each stay completes, then released to your connected account.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Booking</th>
              <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Stay dates</th>
              <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-right">Gross</th>
              <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-right">Fee</th>
              <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-right">Net payout</th>
              <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const open = openId === r.id
              return (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 align-top">
                  <td className="px-5 py-3.5" colSpan={7}>
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">
                          {r.listingTitle ?? "Stay booking"}
                        </p>
                        <p className="text-[11.5px] text-slate-500 truncate">
                          {r.guestName ?? "Guest"} · {r.reference}
                        </p>
                      </div>
                      <div className="w-44 shrink-0 text-[12.5px] text-slate-600">
                        {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                      </div>
                      <div className="w-24 shrink-0 text-right text-[13px] font-medium text-slate-700 tabular-nums">
                        {formatPence(r.grossPence, r.currency)}
                      </div>
                      <div className="w-24 shrink-0 text-right text-[13px] text-slate-500 tabular-nums">
                        {formatPence(r.feePence, r.currency)}
                      </div>
                      <div className="w-28 shrink-0 text-right text-[13.5px] font-bold text-slate-900 tabular-nums">
                        {formatPence(r.netPence, r.currency)}
                      </div>
                      <div className="w-36 shrink-0">
                        <PayoutStatusBadge status={r.status} />
                      </div>
                      <button
                        aria-label={open ? "Hide timeline" : "Show timeline"}
                        onClick={() => setOpenId(open ? null : r.id)}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 transition-colors"
                      >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
                      </button>
                    </div>
                    {open && (
                      <div className="mt-4 ml-1 pl-4 border-l border-slate-100 max-w-md">
                        <EscrowTimeline status={r.status} />
                        {r.expectedReleaseAt && (
                          <p className="mt-2 text-[11.5px] text-slate-400 flex items-center gap-1.5">
                            <CalendarClock className="w-3.5 h-3.5" />
                            Expected release after {fmtDate(r.expectedReleaseAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-2.5">
        {rows.map((r) => {
          const open = openId === r.id
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : r.id)}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-left min-h-[44px]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-800 truncate">
                    {r.listingTitle ?? "Stay booking"}
                  </p>
                  <p className="text-[11.5px] text-slate-500 truncate">
                    {r.guestName ?? "Guest"} · {fmtDate(r.checkIn)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-bold text-slate-900 tabular-nums">
                    {formatPence(r.netPence, r.currency)}
                  </p>
                  <PayoutStatusBadge status={r.status} className="mt-1" />
                </div>
                <ChevronRight className={cn("w-4 h-4 text-slate-300 shrink-0 transition-transform", open && "rotate-90")} />
              </button>
              {open && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-50">
                  <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                    <div>
                      <p className="text-slate-400">Gross</p>
                      <p className="font-medium text-slate-700 tabular-nums">{formatPence(r.grossPence, r.currency)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Platform fee</p>
                      <p className="font-medium text-slate-700 tabular-nums">{formatPence(r.feePence, r.currency)}</p>
                    </div>
                  </div>
                  <EscrowTimeline status={r.status} />
                  {r.expectedReleaseAt && (
                    <p className="mt-2 text-[11.5px] text-slate-400 flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Expected release after {fmtDate(r.expectedReleaseAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
