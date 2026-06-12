"use client"

import { AlertCircle } from 'lucide-react'
import type { ProfileConfig } from '@/lib/planning/profile-config'
import { ProfileKpiCard } from '@/components/planning/profiles'

interface Props {
  profile: ProfileConfig
}

function parseCostAmount(typical: string): number {
  const match = typical.match(/[\d,]+/)
  if (!match) return 0
  return parseInt(match[0].replace(/,/g, ''), 10)
}

export default function CostDriversTab({ profile }: Props) {
  const { costDrivers } = profile

  const costTypeBadge: Record<string, string> = {
    fixed: 'bg-blue-100 text-blue-700',
    variable: 'bg-purple-100 text-purple-700',
    percentage: 'bg-teal-100 text-teal-700',
  }

  // Compute rough category totals for breakdown bar
  const categoryTotals = costDrivers.categories.map((cat) => {
    const total = cat.items.reduce((sum, item) => sum + parseCostAmount(item.typical), 0)
    return { name: cat.name, total }
  })
  const grandTotal = categoryTotals.reduce((sum, c) => sum + c.total, 0) || 1

  // Assign distinct colors for the breakdown bars
  const barColors = [
    '#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#3B82F6', '#84CC16',
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* 1. KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {costDrivers.kpis.map((kpi) => (
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

      {/* 2. Cost Breakdown Visual */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Cost Breakdown by Category</h2>
        <div className="space-y-3">
          {categoryTotals.map((cat, idx) => {
            const pct = grandTotal > 0 ? Math.round((cat.total / grandTotal) * 100) : 0
            const color = barColors[idx % barColors.length]
            return (
              <div key={cat.name} className="flex items-center gap-4">
                <span className="text-sm text-slate-600 w-40 shrink-0 truncate">{cat.name}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500 w-10 text-right shrink-0">{pct}%</span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {categoryTotals.map((cat, idx) => (
            <span key={cat.name} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: barColors[idx % barColors.length] }}
              />
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Cost Categories */}
      {costDrivers.categories.map((category) => (
        <div key={category.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{category.name}</h2>
          <div className="rounded-xl overflow-hidden border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Typical Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                </tr>
              </thead>
              <tbody>
                {category.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3 text-slate-700 font-medium">{item.label}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{item.typical}</td>
                    <td className="px-4 py-3 text-slate-500">{item.frequency}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${costTypeBadge[item.type] ?? 'bg-slate-100 text-slate-600'}`}>
                        {item.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* 4. Cost Control Tips */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Cost Control Tips</h2>
        <ol className="space-y-3">
          {costDrivers.costControlTips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: profile.accentColor }}
              >
                {idx + 1}
              </span>
              <span className="text-sm text-slate-700 leading-relaxed">{tip}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 5. Sensitivity Note */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Sensitivity Note</p>
          <p className="text-sm text-amber-700 leading-relaxed">{costDrivers.sensitivityNote}</p>
        </div>
      </div>
    </div>
  )
}
