"use client"
import React, { useMemo } from "react"
import Link from "next/link"
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  Download,
  Target,
  Building2,
  Clock,
} from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { LegalJurisdictionGate } from "@/components/legal/LegalJurisdictionGate"
import {
  useEpcCertificates,
  computeEpcReadiness,
  daysUntil,
  formatDate,
  type EpcCertificate,
} from "../legal-data"

function exportEpcCsv(
  rows: { property: string; status: string; reference: string; issue: string; expiry: string; days: string }[]
) {
  const headers = ["Property", "EPC status", "Reference", "Issue date", "Expiry date", "Days to expiry"]
  const csv = [headers, ...rows.map((r) => [r.property, r.status, r.reference, r.issue, r.expiry, r.days])]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `epc-readiness-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function EpcAdvisoryPage() {
  return (
    <LegalJurisdictionGate module="epc">
      <EpcAdvisoryPageInner />
    </LegalJurisdictionGate>
  )
}

function EpcAdvisoryPageInner() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { data: properties = [], isLoading: loadingProps } = useProperties(workspaceId)
  const { data: certs = [], isLoading: loadingCerts } = useEpcCertificates(workspaceId)

  const isLoading = loadingProps || loadingCerts
  const propertyIds = properties.map((p) => p.id)
  const readiness = useMemo(() => computeEpcReadiness(propertyIds, certs), [propertyIds, certs])

  const certByProperty = useMemo(() => {
    const m = new Map<string, EpcCertificate>()
    for (const c of certs) if (c.property_id) m.set(c.property_id, c)
    return m
  }, [certs])

  // Rows: properties needing attention (no EPC cert, expired, or expiring ≤ 90d)
  const attentionRows = useMemo(() => {
    return properties
      .map((p) => {
        const cert = certByProperty.get(p.id)
        const days = cert ? daysUntil(cert.expiry_date) : null
        let status: "missing" | "expired" | "expiring" | "valid"
        if (!cert) status = "missing"
        else if (days != null && days < 0) status = "expired"
        else if (days != null && days <= 90) status = "expiring"
        else status = "valid"
        return { p, cert, days, status }
      })
      .filter((r) => r.status !== "valid")
      .sort((a, b) => {
        const order = { missing: 0, expired: 1, expiring: 2, valid: 3 }
        return order[a.status] - order[b.status]
      })
  }, [properties, certByProperty])

  const csvRows = attentionRows.map((r) => ({
    property: r.p.name || "Unnamed property",
    status: r.status,
    reference: r.cert?.reference_number ?? "",
    issue: r.cert ? formatDate(r.cert.issue_date) : "",
    expiry: r.cert ? formatDate(r.cert.expiry_date) : "",
    days: r.days != null ? String(r.days) : "",
  }))

  const STATUS_BADGE: Record<string, string> = {
    missing: "bg-red-100 text-red-700 border border-red-200",
    expired: "bg-red-100 text-red-700 border border-red-200",
    expiring: "bg-amber-100 text-amber-700 border border-amber-200",
    valid: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  }
  const STATUS_LABEL: Record<string, string> = {
    missing: "No EPC on record",
    expired: "EPC expired",
    expiring: "Expiring soon",
    valid: "Valid",
  }

  const KPIS = [
    { value: readiness.validCert, label: "Properties with valid EPC", sub: `${readiness.totalProperties} total`, iconCls: "bg-emerald-100 text-emerald-600" },
    { value: readiness.expiringCert, label: "EPC expiring ≤ 90 days", sub: "Renewal due soon", iconCls: "bg-amber-100 text-amber-600" },
    { value: readiness.expiredCert, label: "EPC expired", sub: "Action required", iconCls: "bg-orange-100 text-orange-600" },
    { value: readiness.missingCert, label: "No EPC on record", sub: "Coverage gap", iconCls: "bg-red-100 text-red-600" },
  ]

  /* Row → card mapping for the mobile attention list (presentation only). */
  type AttentionRow = (typeof attentionRows)[number]
  const epcCardMapping: MobileCardMapping<AttentionRow> = {
    getKey: (r) => r.p.id,
    title: (r) => r.p.name || "Unnamed property",
    subtitle: (r) => r.cert?.reference_number ?? "No EPC reference",
    badge: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap ${STATUS_BADGE[r.status]}`}>
        {STATUS_LABEL[r.status]}
      </span>
    ),
    fields: [
      { label: "Expiry", render: (r) => (r.cert ? formatDate(r.cert.expiry_date) : "—") },
      { label: "Days", render: (r) => (r.days == null ? "—" : r.days < 0 ? `${Math.abs(r.days)}d ago` : `${r.days}d`) },
    ],
    actions: (r) => (
      <Link href={`/property-manager/portfolio/properties/${r.p.id}`} className="text-[12px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-medium flex items-center gap-1">
        <Building2 className="w-3.5 h-3.5" /> Open
      </Link>
    ),
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-900">EPC Advisory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live EPC readiness across your portfolio, derived from your compliance certificate records.
            </p>
          </div>
        </div>
        <button
          onClick={() => exportEpcCsv(csvRows)}
          disabled={csvRows.length === 0}
          className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          Export Readiness (CSV)
        </button>
      </div>

      {/* Banner */}
      <div className="mx-4 sm:mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-800 leading-relaxed">
          EPC minimum-standard targets are a moving regulatory area. This view is a readiness aid based on your live EPC
          certificate coverage and validity — it is not legal or energy-assessment advice.
        </p>
      </div>

      {/* KPI Row */}
      <div className="px-4 sm:px-6 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(({ value, label, sub, iconCls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
              <Zap className="w-5 h-5" />
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
      <div className="px-4 sm:px-6 pt-4 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Attention list */}
        <div className="lg:col-span-8 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-slate-800">Properties Needing EPC Attention</h2>
              <span className="text-[11px] text-slate-400">{attentionRows.length} of {properties.length}</span>
            </div>
            {isLoading ? (
              <div className="p-10 text-center text-[12px] text-slate-400">Loading EPC readiness…</div>
            ) : properties.length === 0 ? (
              <EmptyState
                title="No properties yet"
                body="Add properties in Portfolio to see EPC readiness."
                href="/property-manager/portfolio/properties"
                cta="Go to Properties"
              />
            ) : attentionRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-[14px] font-semibold text-slate-700 mb-1">All properties have a valid EPC on record</p>
                <p className="text-[12px] text-slate-500">Nothing needs attention right now.</p>
              </div>
            ) : (
              <ResponsiveTable<AttentionRow> rows={attentionRows} mobile={epcCardMapping} className="p-3">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Property", "EPC Status", "Reference", "Expiry", "Days", "Action"].map((h) => (
                        <th key={h} className="text-left text-[11px] font-medium text-slate-500 px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attentionRows.map(({ p, cert, days, status }, i) => (
                      <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i === attentionRows.length - 1 ? "border-b-0" : ""}`}>
                        <td className="px-4 py-3 text-[12px] font-medium text-slate-800 max-w-[180px]">
                          <span className="block truncate">{p.name || "Unnamed property"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{cert?.reference_number ?? "—"}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">{cert ? formatDate(cert.expiry_date) : "—"}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">{days == null ? "—" : days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}</td>
                        <td className="px-4 py-3">
                          <Link href={`/property-manager/portfolio/properties/${p.id}`} className="text-[11px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </ResponsiveTable>
            )}
            {attentionRows.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100">
                <button
                  onClick={() => exportEpcCsv(csvRows)}
                  className="text-[11px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-medium flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download improvement / coverage list (CSV)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Readiness sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--brand)]" />
              <h3 className="text-[13px] font-semibold text-slate-800">EPC Readiness Score</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center mb-3">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 40 40" className="w-20 h-20 -rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#2563EB" strokeWidth="4"
                      strokeDasharray={`${(readiness.readinessPct / 100) * 100.53} ${100.53}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[18px] font-bold text-slate-900">{readiness.readinessPct}%</span>
                    <span className="text-[9px] text-slate-500">valid EPC</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <Legend dot="bg-emerald-500" text={`${readiness.validCert} properties with a valid EPC`} />
                <Legend dot="bg-amber-400" text={`${readiness.expiringCert} expiring within 90 days`} />
                <Legend dot="bg-red-500" text={`${readiness.expiredCert + readiness.missingCert} expired or missing`} />
              </div>
              <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                Improve readiness by capturing EPC certificates and renewing before expiry in Compliance.
              </p>
              <Link href="/property-manager/compliance" className="mt-2 inline-block text-[11px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-medium">
                Open Compliance →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">Improvement Planning</h3>
            </div>
            <div className="p-4">
              <p className="text-[12px] text-slate-600 leading-relaxed mb-2">
                Capture EPC improvement plans on each property record (e.g. insulation, heating upgrades) so they feed
                your readiness over time.
              </p>
              <Link href="/property-manager/portfolio/properties" className="text-[11px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-medium">
                Open property improvement plans →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Legend({ dot, text }: { dot: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-slate-700">{text}</span>
    </div>
  )
}

function EmptyState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Building2 className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-[14px] font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-[12px] text-slate-500 mb-4">{body}</p>
      <Link href={href} className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] text-xs font-medium px-4 py-2 rounded-lg transition-colors">
        {cta}
      </Link>
    </div>
  )
}
