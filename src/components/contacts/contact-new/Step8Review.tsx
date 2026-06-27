"use client"

import React from "react"
import { Pencil } from "lucide-react"
import type { WizardState } from "./types"
import { PORTAL_EXPIRY_OPTIONS } from "./types"
import { CONTACT_TYPE_OPTIONS } from "./constants"
import { buildTypeDetails } from "@/lib/contacts/metadata"

const PRETTY: Record<string, string> = {
  service_categories: "Service Categories", coverage_postcodes: "Coverage",
  hourly_rate: "Hourly Rate (£)", callout_fee: "Callout Fee (£)",
  emergency_available: "Emergency Available", preferred_supplier: "Preferred Supplier",
  insurance_expiry: "Insurance Expiry", source: "Enquiry Source",
  budget_min: "Budget Min (£)", budget_max: "Budget Max (£)", move_date: "Desired Move Date",
  preferred_area: "Preferred Area", preferred_property_types: "Property Types", notes: "Notes",
  current_rent: "Current Rent (£)", move_in_date: "Move-in Date", move_out_date: "Move-out Date",
  num_occupants: "Occupants", emergency_contact_name: "Emergency Contact",
  emergency_contact_phone: "Emergency Phone", preferred_comms: "Preferred Comms",
  responsibility_notes: "Responsibility Notes", num_properties_owned: "Properties Owned",
  interested_in_planning: "Interested in Planning", specialisation: "Specialisation",
  company_registration: "Company Registration", professional_body: "Professional Body",
  renewal_date: "Renewal / Review Date",
}

function Section({
  title,
  step,
  onJumpTo,
  children,
}: {
  title: string
  step: number
  onJumpTo: (step: number) => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <button
          type="button"
          onClick={() => onJumpTo(step)}
          className="flex items-center gap-1 text-xs text-[var(--brand)] hover:underline"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-400 min-w-[130px] flex-shrink-0">{label}</span>
      <span className="text-slate-800 break-all">{value}</span>
    </div>
  )
}

export default function Step8Review({
  state,
  onJumpTo,
}: {
  state: WizardState
  onJumpTo: (step: number) => void
}) {
  const typeLabel = CONTACT_TYPE_OPTIONS.find((c) => c.value === state.contactType)?.label ?? state.contactType
  const displayName =
    state.entityType === "organisation"
      ? state.organisationName
      : [state.firstName, state.lastName].filter(Boolean).join(" ")

  const assembledAddress = [state.addressLine1, state.city, state.postcode, state.country]
    .filter(Boolean)
    .join(", ")

  const td = buildTypeDetails(state)
  const typeSpecificRows = td
    ? Object.entries(td)
        .filter(([k, v]) => k !== "kind" && v != null && v !== "")
        .map(([k, v]) => ({
          label: PRETTY[k] ?? k.replace(/_/g, " "),
          value: Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v),
        }))
    : []

  const attachedDocs = state.documents
    .filter((d) => d.file)
    .map((d) => ({ name: d.name, fileName: d.file!.name }))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Review & Create</h2>
        <p className="text-sm text-slate-500">Review the details below before creating the contact.</p>
      </div>

      <Section title="Contact Type" step={1} onJumpTo={onJumpTo}>
        <Row label="Type" value={typeLabel ?? undefined} />
        <Row label="Entity" value={state.entityType === "organisation" ? "Organisation" : "Person"} />
      </Section>

      <Section title="Details" step={2} onJumpTo={onJumpTo}>
        <Row label="Name" value={displayName} />
        {state.entityType === "person" && <Row label="Preferred Name" value={state.preferredName} />}
        {state.entityType === "organisation" && <Row label="Primary Contact" value={state.primaryContactName} />}
        <Row label="Notes" value={state.notes} />
        {state.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {state.tags.map((t) => (
              <span key={t.id} className="rounded-full bg-[var(--color-brand-100)] text-[var(--brand)] text-xs px-2 py-0.5">
                {t.label}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Communication" step={3} onJumpTo={onJumpTo}>
        <Row label="Email" value={state.email} />
        <Row label="Phone" value={state.phone} />
        <Row label="Secondary Phone" value={state.secondaryPhone} />
        <Row label="Website" value={state.website} />
        <Row label="Address" value={assembledAddress} />
        <Row label="Preferred Contact" value={state.preferredContact} />
      </Section>

      <Section title="Type-Specific" step={4} onJumpTo={onJumpTo}>
        {typeSpecificRows.length > 0 ? (
          typeSpecificRows.map((r) => <Row key={r.label} label={r.label} value={r.value} />)
        ) : (
          <p className="text-sm text-slate-400">No type-specific details added.</p>
        )}
      </Section>

      <Section title="Documents" step={5} onJumpTo={onJumpTo}>
        {attachedDocs.length > 0 ? (
          attachedDocs.map((d, i) => <Row key={i} label={d.name} value={d.fileName} />)
        ) : (
          <p className="text-sm text-slate-400">No documents attached. You can add them after saving.</p>
        )}
      </Section>

      <Section title="Portal Access" step={6} onJumpTo={onJumpTo}>
        <Row label="Portal Enabled" value={state.portalAccessEnabled ? "Yes" : "No"} />
        {state.portalAccessEnabled && (
          <Row
            label="Link Expiry"
            value={PORTAL_EXPIRY_OPTIONS.find((o) => o.value === state.portalExpiry)?.label}
          />
        )}
      </Section>
    </div>
  )
}
