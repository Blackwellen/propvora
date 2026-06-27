"use client"

import { Briefcase, Building2, CheckCircle2 } from "lucide-react"
import { moneyPence } from "@/components/supplier-workspace/format"

export interface BillableJob {
  id: string
  ref: string
  title: string
  customer: string
  workspace: string
  defaultPence: number
}

export interface InvoiceStep1JobCustomerProps {
  jobs: BillableJob[]
  selectedJobId: string | null
  onSelectJob: (job: BillableJob) => void
}

export function InvoiceStep1JobCustomer({ jobs, selectedJobId, onSelectJob }: InvoiceStep1JobCustomerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Select a completed job</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Invoices are raised against completed jobs so the customer and workspace are pre-filled.
        </p>
      </div>
      <div className="space-y-2">
        {jobs.map((j) => {
          const active = j.id === selectedJobId
          return (
            <button
              key={j.id}
              onClick={() => onSelectJob(j)}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                active
                  ? "border-[var(--brand)] ring-2 ring-[var(--color-brand-100)] bg-[var(--brand-soft)]/40"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{j.title}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {j.workspace} · {j.customer}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700 shrink-0">{moneyPence(j.defaultPence)}</span>
                {active && <CheckCircle2 className="w-5 h-5 text-[var(--brand)] shrink-0" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
