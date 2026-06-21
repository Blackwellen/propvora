"use client"

import { Ban, Check, Download, RefreshCw, Wallet } from "lucide-react"
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../../../components/toast"
import type { Offer } from "../../../data/lets"

function Row({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex items-center justify-between text-[12px] py-0.5">
      <span className="text-slate-500">{l}</span>
      <span className="text-slate-700 font-medium">{r}</span>
    </div>
  )
}

function Btn({
  icon: Icon,
  children,
  onClick,
  danger,
}: {
  icon: typeof RefreshCw
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full inline-flex items-center justify-center gap-1.5 border rounded-xl py-2 text-[12.5px] font-semibold mb-2",
        danger ? "border-rose-200 text-rose-600 hover:bg-rose-50" : "border-slate-200 text-slate-700 hover:bg-slate-50"
      )}
    >
      <Icon className="w-4 h-4" /> {children}
    </button>
  )
}

function Next({ text, done }: { text: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
      )}
      <span className="text-[11.5px] text-slate-600">{text}</span>
    </li>
  )
}

export default function OfferActionPanel({ o }: { o: Offer }) {
  const { toast } = useCustomerToast()

  return (
    <aside className="space-y-5 sticky top-[84px]">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-3">Actions</p>
        <button
          onClick={() => toast("Counter-offer accepted", "success")}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold mb-2"
        >
          <Check className="w-4 h-4" /> {o.status === "Counter offer" ? "Accept counter-offer" : "Accept offer"}
        </button>
        <Btn icon={RefreshCw} onClick={() => toast("Amend offer — coming soon", "info")}>
          Amend offer
        </Btn>
        <Btn icon={Ban} danger onClick={() => toast("Offer withdrawn", "info")}>
          Withdraw offer
        </Btn>
        <Btn icon={Wallet} onClick={() => toast("Opening secure payment…", "info")}>
          Pay holding deposit
        </Btn>
        <Btn icon={Download} onClick={() => toast("Downloading terms…", "info")}>
          Download terms
        </Btn>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-3">Payment breakdown</p>
        <Row l="First month's rent" r={formatPence(o.rentOfferedPence, "GBP")} />
        <Row l="Holding deposit" r={formatPence(o.holdingDepositPence, "GBP")} />
        <Row l="Security deposit" r={formatPence(o.rentOfferedPence + 2000, "GBP")} />
        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100">
          <span className="text-[12.5px] font-semibold text-slate-700">Total upfront</span>
          <span className="text-[13px] font-bold text-slate-900">
            {formatPence(o.rentOfferedPence * 2 + 2000, "GBP")}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-3">What happens next</p>
        <ol className="space-y-2">
          <Next done text="Submit your offer" />
          <Next done={o.status === "Accepted"} text="Landlord reviews &amp; responds" />
          <Next text="Pay holding deposit to secure" />
          <Next text="Complete referencing &amp; sign" />
        </ol>
      </div>

      <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-slate-600">
          Holding deposits are protected and refundable under the Tenant Fees Act if the landlord withdraws.
        </p>
      </div>
    </aside>
  )
}
