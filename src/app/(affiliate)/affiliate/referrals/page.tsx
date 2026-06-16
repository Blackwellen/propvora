"use client"

import React, { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Users, Search, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { useAffiliate } from "../_useAffiliate"
import { formatPence } from "@/lib/affiliate/levels"
import { getReferralDetails, type ReferralDetailRow } from "@/lib/affiliate/dashboard-data"

const STATUS_FILTERS = ["All", "active", "converted", "trial", "pending", "signed_up", "reversed", "cancelled"] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const STATUS_LABELS: Record<string, string> = {
  active: "Active", converted: "Converted", trial: "Trial",
  pending: "Pending", signed_up: "Signed Up", reversed: "Reversed",
  cancelled: "Cancelled",
}

function statusBadge(s: string) {
  if (s === "active" || s === "converted") return <Badge variant="success" dot>Active</Badge>
  if (s === "trial") return <Badge variant="warning" dot>Trial</Badge>
  if (s === "pending" || s === "signed_up") return <Badge variant="sky" dot>Pending</Badge>
  if (s === "reversed" || s === "cancelled" || s === "refunded") return <Badge variant="danger" dot>{STATUS_LABELS[s] ?? s}</Badge>
  return <Badge dot>{STATUS_LABELS[s] ?? s}</Badge>
}

function maskId(id: string): string {
  // Show first 4 chars, mask middle, show last 2 chars to preserve privacy
  if (id.length <= 8) return id.slice(0, 4).toUpperCase() + "••••"
  return id.slice(0, 4).toUpperCase() + "••••" + id.slice(-2).toUpperCase()
}

function planBadge(plan: string | null) {
  if (!plan) return null
  const colours: Record<string, string> = {
    starter: "bg-slate-100 text-slate-600",
    growth: "bg-blue-50 text-blue-700",
    pro: "bg-violet-50 text-violet-700",
    enterprise: "bg-amber-50 text-amber-700",
  }
  const cls = colours[plan.toLowerCase()] ?? "bg-slate-100 text-slate-600"
  return <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide", cls)}>{plan}</span>
}

export default function AffiliateReferralsPage() {
  const { loading: affLoading, affiliate, workspaceId } = useAffiliate()
  const [rows, setRows] = useState<ReferralDetailRow[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    if (affLoading) return
    if (!affiliate?.enrolled || !workspaceId) { setLoading(false); return }
    getReferralDetails(workspaceId).then((data) => { setRows(data); setLoading(false) })
  }, [affLoading, affiliate?.enrolled, workspaceId])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchStatus = statusFilter === "All" || r.status === statusFilter
      const matchDate =
        (!dateFrom || r.created_at >= dateFrom) &&
        (!dateTo || r.created_at <= dateTo + "T23:59:59")
      const matchSearch = !search || r.id.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchDate && matchSearch
    })
  }, [rows, statusFilter, dateFrom, dateTo, search])

  if (affLoading || loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>
  }

  if (!affiliate?.enrolled) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">You haven&apos;t enrolled yet. <Link href="/affiliate" className="text-[#2563EB] hover:underline">Join the programme</Link>.</p>
      </div>
    )
  }

  const active = rows.filter((r) => r.status === "active" || r.status === "converted").length
  const totalCommission = rows.reduce(
    (s, r) => s + (r.initial_commission_pence ?? 0) + (r.recurring_commission_pence ?? 0), 0
  )

  const referralCardMapping: MobileCardMapping<ReferralDetailRow> = {
    getKey: (r) => r.id,
    title: (r) => maskId(r.id),
    subtitle: (r) =>
      `Joined ${new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    badge: (r) => statusBadge(r.status),
    fields: [
      { label: "Plan", render: (r) => r.referred_plan ?? "—" },
      { label: "Commission", render: (r) => formatPence((r.initial_commission_pence ?? 0) + (r.recurring_commission_pence ?? 0)) },
      { label: "Months left", render: (r) => String(r.recurring_months_remaining ?? "—") },
      {
        label: "Converted",
        render: (r) =>
          r.first_invoice_at
            ? new Date(r.first_invoice_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
            : "—",
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Referrals</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {rows.length} total · {active} active paying · total commission {formatPence(totalCommission)} · customer identities are masked for privacy.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: rows.length, colour: "text-slate-700" },
          { label: "Active / Converted", value: active, colour: "text-[#059669]" },
          { label: "Pending", value: rows.filter((r) => r.status === "pending" || r.status === "signed_up").length, colour: "text-[#d97706]" },
          { label: "Total Commission", value: formatPence(totalCommission), colour: "text-[#2563EB]" },
        ].map((kpi) => (
          <div key={kpi.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className={cn("text-base font-bold", kpi.colour)}>{kpi.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input placeholder="Search by referral ID…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
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
              {s === "All" ? "All" : (STATUS_LABELS[s] ?? s)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo("") }} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {rows.length === 0 ? "No referrals yet. Share your link to get started." : "No referrals match your filters."}
              </p>
            </div>
          ) : (
            <ResponsiveTable rows={filtered} mobile={referralCardMapping}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-left text-xs font-semibold text-slate-500">
                    <th className="pb-2 pr-3">Referral ID</th>
                    <th className="pb-2 pr-3">Joined</th>
                    <th className="pb-2 pr-3">Plan</th>
                    <th className="pb-2 pr-3">Workspace</th>
                    <th className="pb-2 pr-3">Converted</th>
                    <th className="pb-2 pr-3">Mo. left</th>
                    <th className="pb-2 pr-3">Commission</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r) => {
                    const comm = (r.initial_commission_pence ?? 0) + (r.recurring_commission_pence ?? 0)
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-3 font-mono text-xs text-slate-700">{maskId(r.id)}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-2.5 pr-3">{planBadge(r.referred_plan)}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500">
                          {r.workspace_created ? <Badge variant="success" size="sm">Yes</Badge> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                          {r.first_invoice_at ? new Date(r.first_invoice_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-600">{r.recurring_months_remaining ?? "—"}</td>
                        <td className="py-2.5 pr-3 text-xs font-semibold text-slate-800">{formatPence(comm)}</td>
                        <td className="py-2.5">{statusBadge(r.status)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </ResponsiveTable>
          )}
          {filtered.length > 0 && (
            <p className="text-xs text-slate-400 mt-3">Showing {filtered.length} of {rows.length} referrals</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
