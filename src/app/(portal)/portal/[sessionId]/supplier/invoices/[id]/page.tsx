import Link from "next/link"
import { ArrowLeft, FileText, PoundSterling, Calendar, Briefcase, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { requirePortalSession } from "../../../_guard"
import { getSupplierInvoice } from "@/lib/portal/data-extra"
import { getSupplierJob } from "@/lib/portal/data"
import { formatMoney, formatDate, invoiceStatusMeta } from "@/lib/portal/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function SupplierInvoiceDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string; id: string }>
}) {
  const { sessionId, id } = await params
  const session = await requirePortalSession(sessionId, "supplier")
  const base = `/portal/${session.id}/supplier`
  const invoice = await getSupplierInvoice(session, id)

  if (!invoice) {
    return (
      <div className="space-y-5">
        <Link href={`${base}/invoices`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to invoices
        </Link>
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4"><FileText className="w-7 h-7 text-slate-400" /></div>
            <h3 className="text-base font-semibold text-slate-700">Invoice not available</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">This invoice either doesn&apos;t exist or isn&apos;t one of yours.</p>
          </div>
        </Card>
      </div>
    )
  }

  const meta = invoiceStatusMeta(invoice.status)
  const job = invoice.supplier_job_id ? await getSupplierJob(session, invoice.supplier_job_id) : null

  return (
    <div className="space-y-5">
      <Link href={`${base}/invoices`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to invoices
      </Link>

      <Card className="rounded-2xl border-slate-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Invoice</p>
            <h1 className="text-lg font-bold text-slate-900 truncate">{invoice.invoice_number || `#${invoice.id.slice(0, 8)}`}</h1>
          </div>
          <Badge variant={meta.variant} dot>{meta.label}</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
          <Field icon={PoundSterling} label="Amount" value={formatMoney(invoice.amount, invoice.currency ?? "GBP")} />
          <Field icon={Calendar} label="Submitted" value={formatDate(invoice.submitted_at)} />
          {invoice.approved_at && <Field icon={CheckCircle2} label="Approved" value={formatDate(invoice.approved_at)} />}
          {invoice.paid_at && <Field icon={CheckCircle2} label="Paid" value={formatDate(invoice.paid_at)} />}
        </div>
        {invoice.notes && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{invoice.notes}</p>
          </div>
        )}
      </Card>

      {job && (
        <Link href={`${base}/jobs/${job.id}`}>
          <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4 text-[#2563EB]" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>
              <p className="text-xs text-slate-400">Linked job{job.propertyLabel ? ` · ${job.propertyLabel}` : ""}</p>
            </div>
          </Card>
        </Link>
      )}
    </div>
  )
}

function Field({ icon: Icon, label, value }: { icon: typeof PoundSterling; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5" />
      <div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-semibold text-slate-900">{value}</p></div>
    </div>
  )
}
