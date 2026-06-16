"use client"

import React from "react"
import { Plus, Trash2, Info, Sparkles, ChevronDown } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"
import { gbp } from "@/lib/planning/income-calculations"

export const PURPLE = "#7C3AED"
export const BLUE = "#2563EB"
export const GREEN = "#10B981"
export const AMBER = "#F59E0B"

// ─── KPI strip ───────────────────────────────────────────────────────────────

export interface KpiItem {
  label: string
  value: string
  sub?: string
  tone?: string
  info?: boolean
}

export function IncomeKpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 bg-[#F6FAFF] border-b border-slate-100">
      <div className="grid grid-cols-2 sm:flex sm:items-stretch gap-x-6 gap-y-4 sm:gap-0 sm:flex-wrap">
        {items.map((k, i) => (
          <div
            key={k.label}
            className={cn(
              "sm:px-6 first:sm:pl-0",
              i > 0 && "sm:border-l sm:border-slate-200/70",
            )}
          >
            <p className="flex items-center gap-1 text-[10.5px] text-slate-400 uppercase tracking-wide font-semibold mb-1">
              {k.label}
              {k.info && <Info className="w-3 h-3 text-slate-300" />}
            </p>
            <p className="text-[19px] font-bold leading-none" style={{ color: k.tone ?? "#0F172A" }}>
              {k.value}
            </p>
            {k.sub && <p className="text-[10.5px] text-slate-400 mt-1">{k.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section header with add button ──────────────────────────────────────────

export function IncomeSectionHeader({
  title,
  subtitle,
  addLabel,
  onAdd,
}: {
  title: string
  subtitle: string
  addLabel?: string
  onAdd?: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>
        <p className="text-[12.5px] text-slate-400">{subtitle}</p>
      </div>
      {addLabel && onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          {addLabel}
        </button>
      )}
    </div>
  )
}

// ─── Table primitives ────────────────────────────────────────────────────────

export function TableShell({
  headers,
  children,
  minWidth = 960,
  addLabel,
  onAdd,
}: {
  headers: string[]
  children: React.ReactNode
  minWidth?: number
  addLabel?: string
  onAdd?: () => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
      <table className="w-full" style={{ minWidth }}>
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="w-4 px-4 py-3" />
            {headers.map((h) => (
              <th
                key={h}
                className="text-left text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {addLabel && onAdd && (
        <div className="px-4 py-3 border-t border-slate-100">
          <button
            onClick={onAdd}
            className="flex items-center gap-2 text-[13px] font-semibold text-[#7C3AED] hover:text-violet-700"
          >
            <Plus className="w-4 h-4" />
            {addLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export function Row({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
      <td className="px-4 py-3 text-slate-300 cursor-grab select-none">⠿</td>
      {children}
    </tr>
  )
}

export function DeleteCell({ onDelete }: { onDelete: () => void }) {
  return (
    <td className="px-3 py-2">
      <button
        onClick={onDelete}
        aria-label="Delete row"
        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </td>
  )
}

export function TextCell({
  value,
  onChange,
  placeholder,
  width = "w-32",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  width?: string
}) {
  return (
    <td className="px-3 py-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          width,
          "h-8 px-2 rounded-lg border border-slate-200 text-[12.5px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20",
        )}
      />
    </td>
  )
}

export function NumberCell({
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  step,
  width = "w-24",
}: {
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  width?: string
}) {
  return (
    <td className="px-3 py-2">
      <div className="relative flex items-center gap-1">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 font-medium">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            width,
            "h-8 pr-2 rounded-lg border border-slate-200 text-[12.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20",
            prefix ? "pl-5" : "pl-2",
            suffix ? "text-left" : "",
          )}
        />
        {suffix && <span className="text-[11px] text-slate-400">{suffix}</span>}
      </div>
    </td>
  )
}

export function SelectCell({
  value,
  onChange,
  options,
  width = "min-w-[130px]",
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  width?: string
}) {
  return (
    <td className="px-3 py-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          width,
          "h-8 px-2 rounded-lg border border-slate-200 bg-white text-[12.5px] text-slate-700 focus:outline-none cursor-pointer",
        )}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </td>
  )
}

export function MoneyCell({ value }: { value: number }) {
  return (
    <td className="px-3 py-2">
      <span className="text-[13px] font-bold text-slate-900">{gbp(value)}</span>
    </td>
  )
}

// ─── Summary footer ──────────────────────────────────────────────────────────

export interface SummaryItem {
  icon: string
  label: string
  value: string
}

export function SummaryFooter({
  items,
  totalLabel,
  totalValue,
}: {
  items: SummaryItem[]
  totalLabel: string
  totalValue: string
}) {
  return (
    <div className="flex items-center gap-x-7 gap-y-3 mt-4 pt-4 border-t border-slate-100 flex-wrap">
      {items.map((m) => (
        <div key={m.label} className="flex items-center gap-2">
          <span className="text-[15px]">{m.icon}</span>
          <div>
            <p className="text-[11px] text-slate-400">{m.label}</p>
            <p className="text-[14px] font-bold text-slate-900">{m.value}</p>
          </div>
        </div>
      ))}
      <div className="ml-auto text-right">
        <p className="text-[12px] text-slate-400">{totalLabel}</p>
        <p className="text-[20px] font-bold text-slate-900">{totalValue}</p>
      </div>
    </div>
  )
}

// ─── Chart cards ─────────────────────────────────────────────────────────────

export function ChartGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 border-b border-slate-100">
      {children}
    </div>
  )
}

export function MonthlyGrossCard({
  title,
  value,
  sub,
  data,
}: {
  title: string
  value: string
  sub: string
  data: Array<{ m: string; v: number }>
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[13px] font-bold text-slate-900">{title}</h3>
          <p className="text-[17px] font-bold text-slate-900 mt-0.5">{value}</p>
          <p className="text-[11px] text-slate-400">{sub}</p>
        </div>
        <button className="text-[11.5px] font-semibold text-[#2563EB] hover:text-blue-700">View Details</button>
      </div>
      <div className="h-[84px]" role="img" aria-label={`${title} projection chart`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="mgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PURPLE} stopOpacity={0.18} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [gbp(Number(v)), "Income"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 11 }}
            />
            <Area type="monotone" dataKey="v" stroke={PURPLE} strokeWidth={2} fill="url(#mgGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export interface DonutDatum {
  name: string
  value: number
  colour: string
  display?: string
}

export function DonutCard({ title, data, footer }: { title: string; data: DonutDatum[]; footer?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <h3 className="text-[13px] font-bold text-slate-900 mb-3">{title}</h3>
      <div className="flex items-center gap-3">
        <div className="h-[84px] w-[84px] shrink-0" role="img" aria-label={`${title} donut chart`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={26} outerRadius={40} paddingAngle={2} dataKey="value">
                {data.map((d) => (
                  <Cell key={d.name} fill={d.colour} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.colour }} />
              <span className="text-[11px] text-slate-500 flex-1 truncate">{d.name}</span>
              <span className="text-[11px] font-bold text-slate-700">{d.display ?? `${d.value}%`}</span>
            </div>
          ))}
        </div>
      </div>
      {footer && <div className="mt-3 pt-3 border-t border-slate-50">{footer}</div>}
    </div>
  )
}

export function MetricsCard({ title, rows }: { title: string; rows: Array<{ label: string; value: string; tone?: string }> }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-slate-900">{title}</h3>
        <Info className="w-3.5 h-3.5 text-slate-300" />
      </div>
      <div className="space-y-2">
        {rows.map((m) => (
          <div key={m.label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
            <span className="text-[11.5px] text-slate-500">{m.label}</span>
            <span className="text-[12px] font-bold" style={{ color: m.tone ?? "#1E293B" }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TrendCard({
  title,
  badge,
  data,
  footer,
  formatter,
}: {
  title: string
  badge?: { label: string; tone: "green" | "amber" | "blue" }
  data: Array<{ m: string; v: number }>
  footer?: React.ReactNode
  formatter?: (v: number) => string
}) {
  const tones = {
    green: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-slate-900">{title}</h3>
        {badge && (
          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", tones[badge.tone])}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="h-[84px]" role="img" aria-label={`${title} trend chart`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PURPLE} stopOpacity={0.15} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [formatter ? formatter(Number(v)) : String(v), title]}
              contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 11 }}
            />
            <Area type="monotone" dataKey="v" stroke={PURPLE} strokeWidth={2} fill="url(#trendGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {footer && <div className="mt-3 pt-3 border-t border-slate-50">{footer}</div>}
    </div>
  )
}

export function TrendFooter({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string
  leftValue: string
  rightLabel: string
  rightValue: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10.5px] text-slate-400">{leftLabel}</p>
        <p className="text-[12px] font-bold text-emerald-600">{leftValue}</p>
      </div>
      <div className="text-right">
        <p className="text-[10.5px] text-slate-400">{rightLabel}</p>
        <p className="text-[12px] font-bold text-rose-500">{rightValue}</p>
      </div>
    </div>
  )
}

// ─── Void allowance bar ──────────────────────────────────────────────────────

export function VoidAllowanceBar({
  label,
  value,
  onChange,
  hint,
  rightLabel,
  rightValue,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint: string
  rightLabel?: string
  rightValue?: string
}) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-100 flex items-center gap-6 bg-[#F6FAFF]">
      <div>
        <label className="text-[12px] font-semibold text-slate-600 block mb-1">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 h-8 px-2.5 text-center rounded-lg border border-slate-200 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
          />
          <span className="text-[12px] text-slate-400">{label.includes("Void") ? "% allowance" : ""}</span>
        </div>
      </div>
      <div className="text-[11.5px] text-slate-400">{hint}</div>
      {rightLabel && (
        <div className="ml-auto text-right">
          <p className="text-[12px] text-slate-400">{rightLabel}</p>
          <p className="text-[16px] font-bold text-slate-900">{rightValue}</p>
        </div>
      )}
    </div>
  )
}

// ─── AI Assistant panel (empty state until real recs exist) ──────────────────

export interface AiSuggestion {
  id: string
  label: string
  desc: string
  impact?: string
  action: string
  tone?: string
}

export function IncomeAiPanel({
  suggestions,
  onGenerate,
  onApply,
  onApplyAll,
  isGenerating,
}: {
  suggestions: AiSuggestion[]
  onGenerate: () => void
  onApply: (id: string) => void
  onApplyAll?: () => void
  isGenerating?: boolean
}) {
  const hasRecs = suggestions.length > 0
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#7C3AED] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-[14px] font-bold text-slate-900">AI Assistant</h3>
            <span className="text-[10px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">Beta</span>
          </div>
          {hasRecs && onApplyAll && (
            <button
              onClick={onApplyAll}
              className="h-8 px-3 rounded-xl bg-[#7C3AED] text-white text-[12px] font-semibold hover:bg-violet-700 transition-colors"
            >
              Apply All Suggestions
            </button>
          )}
        </div>

        {!hasRecs ? (
          <div className="text-center py-6">
            <p className="text-[13px] font-semibold text-slate-700">No AI recommendations yet.</p>
            <p className="text-[12px] text-slate-500 mt-1 max-w-md mx-auto">
              Add income assumptions or run AI guidance to generate recommendations for this section.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? "Analysing…" : "Run AI Guidance"}
              </button>
              <button
                onClick={onGenerate}
                className="h-9 px-4 rounded-xl border border-violet-200 text-[13px] font-semibold text-[#7C3AED] hover:bg-white/80 transition-colors"
              >
                Review assumptions
              </button>
            </div>
          </div>
        ) : (
          <>
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2.5 border-b border-violet-100/60 last:border-0"
              >
                <div className="flex-1 mr-3">
                  <p className="text-[12.5px] font-semibold text-slate-800">{s.label}</p>
                  <p className="text-[11.5px] text-slate-500">{s.desc}</p>
                  {s.impact && <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">{s.impact}</p>}
                </div>
                <button
                  onClick={() => onApply(s.id)}
                  style={{ background: s.tone ?? PURPLE }}
                  className="h-8 px-3 rounded-xl text-white text-[12px] font-semibold shrink-0 hover:opacity-90 transition-opacity"
                >
                  {s.action}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Detail accordion (used by seasonal tab) ─────────────────────────────────

export function DetailAccordion({
  title,
  subtitle,
  status,
  children,
}: {
  title: string
  subtitle?: string
  status?: string
  children?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="text-left">
          <span className="text-[13.5px] font-semibold text-slate-700">{title}</span>
          {subtitle && <p className="text-[11.5px] text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {status}
            </span>
          )}
          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>
      {open && <div className="px-4 sm:px-6 lg:px-8 pb-5 text-[13px] text-slate-500">{children}</div>}
    </div>
  )
}
