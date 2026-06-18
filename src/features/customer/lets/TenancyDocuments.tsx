"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, FileText, FileSignature, Clock, FilePlus2, Search, Upload, Download, Share2,
  PenLine, ChevronLeft, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../components/toast"
import { StatusPill, type PillTone } from "../components/StatusPill"
import TenancySubNav from "./TenancySubNav"
import type { Tenancy } from "../data/lets"

interface Doc { id: string; name: string; category: string; date: string; size: string; status: string; tone: PillTone }
const DOCS: Doc[] = [
  { id: "d1", name: "Tenancy Agreement", category: "Agreement", date: "28 May 2025", size: "1.2 MB", status: "Signed", tone: "emerald" },
  { id: "d2", name: "Inventory Report", category: "Inventory", date: "1 Apr 2025", size: "3.4 MB", status: "Awaiting signature", tone: "amber" },
  { id: "d3", name: "Deposit Certificate", category: "Deposit", date: "2 Apr 2025", size: "0.4 MB", status: "Active", tone: "blue" },
  { id: "d4", name: "Gas Safety Certificate", category: "Compliance", date: "15 Mar 2025", size: "0.6 MB", status: "Valid", tone: "emerald" },
  { id: "d5", name: "EPC Certificate", category: "Compliance", date: "10 Jan 2025", size: "0.5 MB", status: "Valid", tone: "emerald" },
  { id: "d6", name: "How to Rent Guide", category: "Compliance", date: "1 Apr 2025", size: "1.1 MB", status: "Acknowledged", tone: "blue" },
  { id: "d7", name: "Rent Receipt — May", category: "Receipts", date: "1 May 2025", size: "0.2 MB", status: "Issued", tone: "slate" },
]
const KPIS = [
  { id: "total", label: "Total documents", value: "38", icon: FileText, bg: "bg-blue-50 text-blue-600" },
  { id: "sign", label: "Awaiting signature", value: "2", icon: FileSignature, bg: "bg-amber-50 text-amber-600" },
  { id: "recent", label: "Recently added", value: "4", icon: FilePlus2, bg: "bg-violet-50 text-violet-600" },
  { id: "expiring", label: "Expiring soon", value: "1", icon: Clock, bg: "bg-rose-50 text-rose-500" },
]

export default function TenancyDocuments({ t }: { t: Tenancy }) {
  const { toast } = useCustomerToast()
  const [selectedId, setSelectedId] = useState("d1")
  const selected = DOCS.find((d) => d.id === selectedId) ?? DOCS[0]

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="w-4 h-4" /> Back to tenancy</Link>
      <div className="flex items-center justify-between gap-3"><div><h1 className="text-[22px] font-bold text-slate-900">Documents</h1><p className="text-[13px] text-slate-500 mt-1">{t.property} · agreement, inventory, certificates and receipts.</p></div><button onClick={() => toast("Upload (upload-only) — coming soon", "info")} className="inline-flex items-center gap-1.5 bg-[#2563EB] text-white rounded-xl px-3.5 py-2 text-[12.5px] font-semibold"><Upload className="w-4 h-4" /> Upload document</button></div>
      <TenancySubNav id={t.id} active="documents" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => { const Icon = k.icon; return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}><Icon className="w-5 h-5" /></span>
            <div><p className="text-[18px] font-bold text-slate-900 leading-none">{k.value}</p><p className="text-[11px] text-slate-500 mt-1">{k.label}</p></div>
          </div>
        )})}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3"><button className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-600">All categories</button><div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input placeholder="Search documents" className="bg-slate-50 rounded-lg pl-8 pr-2 py-1.5 text-[12px] outline-none w-44" /></div></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 pr-2 font-semibold">Document</th><th className="py-2 px-2 font-semibold">Category</th><th className="py-2 px-2 font-semibold">Date</th><th className="py-2 px-2 font-semibold">Status</th><th className="py-2 px-2 w-8"></th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {DOCS.map((d) => { const active = d.id === selectedId; return (
                  <tr key={d.id} onClick={() => setSelectedId(d.id)} className={cn("text-[12.5px] cursor-pointer", active ? "bg-blue-50/40 outline outline-2 -outline-offset-2 outline-blue-500" : "hover:bg-slate-50")}>
                    <td className="py-3 pr-2"><div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center text-[9px] font-bold shrink-0">PDF</span><div><p className="font-semibold text-slate-800">{d.name}</p><p className="text-[10.5px] text-slate-400">{d.size}</p></div></div></td>
                    <td className="py-3 px-2 text-slate-500">{d.category}</td>
                    <td className="py-3 px-2 text-slate-500">{d.date}</td>
                    <td className="py-3 px-2"><StatusPill tone={d.tone}>{d.status}</StatusPill></td>
                    <td className="py-3 px-2"><Download className="w-4 h-4 text-slate-400" /></td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-[12px] text-slate-500"><span>Showing 7 of 38 documents</span><div className="flex items-center gap-1"><button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button><button className="w-7 h-7 rounded-lg bg-blue-600 text-white text-[12px] font-semibold">1</button><button className="w-7 h-7 rounded-lg border border-slate-200 text-[12px]">2</button><button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button></div></div>
        </div>

        {/* Right: preview */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-[84px]">
          <p className="text-[13px] font-bold text-slate-900 mb-2">{selected.name}</p>
          <div className="rounded-xl bg-slate-100 h-48 flex items-center justify-center text-slate-400 mb-3"><FileText className="w-10 h-10" /></div>
          <div className="space-y-1.5">
            <Row l="Category" r={selected.category} />
            <Row l="Date added" r={selected.date} />
            <Row l="File size" r={selected.size} />
            <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">Status</span><StatusPill tone={selected.tone}>{selected.status}</StatusPill></div>
          </div>
          <div className="mt-3 space-y-2">
            <button onClick={() => toast("Downloading…", "info")} className="w-full bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"><Download className="w-4 h-4" /> Download</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => toast("Share link copied", "success")} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"><Share2 className="w-3.5 h-3.5" /> Share</button>
              <button onClick={() => toast("Signature requested", "info")} className="inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"><PenLine className="w-3.5 h-3.5" /> Sign</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">{l}</span><span className="text-[12px] font-semibold text-slate-800">{r}</span></div>
}
