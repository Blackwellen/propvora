"use client"

import React, { useEffect, useMemo, useState } from "react"
import { PoundSterling, CheckCircle2, Clock, CalendarClock, DoorOpen, Receipt } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import {
  resolveTenantContext, resolveTenantTenancies, tenancyIds, tenancyPropertyIds,
  formatMoney, formatDate, rentFrequencyLabel,
  type TenancyLite,
} from "../_lib/tenant-context"
import { getTenantIncome, type PortalIncomeRow } from "@/lib/portal/income"

type RentRow = PortalIncomeRow

const STATUS_FILTERS = ["All", "Paid"] as const

// money_transactions rows are realised cash → always paid/received.
function isPaid(status: string): boolean {
  return status === "received" || status === "reconciled" || status === "paid"
}
function isOverdue(status: string): boolean {
  return status === "late" || status === "overdue"
}

export default function TenantRentPage() {
  const [rows, setRows] = useState<RentRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noContext, setNoContext] = useState(false)
  const [noTenancy, setNoTenancy] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("All")

  useEffect(() => {
    async function load() {
      try {
        const tenant = await resolveTenantContext()
        if (!tenant) { setNoContext(true); setLoading(false); return }

        const myTenancies = await resolveTenantTenancies(tenant.contactId, tenant.workspaceId)
        if (myTenancies.length === 0) { setNoTenancy(true); setLoading(false); return }
        setTenancies(myTenancies)

        const tIds = tenancyIds(myTenancies)
        const pIds = tenancyPropertyIds(myTenancies)

        // LIVE rent from money_transactions scoped STRICTLY to this tenant's own
        // tenancy/property ids (received cash). No phantom income tables.
        const mapped = await getTenantIncome(tIds, pIds)
        setRows(mapped)
      } catch (err) {
        console.error(err)
        setError("Unexpected error loading rent.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const primary = tenancies[0] ?? null

  const rentCardMapping: MobileCardMapping<RentRow> = {
    getKey: (r) => r.id,
    title: (r) => r.description || (r.category ?? "Rent"),
    subtitle: (r) => formatDate(r.date),
    badge: (r) => (
      <Badge variant={isPaid(r.status) ? "success" : isOverdue(r.status) ? "danger" : "warning"} dot>
        {isPaid(r.status) ? "Paid" : isOverdue(r.status) ? "Overdue" : "Due"}
      </Badge>
    ),
    fields: [
      { label: "Amount", render: (r) => formatMoney(r.amount, r.currency ?? "GBP") },
    ],
  }

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusFilter === "All") return true
    if (statusFilter === "Paid") return isPaid(r.status)
    if (statusFilter === "Overdue") return isOverdue(r.status)
    if (statusFilter === "Due") return !isPaid(r.status) && !isOverdue(r.status)
    return true
  }), [rows, statusFilter])

  const totalPaid = rows.filter((r) => isPaid(r.status)).reduce((s, r) => s + (r.amount ?? 0), 0)
  const outstanding = rows.filter((r) => !isPaid(r.status)).reduce((s, r) => s + (r.amount ?? 0), 0)
  const nextDue = rows
    .filter((r) => !isPaid(r.status) && r.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-48" /></div>
        <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <PoundSterling className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No tenant account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Ask your managing agent to grant you portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Rent &amp; Payments</h1>
        <p className="text-sm text-slate-500">Your rent schedule and payment history</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {noTenancy ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <DoorOpen className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No rent records yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              No tenancy is linked to your account, so there are no rent records to show. Once your managing agent
              links your tenancy and records rent, your payments will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Rent at a glance */}
          {primary?.rent_amount != null && (
            <Card className="rounded-2xl border-blue-100 bg-[#EFF6FF]">
              <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-medium text-[#1e40af]/80">Your rent</p>
                  <p className="text-lg font-bold text-[#1e40af]">
                    {formatMoney(primary.rent_amount)}{" "}
                    <span className="text-sm font-normal">{rentFrequencyLabel(primary.rent_frequency)}</span>
                  </p>
                </div>
                {nextDue && (
                  <div className="text-right">
                    <p className="text-xs font-medium text-[#1e40af]/80">Next payment due</p>
                    <p className="text-sm font-semibold text-[#1e40af]">{formatDate(nextDue.date)} · {formatMoney(nextDue.amount, nextDue.currency ?? "GBP")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-4 rounded-2xl border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              </div>
              <p className="text-xl font-bold text-[#059669]">{formatMoney(totalPaid)}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">Total Paid</p>
            </Card>
            <Card className="p-4 rounded-2xl border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] flex items-center justify-center mb-3">
                <Clock className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <p className="text-xl font-bold text-[#F59E0B]">{formatMoney(outstanding)}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">Outstanding</p>
            </Card>
            <Card className="p-4 rounded-2xl border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center mb-3">
                <CalendarClock className="w-4 h-4 text-[#2563EB]" />
              </div>
              <p className="text-sm font-bold text-[#2563EB]">{nextDue ? formatDate(nextDue.date) : "—"}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">Next Due Date</p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  statusFilter === s
                    ? "bg-[#2563EB] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Table (desktop) / card list (mobile) */}
          <ResponsiveTable
            rows={filtered}
            mobile={rentCardMapping}
            emptyState={
              <Card className="rounded-2xl border-slate-200">
                <div className="text-center py-12">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    {rows.length === 0 ? "No rent records yet." : "No records match this filter."}
                  </p>
                </div>
              </Card>
            }
          >
          <Card noPadding className="rounded-2xl border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {["Date", "Description", "Status", "Amount"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 truncate max-w-[220px]">
                        {r.description || <span className="capitalize">{r.category ?? "Rent"}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isPaid(r.status) ? "success" : isOverdue(r.status) ? "danger" : "warning"} dot>
                          {isPaid(r.status) ? "Paid" : isOverdue(r.status) ? "Overdue" : "Due"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {formatMoney(r.amount, r.currency ?? "GBP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    {rows.length === 0 ? "No rent records yet." : "No records match this filter."}
                  </p>
                </div>
              )}
            </div>
          </Card>
          </ResponsiveTable>

          <div className="rounded-2xl bg-[#EFF6FF] border border-blue-100 p-3 flex items-start gap-2">
            <PoundSterling className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
            <p className="text-xs text-[#1e40af]">
              This shows rent due and paid against your own tenancy only. Other tenants&apos; data and your
              managing agent&apos;s internal accounting are never shown here.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
