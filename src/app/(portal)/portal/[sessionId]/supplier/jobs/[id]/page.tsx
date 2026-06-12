import Link from "next/link"
import {
  ArrowLeft, Building2, Calendar, User, PoundSterling, Briefcase, Tag,
} from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../../../_guard"
import { getSupplierJob } from "@/lib/portal/data"
import { formatMoney, formatDate, jobStatusMeta } from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function SupplierJobDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string; id: string }>
}) {
  const { sessionId, id } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`

  // Strictly scoped fetch: a guessed/other id returns null -> honest empty.
  const job = await getSupplierJob(session, id)

  if (!job) {
    return (
      <div className="space-y-5">
        <Link href={`${base}/jobs`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </Link>
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">Job not available</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              This job either doesn&apos;t exist or isn&apos;t assigned to you.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const meta = jobStatusMeta(job.status)
  const amount = job.approved_amount ?? job.quoted_amount

  return (
    <div className="space-y-5">
      <Link href={`${base}/jobs`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
            <Badge variant={meta.variant} dot>{meta.label}</Badge>
          </div>
          {job.reference && (
            <p className="text-xs text-slate-400 font-mono mt-1">{job.reference}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1.5">Details</h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {job.description || "No description provided."}
            </p>
          </div>
          {job.category && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <Badge variant="outline" size="sm">{job.category}</Badge>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border-slate-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{job.propertyLabel || "Address not set"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{job.operatorLabel || "Operator"}</span>
          </div>
          {job.scheduled_date && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{formatDate(job.scheduled_date)}</span>
            </div>
          )}
          {amount != null && (
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <PoundSterling className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{formatMoney(amount)}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
