"use client"
import React, { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, Calendar, CheckCircle } from "lucide-react"
import { PossessionWizardShell } from "@/components/legal/PossessionWizardShell"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUpdatePossessionCase } from "../../../legal-data"

/* Configurable ground LABELS / guidance — not hardcoded legal truth.
   These describe Section 8 grounds for landlord reference only. */
const GROUNDS = [
  {
    id: "g8",
    number: "Ground 8",
    name: "Substantial Rent Arrears",
    type: "Mandatory",
    description: "Rent arrears at or above the statutory threshold both when notice is served and at the hearing date.",
    keyRequirement: "Threshold of unpaid rent at service and hearing date",
    evidence: ["Rent ledger / statement", "Payment history"],
    recommended: true,
  },
  {
    id: "g10",
    number: "Ground 10",
    name: "Some Rent Arrears",
    type: "Mandatory",
    description: "Some rent is unpaid at the time the notice is served and at the date of the hearing.",
    keyRequirement: "Any amount of unpaid rent at both dates",
    evidence: ["Rent ledger / statement", "Payment history"],
    recommended: false,
  },
  {
    id: "g11",
    number: "Ground 11",
    name: "Persistent Rent Delays",
    type: "Discretionary",
    description: "The tenant has persistently delayed paying rent, even if no rent is currently outstanding.",
    keyRequirement: "Pattern of late payments (ongoing issue)",
    evidence: ["Payment history", "Bank statements / logs"],
    recommended: false,
  },
  {
    id: "g12",
    number: "Ground 12",
    name: "Breach of Tenancy Obligation",
    type: "Discretionary",
    description: "The tenant has breached one or more obligations of the tenancy agreement (other than rent).",
    keyRequirement: "Tenant breached a term of the tenancy",
    evidence: ["Tenancy agreement", "Incident / complaint records"],
    recommended: false,
  },
  {
    id: "g14",
    number: "Ground 14",
    name: "Nuisance or Annoyance",
    type: "Discretionary",
    description: "The tenant has caused a nuisance or annoyance to neighbours or been convicted of a relevant offence.",
    keyRequirement: "Nuisance or annoyance impacting others",
    evidence: ["Incident logs", "Witness statements"],
    recommended: false,
  },
]

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

  const [selected, setSelected] = useState<string[]>(["g8"])
  const [saving, setSaving] = useState(false)

  function toggleGround(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  const selectedGrounds = GROUNDS.filter((g) => selected.includes(g.id))
  const allMandatory = selectedGrounds.length > 0 && selectedGrounds.every((g) => g.type === "Mandatory")
  const caseStrength = selected.length >= 2 && allMandatory ? 84 : selected.length >= 1 ? 65 : 40

  async function handleNext() {
    const groundLabel = selectedGrounds.map((g) => g.number).join(", ") || "Ground 8"
    if (workspaceId && caseId) {
      setSaving(true)
      try {
        await updateCase.mutateAsync({ id: caseId, workspaceId, payload: { ground: groundLabel } })
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
          <h3 className="text-[13px] font-semibold text-slate-800">Selected Grounds</h3>
          <span className="w-5 h-5 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
            {selected.length}
          </span>
        </div>
        <div className="p-4 space-y-2">
          {selectedGrounds.length === 0 ? (
            <p className="text-[12px] text-slate-400">No grounds selected yet.</p>
          ) : (
            selectedGrounds.map((g) => (
              <div key={g.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">{g.number}: {g.name}</p>
                  <span className={`text-[10px] font-medium ${g.type === "Mandatory" ? "text-red-600" : "text-slate-500"}`}>{g.type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-[13px] font-semibold text-slate-800">Case Strength (indicative)</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 40 40" className="w-16 h-16 -rotate-90">
                <circle cx="20" cy="20" r="15" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="20" cy="20" r="15" fill="none"
                  stroke={caseStrength >= 80 ? "#10b981" : caseStrength >= 60 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="4"
                  strokeDasharray={`${(caseStrength / 100) * 94.25} ${94.25}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[13px] font-bold text-slate-900">{caseStrength}%</span>
                <span className="text-[9px] text-slate-500">{caseStrength >= 80 ? "Strong" : "Good"}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed text-center">
            Indicative only. Strength depends on the evidence you record next.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <h3 className="text-[13px] font-semibold text-slate-800">Notice Period</h3>
        </div>
        <div className="p-4">
          <p className="text-[12px] text-slate-600 leading-relaxed">
            Notice periods vary by ground and current legislation. Confirm the correct period with your solicitor before
            serving.
          </p>
        </div>
      </div>
    </>
  )

  return (
    <PossessionWizardShell
      currentStep={2}
      rightRail={rightRail}
      nextDisabled={selected.length === 0 || saving}
      showSaveDraft={false}
      backLabel="Back"
      nextLabel={saving ? "Saving…" : "Next: Review Evidence"}
      onBack={() => router.push(`/app/legal/possession/new/select-tenancy`)}
      onNext={handleNext}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900 mb-0.5">Choose Possession Grounds</h2>
        <p className="text-xs text-slate-500 mb-4">
          Select one or more grounds. These are reference labels — confirm applicability with a qualified solicitor.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px] font-medium text-blue-700">Reference guidance only</span>
          </div>
        </div>

        <div className="space-y-3">
          {GROUNDS.map((g) => {
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
      </div>
    </PossessionWizardShell>
  )
}
