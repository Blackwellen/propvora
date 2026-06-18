import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Store, Wrench, MapPin, Shield, ShieldCheck, Timer, Activity, FileText,
  ChevronRight, Gauge, AlertTriangle, Building2,
} from "lucide-react"
import {
  AdminPageHeader, AdminKpiStrip, AdminSectionCard, AdminStatusChip, AdminBanner,
  AdminButtonLink, AdminTable, AdminAuditTrailPanel, type AdminKpi, type AdminTone,
  type AdminAuditEntry,
} from "@/components/admin/ui"
import { getSupplierDetail } from "@/lib/admin/pages/batch1"
import { listAudit } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }> }

function statusTone(status: string): AdminTone {
  if (status === "active" || status === "verified" || status === "published") return "emerald"
  if (status === "pending" || status === "submitted") return "amber"
  if (status === "draft") return "slate"
  if (status === "suspended" || status === "rejected") return "red"
  return "slate"
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const { id } = await params
  const s = await getSupplierDetail(id)
  if (!s) notFound()

  const audit = await listAudit({ workspaceId: id, limit: 12 })
  const name = s.businessName ?? s.workspaceName ?? "Supplier"

  const kpis: AdminKpi[] = [
    { label: "Status", value: <span className="capitalize">{s.status}</span>, icon: Gauge, tone: statusTone(s.status) },
    { label: "Services", value: s.services.length, icon: Wrench, tone: "blue" },
    { label: "Coverage areas", value: s.coverage.length, icon: MapPin, tone: "violet" },
    { label: "Response (h)", value: s.responseTimeHours ?? "—", icon: Timer, tone: "amber" },
    { label: "Experience (yr)", value: s.yearsExperience ?? "—", icon: Activity, tone: "sky" },
  ]

  const auditEntries: AdminAuditEntry[] = audit.map((e) => ({
    actor: e.actorName ?? e.actorEmail ?? "system",
    action: e.action,
    when: e.createdAt ? new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
  }))

  return (
    <div className="space-y-5">
      <AdminPageHeader
        breadcrumb={[{ label: "Suppliers", href: "/admin/suppliers" }, { label: name }]}
        icon={Store}
        title={`Supplier account — ${name}`}
        subtitle={`${s.baseLocation ?? "Location not set"} · ${s.trades.length ? s.trades.join(", ") : "No trades listed"}`}
        actions={
          <>
            <AdminButtonLink href={`/admin/supplier-verification?workspace=${s.workspaceId}`} icon={ShieldCheck} variant="primary">Verify</AdminButtonLink>
            <AdminButtonLink href={`/admin/workspaces/${s.workspaceId}`} icon={Building2}>Workspace</AdminButtonLink>
          </>
        }
      />

      {!s.insuranceVerified && (
        <AdminBanner tone="amber" icon={Shield} title="Insurance unverified.">
          This supplier has not had insurance documents verified. Review in the verification queue before promoting marketplace visibility.
        </AdminBanner>
      )}

      <AdminKpiStrip kpis={kpis} cols={5} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4 min-w-0">
          <AdminSectionCard title="Profile" icon={Store}>
            {s.bio && <p className="text-[13px] text-slate-600 mb-3">{s.bio}</p>}
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <Field label="Trades" value={s.trades.length ? s.trades.join(", ") : "—"} />
              <Field label="Base location" value={s.baseLocation ?? "—"} />
              <Field label="Service radius" value={s.serviceRadiusKm ? `${s.serviceRadiusKm} km` : "—"} />
              <Field label="Accepts emergency" value={s.acceptsEmergency ? "Yes" : "No"} />
              <Field label="Response time" value={s.responseTimeHours ? `${s.responseTimeHours} h` : "—"} />
              <Field label="Years experience" value={s.yearsExperience != null ? String(s.yearsExperience) : "—"} />
            </dl>
          </AdminSectionCard>

          <AdminSectionCard title="Services & pricing" icon={Wrench}>
            {s.services.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-2">No services listed.</p>
            ) : (
              <AdminTable head={[{ label: "Service" }, { label: "Category" }, { label: "Pricing" }, { label: "Status", align: "right" }]} minWidth={520}>
                {s.services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-[#FAFCFF]">
                    <td className="px-4 py-2.5 text-[13px] font-medium text-[#0B1B3F]">{svc.name}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-500">{svc.category ?? "—"}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-500">{svc.pricingModel.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2.5 text-right"><AdminStatusChip tone={svc.active ? "emerald" : "slate"} dot>{svc.active ? "Active" : "Inactive"}</AdminStatusChip></td>
                  </tr>
                ))}
              </AdminTable>
            )}
          </AdminSectionCard>

          <AdminSectionCard title="Coverage areas" icon={MapPin}>
            {s.coverage.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-2">No coverage areas defined.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {s.coverage.map((c) => (
                  <li key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E2EAF6] bg-[#FAFCFF] text-[12px] text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />{c.value ?? c.areaType}{c.radiusKm ? ` · ${c.radiusKm}km` : ""}
                  </li>
                ))}
              </ul>
            )}
          </AdminSectionCard>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <AdminSectionCard title="Verification & compliance" icon={ShieldCheck}>
            <ul className="space-y-2.5 text-[13px]">
              <Health label="Insurance verified" ok={s.insuranceVerified} />
              <Health label="Profile published" ok={s.status === "active" || s.status === "published" || s.status === "verified"} />
            </ul>
            <Link href={`/admin/supplier-verification?workspace=${s.workspaceId}`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
              Verification queue <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </AdminSectionCard>

          <AdminSectionCard title="Jobs & payouts" icon={FileText}>
            <p className="text-[13px] text-slate-500">Job history and payout records are surfaced on the marketplace transaction and payout monitors.</p>
            <div className="mt-3 flex flex-col gap-1.5">
              <Link href={`/admin/marketplace/transactions?supplier=${s.workspaceId}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">Transactions <ChevronRight className="w-3.5 h-3.5" /></Link>
              <Link href={`/admin/marketplace/payouts?supplier=${s.workspaceId}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">Payouts <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
          </AdminSectionCard>

          <AdminSectionCard title="Risk" icon={AlertTriangle}>
            <p className="text-[13px] text-slate-500">No high-severity risk flags for this supplier.</p>
            <Link href={`/admin/risk/${s.workspaceId}`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
              Risk profile <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </AdminSectionCard>
        </div>
      </div>

      <AdminAuditTrailPanel entries={auditEntries} viewAllHref="/admin/audit-log" />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-[#0B1B3F]">{value}</dd>
    </div>
  )
}
function Health({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <AdminStatusChip tone={ok ? "emerald" : "amber"} dot>{ok ? "Yes" : "Pending"}</AdminStatusChip>
    </li>
  )
}
