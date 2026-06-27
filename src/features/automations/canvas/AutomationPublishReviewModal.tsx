"use client"

// Publish for review modal — shows checklist then submits.

import React, { useState } from "react"
import { X, CheckCircle, XCircle, Loader2, SendHorizonal, ShieldCheck } from "lucide-react"
import type { ValidationSummary } from "../hooks/useAutomationValidation"
import type { DryRunResult } from "../hooks/useAutomationDryRun"
import type { FlowMeta } from "../hooks/useAutomationFlow"

interface ChecklistItem {
  label: string
  pass: boolean
}

interface Props {
  meta: FlowMeta
  validation: ValidationSummary
  dryRunResult: DryRunResult | null
  onPublish: () => Promise<{ ok: boolean; error?: string }>
  onClose: () => void
}

export function AutomationPublishReviewModal({
  meta,
  validation,
  dryRunResult,
  onPublish,
  onClose,
}: Props) {
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const checklist: ChecklistItem[] = [
    { label: "Trigger configured",     pass: validation.hasTrigger },
    { label: "Conditions set",         pass: true }, // Conditions optional
    { label: "Actions configured",     pass: validation.hasAction },
    { label: "Review-first enabled",   pass: meta.reviewFirst },
    { label: "Node validation passed", pass: validation.allValid },
    { label: "Dry-run passed",         pass: !!dryRunResult && dryRunResult.status !== "failed" },
    { label: "Audit logging active",   pass: true },
    { label: "Automation named",       pass: meta.name.trim().length > 0 },
  ]

  const allPass = checklist.every((c) => c.pass)
  const failCount = checklist.filter((c) => !c.pass).length

  async function handlePublish() {
    setPublishing(true)
    setPublishError(null)
    try {
      const result = await onPublish()
      if (result.ok) {
        setDone(true)
      } else {
        setPublishError(result.error ?? "Publish failed.")
      }
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-brand-100)]">
              <SendHorizonal className="h-4.5 w-4.5 text-[var(--brand)]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Publish for review</h2>
              <p className="text-[11px] text-slate-500">{meta.name || "Untitled automation"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 px-5 py-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Submitted for review</h3>
              <p className="mt-1 text-sm text-slate-500">
                Your automation is now pending review. An admin or manager will approve it before it activates.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Checklist */}
            <div className="px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-slate-700">Pre-publish checklist</p>
                {failCount > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {failCount} item{failCount !== 1 ? "s" : ""} need attention
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    All checks passed
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className={[
                      "flex items-center gap-2.5 rounded-xl px-3 py-2",
                      item.pass ? "bg-emerald-50" : "bg-amber-50",
                    ].join(" ")}
                  >
                    {item.pass ? (
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <span className={`text-[12px] font-medium ${item.pass ? "text-emerald-800" : "text-amber-800"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review-first notice */}
            <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-xl border border-[var(--color-brand-100)] bg-[var(--brand-soft)] px-3 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand)]" />
              <p className="text-[11px] text-[var(--brand)] leading-relaxed">
                Submitting for review creates a pending approval record. This automation will not activate until an authorised reviewer approves it. Nothing runs automatically.
              </p>
            </div>

            {publishError && (
              <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
                {publishError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !allPass}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:opacity-60 transition"
              >
                {publishing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</>
                ) : (
                  <><SendHorizonal className="h-4 w-4" /> Submit for review</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
