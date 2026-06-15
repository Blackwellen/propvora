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
  InlineEditMoney,
  InlineEditTextarea,
} from "@/components/editing"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import { LegalDisclaimer, DraftBadge } from "@/components/legal/LegalDisclaimer"
import { MobileTabs, type MobileTabItem } from "@/components/mobile"
import { openCourtBundle } from "@/lib/legal/bundle"
import type { ValiditySnapshot } from "@/lib/legal/validity"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  Gavel,
  ChevronLeft,
  Download,
  FileText,
  Clock,
  Trash2,
  Building2,
  AlertTriangle,
} from "lucide-react"
import {
  usePossessionCase,
  useUpdatePossessionCase,
  useDeletePossessionCase,
  usePossessionEvidence,
  useCreatePossessionEvidence,
  formatDate,
  type PossessionCase,
  type PossessionEvidence,
} from "../../legal-data"

const TABS = ["Overview", "Evidence", "Timeline", "Notice (Review)"] as const
type Tab = (typeof TABS)[number]

const STATUS_OPTIONS = [
  { value: "gathering_evidence", label: "Gathering Evidence" },
  { value: "notice_draft", label: "Drafting Notice" },
  { value: "notice_served", label: "Notice Served" },
  { value: "notice_expired", label: "Notice Expired" },
  { value: "court_applied", label: "Court Applied" },
  { value: "hearing_scheduled", label: "Hearing Scheduled" },
  { value: "possession_granted", label: "Possession Granted" },
  { value: "warrant_issued", label: "Warrant Issued" },
  { value: "resolved", label: "Resolved" },
]

// Possession case lifecycle. Each state can advance to any later stage or be
// resolved; we reject a no-op so the Select behaves as a workflow guard. We
// deliberately allow flexible movement (cases can stall/regress) but never a
// transition to the current value.
const STATUS_ORDER = STATUS_OPTIONS.map((o) => o.value)

function statusLabel(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s
}
function statusCls(s: string) {
  switch (s) {
    case "resolved": return "bg-emerald-100 text-emerald-700 border border-emerald-200"
    case "notice_served": return "bg-amber-100 text-amber-700 border border-amber-200"
    case "court_applied":
    case "warrant_issued":
    case "notice_expired": return "bg-red-100 text-red-700 border border-red-200"
    case "possession_granted":
    case "hearing_scheduled": return "bg-purple-100 text-purple-700 border border-purple-200"
    default: return "bg-blue-100 text-blue-700 border border-blue-200"
  }
}
function money(n: number | null | undefined): string {
  if (n == null) return "£0"
  return `£${Number(n).toLocaleString("en-GB")}`
}

function buildBundle(c: PossessionCase, evidence: PossessionEvidence[]) {
  openCourtBundle({
    caseData: c,
    evidence,
    tenantName: c.contact?.display_name ?? "Respondent",
    propertyName: c.property?.nickname ?? "Property",
    validity: (c.validity_snapshot as ValiditySnapshot | null) ?? null,
  })
}

export default function PossessionCaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = String(params?.caseId ?? "")
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id

  const { data: caseData, isLoading } = usePossessionCase(workspaceId, caseId)
  const { data: evidence = [] } = usePossessionEvidence(workspaceId, caseId)
  const updateCase = useUpdatePossessionCase()
  const deleteCase = useDeletePossessionCase()
  const createEvidence = useCreatePossessionEvidence()
  const [activeTab, setActiveTab] = useState<Tab>("Overview")

  async function save(field: string, raw: string) {
    if (!workspaceId || !caseData) return
    let value: unknown = raw
    if (field === "arrears_amount" || field === "arrears_weeks") {
      value = raw === "" ? null : Number(raw)
    }
    await updateCase.mutateAsync({ id: caseData.id, workspaceId, payload: { [field]: value } as never })
  }

  // Workflow-safe status change. Edits the underlying case status (source data),
  // never the generated notice/bundle output. Rejects a no-op transition.
  async function transitionStatus(next: string) {
    if (!caseData) return
    if (next === caseData.status) return
    if (!STATUS_ORDER.includes(next)) {
      throw new Error(`Unknown status: ${next}`)
    }
    await save("status", next)
  }

  if (isLoading) {
    return <div className="px-6 py-16 text-center text-[13px] text-slate-400">Loading case…</div>
  }

  if (!caseData) {
    return (
      <div className="px-6 py-16 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-[14px] font-semibold text-slate-700 mb-1">Case not found</p>
        <p className="text-[12px] text-slate-500 mb-4">This possession case may have been deleted.</p>
        <Link href="/app/legal/possession" className="text-[12px] text-blue-600 hover:text-blue-800 font-medium">
          ← Back to Possession Cases
        </Link>
      </div>
    )
  }

  const tenant = caseData.contact?.display_name ?? "Unnamed respondent"
  const property = caseData.property?.nickname ?? "—"

  const mobileTabItems: MobileTabItem[] = TABS.map((tab) => ({
    id: tab,
    label: tab,
    badge: tab === "Evidence" && evidence.length > 0 ? evidence.length : undefined,
  }))

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
          <Link href="/app/legal/possession" className="hover:text-slate-600 flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            Possession Cases
          </Link>
          <span>/</span>
          <span className="text-slate-600">{tenant}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Gavel className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-[16px] font-bold text-slate-900">{tenant}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusCls(caseData.status)}`}>
                  {statusLabel(caseData.status)}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {property} · {caseData.ground} · {money(caseData.arrears_amount)} arrears
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => buildBundle(caseData, evidence)}
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Generate Bundle
            </button>
            <ConfirmDialog
              title="Delete case?"
              description="This possession case and its evidence references will be removed."
              confirmLabel="Delete"
              onConfirm={async () => {
                if (workspaceId) {
                  await deleteCase.mutateAsync({ id: caseData.id, workspaceId })
                  router.push("/app/legal/possession")
                }
              }}
            >
              {(open) => (
                <ActionMenu
                  items={[
                    { label: "Open Property", icon: Building2, onClick: () => router.push(caseData.property_id ? `/app/properties/${caseData.property_id}` : "/app/properties") },
                    { label: "Generate Bundle", icon: Download, onClick: () => buildBundle(caseData, evidence) },
                    { label: "Delete Case", icon: Trash2, variant: "danger", onClick: open },
                  ]}
                />
              )}
            </ConfirmDialog>
          </div>
        </div>
      </div>

      {/* Tab bar — desktop strip hidden on phones; MobileTabs takes over */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="hidden md:flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
              {tab === "Evidence" && evidence.length > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{evidence.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="md:hidden py-2">
          <MobileTabs
            tabs={mobileTabItems}
            value={activeTab}
            onChange={(id) => setActiveTab(id as Tab)}
            aria-label="Case sections"
          />
        </div>
      </div>

      {/* Persistent disclaimer */}
      <div className="px-4 sm:px-6 pt-4">
        <LegalDisclaimer />
      </div>

      {/* Tab content */}
      <div className="px-4 sm:px-6 py-6">
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4 min-w-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h2 className="text-[13px] font-semibold text-slate-800">Case Summary</h2>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <Field label="Respondent">
                    <span className="text-[13px] font-medium text-slate-800">{tenant}</span>
                  </Field>
                  <Field label="Property">
                    <span className="text-[13px] font-medium text-slate-800">{property}</span>
                  </Field>
                  <Field label="Ground(s)">
                    <InlineEditField value={caseData.ground} label="Ground(s)" onSave={(v) => save("ground", v)} />
                  </Field>
                  <Field label="Arrears (£)">
                    <InlineEditMoney value={caseData.arrears_amount} label="Arrears amount" onSave={(v) => save("arrears_amount", v)} />
                  </Field>
                  <Field label="Arrears (weeks)">
                    <InlineEditField value={caseData.arrears_weeks} type="number" label="Arrears weeks" onSave={(v) => save("arrears_weeks", v)} />
                  </Field>
                  <Field label="Status">
                    <InlineEditSelect value={caseData.status} label="Status" options={STATUS_OPTIONS} transition={transitionStatus} onSave={(v) => save("status", v)} />
                  </Field>
                  <Field label="Notice Served">
                    <InlineEditDate value={caseData.notice_served_date ?? ""} label="Notice served date" onSave={(v) => save("notice_served_date", v)} />
                  </Field>
                  <Field label="Notice Expiry">
                    <InlineEditDate value={caseData.notice_expiry_date ?? ""} label="Notice expiry date" onSave={(v) => save("notice_expiry_date", v)} />
                  </Field>
                  <Field label="Court Reference">
                    <InlineEditField value={caseData.court_reference ?? ""} label="Court reference" placeholder="—" onSave={(v) => save("court_reference", v)} />
                  </Field>
                  <Field label="Hearing Date">
                    <InlineEditDate value={caseData.hearing_date ?? ""} label="Hearing date" onSave={(v) => save("hearing_date", v)} />
                  </Field>
                </div>
                <div className="px-5 pb-5">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Notes</p>
                  <InlineEditTextarea value={caseData.notes ?? ""} label="Notes" placeholder="Add internal case notes…" onSave={(v) => save("notes", v)} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("Evidence")}
                    className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-[12px] font-medium px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Manage Evidence
                  </button>
                  <button
                    onClick={() => buildBundle(caseData, evidence)}
                    className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-[12px] font-medium px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Generate Bundle
                  </button>
                  <ConfirmDialog
                    title="Delete case?"
                    description="This possession case record will be removed."
                    confirmLabel="Delete"
                    onConfirm={async () => {
                      if (workspaceId) {
                        await deleteCase.mutateAsync({ id: caseData.id, workspaceId })
                        router.push("/app/legal/possession")
                      }
                    }}
                  >
                    {(open) => (
                      <button
                        onClick={open}
                        className="w-full border border-slate-200 text-red-600 hover:bg-red-50 text-[12px] font-medium px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Case
                      </button>
                    )}
                  </ConfirmDialog>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Propvora does not provide legal advice and never auto-serves notices. Verify deadlines and obtain
                  independent legal advice before acting.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Evidence" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4 min-w-0">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-[13px] font-semibold text-slate-800">Evidence Chain</h2>
                  <span className="text-[11px] text-slate-400">{evidence.length} item{evidence.length === 1 ? "" : "s"}</span>
                </div>
                {evidence.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <FileText className="w-9 h-9 text-slate-300 mb-3" />
                    <p className="text-[13px] font-semibold text-slate-600 mb-1">No evidence recorded yet</p>
                    <p className="text-[12px] text-slate-400">Upload documents below to build the evidence chain for this case.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {evidence.map((ev) => (
                      <div key={ev.id} className="px-5 py-3 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded">{ev.evidence_type.replace(/_/g, " ")}</span>
                            {ev.source && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">{ev.source}</span>}
                          </div>
                          <p className="text-[12px] font-medium text-slate-800">{ev.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(ev.event_date)}{ev.amount != null ? ` · ${money(ev.amount)}` : ""}</p>
                        </div>
                        {ev.document_path && (
                          <a href={ev.document_path} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:text-blue-800 font-medium shrink-0">
                            View ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h2 className="text-[13px] font-semibold text-slate-800">Upload Evidence</h2>
                </div>
                <div className="p-5">
                  <EvidenceUpload
                    workspaceId={workspaceId}
                    folder="possession-evidence"
                    onUploaded={async (doc) => {
                      if (!workspaceId) return
                      await createEvidence.mutateAsync({
                        workspace_id: workspaceId,
                        possession_case_id: caseData.id,
                        evidence_type: "other",
                        description: doc.name,
                        event_date: new Date().toISOString(),
                        document_path: doc.url,
                        source: "manual",
                      })
                    }}
                  />
                  <p className="text-[11px] text-slate-400 mt-3">
                    Uploaded files are recorded as evidence items against this case.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-[13px] font-semibold text-slate-800 mb-2">Evidence Coverage</h3>
                <p className="text-2xl font-bold text-slate-900">{evidence.length}</p>
                <p className="text-[11px] text-slate-500">item{evidence.length === 1 ? "" : "s"} on record</p>
                <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                  Strong cases evidence the ground before notice is served. Keep adding payment records, communications
                  and statements.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Timeline" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-slate-500" />
              <h2 className="text-[13px] font-semibold text-slate-800">Case Timeline</h2>
            </div>
            <ol className="space-y-3">
              {[
                { label: "Case created", date: caseData.created_at },
                { label: "Notice served", date: caseData.notice_served_date },
                { label: "Notice expiry", date: caseData.notice_expiry_date },
                { label: "Court applied", date: caseData.court_applied_date },
                { label: "Hearing", date: caseData.hearing_date },
              ]
                .filter((e) => e.date)
                .map((e, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <div>
                      <p className="text-[12px] font-medium text-slate-800">{e.label}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(e.date)}</p>
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        )}

        {activeTab === "Notice (Review)" && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-800 leading-relaxed">
                Review-only draft. This is not a legally served notice. Propvora never auto-serves. Verify all details,
                notice periods and deadlines, and obtain independent legal advice before service.
              </p>
            </div>
            <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
              <div className="bg-[#071B4D] px-6 py-5 text-center relative">
                <div className="absolute top-3 right-3">
                  <DraftBadge />
                </div>
                <p className="text-white font-bold text-[15px] uppercase tracking-widest">
                  {caseData.notice_type === "section_21" ? "Section 21 — Draft Summary" : "Section 8 — Draft Summary"}
                </p>
                <p className="text-blue-200 text-[12px] mt-1">Notice Seeking Possession (review only)</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-5 text-[12px]">
                <Field label="Property"><span className="font-semibold text-slate-800">{property}</span></Field>
                <Field label="Respondent"><span className="font-semibold text-slate-800">{tenant}</span></Field>
                <Field label="Ground(s)"><span className="font-semibold text-slate-800">{caseData.ground}</span></Field>
                <Field label="Arrears"><span className="font-semibold text-red-600">{money(caseData.arrears_amount)}</span></Field>
                <Field label="Notice served"><span className="font-semibold text-slate-800">{formatDate(caseData.notice_served_date)}</span></Field>
                <Field label="Notice expiry"><span className="font-semibold text-slate-800">{formatDate(caseData.notice_expiry_date)}</span></Field>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={() => buildBundle(caseData, evidence)}
                  className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Draft Summary
                </button>
              </div>
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
