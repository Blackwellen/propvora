"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useProperties } from "@/hooks/useProperties"
import { useWorkspaceJurisdiction } from "@/hooks/useWorkspaceJurisdiction"
import { fitnessStandard } from "@/lib/compliance/fitness"
import { useCreateJob } from "@/hooks/useJobs"
import { useCreateContact } from "@/hooks/useContacts"
import { useNotify } from "@/hooks/useNotify"
import { WizardShell, type WizardStepDef } from "@/components/wizard/WizardShell"
import { WizardDraftBanner } from "@/components/wizard/WizardDraftBanner"
import { useWizardDraft } from "@/components/wizard/useWizardDraft"
import { JobStepDetails } from "@/features/work/components/steps/JobStepDetails"
import { JobStepScope } from "@/features/work/components/steps/JobStepScope"
import { JobStepSupplier } from "@/features/work/components/steps/JobStepSupplier"
import { JobStepFinancials } from "@/features/work/components/steps/JobStepFinancials"
import { JobStepReview } from "@/features/work/components/steps/JobStepReview"
import { type JobWizardData } from "@/features/work/components/steps/job-wizard-shared"

const defaultData: JobWizardData = {
  title: "",
  description: "",
  category: "maintenance",
  priority: "medium",
  propertyId: "",
  propertyName: "",
  scopeOfWork: "",
  revenueBlocking: false,
  occupancyBlocking: false,
  supplierName: "",
  supplierContact: "",
  supplierEmail: "",
  supplierPhone: "",
  sendPortalLink: true,
  scheduledDate: "",
  scheduledTime: "",
  estimatedDuration: "",
  quotedAmount: 0,
  approvedAmount: 0,
  approvedSameAsQuoted: true,
}

const STEPS: WizardStepDef[] = [
  { label: "Details", description: "Title, category & priority" },
  { label: "Property & Scope", description: "Where & what" },
  { label: "Supplier", description: "Contractor details" },
  { label: "Financials", description: "Quote & schedule" },
  { label: "Review", description: "Confirm & create" },
]

export default function NewJobPage() {
  const router = useRouter()
  const { data: workspace } = useWorkspace()
  const { actorId } = useNotify()
  const createJob = useCreateJob()
  const createContact = useCreateContact()
  const { data: propertiesRaw = [], isLoading: propertiesLoading } = useProperties(workspace?.id)
  const properties = propertiesRaw.map((p) => ({ id: p.id, name: p.name }))
  const ws = useWorkspaceJurisdiction()
  const [step, setStep] = useState(1)
  const { data, setData, restoredFromDraft, discardDraft, clearDraft } = useWizardDraft<JobWizardData>("create-job", defaultData)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleChange(updates: Partial<JobWizardData>) {
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
      // If supplier details were entered, create (or reuse) a supplier contact so
      // the data isn't discarded and the job links to a real record via
      // supplier_contact_id. Contact failure must not block the job — fall back to
      // an unlinked job rather than losing the work order.
      let supplierContactId: string | null = null
      const supplierName = data.supplierName.trim()
      if (supplierName) {
        try {
          // NB: the `contacts` table has no `created_by` column — passing it
          // makes the insert fail. Keep this payload to columns that exist.
          const contact = await createContact.mutateAsync({
            workspace_id: workspace.id,
            contact_type: "supplier",
            full_name: data.supplierContact.trim() || supplierName,
            company_name: supplierName,
            email: data.supplierEmail.trim() || null,
            phone: data.supplierPhone.trim() || null,
            status: "active",
            is_demo: false,
          })
          supplierContactId = contact.id
        } catch {
          // swallow — job still created without the supplier link
          supplierContactId = null
        }
      }

      // Route through the canonical useCreateJob hook so the new job inherits
      // React Query cache invalidation (jobs list + work-kpis refresh
      // immediately) and created_by attribution. Every captured wizard field is
      // persisted here — nothing entered in the steps is silently dropped.
      const created = await createJob.mutateAsync({
        workspace_id: workspace.id,
        title: data.title.trim(),
        description: data.description.trim() || null,
        category: data.category,
        priority: data.priority,
        status: "new",
        property_id: data.propertyId || null,
        supplier_contact_id: supplierContactId,
        notes: data.scopeOfWork || null,
        revenue_blocking: data.revenueBlocking,
        occupancy_blocking: data.occupancyBlocking,
        scheduled_date: data.scheduledDate || null,
        scheduled_time: data.scheduledTime || null,
        estimated_duration: data.estimatedDuration || null,
        quoted_amount: data.quotedAmount || null,
        approved_amount: data.approvedAmount || null,
        created_by: actorId,
        is_demo: false,
        ...(showFitnessSla
          ? {
              sla_source: fit.slaSource,
              sla_target_at: new Date(Date.now() + (fit.hazardResponseDays as number) * 86_400_000).toISOString(),
            }
          : {}),
      })

      // If requested, provision secure supplier portal access so the contractor
      // can submit quotes & evidence against this job. Best-effort: never block
      // job creation on the grant. The grant is audit-logged server-side and the
      // shareable magic link can be (re)issued from the supplier's contact
      // record at any time.
      if (data.sendPortalLink && supplierContactId) {
        try {
          await fetch("/api/portals/grant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId: workspace.id,
              contactId: supplierContactId,
              profile: "supplier",
              purpose: `Job: ${data.title.trim()}`,
            }),
          })
        } catch {
          // swallow — the job is created regardless; portal access can be
          // granted later from the supplier's contact record.
        }
      }

      clearDraft()
      router.push(`/property-manager/work/jobs/${created.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save job"
      setSaveError(message)
      setSaving(false)
    }
  }

  // Fitness/repair SLA (dim 23) for the selected property's jurisdiction.
  const selJobProperty = propertiesRaw.find((p) => p.id === data.propertyId)
  const jobCc = selJobProperty?.country_code || ws.countryCode
  const jobRegion = selJobProperty?.region_code || (selJobProperty?.country_code ? null : (ws.settings as { region?: string }).region ?? null)
  const fit = fitnessStandard(jobCc, jobRegion)
  const showFitnessSla = !!data.propertyId && fit.hazardResponseDays != null

  const canAdvance = step === 1 ? data.title.trim() !== "" : true

  const stepComponents = [
    <JobStepDetails key="details" data={data} onChange={handleChange} />,
    <JobStepScope key="property" data={data} onChange={handleChange} properties={properties} propertiesLoading={propertiesLoading} />,
    <JobStepSupplier key="supplier" data={data} onChange={handleChange} />,
    <JobStepFinancials key="financials" data={data} onChange={handleChange} />,
    <JobStepReview key="review" data={data} />,
  ]

  return (
    <WizardShell
      title="Create Job"
      backHref="/property-manager/work/jobs"
      backLabel="Back to Jobs"
      steps={STEPS}
      current={step}
      onStepSelect={setStep}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={() => setStep((s) => Math.min(STEPS.length, s + 1))}
      onSubmit={handleSubmit}
      canAdvance={canAdvance}
      submitting={saving}
      submitLabel="Create Job"
      error={saveError}
      banner={
        <>
          {restoredFromDraft && <WizardDraftBanner onDiscard={discardDraft} />}
          {showFitnessSla && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12px] text-amber-800">
              Repair-response standard for {fit.jurisdiction}: serious hazards (e.g. damp/mould) should be addressed within{" "}
              <span className="font-semibold">{fit.hazardResponseDays} days</span> ({fit.slaSource}). An SLA target will be set on this job.
            </div>
          )}
        </>
      }
    >
      {stepComponents[step - 1]}
    </WizardShell>
  )
}
