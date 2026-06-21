"use client"

import React from "react"
import { InputField } from "./shared"

export interface EmailSettings {
  fromName: string
  fromEmail: string
  replyToEmail: string
  supportEmail: string
}

export interface EmailSettingsFormProps {
  settings: EmailSettings
  onUpdate: <K extends keyof EmailSettings>(field: K, value: string) => void
  onTestSend: () => void
  testing?: boolean
}

export function EmailSettingsForm({ settings, onUpdate, onTestSend, testing }: EmailSettingsFormProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-4">Email settings</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="From name"
          value={settings.fromName}
          onChange={(v) => onUpdate("fromName", v)}
          placeholder="Propvora"
        />
        <InputField
          label="From email"
          value={settings.fromEmail}
          onChange={(v) => onUpdate("fromEmail", v)}
          type="email"
          placeholder="noreply@example.com"
        />
        <InputField
          label="Reply-to email"
          value={settings.replyToEmail}
          onChange={(v) => onUpdate("replyToEmail", v)}
          type="email"
          placeholder="support@example.com"
        />
        <InputField
          label="Support email"
          value={settings.supportEmail}
          onChange={(v) => onUpdate("supportEmail", v)}
          type="email"
          placeholder="help@example.com"
        />
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={onTestSend}
          disabled={testing}
          className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          {testing ? "Sending test…" : "Send test email"}
        </button>
      </div>
    </div>
  )
}
