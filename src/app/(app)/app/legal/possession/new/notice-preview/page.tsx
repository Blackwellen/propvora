"use client"
import React, { Suspense } from "react"
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
  Clock,
} from "lucide-react"
import { PossessionWizardShell } from "@/components/legal/PossessionWizardShell"
import { LegalDisclaimer, DraftBadge } from "@/components/legal/LegalDisclaimer"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePropertyJurisdiction } from "@/lib/jurisdiction/usePropertyJurisdiction"
import { BilingualNotice } from "@/components/jurisdiction"
import { usePossessionCase, usePossessionEvidence, formatDate } from "../../../legal-data"
import { openCourtBundle } from "@/lib/legal/bundle"
import type { ValiditySnapshot } from "@/lib/legal/validity"

function money(n: number | null | undefined): string {
  if (n == null) return "£0"
  return `£${Number(n).toLocaleString("en-GB")}`
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
  const { data: evidence = [] } = usePossessionEvidence(workspaceId, caseId)
  const jur = usePropertyJurisdiction(caseData?.property_id ?? undefined)

  const tenant = caseData?.contact?.display_name ?? "Respondent"
  const property = caseData?.property?.nickname ?? "Property"
  const isS21 = caseData?.notice_type === "section_21"
  const validity = (caseData?.validity_snapshot as ValiditySnapshot | null) ?? null
  const warnings = validity?.checks.filter((c) => c.status === "warn").length ?? 0

  function downloadBundle() {
    if (!caseData) return
    openCourtBundle({
      caseData,
      evidence,
      tenantName: tenant,
      propertyName: property,
      validity,
    })
  }

  const rightRail = (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-slate-800">Validity Snapshot</h3>
          <span
            className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
              warnings > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {warnings > 0 ? `${warnings} to review` : "No blockers"}
          </span>
        </div>
        <div className="p-4 space-y-2.5">
          {!validity || validity.checks.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              No validity snapshot captured. Revisit the grounds step to run the checks.
            </p>
          ) : (
            validity.checks.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                {c.status === "pass" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${c.status === "warn" ? "text-red-500" : "text-amber-500"}`} />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-700">{c.label}</p>
                  <p className="text-[10px] text-slate-400 leading-snug">{c.detail}</p>
                </div>
              </div>
            ))
          )}
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
      onBack={() => router.push(`/property-manager/legal/possession/new/review-evidence?case=${caseId}`)}
      onNext={() => router.push(`/property-manager/legal/possession/new/record-service?case=${caseId}`)}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Notice Preview</h2>
          <DraftBadge />
        </div>
        <LegalDisclaimer
          className="mb-4"
          message="This is a review-only draft summary — not a legally served notice. Propvora never auto-serves. Verify all details, grounds and notice periods with a qualified solicitor before service."
        />

        <BilingualNotice countryCode={jur.countryCode} region={jur.region} className="mb-4" />

        <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
          <div className="bg-[#071B4D] px-6 py-5 text-center relative">
            <p className="text-white font-bold text-[15px] uppercase tracking-widest">
              {isS21 ? "Section 21 — Draft Summary" : "Section 8 — Draft Summary"}
            </p>
            <p className="text-[var(--color-brand-100)] text-[12px] mt-1">
              {isS21 ? "Notice Seeking Possession — no-fault (review only)" : "Notice Seeking Possession (review only)"}
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Item icon={Building2} label="Property" value={property} sub={caseData?.ground} />
              <Item icon={User} label="Respondent" value={tenant} />
              <Item icon={FileText} label="Ground(s)" value={caseData?.ground ?? "—"} />
              {!isS21 && (
                <Item
                  icon={DollarSign}
                  label="Rent Arrears"
                  value={money(caseData?.arrears_amount)}
                  sub={caseData?.arrears_weeks != null ? `${caseData.arrears_weeks} weeks` : undefined}
                  highlight
                />
              )}
              <Item
                icon={Clock}
                label="Indicative Notice Period"
                value={caseData?.notice_period_days != null ? `${caseData.notice_period_days} days` : "—"}
                sub={
                  caseData?.notice_period_overridden
                    ? `Operator-overridden${caseData?.notice_override_reason ? ` — ${caseData.notice_override_reason}` : ""}`
                    : "Verify with solicitor"
                }
              />
              <Item icon={Calendar} label="Notice Served" value={formatDate(caseData?.notice_served_date)} />
              <Item icon={Calendar} label="Notice Expiry" value={formatDate(caseData?.notice_expiry_date)} />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Draft summary for <strong>{property}</strong>. Generated from your live case data for review purposes
                only — this is not a served legal notice.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={downloadBundle}
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Generate Draft Court Bundle
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
