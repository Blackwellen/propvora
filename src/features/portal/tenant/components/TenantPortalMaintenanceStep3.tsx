"use client"

/**
 * TenantPortalMaintenanceStep3
 *
 * Step 3 of the tenant repair reporting wizard: review and submit.
 */
import { CheckCircle, Loader2 } from "lucide-react"
import type { NewMaintenanceRequest } from "@/lib/portal/data-extra"

interface Props {
  title: string
  description: string
  priority: NewMaintenanceRequest["priority"]
  accessNotes: string
  preferredDate: string
  submitting: boolean
  error: string | null
  done: boolean
  onSubmit: () => void
  onBack: () => void
}

export function TenantPortalMaintenanceStep3({ title, description, priority, accessNotes, preferredDate, submitting, error, done, onSubmit, onBack }: Props) {
  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-4 text-sm text-emerald-700">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-semibold">Request submitted</p>
          <p className="text-[12px] mt-0.5">Your property manager has been notified and will be in touch shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-0.5">Step 3 — Review &amp; submit</h2>
        <p className="text-xs text-slate-500">Confirm the details below before sending your request.</p>
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-200 text-sm">
        <Row label="Issue" value={title} />
        {description && <Row label="Details" value={description} />}
        <Row label="Priority" value={<span className="capitalize font-semibold">{priority}</span>} />
        {accessNotes && <Row label="Access notes" value={accessNotes} />}
        {preferredDate && <Row label="Preferred date" value={preferredDate} />}
      </div>

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="rounded-xl border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !title.trim()}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white ${
            submitting || !title.trim() ? "bg-slate-300" : "bg-[#0D1B2A] hover:bg-[#0b1622]"
          }`}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <dt className="w-28 shrink-0 text-[11.5px] font-semibold text-slate-500">{label}</dt>
      <dd className="text-[13px] text-slate-700">{value}</dd>
    </div>
  )
}
