"use client"
import React, { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import {
  InlineEditField,
  InlineEditSelect,
  InlineEditDate,
} from "@/components/editing"
import { MobileTabs, type MobileTabItem } from "@/components/mobile"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  Key,
  ChevronLeft,
  Download,
  Building2,
  Trash2,
  AlertTriangle,
  Calendar,
  Clock,
} from "lucide-react"
import {
  useHmoLicence,
  useUpdateHmoLicence,
  useDeleteHmoLicence,
  formatDate,
  daysUntil,
  type HmoLicence,
} from "../../legal-data"

const TYPE_OPTIONS = [
  { value: "mandatory", label: "Mandatory" },
  { value: "additional", label: "Additional" },
  { value: "selective", label: "Selective" },
]
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "pending", label: "Pending" },
  { value: "revoked", label: "Revoked" },
]
const ARRANGEMENT_OPTIONS = [
  { value: "standard", label: "Standard (own portfolio)" },
  { value: "serviced_accommodation", label: "Serviced Accommodation" },
  { value: "rent_to_rent", label: "Rent-to-Rent" },
]

type CheckStatus = "pass" | "warn" | "unknown"
interface ComplianceCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

/** Review-only HMO / SA / R2R compliance checks from the licence record. */
function computeHmoChecks(lic: HmoLicence): ComplianceCheck[] {
  const checks: ComplianceCheck[] = []
  const days = daysUntil(lic.expiry_date)

  // Licence validity / expiry.
  if (days == null) {
    checks.push({ id: "expiry", label: "Licence validity", status: "unknown", detail: "No expiry date recorded." })
  } else if (days < 0) {
    checks.push({ id: "expiry", label: "Licence validity", status: "warn", detail: `Expired ${Math.abs(days)} days ago — renew with the council.` })
  } else if (days <= 90) {
    checks.push({ id: "expiry", label: "Licence validity", status: "warn", detail: `Expires in ${days} days — begin renewal.` })
  } else {
    checks.push({ id: "expiry", label: "Licence validity", status: "pass", detail: `Valid for ${days} more days.` })
  }

  // Occupancy vs max.
  if (lic.occupancy_current != null && lic.max_occupants != null) {
    if (lic.occupancy_current > lic.max_occupants) {
      checks.push({ id: "occupancy", label: "Occupancy", status: "warn", detail: `Over-occupied: ${lic.occupancy_current} in use vs ${lic.max_occupants} permitted.` })
    } else {
      checks.push({ id: "occupancy", label: "Occupancy", status: "pass", detail: `${lic.occupancy_current} of ${lic.max_occupants} permitted occupants.` })
    }
  } else {
    checks.push({ id: "occupancy", label: "Occupancy", status: "unknown", detail: "Record current occupancy to check against the permitted maximum." })
  }

  // SA-specific reminder.
  if (lic.arrangement_type === "serviced_accommodation") {
    checks.push({ id: "sa", label: "Serviced accommodation", status: "unknown", detail: "Confirm planning use class / 90-day limits with the local authority." })
  }

  // R2R head-agreement expiry.
  if (lic.arrangement_type === "rent_to_rent") {
    const r2rDays = daysUntil(lic.r2r_agreement_end)
    if (r2rDays == null) {
      checks.push({ id: "r2r", label: "Rent-to-Rent agreement", status: "unknown", detail: "Record the head-agreement end date to track exposure." })
    } else if (r2rDays < 0) {
      checks.push({ id: "r2r", label: "Rent-to-Rent agreement", status: "warn", detail: `Head agreement ended ${Math.abs(r2rDays)} days ago.` })
    } else if (r2rDays <= 120) {
      checks.push({ id: "r2r", label: "Rent-to-Rent agreement", status: "warn", detail: `Head agreement ends in ${r2rDays} days — plan renewal/exit.` })
    } else {
      checks.push({ id: "r2r", label: "Rent-to-Rent agreement", status: "pass", detail: `Head agreement runs for ${r2rDays} more days.` })
    }
  }

  return checks
}

function statusCls(s: string) {
  switch (s) {
    case "active": return "bg-green-100 text-green-700 border border-green-200"
    case "expired": return "bg-red-100 text-red-700 border border-red-200"
    case "pending": return "bg-blue-100 text-blue-700 border border-blue-200"
    default: return "bg-slate-100 text-slate-600 border border-slate-200"
  }
}

function conditionsToArray(c: unknown): string[] {
  if (Array.isArray(c)) return c.map((x) => String(x))
  return []
}

function downloadCertificate(lic: HmoLicence) {
  const blob = new Blob([JSON.stringify(lic, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `hmo-licence-${lic.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function HmoLicenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const licenceId = String(params?.licenceId ?? "")
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id

  const { data: lic, isLoading } = useHmoLicence(workspaceId, licenceId)
  const updateLicence = useUpdateHmoLicence()
  const deleteLicence = useDeleteHmoLicence()
  const [activeTab, setActiveTab] = useState<"Overview" | "Conditions">("Overview")

  async function save(field: string, raw: string) {
    if (!workspaceId || !lic) return
    let value: unknown = raw
    if (field === "max_occupants" || field === "max_households" || field === "occupancy_current")
      value = raw === "" ? null : Number(raw)
    await updateLicence.mutateAsync({ id: lic.id, workspaceId, payload: { [field]: value } as never })
  }

  // Workflow-safe status change on the licence source record.
  async function transitionStatus(next: string) {
    if (!lic) return
    if (next === lic.status) return
    if (!STATUS_OPTIONS.some((o) => o.value === next)) {
      throw new Error(`Unknown status: ${next}`)
    }
    await save("status", next)
  }

  if (isLoading) {
    return <div className="px-6 py-16 text-center text-[13px] text-slate-400">Loading licence…</div>
  }
  if (!lic) {
    return (
      <div className="px-6 py-16 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-[14px] font-semibold text-slate-700 mb-1">Licence not found</p>
        <Link href="/app/legal/hmo-licences" className="text-[12px] text-blue-600 hover:text-blue-800 font-medium mt-2">
          ← Back to HMO Licences
        </Link>
      </div>
    )
  }

  const property = lic.property?.nickname ?? "—"
  const effStatus = (() => {
    const d = daysUntil(lic.expiry_date)
    return d != null && d < 0 ? "expired" : lic.status
  })()
  const days = daysUntil(lic.expiry_date)
  const conditions = conditionsToArray(lic.conditions)

  const mobileTabItems: MobileTabItem[] = [
    { id: "Overview", label: "Overview" },
    { id: "Conditions", label: "Conditions", badge: conditions.length > 0 ? conditions.length : undefined },
  ]

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
          <Link href="/app/legal/hmo-licences" className="hover:text-slate-600 flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            HMO Licences
          </Link>
          <span>/</span>
          <span className="text-slate-600">{property}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-[16px] font-bold text-slate-900">{property}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusCls(effStatus)}`}>
                  {STATUS_OPTIONS.find((s) => s.value === effStatus)?.label ?? effStatus}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {lic.licence_number || "No licence number"} · {TYPE_OPTIONS.find((t) => t.value === lic.licence_type)?.label ?? lic.licence_type} · {lic.issuing_council ?? "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => downloadCertificate(lic)}
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Certificate
            </button>
            <ConfirmDialog
              title="Delete licence?"
              description="This HMO licence record will be removed."
              confirmLabel="Delete"
              onConfirm={async () => {
                if (workspaceId) {
                  await deleteLicence.mutateAsync({ id: lic.id, workspaceId })
                  router.push("/app/legal/hmo-licences")
                }
              }}
            >
              {(open) => (
                <ActionMenu
                  items={[
                    { label: "Open Property", icon: Building2, onClick: () => router.push(lic.property_id ? `/app/properties/${lic.property_id}` : "/app/properties") },
                    { label: "Download Certificate", icon: Download, onClick: () => downloadCertificate(lic) },
                    { label: "Delete Licence", icon: Trash2, variant: "danger", onClick: open },
                  ]}
                />
              )}
            </ConfirmDialog>
          </div>
        </div>
      </div>

      {/* Expiry banner */}
      {days != null && days <= 90 && (
        <div className={`mx-4 sm:mx-6 mt-4 rounded-xl px-5 py-3 flex items-start gap-3 border ${days < 0 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${days < 0 ? "text-red-600" : "text-amber-600"}`} />
          <p className={`text-[12px] leading-relaxed ${days < 0 ? "text-red-800" : "text-amber-800"}`}>
            {days < 0
              ? `This licence expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago. Renew with the issuing council.`
              : `This licence expires in ${days} day${days === 1 ? "" : "s"} (${formatDate(lic.expiry_date)}). Begin the renewal process.`}
          </p>
        </div>
      )}

      {/* Tabs — desktop strip hidden on phones; MobileTabs takes over */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 mt-4">
        <div className="hidden md:flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {(["Overview", "Conditions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-all ${
                activeTab === tab ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
              {tab === "Conditions" && conditions.length > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{conditions.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="md:hidden py-2">
          <MobileTabs
            tabs={mobileTabItems}
            value={activeTab}
            onChange={(id) => setActiveTab(id as "Overview" | "Conditions")}
            aria-label="Licence sections"
          />
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6">
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 min-w-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h2 className="text-[13px] font-semibold text-slate-800">Licence Details</h2>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <Field label="Property"><span className="text-[13px] font-medium text-slate-800">{property}</span></Field>
                  <Field label="Licence Type">
                    <InlineEditSelect value={lic.licence_type} label="Licence type" options={TYPE_OPTIONS} onSave={(v) => save("licence_type", v)} />
                  </Field>
                  <Field label="Licence Number">
                    <InlineEditField value={lic.licence_number ?? ""} label="Licence number" placeholder="—" onSave={(v) => save("licence_number", v)} />
                  </Field>
                  <Field label="Issuing Council">
                    <InlineEditField value={lic.issuing_council ?? ""} label="Issuing council" placeholder="—" onSave={(v) => save("issuing_council", v)} />
                  </Field>
                  <Field label="Max Occupants">
                    <InlineEditField value={lic.max_occupants} type="number" label="Max occupants" placeholder="—" onSave={(v) => save("max_occupants", v)} />
                  </Field>
                  <Field label="Max Households">
                    <InlineEditField value={lic.max_households} type="number" label="Max households" placeholder="—" onSave={(v) => save("max_households", v)} />
                  </Field>
                  <Field label="Issue Date">
                    <InlineEditDate value={lic.issue_date ?? ""} label="Issue date" placeholder="—" onSave={(v) => save("issue_date", v)} />
                  </Field>
                  <Field label="Expiry Date">
                    <InlineEditDate value={lic.expiry_date} label="Expiry date" onSave={(v) => save("expiry_date", v)} />
                  </Field>
                  <Field label="Status">
                    <InlineEditSelect value={lic.status} label="Status" options={STATUS_OPTIONS} transition={transitionStatus} onSave={(v) => save("status", v)} />
                  </Field>
                  <Field label="Days Remaining">
                    <span className="text-[13px] font-medium text-slate-800">
                      {days == null ? "—" : days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days} days`}
                    </span>
                  </Field>
                  <Field label="Arrangement">
                    <InlineEditSelect value={lic.arrangement_type} label="Arrangement" options={ARRANGEMENT_OPTIONS} onSave={(v) => save("arrangement_type", v)} />
                  </Field>
                  <Field label="Current Occupancy">
                    <InlineEditField value={lic.occupancy_current} type="number" label="Current occupancy" placeholder="—" onSave={(v) => save("occupancy_current", v)} />
                  </Field>
                  {lic.arrangement_type === "rent_to_rent" && (
                    <Field label="R2R Agreement End">
                      <InlineEditDate value={lic.r2r_agreement_end ?? ""} label="R2R agreement end" placeholder="—" onSave={(v) => save("r2r_agreement_end", v)} />
                    </Field>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              {/* HMO / SA / R2R compliance checks (review-only) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-[13px] font-semibold text-slate-800">Compliance Checks</h3>
                </div>
                <div className="p-4 space-y-2.5">
                  {computeHmoChecks(lic).map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      {c.status === "pass" ? (
                        <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-500" />
                      ) : c.status === "warn" ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      ) : (
                        <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-amber-400" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-700">{c.label}</p>
                        <p className="text-[10px] text-slate-400 leading-snug">{c.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <h3 className="text-[13px] font-semibold text-slate-800">Key Date</h3>
                </div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Expiry</p>
                <p className="text-[15px] font-bold text-slate-900">{formatDate(lic.expiry_date)}</p>
                <p className="text-[11px] text-slate-500 mt-1">Surfaced to the renewal calendar.</p>
                <Link href="/app/calendar" className="mt-3 inline-block text-[11px] text-blue-600 hover:text-blue-800 font-medium">
                  Open Calendar →
                </Link>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Licence conditions and renewal rules vary by council. Confirm requirements with the issuing authority.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Conditions" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h2 className="text-[13px] font-semibold text-slate-800">Licence Conditions</h2>
              </div>
              {conditions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <Key className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-[12px] text-slate-500">No conditions recorded for this licence.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {conditions.map((c, i) => (
                    <li key={i} className="px-5 py-3 text-[12px] text-slate-700">{c}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="text-[13px] font-medium text-slate-800">{children}</div>
    </div>
  )
}
