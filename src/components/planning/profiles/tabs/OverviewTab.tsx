"use client"

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin, CheckCircle, XCircle, ChevronRight,
  Play, BarChart2, Zap, Download, X
} from 'lucide-react'
import type { ProfileConfig } from '@/lib/planning/profile-config'
import { ProfileKpiCard } from '@/components/planning/profiles'

interface Props {
  profile: ProfileConfig
}

export default function OverviewTab({ profile }: Props) {
  const [compareOpen, setCompareOpen] = useState(false)
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleQuickAction(action: string, slug: string) {
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

      {/* Quick Scenario Modal */}
      {scenarioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Quick Scenario</h3>
              <button onClick={() => setScenarioOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600">Quick Scenario coming soon. Start a full Planning Set to model detailed scenarios.</p>
            <button
              onClick={() => setScenarioOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
            >
              Close
            </button>
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
                onClick={() => handleQuickAction(qa.action, profile.slug)}
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
