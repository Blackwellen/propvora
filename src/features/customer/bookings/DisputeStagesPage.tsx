"use client"

import Link from "next/link"
import {
  ExternalLink, Download, MessageSquare, Info, CheckCircle2, Upload, ChevronRight, Clock, Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill, disputeTone } from "../components/StatusPill"
import { disputeStages } from "../data/bookings"
import type { CustomerDisputeLive } from "../data/disputes-map"

export default function DisputeStagesPage({ d, bookingId }: { d: CustomerDisputeLive; bookingId: string }) {
  const { toast } = useCustomerToast()
  // Stage dates derived from the real audit timeline where one exists, else neutral.
  const stageDates = disputeStages.map((_, i) => {
    if (i < d.stageIndex) return d.timeline[Math.min(i, d.timeline.length - 1)]?.at ?? "Completed"
    if (i === d.stageIndex) return "In progress"
    return "Pending"
  })
  const caseId = d.id

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
          <div className="flex items-center gap-2"><h1 className="text-[24px] font-bold text-slate-900">Dispute {caseId}</h1><StatusPill tone={disputeTone(d.status)}>{d.status}</StatusPill></div>
          <p className="text-[13px] text-slate-500 mt-1">Booking {d.bookingRef} · {d.property}</p>
          <p className="text-[12.5px] text-slate-400 mt-1">You raised a dispute on {d.raised} regarding “{d.reason}”. We're working to resolve this fairly.</p>
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
        <p className="text-[12.5px] text-slate-600">{d.past ? "This case has been resolved. See the timeline for the outcome." : "The host and Propvora have been notified. We’ll update you as the case progresses."}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_300px] gap-5 items-start">
        {/* Left: case summary */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-3">Case summary</p>
            <dl className="space-y-2">
              <SumRow l="Dispute reason" r={d.reason} />
              <SumRow l="Dispute raised" r={d.raised} />
              <SumRow l="Booking" r={d.bookingRef} link />
              <SumRow l="Amount held" r={formatPence(d.bookingTotalPence, "GBP")} />
              <SumRow l="Amount disputed" r={formatPence(d.claimedPence, "GBP")} />
              <SumRow l="Case ID" r={caseId} />
            </dl>
            <Link href={`/customer/bookings/${bookingId}`} className="mt-3 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><ExternalLink className="w-4 h-4" /> View booking details</Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900">Need help?</p>
            <p className="text-[12px] text-slate-500 mt-1">Our support team is here to help you get a fair resolution.</p>
            <button onClick={() => toast("Messaging support…", "info")} className="mt-3 w-full flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><MessageSquare className="w-4 h-4" /> Message support</button>
            <p className="text-[11px] text-slate-400 mt-2">We aim to respond as quickly as we can.</p>
          </div>
        </div>

        {/* Middle: evidence + thread */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3"><p className="text-[13px] font-bold text-slate-900">Evidence submitted ({d.evidenceCount})</p></div>
            {d.evidenceCount === 0 ? (
              <button onClick={() => toast("Evidence uploader — coming soon", "info")} className="w-full h-16 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-[11px] text-slate-400 hover:border-blue-300 hover:text-blue-500"><Upload className="w-4 h-4 mb-0.5" /> Upload evidence</button>
            ) : (
              <p className="text-[12.5px] text-slate-500">{d.evidenceCount} item{d.evidenceCount === 1 ? "" : "s"} submitted to this case.</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3"><p className="text-[13px] font-bold text-slate-900">Message thread</p></div>
            {d.messages.length === 0 ? (
              <p className="text-[12.5px] text-slate-400 py-2">No messages yet. Use “Message support” to start the conversation.</p>
            ) : (
              <div className="space-y-3">
                {d.messages.map((m) => <ThreadMsg key={m.id} who={m.who} when={m.when} text={m.text} support={m.support} />)}
              </div>
            )}
          </div>
        </div>

        {/* Right: refund + timeline */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between"><p className="text-[12.5px] font-semibold text-slate-700">Amount disputed</p><StatusPill tone={disputeTone(d.status)}>{d.status}</StatusPill></div>
            <p className="text-[26px] font-bold text-slate-900 mt-1">{formatPence(d.claimedPence, "GBP")}</p>
            <p className="text-[11.5px] text-slate-400">Under review by Propvora</p>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
              <RowLR l="Amount held in escrow" r={formatPence(d.bookingTotalPence, "GBP")} />
              <RowLR l="Amount disputed" r={formatPence(d.claimedPence, "GBP")} />
              {d.resolvedNote && <p className="text-[11.5px] text-emerald-600 pt-1">{d.resolvedNote}</p>}
            </div>
            <button onClick={() => toast("Messaging support…", "info")} className="mt-3 w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl py-2.5 text-[13px] font-semibold">Message support</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-[13px] font-bold text-slate-900 mb-3">Case timeline</p>
            {d.timeline.length === 0 ? (
              <p className="text-[12px] text-slate-400 py-2">No activity recorded yet.</p>
            ) : (
              <ol className="space-y-3">
                {d.timeline.map((t, i) => (
                  <Stage
                    key={t.id}
                    icon={t.kind === "decision" ? CheckCircle2 : t.kind === "warning" ? Clock : Shield}
                    tone={t.kind === "decision" ? "emerald" : t.kind === "warning" ? "blue" : "slate"}
                    title={t.title}
                    sub={t.at}
                    detail={t.sub}
                    last={i === d.timeline.length - 1}
                  />
                ))}
              </ol>
            )}
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
