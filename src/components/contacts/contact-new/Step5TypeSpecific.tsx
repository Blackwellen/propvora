"use client"

import React from "react"
import type { WizardState } from "./types"
import { InputField, TextareaField, SelectField, ToggleSwitch, ChipGrid, GroupedChipGrid } from "./FormPrimitives"
import { SUPPLIER_CATEGORY_GROUPS } from "@/lib/constants/supplierCategories"
import { ENQUIRY_SOURCES, PREFERRED_PROPERTY_TYPES } from "./constants"

export default function Step5TypeSpecific({
  state,
  setState,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
}) {
  const ct = state.contactType

  if (ct === "supplier") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Supplier Details</h2>
          <p className="text-sm text-slate-500">Scope and rates for this supplier or contractor.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Service Categories</label>
          <GroupedChipGrid
            groups={SUPPLIER_CATEGORY_GROUPS}
            selected={state.supplierServices}
            onChange={(v) => setState((s) => ({ ...s, supplierServices: v }))}
          />
        </div>

        <InputField
          label="Coverage Postcodes"
          value={state.coveragePostcodes}
          onChange={(v) => setState((s) => ({ ...s, coveragePostcodes: v }))}
          placeholder="SW1, E1, N1 (comma-separated)"
          hint="Enter postcodes this supplier covers"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Hourly Rate"
            value={state.hourlyRate}
            onChange={(v) => setState((s) => ({ ...s, hourlyRate: v }))}
            placeholder="0.00"
            prefix="£"
            type="number"
          />
          <InputField
            label="Callout Fee"
            value={state.calloutFee}
            onChange={(v) => setState((s) => ({ ...s, calloutFee: v }))}
            placeholder="0.00"
            prefix="£"
            type="number"
          />
        </div>

        <InputField
          label="Insurance Expiry Date"
          value={state.insuranceExpiry}
          onChange={(v) => setState((s) => ({ ...s, insuranceExpiry: v }))}
          type="date"
        />

        <div className="space-y-3">
          <ToggleSwitch
            label="Available for Emergencies"
            checked={state.emergencyAvailable}
            onChange={(v) => setState((s) => ({ ...s, emergencyAvailable: v }))}
            description="This supplier can be called out for urgent jobs"
          />
          <ToggleSwitch
            label="Mark as Preferred Supplier"
            checked={state.preferredSupplier}
            onChange={(v) => setState((s) => ({ ...s, preferredSupplier: v }))}
            description="Pin to top of supplier search results"
          />
        </div>
      </div>
    )
  }

  if (ct === "applicant") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Applicant Details</h2>
          <p className="text-sm text-slate-500">Track this applicant&apos;s requirements and source.</p>
        </div>

        <SelectField
          label="Enquiry Source"
          value={state.enquirySource}
          onChange={(v) => setState((s) => ({ ...s, enquirySource: v }))}
          options={ENQUIRY_SOURCES.map((x) => ({ value: x, label: x }))}
          placeholder="Select source…"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Budget Min (£/mo)"
            value={state.budgetMin}
            onChange={(v) => setState((s) => ({ ...s, budgetMin: v }))}
            prefix="£"
            type="number"
            placeholder="0"
          />
          <InputField
            label="Budget Max (£/mo)"
            value={state.budgetMax}
            onChange={(v) => setState((s) => ({ ...s, budgetMax: v }))}
            prefix="£"
            type="number"
            placeholder="0"
          />
        </div>

        <InputField
          label="Desired Move Date"
          value={state.desiredMoveDate}
          onChange={(v) => setState((s) => ({ ...s, desiredMoveDate: v }))}
          type="date"
        />

        <InputField
          label="Preferred Area"
          value={state.preferredArea}
          onChange={(v) => setState((s) => ({ ...s, preferredArea: v }))}
          placeholder="e.g. East London, Manchester City Centre"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Preferred Property Types</label>
          <ChipGrid
            options={PREFERRED_PROPERTY_TYPES}
            selected={state.preferredPropertyTypes}
            onChange={(v) => setState((s) => ({ ...s, preferredPropertyTypes: v }))}
          />
        </div>

        <TextareaField
          label="Requirements Notes"
          value={state.applicantNotes}
          onChange={(v) => setState((s) => ({ ...s, applicantNotes: v }))}
          placeholder="Any specific requirements or preferences…"
        />
      </div>
    )
  }

  if (ct === "tenant") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Tenant Details</h2>
          <p className="text-sm text-slate-500">Rental and occupancy information for this tenant.</p>
        </div>

        <InputField
          label="Current Rent (£/mo)"
          value={state.currentRent}
          onChange={(v) => setState((s) => ({ ...s, currentRent: v }))}
          prefix="£"
          type="number"
          placeholder="0"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Move-in Date"
            value={state.moveInDate}
            onChange={(v) => setState((s) => ({ ...s, moveInDate: v }))}
            type="date"
          />
          <InputField
            label="Move-out Date"
            value={state.moveOutDate}
            onChange={(v) => setState((s) => ({ ...s, moveOutDate: v }))}
            type="date"
          />
        </div>

        <InputField
          label="Number of Occupants"
          value={state.numOccupants}
          onChange={(v) => setState((s) => ({ ...s, numOccupants: v }))}
          type="number"
          placeholder="1"
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Emergency Contact Name"
            value={state.emergencyContactName}
            onChange={(v) => setState((s) => ({ ...s, emergencyContactName: v }))}
            placeholder="Full name"
          />
          <InputField
            label="Emergency Contact Phone"
            value={state.emergencyContactPhone}
            onChange={(v) => setState((s) => ({ ...s, emergencyContactPhone: v }))}
            placeholder="+44 7700 900000"
            type="tel"
          />
        </div>
      </div>
    )
  }

  if (ct === "landlord") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Landlord Details</h2>
          <p className="text-sm text-slate-500">Management preferences for this landlord.</p>
        </div>

        <SelectField
          label="Preferred Communication"
          value={state.landlordPreferredComms}
          onChange={(v) => setState((s) => ({ ...s, landlordPreferredComms: v }))}
          options={["Email", "Phone", "WhatsApp", "Post", "Any"].map((x) => ({ value: x, label: x }))}
          placeholder="Select preference…"
        />

        <TextareaField
          label="Responsibility Notes"
          value={state.responsibilityNotes}
          onChange={(v) => setState((s) => ({ ...s, responsibilityNotes: v }))}
          placeholder="e.g. Handles all minor maintenance under £200"
        />

        <InputField
          label="Number of Properties Owned"
          value={state.numPropertiesOwned}
          onChange={(v) => setState((s) => ({ ...s, numPropertiesOwned: v }))}
          placeholder="e.g. 3"
        />

        <ToggleSwitch
          label="Interested in Planning / Rent-to-Rent"
          checked={state.interestedInPlanning}
          onChange={(v) => setState((s) => ({ ...s, interestedInPlanning: v }))}
          description="Flag this landlord for planning set opportunities"
        />
      </div>
    )
  }

  if (ct === "legal" || ct === "accountant" || ct === "insurer") {
    const typeLabel = ct === "legal" ? "Legal" : ct === "accountant" ? "Accountant" : "Insurer"
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{typeLabel} Details</h2>
          <p className="text-sm text-slate-500">Professional details for this contact.</p>
        </div>

        <InputField
          label="Service Type / Specialisation"
          value={state.serviceSpecialisation}
          onChange={(v) => setState((s) => ({ ...s, serviceSpecialisation: v }))}
          placeholder="e.g. Residential conveyancing, BTL tax returns"
        />

        <InputField
          label="Company Registration"
          value={state.companyRegistration}
          onChange={(v) => setState((s) => ({ ...s, companyRegistration: v }))}
          placeholder="Optional"
        />

        <InputField
          label="Professional Body / Registration Number"
          value={state.professionalBody}
          onChange={(v) => setState((s) => ({ ...s, professionalBody: v }))}
          placeholder="e.g. SRA, ICAEW, FCA"
        />

        <InputField
          label="Renewal / Review Date"
          value={state.renewalDate}
          onChange={(v) => setState((s) => ({ ...s, renewalDate: v }))}
          type="date"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Additional Details</h2>
        <p className="text-sm text-slate-500">Any extra information for this contact.</p>
      </div>
      <TextareaField
        label="Additional Notes"
        value={state.additionalNotes}
        onChange={(v) => setState((s) => ({ ...s, additionalNotes: v }))}
        placeholder="Any relevant information for this contact…"
        rows={5}
      />
    </div>
  )
}
