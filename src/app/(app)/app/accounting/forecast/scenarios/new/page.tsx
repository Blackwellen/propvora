"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { AccountingStepper } from "@/features/accounting/components"
import MobileTopBar from "@/components/mobile/MobileTopBar"

const WIZARD_STEPS = [
  { number: 1, label: "Scenario Details", sublabel: "Define scenario basics" },
  { number: 2, label: "Assumptions", sublabel: "Set key assumptions" },
  { number: 3, label: "Drivers", sublabel: "Fine-tune model drivers" },
  { number: 4, label: "Review & Save", sublabel: "Confirm and save scenario" },
]

const ASSUMPTIONS = [
  { icon: "🟢", label: "Occupancy", value: "94.0%", desc: "Average occupied space", color: "text-[#10B981]" },
  { icon: "📊", label: "Rent Growth (ERV)", value: "3.5%", desc: "Effective rental growth p.a.", color: "text-[#2563EB]" },
  { icon: "🟠", label: "Arrears (Tenant)", value: "1.0%", desc: "% of rent outstanding", color: "text-[#F59E0B]" },
  { icon: "🔴", label: "Maintenance", value: "14.0%", desc: "Opex as % of gross rent", color: "text-[#EF4444]" },
  { icon: "🔴", label: "Financing Costs", value: "4.25%", desc: "Average cost of debt p.a.", color: "text-[#EF4444]" },
  { icon: "📈", label: "Inflation", value: "2.50%", desc: "Annual inflation assumption", color: "text-[#7C3AED]" },
]

const SUMMARY_ROWS = [
  { label: "Gross Income", upside: "£4,561,000", base: "£3,842,000", variance: "+£719,000", pct: "+18.7%", positive: true },
  { label: "Operating Expenses", upside: "£1,351,000", base: "£1,198,000", variance: "+£153,000", pct: "+12.8%", positive: false },
  { label: "Net Operating Income", upside: "£3,210,000", base: "£2,644,000", variance: "+£566,000", pct: "+21.4%", positive: true },
  { label: "Net Income", upside: "£2,480,000", base: "£2,089,000", variance: "+£391,000", pct: "+18.7%", positive: true },
  { label: "Cash Flow", upside: "£2,130,000", base: "£1,734,000", variance: "+£396,000", pct: "+22.9%", positive: true },
]

function ImpactChart() {
  const upsideData = [120, 140, 155, 165, 175, 190, 200, 215, 225, 240, 255, 270]
  const baseData = [100, 115, 125, 135, 145, 155, 162, 170, 178, 188, 196, 205]
  const w = 280, h = 80
  const min = 90, max = 290, range = max - min

  function path(data: number[]) {
    const xs = data.map((_, i) => (i / (data.length - 1)) * w)
    const ys = data.map((v) => h - ((v - min) / range) * (h - 8) - 4)
    return xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ")
  }

  return (
    <svg width="100%" height={h + 20} viewBox={`0 0 ${w} ${h + 20}`} className="w-full">
      <path d={path(baseData)} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" />
      <path d={path(upsideData)} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
      {["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m, i) => (
        <text key={m} x={(i / 11) * w} y={h + 16} textAnchor="middle" fontSize="8" fill="#94A3B8">{m}</text>
      ))}
    </svg>
  )
}

export default function AddForecastScenarioPage() {
  const [step, setStep] = useState(1)
  const [scenarioName, setScenarioName] = useState("Upside Case – Strong Leasing")
  const [description, setDescription] = useState("Assumes stronger leasing velocity, rental growth above market and controlled operating expenses.")
  const [period, setPeriod] = useState("12M")
  const [tags, setTags] = useState(["Upside", "Growth", "Leasing"])
  const [newTag, setNewTag] = useState("")

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && newTag.trim()) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t))
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      <MobileTopBar title="Add Forecast Scenario" subtitle="Forecast" showBack backHref="/app/accounting/forecast" />

      {/* Header */}
      <div className="hidden md:flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/app/accounting" className="hover:text-slate-600">Accounting</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-500 font-medium">10 · Add Forecast Scenario</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Add Forecast Scenario</h1>
        <p className="text-sm text-slate-500">Create a new forecast scenario to explore different outcomes and compare against your base plan.</p>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <AccountingStepper steps={WIZARD_STEPS} currentStep={step} />
      </div>

      {/* Three-column content */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* Left — Scenario Details Form */}
        <div className="w-full xl:w-[380px] shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Scenario Details</h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Scenario Name <span className="text-[#EF4444]">*</span></label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Based On</label>
                <select className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
                  <option>Base Plan (Jul 2026)</option>
                  <option>None (Start fresh)</option>
                </select>
                <p className="text-[11px] text-[#2563EB]">All assumptions and drivers will be copied from the selected scenario.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Forecast Period</label>
                <div className="flex gap-1">
                  {["12M", "18M", "24M", "36M", "Custom"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-semibold transition-all",
                        period === p
                          ? "bg-[#2563EB] text-white shadow-sm"
                          : "border border-[#E2E8F0] text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Reporting Currency</label>
                <select className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
                  <option>GBP – British Pound</option>
                  <option>USD – US Dollar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Date Range</label>
                <div className="h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 flex items-center">
                  <span className="text-sm text-slate-600">Aug 2026 → Jul 2027</span>
                  <span className="ml-auto text-[11px] text-slate-500">12 months starting Aug 2026</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Rounding</label>
                <select className="w-full h-9 px-3 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30">
                  <option>Thousands (£&apos;000)</option>
                  <option>Units</option>
                  <option>Millions (£m)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Scenario Description (Optional)</label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={250}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-[11px] text-slate-500">{description.length}/250</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Scenario Tags</label>
                <div className="flex flex-wrap gap-2 p-2.5 rounded-lg border border-[#E2E8F0] min-h-[40px]">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[12px] font-medium">
                      {t}
                      <button onClick={() => removeTag(t)} className="ml-0.5 hover:text-[#1d4ed8]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="+ Add tag"
                    className="text-[12px] text-[#2563EB] placeholder:text-[#2563EB] bg-transparent outline-none min-w-[60px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Centre — Key Assumptions */}
        <div className="w-full xl:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Key Assumptions Snapshot</h3>
            <p className="text-xs text-slate-500 mb-4">These will be configured in the next step.</p>
            <div className="space-y-3">
              {ASSUMPTIONS.map((a) => (
                <div key={a.label} className="flex items-center gap-3">
                  <span className="text-base shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{a.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{a.desc}</p>
                  </div>
                  <span className={cn("text-sm font-bold shrink-0", a.color)}>{a.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
              <button className="text-xs font-medium text-[#2563EB] hover:text-[#1d4ed8]">
                View all drivers in next step →
              </button>
            </div>
          </div>
        </div>

        {/* Right — Live Impact Preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Live Impact Preview</h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[10px] font-bold text-[#059669]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Live
              </span>
              <span className="text-[11px] text-slate-500 ml-1">Changes update instantly</span>
            </div>

            {/* 4 mini KPI cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Net Income (12M)", value: "£2.48M", delta: "+18.7% vs Base Plan", up: true },
                { label: "NOI (12M)", value: "£3.21M", delta: "+15.4%", up: true },
                { label: "Cash Flow (12M)", value: "£2.13M", delta: "+22.9%", up: true },
                { label: "Yield on Cost", value: "7.8%", delta: "+1.6pp", up: true },
              ].map((m) => (
                <div key={m.label} className="bg-slate-50 rounded-xl p-3 border border-[#E2E8F0]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{m.label}</p>
                  <p className="text-lg font-black text-slate-900">{m.value}</p>
                  <p className="text-[11px] font-medium text-[#10B981] mt-0.5">{m.delta}</p>
                </div>
              ))}
            </div>

            {/* Mini chart */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Income vs Base Plan</span>
                <select className="h-6 pl-2 pr-6 rounded text-[11px] border border-[#E2E8F0] appearance-none focus:outline-none text-slate-500">
                  <option>Monthly</option>
                </select>
              </div>
              <ImpactChart />
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 bg-[#2563EB] inline-block" />
                  <span className="text-[10px] text-slate-500">Upside Case – Strong Leasing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 flex items-center">
                    <span className="w-full h-0.5 border-t border-dashed border-slate-400 inline-block" />
                  </div>
                  <span className="text-[10px] text-slate-500">Base Plan (Jul 2026)</span>
                </div>
              </div>
            </div>

            {/* Summary table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Summary (12 Month)</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Upside Case</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Base Plan</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Variance</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide">% Change</th>
                  </tr>
                </thead>
                <tbody>
                  {SUMMARY_ROWS.map((row, idx) => (
                    <tr key={row.label} className={cn("border-b border-[#E2E8F0] hover:bg-slate-50/50", idx === SUMMARY_ROWS.length - 1 && "border-0")}>
                      <td className="px-3 py-2.5 font-medium text-slate-700">{row.label}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{row.upside}</td>
                      <td className="px-3 py-2.5 text-right text-slate-500">{row.base}</td>
                      <td className={cn("px-3 py-2.5 text-right font-semibold", row.positive ? "text-[#10B981]" : "text-[#EF4444]")}>{row.variance}</td>
                      <td className={cn("px-3 py-2.5 text-right font-bold", row.positive ? "text-[#10B981]" : "text-[#EF4444]")}>{row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[10px] text-slate-500">
              This preview uses current assumptions. Final results may vary after all drivers are configured.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-[#E2E8F0]">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/accounting/forecast">Cancel</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Save Draft</Button>
          <Button variant="primary" size="sm" onClick={() => setStep(2)}>Next: Assumptions →</Button>
        </div>
      </div>
    </div>
  )
}
