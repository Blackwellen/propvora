"use client"

import { useState } from "react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import type { IncomeAiRecommendation } from "@/components/planning/wizard/WizardContext"
import { gbp } from "@/lib/planning/income-calculations"
import type { AiSuggestion } from "./IncomeShared"

export type AiDraft = Pick<
  IncomeAiRecommendation,
  "recommendationType" | "title" | "body" | "estimatedImpactMonthly"
>

/**
 * State-backed AI recommendations for a single income tab.
 * Recommendations are empty until `generate()` is called with a builder that
 * derives suggestions from the current wizard data — never hardcoded filler.
 * Applying a recommendation marks it reviewed/applied (user approval), it never
 * silently mutates other modules.
 */
export function useIncomeAi(tab: string) {
  const { state, update } = useWizard()
  const [isGenerating, setIsGenerating] = useState(false)

  const drafts = state.incomeAiRecommendations.filter((r) => r.incomeTab === tab && r.status === "draft")

  const suggestions: AiSuggestion[] = drafts.map((r) => ({
    id: r.id,
    label: r.title,
    desc: r.body,
    impact: r.estimatedImpactMonthly > 0 ? `+${gbp(r.estimatedImpactMonthly)} pcm potential` : undefined,
    action: "Apply suggestion",
  }))

  function generate(build: () => AiDraft[]) {
    setIsGenerating(true)
    setTimeout(() => {
      const built: IncomeAiRecommendation[] = build().map((b, i) => ({
        ...b,
        id: `${tab}-${Date.now()}-${i}`,
        incomeTab: tab,
        status: "draft",
        createdAt: new Date().toISOString(),
      }))
      const others = state.incomeAiRecommendations.filter(
        (r) => !(r.incomeTab === tab && r.status === "draft"),
      )
      update({ incomeAiRecommendations: [...others, ...built] })
      setIsGenerating(false)
    }, 450)
  }

  function apply(id: string) {
    update({
      incomeAiRecommendations: state.incomeAiRecommendations.map((r) =>
        r.id === id ? { ...r, status: "applied" } : r,
      ),
    })
  }

  function applyAll() {
    update({
      incomeAiRecommendations: state.incomeAiRecommendations.map((r) =>
        r.incomeTab === tab && r.status === "draft" ? { ...r, status: "applied" } : r,
      ),
    })
  }

  return { suggestions, generate, apply, applyAll, isGenerating }
}
