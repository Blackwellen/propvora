"use client"

import React from "react"

// ─── Status chip ───────────────────────────────────────────────────────────────

interface InvoiceStatusChipProps {
  status: string
}

const STATUS_CONFIGS: Record<string, { label: string; colour: string; bg: string }> = {
  draft:      { label: "Draft",      colour: "text-slate-600",   bg: "bg-slate-100" },
  planned:    { label: "Planned",    colour: "text-violet-600",  bg: "bg-violet-50" },
  scheduled:  { label: "Scheduled",  colour: "text-violet-600",  bg: "bg-violet-50" },
  sent:       { label: "Sent",       colour: "text-blue-600",    bg: "bg-blue-50" },
  viewed:     { label: "Viewed",     colour: "text-blue-600",    bg: "bg-blue-50" },
  due:        { label: "Due",        colour: "text-amber-600",   bg: "bg-amber-50" },
  overdue:    { label: "Overdue",    colour: "text-red-600",     bg: "bg-red-50" },
  part_paid:  { label: "Part Paid",  colour: "text-amber-600",   bg: "bg-amber-50" },
  paid:       { label: "Paid",       colour: "text-emerald-600", bg: "bg-emerald-50" },
  disputed:   { label: "Disputed",   colour: "text-red-600",     bg: "bg-red-50" },
  cancelled:  { label: "Cancelled",  colour: "text-slate-500",   bg: "bg-slate-100" },
  reconciled: { label: "Reconciled", colour: "text-emerald-700", bg: "bg-emerald-50" },
}

export function InvoiceStatusChip({ status }: InvoiceStatusChipProps) {
  const c = STATUS_CONFIGS[status] ?? { label: status, colour: "text-slate-600", bg: "bg-slate-100" }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.colour}`}>
      {status === "overdue" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />}
      {c.label}
    </span>
  )
}

// ─── KPI strip card ────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string
  colour: string
}

export function InvoiceKpiCard({ label, value, colour }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-col gap-0.5">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold ${colour}`}>{value}</p>
    </div>
  )
}

// ─── Section card ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function InvoiceSectionCard({ title, children, action }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

export function InvoiceLoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-5 w-40 bg-slate-100 rounded-lg" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-8 w-64 bg-slate-100 rounded-lg" />
        <div className="h-5 w-48 bg-slate-100 rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
