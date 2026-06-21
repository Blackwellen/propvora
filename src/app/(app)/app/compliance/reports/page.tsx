"use client"

import React, { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Download,
  FileText,
  Calendar,
  AlertTriangle,
  BarChart2,
  Users,
  Flame,
  FileArchive,
  FolderOpen,
  RefreshCw,
} from "lucide-react"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { ComplianceKpiCard } from "@/components/compliance"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import {
  useComplianceCertificates,
  useComplianceInspections,
  useComplianceSupplierDocs,
} from "@/hooks/useComplianceData"
import { useComplianceItems, humaniseType, daysUntil, downloadCsv } from "../_lib/useComplianceItems"

export default function ComplianceReportsPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { items } = useComplianceItems()
  const { data: certs = [] } = useComplianceCertificates()
  const { data: inspections = [] } = useComplianceInspections()
  const { data: supplierDocs = [] } = useComplianceSupplierDocs()
  const { data: properties = [] } = useProperties(workspace?.id)

  const propName = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of properties) m.set(p.id, p.name || p.address_line1 || "Property")
    return m
  }, [properties])

  // ── Live report generators (real CSV via Blob) ────────────────────────────
  const reports = useMemo(() => {
    const overdueItems = items.filter((i) => i.derivedStatus === "expired")
    const expiringItems = items.filter((i) => i.derivedStatus === "expiring_soon")
    const expiringCerts = certs.filter((c) => {
      const d = daysUntil(c.expiry_date)
      return d != null && d >= 0 && d <= 90
    })

    return [
      {
        id: "overview",
        name: "Compliance Overview",
        description: "Executive summary of every live compliance item with status and due date.",
        icon: <BarChart2 className="w-7 h-7" />,
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        count: items.length,
        countLabel: "items",
        generate: () =>
          downloadCsv(
            "compliance-overview.csv",
            ["Title", "Type", "Property", "Status", "Due Date", "Days Until Due"],
            items.map((i) => [
              i.title ?? "",
              i.typeLabel,
              (i.property_id && propName.get(i.property_id)) ?? "",
              humaniseType(i.derivedStatus),
              i.due_date ?? "",
              i.daysUntilDue ?? "",
            ])
          ),
      },
      {
        id: "expiry",
        name: "Expiry Forecast",
        description: "Compliance items and certificates expiring in the next 90 days.",
        icon: <Calendar className="w-7 h-7" />,
        iconBg: "bg-teal-100",
        iconColor: "text-teal-600",
        count: expiringItems.length + expiringCerts.length,
        countLabel: "expiring",
        generate: () =>
          downloadCsv(
            "compliance-expiry-forecast.csv",
            ["Record", "Type", "Property", "Expiry / Due Date", "Days Remaining"],
            [
              ...expiringItems.map((i) => [
                i.title ?? i.typeLabel,
                "Compliance Item",
                (i.property_id && propName.get(i.property_id)) ?? "",
                i.due_date ?? "",
                i.daysUntilDue ?? "",
              ]),
              ...expiringCerts.map((c) => [
                humaniseType(c.certificate_type),
                "Certificate",
                c.property_name ?? "",
                c.expiry_date ?? "",
                daysUntil(c.expiry_date) ?? "",
              ]),
            ]
          ),
      },
      {
        id: "overdue",
        name: "Overdue & Risk Report",
        description: "All overdue and expired compliance items requiring immediate action.",
        icon: <Flame className="w-7 h-7" />,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        count: overdueItems.length,
        countLabel: "overdue",
        generate: () =>
          downloadCsv(
            "compliance-overdue-report.csv",
            ["Title", "Type", "Property", "Due Date", "Days Overdue"],
            overdueItems.map((i) => [
              i.title ?? i.typeLabel,
              i.typeLabel,
              (i.property_id && propName.get(i.property_id)) ?? "",
              i.due_date ?? "",
              i.daysUntilDue != null ? Math.abs(i.daysUntilDue) : "",
            ])
          ),
      },
      {
        id: "inspections",
        name: "Inspection Report",
        description: "Full inspection schedule with status, outcome and findings.",
        icon: <FileArchive className="w-7 h-7" />,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        count: inspections.length,
        countLabel: "inspections",
        generate: () =>
          downloadCsv(
            "compliance-inspections.csv",
            ["Type", "Property", "Scheduled", "Inspector", "Status", "Outcome", "Findings"],
            inspections.map((i) => [
              humaniseType(i.inspection_type),
              i.property_name ?? "",
              i.scheduled_date ?? "",
              i.inspector_name ?? "",
              i.status,
              i.outcome ?? "",
              i.findings_count ?? 0,
            ])
          ),
      },
      {
        id: "suppliers",
        name: "Supplier Compliance Report",
        description: "Supplier document validity, insurance and accreditation status.",
        icon: <Users className="w-7 h-7" />,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        count: supplierDocs.length,
        countLabel: "documents",
        generate: () =>
          downloadCsv(
            "supplier-compliance.csv",
            ["Supplier", "Document Type", "Reference", "Status", "Expiry Date"],
            supplierDocs.map((d) => [
              d.supplier_name ?? "",
              humaniseType(d.document_type),
              d.document_reference ?? "",
              d.status,
              d.expiry_date ?? "",
            ])
          ),
      },
      {
        id: "certificates",
        name: "Certificate Register",
        description: "Full certificate register with issue, expiry and risk levels.",
        icon: <FolderOpen className="w-7 h-7" />,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-700",
        count: certs.length,
        countLabel: "certificates",
        generate: () =>
          downloadCsv(
            "certificate-register.csv",
            ["Type", "Reference", "Property", "Issue Date", "Expiry Date", "Status", "Risk"],
            certs.map((c) => [
              humaniseType(c.certificate_type),
              c.reference_number ?? "",
              c.property_name ?? "",
              c.issue_date ?? "",
              c.expiry_date ?? "",
              c.status,
              c.risk_level,
            ])
          ),
      },
    ]
  }, [items, certs, inspections, supplierDocs, propName])

  const kpis = useMemo(() => {
    const overdue = items.filter((i) => i.derivedStatus === "expired").length
    const expiring = items.filter((i) => i.derivedStatus === "expiring_soon").length
    return {
      reports: reports.length,
      tracked: items.length + certs.length,
      overdue,
      expiring,
    }
  }, [reports, items, certs])

  return (
    <DashboardContainer>
      <PageHeader
        title="Compliance Reports"
        description="Generate and export live compliance reports from your portfolio data."
        actions={
          <>
            <button
              onClick={() => reports[0]?.generate()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export overview
            </button>
            <ActionMenu
              items={[
                { label: "Refresh", icon: RefreshCw, onClick: () => router.refresh() },
                { label: "Open Coverage", icon: BarChart2, onClick: () => router.push("/property-manager/compliance/coverage") },
                { label: "Open Activity", icon: FileText, onClick: () => router.push("/property-manager/compliance/activity") },
              ]}
            />
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 py-4">
        <ComplianceKpiCard label="Available reports" value={kpis.reports} subtitle="Live generators" icon={FileText} iconBg="bg-blue-100" iconColor="text-blue-600" />
        <ComplianceKpiCard label="Records tracked" value={kpis.tracked} subtitle="Items + certificates" icon={BarChart2} iconBg="bg-violet-100" iconColor="text-violet-600" />
        <ComplianceKpiCard label="Expiring soon" value={kpis.expiring} subtitle="Within 30 days" icon={Calendar} iconBg="bg-amber-100" iconColor="text-amber-600" />
        <ComplianceKpiCard label="Overdue" value={kpis.overdue} subtitle="Need attention" trendPositive={kpis.overdue === 0} icon={AlertTriangle} iconBg="bg-red-100" iconColor="text-red-600" />
      </div>

      {/* Report cards */}
      <div className="px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((card) => (
            <div key={card.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{card.name}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                <p className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{card.count}</span> {card.countLabel}
                </p>
                <button
                  onClick={card.generate}
                  disabled={card.count === 0}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                >
                  <Download className="w-3 h-3" />
                  Export CSV
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Reports are generated live from your current compliance data and exported as CSV. Scheduled email delivery can be configured in Settings → Notifications.
        </p>
      </div>
    </DashboardContainer>
  )
}
