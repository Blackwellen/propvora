"use client"

import React, { useRef, useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  ArrowRight,
  FolderOpen,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  GitBranch,
  Home,
  Building2,
  GraduationCap,
  Users,
  Hotel,
  Sun,
  ArrowLeftRight,
  Heart,
  Building,
  LayoutGrid,
  RefreshCw,
  Hammer,
  Construction,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { PlanningPageShell } from "@/components/planning/PlanningPageShell"
import { KpiCard, RiskPill, ProfileTag } from "@/components/planning/shared"
import { PLANNING_PROFILES } from "@/lib/planning/profiles"
import { PROFILE_SLUG_MAP } from "@/lib/planning/profile-config"
import { useWorkspace } from "@/providers/AuthProvider"
import { usePlanningSets } from "@/hooks/usePlanningsets"
import { createClient } from "@/lib/supabase/client"
import type { PlanningLandlordOffer } from "@/types/database"

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, React.ElementType> = {
  Home, Building2, GraduationCap, Users, Hotel, Sun, ArrowLeftRight,
  Heart, Building, LayoutGrid, RefreshCw, Hammer, Construction,
}

function riskLevel(score: number): "Low" | "Medium" | "High" {
  if (score < 30) return "Low"
  if (score < 60) return "Medium"
  return "High"
}

function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function money(n: number): string {
  return `£${Math.round(n).toLocaleString()}`
}

function initials(s: string): string {
  return s.split(/[\s,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "—"
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function PlanningPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { workspace } = useWorkspace()
  const { data: sets = [], isLoading } = usePlanningSets(workspace?.id)

  const [offers, setOffers] = useState<PlanningLandlordOffer[]>([])
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!workspace?.id) return
    const supabase = createClient()
    ;(async () => {
      const { data, error } = await supabase
        .from("planning_landlord_offers")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(5)
      if (error) return // 42P01 / RLS — keep empty
      setOffers((data ?? []) as PlanningLandlordOffer[])
    })()
  }, [workspace?.id])

  function scrollProfiles(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" })
  }

  // ── Live KPIs ──────────────────────────────────────────────────
  const activeCount = sets.filter((s) => s.status === "active").length
  const netVals = sets.filter((s) => s.net_monthly_income > 0)
  const avgNet = netVals.length ? Math.round(netVals.reduce((a, s) => a + s.net_monthly_income, 0) / netVals.length) : 0
  const bestYieldSet = [...sets].sort((a, b) => b.net_yield - a.net_yield)[0]
  const atRiskCount = sets.filter((s) => s.risk_score >= 60).length
  const convertReady = sets.filter((s) => s.status === "active" && s.risk_score < 40 && s.net_monthly_income > 0).length
  const openOffers = offers.filter((o) => o.status === "sent" || o.status === "negotiating").length

  const recentSets = useMemo(
    () => [...sets].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5),
    [sets]
  )

  // Forecast snapshot: 12 even months of aggregated net (live derived; flat projection)
  const totalNetMonthly = sets.reduce((a, s) => a + Math.max(s.net_monthly_income, 0), 0)
  const annualNet = totalNetMonthly * 12
  const forecastData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.map((m) => ({ month: m, net: totalNetMonthly }))
  }, [totalNetMonthly])

  const hasSets = sets.length > 0

  return (
    <PlanningPageShell
      title="Planning Engine"
      subtitle="Model deals, analyse opportunities, and build landlord offers across your portfolio."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/property-manager/planning/wizard"
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Planning Set
          </Link>
        </div>
      }
    >
      {/* ── KPI Strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Planning Sets" value={isLoading ? "—" : String(sets.length)} icon={FolderOpen} iconColour="#7C3AED" />
        <KpiCard label="Active Sets" value={isLoading ? "—" : String(activeCount)} icon={Zap} iconColour="#2563EB" />
        <KpiCard label="Avg Net / Month" value={isLoading ? "—" : avgNet > 0 ? money(avgNet) : "—"} subtitle="across sets" icon={TrendingUp} iconColour="#10B981" />
        <KpiCard label="Best Net Yield" value={isLoading ? "—" : bestYieldSet && bestYieldSet.net_yield > 0 ? `${bestYieldSet.net_yield.toFixed(1)}%` : "—"} subtitle={bestYieldSet?.title ? bestYieldSet.title.slice(0, 22) : undefined} icon={BarChart2} iconColour="#2563EB" />
        <KpiCard label="Risk Alerts" value={isLoading ? "—" : String(atRiskCount)} icon={AlertTriangle} iconColour="#F59E0B" />
        <KpiCard label="Open Offers" value={String(openOffers)} subtitle="sent or negotiating" icon={Clock} iconColour="#EF4444" />
      </div>

      {/* ── Operation Profiles Carousel (reference content) ───────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-slate-900">Operation Profiles</h2>
          <div className="flex items-center gap-3">
            <Link href="/property-manager/planning/profiles" className="text-[12.5px] font-semibold text-[#7C3AED] hover:text-violet-700 transition-colors">
              View all profiles →
            </Link>
            <button onClick={() => scrollProfiles("left")} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors">
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
            <button onClick={() => scrollProfiles("right")} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {PLANNING_PROFILES.slice(0, 8).map((profile) => {
            const ProfileIcon = ICON_MAP[profile.icon] ?? Building2
            return (
              <div key={profile.key} className="min-w-[220px] bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all shrink-0">
                <div style={{ background: profile.colour + "18" }} className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3">
                  <div style={{ color: profile.colour }}><ProfileIcon className="w-6 h-6" /></div>
                </div>
                <p className="text-[14px] font-bold text-slate-900 mb-1">{profile.label}</p>
                <p className="text-[11.5px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">{profile.description}</p>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: profile.colour + "18", color: profile.colour }}>
                    {profile.yieldRange}
                  </span>
                  <RiskPill level={profile.riskLevel} size="sm" />
                </div>
                <div className="flex gap-2">
                  <Link href={`/property-manager/planning/wizard?profile=${profile.key}`} className="flex-1 h-8 rounded-xl text-white text-[12px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center" style={{ background: profile.colour }}>
                    Start Plan
                  </Link>
                  <Link href={`/property-manager/planning/profiles/${PROFILE_SLUG_MAP[profile.key] ?? profile.key}/overview`} className="flex-1 h-8 rounded-xl border border-slate-200 text-slate-700 text-[12px] font-medium hover:bg-slate-50 transition-colors flex items-center justify-center">
                    Details
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Two-column main layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Active Planning Sets */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Recent Planning Sets</h3>
              <Link href="/property-manager/planning/sets" className="text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand)] flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentSets.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-[13px] font-semibold text-slate-600">No planning sets yet</p>
                <p className="text-[12px] text-slate-400 mt-1">Create your first set to start modelling deals.</p>
                <Link href="/property-manager/planning/wizard" className="inline-flex items-center gap-1.5 mt-3 h-8 px-4 rounded-xl bg-[#7C3AED] text-white text-[12.5px] font-semibold hover:bg-violet-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> New Planning Set
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Plan</th>
                    <th className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Net/mo</th>
                    <th className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Risk</th>
                    <th className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-3">Yield</th>
                    <th className="text-right text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSets.map((set) => (
                    <tr
                      key={set.id}
                      onClick={() => router.push(`/property-manager/planning/sets/${set.id}/overview`)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <ProfileTag profileKey={set.operation_profile} size="sm" />
                          <span className="text-[13px] font-semibold text-slate-800">{set.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-[13px] font-bold text-slate-900">{set.net_monthly_income > 0 ? money(set.net_monthly_income) : "—"}</td>
                      <td className="px-3 py-3.5"><RiskPill level={riskLevel(set.risk_score)} size="sm" /></td>
                      <td className="px-3 py-3.5 text-[12px] text-slate-600">{set.net_yield > 0 ? `${set.net_yield.toFixed(1)}%` : "—"}</td>
                      <td className="px-5 py-3.5 text-right text-[12px] text-slate-400">{timeAgo(set.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Landlord Offers Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Landlord Offers Queue</h3>
              <Link href="/property-manager/planning/landlord-offers" className="text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand)] flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {offers.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[13px] font-semibold text-slate-600">No landlord offers yet</p>
                <p className="text-[12px] text-slate-400 mt-1">Build an offer from a planning set to start negotiating.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {offers.map((offer) => (
                  <Link
                    key={offer.id}
                    href={`/property-manager/planning/landlord-offers/${offer.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <div style={{ background: "var(--accent-soft)", color: "var(--accent)" }} className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0">
                      {initials(offer.property_address)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{offer.property_address}</p>
                      <p className="text-[11.5px] text-slate-400 capitalize">{offer.status.replace(/_/g, " ")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold text-slate-900">{money(offer.proposed_rent)}/mo</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Planning Intelligence (live derived) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 h-fit sticky top-4">
          <h3 className="text-[14px] font-bold text-slate-900 mb-4">Planning Intelligence</h3>
          {([
            { icon: AlertTriangle, colour: "#EF4444", label: "Risk Review Needed", value: `${atRiskCount} set${atRiskCount !== 1 ? "s" : ""} at risk`, action: "Review", href: "/property-manager/planning/sets" },
            { icon: CheckCircle2, colour: "#10B981", label: "Conversion Ready", value: `${convertReady} candidate${convertReady !== 1 ? "s" : ""}`, action: "View", href: "/property-manager/planning/conversions" },
            { icon: Clock, colour: "#F59E0B", label: "Open Offers", value: `${openOffers} sent or negotiating`, action: "View", href: "/property-manager/planning/landlord-offers" },
            { icon: BarChart2, colour: "#7C3AED", label: "Best Net Yield", value: bestYieldSet && bestYieldSet.net_yield > 0 ? `${bestYieldSet.net_yield.toFixed(1)}% — ${bestYieldSet.title}` : "No yield data yet", action: "Open", href: bestYieldSet ? `/property-manager/planning/sets/${bestYieldSet.id}/overview` : "/property-manager/planning/sets" },
            { icon: TrendingUp, colour: "#2563EB", label: "Yield Intelligence", value: "Compare yields across sets", action: "Open", href: "/property-manager/planning/yield-intelligence" },
          ] as { icon: React.ElementType; colour: string; label: string; value: string; action: string; href: string }[]).map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group mb-1">
              <div style={{ background: item.colour + "18" }} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                <div style={{ color: item.colour }}><item.icon className="w-4 h-4" /></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-slate-800">{item.label}</p>
                <p className="text-[11.5px] text-slate-400 truncate">{item.value}</p>
              </div>
              <span className="text-[11.5px] font-semibold text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">{item.action} →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Forecast Snapshot ─────────────────────────────────────── */}
      {hasSets && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Annualised Net (current sets)</p>
              <p className="text-[22px] font-bold text-slate-900">{money(annualNet)}</p>
              <p className="text-[12px] text-slate-400">{money(totalNetMonthly)}/mo combined across {sets.length} set{sets.length !== 1 ? "s" : ""}</p>
            </div>
            <Link href="/property-manager/planning/portfolio-intelligence" className="text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand)] transition-colors">
              Portfolio intelligence →
            </Link>
          </div>
          <div className="h-[160px] min-w-0">
            {mounted && <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={forecastData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`£${Number(v).toLocaleString()}`, "Net"]} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Area type="monotone" dataKey="net" stroke="#7C3AED" strokeWidth={2} fill="url(#netGrad)" dot={false} name="Net" />
              </AreaChart>
            </ResponsiveContainer>}
          </div>
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Quick Actions</p>
        <p className="text-[12.5px] text-slate-400 mb-4">Get started or move faster.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { icon: Plus, colour: "#7C3AED", label: "Start a New Plan", sub: "Create a planning set", href: "/property-manager/planning/wizard" },
            { icon: BarChart2, colour: "#2563EB", label: "Compare Profiles", sub: "Find the best strategy", href: "/property-manager/planning/profiles" },
            { icon: GitBranch, colour: "#F59E0B", label: "Yield Intelligence", sub: "Analyse yields", href: "/property-manager/planning/yield-intelligence" },
            { icon: Zap, colour: "#10B981", label: "Conversions", sub: "Convert sets to properties", href: "/property-manager/planning/conversions" },
          ] as { icon: React.ElementType; colour: string; label: string; sub: string; href: string }[]).map((qa) => (
            <Link key={qa.label} href={qa.href} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group">
              <div style={{ background: qa.colour + "18" }} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <div style={{ color: qa.colour }}><qa.icon className="w-4 h-4" /></div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-800 group-hover:text-slate-900">{qa.label}</p>
                <p className="text-[11.5px] text-slate-400 mt-0.5">{qa.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PlanningPageShell>
  )
}
