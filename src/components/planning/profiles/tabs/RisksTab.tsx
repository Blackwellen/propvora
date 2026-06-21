"use client"

import { AlertTriangle, Shield, TrendingDown, DollarSign } from 'lucide-react'
import type { ProfileConfig, LikelihoodType, ImpactType } from '@/lib/planning/profile-config'

interface Props {
  profile: ProfileConfig
}

function scoreColor(score: number): string {
  if (score >= 16) return 'bg-red-100 text-red-700'
  if (score >= 9) return 'bg-orange-100 text-orange-700'
  if (score >= 5) return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

function scoreBg(score: number): string {
  if (score >= 16) return '#FEE2E2'
  if (score >= 9) return '#FFEDD5'
  if (score >= 5) return '#FEF3C7'
  return '#D1FAE5'
}

function scoreText(score: number): string {
  if (score >= 16) return '#DC2626'
  if (score >= 9) return '#EA580C'
  if (score >= 5) return '#D97706'
  return '#059669'
}

function scoreLabel(score: number): string {
  if (score >= 16) return 'Critical'
  if (score >= 9) return 'High'
  if (score >= 5) return 'Medium'
  return 'Low'
}

const ratingBadge: Record<string, string> = {
  Low: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
}

const ratingBg: Record<string, string> = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#F97316',
  Critical: '#EF4444',
}

const exposureBadge: Record<string, string> = {
  Low: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
}

// 5x5 grid axis labels
const likelihoodLevels: LikelihoodType[] = ['Low', 'Possible', 'Likely', 'High']
const impactLevels: ImpactType[] = ['Low', 'Medium', 'High', 'Severe']

function heatmapCellColor(l: number, i: number): string {
  const score = (l + 1) * (i + 1)
  if (score >= 12) return '#FCA5A5'
  if (score >= 6) return '#FDE68A'
  if (score >= 3) return '#BBF7D0'
  return '#E2E8F0'
}

export default function RisksTab({ profile }: Props) {
  const { risks } = profile

  const highPriorityCount = risks.register.filter((r) => r.score >= 9).length

  // Build heatmap counts
  const heatmapCounts: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0))
  risks.register.forEach((r) => {
    const li = likelihoodLevels.indexOf(r.likelihood)
    const im = impactLevels.indexOf(r.impact)
    if (li >= 0 && im >= 0) heatmapCounts[li][im]++
  })

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Rating */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${ratingBg[risks.overallRating]}22` }}
          >
            <Shield className="w-5 h-5" style={{ color: ratingBg[risks.overallRating] }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overall Rating</p>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${ratingBadge[risks.overallRating]}`}>
              {risks.overallRating}
            </span>
          </div>
        </div>

        {/* Total Risks */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Risks</p>
            <p className="text-2xl font-bold text-slate-900">{risks.register.length}</p>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
          </div>
        </div>

        {/* Total Exposure */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Exposure</p>
            <p className="text-sm font-bold text-slate-900">{risks.totalExposureEstimate}</p>
          </div>
        </div>
      </div>

      {/* 2. Overall Risk Rating Badge */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Overall Risk Rating</h2>
        <div className="flex items-center gap-4">
          <span
            className="px-5 py-2.5 rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: ratingBg[risks.overallRating] ?? 'var(--color-ai-500, #6366F1)' }}
          >
            {risks.overallRating} Risk
          </span>
          <p className="text-sm text-slate-500">
            Based on {risks.register.length} identified risks across this investment model.
            Exposure range: <span className="font-semibold text-slate-700">{risks.totalExposureEstimate}</span>
          </p>
        </div>
      </div>

      {/* 3. Risk Register */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Risk Register</h2>
        <div className="rounded-xl overflow-hidden border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Likelihood</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Impact</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Mitigation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</th>
              </tr>
            </thead>
            <tbody>
              {risks.register.map((risk, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{risk.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{risk.category}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{risk.likelihood}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{risk.impact}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: scoreBg(risk.score), color: scoreText(risk.score) }}
                    >
                      {risk.score}
                      <span className="font-normal opacity-80">{scoreLabel(risk.score)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[220px] leading-relaxed">{risk.mitigation}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{risk.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Top Risks by Exposure */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Risks by Exposure</h2>
        <ul className="space-y-3">
          {risks.topByExposure.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: ratingBg[item.level] ?? 'var(--color-ai-500, #6366F1)' }}
                >
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs font-mono text-slate-500">{item.exposure}</p>
                </div>
              </div>
              <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${exposureBadge[item.level] ?? 'bg-slate-100 text-slate-500'}`}>
                {item.level}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Mitigation Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Mitigation Actions</h2>
        <ol className="space-y-3">
          {risks.mitigationActions.map((action, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: profile.accentColor }}
              >
                {idx + 1}
              </span>
              <span className="text-sm text-slate-700 leading-relaxed">{action}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 6. Risk Heatmap */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Risk Heatmap (Likelihood × Impact)</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Impact axis header */}
            <div className="flex mb-1 ml-24">
              {impactLevels.map((imp) => (
                <div key={imp} className="flex-1 text-center text-xs font-semibold text-slate-500">
                  {imp}
                </div>
              ))}
            </div>
            {/* Rows: likelihood */}
            {likelihoodLevels.map((lik, li) => (
              <div key={lik} className="flex items-center mb-1">
                <div className="w-24 text-xs font-semibold text-slate-500 text-right pr-3 shrink-0">{lik}</div>
                {impactLevels.map((_, im) => {
                  const count = heatmapCounts[li][im]
                  const color = heatmapCellColor(li, im)
                  return (
                    <div
                      key={im}
                      className="flex-1 aspect-square flex items-center justify-center rounded mx-0.5 text-xs font-bold text-slate-700"
                      style={{ backgroundColor: color, minHeight: '40px' }}
                      title={`Likelihood: ${lik}, Impact: ${impactLevels[im]}, Risks: ${count}`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  )
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: '#D1FAE5' }} />Low
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: '#BBF7D0' }} />Low-Med
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: '#FDE68A' }} />Medium
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: '#FCA5A5' }} />High/Critical
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
