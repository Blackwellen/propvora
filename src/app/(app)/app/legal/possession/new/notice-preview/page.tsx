"use client"
import React, { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Building2,
  User,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  Download,
  AlertTriangle,
} from "lucide-react"
import { PossessionWizardShell } from "@/components/legal/PossessionWizardShell"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePossessionCase, formatDate } from "../../../legal-data"

function money(n: number | null | undefined): string {
  if (n == null) return "£0"
  return `£${Number(n).toLocaleString("en-GB")}`
}

function NoticeDisclaimer() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 flex items-start gap-3 mb-4">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[12px] text-amber-800 leading-relaxed">
          This is a review-only draft summary — not a legally served notice. Propvora never auto-serves. Seek independent
          legal advice from a qualified solicitor, and verify all deadlines and notice periods before service.
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-700">×</button>
    </div>
  )
}

export default function NoticePreviewPage() {
  return (
    <Suspense fallback={null}>
      <NoticePreviewInner />
    </Suspense>
  )
}

function NoticePreviewInner() {
  const router = useRouter()
  const params = useSearchParams()
  const caseId = params.get("case") ?? ""
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { data: caseData } = usePossessionCase(workspaceId, caseId)

  const tenant = caseData?.contact?.display_name ?? "Respondent"
  const property = caseData?.property?.nickname ?? "Property"

  function downloadDraft() {
    if (!caseData) return
    const summary = {
      type: "Section 8 — review-only draft summary",
      respondent: tenant,
      property,
      ground: caseData.ground,
      arrears: money(caseData.arrears_amount),
      notice_served_date: caseData.notice_served_date,
      notice_expiry_date: caseData.notice_expiry_date,
      disclaimer: "Not a legally served notice. Obtain independent legal advice before service.",
    }
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `section8-draft-${caseId || "case"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const rightRail = (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-slate-800">Pre-service Checks</h3>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full">Manual review</span>
        </div>
        <div className="p-4 space-y-2">
          {[
            "Confirm respondent and property details",
            "Confirm ground(s) and arrears figures",
            "Confirm notice period with your solicitor",
          ].map((check, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="text-[12px] text-slate-700 flex-1">{check}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/50 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="text-[13px] font-semibold text-amber-800">Review Required</h3>
        </div>
        <div className="p-4">
          <p className="text-[12px] text-amber-700">
            This draft has not been verified for legal validity. It must be reviewed by a qualified solicitor before any
            service.
          </p>
        </div>
      </div>
    </>
  )

  return (
    <PossessionWizardShell
      currentStep={4}
      rightRail={rightRail}
      backLabel="Back: Review Evidence"
      nextLabel="Next: Record Service"
      showSaveDraft={false}
      onBack={() => router.push(`/app/legal/possession/new/review-evidence?case=${caseId}`)}
      onNext={() => router.push(`/app/legal/possession/new/record-service?case=${caseId}`)}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-3">Notice Preview</h2>
        <NoticeDisclaimer />

        <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
          <div className="bg-[#071B4D] px-6 py-5 text-center">
            <p className="text-white font-bold text-[15px] uppercase tracking-widest">Section 8 — Draft Summary</p>
            <p className="text-blue-200 text-[12px] mt-1">Notice Seeking Possession (review only)</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Item icon={Building2} label="Property" value={property} sub={caseData?.ground} />
              <Item icon={User} label="Respondent" value={tenant} />
              <Item icon={FileText} label="Ground(s)" value={caseData?.ground ?? "—"} />
              <Item icon={DollarSign} label="Rent Arrears" value={money(caseData?.arrears_amount)} highlight />
              <Item icon={Calendar} label="Notice Served" value={formatDate(caseData?.notice_served_date)} />
              <Item icon={Calendar} label="Notice Expiry" value={formatDate(caseData?.notice_expiry_date)} />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Draft summary for <strong>{property}</strong>. This is generated from your live case data for review
                purposes only and does not constitute a served legal notice.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={downloadDraft}
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Draft Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </PossessionWizardShell>
  )
}

function Item({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string | null
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${highlight ? "bg-red-50" : "bg-slate-100"}`}>
        <Icon className={`w-3.5 h-3.5 ${highlight ? "text-red-600" : "text-slate-600"}`} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`font-semibold ${highlight ? "text-[14px] text-red-600" : "text-[12px] text-slate-800"}`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}
