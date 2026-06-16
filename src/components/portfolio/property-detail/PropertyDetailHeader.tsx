"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useWorkspace } from "@/providers/AuthProvider"
import { useDeleteProperty, useUpdateProperty } from "@/hooks/useProperties"
import type { Property } from "@/types/database"
import { cn } from "@/lib/utils"
import {
  InlineEditField,
  InlineEditSelect,
} from "@/components/editing"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { getPropertyTypeOption } from "@/lib/constants/propertyTypes"
import { openCopilot } from "@/lib/copilot/open"
import {
  Building2, Home, Users, ChevronRight, ChevronLeft,
  Plus, MapPin, Archive, Trash2, Shield, Wrench, Sparkles,
} from "lucide-react"
import { StatusPill } from "./shared"

interface PropertyDetailHeaderProps {
  prop: Property
  propertyId: string
  onSave: (field: string, value: unknown) => Promise<void>
}

export function PropertyDetailHeader({ prop, propertyId, onSave }: PropertyDetailHeaderProps) {
  const router = useRouter()
  const { workspace } = useWorkspace()
  const deleteProperty = useDeleteProperty()

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-3">
        <Link href="/app/portfolio" className="hover:text-slate-700 transition-colors">Portfolio</Link>
        <ChevronRight size={12} className="text-slate-300" />
        <Link href="/app/portfolio/properties" className="hover:text-slate-700 transition-colors">Properties</Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-slate-800 font-medium">{prop.name}</span>
      </div>

      {/* Title row */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Property name */}
          <div className="flex items-center gap-2.5 group mb-1">
            <button
              onClick={() => router.back()}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors mr-1"
            >
              <ChevronLeft size={18} className="text-slate-500" />
            </button>
            <InlineEditField
              value={prop.name}
              onSave={(v) => onSave("name", v)}
              label="Property name"
              displayClassName="text-[22px] font-bold text-slate-900 leading-tight"
            />
            {/* Status pill + always-visible transition-safe editor (pen beside the pill). */}
            <span className="inline-flex items-center gap-1">
              <StatusPill status={prop.status} />
              <InlineEditSelect
                value={prop.status ?? "active"}
                onSave={(v) => onSave("status", v)}
                transition={(v) => onSave("status", v)}
                label="Status"
                options={[
                  { value: "active", label: "Active" },
                  { value: "vacant", label: "Void" },
                  { value: "under_works", label: "Off Market" },
                  { value: "archived", label: "Archived" },
                ]}
                displayClassName="sr-only"
              />
            </span>
          </div>

          {/* Address + ID */}
          <div className="flex items-center gap-3 ml-10 flex-wrap">
            <div className="flex items-center gap-1.5 text-[13px] text-slate-500 flex-wrap">
              <MapPin size={13} className="text-slate-400" />
              <InlineEditField
                value={prop.address_line1 ?? ""}
                onSave={(v) => onSave("address_line1", v)}
                label="Address line 1"
                placeholder="Add address"
                displayClassName="text-[13px] text-slate-500"
              />
              {prop.city && <span className="text-slate-400">,</span>}
              <InlineEditField
                value={prop.city ?? ""}
                onSave={(v) => onSave("city", v)}
                label="City"
                placeholder="City"
                displayClassName="text-[13px] text-slate-500"
              />
              <InlineEditField
                value={prop.postcode ?? ""}
                onSave={(v) => onSave("postcode", v)}
                label="Postcode"
                placeholder="Postcode"
                displayClassName="text-[13px] text-slate-500"
              />
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-[12px] text-slate-500 font-mono">{prop.id}</span>
          </div>

          {/* Tags — derived from the real property record (operation + dwelling). */}
          <div className="flex items-center gap-2 ml-10 mt-2">
            {prop.operation_profile && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize">
                <Building2 size={9} /> {String(prop.operation_profile).replace(/_/g, " ")}
              </span>
            )}
            {prop.category && (
              <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                <Home size={9} /> {getPropertyTypeOption(prop.category)?.label ?? prop.category}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap ml-10 md:ml-0">
          <ConfirmDialog
            title="Delete this property?"
            description="This will permanently delete the property and all linked data. This cannot be undone."
            confirmLabel="Delete property"
            onConfirm={async () => {
              await deleteProperty.mutateAsync({ id: propertyId, workspaceId: workspace!.id })
              router.push("/app/portfolio/properties")
            }}
          >
            {(openDelete) => (
              <ActionMenu
                items={[
                  { label: "View work", icon: Wrench, onClick: () => router.push(`/app/work?property=${propertyId}`) },
                  { label: "View compliance", icon: Shield, onClick: () => router.push(`/app/compliance?property=${propertyId}`) },
                  { label: "View on map", icon: MapPin, onClick: () => router.push(`/app/portfolio/map?property=${propertyId}`) },
                  { label: "Archive property", icon: Archive, onClick: () => onSave("status", "archived") },
                  { label: "Delete property", icon: Trash2, variant: "danger", onClick: openDelete },
                ]}
              />
            )}
          </ConfirmDialog>

          {/* AI Portfolio Review — opens the live Copilot seeded with this property's context */}
          <button
            onClick={() =>
              openCopilot({
                prompt: `Review this property and flag risks, voids, compliance gaps and rent/cashflow concerns: "${prop.name}"${prop.address_line1 ? ` (${prop.address_line1})` : ""}.`,
              })
            }
            className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-700 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors"
          >
            <Sparkles size={13} /> AI Portfolio Review
          </button>
          {/* New tenancy */}
          <Link href={`/app/portfolio/tenancies/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors">
            <Users size={13} /> New Tenancy
          </Link>
          {/* Add unit */}
          <Link href={`/app/portfolio/units/new?propertyId=${propertyId}`} className="flex items-center gap-1.5 text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors">
            <Plus size={13} /> Add Unit
          </Link>
        </div>
      </div>
    </div>
  )
}
