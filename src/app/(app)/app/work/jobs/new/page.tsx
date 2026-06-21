"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useProperties } from "@/hooks/useProperties"
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

const STEPS = ["Details", "Property & Scope", "Supplier", "Financials", "Review"]

export default function NewJobPage() {
  const router = useRouter()
  const { data: workspace } = useWorkspace()
  const { data: propertiesRaw = [], isLoading: propertiesLoading } = useProperties(workspace?.id)
  const properties = propertiesRaw.map((p) => ({ id: p.id, name: p.name }))
  const [step, setStep] = useState(1)
  const [data, setData] = useState<JobWizardData>(defaultData)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleChange(updates: Partial<JobWizardData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  async function handleSubmit() {
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { data: created, error } = await supabase
        .from("jobs")
        .insert({
          workspace_id: workspace?.id,
          title: data.title,
          description: data.description || null,
          category: data.category,
          priority: data.priority,
          status: "new",
          property_id: data.propertyId || null,
          notes: data.scopeOfWork || null,
          scheduled_date: data.scheduledDate || null,
          quoted_amount: data.quotedAmount || null,
          approved_amount: data.approvedAmount || null,
        })
        .select()
        .single()
      if (error) throw error
      router.push(`/property-manager/work/jobs/${created.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save job"
      setSaveError(message)
      setSaving(false)
    }
  }

  const canAdvance = step === 1 ? data.title.trim() !== "" : true

  const stepComponents = [
    <JobStepDetails key="details" data={data} onChange={handleChange} />,
    <JobStepScope key="property" data={data} onChange={handleChange} properties={properties} propertiesLoading={propertiesLoading} />,
    <JobStepSupplier key="supplier" data={data} onChange={handleChange} />,
    <JobStepFinancials key="financials" data={data} onChange={handleChange} />,
    <JobStepReview key="review" data={data} />,
  ]

  return (
    <div className="max-w-2xl mx-auto">

        <Link href="/property-manager/work/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Jobs
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create Job</h1>
          <p className="text-sm text-slate-500 mt-0.5">Step {step} of {STEPS.length} — {STEPS[step - 1]}</p>
        </div>

        <div className="flex items-center mb-8">
          {STEPS.map((label, idx) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  idx + 1 === step ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                  idx + 1 < step ? "bg-emerald-500 text-white" :
                  "bg-slate-100 text-slate-400"
                )}>
                  {idx + 1 < step ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={cn("text-xs hidden sm:block", idx + 1 === step ? "text-blue-600 font-semibold" : "text-slate-400")}>{label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-1 rounded-full transition-colors", idx + 1 < step ? "bg-emerald-400" : "bg-slate-200")} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">{STEPS[step - 1]}</h2>
          {stepComponents[step - 1]}
        </div>

        {saveError && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {saveError}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
              ) : (
                <><Check className="w-4 h-4" /> Create Job</>
              )}
            </button>
          )}
        </div>
    </div>
  )
}
