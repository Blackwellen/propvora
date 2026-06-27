"use client"

import React, { useMemo, useState } from "react"
import { PoundSterling, FileText, CheckCircle2, Sparkles, CalendarClock } from "lucide-react"
import { SupplierWizardShell, type WizardStepMeta } from "@/components/supplier-workspace/wizard/SupplierWizardShell"
import { formatPence } from "@/lib/marketplace/money"
import type { PipelineRequest } from "../data/types"
import { useToast } from "./primitives"

/* ──────────────────────────────────────────────────────────────────────────
   QuoteBuilderWizard — the supplier's core conversion flow. Prices a request,
   captures terms + a covering message, then submits the quote against the real
   `/api/supplier/quotes/[id]` endpoint (action: "submit") when the request is
   backed by a live quote row. Seed/demo rows (no quoteId) fall back to an
   optimistic confirmation so the flow is always exercisable.

   Three steps: Pricing → Scope & message → Review & send.
─────────────────────────────────────────────────────────────────────────── */

const VAT_RATE = 0.2

const STEPS: WizardStepMeta[] = [
  { label: "Pricing", subtitle: "Set your price & VAT", icon: PoundSterling },
  { label: "Scope & message", subtitle: "What's included", icon: FileText },
  { label: "Review & send", subtitle: "Confirm and submit", icon: CheckCircle2 },
]

function poundsToPence(p: string): number {
  const n = Number(p.replace(/[^\d.]/g, ""))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export function QuoteBuilderWizard({
  request,
  mode = "new",
  onClose,
  onSubmitted,
}: {
  request: PipelineRequest
  mode?: "new" | "revise"
  onClose: () => void
  onSubmitted?: () => void
}) {
  const { push } = useToast()
  const rec = request.recommendation

  const [current, setCurrent] = useState(0)
  const [finishing, setFinishing] = useState(false)

  // Pre-fill from the recommendation (or the existing quote when revising).
  const seedPence = request.quoteAmountPence ?? rec.suggestedPricePence ?? null
  const [pounds, setPounds] = useState(seedPence != null ? (seedPence / 100).toFixed(2) : "")
  const [includeVat, setIncludeVat] = useState(true)
  const [validDays, setValidDays] = useState(14)
  const [message, setMessage] = useState(
    request.scopeSummary ? `Quote for: ${request.scopeSummary}` : ""
  )

  const netPence = poundsToPence(pounds)
  const vatPence = includeVat ? Math.round(netPence * VAT_RATE) : 0
  const grossPence = netPence + vatPence
  const validUntil = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + validDays)
    return d
  }, [validDays])

  const canContinue = current === 0 ? netPence > 0 : true

  async function submit() {
    setFinishing(true)
    try {
      if (request.quoteId) {
        const res = await fetch(`/api/supplier/quotes/${request.quoteId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            amountPence: netPence,
            validUntil: validUntil.toISOString(),
            description: message.trim() || undefined,
          }),
        })
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null
          push("error", j?.error ?? "Couldn't send the quote. Please try again.")
          setFinishing(false)
          return
        }
      }
      push("success", mode === "revise" ? "Revised quote sent" : "Quote sent to requester")
      onSubmitted?.()
      onClose()
    } catch {
      push("error", "Network error — your quote was not sent.")
      setFinishing(false)
    }
  }

  const livePanel = (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Quote summary</p>
        <p className="text-sm font-semibold text-slate-900 mt-1">{request.serviceTitle}</p>
        <p className="text-xs text-slate-500">{request.requesterCompany}</p>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-slate-500">Net</dt><dd className="font-semibold text-slate-800">{formatPence(netPence)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">VAT {includeVat ? "(20%)" : "(none)"}</dt><dd className="font-semibold text-slate-800">{formatPence(vatPence)}</dd></div>
        <div className="flex justify-between border-t border-slate-200 pt-2"><dt className="text-slate-600 font-medium">Total</dt><dd className="font-bold text-slate-900">{formatPence(grossPence)}</dd></div>
      </dl>
      <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-1.5">
        <p className="text-[11px] text-slate-400 flex items-center gap-1"><CalendarClock className="w-3 h-3" />Valid until</p>
        <p className="text-sm font-semibold text-slate-800">{validUntil.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>
      {rec.winProbabilityPct != null && (
        <div className="rounded-xl bg-[var(--brand-soft)]/60 border border-[var(--color-brand-100)] p-3">
          <p className="text-[11px] text-[var(--brand)] flex items-center gap-1"><Sparkles className="w-3 h-3" />Win probability</p>
          <p className="text-lg font-bold text-[var(--brand)]">{rec.winProbabilityPct}%</p>
        </div>
      )}
    </div>
  )

  return (
    <SupplierWizardShell
      title={mode === "revise" ? "Revise quote" : "Quote builder"}
      steps={STEPS}
      current={current}
      onStepSelect={setCurrent}
      onClose={onClose}
      onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
      onNext={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
      onFinish={submit}
      canContinue={canContinue}
      finishing={finishing}
      finishLabel={mode === "revise" ? "Send revised quote" : "Send quote"}
      livePanel={livePanel}
    >
      {current === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Set your price</h2>
            <p className="text-sm text-slate-500 mt-0.5">Enter your net price. We&apos;ll calculate VAT and the total automatically.</p>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Net price (£) <span className="text-red-500">*</span></span>
            <div className="mt-1.5 flex items-center rounded-xl border border-slate-200 focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand-100)] overflow-hidden">
              <span className="px-3 text-slate-400"><PoundSterling className="w-4 h-4" /></span>
              <input
                type="text"
                inputMode="decimal"
                value={pounds}
                onChange={(e) => setPounds(e.target.value)}
                placeholder="0.00"
                className="flex-1 py-2.5 pr-3 text-sm outline-none"
                autoFocus
              />
            </div>
            {rec.suggestedPricePence != null && (
              <button
                type="button"
                onClick={() => setPounds((rec.suggestedPricePence! / 100).toFixed(2))}
                className="mt-2 text-xs font-medium text-[var(--brand)] hover:text-[var(--brand)]"
              >
                Use suggested {formatPence(rec.suggestedPricePence)}
                {rec.marginEstPct != null ? ` · ~${rec.marginEstPct}% margin` : ""}
              </button>
            )}
          </label>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span>
              <span className="text-sm font-medium text-slate-800">Add VAT at 20%</span>
              <span className="block text-xs text-slate-400">Adds {formatPence(includeVat ? Math.round(netPence * VAT_RATE) : Math.round(netPence * VAT_RATE))} to the total</span>
            </span>
            <input
              type="checkbox"
              checked={includeVat}
              onChange={(e) => setIncludeVat(e.target.checked)}
              className="w-5 h-5 accent-[var(--brand)]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Quote valid for</span>
            <div className="mt-1.5 flex gap-2">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setValidDays(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${validDays === d ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </label>
        </div>
      )}

      {current === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Scope &amp; covering message</h2>
            <p className="text-sm text-slate-500 mt-0.5">Tell the requester what&apos;s included. This appears with your quote.</p>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Message to requester</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              placeholder="Describe what's included, timelines, and any assumptions…"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--color-brand-100)] resize-none"
            />
          </label>
          {request.scopeBullets.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">Requested scope</p>
              <ul className="space-y-1.5">
                {request.scopeBullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {current === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Review &amp; send</h2>
            <p className="text-sm text-slate-500 mt-0.5">Check everything looks right before sending to {request.requesterCompany}.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
            <Row k="Service" v={request.serviceTitle} />
            <Row k="Requester" v={request.requesterCompany} />
            <Row k="Net price" v={formatPence(netPence)} />
            <Row k="VAT" v={includeVat ? `${formatPence(vatPence)} (20%)` : "None"} />
            <Row k="Total" v={formatPence(grossPence)} strong />
            <Row k="Valid until" v={validUntil.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
          </div>
          {message.trim() && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Your message</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{message.trim()}</p>
            </div>
          )}
          {!request.quoteId && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              This is a preview request — sending will confirm the flow without a live quote record.
            </p>
          )}
        </div>
      )}
    </SupplierWizardShell>
  )
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-500">{k}</span>
      <span className={strong ? "text-base font-bold text-slate-900" : "text-sm font-semibold text-slate-800"}>{v}</span>
    </div>
  )
}
