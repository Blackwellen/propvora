"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Wrench,
  ShieldCheck,
  Hammer,
  Sparkles,
  Paintbrush,
  Search,
  Zap,
  HelpCircle,
  AlertTriangle,
  TrendingDown,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/hooks/useWorkspace"
import { useProperties } from "@/hooks/useProperties"

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobWizardData {
  title: string
  description: string
  category: string
  priority: "urgent" | "high" | "medium" | "low"
  propertyId: string
  propertyName: string
  scopeOfWork: string
  revenueBlocking: boolean
  occupancyBlocking: boolean
  supplierName: string
  supplierContact: string
  supplierEmail: string
  supplierPhone: string
  sendPortalLink: boolean
  scheduledDate: string
  scheduledTime: string
  estimatedDuration: string
  quotedAmount: number
  approvedAmount: number
  approvedSameAsQuoted: boolean
}

const defaultData: JobWizardData = {
  title: "",
  description: "",
  category: "maintenance",
  priority: "medium",
  propertyId: "",
  propertyName: "",
  scopeOfWork: "",
  revenueBlocking: false,
  occupancyBlocking: false,
  supplierName: "",
  supplierContact: "",
  supplierEmail: "",
  supplierPhone: "",
  sendPortalLink: true,
  scheduledDate: "",
  scheduledTime: "",
  estimatedDuration: "",
  quotedAmount: 0,
  approvedAmount: 0,
  approvedSameAsQuoted: true,
}

const STEPS = ["Details", "Property & Scope", "Supplier", "Financials", "Review"]

const CATEGORIES = [
  { key: "maintenance", label: "Maintenance", icon: Wrench },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
  { key: "repair", label: "Repair", icon: Hammer },
  { key: "renovation", label: "Renovation", icon: Paintbrush },
  { key: "cleaning", label: "Cleaning", icon: Sparkles },
  { key: "inspection", label: "Inspection", icon: Search },
  { key: "emergency", label: "Emergency", icon: Zap },
  { key: "other", label: "Other", icon: HelpCircle },
]

const PRIORITIES = [
  { key: "urgent", label: "Urgent", dotColor: "bg-red-500", textColor: "text-red-700", activeClass: "border-red-500 bg-red-50" },
  { key: "high", label: "High", dotColor: "bg-orange-500", textColor: "text-orange-700", activeClass: "border-orange-500 bg-orange-50" },
  { key: "medium", label: "Medium", dotColor: "bg-amber-500", textColor: "text-amber-700", activeClass: "border-amber-500 bg-amber-50" },
  { key: "low", label: "Low", dotColor: "bg-slate-400", textColor: "text-slate-600", activeClass: "border-slate-400 bg-slate-50" },
]

const inputClass = "w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white placeholder:text-slate-400"
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5"

// ─── Step components ──────────────────────────────────────────────────────────

function StepDetails({ data, onChange }: { data: JobWizardData; onChange: (d: Partial<JobWizardData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Job title <span className="text-red-500">*</span></label>
        <input type="text" placeholder="e.g. Annual boiler service" value={data.title} onChange={(e) => onChange({ title: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea placeholder="Describe the job in detail..." value={data.description} onChange={(e) => onChange({ description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-white placeholder:text-slate-400" />
      </div>
      <div>
        <label className={labelClass}>Category</label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button key={cat.key} type="button" onClick={() => onChange({ category: cat.key })} className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all", data.category === cat.key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}>
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label className={labelClass}>Priority</label>
        <div className="grid grid-cols-2 gap-2">
          {PRIORITIES.map((p) => (
            <button key={p.key} type="button" onClick={() => onChange({ priority: p.key as JobWizardData["priority"] })} className={cn("flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all", data.priority === p.key ? p.activeClass : "border-slate-200 hover:border-slate-300")}>
              <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", p.dotColor)} />
              <span className={data.priority === p.key ? p.textColor : "text-slate-600"}>{p.label}</span>
              {data.priority === p.key && <Check className={cn("w-3.5 h-3.5 ml-auto", p.textColor)} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepPropertyScope({ data, onChange, properties, propertiesLoading }: { data: JobWizardData; onChange: (d: Partial<JobWizardData>) => void; properties: { id: string; name: string }[]; propertiesLoading: boolean }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Property</label>
        <select
          value={data.propertyId}
          onChange={(e) => { const p = properties.find((p) => p.id === e.target.value); onChange({ propertyId: e.target.value, propertyName: p?.name ?? "" }) }}
          disabled={propertiesLoading}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">{propertiesLoading ? "Loading properties…" : "Select property..."}</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Scope of work</label>
        <textarea placeholder="Detailed description of works to be carried out..." value={data.scopeOfWork} onChange={(e) => onChange({ scopeOfWork: e.target.value })} rows={4} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-white placeholder:text-slate-400" />
      </div>
      <div>
        <label className={labelClass}>Commercial impact</label>
        <div className="space-y-2">
          {[
            { key: "revenueBlocking" as const, icon: TrendingDown, iconColor: "text-red-500", label: "Revenue blocking", desc: "This job is blocking rent collection" },
            { key: "occupancyBlocking" as const, icon: Home, iconColor: "text-amber-500", label: "Occupancy blocking", desc: "Property cannot be let until resolved" },
          ].map((opt) => {
            const Icon = opt.icon
            return (
              <label key={opt.key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={data[opt.key]} onChange={(e) => onChange({ [opt.key]: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", opt.iconColor)} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{opt.label}</p>
                    <p className="text-xs text-slate-400">{opt.desc}</p>
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StepSupplier({ data, onChange }: { data: JobWizardData; onChange: (d: Partial<JobWizardData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Supplier / Contractor name</label>
        <input type="text" placeholder="e.g. HeatPro Heating Ltd" value={data.supplierName} onChange={(e) => onChange({ supplierName: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Contact name</label>
        <input type="text" placeholder="Contact person" value={data.supplierContact} onChange={(e) => onChange({ supplierContact: e.target.value })} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" placeholder="email@company.com" value={data.supplierEmail} onChange={(e) => onChange({ supplierEmail: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input type="tel" placeholder="07xxx xxxxxx" value={data.supplierPhone} onChange={(e) => onChange({ supplierPhone: e.target.value })} className={inputClass} />
        </div>
      </div>
      <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
        <div className="relative w-10 h-5 flex-shrink-0">
          <input type="checkbox" checked={data.sendPortalLink} onChange={(e) => onChange({ sendPortalLink: e.target.checked })} className="sr-only" />
          <div className={cn("w-10 h-5 rounded-full transition-colors", data.sendPortalLink ? "bg-blue-600" : "bg-slate-200")} />
          <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", data.sendPortalLink ? "translate-x-5 left-0.5" : "translate-x-0 left-0.5")} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Send portal link automatically</p>
          <p className="text-xs text-slate-400">Supplier gets a secure link to submit quotes & evidence</p>
        </div>
      </label>
    </div>
  )
}

function StepFinancials({ data, onChange }: { data: JobWizardData; onChange: (d: Partial<JobWizardData>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Quoted amount (£)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
          <input type="number" min={0} step={0.01} value={data.quotedAmount || ""} onChange={(e) => { const v = Number(e.target.value); onChange({ quotedAmount: v, approvedAmount: data.approvedSameAsQuoted ? v : data.approvedAmount }) }} className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="0.00" />
        </div>
      </div>
      <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
        <input type="checkbox" checked={data.approvedSameAsQuoted} onChange={(e) => onChange({ approvedSameAsQuoted: e.target.checked, approvedAmount: e.target.checked ? data.quotedAmount : 0 })} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
        <span className="text-sm font-medium text-slate-700">Approved amount same as quoted</span>
      </label>
      {!data.approvedSameAsQuoted && (
        <div>
          <label className={labelClass}>Approved amount (£)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
            <input type="number" min={0} step={0.01} value={data.approvedAmount || ""} onChange={(e) => onChange({ approvedAmount: Number(e.target.value) })} className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="0.00" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Scheduled date</label>
          <input type="date" value={data.scheduledDate} onChange={(e) => onChange({ scheduledDate: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Time</label>
          <input type="time" value={data.scheduledTime} onChange={(e) => onChange({ scheduledTime: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Estimated duration</label>
        <input type="text" placeholder="e.g. 2 hours, Half day" value={data.estimatedDuration} onChange={(e) => onChange({ estimatedDuration: e.target.value })} className={inputClass} />
      </div>
    </div>
  )
}

function StepReview({ data }: { data: JobWizardData }) {
  const rows: [string, string][] = [
    ["Title", data.title || "—"],
    ["Category", CATEGORIES.find((c) => c.key === data.category)?.label ?? data.category],
    ["Priority", PRIORITIES.find((p) => p.key === data.priority)?.label ?? data.priority],
    ["Property", data.propertyName || "—"],
    ["Supplier", data.supplierName || "—"],
    ["Revenue blocking", data.revenueBlocking ? "Yes" : "No"],
    ["Occupancy blocking", data.occupancyBlocking ? "Yes" : "No"],
    ["Scheduled", data.scheduledDate ? new Date(data.scheduledDate).toLocaleDateString("en-GB") : "—"],
    ["Time", data.scheduledTime || "—"],
    ["Duration", data.estimatedDuration || "—"],
    ["Quoted", data.quotedAmount ? `£${data.quotedAmount.toLocaleString()}` : "—"],
    ["Approved", data.approvedAmount ? `£${data.approvedAmount.toLocaleString()}` : "—"],
    ["Send portal link", data.sendPortalLink ? "Yes" : "No"],
  ]
  return (
    <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      {rows.map(([label, value], i) => (
        <div key={label} className={cn("flex items-center justify-between px-4 py-3 text-sm", i % 2 === 0 ? "bg-white" : "bg-slate-50")}>
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-900 text-right">{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewJobPage() {
  const router = useRouter()
  const { data: workspace } = useWorkspace()
  const { data: propertiesRaw = [], isLoading: propertiesLoading } = useProperties(workspace?.id)
  const properties = propertiesRaw.map((p) => ({ id: p.id, name: p.name }))
  const [step, setStep] = useState(1)
  const [data, setData] = useState<JobWizardData>(defaultData)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function handleChange(updates: Partial<JobWizardData>) {
    setData((prev) => ({ ...prev, ...updates }))
  }

  async function handleSubmit() {
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { data: created, error } = await supabase
        .from("jobs")
        .insert({
          workspace_id: workspace?.id,
          title: data.title,
          description: data.description || null,
          category: data.category,
          priority: data.priority,
          status: "new",
          property_id: data.propertyId || null,
          notes: data.scopeOfWork || null,
          scheduled_date: data.scheduledDate || null,
          quoted_amount: data.quotedAmount || null,
          approved_amount: data.approvedAmount || null,
        })
        .select()
        .single()
      if (error) throw error
      router.push(`/app/work/jobs/${created.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save job"
      setSaveError(message)
      setSaving(false)
    }
  }

  const canAdvance = step === 1 ? data.title.trim() !== "" : true

  const stepComponents = [
    <StepDetails key="details" data={data} onChange={handleChange} />,
    <StepPropertyScope key="property" data={data} onChange={handleChange} properties={properties} propertiesLoading={propertiesLoading} />,
    <StepSupplier key="supplier" data={data} onChange={handleChange} />,
    <StepFinancials key="financials" data={data} onChange={handleChange} />,
    <StepReview key="review" data={data} />,
  ]

  return (
    <div className="max-w-2xl mx-auto">

        <Link href="/app/work/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Jobs
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Create Job</h1>
          <p className="text-sm text-slate-500 mt-0.5">Step {step} of {STEPS.length} — {STEPS[step - 1]}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, idx) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  idx + 1 === step ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                  idx + 1 < step ? "bg-emerald-500 text-white" :
                  "bg-slate-100 text-slate-400"
                )}>
                  {idx + 1 < step ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={cn("text-xs hidden sm:block", idx + 1 === step ? "text-blue-600 font-semibold" : "text-slate-400")}>{label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-1 rounded-full transition-colors", idx + 1 < step ? "bg-emerald-400" : "bg-slate-200")} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-5">{STEPS[step - 1]}</h2>
          {stepComponents[step - 1]}
        </div>

        {saveError && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {saveError}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60">
              {saving ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
              ) : (
                <><Check className="w-4 h-4" /> Create Job</>
              )}
            </button>
          )}
        </div>
    </div>
  )
}
