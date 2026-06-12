"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Search, SlidersHorizontal, Building2, ChevronRight,
  Heart, Plus, Minus, Layers, Navigation,
  Users, PoundSterling, Wrench, AlertTriangle, Mail,
  BarChart2, ChevronLeft, Eye, Archive, ArrowUpDown,
} from "lucide-react"
import type { PropertyCardData } from "./PropertyCard"
import { ActionMenu } from "@/components/portfolio/ActionMenu"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export interface PropertyMapData extends PropertyCardData {
  lat?: number
  lng?: number
  manager?: string
  managerAvatar?: string
  owner?: string
  propertyId?: string
  updatedAt?: string
}

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */
const STATUS_CFG = {
  Active:        { label: "Active",   dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  Vacant:        { label: "Vacant",   dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50" },
  "Under Works": { label: "In Works", dot: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50" },
} as const

const PROFILE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  "HMO":                    { label: "HMO", bg: "bg-blue-600",    text: "text-white" },
  "Long-Term Let":          { label: "BTL", bg: "bg-emerald-600", text: "text-white" },
  "Serviced Accommodation": { label: "SA",  bg: "bg-violet-600",  text: "text-white" },
  "Rent-to-Rent":           { label: "R2R", bg: "bg-orange-500",  text: "text-white" },
  "Student Let":            { label: "Stu", bg: "bg-teal-500",    text: "text-white" },
  "Co-Living":              { label: "CoL", bg: "bg-pink-600",    text: "text-white" },
}

/* Mock coordinates for known IDs — falls back to a scatter if missing */
const MOCK_COORDS: Record<string, { lat: number; lng: number }> = {
  p1:  { lat: 52.953, lng: -1.150 },
  p2:  { lat: 52.483, lng: -1.893 },
  p3:  { lat: 53.801, lng: -1.549 },
  p4:  { lat: 53.483, lng: -2.244 },
  p5:  { lat: 53.480, lng: -2.238 },
  p6:  { lat: 53.408, lng: -2.979 },
  p7:  { lat: 51.453, lng: -2.592 },
  p8:  { lat: 51.517, lng: -0.143 },
  p9:  { lat: 51.508, lng: -0.154 },
  p10: { lat: 53.383, lng: -1.467 },
}

const SCATTER_COORDS = [
  { lat: 53.1, lng: -1.6 }, { lat: 52.2, lng: -1.4 }, { lat: 54.0, lng: -1.3 },
  { lat: 52.9, lng: -2.5 }, { lat: 51.7, lng: -1.8 }, { lat: 53.7, lng: -2.6 },
]

const MAP_BOUNDS = { north: 55.2, south: 50.8, west: -4.5, east: 1.8 }

function latLngToPct(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 100
  const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 100
  return { x: Math.max(3, Math.min(97, x)), y: Math.max(3, Math.min(97, y)) }
}

const TYPE_GRADIENTS: Record<string, string> = {
  HMO:          "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)",
  BTL:          "linear-gradient(135deg, #059669 0%, #10B981 100%)",
  SA:           "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)",
  R2R:          "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
  Commercial:   "linear-gradient(135deg, #475569 0%, #64748B 100%)",
  Mixed:        "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)",
  "Holiday Let":"linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)",
  Other:        "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
}

const AVATAR_PALETTE = ["#2563EB", "#7C3AED", "#059669", "#EA580C", "#0891B2", "#DB2777"]
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

function occColor(pct: number) {
  if (pct >= 90) return "#10B981"
  if (pct >= 70) return "#F59E0B"
  return "#EF4444"
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                        */
/* ------------------------------------------------------------------ */

function PropertyListItem({
  p, selected, onClick,
}: { p: PropertyMapData; selected: boolean; onClick: () => void }) {
  const router = useRouter()
  const occ = p.units > 0 ? Math.round(((p.occupied ?? 0) / p.units) * 100) : 0
  const statusCfg = STATUS_CFG[p.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.Active
  const badge = p.operationProfile ? PROFILE_BADGE[p.operationProfile] : null
  const coverGradient = TYPE_GRADIENTS[p.type] ?? TYPE_GRADIENTS.Other

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-2.5 px-3 py-3 transition-all duration-150 group",
        selected
          ? "bg-blue-50/70 border-l-[3px] border-[#2563EB]"
          : "hover:bg-slate-50 border-l-[3px] border-transparent",
      )}
    >
      <div className="w-[60px] h-[44px] rounded-xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center" style={{ background: coverGradient }}>
        <Building2 size={18} className="text-white opacity-60" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 mb-0.5">
          {badge && (
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0", badge.bg, badge.text)}>
              {badge.label}
            </span>
          )}
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-rose-400 transition-colors">
              <Heart className="w-3 h-3" />
            </button>
            <ActionMenu
              align="right"
              items={[
                { label: "View property", icon: Eye, onClick: () => router.push(`/app/portfolio/properties/${p.id}`) },
                { label: "Add unit", icon: Plus, onClick: () => router.push(`/app/portfolio/units/new?propertyId=${p.id}`) },
                { label: "Create tenancy", icon: Users, onClick: () => router.push(`/app/portfolio/tenancies/new?propertyId=${p.id}`) },
                { label: "Archive", icon: Archive, onClick: () => {} },
              ]}
            />
          </div>
        </div>
        <p className="text-[12.5px] font-semibold text-slate-900 truncate">{p.name}</p>
        <p className="text-[10.5px] text-slate-400 truncate">{p.address}</p>
        <div className="flex items-center gap-1.5 mt-1 text-[10.5px]">
          <span className="text-slate-500">{p.units} units</span>
          <span className="text-slate-300">·</span>
          <span className={cn("font-semibold", occ >= 90 ? "text-emerald-600" : occ >= 70 ? "text-amber-600" : "text-red-600")}>
            {occ}% occ.
          </span>
          {p.monthlyRent > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-700">{fmt(p.monthlyRent)}/mo</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className={cn("inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full", statusCfg.bg, statusCfg.text)}>
            <span className={cn("w-1 h-1 rounded-full", statusCfg.dot)} />{statusCfg.label}
          </span>
          <span className="text-[9.5px] text-slate-400">Updated {p.updatedAt ?? "2h ago"}</span>
        </div>
      </div>
    </button>
  )
}

function MapPin({
  label, color, size, selected,
  x, y, onClick,
}: {
  label: string | number; color: string; size: number; selected: boolean
  x: number; y: number; onClick: () => void
}) {
  const s = selected ? size + 10 : size
  return (
    <button
      onClick={onClick}
      style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", zIndex: selected ? 30 : 10 }}
      className="group"
    >
      {/* Pulse ring on selected */}
      {selected && (
        <span
          style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            border: `2px solid ${color}`,
            opacity: 0.4, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
          }}
        />
      )}
      <div
        style={{
          width: s, height: s, background: color,
          border: selected ? "3px solid white" : "2.5px solid white",
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: selected
            ? `0 0 0 4px ${color}35, 0 6px 20px rgba(0,0,0,0.30)`
            : "0 2px 10px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.12)",
          transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          fontSize: s >= 36 ? 11 : 10, fontWeight: 800, color: "white",
          letterSpacing: "-0.3px",
        }}
      >
        {label}
      </div>
    </button>
  )
}

function DetailPanel({ p, onClose }: { p: PropertyMapData; onClose: () => void }) {
  const router = useRouter()
  const occ = p.units > 0 ? Math.round(((p.occupied ?? 0) / p.units) * 100) : 0
  const statusCfg = STATUS_CFG[p.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.Active
  const coverGradient = TYPE_GRADIENTS[p.type] ?? TYPE_GRADIENTS.Other

  return (
    <div className="w-[320px] shrink-0 flex flex-col border-l border-slate-200 bg-white overflow-y-auto">
      {/* Cover gradient */}
      <div className="relative h-[160px] shrink-0 flex items-center justify-center" style={{ background: coverGradient }}>
        <div className="flex flex-col items-center gap-1 opacity-25">
          <Building2 size={48} className="text-white" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {/* Status badge */}
        <div className={cn("absolute bottom-2 left-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90", statusCfg.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />{statusCfg.label}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Property name */}
        <div>
          <h3 className="text-[14px] font-bold text-slate-900 leading-tight">{p.name}</h3>
          <p className="text-[11.5px] text-slate-500 mt-0.5">{p.address}{p.postcode ? `, ${p.postcode}` : ""}</p>
        </div>

        {/* Manager + Owner */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border border-white shadow-sm flex items-center justify-center text-white text-[9px] font-bold select-none shrink-0"
              style={{ background: getAvatarColor(p.manager ?? "Sarah Mitchell") }}>
              {getInitials(p.manager ?? "Sarah Mitchell")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Property Manager</p>
              <p className="text-[12px] font-semibold text-slate-800 truncate">{p.manager ?? "Sarah Mitchell"}</p>
            </div>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
              <Mail className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Owner / Landlord</p>
              <p className="text-[12px] font-semibold text-slate-800 truncate">{p.owner ?? "Propvora Estates Ltd"}</p>
            </div>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
              <Mail className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "Units", value: String(p.units), icon: Building2, color: "text-slate-900" },
            { label: "Occupancy", value: `${occ}%`, icon: Users, color: occ >= 90 ? "text-emerald-600" : occ >= 70 ? "text-amber-600" : "text-red-600" },
            { label: "Rent Roll/mo", value: p.monthlyRent > 0 ? fmt(p.monthlyRent) : "—", icon: PoundSterling, color: "text-slate-900" },
            { label: "Arrears", value: p.arrears && p.arrears > 0 ? fmt(p.arrears) : "£0", icon: AlertTriangle, color: p.arrears && p.arrears > 0 ? "text-red-600" : "text-slate-400" },
            { label: "Open Work", value: String(p.openWork ?? 0), icon: Wrench, color: "text-slate-700" },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                <p className={cn("text-[13px] font-bold tabular-nums leading-none", s.color)}>{s.value}</p>
                <p className="text-[9.5px] text-slate-400 mt-0.5 font-medium leading-tight">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* CTAs */}
        <div className="space-y-1.5">
          <Link href={`/app/portfolio/properties/${p.id}`}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors group">
            <span>View property</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[13px] font-medium hover:bg-slate-50 transition-colors">
            <span>Open tenancies</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors">
              <Navigation className="w-3.5 h-3.5" />Route
            </button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors">
              <Layers className="w-3.5 h-3.5" />Map details
            </button>
          </div>
        </div>

        {/* Metadata footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10.5px] text-slate-400">
          <span>Last updated {p.updatedAt ?? "2h ago"}</span>
          <span className="font-mono">{p.propertyId ?? `PRP-${p.id.toUpperCase().slice(0, 5)}`}</span>
          <ActionMenu
            align="right"
            items={[
              { label: "View property", icon: Eye, onClick: () => router.push(`/app/portfolio/properties/${p.id}`) },
              { label: "Add unit", icon: Plus, onClick: () => router.push(`/app/portfolio/units/new?propertyId=${p.id}`) },
              { label: "Create tenancy", icon: Users, onClick: () => router.push(`/app/portfolio/tenancies/new?propertyId=${p.id}`) },
              { label: "Archive", icon: Archive, onClick: () => {} },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Insight Strip                                                        */
/* ------------------------------------------------------------------ */
function InsightStrip({ properties }: { properties: PropertyMapData[] }) {
  const totalRent = properties.reduce((s, p) => s + p.monthlyRent, 0)
  const vacantCount = properties.filter(p => p.status === "Vacant").length
  const activeProps = properties.filter(p => p.status === "Active")
  const avgOcc = activeProps.length > 0
    ? Math.round(activeProps.reduce((s, p) => s + (p.units > 0 ? ((p.occupied ?? 0) / p.units) * 100 : 0), 0) / activeProps.length)
    : 0

  const regionData = [
    { name: "London", rent: 78540, occ: 94 },
    { name: "Midlands", rent: 42360, occ: 90 },
    { name: "North", rent: 28780, occ: 88 },
    { name: "Scotland", rent: 12860, occ: 91 },
  ]
  const maxRent = Math.max(...regionData.map(r => r.rent))

  return (
    <div className="grid grid-cols-5 gap-0 border-t border-slate-200 bg-white">
      {/* Active locations */}
      <div className="p-4 border-r border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
            <Navigation className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <p className="text-[11px] font-semibold text-slate-700">Active locations</p>
        </div>
        <p className="text-[20px] font-black text-slate-900 tabular-nums leading-none">12</p>
        <p className="text-[10.5px] text-slate-400 mt-0.5">Cities across the UK</p>
        <div className="mt-2 flex items-end gap-0.5 h-6">
          {[6, 4, 7, 3, 5, 8, 4, 6].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-blue-400" style={{ height: `${(h / 8) * 100}%` }} />
          ))}
        </div>
      </div>

      {/* Vacant units */}
      <div className="p-4 border-r border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-[11px] font-semibold text-slate-700">Vacant units</p>
        </div>
        <p className="text-[20px] font-black text-slate-900 tabular-nums leading-none">{vacantCount + 7}</p>
        <p className="text-[10.5px] text-slate-400 mt-0.5">8.1% of total units</p>
        <div className="mt-2 flex items-end gap-0.5 h-6">
          {[3, 5, 4, 7, 3, 4, 6, 5].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-amber-400" style={{ height: `${(h / 7) * 100}%` }} />
          ))}
        </div>
      </div>

      {/* Avg occupancy by region */}
      <div className="p-4 border-r border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-[11px] font-semibold text-slate-700">Avg occupancy by region</p>
        </div>
        <div className="flex items-start gap-2 mt-1">
          {/* Donut */}
          <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0">
            <circle cx="20" cy="20" r="15" fill="none" stroke="#E2E8F0" strokeWidth="8" />
            <circle cx="20" cy="20" r="15" fill="none" stroke="#10B981" strokeWidth="8"
              strokeDasharray={`${avgOcc * 0.942} 94.2`} strokeLinecap="round"
              style={{ transformOrigin: "center", transform: "rotate(-90deg)" }} />
          </svg>
          <div className="space-y-1">
            {regionData.map(r => (
              <div key={r.name} className="flex items-center justify-between gap-3">
                <span className="text-[9.5px] text-slate-500">{r.name}</span>
                <span className="text-[9.5px] font-bold text-slate-800">{r.occ}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Maintenance hotspots */}
      <div className="p-4 border-r border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-red-600" />
          </div>
          <p className="text-[11px] font-semibold text-slate-700">Maintenance hotspots</p>
        </div>
        <p className="text-[20px] font-black text-slate-900 tabular-nums leading-none">3</p>
        <p className="text-[10.5px] text-slate-400 mt-0.5">High activity areas</p>
        <div className="mt-2 flex items-end gap-0.5 h-6">
          {[2, 8, 4, 6, 3, 7, 5, 3].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-red-400" style={{ height: `${(h / 8) * 100}%` }} />
          ))}
        </div>
      </div>

      {/* Rent roll by region */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center">
            <PoundSterling className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <p className="text-[11px] font-semibold text-slate-700">Rent roll by region</p>
        </div>
        <div className="space-y-1.5 mt-1">
          {regionData.map(r => (
            <div key={r.name}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9.5px] text-slate-500">{r.name}</span>
                <span className="text-[9.5px] font-bold text-slate-800">£{(r.rent / 1000).toFixed(0)}k</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${(r.rent / maxRent) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */
export function PropertyMapView({ properties }: { properties: PropertyMapData[] }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [clusterView, setClusterView] = useState(true)

  const filtered = useMemo(() => properties.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false
    if (typeFilter !== "all" && p.operationProfile !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    }
    return true
  }), [properties, statusFilter, typeFilter, search])

  const selected = properties.find(p => p.id === selectedId) ?? null

  /* Augment properties with coordinates */
  const propsWithCoords = useMemo(() => properties.map((p, i) => ({
    ...p,
    lat: p.lat ?? MOCK_COORDS[p.id]?.lat ?? SCATTER_COORDS[i % SCATTER_COORDS.length].lat,
    lng: p.lng ?? MOCK_COORDS[p.id]?.lng ?? SCATTER_COORDS[i % SCATTER_COORDS.length].lng,
  })), [properties])

  const filteredWithCoords = useMemo(() =>
    propsWithCoords.filter(p => filtered.some(f => f.id === p.id)),
    [propsWithCoords, filtered])

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white"
      style={{ height: "calc(100vh - 220px)", minHeight: 700 }}>
      {/* Main row: left rail | map | right panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT RAIL ── */}
        <div className="w-[280px] shrink-0 flex flex-col border-r border-slate-200 bg-white">
          {/* Search + filters */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search properties…"
                  className="w-full pl-8 pr-3 py-2 text-[12.5px] rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all"
                />
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shrink-0 transition-all">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Status chips */}
            <div className="flex items-center gap-1 flex-wrap">
              {["all", "Active", "Vacant", "Under Works"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all",
                    statusFilter === s ? "bg-[#2563EB] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}>
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
            {/* Profile chips */}
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { key: "HMO", profile: "HMO" },
                { key: "BTL", profile: "Long-Term Let" },
                { key: "SA", profile: "Serviced Accommodation" },
                { key: "R2R", profile: "Rent-to-Rent" },
                { key: "Stu", profile: "Student Let" },
              ].map(({ key, profile }) => {
                const active = typeFilter === profile
                const badge = PROFILE_BADGE[profile]
                return (
                  <button key={key} onClick={() => setTypeFilter(active ? "all" : profile)}
                    className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all",
                      active ? `${badge.bg} ${badge.text} shadow-sm` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}>
                    {key}
                  </button>
                )
              })}
              <button className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
                More ›
              </button>
            </div>
            {/* Sort row */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Sort by:</span>
              <button className="text-[11px] font-semibold text-slate-600 hover:text-[#2563EB] transition-colors flex items-center gap-0.5">
                Recently updated <ChevronRight className="w-3 h-3" />
              </button>
              <ActionMenu
                align="right"
                items={[
                  { label: "Sort: A–Z", icon: ArrowUpDown, onClick: () => {} },
                  { label: "Sort: Rent ↓", icon: PoundSterling, onClick: () => {} },
                  { label: "Sort: Occupancy", icon: BarChart2, onClick: () => {} },
                ]}
              />
            </div>
          </div>

          {/* Property list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Building2 className="w-8 h-8 text-slate-200" />
                <p className="text-[12px] text-slate-400">No properties match filters</p>
              </div>
            ) : filtered.map(p => (
              <PropertyListItem
                key={p.id} p={p}
                selected={selectedId === p.id}
                onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
              />
            ))}
          </div>

          {/* Pagination footer */}
          <div className="px-3 py-2.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">Showing 1–{Math.min(4, filtered.length)} of {properties.length}</p>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map(n => (
                <button key={n} className={cn("w-5 h-5 rounded text-[10px] font-semibold transition-all",
                  n === 1 ? "bg-[#2563EB] text-white" : "text-slate-400 hover:bg-slate-100")}>
                  {n}
                </button>
              ))}
              <span className="text-[10px] text-slate-300 px-0.5">…</span>
              <button className="w-5 h-5 rounded text-[10px] font-semibold text-slate-400 hover:bg-slate-100">6</button>
            </div>
          </div>
        </div>

        {/* ── MAP AREA ── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: "#C8D8E8" }}>
          {/* Map tile — CartoDB Voyager for premium look */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: "url(https://a.basemaps.cartocdn.com/rastertiles/voyager/6/31/20.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "saturate(1.25) contrast(1.08) brightness(1.02)",
            }}
          />
          {/* Depth vignette */}
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(15,23,42,0.18) 100%)" }}
          />
          {/* Subtle blue-grey tone wash */}
          <div className="absolute inset-0" style={{ background: "rgba(37,99,235,0.04)" }} />

          {/* Pins */}
          <div className="absolute inset-0">
            {filteredWithCoords.map((p, i) => {
              const occ = p.units > 0 ? Math.round(((p.occupied ?? 0) / p.units) * 100) : 0
              const color = p.status === "Vacant" ? "#94A3B8" : occColor(occ)
              const { x, y } = latLngToPct(p.lat!, p.lng!)
              return (
                <MapPin key={p.id}
                  label={filtered.length > 5 ? i + 1 : p.units}
                  color={color} size={32}
                  selected={selectedId === p.id}
                  x={x} y={y}
                  onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                />
              )
            })}
          </div>

          {/* Zoom controls */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-20">
            <button className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-white hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-white hover:shadow-xl transition-all duration-200">
              <Minus className="w-4 h-4" />
            </button>
            <div className="mt-0.5 flex flex-col gap-1">
              <button className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-[#2563EB] hover:bg-white transition-all duration-200">
                <Navigation className="w-3.5 h-3.5" />
              </button>
              <button className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-[#2563EB] hover:bg-white transition-all duration-200">
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Top controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200/80 text-[12px] font-semibold text-slate-700 hover:bg-white hover:shadow-xl transition-all duration-200">
              Cluster view <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-3 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-lg px-4 py-2.5 flex items-center gap-4 z-20">
            {[
              { color: "bg-emerald-500", label: "90%+", shadow: "shadow-emerald-200" },
              { color: "bg-amber-500",   label: "70–90%", shadow: "shadow-amber-200" },
              { color: "bg-red-500",     label: "<70%",  shadow: "shadow-red-200" },
              { color: "bg-slate-400",   label: "Vacant", shadow: "" },
            ].map(x => (
              <span key={x.label} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <span className={`w-2.5 h-2.5 rounded-full ${x.color} shadow-sm`} />{x.label}
              </span>
            ))}
          </div>

          {/* Attribution */}
          <div className="absolute bottom-2 right-2 text-[9px] text-slate-400/70 z-20">
            © CartoDB · OpenStreetMap
          </div>
        </div>

        {/* ── RIGHT DETAIL PANEL ── */}
        {selected && (
          <DetailPanel p={selected} onClose={() => setSelectedId(null)} />
        )}
      </div>

      {/* ── INSIGHT STRIP ── */}
      <InsightStrip properties={properties} />
    </div>
  )
}
