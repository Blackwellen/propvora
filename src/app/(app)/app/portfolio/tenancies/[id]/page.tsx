"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useTenancy, useUpdateTenancy, useDeleteTenancy } from "@/hooks/useTenancies"
import { useContact } from "@/hooks/useContacts"
import { useProperty } from "@/hooks/useProperties"
import { useUnit } from "@/hooks/useUnits"
import { useTenancyMessages, useSendTenancyMessage } from "@/hooks/useTenancyThread"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { InlineEditField, InlineEditMoney, InlineEditDate, InlineEditSelect, InlineEditTextarea } from "@/components/editing"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import MobileTabs from "@/components/mobile/MobileTabs"
import {
  Building2, Home, Users, PoundSterling, AlertTriangle, Calendar, FileText, Activity, ChevronRight, ChevronLeft,
  Plus, Edit2, Check,
  Shield, XCircle, Sparkles, ArrowUpRight, Phone, Mail, MessageCircle,
  RefreshCw, Send, Trash2,
} from "lucide-react"



/* ─────────────────────── DISPLAY SHAPE ─────────────────────── */

interface TenancyDisplay {
  id: string
  tenantName: string
  tenantRole: string
  tenantPhone: string
  tenantEmail: string
  tenantAvatarInitials: string
  address: string
  property: string
  propertyId?: string | null
  unit: string
  unitId?: string | null
  unitSize: string
  leaseStart: string
  leaseEnd: string
  leaseTerm: string
  rent: number
  deposit: number
  depositScheme: string
  depositCertNo: string
  depositProtectedOn: string
  depositExpiry: string
  paymentDay: string
  paymentMethod: string
  tenancyType: string
  tenancyTypeRaw: string | null
  rentFrequency: string
  depositHeldBy: string | null
  notes: string | null
  status: string
  rawStatus?: string
  arrears: number
  onTimeRate: number
  totalPaid6m: number
  totalDue6m: number
}

/* ─────────────────────── HELPERS ─────────────────────── */

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—"
  const date = new Date(d)
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

/** Time-only label for chat bubbles, e.g. "14:32". */
const fmtTime = (d: string | null | undefined) => {
  if (!d) return ""
  const date = new Date(d)
  if (isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

/** Human day-separator label: Today / Yesterday / full date. */
const dayLabel = (d: string) => {
  const date = new Date(d)
  if (isNaN(date.getTime())) return ""
  const today = new Date()
  const y = new Date(); y.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (same(date, today)) return "Today"
  if (same(date, y)) return "Yesterday"
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
}

/** Initials from a name. */
const nameInitials = (name: string) => {
  const p = name.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return "?"
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

interface TenancyActivityRow {
  id: string
  action: string | null
  entity_type: string | null
  entity_id: string | null
  description: string | null
  created_at: string
}

/** Live activity_log for a tenancy, 42P01-safe. */
function useTenancyActivity(workspaceId: string | undefined, tenancyId: string) {
  const [events, setEvents] = useState<TenancyActivityRow[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!workspaceId || !tenancyId) return
    const supabase = createClient()
    let active = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("id, action, entity_type:resource_type, entity_id:resource_id, description, created_at")
          .eq("workspace_id", workspaceId)
          .eq("entity_id", tenancyId)
          .order("created_at", { ascending: false })
          .limit(40)
        if (error) { if (active) setLoaded(true); return }
        if (active) { setEvents((data as TenancyActivityRow[]) ?? []); setLoaded(true) }
      } catch { if (active) setLoaded(true) }
    })()
    return () => { active = false }
  }, [workspaceId, tenancyId])
  return { events, loaded }
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    paid_on_time: { label: "Paid on time", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    paid_late: { label: "Paid late", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    overdue: { label: "Overdue", cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
    upcoming: { label: "Upcoming", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
    current: { label: "Current", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    due_renewal: { label: "Due renewal", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    expired: { label: "Expired", cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
    Protected: { label: "Protected", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    Resolved: { label: "Resolved", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
    High: { label: "High", cls: "bg-red-50 text-red-700 ring-1 ring-red-200" },
    Medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    Low: { label: "Low", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
  }
  const cfg = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", cfg.cls)}>
      {cfg.label}
    </span>
  )
}

function EditPen({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Edit field"
      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
    </button>
  )
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm", className)}>
      {children}
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  subColor,
  icon: Icon,
  iconBg,
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
  icon?: React.ElementType
  iconBg?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1 min-w-0">
      {Icon && (
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1", iconBg ?? "bg-slate-100")}>
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
      )}
      <span className="text-xs text-slate-500 font-medium truncate">{label}</span>
      <span className="text-xl font-bold text-slate-900 tabular-nums">{value}</span>
      {sub && <span className={cn("text-xs font-medium", subColor ?? "text-slate-500")}>{sub}</span>}
    </div>
  )
}

/* ─────────────────────── TABS ─────────────────────── */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "payments", label: "Payments" },
  { id: "documents", label: "Documents" },
  { id: "timeline", label: "Timeline" },
  { id: "notes", label: "Notes" },
  { id: "activity", label: "Activity" },
  { id: "deposit", label: "Deposit" },
  { id: "communications", label: "Communications" },
]

/* ─────────────────────── TAB: OVERVIEW (3A) ─────────────────────── */

function OverviewTab({ t, activity, activityLoaded, onSave }: { t: TenancyDisplay; activity: TenancyActivityRow[]; activityLoaded: boolean; onSave: (field: string, value: any) => Promise<void> }) {
  return (
    <div className="flex flex-col lg:flex-row gap-5 mt-4">
      {/* Left 60% */}
      <div className="flex-[3] flex flex-col gap-4 min-w-0">
        {/* Tenant Identity */}
        <SectionCard className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">{t.tenantAvatarInitials}</span>
            </div>
            {/* Name + actions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{t.tenantName}</h2>
                <StatusPill status={t.status} />
                <div className="ml-auto">
                  <ActionMenu
                    align="right"
                    items={[
                      ...(t.tenantEmail ? [{ label: "Send email", icon: Mail, onClick: () => { window.location.href = `mailto:${t.tenantEmail}` } }] : []),
                      ...(t.tenantPhone ? [{ label: "Call tenant", icon: Phone, onClick: () => { window.location.href = `tel:${t.tenantPhone}` } }] : []),
                      ...(t.propertyId ? [{ label: "View property", icon: Home, onClick: () => { window.location.href = `/app/portfolio/properties/${t.propertyId}` } }] : []),
                    ]}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">{t.tenantRole}</span>
              {(t.tenantEmail || t.tenantPhone) && (
                <div className="flex items-center gap-4 mt-2">
                  {t.tenantEmail && (
                    <a href={`mailto:${t.tenantEmail}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                      <Mail className="w-3.5 h-3.5" />{t.tenantEmail}
                    </a>
                  )}
                  {t.tenantPhone && (
                    <a href={`tel:${t.tenantPhone}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                      <Phone className="w-3.5 h-3.5" />{t.tenantPhone}
                    </a>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 mt-1.5">
                {t.propertyId ? (
                  <Link href={`/app/portfolio/properties/${t.propertyId}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <Home className="w-3.5 h-3.5" />{t.property}
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500"><Home className="w-3.5 h-3.5" />{t.property}</span>
                )}
                {t.unitId ? (
                  <Link href={`/app/portfolio/units/${t.unitId}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <Building2 className="w-3.5 h-3.5" />{t.unit} ({t.unitSize})
                  </Link>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500"><Building2 className="w-3.5 h-3.5" />{t.unit}</span>
                )}
              </div>
            </div>
          </div>

          {/* Editable fields grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Rent (£)</span>
              <InlineEditMoney
                value={t.rent}
                onSave={(v) => onSave("rent_amount", v ? Number(v) : null)}
                label="Rent amount"
                displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Frequency</span>
              <InlineEditSelect
                value={t.rentFrequency}
                onSave={(v) => onSave("rent_frequency", v)}
                label="Rent frequency"
                options={[
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "nightly", label: "Nightly" },
                ]}
                displayClassName="text-sm font-semibold text-slate-800 capitalize"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Type</span>
              <InlineEditSelect
                value={t.tenancyTypeRaw ?? ""}
                onSave={(v) => onSave("tenancy_type", v || null)}
                label="Tenancy type"
                placeholder="Set type"
                options={[
                  { value: "ast", label: "AST" },
                  { value: "periodic", label: "Periodic" },
                  { value: "contractual", label: "Contractual" },
                  { value: "lodger", label: "Lodger" },
                  { value: "commercial", label: "Commercial" },
                  { value: "hmo_room", label: "HMO Room" },
                ]}
                displayClassName="text-sm font-semibold text-slate-800 uppercase"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Deposit (£)</span>
              <InlineEditMoney
                value={t.deposit}
                onSave={(v) => onSave("deposit_amount", v ? Number(v) : null)}
                label="Deposit amount"
                displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Lease Start</span>
              <InlineEditDate
                value={t.leaseStart}
                onSave={(v) => onSave("start_date", v)}
                label="Lease start"
                displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Lease End</span>
              <InlineEditDate
                value={t.leaseEnd === "Periodic" ? "" : t.leaseEnd}
                onSave={(v) => onSave("end_date", v || null)}
                label="Lease end"
                placeholder="Periodic"
                displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Status</span>
              <InlineEditSelect
                value={t.rawStatus ?? "active"}
                onSave={(v) => onSave("status", v)}
                transition={(v) => onSave("status", v)}
                label="Status"
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "ended", label: "Ended" },
                  { value: "terminated", label: "Terminated" },
                  { value: "uncollectable", label: "Uncollectable" },
                ]}
                displayClassName="text-sm font-semibold text-slate-800"
              />
            </div>
          </div>
        </SectionCard>

        {/* Key Terms — live, derived from the tenancy */}
        <SectionCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-800">Key Terms</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Monthly Rent", value: t.rent != null ? fmtGBP(t.rent) : "—" },
              { label: "Deposit", value: t.deposit ? fmtGBP(t.deposit) : "—" },
              { label: "Annualised Rent", value: t.rent != null ? fmtGBP(t.rent * 12) : "—" },
              { label: "Status", value: t.status },
            ].map((m) => (
              <div key={m.label} className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide leading-tight">{m.label}</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">{m.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Important Dates — live from tenancy dates */}
        <SectionCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-800">Important Dates</span>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {[
              { icon: Calendar, label: "Lease Start", date: fmtDate(t.leaseStart), iconColor: "text-blue-600", iconBg: "bg-blue-50" },
              { icon: Calendar, label: "Lease End", date: t.leaseEnd && t.leaseEnd !== "Periodic" ? fmtDate(t.leaseEnd) : "Periodic", iconColor: "text-violet-600", iconBg: "bg-violet-50" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 py-2.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", row.iconBg)}>
                  <row.icon className={cn("w-4 h-4", row.iconColor)} />
                </div>
                <span className="text-sm text-slate-700 flex-1">{row.label}</span>
                <span className="text-sm font-semibold text-slate-900">{row.date}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Financial Summary — routes to Money */}
        <SectionCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-800">Financial Summary</span>
            <Link href="/app/money" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Open Money <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Monthly Rent", value: t.rent != null ? fmtGBP(t.rent) : "—", color: "text-slate-900" },
              { label: "Deposit Held", value: t.deposit ? fmtGBP(t.deposit) : "—", color: "text-slate-900" },
              { label: "Annualised", value: t.rent != null ? fmtGBP(t.rent * 12) : "—", color: "text-emerald-600" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{s.label}</span>
                <p className={cn("text-lg font-bold tabular-nums mt-0.5", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Payments, arrears and statements are tracked in the Money section.</p>
        </SectionCard>
      </div>

      {/* Right 40% */}
      <div className="flex-[2] flex flex-col gap-4 min-w-0">
        {/* Recent Activity — live */}
        <SectionCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-800">Recent Activity</span>
          </div>
          {activity.length === 0 ? (
            <div className="bg-slate-50 rounded-xl p-5 text-center">
              <Activity className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">{activityLoaded ? "No activity recorded yet" : "Loading…"}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activity.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{a.action ?? a.description ?? "Activity"}</p>
                    <p className="text-xs text-slate-500">{fmtDate(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Quick stats — live */}
        <SectionCard className="p-5">
          <span className="text-sm font-bold text-slate-800 block mb-3">Quick Stats</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-[10px] text-blue-700 font-semibold uppercase tracking-wide">Monthly Rent</p>
              <p className="text-2xl font-bold text-blue-700 tabular-nums mt-1">{t.rent != null ? fmtGBP(t.rent) : "—"}</p>
            </div>
            <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
              <p className="text-[10px] text-violet-700 font-semibold uppercase tracking-wide">Deposit</p>
              <p className="text-2xl font-bold text-violet-700 tabular-nums mt-1">{t.deposit ? fmtGBP(t.deposit) : "—"}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wide">Scheme</p>
              <p className="text-lg font-bold text-emerald-700 tabular-nums mt-1.5">{t.depositScheme}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Status</p>
              <p className="text-lg font-bold text-slate-800 mt-1.5">{t.status}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

/* ─────────────────────── TAB: PAYMENTS (3B) ─────────────────────── */

function PaymentsTab({ t }: { t: TenancyDisplay }) {
  const rent = t.rent ?? 0
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-slate-500">Rent terms shown from the tenancy. Recorded payments, arrears and receipts live in Money.</p>
        <Link href="/app/money" className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-blue-600 rounded-xl px-4 py-2 hover:bg-blue-700 transition-colors shadow-sm">
          Open Money <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Strip — live rent terms */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Monthly Rent", value: rent > 0 ? fmtGBP(rent) : "—", sub: "Per month" },
          { label: "Annualised", value: rent > 0 ? fmtGBP(rent * 12) : "—", sub: "Rent × 12" },
          { label: "Deposit Held", value: t.deposit ? fmtGBP(t.deposit) : "—", sub: t.depositScheme },
          { label: "Status", value: t.status, sub: "Tenancy" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{k.label}</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">{k.value}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <SectionCard className="p-10 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <PoundSterling className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">Payment history is tracked in Money</p>
          <p className="text-[12px] text-slate-500 mt-1">Record rent receipts, charges and arrears against this tenancy in the Money section.</p>
        </div>
        <Link href="/app/money" className="text-[12px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
          Go to Money <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </SectionCard>
    </div>
  )
}

/* ─────────────────────── TAB: DOCUMENTS (3C) ─────────────────────── */

function DocumentsTab({ tenancyId }: { tenancyId: string }) {
  const { workspace } = useWorkspace()
  return (
    <div className="mt-4 flex flex-col gap-4">
      <SectionCard className="p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">Tenancy Documents</h3>
        <EvidenceUpload
          workspaceId={workspace?.id}
          folder="tenancy-documents"
          table="property_documents"
          extra={{ tenancy_id: tenancyId }}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        />
        <p className="text-[11px] text-slate-500 mt-3">Lease agreements, right-to-rent checks, guarantor and inventory documents. Files are stored securely.</p>
      </SectionCard>
    </div>
  )
}

/* ─────────────────────── TAB: TIMELINE (3D) ─────────────────────── */

function TimelineTab({ events, loaded }: { events: TenancyActivityRow[]; loaded: boolean }) {
  if (events.length === 0) {
    return (
      <div className="mt-4">
        <SectionCard className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-600">{loaded ? "No timeline events yet" : "Loading timeline…"}</p>
            <p className="text-[12px] text-slate-500 mt-1">Lifecycle events for this tenancy will appear here.</p>
          </div>
        </SectionCard>
      </div>
    )
  }
  return (
    <div className="mt-4 flex flex-col gap-4">
      <SectionCard className="p-6">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
          <div className="flex flex-col gap-0">
            {events.map((ev) => (
              <div key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white bg-blue-500">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="flex-1 pt-1 pb-0.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-900">{ev.action ?? "Activity"}</span>
                    <span className="text-xs text-slate-500 tabular-nums">{fmtDate(ev.created_at)}</span>
                  </div>
                  {ev.description && <p className="text-sm text-slate-600">{ev.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

/* ─────────────────────── TAB: NOTES (3E) ─────────────────────── */

function NotesTab({ notes, onSave }: { notes: string | null | undefined; onSave: (field: string, value: any) => Promise<void> }) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <SectionCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-800">Tenancy Notes</span>
        </div>
        <InlineEditTextarea
          value={notes ?? ""}
          onSave={(v) => onSave("notes", v)}
          label="Tenancy notes"
          placeholder="Add notes to keep context in one place…"
          displayClassName="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
        />
      </SectionCard>
    </div>
  )
}

/* ─────────────────────── TAB: ACTIVITY (3F) ─────────────────────── */

function ActivityTab({ events, loaded }: { events: TenancyActivityRow[]; loaded: boolean }) {
  if (events.length === 0) {
    return (
      <div className="mt-4">
        <SectionCard className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-600">{loaded ? "No activity yet" : "Loading activity…"}</p>
            <p className="text-[12px] text-slate-500 mt-1">Actions taken on this tenancy will appear here.</p>
          </div>
        </SectionCard>
      </div>
    )
  }
  return (
    <div className="mt-4 flex flex-col gap-4">
      <SectionCard className="p-6">
        <div className="flex flex-col gap-0">
          {events.map((a, i) => (
            <div key={a.id} className="flex gap-4 pb-5 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1 bg-blue-500" />
                {i < events.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">{a.action ?? "Activity"}</span>
                    {a.description && <span className="text-sm text-slate-600 ml-2">— {a.description}</span>}
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">{fmtDate(a.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/* ─────────────────────── TAB: DEPOSIT (3G) ─────────────────────── */

function DepositTab({ t, onSave }: { t: TenancyDisplay; onSave: (field: string, value: any) => Promise<void> }) {
  const protectedStatus = t.depositScheme && t.depositScheme !== "—" ? "Protected" : "Not recorded"
  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* KPI Strip — live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Deposit Amount", value: t.deposit ? fmtGBP(t.deposit) : "—", sub: "", color: "text-slate-900" },
          { label: "Scheme", value: t.depositScheme, sub: "", color: "text-slate-900" },
          { label: "Reference", value: t.depositCertNo, sub: "", color: "text-slate-900" },
          { label: "Status", value: protectedStatus, sub: "", color: protectedStatus === "Protected" ? "text-emerald-600" : "text-amber-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{k.label}</p>
            <p className={cn("text-lg font-bold tabular-nums mt-1", k.color)}>{k.value}</p>
            {k.sub && <p className="text-[11px] text-slate-500 mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Protection Details */}
          <SectionCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-800">Protection Details</span>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Held By</span>
                <InlineEditSelect
                  value={t.depositHeldBy ?? ""}
                  onSave={(v) => onSave("deposit_held_by", v || null)}
                  label="Deposit held by"
                  placeholder="Set holder"
                  options={[
                    { value: "landlord", label: "Landlord" },
                    { value: "scheme", label: "Scheme" },
                    { value: "agent", label: "Agent" },
                  ]}
                  displayClassName="text-sm font-semibold text-slate-800 capitalize"
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Scheme</span>
                <InlineEditField
                  value={t.depositScheme}
                  onSave={(v) => onSave("deposit_scheme", v)}
                  label="Deposit scheme"
                  displayClassName="text-sm font-semibold text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Reference</span>
                <InlineEditField
                  value={t.depositCertNo}
                  onSave={(v) => onSave("deposit_reference", v)}
                  label="Deposit reference"
                  displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
                />
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-xs text-slate-500">Protected Amount</span>
                <InlineEditMoney
                  value={t.deposit}
                  onSave={(v) => onSave("deposit_amount", v ? Number(v) : null)}
                  label="Protected amount"
                  displayClassName="text-sm font-semibold text-slate-800 tabular-nums"
                />
              </div>
            </div>
          </SectionCard>

          {/* Potential Deductions */}
          <SectionCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">Potential Deductions</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">£0 — No proposed deductions</span>
            </div>
            <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700">
              <Plus className="w-3.5 h-3.5" /> Add deduction
            </button>
          </SectionCard>

          {/* Dispute Status */}
          <SectionCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">Dispute Status</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <span className="text-sm text-slate-500">None — No disputes raised</span>
            </div>
          </SectionCard>
        </div>

        {/* Right */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Release Workflow */}
          <SectionCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-800">Release Workflow</span>
              <span className="text-xs text-slate-500">0 of 4 steps</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Tenant has given notice", status: "not_started" },
                { label: "Inspection completed", status: "pending" },
                { label: "Deductions confirmed", status: "pending" },
                { label: "Deposit released", status: "pending" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      step.status === "not_started"
                        ? "border-slate-300 bg-white"
                        : "border-slate-200 bg-slate-50"
                    )}
                  >
                    {step.status === "done" && <Check className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <span className="text-sm text-slate-700">{step.label}</span>
                  <span className="ml-auto text-xs text-slate-500 capitalize">{step.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "0%" }} />
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-600 rounded-xl py-2.5 hover:bg-blue-700 transition-colors">
              <ArrowUpRight className="w-4 h-4" /> Start Release Process
            </button>
          </SectionCard>

          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Deposit return deadline approaching</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Deposit must be returned by {t.depositExpiry} (10 days after tenancy ends). Failure to return may result in penalties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────── TAB: COMMUNICATIONS (3H) ─────────────────────── */

function CommunicationsTab({ t, tenancyId }: { t: TenancyDisplay; tenancyId: string }) {
  const { workspace } = useWorkspace()
  const hasContact = !!(t.tenantEmail || t.tenantPhone)
  const { data: messages = [], isLoading } = useTenancyMessages(workspace?.id, tenancyId)
  const sendMessage = useSendTenancyMessage()
  const [draft, setDraft] = useState("")
  const threadRef = React.useRef<HTMLDivElement>(null)

  // Keep the thread pinned to the latest message.
  React.useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages])

  async function handleSend() {
    const body = draft.trim()
    if (!body || !workspace?.id || sendMessage.isPending) return
    try {
      await sendMessage.mutateAsync({
        workspaceId: workspace.id,
        tenancyId,
        title: `${t.tenantName} — ${t.property}`,
        body,
      })
      setDraft("")
    } catch {
      /* mutation surfaces error state below */
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <SectionCard className="p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">Contact Tenant</h3>
        {hasContact ? (
          <div className="flex flex-wrap gap-3">
            {t.tenantEmail && (
              <a href={`mailto:${t.tenantEmail}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Mail className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{t.tenantEmail}</div>
                  <div className="text-[11px] text-slate-500">Send email</div>
                </div>
              </a>
            )}
            {t.tenantPhone && (
              <a href={`tel:${t.tenantPhone}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Phone className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">{t.tenantPhone}</div>
                  <div className="text-[11px] text-slate-500">Call tenant</div>
                </div>
              </a>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <MessageCircle className="w-7 h-7 text-slate-200 mx-auto mb-2" />
            <p className="text-[13px] text-slate-500">No contact details for this tenant</p>
            <p className="text-[12px] text-slate-500 mt-1">Add a phone or email to the tenant contact to enable communication.</p>
          </div>
        )}
      </SectionCard>

      {/* In-app message thread — real messages on this tenancy's thread */}
      <SectionCard className="flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-600" />
          <h3 className="text-[14px] font-bold text-slate-900">Message Thread</h3>
          {messages.length > 0 && (
            <span className="text-[11px] font-semibold text-slate-500">{messages.length} message{messages.length === 1 ? "" : "s"}</span>
          )}
        </div>

        {/* Message list — grouped bubbles with avatars + date separators */}
        <div ref={threadRef} className="max-h-[440px] overflow-y-auto px-4 sm:px-5 py-4 flex flex-col gap-1.5 bg-slate-50/40">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className={cn("h-12 rounded-2xl bg-slate-100 animate-pulse", i % 2 ? "self-end w-1/2" : "self-start w-2/3")} />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-[13px] font-semibold text-slate-600">No messages yet</p>
              <p className="text-[12px] text-slate-500 mt-1">Start the conversation with a message below.</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const prev = messages[i - 1]
              const showDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at)
              // Group consecutive bubbles from the same sender (hide avatar/name on followers).
              const grouped = !!prev && prev.mine === m.mine && !showDay
              const senderLabel = m.mine ? "You" : m.sender_name
              return (
                <React.Fragment key={m.id}>
                  {showDay && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-slate-200/70" />
                      <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">{dayLabel(m.created_at)}</span>
                      <div className="flex-1 h-px bg-slate-200/70" />
                    </div>
                  )}
                  <div className={cn("flex items-end gap-2 max-w-[82%]", m.mine ? "self-end flex-row-reverse" : "self-start", grouped ? "mt-0.5" : "mt-2")}>
                    {/* Avatar (only on first of a group) */}
                    {!m.mine && (
                      grouped
                        ? <div className="w-7 shrink-0" />
                        : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">{nameInitials(senderLabel)}</div>
                    )}
                    <div className={cn("flex flex-col min-w-0", m.mine ? "items-end" : "items-start")}>
                      {!grouped && (
                        <span className="text-[10px] font-medium text-slate-500 mb-0.5 px-1">{senderLabel}</span>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
                          m.mine
                            ? cn("bg-blue-600 text-white", grouped ? "rounded-br-md" : "rounded-br-sm")
                            : cn("bg-white border border-slate-200 text-slate-800", grouped ? "rounded-bl-md" : "rounded-bl-sm")
                        )}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 px-1 tabular-nums">{fmtTime(m.created_at)}</span>
                    </div>
                  </div>
                </React.Fragment>
              )
            })
          )}
        </div>

        {/* Composer — sticky at the bottom of the thread card */}
        <div className="sticky bottom-0 border-t border-slate-100 p-3 bg-white">
          {sendMessage.isError && (
            <p className="text-[11px] text-red-500 mb-2 px-1">Couldn&apos;t send your message. Please try again.</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend() }
              }}
              rows={2}
              placeholder="Write a message…  (Ctrl/⌘ + Enter to send)"
              className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sendMessage.isPending || !workspace?.id}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{sendMessage.isPending ? "Sending…" : "Send"}</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 px-1">Internal thread for this tenancy. Tenant-facing delivery is handled by the portal where enabled.</p>
        </div>
      </SectionCard>
    </div>
  )
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */

export default function TenancyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenancyId = params.id as string
  const { workspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState("overview")
  const { data: tenancy, isLoading } = useTenancy(workspace?.id, tenancyId)
  const { data: tenantContact } = useContact(workspace?.id, tenancy?.tenant_contact_id ?? undefined)
  const { data: property } = useProperty(workspace?.id, tenancy?.property_id)
  const { data: unit } = useUnit(workspace?.id, tenancy?.unit_id ?? undefined)
  const { events: activityEvents, loaded: activityLoaded } = useTenancyActivity(workspace?.id, tenancyId)
  const updateTenancy = useUpdateTenancy()
  const deleteTenancy = useDeleteTenancy()

  async function save(field: string, value: any) {
    if (!workspace?.id) return
    await updateTenancy.mutateAsync({ id: tenancyId, workspaceId: workspace.id, payload: { [field]: value } })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading tenancy...</p>
        </div>
      </div>
    )
  }

  // Honest not-found state — no fabricated demo tenancy.
  if (!tenancy) {
    return (
      <div className="min-h-screen bg-slate-50/40 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Users className="w-7 h-7 text-slate-300" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-700">Tenancy not found</p>
            <p className="text-[13px] text-slate-500 mt-1">This tenancy doesn’t exist or you don’t have access to it.</p>
          </div>
          <Link href="/app/portfolio/tenancies" className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Tenancies
          </Link>
        </div>
      </div>
    )
  }

  // Build display object from the real tenancy record only.
  const tenantName = tenantContact?.full_name ?? (tenancy.tenant_contact_id ? "Tenant" : "Unassigned tenant")
  const t: TenancyDisplay = {
    id: tenancy.id,
    tenantName,
    tenantRole: "Primary Tenant",
    tenantPhone: tenantContact?.phone ?? "",
    tenantEmail: tenantContact?.email ?? "",
    tenantAvatarInitials: (tenantContact?.full_name ?? tenancy.reference ?? tenancy.id).slice(0, 2).toUpperCase(),
    address: [property?.address_line1, property?.city, property?.postcode].filter(Boolean).join(", "),
    property: property?.name ?? "Property",
    propertyId: tenancy.property_id,
    unit: unit?.unit_name ?? (tenancy.unit_id ? "Unit" : "—"),
    unitId: tenancy.unit_id ?? null,
    unitSize: unit?.floor_area_sqm != null ? `${unit.floor_area_sqm}m²` : "—",
    leaseStart: tenancy.start_date,
    leaseEnd: tenancy.end_date ?? "Periodic",
    leaseTerm: tenancy.tenancy_type ?? "AST",
    rent: tenancy.rent_amount,
    deposit: tenancy.deposit_amount ?? 0,
    depositScheme: tenancy.deposit_scheme ?? "—",
    depositCertNo: tenancy.deposit_reference ?? "—",
    depositProtectedOn: tenancy.start_date,
    depositExpiry: tenancy.end_date ?? "—",
    paymentDay: "1st of each month",
    paymentMethod: "Bank Transfer",
    tenancyType: (tenancy.tenancy_type ?? "AST").toUpperCase(),
    tenancyTypeRaw: tenancy.tenancy_type ?? null,
    rentFrequency: tenancy.rent_frequency ?? "monthly",
    depositHeldBy: tenancy.deposit_held_by ?? null,
    notes: tenancy.notes ?? null,
    status: tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1),
    rawStatus: tenancy.status,
    arrears: 0,
    onTimeRate: 100,
    totalPaid6m: 0,
    totalDue6m: tenancy.rent_amount * 6,
  }

  return (
    <div className="min-h-screen bg-slate-50/40">
      {/* Mobile top bar */}
      <MobileTopBar
        title={t.tenantName}
        subtitle={`${t.property}, ${t.unit}`}
        showBack
        backHref="/app/portfolio/tenancies"
        primaryAction={{ label: "New tenancy", icon: Plus, href: t.propertyId ? `/app/portfolio/tenancies/new?propertyId=${t.propertyId}` : "/app/portfolio/tenancies/new" }}
        overflowActions={[
          ...(tenancy?.property_id ? [{ label: "View property", icon: Building2, href: `/app/portfolio/properties/${tenancy.property_id}` }] : []),
          ...(tenancy?.unit_id ? [{ label: "View unit", icon: Home, href: `/app/portfolio/units/${tenancy.unit_id}` }] : []),
          { label: "End tenancy", icon: XCircle, destructive: true, onClick: () => save("status", "ended") },
        ]}
      />

      <div className="px-4 md:px-6 pb-6 pt-4">

        {/* Breadcrumb — hidden on phones */}
        <div className="hidden md:flex items-center gap-1.5 text-sm mb-3">
          <Link href="/app/portfolio" className="text-slate-500 hover:text-slate-700 transition-colors">Portfolio</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/app/portfolio/tenancies" className="text-slate-500 hover:text-slate-700 transition-colors">Tenancies</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-medium">{t.tenantName}</span>
        </div>

        {/* Page Header — hidden on phones */}
        <div className="hidden md:flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tenancy Lifecycle, Payments &amp; Deposit</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t.tenantName} — {t.property}, {t.unit}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ConfirmDialog
              title="Delete this tenancy?"
              description="This will permanently delete the tenancy record. This cannot be undone."
              confirmLabel="Delete tenancy"
              onConfirm={async () => {
                await deleteTenancy.mutateAsync({ id: tenancyId, workspaceId: workspace!.id })
                router.push("/app/portfolio/tenancies")
              }}
            >
              {(openDelete) => (
                <ActionMenu
                  items={[
                    { label: "View property", icon: Building2, onClick: () => tenancy?.property_id && router.push(`/app/portfolio/properties/${tenancy.property_id}`) },
                    { label: "View unit", icon: Home, onClick: () => tenancy?.unit_id && router.push(`/app/portfolio/units/${tenancy.unit_id}`) },
                    { label: "Renew tenancy", icon: RefreshCw, onClick: () => setActiveTab("overview") },
                    { label: "End tenancy", icon: XCircle, variant: "danger", onClick: () => save("status", "ended") },
                    { label: "Delete tenancy", icon: Trash2, variant: "danger", onClick: openDelete },
                  ]}
                />
              )}
            </ConfirmDialog>

            {/* AI Insights */}
            <button className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 border border-violet-200 bg-violet-50 rounded-xl px-4 py-2 hover:bg-violet-100 transition-colors shadow-sm">
              <Sparkles className="w-4 h-4" /> AI Insights
            </button>

            {/* New */}
            <Link
              href={t.propertyId ? `/app/portfolio/tenancies/new?propertyId=${t.propertyId}` : "/app/portfolio/tenancies/new"}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 rounded-xl px-4 py-2 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Tenancy
            </Link>
          </div>
        </div>

        {/* Tab Bar — desktop */}
        <div className="hidden md:flex items-center gap-0 border-b border-slate-200 mb-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab strip — mobile */}
        <div className="md:hidden mb-4">
          <MobileTabs
            tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
            value={activeTab}
            onChange={setActiveTab}
            aria-label="Tenancy sections"
          />
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <OverviewTab t={t} activity={activityEvents} activityLoaded={activityLoaded} onSave={save} />}
        {activeTab === "payments" && <PaymentsTab t={t} />}
        {activeTab === "documents" && <DocumentsTab tenancyId={tenancyId} />}
        {activeTab === "timeline" && <TimelineTab events={activityEvents} loaded={activityLoaded} />}
        {activeTab === "notes" && <NotesTab notes={tenancy?.notes} onSave={save} />}
        {activeTab === "activity" && <ActivityTab events={activityEvents} loaded={activityLoaded} />}
        {activeTab === "deposit" && <DepositTab t={t} onSave={save} />}
        {activeTab === "communications" && <CommunicationsTab t={t} tenancyId={tenancyId} />}
      </div>
    </div>
  )
}
