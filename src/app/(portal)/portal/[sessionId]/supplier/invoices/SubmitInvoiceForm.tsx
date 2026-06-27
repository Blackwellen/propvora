"use client"

import React, { useState } from "react"
import { Plus, Loader2, Check, X } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { submitInvoiceAction } from "@/lib/portal/supplier-actions"
import type { SupplierJob } from "@/lib/portal/data"

interface Props {
  sessionId: string
  jobs: SupplierJob[]
  onSubmitted: () => void
}

export default function SubmitInvoiceForm({ sessionId, jobs, onSubmitted }: Props) {
  const [open, setOpen] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [amountPounds, setAmountPounds] = useState("")
  const [notes, setNotes] = useState("")
  const [jobId, setJobId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountPence = Math.round(parseFloat(amountPounds) * 100)
    if (!amountPounds || isNaN(amountPence) || amountPence <= 0) {
      setMsg({ ok: false, text: "Please enter a valid amount." })
      return
    }
    setSubmitting(true)
    setMsg(null)
    const res = await submitInvoiceAction(sessionId, {
      invoice_number: invoiceNumber.trim() || undefined,
      amount: amountPence,
      currency: "GBP",
      notes: notes.trim() || undefined,
      supplier_job_id: jobId || undefined,
    })
    setSubmitting(false)
    if (res.ok) {
      setMsg({ ok: true, text: "Invoice submitted successfully." })
      setInvoiceNumber(""); setAmountPounds(""); setNotes(""); setJobId("")
      setTimeout(() => { setOpen(false); setMsg(null); onSubmitted() }, 1500)
    } else {
      setMsg({ ok: false, text: res.error })
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-strong)] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Submit invoice
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Submit new invoice</h3>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-100">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Invoice number (optional)"
            placeholder="INV-001"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
          <Input
            label="Amount (£)"
            placeholder="0.00"
            type="number"
            min="0.01"
            step="0.01"
            value={amountPounds}
            onChange={(e) => setAmountPounds(e.target.value)}
            required
          />
        </div>
        {jobs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Link to job (optional)</label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]"
            >
              <option value="">— No job linked —</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title} {j.reference ? `(${j.reference})` : ""}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any additional notes about this invoice…"
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] resize-none"
          />
        </div>
        {msg && (
          <div className={`flex items-center gap-2 text-xs rounded-lg p-2.5 ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {msg.ok ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
            {msg.text}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Submitting…" : "Submit invoice"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
