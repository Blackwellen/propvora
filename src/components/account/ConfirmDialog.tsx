"use client"

import { useEffect } from "react"
import { Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: "danger" | "primary"
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Lightweight accessible confirmation modal used by the account security
 * and sessions pages for destructive / sensitive actions (sign out of all
 * devices, disable two-factor authentication).
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 id="confirm-dialog-title" className="text-[15px] font-bold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[13px] text-slate-500 leading-relaxed">{description}</p>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-70",
              tone === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#2563EB] hover:bg-[#1d4ed8]",
            )}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
