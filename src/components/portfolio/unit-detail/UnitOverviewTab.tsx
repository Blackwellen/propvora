"use client"

import React from "react"
import Link from "next/link"
import type { Unit } from "@/hooks/useUnits"
import type { Tenancy } from "@/hooks/useTenancies"
import type { Contact } from "@/types/database"
import { InlineEditField, InlineEditMoney, InlineEditSelect } from "@/components/editing"
import {
  Home, Users, PoundSterling, Upload,
  Shield, Calendar, ArrowUpRight, Zap, Package, Star,
  Plus, ChevronRight, Phone, Mail,
} from "lucide-react"
import { StatusPill, KpiCard, fmtGBP, fmtDate, avatarInitials } from "./shared"

export function UnitOverviewTab({ unit, tenancy, tenant, onSave }: {
  unit: Unit
  tenancy: Tenancy | null
  tenant: Contact | null
  onSave: (field: string, value: unknown) => Promise<void>
}) {
  const isOccupied = unit.status === "occupied"
  const rent = tenancy?.rent_amount ?? unit.target_rent ?? null
  const deposit = tenancy?.deposit_amount ?? null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* LEFT ~60% */}
      <div className="lg:col-span-3 space-y-4">
        {/* Photo placeholder — replace with real uploads from Documents tab */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative h-[260px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)" }}>
            <div className="flex flex-col items-center gap-3 opacity-30">
              <Home size={52} className="text-white" />
            </div>
            <button className="absolute top-3 right-3 bg-white/90 hover:bg-white text-[12px] font-semibold text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all">
              <Upload size={12} />
              Add Photos
            </button>
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-white/70 text-[11px]">No photos uploaded yet</span>
            </div>
          </div>
          <div className="flex gap-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                className="w-[60px] h-[48px] rounded-lg overflow-hidden border-2 border-transparent flex-shrink-0 bg-slate-100 flex items-center justify-center"
              >
                <Home size={14} className="text-slate-300" />
              </button>
            ))}
            <div className="w-[60px] h-[48px] rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-500 flex-shrink-0">
              +
            </div>
          </div>
        </div>

        {/* Unit Name & Location */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <InlineEditField
                value={unit.unit_name}
                onSave={(v) => onSave("unit_name", v)}
                label="Unit name"
                displayClassName="text-xl font-bold text-slate-900"
              />
              <span className="inline-flex items-center gap-1">
                {unit.status === "occupied" && <StatusPill label="Occupied" color="emerald" />}
                {unit.status === "vacant" && <StatusPill label="Vacant" color="amber" />}
                {unit.status === "reserved" && <StatusPill label="Reserved" color="blue" />}
                {unit.status === "under_works" && <StatusPill label="Under Works" color="slate" />}
                <InlineEditSelect
                  value={unit.status}
                  onSave={(v) => onSave("status", v)}
                  transition={(v) => onSave("status", v)}
                  label="Status"
                  options={[
                    { value: "occupied", label: "Occupied" },
                    { value: "vacant", label: "Vacant" },
                    { value: "under_works", label: "Under Works" },
                    { value: "reserved", label: "Reserved" },
                  ]}
                  displayClassName="sr-only"
                />
              </span>
            </div>
          </div>

          {/* Spec Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 pt-2 border-t border-slate-100">
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Unit Type</div>
              <InlineEditField
                value={unit.unit_type ?? ""}
                onSave={(v) => onSave("unit_type", v)}
                type="select"
                options={[
                  { value: "Room", label: "Room" },
                  { value: "flat", label: "Flat" },
                  { value: "studio", label: "Studio" },
                  { value: "suite", label: "Suite" },
                  { value: "apartment", label: "Apartment" },
                  { value: "other", label: "Other" },
                ]}
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Floor</div>
              <InlineEditField
                value={unit.floor ?? ""}
                onSave={(v) => onSave("floor", v ? Number(v) : null)}
                type="number"
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Bedrooms</div>
              <InlineEditField
                value={unit.bedrooms ?? ""}
                onSave={(v) => onSave("bedrooms", v ? Number(v) : null)}
                type="number"
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Floor Area (m²)</div>
              <InlineEditField
                value={unit.floor_area_sqm ?? ""}
                onSave={(v) => onSave("floor_area_sqm", v ? Number(v) : null)}
                type="number"
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Target Rent (£)</div>
              <InlineEditMoney
                value={unit.target_rent ?? ""}
                onSave={(v) => onSave("target_rent", v ? Number(v) : null)}
                label="Target rent"
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Room features */}
          <div className="flex items-center gap-3 pt-1">
            {[
              { icon: Home, label: unit.unit_type ?? "Unit" },
              { icon: Package, label: `${unit.bathrooms ?? 0} bath` },
              { icon: Zap, label: `Floor ${unit.floor ?? "—"}` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                <Icon className="w-3 h-3 text-blue-500" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions — wired to real routes */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/property-manager/portfolio/tenancies/new?unitId=${unit.id}`} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">
            New Tenancy
          </Link>
          <Link href={`/property-manager/work/jobs/new?unitId=${unit.id}`} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">
            Raise Job
          </Link>
          {unit.property_id && (
            <Link href={`/property-manager/portfolio/properties/${unit.property_id}`} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm">
              View Property
            </Link>
          )}
          <Link href={`/property-manager/compliance?unit=${unit.id}`} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1">
            Compliance <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* RIGHT ~40% */}
      <div className="lg:col-span-2 space-y-4">
        {/* KPI Cards — live */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Occupancy" value={isOccupied ? "Occupied" : "Vacant"} sub={isOccupied ? "Tenanted" : "Available"} icon={Users} accent={isOccupied ? "text-emerald-600" : "text-amber-600"} />
          <KpiCard label="Monthly Rent" value={rent != null ? fmtGBP(rent) : "—"} sub={tenancy ? "From tenancy" : "Target"} icon={PoundSterling} />
          <KpiCard label="Deposit" value={deposit != null ? fmtGBP(deposit) : "—"} sub={tenancy?.deposit_scheme ?? "—"} icon={Shield} accent={deposit != null ? "text-emerald-600" : undefined} />
          <KpiCard label="Lease Ends" value={tenancy?.end_date ? fmtDate(tenancy.end_date) : "—"} sub={tenancy ? "Current tenancy" : "No tenancy"} icon={Calendar} />
          <KpiCard label="Floor Area" value={unit.floor_area_sqm != null ? `${unit.floor_area_sqm} m²` : "—"} sub="Net" icon={Home} />
          <KpiCard label="Bedrooms" value={unit.bedrooms != null ? String(unit.bedrooms) : "—"} sub="In unit" icon={Star} />
        </div>

        {/* Current Tenant — live */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Current Tenant</div>
          {tenancy && tenant ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {avatarInitials(tenant.full_name)}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900">{tenant.full_name}</div>
                  <div className="text-[11px] text-slate-500">Since {fmtDate(tenancy.start_date)}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-[12px] text-slate-600 mb-3">
                {tenant.phone && <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 hover:text-blue-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {tenant.phone}</a>}
                {tenant.email && <a href={`mailto:${tenant.email}`} className="flex items-center gap-2 hover:text-blue-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> {tenant.email}</a>}
              </div>
              <Link href={`/property-manager/portfolio/tenancies/${tenancy.id}`} className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
                View tenancy details <ChevronRight className="w-3 h-3" />
              </Link>
            </>
          ) : tenancy ? (
            <>
              <p className="text-[12px] text-slate-500 mb-3">A tenancy is linked but no tenant contact is recorded.</p>
              <Link href={`/property-manager/portfolio/tenancies/${tenancy.id}`} className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
                View tenancy details <ChevronRight className="w-3 h-3" />
              </Link>
            </>
          ) : (
            <div className="text-center py-2">
              <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-[12px] text-slate-500 mb-2">No active tenancy</p>
              <Link href={`/property-manager/portfolio/tenancies/new?unitId=${unit.id}`} className="text-[12px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
                <Plus className="w-3 h-3" /> Create tenancy
              </Link>
            </div>
          )}
        </div>

        {/* Income Summary — live */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Income Summary</div>
            <Link href="/property-manager/money" className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-0.5">
              Money <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Monthly Rent</span>
              <span className="tabular-nums font-medium text-slate-800">{rent != null ? fmtGBP(rent) : "—"}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Deposit Held</span>
              <span className="tabular-nums font-medium text-slate-800">{deposit != null ? fmtGBP(deposit) : "—"}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between text-[13px] font-bold">
              <span className="text-slate-700">Annualised Rent</span>
              <span className="tabular-nums text-emerald-600">{rent != null ? fmtGBP(rent * 12) : "—"}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Detailed transactions live in the Money section.</p>
        </div>
      </div>
    </div>
  )
}
