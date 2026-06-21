"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle, Clock, FileText, PoundSterling, CheckCircle2, Search, ChevronRight,
  Upload, MessageSquare, ArrowUpRight, Ban, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill, disputeTone } from "../components/StatusPill"
import type { Dispute } from "../data/bookings"

const disputes: Dispute[] = []

const KPIS = [
  { id: "open", label: "Open disputes", value: "0", sub: "Require attention", icon: AlertTriangle, bg: "bg-amber-50 text-amber-600" },
  { id: "await", label: "Awaiting response", value: "0", sub: "From host or Propvora", icon: Clock, bg: "bg-violet-50 text-violet-600" },
  { id: "evidence", label: "Evidence submitted", value: "0", sub: "Across all disputes", icon: FileText, bg: "bg-blue-50 text-blue-600" },
  { id: "refund", label: "Refund in progress", value: "—", sub: "No active refunds", icon: PoundSterling, bg: "bg-emerald-50 text-emerald-600" },
  { id: "resolved", label: "Resolved cases", value: "0", sub: "Last 12 months", icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
]

export default function DisputesClient() {
  const { toast } = useCustomerToast()
  const open = disputes.filter((d) => !d.past)
  const past = disputes.filter((d) => d.past)
  const [selectedId, setSelectedId] = useState(open[0]?.id ?? "")
  const selected = disputes.find((d) => d.id === selectedId) ?? open[0]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold text-slate-900">Bookings</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <Link href="/customer/bookings" className="px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-500 hover:text-slate-800">All bookings</Link>
        <Link href="/customer/bookings?tab=stays" className="px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-500 hover:text-slate-800">Stays</Link>
        <Link href="/customer/bookings?tab=lets" className="px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-500 hover:text-slate-800">Lets</Link>
        <span className="px-3.5 py-2.5 text-[13.5px] font-semibold text-blue-600 border-b-2 border-blue-600 -mb-px">Disputes</span>
        <Link href="/customer/bookings/completed" className="px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-500 hover:text-slate-800">Completed</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
              <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
              <p className="text-[12px] font-medium text-slate-500 mt-1">{k.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search disputes" className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <Drop>Status: All</Drop><Drop>Type: All</Drop><Drop>Date: Newest</Drop>
        <button className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 ml-auto">More filters</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 items-start">
        <div className="space-y-5">
          <Section title="Open disputes">
            {open.length === 0
              ? <p className="text-[13px] text-slate-400 py-4 text-center">No open disputes.</p>
              : open.map((d) => <DisputeRow key={d.id} d={d} active={d.id === selectedId} onClick={() => setSelectedId(d.id)} />)}
          </Section>
          <Section title="Past disputes">
            {past.length === 0
              ? <p className="text-[13px] text-slate-400 py-4 text-center">No past disputes.</p>
              : past.map((d) => <DisputeRow key={d.id} d={d} active={d.id === selectedId} onClick={() => setSelectedId(d.id)} past />)}
          </Section>
        </div>

        {/* Right detail panel */}
        {selected ? (
          <DisputePanel d={selected} toast={toast} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
            <p className="text-[14px] font-semibold text-slate-900 mb-1">No disputes</p>
            <p className="text-[12.5px] text-slate-400">Disputes will appear here if you raise an issue with a booking.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DisputeRow({ d, active, onClick, past }: { d: Dispute; active: boolean; onClick: () => void; past?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn("w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors", active ? "outline outline-2 -outline-offset-2 outline-blue-500 bg-blue-50/30" : "hover:bg-slate-50")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-900 truncate">{d.property}</p>
        <p className="text-[11.5px] text-slate-400">Booking ref. {d.bookingRef}</p>
        <p className="text-[11.5px] text-slate-400">{d.dateRange} · {d.nights} nights · {formatPence(d.bookingTotalPence, "GBP")}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-[12px] font-semibold", past ? "text-slate-500" : "text-amber-600")}>{d.status}</p>
        <p className="text-[11px] text-slate-400">Since {d.since}</p>
      </div>
      <div className="text-right shrink-0 w-[78px]">
        <p className="text-[13px] font-bold text-slate-900">{formatPence(d.claimedPence, "GBP")}</p>
        <p className="text-[10.5px] text-slate-400">{past ? (d.claimedPence ? "Refunded" : "No refund") : "Claimed amount"}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </button>
  )
}

function DisputePanel({ d, toast }: { d: Dispute; toast: (m: string, k?: "success" | "info" | "warning" | "error") => void }) {
  const actions = [
    { id: "evidence", label: "Add evidence", icon: Upload, primary: true, fn: () => toast("Evidence uploader — coming soon", "info") },
    { id: "message", label: "Message support", icon: MessageSquare, fn: () => toast("Messaging support…", "info") },
    { id: "escalate", label: "Escalate case", icon: ArrowUpRight, danger: true, fn: () => toast("Escalation requested", "warning") },
    { id: "withdraw", label: "Withdraw", icon: Ban, fn: () => toast("Withdraw dispute — coming soon", "info") },
  ]
  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-400">Dispute ref. {d.id}</p>
        <StatusPill tone={disputeTone(d.status)}>{d.status}</StatusPill>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <h3 className="text-[16px] font-bold text-slate-900">{d.property}</h3>
        <Link href={`/customer/bookings/${d.bookingRef}`} className="text-[12px] font-semibold text-blue-600 inline-flex items-center gap-1">View booking <ExternalLink className="w-3.5 h-3.5" /></Link>
      </div>
      <p className="text-[12px] text-slate-400">Booking ref. {d.bookingRef} · {d.dateRange}</p>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[12px] font-semibold text-slate-700">Dispute reason</p>
        <p className="text-[13px] font-semibold text-slate-800 mt-0.5">{d.reason}</p>
        <p className="text-[12px] text-slate-500 mt-1">{d.reasonDetail}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100">
        <Mini label="Claimed amount" value={formatPence(d.claimedPence, "GBP")} />
        <Mini label="Refund requested" value={`${d.refundRequestedPct}%`} />
        <Mini label="Dispute raised" value={d.raised} />
        <Mini label="Current stage" value={d.status.replace("Awaiting ", "Awaiting ")} />
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <button key={a.id} onClick={a.fn} className={cn(
              "flex flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-semibold border transition",
              a.primary ? "bg-[#0D1B2A] text-white border-[#0D1B2A]" : a.danger ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-slate-200 text-slate-700 hover:bg-slate-50"
            )}>
              <Icon className="w-4 h-4" /> {a.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[12.5px] font-semibold text-slate-700 mb-2">Timeline</p>
        <ol className="space-y-3">
          <TL icon={PoundSterling} tone="emerald" title="Dispute raised" sub={`${d.raised}, 14:32`} detail="You raised a dispute and provided initial details." />
          <TL icon={FileText} tone="blue" title="Evidence submitted" sub="You submitted 4 photos and a video.">
            <div className="flex gap-1.5 mt-1.5">
              {[d.image, "/property-types/sa.jpg", "/property-types/holiday.jpg", "/property-types/mixed.jpg"].map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="w-12 h-10 rounded-md object-cover" />
              ))}
            </div>
          </TL>
          <TL icon={Clock} tone="amber" title="Awaiting host response" detail="The host has 48 hours to respond to your dispute." />
          <TL icon={CheckCircle2} tone="slate" title="If unresolved" detail="We'll step in to review and help resolve this case." last />
        </ol>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2"><p className="text-[12.5px] font-semibold text-slate-700">Messages</p><button className="text-[11.5px] font-semibold text-blue-600">View all</button></div>
        <div className="space-y-2">
          <Msg who="You" when={`${d.raised}, 14:32`} text="The hot tub was a key reason for booking this property and it was unavailable throughout our stay." />
          <Msg who="Propvora Support" when={`${d.raised}, 15:10`} support text="Thank you for raising this. We've notified the host and will update you shortly." />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2"><p className="text-[12.5px] font-semibold text-slate-700">Evidence (5)</p><button className="text-[11.5px] font-semibold text-blue-600">View all</button></div>
        <div className="grid grid-cols-4 gap-1.5">
          {[d.image, "/property-types/sa.jpg", "/property-types/holiday.jpg", "/property-types/mixed.jpg"].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="w-full h-14 rounded-md object-cover" />
          ))}
        </div>
      </div>
    </aside>
  )
}

/* helpers */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
      <p className="text-[13px] font-bold text-slate-900 px-1 py-1.5">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}
function Drop({ children }: { children: React.ReactNode }) {
  return <button className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50">{children}</button>
}
function Mini({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] text-slate-400 leading-tight">{label}</p><p className="text-[12px] font-semibold text-slate-800 mt-0.5">{value}</p></div>
}
const TL_TONE: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-600", blue: "bg-blue-100 text-blue-600", amber: "bg-amber-100 text-amber-600", slate: "bg-slate-100 text-slate-400" }
function TL({ icon: Icon, tone, title, sub, detail, children, last }: { icon: typeof Clock; tone: string; title: string; sub?: string; detail?: string; children?: React.ReactNode; last?: boolean }) {
  return (
    <li className="relative flex gap-3">
      {!last && <span className="absolute left-[13px] top-7 bottom-[-14px] w-px bg-slate-100" />}
      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10", TL_TONE[tone])}><Icon className="w-3.5 h-3.5" /></span>
      <div className="flex-1 min-w-0 pb-1">
        <p className="text-[12.5px] font-semibold text-slate-800">{title}</p>
        {sub && <p className="text-[11.5px] text-slate-500">{sub}</p>}
        {detail && <p className="text-[11.5px] text-slate-400">{detail}</p>}
        {children}
      </div>
    </li>
  )
}
function Msg({ who, when, text, support }: { who: string; when: string; text: string; support?: boolean }) {
  return (
    <div className={cn("rounded-xl p-2.5", support ? "bg-blue-50/60" : "bg-slate-50")}>
      <div className="flex items-center justify-between"><p className="text-[11.5px] font-semibold text-slate-700">{who}</p><p className="text-[10.5px] text-slate-400">{when}</p></div>
      <p className="text-[12px] text-slate-600 mt-0.5">{text}</p>
    </div>
  )
}
