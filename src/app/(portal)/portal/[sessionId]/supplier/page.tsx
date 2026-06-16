import Link from "next/link"
import {
  Briefcase, Calendar, AlertCircle, ChevronRight,
  Building2, User, PoundSterling, FileText, Wrench, FolderOpen,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../_guard"
import { getSupplierJobs, getSupplierInvoices } from "@/lib/portal/data"
import {
  formatMoney, formatDate, jobStatusMeta, invoiceStatusMeta, isOpenJob,
} from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export default async function SupplierPortalHome({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`

  // Scoped server reads — strictly bound to this supplier contact.
  const [jobs, invoices] = await Promise.all([
    getSupplierJobs(session),
    getSupplierInvoices(session),
  ])

  const assignedJobs = jobs.length
  const inProgress = jobs.filter((j) => j.status === "in_progress").length
  const awaitingQuote = jobs.filter((j) =>
    ["supplier_requested", "scoped"].includes(j.status)
  ).length
  const unpaidInvoices = invoices.filter((i) =>
    ["submitted", "reviewing", "approved"].includes(i.status)
  ).length
  const earnings = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount ?? 0), 0)
  const activeJobs = jobs.filter((j) => isOpenJob(j.status)).slice(0, 4)
  const recentInvoices = invoices.slice(0, 4)

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  const kpis = [
    { label: "Assigned Jobs", value: assignedJobs, colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]", icon: Briefcase },
    { label: "In Progress", value: inProgress, colour: "text-[#0EA5E9]", bg: "bg-[#f0f9ff]", icon: Wrench },
    { label: "Awaiting Quote", value: awaitingQuote, colour: "text-[#d97706]", bg: "bg-[#FFFBEB]", icon: AlertCircle },
    { label: "Unpaid Invoices", value: unpaidInvoices, colour: "text-[#dc2626]", bg: "bg-[#FEF2F2]", icon: FileText },
    { label: "Earnings (Paid)", value: formatMoney(earnings), colour: "text-[#059669]", bg: "bg-[#ECFDF5]", icon: PoundSterling },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{today}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-4 rounded-2xl border-slate-200">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${kpi.bg}`}>
                <Icon className={`w-4 h-4 ${kpi.colour}`} />
              </div>
              <p className={`text-xl font-bold ${kpi.colour}`}>{kpi.value}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">{kpi.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Active Jobs</h2>
          <Link href={`${base}/jobs`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {activeJobs.length === 0 ? (
          <Card className="rounded-2xl border-slate-200">
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">No active jobs</h3>
              <p className="text-xs text-slate-400 mt-1">Jobs assigned to you will appear here.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => {
              const meta = jobStatusMeta(job.status)
              const amount = job.approved_amount ?? job.quoted_amount
              return (
                <Link key={job.id} href={`${base}/jobs/${job.id}`} className="block">
                  <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">{job.title}</span>
                          <Badge variant={meta.variant} dot>{meta.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-500 truncate">
                            {job.propertyLabel || "Address not set"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {job.scheduled_date && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(job.scheduled_date, { day: "numeric", month: "short" })}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <User className="w-3.5 h-3.5" />
                            {job.operatorLabel || "Operator"}
                          </span>
                          {amount != null && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <PoundSterling className="w-3.5 h-3.5" />
                              {formatMoney(amount)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700">
                        View <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Documents quick link */}
      <Link href={`${base}/documents`}>
        <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <FolderOpen className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Documents</p>
            <p className="text-xs text-slate-400">Scope of works and job documents</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Card>
      </Link>

      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Recent Invoices</CardTitle>
          <Link href={`${base}/invoices`} className="text-xs text-[#2563EB] hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No invoices submitted yet.</p>
          ) : (
            <div className="space-y-2.5">
              {recentInvoices.map((inv) => {
                const meta = invoiceStatusMeta(inv.status)
                return (
                  <Link
                    key={inv.id}
                    href={`${base}/invoices`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900">
                        {inv.invoice_number || inv.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDate(inv.submitted_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={meta.variant} dot>{meta.label}</Badge>
                      <span className="text-xs font-semibold text-slate-700">
                        {formatMoney(inv.amount, inv.currency ?? "GBP")}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
