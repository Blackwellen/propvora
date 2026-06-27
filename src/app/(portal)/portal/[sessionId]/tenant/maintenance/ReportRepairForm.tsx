"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, X, CheckCircle } from "lucide-react"
import { reportRepairAction } from "@/lib/portal/tenant-actions"
import type { NewMaintenanceRequest } from "@/lib/portal/data-extra"

const PRIORITIES: NewMaintenanceRequest["priority"][] = ["low", "medium", "high", "urgent"]

export default function ReportRepairForm({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<NewMaintenanceRequest["priority"]>("medium")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    const res = await reportRepairAction(sessionId, { title, description, priority })
    setSubmitting(false)
    if (res.ok) {
      setDone(true)
      setTitle(""); setDescription(""); setPriority("medium")
      router.refresh()
      setTimeout(() => { setDone(false); setOpen(false) }, 1400)
    } else {
      setError(res.error)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0D1B2A] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#0b1622] transition-colors"
      >
        <Plus className="w-4 h-4" /> Report a repair
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[14px] font-bold text-slate-900">Report a repair</p>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-4 h-4" /></button>
      </div>

      {done ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4" /> Request submitted — your property manager has been notified.
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">What's the issue?</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leaking kitchen tap" className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-brand-100)]" />
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">Details (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Where is it, when did it start, any access notes…" className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none resize-none focus:ring-2 focus:ring-[var(--color-brand-100)]" />
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">Priority</label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button key={p} onClick={() => setPriority(p)} className={`capitalize rounded-lg px-3 py-1.5 text-[12px] font-semibold border ${priority === p ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
              ))}
            </div>
          </div>
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={submit} disabled={submitting || !title.trim()} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white ${submitting || !title.trim() ? "bg-slate-300" : "bg-[#0D1B2A] hover:bg-[#0b1622]"}`}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}{submitting ? "Submitting…" : "Submit request"}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
