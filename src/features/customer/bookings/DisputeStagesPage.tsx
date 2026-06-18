"use client"

import Link from "next/link"
import {
  ExternalLink, Download, MessageSquare, Info, CheckCircle2, Upload, ChevronRight, Clock, Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill } from "../components/StatusPill"
import { disputeStages, type Dispute } from "../data/bookings"

export default function DisputeStagesPage({ d, bookingId }: { d: Dispute; bookingId: string }) {
  const { toast } = useCustomerToast()
  const stageDates = ["7 Jun 2025", "7 Jun 2025", "Due by 12 Jun 2025", "Starts after host response", "Pending decision", "Case closed"]
  const caseId = `DP-${bookingId.replace(/[^A-Z0-9]/gi, "").slice(-5)}`

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="text-[12px] text-slate-400 flex items-center gap-1.5">
        <Link href="/customer/bookings" className="hover:text-slate-600">Bookings</Link><ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/customer/bookings/${bookingId}`} className="hover:text-slate-600">Booking details</Link><ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-600">Dispute {caseId}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-[24px] font-bold text-slate-900">Dispute {caseId}</h1><StatusPill tone="amber">In progress</StatusPill></div>
          <p className="text-[13px] text-slate-500 mt-1">Booking {d.bookingRef} · {d.property} · {d.dateRange}</p>
          <p className="text-[12.5px] text-slate-400 mt-1">You raised a dispute on {d.raised} regarding your stay experience. We're working to resolve this fairly.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/customer/bookings/${bookingId}`} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><ExternalLink className="w-4 h-4" /> View booking</Link>
          <button onClick={() => toast("Preparing case summary…", "info")} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4" /> Download case summary</button>
          <button onClick={() => toast("Messaging support…", "info")} className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-3 py-2 text-[12.5px] font-semibold"><MessageSquare className="w-4 h-4" /> Message support</button>
        </div>
      </div>

      {/* Stage tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <ol className="flex items-start justify-between gap-2">
          {disputeStages.map((s, i) => {
            const done = i < d.stageIndex
            const current = i === d.stageIndex
            return (
              <li key={s} className="flex-1 flex flex-col items-center text-center relative">
                {i < disputeStages.length - 1 && <span className={cn("absolute top-[14px] left-1/2 w-full h-0.5", done ? "bg-emerald-400" : "bg-slate-200")} />}
                <span className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold z-10 shrink-0",
                  done ? "bg-emerald-500 text-white" : current ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                )}>{done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}</span>
                <p className={cn("text-[11.5px] font-semibold mt-2", current ? "text-blue-600" : done ? "text-slate-700" : "text-slate-400")}>{s}</p>
                <p className="text-[10.5px] text-slate-400 mt-0.5">{stageDates[i]}</p>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-blue-500 shrink-0" />
        <p className="text-[12.5px] text-slate-600">The host has been notified and has until 12 Jun 2025 to respond.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_300px] gap-5 items-start">
        {/* Left: case summary */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-3">Case summary</p>
            <dl className="space-y-2">
              <SumRow l="Dispute reason" r={d.reason} />
              <SumRow l="Dispute raised" r={`${d.raised}, 10:24`} />
              <SumRow l="Booking" r={d.bookingRef} link />
              <SumRow l="Stay dates" r={d.dateRange} />
              <SumRow l="Total paid" r={formatPence(d.bookingTotalPence, "GBP")} />
              <SumRow l="Refund requested" r={formatPence(d.claimedPence, "GBP")} />
              <SumRow l="Case ID" r={caseId} />
            </dl>
            <Link href={`/customer/bookings/${bookingId}`} className="mt-3 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><ExternalLink className="w-4 h-4" /> View booking details</Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900">Need help?</p>
            <p className="text-[12px] text-slate-500 mt-1">Our support team is here to help you get a fair resolution.</p>
            <button onClick={() => toast("Messaging support…", "info")} className="mt-3 w-full flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><MessageSquare className="w-4 h-4" /> Message support</button>
            <p className="text-[11px] text-slate-400 mt-2">Average response time: 2h 15m</p>
          </div>
        </div>

        {/* Middle: evidence + thread */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3"><p className="text-[13px] font-bold text-slate-900">Evidence submitted (5)</p><button className="text-[12px] font-semibold text-blue-600">View all</button></div>
            <div className="grid grid-cols-6 gap-2">
              {[d.image, "/property-types/sa.jpg", "/property-types/holiday.jpg", "/property-types/mixed.jpg", "/property-types/development.jpg"].map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="w-full h-16 rounded-lg object-cover" />
              ))}
              <button onClick={() => toast("Evidence uploader — coming soon", "info")} className="w-full h-16 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-[10px] text-slate-400 hover:border-blue-300 hover:text-blue-500"><Upload className="w-4 h-4 mb-0.5" /> Upload more</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3"><p className="text-[13px] font-bold text-slate-900">Message thread</p><button className="text-[12px] font-semibold text-blue-600 inline-flex items-center gap-1">View full conversation <ChevronRight className="w-3.5 h-3.5" /></button></div>
            <div className="space-y-3">
              <ThreadMsg who="Sarah Johnson (You)" when={`${d.raised}, 10:24`} text="The property was not as described and was not clean on arrival. There were maintenance issues, mould in the bathroom, and broken furniture." />
              <ThreadMsg who="Propvora Support" when={`${d.raised}, 10:35`} support text="Thanks for raising this dispute. We've sent the details to your host and they have until 12 Jun 2025 to respond. We'll be in touch." />
              <div className="flex items-center gap-2 text-[11.5px] text-slate-400 pl-1"><Info className="w-3.5 h-3.5" /> Host notified · {d.raised}, 10:40</div>
            </div>
          </div>
        </div>

        {/* Right: refund + timeline */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between"><p className="text-[12.5px] font-semibold text-slate-700">Refund requested</p><StatusPill tone="amber">Pending</StatusPill></div>
            <p className="text-[26px] font-bold text-slate-900 mt-1">{formatPence(d.claimedPence, "GBP")}</p>
            <p className="text-[11.5px] text-slate-400">Total refund requested</p>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
              <p className="text-[12px] font-semibold text-slate-700">Breakdown</p>
              <RowLR l={`${d.nights} nights × £55`} r={formatPence(d.claimedPence, "GBP")} />
              <RowLR l="Service fee" r="£0.00" />
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100"><span className="text-[12.5px] font-semibold text-slate-700">Total</span><span className="text-[13px] font-bold text-slate-900">{formatPence(d.claimedPence, "GBP")}</span></div>
            </div>
            <button onClick={() => toast("Update refund amount — coming soon", "info")} className="mt-3 w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl py-2.5 text-[13px] font-semibold">Update refund amount</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-3">Case timeline</p>
            <ol className="space-y-3">
              <Stage icon={CheckCircle2} tone="emerald" title="Dispute opened" sub={`${d.raised}, 10:24`} detail="You raised a dispute" />
              <Stage icon={CheckCircle2} tone="emerald" title="Evidence submitted" sub={`${d.raised}, 10:30`} detail="You uploaded 5 items of evidence" />
              <Stage icon={Clock} tone="blue" title="Host response due" sub="12 Jun 2025" detail="Waiting for the host to respond" />
              <Stage icon={Shield} tone="slate" title="Review / mediation" detail="Starts after host response" />
              <Stage icon={Shield} tone="slate" title="Resolution" detail="Pending decision" />
              <Stage icon={Shield} tone="slate" title="Refund / closure" detail="Case closed" last />
            </ol>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Shield className="w-4 h-4" /></span>
          <div><p className="text-[13px] font-semibold text-slate-800">We're here to help</p><p className="text-[12px] text-slate-500">Our team is monitoring this case and will ensure a fair outcome for you. You can add more evidence or contact support anytime.</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast("Evidence uploader — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><Upload className="w-4 h-4" /> Upload more evidence</button>
          <button onClick={() => toast("We'll notify you when the host responds", "success")} className="inline-flex items-center gap-1.5 bg-[#0D1B2A] text-white rounded-xl px-3.5 py-2 text-[12.5px] font-semibold">I'll wait for host response</button>
        </div>
      </div>
    </div>
  )
}

/* helpers */
function SumRow({ l, r, link }: { l: string; r: string; link?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-[12px] text-slate-500 shrink-0">{l}</dt><dd className={cn("text-[12px] font-semibold text-right truncate", link ? "text-blue-600" : "text-slate-800")}>{r}</dd></div>
}
function RowLR({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[12px]"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium">{r}</span></div>
}
function ThreadMsg({ who, when, text, support }: { who: string; when: string; text: string; support?: boolean }) {
  return (
    <div className="flex gap-2.5">
      <span className={cn("w-8 h-8 rounded-full shrink-0", support ? "bg-blue-100" : "bg-slate-200")} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between"><p className="text-[12px] font-semibold text-slate-700">{who}</p><p className="text-[10.5px] text-slate-400">{when}</p></div>
        <p className="text-[12px] text-slate-600 mt-0.5">{text}</p>
      </div>
    </div>
  )
}
const STAGE_TONE: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", blue: "bg-blue-100 text-blue-600", slate: "bg-slate-100 text-slate-400" }
function Stage({ icon: Icon, tone, title, sub, detail, last }: { icon: typeof Clock; tone: string; title: string; sub?: string; detail?: string; last?: boolean }) {
  return (
    <li className="relative flex gap-3">
      {!last && <span className="absolute left-[13px] top-7 bottom-[-14px] w-px bg-slate-100" />}
      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10", STAGE_TONE[tone])}><Icon className="w-3.5 h-3.5" /></span>
      <div className="flex-1 min-w-0 pb-1">
        <p className="text-[12.5px] font-semibold text-slate-800">{title}</p>
        {sub && <p className="text-[11.5px] text-blue-600">{sub}</p>}
        {detail && <p className="text-[11.5px] text-slate-400">{detail}</p>}
      </div>
    </li>
  )
}
