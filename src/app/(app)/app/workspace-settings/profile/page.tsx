"use client"

import React, { useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

/* ------------------------------------------------------------------ */
/* Input helper                                                         */
/* ------------------------------------------------------------------ */
function InputField({
  label,
  value,
  onChange,
  helper,
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  helper?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
      />
      {helper && <p className="text-[11px] text-slate-400 mt-1">{helper}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helper,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  helper?: string
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {helper && <p className="text-[11px] text-slate-400 mt-1">{helper}</p>}
    </div>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="mb-5">
        <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
        {description && (
          <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

interface WorkspaceForm {
  workspaceName: string
  legalName: string
  workspaceType: string
  companyNumber: string
  vatNumber: string
  address: string
  phone: string
  website: string
  supportEmail: string
  billingEmail: string
  timezone: string
  currency: string
  dateFormat: string
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function WorkspaceProfilePage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [form, setForm] = useState<WorkspaceForm>({
    workspaceName: "",
    legalName: "",
    workspaceType: "property_manager",
    companyNumber: "",
    vatNumber: "",
    address: "",
    phone: "",
    website: "",
    supportEmail: "",
    billingEmail: "",
    timezone: "Europe/London",
    currency: "GBP",
    dateFormat: "DD/MM/YYYY",
  })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load workspace from Supabase
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()

        const wsId = profile?.current_workspace_id
        if (!wsId) return
        setWorkspaceId(wsId)

        const { data: ws, error } = await supabase
          .from("workspaces")
          .select("name, legal_name, business_type, company_number, vat_number, address, phone, website, support_email, billing_email, timezone, currency, date_format")
          .eq("id", wsId)
          .maybeSingle()

        if (error) { setLoadError("Failed to load workspace profile."); return }
        if (!ws) return

        setForm({
          workspaceName:  ws.name           ?? "",
          legalName:      ws.legal_name     ?? "",
          workspaceType:  ws.business_type  ?? "property_manager",
          companyNumber:  ws.company_number ?? "",
          vatNumber:      ws.vat_number     ?? "",
          address:        ws.address        ?? "",
          phone:          ws.phone          ?? "",
          website:        ws.website        ?? "",
          supportEmail:   ws.support_email  ?? "",
          billingEmail:   ws.billing_email  ?? "",
          timezone:       ws.timezone       ?? "Europe/London",
          currency:       ws.currency       ?? "GBP",
          dateFormat:     ws.date_format    ?? "DD/MM/YYYY",
        })
      } catch {
        setLoadError("Could not load workspace profile.")
      }
    }
    load()
  }, [])

  function set(key: keyof WorkspaceForm) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setIsDirty(true)
      setSaved(false)
      setSaveError(null)
    }
  }

  async function handleSave() {
    if (!workspaceId) { setSaveError("No active workspace found."); return }
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("workspaces")
        .update({
          name:           form.workspaceName.trim() || null,
          legal_name:     form.legalName.trim()     || null,
          business_type:  form.workspaceType        || null,
          company_number: form.companyNumber.trim() || null,
          vat_number:     form.vatNumber.trim()     || null,
          address:        form.address.trim()       || null,
          phone:          form.phone.trim()         || null,
          website:        form.website.trim()       || null,
          support_email:  form.supportEmail.trim()  || null,
          billing_email:  form.billingEmail.trim()  || null,
          timezone:       form.timezone             || null,
          currency:       form.currency             || null,
          date_format:    form.dateFormat           || null,
          updated_at:     new Date().toISOString(),
        })
        .eq("id", workspaceId)

      if (error) { setSaveError("Failed to save workspace profile."); return }
      setSaved(true)
      setIsDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError("An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[20px] font-bold text-slate-900">Workspace Profile</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Identity, contact, and regional information for your workspace
        </p>
      </div>

      {loadError && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
          {loadError}
        </div>
      )}

      <div className="space-y-5">
        {/* Identity */}
        <SectionCard
          title="Identity"
          description="Your workspace's public-facing and legal identity"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Workspace Name"
              value={form.workspaceName}
              onChange={set("workspaceName")}
              required
              helper="Shown to all team members and on reports"
            />
            <InputField
              label="Legal Name"
              value={form.legalName}
              onChange={set("legalName")}
              helper="Used on invoices and legal documents"
            />
            <SelectField
              label="Workspace Type"
              value={form.workspaceType}
              onChange={set("workspaceType")}
              options={[
                { value: "property_manager",  label: "Property Manager" },
                { value: "letting_agent",      label: "Letting Agent" },
                { value: "portfolio_landlord", label: "Portfolio Landlord" },
                { value: "estate_agent",       label: "Estate Agent" },
                { value: "block_manager",      label: "Block Manager" },
              ]}
            />
            <InputField
              label="Company Number"
              value={form.companyNumber}
              onChange={set("companyNumber")}
              placeholder="e.g. 12345678"
              helper="Companies House registration number"
            />
            <InputField
              label="VAT Number"
              value={form.vatNumber}
              onChange={set("vatNumber")}
              placeholder="e.g. GB123456789"
            />
          </div>
        </SectionCard>

        {/* Contact */}
        <SectionCard
          title="Contact Details"
          description="How clients and team members can reach your workspace"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InputField
                label="Address"
                value={form.address}
                onChange={set("address")}
                helper="Registered business address"
              />
            </div>
            <InputField
              label="Phone"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+44 20 0000 0000"
            />
            <InputField
              label="Website"
              value={form.website}
              onChange={set("website")}
              placeholder="https://yoursite.com"
            />
            <InputField
              label="Support Email"
              value={form.supportEmail}
              onChange={set("supportEmail")}
              helper="Shown to tenants and clients"
            />
            <InputField
              label="Billing Email"
              value={form.billingEmail}
              onChange={set("billingEmail")}
              helper="Receives invoices and receipts"
            />
          </div>
        </SectionCard>

        {/* Regional */}
        <SectionCard
          title="Regional Settings"
          description="Timezone, currency, and format preferences"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Timezone"
              value={form.timezone}
              onChange={set("timezone")}
              options={[
                { value: "Europe/London",    label: "Europe/London (GMT/BST)" },
                { value: "Europe/Dublin",    label: "Europe/Dublin (GMT/IST)" },
                { value: "Europe/Paris",     label: "Europe/Paris (CET)" },
                { value: "America/New_York", label: "America/New_York (EST)" },
                { value: "America/Chicago",  label: "America/Chicago (CST)" },
                { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
                { value: "Asia/Dubai",       label: "Asia/Dubai (GST)" },
              ]}
            />
            <SelectField
              label="Currency"
              value={form.currency}
              onChange={set("currency")}
              options={[
                { value: "GBP", label: "GBP — British Pound (£)" },
                { value: "EUR", label: "EUR — Euro (€)" },
                { value: "USD", label: "USD — US Dollar ($)" },
                { value: "AED", label: "AED — UAE Dirham (د.إ)" },
              ]}
            />
            <SelectField
              label="Date Format"
              value={form.dateFormat}
              onChange={set("dateFormat")}
              options={[
                { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/01/2025)" },
                { value: "MM/DD/YYYY", label: "MM/DD/YYYY (01/31/2025)" },
                { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2025-01-31)" },
              ]}
            />
          </div>
        </SectionCard>
      </div>

      {/* Save bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-8 py-4 flex items-center justify-between transition-all duration-200",
          isDirty ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div>
          <p className="text-[13px] text-slate-500">You have unsaved changes</p>
          {saveError && <p className="text-[12px] text-red-500 mt-0.5">{saveError}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setIsDirty(false); setSaved(false); setSaveError(null) }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : null}
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
