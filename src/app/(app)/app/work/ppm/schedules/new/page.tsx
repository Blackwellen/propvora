"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWorkspaceId } from "@/hooks/useWorkspace"
import { useProperties } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { useCreatePpmPlan } from "@/hooks/usePpm"
import { useNotify } from "@/hooks/useNotify"
import { WizardShell, type WizardStepDef } from "@/components/wizard/WizardShell"
import { WizardDraftBanner } from "@/components/wizard/WizardDraftBanner"
import { useWizardDraft } from "@/components/wizard/useWizardDraft"
import { PpmStepService } from "@/features/work/components/steps/PpmStepService"
import { PpmStepProperty } from "@/features/work/components/steps/PpmStepProperty"
import { PpmStepSchedule } from "@/features/work/components/steps/PpmStepSchedule"
import { PpmStepSupplier } from "@/features/work/components/steps/PpmStepSupplier"
import { PpmStepReview } from "@/features/work/components/steps/PpmStepReview"
import { type PpmWizardData } from "@/features/work/components/steps/ppm-wizard-shared"

const defaultData: PpmWizardData = {
  name: "",
  category: "Gas",
  priority: "medium",
  description: "",
  propertyId: "",
  propertyName: "",
  unitId: "",
  unitName: "",
  frequency: "annual",
  startDate: "",
  nextDueDate: "",
  reminders: [30, 7, 1],
  supplierName: "",
  estimatedCost: 0,
  autoGenerateJob: true,
}

const STEPS: WizardStepDef[] = [
  { label: "Service Details", description: "What needs doing" },
  { label: "Property & Asset", description: "Where it's located" },
  { label: "Schedule Rules", description: "When & how often" },
  { label: "Supplier & Cost", description: "Who & how much" },
  { label: "Review", description: "Confirm & create" },
]

export default function NewPpmSchedulePage() {
  const router = useRouter()
  const workspaceId = useWorkspaceId()
  const { actorId } = useNotify()
  const createPlan = useCreatePpmPlan()
  const { data: propertiesRaw = [], isLoading: propertiesLoading } = useProperties(workspaceId)
  const properties = propertiesRaw.map((p) => ({ id: p.id, name: p.name }))
  const [step, setStep] = useState(1)
  const { data, setData, restoredFromDraft, discardDraft, clearDraft } = useWizardDraft<PpmWizardData>("new-ppm-schedule", defaultData)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: unitsRaw = [], isLoading: unitsLoading } = useUnits(workspaceId, data.propertyId || undefined)
  const units = unitsRaw.map((u) => ({ id: u.id, unit_name: u.unit_name }))

  function handleChange(updates: Partial<PpmWizardData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  // Per-step validation gates — Continue is disabled until the active step is
  // valid (mirrors the Create Task / Create Job wizards).
  const dateConflict = Boolean(data.startDate && data.nextDueDate && data.nextDueDate < data.startDate)
  const canAdvance = (() => {
    if (step === 1) return data.name.trim() !== "" && data.category !== ""
    if (step === 3) return data.frequency !== "" && data.nextDueDate !== "" && !dateConflict
    return true
  })()

  async function handleSubmit() {
    if (!workspaceId) {
      setSaveError("No active workspace. Please refresh and try again.")
      return
    }
    if (!data.name.trim() || !data.category || !data.frequency || !data.nextDueDate || dateConflict) {
      setSaveError("Some required fields are missing or invalid. Please review steps 1 and 3.")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const plan = await createPlan.mutateAsync({
        workspace_id: workspaceId,
        name: data.name.trim(),
        status: "scheduled",
        is_demo: false,
        category: data.category || null,
        priority: data.priority || null,
        description: data.description.trim() || null,
        property_id: data.propertyId || null,
        unit_id: data.unitId || null,
        supplier_name: data.supplierName.trim() || null,
        frequency: data.frequency || null,
        start_date: data.startDate || null,
        next_due_date: data.nextDueDate || null,
        estimated_cost: data.estimatedCost || null,
        auto_generate_job: data.autoGenerateJob,
        reminders: data.reminders,
        created_by: actorId,
      })
      clearDraft()
      router.push(`/property-manager/work/ppm/${plan.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create PPM schedule"
      setSaveError(message)
      setSaving(false)
    }
  }

  const stepComponents = [
    <PpmStepService key="service" data={data} onChange={handleChange} />,
    <PpmStepProperty
      key="property"
      data={data}
      onChange={handleChange}
      properties={properties}
      propertiesLoading={propertiesLoading}
      units={units}
      unitsLoading={unitsLoading}
    />,
    <PpmStepSchedule key="schedule" data={data} onChange={handleChange} />,
    <PpmStepSupplier key="supplier" data={data} onChange={handleChange} />,
    <PpmStepReview key="review" data={data} />,
  ]

  return (
    <WizardShell
      title="New PPM Schedule"
      backHref="/property-manager/work/ppm/schedules"
      backLabel="Back to Schedules"
      steps={STEPS}
      current={step}
      onStepSelect={setStep}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={() => setStep((s) => Math.min(STEPS.length, s + 1))}
      onSubmit={handleSubmit}
      canAdvance={canAdvance}
      submitting={saving}
      submitLabel="Create PPM Schedule"
      error={saveError}
      banner={restoredFromDraft ? <WizardDraftBanner onDiscard={discardDraft} /> : null}
    >
      {stepComponents[step - 1]}
    </WizardShell>
  )
}
