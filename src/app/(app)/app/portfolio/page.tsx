"use client"

import React, { useMemo, useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { StatCard } from "@/components/ui/StatCard"
import { PropertyCard, type PropertyCardData } from "@/components/portfolio/PropertyCard"
import { type UnitCardData } from "@/components/portfolio/UnitCard"
import { type TenancyCardData } from "@/components/portfolio/TenancyCard"
import { useWorkspace } from "@/providers/AuthProvider"
import { useProperties, useDeleteProperty } from "@/hooks/useProperties"
import { useUnits } from "@/hooks/useUnits"
import { useTenancies } from "@/hooks/useTenancies"
import { useMoneyArrearsSummary } from "@/hooks/useMoneyData"
import { Trash2 } from "lucide-react"
import {
  Building2, LayoutGrid, List, Plus, TrendingUp, Users, PoundSterling, Home,
  AlertTriangle, Map, Calendar, Wrench, ChevronRight, ChevronLeft, Activity,
  BarChart2, Clock, Sparkles, Table2, BarChart3, Download,
  Search, SlidersHorizontal, X, MapPin,
  Eye,
} from "lucide-react"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { cn } from "@/lib/utils"
import { aggregateByProperty, normaliseOperationProfile, normalisePropertyStatus, normalisePropertyType, exportCsv } from "@/lib/portfolio/helpers"
import { createClient } from "@/lib/supabase/client"
import { resolvePropertyCoverUrls, resolveCoverUrlsByUnit } from "@/lib/files/coverUrl"
import MobileTopBar from "@/components/mobile/MobileTopBar"
import { mapPreviewTile } from "@/lib/maps/tiles"

/* ------------------------------------------------------------------ */
/* 13 Operational Profiles                                              */
/* ------------------------------------------------------------------ */
const ALL_PROFILES = [
  { key: "HMO",                    label: "HMO",                    shortLabel: "HMO",        color: "#1d4ed8", gradient: "linear-gradient(135deg, var(--brand-strong) 0%, var(--brand) 100%)", img: "/property-types/hmo.jpg" },
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


/* ------------------------------------------------------------------ */
/* Main Page                                                            */
/* ------------------------------------------------------------------ */
export default function PortfolioPage() {
  const router = useRouter()
  const { workspace } = useWorkspace()

  const [activeTab, setActiveTab] = useState<MainTab>("overview")

  /* Segment carousel */
  const segScrollRef = useRef<HTMLDivElement>(null)
  const scrollSegs = (dir: "left" | "right") => {
    segScrollRef.current?.scrollBy({ left: dir === "right" ? 230 : -230, behavior: "smooth" })
  }


  /* Data hooks */
  const { data: rawProperties, isLoading: propsLoading } = useProperties(workspace?.id)
  const { data: rawUnits, isLoading: unitsLoading } = useUnits(workspace?.id)
  const { data: rawTenancies, isLoading: tenanciesLoading } = useTenancies(workspace?.id)
  const { data: arrearsSummary } = useMoneyArrearsSummary(workspace?.id)
  const loading = propsLoading || unitsLoading || tenanciesLoading

  /* Real uploaded cover photos → card coverImageUrl. Keyed by property id
     (properties.cover_file_id) and unit id (files.unit_id + is_cover).
     Empty maps leave coverImageUrl undefined → gradient fallback. */
  const [propCoverUrls, setPropCoverUrls] = useState<globalThis.Map<string, string>>(new globalThis.Map())
  useEffect(() => {
    if (!workspace?.id) { setPropCoverUrls(new globalThis.Map()); return }
    let active = true
    resolvePropertyCoverUrls(createClient(), workspace.id)
      .then((m) => { if (active) setPropCoverUrls(m) })
      .catch(() => { if (active) setPropCoverUrls(new globalThis.Map()) })
    return () => { active = false }
  }, [workspace?.id, rawProperties])

  const [unitCoverUrls, setUnitCoverUrls] = useState<globalThis.Map<string, string>>(new globalThis.Map())
  useEffect(() => {
    const ids = (rawUnits ?? []).map((u) => u.id)
    if (!workspace?.id || ids.length === 0) { setUnitCoverUrls(new globalThis.Map()); return }
    let active = true
    resolveCoverUrlsByUnit(createClient(), ids)
      .then((m) => { if (active) setUnitCoverUrls(m) })
      .catch(() => { if (active) setUnitCoverUrls(new globalThis.Map()) })
    return () => { active = false }
  }, [workspace?.id, rawUnits])

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
    if (!isLive || !rawUnits?.length) return []
    const propName = new globalThis.Map((rawProperties ?? []).map(p => [p.id, p.name]))
    return rawUnits.map(u => ({
      id: u.id, property_id: u.property_id,
      property_name: propName.get(u.property_id),
      unit_name: u.unit_name,
      unit_type: u.unit_type, bedrooms: u.bedrooms,
      floor_area_sqm: u.floor_area_sqm, target_rent: u.target_rent, status: u.status,
      coverImageUrl: unitCoverUrls.get(u.id) ?? (u as { cover_image_url?: string | null }).cover_image_url ?? undefined,
    }))
  }, [rawUnits, rawProperties, isLive, unitCoverUrls])

  const tenancies: TenancyCardData[] = useMemo(() => {
    if (!isLive || !rawTenancies?.length) return []
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
    if (!isLive || !rawProperties?.length) return []
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
        coverImageUrl: propCoverUrls.get(p.id) ?? p.cover_image_url ?? undefined,
      }
    })
  }, [rawProperties, rawUnits, rawTenancies, isLive, propCoverUrls])


  /* KPIs */
  const totalUnits      = units.length
  const vacantUnits     = units.filter(u => u.status === "vacant").length
  const occupiedUnits   = units.filter(u => u.status === "occupied").length
  const activeTenancies = tenancies.filter(t => t.status === "active").length
  const totalRentRoll   = tenancies.filter(t => t.status === "active").reduce((s, t) => s + t.rent_amount, 0)
  const occupancyPct    = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
  const endingSoon      = tenancies.filter(t => t.end_date && daysUntil(t.end_date) >= 0 && daysUntil(t.end_date) <= 60)
  // Arrears come from the canonical arrears-case ledger (arrears_records) — the
  // same source the Money › Arrears section reads, so the figure stays consistent
  // cross-section. The tenancy card list carries no arrears field of its own.
  const arrearsCount    = arrearsSummary?.openCases ?? 0
  const arrearsTotal    = arrearsSummary?.totalArrears ?? 0


  /* AI Portfolio Review — pre-flight cost confirmation → server-side AI action → inline result.
     Rule: must NOT open the copilot bubble. Must show estimate → confirm → execute → result. */
  type AiReviewPhase = "idle" | "confirm" | "loading" | "result" | "error"
  const [aiReviewPhase, setAiReviewPhase] = useState<AiReviewPhase>("idle")
  const [aiReviewResult, setAiReviewResult]   = useState<string>("")
  const [aiReviewError,  setAiReviewError]    = useState<string>("")

  function openAiReviewConfirm() {
    if (properties.length === 0) return
    setAiReviewPhase("confirm")
  }

  async function executeAiReview() {
    if (!workspace?.id) return
    setAiReviewPhase("loading")
    try {
      const res = await fetch("/api/ai/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "explain-portfolio", workspaceId: workspace.id }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAiReviewError(json.error ?? "AI review failed. Please try again.")
        setAiReviewPhase("error")
        return
      }
      // The /api/ai/actions route returns the AI text in `content`; keep the
      // legacy fallbacks for safety.
      setAiReviewResult(json.content ?? json.result ?? json.text ?? json.message ?? "Review complete.")
      setAiReviewPhase("result")
    } catch {
      setAiReviewError("Network error. Please check your connection and try again.")
      setAiReviewPhase("error")
    }
  }

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


  const openWorkTotal = properties.reduce((s, p) => s + (p.openWork ?? 0), 0)
  const portfolioKpis = [
    { label: "Properties",    value: String(properties.length), icon: Building2,    color: "text-[var(--brand)]",  bg: "bg-[var(--brand-soft)]",    href: "/property-manager/portfolio/properties", sub: `${properties.filter(p => p.status === "Active").length} active` },
    { label: "Units",         value: String(totalUnits),        icon: Home,          color: "text-[#7C3AED]",  bg: "bg-violet-50",  href: "/property-manager/portfolio/units", sub: `${vacantUnits} vacant` },
    { label: "Tenancies",     value: String(activeTenancies),   icon: Users,         color: "text-[#10B981]",  bg: "bg-emerald-50", href: "/property-manager/portfolio/tenancies", sub: "Active" },
    { label: "Occupancy",     value: totalUnits > 0 ? `${occupancyPct}%` : "—",  icon: TrendingUp,    color: occupancyPct >= 90 ? "text-[#10B981]" : occupancyPct >= 70 ? "text-[#F59E0B]" : "text-[#EF4444]", bg: occupancyPct >= 90 ? "bg-emerald-50" : occupancyPct >= 70 ? "bg-amber-50" : "bg-red-50", href: "/property-manager/portfolio/units", sub: "Portfolio avg" },
    { label: "Rent Roll",     value: totalRentRoll > 0 ? fmtGBP(totalRentRoll) : "—",     icon: PoundSterling, color: "text-[#10B981]",  bg: "bg-emerald-50", href: "/property-manager/portfolio/tenancies", sub: "Monthly gross" },
    { label: "Arrears",       value: arrearsTotal > 0 ? fmtGBP(arrearsTotal) : "£0", icon: AlertTriangle, color: arrearsCount > 0 ? "text-[#EF4444]" : "text-slate-400", bg: arrearsCount > 0 ? "bg-red-50" : "bg-slate-50", href: "/property-manager/money/arrears", sub: `${arrearsCount} tenant${arrearsCount === 1 ? "" : "s"}` },
    { label: "Ending Soon",   value: String(endingSoon.length), icon: Clock,         color: endingSoon.length > 0 ? "text-[#F59E0B]" : "text-slate-400", bg: endingSoon.length > 0 ? "bg-amber-50" : "bg-slate-50", href: "/property-manager/portfolio/tenancies", sub: "Within 60 days" },
    { label: "Open Work",     value: String(openWorkTotal),     icon: Wrench, color: openWorkTotal > 0 ? "text-slate-700" : "text-slate-400", bg: "bg-slate-50", href: "/property-manager/work", sub: "Tasks & jobs" },
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
      {/* Mobile top bar — compact title + primary "Add" + overflow */}
      <MobileTopBar
        title="Portfolio"
        subtitle={`${properties.length} propert${properties.length !== 1 ? "ies" : "y"} · ${totalUnits} units`}
        primaryAction={{ label: "Add property", icon: Plus, href: "/property-manager/portfolio/properties/new" }}
        overflowActions={[
          { label: "Map view", icon: Map, href: "/property-manager/portfolio/map" },
          { label: "Tenancy timeline", icon: Calendar, href: "/property-manager/portfolio/timeline" },
          { label: "Export portfolio (CSV)", icon: Download, onClick: exportPortfolio },
        ]}
      />

      {/* Desktop header — hidden on phones (MobileTopBar owns mobile) */}
      <div className="hidden md:block">
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
                { label: "View all properties", icon: Building2, onClick: () => router.push("/property-manager/portfolio/properties") },
                { label: "Open map view", icon: Map, onClick: () => router.push("/property-manager/portfolio/map") },
                { label: "Open tenancy timeline", icon: Calendar, onClick: () => router.push("/property-manager/portfolio/timeline") },
                { label: "Export portfolio (CSV)", icon: Download, onClick: exportPortfolio },
              ]}
            />
            <Button variant="primary" size="md" asChild>
              <Link href="/property-manager/portfolio/properties/new"><Plus className="w-4 h-4" />Add property</Link>
            </Button>
          </div>
        }
      />
      </div>
      {/* end desktop header (hidden on phones) */}

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

      {/* Main tab bar.
         Overview is the only inline tab. Properties / Units / Tenancies are LINKS
         to their canonical standalone routes (/portfolio/properties, /units,
         /tenancies) — these are the single source of truth, also reached by every
         detail-page "Back" link and the PortfolioSectionTabs. This removes the
         previous "two forms of the same page" (inline tab vs standalone route). */}
      <div className="flex items-center gap-0 mb-4 border-b border-slate-200 overflow-x-auto">
        {MAIN_TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          const badge = tab.count != null && (
            <span className={cn(
              "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold",
              active ? "bg-[var(--color-brand-100)] text-[var(--brand)]" : "bg-slate-100 text-slate-500"
            )}>{tab.count}</span>
          )
          const className = cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap transition-all duration-150",
            active ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500 hover:text-slate-700"
          )
          // Overview stays an inline tab; the list tabs navigate to canonical routes.
          if (tab.key === "overview") {
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={className}>
                <Icon className="w-3.5 h-3.5" />{tab.label}{badge}
              </button>
            )
          }
          const href = `/property-manager/portfolio/${tab.key}`
          return (
            <Link key={tab.key} href={href} className={className}>
              <Icon className="w-3.5 h-3.5" />{tab.label}{badge}
            </Link>
          )
        })}
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
            <p className="text-sm text-slate-500 mt-1">Add your first property to start tracking units, tenancies and occupancy.</p>
          </div>
          <Button variant="primary" size="md" asChild>
            <Link href="/property-manager/portfolio/properties/new"><Plus className="w-4 h-4" />Add first property</Link>
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
                <button onClick={() => router.push("/property-manager/portfolio/properties")}
                  className="text-[12px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-semibold flex items-center gap-1 transition-colors">
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
                        onClick={() => router.push("/property-manager/portfolio/properties")}
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
                                { label: `View ${profile.shortLabel} properties`, icon: Eye, onClick: () => router.push("/property-manager/portfolio/properties") },
                                { label: "Add property", icon: Plus, onClick: () => router.push("/property-manager/portfolio/properties/new") },
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

            {/* Recent properties — same canonical PropertyCard as the Properties tab (consistent). */}
            {properties.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-slate-900">Recent properties</h3>
                  <button onClick={() => router.push("/property-manager/portfolio/properties")}
                    className="text-[12px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-semibold flex items-center gap-1 transition-colors">
                    View all <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {properties.slice(0, 4).map(p => <PropertyCard key={p.id} property={p} />)}
                </div>
              </div>
            )}

            {/* Map preview — honest: real property/city counts, links to live Leaflet map */}
            {(() => {
              const cities = Array.from(new Set(
                properties.map(p => (p.address.split(",").pop() ?? "").trim()).filter(Boolean)
              ))
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-bold text-slate-900">Map preview</h3>
                    <Link href="/property-manager/portfolio/map"
                      className="text-[12px] text-[var(--brand)] hover:text-[var(--brand-strong)] font-semibold flex items-center gap-1 transition-colors">
                      Open full map <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <Link href="/property-manager/portfolio/map"
                    className="relative block h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                    <div className="absolute inset-0" style={{ backgroundImage: `url(${mapPreviewTile()})`, backgroundSize: "cover", backgroundPosition: "center" }} />
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
                            <p className="text-[10px] text-slate-500 mt-0.5">Properties</p>
                          </div>
                          <div className="w-px h-8 bg-slate-200" />
                          <div className="text-center">
                            <p className="text-[18px] font-black text-slate-900 tabular-nums leading-none">{cities.length || "—"}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{cities.length === 1 ? "Location" : "Locations"}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] pl-1">
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
                <AttentionRow icon={AlertTriangle} label={`Arrears across ${arrearsCount} tenant${arrearsCount === 1 ? "" : "s"}`} value={arrearsTotal > 0 ? fmtGBP(arrearsTotal) : "£0"} color={arrearsCount > 0 ? "text-red-600" : "text-slate-400"} bg={arrearsCount > 0 ? "bg-red-50" : "bg-slate-100"} href="/property-manager/money/arrears" urgent />
                <AttentionRow icon={Clock} label="Tenancies ending soon" value={endingSoon.length} color={endingSoon.length > 0 ? "text-amber-600" : "text-slate-400"} bg={endingSoon.length > 0 ? "bg-amber-50" : "bg-slate-100"} href="/property-manager/portfolio/tenancies" />
                <AttentionRow icon={Wrench} label="Open work orders" value={openWorkTotal} color={openWorkTotal > 0 ? "text-slate-600" : "text-slate-400"} bg="bg-slate-100" href="/property-manager/work" />
                <AttentionRow icon={Home} label="Vacant units" value={vacantUnits} color={vacantUnits > 0 ? "text-violet-600" : "text-slate-400"} bg={vacantUnits > 0 ? "bg-violet-50" : "bg-slate-100"} href="/property-manager/portfolio/units" />
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-[13.5px] font-bold text-slate-900">Quick actions</h3>
              </div>
              <div className="flex flex-col divide-y divide-slate-50">
                {([
                  { label: "Add property",      href: "/property-manager/portfolio/properties/new", icon: Building2,  iconBg: "bg-[var(--brand-soft)]",    iconColor: "text-[var(--brand)]" },
                  { label: "Add unit",           href: "/property-manager/portfolio/units/new",      icon: Home,       iconBg: "bg-violet-50",  iconColor: "text-violet-600" },
                  { label: "Create tenancy",     href: "/property-manager/portfolio/tenancies/new",  icon: Users,      iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
                  { label: "Open work queue",    href: "/property-manager/work",                     icon: Wrench,     iconBg: "bg-slate-100",  iconColor: "text-slate-500" },
                  { label: "Run rent review",    href: "/property-manager/portfolio/tenancies?mode=rent-review", icon: TrendingUp, iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
                  { label: "Create planning set",href: "/property-manager/planning",                 icon: BarChart2,  iconBg: "bg-violet-50",  iconColor: "text-violet-600" },
                ]).map((a, i) => {
                  const Icon = a.icon
                  return (
                    <Link key={i} href={a.href}>
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group cursor-pointer w-full">
                        <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0", a.iconBg)}>
                          <Icon className={cn("w-3.5 h-3.5", a.iconColor)} />
                        </div>
                        <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900 transition-colors flex-1 text-left">{a.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* AI Review — pre-flight confirm → execute → inline result (no copilot bubble) */}
            {aiReviewPhase === "result" ? (
              /* Inline result panel */
              <div className="bg-white rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-100 bg-violet-50">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="text-[13px] font-bold text-violet-900">AI Portfolio Review</span>
                  <button onClick={() => { setAiReviewPhase("idle"); setAiReviewResult("") }}
                    className="ml-auto text-[11px] font-medium text-violet-500 hover:text-violet-700 transition-colors">
                    Clear
                  </button>
                </div>
                <div className="p-4 text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {aiReviewResult}
                </div>
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span className="text-[10.5px] text-slate-400">AI review · Propvora AI Copilot · Guidance only</span>
                </div>
              </div>
            ) : (
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
                  {aiReviewPhase === "error" && (
                    <p className="text-[11.5px] text-red-300 mb-2 bg-white/10 rounded-lg px-3 py-2">{aiReviewError}</p>
                  )}
                  <p className="text-[12px] text-violet-200 mb-3 leading-relaxed">Get an intelligent summary of your portfolio performance, risks, and opportunities.</p>
                  <div className="flex flex-col gap-1.5 mb-4">
                    {[{ icon: TrendingUp, label: "Performance insights" }, { icon: AlertTriangle, label: "Risk detection" }, { icon: Sparkles, label: "Actionable recommendations" }].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2 text-[11px] text-violet-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />{label}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={openAiReviewConfirm}
                    disabled={properties.length === 0 || aiReviewPhase === "loading"}
                    title={properties.length === 0 ? "Add a property to run a review" : "Review cost estimate, then run AI portfolio review"}
                    className="w-full py-2.5 rounded-xl bg-white/90 hover:bg-white text-[13px] font-bold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ color: "#5B21B6" }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiReviewPhase === "loading" ? "Running review…" : "Run AI review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      ) : null}

      {/* AI Review pre-flight confirmation modal */}
      {aiReviewPhase === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAiReviewPhase("idle")}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #6D28D9, #7C3AED)" }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Run AI Portfolio Review?</h3>
                <p className="text-[12.5px] text-slate-500 mt-0.5">Analyses your portfolio and surfaces insights, risks, and quick wins.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2.5">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-600 font-medium">What it will do</span>
                <span className="text-slate-800 font-semibold">Portfolio performance review</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-600 font-medium">Estimated cost</span>
                <span className="text-[#7C3AED] font-bold">1 AI action</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-slate-600 font-medium">Result</span>
                <span className="text-slate-800 font-semibold">Shown inline on this page</span>
              </div>
            </div>

            <p className="text-[11.5px] text-slate-400 mb-4 leading-relaxed">
              AI guidance is advisory only. Verify any legal, financial or compliance points with a qualified professional.
            </p>

            <div className="flex gap-2">
              <button onClick={() => setAiReviewPhase("idle")}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={executeAiReview}
                className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #6D28D9, #7C3AED)" }}>
                <Sparkles className="w-3.5 h-3.5" />
                Run AI review
              </button>
            </div>
          </div>
        </div>
      )}

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
