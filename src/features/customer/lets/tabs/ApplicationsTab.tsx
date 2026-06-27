"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FilePlus, Send, Clock, CheckCircle2, XCircle, Search, ChevronRight, Upload, UserPlus,
  Gauge, Wallet, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { StatusPill, type PillTone } from "../../components/StatusPill"
import type { Application, ApplicationStatus } from "../../data/lets"

const STATUS_TONE: Record<ApplicationStatus, PillTone> = {
  Draft: "slate", Submitted: "blue", "Under review": "amber", Approved: "emerald", Declined: "red",
}
const REFERENCING = ["Identity & Right to Rent", "Employment reference", "Previous landlord reference", "Credit check", "Affordability check"]

export default function ApplicationsTab() {
  const [data, setData] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState("")

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const res = await fetch("/api/customer/lets?type=applications", { headers: { accept: "application/json" } })
        const j = (await res.json()) as { applications?: Application[] }
        const rows = j.applications ?? []
        if (!active) return
        setData(rows)
        setSelectedId((cur) => cur || (rows[0]?.id ?? ""))
      } catch { /* ignore */ } finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  const selected = data.find((a) => a.id === selectedId) ?? data[0] ?? null

  const kpis = [
    { id: "draft", label: "Draft applications", value: data.filter((a) => a.status === "Draft").length, icon: FilePlus, bg: "bg-slate-50 text-slate-500" },
    { id: "submitted", label: "Submitted", value: data.filter((a) => a.status === "Submitted").length, icon: Send, bg: "bg-[var(--brand-soft)] text-[var(--brand)]" },
    { id: "review", label: "Under review", value: data.filter((a) => a.status === "Under review").length, icon: Clock, bg: "bg-amber-50 text-amber-600" },
    { id: "approved", label: "Approved", value: data.filter((a) => a.status === "Approved").length, icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
    { id: "declined", label: "Declined", value: data.filter((a) => a.status === "Declined").length, icon: XCircle, bg: "bg-rose-50 text-rose-500" },
  ]

  if (loading) return <div className="py-16 flex justify-center text-slate-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (data.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
      <FilePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-[14px] font-semibold text-slate-700">No applications yet</p>
      <p className="text-[12.5px] text-slate-400 mt-1">Apply for a rental and track its progress here.</p>
      <Link href="/customer/lets?tab=search" className="mt-3 inline-block text-[12.5px] font-semibold text-[var(--brand)]">Browse lets →</Link>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}><Icon className="w-[18px] h-[18px]" /></span>
            <p className="text-[20px] font-bold text-slate-900 mt-3 leading-none">{k.value}</p>
            <p className="text-[12px] font-medium text-slate-500 mt-1">{k.label}</p>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-[14px] font-bold text-slate-900">Applications</h3><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input placeholder="Search" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--color-brand-400)] w-36" /></div></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 pr-2 font-semibold">Property</th><th className="py-2 px-2 font-semibold">Rent</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 font-semibold">Progress</th><th className="py-2 px-2 font-semibold">Submitted</th><th className="py-2 px-2 w-8"></th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((a) => { const active = a.id === selectedId; return (
                  <tr key={a.id} onClick={() => setSelectedId(a.id)} className={cn("text-[12.5px] cursor-pointer", active ? "bg-[var(--brand-soft)]/40 outline outline-2 -outline-offset-2 outline-[var(--brand)]" : "hover:bg-slate-50")}>
                    <td className="py-3 pr-2"><div className="flex items-center gap-2.5 min-w-[160px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={a.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" /><div className="min-w-0"><p className="font-semibold text-slate-800 truncate">{a.property}</p><p className="text-[11px] text-slate-400 truncate">{a.location}</p></div></div></td>
                    <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{formatPence(a.rentPence, "GBP")}<span className="text-slate-400 font-normal text-[10px]">/mo</span></td>
                    <td className="py-3 px-2"><StatusPill tone={STATUS_TONE[a.status]}>{a.status}</StatusPill></td>
                    <td className="py-3 px-2"><div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-[var(--brand)] rounded-full" style={{ width: `${a.progressPct}%` }} /></div><span className="text-[10px] text-slate-400">{a.progressPct}%</span></td>
                    <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{a.submitted}</td>
                    <td className="py-3 px-2"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <div className="flex items-center justify-between"><h3 className="text-[14px] font-bold text-slate-900">Application details</h3><StatusPill tone={STATUS_TONE[selected.status]}>{selected.status}</StatusPill></div>
          <div className="flex gap-2.5 mt-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={selected.image} alt="" className="w-16 h-14 rounded-lg object-cover shrink-0" /><div><p className="text-[12.5px] font-semibold text-slate-800">{selected.property}</p><p className="text-[11px] text-slate-400">{selected.location}</p><p className="text-[11px] text-slate-500 mt-0.5">Move-in {selected.moveIn}</p></div></div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
            <div className="rounded-xl border border-slate-100 p-2.5 text-center"><Gauge className="w-4 h-4 text-violet-500 mx-auto" /><p className="text-[16px] font-bold text-slate-900 mt-1">{selected.score || "—"}</p><p className="text-[10px] text-slate-400">Application score</p></div>
            <div className="rounded-xl border border-slate-100 p-2.5 text-center"><Wallet className="w-4 h-4 text-emerald-500 mx-auto" /><p className="text-[16px] font-bold text-slate-900 mt-1">{selected.affordabilityPct || "—"}%</p><p className="text-[10px] text-slate-400">Income on rent</p></div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[12px] font-semibold text-slate-700 mb-1.5">Referencing checklist</p>
            {REFERENCING.map((label) => <div key={label} className="flex items-center gap-2 py-0.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-300" /><span className="text-[11.5px] text-slate-600">{label}</span></div>)}
          </div>

          <div className="mt-3 space-y-2">
            <Link href={`/customer/lets/applications/${selected.id}/wizard`} className="block text-center bg-[var(--brand)] text-white rounded-xl py-2.5 text-[13px] font-semibold">{selected.status === "Draft" ? "Continue application" : "View application"}</Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/customer/lets/applications/${selected.id}/wizard`} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"><Upload className="w-3.5 h-3.5" /> Upload docs</Link>
              <Link href={`/customer/lets/applications/${selected.id}/wizard`} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"><UserPlus className="w-3.5 h-3.5" /> Add guarantor</Link>
            </div>
          </div>
        </aside>
        )}
      </div>
    </div>
  )
}
