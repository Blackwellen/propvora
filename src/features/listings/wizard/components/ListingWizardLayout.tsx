"use client"

// Shared wizard shell: header (title/subtitle, stepper, autosave indicator,
// save draft, close), scrolling step body, a RIGHT live-preview + validation
// rail, and a sticky footer (Back / Save draft / Continue). Step navigation is
// route-based — each step lives at its own URL and the draft persists across
// them via ListingDraftProvider (mounted in the route layout).

import React, { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { X, CheckCircle2 } from "lucide-react"
import { useListingDraft, WIZARD_STEPS, stepNumFromSlug } from "../data/useListingDraft"
import { ListingWizardStepper } from "./ListingWizardStepper"
import { ListingWizardFooter } from "./ListingWizardFooter"
import { ListingLivePreview } from "./ListingLivePreview"
import { ListingValidationPanel } from "./ListingValidationPanel"

function basePath(pathname: string): { base: string; slug: string } {
  // Supports /app/listings/new/<slug> and /app/listings/<id>/edit/<slug>
  const parts = pathname.split("/").filter(Boolean)
  const slug = parts[parts.length - 1] ?? "basics"
  const base = pathname.slice(0, pathname.length - slug.length - 1)
  return { base, slug }
}

export function ListingWizardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const { isSaving, lastSavedAt, saveDraft, setStep, completionPct } = useListingDraft()

  const { base, slug } = useMemo(() => basePath(pathname), [pathname])
  const currentStep = stepNumFromSlug(slug)
  const isLastStep = currentStep === WIZARD_STEPS.length

  const go = (targetSlug: string, num: number) => {
    setStep(num)
    void saveDraft()
    router.push(`${base}/${targetSlug}`)
  }

  const handleNext = () => {
    const next = WIZARD_STEPS.find((s) => s.num === currentStep + 1)
    if (next) go(next.slug, next.num)
  }
  const handleBack = () => {
    const prev = WIZARD_STEPS.find((s) => s.num === currentStep - 1)
    if (prev) go(prev.slug, prev.num)
  }

  const nextStepDef = WIZARD_STEPS.find((s) => s.num === currentStep + 1)
  const nextLabel = nextStepDef ? `Continue to ${nextStepDef.label}` : "Continue"

  const savedLabel = isSaving
    ? "Saving…"
    : lastSavedAt
      ? "Auto-saved just now"
      : "Not saved yet"

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[16px] font-bold text-slate-900">Create listing</h1>
            <p className="truncate text-[12px] text-slate-500">
              Build a premium, channel-ready listing in five steps
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[12px] font-medium text-emerald-600 sm:flex">
              <CheckCircle2 className="h-4 w-4" />
              {savedLabel}
            </span>
            <button
              type="button"
              onClick={() => router.push("/app/listings")}
              aria-label="Close wizard"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto pb-1">
          <ListingWizardStepper currentStep={currentStep} onJump={go} />
        </div>
      </header>

      {/* Body + right rail */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</div>
        </main>
        <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50 p-4 lg:block xl:w-[320px]">
          <div className="space-y-4">
            <ListingLivePreview />
            <ListingValidationPanel />
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-[11px] text-slate-500">Overall completion</p>
              <p className="text-[20px] font-bold text-slate-900">{completionPct}%</p>
            </div>
          </div>
        </aside>
      </div>

      <ListingWizardFooter
        onBack={handleBack}
        onSave={() => void saveDraft()}
        onNext={handleNext}
        backDisabled={currentStep === 1}
        isLastStep={isLastStep}
        nextLabel={nextLabel}
        isSaving={isSaving}
      />
    </div>
  )
}
