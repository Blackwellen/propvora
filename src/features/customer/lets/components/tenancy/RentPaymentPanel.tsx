"use client"

import Link from "next/link"
import { Headphones, RefreshCw, Loader2, CheckCircle2 } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
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
  selected: Sched
  onPay: (scheduleId: string) => void
  paying: boolean
  autopayOn: boolean
  onToggleAutopay: () => void
  autopayBusy: boolean
}

function Row({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-slate-500">{l}</span>
      <span className="text-slate-700 font-medium">{r}</span>
    </div>
  )
}

export default function RentPaymentPanel({ selected, onPay, paying, autopayOn, onToggleAutopay, autopayBusy }: Props) {
  const unpaid = selected.status !== "Paid"
  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
      <p className="text-[12px] text-slate-400">{selected.month} — Payment details</p>
      <p className="text-[26px] font-bold text-slate-900 mt-1">{formatPence(selected.amountPence, "GBP")}</p>
      <StatusPill tone={selected.tone}>{selected.status}</StatusPill>
      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
        <Row l="Rent" r={formatPence(selected.amountPence, "GBP")} />
        <Row l="Due date" r={selected.due} />
        <Row l="Payment method" r={selected.method} />
      </div>
      <div className="mt-3 space-y-2">
        {unpaid && (
          <button
            onClick={() => onPay(selected.id)}
            disabled={paying}
            className="w-full bg-[var(--brand)] text-white rounded-xl py-2.5 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {paying && <Loader2 className="w-4 h-4 animate-spin" />} Pay {formatPence(selected.amountPence, "GBP")}
          </button>
        )}
        <button
          onClick={onToggleAutopay}
          disabled={autopayBusy}
          className={`w-full inline-flex items-center justify-center gap-1.5 border rounded-xl py-2 text-[12.5px] font-semibold disabled:opacity-60 ${autopayOn ? "border-emerald-200 text-emerald-700 bg-emerald-50/40" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
        >
          {autopayBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : autopayOn ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
          {autopayOn ? "Autopay on — turn off" : "Set up autopay"}
        </button>
        <Link
          href="/customer/help"
          className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Headphones className="w-4 h-4" /> Contact support
        </Link>
      </div>
    </aside>
  )
}
