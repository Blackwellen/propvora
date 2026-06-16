"use client"

import React from "react"
import Link from "next/link"
import type { Tenancy } from "@/hooks/useTenancies"
import type { Contact } from "@/types/database"
import { Users, Plus, ArrowUpRight, Phone, Mail } from "lucide-react"
import { StatusPill, fmtGBP, fmtDate, avatarInitials } from "./shared"

export function UnitTenancyTab({ unitId, tenancy, tenant }: { unitId: string; tenancy: Tenancy | null; tenant: Contact | null }) {
  if (!tenancy) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
          <Users className="w-6 h-6 text-slate-300" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-slate-600">No tenancy for this unit</p>
          <p className="text-[12px] text-slate-500 mt-1">Create a tenancy to track the tenant, rent and deposit.</p>
        </div>
        <Link href={`/app/portfolio/tenancies/new?unitId=${unitId}`} className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-blue-600 rounded-xl px-4 py-2 hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> New Tenancy
        </Link>
      </div>
    )
  }

  const statusColor: "emerald" | "amber" | "slate" | "red" =
    tenancy.status === "active" ? "emerald" : tenancy.status === "draft" ? "amber" : (tenancy.status === "terminated" || tenancy.status === "uncollectable") ? "red" : "slate"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* LEFT */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-slate-900">Tenancy Overview</h3>
            <Link href={`/app/portfolio/tenancies/${tenancy.id}`} className="flex items-center gap-1.5 text-[12px] text-blue-600 font-semibold hover:underline border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
              <ArrowUpRight className="w-3 h-3" /> Open
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Tenant</div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">{tenant ? avatarInitials(tenant.full_name) : "—"}</div>
                <span className="text-[13px] font-semibold text-slate-800">{tenant?.full_name ?? "Unassigned"}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Tenancy Type</div>
              <div className="text-[13px] font-semibold text-slate-800 capitalize">{(tenancy.tenancy_type ?? "—").replace(/_/g, " ")}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Tenancy Start</div>
              <div className="text-[13px] font-semibold text-slate-800">{fmtDate(tenancy.start_date)}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Tenancy End</div>
              <div className="text-[13px] font-semibold text-slate-800">{tenancy.end_date ? fmtDate(tenancy.end_date) : "Periodic"}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Rent</div>
              <div className="text-[13px] font-semibold text-slate-800 tabular-nums">{fmtGBP(tenancy.rent_amount)}/{tenancy.rent_frequency === "monthly" ? "month" : tenancy.rent_frequency}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Reference</div>
              <div className="text-[13px] font-semibold text-slate-800">{tenancy.reference ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Status</div>
              <StatusPill label={tenancy.status.charAt(0).toUpperCase() + tenancy.status.slice(1)} color={statusColor} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-[14px] font-bold text-slate-900 mb-4">Deposit</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Deposit Held</div>
              <div className="text-[16px] font-bold tabular-nums text-slate-900">{tenancy.deposit_amount != null ? fmtGBP(tenancy.deposit_amount) : "—"}</div>
              {tenancy.deposit_scheme && <div className="text-[10px] text-emerald-600 font-medium">Protected ({tenancy.deposit_scheme})</div>}
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Scheme</div>
              <div className="text-[13px] font-semibold text-slate-800">{tenancy.deposit_scheme ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Reference</div>
              <div className="text-[13px] font-semibold text-slate-800">{tenancy.deposit_reference ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-[13px] font-bold text-slate-900 mb-3">Contact</h3>
          {tenant ? (
            <div className="space-y-3">
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 hover:text-blue-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[12px] font-semibold text-slate-800">{tenant.phone}</div>
                    <div className="text-[10px] text-slate-500">Phone</div>
                  </div>
                </a>
              )}
              {tenant.email && (
                <a href={`mailto:${tenant.email}`} className="flex items-center gap-2 hover:text-blue-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[12px] font-semibold text-slate-800">{tenant.email}</div>
                    <div className="text-[10px] text-slate-500">Email</div>
                  </div>
                </a>
              )}
              {!tenant.phone && !tenant.email && <p className="text-[12px] text-slate-500">No contact details recorded.</p>}
            </div>
          ) : (
            <p className="text-[12px] text-slate-500">No tenant contact linked.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-[13px] font-bold text-slate-900 mb-3">Tenancy Actions</h3>
          <div className="space-y-2">
            <Link href={`/app/portfolio/tenancies/${tenancy.id}`} className="block text-left text-[12px] text-slate-700 font-medium px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              Manage tenancy
            </Link>
            <Link href={`/app/portfolio/tenancies/${tenancy.id}?tab=deposit`} className="block text-left text-[12px] text-slate-700 font-medium px-3 py-2 rounded-xl border border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              Deposit & release
            </Link>
            <Link href={`/app/portfolio/tenancies/${tenancy.id}?tab=payments`} className="block text-left text-[12px] text-blue-600 font-semibold px-3 py-2 rounded-xl border border-blue-200 hover:bg-blue-50 flex items-center gap-1 transition-colors">
              View payments <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
