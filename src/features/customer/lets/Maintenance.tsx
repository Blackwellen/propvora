"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { type PillTone } from "../components/StatusPill"
import { useCustomerToast } from "../components/toast"
import TenancySubNav from "./TenancySubNav"
import type { Tenancy } from "../data/lets"
import MaintenanceKpiStrip from "./components/tenancy/MaintenanceKpiStrip"
import MaintenanceList from "./components/tenancy/MaintenanceList"
import MaintenanceDetailPanel from "./components/tenancy/MaintenanceDetailPanel"

interface Req { id: string; title: string; category: string; reported: string; status: string; tone: PillTone; priority: string; pTone: PillTone }
const REQS: Req[] = [
  { id: "MR-3041", title: "Leaking kitchen tap", category: "Plumbing", reported: "22 May 2025", status: "In progress", tone: "amber", priority: "Medium", pTone: "amber" },
  { id: "MR-3038", title: "Boiler not heating water", category: "Heating", reported: "21 May 2025", status: "Emergency", tone: "red", priority: "Urgent", pTone: "red" },
  { id: "MR-3030", title: "Broken window latch", category: "General", reported: "18 May 2025", status: "Awaiting landlord", tone: "violet", priority: "Low", pTone: "slate" },
  { id: "MR-3021", title: "Faulty smoke alarm", category: "Electrical", reported: "15 May 2025", status: "Open", tone: "blue", priority: "High", pTone: "amber" },
  { id: "MR-3005", title: "Damp patch in bedroom", category: "General", reported: "8 May 2025", status: "Resolved", tone: "emerald", priority: "Medium", pTone: "amber" },
]

export default function Maintenance({ t }: { t: Tenancy }) {
  const { toast } = useCustomerToast()
  const [selectedId, setSelectedId] = useState("MR-3041")
  const selected = REQS.find((r) => r.id === selectedId) ?? REQS[0]

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]">
        <ArrowLeft className="w-4 h-4" /> Back to tenancy
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Maintenance Requests</h1>
          <p className="text-[13px] text-slate-500 mt-1">Report repairs, track progress and stay informed every step of the way.</p>
        </div>
        <button
          onClick={() => toast("Report repair — opens form", "info")}
          className="inline-flex items-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-3.5 py-2 text-[12.5px] font-semibold"
        >
          <Plus className="w-4 h-4" /> Report a repair
        </button>
      </div>
      <TenancySubNav id={t.id} active="maintenance" />
      <MaintenanceKpiStrip />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <MaintenanceList requests={REQS} selectedId={selectedId} onSelect={setSelectedId} />
        <MaintenanceDetailPanel req={selected} />
      </div>
    </div>
  )
}
