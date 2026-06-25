"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { createClient } from "@/lib/supabase/client"
import { WizardProvider, useWizard, type WizardState } from "@/components/planning/wizard/WizardContext"
import { WizardShell } from "@/components/planning/wizard/WizardShell"
import { WizardLiveSummary } from "@/components/planning/wizard/WizardLiveSummary"

const Step01Profile           = dynamic(() => import("@/components/planning/wizard/steps/Step01Profile"),           { ssr: false })
const Step02Basics            = dynamic(() => import("@/components/planning/wizard/steps/Step02Basics"),            { ssr: false })
const Step03Income            = dynamic(() => import("@/components/planning/wizard/steps/Step03Income"),            { ssr: false })
const Step04ExpensesBills     = dynamic(() => import("@/components/planning/wizard/steps/Step04ExpensesBills"),     { ssr: false })
const Step05UpfrontCompliance = dynamic(() => import("@/components/planning/wizard/steps/Step05UpfrontCompliance"), { ssr: false })
const Step06LLOffer           = dynamic(() => import("@/components/planning/wizard/steps/Step06LLOffer"),           { ssr: false })
const Step07Forecast          = dynamic(() => import("@/components/planning/wizard/steps/Step07Forecast"),          { ssr: false })
const Step08RiskAIReview      = dynamic(() => import("@/components/planning/wizard/steps/Step08RiskAIReview"),      { ssr: false })
const Step09ReviewCreate      = dynamic(() => import("@/components/planning/wizard/steps/Step09ReviewCreate"),      { ssr: false })

const STEP_COMPONENTS = [
  Step01Profile,
  Step02Basics,
  Step03Income,
  Step04ExpensesBills,
  Step05UpfrontCompliance,
  Step06LLOffer,
  Step07Forecast,
  Step08RiskAIReview,
  Step09ReviewCreate,
]

function WizardInner() {
  const { state, setStep, saveDraft } = useWizard()
  const router = useRouter()

  const currentStepIndex = state.currentStep - 1
  const StepComponent    = STEP_COMPONENTS[currentStepIndex]
  const isLastStep       = state.currentStep === STEP_COMPONENTS.length
  const canContinue =
    state.currentStep === 1 ? !!state.profileKey :
    state.currentStep === 2 ? !!state.setName.trim() :
    true

  const handleNext = () => {
    if (state.currentStep < STEP_COMPONENTS.length) {
      setStep(state.currentStep + 1)
      void saveDraft()
    }
  }

  const handlePrev = () => {
    if (state.currentStep > 1) {
      setStep(state.currentStep - 1)
    }
  }

  const nextLabel = "Continue"

  return (
    <WizardShell
      step={
        StepComponent
          ? <StepComponent />
          : <div className="p-8 text-slate-400">Loading…</div>
      }
      livePanel={<WizardLiveSummary />}
      planName={state.setName || "Resume Planning Set"}
      onClose={() => router.push("/property-manager/planning")}
      onPrev={handlePrev}
      onNext={handleNext}
      onSave={() => { void saveDraft() }}
      isLastStep={isLastStep}
      canContinue={canContinue}
      nextLabel={nextLabel}
    />
  )
}

export default function ResumeDraftPage() {
  const params  = useParams()
  const draftId = params.draftId as string

  const [initialData, setInitialData] = useState<Partial<WizardState> | null>(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function loadDraft() {
      // `planning_wizard_drafts` may not exist in the live DB (42P01). Treat any
      // error or missing row as "no draft" and start a fresh wizard — never crash.
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("planning_wizard_drafts")
          .select("*")
          .eq("id", draftId)
          .single()

        if (!error && data?.draft_data) {
          setInitialData({
            ...(data.draft_data as Partial<WizardState>),
            currentStep: data.current_step as number,
            draftId,
          })
        }
      } catch {
        // Table missing or query failed — fall through to a fresh wizard.
      } finally {
        setLoading(false)
      }
    }
    void loadDraft()
  }, [draftId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading draft…</div>
      </div>
    )
  }

  return (
    <WizardProvider initialDraftId={draftId} initialData={initialData ?? undefined}>
      <WizardInner />
    </WizardProvider>
  )
}
