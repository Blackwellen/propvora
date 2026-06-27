"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Gavel, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Explicit, AUTHORISED dispute-resolution panel (admin action).
 *
 * Honesty contract: resolving a dispute is NEVER automatic. The admin must
 * choose an outcome AND write a resolution note; the action is confirmed via a
 * two-step "Confirm" gate before it POSTs to /api/admin/disputes, which checks
 * `can_resolve_dispute` server-side and records an audit entry. Nothing here
 * mutates state optimistically — the UI only reflects a confirmed server write.
 */
export default function DisputeResolvePanel({
  disputeId,
  status,
  onClose,
}: {
  disputeId: string
  status: string
  onClose?: () => void
}) {
  const router = useRouter()
  const [outcome, setOutcome] = useState<"resolved" | "rejected">("resolved")
  const [resolution, setResolution] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const terminal = status === "resolved" || status === "rejected"

  async function submit() {
    setError(null)
    if (!resolution.trim()) {
      setError("A resolution note is required.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, outcome, resolution: resolution.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) {
        setError(humanError(json?.error) ?? "Could not resolve the dispute.")
        setSubmitting(false)
        setConfirming(false)
        return
      }
      setDone(true)
      setSubmitting(false)
      // Refresh the server-rendered queue so the resolved row leaves the list.
      router.refresh()
    } catch {
      setError("Network error — the dispute was not resolved.")
      setSubmitting(false)
      setConfirming(false)
    }
  }

  if (terminal) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-3 text-xs text-slate-500 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-[#059669]" />
        This dispute is already {status}. No further action is available.
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-3 text-xs text-[#047857] flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        Resolution recorded. The action has been written to the audit log.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <Gavel className="w-3.5 h-3.5 text-[var(--brand)]" /> Resolve dispute
        </h4>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Outcome selector */}
      <div className="grid grid-cols-2 gap-2">
        {(["resolved", "rejected"] as const).map((o) => (
          <button
            key={o}
            type="button"
            disabled={submitting}
            onClick={() => setOutcome(o)}
            aria-pressed={outcome === o}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
              outcome === o
                ? o === "resolved"
                  ? "bg-[#ECFDF5] border-[#6EE7B7] text-[#047857]"
                  : "bg-[#FEF2F2] border-[#FCA5A5] text-[#b91c1c]"
                : "bg-white border-[#E2E8F0] text-slate-500 hover:bg-slate-50",
            )}
          >
            {o === "resolved" ? "Uphold / settle" : "Dismiss"}
          </button>
        ))}
      </div>

      {/* Resolution note */}
      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1">
          Resolution note <span className="text-[#dc2626]">*</span>
        </label>
        <textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          disabled={submitting}
          rows={3}
          placeholder="Record the basis for this decision. This is written to the dispute and the audit log."
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none"
        />
      </div>

      {error && (
        <div className="flex items-start gap-1.5 text-[11px] text-[#b91c1c]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Two-step confirm gate — never resolve on a single click. */}
      {!confirming ? (
        <button
          type="button"
          onClick={() => {
            if (!resolution.trim()) {
              setError("A resolution note is required.")
              return
            }
            setError(null)
            setConfirming(true)
          }}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-b from-[#3b82f6] to-[var(--brand)] hover:from-[#2f6bf0] hover:to-[var(--brand-strong)] transition-all"
        >
          Review resolution
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">
            Confirm you want to mark this dispute as{" "}
            <span className="font-semibold text-slate-800">
              {outcome === "resolved" ? "resolved" : "rejected"}
            </span>
            . This is an authorised, audited action.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={submitting}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-[#E2E8F0] hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-b from-[#3b82f6] to-[var(--brand)] hover:from-[#2f6bf0] hover:to-[var(--brand-strong)] transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function humanError(code?: string): string | null {
  if (!code) return null
  const map: Record<string, string> = {
    not_authorised: "You are not authorised to resolve this dispute.",
    already_resolved: "This dispute has already been resolved.",
    dispute_not_found: "Dispute not found.",
    resolution_required: "A resolution note is required.",
    invalid_outcome: "Invalid outcome.",
    invalid_transition: "This dispute cannot move to that state.",
    marketplace_unavailable: "The marketplace dispute system is not available.",
    Forbidden: "Platform admin access is required.",
  }
  return map[code] ?? code
}
