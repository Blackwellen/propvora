"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { useGuidedHelp } from "../GuidedHelpProvider"
import type { Tutorial } from "../tutorial-types"

export default function FirstUseModal() {
  const pathname = usePathname()
  const { firstUseFor, markStatus, forced, clearForced, setEnabled } = useGuidedHelp()
  const [active, setActive] = useState<Tutorial | null>(null)
  const [step, setStep] = useState(0)

  // A forced tutorial (replayed from the launcher) takes priority over the
  // route-based first-use auto-trigger.
  useEffect(() => {
    if (forced) {
      setActive(forced)
      setStep(0)
      return
    }
    const t = firstUseFor(pathname)
    setActive(t)
    setStep(0)
  }, [pathname, firstUseFor, forced])

  useEffect(() => {
    if (!active) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close("dismissed")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  if (!active) return null

  function close(status: "completed" | "dismissed") {
    if (active) markStatus(active.key, status)
    setActive(null)
    clearForced()
  }

  // Kill the tour entirely from the modal — turns off all first-use tips
  // (persisted by the provider) and closes the current one.
  function turnOffTips() {
    setEnabled(false)
    close("dismissed")
  }

  const isLast = step >= active.steps.length - 1
  const current = active.steps[step]

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => close("dismissed")} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={active.title}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,var(--brand),var(--accent))" }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-violet-600 uppercase tracking-wide">{active.section}</p>
              <h2 className="text-base font-bold text-slate-900 leading-tight">{active.title}</h2>
            </div>
          </div>
          <button onClick={() => close("dismissed")} aria-label="Close" className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step body */}
        <div className="px-5 pb-2 min-h-[96px]">
          <h3 className="text-sm font-semibold text-slate-800">{current.title}</h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{current.body}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 px-5 py-2">
          {active.steps.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-violet-600" : "w-1.5 bg-slate-200"}`} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {active.helpHref && (
              <Link href={active.helpHref} className="text-xs text-slate-400 hover:text-[#2563EB] hidden sm:inline">Help Centre</Link>
            )}
            <button
              type="button"
              onClick={turnOffTips}
              className="text-xs text-slate-400 hover:text-slate-700 underline-offset-2 hover:underline"
            >
              Don&apos;t show tips again
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => close("dismissed")} className="text-sm text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg">
              Skip
            </button>
            {isLast ? (
              <button onClick={() => close("completed")} className="inline-flex items-center gap-1 rounded-xl bg-[#2563EB] text-white text-sm font-semibold px-4 py-1.5 hover:bg-blue-700">
                Done
              </button>
            ) : (
              <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1 rounded-xl bg-[#2563EB] text-white text-sm font-semibold px-4 py-1.5 hover:bg-blue-700">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
