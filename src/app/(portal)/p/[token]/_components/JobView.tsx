import { Wrench, AlertCircle, Calendar, Tag } from "lucide-react"
import type { ShareGrant } from "@/lib/portal/share"
import type { ShareJob } from "@/lib/portal/share-data"

function money(n: number | null): string {
  if (n == null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n)
}
function date(iso: string | null): string {
  if (!iso) return "Not scheduled"
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

const STATUS_CLS: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-[var(--color-brand-100)] text-[var(--brand)]",
  scheduled: "bg-sky-100 text-sky-700",
  on_hold: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
}

export function JobView({ job }: { grant: ShareGrant; job: ShareJob | null }) {
  if (!job) {
    return (
      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center">
        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">This job is no longer available.</p>
        <p className="text-xs text-slate-400 mt-1">It may have been removed. Please contact the sender.</p>
      </section>
    )
  }

  const statusCls = STATUS_CLS[job.status ?? ""] ?? "bg-slate-100 text-slate-500"

  return (
    <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{job.title || "Job"}</p>
            {job.reference && <p className="text-xs text-slate-400">Ref {job.reference}</p>}
          </div>
        </div>
        {job.status && (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusCls}`}>
            {job.status.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {job.description && (
        <div className="p-5 border-b border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      <dl className="divide-y divide-slate-50">
        <Row label="Scheduled" value={date(job.scheduledDate)} icon={<Calendar className="w-3.5 h-3.5" />} />
        {job.category && <Row label="Category" value={job.category} icon={<Tag className="w-3.5 h-3.5" />} />}
        {job.quotedAmount != null && <Row label="Quoted" value={money(job.quotedAmount)} />}
      </dl>
    </section>
  )
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <dt className="inline-flex items-center gap-1.5 text-sm text-slate-500">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </dt>
      <dd className="text-sm font-medium text-slate-700 capitalize">{value}</dd>
    </div>
  )
}
