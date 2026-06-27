"use client"

import Link from "next/link"
import { ArrowLeft, Home, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill, type PillTone } from "../components/StatusPill"
import type { Offer, OfferStatus } from "../data/lets"
import OfferProgressTracker from "./components/offer/OfferProgressTracker"
import OfferActionPanel from "./components/offer/OfferActionPanel"

const STATUS_TONE: Record<OfferStatus, PillTone> = { Open: "amber", "Counter offer": "violet", Accepted: "emerald", Expired: "slate" }

export default function OfferDetail({ o }: { o: Offer }) {
  const { toast } = useCustomerToast()

  return (
    <div className="space-y-5">
      <Link href="/customer/lets?tab=offers" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]"><ArrowLeft className="w-4 h-4" /> Back to offers</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-[22px] font-bold text-slate-900">Offer #{o.id}</h1><StatusPill tone={STATUS_TONE[o.status]}>{o.status}</StatusPill></div>
          <p className="text-[13px] text-slate-500 mt-1">{o.property} · {o.location}</p>
        </div>
      </div>

      <OfferProgressTracker status={o.status} />

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

          <Card title="Offer history &amp; negotiation">
            <ol className="space-y-3">
              <Hist who="You" when="2 days ago" text={`Submitted an offer of ${formatPence(o.rentOfferedPence, "GBP")}/mo`} />
              <Hist who="Letting agent" landlord when="1 day ago" text={o.status === "Counter offer" ? `Countered at ${formatPence(o.askingPence, "GBP")}/mo` : "Acknowledged your offer, reviewing with landlord"} />
              <Hist who="You" when="20 hours ago" text="Confirmed availability for the proposed move-in date" />
            </ol>
          </Card>

          <Card title="Property &amp; agent">
            <div className="flex gap-3"><Home className="w-4 h-4 text-slate-400 mt-1" /><div className="flex-1"><p className="text-[12.5px] font-semibold text-slate-800">{o.property}</p><p className="text-[11px] text-slate-400">{o.location} · {o.furnished ? "Furnished" : "Unfurnished"} · {o.tenancyMonths}-month term</p></div></div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-slate-200" /><div><p className="text-[12px] font-semibold text-slate-800">Priya Patel</p><p className="text-[10.5px] text-slate-400">Lettings agent</p></div></div><button onClick={() => toast("Messaging agent…", "info")} className="text-[11.5px] font-semibold text-[var(--brand)] border border-slate-200 rounded-lg px-2.5 py-1"><MessageSquare className="w-3.5 h-3.5 inline mr-1" />Message agent</button></div>
          </Card>
        </div>

        <OfferActionPanel o={o} />
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
function Hist({ who, when, text, landlord }: { who: string; when: string; text: string; landlord?: boolean }) {
  return <li className="flex gap-2.5"><span className={cn("w-7 h-7 rounded-full shrink-0", landlord ? "bg-violet-100" : "bg-[var(--color-brand-100)]")} /><div className="flex-1"><div className="flex items-center justify-between"><p className="text-[12px] font-semibold text-slate-700">{who}</p><p className="text-[10px] text-slate-400">{when}</p></div><p className="text-[11.5px] text-slate-500">{text}</p></div></li>
}
