"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useUpdateTenancy, type Tenancy } from "@/hooks/useTenancies"
import type { Unit } from "@/hooks/useUnits"
import { cn } from "@/lib/utils"
import {
  InlineEditCell,
  InlineEditMoney,
  InlineEditSelect,
} from "@/components/editing"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import {
  Building2, Plus,
  Eye, RefreshCw, XCircle, Search, SlidersHorizontal,
} from "lucide-react"
import { StatusPill, fmt as fmtMoney, Card } from "./shared"
import { usePropertyJurisdiction } from "@/lib/jurisdiction/usePropertyJurisdiction"

export function TenanciesTab({ propertyId, tenanciesList, unitsList }: { propertyId: string; tenanciesList: Tenancy[]; unitsList: Unit[] }) {
  const router = useRouter()
  // Rents/deposits render in the property's currency, not hardcoded £.
  const { currency } = usePropertyJurisdiction(propertyId)
  const fmt = (n: number) => fmtMoney(n, currency)
  const { workspace } = useWorkspace()
  const updateTenancy = useUpdateTenancy()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  async function saveTenancy(id: string, field: string, value: unknown) {
    if (!workspace?.id) return
    await updateTenancy.mutateAsync({ id, workspaceId: workspace.id, payload: { [field]: value } })
  }
  const TENANCY_STATUS_OPTS = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "ended", label: "Ended" },
    { value: "terminated", label: "Terminated" },
    { value: "uncollectable", label: "Uncollectable" },
  ]

  const unitMap = Object.fromEntries(unitsList.map((u) => [u.id, u.unit_name]))

  const filtered = tenanciesList.filter((t) => {
    const unitName = unitMap[t.unit_id ?? ""] ?? ""
    const matchSearch = unitName.toLowerCase().includes(search.toLowerCase()) || (t.reference ?? "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "All" || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalRent = filtered.reduce((s, t) => s + (t.rent_amount ?? 0), 0)
  const totalDeposit = filtered.reduce((s, t) => s + (t.deposit_amount ?? 0), 0)

  if (tenanciesList.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-slate-500 min-w-0">No tenancies yet for this property.</p>
          <Link href={`/property-manager/portfolio/tenancies/new?propertyId=${propertyId}`} className="shrink-0 whitespace-nowrap flex items-center gap-1.5 text-[13px] font-semibold bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} className="shrink-0" /> New Tenancy
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenancies…"
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--color-brand-400)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          {["All", "draft", "active", "ended", "terminated", "uncollectable"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className="flex items-center gap-1.5 text-[13px] text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
          <SlidersHorizontal size={13} /> More filters
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/property-manager/portfolio/tenancies/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> New Tenancy
          </Link>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <p className="text-[13px] text-slate-500 text-center py-8">No tenancies match your search.</p>
        ) : filtered.map((t) => (
          <Link
            key={t.id}
            href={`/property-manager/portfolio/tenancies/${t.id}`}
            className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Building2 size={16} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-[var(--brand)] text-[13px]">{t.reference ?? t.id.slice(0, 8)}</p>
                <StatusPill status={t.status} />
              </div>
              <p className="text-[11px] text-slate-600">{unitMap[t.unit_id ?? ""] ?? "—"}</p>
              <p className="text-[11px] text-slate-400">{t.start_date ?? "—"} → {t.end_date ?? "Periodic"}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-slate-900 text-[13px]">{t.rent_amount != null ? fmt(t.rent_amount) : "—"}</p>
              <p className="text-[10px] text-slate-400">per month</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Table — desktop */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Reference", "Unit", "Lease Period", "Monthly Rent", "Status", "Deposit", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/property-manager/portfolio/tenancies/${t.id}`} className="font-medium text-[var(--brand)] hover:underline">
                      {t.reference ?? t.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{unitMap[t.unit_id ?? ""] ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums text-[12px]">
                    <div className="flex flex-col gap-0.5">
                      <InlineEditCell
                        value={t.start_date ?? ""}
                        onSave={(v) => saveTenancy(t.id, "start_date", v)}
                        type="date"
                        label="Lease start"
                      />
                      <InlineEditCell
                        value={t.end_date ?? ""}
                        onSave={(v) => saveTenancy(t.id, "end_date", v || null)}
                        type="date"
                        label="Lease end"
                        placeholder="Periodic"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">
                    <InlineEditMoney
                      value={t.rent_amount ?? ""}
                      onSave={(v) => saveTenancy(t.id, "rent_amount", v ? Number(v) : null)}
                      label="Monthly rent"
                      silentToast={false}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusPill status={t.status} />
                      <InlineEditSelect
                        value={t.status}
                        onSave={(v) => saveTenancy(t.id, "status", v)}
                        transition={(v) => saveTenancy(t.id, "status", v)}
                        label="Tenancy status"
                        options={TENANCY_STATUS_OPTS}
                        displayClassName="sr-only"
                        silentToast={false}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">
                    <InlineEditMoney
                      value={t.deposit_amount ?? ""}
                      onSave={(v) => saveTenancy(t.id, "deposit_amount", v ? Number(v) : null)}
                      label="Deposit"
                      placeholder="—"
                      silentToast={false}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        items={[
                          { label: "View tenancy", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/tenancies/${t.id}`) },
                          { label: "View property", icon: Building2, onClick: () => router.push(`/property-manager/portfolio/properties/${t.property_id}`) },
                          { label: "Renew", icon: RefreshCw, onClick: () => router.push(`/property-manager/portfolio/tenancies/${t.id}?tab=details`) },
                          { label: "End tenancy", icon: XCircle, variant: "danger", onClick: () => {
                            if (workspace?.id && confirm("End this tenancy?")) {
                              updateTenancy.mutate({ id: t.id, workspaceId: workspace.id, payload: { status: "ended" } })
                            }
                          }},
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/80 border-t border-slate-200">
                <td className="px-4 py-3 text-[12px] font-semibold text-slate-600" colSpan={3}>
                  Total — {filtered.length} {filtered.length === 1 ? "tenancy" : "tenancies"}
                </td>
                <td className="px-4 py-3 text-[13px] font-bold text-slate-800 tabular-nums">{fmt(totalRent)}</td>
                <td />
                <td className="px-4 py-3 text-[13px] font-bold text-slate-800 tabular-nums">{fmt(totalDeposit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
