"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useProperties } from "@/hooks/useProperties"
import { useCreateTask } from "@/hooks/useTasks"
import { useNotify } from "@/hooks/useNotify"
import { WizardShell, type WizardStepDef } from "@/components/wizard/WizardShell"
import { WizardDraftBanner } from "@/components/wizard/WizardDraftBanner"
import { useWizardDraft } from "@/components/wizard/useWizardDraft"
import { TaskStepDetails } from "@/features/work/components/steps/TaskStepDetails"
import { TaskStepSchedule } from "@/features/work/components/steps/TaskStepSchedule"
import { TaskStepReview } from "@/features/work/components/steps/TaskStepReview"
import { type TaskWizardData } from "@/features/work/components/steps/task-wizard-shared"

const defaultData: TaskWizardData = {
  title: "",
  description: "",
  category: "maintenance",
  priority: "medium",
  propertyId: "",
  propertyName: "",
  scheduledStart: "",
  dueDate: "",
  assignee: "",
  estimatedCost: 0,
}

const STEPS: WizardStepDef[] = [
  { label: "Details", description: "Title, category & priority" },
  { label: "Schedule & Assignment", description: "Dates, owner & cost" },
  { label: "Review", description: "Confirm & create" },
]

export default function NewTaskPage() {
  const router = useRouter()
  const { data: workspace } = useWorkspace()
  const { actorId } = useNotify()
  const createTask = useCreateTask()
  const { data: propertiesRaw = [], isLoading: propertiesLoading } = useProperties(workspace?.id)
  const properties = propertiesRaw.map((p) => ({ id: p.id, name: p.name }))
  const [step, setStep] = useState(1)
  const { data, setData, restoredFromDraft, discardDraft, clearDraft } = useWizardDraft<TaskWizardData>("create-task", defaultData)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleChange(updates: Partial<TaskWizardData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  async function handleSubmit() {
    if (!workspace?.id) {
      setSaveError("No active workspace. Please refresh and try again.")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      // Route through the canonical useCreateTask hook so the new task inherits
      // React Query cache invalidation (list + KPIs refresh immediately), the
      // assignment notification event, and created_by attribution. The `kind`
      // column only accepts a fixed set of values, so unsupported wizard
      // categories collapse to "general" (mirrors the detail-page mapping).
      const kind = ["maintenance", "compliance", "admin", "inspection", "turnover"].includes(data.category)
        ? data.category
        : "general"
      const created = await createTask.mutateAsync({
        workspace_id: workspace.id,
        title: data.title.trim(),
        description: data.description.trim() || null,
        category: kind,
        priority: data.priority,
        status: "todo",
        property_id: data.propertyId || null,
        scheduled_start: data.scheduledStart || null,
        due_date: data.dueDate || null,
        estimated_cost: data.estimatedCost || null,
        // `tasks.metadata` is NOT NULL (default '{}'); only send it when there is
        // an assignee, otherwise omit the key so the column default applies.
        ...(data.assignee ? { metadata: { assignee_name: data.assignee } } : {}),
        created_by: actorId,
        is_demo: false,
      })
      clearDraft()
      router.push(`/property-manager/work/tasks/${created.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save task"
      setSaveError(message)
      setSaving(false)
    }
  }

  const canAdvance = step === 1 ? data.title.trim() !== "" : true

  const stepComponents = [
    <TaskStepDetails key="details" data={data} onChange={handleChange} properties={properties} propertiesLoading={propertiesLoading} />,
    <TaskStepSchedule key="schedule" data={data} onChange={handleChange} />,
    <TaskStepReview key="review" data={data} />,
  ]

  return (
    <WizardShell
      title="Create Task"
      backHref="/property-manager/work/tasks"
      backLabel="Back to Tasks"
      steps={STEPS}
      current={step}
      onStepSelect={setStep}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={() => setStep((s) => Math.min(STEPS.length, s + 1))}
      onSubmit={handleSubmit}
      canAdvance={canAdvance}
      submitting={saving}
      submitLabel="Create Task"
      error={saveError}
      banner={restoredFromDraft ? <WizardDraftBanner onDiscard={discardDraft} /> : null}
    >
      {stepComponents[step - 1]}
    </WizardShell>
  )
}
