"use client"
import React, { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
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
    if (field === "max_occupants" || field === "max_households") value = raw === "" ? null : Number(raw)
    await updateLicence.mutateAsync({ id: lic.id, workspaceId, payload: { [field]: value } as never })
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

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
          <Link href="/app/legal/hmo-licences" className="hover:text-slate-600 flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            HMO Licences
          </Link>
          <span>/</span>
          <span className="text-slate-600">{property}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Key className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2">
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
        <div className={`mx-6 mt-4 rounded-xl px-5 py-3 flex items-start gap-3 border ${days < 0 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${days < 0 ? "text-red-600" : "text-amber-600"}`} />
          <p className={`text-[12px] leading-relaxed ${days < 0 ? "text-red-800" : "text-amber-800"}`}>
            {days < 0
              ? `This licence expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago. Renew with the issuing council.`
              : `This licence expires in ${days} day${days === 1 ? "" : "s"} (${formatDate(lic.expiry_date)}). Begin the renewal process.`}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-6 mt-4">
        <div className="flex items-center gap-1">
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
      </div>

      <div className="px-6 py-6">
        {activeTab === "Overview" && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h2 className="text-[13px] font-semibold text-slate-800">Licence Details</h2>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <Field label="Property"><span className="text-[13px] font-medium text-slate-800">{property}</span></Field>
                  <Field label="Licence Type">
                    <InlineEditField value={lic.licence_type} type="select" options={TYPE_OPTIONS} onSave={(v) => save("licence_type", v)} />
                  </Field>
                  <Field label="Licence Number">
                    <InlineEditField value={lic.licence_number ?? ""} placeholder="—" onSave={(v) => save("licence_number", v)} />
                  </Field>
                  <Field label="Issuing Council">
                    <InlineEditField value={lic.issuing_council ?? ""} placeholder="—" onSave={(v) => save("issuing_council", v)} />
                  </Field>
                  <Field label="Max Occupants">
                    <InlineEditField value={lic.max_occupants} type="number" placeholder="—" onSave={(v) => save("max_occupants", v)} />
                  </Field>
                  <Field label="Max Households">
                    <InlineEditField value={lic.max_households} type="number" placeholder="—" onSave={(v) => save("max_households", v)} />
                  </Field>
                  <Field label="Issue Date">
                    <InlineEditField value={lic.issue_date ?? ""} type="date" placeholder="—" onSave={(v) => save("issue_date", v)} />
                  </Field>
                  <Field label="Expiry Date">
                    <InlineEditField value={lic.expiry_date} type="date" onSave={(v) => save("expiry_date", v)} />
                  </Field>
                  <Field label="Status">
                    <InlineEditField value={lic.status} type="select" options={STATUS_OPTIONS} onSave={(v) => save("status", v)} />
                  </Field>
                  <Field label="Days Remaining">
                    <span className="text-[13px] font-medium text-slate-800">
                      {days == null ? "—" : days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days} days`}
                    </span>
                  </Field>
                </div>
              </div>
            </div>

            <div className="col-span-4 space-y-4">
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
