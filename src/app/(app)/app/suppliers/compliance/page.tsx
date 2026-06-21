"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Upload,
  Download,
  Search,
  ChevronRight,
  FileText,
  BadgeCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { SuppliersHubTabNav } from "@/components/suppliers/SuppliersHubTabNav"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useSuppliers } from "@/features/suppliers/useSuppliers"

// ─── Seed compliance data ──────────────────────────────────────────────────────

const COMPLIANCE_CATEGORIES = [
  { label: "Public Liability Insurance",  status: "compliant",  expiry: "2027-03-15" },
  { label: "Employers Liability",         status: "expiring",   expiry: "2026-07-22" },
  { label: "Gas Safe Certificate",        status: "compliant",  expiry: "2027-01-10" },
  { label: "NICEIC Electrical",           status: "compliant",  expiry: "2026-12-01" },
  { label: "DBS Check",                   status: "non_comply", expiry: "2025-09-30" },
  { label: "CSCS Card",                   status: "compliant",  expiry: "2027-06-20" },
]

function statusConfig(status: string) {
  if (status === "compliant")   return { label: "Compliant",     icon: CheckCircle2,   cls: "text-emerald-600 bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" }
  if (status === "expiring")    return { label: "Expiring soon", icon: AlertTriangle,  cls: "text-amber-600 bg-amber-50 border-amber-200",       dot: "bg-amber-400"   }
  return                               { label: "Non-compliant", icon: XCircle,        cls: "text-red-600 bg-red-50 border-red-200",              dot: "bg-red-400"     }
}

function ComplianceBar({ value }: { value: number }) {
  const color = value >= 95 ? "bg-emerald-500" : value >= 80 ? "bg-amber-400" : "bg-red-400"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100">
        <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[12px] font-semibold text-slate-700 w-8 text-right">{value}%</span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SuppliersCompliancePage() {
  const workspaceId = useWorkspaceId()
  const { suppliers } = useSuppliers(workspaceId)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "compliant" | "expiring" | "non_comply">("all")

  const supplierCompliance = useMemo(() => {
    return suppliers.map((s, i) => {
      const seed = (s.id.charCodeAt(0) + i) % 3
      const status = seed === 0 ? "compliant" : seed === 1 ? "expiring" : "non_comply"
      const score = status === "compliant" ? 95 + (i % 5) : status === "expiring" ? 75 + (i % 15) : 40 + (i % 30)
      return { ...s, complianceStatus: status, complianceScore: score }
    })
  }, [suppliers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return supplierCompliance.filter((s) => {
      if (statusFilter !== "all" && s.complianceStatus !== statusFilter) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q) || s.trade.toLowerCase().includes(q)
    })
  }, [supplierCompliance, search, statusFilter])

  const compliantCount  = supplierCompliance.filter((s) => s.complianceStatus === "compliant").length
  const expiringCount   = supplierCompliance.filter((s) => s.complianceStatus === "expiring").length
  const nonComplyCount  = supplierCompliance.filter((s) => s.complianceStatus === "non_comply").length
  const overallScore    = suppliers.length > 0
    ? Math.round(supplierCompliance.reduce((acc, s) => acc + s.complianceScore, 0) / suppliers.length)
    : 96

  function exportCsv() {
    const rows = filtered.map((s) => [s.id, s.name, s.trade, s.complianceStatus, String(s.complianceScore)].map((v) => `"${v}"`).join(","))
    const csv = ["ID,Name,Trade,Status,Score", ...rows].join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "suppliers-compliance.csv"
    a.click()
  }

  return (
    <div className="space-y-5">
      <MobileTopBar
        title="Compliance"
        subtitle="Supplier documents"
        overflowActions={[
          { label: "Export", icon: Download, onClick: exportCsv },
        ]}
      />

      <div className="hidden md:block">
        <PageHeader
          title="Supplier Compliance"
          description="Track insurance, certifications and document expiry across your supplier network"
          actions={
            <>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </>
          }
        />
      </div>

      <SuppliersHubTabNav />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Overall score",    value: `${overallScore}%`,      icon: ShieldCheck,   bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Compliant",        value: String(compliantCount),  icon: CheckCircle2,  bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Expiring soon",    value: String(expiringCount),   icon: AlertTriangle, bg: "bg-amber-50",   color: "text-amber-600"   },
          { label: "Non-compliant",    value: String(nonComplyCount),  icon: XCircle,       bg: "bg-red-50",     color: "text-red-600"     },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", kpi.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", kpi.color)} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: supplier compliance table */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search suppliers…"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(["all", "compliant", "expiring", "non_comply"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors capitalize",
                    statusFilter === s ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {s === "non_comply" ? "Non-compliant" : s === "all" ? "All" : s === "expiring" ? "Expiring" : "Compliant"}
                </button>
              ))}
            </div>
          </div>

          {/* Supplier rows */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-slate-700">No suppliers match</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => {
                const cfg = statusConfig(s.complianceStatus)
                const Icon = cfg.icon
                return (
                  <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0", s.avatarBg)}>
                        {s.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link
                            href={`/property-manager/work/suppliers/${s.id}`}
                            className="text-[13.5px] font-semibold text-slate-900 hover:text-[#2563EB] transition-colors"
                          >
                            {s.name}
                          </Link>
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{s.trade}</span>
                        </div>
                        <ComplianceBar value={s.complianceScore} />
                      </div>
                      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold border shrink-0", cfg.cls)}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </div>
                      <Link
                        href={`/property-manager/work/suppliers/${s.id}`}
                        className="shrink-0 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right rail: document checklist */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-slate-800">Required Documents</h3>
              <span className="text-[11px] text-slate-500 font-medium">Per supplier</span>
            </div>
            <div className="space-y-3">
              {COMPLIANCE_CATEGORIES.map((doc) => {
                const cfg = statusConfig(doc.status)
                const Icon = cfg.icon
                return (
                  <div key={doc.label} className="flex items-start gap-3">
                    <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", cfg.cls.split(" ")[0])} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium text-slate-800 truncate">{doc.label}</p>
                      <p className="text-[11px] text-slate-500">
                        {doc.status === "non_comply" ? "Expired" : `Expires ${doc.expiry}`}
                      </p>
                    </div>
                    <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full border", cfg.cls)}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alerts */}
          {(expiringCount > 0 || nonComplyCount > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[12.5px] font-semibold text-amber-800">Action required</span>
              </div>
              <div className="space-y-2 text-[12px] text-amber-700">
                {expiringCount > 0 && (
                  <p>{expiringCount} supplier{expiringCount !== 1 ? "s have" : " has"} documents expiring soon.</p>
                )}
                {nonComplyCount > 0 && (
                  <p>{nonComplyCount} supplier{nonComplyCount !== 1 ? "s are" : " is"} non-compliant and require attention.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
