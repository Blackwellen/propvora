"use client"

import React, { useState, useMemo } from "react"
import {
  Plus,
  Search,
  Layers,
  TrendingUp,
  ShieldCheck,
  Star,
  FileText,
  BarChart2,
  LayoutGrid,
  List,
  SplitSquareHorizontal,
  Sparkles,
  Home,
  Building2,
  GraduationCap,
  Users,
  Hotel,
  Sun,
  ArrowLeftRight,
  Heart,
  Building,
  RefreshCw,
  Hammer,
  Briefcase,
  X,
  Download,
} from "lucide-react"
import Link from "next/link"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard, RiskPill } from "@/components/planning/shared"
import { PLANNING_PROFILES, type PlanningProfile } from "@/lib/planning/profiles"
import { PROFILE_SLUG_MAP } from "@/lib/planning/profile-config"
import { cn } from "@/lib/utils"

// ── Icon + number config per profile key ────────────────────────────────────
const PROFILE_CONFIGS: Record<string, { icon: React.ElementType; number: number }> = {
  long_term_let: { icon: Home, number: 1 },
  hmo: { icon: Building2, number: 2 },
  student_let: { icon: GraduationCap, number: 3 },
  co_living: { icon: Users, number: 4 },
  serviced_accommodation: { icon: Hotel, number: 5 },
  holiday_let: { icon: Sun, number: 6 },
  rent_to_rent: { icon: ArrowLeftRight, number: 7 },
  social_housing: { icon: Heart, number: 8 },
  build_to_rent: { icon: Building, number: 9 },
  commercial: { icon: Briefcase, number: 10 },
  mixed_use: { icon: LayoutGrid, number: 11 },
  refinancing: { icon: RefreshCw, number: 12 },
  dev_flip: { icon: Hammer, number: 13 },
}

// ── Profile Card ─────────────────────────────────────────────────────────────
function ProfileCard({
  profile,
  compareMode,
  compareSelected,
  onToggleCompare,
}: {
  profile: PlanningProfile
  compareMode: boolean
  compareSelected: string[]
  onToggleCompare: (key: string) => void
}) {
  const config = PROFILE_CONFIGS[profile.key]
  const Icon = config?.icon ?? Layers
  const num = config?.number ?? 0

  const mgmtColour =
    profile.managementIntensity === "High"
      ? "#EF4444"
      : profile.managementIntensity === "Medium"
      ? "#F59E0B"
      : "#10B981"
  const compColour =
    profile.complianceComplexity === "High"
      ? "#EF4444"
      : profile.complianceComplexity === "Medium"
      ? "#F59E0B"
      : "#10B981"

  const isSelected = compareSelected.includes(profile.key)

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border p-5 hover:shadow-md transition-all group relative",
        isSelected && compareMode
          ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/20"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      {/* Compare checkbox overlay */}
      {compareMode && (
        <button
          onClick={() => onToggleCompare(profile.key)}
          className={cn(
            "absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-all z-10",
            isSelected
              ? "bg-[#7C3AED] border-[#7C3AED]"
              : "border-slate-300 bg-white hover:border-[#7C3AED]"
          )}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      <div className="flex items-start gap-3 mb-3">
        {/* Icon badge */}
        <div
          style={{ background: profile.colour + "15", borderColor: profile.colour + "30" }}
          className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0"
        >
          <div style={{ color: profile.colour }}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ color: profile.colour }} className="text-[11px] font-bold">
              {num}.
            </span>
            <p className="text-[14px] font-bold text-slate-900">{profile.label}</p>
          </div>
          <p className="text-[11.5px] text-slate-500 line-clamp-2">{profile.description}</p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span style={{ color: profile.colour }} className="text-[11.5px] font-bold">
          {profile.yieldRange}
        </span>
        <RiskPill level={profile.riskLevel} size="sm" />
        <span
          style={{ background: mgmtColour + "15", color: mgmtColour }}
          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
        >
          {profile.managementIntensity} Mgmt
        </span>
        <span
          style={{ background: compColour + "15", color: compColour }}
          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
        >
          {profile.complianceComplexity} Compliance
        </span>
      </div>

      {/* Best for */}
      <p className="text-[11.5px] text-slate-400 mb-4">
        <span className="font-semibold text-slate-500">Best for:</span>{" "}
        {profile.bestFitPropertyTypes.join(", ")}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          style={{ background: profile.colour }}
          className="flex-1 h-8 rounded-xl text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Start Plan
        </button>
        <Link
          href={`/property-manager/planning/profiles/${PROFILE_SLUG_MAP[profile.key] ?? profile.key}/overview`}
          className="flex-1 h-8 rounded-xl border border-slate-200 text-slate-700 text-[12.5px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center"
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}

// ── Profile Compact Row ──────────────────────────────────────────────────────
function ProfileCompactRow({
  profile,
}: {
  profile: PlanningProfile
}) {
  const config = PROFILE_CONFIGS[profile.key]
  const Icon = config?.icon ?? Layers

  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 hover:shadow-sm transition-all">
      <div
        style={{ background: profile.colour + "15" }}
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      >
        <div style={{ color: profile.colour }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-slate-900">{profile.label}</p>
          <RiskPill level={profile.riskLevel} size="sm" />
        </div>
        <p className="text-[11.5px] text-slate-400 truncate">{profile.description}</p>
      </div>
      <div className="text-right shrink-0">
        <p style={{ color: profile.colour }} className="text-[12px] font-bold">
          {profile.yieldRange}
        </p>
        <p className="text-[11px] text-slate-400">{profile.managementIntensity} Mgmt</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          style={{ background: profile.colour }}
          className="h-7 px-3 rounded-lg text-white text-[11.5px] font-semibold hover:opacity-90 transition-opacity"
        >
          Start Plan
        </button>
        <Link
          href={`/property-manager/planning/profiles/${PROFILE_SLUG_MAP[profile.key] ?? profile.key}/overview`}
          className="h-7 px-3 rounded-lg border border-slate-200 text-slate-600 text-[11.5px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center"
        >
          Details
        </Link>
      </div>
    </div>
  )
}

// ── Profile Intelligence Panel ───────────────────────────────────────────────
function ProfileIntelligencePanel() {
  const items = [
    {
      icon: Star,
      colour: "#7C3AED",
      label: "Recommended for You",
      value: "5 profiles",
      sub: "Based on your recent activity",
    },
    {
      icon: TrendingUp,
      colour: "#10B981",
      label: "Trending This Month",
      value: "4 profiles",
      sub: "Most popular growth models",
    },
    {
      icon: BarChart2,
      colour: "#2563EB",
      label: "Best Yield Potential",
      value: "3 profiles",
      sub: "Highest gross yield range",
    },
    {
      icon: ShieldCheck,
      colour: "#F59E0B",
      label: "Lowest Risk Options",
      value: "3 profiles",
      sub: "Stable income, low volatility",
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-3">Profile Intelligence</h3>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0"
        >
          <div
            style={{ background: item.colour + "15" }}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          >
            <div style={{ color: item.colour }}>
              <item.icon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-slate-800">{item.label}</p>
            <p className="text-[11.5px] text-slate-400">{item.sub}</p>
          </div>
          <span className="text-[12px] font-bold text-slate-700 shrink-0">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Top Comparisons Panel ────────────────────────────────────────────────────
function TopComparisonsPanel() {
  const comparisons = [
    { a: "HMO", b: "Student-Let", count: 18 },
    { a: "Holiday Let", b: "Serviced Acc.", count: 15 },
    { a: "Long-Term Let", b: "Social Housing", count: 12 },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-3">Top Profile Comparisons</h3>
      {comparisons.map((comp) => (
        <button
          key={comp.a + comp.b}
          className="w-full flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors"
        >
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-700">
            <span>{comp.a}</span>
            <span className="text-slate-300">vs</span>
            <span>{comp.b}</span>
          </div>
          <span className="text-[11px] text-slate-400">Compared {comp.count}×</span>
        </button>
      ))}
    </div>
  )
}

// ── AI Suggestions Panel ─────────────────────────────────────────────────────
function AISuggestionsPanel() {
  const tips = [
    "HMO models show strongest yield potential in Manchester.",
    "Consider Social Housing for stable income and lower risk.",
    "Dev/Flip strategies are trending in Birmingham and Leeds.",
  ]

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/60 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl bg-[#7C3AED] flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-[14px] font-bold text-slate-900">AI Suggestions</h3>
        <span className="text-[10px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
          New
        </span>
      </div>
      <p className="text-[12px] text-slate-500 mb-3">Personalised insights for your portfolio</p>
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5 shrink-0" />
          <p className="text-[12px] text-slate-600">{tip}</p>
        </div>
      ))}
      <button className="mt-3 w-full h-9 rounded-xl border border-violet-200 text-[13px] font-semibold text-[#7C3AED] hover:bg-violet-50 transition-colors">
        Ask AI Copilot →
      </button>
    </div>
  )
}

// ── Preview Modal ────────────────────────────────────────────────────────────
function ProfilePreviewModal({
  profile,
  onClose,
}: {
  profile: PlanningProfile
  onClose: () => void
}) {
  const config = PROFILE_CONFIGS[profile.key]
  const Icon = config?.icon ?? Layers

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              style={{ background: profile.colour + "15" }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            >
              <div style={{ color: profile.colour }}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-slate-900">{profile.label}</h2>
              <p className="text-[12.5px] text-slate-500">{profile.incomeModel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-4">
          <p className="text-[13.5px] text-slate-600">{profile.description}</p>

          {/* Key metrics grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Yield Range", value: profile.yieldRange },
              { label: "Risk Level", value: profile.riskLevel },
              { label: "Mgmt Intensity", value: profile.managementIntensity },
            ].map((m) => (
              <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  {m.label}
                </p>
                <p className="text-[13px] font-bold text-slate-800">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Use case */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Use Case
            </p>
            <p className="text-[13px] text-slate-700">{profile.useCase}</p>
          </div>

          {/* Best for */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Best For
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.bestFitPropertyTypes.map((t) => (
                <span
                  key={t}
                  className="bg-slate-100 text-slate-700 text-[12px] font-medium px-2.5 py-1 rounded-lg"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Key metrics */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Key Metrics
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.keyMetrics.map((m) => (
                <span
                  key={m}
                  style={{
                    background: profile.colour + "15",
                    color: profile.colour,
                  }}
                  className="text-[11.5px] font-medium px-2.5 py-1 rounded-lg border border-current/20"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Compliance */}
          {profile.complianceRequirements.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Compliance Requirements
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.complianceRequirements.map((r) => (
                  <span
                    key={r}
                    className="bg-amber-50 text-amber-700 text-[11.5px] font-medium px-2.5 py-1 rounded-lg border border-amber-200/60"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex gap-3 p-6 border-t border-slate-100">
          <button
            style={{ background: profile.colour }}
            className="flex-1 h-10 rounded-xl text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity"
          >
            Start Plan with this Profile
          </button>
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-slate-200 text-slate-700 text-[13.5px] font-medium hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ProfilesPage() {
  const [search, setSearch] = useState("")
  const [activeGroup, setActiveGroup] = useState<string>("all")
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [mgmtFilter, setMgmtFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid")
  const [compareMode, setCompareMode] = useState(false)
  const [compareSelected, setCompareSelected] = useState<string[]>([])
  const [previewProfile, setPreviewProfile] = useState<PlanningProfile | null>(null)

  const filtered = useMemo(() => {
    return PLANNING_PROFILES.filter((p) => {
      const matchSearch =
        !search ||
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchGroup = activeGroup === "all" || p.group === activeGroup
      const matchRisk = riskFilter === "all" || p.riskLevel === riskFilter
      const matchMgmt = mgmtFilter === "all" || p.managementIntensity === mgmtFilter
      return matchSearch && matchGroup && matchRisk && matchMgmt
    })
  }, [search, activeGroup, riskFilter, mgmtFilter])

  function toggleCompare(key: string) {
    setCompareSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= 3) return prev
      return [...prev, key]
    })
  }

  const categoryGroups = [
    { key: "all", label: "All" },
    { key: "residential_rental", label: "Residential" },
    { key: "short_stay", label: "Short-Stay & Flexible" },
    { key: "lease_managed", label: "Lease-Based" },
    { key: "commercial_mixed", label: "Commercial" },
    { key: "capital_strategy", label: "Capital Strategies" },
  ]

  return (
    <PlanningPageShell
      title="Operation Profiles"
      subtitle="Choose the right strategy for each opportunity. 13 commercial property operation models."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setCompareMode((c) => !c)
              setCompareSelected([])
            }}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <SplitSquareHorizontal className="w-4 h-4" />
            Compare Profiles
          </button>
          <button className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Planning Set
          </button>
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Total Profiles"
          value="13"
          subtitle="Operation models"
          icon={Layers}
          iconColour="#7C3AED"
        />
        <KpiCard
          label="Avg Yield Range"
          value="4–30%"
          subtitle="Across all models"
          icon={TrendingUp}
          iconColour="#10B981"
        />
        <KpiCard
          label="Risk Distribution"
          value="L4 · M5 · H4"
          icon={ShieldCheck}
          iconColour="#F59E0B"
        />
        <KpiCard
          label="Most Used Profile"
          value="Buy-to-Let"
          subtitle="Used in 24% of plans"
          icon={Star}
          iconColour="#7C3AED"
        />
        <KpiCard
          label="Plans from Profiles"
          value="362"
          subtitle="This year ↑ 28%"
          trend={{ value: "28% growth", positive: true }}
          icon={FileText}
          iconColour="#2563EB"
        />
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search profiles..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"
          />
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {categoryGroups.map((g) => (
            <button
              key={g.key}
              onClick={() => setActiveGroup(g.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all",
                activeGroup === g.key
                  ? "bg-[#7C3AED] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Risk filter */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 focus:outline-none focus:border-[#7C3AED]"
        >
          <option value="all">All Risk</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        {/* Mgmt intensity filter */}
        <select
          value={mgmtFilter}
          onChange={(e) => setMgmtFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 focus:outline-none focus:border-[#7C3AED]"
        >
          <option value="all">All Management</option>
          <option value="Low">Low Mgmt</option>
          <option value="Medium">Med Mgmt</option>
          <option value="High">High Mgmt</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-white/50"
            )}
          >
            <LayoutGrid className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === "compact" ? "bg-white shadow-sm" : "hover:bg-white/50"
            )}
          >
            <List className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Compare mode toggle */}
        <button
          onClick={() => {
            setCompareMode((c) => !c)
            setCompareSelected([])
          }}
          className={cn(
            "h-10 px-4 rounded-xl text-[13px] font-medium transition-all border",
            compareMode
              ? "bg-[#7C3AED] text-white border-[#7C3AED]"
              : "border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          <SplitSquareHorizontal className="w-4 h-4 inline mr-1.5" />
          Compare
        </button>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main profile grid (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Profile count */}
          <p className="text-[12.5px] text-slate-500 mb-4">
            Showing {filtered.length} of {PLANNING_PROFILES.length} profiles
            {compareMode && compareSelected.length > 0 && (
              <span className="text-[#7C3AED] font-semibold">
                {" "}
                · {compareSelected.length} selected for comparison
              </span>
            )}
          </p>

          {/* Grid or compact view */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((profile) => (
                <ProfileCard
                  key={profile.key}
                  profile={profile}
                  compareMode={compareMode}
                  compareSelected={compareSelected}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((profile) => (
                <ProfileCompactRow
                  key={profile.key}
                  profile={profile}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-slate-700">
                No profiles match your filters
              </p>
              <p className="text-[13px] text-slate-400 mt-1">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => {
                  setSearch("")
                  setActiveGroup("all")
                  setRiskFilter("all")
                  setMgmtFilter("all")
                }}
                className="mt-4 text-[13px] font-semibold text-[#7C3AED] hover:text-violet-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Right intelligence panel (1/3 width) */}
        <div className="space-y-4">
          <ProfileIntelligencePanel />
          <TopComparisonsPanel />
          <AISuggestionsPanel />
        </div>
      </div>

      {/* Profile Preview Modal */}
      {previewProfile && (
        <ProfilePreviewModal profile={previewProfile} onClose={() => setPreviewProfile(null)} />
      )}

      {/* Compare Banner */}
      {compareMode && compareSelected.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-3 sm:gap-4 bg-[#7C3AED] text-white px-4 sm:px-6 py-3 rounded-2xl shadow-xl max-w-[calc(100vw-2rem)]">
          <span className="text-[13.5px] font-semibold">
            {compareSelected.length} profiles selected
          </span>
          <button className="h-8 px-4 rounded-xl bg-white text-[#7C3AED] text-[13px] font-bold hover:bg-slate-100 transition-colors">
            Compare Now
          </button>
          <button
            onClick={() => setCompareSelected([])}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </PlanningPageShell>
  )
}
