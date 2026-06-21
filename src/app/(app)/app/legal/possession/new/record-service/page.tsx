"use client"
import React, { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { User, Mail, Briefcase, CheckCircle, Target, AlertTriangle } from "lucide-react"
import { PossessionWizardShell } from "@/components/legal/PossessionWizardShell"
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  usePossessionCase,
  useUpdatePossessionCase,
  useCreatePossessionEvidence,
} from "../../../legal-data"
import { computeExpiry } from "@/lib/legal/grounds"

const SERVICE_METHODS = [
  { id: "hand", label: "Hand Delivered", icon: User, iconCls: "bg-blue-100 text-blue-600", desc: "Delivered in person to the tenant." },
  { id: "post", label: "First Class Post", icon: Mail, iconCls: "bg-slate-100 text-slate-600", desc: "Sent via Royal Mail First Class Post." },
  { id: "email", label: "Email", icon: Mail, iconCls: "bg-slate-100 text-slate-600", desc: "Sent via email to tenant's known address." },
  { id: "process", label: "Process Server", icon: Briefcase, iconCls: "bg-orange-100 text-orange-600", desc: "Served by a professional process server." },
]

export default function RecordServicePage() {
  return (
    <Suspense fallback={null}>
      <RecordServiceInner />
    </Suspense>
  )
}

function RecordServiceInner() {
  const router = useRouter()
  const params = useSearchParams()
  const caseId = params.get("case") ?? ""
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id

  const { data: caseData } = usePossessionCase(workspaceId, caseId)
  const updateCase = useUpdatePossessionCase()
  const createEvidence = useCreatePossessionEvidence()

  const [method, setMethod] = useState("hand")
  const [servedDate, setServedDate] = useState(new Date().toISOString().slice(0, 10))
  const [expiryDate, setExpiryDate] = useState("")
  const [recipient, setRecipient] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Suggested expiry = served date + indicative notice period (review-only).
  const suggestedExpiry =
    caseData?.notice_period_days != null && servedDate
      ? computeExpiry(servedDate, caseData.notice_period_days)
      : ""

  async function complete() {
    if (!workspaceId || !caseId) {
      router.push("/property-manager/legal/possession")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const methodLabel = SERVICE_METHODS.find((m) => m.id === method)?.label ?? method
      await updateCase.mutateAsync({
        id: caseId,
        workspaceId,
        payload: {
          status: "notice_served",
          notice_served_date: servedDate || null,
          notice_expiry_date: (expiryDate || suggestedExpiry) || null,
          service_method: methodLabel,
          service_recipient: recipient || null,
          notes: [caseData?.notes, `Served by ${methodLabel}${recipient ? ` to ${recipient}` : ""}. ${notes}`.trim()]
            .filter(Boolean)
            .join("\n"),
        },
      })
      // Record the service event as evidence (42P01-safe inside the hook).
      try {
        await createEvidence.mutateAsync({
          workspace_id: workspaceId,
          possession_case_id: caseId,
          evidence_type: "notice_served",
          description: `Section 8 notice served (${methodLabel})`,
          event_date: new Date(servedDate || Date.now()).toISOString(),
          source: "manual",
        })
      } catch {
        /* non-blocking */
      }
      router.push(`/property-manager/legal/possession/${caseId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record service")
      setSaving(false)
    }
  }

  const footer = (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={complete}
        disabled={saving}
        className="bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-50 text-xs font-medium px-6 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
      >
        <Target className="w-3.5 h-3.5" />
        {saving ? "Saving…" : "Complete & Open Case"}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  )

  const rightRail = (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-[13px] font-semibold text-slate-800">Case Summary</h3>
        </div>
        <div className="p-4 space-y-2">
          {[
            { label: "Respondent", value: caseData?.contact?.display_name ?? "—" },
            { label: "Property", value: caseData?.property?.nickname ?? "—" },
            { label: "Ground(s)", value: caseData?.ground ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
              <span className="text-[11px] text-slate-500 w-24 shrink-0">{label}</span>
              <span className="text-[11px] font-medium text-slate-700 flex-1">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Recording service does not serve the notice. This logs that you served it. Verify validity with your solicitor.
        </p>
      </div>
    </>
  )

  return (
    <PossessionWizardShell
      currentStep={5}
      rightRail={rightRail}
      backLabel="Back"
      showSaveDraft={false}
      onBack={() => router.push(`/property-manager/legal/possession/new/notice-preview?case=${caseId}`)}
      customFooter={footer}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-0.5">Record Service</h2>
        <p className="text-xs text-slate-500 mb-3">
          Log how, when and to whom <strong>you</strong> served the notice offline. Propvora records this — it never
          serves on your behalf.
        </p>
        <LegalDisclaimer
          variant="inline"
          className="mb-5"
          message="Recording service logs what you did offline. It does not serve, file, or validate the notice. Verify with a qualified solicitor."
        />

        <div className="mb-5">
          <label className="block text-[12px] font-semibold text-slate-700 mb-3">How was the notice served?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICE_METHODS.map((m) => {
              const Icon = m.icon
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    method === m.id ? "border-[#2563EB] bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${m.iconCls}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-800">{m.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Date served</label>
            <input
              type="date"
              value={servedDate}
              onChange={(e) => setServedDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Notice expiry</label>
            <input
              type="date"
              value={expiryDate || suggestedExpiry}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {suggestedExpiry && !expiryDate && (
              <p className="text-[10px] text-slate-400 mt-1">
                Suggested from {caseData?.notice_period_days}-day indicative period — verify.
              </p>
            )}
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Tenant name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[12px] font-semibold text-slate-700 mb-3">Proof of service (optional)</label>
          {caseId ? (
            <EvidenceUpload
              workspaceId={workspaceId}
              folder="possession-evidence"
              onUploaded={async (doc) => {
                if (!workspaceId) return
                await createEvidence.mutateAsync({
                  workspace_id: workspaceId,
                  possession_case_id: caseId,
                  evidence_type: "notice_served",
                  description: `Proof of service — ${doc.name}`,
                  event_date: new Date(servedDate || Date.now()).toISOString(),
                  document_path: doc.url,
                  source: "manual",
                })
              }}
            />
          ) : (
            <p className="text-[12px] text-slate-400">Start the wizard from Select Tenancy to attach proof.</p>
          )}
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
            Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder="e.g. Handed to tenant in person, signed copy retained."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-[11px] text-slate-400 text-right mt-1">{notes.length} / 500</p>
        </div>
      </div>
    </PossessionWizardShell>
  )
}
