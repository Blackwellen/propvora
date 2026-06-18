"use client"

import Link from "next/link"
import {
  ArrowLeft, Check, RefreshCw, Ban, Wallet, MessageSquare, Download, CheckCircle2, Circle,
  ShieldCheck, Home, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill, type PillTone } from "../components/StatusPill"
import type { Offer, OfferStatus } from "../data/lets"

const STATUS_TONE: Record<OfferStatus, PillTone> = { Open: "amber", "Counter offer": "violet", Accepted: "emerald", Expired: "slate" }
const PROGRESS = ["Offer submitted", "Under review", "Negotiation", "Accepted", "Holding deposit", "Tenancy"]

export default function OfferDetail({ o }: { o: Offer }) {
  const { toast } = useCustomerToast()
  const stageIndex = o.status === "Accepted" ? 3 : o.status === "Counter offer" ? 2 : 1

  return (
    <div className="space-y-5">
      <Link href="/customer/lets?tab=offers" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="w-4 h-4" /> Back to offers</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-[22px] font-bold text-slate-900">Offer #{o.id}</h1><StatusPill tone={STATUS_TONE[o.status]}>{o.status}</StatusPill></div>
          <p className="text-[13px] text-slate-500 mt-1">{o.property} · {o.location}</p>
        </div>
      </div>

      {/* Progress tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <ol className="flex items-start justify-between gap-2">
          {PROGRESS.map((s, i) => { const done = i < stageIndex, current = i === stageIndex; return (
            <li key={s} className="flex-1 flex flex-col items-center text-center relative">
              {i < PROGRESS.length - 1 && <span className={cn("absolute top-[14px] left-1/2 w-full h-0.5", done ? "bg-emerald-400" : "bg-slate-200")} />}
              <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold z-10", done ? "bg-emerald-500 text-white" : current ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400")}>{done ? <Check className="w-4 h-4" /> : i + 1}</span>
              <p className={cn("text-[11px] font-semibold mt-2", current ? "text-blue-600" : done ? "text-slate-700" : "text-slate-400")}>{s}</p>
            </li>
          )})}
        </ol>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-5">
          <Card title="Offer summary">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Monthly rent offer" value={`${formatPence(o.rentOfferedPence, "GBP")}/mo`} />
              <Field label="Asking rent" value={`${formatPence(o.askingPence, "GBP")}/mo`} />
              <Field label="Move-in date" value={o.moveIn} />
              <Field label="Tenancy length" value={`${o.tenancyMonths} months`} />
              <Field label="Furnishing" value={o.furnished ? "Furnished" : "Unfurnished"} />
              <Field label="Holding deposit" value={formatPence(o.holdingDepositPence, "GBP")} />
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100"><p className="text-[12px] font-semibold text-slate-700 mb-1">Notes to landlord</p><p className="text-[12px] text-slate-500">Professional tenant, non-smoker, no pets. Able to move in on the proposed date and provide references on request.</p></div>
          </Card>

          <Card title="Offer history & negotiation">
            <ol className="space-y-3">
              <Hist who="You" when="2 days ago" text={`Submitted an offer of ${formatPence(o.rentOfferedPence, "GBP")}/mo`} />
              <Hist who="Letting agent" landlord when="1 day ago" text={o.status === "Counter offer" ? `Countered at ${formatPence(o.askingPence, "GBP")}/mo` : "Acknowledged your offer, reviewing with landlord"} />
              <Hist who="You" when="20 hours ago" text="Confirmed availability for the proposed move-in date" />
            </ol>
          </Card>

          <Card title="Property & agent">
            <div className="flex gap-3"><Home className="w-4 h-4 text-slate-400 mt-1" /><div className="flex-1"><p className="text-[12.5px] font-semibold text-slate-800">{o.property}</p><p className="text-[11px] text-slate-400">{o.location} · {o.furnished ? "Furnished" : "Unfurnished"} · {o.tenancyMonths}-month term</p></div></div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-slate-200" /><div><p className="text-[12px] font-semibold text-slate-800">Priya Patel</p><p className="text-[10.5px] text-slate-400">Lettings agent</p></div></div><button onClick={() => toast("Messaging agent…", "info")} className="text-[11.5px] font-semibold text-blue-600 border border-slate-200 rounded-lg px-2.5 py-1">Message agent</button></div>
          </Card>
        </div>

        {/* Right action rail */}
        <aside className="space-y-5 sticky top-[84px]">
          <Card title="Actions">
            <button onClick={() => toast("Counter-offer accepted", "success")} className="w-full inline-flex items-center justify-center gap-1.5 bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold mb-2"><Check className="w-4 h-4" /> {o.status === "Counter offer" ? "Accept counter-offer" : "Accept offer"}</button>
            <Btn icon={RefreshCw} onClick={() => toast("Amend offer — coming soon", "info")}>Amend offer</Btn>
            <Btn icon={Ban} danger onClick={() => toast("Offer withdrawn", "info")}>Withdraw offer</Btn>
            <Btn icon={Wallet} onClick={() => toast("Opening secure payment…", "info")}>Pay holding deposit</Btn>
            <Btn icon={Download} onClick={() => toast("Downloading terms…", "info")}>Download terms</Btn>
          </Card>
          <Card title="Payment breakdown">
            <Row l="First month's rent" r={formatPence(o.rentOfferedPence, "GBP")} />
            <Row l="Holding deposit" r={formatPence(o.holdingDepositPence, "GBP")} />
            <Row l="Security deposit" r={formatPence(o.rentOfferedPence + 2000, "GBP")} />
            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100"><span className="text-[12.5px] font-semibold text-slate-700">Total upfront</span><span className="text-[13px] font-bold text-slate-900">{formatPence(o.rentOfferedPence * 2 + 2000, "GBP")}</span></div>
          </Card>
          <Card title="What happens next">
            <ol className="space-y-2">
              <Next done text="Submit your offer" />
              <Next done={o.status === "Accepted"} text="Landlord reviews & responds" />
              <Next text="Pay holding deposit to secure" />
              <Next text="Complete referencing & sign" />
            </ol>
          </Card>
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><p className="text-[11.5px] text-slate-600">Holding deposits are protected and refundable under the Tenant Fees Act if the landlord withdraws.</p></div>
        </aside>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"><p className="text-[13px] font-bold text-slate-900 mb-3">{title}</p>{children}</div>
}
function Field({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10.5px] text-slate-400">{label}</p><p className="text-[13px] font-semibold text-slate-800">{value}</p></div>
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between text-[12px] py-0.5"><span className="text-slate-500">{l}</span><span className="text-slate-700 font-medium">{r}</span></div>
}
function Hist({ who, when, text, landlord }: { who: string; when: string; text: string; landlord?: boolean }) {
  return <li className="flex gap-2.5"><span className={cn("w-7 h-7 rounded-full shrink-0", landlord ? "bg-violet-100" : "bg-blue-100")} /><div className="flex-1"><div className="flex items-center justify-between"><p className="text-[12px] font-semibold text-slate-700">{who}</p><p className="text-[10px] text-slate-400">{when}</p></div><p className="text-[11.5px] text-slate-500">{text}</p></div></li>
}
function Btn({ icon: Icon, children, onClick, danger }: { icon: typeof RefreshCw; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={cn("w-full inline-flex items-center justify-center gap-1.5 border rounded-xl py-2 text-[12.5px] font-semibold mb-2", danger ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-slate-200 text-slate-700 hover:bg-slate-50")}><Icon className="w-4 h-4" /> {children}</button>
}
function Next({ text, done }: { text: string; done?: boolean }) {
  return <li className="flex items-center gap-2">{done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 shrink-0" />}<span className="text-[11.5px] text-slate-600">{text}</span></li>
}
