"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Download,
  TrendingUp,
  AlertTriangle,
  Building2,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  RefreshCw,
  Plus,
} from "lucide-react"
import { ComplianceKpiCard } from "@/components/compliance"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useComplianceItems, humaniseType, downloadCsv, type ComplianceItemVM } from "../_lib/useComplianceItems"

/**
 * Coverage is a REAL computed matrix:
 *   rows    = live properties (useProperties)
 *   columns = distinct requirement `type`s observed across live compliance_items
 *   cell    = best status for that (property, requirement) from compliance_items:
 *               compliant (valid) > warning (expiring_soon/pending) > overdue (expired) > missing (no item)
 * No hardcoded percentages — everything derives from live data.
 */

type CellStatus = "compliant" | "warning" | "overdue" | "missing"

const STATUS_RANK: Record<CellStatus, number> = { compliant: 3, warning: 2, overdue: 1, missing: 0 }

function itemToCell(status: ComplianceItemVM["derivedStatus"]): CellStatus {
  if (status === "valid") return "compliant"
  if (status === "expiring_soon" || status === "pending") return "warning"
  if (status === "expired") return "overdue"
  return "missing"
}

function deriveCell(items: ComplianceItemVM[]): CellStatus {
  if (items.length === 0) return "missing"
  // Worst (most severe) status wins among the requirement's items.
  return items
    .map((it) => itemToCell(it.derivedStatus))
    .reduce((worst, s) => (STATUS_RANK[s] < STATUS_RANK[worst] ? s : worst), "compliant" as CellStatus)
}

function cellIcon(status: CellStatus) {
  if (status === "compliant") return <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
  if (status === "warning") return <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
  if (status === "overdue") return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
  return <span className="w-3.5 h-3.5 rounded-full border border-dashed border-slate-300 inline-block shrink-0" />
}

function overallChip(pct: number) {
  const cls = pct >= 85 ? "bg-emerald-100 text-emerald-700" : pct >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
  const label = pct >= 85 ? "Good" : pct >= 60 ? "Fair" : "Poor"
  return <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${cls}`}>{pct}% {label}</span>
}

export default function CoveragePage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { items, loading: itemsLoading } = useComplianceItems()
  const { data: properties = [], isLoading: propsLoading } = useProperties(workspace?.id)
  const [showPct, setShowPct] = useState(false)
  const [search, setSearch] = useState("")

  const loading = itemsLoading || propsLoading

  // Distinct requirement types (columns) from live items.
  const columns = useMemo(() => {
    const set = new Map<string, string>()
    for (const i of items) {
      const key = i.type ?? "other"
      if (!set.has(key)) set.set(key, i.typeLabel)
    }
    return [...set.entries()].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label))
  }, [items])

  // Index items by property + type.
  const byPropType = useMemo(() => {
    const m = new Map<string, ComplianceItemVM[]>()
    for (const i of items) {
      if (!i.property_id) continue
      const k = `${i.property_id}::${i.type ?? "other"}`
      const arr = m.get(k) ?? []
      arr.push(i)
      m.set(k, arr)
    }
    return m
  }, [items])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return properties
      .filter((p) => !q || (p.name || "").toLowerCase().includes(q) || (p.city || "").toLowerCase().includes(q))
      .map((p) => {
        const cells = columns.map((col) => {
          const list = byPropType.get(`${p.id}::${col.key}`) ?? []
          return { col: col.key, status: deriveCell(list) }
        })
        const required = cells.length
        const compliant = cells.filter((c) => c.status === "compliant").length
        const pct = required ? Math.round((compliant / required) * 100) : 0
        return {
          id: p.id,
          name: p.name || p.address_line1 || "Property",
          location: [p.city, p.postcode].filter(Boolean).join(", "),
          initials: (p.name || "P").slice(0, 2).toUpperCase(),
          cells,
          overallPct: pct,
        }
      })
  }, [properties, columns, byPropType, search])

  // KPIs derived from real cells.
  const kpis = useMemo(() => {
    let total = 0
    let compliant = 0
    let overdue = 0
    let warning = 0
    let missing = 0
    for (const r of rows) {
      for (const c of r.cells) {
        total += 1
        if (c.status === "compliant") compliant += 1
        else if (c.status === "overdue") overdue += 1
        else if (c.status === "warning") warning += 1
        else missing += 1
      }
    }
    const score = total ? Math.round((compliant / total) * 100) : 0
    const criticalProps = rows.filter((r) => r.overallPct < 60).length
    return { score, totalGaps: overdue + missing, overdue, warning, missing, criticalProps, upcoming: warning }
  }, [rows])

  // Column coverage footer.
  const colCoverage = useMemo(
    () =>
      columns.map((col) => {
        const cells = rows.map((r) => r.cells.find((c) => c.col === col.key)?.status ?? "missing")
        const compliant = cells.filter((s) => s === "compliant").length
        return rows.length ? Math.round((compliant / rows.length) * 100) : 0
      }),
    [columns, rows]
  )

  function exportMatrix() {
    const headers = ["Property", "Location", ...columns.map((c) => c.label), "Overall %"]
    const data = rows.map((r) => [
      r.name,
      r.location,
      ...r.cells.map((c) => c.status),
      `${r.overallPct}%`,
    ])
    downloadCsv("compliance-coverage-matrix.csv", headers, data)
  }

  const noProperties = !loading && properties.length === 0

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coverage</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live compliance coverage computed across your properties.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportMatrix} disabled={rows.length === 0 || columns.length === 0} className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
            <Download className="w-4 h-4" />
            Export matrix
          </button>
          <ActionMenu
            items={[
              { label: "Refresh", icon: RefreshCw, onClick: () => router.refresh() },
              { label: "Open Certificates", icon: CheckCircle, onClick: () => router.push("/app/compliance/certificates") },
              { label: "Open Reports", icon: Download, onClick: () => router.push("/app/compliance/reports") },
            ]}
          />
        </div>
      </div>

      <DashboardContainer>
        {noProperties ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No coverage data yet</h2>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
              Add your first property to compute compliance coverage across your portfolio.
            </p>
            <button onClick={() => router.push("/app/portfolio/properties/new")} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add your first property
            </button>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-6 gap-4 px-6 py-4">
              <ComplianceKpiCard label="Coverage Score" value={loading ? "—" : `${kpis.score}%`} subtitle={kpis.score >= 85 ? "Good" : kpis.score >= 60 ? "Fair" : "Needs work"} icon={TrendingUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
              <ComplianceKpiCard label="Total Gaps" value={loading ? "—" : kpis.totalGaps} subtitle={`${kpis.overdue} overdue`} icon={AlertTriangle} iconBg="bg-red-100" iconColor="text-red-600" />
              <ComplianceKpiCard label="Critical Properties" value={loading ? "—" : kpis.criticalProps} subtitle="Below 60% coverage" icon={Building2} iconBg="bg-red-100" iconColor="text-red-600" />
              <ComplianceKpiCard label="Missing Items" value={loading ? "—" : kpis.missing} subtitle="No record on file" icon={XCircle} iconBg="bg-amber-100" iconColor="text-amber-600" />
              <ComplianceKpiCard label="Overdue Requirements" value={loading ? "—" : kpis.overdue} subtitle="Require action" icon={Clock} iconBg="bg-red-100" iconColor="text-red-600" />
              <ComplianceKpiCard label="Expiring Soon" value={loading ? "—" : kpis.upcoming} subtitle="Warning state" icon={Calendar} iconBg="bg-blue-100" iconColor="text-blue-600" />
            </div>

            {/* Toolbar */}
            <div className="px-6 pb-4 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400 w-full"
                />
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setShowPct(!showPct)}
                className={`flex items-center gap-2 border rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${showPct ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <span className={`w-8 h-4 rounded-full relative transition-colors ${showPct ? "bg-blue-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${showPct ? "translate-x-4" : "translate-x-0.5"}`} />
                </span>
                Show status labels
              </button>
            </div>

            {/* Matrix */}
            <div className="px-6 pb-6">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="px-4 py-16 text-center text-sm text-slate-400">Computing coverage…</div>
                ) : columns.length === 0 ? (
                  <div className="px-4 py-16 text-center">
                    <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700">No compliance requirements tracked yet</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Add compliance items to your properties to populate the coverage matrix.</p>
                    <button onClick={() => router.push("/app/compliance/certificates/new")} className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700">
                      <Plus className="w-3.5 h-3.5" /> Add certificate
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap min-w-[200px] sticky left-0 bg-slate-50/60 z-10">
                            PROPERTY <span className="text-slate-400 font-normal">({rows.length})</span>
                          </th>
                          {columns.map((col, i) => (
                            <th key={col.key} className="px-3 py-3 text-center text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                              <div>{col.label}</div>
                              <div className="text-slate-400 font-normal mt-0.5">{colCoverage[i]}%</div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 whitespace-nowrap">OVERALL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {rows.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/40 transition-colors cursor-pointer" onClick={() => router.push(`/app/portfolio/properties/${row.id}`)}>
                            <td className="px-4 py-3 sticky left-0 bg-white z-10">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-blue-600">{row.initials}</div>
                                <div>
                                  <p className="font-medium text-slate-800 text-xs leading-snug">{row.name}</p>
                                  {row.location && <p className="text-[11px] text-slate-400">{row.location}</p>}
                                </div>
                              </div>
                            </td>
                            {row.cells.map((cell) => (
                              <td key={cell.col} className="px-3 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {cellIcon(cell.status)}
                                  {showPct && <span className="text-[10px] font-medium text-slate-500">{humaniseType(cell.status)}</span>}
                                </div>
                              </td>
                            ))}
                            <td className="px-4 py-3 text-center">{overallChip(row.overallPct)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200 bg-slate-50/80">
                          <td className="px-4 py-3 text-xs font-semibold text-slate-600 sticky left-0 bg-slate-50/80">COVERAGE</td>
                          {colCoverage.map((pct, i) => (
                            <td key={i} className="px-3 py-3 text-center">
                              <span className={`text-xs font-semibold ${pct >= 85 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>{pct}%</span>
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs font-semibold text-slate-600">{kpis.score}% avg</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Legend */}
              {columns.length > 0 && (
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Compliant</span>
                  <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Expiring / pending</span>
                  <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-500" /> Overdue / expired</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border border-dashed border-slate-300 inline-block" /> Missing</span>
                </div>
              )}
            </div>
          </>
        )}
      </DashboardContainer>
    </>
  )
}
