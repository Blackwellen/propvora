"use client"

import { useState } from "react"
import { Send, Calendar, Banknote, X } from "lucide-react"
import { humaniseStatus } from "@/components/supplier-workspace/ui"
import type { SupplierQuoteRequest } from "@/components/supplier-workspace/types"

interface SubmitQuotePanelProps {
  request: SupplierQuoteRequest
  onClose: () => void
  onSubmitted: () => void
}

export function SubmitQuotePanel({ request, onClose, onSubmitted }: SubmitQuotePanelProps) {
  const [amount, setAmount] = useState("")
  const [days, setDays] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/supplier/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quote_request_id: request.id,
          amount: amount ? Number(amount) : null,
          estimated_days: days ? Number(days) : null,
          message,
        }),
      })
      if (!res.ok) {
        setError(
          res.status === 503 || res.status === 404
            ? "The quotes service isn't available yet."
            : "Couldn't submit your quote. Please try again."
        )
        return
      }
      onSubmitted()
    } catch {
      setError("Network error — please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Submit quote"
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">Submit a quote</h2>
            <p className="text-sm text-slate-500 truncate">
              {request.category
                ? humaniseStatus(request.category)
                : (request.reference ?? "Quote request")}{" "}
              · {request.property_label ?? "Property"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {request.description && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Scope
              </p>
              <p className="text-sm text-slate-700">{request.description}</p>
            </div>
          )}

          <Field label="Quote amount" icon={Banknote}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">£</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30"
              />
            </div>
          </Field>

          <Field label="Estimated days to complete" icon={Calendar}>
            <input
              type="number"
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="e.g. 2"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30"
            />
          </Field>

          <Field label="Message to the property manager">
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what's included, materials, access needs…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/30"
            />
          </Field>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div
          className="p-4 border-t border-slate-100 flex items-center gap-2"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
        >
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !amount}
            className="flex-1 h-11 rounded-xl bg-[var(--brand)] text-white font-semibold text-sm hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send quote
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon?: typeof Send
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        {label}
      </label>
      {children}
    </div>
  )
}
