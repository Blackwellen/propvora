"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Download, CheckCircle2, Clock, FileText, Banknote,
  Building2, ExternalLink, PoundSterling,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveSupplierContext, formatMoney, formatDate, invoiceStatusMeta,
} from "../../_lib/supplier-context"

interface PageProps { params: Promise<{ id: string }> }

interface InvoiceDetail {
  id: string
  invoice_number: string | null
  amount: number
  currency: string
  status: string
  submitted_at: string
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  supplier_job_id: string | null
  jobId: string | null
  jobTitle: string | null
  propertyLabel: string | null
}

const TIMELINE_ICONS: Record<string, React.ElementType> = {
  submitted: FileText,
  reviewing: Clock,
  approved: CheckCircle2,
  paid: Banknote,
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function SupplierInvoiceDetailPage({ params }: PageProps) {
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [inv, setInv] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { params.then((p) => setInvoiceId(p.id)) }, [params])

  useEffect(() => {
    if (!invoiceId) return
    async function load() {
      try {
        const supabase = createClient()
        const supplier = await resolveSupplierContext()
        if (!supplier) { setError("No supplier account linked."); setLoading(false); return }

        const { data, error: fetchErr } = await supabase
          .from("supplier_invoices")
          .select("id, invoice_number, amount, currency, status, submitted_at, approved_at, paid_at, notes, supplier_job_id, contact_id")
          .eq("id", invoiceId)
          .maybeSingle()

        if (fetchErr || !data) { setError("Invoice not found."); setLoading(false); return }
        if ((data as Record<string, unknown>).contact_id !== supplier.contactId) {
          setError("You don't have access to this invoice."); setLoading(false); return
        }

        const row = data as Record<string, unknown>
        let jobId: string | null = null
        let jobTitle: string | null = null
        let propertyLabel: string | null = null

        if (row.supplier_job_id) {
          // supplier_job_id references supplier_jobs(id); resolve through to the job (42P01-safe)
          try {
            const { data: sj } = await supabase
              .from("supplier_jobs")
              .select("job_id")
              .eq("id", row.supplier_job_id as string)
              .maybeSingle()
            const linkedJobId = (sj as Record<string, unknown> | null)?.job_id as string | undefined
            if (linkedJobId) {
              const { data: jb } = await supabase
                .from("jobs")
                .select("id, title, property_id")
                .eq("id", linkedJobId)
                .maybeSingle()
              if (jb) {
                const jr = jb as Record<string, unknown>
                jobId = jr.id as string
                jobTitle = (jr.title as string) ?? null
                if (jr.property_id) {
                  const { data: pr } = await supabase
                    .from("properties")
                    .select("nickname, address_line1, city")
                    .eq("id", jr.property_id as string)
                    .maybeSingle()
                  if (pr) {
                    const p = pr as Record<string, unknown>
                    propertyLabel = (p.nickname as string) || [p.address_line1, p.city].filter(Boolean).join(", ") || null
                  }
                }
              }
            }
          } catch { /* tolerate missing supplier_jobs */ }
        }

        setInv({
          id: row.id as string,
          invoice_number: (row.invoice_number as string) ?? null,
          amount: (row.amount as number) ?? 0,
          currency: (row.currency as string) ?? "GBP",
          status: row.status as string,
          submitted_at: row.submitted_at as string,
          approved_at: (row.approved_at as string) ?? null,
          paid_at: (row.paid_at as string) ?? null,
          notes: (row.notes as string) ?? null,
          supplier_job_id: (row.supplier_job_id as string) ?? null,
          jobId, jobTitle, propertyLabel,
        })
      } catch (err) {
        console.error(err)
        setError("Failed to load invoice.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [invoiceId])

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2"><Skeleton className="h-7 w-72" /><Skeleton className="h-4 w-56" /></div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (error || !inv) {
    return (
      <div className="space-y-5">
        <Link href="/supplier-portal/invoices" className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#2563EB]">
          <ArrowLeft className="w-4 h-4" /> Invoices
        </Link>
        <Card className="rounded-2xl border-slate-200">
          <div className="p-6 text-center">
            <p className="text-sm text-slate-600">{error ?? "Invoice not found."}</p>
            <Link href="/supplier-portal/invoices">
              <Button variant="outline" size="sm" className="mt-3">Back to Invoices</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const meta = invoiceStatusMeta(inv.status)
  const ref = inv.invoice_number || inv.id.slice(0, 8).toUpperCase()

  // Honest VAT breakdown: amount is treated as the gross invoice total.
  const gross = inv.amount
  const net = gross / 1.2
  const vat = gross - net

  const timeline = [
    { status: "submitted", label: "Invoice Submitted", date: inv.submitted_at, done: true },
    { status: "reviewing", label: "Under Review", date: null as string | null, done: ["reviewing", "approved", "paid"].includes(inv.status) },
    { status: "approved", label: "Approved", date: inv.approved_at, done: ["approved", "paid"].includes(inv.status) },
    { status: "paid", label: "Payment Processed", date: inv.paid_at, done: inv.status === "paid" },
  ]

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/supplier-portal/invoices" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Invoices
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{ref}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">{ref}</h1>
            <Badge variant={meta.variant} dot>{meta.label}</Badge>
          </div>
          {inv.jobTitle && <p className="text-sm text-slate-500">Job: {inv.jobTitle}</p>}
          <p className="text-xs text-slate-400 mt-0.5">Submitted {formatDate(inv.submitted_at, { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <CardTitle>Invoice Breakdown</CardTitle>
              <span className="text-2xl font-bold text-[#2563EB]">{formatMoney(gross, inv.currency)}</span>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 text-slate-700 text-sm flex items-center gap-2">
                      <PoundSterling className="w-4 h-4 text-slate-400" />
                      {inv.jobTitle ? `Work: ${inv.jobTitle}` : "Invoiced work"}
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-900 text-sm">{formatMoney(net, inv.currency)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200">
                    <td className="pt-3 text-xs text-slate-500">Net</td>
                    <td className="pt-3 text-right text-xs text-slate-700">{formatMoney(net, inv.currency)}</td>
                  </tr>
                  <tr>
                    <td className="pt-1 text-xs text-slate-500">VAT (20%)</td>
                    <td className="pt-1 text-right text-xs text-slate-700">{formatMoney(vat, inv.currency)}</td>
                  </tr>
                  <tr>
                    <td className="pt-2 text-sm font-bold text-slate-900">Total</td>
                    <td className="pt-2 text-right text-base font-bold text-[#2563EB]">{formatMoney(gross, inv.currency)}</td>
                  </tr>
                </tfoot>
              </table>
              <p className="text-[11px] text-slate-400 mt-3">
                VAT shown is an indicative 20% split of the invoice total. Refer to your own VAT
                registration status for the definitive breakdown.
              </p>
            </CardContent>
          </Card>

          {inv.notes && (
            <Card className="rounded-2xl border-slate-200">
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-line">{inv.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {(inv.jobTitle || inv.propertyLabel) && (
            <Card className="rounded-2xl border-slate-200">
              <CardHeader><CardTitle>Linked Job</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {inv.jobTitle && <p className="text-sm font-medium text-slate-800">{inv.jobTitle}</p>}
                {inv.propertyLabel && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />{inv.propertyLabel}
                  </p>
                )}
                {inv.jobId && (
                  <Link href={`/supplier-portal/jobs/${inv.jobId}`}>
                    <Button variant="outline" size="xs" className="mt-2 w-full" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                      View Job
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-slate-200">
            <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeline.map((step) => {
                  const Icon = TIMELINE_ICONS[step.status] || Clock
                  return (
                    <div key={step.status} className="flex items-start gap-3">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", step.done ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400")}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className={cn("text-xs font-medium", step.done ? "text-slate-800" : "text-slate-400")}>{step.label}</p>
                        {step.date ? (
                          <p className="text-[10px] text-slate-400">{formatDate(step.date)}</p>
                        ) : (
                          <p className="text-[10px] text-slate-400">{step.done ? "Done" : "Pending"}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
