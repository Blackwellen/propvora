"use client"

import React, { useState, useEffect } from "react"
import { Mail, ChevronDown, ChevronRight, Send, Eye, Edit2, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getWorkspaceSettings, saveWorkspaceSettings } from "@/lib/actions/settings"
import { TemplateEditor, type TemplateContent, type TemplateDef } from "./TemplateEditor"

interface EmailTemplate {
  key: string
  name: string
  editable: boolean
  tokens: string[]
  default: TemplateContent
}

const TEMPLATES: EmailTemplate[] = [
  { key: "welcome", name: "Welcome Email", editable: true,
    tokens: ["contact_name", "workspace_name"],
    default: { subject: "Welcome to {{workspace_name}}", body: "Hi {{contact_name}},\n\nWelcome aboard! Your workspace is ready — log in any time to manage your portfolio.\n\nThe {{workspace_name}} team" } },
  { key: "invite", name: "Team Invite", editable: true,
    tokens: ["contact_name", "workspace_name", "invite_link"],
    default: { subject: "You've been invited to {{workspace_name}}", body: "Hi {{contact_name}},\n\nYou've been invited to join {{workspace_name}} on Propvora.\n\nAccept your invite: {{invite_link}}" } },
  { key: "arrears", name: "Arrears Chase", editable: true,
    tokens: ["tenant_name", "property_address", "amount", "due_date"],
    default: { subject: "Overdue rent — {{amount}} for {{property_address}}", body: "Hi {{tenant_name}},\n\nOur records show {{amount}} is overdue for {{property_address}} (due {{due_date}}). Please arrange payment as soon as possible.\n\nThank you." } },
  { key: "compliance", name: "Compliance Reminder", editable: true,
    tokens: ["property_address", "certificate_type", "expiry_date"],
    default: { subject: "{{certificate_type}} expiring on {{expiry_date}}", body: "The {{certificate_type}} certificate for {{property_address}} expires on {{expiry_date}}. Please arrange a renewal to stay compliant." } },
  { key: "invoice", name: "Invoice Notification", editable: true,
    tokens: ["contact_name", "invoice_number", "amount", "due_date", "property_address"],
    default: { subject: "Invoice {{invoice_number}} — {{amount}} due {{due_date}}", body: "Hi {{contact_name}},\n\nPlease find your invoice {{invoice_number}} for {{amount}}, due {{due_date}}{{property_address}}.\n\nThank you." } },
  { key: "supplier", name: "Supplier Request", editable: true,
    tokens: ["supplier_name", "property_address", "sender_name"],
    default: { subject: "Work request for {{property_address}}", body: "Hi {{supplier_name}},\n\nWe'd like to request work at {{property_address}}. Please reply with your availability and a quote.\n\n{{sender_name}}" } },
  { key: "portal-reply", name: "Supplier Portal Reply", editable: true,
    tokens: ["supplier_name", "property_address"],
    default: { subject: "Reply on your {{property_address}} job", body: "Hi {{supplier_name}},\n\nThere's a new message on your job for {{property_address}}. Log in to the supplier portal to view and reply." } },
  { key: "magic-link", name: "Magic Link Login", editable: false,
    tokens: [], default: { subject: "", body: "" } },
]

export default function EmailPage() {
  const [fromEmail, setFromEmail]     = useState("")
  const [replyTo, setReplyTo]         = useState("")
  const [supportEmail, setSupportEmail] = useState("")
  const [testEmail, setTestEmail]     = useState("")
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [toast, setToast]             = useState<string | null>(null)
  const [isDirty, setIsDirty]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  // Persisted template overrides, keyed by template key, from workspace_settings.mail.email_templates
  const [savedTemplates, setSavedTemplates] = useState<Record<string, TemplateContent>>({})
  const [editingKey, setEditingKey]   = useState<string | null>(null)
  const [previewKey, setPreviewKey]   = useState<string | null>(null)

  // Hydrate email settings + template overrides from workspace_settings.
  useEffect(() => {
    getWorkspaceSettings().then(({ settings: s, unavailable }) => {
      if (unavailable) setUnavailable(true)
      if (s) {
        if (typeof s.email_from === "string") setFromEmail(s.email_from)
        if (typeof s.email_reply_to === "string") setReplyTo(s.email_reply_to)
        if (typeof s.email_support === "string") setSupportEmail(s.email_support)
        const tpl = s.email_templates
        if (tpl && typeof tpl === "object" && !Array.isArray(tpl)) {
          setSavedTemplates(tpl as Record<string, TemplateContent>)
        }
      }
    })
  }, [])

  async function saveTemplate(key: string, content: TemplateContent): Promise<{ ok: boolean; error?: string }> {
    // Merge this template into the existing email_templates map and persist into
    // the `mail` jsonb bucket alongside the email address settings.
    const nextTemplates = { ...savedTemplates, [key]: content }
    const res = await saveWorkspaceSettings({ email_templates: nextTemplates }, "mail")
    if (res.unavailable) {
      setUnavailable(true)
      return { ok: false, error: "Settings storage is not configured yet — template can't be saved." }
    }
    if (!res.ok) return { ok: false, error: res.error ?? "Failed to save template." }
    setSavedTemplates(nextTemplates)
    showToast("Template saved")
    return { ok: true }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSaveSettings() {
    setSaving(true)
    const res = await saveWorkspaceSettings(
      {
        email_from: fromEmail,
        email_reply_to: replyTo,
        email_support: supportEmail,
      },
      "mail"
    )
    setSaving(false)
    if (res.unavailable) {
      setUnavailable(true)
      showToast("Settings storage is not configured yet — changes can't be saved.")
      return
    }
    if (!res.ok) {
      showToast(res.error ?? "Failed to save email settings.")
      return
    }
    setIsDirty(false)
    showToast("Email settings saved")
  }

  function handleSendTest() {
    // Email delivery requires the Resend/SMTP integration, which is not yet
    // configured — be honest rather than faking a successful send.
    if (!testEmail) return
    showToast("Connect an email provider (Resend or SMTP) to send test emails.")
  }

  const customisedCount = TEMPLATES.filter((t) => t.editable && savedTemplates[t.key]).length

  function handleEdit(template: EmailTemplate) {
    if (!template.editable) {
      showToast("This template cannot be edited")
      return
    }
    if (unavailable) {
      showToast("Settings storage is not configured yet — templates can't be saved.")
      return
    }
    setEditingKey(template.key)
  }

  return (
    <div className="relative pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Email & SMTP</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Configure email delivery providers and manage email templates
        </p>
      </div>

      {unavailable && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Mail className="w-4 h-4 mt-0.5 shrink-0" />
          Settings storage is not provisioned in this environment yet, so email addresses can&apos;t be persisted until the <code className="font-mono">workspace_settings</code> table exists.
        </div>
      )}

      {/* Email provider status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { name: "Resend",  status: "not_configured", desc: "Managed email API" },
          { name: "SMTP",    status: "not_configured", desc: "Custom SMTP server" },
        ].map((provider) => (
          <div key={provider.name} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[14px] font-bold text-slate-900">{provider.name}</p>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                Not configured
              </span>
            </div>
            <p className="text-[12px] text-slate-500 mb-4">{provider.desc}</p>
            <button className="w-full py-2 rounded-xl border border-[#2563EB] text-[#2563EB] text-[12.5px] font-semibold hover:bg-blue-50 transition-colors">
              Configure {provider.name}
            </button>
          </div>
        ))}
      </div>

      {/* Email settings form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-5">Email Settings</h3>
        <div className="grid grid-cols-1 gap-4 mb-5">
          {[
            { label: "From Email", value: fromEmail, setter: setFromEmail, placeholder: "noreply@yourcompany.com" },
            { label: "Reply-To Email", value: replyTo, setter: setReplyTo, placeholder: "hello@yourcompany.com" },
            { label: "Support Email", value: supportEmail, setter: setSupportEmail, placeholder: "support@yourcompany.com" },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label htmlFor={`email-${label.replace(/\s+/g, "-").toLowerCase()}`} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
              <input
                id={`email-${label.replace(/\s+/g, "-").toLowerCase()}`}
                type="email"
                value={value}
                placeholder={placeholder}
                onChange={(e) => { setter(e.target.value); setIsDirty(true) }}
                className="w-full max-w-[420px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] transition-all"
              />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-slate-100">
          <label htmlFor="email-send-test" className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Send test email</label>
          <div className="flex items-center gap-3">
            <input
              id="email-send-test"
              type="email"
              value={testEmail}
              placeholder="your@email.com"
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full max-w-[300px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] transition-all"
            />
            <button
              onClick={handleSendTest}
              disabled={!testEmail}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold transition-colors bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              Send test
            </button>
          </div>
        </div>
        {isDirty && !unavailable && (
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : "Save settings"}
            </button>
            <button
              onClick={() => setIsDirty(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Email templates */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">Email Templates</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {customisedCount > 0 ? `${customisedCount} customised` : "Using defaults"} · {TEMPLATES.length} templates
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          {TEMPLATES.map((template) => {
            const customised = template.editable && !!savedTemplates[template.key]
            const content = savedTemplates[template.key] ?? template.default
            const expanded = expandedTemplate === template.key
            return (
              <div
                key={template.key}
                className={cn(
                  "rounded-2xl border bg-white overflow-hidden transition-all",
                  expanded ? "border-[#2563EB] shadow-sm sm:col-span-2" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                )}
              >
                <button
                  onClick={() => setExpandedTemplate(expanded ? null : template.key)}
                  className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      customised ? "bg-emerald-50" : template.editable ? "bg-blue-50" : "bg-slate-100"
                    )}>
                      <Mail className={cn("w-4 h-4", customised ? "text-emerald-600" : template.editable ? "text-[#2563EB]" : "text-slate-400")} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-slate-800">{template.name}</span>
                        {!template.editable ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">System</span>
                        ) : customised ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Customised
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Default</span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-slate-400 mt-0.5 truncate">
                        {(content.subject || (template.editable ? "No subject" : "System-managed"))}
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-400 shrink-0 mt-1">
                    {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/60">
                    <p className="text-[12px] text-slate-500 my-3">
                      {template.editable
                        ? "Customise the subject line and body of this template."
                        : "This is a system template and cannot be edited for security reasons."}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        disabled={!template.editable}
                        className={cn(
                          "flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px] font-semibold transition-colors",
                          template.editable
                            ? "border-[#2563EB] text-white bg-[#2563EB] hover:bg-[#1d4ed8]"
                            : "border-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit template
                      </button>
                      <button
                        onClick={() => setPreviewKey(previewKey === template.key ? null : template.key)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {previewKey === template.key ? "Hide preview" : "Preview"}
                      </button>
                    </div>
                    {previewKey === template.key && (
                      // Email-style device frame preview
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden max-w-md">
                        <div className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border-b border-slate-200">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <span className="ml-2 text-[10px] font-medium text-slate-400">Email preview</span>
                        </div>
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Subject</p>
                          <p className="text-[13px] font-semibold text-slate-800 mt-0.5">
                            {content.subject || "(no subject)"}
                          </p>
                        </div>
                        <div className="px-4 py-4">
                          <p className="text-[12.5px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {content.body || "(empty body)"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Template editor */}
      {editingKey && (() => {
        const t = TEMPLATES.find((x) => x.key === editingKey)
        if (!t) return null
        const def: TemplateDef = { key: t.key, name: t.name, tokens: t.tokens, default: t.default }
        return (
          <TemplateEditor
            def={def}
            initial={savedTemplates[t.key] ?? null}
            onClose={() => setEditingKey(null)}
            onSave={(content) => saveTemplate(t.key, content)}
          />
        )
      })()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-[13px] font-medium px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
