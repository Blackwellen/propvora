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
import {
  Briefcase, ListChecks, Send, CheckCircle2, Circle, Plus, Trash2, Building2, FileText,
} from "lucide-react"
import { SupplierWizardShell, type WizardStepMeta } from "@/components/supplier-workspace/wizard/SupplierWizardShell"
import { moneyPence } from "@/components/supplier-workspace/format"

const VAT_RATE = 0.2

const STEPS: WizardStepMeta[] = [
  { label: "Job & customer", subtitle: "What you're billing for", icon: Briefcase },
  { label: "Line items", subtitle: "Itemise the work", icon: ListChecks },
  { label: "Review & send", subtitle: "Confirm and send", icon: Send },
]

interface BillableJob {
  id: string
  ref: string
  title: string
  customer: string
  workspace: string
  defaultPence: number
}

const COMPLETED_JOBS: BillableJob[] = [
  { id: "JOB-2025-0421", ref: "JOB-2025-0421", title: "Annual boiler service", customer: "Priya Nair", workspace: "Priya & Co Property Management", defaultPence: 16500 },
  { id: "JOB-2025-0418", ref: "JOB-2025-0418", title: "Communal lighting repair", customer: "Daniel Osei", workspace: "Osei Lettings", defaultPence: 84000 },
  { id: "JOB-2025-0402", ref: "JOB-2025-0402", title: "Bathroom leak — emergency", customer: "Sarah Mitchell", workspace: "JT Property Manager", defaultPence: 257500 },
]

interface Line { id: string; description: string; qty: number; unitPence: number }

function poundsToPence(s: string): number {
  const n = Number(s.replace(/[^\d.]/g, ""))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

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
  const [lines, setLines] = useState<Line[]>([])

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
          <div className="flex justify-between"><dt className="text-slate-500">Net</dt><dd className="font-semibold text-slate-800">{moneyPence(netPence)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">VAT {includeVat ? "(20%)" : "(none)"}</dt><dd className="font-semibold text-slate-800">{moneyPence(vatPence)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-1.5"><dt className="text-slate-600 font-medium">Total</dt><dd className="font-bold text-slate-900">{moneyPence(grossPence)}</dd></div>
        </dl>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Readiness</p>
        <ul className="space-y-2">
          {readiness.map((r) => (
            <li key={r.label} className="flex items-start gap-2 text-xs">
              {r.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />}
              <span className={r.ok ? "text-slate-600" : "text-slate-400"}>{r.label}</span>
            </li>
          ))}
        </ul>
      </div>
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
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Select a completed job</h2>
            <p className="text-sm text-slate-500 mt-0.5">Invoices are raised against completed jobs so the customer and workspace are pre-filled.</p>
          </div>
          <div className="space-y-2">
            {COMPLETED_JOBS.map((j) => {
              const active = j.id === jobId
              return (
                <button key={j.id} onClick={() => selectJob(j)} className={`w-full text-left rounded-xl border p-4 transition-all ${active ? "border-[#2563EB] ring-2 ring-blue-100 bg-blue-50/40" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{j.title}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" />{j.workspace} · {j.customer}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 shrink-0">{moneyPence(j.defaultPence)}</span>
                    {active && <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {current === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Line items</h2>
            <p className="text-sm text-slate-500 mt-0.5">Itemise labour, materials and any extras. VAT applies to the total.</p>
          </div>
          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5">
                <input
                  value={l.description}
                  onChange={(e) => setLines((ls) => ls.map((x) => x.id === l.id ? { ...x, description: e.target.value } : x))}
                  placeholder="Description"
                  className="flex-1 min-w-0 text-sm outline-none px-1"
                />
                <input
                  type="number" min={1} value={l.qty}
                  onChange={(e) => setLines((ls) => ls.map((x) => x.id === l.id ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x))}
                  className="w-14 text-sm text-right outline-none border border-slate-200 rounded-lg px-2 py-1"
                  aria-label="Quantity"
                />
                <div className="flex items-center border border-slate-200 rounded-lg px-2 py-1 w-28">
                  <span className="text-slate-400 text-sm">£</span>
                  <input
                    inputMode="decimal" defaultValue={(l.unitPence / 100).toFixed(2)}
                    onChange={(e) => setLines((ls) => ls.map((x) => x.id === l.id ? { ...x, unitPence: poundsToPence(e.target.value) } : x))}
                    className="w-full text-sm text-right outline-none"
                    aria-label="Unit price"
                  />
                </div>
                <span className="w-20 text-right text-sm font-semibold text-slate-800 shrink-0">{moneyPence(l.qty * l.unitPence)}</span>
                <button onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))} className="p-1.5 text-slate-300 hover:text-red-500 shrink-0" aria-label="Remove line"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => setLines((ls) => [...ls, { id: `l-${Date.now()}`, description: "", qty: 1, unitPence: 0 }])} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-blue-700 px-1 py-1.5">
              <Plus className="w-4 h-4" /> Add line item
            </button>
          </div>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span><span className="text-sm font-medium text-slate-800">Add VAT at 20%</span><span className="block text-xs text-slate-400">Adds {moneyPence(Math.round(netPence * VAT_RATE))} to the total</span></span>
            <input type="checkbox" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} className="w-5 h-5 accent-[#2563EB]" />
          </label>
        </div>
      )}

      {current === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Review &amp; send</h2>
            <p className="text-sm text-slate-500 mt-0.5">Check the invoice before sending it to {job?.workspace ?? "the operator"}.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
              <div><p className="text-xs text-slate-400">Bill to</p><p className="text-sm font-semibold text-slate-900">{job?.workspace ?? "—"}</p></div>
              <div className="text-right"><p className="text-xs text-slate-400">Job</p><p className="text-sm font-semibold text-slate-900">{job?.ref ?? "—"}</p></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100"><th className="px-4 py-2">Description</th><th className="px-4 py-2 text-right">Qty</th><th className="px-4 py-2 text-right">Unit</th><th className="px-4 py-2 text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {lines.map((l) => (
                  <tr key={l.id}><td className="px-4 py-2.5 text-slate-800">{l.description || "—"}</td><td className="px-4 py-2.5 text-right text-slate-600">{l.qty}</td><td className="px-4 py-2.5 text-right text-slate-600">{moneyPence(l.unitPence)}</td><td className="px-4 py-2.5 text-right font-semibold text-slate-900">{moneyPence(l.qty * l.unitPence)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Net</span><span className="font-semibold text-slate-800">{moneyPence(netPence)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">VAT {includeVat ? "(20%)" : ""}</span><span className="font-semibold text-slate-800">{moneyPence(vatPence)}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-slate-600">Total due</span><span className="text-base font-bold text-slate-900">{moneyPence(grossPence)}</span></div>
            </div>
          </div>
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 px-4 py-3 text-xs text-blue-700">
            The operator reviews and approves your invoice; payout follows once payment is released and all escrow conditions are met.
          </div>
        </div>
      )}
    </SupplierWizardShell>
  )
}
