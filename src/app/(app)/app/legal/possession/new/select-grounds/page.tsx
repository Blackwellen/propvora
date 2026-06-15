"use client"
import React, { useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, Calendar, CheckCircle, AlertTriangle, Gavel, FileText } from "lucide-react"
import { PossessionWizardShell } from "@/components/legal/PossessionWizardShell"
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  usePossessionCase,
  useUpdatePossessionCase,
  useTenancyValiditySignals,
} from "../../../legal-data"
import {
  SECTION_8_GROUNDS,
  toSelectedGrounds,
  indicativeNoticeDays,
  groundsLabel,
  type NoticeRoute,
} from "@/lib/legal/grounds"
import { computeValidity, countWarnings } from "@/lib/legal/validity"

export default function SelectGroundsPage() {
  return (
    <Suspense fallback={null}>
      <SelectGroundsInner />
    </Suspense>
  )
}

function SelectGroundsInner() {
  const router = useRouter()
  const params = useSearchParams()
  const caseId = params.get("case") ?? ""
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const updateCase = useUpdatePossessionCase()

  const { data: caseData } = usePossessionCase(workspaceId, caseId)
  const { data: signals } = useTenancyValiditySignals(
    workspaceId,
    caseData?.tenancy_id ?? undefined,
    caseData?.property_id
  )

  const [route, setRoute] = useState<NoticeRoute>("section_8")
  const [selected, setSelected] = useState<string[]>(["g8"])
  const [howToRent, setHowToRent] = useState(false)
  const [saving, setSaving] = useState(false)

  function toggleGround(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  const selectedGrounds = useMemo(() => toSelectedGrounds(selected), [selected])
  const noticeDays = indicativeNoticeDays(route, selectedGrounds)

  // Live validity snapshot for the chosen route.
  const validity = useMemo(() => {
    if (!signals) return null
    return computeValidity({
      route,
      depositAmount: signals.depositAmount,
      depositScheme: signals.depositScheme,
      depositProtectedAt: signals.depositProtectedAt,
      epcValid: signals.epcValid,
      gasValid: signals.gasValid,
      howToRentServed: howToRent,
      licenceValid: signals.licenceValid,
      licenceRequired: signals.licenceRequired,
    })
  }, [signals, route, howToRent])

  const warnings = countWarnings(validity)

  async function handleNext() {
    const ground = groundsLabel(route, selectedGrounds)
    if (workspaceId && caseId) {
      setSaving(true)
      try {
        await updateCase.mutateAsync({
          id: caseId,
          workspaceId,
          payload: {
            ground,
            notice_type: route,
            grounds: route === "section_21" ? [] : selectedGrounds,
            notice_period_days: noticeDays,
            validity_snapshot: validity ?? null,
            status: "drafting_notice",
          },
        })
      } catch {
        /* non-blocking — continue wizard */
      } finally {
        setSaving(false)
      }
    }
    router.push(`/app/legal/possession/new/review-evidence?case=${caseId}`)
  }

  const rightRail = (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-slate-800">Notice Draft</h3>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Draft
          </span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-slate-600">Route</span>
            <span className="text-[12px] font-semibold text-slate-800">
              {route === "section_21" ? "Section 21" : "Section 8"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-slate-600">Ground(s)</span>
            <span className="text-[12px] font-semibold text-slate-800">
              {route === "section_21" ? "No-fault" : selected.length || 0}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-[12px] text-slate-600">Indicative notice</span>
            <span className="text-[14px] font-bold text-slate-900">{noticeDays} days</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Indicative only. Notice periods vary by ground and current legislation — confirm with your solicitor.
          </p>
        </div>
      </div>

      {/* Live validity checks */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-slate-800">Validity Checks</h3>
          {validity && (
            <span
              className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                warnings > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {warnings > 0 ? `${warnings} to review` : "No blockers"}
            </span>
          )}
        </div>
        <div className="p-4 space-y-2.5">
          {!validity ? (
            <p className="text-[11px] text-slate-400">Loading live signals…</p>
          ) : (
            validity.checks.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                {c.status === "pass" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : c.status === "warn" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-700">{c.label}</p>
                  <p className="text-[10px] text-slate-400 leading-snug">{c.detail}</p>
                </div>
              </div>
            ))
          )}
          {route === "section_21" && (
            <label className="mt-2 flex items-start gap-2 cursor-pointer border-t border-slate-100 pt-3">
              <input
                type="checkbox"
                checked={howToRent}
                onChange={(e) => setHowToRent(e.target.checked)}
                className="mt-0.5 accent-[#2563EB]"
              />
              <span className="text-[11px] text-slate-600">
                I confirm the current How-to-Rent guide was served at the start of the tenancy.
              </span>
            </label>
          )}
        </div>
      </div>
    </>
  )

  return (
    <PossessionWizardShell
      currentStep={2}
      rightRail={rightRail}
      nextDisabled={(route === "section_8" && selected.length === 0) || saving}
      showSaveDraft={false}
      backLabel="Back"
      nextLabel={saving ? "Saving…" : "Next: Review Evidence"}
      onBack={() => router.push(`/app/legal/possession/new/select-tenancy`)}
      onNext={handleNext}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-0.5">Choose Possession Route &amp; Grounds</h2>
        <p className="text-xs text-slate-500 mb-4">
          Select the route and (for Section 8) one or more grounds. These are reference labels — confirm applicability
          with a qualified solicitor.
        </p>

        <LegalDisclaimer variant="inline" className="mb-4" />

        {/* Route selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {[
            {
              id: "section_8" as NoticeRoute,
              icon: Gavel,
              title: "Section 8",
              sub: "Fault-based — relies on statutory grounds (e.g. rent arrears, breach).",
            },
            {
              id: "section_21" as NoticeRoute,
              icon: FileText,
              title: "Section 21",
              sub: "No-fault — only valid when all prerequisites are met (see checks).",
            },
          ].map((r) => {
            const Icon = r.icon
            const active = route === r.id
            return (
              <button
                key={r.id}
                onClick={() => setRoute(r.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  active ? "border-[#2563EB] bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${active ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-800">{r.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{r.sub}</p>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-medium text-blue-700">Reference guidance only</span>
          </div>
        </div>

        {route === "section_21" ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="text-[13px] font-semibold text-slate-800">Section 21 — no grounds required</h3>
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              A Section 21 notice does not rely on grounds, but is only valid when prerequisites are met: deposit
              protected with prescribed information given, EPC / gas safety / How-to-Rent served, and a valid property
              licence where required. Review the live checks on the right before proceeding.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {SECTION_8_GROUNDS.map((g) => {
              const isSelected = selected.includes(g.id)
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGround(g.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected ? "border-[#2563EB] bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected ? "bg-[#2563EB] border-[#2563EB]" : "border-slate-300 bg-white"}`}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[13px] font-bold text-slate-800">{g.number}</span>
                        <span className="text-[12px] font-semibold text-slate-700">— {g.name}</span>
                        {g.recommended && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full">Common</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${g.type === "Mandatory" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                          {g.type}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          {g.noticeDays}d notice
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed mb-2">{g.description}</p>
                      <p className="text-[11px] text-slate-500 mb-1"><strong>Key requirement:</strong> {g.keyRequirement}</p>
                      <p className="text-[11px] text-slate-500"><strong>Evidence needed:</strong> {g.evidence.join(" • ")}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </PossessionWizardShell>
  )
}
