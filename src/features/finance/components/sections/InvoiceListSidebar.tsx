"use client"

import React from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Donut ────────────────────────────────────────────────────────────────────

interface DonutSegment {
  label: string
  count: number
  percent: number
  color: string
}

export function InvoiceListDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, d) => s + d.count, 0)
  const r = 54
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r
  let accumulated = 0

  if (total === 0) {
    return <p className="text-xs text-slate-500 text-center py-8">No invoices to chart yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center">
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg width={140} height={140} viewBox="0 0 140 140">
            {segments.map((seg) => {
              const dashLen = (seg.percent / 100) * circumference - 1.5
              const dashOffset = -(accumulated / 100) * circumference
              accumulated += seg.percent
              return (
                <circle
                  key={seg.label}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={12}
                  strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
            <span className="text-[10px] text-slate-500 font-medium">Total</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-slate-600">{seg.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900">{seg.count}</span>
              <span className="text-slate-400">({seg.percent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Collections Summary ─────────────────────────────────────────────────────

interface CollectionsSummaryCardProps {
  outstanding: string
  dueThisWeek: string
  paidThisMonth: string
  overdue: string
}

export function CollectionsSummaryCard({
  outstanding,
  dueThisWeek,
  paidThisMonth,
  overdue,
}: CollectionsSummaryCardProps) {
  const rows: { label: string; value: string; color: string }[] = [
    { label: "Outstanding", value: outstanding, color: "text-slate-900" },
    { label: "Due This Week", value: dueThisWeek, color: "text-amber-600" },
    { label: "Paid This Month", value: paidThisMonth, color: "text-emerald-600" },
    { label: "Overdue", value: overdue, color: "text-red-600" },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-slate-900">Collections Summary</h3>
        <button className="text-[12px] text-blue-600 font-medium hover:underline">MTD &gt;</button>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-[12px] text-slate-500">{row.label}</span>
            <span className={cn("text-[13px] font-semibold", row.color)}>{row.value}</span>
          </div>
        ))}
      </div>
      <Link href="/property-manager/accounting" className="mt-4 inline-block text-[12px] text-blue-600 font-medium hover:underline">
        View in Accounting &gt;
      </Link>
    </div>
  )
}

// ─── Recently Paid ────────────────────────────────────────────────────────────

interface RecentPaidItem {
  id: string
  invoiceNumber: string
  paidAt: string
  amount: string
}

export function RecentlyPaidCard({ items }: { items: RecentPaidItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-slate-900">Recently Paid</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-slate-500 text-center py-4">No payments recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((p) => (
            <div key={p.id} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-slate-900 truncate">{p.invoiceNumber}</div>
                <div className="text-[11px] text-slate-500">{p.paidAt}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] font-semibold text-emerald-600">{p.amount}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
