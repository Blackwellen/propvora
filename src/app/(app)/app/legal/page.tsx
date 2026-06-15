"use client"
import React, { useMemo } from "react"
import Link from "next/link"
import { Scale, Key, Zap, Gavel, ArrowRight, AlertTriangle, Plus } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useTenancies } from "@/hooks/useTenancies"
import {
  usePossessionCases,
  useHmoLicences,
  useEpcCertificates,
  computeEpcReadiness,
  summariseTenancies,
  daysUntil,
} from "./legal-data"

export default function LegalOverviewPage() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { data: cases = [], isLoading: lc } = usePossessionCases(workspaceId)
  const { data: licences = [], isLoading: ll } = useHmoLicences(workspaceId)
  const { data: properties = [] } = useProperties(workspaceId)
  const { data: tenancies = [] } = useTenancies(workspaceId)
  const { data: epcCerts = [] } = useEpcCertificates(workspaceId)

  const isLoading = lc || ll

  const activeCases = cases.filter((c) => c.status !== "resolved").length
  const activeLicences = licences.filter((l) => {
    const d = daysUntil(l.expiry_date)
    return !(d != null && d < 0) && l.status === "active"
  }).length
  const expiringLicences = licences.filter((l) => {
    const d = daysUntil(l.expiry_date)
    return d != null && d >= 0 && d <= 90
  }).length

  const epc = useMemo(
    () => computeEpcReadiness(properties.map((p) => p.id), epcCerts),
    [properties, epcCerts]
  )
  const ten = useMemo(
    () => summariseTenancies(tenancies.map((t) => ({ tenancy_type: t.tenancy_type, status: t.status }))),
    [tenancies]
  )
  const rraSignals = [ten.total > 0, ten.fixed === 0 && ten.total > 0, properties.length > 0, epc.missingCert === 0 && properties.length > 0]
  const rraPct = Math.round((rraSignals.filter(Boolean).length / rraSignals.length) * 100)

  const CARDS = [
    {
      title: "Possession",
      href: "/app/legal/possession",
      icon: Gavel,
      iconCls: "bg-blue-100 text-blue-600",
      metric: activeCases,
      metricLabel: "active cases",
      sub: `${cases.length} total · ${cases.filter((c) => c.notice_served_date).length} notices served`,
    },
    {
      title: "HMO Licences",
      href: "/app/legal/hmo-licences",
      icon: Key,
      iconCls: "bg-green-100 text-green-600",
      metric: activeLicences,
      metricLabel: "active licences",
      sub: `${licences.length} total · ${expiringLicences} expiring ≤ 90 days`,
    },
    {
      title: "EPC Advisory",
      href: "/app/legal/epc-advisory",
      icon: Zap,
      iconCls: "bg-yellow-100 text-yellow-600",
      metric: `${epc.readinessPct}%`,
      metricLabel: "EPC readiness",
      sub: `${epc.validCert}/${epc.totalProperties} valid · ${epc.missingCert} missing`,
    },
    {
      title: "RRA 2026",
      href: "/app/legal/rra-2026",
      icon: Scale,
      iconCls: "bg-purple-100 text-purple-600",
      metric: `${rraPct}%`,
      metricLabel: "readiness",
      sub: `${ten.periodic} periodic · ${ten.fixed} fixed remaining`,
    },
  ]

  const expiringSoon = [...licences]
    .filter((l) => daysUntil(l.expiry_date) != null && (daysUntil(l.expiry_date) as number) <= 90)
    .sort((a, b) => (daysUntil(a.expiry_date) ?? 0) - (daysUntil(b.expiry_date) ?? 0))
    .slice(0, 4)

  return (
    <>
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <Scale className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-900">Legal &amp; Compliance Overview</h1>
            <p className="text-xs text-slate-500 mt-0.5">Possession, HMO licences and EPC / RRA readiness across your portfolio.</p>
          </div>
        </div>
        <Link
          href="/app/legal/possession/new/select-tenancy"
          className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Possession Case
        </Link>
      </div>

      <div className="px-4 sm:px-6 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.title} href={c.href} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.iconCls}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-slate-900 leading-tight">{isLoading ? "—" : c.metric}</p>
              <p className="text-[12px] font-medium text-slate-700 mt-0.5">{c.metricLabel}</p>
              <p className="text-[11px] text-slate-500 mt-1">{c.sub}</p>
              <p className="text-[12px] font-semibold text-slate-800 mt-3">{c.title}</p>
            </Link>
          )
        })}
      </div>

      <div className="px-4 sm:px-6 pt-4 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Upcoming licence expiries */}
        <div className="lg:col-span-8 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-slate-800">Upcoming Licence Expiries</h2>
              <Link href="/app/legal/hmo-licences" className="text-[11px] text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
            </div>
            {expiringSoon.length === 0 ? (
              <div className="py-12 text-center text-[12px] text-slate-400">No HMO licences expiring within 90 days.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expiringSoon.map((l) => {
                  const d = daysUntil(l.expiry_date) ?? 0
                  return (
                    <Link key={l.id} href={`/app/legal/hmo-licences/${l.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <Key className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-slate-800">{l.property?.nickname ?? "—"}</p>
                          <p className="text-[11px] text-slate-500">{l.licence_number ?? "—"}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold ${d < 0 ? "text-red-600" : d <= 30 ? "text-red-600" : "text-amber-600"}`}>
                        {d < 0 ? `${Math.abs(d)}d ago` : `${d} days`}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Legal safety */}
        <div className="lg:col-span-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-amber-800 mb-1">Legal safety</p>
              <p className="text-[12px] text-amber-700 leading-relaxed">
                Propvora does not provide legal advice and never auto-serves notices. Generated notices are review-only
                drafts. Verify deadlines and obtain independent legal advice before acting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
