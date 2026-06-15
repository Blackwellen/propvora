"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Receipt, PoundSterling, TrendingUp, Building2, ChevronRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveLandlordContext, resolveLandlordPropertyIds,
  formatMoney, formatDate, propertyLabel,
  type PropertyLite,
} from "../_lib/landlord-context"
import { getPropertyIncome, type PortalIncomeRow as IncomeRow } from "@/lib/portal/income"

const STATUS_FILTERS = ["All", "Received"] as const

export default function LandlordStatementsPage() {
  const [income, setIncome] = useState<IncomeRow[]>([])
  const [propLabels, setPropLabels] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noContext, setNoContext] = useState(false)
  const [noProperties, setNoProperties] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("All")

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const landlord = await resolveLandlordContext()
        if (!landlord) { setNoContext(true); setLoading(false); return }

        const propertyIds = await resolveLandlordPropertyIds(landlord.contactId, landlord.workspaceId)
        if (propertyIds.length === 0) { setNoProperties(true); setLoading(false); return }

        // Property labels for the table
        const { data: propData } = await supabase
          .from("properties")
          .select("id, nickname, address_line1, city")
          .in("id", propertyIds)
        const labels = new Map<string, string>()
        for (const p of (propData ?? []) as unknown as PropertyLite[]) {
          labels.set(p.id, propertyLabel(p))
        }
        setPropLabels(labels)

        // LIVE income from money_transactions scoped strictly to the landlord's
        // properties. Owner-facing rent/fees ONLY — never expose supplier costs.
        const data = await getPropertyIncome(propertyIds)
        setIncome(data)
      } catch (err) {
        console.error(err)
        setError("Unexpected error loading statements.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => income.filter((i) => {
    if (statusFilter === "All") return true
    return i.status === statusFilter.toLowerCase()
  }), [income, statusFilter])

  const totalReceived = income.filter((i) => i.status === "received").reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalExpected = income.filter((i) => ["expected", "late", "partial"].includes(i.status)).reduce((s, i) => s + (i.amount ?? 0), 0)
  const ytd = income
    .filter((i) => i.status === "received" && new Date(i.date).getFullYear() === new Date().getFullYear())
    .reduce((s, i) => s + (i.amount ?? 0), 0)

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
          <Receipt className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No landlord account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Ask your managing agent to grant you portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Statements</h1>
        <p className="text-sm text-slate-500">Rent and income across your properties</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {noProperties ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No statements yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              No properties are linked to your account, so there are no income statements to show. Once your
              managing agent links a property and records rent, your statements will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-4 rounded-2xl border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] flex items-center justify-center mb-3">
                <PoundSterling className="w-4 h-4 text-[#059669]" />
              </div>
              <p className="text-xl font-bold text-[#059669]">{formatMoney(totalReceived)}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">Total Received</p>
            </Card>
            <Card className="p-4 rounded-2xl border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] flex items-center justify-center mb-3">
                <Receipt className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <p className="text-xl font-bold text-[#F59E0B]">{formatMoney(totalExpected)}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">Expected / Outstanding</p>
            </Card>
            <Card className="p-4 rounded-2xl border-slate-200">
              <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4 text-[#2563EB]" />
              </div>
              <p className="text-xl font-bold text-[#2563EB]">{formatMoney(ytd)}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">Received This Year</p>
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

          {/* Table */}
          <Card noPadding className="rounded-2xl border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {["Date", "Property", "Category", "Status", "Amount"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(i.date)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 truncate max-w-[200px]">
                        {i.property_id ? propLabels.get(i.property_id) ?? "Property" : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{i.category ?? "Rent"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={i.status === "received" ? "success" : i.status === "late" ? "danger" : "warning"} dot>
                          {i.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {formatMoney(i.amount, i.currency ?? "GBP")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">
                    {income.length === 0 ? "No income recorded yet." : "No records match this filter."}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <div className="rounded-2xl bg-[#EFF6FF] border border-blue-100 p-3 flex items-start gap-2">
            <Receipt className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
            <p className="text-xs text-[#1e40af]">
              Statements show rent and income against your properties only. Supplier costs and internal management
              margins are never shown in your portal.
            </p>
          </div>

          <Link href="/landlord-portal/properties" className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline">
            View by property <ChevronRight className="w-3 h-3" />
          </Link>
        </>
      )}
    </div>
  )
}
