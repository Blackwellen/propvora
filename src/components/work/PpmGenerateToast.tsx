"use client"

import { useEffect } from "react"
import { CheckCircle2, AlertTriangle, X } from "lucide-react"
import type { PpmGenerateFeedback } from "@/hooks/usePpmGenerateJob"

/**
 * Lightweight, self-contained toast for the PPM "Generate job" action (the app
 * has no global toast system). Auto-dismisses success after 4s; errors stay
 * until dismissed so the user can read them.
 */
export default function PpmGenerateToast({
  feedback,
  onClose,
}: {
  feedback: PpmGenerateFeedback | null
  onClose: () => void
}) {
  useEffect(() => {
    if (feedback?.type === "success") {
      const t = setTimeout(onClose, 4000)
      return () => clearTimeout(t)
    }
  }, [feedback, onClose])

  if (!feedback) return null
  const isError = feedback.type === "error"

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 max-w-[92vw]"
    >
      <div
        className={
          "flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg " +
          (isError
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-800")
        }
      >
        {isError ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        )}
        <p className="text-[13px] leading-relaxed">{feedback.message}</p>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="ml-1 shrink-0 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
