"use client"

import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import nextDynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import {
  InlineEditField,
  InlineEditMoney,
  InlineEditSelect,
} from "@/components/editing"
import { getPropertyTypeOption, PROPERTY_TYPE_OPTIONS } from "@/lib/constants/propertyTypes"
import {
  Building2, Home, Users, PoundSterling,
  Wrench, Calendar, FileText,
  Upload, Activity, Shield,
  ArrowUpRight,
} from "lucide-react"
import type { Property } from "@/types/database"
import type { Unit } from "@/hooks/useUnits"
import type { Tenancy } from "@/hooks/useTenancies"
import {
  ComplianceItemRow,
  ActivityRow,
  complianceCounts,
  getPropertyGradient,
  fmt,
  fmtDate,
  SectionHeader,
  Card,
  KpiCard,
} from "./shared"

// OpenStreetMap (Leaflet) — client-only, premium-styled.
const LocationMap = nextDynamic(() => import("@/components/maps/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-2xl bg-slate-100 animate-pulse" />,
})

export interface OverviewTabProps {
  prop: Property
  unitsList: Unit[]
  tenanciesList: Tenancy[]
  complianceItems: ComplianceItemRow[]
  complianceLoaded: boolean
  activity: ActivityRow[]
  activityLoaded: boolean
  jobs: { id: string; status: string }[]
  tasks: { id: string; status: string }[]
  coverImageUrl: string | null
  onCoverUpload: (file: File) => Promise<void>
  uploadingCover: boolean
  coverError: string | null
  coverInputRef: React.RefObject<HTMLInputElement | null>
  onSave: (field: string, value: any) => Promise<void>
  onGoTab: (tab: string) => void
}

export function OverviewTab({
  prop, unitsList, tenanciesList, complianceItems, complianceLoaded,
  activity, activityLoaded, jobs, tasks, coverImageUrl, onCoverUpload,
  uploadingCover, coverError, coverInputRef, onSave, onGoTab,
}: OverviewTabProps) {
  const [heroCoverError, setHeroCoverError] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const showCoverImage = !!coverImageUrl && !heroCoverError

  const occupied = unitsList.filter((u) => u.status === "occupied").length
  const totalUnits = unitsList.length
  const occupancyPct = totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : null
  const activeTenancyRent = tenanciesList
    .filter((t) => t.status === "active")
    .reduce((s, t) => s + (t.rent_amount ?? 0), 0)
  const monthlyRent = activeTenancyRent > 0 ? activeTenancyRent : (prop.target_rent ?? 0)
  const comp = complianceCounts(complianceItems)
  const jobDone = ["complete", "closed", "disputed"]
  const taskDone = ["done", "cancelled"]
  const openJobs = jobs.filter((j) => !jobDone.includes(j.status)).length
  const openTasks = tasks.filter((t) => !taskDone.includes(t.status)).length
  const openWork = openJobs + openTasks
  const nextDue = complianceItems
    .map((c) => c.due_date)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()) && d.getTime() >= Date.now())
    .sort((a, b) => a.getTime() - b.getTime())[0]

  const dwellingLabel = prop.category
    ? (getPropertyTypeOption(prop.category)?.label ?? prop.category)
    : null

  return (
    <div className="space-y-5">
      {/* Hero + right col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Hero */}
          <div
            className="relative h-[220px] shrink-0 rounded-2xl overflow-hidden group"
            style={!showCoverImage ? { background: getPropertyGradient(prop.property_type) } : undefined}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files?.[0]
              if (file && file.type.startsWith("image/")) onCoverUpload(file)
            }}
          >
            {showCoverImage ? (
              <Image
                src={coverImageUrl!}
                alt={prop.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 800px"
                onError={() => setHeroCoverError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-20">
                <Building2 size={64} className="text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="text-white/90 text-[13px] font-semibold uppercase tracking-widest">{dwellingLabel ?? prop.property_type?.toUpperCase() ?? "PROPERTY"}</span>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onCoverUpload(file)
                e.target.value = ""
              }}
            />
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white text-[12px] font-semibold text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all disabled:opacity-60"
            >
              <Upload size={12} />
              {uploadingCover ? "Uploading…" : "Edit Cover"}
            </button>
            {coverError && (
              <div className="absolute top-14 right-3 max-w-[260px] bg-red-600 text-white text-[11px] font-medium px-3 py-2 rounded-lg shadow-lg">
                {coverError}
              </div>
            )}
            {dragOver && (
              <div className="absolute inset-0 bg-blue-600/30 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl border-2 border-blue-400 border-dashed">
                <div className="text-center text-white">
                  <Upload size={32} className="mx-auto mb-2" />
                  <p className="text-[14px] font-semibold">Drop to upload cover</p>
                </div>
              </div>
            )}
          </div>

          {/* Financial & occupancy snapshot */}
          <Card className="p-4 flex-1 flex flex-col justify-center">
            <SectionHeader title="Financial & Occupancy" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Monthly Rent", value: prop.target_rent != null ? `£${Number(prop.target_rent).toLocaleString()}` : "—", color: "text-slate-900" },
                { label: "Units", value: String(totalUnits), color: "text-slate-900" },
                { label: "Occupied", value: String(occupied), color: "text-emerald-600" },
                { label: "Occupancy", value: totalUnits > 0 ? `${Math.round((occupied / totalUnits) * 100)}%` : "—", color: "text-[#2563EB]" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <p className={cn("text-[18px] font-bold tabular-nums", item.color)}>{item.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right col */}
        <div className="space-y-4">
          <Card className="p-4">
            <SectionHeader
              title="Compliance Snapshot"
              action={
                <button onClick={() => onGoTab("compliance")} className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-0.5">
                  View <ArrowUpRight size={11} />
                </button>
              }
            />
            {comp.total === 0 ? (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Shield size={20} className="text-slate-300 mx-auto mb-1.5" />
                <p className="text-[12px] text-slate-500">{complianceLoaded ? "No compliance items tracked yet" : "Loading…"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Items", value: String(comp.total), color: "text-slate-900" },
                  { label: "Due Soon", value: String(comp.dueSoon), color: comp.dueSoon > 0 ? "text-amber-600" : "text-slate-400" },
                  { label: "Overdue", value: String(comp.overdue), color: comp.overdue > 0 ? "text-red-600" : "text-slate-400" },
                  { label: "Compliant", value: comp.pct != null ? `${comp.pct}%` : "—", color: "text-emerald-600" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className={cn("text-[18px] font-bold tabular-nums", item.color)}>{item.value}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <SectionHeader title="Quick Health" />
            <div className="space-y-2.5">
              {[
                { label: "Occupancy", value: occupancyPct != null ? `${occupancyPct}%` : "—", good: occupancyPct == null || occupancyPct >= 80 },
                { label: "Open Work", value: String(openWork), good: openWork === 0 },
                { label: "Overdue Compliance", value: comp.total === 0 ? "—" : String(comp.overdue), good: comp.overdue === 0 },
                { label: "Active Tenancies", value: String(tenanciesList.filter((t) => t.status === "active").length), good: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-600">{row.label}</span>
                  <span className={cn("text-[12px] font-semibold tabular-nums", row.good ? "text-emerald-600" : "text-amber-600")}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionHeader
              title="Recent Activity"
              action={
                <button onClick={() => onGoTab("activity")} className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-0.5">
                  View all <ArrowUpRight size={11} />
                </button>
              }
            />
            {activity.length === 0 ? (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <Activity size={20} className="text-slate-300 mx-auto mb-1.5" />
                <p className="text-[12px] text-slate-500">{activityLoaded ? "No activity recorded yet" : "Loading…"}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activity.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex gap-2.5">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-500" />
                    <div>
                      <p className="text-[12px] text-slate-700 leading-snug">{item.description ?? item.action ?? "Activity"}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{fmtDate(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        <KpiCard icon={Users} iconColor="#2563EB" value={occupancyPct != null ? `${occupancyPct}%` : "—"} label="Occupancy" sub={`${occupied} of ${totalUnits} units`} />
        <KpiCard icon={PoundSterling} iconColor="#10B981" value={monthlyRent > 0 ? fmt(monthlyRent) : "—"} label="Monthly Rent" sub="From active tenancies" />
        <KpiCard icon={Home} iconColor="#7C3AED" value={String(totalUnits)} label="Units" sub={`${occupied} occupied`} />
        <KpiCard icon={FileText} iconColor="#F59E0B" value={String(tenanciesList.filter((t) => t.status === "active").length)} label="Tenancies" sub="Active leases" />
        <KpiCard icon={Wrench} iconColor="#EF4444" value={String(openWork)} label="Open Work" sub={`${openJobs} jobs · ${openTasks} tasks`} />
        <KpiCard icon={Shield} iconColor="#10B981" value={comp.total === 0 ? "—" : (comp.pct != null ? `${comp.pct}%` : "—")} label="Compliant" sub={`${comp.overdue} overdue · ${comp.dueSoon} due soon`} />
        <KpiCard icon={Calendar} iconColor="#2563EB" value={nextDue ? fmtDate(nextDue.toISOString()) : "—"} label="Next Due" sub="Compliance item" />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Property summary */}
          <Card className="p-5">
            <SectionHeader title="Property Summary" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 md:gap-x-10 gap-y-3 text-[13px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Dwelling Type</span>
                <InlineEditSelect
                  value={prop.category ?? ""}
                  onSave={(v) => onSave("category", v)}
                  label="Dwelling type"
                  options={PROPERTY_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Operation Profile</span>
                <InlineEditSelect
                  value={prop.operation_profile ?? ""}
                  onSave={(v) => onSave("operation_profile", v || null)}
                  label="Operation profile"
                  placeholder="Set profile"
                  options={[
                    { value: "long_term_let", label: "Long-term Let" },
                    { value: "hmo", label: "HMO" },
                    { value: "student_let", label: "Student Let" },
                    { value: "serviced_accommodation", label: "Serviced Accommodation" },
                    { value: "rent_to_rent", label: "Rent to Rent" },
                    { value: "holiday_let", label: "Holiday Let" },
                    { value: "build_to_rent", label: "Build to Rent" },
                    { value: "social_housing", label: "Social Housing" },
                    { value: "commercial", label: "Commercial" },
                    { value: "mixed_use", label: "Mixed Use" },
                  ]}
                  displayClassName="font-medium text-slate-800 capitalize"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Status</span>
                <InlineEditSelect
                  value={prop.status ?? "active"}
                  onSave={(v) => onSave("status", v)}
                  transition={(v) => onSave("status", v)}
                  label="Status"
                  options={[
                    { value: "active", label: "Active" },
                    { value: "vacant", label: "Void" },
                    { value: "under_works", label: "Off Market" },
                    { value: "archived", label: "Archived" },
                  ]}
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Target Rent</span>
                <InlineEditMoney
                  value={prop.target_rent ?? ""}
                  onSave={(v) => onSave("target_rent", v ? Number(v) : null)}
                  label="Target rent"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Bedrooms</span>
                <InlineEditField
                  value={prop.bedrooms ?? ""}
                  onSave={(v) => onSave("bedrooms", v ? Number(v) : null)}
                  type="number"
                  label="Bedrooms"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Bathrooms</span>
                <InlineEditField
                  value={prop.bathrooms ?? ""}
                  onSave={(v) => onSave("bathrooms", v ? Number(v) : null)}
                  type="number"
                  label="Bathrooms"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Floor Area</span>
                <InlineEditField
                  value={prop.floor_area_sqm ?? ""}
                  onSave={(v) => onSave("floor_area_sqm", v ? Number(v) : null)}
                  type="number"
                  label="Floor area"
                  displayClassName="font-medium text-slate-800"
                  placeholder="—"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Address Line 1</span>
                <InlineEditField
                  value={prop.address_line1 ?? ""}
                  onSave={(v) => onSave("address_line1", v)}
                  label="Address line 1"
                  placeholder="Add address"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Address Line 2</span>
                <InlineEditField
                  value={prop.address_line2 ?? ""}
                  onSave={(v) => onSave("address_line2", v)}
                  label="Address line 2"
                  placeholder="—"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">City</span>
                <InlineEditField
                  value={prop.city ?? ""}
                  onSave={(v) => onSave("city", v)}
                  label="City"
                  placeholder="—"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">County</span>
                <InlineEditField
                  value={prop.county ?? ""}
                  onSave={(v) => onSave("county", v)}
                  label="County"
                  placeholder="—"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Postcode</span>
                <InlineEditField
                  value={prop.postcode ?? ""}
                  onSave={(v) => onSave("postcode", v)}
                  label="Postcode"
                  displayClassName="font-medium text-slate-800"
                />
              </div>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <span className="text-[12px] text-slate-500 block mb-1">Notes</span>
              <InlineEditField
                value={prop.notes ?? ""}
                onSave={(v) => onSave("notes", v)}
                type="textarea"
                label="Notes"
                useSheetOnMobile
                placeholder="Add notes…"
                displayClassName="text-[13px] text-slate-700"
              />
            </div>
          </Card>

          {/* Financial summary */}
          <Card className="p-5">
            <SectionHeader
              title="Financial Summary"
              action={
                <Link href="/app/money" className="text-[12px] text-blue-600 font-medium hover:underline flex items-center gap-1">
                  Open Money <ArrowUpRight size={12} />
                </Link>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Monthly Rent (active)", value: monthlyRent > 0 ? fmt(monthlyRent) : "—", color: "text-slate-900" },
                { label: "Target Rent", value: prop.target_rent != null ? fmt(prop.target_rent) : "—", color: "text-slate-900" },
                { label: "Annualised", value: monthlyRent > 0 ? fmt(monthlyRent * 12) : "—", color: "text-emerald-600" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <p className={cn("text-[18px] font-bold tabular-nums", item.color)}>{item.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Full income, expenses and yield tracking lives in the Money section.
            </p>
          </Card>
        </div>

        {/* Location */}
        <div>
          <Card className="p-5">
            <SectionHeader title="Location" />
            <div className="mb-3 overflow-hidden rounded-xl">
              <LocationMap
                height={160}
                zoom={15}
                markers={[
                  {
                    id: prop.id,
                    lat: prop.latitude,
                    lng: prop.longitude,
                    address: [prop.address_line1, prop.address_line2, prop.city, prop.postcode]
                      .filter(Boolean)
                      .join(", ") || null,
                    label: prop.name,
                    sublabel: [prop.city, prop.postcode].filter(Boolean).join(" ") || undefined,
                  },
                ]}
              />
            </div>
            <p className="text-[12px] text-slate-600 font-medium mb-2">
              {prop.address_line1 ?? "Address not set"}
              {[prop.city, prop.postcode].filter(Boolean).length > 0 && <><br />{[prop.city, prop.postcode].filter(Boolean).join(" ")}</>}
            </p>
            {prop.address_line1 || (Number.isFinite(prop.latitude) && Number.isFinite(prop.longitude)) ? (
              <a
                href={
                  Number.isFinite(prop.latitude) && Number.isFinite(prop.longitude)
                    ? `https://www.openstreetmap.org/?mlat=${prop.latitude}&mlon=${prop.longitude}#map=17/${prop.latitude}/${prop.longitude}`
                    : `https://www.openstreetmap.org/search?query=${encodeURIComponent([prop.address_line1, prop.city, prop.postcode].filter(Boolean).join(", "))}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-blue-600 font-medium flex items-center gap-1 hover:underline"
              >
                View on OpenStreetMap <ArrowUpRight size={12} />
              </a>
            ) : (
              <span className="text-[12px] text-slate-500">Add address to enable maps</span>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
