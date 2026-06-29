"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useGenerateJobFromPpm } from "@/hooks/usePpm"
import type { PpmPlan } from "@/hooks/usePpm"

/**
 * Shared "Generate job from PPM plan" action used by the PPM overview, schedules
 * and plan-detail pages.
 *
 * Previously each page called the mutation inline with NO try/catch and NO user
 * feedback — so a failure (or even a slow run) produced no visible result and the
 * button looked broken. This wraps the mutation with:
 *   • a `generatingId` so the clicked row/button can show a pending state,
 *   • a `feedback` message (success or error) the page renders as a toast,
 *   • error capture so nothing fails silently,
 *   • navigation to the created job on success.
 */
export interface PpmGenerateFeedback {
  type: "success" | "error"
  message: string
}

export function usePpmGenerateJob() {
  const router = useRouter()
  const generateJob = useGenerateJobFromPpm()
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<PpmGenerateFeedback | null>(null)

  const clearFeedback = useCallback(() => setFeedback(null), [])

  const generate = useCallback(
    async (plan: PpmPlan | null | undefined, opts?: { navigate?: boolean }) => {
      if (!plan) return
      if (generatingId) return // guard against double-clicks
      setGeneratingId(plan.id)
      setFeedback(null)
      try {
        const res = await generateJob.mutateAsync({ plan })
        if (res.ok && res.jobId) {
          setFeedback({ type: "success", message: "Work order created from this PPM plan." })
          if (opts?.navigate !== false) {
            router.push(`/property-manager/work/jobs/${res.jobId}`)
          }
        } else {
          // ok:false means the jobs surface is unavailable (e.g. table missing).
          setFeedback({
            type: "error",
            message: "Couldn’t create the work order — the jobs surface is unavailable. Please try again or contact support.",
          })
        }
      } catch (err) {
        console.error("[PPM] generate job failed:", err)
        setFeedback({
          type: "error",
          message:
            err instanceof Error && err.message
              ? `Couldn’t create the work order: ${err.message}`
              : "Couldn’t create the work order. Please try again.",
        })
      } finally {
        setGeneratingId(null)
      }
    },
    [generateJob, generatingId, router],
  )

  return { generate, generatingId, isGenerating: !!generatingId, feedback, clearFeedback }
}
