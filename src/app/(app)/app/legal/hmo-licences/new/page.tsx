"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, FileText, Users, ShieldCheck, X, Plus, CheckCircle, AlertTriangle } from "lucide-react"
import { WizardShell, type WizardStepDef } from "@/components/wizard/WizardShell"
import { WizardDraftBanner } from "@/components/wizard/WizardDraftBanner"
import { useWizardDraft } from "@/components/wizard/useWizardDraft"
import { LegalJurisdictionGate } from "@/components/legal/LegalJurisdictionGate"
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties } from "@/hooks/useProperties"
import { useCreateHmoLicence } from "../../legal-data"

// ============================================================
// Register HMO Licence — full multi-step wizard.
// Replaces the previous single popover with the shared WizardShell
// (premium side-step rail on desktop, step dropdown on mobile).
// Captures the full hmo_licences record: type, arrangement, details,
// occupancy, conditions and a licence document. England & Wales only —
// wrapped in the HMO jurisdiction gate (the layout gate covers direct
// URLs too). Review-only record-keeping; never files with a council.
// ============================================================

interface HmoWizardData {
  propertyId: string
  licenceType: string
  arrangementType: string
  licenceNumber: string
  council: string
  issueDate: string
  expiryDate: string
  renewalReminderDays: number
  maxOccupants: string
  maxHouseholds: string
  occupancyCurrent: string
  r2rAgreementEnd: string
  conditions: string[]
  documentPath: string | null
  documentName: string | null
}

const defaultData: HmoWizardData = {
  propertyId: "",
  licenceType: "mandatory",
  arrangementType: "standard",
  licenceNumber: "",
  council: "",
  issueDate: "",
  expiryDate: "",
  renewalReminderDays: 90,
  maxOccupants: "",
  maxHouseholds: "",
  occupancyCurrent: "",
  r2rAgreementEnd: "",
  conditions: [],
  documentPath: null,
  documentName: null,
}

const STEPS: WizardStepDef[] = [
  { label: "Property & Type", description: "Where & licence class" },
  { label: "Licence Details", description: "Number, council & dates" },
  { label: "Occupancy", description: "Occupants & households" },
  { label: "Conditions & Document", description: "Terms & evidence" },
  { label: "Review", description: "Confirm & register" },
]

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

function Labelled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function NewHmoLicencePage() {
  return (
    <LegalJurisdictionGate module="hmo">
      <NewHmoLicenceInner />
    </LegalJurisdictionGate>
  )
}

function NewHmoLicenceInner() {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { data: propertiesRaw = [], isLoading: propertiesLoading } = useProperties(workspaceId)
  const properties = useMemo(() => propertiesRaw.map((p) => ({ id: p.id, name: p.name })), [propertiesRaw])
  const createLicence = useCreateHmoLicence()

  const [step, setStep] = useState(1)
  const { data, setData, restoredFromDraft, discardDraft, clearDraft } = useWizardDraft<HmoWizardData>(
    "register-hmo-licence",
    defaultData
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conditionInput, setConditionInput] = useState("")

  function handleChange(updates: Partial<HmoWizardData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  // Deep-link prefill: /hmo-licences/new?propertyId=… (from the property-detail
  // HMO tab). Only applies when no property is chosen yet, so it never clobbers a
  // restored draft. Read from window to avoid the useSearchParams Suspense
  // prerender requirement.
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const pid = new URLSearchParams(window.location.search).get("propertyId")
    if (pid && !data.propertyId && properties.some((p) => p.id === pid)) {
      setData((prev) => ({ ...prev, propertyId: pid }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties])

  // ── Validation ────────────────────────────────────────────
  const dateError = data.issueDate && data.expiryDate && data.expiryDate < data.issueDate
    ? "Expiry date must be on or after the issue date."
    : null
  const occError =
    data.maxOccupants && (!Number.isInteger(Number(data.maxOccupants)) || Number(data.maxOccupants) < 1)
      ? "Max occupants must be a whole number of 1 or more."
      : data.maxHouseholds && (!Number.isInteger(Number(data.maxHouseholds)) || Number(data.maxHouseholds) < 1)
        ? "Max households must be a whole number of 1 or more."
        : data.occupancyCurrent && (!Number.isInteger(Number(data.occupancyCurrent)) || Number(data.occupancyCurrent) < 0)
          ? "Current occupancy must be 0 or more."
          : null

  const canAdvance =
    step === 1
      ? data.propertyId !== ""
      : step === 2
        ? data.expiryDate !== "" && !dateError
        : step === 3
          ? !occError
          : true

  function addCondition() {
    const v = conditionInput.trim()
    if (!v) return
    handleChange({ conditions: [...data.conditions, v] })
    setConditionInput("")
  }

  async function handleSubmit() {
    if (!workspaceId) {
      setSaveError("No active workspace. Please refresh and try again.")
      return
    }
    if (!data.propertyId) { setStep(1); setSaveError("Select a property."); return }
    if (!data.expiryDate || dateError) { setStep(2); setSaveError(dateError ?? "Expiry date is required."); return }
    if (occError) { setStep(3); setSaveError(occError); return }
    setSaving(true)
    setSaveError(null)
    try {
      const created = await createLicence.mutateAsync({
        workspace_id: workspaceId,
        property_id: data.propertyId,
        licence_type: data.licenceType,
        arrangement_type: data.arrangementType,
        licence_number: data.licenceNumber.trim() || undefined,
        issuing_council: data.council.trim() || undefined,
        issue_date: data.issueDate || null,
        expiry_date: data.expiryDate,
        max_occupants: data.maxOccupants ? Number(data.maxOccupants) : null,
        max_households: data.maxHouseholds ? Number(data.maxHouseholds) : null,
        occupancy_current: data.occupancyCurrent ? Number(data.occupancyCurrent) : null,
        renewal_reminder_days: data.renewalReminderDays,
        status: "active",
        // jsonb NOT NULL DEFAULT '[]' — only send when populated (never null).
        ...(data.conditions.length > 0 ? { conditions: data.conditions } : {}),
        ...(data.documentPath ? { document_path: data.documentPath } : {}),
        ...(data.arrangementType === "rent_to_rent" && data.r2rAgreementEnd
          ? { r2r_agreement_end: data.r2rAgreementEnd }
          : {}),
      })
      clearDraft()
      router.push(`/property-manager/legal/hmo-licences/${created.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not register licence")
      setSaving(false)
    }
  }

  const propertyName = properties.find((p) => p.id === data.propertyId)?.name ?? "—"
  const TYPE_LABEL: Record<string, string> = { mandatory: "Mandatory", additional: "Additional", selective: "Selective" }
  const ARR_LABEL: Record<string, string> = {
    standard: "Standard (owner-managed)",
    serviced_accommodation: "Serviced accommodation",
    rent_to_rent: "Rent-to-rent",
  }

  // ── Steps ─────────────────────────────────────────────────
  const stepContent = [
    // 1 — Property & Type
    <div key="s1" className="space-y-5">
      <LegalDisclaimer variant="inline" />
      {properties.length === 0 && !propertiesLoading && (
        <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No properties found. Add a property in Portfolio first, then return to register a licence.
        </p>
      )}
      <Labelled label="Property *">
        <select value={data.propertyId} onChange={(e) => handleChange({ propertyId: e.target.value })} className={inputCls}>
          <option value="">{propertiesLoading ? "Loading properties…" : "Select property…"}</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name || "Unnamed property"}</option>
          ))}
        </select>
      </Labelled>
      <Labelled label="Licence type *" hint="Mandatory, additional or selective licensing under the Housing Act 2004.">
        <select value={data.licenceType} onChange={(e) => handleChange({ licenceType: e.target.value })} className={inputCls}>
          <option value="mandatory">Mandatory</option>
          <option value="additional">Additional</option>
          <option value="selective">Selective</option>
        </select>
      </Labelled>
      <Labelled label="Arrangement type" hint="How the property is operated — affects occupancy and head-agreement tracking.">
        <select value={data.arrangementType} onChange={(e) => handleChange({ arrangementType: e.target.value })} className={inputCls}>
          <option value="standard">Standard (owner-managed)</option>
          <option value="serviced_accommodation">Serviced accommodation</option>
          <option value="rent_to_rent">Rent-to-rent</option>
        </select>
      </Labelled>
    </div>,

    // 2 — Licence Details
    <div key="s2" className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Labelled label="Licence number">
          <input value={data.licenceNumber} onChange={(e) => handleChange({ licenceNumber: e.target.value })} className={inputCls} placeholder="e.g. MCC-HMO-2026-0001" />
        </Labelled>
        <Labelled label="Issuing council">
          <input value={data.council} onChange={(e) => handleChange({ council: e.target.value })} className={inputCls} placeholder="e.g. Manchester City Council" />
        </Labelled>
        <Labelled label="Issue date">
          <input type="date" value={data.issueDate} onChange={(e) => handleChange({ issueDate: e.target.value })} className={inputCls} />
        </Labelled>
        <Labelled label="Expiry date *">
          <input type="date" value={data.expiryDate} min={data.issueDate || undefined} onChange={(e) => handleChange({ expiryDate: e.target.value })} className={inputCls} />
        </Labelled>
      </div>
      <Labelled label="Renewal reminder" hint="How many days before expiry to surface a renewal reminder.">
        <select
          value={data.renewalReminderDays}
          onChange={(e) => handleChange({ renewalReminderDays: Number(e.target.value) })}
          className={inputCls}
        >
          <option value={30}>30 days before expiry</option>
          <option value={60}>60 days before expiry</option>
          <option value={90}>90 days before expiry</option>
          <option value={120}>120 days before expiry</option>
        </select>
      </Labelled>
      {data.arrangementType === "rent_to_rent" && (
        <Labelled label="Rent-to-rent agreement end" hint="End of the head agreement — surfaced alongside the licence expiry.">
          <input type="date" value={data.r2rAgreementEnd} onChange={(e) => handleChange({ r2rAgreementEnd: e.target.value })} className={inputCls} />
        </Labelled>
      )}
      {dateError && <p className="text-[12px] text-red-600">{dateError}</p>}
    </div>,

    // 3 — Occupancy
    <div key="s3" className="space-y-5">
      <p className="text-[12px] text-slate-500 leading-relaxed">
        Record the permitted and current occupancy. Current occupants above the permitted maximum is surfaced as an
        over-occupation flag on the licence — review-only, not a legal determination.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Labelled label="Max occupants">
          <input type="number" min={1} step={1} value={data.maxOccupants} onChange={(e) => handleChange({ maxOccupants: e.target.value })} className={inputCls} placeholder="e.g. 5" />
        </Labelled>
        <Labelled label="Max households">
          <input type="number" min={1} step={1} value={data.maxHouseholds} onChange={(e) => handleChange({ maxHouseholds: e.target.value })} className={inputCls} placeholder="e.g. 5" />
        </Labelled>
        <Labelled label="Current occupancy">
          <input type="number" min={0} step={1} value={data.occupancyCurrent} onChange={(e) => handleChange({ occupancyCurrent: e.target.value })} className={inputCls} placeholder="e.g. 4" />
        </Labelled>
      </div>
      {occError && <p className="text-[12px] text-red-600">{occError}</p>}
    </div>,

    // 4 — Conditions & Document
    <div key="s4" className="space-y-5">
      <Labelled label="Licence conditions" hint="Add any conditions attached to the licence (e.g. fire-door requirements, amenity standards).">
        <div className="flex gap-2">
          <input
            value={conditionInput}
            onChange={(e) => setConditionInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCondition() } }}
            className={inputCls}
            placeholder="e.g. Annual fire-alarm test required"
          />
          <button
            type="button"
            onClick={addCondition}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </Labelled>
      {data.conditions.length > 0 && (
        <ul className="space-y-2">
          {data.conditions.map((c, i) => (
            <li key={`${c}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-[12px] text-slate-700">{c}</span>
              <button
                type="button"
                aria-label={`Remove condition ${c}`}
                onClick={() => handleChange({ conditions: data.conditions.filter((_, idx) => idx !== i) })}
                className="text-slate-400 hover:text-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Licence document (optional)</label>
        {data.documentPath ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <span className="flex items-center gap-2 text-[12px] text-emerald-800 min-w-0">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{data.documentName ?? "Document attached"}</span>
            </span>
            <button
              type="button"
              onClick={() => handleChange({ documentPath: null, documentName: null })}
              className="text-emerald-700 hover:text-red-600 transition-colors shrink-0"
              aria-label="Remove document"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <EvidenceUpload
            workspaceId={workspaceId}
            folder="hmo-licences"
            onUploaded={(doc) => handleChange({ documentPath: doc.url, documentName: doc.name })}
          />
        )}
      </div>
    </div>,

    // 5 — Review
    <div key="s5" className="space-y-4">
      <LegalDisclaimer variant="inline" />
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <dl className="divide-y divide-slate-100">
          {[
            { icon: Building2, label: "Property", value: propertyName },
            { icon: ShieldCheck, label: "Licence type", value: TYPE_LABEL[data.licenceType] ?? data.licenceType },
            { icon: ShieldCheck, label: "Arrangement", value: ARR_LABEL[data.arrangementType] ?? data.arrangementType },
            { icon: FileText, label: "Licence number", value: data.licenceNumber.trim() || "—" },
            { icon: FileText, label: "Issuing council", value: data.council.trim() || "—" },
            { icon: FileText, label: "Issue date", value: data.issueDate || "—" },
            { icon: FileText, label: "Expiry date", value: data.expiryDate || "—" },
            { icon: FileText, label: "Renewal reminder", value: `${data.renewalReminderDays} days before` },
            { icon: Users, label: "Max occupants", value: data.maxOccupants || "—" },
            { icon: Users, label: "Max households", value: data.maxHouseholds || "—" },
            { icon: Users, label: "Current occupancy", value: data.occupancyCurrent || "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-2.5">
              <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <dt className="text-[12px] text-slate-500 w-40 shrink-0">{label}</dt>
              <dd className="text-[12px] font-medium text-slate-800 min-w-0 truncate">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {data.conditions.length > 0 && (
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-[12px] font-semibold text-slate-700 mb-2">Conditions ({data.conditions.length})</p>
          <ul className="space-y-1.5">
            {data.conditions.map((c, i) => (
              <li key={`${c}-${i}`} className="flex items-start gap-2 text-[12px] text-slate-600">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          This records the licence in Propvora for tracking and renewal reminders. It does not apply for, or file a
          licence with, the council. Verify all licensing duties with your local authority.
        </p>
      </div>
    </div>,
  ]

  return (
    <WizardShell
      title="Register HMO Licence"
      backHref="/property-manager/legal/hmo-licences"
      backLabel="Back to HMO Licences"
      steps={STEPS}
      current={step}
      onStepSelect={setStep}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={() => setStep((s) => Math.min(STEPS.length, s + 1))}
      onSubmit={handleSubmit}
      canAdvance={canAdvance}
      submitting={saving}
      submitLabel="Register Licence"
      error={saveError}
      banner={restoredFromDraft ? <WizardDraftBanner onDiscard={discardDraft} /> : null}
    >
      {stepContent[step - 1]}
    </WizardShell>
  )
}
