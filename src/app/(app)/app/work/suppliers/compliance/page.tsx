"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { WorkTabNav } from "@/components/work/WorkTabNav"
import { SuppliersTabNav } from "@/components/work/SuppliersTabNav"
import { MobileTopBar, MobileTabs } from "@/components/mobile"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useSuppliers, type SupplierView } from "@/features/suppliers/useSuppliers"
import { useWorkspaceSupplierDocuments, type SupplierDocument } from "@/features/suppliers/useSupplierTabs"

type ComplianceState = "valid" | "expiring" | "expired" | "none"

interface SupplierCompliance {
  supplier: SupplierView
  total: number
  verified: number
  expiring: number
  expired: number
  state: ComplianceState
  nextExpiry: string | null
}

const STATE_META: Record<ComplianceState, { label: string; badge: string }> = {
  valid: { label: "Compliant", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expiring: { label: "Expiring soon", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  expired: { label: "Action needed", badge: "bg-red-50 text-red-700 border-red-200" },
  none: { label: "No documents", badge: "bg-slate-100 text-slate-500 border-slate-200" },
}

const FILTERS: { key: "all" | ComplianceState; label: string }[] = [
  { key: "all", label: "All" },
  { key: "expired", label: "Action needed" },
  { key: "expiring", label: "Expiring" },
  { key: "none", label: "No documents" },
]

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000)
}

export default function SupplierCompliancePage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { suppliers, loading } = useSuppliers(workspaceId)
  const { data: docs = [], isLoading: docsLoading } = useWorkspaceSupplierDocuments(workspaceId)
  const [filter, setFilter] = useState<"all" | ComplianceState>("all")

  const isLoading = loading || docsLoading

  const rows = useMemo<SupplierCompliance[]>(() => {
    const bySupplier = new Map<string, SupplierDocument[]>()
    for (const d of docs) {
      const list = bySupplier.get(d.supplier_id) ?? []
      list.push(d)
      bySupplier.set(d.supplier_id, list)
    }
    return suppliers
      .map((s) => {
        const sDocs = bySupplier.get(s.id) ?? []
        let expiring = 0
        let expired = 0
        let nextExpiry: string | null = null
        for (const d of sDocs) {
          if (!d.expiry_date) continue
          const days = daysUntil(d.expiry_date)
          if (days < 0) expired += 1
          else if (days <= 30) expiring += 1
          if (nextExpiry === null || new Date(d.expiry_date) < new Date(nextExpiry)) nextExpiry = d.expiry_date
        }
        const state: ComplianceState =
          sDocs.length === 0 ? "none" : expired > 0 ? "expired" : expiring > 0 ? "expiring" : "valid"
        return {
          supplier: s,
          total: sDocs.length,
          verified: sDocs.filter((d) => d.is_verified).length,
          expiring,
          expired,
          state,
          nextExpiry,
        }
      })
      .sort((a, b) => {
        const rank: Record<ComplianceState, number> = { expired: 0, expiring: 1, none: 2, valid: 3 }
        return rank[a.state] - rank[b.state] || a.supplier.name.localeCompare(b.supplier.name)
      })
  }, [suppliers, docs])

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.state === filter)),
    [rows, filter]
  )

  const kpis = useMemo(() => {
    const expiredDocs = docs.filter((d) => d.expiry_date && daysUntil(d.expiry_date) < 0).length
    const expiringDocs = docs.filter((d) => d.expiry_date && daysUntil(d.expiry_date) >= 0 && daysUntil(d.expiry_date) <= 30).length
    const noDocs = rows.filter((r) => r.total === 0).length
    return [
      { label: "Tracked Documents", value: String(docs.length), sub: `${rows.length} suppliers`, icon: FileCheck2, bg: "bg-blue-50", color: "text-blue-600" },
      { label: "Expiring Soon", value: String(expiringDocs), sub: "Within 30 days", icon: AlertTriangle, bg: "bg-amber-50", color: "text-amber-600" },
      { label: "Expired", value: String(expiredDocs), sub: expiredDocs > 0 ? "Action needed" : "All current", icon: XCircle, bg: "bg-red-50", color: "text-red-600" },
      { label: "Missing Documents", value: String(noDocs), sub: "Suppliers with none", icon: ShieldCheck, bg: "bg-violet-50", color: "text-violet-600" },
    ]
  }, [docs, rows])

  function exportCsv() {
    const headers = ["Supplier", "Trade", "Status", "Documents", "Verified", "Expiring", "Expired", "Next Expiry"]
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const lines = [headers.join(",")]
    for (const r of rows) {
      lines.push(
        [r.supplier.name, r.supplier.trade, STATE_META[r.state].label, r.total, r.verified, r.expiring, r.expired, r.nextExpiry ?? ""]
          .map(escape)
          .join(",")
      )
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `supplier-compliance-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <MobileTopBar
        title="Supplier Compliance"
        subtitle="Documents & certificates"
        primaryAction={docs.length > 0 ? { label: "Export CSV", icon: Download, onClick: exportCsv } : undefined}
      />
      <div className="hidden md:block">
        <PageHeader
          title="Supplier Compliance"
          description="Insurance, certifications and document status across your supplier network"
          actions={
            <button
              onClick={exportCsv}
              disabled={docs.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          }
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", k.bg)}>
                <Icon className={cn("w-5 h-5", k.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-900 truncate">{k.value}</p>
                <p className="text-[11px] font-medium text-slate-600">{k.label}</p>
                <p className="text-[10px] text-slate-400">{k.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      <WorkTabNav />
      <SuppliersTabNav />

      {/* Filter */}
      <div className="md:hidden">
        <MobileTabs
          tabs={FILTERS.map((f) => ({ id: f.key, label: f.label }))}
          value={filter}
          onChange={(id) => setFilter(id as "all" | ComplianceState)}
          aria-label="Filter by compliance status"
        />
      </div>
      <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
              filter === f.key ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-900 mb-1">No suppliers yet</p>
            <p className="text-sm text-slate-500 mb-4">Add supplier contacts to start tracking compliance documents.</p>
            <Link href="/property-manager/contacts/new?type=supplier" className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold">Add Supplier</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Nothing in this view</p>
            <p className="text-xs text-slate-400 mt-1">No suppliers match the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Docs</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Verified</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Next Expiry</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Manage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const meta = STATE_META[r.state]
                  return (
                    <tr
                      key={r.supplier.id}
                      onClick={() => router.push(`/property-manager/work/suppliers/${r.supplier.id}`)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0", r.supplier.avatarBg)}>
                            {r.supplier.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 truncate">{r.supplier.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{r.supplier.trade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold", meta.badge)}>
                          {meta.label}
                          {r.expired > 0 && ` · ${r.expired}`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-[12.5px] font-semibold text-slate-700 hidden sm:table-cell tabular-nums">{r.total}</td>
                      <td className="px-4 py-3.5 text-center text-[12.5px] text-slate-600 hidden md:table-cell tabular-nums">{r.verified}</td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-600 hidden lg:table-cell">
                        {r.nextExpiry ? new Date(r.nextExpiry).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[12px] font-semibold text-[#2563EB]">View →</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && rows.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Open a supplier to upload or verify insurance, registrations and safety certificates.</p>
          </div>
        )}
      </div>
    </div>
  )
}
