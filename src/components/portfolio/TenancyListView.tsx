"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ChevronUp, ChevronDown, Eye, AlertTriangle,
  Calendar, Home, Shield, Building2, RefreshCw, LogOut, Trash2,
} from "lucide-react"
import type { TenancyCardData } from "./TenancyCard"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
const AVATAR_PALETTE = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#0891B2", "#DB2777", "#D97706", "#374151"]
function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}
function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  active:      { label: "Active",      dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-200" },
  pending:     { label: "Pending",     dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border border-amber-200" },
  ended:       { label: "Ended",       dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50 border border-slate-200" },
  disputed:    { label: "Disputed",    dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50 border border-red-200" },
  surrendered: { label: "Surrendered", dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50 border border-slate-200" },
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

type Col = "tenant" | "status" | "rent" | "start" | "end" | "arrears"
type Dir = "asc" | "desc"

/* ------------------------------------------------------------------ */
/* TenancyListView                                                      */
/* ------------------------------------------------------------------ */
export function TenancyListView({ tenancies }: { tenancies: TenancyCardData[] }) {
  const router = useRouter()
  const [sortCol, setSortCol] = useState<Col>("status")
  const [sortDir, setSortDir] = useState<Dir>("asc")

  function toggle(col: Col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortCol(col); setSortDir("asc") }
  }

  const sorted = [...tenancies].sort((a, b) => {
    if (sortCol === "tenant") {
      const va = a.tenant_name ?? ""; const vb = b.tenant_name ?? ""
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
    }
    if (sortCol === "status") {
      return sortDir === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status)
    }
    if (sortCol === "rent") return sortDir === "asc" ? a.rent_amount - b.rent_amount : b.rent_amount - a.rent_amount
    if (sortCol === "arrears") return sortDir === "asc" ? (a.arrears ?? 0) - (b.arrears ?? 0) : (b.arrears ?? 0) - (a.arrears ?? 0)
    if (sortCol === "start") {
      return sortDir === "asc"
        ? new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        : new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    }
    if (sortCol === "end") {
      const ea = a.end_date ? new Date(a.end_date).getTime() : Infinity
      const eb = b.end_date ? new Date(b.end_date).getTime() : Infinity
      return sortDir === "asc" ? ea - eb : eb - ea
    }
    return 0
  })

  function Th({ col, label, right }: { col: Col; label: string; right?: boolean }) {
    const active = sortCol === col
    return (
      <th className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 cursor-pointer select-none hover:text-slate-800 transition-colors",
        right ? "text-right" : "text-left"
      )} onClick={() => toggle(col)}>
        <span className={cn("inline-flex items-center gap-0.5", right && "justify-end")}>
          {label}
          {active
            ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#2563EB]" /> : <ChevronDown className="w-3 h-3 text-[#2563EB]" />)
            : <ChevronUp className="w-3 h-3 text-slate-200" />
          }
        </span>
      </th>
    )
  }

  const mobileMapping: MobileCardMapping<TenancyCardData> = {
    getKey: (t) => t.id,
    title: (t) => t.tenant_name ?? "Unknown",
    subtitle: (t) => `${t.property_name}${t.unit_name ? ` · ${t.unit_name}` : ""}`,
    badge: (t) => {
      const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.ended
      return (
        <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.bg, cfg.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />{cfg.label}
        </span>
      )
    },
    onRowClick: (t) => router.push(`/property-manager/portfolio/tenancies/${t.id}`),
    fields: [
      { label: "Start", render: (t) => fmtDate(t.start_date) },
      { label: "End", render: (t) => t.end_date ? fmtDate(t.end_date) : "Ongoing" },
      { label: "Rent", render: (t) => `${fmt(t.rent_amount)}${t.rent_frequency === "weekly" ? "/wk" : "/mo"}` },
      { label: "Arrears", render: (t) => (t.arrears ?? 0) > 0 ? fmt(t.arrears!) : "Clear" },
    ],
  }

  return (
    <ResponsiveTable rows={sorted} mobile={mobileMapping}>
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <Th col="tenant" label="Tenant" />
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Property / Unit</th>
              <Th col="status" label="Status" />
              <Th col="start" label="Start" />
              <Th col="end" label="End" />
              <Th col="rent" label="Rent" right />
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Deposit</th>
              <Th col="arrears" label="Arrears" right />
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((t) => {
              const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.ended
              const daysLeft = t.end_date ? daysUntil(t.end_date) : null
              const endingSoon = daysLeft != null && daysLeft >= 0 && daysLeft <= 60
              const hasArrears = (t.arrears ?? 0) > 0
              const tenantName = t.tenant_name ?? "?"
              const avatarColor = getAvatarColor(tenantName)
              const initials = getInitials(tenantName)
              const rentFreq = t.rent_frequency === "weekly" ? "/wk" : "/mo"

              return (
                <tr key={t.id} className={cn(
                  "hover:bg-slate-50/70 transition-colors group",
                  hasArrears && "bg-red-50/20"
                )}>
                  {/* Tenant */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        {t.tenant_avatar ? (
                          <Image
                            src={t.tenant_avatar}
                            alt={tenantName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover border border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-white shadow-sm flex items-center justify-center text-white text-[10px] font-bold select-none"
                            style={{ background: avatarColor }}>{initials}</div>
                        )}
                        <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white", cfg.dot)} />
                      </div>
                      <div>
                        <Link href={`/property-manager/portfolio/tenancies/${t.id}`}
                          className="text-[13px] font-semibold text-slate-900 hover:text-[#2563EB] transition-colors block">
                          {t.tenant_name ?? "Unknown"}
                        </Link>
                      </div>
                    </div>
                  </td>
                  {/* Property/unit */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-[12px] text-slate-600">
                      <Home className="w-3 h-3 text-slate-300 shrink-0" />
                      <span className="truncate max-w-[160px]">
                        {t.property_name}{t.unit_name ? ` · ${t.unit_name}` : ""}
                      </span>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.bg, cfg.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />{cfg.label}
                    </span>
                    {endingSoon && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-0.5">↑ {daysLeft}d left</p>
                    )}
                  </td>
                  {/* Start */}
                  <td className="px-4 py-3 text-[12px] text-slate-600">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-300" />{fmtDate(t.start_date)}</span>
                  </td>
                  {/* End */}
                  <td className="px-4 py-3 text-[12px]">
                    {t.end_date
                      ? <span className={cn("flex items-center gap-1", endingSoon ? "text-amber-600 font-semibold" : "text-slate-600")}>
                          <Calendar className="w-3 h-3 text-slate-300" />{fmtDate(t.end_date)}
                        </span>
                      : <span className="text-slate-300">Ongoing</span>
                    }
                  </td>
                  {/* Rent */}
                  <td className="px-4 py-3 text-right">
                    <p className="text-[13px] font-bold text-slate-900 tabular-nums">{fmt(t.rent_amount)}</p>
                    <p className="text-[10px] text-slate-500">{rentFreq}</p>
                  </td>
                  {/* Deposit */}
                  <td className="px-4 py-3 text-right">
                    {t.deposit_amount != null
                      ? <div>
                          <p className="text-[12px] font-semibold text-slate-700 tabular-nums">{fmt(t.deposit_amount)}</p>
                          {t.deposit_held_by && (
                            <p className="text-[9.5px] text-slate-500 flex items-center justify-end gap-0.5">
                              <Shield className="w-2.5 h-2.5" />Protected
                            </p>
                          )}
                        </div>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  {/* Arrears */}
                  <td className="px-4 py-3 text-right">
                    {hasArrears
                      ? <span className="text-[12px] font-bold text-red-600 flex items-center justify-end gap-1 tabular-nums">
                          <AlertTriangle className="w-3 h-3" />{fmt(t.arrears!)}
                        </span>
                      : <span className="text-[11px] text-emerald-600 font-semibold">Clear</span>
                    }
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/property-manager/portfolio/tenancies/${t.id}`}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#2563EB] hover:text-white flex items-center justify-center text-slate-500 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <ActionMenu
                        align="right"
                        items={[
                          { label: "View tenancy", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/tenancies/${t.id}`) },
                          { label: "View property", icon: Building2, onClick: () => router.push(`/property-manager/portfolio/properties/${t.property_id}`) },
                          { label: "Renew", icon: RefreshCw, onClick: () => {} },
                          { label: "End tenancy", icon: LogOut, onClick: () => {} },
                          { label: "Delete", icon: Trash2, onClick: () => {}, variant: "danger" },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">No tenancies found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </ResponsiveTable>
  )
}
