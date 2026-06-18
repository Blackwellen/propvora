"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { setGlobalFlag } from "@/lib/admin/mutations"

/**
 * Client toggle for a single global feature flag. Opens a confirm modal (with a
 * reason field + a high-risk warning) before calling the server action, then
 * refreshes so the new state + audit entry are reflected.
 */
export default function FlagToggle({
  flagKey,
  label,
  enabled,
  risk,
  blocked,
  blockedReason,
}: {
  flagKey: string
  label: string
  enabled: boolean
  risk: "low" | "medium" | "high"
  /** True when a parent dependency is off (cannot be enabled). */
  blocked?: boolean
  blockedReason?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const next = !enabled
  const canToggleOn = !(blocked && next)

  async function confirm() {
    setBusy(true)
    setError(null)
    const res = await setGlobalFlag(flagKey, next, reason.trim() || undefined)
    setBusy(false)
    if (!res.ok) { setError(res.error ?? "Failed"); return }
    setOpen(false)
    setReason("")
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
        disabled={!canToggleOn}
        onClick={() => { setError(null); setOpen(true) }}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40",
          enabled ? "bg-[#2563EB]" : "bg-slate-200",
          !canToggleOn && "opacity-40 cursor-not-allowed"
        )}
        title={!canToggleOn ? blockedReason : undefined}
      >
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", enabled && "translate-x-5")} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !busy && setOpen(false)} />
          <div role="alertdialog" aria-modal="true" className="relative w-full max-w-md bg-white rounded-2xl border border-[#E2EAF6] shadow-2xl p-6">
            <h3 className="text-[16px] font-bold text-[#0B1B3F]">{next ? "Enable" : "Disable"} {label}?</h3>
            <p className="mt-2 text-[13.5px] text-slate-500">
              This changes the GLOBAL flag for every workspace. {next ? "Enabling lights up this surface across the platform." : "Disabling hides this surface everywhere it isn't workspace-overridden."}
            </p>
            {risk === "high" && (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
                <strong>High-risk flag.</strong> {next ? "Confirm payment/escrow/data-exposure readiness and the release gate before enabling." : "Surfaces depending on this will stop working."}
              </div>
            )}
            <label className="block mt-4 text-[12px] font-semibold text-slate-500">Reason {risk === "high" && <span className="text-red-500">(recommended)</span>}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why is this changing? (recorded in the audit log)"
              className="mt-1 w-full rounded-xl border border-[#E2EAF6] bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] resize-y"
            />
            {error && <p className="mt-2 text-[12.5px] text-red-600">{error}</p>}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setOpen(false)} disabled={busy} className="h-9 px-4 rounded-xl border border-[#E2EAF6] text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={confirm} disabled={busy} className={cn("h-9 px-4 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50", next ? (risk === "high" ? "bg-red-600 hover:bg-red-700" : "bg-[#2563EB] hover:bg-[#1d4ed8]") : "bg-slate-700 hover:bg-slate-800")}>
                {busy ? "Saving…" : next ? "Enable" : "Disable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
