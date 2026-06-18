import Link from "next/link"
import { ArrowLeft, ClipboardList, Calendar } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../../_guard"
import { getTenantMaintenance } from "@/lib/portal/data"
import { formatDate } from "@/lib/portal/format"
import ReportRepairForm from "./ReportRepairForm"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Tenant-facing maintenance status labels (read-only view of their requests).
const STATUS: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "sky" | "ai" }> = {
  new: { label: "Submitted", variant: "sky" },
  scoped: { label: "Reviewing", variant: "sky" },
  supplier_requested: { label: "Arranging", variant: "warning" },
  quote_received: { label: "Arranging", variant: "ai" },
  approved: { label: "Approved", variant: "primary" },
  scheduled: { label: "Scheduled", variant: "primary" },
  in_progress: { label: "In Progress", variant: "primary" },
  complete: { label: "Resolved", variant: "success" },
  invoiced: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "default" },
  disputed: { label: "Disputed", variant: "danger" },
}

export default async function TenantMaintenancePage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "tenant")
  const base = `/portal/${session.id}/tenant`
  const jobs = await getTenantMaintenance(session)

  return (
    <div className="space-y-5">
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <div>
        <h1 className="text-xl font-bold text-slate-900">Maintenance requests</h1>
        <p className="text-sm text-slate-500">
          {jobs.length} request{jobs.length === 1 ? "" : "s"} on your tenancy
        </p>
      </div>

      <ReportRepairForm sessionId={session.id} />

      {jobs.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">No requests yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Maintenance requests raised for your home will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const meta = STATUS[job.status] ?? { label: job.status, variant: "default" as const }
            return (
              <Card key={job.id} className="p-4 rounded-2xl border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {job.scheduled_date ? formatDate(job.scheduled_date) : formatDate(job.created_at)}
                      </span>
                    </div>
                  </div>
                  <Badge variant={meta.variant} dot>{meta.label}</Badge>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
