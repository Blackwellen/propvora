import { FileText, AlertCircle } from "lucide-react"
import type { ShareGrant } from "@/lib/portal/share"
import type { ShareInvoice } from "@/lib/portal/share-data"

function money(n: number | null, currency: string | null): string {
  if (n == null) return "—"
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: (currency || "GBP").toUpperCase(),
    }).format(n)
  } catch {
    return `£${n.toFixed(2)}`
  }
}

function date(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const STATUS_CLS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  sent: "bg-blue-100 text-blue-700",
  draft: "bg-slate-100 text-slate-500",
}

export function InvoiceView({
  invoice,
}: {
  grant: ShareGrant
  invoice: ShareInvoice | null
}) {
  if (!invoice) {
    return (
      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center">
        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">This invoice is no longer available.</p>
        <p className="text-xs text-slate-400 mt-1">It may have been removed. Please contact the sender.</p>
      </section>
    )
  }

  const statusCls = STATUS_CLS[invoice.status ?? ""] ?? "bg-slate-100 text-slate-500"

  return (
    <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {invoice.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : "Invoice"}
            </p>
            <p className="text-xs text-slate-400">Issued {date(invoice.issueDate)}</p>
          </div>
        </div>
        {invoice.status && (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusCls}`}>
            {invoice.status}
          </span>
        )}
      </div>

      <dl className="divide-y divide-slate-50">
        <Row label="Amount due" value={money(invoice.total, invoice.currency)} strong />
        <Row label="Due date" value={date(invoice.dueDate)} />
        <Row label="Paid" value={money(invoice.paidAmount, invoice.currency)} />
      </dl>

      {invoice.notes && (
        <div className="p-5 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </section>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={strong ? "text-base font-bold text-slate-900" : "text-sm font-medium text-slate-700"}>{value}</dd>
    </div>
  )
}
