"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type AISettingKey =
  | "ai_enabled"
  | "ai_require_approval"
  | "ai_slash_commands"
  | "ai_file_analysis"
  | "ai_report_generation"
  | "ai_email_drafting"
  | "ai_action_execution"

export interface AISettings {
  ai_enabled: boolean
  ai_require_approval: boolean
  ai_slash_commands: boolean
  ai_file_analysis: boolean
  ai_report_generation: boolean
  ai_email_drafting: boolean
  ai_action_execution: boolean
}

const AI_TOGGLES: { key: AISettingKey; label: string; desc: string }[] = [
  { key: "ai_enabled",           label: "AI enabled",                      desc: "Master switch — disables all AI features workspace-wide"          },
  { key: "ai_require_approval",  label: "Require approval before actions", desc: "AI actions queue for human review before executing"               },
  { key: "ai_slash_commands",    label: "Slash commands enabled",          desc: "Allow /ai and /ask commands in forms and text areas"               },
  { key: "ai_file_analysis",     label: "File analysis enabled",           desc: "AI can read and summarise uploaded documents"                     },
  { key: "ai_report_generation", label: "Report generation enabled",       desc: "AI can generate property and portfolio reports"                   },
  { key: "ai_email_drafting",    label: "Email drafting enabled",          desc: "AI can draft emails and messages for team review"                 },
  { key: "ai_action_execution",  label: "Action execution enabled",        desc: "AI can execute approved actions (create records, send messages)"  },
]

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

export interface AiCopilotSectionProps {
  settings: AISettings
  loading: boolean
  onToggle: (key: AISettingKey) => void
}

export function AiCopilotSection({ settings, loading, onToggle }: AiCopilotSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">AI Policy</h3>
      <p className="text-[12px] text-slate-500 mb-4">
        Configure which AI capabilities are available. The Copilot reads these on every request.
      </p>
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
              onToggle={() => onToggle(t.key)}
              disabled={t.key !== "ai_enabled" && !settings.ai_enabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AiCopilotSection
