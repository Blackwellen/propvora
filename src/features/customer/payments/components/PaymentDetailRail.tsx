"use client"

import Link from "next/link"
import { Download, ShieldCheck, Headphones } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { StatusPill, type PillTone } from "../../components/StatusPill"

interface Pay {
  id: string; property: string; desc: string; image: string; amountPence: number; due: string
  status: string; tone: PillTone; method: string; canPay?: boolean
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[12px]"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium text-right">{r}</span></div>
}

interface Props { selected: Pay }

export default function PaymentDetailRail({ selected }: Props) {
  return (
    <aside className="space-y-5 sticky top-[84px]">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[14px] font-bold text-slate-900 mb-3">Payment details</p>
        <div className="flex gap-2.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={selected.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" /><div><p className="text-[12.5px] font-semibold text-slate-800">{selected.property}</p><p className="text-[11px] text-slate-400">{selected.desc}</p><StatusPill tone={selected.tone}>{selected.status}</StatusPill></div></div>
        <p className="text-[24px] font-bold text-slate-900 mt-3">{formatPence(selected.amountPence, "GBP")}</p>
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
          <div className="flex items-center justify-between pt-1"><span className="text-[12.5px] font-semibold text-slate-700">Total</span><span className="text-[13px] font-bold text-slate-900">{formatPence(selected.amountPence, "GBP")}</span></div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
          <Row l="Payment method" r={selected.method} />
          <Row l="Due" r={selected.due} />
          <Row l="Reference" r={`BK-${selected.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`} />
        </div>
        <div className="mt-3 space-y-2">
          {selected.canPay && <Link href={`/customer/bookings/${selected.id}`} className="block w-full bg-[var(--brand)] text-white rounded-xl py-2.5 text-[13px] font-semibold text-center">Pay {formatPence(selected.amountPence, "GBP")}</Link>}
          <a href={`/api/customer/bookings/${selected.id}/receipt`} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4" /> Download receipt</a>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[14px] font-bold text-slate-900 mb-1.5 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-violet-500" /> Payment protection</p>
        <p className="text-[12px] text-slate-500">Stay payments are held in escrow and released to the host after a successful stay — so you&apos;re protected if something goes wrong.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900">Payment support</p>
        <p className="text-[11.5px] text-slate-400 mt-1 mb-2">Questions about a charge or refund? We're here to help.</p>
        <Link href="/customer/help" className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Headphones className="w-4 h-4" /> Contact support</Link>
      </div>
    </aside>
  )
}
