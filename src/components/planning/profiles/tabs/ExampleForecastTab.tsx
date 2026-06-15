"use client"

import { useState } from 'react'
import { AlertCircle, Settings, GitCompare, Download } from 'lucide-react'
import type { ProfileConfig, ScenarioType } from '@/lib/planning/profile-config'
import { ProfileKpiCard } from '@/components/planning/profiles'

interface Props {
  profile: ProfileConfig
}

export default function ExampleForecastTab({ profile }: Props) {
  const { forecast } = profile
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('base')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const activeScenario = forecast.scenarios.find((s) => s.type === selectedScenario) ?? forecast.scenarios[0]

  const scenarioLabels: Record<ScenarioType, string> = {
    base: 'Base Case',
    optimistic: 'Optimistic',
    conservative: 'Conservative',
    stress: 'Stress Test',
  }

  const scenarioBg: Record<ScenarioType, string> = {
    base: 'text-slate-600',
    optimistic: 'text-emerald-600',
    conservative: 'text-amber-600',
    stress: 'text-red-600',
  }

  // Compute chart scale
  const allValues = activeScenario?.monthly.flatMap((m) => [Math.abs(m.income), Math.abs(m.costs), Math.abs(m.net)]) ?? []
  const maxVal = Math.max(...allValues, 1)

  function barHeight(val: number): string {
    return `${Math.max(4, Math.round((Math.abs(val) / maxVal) * 100))}%`
  }

  const kpisToShow = activeScenario?.kpis.length ? activeScenario.kpis : forecast.baseKpis

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* 1. Scenario Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {forecast.scenarios.map((s) => {
            const isActive = s.type === selectedScenario
            return (
              <button
                key={s.type}
                onClick={() => setSelectedScenario(s.type)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                style={
                  isActive
                    ? {
                        backgroundColor: profile.accentColor,
                        color: '#fff',
                        borderColor: profile.accentColor,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: '#64748B',
                        borderColor: '#E2E8F0',
                      }
                }
              >
                {scenarioLabels[s.type] ?? s.name}
              </button>
            )
          })}
        </div>
        {activeScenario && (
          <p className="text-xs text-slate-400 mt-2 ml-1">{activeScenario.name}</p>
        )}
      </div>

      {/* 2. KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisToShow.slice(0, 8).map((kpi) => (
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

      {/* 3. Monthly Cashflow Chart */}
      {activeScenario && activeScenario.monthly.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Monthly Cashflow</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
                Costs
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: profile.accentColor }} />
                Net
              </span>
            </div>
          </div>

          <div className="flex items-end gap-1.5 h-48 overflow-x-auto pb-2">
            {activeScenario.monthly.map((m, idx) => {
              const netPositive = m.net >= 0
              return (
                <div key={idx} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: '2.5rem' }}>
                  <div className="flex items-end gap-0.5 h-40 relative">
                    {/* Income bar */}
                    {m.income > 0 && (
                      <div
                        className="w-3 bg-emerald-400 rounded-t transition-all duration-500"
                        style={{ height: barHeight(m.income) }}
                        title={`Income: ${m.income}`}
                      />
                    )}
                    {/* Costs bar */}
                    {m.costs > 0 && (
                      <div
                        className="w-3 bg-red-400 rounded-t transition-all duration-500"
                        style={{ height: barHeight(m.costs) }}
                        title={`Costs: ${m.costs}`}
                      />
                    )}
                    {/* Net bar */}
                    <div
                      className="w-3 rounded-t transition-all duration-500"
                      style={{
                        height: barHeight(m.net),
                        backgroundColor: netPositive ? profile.accentColor : '#F87171',
                        opacity: 0.85,
                      }}
                      title={`Net: ${m.net}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{m.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Assumptions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Forecast Assumptions</h2>
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Assumption</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Value</th>
              </tr>
            </thead>
            <tbody>
              {forecast.assumptions.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 text-slate-700">{row.label}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Sensitivity Analysis */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Sensitivity Analysis</h2>
        <div className="rounded-xl overflow-x-auto border border-slate-100">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Variable</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Base</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600 uppercase tracking-wide">Upside</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-red-500 uppercase tracking-wide">Downside</th>
              </tr>
            </thead>
            <tbody>
              {forecast.sensitivityRows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 text-slate-700 font-medium">{row.variable}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-800">{row.base}</td>
                  <td className="px-4 py-3 text-center font-mono text-emerald-600 font-medium">{row.upside}</td>
                  <td className="px-4 py-3 text-center font-mono text-red-500 font-medium">{row.downside}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Forecast Note */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-1">Forecast Note</p>
          <p className="text-sm text-amber-700 leading-relaxed">{forecast.forecastNote}</p>
        </div>
      </div>

      {/* 7. Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => showToast('Open your Planning Set to edit assumptions')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700"
          >
            <Settings className="w-4 h-4" />
            Edit Assumptions
          </button>
          <button
            onClick={() => showToast('Start a Planning Set to compare scenarios side-by-side')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700"
          >
            <GitCompare className="w-4 h-4" />
            Compare Scenarios
          </button>
          <button
            onClick={() => showToast('Generating export...')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
