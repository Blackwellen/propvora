"use client"

import React, { useState } from "react"
import {
  Bell,
  Shield,
  Tag,
  FileText,
  Calendar,
  Truck,
  Users,
  Archive,
  Zap,
  BarChart3,
  Link as LinkIcon,
  RotateCcw,
  Save,
  Trash2,
  Pencil,
  GripVertical,
  ChevronDown,
  Plus,
  CheckSquare,
  Square,
} from "lucide-react"
import { DashboardContainer, PageHeader } from "@/components/layout/PageContainer"

export const dynamic = "force-dynamic"

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  )
}

function Select({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm text-slate-700 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-full"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
    </div>
  )
}

function NumberInput({ value, onChange, width = "w-16" }: { value: string; onChange: (v: string) => void; width?: string }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${width}`}
    />
  )
}

function SettingsCard({
  iconBg,
  icon,
  title,
  subtitle,
  children,
}: {
  iconBg: string
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <Toggle checked={checked} onChange={onChange} />
        <span className={`text-xs font-medium ${checked ? "text-blue-600" : "text-slate-400"}`}>
          {checked ? "Enabled" : "Disabled"}
        </span>
      </div>
    </div>
  )
}

interface InspectionRow {
  type: string
  frequencyVal: string
  frequencyUnit: string
  toleranceVal: string
  toleranceUnit: string
  escalate: boolean
}

interface PermissionRow {
  role: string
  view: boolean
  create: boolean
  edit: boolean
  del: boolean
  approve: boolean
  export: boolean
}

export default function ComplianceSettingsPage() {
  const [firstReminder, setFirstReminder] = useState("60")
  const [firstUnit, setFirstUnit] = useState("Days")
  const [firstEscalate, setFirstEscalate] = useState(true)
  const [secondReminder, setSecondReminder] = useState("30")
  const [secondUnit, setSecondUnit] = useState("Days")
  const [secondEscalate, setSecondEscalate] = useState(true)
  const [finalReminder, setFinalReminder] = useState("7")
  const [finalUnit, setFinalUnit] = useState("Days")
  const [overdueEscalation, setOverdueEscalation] = useState("Every 7 days")

  const [inspections, setInspections] = useState<InspectionRow[]>([
    { type: "Fire Risk Assessment", frequencyVal: "12", frequencyUnit: "Months", toleranceVal: "15", toleranceUnit: "Days", escalate: true },
    { type: "Electrical Installation (EICR)", frequencyVal: "60", frequencyUnit: "Months", toleranceVal: "30", toleranceUnit: "Days", escalate: true },
    { type: "Gas Safety Check", frequencyVal: "12", frequencyUnit: "Months", toleranceVal: "15", toleranceUnit: "Days", escalate: true },
    { type: "Legionella Risk Assessment", frequencyVal: "12", frequencyUnit: "Months", toleranceVal: "15", toleranceUnit: "Days", escalate: false },
  ])

  function updateInspection<K extends keyof InspectionRow>(idx: number, key: K, val: InspectionRow[K]) {
    setInspections((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: val } : r)))
  }

  const [minScore, setMinScore] = useState("80")
  const [insurance, setInsurance] = useState("Public Liability")
  const [minCover, setMinCover] = useState("5000000")
  const [certExpiry, setCertExpiry] = useState("30")
  const [certExpiryUnit, setCertExpiryUnit] = useState("Days")
  const [revalidation, setRevalidation] = useState("12")
  const [revalidationUnit, setRevalidationUnit] = useState("Months")

  const [permissions, setPermissions] = useState<PermissionRow[]>([
    { role: "Administrator",      view: true,  create: true,  edit: true,  del: true,  approve: true,  export: true },
    { role: "Compliance Manager", view: true,  create: true,  edit: true,  del: true,  approve: true,  export: true },
    { role: "Property Manager",   view: true,  create: true,  edit: true,  del: false, approve: true,  export: true },
    { role: "Viewer",             view: true,  create: false, edit: false, del: false, approve: false, export: true },
  ])

  function togglePerm(idx: number, key: keyof Omit<PermissionRow, "role">) {
    setPermissions((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: !r[key] } : r)))
  }

  const [docRetention, setDocRetention] = useState("7")
  const [docRetentionUnit, setDocRetentionUnit] = useState("Years")
  const [autoPurge, setAutoPurge] = useState(true)
  const [inspRetention, setInspRetention] = useState("5")
  const [inspRetentionUnit, setInspRetentionUnit] = useState("Years")
  const [gracePeriod, setGracePeriod] = useState("90")
  const [gracePeriodUnit, setGracePeriodUnit] = useState("Days")

  const [emailNotif, setEmailNotif] = useState(true)
  const [inAppNotif, setInAppNotif] = useState(true)
  const [smsNotif, setSmsNotif] = useState(false)
  const [escalationNotif, setEscalationNotif] = useState(true)

  const [autoAssign, setAutoAssign] = useState(true)
  const [autoRenewals, setAutoRenewals] = useState(true)
  const [autoEscalate, setAutoEscalate] = useState(true)
  const [autoClose, setAutoClose] = useState(false)

  const [reportType, setReportType] = useState("Compliance Summary")
  const [reportFreq, setReportFreq] = useState("Weekly")
  const [reportDay, setReportDay] = useState("Monday")

  const unitOpts = ["Days", "Weeks", "Months"]
  const yearOpts = ["Years"]
  const monthOpts = ["Months"]

  return (
    <DashboardContainer>
      <PageHeader
        title="Compliance Settings"
        description="Configure rules, thresholds and preferences to manage risk and ensure compliance."
        actions={
          <>
            <button className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Discard changes
            </button>
            <button className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <RotateCcw className="w-4 h-4" />
              Reset to defaults
            </button>
            <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Save className="w-4 h-4" />
              Save all changes
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-6 px-6 pb-6 mt-6">

        <SettingsCard iconBg="bg-violet-100" icon={<Bell className="w-4 h-4 text-violet-600" />} title="Renewal reminder rules" subtitle="Configure when and how renewal reminders are generated.">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-28 shrink-0">First reminder:</span>
              <NumberInput value={firstReminder} onChange={setFirstReminder} width="w-14" />
              <Select value={firstUnit} onChange={setFirstUnit} options={unitOpts} className="w-24" />
              <span className="text-xs text-slate-500 flex-1">before expiry</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">Escalate to owner:</span>
                <Toggle checked={firstEscalate} onChange={setFirstEscalate} />
                <span className={`text-xs font-medium ${firstEscalate ? "text-blue-600" : "text-slate-400"}`}>{firstEscalate ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-28 shrink-0">Second reminder:</span>
              <NumberInput value={secondReminder} onChange={setSecondReminder} width="w-14" />
              <Select value={secondUnit} onChange={setSecondUnit} options={unitOpts} className="w-24" />
              <span className="text-xs text-slate-500 flex-1">before expiry</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">Escalate to secondary:</span>
                <Toggle checked={secondEscalate} onChange={setSecondEscalate} />
                <span className={`text-xs font-medium ${secondEscalate ? "text-blue-600" : "text-slate-400"}`}>{secondEscalate ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-28 shrink-0">Final reminder:</span>
              <NumberInput value={finalReminder} onChange={setFinalReminder} width="w-14" />
              <Select value={finalUnit} onChange={setFinalUnit} options={unitOpts} className="w-24" />
              <span className="text-xs text-slate-500 flex-1">before expiry</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">Overdue escalation:</span>
                <Select value={overdueEscalation} onChange={setOverdueEscalation} options={["Every 7 days", "Every 14 days", "Every 30 days"]} className="w-32" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-50">Reminders are sent via email and in-app notifications.</p>
          </div>
        </SettingsCard>

        <SettingsCard iconBg="bg-orange-100" icon={<Shield className="w-4 h-4 text-orange-600" />} title="Risk thresholds" subtitle="Define risk score ranges and required actions.">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Risk Level", "Score Range", "Required Action", "Colour"].map((h) => (
                  <th key={h} className="pb-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { level: "Low",    dot: "bg-green-500", range: "0 — 39",   action: "Monitor",          actionColor: "text-green-600" },
                { level: "Medium", dot: "bg-amber-500", range: "40 — 69",  action: "Review",           actionColor: "text-amber-600" },
                { level: "High",   dot: "bg-red-500",   range: "70 — 100", action: "Immediate action", actionColor: "text-red-600"   },
              ].map((row) => (
                <tr key={row.level}>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                      <span className="text-sm text-slate-700">{row.level}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-slate-600 font-mono">{row.range}</td>
                  <td className="py-2.5 pr-3">
                    <Select value={row.action} onChange={() => {}} options={["Monitor", "Review", "Immediate action"]} className="w-40" />
                  </td>
                  <td className="py-2.5"><span className={`text-lg ${row.actionColor}`}>●</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-50">Risk score is calculated from expiry, inspection results, incidents and document compliance.</p>
        </SettingsCard>

        <SettingsCard iconBg="bg-blue-100" icon={<Tag className="w-4 h-4 text-blue-600" />} title="Compliance categories" subtitle="Manage categories used to classify compliance items.">
          <div className="flex flex-col gap-1">
            {[
              { name: "Fire Safety",         dot: "bg-red-500",    chip: "bg-red-100 text-red-700"     },
              { name: "Health & Safety",     dot: "bg-amber-500",  chip: "bg-amber-100 text-amber-700" },
              { name: "Electrical",          dot: "bg-yellow-500", chip: "bg-yellow-100 text-yellow-700" },
              { name: "Building Compliance", dot: "bg-blue-500",   chip: "bg-blue-100 text-blue-700"   },
              { name: "Environmental",       dot: "bg-green-500",  chip: "bg-green-100 text-green-700" },
            ].map((cat) => (
              <div key={cat.name} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-b-0 group">
                <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`} />
                <span className="text-sm text-slate-700 flex-1">{cat.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.chip}`}>Required</span>
                <button className="text-slate-300 hover:text-slate-600 p-1 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button className="text-slate-300 hover:text-red-500 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
          <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />Add category
          </button>
        </SettingsCard>

        <SettingsCard iconBg="bg-slate-100" icon={<FileText className="w-4 h-4 text-slate-600" />} title="Required document templates" subtitle="Set required documents by category.">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Category", "Required Documents", "Template", "Actions"].map((h) => (
                  <th key={h} className="pb-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { category: "Fire Safety",         doc: "Fire Risk Assessment",  template: "Fire Risk Assessment v2" },
                { category: "Electrical",          doc: "EICR Certificate",      template: "EICR Certificate v3"     },
                { category: "Building Compliance", doc: "Gas Safety Certificate", template: "Gas Safety Cert v2"     },
              ].map((row) => (
                <tr key={row.category}>
                  <td className="py-2.5 pr-3 text-xs font-medium text-slate-700">{row.category}</td>
                  <td className="py-2.5 pr-3 text-xs text-slate-600">{row.doc}</td>
                  <td className="py-2.5 pr-3">
                    <Select value={row.template} onChange={() => {}} options={[row.template]} className="w-44" />
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <button className="text-slate-400 hover:text-blue-600 p-1 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                      <button className="text-slate-400 hover:text-red-500 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />Add document requirement
          </button>
        </SettingsCard>

        <SettingsCard iconBg="bg-green-100" icon={<Calendar className="w-4 h-4 text-green-600" />} title="Inspection frequencies" subtitle="Default inspection intervals by type.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Inspection Type", "Frequency", "Tolerance", "Escalate if Overdue"].map((h) => (
                    <th key={h} className="pb-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide pr-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inspections.map((row, i) => (
                  <tr key={row.type}>
                    <td className="py-2.5 pr-3 text-xs font-medium text-slate-700 whitespace-nowrap">{row.type}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <NumberInput value={row.frequencyVal} onChange={(v) => updateInspection(i, "frequencyVal", v)} width="w-12" />
                        <Select value={row.frequencyUnit} onChange={(v) => updateInspection(i, "frequencyUnit", v)} options={monthOpts} className="w-24" />
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <NumberInput value={row.toleranceVal} onChange={(v) => updateInspection(i, "toleranceVal", v)} width="w-12" />
                        <Select value={row.toleranceUnit} onChange={(v) => updateInspection(i, "toleranceUnit", v)} options={unitOpts} className="w-20" />
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Toggle checked={row.escalate} onChange={(v) => updateInspection(i, "escalate", v)} />
                        <span className={`text-xs font-medium ${row.escalate ? "text-blue-600" : "text-slate-400"}`}>{row.escalate ? "Enabled" : "Disabled"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />Add inspection type
          </button>
        </SettingsCard>

        <SettingsCard iconBg="bg-blue-100" icon={<Truck className="w-4 h-4 text-blue-600" />} title="Supplier compliance requirements" subtitle="Set minimum compliance and documentation standards for suppliers.">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Minimum overall compliance score</label>
                <div className="flex items-center gap-2">
                  <NumberInput value={minScore} onChange={setMinScore} width="w-16" />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Insurance required</label>
                <Select value={insurance} onChange={setInsurance} options={["Public Liability", "Employers Liability", "Professional Indemnity"]} className="w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Insurance minimum cover</label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-500">£</span>
                  <input type="text" value={minCover} onChange={(e) => setMinCover(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Primary documents required</label>
                <div className="border border-slate-200 rounded-lg p-2 min-h-[60px] flex flex-wrap gap-1.5">
                  {["Public Liability Insurance", "Health & Safety Policy"].map((doc) => (
                    <span key={doc} className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {doc}<button className="text-blue-400 hover:text-blue-700 ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Certificate expiry tolerance</label>
                <div className="flex items-center gap-1.5">
                  <NumberInput value={certExpiry} onChange={setCertExpiry} width="w-14" />
                  <Select value={certExpiryUnit} onChange={setCertExpiryUnit} options={unitOpts} className="w-24" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Revalidation frequency</label>
                <div className="flex items-center gap-1.5">
                  <NumberInput value={revalidation} onChange={setRevalidation} width="w-14" />
                  <Select value={revalidationUnit} onChange={setRevalidationUnit} options={monthOpts} className="w-24" />
                </div>
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard iconBg="bg-slate-100" icon={<Users className="w-4 h-4 text-slate-600" />} title="Ownership & role permissions" subtitle="Control who can view and manage compliance data.">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Role", "View", "Create", "Edit", "Delete", "Approve", "Export"].map((h) => (
                  <th key={h} className="pb-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {permissions.map((row, i) => (
                <tr key={row.role}>
                  <td className="py-2.5 pr-3 text-xs font-medium text-slate-700 whitespace-nowrap">{row.role}</td>
                  {(["view", "create", "edit", "del", "approve", "export"] as const).map((key) => (
                    <td key={key} className="py-2.5 pr-2">
                      <button onClick={() => togglePerm(i, key)} className="transition-colors">
                        {row[key] ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />Add custom role
          </button>
        </SettingsCard>

        <SettingsCard iconBg="bg-slate-100" icon={<Archive className="w-4 h-4 text-slate-600" />} title="Evidence retention" subtitle="Set how long evidence and documents are retained.">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Document retention period</label>
                <div className="flex items-center gap-1.5">
                  <NumberInput value={docRetention} onChange={setDocRetention} width="w-14" />
                  <Select value={docRetentionUnit} onChange={setDocRetentionUnit} options={yearOpts} className="w-20" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Inspection records retention</label>
                <div className="flex items-center gap-1.5">
                  <NumberInput value={inspRetention} onChange={setInspRetention} width="w-14" />
                  <Select value={inspRetentionUnit} onChange={setInspRetentionUnit} options={yearOpts} className="w-20" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Auto purge expired evidence</label>
                <div className="flex items-center gap-2">
                  <Toggle checked={autoPurge} onChange={setAutoPurge} />
                  <span className={`text-xs font-medium ${autoPurge ? "text-blue-600" : "text-slate-400"}`}>{autoPurge ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Purge after grace period</label>
                <div className="flex items-center gap-1.5">
                  <NumberInput value={gracePeriod} onChange={setGracePeriod} width="w-14" />
                  <Select value={gracePeriodUnit} onChange={setGracePeriodUnit} options={unitOpts} className="w-20" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-50">Retention policies apply to expired items unless they are part of an active investigation or audit.</p>
        </SettingsCard>

        <SettingsCard iconBg="bg-blue-100" icon={<Bell className="w-4 h-4 text-blue-600" />} title="Notifications" subtitle="Choose notification channels and preferences.">
          <div className="flex flex-col">
            <ToggleRow label="Email notifications" checked={emailNotif} onChange={setEmailNotif} />
            <ToggleRow label="In-app notifications" checked={inAppNotif} onChange={setInAppNotif} />
            <ToggleRow label="SMS notifications" checked={smsNotif} onChange={setSmsNotif} />
            <ToggleRow label="Escalation notifications" checked={escalationNotif} onChange={setEscalationNotif} />
          </div>
          <button className="mt-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full">Configure templates</button>
        </SettingsCard>

        <SettingsCard iconBg="bg-amber-100" icon={<Zap className="w-4 h-4 text-amber-600" />} title="Automation" subtitle="Configure automated compliance workflows.">
          <div className="flex flex-col">
            <ToggleRow label="Auto-assign tasks" checked={autoAssign} onChange={setAutoAssign} />
            <ToggleRow label="Auto-create renewals" checked={autoRenewals} onChange={setAutoRenewals} />
            <ToggleRow label="Auto-escalate overdue" checked={autoEscalate} onChange={setAutoEscalate} />
            <ToggleRow label="Auto-close on compliance" checked={autoClose} onChange={setAutoClose} />
          </div>
          <button className="mt-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full">Manage workflows</button>
        </SettingsCard>

        <SettingsCard iconBg="bg-violet-100" icon={<BarChart3 className="w-4 h-4 text-violet-600" />} title="Report scheduling defaults" subtitle="Default settings for compliance reports.">
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Default report type</label>
              <Select value={reportType} onChange={setReportType} options={["Compliance Summary", "Expiry Forecast", "Fire Safety Report", "Supplier Report"]} className="w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Frequency</label>
              <Select value={reportFreq} onChange={setReportFreq} options={["Daily", "Weekly", "Monthly", "Quarterly"]} className="w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Recipients</label>
              <div className="border border-slate-200 rounded-lg p-2 flex flex-wrap gap-1.5">
                {["Compliance Manager", "Property Managers"].map((r) => (
                  <span key={r} className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {r}<button className="text-blue-400 hover:text-blue-700 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Day &amp; time</label>
              <div className="flex items-center gap-2">
                <Select value={reportDay} onChange={setReportDay} options={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]} className="w-32" />
                <input type="time" defaultValue="09:00" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <button className="mt-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full">Manage schedules</button>
        </SettingsCard>

        <SettingsCard iconBg="bg-slate-100" icon={<LinkIcon className="w-4 h-4 text-slate-600" />} title="Integrations" subtitle="Connect systems to sync compliance data.">
          <div className="flex flex-col gap-2">
            {[
              { name: "DocuSign",         connected: true  },
              { name: "Xero",             connected: true  },
              { name: "SharePoint",       connected: false },
              { name: "Microsoft Teams",  connected: false },
            ].map((intg) => (
              <div key={intg.name} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <LinkIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{intg.name}</p>
                    <p className={`text-[11px] font-medium ${intg.connected ? "text-green-600" : "text-slate-400"}`}>
                      {intg.connected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                <button className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${intg.connected ? "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                  {intg.connected ? "Manage" : "Connect"}
                </button>
              </div>
            ))}
          </div>
          <button className="mt-2 text-xs text-blue-600 hover:underline font-medium">View all integrations</button>
        </SettingsCard>

      </div>
    </DashboardContainer>
  )
}
