"use client"

import React, { useState, useMemo } from "react"
import {
  Search,
  LayoutGrid,
  List,
  Check,
  Home,
  Users,
  GraduationCap,
  Heart,
  Building2,
  Sun,
  ArrowLeftRight,
  HeartHandshake,
  Construction,
  Briefcase,
  LayoutGrid as LayoutGridIcon,
  RefreshCw,
  Hammer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import { PLANNING_PROFILES } from "@/lib/planning/profiles"
import type { PlanningProfile } from "@/lib/planning/profiles"

// ─── Profile icon map ────────────────────────────────────────────────────────

function ProfileIcon({
  profileKey,
  className,
}: {
  profileKey: string
  className?: string
}) {
  const icons: Record<string, React.ElementType> = {
    long_term_let: Home,
    hmo: Users,
    student_let: GraduationCap,
    co_living: Heart,
    serviced_accommodation: Building2,
    holiday_let: Sun,
    rent_to_rent: ArrowLeftRight,
    social_housing: HeartHandshake,
    build_to_rent: Construction,
    commercial: Briefcase,
    mixed_use: LayoutGridIcon,
    refinancing: RefreshCw,
    dev_flip: Hammer,
  }
  const Icon = icons[profileKey] ?? Building2
  return <Icon className={className} />
}

// ─── Profile quick tags ──────────────────────────────────────────────────────

function getProfileTags(key: string): string[] {
  const map: Record<string, string[]> = {
    long_term_let: ["Stable Cashflow", "Low Vacancy"],
    hmo: ["High Yield", "High Demand"],
    student_let: ["Term Security", "Seasonal"],
    co_living: ["High Demand", "Community"],
    serviced_accommodation: ["Short Stays", "High Yield"],
    holiday_let: ["Seasonal", "Location Driven"],
    rent_to_rent: ["Low Capex", "Scalable"],
    social_housing: ["Long Term", "Low Vacancy"],
    build_to_rent: ["Institutional", "Scale"],
    commercial: ["Long Leases", "Capital Intensive"],
    mixed_use: ["Diverse Income", "Resilience"],
    refinancing: ["Improve Cashflow", "De-risk"],
    dev_flip: ["High Returns", "Short Term"],
  }
  return map[key] ?? []
}

// ─── Single profile card ─────────────────────────────────────────────────────

function ProfileCard({
  profile,
  selected,
  onSelect,
}: {
  profile: PlanningProfile
  selected: boolean
  onSelect: () => void
}) {
  const riskClass =
    profile.riskLevel === "Low"
      ? "bg-emerald-50 text-emerald-700"
      : profile.riskLevel === "Medium"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700"

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md",
        selected
          ? "shadow-md"
          : "border-slate-200 hover:border-slate-300 bg-white"
      )}
      style={
        selected
          ? { borderColor: profile.colour, backgroundColor: profile.colour + "08" }
          : {}
      }
    >
      {/* Selected checkmark */}
      {selected && (
        <div
          className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: profile.colour }}
        >
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: profile.colour + "18" }}
      >
        <div style={{ color: profile.colour }}>
          <ProfileIcon profileKey={profile.key} className="w-6 h-6" />
        </div>
      </div>

      {/* Name + description */}
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">{profile.label}</h3>
      <p className="text-[12px] text-slate-500 leading-snug mb-3 flex-1">
        {profile.description}
      </p>

      {/* Risk / Intensity / Yield badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", riskClass)}>
          Risk: {profile.riskLevel}
        </span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          Intensity: {profile.managementIntensity}
        </span>
        <span
          className="text-[11px] font-bold"
          style={{ color: profile.colour }}
        >
          Yield: {profile.yieldRange}
        </span>
      </div>

      {/* Quick tags */}
      <div className="flex items-center gap-1 flex-wrap mb-4">
        {getProfileTags(profile.key).map((tag) => (
          <span
            key={tag}
            className="text-[10.5px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Action button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        className={cn(
          "w-full h-9 rounded-xl text-[13px] font-semibold transition-all border",
          selected
            ? "text-white border-transparent"
            : "border-slate-200 text-slate-700 hover:bg-slate-50"
        )}
        style={
          selected
            ? { backgroundColor: profile.colour, borderColor: profile.colour }
            : {}
        }
      >
        {selected ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Selected
          </span>
        ) : (
          "Select Profile"
        )}
      </button>
    </div>
  )
}

// ─── List row ────────────────────────────────────────────────────────────────

function ProfileListRow({
  profile,
  selected,
  onSelect,
}: {
  profile: PlanningProfile
  selected: boolean
  onSelect: () => void
}) {
  const riskClass =
    profile.riskLevel === "Low"
      ? "bg-emerald-50 text-emerald-700"
      : profile.riskLevel === "Medium"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700"

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-4 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-sm",
        selected
          ? "shadow-sm"
          : "border-slate-200 hover:border-slate-300 bg-white"
      )}
      style={
        selected
          ? { borderColor: profile.colour, backgroundColor: profile.colour + "08" }
          : {}
      }
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: profile.colour + "18" }}
      >
        <div style={{ color: profile.colour }}>
          <ProfileIcon profileKey={profile.key} className="w-5 h-5" />
        </div>
      </div>

      {/* Name + desc */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-900">{profile.label}</p>
        <p className="text-[12px] text-slate-500 truncate">{profile.description}</p>
      </div>

      {/* Badges */}
      <div className="hidden sm:flex items-center gap-2">
        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", riskClass)}>
          {profile.riskLevel}
        </span>
        <span
          className="text-[11px] font-bold"
          style={{ color: profile.colour }}
        >
          {profile.yieldRange}
        </span>
      </div>

      {/* Select button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        className={cn(
          "shrink-0 h-8 px-4 rounded-xl text-[12.5px] font-semibold transition-all border",
          selected
            ? "text-white border-transparent"
            : "border-slate-200 text-slate-700 hover:bg-slate-50"
        )}
        style={
          selected
            ? { backgroundColor: profile.colour, borderColor: profile.colour }
            : {}
        }
      >
        {selected ? (
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3" /> Selected
          </span>
        ) : (
          "Select"
        )}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Step01Profile() {
  const { state, update } = useWizard()
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [strategyFilter, setStrategyFilter] = useState("")
  const [riskFilter, setRiskFilter] = useState("")
  const [intensityFilter, setIntensityFilter] = useState("")

  const filtered = useMemo(() => {
    return PLANNING_PROFILES.filter((p) => {
      const matchSearch =
        !search ||
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchStrategy = !strategyFilter || p.groupLabel === strategyFilter
      const matchRisk = !riskFilter || p.riskLevel === riskFilter
      const matchIntensity =
        !intensityFilter || p.managementIntensity === intensityFilter
      return matchSearch && matchStrategy && matchRisk && matchIntensity
    })
  }, [search, strategyFilter, riskFilter, intensityFilter])

  const strategies = Array.from(new Set(PLANNING_PROFILES.map((p) => p.groupLabel)))

  function handleSelect(key: string) {
    update({ profileKey: key, completionPct: Math.max(state.completionPct, 10) })
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Top header */}
      <div className="px-8 py-6 border-b border-slate-100">
        <h1 className="text-[22px] font-bold text-slate-900 mb-1">
          Select an Operation Profile
        </h1>
        <p className="text-[13.5px] text-slate-500">
          Each profile is pre-configured with best-practice assumptions, compliance
          requirements and financial benchmarks.
        </p>
      </div>

      {/* Filters bar */}
      <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-3 bg-white sticky top-0 z-10 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search profiles by name or keyword..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]/50"
          />
        </div>

        {/* Strategy dropdown */}
        <select
          value={strategyFilter}
          onChange={(e) => setStrategyFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-600 focus:outline-none"
        >
          <option value="">All Strategies</option>
          {strategies.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Risk dropdown */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-600 focus:outline-none"
        >
          <option value="">All Risk Levels</option>
          {["Low", "Medium", "High"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Intensity dropdown */}
        <select
          value={intensityFilter}
          onChange={(e) => setIntensityFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-600 focus:outline-none"
        >
          <option value="">All Intensities</option>
          {["Low", "Medium", "High"].map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>

        {/* Yield placeholder — no distinct values on profile */}
        <select className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] text-slate-600 focus:outline-none">
          <option>All Yields</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-1 ml-auto bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center transition-all",
              viewMode === "grid"
                ? "bg-white shadow-sm text-slate-700"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center transition-all",
              viewMode === "list"
                ? "bg-white shadow-sm text-slate-700"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Profile grid / list */}
      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Search className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-[14px] font-medium">No profiles match your filters</p>
            <button
              onClick={() => {
                setSearch("")
                setStrategyFilter("")
                setRiskFilter("")
                setIntensityFilter("")
              }}
              className="mt-3 text-[13px] font-semibold text-[#7C3AED] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 p-8">
            {filtered.map((profile) => (
              <ProfileCard
                key={profile.key}
                profile={profile}
                selected={state.profileKey === profile.key}
                onSelect={() => handleSelect(profile.key)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-8">
            {filtered.map((profile) => (
              <ProfileListRow
                key={profile.key}
                profile={profile}
                selected={state.profileKey === profile.key}
                onSelect={() => handleSelect(profile.key)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected summary bar */}
      {state.profileKey && (
        <div className="px-8 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          {(() => {
            const p = PLANNING_PROFILES.find((x) => x.key === state.profileKey)
            if (!p) return null
            return (
              <>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: p.colour + "20" }}
                >
                  <div style={{ color: p.colour }}>
                    <ProfileIcon profileKey={p.key} className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-slate-800">
                  {p.label}
                </span>
                <span className="text-[12px] text-slate-400">selected</span>
                <div
                  className="w-2 h-2 rounded-full ml-1"
                  style={{ backgroundColor: p.colour }}
                />
                <span className="text-[12px] text-slate-500">{p.yieldRange}</span>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
