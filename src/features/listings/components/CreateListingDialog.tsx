"use client"

import { X, AlertTriangle } from "lucide-react"
import type { ListingType } from "@/lib/booking/booking-listings"

interface Property {
  id: string
  label: string
  city: string | null
}

interface CreateListingDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  pending: boolean
  title: string
  onTitleChange: (v: string) => void
  propertyId: string
  onPropertyIdChange: (v: string) => void
  listingType: ListingType
  onListingTypeChange: (v: ListingType) => void
  properties: Property[]
  error: string | null
}

export function CreateListingDialog({
  open,
  onClose,
  onSubmit,
  pending,
  title,
  onTitleChange,
  propertyId,
  onPropertyIdChange,
  listingType,
  onListingTypeChange,
  properties,
  error,
}: CreateListingDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">New booking listing</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Title</label>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Garden Studio — Central"
              className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Property (optional now, required to publish)
            </label>
            <select
              value={propertyId}
              onChange={(e) => onPropertyIdChange(e.target.value)}
              className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            >
              <option value="">Select later…</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {p.city ? ` — ${p.city}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Type</label>
            <select
              value={listingType}
              onChange={(e) => onListingTypeChange(e.target.value as ListingType)}
              className="w-full h-10 px-3 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
            >
              <option value="entire_home">Entire home</option>
              <option value="serviced_accommodation">Serviced accommodation</option>
              <option value="private_room">Private room</option>
              <option value="student_room">Student room</option>
              <option value="hmo_room">HMO room</option>
              <option value="unit">Unit</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && (
            <p className="text-[13px] text-red-600 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
          <button
            onClick={onSubmit}
            disabled={pending}
            className="flex-1 h-10 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)] disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create & set up"}
          </button>
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
