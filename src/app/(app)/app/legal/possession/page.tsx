"use client"
import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Scale,
  FileText,
  Gavel,
  CheckCircle,
  Download,
  Plus,
  Eye,
  Rocket,
  Shield,
  AlertTriangle,
  Building2,
  Trash2,
} from "lucide-react"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  usePossessionCases,
  useDeletePossessionCase,
  formatDate,
  daysUntil,
  type PossessionCase,
} from "../legal-data"

/* ─── Status config (configurable labels, not legal truth) ───────── */
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  gathering_evidence: { label: "Gathering Evidence", cls: "bg-blue-100 text-blue-700 border border-blue-200" },
  notice_draft:       { label: "Drafting Notice",    cls: "bg-slate-100 text-slate-700 border border-slate-200" },
  notice_served:      { label: "Notice Served",      cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  notice_expired:     { label: "Notice Expired",     cls: "bg-orange-100 text-orange-700 border border-orange-200" },
  court_applied:      { label: "Court Applied",      cls: "bg-red-100 text-red-700 border border-red-200" },
  hearing_scheduled:  { label: "Hearing Scheduled",  cls: "bg-purple-100 text-purple-700 border border-purple-200" },
  possession_granted: { label: "Possession Granted", cls: "bg-purple-100 text-purple-700 border border-purple-200" },
  warrant_issued:     { label: "Warrant Issued",     cls: "bg-red-100 text-red-700 border border-red-200" },
  resolved:           { label: "Resolved",           cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
}

const ACTIVE_STATUSES = new Set([
  "gathering_evidence", "notice_draft", "notice_served", "notice_expired",
  "court_applied", "hearing_scheduled", "warrant_issued",
])
const COURT_STATUSES = new Set(["court_applied", "hearing_scheduled"])

const WIZARD_STEPS = [
  "Select tenancy & confirm arrears",
  "Choose possession grounds",
  "Review evidence chain",
  "Generate Section 8 Notice (review-only draft)",
  "Record service & track progress",
]

function statusCfg(s: string) {
  return STATUS_CONFIG[s] ?? { label: s, cls: "bg-slate-100 text-slate-700 border border-slate-200" }
}

function caseTenantName(c: PossessionCase): string {
  return c.contact?.display_name ?? "Unnamed respondent"
}
function casePropertyName(c: PossessionCase): string {
  return c.property?.nickname ?? "—"
}
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}
function money(n: number | null | undefined): string {
  if (n == null) return "£0"
  return `£${Number(n).toLocaleString("en-GB")}`
}

/* ─── CSV export ─────────────────────────────────────────────── */
function exportCasesCsv(cases: PossessionCase[]) {
  const headers = ["Tenant", "Property", "Ground", "Arrears", "Arrears weeks", "Status", "Notice served", "Notice expiry"]
  const rows = cases.map((c) => [
    caseTenantName(c),
    casePropertyName(c),
    c.ground,
    money(c.arrears_amount),
    c.arrears_weeks != null ? String(c.arrears_weeks) : "",
    statusCfg(c.status).label,
    formatDate(c.notice_served_date),
    formatDate(c.notice_expiry_date),
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `possession-cases-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function PossessionPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { data: cases = [], isLoading } = usePossessionCases(workspaceId)
  const deleteCase = useDeletePossessionCase()

  const activeCount = cases.filter((c) => ACTIVE_STATUSES.has(c.status)).length
  const noticesServed = cases.filter((c) => !!c.notice_served_date).length
  const courtCount = cases.filter((c) => COURT_STATUSES.has(c.status)).length
  const resolvedCount = cases.filter((c) => c.status === "resolved").length
  const totalArrears = cases
    .filter((c) => ACTIVE_STATUSES.has(c.status))
    .reduce((s, c) => s + (c.arrears_amount ?? 0), 0)
  const attentionCount = cases.filter(
    (c) => c.status === "notice_expired" || (c.notice_expiry_date && (daysUntil(c.notice_expiry_date) ?? 99) < 0)
  ).length

  const KPIS = [
    { icon: Scale,       value: activeCount,    label: "Active Cases",        sub: "In progress",       iconCls: "bg-blue-100 text-blue-600" },
    { icon: FileText,    value: noticesServed,  label: "Notices Served",      sub: "All time",          iconCls: "bg-orange-100 text-orange-600" },
    { icon: Gavel,       value: courtCount,     label: "At Court",            sub: "Applied / scheduled", iconCls: "bg-red-100 text-red-600" },
    { icon: CheckCircle, value: resolvedCount,  label: "Resolved",            sub: "Across all grounds", iconCls: "bg-emerald-100 text-emerald-600" },
  ]

  /* Row → card mapping for the mobile case list (presentation only). */
  const caseCardMapping: MobileCardMapping<PossessionCase> = {
    getKey: (c) => c.id,
    title: (c) => caseTenantName(c),
    subtitle: (c) => casePropertyName(c),
    leading: (c) => (
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold bg-slate-100 text-slate-700 shrink-0">
        {initialsOf(caseTenantName(c))}
      </div>
    ),
    badge: (c) => {
      const cfg = statusCfg(c.status)
      return <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>
    },
    fields: [
      { label: "Ground", render: (c) => c.ground },
      { label: "Arrears", render: (c) => money(c.arrears_amount) },
      { label: "Notice", render: (c) => formatDate(c.notice_served_date) },
      { label: "Expiry", render: (c) => formatDate(c.notice_expiry_date) },
    ],
    onRowClick: (c) => router.push(`/property-manager/legal/possession/${c.id}`),
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-slate-900">Possession Cases</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage possession proceedings from case initiation to resolution with full evidence chain.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportCasesCsv(cases)}
            disabled={cases.length === 0}
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <Link
            href="/property-manager/legal/possession/new/select-tenancy"
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Case
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="px-4 sm:px-6 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(({ icon: Icon, value, label, sub, iconCls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-tight">{isLoading ? <span className="text-slate-300">…</span> : value}</p>
              <p className="text-[12px] font-medium text-slate-700 mt-0.5">{label}</p>
              <p className="text-[11px] text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="px-4 sm:px-6 pb-4 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cases Table */}
        <div className="lg:col-span-8 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {attentionCount > 0 && (
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[12px] font-medium text-amber-800">
                  {attentionCount} case{attentionCount === 1 ? "" : "s"} need attention (notice expired)
                </span>
              </div>
            )}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-slate-800">Possession Cases</h2>
              <span className="text-[11px] text-slate-400">{cases.length} case{cases.length === 1 ? "" : "s"}</span>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-[12px] text-slate-400">Loading cases…</div>
            ) : cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Gavel className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-[14px] font-semibold text-slate-700 mb-1">No possession cases yet</p>
                <p className="text-[12px] text-slate-500 max-w-xs mb-4">
                  Start a possession case from a live tenancy. Propvora builds the evidence chain and a review-only Section 8 draft as you go.
                </p>
                <Link
                  href="/property-manager/legal/possession/new/select-tenancy"
                  className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Start First Case
                </Link>
              </div>
            ) : (
              <ResponsiveTable<PossessionCase>
                rows={cases}
                mobile={caseCardMapping}
                className="p-3"
              >
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Respondent", "Property", "Ground", "Arrears", "Status / Stage", "Notice Date", "Expiry", "Actions"].map((h) => (
                        <th key={h} className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c, i) => {
                      const cfg = statusCfg(c.status)
                      const tenant = caseTenantName(c)
                      return (
                        <tr
                          key={c.id}
                          onClick={() => router.push(`/property-manager/legal/possession/${c.id}`)}
                          className={`border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${i === cases.length - 1 ? "border-b-0" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-slate-100 text-slate-700">
                                {initialsOf(tenant)}
                              </div>
                              <span className="text-[12px] font-medium text-slate-800 whitespace-nowrap">{tenant}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-600 max-w-[150px]">
                            <span className="block truncate">{casePropertyName(c)}</span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-600 whitespace-nowrap max-w-[120px] truncate">{c.ground}</td>
                          <td className="px-4 py-3 text-[12px] font-semibold text-slate-800">{money(c.arrears_amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{formatDate(c.notice_served_date)}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{formatDate(c.notice_expiry_date)}</td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/property-manager/legal/possession/${c.id}`}
                                className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </Link>
                              <ConfirmDialog
                                title="Delete case?"
                                description={`The possession case for ${tenant} will be permanently removed.`}
                                confirmLabel="Delete"
                                onConfirm={async () => {
                                  if (workspaceId) await deleteCase.mutateAsync({ id: c.id, workspaceId })
                                }}
                              >
                                {(open) => (
                                  <ActionMenu
                                    items={[
                                      { label: "View Case", icon: Eye, onClick: () => router.push(`/property-manager/legal/possession/${c.id}`) },
                                      { label: "Open Property", icon: Building2, onClick: () => router.push(c.property_id ? `/property-manager/portfolio/properties/${c.property_id}` : "/property-manager/portfolio/properties") },
                                      { label: "Delete Case", icon: Trash2, variant: "danger", onClick: open },
                                    ]}
                                  />
                                )}
                              </ConfirmDialog>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              </ResponsiveTable>
            )}
          </div>
        </div>

        {/* Right Rail */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: RRA 2026 */}
          <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-purple-100 bg-purple-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Scale className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <h3 className="text-[13px] font-semibold text-purple-900">Renters&apos; Rights Act 2026</h3>
                </div>
                <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-medium">
                  In effect
                </span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-slate-700 leading-relaxed mb-3">
                No-fault eviction was abolished. Possession claims must rely on valid Section 8 grounds, with the relevant
                notice period and arrears requirements applied.
              </p>
              <Link
                href="/property-manager/legal/rra-2026"
                className="text-[11px] text-purple-700 hover:text-purple-900 font-medium underline"
              >
                Open RRA 2026 readiness →
              </Link>
            </div>
          </div>

          {/* Card 2: Legal & Compliance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 className="text-[13px] font-semibold text-slate-800">Legal &amp; Compliance</h3>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Propvora does not provide legal advice and never auto-serves notices. Generated notices are review-only
                drafts. Seek independent advice from a qualified solicitor before taking possession proceedings.
              </p>
            </div>
          </div>

          {/* Card 3: Start a New Case */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Rocket className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-800">Start a New Case</h3>
                  <p className="text-[11px] text-slate-500">Guided wizard — 5 simple steps</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <ol className="space-y-2 mb-4">
                {WIZARD_STEPS.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-slate-600 leading-tight">{step}</span>
                  </li>
                ))}
              </ol>
              <Link
                href="/property-manager/legal/possession/new/select-tenancy"
                className="w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8] text-xs font-medium px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                Start Possession Wizard
              </Link>
            </div>
          </div>

          {/* Card 4: outstanding arrears (live) */}
          {cases.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Outstanding arrears</p>
              <p className="text-2xl font-bold text-slate-900">{money(totalArrears)}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across active cases</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
