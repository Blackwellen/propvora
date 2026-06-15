"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Flag, ShieldCheck, Loader2 } from "lucide-react"

/**
 * Admin manual flag / clear control. Posts to /api/admin/risk, which records an
 * explicit, audited risk_event. This is a recorded HUMAN decision — never an
 * automated action.
 */
export function FlagActions({
  workspaceId,
  flagged,
  flaggedReason,
}: {
  workspaceId: string
  flagged: boolean
  flaggedReason: string | null
}) {
  const router = useRouter()
  const [reason, setReason] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function submit(action: "flag" | "clear") {
    setError(null)
    if (action === "flag" && !reason.trim()) {
      setError("A reason is required to flag this workspace.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/admin/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, workspaceId, reason: reason.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error ?? "Action failed.")
        return
      }
      setReason("")
      router.refresh()
    } catch {
      setError("Network error. Please retry.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Manual review action</h3>
        {flagged ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
            <Flag className="w-3.5 h-3.5" /> Flagged
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" /> Not flagged
          </span>
        )}
      </div>

      {flagged && flaggedReason && (
        <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-[12px] text-rose-700">
          Current flag reason: {flaggedReason}
        </p>
      )}

      <p className="text-[11.5px] leading-relaxed text-slate-500">
        Flagging records an explicit, audited admin action. It is a note for human review, not an
        automated enforcement step or an accusation.
      </p>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder={flagged ? "Reason for clearing (optional)…" : "Reason for flagging (required)…"}
        className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
      />

      {error && <p className="text-[12px] text-rose-600">{error}</p>}

      <div className="flex items-center gap-2">
        {!flagged ? (
          <button
            onClick={() => submit("flag")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
            Flag for review
          </button>
        ) : (
          <button
            onClick={() => submit("clear")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            Clear flag
          </button>
        )}
      </div>
    </div>
  )
}
