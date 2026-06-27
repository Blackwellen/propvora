"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Check, Loader2, Info } from "lucide-react"
import { getWorkspaceSettings, saveWorkspaceSettings } from "@/lib/actions/settings"
import { CopilotCreditsPanel, CopilotAutonomyPanel, CopilotMemoryPanel } from "@/features/copilot/components/CopilotSettingsPanels"

interface AISettings {
  ai_enabled: boolean
  ai_require_approval: boolean
  ai_slash_commands: boolean
  ai_file_analysis: boolean
  ai_report_generation: boolean
  ai_email_drafting: boolean
  ai_action_execution: boolean
}

const DEFAULTS: AISettings = {
  ai_enabled: true,
  ai_require_approval: true,
  ai_slash_commands: true,
  ai_file_analysis: true,
  ai_report_generation: true,
  ai_email_drafting: true,
  ai_action_execution: true,
}

type AISettingKey = keyof AISettings

function ToggleRow({
  label, desc, enabled, onToggle, disabled = false,
}: { label: string; desc: string; enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className={cn("text-[13px] font-medium", disabled ? "text-slate-400" : "text-slate-800")}>{label}</p>
        <p className="text-[11.5px] text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        aria-pressed={enabled}
        className={cn(
          "w-10 h-6 rounded-full transition-colors shrink-0 relative",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          enabled ? "bg-[var(--brand)]" : "bg-slate-200"
        )}
      >
        <span className={cn(
          "absolute top-1 block w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-5" : "translate-x-1"
        )} />
      </button>
    </div>
  )
}

export default function AIPage() {
  const [settings, setSettings] = useState<AISettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    getWorkspaceSettings().then(({ settings: s, unavailable }) => {
      if (unavailable) setUnavailable(true)
      if (s) {
        setSettings((prev) => ({
          ...prev,
          ...Object.fromEntries(
            (Object.keys(DEFAULTS) as AISettingKey[])
              .filter((k) => typeof s[k] === "boolean")
              .map((k) => [k, s[k] as boolean])
          ),
        }))
      }
      setLoading(false)
    })
  }, [])

  const toggle = (key: AISettingKey) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    setIsDirty(true)
    setSaved(false)
    setSaveError(null)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const res = await saveWorkspaceSettings(settings as unknown as Record<string, unknown>)
    setSaving(false)
    if (res.unavailable) {
      setUnavailable(true)
      setSaveError("Settings storage is not configured yet — changes can't be persisted.")
      return
    }
    if (!res.ok) {
      setSaveError(res.error ?? "Failed to save AI settings.")
      return
    }
    setSaved(true)
    setIsDirty(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const AI_TOGGLES: { key: AISettingKey; label: string; desc: string }[] = [
    { key: "ai_enabled",           label: "AI enabled",                       desc: "Master switch — disables all AI features workspace-wide" },
    { key: "ai_require_approval",  label: "Require approval before actions",  desc: "AI actions queue for human review before executing" },
    { key: "ai_slash_commands",    label: "Slash commands enabled",           desc: "Allow /ai and /ask commands in forms and text areas" },
    { key: "ai_file_analysis",     label: "File analysis enabled",            desc: "AI can read and summarise uploaded documents" },
    { key: "ai_report_generation", label: "Report generation enabled",        desc: "AI can generate property and portfolio reports" },
    { key: "ai_email_drafting",    label: "Email drafting enabled",           desc: "AI can draft emails and messages for team review" },
    { key: "ai_action_execution",  label: "Action execution enabled",         desc: "AI can execute approved actions (create records, send messages)" },
  ]

  return (
    <div className="relative pb-20">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">AI Settings</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Control which AI features are active across your workspace. These switches are read by the Copilot and automation engines.</p>
      </div>

      {unavailable && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          AI settings storage is not provisioned in this environment yet. Toggles below show defaults and can&apos;t be persisted until the <code className="font-mono">workspace_settings</code> table exists.
        </div>
      )}

      {/* AI policy toggles — these GATE behaviour */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">AI Policy</h3>
        <p className="text-[12px] text-slate-500 mb-4">Configure which AI capabilities are available. The Copilot reads these on every request.</p>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        ) : (
          <div>
            {AI_TOGGLES.map((t) => (
              <ToggleRow
                key={t.key}
                label={t.label}
                desc={t.desc}
                enabled={settings[t.key]}
                onToggle={() => toggle(t.key)}
                disabled={t.key !== "ai_enabled" && !settings.ai_enabled}
              />
            ))}
          </div>
        )}
      </div>

      {/* Real Copilot panels: live credits, 7-level autonomy, and memory. */}
      <CopilotCreditsPanel />
      <CopilotAutonomyPanel />
      <CopilotMemoryPanel />

      {/* Sticky save bar */}
      {isDirty && !unavailable && (
        <div className="app-save-bar fixed left-0 right-0 bg-white border-t border-slate-200 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-[13px] text-slate-600">You have unsaved changes</p>
            {saveError && <p className="text-[12px] text-red-500 mt-0.5">{saveError}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIsDirty(false); setSaved(false); setSaveError(null) }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
