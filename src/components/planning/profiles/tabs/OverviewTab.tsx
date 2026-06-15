"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  MapPin, CheckCircle, XCircle, ChevronRight,
  Play, BarChart2, Zap, Download, X, RotateCcw, TrendingUp, TrendingDown,
} from 'lucide-react'
import type { ProfileConfig } from '@/lib/planning/profile-config'
import { ProfileKpiCard } from '@/components/planning/profiles'

interface Props {
  profile: ProfileConfig
}

/* ── Quick Scenario helpers ───────────────────────────────────────────────── */

/** Parse the first numeric value out of a snapshot string like "-90 GBP" or "5.2%". */
function parseNum(value: string): number {
  const m = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : 0
}

/** Find a snapshot line whose label loosely matches any of the given keywords. */
function findLine(profile: ProfileConfig, keywords: string[]): number | null {
  const line = profile.modelSnapshot.lines.find((l) =>
    keywords.some((k) => l.label.toLowerCase().includes(k))
  )
  return line ? parseNum(line.value) : null
}

interface ScenarioBase {
  grossRent: number   // monthly gross rent (positive)
  costs: number       // total monthly costs excluding voids (positive)
  netMonthly: number  // base net monthly cashflow
  grossYield: number | null
}

function deriveBase(profile: ProfileConfig): ScenarioBase {
  const grossRent = findLine(profile, ['monthly rent', 'gross monthly', 'gross rent', 'adr', 'nightly']) ?? 0
  const net = findLine(profile, ['net monthly', 'net cashflow', 'monthly cashflow', 'net profit']) ?? 0
  const grossYield = findLine(profile, ['gross yield'])
  // Costs = everything between gross rent and net (deductions are stored negative).
  const deductions = profile.modelSnapshot.lines
    .filter((l) => /less|fee|cost|reserve|void|maintenance|finance|mortgage|cleaning|management/i.test(l.label))
    .reduce((sum, l) => sum + Math.abs(parseNum(l.value)), 0)
  const costs = deductions > 0 ? deductions : Math.max(grossRent - net, 0)
  return { grossRent, costs, netMonthly: net, grossYield }
}

function fmtGBP(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(Math.round(n))
}

function Slider({
  label, value, min, max, step, suffix, onChange, accent,
}: {
  label: string; value: number; min: number; max: number; step: number
  suffix: string; onChange: (v: number) => void; accent: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span
          className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg"
          style={{ color: accent, backgroundColor: `${accent}14` }}
        >
          {value > 0 && suffix === '%' ? '+' : ''}{value}{suffix}
        </span>
      </div>
      {/* Filled track behind a native range input (thumb uses accentColor) */}
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-slate-200" />
        <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${pct}%`, backgroundColor: accent }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-2 appearance-none cursor-pointer bg-transparent"
          style={{ accentColor: accent }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-slate-400 tabular-nums">{min}{suffix}</span>
        <span className="text-[10px] text-slate-400 tabular-nums">{max > 0 ? '+' : ''}{max}{suffix}</span>
      </div>
    </div>
  )
}

export default function OverviewTab({ profile }: Props) {
  const [compareOpen, setCompareOpen] = useState(false)
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // ── Quick Scenario state — nudges to the profile's real model figures ──
  const base = useMemo(() => deriveBase(profile), [profile])
  const [occDelta, setOccDelta] = useState(0)   // occupancy delta in % points (0 = full base occupancy)
  const [rentDelta, setRentDelta] = useState(0) // rent delta in %
  const [costDelta, setCostDelta] = useState(0) // cost delta in %

  // Live recompute from the set's real figures — no fabricated numbers.
  const scenario = useMemo(() => {
    const occupancy = Math.max(0, Math.min(100, 100 + occDelta)) / 100
    const grossRent = base.grossRent * (1 + rentDelta / 100) * occupancy
    const costs = base.costs * (1 + costDelta / 100)
    const net = grossRent - costs
    const baseNet = base.netMonthly
    const netDelta = net - baseNet
    // Net yield scales with net income vs the base net (only meaningful when we have a base yield).
    const netYield =
      base.grossYield != null && base.grossRent > 0
        ? base.grossYield * (net / (base.grossRent - base.costs || 1))
        : null
    return { grossRent, costs, net, baseNet, netDelta, netYield, occupancy: occupancy * 100 }
  }, [base, occDelta, rentDelta, costDelta])

  function resetScenario() {
    setOccDelta(0); setRentDelta(0); setCostDelta(0)
  }

  const hasModel = base.grossRent > 0 || base.netMonthly !== 0

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleQuickAction(action: string) {
    if (action === 'compare') setCompareOpen(true)
    else if (action === 'quick-scenario') setScenarioOpen(true)
    else if (action === 'download') showToast('Generating PDF...')
  }

  const riskLevelColor: Record<string, string> = {
    Low: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      {/* Compare Modal */}
      {compareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Compare Profiles</h3>
              <button onClick={() => setCompareOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6">Profile comparison is available when you start a Planning Set. You can compare up to 3 profiles side-by-side.</p>
            <Link
              href={`/app/planning/wizard?profile=${profile.slug}`}
              className="block w-full text-center py-2.5 px-4 rounded-xl text-white text-sm font-medium"
              style={{ backgroundColor: profile.accentColor }}
              onClick={() => setCompareOpen(false)}
            >
              Start Planning Set
            </Link>
          </div>
        </div>
      )}

      {/* Quick Scenario Modal — live recompute from the profile's real model figures */}
      {scenarioOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setScenarioOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Quick Scenario</h3>
                <p className="text-xs text-slate-500 mt-0.5">Nudge key assumptions and see net cashflow recompute live.</p>
              </div>
              <button onClick={() => setScenarioOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {hasModel ? (
              <div className="p-5 sm:p-6 space-y-6">
                {/* Before / After metric cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Base · Net Monthly</p>
                    <p className="text-xl font-bold tabular-nums mt-1 text-slate-700">{fmtGBP(scenario.baseNet)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Current model</p>
                  </div>
                  <div
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: `${profile.accentColor}0D`, border: `1px solid ${profile.accentColor}33` }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Scenario · Net Monthly</p>
                    <p className="text-xl font-bold tabular-nums mt-1" style={{ color: profile.accentColor }}>{fmtGBP(scenario.net)}</p>
                    <p className={`text-[11px] font-semibold mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${scenario.netDelta >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                      {scenario.netDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {scenario.netDelta >= 0 ? '+' : ''}{fmtGBP(scenario.netDelta)}
                    </p>
                  </div>
                </div>

                {/* Result panel — yield + adjusted figures */}
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: `${profile.accentColor}0D`, border: `1px solid ${profile.accentColor}22` }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Net Yield</p>
                      <p className="text-2xl font-bold tabular-nums mt-1 text-slate-900">
                        {scenario.netYield != null ? `${scenario.netYield.toFixed(1)}%` : '—'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{Math.round(scenario.occupancy)}% occupancy</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Annualised Net</p>
                      <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: profile.accentColor }}>
                        {fmtGBP(scenario.net * 12)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Net × 12</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-3 text-sm" style={{ borderColor: `${profile.accentColor}22` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Adj. Gross Income</span>
                      <span className="font-semibold text-slate-700 tabular-nums">{fmtGBP(scenario.grossRent)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Adj. Costs</span>
                      <span className="font-semibold text-slate-700 tabular-nums">{fmtGBP(scenario.costs)}</span>
                    </div>
                  </div>
                </div>

                {/* Assumption sliders */}
                <div className="space-y-5">
                  <Slider label="Occupancy" value={occDelta} min={-50} max={0} step={1} suffix="%" onChange={setOccDelta} accent={profile.accentColor} />
                  <Slider label="Rent" value={rentDelta} min={-20} max={20} step={1} suffix="%" onChange={setRentDelta} accent={profile.accentColor} />
                  <Slider label="Operating Costs" value={costDelta} min={-30} max={30} step={1} suffix="%" onChange={setCostDelta} accent={profile.accentColor} />
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Indicative only — based on the example model figures for this profile. Start a full Planning Set to model against a real property with full assumptions.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetScenario}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                  <Link
                    href={`/app/planning/wizard?profile=${profile.slug}`}
                    onClick={() => setScenarioOpen(false)}
                    className="flex-1 text-center py-2.5 px-4 rounded-xl text-white text-sm font-semibold"
                    style={{ backgroundColor: profile.accentColor }}
                  >
                    Build a full Planning Set
                  </Link>
                </div>
              </div>
            ) : (
              /* No parseable model figures — deep-link to the wizard instead of faking numbers. */
              <div className="p-6 space-y-5 text-center">
                <p className="text-sm text-slate-600">
                  This profile doesn&apos;t have example figures to model against yet. Start a full Planning Set to build a detailed scenario from your own numbers.
                </p>
                <Link
                  href={`/app/planning/wizard?profile=${profile.slug}`}
                  onClick={() => setScenarioOpen(false)}
                  className="block w-full text-center py-2.5 px-4 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: profile.accentColor }}
                >
                  Start Planning Set
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {profile.overviewKpis.map((kpi) => (
          <ProfileKpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            sublabel={kpi.sublabel}
            trend={kpi.trend}
            highlight={kpi.highlight}
            accentColor={profile.accentColor}
          />
        ))}
      </div>

      {/* 2. Profile Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: About */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">About This Model</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{profile.description}</p>
            <div className="flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {/* Right: Model Snapshot */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">{profile.modelSnapshot.label}</h2>
            <div className="rounded-xl overflow-hidden border border-slate-100">
              <table className="w-full text-sm">
                <tbody>
                  {profile.modelSnapshot.lines.map((line, idx) => (
                    <tr
                      key={idx}
                      className={
                        line.highlight
                          ? 'font-semibold bg-slate-50'
                          : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }
                    >
                      <td className="px-4 py-2.5 text-slate-600">{line.label}</td>
                      <td
                        className="px-4 py-2.5 text-right font-mono font-medium"
                        style={line.highlight ? { color: profile.accentColor } : undefined}
                      >
                        {line.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Who This Model Suits */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Who This Model Suits</h2>
        <div className="flex flex-wrap gap-2">
          {profile.whoItSuits.map((persona) => (
            <span
              key={persona}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 text-slate-700 bg-slate-50"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              {persona}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Ideal Assets */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Ideal Assets</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {profile.idealAssets.map((asset) => (
            <div
              key={asset.label}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 border border-slate-100"
            >
              <span className="text-2xl mb-2">{asset.icon}</span>
              <span className="text-sm font-semibold text-slate-800">{asset.label}</span>
              {asset.sub && <span className="text-xs text-slate-400 mt-0.5">{asset.sub}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Advantages & Constraints */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Advantages &amp; Constraints</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">Advantages</p>
            <ul className="space-y-2">
              {profile.advantages.map((adv) => (
                <li key={adv} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-700">{adv}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-3">Constraints</p>
            <ul className="space-y-2">
              {profile.constraints.map((con) => (
                <li key={con} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-700">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 6. Best Markets */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Best Markets</h2>
        <ul className="space-y-2">
          {profile.bestMarket.map((market) => (
            <li key={market} className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: profile.accentColor }} />
              <span className="text-sm text-slate-700">{market}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 7. Typical Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Typical Timeline</h2>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100 hidden sm:block" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {profile.timeline.map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-3 relative z-10"
                  style={{ backgroundColor: profile.accentColor }}
                >
                  {idx + 1}
                </div>
                <p className="text-sm font-semibold text-slate-800">{step.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{step.sub}</p>
                <span
                  className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${profile.accentColor}18`, color: profile.accentColor }}
                >
                  {step.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 8. Risk Posture */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Risk Posture</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {profile.riskPosture.map((risk) => (
            <div key={risk.label} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <span className="text-sm font-medium text-slate-700">{risk.label}</span>
              <span className={`ml-2 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${riskLevelColor[risk.level]}`}>
                {risk.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 9. Pros & Cons */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pros &amp; Cons</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">Pros</p>
            <ul className="space-y-2">
              {profile.pros.map((pro) => (
                <li key={pro} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-700">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">Cons</p>
            <ul className="space-y-2">
              {profile.cons.map((con) => (
                <li key={con} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-700">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 10. Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {profile.quickActions.map((qa) => {
            if (qa.action === 'start-planning') {
              return (
                <Link
                  key={qa.action}
                  href={`/app/planning/wizard?profile=${profile.slug}`}
                  className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md"
                  style={{ borderColor: profile.accentColor, backgroundColor: `${profile.accentColor}08` }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: profile.accentColor }}
                  >
                    <Play className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{qa.label}</p>
                    <p className="text-xs text-slate-400">{qa.sub}</p>
                  </div>
                </Link>
              )
            }
            const IconMap: Record<string, React.ElementType> = {
              BarChart2: BarChart2,
              Zap: Zap,
              Download: Download,
              Play: Play,
            }
            const Icon = IconMap[qa.icon] ?? ChevronRight
            return (
              <button
                key={qa.action}
                onClick={() => handleQuickAction(qa.action)}
                className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{qa.label}</p>
                  <p className="text-xs text-slate-400">{qa.sub}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
