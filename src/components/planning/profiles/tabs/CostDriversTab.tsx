"use client"

import { useMemo, useState } from 'react'
import { AlertCircle, Landmark } from 'lucide-react'
import type { ProfileConfig } from '@/lib/planning/profile-config'
import { ProfileKpiCard } from '@/components/planning/profiles'
import { useWorkspaceJurisdiction } from '@/hooks/useWorkspaceJurisdiction'
import { acquisitionTax } from '@/lib/planning/acquisition-tax'
import { recurringTax, estimateRecurringTax } from '@/lib/money/recurring-tax'
import { formatMoneyMajor } from '@/lib/i18n'
import { getCountryPack } from '@/lib/i18n/country-packs'
import { NotLegalAdviceNotice } from '@/components/jurisdiction'

interface Props {
  profile: ProfileConfig
}

const TAX_COUNTRIES: { code: string; label: string }[] = [
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IE', label: 'Ireland' },
  { code: 'ES', label: 'Spain' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'IT', label: 'Italy' },
  { code: 'PT', label: 'Portugal' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'AU', label: 'Australia' },
  { code: 'AE', label: 'UAE (Dubai)' },
]

function AcquisitionTaxEstimator() {
  const ws = useWorkspaceJurisdiction()
  const [country, setCountry] = useState(ws.countryCode || 'GB')
  const [region, setRegion] = useState((ws.settings as { region?: string }).region || 'EW')
  const [price, setPrice] = useState('300000')
  const [additional, setAdditional] = useState(false)
  const [nonResident, setNonResident] = useState(false)

  // Currency from the country pack (accurate for all 45 jurisdictions) rather
  // than a hardcoded GB/AE/AU→EUR guess that mislabelled e.g. US as EUR.
  const ccy = getCountryPack(country).currency
  const result = useMemo(
    () =>
      acquisitionTax({
        countryCode: country,
        region: country === 'GB' ? region : null,
        price: Number(price) || 0,
        isAdditional: additional,
        isNonResident: nonResident,
      }),
    [country, region, price, additional, nonResident],
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="w-5 h-5 text-slate-500" />
        <h2 className="text-lg font-semibold text-slate-900">Acquisition tax estimator</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        The biggest upfront cost driver. Estimate purchase-transaction tax for the property&apos;s jurisdiction. Indicative
        only — rates change at fiscal events and vary by region; verify before relying on a figure.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Jurisdiction</span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          >
            {TAX_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </label>
        {country === 'GB' && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-600">UK region</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              <option value="EW">England & N. Ireland</option>
              <option value="SCT">Scotland</option>
              <option value="WLS">Wales</option>
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Purchase price</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </label>
        <div className="flex flex-col gap-1.5 justify-end">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={additional} onChange={(e) => setAdditional(e.target.checked)} className="accent-[var(--brand)]" />
            Additional / second property
          </label>
          {country === 'GB' && region === 'EW' && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={nonResident} onChange={(e) => setNonResident(e.target.checked)} className="accent-[var(--brand)]" />
              Non-resident purchaser
            </label>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-6 rounded-xl bg-slate-50 border border-slate-100 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{result.taxName}</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatMoneyMajor(result.total, ccy)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Effective rate</p>
          <p className="text-lg font-semibold text-slate-700 tabular-nums">{(result.effectiveRate * 100).toFixed(2)}%</p>
        </div>
        {result.breakdown.length > 0 && (
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Breakdown</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {result.breakdown.map((b, i) => (
                <span key={i} className="text-[11px] text-slate-500">
                  {b.band}: {formatMoneyMajor(b.amount, ccy)}
                </span>
              ))}
              {result.surcharges.filter((s) => s.amount > 0).map((s, i) => (
                <span key={`s${i}`} className="text-[11px] font-medium text-amber-600">
                  {s.label}: {formatMoneyMajor(s.amount, ccy)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recurring property tax (dim 21) — the main ongoing tax cost driver. */}
      {(() => {
        const rec = recurringTax(country)
        const annual = estimateRecurringTax(rec, Number(price) || 0)
        return (
          <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-800">{rec.taxName}</span>
              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">payer: {rec.payer}</span>
              {annual != null && (
                <span className="text-[13px] text-slate-700">≈ {formatMoneyMajor(annual, ccy)}/yr</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{rec.note}</p>
          </div>
        )
      })()}

      <p className="text-[11px] text-slate-400 mt-2">Source: {result.citation}</p>
      <NotLegalAdviceNotice variant="inline" className="mt-2" />
    </div>
  )
}

function parseCostAmount(typical: string): number {
  const match = typical.match(/[\d,]+/)
  if (!match) return 0
  return parseInt(match[0].replace(/,/g, ''), 10)
}

export default function CostDriversTab({ profile }: Props) {
  const { costDrivers } = profile

  const costTypeBadge: Record<string, string> = {
    fixed: 'bg-[var(--color-brand-100)] text-[var(--brand)]',
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

      {/* 2b. Acquisition tax estimator (dim 7) — the biggest upfront cost driver. */}
      <AcquisitionTaxEstimator />

      {/* 3. Cost Categories */}
      {costDrivers.categories.map((category) => (
        <div key={category.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{category.name}</h2>
          <div className="rounded-xl overflow-x-auto border border-slate-100">
            <table className="w-full text-sm min-w-[600px]">
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
