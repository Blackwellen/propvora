import { Wrench, ShieldCheck, FileText, BarChart, Clock, Zap, HelpCircle, Layers } from "lucide-react"

export interface TaskWizardData {
  title: string
  description: string
  category: string
  priority: "urgent" | "high" | "medium" | "low"
  propertyId: string
  propertyName: string
  scheduledStart: string
  dueDate: string
  assignee: string
  estimatedCost: number
}

export const CATEGORIES = [
  { key: "maintenance", label: "Maintenance", icon: Wrench },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
  { key: "admin", label: "Admin", icon: FileText },
  { key: "inspection", label: "Inspection", icon: BarChart },
  { key: "project", label: "Project", icon: Layers },
  { key: "emergency", label: "Emergency", icon: Zap },
  { key: "other", label: "Other", icon: HelpCircle },
  { key: "ad_hoc", label: "Ad Hoc", icon: Clock },
]

export const PRIORITIES = [
  { key: "urgent", label: "Urgent", dotColor: "bg-red-500", textColor: "text-red-700", activeClass: "border-red-500 bg-red-50" },
  { key: "high", label: "High", dotColor: "bg-orange-500", textColor: "text-orange-700", activeClass: "border-orange-500 bg-orange-50" },
  { key: "medium", label: "Medium", dotColor: "bg-amber-500", textColor: "text-amber-700", activeClass: "border-amber-500 bg-amber-50" },
  { key: "low", label: "Low", dotColor: "bg-slate-400", textColor: "text-slate-600", activeClass: "border-slate-400 bg-slate-50" },
]

export const inputClass = "w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white placeholder:text-slate-400"
export const labelClass = "block text-sm font-medium text-slate-700 mb-1.5"
