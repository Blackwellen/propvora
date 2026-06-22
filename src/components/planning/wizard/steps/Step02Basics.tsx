"use client"

import React from "react"
import {
  MapPin,
  Check,
  Plus,
  Upload,
  FileText,
  X,
  Calendar as CalendarIcon,
  Copy,
} from "lucide-react"
import LocationMap from "@/components/maps/LocationMap"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import { getProfileByKey } from "@/lib/planning/profiles"

export default function Step02Basics() {
  const { state, update, setStep } = useWizard()
  const selectedProfile = getProfileByKey(state.profileKey)

  return (
    <div className="flex flex-col min-h-0 overflow-y-auto">
      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 mb-1">
              Opportunity Basics
            </h1>
            <p className="text-[13.5px] text-slate-500">
              Tell us about the opportunity you&apos;re evaluating.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              Import from listing
            </button>
            <button className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              Use property template
            </button>
          </div>
        </div>
      </div>

      {/* ── Section A: Opportunity Basics ──────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <h2 className="text-[15px] font-bold text-slate-900 mb-5">
          Opportunity Basics
        </h2>

        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Planning Set Name */}
          <div className="lg:col-span-2">
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Planning Set Name{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              value={state.setName}
              onChange={(e) => update({ setName: e.target.value })}
              placeholder="HMO Conversion – Maple St, Leeds"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]/50 transition-all"
            />
          </div>

          {/* Property / Opportunity Type */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Property / Opportunity Type{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={state.opportunityType}
              onChange={(e) => update({ opportunityType: e.target.value })}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer"
            >
              {[
                "HMO (Multiple Occupancy)",
                "Single Let",
                "Serviced Accommodation",
                "Holiday Let",
                "Rent-to-Rent",
                "Commercial",
                "Mixed Use",
                "Development",
              ].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Opportunity Source */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Opportunity Source
            </label>
            <select
              value={state.opportunitySource}
              onChange={(e) => update({ opportunitySource: e.target.value })}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none cursor-pointer"
            >
              {[
                "Rightmove",
                "Zoopla",
                "OnTheMarket",
                "Direct Approach",
                "Agent",
                "Auction",
                "Referral",
                "Other",
              ].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Target Strategy / Profile */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Target Strategy / Profile{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 min-w-0">
                {selectedProfile && (
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                    style={{ backgroundColor: selectedProfile.colour }}
                  >
                    {selectedProfile.label.charAt(0)}
                  </div>
                )}
                <span className="text-[13px] font-semibold text-slate-800 truncate">
                  {selectedProfile?.label ?? "Select profile"}
                </span>
              </div>
              <button
                onClick={() => setStep(1)}
                className="h-10 px-3 rounded-xl border border-slate-200 text-[12.5px] font-semibold text-[#7C3AED] hover:bg-violet-50 transition-colors whitespace-nowrap"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
          {/* Status */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Status
            </label>
            <select
              value={state.status}
              onChange={(e) => update({ status: e.target.value })}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none cursor-pointer"
            >
              {["Active", "On Hold", "Draft", "Archived"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Lead Owner */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Lead Owner <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 bg-white">
              <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                JS
              </div>
              <input
                value={state.leadOwner || "Jessica Smith"}
                onChange={(e) => update({ leadOwner: e.target.value })}
                className="flex-1 bg-transparent text-[13px] text-slate-900 focus:outline-none min-w-0"
              />
            </div>
          </div>

          {/* Co-owner */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Co-Owner / Team (optional)
            </label>
            <button className="w-full h-10 px-3 rounded-xl border border-dashed border-slate-300 text-[13px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              Add team member
            </button>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Visibility
            </label>
            <select
              value={state.visibility}
              onChange={(e) => update({ visibility: e.target.value })}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none cursor-pointer"
            >
              {["Private – Only me", "Team", "Workspace"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Tags
            </label>
            <div className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 overflow-hidden">
              {(state.tags.length > 0
                ? state.tags
                : ["Leeds", "Conversion", "Q3 2025"]
              ).map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg shrink-0"
                >
                  {tag}
                  <button
                    onClick={() =>
                      update({ tags: state.tags.filter((t) => t !== tag) })
                    }
                    className="text-slate-400 hover:text-red-500 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section B: Location Context ─────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-slate-100">
        <h2 className="text-[15px] font-bold text-slate-900 mb-1.5">
          Location Context
        </h2>
        <p className="text-[12.5px] text-slate-400 mb-5">
          Where is the property and what&apos;s the local context?
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Address fields column */}
          <div className="flex flex-col gap-4">
            {/* Address autocomplete */}
            <div>
              <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                Property Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={state.address}
                  onChange={(e) => update({ address: e.target.value })}
                  placeholder="Start typing address..."
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]/50"
                />
              </div>
              {/* Confirmed address row */}
              {state.address && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[12.5px] text-emerald-700 flex-1">
                    {state.address},{" "}
                    {state.city || "Leeds"},{" "}
                    {state.postcode || "LS6 2AH"}, United Kingdom
                  </span>
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Postcode / City / Region */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                  Postcode
                </label>
                <div className="flex items-center gap-1">
                  <input
                    value={state.postcode}
                    onChange={(e) => update({ postcode: e.target.value })}
                    placeholder="LS6 2AH"
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 min-w-0"
                  />
                  <button className="h-10 px-2.5 rounded-xl border border-slate-200 text-[12px] font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors whitespace-nowrap">
                    Lookup
                  </button>
                </div>
                {state.postcode && (
                  <p className="text-[10.5px] text-emerald-600 font-semibold mt-1">
                    Verified
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                  City
                </label>
                <input
                  value={state.city}
                  onChange={(e) => update({ city: e.target.value })}
                  placeholder="Leeds"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                  Region
                </label>
                <input
                  value={state.region}
                  onChange={(e) => update({ region: e.target.value })}
                  placeholder="West Yorkshire"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
            </div>
          </div>

          {/* Live location map — geocodes the address once both address + postcode are set */}
          <LocationMap
            markers={[{
              id: "pin",
              address: state.address && state.postcode ? `${state.address}, ${state.postcode}` : null,
              label: state.address || "Location",
              sublabel: state.postcode || undefined,
            }]}
            height={180}
          />
        </div>
      </div>

      {/* ── Section C: Property Details ─────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-[15px] font-bold text-slate-900 mb-1.5">
          Property Details
        </h2>
        <p className="text-[12.5px] text-slate-400 mb-5">
          Key property characteristics and financial snapshot.
        </p>

        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Property Type */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Property Type <span className="text-red-500">*</span>
            </label>
            <select
              value={state.propertyType}
              onChange={(e) => update({ propertyType: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none cursor-pointer"
            >
              {[
                "Terraced House",
                "Semi-Detached",
                "Detached",
                "Flat / Apartment",
                "Bungalow",
                "HMO Purpose-Built",
                "Commercial Unit",
                "Mixed Use",
                "Land",
                "Other",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Tenure */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Tenure <span className="text-red-500">*</span>
            </label>
            <select
              value={state.tenure}
              onChange={(e) => update({ tenure: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none cursor-pointer"
            >
              {[
                "Freehold",
                "Leasehold",
                "Share of Freehold",
                "Commonhold",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Current Occupancy */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Current Occupancy <span className="text-red-500">*</span>
            </label>
            <select
              value={state.currentOccupancy}
              onChange={(e) => update({ currentOccupancy: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none cursor-pointer"
            >
              {[
                "Vacant",
                "Tenanted",
                "Owner-Occupied",
                "Partial",
                "Commercial Use",
              ].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Number of Units / Rooms */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Number of Units / Rooms <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 h-10">
              <button
                onClick={() =>
                  update({ numUnits: Math.max(1, state.numUnits - 1) })
                }
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shrink-0 text-lg font-semibold"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={state.numUnits}
                onChange={(e) =>
                  update({ numUnits: Number(e.target.value) })
                }
                className="flex-1 h-10 text-center rounded-xl border border-slate-200 text-[15px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
              />
              <button
                onClick={() => update({ numUnits: state.numUnits + 1 })}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shrink-0 text-lg font-semibold"
              >
                +
              </button>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-1">
              Bedrooms / letting rooms
            </p>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Asking Price */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Asking Price / Property Value{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400">
                £
              </span>
              <input
                type="number"
                min={0}
                value={state.propertyValue || ""}
                onChange={(e) =>
                  update({ propertyValue: Number(e.target.value) })
                }
                placeholder="650000"
                className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          {/* Valuation Method */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Valuation Method
            </label>
            <select
              value={state.valuationMethod}
              onChange={(e) => update({ valuationMethod: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none cursor-pointer"
            >
              {[
                "Comparable Sales",
                "RICS Valuation",
                "Estate Agent Estimate",
                "Online Tool",
                "Auction Guide Price",
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Valuation Date */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Valuation Date
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={state.valuationDate}
                onChange={(e) => update({ valuationDate: e.target.value })}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Currency
            </label>
            <select className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 focus:outline-none cursor-pointer">
              <option>GBP (£)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
            </select>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Intended Start Date */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Intended Start Date
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={state.intendedStartDate}
                onChange={(e) =>
                  update({ intendedStartDate: e.target.value })
                }
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          {/* Expected Decision Date */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Expected Decision Date{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={state.expectedDecisionDate}
                onChange={(e) =>
                  update({ expectedDecisionDate: e.target.value })
                }
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
              />
            </div>
          </div>

          {/* Target Monthly Net Cashflow */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Target Monthly Net Cashflow{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] font-medium">
                  £
                </span>
                <input
                  type="number"
                  min={0}
                  value={state.targetMonthlyCashflow || ""}
                  onChange={(e) =>
                    update({ targetMonthlyCashflow: Number(e.target.value) })
                  }
                  placeholder="3000"
                  className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-[13px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
                />
              </div>
              <span className="text-[12.5px] text-slate-400 shrink-0">
                / month
              </span>
            </div>
          </div>
        </div>

        {/* Notes + Attachments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Notes */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Notes / Context (optional)
            </label>
            <textarea
              value={state.notes}
              onChange={(e) => update({ notes: e.target.value })}
              rows={4}
              maxLength={1000}
              placeholder="Full refurbishment and HMO conversion. Targeting professional tenants. Scope includes loft conversion and rear extension."
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-[13px] text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-right">
              {state.notes.length} / 1000
            </p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              Attachments
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-[#7C3AED]/40 hover:bg-violet-50/30 transition-all cursor-pointer">
              <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-[12.5px] font-medium text-slate-500 mb-0.5">
                Drag files here or click to upload
              </p>
              <p className="text-[11px] text-slate-400">
                PDF, Excel, Images (max 10MB)
              </p>
              <button className="mt-3 h-8 px-4 rounded-lg bg-white border border-slate-200 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Choose files
              </button>
            </div>
            {/* Example attachment row */}
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <FileText className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[12.5px] font-medium text-slate-700 flex-1">
                Floorplan-Existing.pdf
              </span>
              <span className="text-[11px] text-slate-400">2.3 MB</span>
              <button className="text-slate-300 hover:text-red-500 transition-colors ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
