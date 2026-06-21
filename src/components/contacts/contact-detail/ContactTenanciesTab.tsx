"use client"

import React from "react"
import Link from "next/link"
import { Home, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { ContactDetail } from "./types"
import { SectionCard, FieldRow, StatusChip, EmptyState } from "./shared"

export function TenancyTab({ contact }: { contact: ContactDetail }) {
  const t = contact.tenancy
  const rentHistory = [
    { month:"Dec", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"Jan", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"Feb", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"Mar", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"Apr", received:t?.rent ?? 0, expected:t?.rent ?? 0 },
    { month:"May", received: contact.arrears > 0 ? 0 : (t?.rent ?? 0), expected:t?.rent ?? 0 },
  ]
  if (!t) return <EmptyState icon={Home} message="No tenancy linked to this contact." cta="Link Tenancy" />
  return (
    <div className="space-y-5">
      {contact.arrears > 0 ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <div style={{ color: "var(--color-error)" }}><AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Arrears Outstanding — £{contact.arrears.toLocaleString("en-GB")}</p>
            <p className="text-sm text-red-700">Payment overdue — send notice or create a follow-up task</p>
          </div>
          <Button variant="destructive" size="sm" className="shrink-0">Create Task</Button>
        </div>
      ) : (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
          <div style={{ color: "var(--color-success)" }}><CheckCircle2 className="w-4 h-4" /></div>
          <p className="text-sm text-emerald-700 font-medium">No arrears — all payments up to date</p>
        </div>
      )}
      <SectionCard className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">Current Tenancy</h4>
          <StatusChip status={t.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <FieldRow label="Property" value={t.property} />
          <FieldRow label="Unit" value={t.unit} />
          <FieldRow label="Start Date" value={t.start} />
          <FieldRow label="End Date" value={t.end} />
          <FieldRow label="Monthly Rent" value={<span className="text-lg font-bold text-slate-900">£{t.rent.toLocaleString("en-GB")}</span>} />
          <FieldRow label="Deposit" value={`£${t.deposit.toLocaleString("en-GB")}`} />
          <FieldRow label="Deposit Scheme" value={t.deposit_scheme} />
          <FieldRow label="Guarantor" value={t.guarantor ?? "None"} />
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Link href="/property-manager/portfolio/tenancies/t1" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> Open Full Tenancy Record
          </Link>
        </div>
      </SectionCard>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Rent History — 6 Months</p>
        <div className="h-44 rounded-xl border border-slate-200 bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rentHistory}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => [`£${Number(v ?? 0).toLocaleString("en-GB")}`, "Amount"]} />
              <Area type="monotone" dataKey="expected" stroke="#E2E8F0" fill="#F8FAFC" strokeWidth={1} />
              <Area type="monotone" dataKey="received" stroke="#10B981" fill="#ECFDF5" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
