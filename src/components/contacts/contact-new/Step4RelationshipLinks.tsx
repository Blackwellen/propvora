"use client"

import React from "react"
import { AlertCircle, Home, FileText, TrendingUp } from "lucide-react"
import type { WizardState } from "./types"

export default function Step4RelationshipLinks({
  state,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
}) {
  const showTenancy = ["tenant", "post_tenant", "guarantor"].includes(state.contactType ?? "")
  const showPlanning = ["landlord", "investor"].includes(state.contactType ?? "")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Relationship Links</h2>
        <p className="text-sm text-slate-500">Connect this contact to properties or records in your workspace.</p>
      </div>

      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 flex items-center gap-2">
        <div style={{ color: "var(--text-muted)" }}><AlertCircle className="w-4 h-4" /></div>
        <p className="text-xs text-slate-500">You can link records after saving too — no need to do it now.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Link to Properties</label>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 flex items-center gap-2">
          <Home className="w-4 h-4" />
          0 properties in demo workspace
        </div>
      </div>

      {showTenancy && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Link to Tenancy</label>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            0 tenancies in demo workspace
          </div>
        </div>
      )}

      {showPlanning && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Link to Planning Set</label>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            0 planning sets in demo workspace
          </div>
        </div>
      )}
    </div>
  )
}
