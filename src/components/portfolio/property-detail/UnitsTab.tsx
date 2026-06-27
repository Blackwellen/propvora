"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useDeleteUnit, useUpdateUnit, type Unit } from "@/hooks/useUnits"
import { cn } from "@/lib/utils"
import {
  InlineEditCell,
  InlineEditMoney,
  InlineEditSelect,
} from "@/components/editing"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import {
  Home, Users, Wrench,
  Plus,
  Eye, Trash2, Search, SlidersHorizontal,
} from "lucide-react"
import { StatusPill, fmt, Card } from "./shared"

export function UnitsTab({ unitsList, propertyId }: { unitsList: Unit[]; propertyId: string }) {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const deleteUnit = useDeleteUnit()
  const updateUnit = useUpdateUnit()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  async function saveUnit(id: string, field: string, value: unknown) {
    if (!workspace?.id) return
    await updateUnit.mutateAsync({ id, workspaceId: workspace.id, payload: { [field]: value } })
  }
  const UNIT_STATUS_OPTS = [
    { value: "occupied", label: "Occupied" },
    { value: "vacant", label: "Vacant" },
    { value: "under_works", label: "Under Works" },
    { value: "reserved", label: "Reserved" },
  ]
  const UNIT_TYPE_OPTS = [
    { value: "Room", label: "Room" },
    { value: "flat", label: "Flat" },
    { value: "studio", label: "Studio" },
    { value: "suite", label: "Suite" },
    { value: "apartment", label: "Apartment" },
    { value: "other", label: "Other" },
  ]

  const filtered = unitsList.filter((u) => {
    const matchSearch = u.unit_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "All" || u.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalRent = filtered.reduce((s, u) => s + (u.target_rent ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search units…"
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--color-brand-400)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[13px] border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          {[
            { label: "All", value: "All" },
            { label: "Occupied", value: "occupied" },
            { label: "Vacant", value: "vacant" },
            { label: "Under Works", value: "under_works" },
            { label: "Reserved", value: "reserved" },
          ].map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className="flex items-center gap-1.5 text-[13px] text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
          <SlidersHorizontal size={13} /> More filters
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/property-manager/portfolio/units/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> Add Unit
          </Link>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <p className="text-[13px] text-slate-500 text-center py-8">No units match your search.</p>
        ) : filtered.map((unit) => (
          <Link
            key={unit.id}
            href={`/property-manager/portfolio/units/${unit.id}`}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Home size={16} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-800 text-[13px]">{unit.unit_name}</p>
                <StatusPill status={unit.status} />
              </div>
              <p className="text-[11px] text-slate-400">Floor {unit.floor} · {unit.unit_type ?? "—"} · {unit.bedrooms ?? "—"} bed</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-slate-900 text-[13px]">{unit.target_rent != null ? fmt(unit.target_rent) : "—"}</p>
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
                {["Unit", "Status", "Occupancy", "Monthly Rent", "Deposit", "Area", "Type", "Rooms", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((unit) => (
                <tr
                  key={unit.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link href={`/property-manager/portfolio/units/${unit.id}`} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Home size={15} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{unit.unit_name}</p>
                        <p className="text-[11px] text-slate-500">Floor {unit.floor}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusPill status={unit.status} />
                      <InlineEditSelect
                        value={unit.status}
                        onSave={(v) => saveUnit(unit.id, "status", v)}
                        transition={(v) => saveUnit(unit.id, "status", v)}
                        label="Unit status"
                        options={UNIT_STATUS_OPTS}
                        displayClassName="sr-only"
                        silentToast={false}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 tabular-nums">
                    {unit.status === "occupied" ? "1/1" : "0/1"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">
                    <InlineEditMoney
                      value={unit.target_rent ?? ""}
                      onSave={(v) => saveUnit(unit.id, "target_rent", v ? Number(v) : null)}
                      label="Monthly rent"
                      silentToast={false}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{unit.target_rent != null ? fmt(unit.target_rent) : "—"}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">
                    <InlineEditCell
                      value={unit.floor_area_sqm ?? ""}
                      onSave={(v) => saveUnit(unit.id, "floor_area_sqm", v ? Number(v) : null)}
                      type="number"
                      label="Floor area"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <InlineEditCell
                      value={unit.unit_type ?? ""}
                      onSave={(v) => saveUnit(unit.id, "unit_type", v)}
                      type="select"
                      options={UNIT_TYPE_OPTS}
                      label="Unit type"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">
                    <InlineEditCell
                      value={unit.bedrooms ?? ""}
                      onSave={(v) => saveUnit(unit.id, "bedrooms", v ? Number(v) : null)}
                      type="number"
                      label="Bedrooms"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu
                        items={[
                          { label: "View unit", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/units/${unit.id}`) },
                          { label: "Create tenancy", icon: Users, onClick: () => router.push(`/property-manager/portfolio/tenancies/new?unitId=${unit.id}`) },
                          { label: "Add work order", icon: Wrench, onClick: () => router.push(`/property-manager/work/jobs/new?unitId=${unit.id}`) },
                          { label: "Delete unit", icon: Trash2, variant: "danger", onClick: () => {
                            if (workspace?.id && confirm("Delete this unit? This cannot be undone.")) {
                              deleteUnit.mutate({ id: unit.id, workspaceId: workspace.id, propertyId: unit.property_id })
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
                  Total / Average — {filtered.length} units
                </td>
                <td className="px-4 py-3 text-[13px] font-bold text-slate-800 tabular-nums">{fmt(totalRent)}</td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
