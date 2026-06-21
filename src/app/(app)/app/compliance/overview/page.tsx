"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  CalendarDays,
  Clock,
  BarChart3,
  Plus,
  Upload,
  ArrowUpRight,
  Flame,
  FileSearch,
  Sparkles,
} from "lucide-react"
import { openCopilot } from "@/lib/copilot/open"
import { ComplianceKpiCard } from "@/components/compliance/ComplianceKpiCard"
import { ComplianceStatusBadge } from "@/components/compliance/ComplianceStatusBadge"
import { createClient } from "@/lib/supabase/client"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import {
  useComplianceItems,
  fmtDate,
} from "../_lib/useComplianceItems"

/* ─── Cross-table live KPIs (certificates + inspections), 42P01-safe ───────── */
interface ExtraStats {
  certCount: number
  certExpiringSoon: number
  inspectionUpcoming: number
  inspectionOverdue: number
  loaded: boolean
}

function useExtraStats(workspaceId: string | undefined): ExtraStats {
  const [stats, setStats] = useState<ExtraStats>({
    certCount: 0,
    certExpiringSoon: 0,
    inspectionUpcoming: 0,
    inspectionOverdue: 0,
    loaded: false,
  })

  useEffect(() => {
    if (!workspaceId) return
    let active = true
    ;(async () => {
      try {
        const supabase = createClient()
        const today = new Date().toISOString().split("T")[0]
        const in30 = new Date(Date.now() + 30 * 86400_000).toISOString().split("T")[0]

        // Real tables: certificates live in compliance_items, inspections in property_inspections.
        const [certs, certExp, inspUp, inspOver] = await Promise.all([
          supabase.from("compliance_items").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null),
          supabase.from("compliance_items").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).gte("due_date", today).lte("due_date", in30),
          supabase.from("property_inspections").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).eq("status", "scheduled"),
          supabase.from("property_inspections").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("deleted_at", null).eq("status", "overdue"),
        ])

        if (!active) return
        const safe = (r: { count: number | null; error: { code?: string } | null }) =>
          r.error ? 0 : r.count ?? 0
        setStats({
          certCount: safe(certs),
          certExpiringSoon: safe(certExp),
          inspectionUpcoming: safe(inspUp),
          inspectionOverdue: safe(inspOver),
          loaded: true,
        })
      } catch {
        if (active) setStats((p) => ({ ...p, loaded: true }))
      }
    })()
    return () => {
      active = false
    }
  }, [workspaceId])

  return stats
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ComplianceOverviewPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { items, loading, workspaceId } = useComplianceItems()
  const extra = useExtraStats(workspaceId)
  const { data: properties = [] } = useProperties(workspace?.id)

  const propertyName = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of properties) m.set(p.id, p.name || p.address_line1 || "Property")
    return m
  }, [properties])

  /* ── Derived KPIs from live compliance_items ──────────────────────────── */
  const stats = useMemo(() => {
    const total = items.length
    const expiring = items.filter((i) => i.derivedStatus === "expiring_soon").length
    const expired = items.filter((i) => i.derivedStatus === "expired").length
    const missing = items.filter((i) => i.derivedStatus === "missing").length
    const compliant = items.filter((i) => i.derivedStatus === "valid").length

    // Property risk: any property with an expired/missing item is "at risk".
    const propsWithItems = new Set(items.map((i) => i.property_id).filter(Boolean) as string[])
    const atRiskProps = new Set(
      items
        .filter((i) => i.derivedStatus === "expired" || i.derivedStatus === "missing")
        .map((i) => i.property_id)
        .filter(Boolean) as string[]
    )
    return {
      total,
      expiring,
      expired,
      missing,
      compliant,
      trackedProperties: propsWithItems.size,
      atRiskProperties: atRiskProps.size,
    }
  }, [items])

  const expiringList = useMemo(
    () =>
      items
        .filter((i) => i.derivedStatus === "expiring_soon")
        .sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0))
        .slice(0, 6),
    [items]
  )

  const overdueList = useMemo(
    () =>
      items
        .filter((i) => i.derivedStatus === "expired")
        .sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0))
        .slice(0, 6),
    [items]
  )

  // Coverage gaps by requirement type derived from live items.
  const coverageGaps = useMemo(() => {
    const byType = new Map<string, { total: number; ok: number; label: string }>()
    for (const i of items) {
      const key = i.type ?? "other"
      const e = byType.get(key) ?? { total: 0, ok: 0, label: i.typeLabel }
      e.total += 1
      if (i.derivedStatus === "valid") e.ok += 1
      byType.set(key, e)
    }
    return [...byType.values()]
      .map((e) => ({
        label: e.label,
        affected: e.total - e.ok,
        coverage: e.total ? Math.round((e.ok / e.total) * 100) : 0,
      }))
      .filter((g) => g.affected > 0)
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, 6)
  }, [items])

  const healthScore = useMemo(() => {
    if (!stats.total) return null
    return Math.round((stats.compliant / stats.total) * 100)
  }, [stats])

  const propLabel = (id: string | null) =>
    (id && propertyName.get(id)) || "Unassigned property"

  const hasData = stats.total > 0 || extra.certCount > 0

  return (
    <>
      {/* Section-level actions toolbar (title lives in the section layout above the tabs) */}
      <div className="px-6 pt-4 pb-1 flex items-center justify-end">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push("/property-manager/compliance/certificates/new")}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add certificate
          </button>
          <button
            onClick={() => router.push("/property-manager/compliance/inspections/new")}
            className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Schedule inspection
          </button>
          <button
            onClick={() => router.push("/property-manager/compliance/documents/new")}
            className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload document
          </button>
          <button
            onClick={() => openCopilot({
              prompt: "What compliance items need my attention? Summarise overdue, expiring soon, and any coverage gaps.",
              sectionContext: {
                section: "compliance",
                pageTitle: "Compliance Overview",
                summaryData: {
                  totalItems: stats.total,
                  overdueCount: stats.expired,
                  expiringSoon: stats.expiring,
                  missingCount: stats.missing,
                  compliantCount: stats.compliant,
                  healthPct: healthScore ?? 0,
                  trackedProperties: stats.trackedProperties,
                  atRiskProperties: stats.atRiskProperties,
                  certificatesTracked: extra.certCount,
                  certificatesExpiringSoon: extra.certExpiringSoon,
                  inspectionsScheduled: extra.inspectionUpcoming,
                  inspectionsOverdue: extra.inspectionOverdue,
                },
              },
            })}
            className="inline-flex items-center gap-1.5 border border-violet-200 bg-violet-50 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI
          </button>
          <ActionMenu
            items={[
              { label: "Open Certificates", icon: ShieldCheck, onClick: () => router.push("/property-manager/compliance/certificates") },
              { label: "Open Inspections", icon: CalendarDays, onClick: () => router.push("/property-manager/compliance/inspections") },
              { label: "Open Coverage", icon: Building2, onClick: () => router.push("/property-manager/compliance/coverage") },
              { label: "Open Reports", icon: BarChart3, onClick: () => router.push("/property-manager/compliance/reports") },
            ]}
          />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 px-4 sm:px-6 py-4">
        <ComplianceKpiCard
          label="Compliance Items"
          value={loading ? "—" : String(stats.total)}
          subtitle={stats.total === 0 && !loading ? "No items tracked yet" : "Live records"}
          trend={loading ? "" : stats.total === 0 ? "Add your first item" : `${stats.compliant} compliant`}
          trendPositive={stats.total > 0}
          icon={ShieldCheck}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <ComplianceKpiCard
          label="Properties Tracked"
          value={loading ? "—" : String(stats.trackedProperties)}
          subtitle={stats.trackedProperties === 0 && !loading ? "Link items to properties" : "With compliance items"}
          trend={loading ? "" : stats.trackedProperties === 0 ? "None linked yet" : `${stats.trackedProperties} properties`}
          trendPositive={stats.trackedProperties > 0}
          icon={Building2}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <ComplianceKpiCard
          label="Properties At Risk"
          value={loading ? "—" : String(stats.atRiskProperties)}
          subtitle={stats.atRiskProperties === 0 && !loading ? "No at-risk properties" : "Expired or missing items"}
          trend={loading ? "" : stats.atRiskProperties === 0 ? "All clear" : `${stats.atRiskProperties} need attention`}
          trendPositive={stats.atRiskProperties === 0}
          icon={AlertTriangle}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <ComplianceKpiCard
          label="Expiring Soon"
          value={loading ? "—" : String(stats.expiring)}
          subtitle="Within 30 days"
          trend={loading ? "" : stats.expiring === 0 ? "Nothing expiring soon" : `${stats.expiring} items`}
          trendPositive={stats.expiring === 0}
          icon={CalendarDays}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
        <ComplianceKpiCard
          label="Overdue / Expired"
          value={loading ? "—" : String(stats.expired)}
          subtitle={stats.expired === 0 && !loading ? "All up to date" : "Require immediate action"}
          trend={loading ? "" : stats.expired === 0 ? "No overdue items" : `${stats.expired} overdue`}
          trendPositive={stats.expired === 0}
          icon={Clock}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
        <ComplianceKpiCard
          label="Records Coverage"
          value={loading ? "—" : healthScore == null ? "—" : `${healthScore}%`}
          subtitle="Valid vs total tracked items"
          trend={loading ? "" : healthScore == null ? "No data yet" : healthScore >= 80 ? "Good coverage" : "Review needed"}
          trendPositive={healthScore != null && healthScore >= 80}
          icon={BarChart3}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
      </div>

      {!loading && !hasData ? (
        /* Honest empty state */
        <div className="px-6 pb-10">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No compliance data yet</h2>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
              Add your first certificate or schedule an inspection to start tracking compliance across your portfolio.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/property-manager/compliance/certificates/new")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add certificate
              </button>
              <button
                onClick={() => router.push("/property-manager/compliance/inspections/new")}
                className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                Schedule inspection
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Main content */
        <div className="px-4 sm:px-6 pb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Expiring items */}
          <div className="md:col-span-4 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Expiring soon</h2>
              <a href="/property-manager/compliance/coverage" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                View coverage <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            {expiringList.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">Nothing expiring in the next 30 days.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {expiringList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push("/property-manager/compliance/coverage")}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-amber-50">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 leading-tight truncate">{item.title || item.typeLabel}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{propLabel(item.property_id)}</p>
                      <p className="text-[11px] text-slate-400">{fmtDate(item.due_date)}</p>
                    </div>
                    <span className="text-xs font-semibold shrink-0 text-amber-600">
                      {item.daysUntilDue != null ? `${item.daysUntilDue}d` : "—"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Overdue items */}
          <div className="md:col-span-4 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Overdue & expired</h2>
              <a href="/property-manager/compliance/coverage" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                View all <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            {overdueList.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">No overdue items. Great work.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {overdueList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push("/property-manager/compliance/coverage")}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{item.title || item.typeLabel}</p>
                      <p className="text-[11px] text-slate-400 truncate">{propLabel(item.property_id)}</p>
                    </div>
                    <span className="text-xs font-semibold text-red-600 shrink-0">
                      {item.daysUntilDue != null ? `${Math.abs(item.daysUntilDue)} days overdue` : "Overdue"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status breakdown */}
          <div className="md:col-span-4 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Live status mix</h2>
            </div>
            <div className="px-4 py-3 space-y-3">
              {[
                { label: "valid", count: stats.compliant },
                { label: "expiring_soon", count: stats.expiring },
                { label: "expired", count: stats.expired },
                { label: "missing", count: stats.missing },
              ].map((s) => {
                const pct = stats.total ? Math.round((s.count / stats.total) * 100) : 0
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-28 shrink-0"><ComplianceStatusBadge status={s.label} /></div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          s.label === "valid" ? "bg-emerald-400" : s.label === "expiring_soon" ? "bg-amber-400" : "bg-red-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-12 text-right">{s.count}</span>
                  </div>
                )
              })}
              <div className="pt-2 mt-1 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[11px] text-slate-400">Certificates</p>
                  <p className="text-sm font-bold text-slate-800">{extra.loaded ? extra.certCount : "—"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[11px] text-slate-400">Inspections due</p>
                  <p className="text-sm font-bold text-slate-800">{extra.loaded ? extra.inspectionUpcoming : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coverage gaps */}
          <div className="md:col-span-7 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Coverage gaps by requirement</h2>
              <a href="/property-manager/compliance/coverage" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                View matrix <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            <div className="px-4 py-2">
              {coverageGaps.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No coverage gaps detected from your live items.</div>
              ) : (
                <>
                  <div className="flex items-center gap-2 py-2 border-b border-slate-100 mb-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex-1">Requirement</span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 text-center">Affected</span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-32 text-right">Coverage</span>
                  </div>
                  {coverageGaps.map((gap) => (
                    <div key={gap.label} className="flex items-center gap-2 py-2.5 border-b border-slate-50 last:border-0">
                      <span className="text-xs text-slate-700 flex-1 leading-tight">{gap.label}</span>
                      <span className="text-xs font-semibold text-slate-600 w-20 text-center">{gap.affected}</span>
                      <div className="w-32 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              gap.coverage >= 85 ? "bg-emerald-400" : gap.coverage >= 60 ? "bg-amber-400" : "bg-red-500"
                            }`}
                            style={{ width: `${gap.coverage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 w-8 text-right">{gap.coverage}%</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Recommended next actions (derived from real counts) */}
          <div className="md:col-span-5 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Recommended next actions</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                stats.expired > 0 && {
                  title: `Resolve ${stats.expired} overdue compliance item${stats.expired > 1 ? "s" : ""}`,
                  detail: "Avoid fines and enforcement",
                  href: "/property-manager/compliance/coverage",
                  btn: "Review",
                  priority: "High" as const,
                },
                stats.expiring > 0 && {
                  title: `Renew ${stats.expiring} item${stats.expiring > 1 ? "s" : ""} expiring soon`,
                  detail: "Due within 30 days",
                  href: "/property-manager/compliance/certificates/new",
                  btn: "Start",
                  priority: "High" as const,
                },
                extra.inspectionOverdue > 0 && {
                  title: `Address ${extra.inspectionOverdue} overdue inspection${extra.inspectionOverdue > 1 ? "s" : ""}`,
                  detail: "Schedule and complete",
                  href: "/property-manager/compliance/inspections",
                  btn: "Review",
                  priority: "Medium" as const,
                },
                {
                  title: "Generate a compliance report",
                  detail: "Portfolio compliance summary",
                  href: "/property-manager/compliance/reports",
                  btn: "Generate",
                  priority: "Low" as const,
                },
              ]
                .filter(Boolean)
                .slice(0, 5)
                .map((a, idx) => {
                  const action = a as { title: string; detail: string; href: string; btn: string; priority: "High" | "Medium" | "Low" }
                  return (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${action.priority === "High" ? "bg-red-50" : action.priority === "Medium" ? "bg-amber-50" : "bg-blue-50"}`}>
                        {action.priority === "High" ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        ) : action.btn === "Generate" ? (
                          <FileSearch className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 leading-tight truncate">{action.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{action.detail}</p>
                      </div>
                      <button
                        onClick={() => router.push(action.href)}
                        className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        {action.btn}
                      </button>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
