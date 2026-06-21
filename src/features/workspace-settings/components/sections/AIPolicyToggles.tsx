"use client"

import React from "react"
import { ToggleRow } from "./shared"

export interface AIPolicy {
  enabled: boolean
  allowDataProcessing: boolean
  allowContactSuggestions: boolean
  allowDocumentSummary: boolean
  allowRiskAnalysis: boolean
  allowAutomatedTasks: boolean
  shareAnonymisedData: boolean
}

export interface AIPolicyTogglesProps {
  policy: AIPolicy
  onToggle: (field: keyof AIPolicy) => void
}

const AI_TOGGLES: { field: keyof AIPolicy; label: string; description?: string }[] = [
  {
    field: "enabled",
    label: "Enable AI Copilot",
    description: "Master switch — disabling this turns off all AI features below",
  },
  {
    field: "allowDataProcessing",
    label: "Allow data processing",
    description: "AI can read workspace data to provide contextual suggestions",
  },
  {
    field: "allowContactSuggestions",
    label: "Contact suggestions",
    description: "AI can suggest contact actions based on conversation history",
  },
  {
    field: "allowDocumentSummary",
    label: "Document summarisation",
    description: "AI can summarise uploaded documents and reports",
  },
  {
    field: "allowRiskAnalysis",
    label: "Risk analysis",
    description: "AI can flag potential compliance and maintenance risks",
  },
  {
    field: "allowAutomatedTasks",
    label: "Automated task creation",
    description: "AI can automatically create tasks from issues and inspections",
  },
  {
    field: "shareAnonymisedData",
    label: "Share anonymised data",
    description: "Help improve the AI by sharing anonymised, aggregated usage data",
  },
]

export function AIPolicyToggles({ policy, onToggle }: AIPolicyTogglesProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">AI policy</h3>
      <p className="text-[12px] text-slate-400 mb-4">
        Control which AI features are active in this workspace
      </p>
      <div>
        {AI_TOGGLES.map(({ field, label, description }) => (
          <ToggleRow
            key={field}
            label={label}
            description={description}
            checked={policy[field]}
            onChange={() => onToggle(field)}
            disabled={field !== "enabled" && !policy.enabled}
          />
        ))}
      </div>
    </div>
  )
}
