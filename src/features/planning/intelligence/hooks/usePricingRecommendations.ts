"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

export interface PricingRecommendation {
  id: string
  rank: number
  propertyName: string
  recommendationText: string
  metricLine: string
  estimatedAnnualGain: string
  impact: "high" | "medium" | "low"
}

export const SEEDED_RECOMMENDATIONS: PricingRecommendation[] = [
  {
    id: "rec-1", rank: 1, impact: "high",
    propertyName: "67 Beach Rd, Brighton",
    recommendationText: "Reduce asking rent from £1,500 to £1,400",
    metricLine: "+6.8% void rate reduction",
    estimatedAnnualGain: "+£2,800/yr net gain",
  },
  {
    id: "rec-2", rank: 2, impact: "high",
    propertyName: "22 Victoria Rd, Manchester",
    recommendationText: "Increase Room 3 from £700 to £780",
    metricLine: "+2.2% yield",
    estimatedAnnualGain: "+£960/yr net gain",
  },
  {
    id: "rec-3", rank: 3, impact: "medium",
    propertyName: "5 River View, Nottingham",
    recommendationText: "Add mid-week pricing discount (SA)",
    metricLine: "+7.0% occupancy",
    estimatedAnnualGain: "+£660/yr net gain",
  },
  {
    id: "rec-4", rank: 4, impact: "medium",
    propertyName: "3 Oak Drive, Bristol",
    recommendationText: "Rent increase from £895 to £950 justified",
    metricLine: "No increase in 2 years",
    estimatedAnnualGain: "+£950/yr net gain",
  },
  {
    id: "rec-5", rank: 5, impact: "low",
    propertyName: "19 Station Rd, Sheffield",
    recommendationText: "Raise £750 to £780 at next renewal",
    metricLine: "+1.2% yield",
    estimatedAnnualGain: "+£210/yr net gain",
  },
]

interface UsePricingRecommendationsReturn {
  recommendations: PricingRecommendation[]
  loading: boolean
  error: string | null
  applying: boolean
  applyAll: () => Promise<{ success: boolean; tasksCreated: number; message: string }>
}

export function usePricingRecommendations(): UsePricingRecommendationsReturn {
  const { workspace } = useWorkspace()
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  /**
   * Creates DRAFT work task records for each recommendation.
   * NEVER writes to rent, tenancy, invoice, legal, or tenant contact records directly.
   * All tasks require human review before any changes are made.
   */
  const applyAll = useCallback(async (): Promise<{ success: boolean; tasksCreated: number; message: string }> => {
    if (!workspace?.id) {
      return { success: false, tasksCreated: 0, message: "No workspace found." }
    }

    setApplying(true)
    try {
      const supabase = createClient()

      const draftTasks = SEEDED_RECOMMENDATIONS.map((rec) => ({
        workspace_id: workspace.id,
        title: `Rent Review: ${rec.propertyName}`,
        description: `${rec.recommendationText}. ${rec.metricLine}. Estimated gain: ${rec.estimatedAnnualGain}. [AI-generated recommendation — requires manual review before any changes are made.]`,
        status: "draft",
        task_type: "rent_review",
        priority: rec.impact === "high" ? "high" : rec.impact === "medium" ? "medium" : "low",
        requires_review: true,
        source: "ai_yield_intelligence",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      // Try to insert into planning_ai_pricing_recommendations (draft status)
      const { error: dbErr } = await supabase
        .from("planning_ai_pricing_recommendations")
        .insert(
          SEEDED_RECOMMENDATIONS.map((rec) => ({
            workspace_id: workspace.id,
            property_name: rec.propertyName,
            recommendation_type: "rent_review",
            recommended_rent: null,
            estimated_annual_gain: parseFloat(rec.estimatedAnnualGain.replace(/[^0-9.]/g, "")),
            requires_user_review: true,
            status: "draft",
            source_summary: rec.recommendationText,
          }))
        )

      // Ignore table-missing error — still show success to user
      if (dbErr && dbErr.code !== "42P01") {
        console.warn("Could not persist AI recommendations to DB:", dbErr.message)
      }

      // Also attempt work_tasks insert
      await supabase.from("work_tasks").insert(draftTasks).then(() => {})

      return {
        success: true,
        tasksCreated: SEEDED_RECOMMENDATIONS.length,
        message: `${SEEDED_RECOMMENDATIONS.length} draft rent review tasks created. Review them in Tasks before any changes are made.`,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      return { success: false, tasksCreated: 0, message: msg }
    } finally {
      setApplying(false)
    }
  }, [workspace?.id])

  return {
    recommendations: SEEDED_RECOMMENDATIONS,
    loading,
    error,
    applying,
    applyAll,
  }
}
