"use client"
import React, { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FileText, Shield } from "lucide-react"
import { PossessionWizardShell } from "@/components/legal/PossessionWizardShell"
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  usePossessionEvidence,
  useCreatePossessionEvidence,
  formatDate,
} from "../../../legal-data"

function money(n: number | null | undefined): string {
  if (n == null) return "—"
  return `£${Number(n).toLocaleString("en-GB")}`
}

export default function ReviewEvidencePage() {
  return (
    <Suspense fallback={null}>
      <ReviewEvidenceInner />
    </Suspense>
  )
}

function ReviewEvidenceInner() {
  const router = useRouter()
  const params = useSearchParams()
  const caseId = params.get("case") ?? ""
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id

  const { data: evidence = [] } = usePossessionEvidence(workspaceId, caseId)
  const createEvidence = useCreatePossessionEvidence()

  const rightRail = (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-[13px] font-semibold text-slate-800">Evidence Coverage</h3>
        </div>
        <div className="p-4">
          <p className="text-2xl font-bold text-slate-900">{evidence.length}</p>
          <p className="text-[11px] text-slate-500">item{evidence.length === 1 ? "" : "s"} recorded for this case</p>
          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            Evidence the ground before serving notice. Add payment records, communications and statements.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-500" />
          <h3 className="text-[13px] font-semibold text-slate-800">Legal Safety</h3>
        </div>
        <div className="p-4">
          <p className="text-[12px] text-slate-600 leading-relaxed">
            Propvora compiles your records for review. It does not provide legal advice or auto-serve notices.
          </p>
        </div>
      </div>
    </>
  )

  return (
    <PossessionWizardShell
      currentStep={3}
      rightRail={rightRail}
      showSaveDraft={false}
      backLabel="Back: Select Grounds"
      nextLabel="Next: Notice Preview"
      onBack={() => router.push(`/app/legal/possession/new/select-grounds?case=${caseId}`)}
      onNext={() => router.push(`/app/legal/possession/new/notice-preview?case=${caseId}`)}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-0.5">Review Evidence Chain</h2>
        <p className="text-xs text-slate-500 mb-4">
          Record the documents and events that support your ground. Items are saved live against this case.
        </p>

        <LegalDisclaimer variant="inline" className="mb-4" />

        {/* Recorded evidence */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-800">Recorded Evidence</h3>
            <span className="text-[11px] text-slate-400">{evidence.length} item{evidence.length === 1 ? "" : "s"}</span>
          </div>
          {evidence.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-[12px] text-slate-500">No evidence recorded yet. Upload files below to begin the chain.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {evidence.map((ev) => (
                <div key={ev.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800">{ev.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {ev.evidence_type.replace(/_/g, " ")} · {formatDate(ev.event_date)}
                      {ev.amount != null ? ` · ${money(ev.amount)}` : ""}
                    </p>
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

        {/* Upload */}
        {caseId ? (
          <EvidenceUpload
            workspaceId={workspaceId}
            folder="possession-evidence"
            onUploaded={async (doc) => {
              if (!workspaceId) return
              await createEvidence.mutateAsync({
                workspace_id: workspaceId,
                possession_case_id: caseId,
                evidence_type: "other",
                description: doc.name,
                event_date: new Date().toISOString(),
                document_path: doc.url,
                source: "manual",
              })
            }}
          />
        ) : (
          <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            Start the wizard from Select Tenancy to create a case before uploading evidence.
          </p>
        )}
      </div>
    </PossessionWizardShell>
  )
}
