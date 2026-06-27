"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldCheck, Wallet, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { type PillTone } from "../components/StatusPill"
import TenancySubNav from "./TenancySubNav"
import type { Tenancy } from "../data/lets"
import RentScheduleTable from "./components/tenancy/RentScheduleTable"
import RentPaymentPanel from "./components/tenancy/RentPaymentPanel"

interface Sched { id: string; month: string; due: string; amountPence: number; status: string; tone: PillTone; method: string }

export default function RentPayments({ t }: { t: Tenancy }) {
  const { toast } = useCustomerToast()
  const [schedule, setSchedule] = useState<Sched[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState("")
  const [paying, setPaying] = useState(false)
  const [autopayOn, setAutopayOn] = useState(false)
  const [autopayBusy, setAutopayBusy] = useState(false)
  const selected = schedule.find((s) => s.id === selectedId) ?? schedule.find((s) => s.status !== "Paid") ?? schedule[0]

  async function loadSchedule() {
    try {
      const res = await fetch(`/api/customer/lets/rent-schedule?tenancyId=${encodeURIComponent(t.id)}`, { headers: { accept: "application/json" } })
      const j = (await res.json()) as { items?: Sched[] }
      setSchedule(j.items ?? [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => {
    void loadSchedule()
    void (async () => {
      try {
        const r = await fetch(`/api/customer/lets/autopay?tenancyId=${encodeURIComponent(t.id)}`)
        if (r.ok) { const j = (await r.json()) as { enabled?: boolean }; setAutopayOn(Boolean(j.enabled)) }
      } catch { /* ignore */ }
    })()
    // Verify a returning Checkout success.
    const params = new URLSearchParams(window.location.search)
    const paid = params.get("paid")
    if (paid) {
      void (async () => {
        try {
          const res = await fetch("/api/customer/lets/rent-payment", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "confirm", sessionId: paid }),
          })
          const j = (await res.json()) as { paid?: boolean }
          if (j.paid) { toast("Rent payment confirmed. Thank you!", "success"); await loadSchedule() }
        } catch { /* ignore */ }
        window.history.replaceState({}, "", `/customer/lets/tenancies/${t.id}/rent-payments`)
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id])

  async function pay(scheduleId: string) {
    setPaying(true)
    try {
      const res = await fetch("/api/customer/lets/rent-payment", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create", scheduleId }),
      })
      if (!res.ok) { const b = await res.json().catch(() => null); toast(b?.error ?? "Could not start payment.", "error"); setPaying(false); return }
      const { url } = (await res.json()) as { url?: string }
      if (url) window.location.assign(url)
      else { toast("Could not start payment.", "error"); setPaying(false) }
    } catch { toast("Something went wrong.", "error"); setPaying(false) }
  }

  async function toggleAutopay() {
    setAutopayBusy(true)
    const next = !autopayOn
    try {
      const res = await fetch("/api/customer/lets/autopay", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenancyId: t.id, enable: next, amountPence: t.rentPence }),
      })
      const j = (await res.json()) as { needsCard?: boolean; enabled?: boolean }
      if (j.needsCard) { toast("Add a card first in Payments → Saved cards, then enable autopay.", "info"); setAutopayBusy(false); return }
      if (!res.ok) { toast("Could not update autopay.", "error"); setAutopayBusy(false); return }
      setAutopayOn(Boolean(j.enabled))
      toast(next ? "Autopay enabled — rent will be collected automatically." : "Autopay turned off.", "success")
    } catch { toast("Something went wrong.", "error") } finally { setAutopayBusy(false) }
  }

  const paidThisYear = schedule.filter((s) => s.status === "Paid").reduce((a, s) => a + s.amountPence, 0)
  const outstanding = schedule.filter((s) => s.status === "Overdue").reduce((a, s) => a + s.amountPence, 0)
  const KPIS = [
    { id: "next", label: "Next rent due", value: formatPence(t.rentPence, "GBP"), sub: t.nextPaymentDate, icon: Wallet, bg: "bg-amber-50 text-amber-600" },
    { id: "paid", label: "Paid to date", value: formatPence(paidThisYear, "GBP"), sub: `${schedule.filter((s) => s.status === "Paid").length} payments`, icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
    { id: "outstanding", label: "Outstanding balance", value: formatPence(outstanding, "GBP"), sub: outstanding > 0 ? "Action needed" : "Up to date", icon: AlertTriangle, bg: "bg-[var(--brand-soft)] text-[var(--brand)]" },
    { id: "deposit", label: "Deposit held", value: formatPence(t.depositPence, "GBP"), sub: "Protected", icon: ShieldCheck, bg: "bg-violet-50 text-violet-600" },
  ]

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]">
        <ArrowLeft className="w-4 h-4" /> Back to tenancy
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Rent Payments</h1>
          <p className="text-[13px] text-slate-500 mt-1">{t.property} · {t.location} · {t.id}</p>
        </div>
      </div>
      <TenancySubNav id={t.id} active="rent" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
              <p className="text-[16px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
              <p className="text-[11.5px] font-medium text-slate-500 mt-1">{k.label}</p>
              <p className="text-[10.5px] text-slate-400">{k.sub}</p>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center text-slate-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : schedule.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-[13px] text-slate-400">No rent schedule yet. Rent items will appear here once your tenancy is active.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
          <RentScheduleTable schedule={schedule} selectedId={selected?.id ?? ""} onSelect={setSelectedId} />
          {selected && <RentPaymentPanel selected={selected} onPay={pay} paying={paying} autopayOn={autopayOn} onToggleAutopay={toggleAutopay} autopayBusy={autopayBusy} />}
        </div>
      )}
    </div>
  )
}
