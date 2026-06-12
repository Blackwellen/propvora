"use client"

import React, { useMemo, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { StatCard } from "@/components/ui/StatCard"
import { PropertyCard, type PropertyCardData } from "@/components/portfolio/PropertyCard"
import { UnitCard, type UnitCardData } from "@/components/portfolio/UnitCard"
import { TenancyCard, type TenancyCardData } from "@/components/portfolio/TenancyCard"
import { PropertyListView } from "@/components/portfolio/PropertyListView"
import { PropertyDataView } from "@/components/portfolio/PropertyDataView"
import { TenancyListView } from "@/components/portfolio/TenancyListView"
import { TenancyDataView } from "@/components/portfolio/TenancyDataView"
import { TenancyGanttView } from "@/components/portfolio/TenancyGanttView"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties, useDeleteProperty } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { Trash2 } from "lucide-react"
import {
  Building2, LayoutGrid, List, Plus, TrendingUp, Users, PoundSterling, Home,
  AlertTriangle, Map, Calendar, Wrench, ChevronRight, ChevronLeft, Activity,
  BarChart2, Clock, Sparkles, Table2, BarChart3, Download,
  Search, SlidersHorizontal, X, MapPin,
  Eye, Archive,
} from "lucide-react"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { cn } from "@/lib/utils"
import { aggregateByProperty, normaliseOperationProfile, normalisePropertyStatus, normalisePropertyType, exportCsv } from "@/lib/portfolio/helpers"

/* ------------------------------------------------------------------ */
/* 13 Operational Profiles                                              */
/* ------------------------------------------------------------------ */
const ALL_PROFILES = [
  { key: "HMO",                    label: "HMO",                    shortLabel: "HMO",        color: "#1D4ED8", gradient: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)", img: "/property-types/hmo.jpg" },
  { key: "Long-Term Let",          label: "Long-Term Let",          shortLabel: "LTL",        color: "#059669", gradient: "linear-gradient(135deg, #059669 0%, #10B981 100%)", img: "/property-types/btl.jpg" },
  { key: "Serviced Accommodation", label: "Serviced Accommodation", shortLabel: "SA",         color: "#7C3AED", gradient: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)", img: "/property-types/sa.jpg" },
  { key: "Rent-to-Rent",           label: "Rent-to-Rent",           shortLabel: "R2R",        color: "#EA580C", gradient: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)", img: "/property-types/r2r.jpg" },
  { key: "Student Let",            label: "Student Let",            shortLabel: "Student",    color: "#0891B2", gradient: "linear-gradient(135deg, #0891B2 0%, #0EA5E9 100%)", img: "/property-types/student.jpg" },
  { key: "Co-Living",              label: "Co-Living",              shortLabel: "Co-Living",  color: "#DB2777", gradient: "linear-gradient(135deg, #DB2777 0%, #EC4899 100%)", img: "/property-types/co-living.jpg" },
  { key: "Holiday Let",            label: "Holiday Let",            shortLabel: "Holiday",    color: "#D97706", gradient: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)", img: "/property-types/holiday.jpg" },
  { key: "Social Housing",         label: "Social Housing",         shortLabel: "Social",     color: "#16A34A", gradient: "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)", img: "/property-types/social.jpg" },
  { key: "Supported Living",       label: "Supported Living",       shortLabel: "Supported",  color: "#0369A1", gradient: "linear-gradient(135deg, #0369A1 0%, #0284C7 100%)", img: "/property-types/supported.jpg" },
  { key: "Commercial",             label: "Commercial",             shortLabel: "Commercial", color: "#374151", gradient: "linear-gradient(135deg, #374151 0%, #4B5563 100%)", img: "/property-types/commercial.jpg" },
  { key: "Mixed Use",              label: "Mixed Use",              shortLabel: "Mixed",      color: "#6B21A8", gradient: "linear-gradient(135deg, #6B21A8 0%, #7C3AED 100%)", img: "/property-types/mixed.jpg" },
  { key: "Development",            label: "Development",            shortLabel: "Dev",        color: "#B45309", gradient: "linear-gradient(135deg, #B45309 0%, #D97706 100%)", img: "/property-types/development.jpg" },
  { key: "Buy-to-Sell",            label: "Buy-to-Sell",            shortLabel: "BTS",        color: "#BE123C", gradient: "linear-gradient(135deg, #BE123C 0%, #E11D48 100%)", img: "/property-types/bts.jpg" },
]

/* ------------------------------------------------------------------ */
/* Mock data                                                            */
/* ------------------------------------------------------------------ */
const MOCK_PROPERTIES: PropertyCardData[] = [
  { id: "p1", name: "Brunswick Road HMO",     address: "12 Brunswick Road, Nottingham", postcode: "NG1 4EX", type: "HMO",   status: "Active",       units: 6,  occupied: 5,  tenants: 5,  monthlyRent: 2850, operationProfile: "HMO",                    bedrooms: 6,  bathrooms: 3, arrears: 475, openWork: 2, healthScore: "watch" },
  { id: "p2", name: "Maple Street HMO",       address: "34 Maple Street, Birmingham",   postcode: "B1 2QR",  type: "HMO",   status: "Active",       units: 8,  occupied: 8,  tenants: 8,  monthlyRent: 3600, operationProfile: "HMO",                    bedrooms: 8,  bathrooms: 4, arrears: 0,   openWork: 0, healthScore: "healthy" },
  { id: "p3", name: "Victoria Terrace",       address: "8 Victoria Terrace, Leeds",     postcode: "LS1 3XY", type: "BTL",   status: "Vacant",       units: 1,  occupied: 0,  tenants: 0,  monthlyRent: 0,    operationProfile: "Long-Term Let",           bedrooms: 3,  bathrooms: 1, arrears: 0,   openWork: 1, healthScore: "at_risk" },
  { id: "p4", name: "Oak Lane BTL",           address: "22 Oak Lane, Manchester",       postcode: "M14 5FG", type: "BTL",   status: "Active",       units: 1,  occupied: 1,  tenants: 2,  monthlyRent: 1100, operationProfile: "Long-Term Let",           bedrooms: 2,  bathrooms: 1, arrears: 0,   openWork: 0, healthScore: "healthy" },
  { id: "p5", name: "City Centre SA",         address: "15 Piccadilly, Manchester",     postcode: "M1 1HP",  type: "SA",    status: "Active",       units: 2,  occupied: 1,  tenants: 0,  monthlyRent: 1800, operationProfile: "Serviced Accommodation",  bedrooms: 2,  bathrooms: 2, arrears: 0,   openWork: 0, healthScore: "watch" },
  { id: "p6", name: "Elms Road R2R",          address: "5 Elms Road, Liverpool",        postcode: "L8 3QA",  type: "R2R",   status: "Under Works",  units: 5,  occupied: 0,  tenants: 0,  monthlyRent: 0,    operationProfile: "Rent-to-Rent",            bedrooms: 5,  bathrooms: 2, arrears: 0,   openWork: 4, healthScore: "critical" },
  { id: "p7", name: "Harbour View Flat",      address: "1A Harbour View, Bristol",      postcode: "BS1 5WA", type: "BTL",   status: "Active",       units: 1,  occupied: 1,  tenants: 1,  monthlyRent: 1200, operationProfile: "Long-Term Let",           bedrooms: 1,  bathrooms: 1, arrears: 0,   openWork: 0, healthScore: "healthy" },
  { id: "p8", name: "Regent Street Studio",   address: "88 Regent Street, London",      postcode: "W1B 4EG", type: "BTL",   status: "Active",       units: 1,  occupied: 1,  tenants: 1,  monthlyRent: 1950, operationProfile: "Long-Term Let",           bedrooms: 1,  bathrooms: 1, arrears: 0,   openWork: 0, healthScore: "healthy" },
  { id: "p9", name: "Park Lane Co-Living",    address: "45 Park Lane, London",          postcode: "W1K 1PN", type: "Other", status: "Active",       units: 12, occupied: 11, tenants: 11, monthlyRent: 9600, operationProfile: "Co-Living",               bedrooms: 12, bathrooms: 6, arrears: 0,   openWork: 1, healthScore: "healthy" },
  { id: "p10",name: "Meadow Court Student",   address: "3 Meadow Court, Sheffield",     postcode: "S1 2GT",  type: "Other", status: "Active",       units: 7,  occupied: 7,  tenants: 7,  monthlyRent: 3850, operationProfile: "Student Let",             bedrooms: 7,  bathrooms: 3, arrears: 0,   openWork: 0, healthScore: "healthy" },
]

const MOCK_UNITS: UnitCardData[] = [
  { id: "u1", property_id: "p1", property_name: "Brunswick Road HMO",  unit_name: "Room 1",  unit_type: "room",   bedrooms: 1, floor_area_sqm: 16, target_rent: 550,  status: "occupied",    tenant_name: "James Wilson",    tenancy_end: "2026-08-31" },
  { id: "u2", property_id: "p1", property_name: "Brunswick Road HMO",  unit_name: "Room 2",  unit_type: "room",   bedrooms: 1, floor_area_sqm: 14, target_rent: 475,  status: "occupied",    tenant_name: "Sarah Chen",      tenancy_end: "2026-07-31" },
  { id: "u3", property_id: "p1", property_name: "Brunswick Road HMO",  unit_name: "Room 3",  unit_type: "room",   bedrooms: 1, floor_area_sqm: 14, target_rent: 475,  status: "vacant" },
  { id: "u4", property_id: "p2", property_name: "Maple Street HMO",    unit_name: "Room A",  unit_type: "room",   bedrooms: 1, floor_area_sqm: 18, target_rent: 520,  status: "occupied",    tenant_name: "Mohammed Ali",    tenancy_end: "2026-10-31" },
  { id: "u5", property_id: "p5", property_name: "City Centre SA",       unit_name: "Studio 1",unit_type: "studio", bedrooms: 1, floor_area_sqm: 35, target_rent: 900,  status: "occupied",    tenant_name: "Booking guest" },
  { id: "u6", property_id: "p6", property_name: "Elms Road R2R",        unit_name: "Room 1",  unit_type: "room",   bedrooms: 1, floor_area_sqm: 12, target_rent: 480,  status: "under_works" },
  { id: "u7", property_id: "p9", property_name: "Park Lane Co-Living",  unit_name: "Suite 3", unit_type: "suite",  bedrooms: 1, floor_area_sqm: 22, target_rent: 850,  status: "occupied",    tenant_name: "Aisha Okonkwo",   tenancy_end: "2027-01-31" },
  { id: "u8", property_id: "p3", property_name: "Victoria Terrace",     unit_name: "Flat",    unit_type: "flat",   bedrooms: 3, floor_area_sqm: 85, target_rent: 1100, status: "vacant" },
]

const MOCK_TENANCIES: TenancyCardData[] = [
  { id: "t1", property_id: "p1", unit_id: "u1", property_name: "Brunswick Road HMO",  unit_name: "Room 1",  tenant_name: "James Wilson",   status: "active", start_date: "2025-09-01", end_date: "2026-08-31", rent_amount: 550,  deposit_amount: 550,  deposit_held_by: "scheme" },
  { id: "t2", property_id: "p1", unit_id: "u2", property_name: "Brunswick Road HMO",  unit_name: "Room 2",  tenant_name: "Sarah Chen",     status: "active", start_date: "2025-10-01", end_date: "2026-07-31", rent_amount: 475,  deposit_amount: 475,  deposit_held_by: "scheme", arrears: 475 },
  { id: "t3", property_id: "p2", unit_id: "u4", property_name: "Maple Street HMO",    unit_name: "Room A",  tenant_name: "Mohammed Ali",   status: "active", start_date: "2025-11-01", end_date: "2026-10-31", rent_amount: 520,  deposit_amount: 520,  deposit_held_by: "scheme" },
  { id: "t4", property_id: "p4", unit_id: null, property_name: "Oak Lane BTL",          unit_name: undefined, tenant_name: "Priya Sharma",   status: "active", start_date: "2026-01-01", end_date: "2026-12-31", rent_amount: 1100, deposit_amount: 1100, deposit_held_by: "scheme" },
  { id: "t5", property_id: "p7", unit_id: null, property_name: "Harbour View Flat",     unit_name: undefined, tenant_name: "Daniel Murphy",  status: "active", start_date: "2025-08-01", end_date: "2026-07-31", rent_amount: 1200, deposit_amount: 1200, deposit_held_by: "scheme" },
  { id: "t6", property_id: "p8", unit_id: null, property_name: "Regent Street Studio",  unit_name: undefined, tenant_name: "Marcus Webb",    status: "active", start_date: "2024-09-01", end_date: "2026-08-31", rent_amount: 1950, deposit_amount: 1950, deposit_held_by: "scheme" },
]

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function fmtGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}
function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

/* ------------------------------------------------------------------ */
/* Tab types                                                            */
/* ------------------------------------------------------------------ */
type MainTab = "overview" | "properties" | "units" | "tenancies"
type PropertyView = "grid" | "list" | "data" | "map"
type UnitView = "grid" | "list"
type TenancyView = "cards" | "list" | "data" | "gantt"

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */
function PortfolioKpiCard({ label, value, icon: Icon, color, bg, href, sub }: {
  label: string; value: string; icon: React.ElementType
  color: string; bg: string; href: string; sub?: string
}) {
  // Canonical executive StatCard (compact) so portfolio matches every section.
  return (
    <StatCard
      icon={Icon}
      chipClass={cn(bg, color)}
      label={label}
      value={value}
      sub={sub}
      href={href}
      size="sm"
      valueClass={color !== "text-slate-900" ? color : undefined}
    />
  )
}

function ViewSwitcher<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string; icon: React.ElementType }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100">
      {options.map(opt => {
        const Icon = opt.icon
        return (
          <button key={opt.key} onClick={() => onChange(opt.key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150",
              value === opt.key ? "bg-white shadow-sm text-[#2563EB] font-semibold" : "text-slate-500 hover:text-slate-700"
            )}>
            <Icon className="w-3.5 h-3.5" />{opt.label}
          </button>
        )
      })}
    </div>
  )
}

function AttentionRow({ icon: Icon, label, value, color, bg, href, urgent }: {
  icon: React.ElementType; label: string; value: string | number
  color: string; bg: string; href: string; urgent?: boolean
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <p className="text-[13px] font-medium text-slate-700 flex-1 truncate">{label}</p>
      <div className="flex items-center gap-1 shrink-0">
        <span className={cn("text-[13px] font-bold tabular-nums", urgent && Number(value) > 0 ? "text-red-600" : "text-slate-800")}>{value}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  )
}

/* ── Shared chip button ── */
function Chip({ active, onClick, children, color }: {
  active: boolean; onClick: () => void; children: React.ReactNode; color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all whitespace-nowrap",
        active ? "text-white border-transparent shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm"
      )}
      style={active ? { background: color ?? "#2563EB", borderColor: color ?? "#2563EB" } : undefined}
    >
      {children}
    </button>
  )
}

/* ── Filter label ── */
function FLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{children}</p>
}

/* ── Filter input ── */
function FInput({ value, onChange, placeholder, prefix }: { value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-medium">{prefix}</span>}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-8 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all shadow-sm",
          prefix ? "pl-6 pr-3" : "px-3"
        )}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main Page                                                            */
/* ------------------------------------------------------------------ */
export default function PortfolioPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()

  const [activeTab, setActiveTab] = useState<MainTab>("overview")
  const [propView, setPropView] = useState<PropertyView>("grid")
  const [unitView, setUnitView] = useState<UnitView>("grid")
  const [tenView, setTenView] = useState<TenancyView>("cards")

  /* Segment carousel */
  const segScrollRef = useRef<HTMLDivElement>(null)
  const scrollSegs = (dir: "left" | "right") => {
    segScrollRef.current?.scrollBy({ left: dir === "right" ? 230 : -230, behavior: "smooth" })
  }

  /* Property filters */
  const [propSearch, setPropSearch]       = useState("")
  const [propFStatus, setPropFStatus]     = useState("all")
  const [propFProfile, setPropFProfile]   = useState("all")
  const [propFCity, setPropFCity]         = useState("")
  const [propFMinRent, setPropFMinRent]   = useState("")
  const [propFMaxRent, setPropFMaxRent]   = useState("")
  const [propShowAdv, setPropShowAdv]     = useState(false)

  /* Unit filters */
  const [unitSearch, setUnitSearch]     = useState("")
  const [unitFStatus, setUnitFStatus]   = useState("all")
  const [unitFType, setUnitFType]       = useState("all")
  const [unitFProp, setUnitFProp]       = useState("all")
  const [unitShowAdv, setUnitShowAdv]   = useState(false)

  /* Tenancy filters */
  const [tenSearch, setTenSearch]               = useState("")
  const [tenFStatus, setTenFStatus]             = useState("all")
  const [tenFArrears, setTenFArrears]           = useState(false)
  const [tenFEndingSoon, setTenFEndingSoon]     = useState(false)
  const [tenFProp, setTenFProp]                 = useState("all")
  const [tenFProfile, setTenFProfile]           = useState("all")
  const [tenFMinRent, setTenFMinRent]           = useState("")
  const [tenFMaxRent, setTenFMaxRent]           = useState("")
  const [tenShowAdv, setTenShowAdv]             = useState(false)

  /* Data hooks */
  const { data: rawProperties, isLoading: propsLoading } = useProperties(workspace?.id)
  const { data: rawUnits, isLoading: unitsLoading } = useUnits(workspace?.id)
  const { data: rawTenancies, isLoading: tenanciesLoading } = useTenancies(workspace?.id)
  const loading = propsLoading || unitsLoading || tenanciesLoading

  /* Delete (live only) */
  const deleteProperty = useDeleteProperty()
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  async function handleDeleteProperty() {
    if (!confirmDelete || !workspace?.id) return
    await deleteProperty.mutateAsync({ id: confirmDelete.id, workspaceId: workspace.id })
    setConfirmDelete(null)
  }

  const isLive = !!workspace?.id

  const units: UnitCardData[] = useMemo(() => {
    if (!isLive) return MOCK_UNITS
    if (!rawUnits?.length) return []
    const propName = new globalThis.Map((rawProperties ?? []).map(p => [p.id, p.name]))
    return rawUnits.map(u => ({
      id: u.id, property_id: u.property_id,
      property_name: propName.get(u.property_id),
      unit_name: u.unit_name,
      unit_type: u.unit_type, bedrooms: u.bedrooms,
      floor_area_sqm: u.floor_area_sqm, target_rent: u.target_rent, status: u.status,
      coverImageUrl: (u as { cover_image_url?: string | null }).cover_image_url ?? undefined,
    }))
  }, [rawUnits, rawProperties, isLive])

  const tenancies: TenancyCardData[] = useMemo(() => {
    if (!isLive) return MOCK_TENANCIES
    if (!rawTenancies?.length) return []
    const propName = new globalThis.Map((rawProperties ?? []).map(p => [p.id, p.name]))
    return rawTenancies.map((t) => ({
      id: t.id, property_id: t.property_id, unit_id: t.unit_id,
      property_name: propName.get(t.property_id),
      status: t.status, start_date: t.start_date, end_date: t.end_date,
      rent_amount: t.rent_amount, deposit_amount: t.deposit_amount,
      deposit_held_by: t.deposit_held_by, rent_frequency: t.rent_frequency,
      tenant_avatar: (t as { tenant_avatar?: string | null }).tenant_avatar ?? undefined,
    }))
  }, [rawTenancies, rawProperties, isLive])

  const properties: PropertyCardData[] = useMemo(() => {
    if (!isLive) return MOCK_PROPERTIES
    if (!rawProperties?.length) return []
    const agg = aggregateByProperty(
      (rawUnits ?? []).map(u => ({ property_id: u.property_id, status: u.status, target_rent: u.target_rent })),
      (rawTenancies ?? []).map(t => ({ property_id: t.property_id, status: t.status, rent_amount: t.rent_amount })),
    )
    return rawProperties.map((p) => {
      const a = agg.get(p.id)
      // A property with no unit rows is treated as a single implicit unit.
      const unitCount = a && a.units > 0 ? a.units : 1
      const occupied = a ? a.occupied : 0
      const tenants = a ? a.tenants : 0
      // Single-unit properties: status drives occupancy.
      const effectiveOccupied = a && a.units > 0 ? occupied : (p.status === "active" ? 1 : 0)
      return {
        id: p.id, name: p.name,
        address: [p.address_line1, p.city].filter(Boolean).join(", ") ?? "",
        postcode: p.postcode ?? "",
        type: normalisePropertyType(p.property_type) as PropertyCardData["type"],
        status: normalisePropertyStatus(p.status) as PropertyCardData["status"],
        units: unitCount,
        occupied: effectiveOccupied,
        tenants,
        monthlyRent: (a && a.unitRent > 0 ? a.unitRent : p.target_rent) ?? 0,
        operationProfile: normaliseOperationProfile(p.operation_profile),
        bedrooms: p.bedrooms ?? undefined,
        bathrooms: p.bathrooms ?? undefined,
        coverImageUrl: p.cover_image_url ?? undefined,
      }
    })
  }, [rawProperties, rawUnits, rawTenancies, isLive])

  /* Filtered datasets */
  const filteredProperties = useMemo(() => {
    let r = [...properties]
    const q = propSearch.toLowerCase()
    if (q) r = r.filter(p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || (p.postcode ?? "").toLowerCase().includes(q))
    if (propFStatus !== "all") r = r.filter(p => p.status === propFStatus)
    if (propFProfile !== "all") r = r.filter(p => p.operationProfile === propFProfile)
    if (propFCity) r = r.filter(p => p.address.toLowerCase().includes(propFCity.toLowerCase()) || (p.postcode ?? "").toLowerCase().includes(propFCity.toLowerCase()))
    if (propFMinRent) r = r.filter(p => p.monthlyRent >= Number(propFMinRent))
    if (propFMaxRent) r = r.filter(p => p.monthlyRent <= Number(propFMaxRent))
    return r
  }, [properties, propSearch, propFStatus, propFProfile, propFCity, propFMinRent, propFMaxRent])

  const filteredUnits = useMemo(() => {
    let r = [...units]
    const q = unitSearch.toLowerCase()
    if (q) r = r.filter(u => (u.unit_name ?? "").toLowerCase().includes(q) || (u.property_name ?? "").toLowerCase().includes(q) || (u.tenant_name ?? "").toLowerCase().includes(q))
    if (unitFStatus !== "all") r = r.filter(u => u.status === unitFStatus)
    if (unitFType !== "all") r = r.filter(u => u.unit_type === unitFType)
    if (unitFProp !== "all") r = r.filter(u => u.property_id === unitFProp)
    return r
  }, [units, unitSearch, unitFStatus, unitFType, unitFProp])

  const filteredTenancies = useMemo(() => {
    let r = [...tenancies]
    const q = tenSearch.toLowerCase()
    if (q) r = r.filter(t => (t.tenant_name ?? "").toLowerCase().includes(q) || (t.property_name ?? "").toLowerCase().includes(q) || (t.unit_name ?? "").toLowerCase().includes(q))
    if (tenFStatus !== "all") r = r.filter(t => t.status === tenFStatus)
    if (tenFArrears) r = r.filter(t => (t.arrears ?? 0) > 0)
    if (tenFEndingSoon) r = r.filter(t => t.end_date && daysUntil(t.end_date) >= 0 && daysUntil(t.end_date) <= 60)
    if (tenFProp !== "all") r = r.filter(t => t.property_id === tenFProp)
    if (tenFMinRent) r = r.filter(t => t.rent_amount >= Number(tenFMinRent))
    if (tenFMaxRent) r = r.filter(t => t.rent_amount <= Number(tenFMaxRent))
    if (tenFProfile !== "all") r = r.filter(t => {
      const prop = properties.find(p => p.id === t.property_id)
      return prop?.operationProfile === tenFProfile
    })
    return r
  }, [tenancies, properties, tenSearch, tenFStatus, tenFArrears, tenFEndingSoon, tenFProp, tenFMinRent, tenFMaxRent, tenFProfile])

  /* Active filter counts */
  const propActiveFilters = [propSearch, propFStatus !== "all" ? "1" : "", propFProfile !== "all" ? "1" : "", propFCity, propFMinRent, propFMaxRent].filter(Boolean).length
  const unitActiveFilters = [unitSearch, unitFStatus !== "all" ? "1" : "", unitFType !== "all" ? "1" : "", unitFProp !== "all" ? "1" : ""].filter(Boolean).length
  const tenActiveFilters  = [tenSearch, tenFStatus !== "all" ? "1" : "", tenFArrears ? "1" : "", tenFEndingSoon ? "1" : "", tenFProp !== "all" ? "1" : "", tenFProfile !== "all" ? "1" : "", tenFMinRent, tenFMaxRent].filter(Boolean).length

  /* KPIs */
  const totalUnits      = units.length
  const vacantUnits     = units.filter(u => u.status === "vacant").length
  const occupiedUnits   = units.filter(u => u.status === "occupied").length
  const activeTenancies = tenancies.filter(t => t.status === "active").length
  const totalRentRoll   = tenancies.filter(t => t.status === "active").reduce((s, t) => s + t.rent_amount, 0)
  const occupancyPct    = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
  const endingSoon      = tenancies.filter(t => t.end_date && daysUntil(t.end_date) >= 0 && daysUntil(t.end_date) <= 60)
  const arrearsCount    = tenancies.filter(t => (t.arrears ?? 0) > 0).length
  const arrearsTotal    = tenancies.reduce((s, t) => s + (t.arrears ?? 0), 0)

  /* Unique property list for dropdowns */
  const propertyOptions = properties.map(p => ({ id: p.id, name: p.name }))

  /* CSV export — client-side, derived from the live (or seeded) rows */
  function exportPortfolio() {
    exportCsv(
      properties.map(p => ({
        name: p.name,
        address: p.address,
        postcode: p.postcode,
        type: p.type,
        operation_profile: p.operationProfile,
        status: p.status,
        units: p.units,
        occupied: p.occupied ?? 0,
        monthly_rent: p.monthlyRent,
      })),
      `portfolio-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  /* Tabs */
  const MAIN_TABS: { key: MainTab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "overview",   label: "Overview",   icon: Activity },
    { key: "properties", label: "Properties", icon: Building2, count: properties.length },
    { key: "units",      label: "Units",      icon: Home,      count: totalUnits },
    { key: "tenancies",  label: "Tenancies",  icon: Users,     count: activeTenancies },
  ]

  const PROP_VIEWS: { key: PropertyView; label: string; icon: React.ElementType }[] = [
    { key: "grid", label: "Grid", icon: LayoutGrid },
    { key: "list", label: "List", icon: List },
    { key: "data", label: "Data", icon: Table2 },
  ]
  const UNIT_VIEWS: { key: UnitView; label: string; icon: React.ElementType }[] = [
    { key: "grid", label: "Grid", icon: LayoutGrid },
    { key: "list", label: "List", icon: List },
  ]
  const TEN_VIEWS: { key: TenancyView; label: string; icon: React.ElementType }[] = [
    { key: "cards", label: "Cards", icon: LayoutGrid },
    { key: "list",  label: "List",  icon: List },
    { key: "data",  label: "Data",  icon: Table2 },
    { key: "gantt", label: "Gantt", icon: BarChart3 },
  ]

  const openWorkTotal = properties.reduce((s, p) => s + (p.openWork ?? 0), 0)
  const portfolioKpis = [
    { label: "Properties",    value: String(properties.length), icon: Building2,    color: "text-[#2563EB]",  bg: "bg-blue-50",    href: "/app/portfolio/properties", sub: `${properties.filter(p => p.status === "Active").length} active` },
    { label: "Units",         value: String(totalUnits),        icon: Home,          color: "text-[#7C3AED]",  bg: "bg-violet-50",  href: "/app/portfolio/units", sub: `${vacantUnits} vacant` },
    { label: "Tenancies",     value: String(activeTenancies),   icon: Users,         color: "text-[#10B981]",  bg: "bg-emerald-50", href: "/app/portfolio/tenancies", sub: "Active" },
    { label: "Occupancy",     value: totalUnits > 0 ? `${occupancyPct}%` : "—",  icon: TrendingUp,    color: occupancyPct >= 90 ? "text-[#10B981]" : occupancyPct >= 70 ? "text-[#F59E0B]" : "text-[#EF4444]", bg: occupancyPct >= 90 ? "bg-emerald-50" : occupancyPct >= 70 ? "bg-amber-50" : "bg-red-50", href: "/app/portfolio/units", sub: "Portfolio avg" },
    { label: "Rent Roll",     value: totalRentRoll > 0 ? fmtGBP(totalRentRoll) : "—",     icon: PoundSterling, color: "text-[#10B981]",  bg: "bg-emerald-50", href: "/app/portfolio/tenancies", sub: "Monthly gross" },
    { label: "Arrears",       value: arrearsTotal > 0 ? fmtGBP(arrearsTotal) : "£0", icon: AlertTriangle, color: arrearsCount > 0 ? "text-[#EF4444]" : "text-slate-400", bg: arrearsCount > 0 ? "bg-red-50" : "bg-slate-50", href: "/app/money/arrears", sub: `${arrearsCount} tenant${arrearsCount === 1 ? "" : "s"}` },
    { label: "Ending Soon",   value: String(endingSoon.length), icon: Clock,         color: endingSoon.length > 0 ? "text-[#F59E0B]" : "text-slate-400", bg: endingSoon.length > 0 ? "bg-amber-50" : "bg-slate-50", href: "/app/portfolio/tenancies", sub: "Within 60 days" },
    { label: "Open Work",     value: String(openWorkTotal),     icon: Wrench, color: openWorkTotal > 0 ? "text-slate-700" : "text-slate-400", bg: "bg-slate-50", href: "/app/work", sub: "Tasks & jobs" },
  ]

  /* ── SVG occupancy ring ── */
  const OccRing = ({ pct, size = 44 }: { pct: number; size?: number }) => {
    const r = 13, c = 2 * Math.PI * r, dash = (pct / 100) * c
    return (
      <svg width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4.5" />
        <circle cx="18" cy="18" r={r} fill="none" stroke="white" strokeWidth="4.5"
          strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "18px 18px" }} />
        <text x="18" y="22" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700">{pct}%</text>
      </svg>
    )
  }

  return (
    <DashboardContainer>
      <PageHeader
        title="Portfolio"
        description="Command centre for your property portfolio"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportPortfolio}
              disabled={properties.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />Export
            </button>
            <ActionMenu
              align="right"
              items={[
                { label: "View all properties", icon: Building2, onClick: () => setActiveTab("properties") },
                { label: "Open map view", icon: Map, onClick: () => router.push("/app/portfolio/map") },
                { label: "Open tenancy timeline", icon: Calendar, onClick: () => router.push("/app/portfolio/timeline") },
                { label: "Export portfolio (CSV)", icon: Download, onClick: exportPortfolio },
              ]}
            />
            <Button variant="primary" size="md" asChild>
              <Link href="/app/portfolio/properties/new"><Plus className="w-4 h-4" />Add property</Link>
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
          {portfolioKpis.map(k => <PortfolioKpiCard key={k.label} {...k} />)}
        </div>
      )}

      {/* Main tab bar */}
      <div className="flex items-center gap-0 mb-4 border-b border-slate-200">
        {MAIN_TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap transition-all duration-150",
                active ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700"
              )}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count != null && (
                <span className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold",
                  active ? "bg-blue-100 text-[#2563EB]" : "bg-slate-100 text-slate-500"
                )}>{tab.count}</span>
              )}
            </button>
          )
        })}

        <div className="ml-auto pb-1">
          {activeTab === "properties" && <ViewSwitcher options={PROP_VIEWS} value={propView} onChange={setPropView} />}
          {activeTab === "units"      && <ViewSwitcher options={UNIT_VIEWS} value={unitView} onChange={setUnitView} />}
          {activeTab === "tenancies"  && <ViewSwitcher options={TEN_VIEWS}  value={tenView}  onChange={setTenView} />}
        </div>
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>

      ) : isLive && properties.length === 0 ? (
        /* ══ EMPTY WORKSPACE ══ */
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
            <Building2 className="w-10 h-10 text-slate-300" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">Your portfolio is empty</p>
            <p className="text-sm text-slate-400 mt-1">Add your first property to start tracking units, tenancies and occupancy.</p>
          </div>
          <Button variant="primary" size="md" asChild>
            <Link href="/app/portfolio/properties/new"><Plus className="w-4 h-4" />Add first property</Link>
          </Button>
        </div>

      ) : activeTab === "overview" ? (
        /* ══ OVERVIEW ══ */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT 2/3 ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Portfolio segments – all 13 with arrow carousel */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-slate-900">Portfolio segments</h3>
                <button onClick={() => setActiveTab("properties")}
                  className="text-[12px] text-[#2563EB] hover:text-[#1d4ed8] font-semibold flex items-center gap-1 transition-colors">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                {/* Left arrow + fade */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10 flex items-center pointer-events-none">
                  <button
                    onClick={() => scrollSegs("left")}
                    className="w-8 h-8 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center ml-0.5 hover:bg-slate-50 hover:shadow-lg transition-all duration-200 pointer-events-auto"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>

                {/* Scroll container */}
                <div
                  ref={segScrollRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide px-10"
                >
                  {ALL_PROFILES.map(profile => {
                    const count = properties.filter(p => p.operationProfile === profile.key).length
                    const rent  = properties.filter(p => p.operationProfile === profile.key).reduce((a, p) => a + p.monthlyRent, 0)
                    const occ   = count > 0
                      ? Math.round(properties.filter(p => p.operationProfile === profile.key).reduce((a, p) => a + ((p.occupied ?? 0) / (p.units || 1)) * 100, 0) / count)
                      : 0
                    const empty = count === 0

                    return (
                      <div
                        key={profile.key}
                        onClick={() => { setPropFProfile(profile.key); setActiveTab("properties") }}
                        className={cn(
                          "relative shrink-0 w-[200px] h-[180px] rounded-2xl overflow-hidden border cursor-pointer group shadow-sm",
                          "hover:shadow-xl hover:-translate-y-1 transition-all duration-200",
                          empty ? "border-slate-200 opacity-60 hover:opacity-90" : "border-white/10"
                        )}
                      >
                        {/* Full-bleed category photo (always shown; reduced opacity when empty) */}
                        <Image
                          src={profile.img}
                          alt={profile.label}
                          fill
                          className={cn(
                            "object-cover group-hover:scale-105 transition-transform duration-500",
                            empty ? "opacity-40" : "opacity-100"
                          )}
                          sizes="200px"
                        />
                        <div className={cn("absolute inset-0", "bg-gradient-to-t from-black/75 via-black/20 to-black/10")} />

                        {/* Top */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm"
                            style={{ background: profile.color }}>
                            {profile.label}
                          </span>
                          <div onClick={e => e.stopPropagation()}>
                            <ActionMenu
                              align="right"
                              items={[
                                { label: `View ${profile.shortLabel} properties`, icon: Eye, onClick: () => setActiveTab("properties") },
                                { label: "Add property", icon: Plus, onClick: () => router.push("/app/portfolio/properties/new") },
                              ]}
                            />
                          </div>
                        </div>

                        {/* Bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                          <div>
                            {empty ? (
                              <p className="text-[13px] font-bold text-white/80">
                                No properties
                              </p>
                            ) : (
                              <>
                                <p className="text-white text-[14px] font-black leading-none">
                                  {count} {count === 1 ? "property" : "properties"}
                                </p>
                                {rent > 0 && (
                                  <p className="text-white/75 text-[10px] mt-0.5 font-medium">
                                    {fmtGBP(rent)}/mo
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          {!empty && (
                            <div className="flex flex-col items-center">
                              <OccRing pct={occ} />
                              <span className="text-white/60 text-[8px] mt-0.5">Occ.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Right arrow + fade */}
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10 flex items-center justify-end pointer-events-none">
                  <button
                    onClick={() => scrollSegs("right")}
                    className="w-8 h-8 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center mr-0.5 hover:bg-slate-50 hover:shadow-lg transition-all duration-200 pointer-events-auto"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent properties */}
            {(() => {
              const STATUS_CHIP: Record<string, { label: string; dot: string; chip: string }> = {
                Active:        { label: "Occupied",    dot: "bg-emerald-400", chip: "bg-emerald-500/90 text-white" },
                Vacant:        { label: "Vacant",      dot: "bg-amber-400",   chip: "bg-amber-500/90 text-white" },
                "Under Works": { label: "Under Works", dot: "bg-blue-400",    chip: "bg-blue-500/90 text-white" },
              }
              const BADGE_COLOR: Record<string, string> = {
                "HMO": "#1D4ED8", "Long-Term Let": "#059669", "Serviced Accommodation": "#7C3AED",
                "Co-Living": "#DB2777", "Student Let": "#0891B2", "Rent-to-Rent": "#EA580C",
                "Holiday Let": "#D97706", "Social Housing": "#16A34A", "Supported Living": "#0369A1",
                "Commercial": "#374151", "Mixed Use": "#6B21A8", "Development": "#B45309", "Buy-to-Sell": "#BE123C",
              }
              const recent = properties.slice(0, 4)
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-bold text-slate-900">Recent properties</h3>
                    <button onClick={() => setActiveTab("properties")}
                      className="text-[12px] text-[#2563EB] hover:text-[#1d4ed8] font-semibold flex items-center gap-1 transition-colors">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    {recent.map(p => {
                      const occ = p.units > 0 ? Math.round(((p.occupied ?? 0) / p.units) * 100) : 0
                      const statusChip = STATUS_CHIP[p.status] ?? STATUS_CHIP.Active
                      const badgeColor = BADGE_COLOR[p.operationProfile ?? ""] ?? "#475569"
                      const badgeLabel = p.operationProfile === "Serviced Accommodation" ? "SA" : p.operationProfile ?? p.type
                      return (
                        <Link key={p.id} href={`/app/portfolio/properties/${p.id}`}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col">
                          <div className="relative h-[110px] shrink-0" style={{ background: BADGE_COLOR[p.operationProfile ?? ""] ? `linear-gradient(135deg, ${BADGE_COLOR[p.operationProfile ?? ""]}cc 0%, ${BADGE_COLOR[p.operationProfile ?? ""]} 100%)` : "linear-gradient(135deg, #475569 0%, #64748B 100%)" }}>
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                              <Building2 className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute top-2 left-2">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shadow-sm" style={{ background: badgeColor }}>{badgeLabel}</span>
                            </div>
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.preventDefault()}>
                              <ActionMenu
                                align="right"
                                items={[
                                  { label: "View property", icon: Eye, onClick: () => router.push(`/app/portfolio/properties/${p.id}`) },
                                  { label: "Add unit", icon: Plus, onClick: () => router.push(`/app/portfolio/units/new?propertyId=${p.id}`) },
                                  { label: "Create tenancy", icon: Users, onClick: () => router.push(`/app/portfolio/tenancies/new?propertyId=${p.id}`) },
                                  ...(isLive ? [{ label: "Delete", icon: Trash2, variant: "danger" as const, onClick: () => setConfirmDelete({ id: p.id, name: p.name }) }] : []),
                                ]}
                              />
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <span className={cn("inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full", statusChip.chip)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", statusChip.dot)} />{statusChip.label}
                              </span>
                            </div>
                          </div>
                          <div className="p-3 flex flex-col gap-1.5 flex-1">
                            <div>
                              <p className="text-[12.5px] font-bold text-slate-900 leading-tight truncate">{p.name}</p>
                              <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{p.address}</p>
                            </div>
                            <p className="text-[15px] font-black text-slate-900 tabular-nums leading-none">
                              {p.monthlyRent > 0 ? <>{fmtGBP(p.monthlyRent)}<span className="text-[11px] text-slate-400 font-medium">/mo</span></> : <span className="text-slate-300">—</span>}
                            </p>
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                              <div className="flex flex-col items-center flex-1"><p className="text-[11px] font-bold text-slate-800 tabular-nums">{p.units}</p><p className="text-[9px] text-slate-400">Units</p></div>
                              <div className="w-px h-5 bg-slate-100" />
                              <div className="flex flex-col items-center flex-1"><p className="text-[11px] font-bold text-slate-800 tabular-nums">{p.bedrooms ?? p.units}</p><p className="text-[9px] text-slate-400">Beds</p></div>
                              <div className="w-px h-5 bg-slate-100" />
                              <div className="flex flex-col items-center flex-1"><p className={cn("text-[11px] font-bold tabular-nums", occ >= 90 ? "text-emerald-600" : occ >= 70 ? "text-amber-600" : "text-red-600")}>{occ}%</p><p className="text-[9px] text-slate-400">Occ.</p></div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Map preview — honest: real property/city counts, links to live Leaflet map */}
            {(() => {
              const cities = Array.from(new Set(
                properties.map(p => (p.address.split(",").pop() ?? "").trim()).filter(Boolean)
              ))
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-bold text-slate-900">Map preview</h3>
                    <Link href="/app/portfolio/map"
                      className="text-[12px] text-[#2563EB] hover:text-[#1d4ed8] font-semibold flex items-center gap-1 transition-colors">
                      Open full map <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <Link href="/app/portfolio/map"
                    className="relative block h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                    <div className="absolute inset-0" style={{ backgroundImage: "url(https://a.basemaps.cartocdn.com/light_all/6/31/20.png)", backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/5 transition-colors" />
                    {properties.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <MapPin className="w-8 h-8 text-slate-300" />
                        <p className="text-[12px] font-semibold text-slate-500">No properties to map yet</p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 px-5 py-3.5 flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[18px] font-black text-slate-900 tabular-nums leading-none">{properties.length}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Properties</p>
                          </div>
                          <div className="w-px h-8 bg-slate-200" />
                          <div className="text-center">
                            <p className="text-[18px] font-black text-slate-900 tabular-nums leading-none">{cities.length || "—"}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{cities.length === 1 ? "Location" : "Locations"}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#2563EB] pl-1">
                            <Map className="w-4 h-4" />View map
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                </div>
              )
            })()}
          </div>

          {/* ── RIGHT 1/3 ── */}
          <div className="flex flex-col gap-4">
            {/* Attention required */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h3 className="text-[13.5px] font-bold text-slate-900">Attention required</h3>
              </div>
              <div className="flex flex-col divide-y divide-slate-50">
                <AttentionRow icon={AlertTriangle} label={`Arrears across ${arrearsCount} tenant${arrearsCount === 1 ? "" : "s"}`} value={arrearsTotal > 0 ? fmtGBP(arrearsTotal) : "£0"} color={arrearsCount > 0 ? "text-red-600" : "text-slate-400"} bg={arrearsCount > 0 ? "bg-red-50" : "bg-slate-100"} href="/app/money/arrears" urgent />
                <AttentionRow icon={Clock} label="Tenancies ending soon" value={endingSoon.length} color={endingSoon.length > 0 ? "text-amber-600" : "text-slate-400"} bg={endingSoon.length > 0 ? "bg-amber-50" : "bg-slate-100"} href="/app/portfolio/tenancies" />
                <AttentionRow icon={Wrench} label="Open work orders" value={openWorkTotal} color={openWorkTotal > 0 ? "text-slate-600" : "text-slate-400"} bg="bg-slate-100" href="/app/work" />
                <AttentionRow icon={Home} label="Vacant units" value={vacantUnits} color={vacantUnits > 0 ? "text-violet-600" : "text-slate-400"} bg={vacantUnits > 0 ? "bg-violet-50" : "bg-slate-100"} href="/app/portfolio/units" />
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-[13.5px] font-bold text-slate-900">Quick actions</h3>
              </div>
              <div className="flex flex-col divide-y divide-slate-50">
                {([
                  { label: "Add property",      href: "/app/portfolio/properties/new", icon: Building2,  iconBg: "bg-blue-50",    iconColor: "text-[#2563EB]" },
                  { label: "Add unit",           href: "/app/portfolio/units/new",      icon: Home,       iconBg: "bg-violet-50",  iconColor: "text-violet-600" },
                  { label: "Create tenancy",     href: "/app/portfolio/tenancies/new",  icon: Users,      iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
                  { label: "Open work queue",    href: "/app/work",                     icon: Wrench,     iconBg: "bg-slate-100",  iconColor: "text-slate-500" },
                  { label: "Run rent review",    onClick: () => setActiveTab("tenancies"), icon: TrendingUp, iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
                  { label: "Create planning set",href: "/app/planning",                 icon: BarChart2,  iconBg: "bg-violet-50",  iconColor: "text-violet-600" },
                ] as const).map((a, i) => {
                  const Icon = a.icon
                  const inner = (
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group cursor-pointer w-full">
                      <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0", a.iconBg)}>
                        <Icon className={cn("w-3.5 h-3.5", a.iconColor)} />
                      </div>
                      <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors flex-1 text-left">{a.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                    </div>
                  )
                  if ("href" in a && a.href) return <Link key={i} href={a.href}>{inner}</Link>
                  return <button key={i} onClick={"onClick" in a ? a.onClick : undefined}>{inner}</button>
                })}
              </div>
            </div>

            {/* AI Review */}
            <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #6D28D9 0%, #7C3AED 50%, #5B21B6 100%)" }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #A78BFA, transparent)" }} />
              <div className="relative p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-bold text-white">AI Portfolio Review</span>
                        <span className="text-[9.5px] font-semibold text-violet-300 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10">Beta</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0">
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-violet-700" />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
                    </div>
                  </div>
                </div>
                <p className="text-[12px] text-violet-200 mb-3 leading-relaxed">Get an intelligent summary of your portfolio performance, risks, and opportunities.</p>
                <div className="flex flex-col gap-1.5 mb-4">
                  {[{ icon: TrendingUp, label: "Performance insights" }, { icon: AlertTriangle, label: "Risk detection" }, { icon: Sparkles, label: "Actionable recommendations" }].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-[11px] text-violet-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />{label}
                    </div>
                  ))}
                </div>
                <button
                  disabled
                  title="AI Portfolio Review is coming soon"
                  className="w-full py-2.5 rounded-xl bg-white/90 text-[13px] font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                  style={{ color: "#5B21B6" }}
                >
                  <Sparkles className="w-3.5 h-3.5" />Coming soon
                </button>
              </div>
            </div>
          </div>
        </div>

      ) : activeTab === "properties" ? (
        /* ══ PROPERTIES ══ */
        <div>
          {/* Filter panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={propSearch}
                  onChange={e => setPropSearch(e.target.value)}
                  placeholder="Search by name, address, postcode..."
                  className="w-full h-9 pl-9 pr-4 rounded-xl text-[12.5px] bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                />
              </div>
              <button
                onClick={() => setPropShowAdv(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[12px] font-semibold transition-all shadow-sm whitespace-nowrap",
                  propShowAdv || propActiveFilters > 0
                    ? "bg-blue-50 border-blue-200 text-[#2563EB]"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {propActiveFilters > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">{propActiveFilters}</span>
                )}
              </button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/app/portfolio/properties/new"><Plus className="w-4 h-4" />Add</Link>
              </Button>
            </div>

            {/* Status chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", "Active", "Vacant", "Under Works"].map(s => (
                <Chip key={s} active={propFStatus === s} onClick={() => setPropFStatus(s)}>{s === "all" ? "All statuses" : s}</Chip>
              ))}
            </div>

            {/* Advanced filters */}
            {propShowAdv && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <FLabel>Operation profile</FLabel>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip active={propFProfile === "all"} onClick={() => setPropFProfile("all")}>All</Chip>
                    {ALL_PROFILES.map(p => (
                      <Chip key={p.key} active={propFProfile === p.key} onClick={() => setPropFProfile(propFProfile === p.key ? "all" : p.key)} color={p.color}>{p.shortLabel}</Chip>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <FLabel>City / location</FLabel>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <FInput value={propFCity} onChange={setPropFCity} placeholder="e.g. Manchester" />
                    </div>
                  </div>
                  <div>
                    <FLabel>Min monthly rent</FLabel>
                    <FInput value={propFMinRent} onChange={setPropFMinRent} placeholder="0" prefix="£" />
                  </div>
                  <div>
                    <FLabel>Max monthly rent</FLabel>
                    <FInput value={propFMaxRent} onChange={setPropFMaxRent} placeholder="Any" prefix="£" />
                  </div>
                </div>
                {propActiveFilters > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-slate-500">{filteredProperties.length} of {properties.length} properties</p>
                    <button onClick={() => { setPropSearch(""); setPropFStatus("all"); setPropFProfile("all"); setPropFCity(""); setPropFMinRent(""); setPropFMaxRent("") }}
                      className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-3.5 h-3.5" />Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[12.5px] text-slate-500 mb-4">
            Showing {filteredProperties.length} of {properties.length} properties
          </p>

          {propView === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProperties.map(p => <PropertyCard key={p.id} property={p} />)}
              {filteredProperties.length === 0 && (
                <div className="col-span-full flex flex-col items-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><Building2 className="w-8 h-8 text-slate-300" /></div>
                  <p className="text-[13px] font-semibold text-slate-600">No properties match your filters</p>
                  <button onClick={() => { setPropSearch(""); setPropFStatus("all"); setPropFProfile("all"); setPropFCity(""); setPropFMinRent(""); setPropFMaxRent("") }} className="text-sm text-[#2563EB] hover:underline">Clear filters</button>
                </div>
              )}
            </div>
          )}
          {propView === "list" && <PropertyListView properties={filteredProperties} />}
          {propView === "data" && <PropertyDataView properties={filteredProperties} />}
        </div>

      ) : activeTab === "units" ? (
        /* ══ UNITS ══ */
        <div>
          {/* Filter panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={unitSearch}
                  onChange={e => setUnitSearch(e.target.value)}
                  placeholder="Search by unit name, property, tenant..."
                  className="w-full h-9 pl-9 pr-4 rounded-xl text-[12.5px] bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                />
              </div>
              <button
                onClick={() => setUnitShowAdv(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[12px] font-semibold transition-all shadow-sm whitespace-nowrap",
                  unitShowAdv || unitActiveFilters > 0 ? "bg-blue-50 border-blue-200 text-[#2563EB]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />Filters
                {unitActiveFilters > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">{unitActiveFilters}</span>
                )}
              </button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/app/portfolio/units/new"><Plus className="w-4 h-4" />Add</Link>
              </Button>
            </div>

            {/* Status chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[{ v: "all", l: "All statuses" }, { v: "occupied", l: "Occupied" }, { v: "vacant", l: "Vacant" }, { v: "under_works", l: "Maintenance" }, { v: "reserved", l: "Reserved" }].map(s => (
                <Chip key={s.v} active={unitFStatus === s.v} onClick={() => setUnitFStatus(s.v)}>{s.l}</Chip>
              ))}
            </div>

            {/* Advanced */}
            {unitShowAdv && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <FLabel>Unit type</FLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {[{ v: "all", l: "All types" }, { v: "room", l: "Room" }, { v: "studio", l: "Studio" }, { v: "flat", l: "Flat" }, { v: "suite", l: "Suite" }, { v: "house", l: "House" }, { v: "apartment", l: "Apartment" }].map(t => (
                      <Chip key={t.v} active={unitFType === t.v} onClick={() => setUnitFType(t.v)}>{t.l}</Chip>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FLabel>Property</FLabel>
                    <select
                      value={unitFProp}
                      onChange={e => setUnitFProp(e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-sm"
                    >
                      <option value="all">All properties</option>
                      {propertyOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                {unitActiveFilters > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-slate-500">{filteredUnits.length} of {units.length} units</p>
                    <button onClick={() => { setUnitSearch(""); setUnitFStatus("all"); setUnitFType("all"); setUnitFProp("all") }}
                      className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[12.5px] text-slate-500 mb-4">
            Showing {filteredUnits.length} of {totalUnits} units · {vacantUnits} vacant
          </p>

          {unitView === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredUnits.map(u => <UnitCard key={u.id} unit={u} />)}
              {filteredUnits.length === 0 && (
                <div className="col-span-full flex flex-col items-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><Home className="w-8 h-8 text-slate-300" /></div>
                  <p className="text-[13px] font-semibold text-slate-600">No units match your filters</p>
                </div>
              )}
            </div>
          )}

          {unitView === "list" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Unit</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Property</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tenant</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rent</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Area</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUnits.map(u => {
                      const statusCfg = {
                        occupied:    { label: "Occupied",    dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-200" },
                        vacant:      { label: "Vacant",      dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-100 border border-slate-200" },
                        under_works: { label: "Maintenance", dot: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50 border border-amber-200" },
                        reserved:    { label: "Reserved",    dot: "bg-violet-500",  text: "text-violet-700",  bg: "bg-violet-50 border border-violet-200" },
                      }[u.status] ?? { label: "Vacant", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100 border border-slate-200" }
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-4 py-3">
                            <Link href={`/app/portfolio/units/${u.id}`} className="text-[13px] font-semibold text-slate-900 hover:text-[#2563EB] transition-colors">{u.unit_name}</Link>
                            <p className="text-[11px] text-slate-400">{u.unit_type ?? "Unit"}</p>
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-slate-600">{u.property_name ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", statusCfg.bg, statusCfg.text)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />{statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-slate-700">{u.tenant_name ?? <span className="text-slate-300">—</span>}</td>
                          <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900 tabular-nums">{u.target_rent ? fmtGBP(u.target_rent) : <span className="text-slate-300">—</span>}</td>
                          <td className="px-4 py-3 text-[12px] text-slate-500">{u.floor_area_sqm ? `${u.floor_area_sqm}m²` : "—"}</td>
                          <td className="px-4 py-3">
                            <Link href={`/app/portfolio/units/${u.id}`} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#2563EB] hover:text-white flex items-center justify-center text-slate-500 transition-all">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredUnits.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No units match your filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      ) : activeTab === "tenancies" ? (
        /* ══ TENANCIES ══ */
        <div>
          {/* Filter panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={tenSearch}
                  onChange={e => setTenSearch(e.target.value)}
                  placeholder="Search by tenant, property, unit..."
                  className="w-full h-9 pl-9 pr-4 rounded-xl text-[12.5px] bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                />
              </div>
              <button
                onClick={() => setTenShowAdv(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[12px] font-semibold transition-all shadow-sm whitespace-nowrap",
                  tenShowAdv || tenActiveFilters > 0 ? "bg-blue-50 border-blue-200 text-[#2563EB]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />Filters
                {tenActiveFilters > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">{tenActiveFilters}</span>
                )}
              </button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/app/portfolio/tenancies/new"><Plus className="w-4 h-4" />Create</Link>
              </Button>
            </div>

            {/* Status + quick filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", "active", "pending", "ended", "disputed"].map(s => (
                <Chip key={s} active={tenFStatus === s} onClick={() => setTenFStatus(s)}>{s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</Chip>
              ))}
              <div className="h-4 w-px bg-slate-200 mx-0.5" />
              <Chip active={tenFEndingSoon} onClick={() => setTenFEndingSoon(v => !v)} color="#EA580C">Ending soon</Chip>
              <Chip active={tenFArrears} onClick={() => setTenFArrears(v => !v)} color="#EF4444">Arrears</Chip>
            </div>

            {/* Advanced */}
            {tenShowAdv && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <FLabel>Operation profile</FLabel>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip active={tenFProfile === "all"} onClick={() => setTenFProfile("all")}>All profiles</Chip>
                    {ALL_PROFILES.map(p => (
                      <Chip key={p.key} active={tenFProfile === p.key} onClick={() => setTenFProfile(tenFProfile === p.key ? "all" : p.key)} color={p.color}>{p.shortLabel}</Chip>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <FLabel>Property</FLabel>
                    <select value={tenFProp} onChange={e => setTenFProp(e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 text-[12px] text-slate-700 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-sm">
                      <option value="all">All properties</option>
                      {propertyOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <FLabel>Min rent</FLabel>
                    <FInput value={tenFMinRent} onChange={setTenFMinRent} placeholder="0" prefix="£" />
                  </div>
                  <div>
                    <FLabel>Max rent</FLabel>
                    <FInput value={tenFMaxRent} onChange={setTenFMaxRent} placeholder="Any" prefix="£" />
                  </div>
                </div>
                {tenActiveFilters > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-slate-500">{filteredTenancies.length} of {tenancies.length} tenancies</p>
                    <button onClick={() => { setTenSearch(""); setTenFStatus("all"); setTenFArrears(false); setTenFEndingSoon(false); setTenFProp("all"); setTenFProfile("all"); setTenFMinRent(""); setTenFMaxRent("") }}
                      className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[12.5px] text-slate-500 mb-4">
            Showing {filteredTenancies.length} of {tenancies.length} tenancies · {endingSoon.length} ending soon · {arrearsCount} in arrears
          </p>

          {tenView === "cards" && (
            <div className="flex flex-col gap-3">
              {filteredTenancies.map(t => (
                <TenancyCard
                  key={t.id}
                  tenancy={t}
                  onView={id => router.push(`/app/portfolio/tenancies/${id}`)}
                />
              ))}
              {filteredTenancies.length === 0 && (
                <div className="flex flex-col items-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"><Users className="w-8 h-8 text-slate-300" /></div>
                  <p className="text-[13px] font-semibold text-slate-600">No tenancies match your filters</p>
                </div>
              )}
            </div>
          )}
          {tenView === "list"  && <TenancyListView tenancies={filteredTenancies} />}
          {tenView === "data"  && <TenancyDataView tenancies={filteredTenancies} />}
          {tenView === "gantt" && <TenancyGanttView tenancies={filteredTenancies} />}
        </div>

      ) : null}

      {/* Delete confirmation (live data) */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => !deleteProperty.isPending && setConfirmDelete(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Delete {confirmDelete.name}?</h3>
                <p className="text-[13px] text-slate-500 mt-1">This permanently removes the property. Units and tenancies linked to it may also be affected. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} disabled={deleteProperty.isPending}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDeleteProperty} disabled={deleteProperty.isPending}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors">
                {deleteProperty.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Delete property"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  )
}
