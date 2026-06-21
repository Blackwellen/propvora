import { Building2, Calendar, User, PoundSterling, Tag } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { formatMoney, formatDate, jobStatusMeta } from "@/lib/portal/format"
import type { SupplierJob } from "@/lib/portal/data"
import SignOffButton from "@/app/(portal)/portal/[sessionId]/supplier/jobs/[id]/SignOffButton"

interface SupplierPortalJobDetailOverviewProps {
  job: SupplierJob
  sessionId: string
}

export function SupplierPortalJobDetailOverview({
  job,
  sessionId,
}: SupplierPortalJobDetailOverviewProps) {
  const meta = jobStatusMeta(job.status)
  const amount = job.approved_amount ?? job.quoted_amount

  return (
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
            <Badge variant="outline" size="sm">
              {job.category}
            </Badge>
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
        <div className="pt-2 border-t border-slate-100">
          <SignOffButton jobId={job.id} jobStatus={job.status} sessionId={sessionId} />
        </div>
      </Card>
    </div>
  )
}
