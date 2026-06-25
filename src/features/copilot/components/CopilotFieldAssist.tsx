"use client"

import { useState } from "react"
import { Sparkles, Check, X, Loader2 } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"

// ============================================================================
// <CopilotFieldAssist> — inline AI assistance for a single form field.
//
// Drop next to any input. On click it sends the form state to /api/ai/form/suggest
// and shows ONE context-aware suggestion with Apply / Dismiss. Applying calls the
// caller's onApply (so the form owns its own state — no form logic is duplicated).
//
//   <CopilotFieldAssist
//     formId="property-create" field="target_rent_pcm" label="Target rent (pcm)"
//     value={rent} values={{ postcode, bedrooms }}
//     onApply={(s) => setRent(s)} />
// ============================================================================

interface Props {
  formId: string
  field: string
  label?: string
  value?: string
  values?: Record<string, unknown>
  contextRoute?: string
  /** Apply the suggestion to the field. If omitted, the suggestion is read-only. */
  onApply?: (suggestion: string) => void
}

export default function CopilotFieldAssist({ formId, field, label, value, values, contextRoute, onApply }: Props) {
  const { workspace } = useWorkspace()
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function ask() {
    if (loading) return
    setLoading(true)
    setError(null)
    setSuggestion(null)
    try {
      const res = await fetch("/api/ai/form/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: workspace?.id, formId, field, label, value, values, contextRoute }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.suggestion) setSuggestion(String(data.suggestion))
      else setError(data.error ? String(data.error) : "No suggestion available.")
    } catch {
      setError("Connection lost.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={ask}
        title="Ask Copilot to help with this field"
        aria-label={`AI suggestion for ${label || field}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-violet-500 hover:bg-violet-50 hover:text-violet-700 transition-colors"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      </button>

      {(suggestion || error) && (
        <div className="absolute right-0 top-7 z-20 w-64 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg">
          {error ? (
            <p className="text-[11px] text-red-500">{error}</p>
          ) : (
            <>
              <div className="flex items-start gap-1.5">
                <Sparkles className="h-3 w-3 text-violet-500 shrink-0 mt-0.5" />
                <p className="text-[11.5px] leading-snug text-slate-700">{suggestion}</p>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {onApply && (
                  <button
                    type="button"
                    onClick={() => { onApply(suggestion!); setSuggestion(null) }}
                    className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2 py-1 text-[11px] font-[600] text-white hover:bg-violet-700"
                  >
                    <Check className="h-3 w-3" /> Apply
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-[600] text-slate-500 hover:bg-slate-50"
                >
                  <X className="h-3 w-3" /> Dismiss
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </span>
  )
}
