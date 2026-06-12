"use client"

import { AlertCircle } from 'lucide-react'
import type { ProfileConfig } from '@/lib/planning/profile-config'
import { ProfileKpiCard } from '@/components/planning/profiles'

interface Props {
  profile: ProfileConfig
}

export default function IncomeModelTab({ profile }: Props) {
  const { incomeModel } = profile

  return (
    <div className="space-y-6 pb-10">
      {/* 1. KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {incomeModel.kpis.map((kpi) => (
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

      {/* 2. Income Structure */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{incomeModel.structure.label}</h2>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${profile.accentColor}18`, color: profile.accentColor }}
          >
            {incomeModel.type}
          </span>
        </div>
        <p className="text-sm text-slate-600 mb-5">{incomeModel.structure.description}</p>
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Line Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Formula</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Example</th>
              </tr>
            </thead>
            <tbody>
              {incomeModel.structure.lines.map((line, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 font-medium text-slate-800">{line.label}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{line.formula}</td>
                  <td className="px-4 py-3 text-slate-700 font-mono text-xs">{line.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Default Assumptions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Default Assumptions</h2>
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Assumption</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Default Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Typical Range</th>
              </tr>
            </thead>
            <tbody>
              {incomeModel.assumptions.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 text-slate-700">{row.label}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.default}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{row.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Example Calculation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Example Calculation</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Inputs</p>
            <div className="rounded-xl overflow-hidden border border-slate-100">
              <table className="w-full text-sm">
                <tbody>
                  {incomeModel.exampleCalc.inputs.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-4 py-2.5 text-slate-600">{row.label}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-800">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Outputs */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Outputs</p>
            <div className="rounded-xl overflow-hidden border border-slate-100">
              <table className="w-full text-sm">
                <tbody>
                  {incomeModel.exampleCalc.outputs.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.highlight ? 'bg-slate-50 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                    >
                      <td
                        className="px-4 py-2.5 text-slate-700 relative"
                      >
                        {row.highlight && (
                          <span
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                            style={{ backgroundColor: profile.accentColor }}
                          />
                        )}
                        <span className={row.highlight ? 'pl-2' : ''}>{row.label}</span>
                      </td>
                      <td
                        className="px-4 py-2.5 text-right font-mono font-semibold"
                        style={row.highlight ? { color: profile.accentColor } : undefined}
                      >
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Benchmark Ranges */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Benchmark Ranges</h2>
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Metric</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Low</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Mid</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">High</th>
              </tr>
            </thead>
            <tbody>
              {incomeModel.benchmarkRanges.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 text-slate-700">{row.label}</td>
                  <td className="px-4 py-3 text-center font-mono text-red-600 font-medium">{row.low}</td>
                  <td className="px-4 py-3 text-center font-mono text-amber-600 font-medium">{row.mid}</td>
                  <td className="px-4 py-3 text-center font-mono text-emerald-600 font-medium">{row.high}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Sensitivity Note */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Sensitivity Note</p>
          <p className="text-sm text-amber-700 leading-relaxed">{incomeModel.sensitivityNote}</p>
        </div>
      </div>
    </div>
  )
}
