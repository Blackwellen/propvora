"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Settings, GitCompare, Download, Percent } from 'lucide-react'
import type { ProfileConfig, ScenarioType } from '@/lib/planning/profile-config'
import { ProfileKpiCard } from '@/components/planning/profiles'
import { downloadCsv } from '@/lib/export/csv'
import { useWorkspaceJurisdiction } from '@/hooks/useWorkspaceJurisdiction'
import { computeIncomeTax } from '@/lib/planning/interest-relief'
import { disposalTax } from '@/lib/planning/disposal-tax'
import { formatMoneyMajor } from '@/lib/i18n'
import { NotLegalAdviceNotice } from '@/components/jurisdiction'

interface Props {
  profile: ProfileConfig
}

const RELIEF_COUNTRIES: { code: string; label: string }[] = [
  { code: 'GB', label: 'United Kingdom (S24)' },
  { code: 'IE', label: 'Ireland' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'ES', label: 'Spain' },
  { code: 'US', label: 'United States' },
]

/**
 * Interest-relief comparison (dim 9). The biggest cross-jurisdiction forecast
 * divergence: UK S24 restricts finance-cost relief for individual landlords.
 */
function InterestReliefPanel() {
  const ws = useWorkspaceJurisdiction()
  const [country, setCountry] = useState(ws.countryCode || 'GB')
  const [structure, setStructure] = useState<'personal' | 'corporate'>('personal')
  const [profit, setProfit] = useState('20000')
  const [interest, setInterest] = useState('8000')
  const [rate, setRate] = useState('40')

  const ccy = country === 'GB' ? 'GBP' : country === 'US' ? 'USD' : 'EUR'
  const r = useMemo(
    () =>
      computeIncomeTax({
        countryCode: country,
        structure,
        profitBeforeInterest: Number(profit) || 0,
        interest: Number(interest) || 0,
        marginalRate: (Number(rate) || 0) / 100,
      }),
    [country, structure, profit, interest, rate],
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Percent className="w-5 h-5 text-slate-500" />
        <h2 className="text-lg font-semibold text-slate-900">Mortgage interest relief</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        How mortgage interest is taxed varies sharply by jurisdiction. The UK restricts relief for individual landlords
        (Section 24) — interest is not deductible; a 20% tax credit applies instead. Most other countries allow full
        deduction. Indicative only — verify with an accountant.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="flex flex-col gap-1 col-span-2 lg:col-span-1">
          <span className="text-xs font-semibold text-slate-600">Jurisdiction</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
            {RELIEF_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Holding</span>
          <select value={structure} onChange={(e) => setStructure(e.target.value as 'personal' | 'corporate')} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
            <option value="personal">Personal</option>
            <option value="corporate">Company</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Profit (pre-interest)</span>
          <input type="number" value={profit} onChange={(e) => setProfit(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Mortgage interest</span>
          <input type="number" value={interest} onChange={(e) => setInterest(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Marginal rate %</span>
          <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tax due ({r.regime})</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatMoneyMajor(r.taxDue, ccy)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">If fully deductible</p>
          <p className="text-2xl font-bold text-slate-700 tabular-nums">{formatMoneyMajor(r.taxIfFullyDeductible, ccy)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${r.reliefPenalty > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Relief penalty</p>
          <p className={`text-2xl font-bold tabular-nums ${r.reliefPenalty > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{formatMoneyMajor(r.reliefPenalty, ccy)}</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-2">Source: {r.citation}</p>
      <NotLegalAdviceNotice variant="inline" className="mt-2" />
    </div>
  )
}

/**
 * Disposal / capital-gains tax (dim 26). Exit modelling — a forecast that
 * ignores disposal tax overstates net return. Dev/Flip especially.
 */
function DisposalTaxPanel() {
  const ws = useWorkspaceJurisdiction()
  const [country, setCountry] = useState(ws.countryCode || 'GB')
  const [gain, setGain] = useState('80000')
  const [holdingYears, setHoldingYears] = useState('3')
  const [mainResidence, setMainResidence] = useState(false)
  const [nonResident, setNonResident] = useState(false)
  const [higherRate, setHigherRate] = useState(true)

  const ccy = country === 'GB' ? 'GBP' : country === 'US' ? 'USD' : country === 'AU' ? 'AUD' : 'EUR'
  const r = useMemo(
    () => disposalTax({ countryCode: country, gain: Number(gain) || 0, holdingYears: Number(holdingYears) || 0, isMainResidence: mainResidence, isNonResident: nonResident, higherRate }),
    [country, gain, holdingYears, mainResidence, nonResident, higherRate],
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <GitCompare className="w-5 h-5 text-slate-500" />
        <h2 className="text-lg font-semibold text-slate-900">Disposal / capital-gains tax</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Exit modelling. Holding-period exemptions (DE 10yr, IT 5yr), main-residence relief and non-resident withholding
        all change the net. Indicative only — verify with an accountant.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Jurisdiction</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
            {RELIEF_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Expected gain</span>
          <input type="number" value={gain} onChange={(e) => setGain(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Holding years</span>
          <input type="number" value={holdingYears} onChange={(e) => setHoldingYears(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
        </label>
        <div className="flex flex-col gap-1.5 justify-end text-xs text-slate-600">
          <label className="flex items-center gap-2"><input type="checkbox" checked={mainResidence} onChange={(e) => setMainResidence(e.target.checked)} className="accent-[var(--brand)]" /> Main residence</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={nonResident} onChange={(e) => setNonResident(e.target.checked)} className="accent-[var(--brand)]" /> Non-resident</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={higherRate} onChange={(e) => setHigherRate(e.target.checked)} className="accent-[var(--brand)]" /> Higher-rate taxpayer</label>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-6 rounded-xl bg-slate-50 border border-slate-100 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{r.taxName} ({(r.rate * 100).toFixed(1)}%)</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatMoneyMajor(r.taxAmount, ccy)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Net of tax</p>
          <p className="text-lg font-semibold text-slate-700 tabular-nums">{formatMoneyMajor(r.net, ccy)}</p>
        </div>
        {r.withholding > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">Non-resident withholding</p>
            <p className="text-lg font-semibold text-amber-700 tabular-nums">{formatMoneyMajor(r.withholding, ccy)}</p>
          </div>
        )}
        {r.reportingDeadlineDays != null && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Report within</p>
            <p className="text-lg font-semibold text-slate-700">{r.reportingDeadlineDays} days</p>
          </div>
        )}
      </div>
      {r.note && <p className="text-[11px] text-slate-500 mt-2">{r.note}</p>}
      <p className="text-[11px] text-slate-400 mt-1">Source: {r.citation}</p>
      <NotLegalAdviceNotice variant="inline" className="mt-2" />
    </div>
  )
}

export default function ExampleForecastTab({ profile }: Props) {
  const { forecast } = profile
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('base')

  const wizardHref = `/property-manager/planning/wizard?profile=${profile.slug}`

  const activeScenario = forecast.scenarios.find((s) => s.type === selectedScenario) ?? forecast.scenarios[0]

  /** Real CSV export of the active scenario's monthly cashflow + assumptions + sensitivity. */
  function handleExport() {
    const monthlyRows = (activeScenario?.monthly ?? []).map((m) => ({
      section: 'Monthly Cashflow',
      label: m.month,
      income: m.income,
      costs: m.costs,
      net: m.net,
    }))
    const assumptionRows = forecast.assumptions.map((a) => ({
      section: 'Assumption',
      label: a.label,
      income: a.value,
      costs: '',
      net: '',
    }))
    const sensitivityRows = forecast.sensitivityRows.map((s) => ({
      section: 'Sensitivity',
      label: `${s.variable} (base ${s.base})`,
      income: `upside ${s.upside}`,
      costs: `downside ${s.downside}`,
      net: '',
    }))
    downloadCsv(
      `${profile.slug}-${selectedScenario}-forecast`,
      [...monthlyRows, ...assumptionRows, ...sensitivityRows],
      [
        { key: 'section', label: 'Section' },
        { key: 'label', label: 'Item' },
        { key: 'income', label: 'Income / Value' },
        { key: 'costs', label: 'Costs / Downside' },
        { key: 'net', label: 'Net' },
      ],
    )
  }

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

      {/* 4b. Interest-relief comparison (dim 9) — UK S24 vs full deduction. */}
      <InterestReliefPanel />

      {/* 4c. Disposal / CGT (dim 26) — exit modelling (esp. Dev/Flip). */}
      <DisposalTaxPanel />

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
          <Link
            href={wizardHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700"
          >
            <Settings className="w-4 h-4" />
            Edit Assumptions
          </Link>
          <Link
            href={wizardHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700"
          >
            <GitCompare className="w-4 h-4" />
            Compare Scenarios
          </Link>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-slate-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
