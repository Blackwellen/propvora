"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Calendar, Clock, AlertTriangle, ChevronRight, Shield, Home,
  Building2, Phone, Mail, Edit2, Check, X,
  TrendingUp, ArrowRight, CheckSquare, Square, PoundSterling,
  Eye, RefreshCw, LogOut, Trash2,
} from "lucide-react"
import { Donut } from "@/components/charts/Donut"
import { ActionMenu } from "@/components/portfolio/ActionMenu"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export interface TenancyCardData {
  id: string
  property_id: string
  unit_id?: string | null
  property_name?: string
  unit_name?: string
  tenant_name?: string
  tenant_avatar?: string | null
  tenant_email?: string | null
  tenant_phone?: string | null
  status: "draft" | "active" | "ended" | "terminated" | "uncollectable"
  start_date: string
  end_date?: string | null
  rent_amount: number
  deposit_amount?: number | null
  deposit_held_by?: string | null
  rent_frequency?: string
  tenancy_type?: string | null
  arrears?: number
  notice_date?: string | null
  payment_day?: number | null
  on_time_rate?: number | null
  missed_payments?: number | null
  lease_type?: string | null
  total_paid?: number | null
}

/* ------------------------------------------------------------------ */
/* Status Config                                                        */
/* ------------------------------------------------------------------ */
const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  active:        { label: "Active",        dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-200" },
  draft:         { label: "Draft",         dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border border-amber-200" },
  ended:         { label: "Ended",         dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-100 border border-slate-200" },
  terminated:    { label: "Terminated",    dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50 border border-red-200" },
  uncollectable: { label: "Uncollectable", dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50 border border-red-200" },
  ending_soon: { label: "Ending soon",  dot: "bg-orange-400",  text: "text-orange-700",  bg: "bg-orange-50 border border-orange-200" },
  arrears:     { label: "Arrears",      dot: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50 border border-red-200" },
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
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

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

function getTenantInitials(t: TenancyCardData): string {
  return getInitials(t.tenant_name ?? "?")
}

function getTenantColor(t: TenancyCardData): string {
  return getAvatarColor(t.tenant_name ?? t.id)
}

function rentSuffix(freq?: string) {
  if (freq === "weekly") return "/wk"
  if (freq === "quarterly") return "/qtr"
  return "/mo"
}

function onTimeColor(rate: number) {
  if (rate >= 90) return "text-emerald-600"
  if (rate >= 70) return "text-amber-600"
  return "text-red-600"
}

/* ------------------------------------------------------------------ */
/* StatusBadge                                                          */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.ended
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
      cfg.bg, cfg.text,
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* 4A — TenancyCardStandard                                            */
/* ------------------------------------------------------------------ */
export function TenancyCardStandard({
  tenancy,
  selected,
  onSelect,
  onView,
}: {
  tenancy: TenancyCardData
  selected?: boolean
  onSelect?: (id: string) => void
  onView?: (id: string) => void
}) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const hasArrears = (tenancy.arrears ?? 0) > 0
  const rate = tenancy.on_time_rate ?? null

  return (
    <div
      role="row"
      aria-selected={selected}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect?.(tenancy.id)}
      className={cn(
        "group relative flex items-center gap-4 px-4 py-3 rounded-2xl border bg-white cursor-pointer",
        "transition-all duration-200",
        selected
          ? "border-l-4 border-blue-500 bg-blue-50/30 shadow-sm"
          : hovered
          ? "shadow-md border-blue-200/60"
          : "border-[#E6ECF4] shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
      )}
    >
      {/* Checkbox */}
      <div className="shrink-0 w-5 flex items-center justify-center" onClick={e => { e.stopPropagation(); onSelect?.(tenancy.id) }}>
        {selected
          ? <CheckSquare className="w-4 h-4 text-blue-600" />
          : <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
        }
      </div>

      {/* Avatar + identity */}
      <div className="flex items-center gap-3 min-w-0 w-48 shrink-0">
        <div className="relative shrink-0">
          {tenancy.tenant_avatar ? (
            <Image
              src={tenancy.tenant_avatar}
              alt={tenancy.tenant_name ?? "Tenant"}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[11px] font-bold select-none shrink-0"
              style={{ background: getTenantColor(tenancy) }}>{getTenantInitials(tenancy)}</div>
          )}
          <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
            STATUS_CFG[tenancy.status]?.dot ?? "bg-slate-400")} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {tenancy.tenant_name ?? "Unknown tenant"}
          </p>
          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
            <Home className="w-3 h-3 shrink-0" />
            {tenancy.property_name}{tenancy.unit_name ? ` · ${tenancy.unit_name}` : ""}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="shrink-0 hidden sm:block">
        <StatusBadge status={tenancy.status} />
      </div>

      {/* Rent */}
      <div className="shrink-0 w-28 text-right hidden md:block">
        <p className="text-[13px] font-black text-slate-900 tabular-nums">
          {fmt(tenancy.rent_amount)}
          <span className="text-[10px] font-normal text-slate-500 ml-0.5">{rentSuffix(tenancy.rent_frequency)}</span>
        </p>
        <p className="text-[10px] text-slate-500">Monthly rent</p>
      </div>

      {/* Deposit */}
      <div className="shrink-0 w-24 text-right hidden lg:block">
        {tenancy.deposit_amount != null ? (
          <>
            <p className="text-[13px] font-bold text-slate-700 tabular-nums">{fmt(tenancy.deposit_amount)}</p>
            <p className="text-[10px] text-slate-500">Deposit</p>
          </>
        ) : (
          <p className="text-[10px] text-slate-300">—</p>
        )}
      </div>

      {/* Lease period */}
      <div className="shrink-0 w-36 hidden lg:block">
        <p className="text-[11px] text-slate-600 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          {fmtDate(tenancy.start_date)}
          {tenancy.end_date ? ` → ${fmtDate(tenancy.end_date)}` : " · Ongoing"}
        </p>
        {tenancy.end_date && daysUntil(tenancy.end_date) >= 0 && daysUntil(tenancy.end_date) <= 60 && (
          <p className="text-[10px] text-orange-600 font-semibold mt-0.5">{daysUntil(tenancy.end_date)}d remaining</p>
        )}
      </div>

      {/* Payment state */}
      <div className="shrink-0 w-24 text-right hidden xl:block">
        {hasArrears ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full tabular-nums">
            Arrears {fmt(tenancy.arrears!)}
          </span>
        ) : rate != null ? (
          <span className={cn(
            "text-[11px] font-semibold",
            rate >= 90 ? "text-emerald-600" : rate >= 70 ? "text-amber-600" : "text-red-600",
          )}>
            {rate >= 90 ? "On time" : rate >= 70 ? "Late" : "Arrears"} {rate}%
          </span>
        ) : (
          <span className="text-[10px] text-slate-300">—</span>
        )}
      </div>

      {/* View button (hover only) */}
      <button
        onClick={e => { e.stopPropagation(); onView?.(tenancy.id) }}
        className={cn(
          "shrink-0 ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold",
          "bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200",
          "opacity-0 group-hover:opacity-100",
        )}
      >
        View <ChevronRight className="w-3 h-3" />
      </button>

      {/* More menu */}
      <div onClick={e => e.stopPropagation()}>
        <ActionMenu
          align="right"
          items={[
            { label: "View tenancy", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/tenancies/${tenancy.id}`) },
            { label: "View property", icon: Building2, onClick: () => router.push(`/property-manager/portfolio/properties/${tenancy.property_id}`) },
            { label: "Renew", icon: RefreshCw, onClick: () => {} },
            { label: "End tenancy", icon: LogOut, onClick: () => {} },
            { label: "Delete", icon: Trash2, onClick: () => {}, variant: "danger" },
          ]}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4B — TenancyCardDetailed                                            */
/* ------------------------------------------------------------------ */
export function TenancyCardDetailed({ tenancy }: { tenancy: TenancyCardData }) {
  const router = useRouter()
  const rate = tenancy.on_time_rate ?? null
  const rateColor = rate != null ? onTimeColor(rate) : "text-slate-400"

  return (
    <div className={cn(
      "group w-full bg-white rounded-2xl border border-[#E6ECF4] shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
      "hover:shadow-md hover:border-blue-200/60 transition-all duration-200",
    )}>
      {/* Identity row */}
      <div className="flex items-center gap-4 p-5 border-b border-slate-100">
        {tenancy.tenant_avatar ? (
          <Image
            src={tenancy.tenant_avatar}
            alt={tenancy.tenant_name ?? "Tenant"}
            width={52}
            height={52}
            className="w-13 h-13 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
          />
        ) : (
          <div className="w-13 h-13 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[13px] font-bold select-none shrink-0"
            style={{ background: getTenantColor(tenancy) }}>{getTenantInitials(tenancy)}</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {tenancy.tenant_name ?? "Unknown tenant"}
            </h3>
            <StatusBadge status={tenancy.status} />
          </div>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            {tenancy.tenant_email && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Mail className="w-3 h-3" />{tenancy.tenant_email}
              </span>
            )}
            {tenancy.tenant_phone && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Phone className="w-3 h-3" />{tenancy.tenant_phone}
              </span>
            )}
            {(tenancy.property_name || tenancy.unit_name) && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Building2 className="w-3 h-3" />
                {tenancy.property_name}{tenancy.unit_name ? ` · ${tenancy.unit_name}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI metrics row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: "Monthly Rent", value: fmt(tenancy.rent_amount), sub: rentSuffix(tenancy.rent_frequency) },
          { label: "Deposit", value: tenancy.deposit_amount != null ? fmt(tenancy.deposit_amount) : "—", sub: tenancy.deposit_held_by ? "Protected" : undefined },
          { label: "Start Date", value: fmtDate(tenancy.start_date) },
          { label: "End Date", value: tenancy.end_date ? fmtDate(tenancy.end_date) : "Ongoing" },
          { label: "On-time Rate", value: rate != null ? `${rate}%` : "—", valueClass: rateColor },
        ].map(kpi => (
          <div key={kpi.label} className="px-4 py-3 text-center">
            <p className="text-[9.5px] text-slate-500 uppercase tracking-wider font-medium mb-1">{kpi.label}</p>
            <p className={cn("text-[14px] font-black tabular-nums", kpi.valueClass ?? "text-slate-900")}>{kpi.value}</p>
            {kpi.sub && <p className="text-[9px] text-slate-500 mt-0.5">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* Lease details row */}
      <div className="flex items-center gap-6 px-5 py-3 border-b border-slate-100 flex-wrap">
        {tenancy.lease_type && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{tenancy.lease_type}</span>
          </div>
        )}
        {tenancy.payment_day != null && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Rent due: day <span className="font-semibold text-slate-700">{tenancy.payment_day}</span></span>
          </div>
        )}
        {tenancy.end_date && daysUntil(tenancy.end_date) <= 90 && daysUntil(tenancy.end_date) >= 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-orange-600 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {daysUntil(tenancy.end_date)} days until expiry
          </div>
        )}
        {tenancy.notice_date && (
          <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Notice given · {fmtDate(tenancy.notice_date)}
          </div>
        )}
        <div className="ml-auto flex items-center gap-1 text-[11px] text-blue-600 font-semibold cursor-pointer hover:text-blue-700">
          Next action <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center gap-2 px-5 py-3 flex-wrap">
        <Link
          href={`/property-manager/portfolio/tenancies/${tenancy.id}`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-colors"
        >
          View full profile <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition-colors">
          <TrendingUp className="w-3.5 h-3.5" /> Payment history
        </button>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition-colors">
          Documents
        </button>
        <div className="ml-auto">
          <ActionMenu
            align="right"
            items={[
              { label: "View tenancy", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/tenancies/${tenancy.id}`) },
              { label: "View property", icon: Building2, onClick: () => router.push(`/property-manager/portfolio/properties/${tenancy.property_id}`) },
              { label: "Renew", icon: RefreshCw, onClick: () => {} },
              { label: "End tenancy", icon: LogOut, onClick: () => {} },
              { label: "Delete", icon: Trash2, onClick: () => {}, variant: "danger" },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4C — TenancyCardRisk                                                */
/* ------------------------------------------------------------------ */
export function TenancyCardRisk({ tenancy, onTakeAction }: { tenancy: TenancyCardData; onTakeAction?: (id: string) => void }) {
  const router = useRouter()
  const missed = tenancy.missed_payments ?? 0
  const arrears = tenancy.arrears ?? 0

  return (
    <div className={cn(
      "group w-full bg-white rounded-2xl border-l-4 border-red-500 border border-red-200 overflow-hidden",
      "shadow-[0_2px_8px_rgba(239,68,68,0.08)]",
      "hover:shadow-md transition-all duration-200 bg-red-50/10",
    )}>
      <div className="flex items-center gap-4 p-4">
        {/* Identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            {tenancy.tenant_avatar ? (
              <Image
                src={tenancy.tenant_avatar}
                alt={tenancy.tenant_name ?? "Tenant"}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[12px] font-bold select-none"
                style={{ background: getTenantColor(tenancy) }}>{getTenantInitials(tenancy)}</div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900 truncate">{tenancy.tenant_name ?? "Unknown tenant"}</p>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
              <Home className="w-3 h-3 shrink-0" />
              {tenancy.property_name}{tenancy.unit_name ? ` · ${tenancy.unit_name}` : ""}
            </p>
          </div>
        </div>

        {/* Arrears block */}
        <div className="shrink-0 text-center px-4 py-2 rounded-xl bg-red-50 border border-red-200">
          <p className="text-[20px] font-black text-red-700 tabular-nums leading-none">{fmt(arrears)}</p>
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mt-0.5">Overdue</p>
          {missed > 0 && <p className="text-[10px] text-red-500 mt-0.5">{missed} payment{missed !== 1 ? "s" : ""} missed</p>}
        </div>

        {/* Rent */}
        <div className="shrink-0 text-right hidden md:block">
          <p className="text-[13px] font-black text-slate-900 tabular-nums">{fmt(tenancy.rent_amount)}<span className="text-[10px] font-normal text-slate-500 ml-0.5">{rentSuffix(tenancy.rent_frequency)}</span></p>
          <p className="text-[10px] text-slate-500">Monthly rent</p>
        </div>

        {/* Lease period */}
        <div className="shrink-0 text-right hidden lg:block">
          <p className="text-[11px] text-slate-600">{fmtDate(tenancy.start_date)}{tenancy.end_date ? ` → ${fmtDate(tenancy.end_date)}` : ""}</p>
          <p className="text-[10px] text-slate-500">Lease period</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => onTakeAction?.(tenancy.id)}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-[12px] font-bold hover:bg-red-700 transition-colors shadow-sm"
        >
          Take action <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <ActionMenu
          align="right"
          items={[
            { label: "View tenancy", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/tenancies/${tenancy.id}`) },
            { label: "View property", icon: Building2, onClick: () => router.push(`/property-manager/portfolio/properties/${tenancy.property_id}`) },
            { label: "Renew", icon: RefreshCw, onClick: () => {} },
            { label: "End tenancy", icon: LogOut, onClick: () => {} },
          ]}
        />
      </div>

      {/* Alert strip */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-t border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <p className="text-[11px] font-semibold text-red-800">
          {missed > 0 ? `${missed} payment${missed !== 1 ? "s" : ""} overdue` : "Arrears detected"} · Total outstanding <span className="font-black tabular-nums">{fmt(arrears)}</span>
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4D — TenancyCardEndingSoon                                          */
/* ------------------------------------------------------------------ */
export function TenancyCardEndingSoon({ tenancy, onStartRenewal }: { tenancy: TenancyCardData; onStartRenewal?: (id: string) => void }) {
  const router = useRouter()
  const days = tenancy.end_date ? daysUntil(tenancy.end_date) : null

  return (
    <div className={cn(
      "group w-full bg-white rounded-2xl border border-orange-200 overflow-hidden",
      "shadow-[0_2px_8px_rgba(245,158,11,0.08)]",
      "hover:shadow-md transition-all duration-200",
    )}>
      <div className="flex items-center gap-4 p-4">
        {/* Identity */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            {tenancy.tenant_avatar ? (
              <Image
                src={tenancy.tenant_avatar}
                alt={tenancy.tenant_name ?? "Tenant"}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[12px] font-bold select-none"
                style={{ background: getTenantColor(tenancy) }}>{getTenantInitials(tenancy)}</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900 truncate">{tenancy.tenant_name ?? "Unknown tenant"}</p>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
              <Home className="w-3 h-3 shrink-0" />
              {tenancy.property_name}{tenancy.unit_name ? ` · ${tenancy.unit_name}` : ""}
            </p>
          </div>
        </div>

        {/* End date block */}
        <div className="shrink-0 text-center px-4 py-2 rounded-xl bg-orange-50 border border-orange-200">
          {tenancy.end_date && (
            <p className="text-[24px] font-black text-orange-600 leading-none">{fmtDate(tenancy.end_date)}</p>
          )}
          {days != null && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-orange-100 border border-orange-300 text-[10px] font-bold text-orange-700">
              {days}d remaining
            </span>
          )}
        </div>

        {/* Rent */}
        <div className="shrink-0 text-right hidden md:block">
          <p className="text-[13px] font-black text-slate-900 tabular-nums">{fmt(tenancy.rent_amount)}<span className="text-[10px] font-normal text-slate-500 ml-0.5">{rentSuffix(tenancy.rent_frequency)}</span></p>
          <p className="text-[10px] text-slate-500">Monthly rent</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => onStartRenewal?.(tenancy.id)}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-[12px] font-bold hover:bg-orange-600 transition-colors shadow-sm"
        >
          Start renewal <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <ActionMenu
          align="right"
          items={[
            { label: "View tenancy", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/tenancies/${tenancy.id}`) },
            { label: "View property", icon: Building2, onClick: () => router.push(`/property-manager/portfolio/properties/${tenancy.property_id}`) },
            { label: "Renew", icon: RefreshCw, onClick: () => {} },
            { label: "End tenancy", icon: LogOut, onClick: () => {} },
          ]}
        />
      </div>

      {/* Alert strip */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-t border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <p className="text-[11px] font-semibold text-amber-800">
          Lease ending soon — renewal recommended
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4E — TenancyCardCompact                                             */
/* ------------------------------------------------------------------ */
export function TenancyCardCompact({
  tenancy,
  selected,
  onSelect,
  onView,
}: {
  tenancy: TenancyCardData
  selected?: boolean
  onSelect?: (id: string) => void
  onView?: (id: string) => void
}) {
  const router = useRouter()
  return (
    <div
      onClick={() => onSelect?.(tenancy.id)}
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 cursor-pointer",
        "transition-colors duration-150",
        selected ? "bg-blue-50/40" : "hover:bg-slate-50/60",
      )}
    >
      {/* Checkbox */}
      <div className="shrink-0 w-4" onClick={e => { e.stopPropagation(); onSelect?.(tenancy.id) }}>
        {selected
          ? <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
          : <Square className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400" />
        }
      </div>

      {/* Avatar */}
      {tenancy.tenant_avatar ? (
        <Image
          src={tenancy.tenant_avatar}
          alt={tenancy.tenant_name ?? "Tenant"}
          width={24}
          height={24}
          className="w-6 h-6 rounded-full object-cover border border-white shadow-sm shrink-0"
        />
      ) : (
        <div className="w-6 h-6 rounded-full border border-white shadow-sm flex items-center justify-center text-white text-[8px] font-bold select-none shrink-0"
          style={{ background: getTenantColor(tenancy) }}>{getTenantInitials(tenancy)}</div>
      )}

      {/* Name */}
      <span className="text-[11px] font-semibold text-slate-800 w-32 shrink-0 truncate">{tenancy.tenant_name ?? "Unknown"}</span>

      {/* Property / room */}
      <span className="text-[11px] text-slate-500 min-w-0 flex-1 truncate hidden sm:block">
        {tenancy.property_name}{tenancy.unit_name ? ` · ${tenancy.unit_name}` : ""}
      </span>

      {/* Status */}
      <div className="shrink-0 hidden md:block">
        <StatusBadge status={tenancy.status} />
      </div>

      {/* Rent */}
      <span className="text-[11px] font-bold text-slate-700 tabular-nums w-20 text-right shrink-0 hidden md:block">
        {fmt(tenancy.rent_amount)}
      </span>

      {/* Start date */}
      <span className="text-[11px] text-slate-500 w-20 text-right shrink-0 hidden lg:block">{fmtDate(tenancy.start_date)}</span>

      {/* On-time rate */}
      <span className={cn(
        "text-[11px] font-semibold w-12 text-right shrink-0 tabular-nums hidden xl:block",
        tenancy.on_time_rate != null ? onTimeColor(tenancy.on_time_rate) : "text-slate-300",
      )}>
        {tenancy.on_time_rate != null ? `${tenancy.on_time_rate}%` : "—"}
      </span>

      {/* View button */}
      <button
        onClick={e => { e.stopPropagation(); onView?.(tenancy.id) }}
        className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-semibold hover:bg-blue-600 hover:text-white transition-colors"
      >
        View
      </button>

      {/* More menu */}
      <div onClick={e => e.stopPropagation()}>
        <ActionMenu
          align="right"
          items={[
            { label: "View tenancy", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/tenancies/${tenancy.id}`) },
            { label: "View property", icon: Building2, onClick: () => router.push(`/property-manager/portfolio/properties/${tenancy.property_id}`) },
            { label: "Renew", icon: RefreshCw, onClick: () => {} },
            { label: "End tenancy", icon: LogOut, onClick: () => {} },
          ]}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4F — TenancyCardInlineEdit                                          */
/* ------------------------------------------------------------------ */
export function TenancyCardInlineEdit({
  tenancy,
  onSave,
  onCancel,
}: {
  tenancy: TenancyCardData
  onSave?: (data: Partial<TenancyCardData>) => void
  onCancel?: () => void
}) {
  const [form, setForm] = useState({
    rent_amount: String(tenancy.rent_amount),
    deposit_amount: String(tenancy.deposit_amount ?? ""),
    start_date: tenancy.start_date,
    end_date: tenancy.end_date ?? "",
    payment_day: String(tenancy.payment_day ?? ""),
    lease_type: tenancy.lease_type ?? "",
    status: tenancy.status,
    property_name: tenancy.property_name ?? "",
    unit_name: tenancy.unit_name ?? "",
  })

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSave() {
    onSave?.({
      rent_amount: Number(form.rent_amount),
      deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      payment_day: form.payment_day ? Number(form.payment_day) : null,
      lease_type: form.lease_type || null,
      status: form.status as TenancyCardData["status"],
      property_name: form.property_name,
      unit_name: form.unit_name,
    })
  }

  const inputCls = "w-full text-[12px] text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-all"
  const labelCls = "text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block"

  return (
    <div className="w-full bg-white rounded-2xl border border-blue-200 shadow-[0_4px_16px_rgba(37,99,235,0.08)] overflow-hidden">
      {/* Identity row */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        {tenancy.tenant_avatar ? (
          <Image
            src={tenancy.tenant_avatar}
            alt={tenancy.tenant_name ?? "Tenant"}
            width={44}
            height={44}
            className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[12px] font-bold select-none shrink-0"
            style={{ background: getTenantColor(tenancy) }}>{getTenantInitials(tenancy)}</div>
        )}
        <div>
          <p className="text-[14px] font-bold text-slate-900">{tenancy.tenant_name ?? "Unknown tenant"}</p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Editing tenancy details</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={tenancy.status} />
        </div>
      </div>

      {/* Editable fields grid */}
      <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-3">
        <div>
          <label className={labelCls}>Monthly Rent (£)</label>
          <div className="relative">
            <PoundSterling className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="number" className={cn(inputCls, "pl-8 tabular-nums")} value={form.rent_amount} onChange={e => handleChange("rent_amount", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Deposit (£)</label>
          <div className="relative">
            <PoundSterling className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="number" className={cn(inputCls, "pl-8 tabular-nums")} value={form.deposit_amount} onChange={e => handleChange("deposit_amount", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="date" className={cn(inputCls, "pl-8")} value={form.start_date} onChange={e => handleChange("start_date", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>End Date</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="date" className={cn(inputCls, "pl-8")} value={form.end_date} onChange={e => handleChange("end_date", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Payment Day</label>
          <div className="relative">
            <Edit2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="number" min={1} max={31} className={cn(inputCls, "pl-8 tabular-nums")} value={form.payment_day} onChange={e => handleChange("payment_day", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Lease Type</label>
          <select className={inputCls} value={form.lease_type} onChange={e => handleChange("lease_type", e.target.value)}>
            <option value="">Select...</option>
            <option value="Fixed term">Fixed term</option>
            <option value="Periodic">Periodic</option>
            <option value="Contractual">Contractual</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={e => handleChange("status", e.target.value)}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
            <option value="terminated">Terminated</option>
            <option value="uncollectable">Uncollectable</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Property</label>
          <input type="text" className={inputCls} value={form.property_name} onChange={e => handleChange("property_name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Room / Unit</label>
          <input type="text" className={inputCls} value={form.unit_name} onChange={e => handleChange("unit_name", e.target.value)} />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Save changes
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4G — TenancyCardPaymentSummary                                      */
/* ------------------------------------------------------------------ */
export function TenancyCardPaymentSummary({ tenancy }: { tenancy: TenancyCardData }) {
  const rate = tenancy.on_time_rate ?? 0
  const missed = tenancy.missed_payments ?? 0
  const lateRate = Math.max(0, 100 - rate - Math.min(missed * 10, 30))
  const overdueRate = Math.max(0, 100 - rate - lateRate)

  const donutData = [
    { name: "On time", value: rate, color: "#10B981" },
    { name: "Late", value: lateRate, color: "#F59E0B" },
    { name: "Overdue", value: overdueRate, color: "#EF4444" },
  ].filter(d => d.value > 0)

  const rateColor = onTimeColor(rate)
  const total = tenancy.total_paid ?? 0
  const isExcellent = rate >= 95

  return (
    <div className={cn(
      "group w-full bg-white rounded-2xl border border-[#E6ECF4] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden",
      "hover:shadow-md hover:border-blue-200/60 transition-all duration-200",
    )}>
      {/* Main content row */}
      <div className="flex items-start gap-6 p-5">
        {/* Donut chart */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="w-[120px] h-[120px]">
            <Donut data={donutData} innerRadius={36} outerRadius={54} />
          </div>
          {total > 0 && (
            <p className="text-[10px] text-slate-500 text-center mt-1 tabular-nums font-semibold">
              Total paid {fmt(total)}
            </p>
          )}
        </div>

        {/* Right column: metrics */}
        <div className="flex-1 min-w-0">
          {/* Tenant identity */}
          <div className="flex items-center gap-2 mb-3">
            {tenancy.tenant_avatar ? (
              <Image
                src={tenancy.tenant_avatar}
                alt={tenancy.tenant_name ?? "Tenant"}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover border border-white shadow-sm shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border border-white shadow-sm flex items-center justify-center text-white text-[10px] font-bold select-none shrink-0"
                style={{ background: getTenantColor(tenancy) }}>{getTenantInitials(tenancy)}</div>
            )}
            <div>
              <p className="text-[13px] font-bold text-slate-900">{tenancy.tenant_name ?? "Unknown tenant"}</p>
              <p className="text-[10px] text-slate-500">{tenancy.property_name}{tenancy.unit_name ? ` · ${tenancy.unit_name}` : ""}</p>
            </div>
          </div>

          {/* Metric rows */}
          <div className="space-y-2">
            {[
              { label: "Monthly rent", value: fmt(tenancy.rent_amount), suffix: rentSuffix(tenancy.rent_frequency) },
              { label: "Deposit", value: tenancy.deposit_amount != null ? fmt(tenancy.deposit_amount) : "—" },
              { label: "On-time rate", value: `${rate}%`, valueClass: rateColor },
              { label: "Total paid", value: total > 0 ? fmt(total) : "—" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{row.label}</span>
                <span className={cn("text-[12px] font-bold tabular-nums", row.valueClass ?? "text-slate-800")}>
                  {row.value}{row.suffix ? <span className="text-[9px] font-normal text-slate-500 ml-0.5">{row.suffix}</span> : null}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {[
              { color: "#10B981", label: "On time" },
              { color: "#F59E0B", label: "Late" },
              { color: "#EF4444", label: "Overdue" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                <span className="text-[9.5px] text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI insight strip */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-2.5 border-t",
        isExcellent
          ? "bg-emerald-50 border-emerald-200"
          : rate >= 70
          ? "bg-amber-50 border-amber-200"
          : "bg-red-50 border-red-200",
      )}>
        <Check className={cn("w-3.5 h-3.5 shrink-0", isExcellent ? "text-emerald-600" : rate >= 70 ? "text-amber-600" : "text-red-600")} />
        <p className={cn("text-[11px] font-semibold",
          isExcellent ? "text-emerald-800" : rate >= 70 ? "text-amber-800" : "text-red-800",
        )}>
          {isExcellent
            ? "Excellent payment record — Tenant has maintained high on-time payments."
            : rate >= 70
            ? "Good payment record — Some late payments recorded, monitor closely."
            : "Payment issues detected — Consider arrears review and follow-up action."}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4H — TenancyCardMobile                                              */
/* ------------------------------------------------------------------ */
export function TenancyCardMobile({ tenancy, onView }: { tenancy: TenancyCardData; onView?: (id: string) => void }) {
  const router = useRouter()
  const rate = tenancy.on_time_rate ?? null
  const days = tenancy.end_date ? daysUntil(tenancy.end_date) : null

  return (
    <div className={cn(
      "w-full max-w-sm bg-white rounded-2xl border border-[#E6ECF4] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden",
      "hover:shadow-md hover:border-blue-200/60 transition-all duration-200",
    )}>
      {/* Top row: avatar + name + status + menu */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="relative shrink-0">
          {tenancy.tenant_avatar ? (
            <Image
              src={tenancy.tenant_avatar}
              alt={tenancy.tenant_name ?? "Tenant"}
              width={44}
              height={44}
              className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[12px] font-bold select-none"
              style={{ background: getTenantColor(tenancy) }}>{getTenantInitials(tenancy)}</div>
          )}
          <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
            STATUS_CFG[tenancy.status]?.dot ?? "bg-slate-400")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-slate-900 truncate">{tenancy.tenant_name ?? "Unknown tenant"}</p>
          <StatusBadge status={tenancy.status} />
        </div>
        <ActionMenu
          align="right"
          items={[
            { label: "View tenancy", icon: Eye, onClick: () => router.push(`/property-manager/portfolio/tenancies/${tenancy.id}`) },
            { label: "View property", icon: Building2, onClick: () => router.push(`/property-manager/portfolio/properties/${tenancy.property_id}`) },
            { label: "Renew", icon: RefreshCw, onClick: () => {} },
            { label: "End tenancy", icon: LogOut, onClick: () => {} },
          ]}
        />
      </div>

      {/* Property / unit row */}
      <div className="flex items-center gap-1.5 px-4 pb-3 text-[11px] text-slate-500">
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{tenancy.property_name ?? "—"}{tenancy.unit_name ? ` · ${tenancy.unit_name}` : ""}</span>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-px bg-slate-100 border-t border-slate-100">
        {[
          { label: "Rent", value: fmt(tenancy.rent_amount), sub: rentSuffix(tenancy.rent_frequency) },
          { label: "Deposit", value: tenancy.deposit_amount != null ? fmt(tenancy.deposit_amount) : "—" },
          {
            label: "Lease period",
            value: fmtDate(tenancy.start_date),
            sub: tenancy.end_date ? `→ ${fmtDate(tenancy.end_date)}` : "Ongoing",
          },
          {
            label: "On-time rate",
            value: rate != null ? `${rate}%` : "—",
            valueClass: rate != null ? onTimeColor(rate) : "text-slate-400",
          },
        ].map(cell => (
          <div key={cell.label} className="bg-white px-4 py-3">
            <p className="text-[9.5px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">{cell.label}</p>
            <p className={cn("text-[13px] font-black tabular-nums", cell.valueClass ?? "text-slate-900")}>{cell.value}</p>
            {cell.sub && <p className="text-[10px] text-slate-500">{cell.sub}</p>}
          </div>
        ))}
      </div>

      {/* Next action row */}
      {days != null && days >= 0 && days <= 60 ? (
        <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50 border-t border-orange-200">
          <span className="text-[11px] font-semibold text-orange-700">Lease ending in {days} days</span>
          <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
        </div>
      ) : (tenancy.arrears ?? 0) > 0 ? (
        <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 border-t border-red-200">
          <span className="text-[11px] font-semibold text-red-700">Arrears: {fmt(tenancy.arrears!)}</span>
          <ArrowRight className="w-3.5 h-3.5 text-red-500" />
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100">
          <span className="text-[11px] text-slate-500">No pending actions</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
        </div>
      )}

      {/* View details button */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={() => onView?.(tenancy.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-colors"
        >
          View details <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Exports                                                              */
/* ------------------------------------------------------------------ */
export default TenancyCardStandard
export { TenancyCardStandard as TenancyCard }
