"use client"

import React, { useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { WizardProvider, useWizard } from "@/components/planning/wizard/WizardContext"
import { WizardShell } from "@/components/planning/wizard/WizardShell"
import { WizardLiveSummary } from "@/components/planning/wizard/WizardLiveSummary"

const Step01Profile         = dynamic(() => import("@/components/planning/wizard/steps/Step01Profile"),         { ssr: false })
const Step02Basics          = dynamic(() => import("@/components/planning/wizard/steps/Step02Basics"),          { ssr: false })
const Step03Income          = dynamic(() => import("@/components/planning/wizard/steps/Step03Income"),          { ssr: false })
const Step04ExpensesBills   = dynamic(() => import("@/components/planning/wizard/steps/Step04ExpensesBills"),   { ssr: false })
const Step05UpfrontCompliance = dynamic(() => import("@/components/planning/wizard/steps/Step05UpfrontCompliance"), { ssr: false })
const Step06LLOffer         = dynamic(() => import("@/components/planning/wizard/steps/Step06LLOffer"),         { ssr: false })
const Step07Forecast        = dynamic(() => import("@/components/planning/wizard/steps/Step07Forecast"),        { ssr: false })
const Step08RiskAIReview    = dynamic(() => import("@/components/planning/wizard/steps/Step08RiskAIReview"),    { ssr: false })
const Step09ReviewCreate    = dynamic(() => import("@/components/planning/wizard/steps/Step09ReviewCreate"),    { ssr: false })

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

const STEP_LABELS = [
  "Profile",
  "Basics",
  "Income",
  "Expenses & Bills",
  "Upfront & Compliance",
  "LL Offer",
  "Forecast",
  "Risk & AI Review",
  "Review & Create",
]

function WizardInner() {
  const { state, setStep, saveDraft } = useWizard()
  const router = useRouter()

  const currentStepIndex = state.currentStep - 1
  const StepComponent    = STEP_COMPONENTS[currentStepIndex]
  const isLastStep       = state.currentStep === STEP_COMPONENTS.length
  const canContinue      = state.currentStep === 1 ? !!state.profileKey : true

  const handleNext = useCallback(() => {
    if (state.currentStep < STEP_COMPONENTS.length) {
      setStep(state.currentStep + 1)
      void saveDraft()
    }
  }, [state.currentStep, setStep, saveDraft])

  const handlePrev = useCallback(() => {
    if (state.currentStep > 1) {
      setStep(state.currentStep - 1)
    }
  }, [state.currentStep, setStep])

  const nextLabel = `Continue to Step ${state.currentStep + 1}: ${STEP_LABELS[state.currentStep] ?? ""}`

  return (
    <WizardShell
      step={
        StepComponent
          ? <StepComponent />
          : <div className="p-8 text-slate-400">Loading step…</div>
      }
      livePanel={<WizardLiveSummary />}
      planName={state.setName || "New Planning Set"}
      onClose={() => router.push("/app/planning")}
      onPrev={handlePrev}
      onNext={handleNext}
      onSave={() => { void saveDraft() }}
      isLastStep={isLastStep}
      canContinue={canContinue}
      nextLabel={nextLabel}
    />
  )
}

function WizardPageInner() {
  const searchParams = useSearchParams()
  const profileKey   = searchParams.get("profile") ?? undefined

  return (
    <WizardProvider initialData={profileKey ? { profileKey } : undefined}>
      <WizardInner />
    </WizardProvider>
  )
}

export default function WizardPage() {
  return (
    <Suspense fallback={null}>
      <WizardPageInner />
    </Suspense>
  )
}
