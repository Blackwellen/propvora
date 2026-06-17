"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { InlineEditMoney, InlineEditSelect, InlineEditDate } from "@/components/editing"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import {
  Home, Building2, Activity, Calendar, ArrowUpRight, Mail, Phone,
} from "lucide-react"
import { StatusPill, SectionCard, fmtGBP, fmtDate, type TenancyDisplay, type TenancyActivityRow } from "./shared"

export function OverviewTab({ t, activity, activityLoaded, onSave }: {
  t: TenancyDisplay
  activity: TenancyActivityRow[]
  activityLoaded: boolean
  onSave: (field: string, value: unknown) => Promise<void>
}) {
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

        {/* Key Terms */}
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

        {/* Important Dates */}
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

        {/* Financial Summary */}
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
        {/* Recent Activity */}
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

        {/* Quick stats */}
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
