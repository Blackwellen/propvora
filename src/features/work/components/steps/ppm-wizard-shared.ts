import { Flame, Zap, ShieldCheck, Droplets, Wrench, Cog, Building2, Layers } from "lucide-react"

// Shared contract + tokens for the New PPM Schedule wizard. Mirrors the
// Task/Job wizard-shared modules so the three Work wizards stay visually and
// structurally consistent. The wizard renders through the canonical
// WizardShell primitive (side-step rail) — no bespoke layout.

export interface PpmWizardData {
  name: string
  category: string
  priority: "critical" | "high" | "medium" | "low"
  description: string
  propertyId: string
  propertyName: string
  unitId: string
  unitName: string
  frequency: string
  startDate: string
  nextDueDate: string
  /** "Days before next due date" offsets to send a reminder notification, e.g. [30, 7, 1]. */
  reminders: number[]
  supplierName: string
  estimatedCost: number
  autoGenerateJob: boolean
}

// Selectable reminder lead-times (days before the next due date). Persisted as
// `ppm_plans.reminders` and dispatched daily by `dispatch_ppm_reminders()`.
export const PPM_REMINDER_OPTIONS = [
  { value: 30, label: "30 days before" },
  { value: 14, label: "14 days before" },
  { value: 7, label: "7 days before" },
  { value: 3, label: "3 days before" },
  { value: 1, label: "1 day before" },
]

export function ppmReminderLabel(days: number): string {
  return PPM_REMINDER_OPTIONS.find((o) => o.value === days)?.label ?? `${days} day${days === 1 ? "" : "s"} before`
}

export const PPM_CATEGORIES = [
  { key: "Gas", label: "Gas", icon: Flame },
  { key: "Electrical", label: "Electrical", icon: Zap },
  { key: "Fire", label: "Fire", icon: ShieldCheck },
  { key: "Water", label: "Water", icon: Droplets },
  { key: "Plumbing", label: "Plumbing", icon: Wrench },
  { key: "Mechanical", label: "Mechanical", icon: Cog },
  { key: "Building", label: "Building", icon: Building2 },
  { key: "General", label: "General", icon: Layers },
]

export const PPM_PRIORITIES = [
  { key: "critical", label: "Critical", dotColor: "bg-red-500", textColor: "text-red-700", activeClass: "border-red-500 bg-red-50" },
  { key: "high", label: "High", dotColor: "bg-orange-500", textColor: "text-orange-700", activeClass: "border-orange-500 bg-orange-50" },
  { key: "medium", label: "Medium", dotColor: "bg-amber-500", textColor: "text-amber-700", activeClass: "border-amber-500 bg-amber-50" },
  { key: "low", label: "Low", dotColor: "bg-slate-400", textColor: "text-slate-600", activeClass: "border-slate-400 bg-slate-50" },
]

export const PPM_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "bi_annual", label: "Bi-Annual" },
  { value: "annual", label: "Annual" },
  { value: "biennial", label: "Every 2 Years" },
]

export const ppmInputClass =
  "w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white placeholder:text-slate-400"
export const ppmSelectClass =
  "w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer bg-white disabled:opacity-60 disabled:cursor-not-allowed"
export const ppmLabelClass = "block text-sm font-medium text-slate-700 mb-1.5"

export function ppmFrequencyLabel(value: string): string {
  return PPM_FREQUENCIES.find((f) => f.value === value)?.label ?? value
}
