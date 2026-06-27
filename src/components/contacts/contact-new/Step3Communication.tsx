"use client"

import React from "react"
import { MapPin } from "lucide-react"
import type { WizardState, PreferredContact } from "./types"
import { InputField } from "./FormPrimitives"

export default function Step3Communication({
  state,
  setState,
  errors,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  errors: string[]
}) {
  const showWebsite =
    state.entityType === "organisation" ||
    state.contactType === "supplier" ||
    state.contactType === "legal" ||
    state.contactType === "accountant"

  const assembledAddress = [state.addressLine1, state.city, state.postcode, state.country]
    .filter(Boolean)
    .join(", ")

  const preferredOptions: { value: PreferredContact; label: string }[] = [
    { value: "email",    label: "Email" },
    { value: "phone",    label: "Phone" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "post",     label: "Post" },
  ]

  const errorFor = (field: string) => errors.find((e) => e.toLowerCase().startsWith(field.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Communication</h2>
        <p className="text-sm text-slate-500">How should you reach this contact?</p>
      </div>

      <InputField
        label="Email Address"
        value={state.email}
        onChange={(v) => setState((s) => ({ ...s, email: v }))}
        required
        type="email"
        placeholder="contact@example.com"
        error={errorFor("Email")}
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Primary Phone"
          value={state.phone}
          onChange={(v) => setState((s) => ({ ...s, phone: v }))}
          placeholder="+44 7700 900000"
          type="tel"
        />
        <InputField
          label="Secondary Phone"
          value={state.secondaryPhone}
          onChange={(v) => setState((s) => ({ ...s, secondaryPhone: v }))}
          placeholder="Optional"
          type="tel"
        />
      </div>

      {showWebsite && (
        <InputField
          label="Website"
          value={state.website}
          onChange={(v) => setState((s) => ({ ...s, website: v }))}
          placeholder="https://example.com"
          type="url"
        />
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Address</p>
        <InputField
          label="Address Line 1"
          value={state.addressLine1}
          onChange={(v) => setState((s) => ({ ...s, addressLine1: v }))}
          placeholder="Street address"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField
            label="City"
            value={state.city}
            onChange={(v) => setState((s) => ({ ...s, city: v }))}
            placeholder="London"
          />
          <InputField
            label="Postcode"
            value={state.postcode}
            onChange={(v) => setState((s) => ({ ...s, postcode: v }))}
            placeholder="SW1A 1AA"
          />
          <InputField
            label="Country"
            value={state.country}
            onChange={(v) => setState((s) => ({ ...s, country: v }))}
            placeholder="United Kingdom"
          />
        </div>
      </div>

      {assembledAddress && (
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
          <div style={{ color: "var(--text-muted)" }}><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /></div>
          <p className="text-sm text-slate-600">{assembledAddress}</p>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Preferred Contact Method</p>
        <div className="flex gap-2 flex-wrap">
          {preferredOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setState((s) => ({ ...s, preferredContact: opt.value }))}
              className={[
                "px-4 py-1.5 rounded-full text-sm font-medium border transition",
                state.preferredContact === opt.value
                  ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                  : "border-slate-200 text-slate-600 hover:border-[var(--color-brand-300)]",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
