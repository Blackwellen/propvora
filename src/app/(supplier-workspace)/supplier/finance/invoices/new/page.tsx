"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/finance/invoices/new — Invoice Creation Wizard (manifest 48-50).

   Step 1 Job + Customer · Step 2 Line items · Step 3 Review & send. A right
   live INVOICE preview + readiness checklist mirror the images. Submitting is a
   typed stub (toast + audit TODO) until POST /api/supplier/invoices lands.
   `?step=` deep-links the entry step. Reuses SupplierWizardShell (no new chrome).
─────────────────────────────────────────────────────────────────────────── */

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Briefcase, ListChecks, Send, FileText } from "lucide-react"
import { SupplierWizardShell, type WizardStepMeta } from "@/components/supplier-workspace/wizard/SupplierWizardShell"
import { moneyPence } from "@/components/supplier-workspace/format"

// Extracted wizard step components
import {
  InvoiceStep1JobCustomer,
  type BillableJob,
} from "@/features/supplier/finance/components/invoice-wizard/InvoiceStep1JobCustomer"
import {
  InvoiceStep2LineItems,
  type InvoiceLine,
} from "@/features/supplier/finance/components/invoice-wizard/InvoiceStep2LineItems"
import { InvoiceStep3Review } from "@/features/supplier/finance/components/invoice-wizard/InvoiceStep3Review"
import { InvoiceWizardProgress } from "@/features/supplier/finance/components/invoice-wizard/InvoiceWizardProgress"

const VAT_RATE = 0.2

const STEPS: WizardStepMeta[] = [
  { label: "Job & customer", subtitle: "What you're billing for", icon: Briefcase },
  { label: "Line items", subtitle: "Itemise the work", icon: ListChecks },
  { label: "Review & send", subtitle: "Confirm and send", icon: Send },
]

const COMPLETED_JOBS: BillableJob[] = []

export default function SupplierNewInvoicePage() {
  return <Suspense fallback={null}><NewInvoiceInner /></Suspense>
}

function NewInvoiceInner() {
  const router = useRouter()
  const params = useSearchParams()
  const stepParam = params.get("step")
  const initialStep = stepParam === "line-items" ? 1 : stepParam === "review" ? 2 : 0

  const [current, setCurrent] = useState(initialStep)
  const [finishing, setFinishing] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [includeVat, setIncludeVat] = useState(true)
  const [lines, setLines] = useState<InvoiceLine[]>([])

  const job = COMPLETED_JOBS.find((j) => j.id === jobId) ?? null

  function selectJob(j: BillableJob) {
    setJobId(j.id)
    setLines([{ id: `l-${Date.now()}`, description: j.title, qty: 1, unitPence: j.defaultPence }])
  }

  const netPence = lines.reduce((s, l) => s + l.qty * l.unitPence, 0)
  const vatPence = includeVat ? Math.round(netPence * VAT_RATE) : 0
  const grossPence = netPence + vatPence

  const readiness = useMemo(() => [
    { label: "Job selected", ok: !!job },
    { label: "At least one line item", ok: lines.length > 0 },
    { label: "Total is greater than zero", ok: netPence > 0 },
    { label: "Customer & workspace resolved", ok: !!job },
  ], [job, lines.length, netPence])

  const canContinue = current === 0 ? !!job : current === 1 ? lines.length > 0 && netPence > 0 : readiness.every((r) => r.ok)

  function back() { router.push("/supplier/finance?tab=invoices") }

  async function submit() {
    setFinishing(true)
    // STUB: TODO(supplier-invoices) POST /api/supplier/invoices then audit
    // `invoice.created`. Optimistic redirect for now.
    setTimeout(() => router.push("/supplier/finance?tab=invoices"), 600)
  }

  const livePanel = (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Invoice</span>
          <FileText className="w-4 h-4 text-slate-300" />
        </div>
        {job ? (
          <>
            <p className="text-sm font-semibold text-slate-900">{job.workspace}</p>
            <p className="text-xs text-slate-400">{job.customer} · {job.ref}</p>
          </>
        ) : (
          <p className="text-sm text-slate-400">Select a job to bill</p>
        )}
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Net</dt>
            <dd className="font-semibold text-slate-800">{moneyPence(netPence)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">VAT {includeVat ? "(20%)" : "(none)"}</dt>
            <dd className="font-semibold text-slate-800">{moneyPence(vatPence)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5">
            <dt className="text-slate-600 font-medium">Total</dt>
            <dd className="font-bold text-slate-900">{moneyPence(grossPence)}</dd>
          </div>
        </dl>
      </div>
      <InvoiceWizardProgress items={readiness} />
    </div>
  )

  return (
    <SupplierWizardShell
      title="Invoice creation"
      steps={STEPS}
      current={current}
      onStepSelect={setCurrent}
      onClose={back}
      onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
      onNext={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
      onFinish={submit}
      canContinue={canContinue}
      finishing={finishing}
      finishLabel="Send invoice"
      livePanel={livePanel}
    >
      {current === 0 && (
        <InvoiceStep1JobCustomer
          jobs={COMPLETED_JOBS}
          selectedJobId={jobId}
          onSelectJob={selectJob}
        />
      )}
      {current === 1 && (
        <InvoiceStep2LineItems
          lines={lines}
          includeVat={includeVat}
          onLinesChange={setLines}
          onIncludeVatChange={setIncludeVat}
        />
      )}
      {current === 2 && (
        <InvoiceStep3Review job={job} lines={lines} includeVat={includeVat} />
      )}
    </SupplierWizardShell>
  )
}
