"use client"

import Link from "next/link"
import { Download, FileText, Headphones, RefreshCw } from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../../../components/toast"
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
}

function Row({ l, r }: { l: string; r: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-slate-500">{l}</span>
      <span className="text-slate-700 font-medium">{r}</span>
    </div>
  )
}

function Btn({
  icon: Icon,
  children,
  onClick,
}: {
  icon: typeof Download
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
    >
      <Icon className="w-4 h-4" /> {children}
    </button>
  )
}

export default function RentPaymentPanel({ selected }: Props) {
  const { toast } = useCustomerToast()
  return (
    <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
      <p className="text-[12px] text-slate-400">{selected.month} — Payment details</p>
      <p className="text-[26px] font-bold text-slate-900 mt-1">{formatPence(selected.amountPence, "GBP")}</p>
      <StatusPill tone={selected.tone}>{selected.status}</StatusPill>
      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
        <Row l="Rent" r={formatPence(selected.amountPence, "GBP")} />
        <Row l="Service charge" r="£0.00" />
        <Row l="Due date" r={selected.due} />
        <Row l="Payment method" r={selected.method} />
      </div>
      <div className="mt-3 space-y-2">
        {selected.status === "Due" && (
          <button
            onClick={() => toast("Opening secure payment…", "info")}
            className="w-full bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold"
          >
            Pay {formatPence(selected.amountPence, "GBP")}
          </button>
        )}
        <Btn icon={Download} onClick={() => toast("Downloading receipt…", "info")}>
          Download receipt
        </Btn>
        <Btn icon={FileText} onClick={() => toast("Downloading pro forma…", "info")}>
          Download pro forma invoice
        </Btn>
        <Btn icon={RefreshCw} onClick={() => toast("Autopay — coming soon", "info")}>
          Set up autopay
        </Btn>
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
