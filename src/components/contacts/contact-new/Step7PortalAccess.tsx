"use client"

import React from "react"
import { AlertCircle } from "lucide-react"
import type { WizardState } from "./types"
import { PORTAL_EXPIRY_OPTIONS } from "./types"
import { ToggleSwitch, SelectField, InputField } from "./FormPrimitives"

export default function Step7PortalAccess({
  state,
  setState,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
}) {
  const contactName =
    state.entityType === "organisation"
      ? state.organisationName || "This contact"
      : [state.firstName, state.preferredName || state.lastName].filter(Boolean).join(" ") || "This contact"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Portal Access</h2>
        <p className="text-sm text-slate-500">Optionally grant this contact a secure portal link.</p>
      </div>

      <ToggleSwitch
        label="Enable supplier portal access"
        checked={state.portalAccessEnabled}
        onChange={(v) => setState((s) => ({ ...s, portalAccessEnabled: v }))}
        description="Contact will receive a secure link to submit quotes, upload documents and respond to job requests"
      />

      {state.portalAccessEnabled && (
        <div className="space-y-4 rounded-xl border border-[var(--color-brand-100)] bg-[var(--brand-soft)]/40 p-4">
          <SelectField
            label="Link Expiry"
            value={state.portalExpiry}
            onChange={(v) => setState((s) => ({ ...s, portalExpiry: v }))}
            options={PORTAL_EXPIRY_OPTIONS}
          />

          {state.portalExpiry === "never" && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
              <div style={{ color: "var(--color-warning)" }}><AlertCircle className="w-4 h-4 mt-0.5" /></div>
              <p className="text-xs text-amber-700">
                Never-expiring links are a security risk. We recommend setting an expiry date.
              </p>
            </div>
          )}

          <InputField
            label="Send Link To (email)"
            value={state.portalEmail || state.email}
            onChange={(v) => setState((s) => ({ ...s, portalEmail: v }))}
            type="email"
            placeholder="contact@example.com"
          />

          <div className="rounded-lg bg-white border border-[var(--color-brand-100)] px-3 py-2.5">
            <p className="text-xs text-slate-400 mb-1">Preview message</p>
            <p className="text-sm text-slate-600">
              {contactName} will receive a secure link to submit quotes, upload documents and respond to job requests.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
