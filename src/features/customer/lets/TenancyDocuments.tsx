"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload } from "lucide-react"
import { type PillTone } from "../components/StatusPill"
import { useCustomerToast } from "../components/toast"
import TenancySubNav from "./TenancySubNav"
import type { Tenancy } from "../data/lets"
import DocumentKpiStrip from "./components/tenancy/DocumentKpiStrip"
import DocumentList from "./components/tenancy/DocumentList"
import DocumentPreviewPanel from "./components/tenancy/DocumentPreviewPanel"

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

export default function TenancyDocuments({ t }: { t: Tenancy }) {
  const { toast } = useCustomerToast()
  const [selectedId, setSelectedId] = useState("d1")
  const selected = DOCS.find((d) => d.id === selectedId) ?? DOCS[0]

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]">
        <ArrowLeft className="w-4 h-4" /> Back to tenancy
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Documents</h1>
          <p className="text-[13px] text-slate-500 mt-1">{t.property} · agreement, inventory, certificates and receipts.</p>
        </div>
        <button
          onClick={() => toast("Upload (upload-only) — coming soon", "info")}
          className="inline-flex items-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-3.5 py-2 text-[12.5px] font-semibold"
        >
          <Upload className="w-4 h-4" /> Upload document
        </button>
      </div>
      <TenancySubNav id={t.id} active="documents" />
      <DocumentKpiStrip />
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <DocumentList docs={DOCS} selectedId={selectedId} onSelect={setSelectedId} />
        <DocumentPreviewPanel doc={selected} />
      </div>
    </div>
  )
}
