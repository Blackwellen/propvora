"use client"
import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  Scale,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  RefreshCw,
  Gavel,
  ArrowRight,
  Download,
} from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancies } from "@/hooks/useTenancies"
import { useProperties } from "@/hooks/useProperties"
import {
  usePossessionCases,
  useEpcCertificates,
  summariseTenancies,
} from "../legal-data"

interface ChecklistItem {
  id: string
  label: string
  /** "auto" items derive their done state from live data; "manual" are user-toggled. */
  kind: "auto" | "manual"
  done?: boolean
}
interface ChecklistCategory {
  id: string
  name: string
  items: ChecklistItem[]
}

export default function Rra2026Page() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { data: tenancies = [], isLoading: loadingTen } = useTenancies(workspaceId)
  const { data: properties = [] } = useProperties(workspaceId)
  const { data: cases = [] } = usePossessionCases(workspaceId)
  const { data: epcCerts = [] } = useEpcCertificates(workspaceId)

  const ten = useMemo(
    () => summariseTenancies(tenancies.map((t) => ({ tenancy_type: t.tenancy_type, status: t.status }))),
    [tenancies]
  )

  // EPC coverage signal (for the readiness items)
  const epcCoveredPropertyIds = new Set(epcCerts.map((c) => c.property_id).filter(Boolean) as string[])
  const epcCoverageOk = properties.length > 0 && epcCoveredPropertyIds.size >= properties.length

  // Possession signals
  const activeCases = cases.filter((c) => c.status !== "resolved").length
  const noticesServed = cases.filter((c) => !!c.notice_served_date).length

  // ─── Live-derived checklist. Auto items compute done from real data. ──
  const AUTO_DONE: Record<string, boolean> = {
    a_periodic: ten.total > 0 && ten.fixed === 0, // all tenancies periodic (no remaining fixed/AST)
    a_have_tenancies: ten.total > 0,
    a_possession_evidence: cases.length === 0 || cases.some((c) => c.status !== "notice_draft"),
    a_epc_coverage: epcCoverageOk,
    a_property_data: properties.length > 0,
  }

  const [manualDone, setManualDone] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<string[]>([])

  const CATEGORIES: ChecklistCategory[] = [
    {
      id: "tenancy",
      name: "Tenancy Conversion",
      items: [
        { id: "a_have_tenancies", label: "Tenancies recorded in Propvora", kind: "auto" },
        { id: "a_periodic", label: "All tenancies are periodic (no remaining fixed-term)", kind: "auto" },
        { id: "m_remove_clauses", label: "Reviewed agreements for prohibited clauses", kind: "manual" },
        { id: "m_pets", label: "Updated pet-request handling process", kind: "manual" },
      ],
    },
    {
      id: "possession",
      name: "Possession Readiness",
      items: [
        { id: "a_possession_evidence", label: "Possession cases evidence the ground before notice", kind: "auto" },
        { id: "m_grounds", label: "Familiar with applicable Section 8 grounds", kind: "manual" },
        { id: "m_solicitor", label: "Solicitor identified for contested possession", kind: "manual" },
      ],
    },
    {
      id: "data",
      name: "Property & EPC Data",
      items: [
        { id: "a_property_data", label: "Property records maintained in Propvora", kind: "auto" },
        { id: "a_epc_coverage", label: "Every property has an EPC certificate on record", kind: "auto" },
        { id: "m_retention", label: "Reviewed data retention policy", kind: "manual" },
      ],
    },
    {
      id: "ombudsman",
      name: "Redress & Ombudsman",
      items: [
        { id: "m_register", label: "Registered with the relevant redress scheme", kind: "manual" },
        { id: "m_complaints", label: "Complaints procedure reviewed", kind: "manual" },
      ],
    },
  ]

  function isDone(item: ChecklistItem): boolean {
    return item.kind === "auto" ? !!AUTO_DONE[item.id] : !!manualDone[item.id]
  }

  const allItems = CATEGORIES.flatMap((c) => c.items)
  const totalItems = allItems.length
  const totalCompleted = allItems.filter(isDone).length
  const readinessPct = totalItems === 0 ? 0 : Math.round((totalCompleted / totalItems) * 100)
  const atRisk = CATEGORIES.filter((c) => c.items.some((i) => !isDone(i))).length
  const urgentActions = allItems.filter((i) => !isDone(i)).length

  function toggleManual(id: string) {
    setManualDone((prev) => ({ ...prev, [id]: !prev[id] }))
  }
  function toggleCat(id: string) {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  function exportChecklistCsv() {
    const headers = ["Category", "Item", "Type", "Status"]
    const rows = CATEGORIES.flatMap((c) =>
      c.items.map((i) => [c.name, i.label, i.kind === "auto" ? "Auto (live)" : "Manual", isDone(i) ? "Done" : "Pending"])
    )
    const csv = [headers, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rra-2026-readiness-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
            <Scale className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-900">RRA 2026 Readiness</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              A readiness checklist computed from your live tenancies, properties and possession cases.
            </p>
          </div>
        </div>
        <button
          onClick={exportChecklistCsv}
          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export Checklist (CSV)
        </button>
      </div>

      {/* Major-change banner */}
      <div className="mx-6 mt-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl px-5 py-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-white shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-white">No-fault eviction has been abolished under the Renters&apos; Rights Act 2026.</p>
          <p className="text-[12px] text-blue-100 mt-0.5 leading-relaxed">
            Assured tenancies are periodic and possession is via Section 8 grounds only. The items below reference these
            changes — confirm specifics with a qualified solicitor.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mx-6 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-800 leading-relaxed flex-1">
          <strong>Legal advice disclaimer: </strong>
          Propvora does not provide legal advice and rules may change. This checklist is a readiness aid, not legal truth.
          Seek independent advice from a qualified solicitor regarding your obligations.
        </p>
      </div>

      {/* KPI Row */}
      <div className="px-6 pt-4 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{readinessPct}%</p>
              <p className="text-[12px] font-medium text-slate-700">Overall Readiness</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">{totalCompleted} of {totalItems} items complete</p>
        </div>

        <Kpi icon={CheckCircle} iconCls="bg-emerald-100 text-emerald-600" value={totalCompleted} label="Completed" sub="On track" subCls="text-emerald-600" />
        <Kpi icon={Shield} iconCls="bg-amber-100 text-amber-600" value={atRisk} label="Categories At Risk" sub="Needs attention" subCls="text-amber-600" />
        <Kpi icon={Clock} iconCls="bg-red-100 text-red-600" value={urgentActions} label="Open Actions" sub="To complete" subCls="text-red-600" />
      </div>

      {/* Main two-column */}
      <div className="px-6 pt-4 pb-6 grid grid-cols-12 gap-4">
        {/* Checklist */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[13px] font-semibold text-slate-800">RRA 2026 Readiness Checklist</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded-full">
                  {totalCompleted} of {totalItems}
                </span>
              </div>
              <button
                onClick={() => setExpanded(expanded.length ? [] : CATEGORIES.map((c) => c.id))}
                className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
              >
                {expanded.length ? "Collapse all" : "Expand all"}
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {CATEGORIES.map((cat) => {
                const done = cat.items.filter(isDone).length
                const pct = Math.round((done / cat.items.length) * 100)
                const isOpen = expanded.includes(cat.id)
                return (
                  <div key={cat.id}>
                    <button onClick={() => toggleCat(cat.id)} className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left">
                      <span className="text-[13px] font-semibold text-slate-800 flex-1">{cat.name}</span>
                      <span className="text-[11px] text-slate-500">{done} of {cat.items.length}</span>
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-[11px] font-semibold w-8 text-right ${pct >= 80 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-red-700"}`}>{pct}%</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-50 bg-slate-50/30">
                        {cat.items.map((item) => {
                          const itemDone = isDone(item)
                          const clickable = item.kind === "manual"
                          return (
                            <div
                              key={item.id}
                              onClick={() => clickable && toggleManual(item.id)}
                              className={`flex items-center gap-3 px-8 py-2.5 transition-colors ${clickable ? "hover:bg-slate-50 cursor-pointer" : ""}`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${itemDone ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"}`}>
                                {itemDone && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-[12px] flex-1 ${itemDone ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.label}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${item.kind === "auto" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                                {item.kind === "auto" ? "Live" : "Manual"}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${itemDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                {itemDone ? "Done" : "Pending"}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right rail — live signals */}
        <div className="col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-800">Tenancy Status (live)</h3>
            </div>
            <div className="p-4">
              {loadingTen ? (
                <p className="text-[12px] text-slate-400">Loading…</p>
              ) : ten.total === 0 ? (
                <p className="text-[12px] text-slate-400">No tenancies recorded yet.</p>
              ) : (
                <div className="space-y-2 mb-3">
                  <Row label="Total tenancies" value={ten.total} />
                  <Row label="Periodic" value={ten.periodic} cls="bg-emerald-100 text-emerald-700" />
                  <Row label="Fixed / AST remaining" value={ten.fixed} cls={ten.fixed > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"} />
                  <Row label="Active" value={ten.active} cls="bg-blue-100 text-blue-700" />
                </div>
              )}
              <Link href="/app/portfolio/tenancies" className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors">
                Review Tenancies <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                <Gavel className="w-3.5 h-3.5 text-red-600" />
              </div>
              <h3 className="text-[13px] font-semibold text-slate-800">Possession (live)</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2 mb-3">
                <Row label="Active cases" value={activeCases} />
                <Row label="Notices served" value={noticesServed} />
              </div>
              <Link href="/app/legal/possession" className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors">
                View Cases <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <h3 className="text-[13px] font-semibold text-slate-800">EPC Coverage (live)</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2 mb-3">
                <Row label="Properties" value={properties.length} />
                <Row label="With EPC on record" value={epcCoveredPropertyIds.size} cls={epcCoverageOk ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"} />
              </div>
              <Link href="/app/legal/epc-advisory" className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors">
                Open EPC Advisory <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Kpi({ icon: Icon, iconCls, value, label, sub, subCls }: { icon: React.ElementType; iconCls: string; value: number; label: string; sub: string; subCls: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconCls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-[12px] font-medium text-slate-700">{label}</p>
        <p className={`text-[11px] ${subCls}`}>{sub}</p>
      </div>
    </div>
  )
}

function Row({ label, value, cls }: { label: string; value: number; cls?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-slate-600">{label}</span>
      {cls ? (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>{value}</span>
      ) : (
        <span className="text-[12px] font-semibold text-slate-800">{value}</span>
      )}
    </div>
  )
}
