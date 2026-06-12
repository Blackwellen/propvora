"use client"

import React, { useState, use } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Wallet,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperty } from "@/hooks/useProperties"
import { useUnits, type Unit } from "@/hooks/useUnits"

/* ─── Sub-tab strip ─────────────────────────────────────────── */
function HmoTabStrip({ propertyId }: { propertyId: string }) {
  const pathname = usePathname()
  const base = `/app/portfolio/properties/${propertyId}/hmo`

  const tabs = [
    { label: "Overview", href: base },
    { label: "Rooms", href: `${base}/rooms` },
    { label: "Utilities", href: `${base}/utilities` },
    { label: "Analytics", href: `${base}/analytics` },
  ]

  return (
    <div className="flex gap-1 px-6 border-b border-slate-200 bg-white">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

/* ─── KPI Card ───────────────────────────────────────────────── */
function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string
  value: string
  sub?: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const STATUS_BADGE: Record<Unit["status"], { label: string; classes: string }> = {
  occupied: { label: "Occupied", classes: "bg-green-50 text-green-700 border border-green-200" },
  vacant: { label: "Vacant", classes: "bg-amber-50 text-amber-700 border border-amber-200" },
  reserved: { label: "Reserved", classes: "bg-blue-50 text-blue-700 border border-blue-200" },
  under_works: { label: "Under Works", classes: "bg-orange-50 text-orange-700 border border-orange-200" },
}

/* ─── Room Card ─────────────────────────────────────────────── */
function RoomCard({ room, propertyId }: { room: Unit; propertyId: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const badge = STATUS_BADGE[room.status]

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{room.unit_name}</span>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {room.status === "occupied" ? (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-sm text-slate-700 font-medium">Tenant assigned</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
            <Home className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-sm text-slate-400 italic">No tenant</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-slate-400 uppercase tracking-wide font-medium">Target Rent</p>
          <p className="text-slate-700 font-semibold">
            {room.target_rent ? `${room.target_rent.toLocaleString()}/mo` : "—"}
            {room.status === "vacant" ? " asking" : ""}
          </p>
        </div>
        {room.floor !== null && (
          <div>
            <p className="text-slate-400 uppercase tracking-wide font-medium">Floor</p>
            <p className="text-slate-700 font-semibold">{room.floor}</p>
          </div>
        )}
        {room.floor_area_sqm !== null && (
          <div className="col-span-2">
            <p className="text-slate-400 uppercase tracking-wide font-medium">Area</p>
            <p className="text-slate-700 font-semibold">{room.floor_area_sqm} sqm</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
        {room.status === "vacant" ? (
          <Link
            href={`/app/portfolio/properties/${propertyId}/hmo/rooms`}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg text-center transition-colors"
          >
            Find Tenant
          </Link>
        ) : (
          <Link
            href={`/app/portfolio/properties/${propertyId}/hmo/rooms`}
            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </Link>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
              <button className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                Edit Room
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                Maintenance
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                Mark Vacant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function HmoDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { workspace } = useWorkspace()

  const { data: property, isLoading: propLoading } = useProperty(workspace?.id, id)
  const { data: units = [], isLoading: unitsLoading } = useUnits(workspace?.id, id)

  const isLoading = propLoading || unitsLoading

  const occupied = units.filter((u) => u.status === "occupied").length
  const vacant = units.filter((u) => u.status === "vacant").length
  const total = units.length
  const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0
  const rentRoll = units.reduce((s, u) => s + (u.target_rent ?? 0), 0)

  const propertyName = property
    ? property.name
    : "HMO Property"
  const propertyAddress = property
    ? [property.address_line1, property.city, property.postcode].filter(Boolean).join(", ")
    : ""

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            HMO Dashboard{propertyAddress ? ` — ${propertyAddress}` : ""}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {propertyName} · {total} room{total !== 1 ? "s" : ""} · {occupancyPct}% occupancy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/app/portfolio/properties/${id}/hmo/analytics`}
            className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* Sub-tab strip */}
      <HmoTabStrip propertyId={id} />

      {/* Content */}
      <div className="px-6 pb-6 pt-5 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Rooms"
            value={String(total)}
            icon={Home}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="Occupied Rooms"
            value={String(occupied)}
            sub={`${occupancyPct}% occupancy`}
            icon={Users}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <KpiCard
            title="Vacant Rooms"
            value={String(vacant)}
            icon={Home}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <KpiCard
            title="Monthly Rent Roll"
            value={rentRoll > 0 ? `${rentRoll.toLocaleString()}` : "—"}
            icon={Wallet}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Room Grid */}
          <div className="col-span-12">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Room Overview</h2>
              <Link
                href={`/app/portfolio/properties/${id}/hmo/rooms`}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Manage Rooms →
              </Link>
            </div>

            {units.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center">
                <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No rooms found for this HMO.</p>
                <Link
                  href={`/app/portfolio/units/new?propertyId=${id}`}
                  className="mt-3 inline-flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Add Room
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {units.map((room) => (
                  <RoomCard key={room.id} room={room} propertyId={id} />
                ))}
              </div>
            )}
          </div>

          {/* HMO Licence Status */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-semibold text-slate-900">HMO Licence Status</h3>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Licence Type</span>
                  <span className="text-xs font-semibold text-slate-800">Mandatory</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Max Occupants</span>
                  <span className="text-xs font-semibold text-slate-800">{total || "—"}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <button className="text-xs text-blue-600 hover:underline font-medium">
                    View Licence Document →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
              </div>
              <div className="px-4 py-4 flex flex-col gap-2">
                <Link
                  href={`/app/portfolio/properties/${id}/hmo/rooms`}
                  className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center"
                >
                  Onboard New Tenant
                </Link>
                <Link
                  href={`/app/portfolio/properties/${id}/hmo/utilities`}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center"
                >
                  Add Utility Bill
                </Link>
                <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center">
                  Run Rent Chase
                </button>
                <button className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center">
                  Generate HMO Report
                </button>
                <Link
                  href={`/app/portfolio/properties/${id}/hmo/analytics`}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-center"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
