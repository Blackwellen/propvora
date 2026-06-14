"use client"

import React, { useState, useEffect } from "react"
import { Mail, ChevronDown, ChevronRight, Send, Eye, Edit2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getWorkspaceSettings, saveWorkspaceSettings } from "@/lib/actions/settings"

interface EmailTemplate {
  key: string
  name: string
  editable: boolean
}

const TEMPLATES: EmailTemplate[] = [
  { key: "welcome",      name: "Welcome Email",         editable: true },
  { key: "invite",       name: "Team Invite",           editable: true },
  { key: "arrears",      name: "Arrears Chase",         editable: true },
  { key: "compliance",   name: "Compliance Reminder",   editable: true },
  { key: "invoice",      name: "Invoice Notification",  editable: true },
  { key: "supplier",     name: "Supplier Request",      editable: true },
  { key: "portal-reply", name: "Supplier Portal Reply", editable: true },
  { key: "magic-link",   name: "Magic Link Login",      editable: false },
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

  // Hydrate email settings from workspace_settings.
  useEffect(() => {
    getWorkspaceSettings().then(({ settings: s, unavailable }) => {
      if (unavailable) setUnavailable(true)
      if (s) {
        if (typeof s.email_from === "string") setFromEmail(s.email_from)
        if (typeof s.email_reply_to === "string") setReplyTo(s.email_reply_to)
        if (typeof s.email_support === "string") setSupportEmail(s.email_support)
      }
    })
  }, [])

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

  function handleEdit(template: EmailTemplate) {
    if (!template.editable) {
      showToast("This template cannot be edited")
      return
    }
    showToast("Template editor coming soon")
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
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
              <input
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
          <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">Send test email</label>
          <div className="flex items-center gap-3">
            <input
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
        <div className="flex items-center gap-3 mb-5">
          <div style={{ color: "#2563EB" }}>
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900">Email Templates</h3>
        </div>
        <div className="space-y-1">
          {TEMPLATES.map((template) => (
            <div key={template.key} className="border border-slate-100 rounded-xl overflow-hidden">
              <button
                onClick={() =>
                  setExpandedTemplate(expandedTemplate === template.key ? null : template.key)
                }
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div style={{ color: "#2563EB" }}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-800">{template.name}</span>
                  {!template.editable && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      System
                    </span>
                  )}
                </div>
                <div style={{ color: "#64748B" }}>
                  {expandedTemplate === template.key ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              </button>
              {expandedTemplate === template.key && (
                <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
                  <p className="text-[12px] text-slate-500 mb-3">
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
                          ? "border-[#2563EB] text-[#2563EB] hover:bg-blue-50"
                          : "border-slate-200 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit template
                    </button>
                    <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-[13px] font-medium px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
