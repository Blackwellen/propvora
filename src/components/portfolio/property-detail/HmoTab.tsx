"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import {
  Shield, Plus, ExternalLink, Calendar, Users, Building2,
  CheckCircle2, AlertTriangle, Clock, XCircle, FileText,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { InlineEditField, InlineEditSelect, InlineEditDate } from "@/components/editing"

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
interface HmoLicence {
  id: string
  workspace_id: string
  property_id: string
  licence_type: string
  licence_number: string | null
  issuing_council: string | null
  issue_date: string | null
  expiry_date: string
  max_occupants: number | null
  max_households: number | null
  status: string
  arrangement_type: string
  occupancy_current: number | null
  conditions: unknown
  document_path: string | null
  renewal_reminder_days: number
  created_at: string
  updated_at: string
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const LICENCE_TYPES = [
  { value: "mandatory", label: "Mandatory HMO Licence" },
  { value: "additional", label: "Additional HMO Licence" },
  { value: "selective", label: "Selective Licence" },
]

const STATUS_OPTIONS = [
  { value: "active",  label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
]

const ARRANGEMENT_TYPES = [
  { value: "owner_managed",  label: "Owner managed" },
  { value: "agent_managed",  label: "Managed by agent" },
  { value: "rent_to_rent",   label: "Rent-to-rent" },
  { value: "other",          label: "Other" },
]

function statusConfig(status: string) {
  switch (status) {
    case "active":  return { label: "Active",  icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    case "pending": return { label: "Pending", icon: Clock,        cls: "bg-amber-50 text-amber-700 border-amber-200" }
    case "expired": return { label: "Expired", icon: AlertTriangle,cls: "bg-red-50 text-red-700 border-red-200" }
    case "revoked": return { label: "Revoked", icon: XCircle,      cls: "bg-slate-50 text-slate-600 border-slate-200" }
    default:        return { label: status,    icon: Shield,        cls: "bg-slate-50 text-slate-600 border-slate-200" }
  }
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/* ------------------------------------------------------------------ */
/* Hooks                                                                */
/* ------------------------------------------------------------------ */
const QK = (propertyId: string) => ["hmo-licences-property", propertyId]

function usePropertyHmoLicences(workspaceId: string | undefined, propertyId: string) {
  const supabase = createClient()
  return useQuery<HmoLicence[]>({
    queryKey: QK(propertyId),
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hmo_licences")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .eq("property_id", propertyId)
        .order("expiry_date", { ascending: true })
      if (error) {
        if (error.code === "42P01") return []
        throw error
      }
      return (data ?? []) as HmoLicence[]
    },
    staleTime: 30_000,
  })
}

function useUpdateLicence(propertyId: string) {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<HmoLicence> }) => {
      const { error } = await supabase.from("hmo_licences").update(patch).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(propertyId) }),
  })
}

/* ------------------------------------------------------------------ */
/* Licence Card                                                         */
/* ------------------------------------------------------------------ */
function LicenceCard({ licence, propertyId }: { licence: HmoLicence; propertyId: string }) {
  const update = useUpdateLicence(propertyId)
  const cfg = statusConfig(licence.status)
  const StatusIcon = cfg.icon
  const days = daysUntil(licence.expiry_date)
  const urgent = days <= 60 && days > 0
  const expired = days <= 0

  async function patch(field: keyof HmoLicence, value: unknown) {
    await update.mutateAsync({ id: licence.id, patch: { [field]: value } as Partial<HmoLicence> })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={cn("px-5 py-3 border-b flex items-center justify-between gap-3",
        expired ? "bg-red-50 border-red-200" : urgent ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center gap-2.5">
          <Shield size={16} className={expired ? "text-red-500" : urgent ? "text-amber-600" : "text-[var(--brand)]"} />
          <InlineEditSelect
            value={licence.licence_type}
            onSave={(v) => patch("licence_type", v)}
            label="Licence type"
            options={LICENCE_TYPES}
            displayClassName="text-[13px] font-bold text-slate-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border", cfg.cls)}>
            <StatusIcon size={11} />
            {cfg.label}
          </span>
          <InlineEditSelect
            value={licence.status}
            onSave={(v) => patch("status", v)}
            label="Status"
            options={STATUS_OPTIONS}
            displayClassName="sr-only"
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
        {/* Licence number */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Licence Number</p>
          <InlineEditField
            value={licence.licence_number ?? ""}
            onSave={(v) => patch("licence_number", v || null)}
            label="Licence number"
            placeholder="Enter licence number"
            displayClassName="text-[13px] font-medium text-slate-800"
          />
        </div>

        {/* Issuing council */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Issuing Council</p>
          <InlineEditField
            value={licence.issuing_council ?? ""}
            onSave={(v) => patch("issuing_council", v || null)}
            label="Issuing council"
            placeholder="e.g. Birmingham City Council"
            displayClassName="text-[13px] font-medium text-slate-800"
          />
        </div>

        {/* Issue date */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Issue Date</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-slate-800">{fmtDate(licence.issue_date)}</span>
            <InlineEditDate
              value={licence.issue_date ?? ""}
              onSave={(v) => patch("issue_date", v || null)}
              label="Issue date"
              displayClassName="sr-only"
            />
          </div>
        </div>

        {/* Expiry date */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Expiry Date</p>
          <div className="flex items-center gap-2">
            <span className={cn("text-[13px] font-medium", expired ? "text-red-600" : urgent ? "text-amber-600" : "text-slate-800")}>
              {fmtDate(licence.expiry_date)}
            </span>
            <InlineEditDate
              value={licence.expiry_date}
              onSave={(v) => patch("expiry_date", v)}
              label="Expiry date"
              displayClassName="sr-only"
            />
            {expired && <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">Expired</span>}
            {urgent && <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">{days}d left</span>}
          </div>
        </div>

        {/* Max occupants */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Max Permitted Occupants</p>
          <div className="flex items-center gap-2">
            <InlineEditField
              value={licence.max_occupants != null ? String(licence.max_occupants) : ""}
              onSave={(v) => patch("max_occupants", v ? parseInt(v) : null)}
              label="Max occupants"
              placeholder="—"
              displayClassName="text-[13px] font-medium text-slate-800"
            />
            {licence.occupancy_current != null && licence.max_occupants != null && (
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                licence.occupancy_current > licence.max_occupants
                  ? "text-red-600 bg-red-100"
                  : "text-emerald-700 bg-emerald-100"
              )}>
                {licence.occupancy_current}/{licence.max_occupants} current
              </span>
            )}
          </div>
        </div>

        {/* Max households */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Max Households</p>
          <InlineEditField
            value={licence.max_households != null ? String(licence.max_households) : ""}
            onSave={(v) => patch("max_households", v ? parseInt(v) : null)}
            label="Max households"
            placeholder="—"
            displayClassName="text-[13px] font-medium text-slate-800"
          />
        </div>

        {/* Arrangement type */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Arrangement Type</p>
          <InlineEditSelect
            value={licence.arrangement_type ?? "owner_managed"}
            onSave={(v) => patch("arrangement_type", v)}
            label="Arrangement type"
            options={ARRANGEMENT_TYPES}
            displayClassName="text-[13px] font-medium text-slate-800"
          />
        </div>

        {/* Renewal reminder */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Renewal Reminder</p>
          <p className="text-[13px] font-medium text-slate-800">{licence.renewal_reminder_days ?? 90} days before expiry</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          href={`/property-manager/legal?tab=hmo-licences&id=${licence.id}`}
          className="text-[12px] text-[var(--brand)] hover:underline flex items-center gap-1"
        >
          <ExternalLink size={12} />
          Manage in Legal
        </Link>
        {licence.document_path && (
          <span className="text-[12px] text-slate-500 flex items-center gap-1">
            <FileText size={12} />
            Licence document attached
          </span>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Jurisdiction panels for non-UK workspaces                           */
/* ------------------------------------------------------------------ */
function JurisdictionPanel({ tabKey, label }: { tabKey: string; label: string }) {
  const copy: Record<string, { heading: string; body: string; linkLabel?: string; linkHref?: string }> = {
    fair_housing_us: {
      heading: "Fair Housing Compliance",
      body: "US Fair Housing Act compliance records — protected classes, reasonable accommodations, advertising standards and audit trail. Full management available in the Legal section.",
      linkLabel: "Open Legal",
      linkHref: "/property-manager/legal",
    },
    bond_au_prop: {
      heading: "Bond & Tenancy Deposit",
      body: "Australian residential tenancy bond details — bond lodge reference, amount, RTA registration number, and refund status. Full management available in the Legal section.",
      linkLabel: "Open Legal",
      linkHref: "/property-manager/legal",
    },
    betriebskosten_prop: {
      heading: "Betriebskosten (Operating Costs)",
      body: "German Betriebskostenabrechnung — apportioned operating costs, Nebenkostenabrechnung periods, utility split and tenant billing records. Full management available in the Legal section.",
      linkLabel: "Open Legal",
      linkHref: "/property-manager/legal",
    },
    ejari_prop: {
      heading: "Ejari Registration",
      body: "UAE Ejari tenancy contract registration — Ejari number, RERA registration, municipality ID, and renewal status. Full management available in the Legal section.",
      linkLabel: "Open Legal",
      linkHref: "/property-manager/legal",
    },
  }

  const c = copy[tabKey] ?? {
    heading: label,
    body: "Jurisdiction-specific details for this property. Full management available in the Legal section.",
    linkLabel: "Open Legal",
    linkHref: "/property-manager/legal",
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center">
        <Shield size={22} className="text-[var(--brand)]" />
      </div>
      <div>
        <p className="text-[15px] font-bold text-slate-900 mb-1">{c.heading}</p>
        <p className="text-[13px] text-slate-500 max-w-sm">{c.body}</p>
      </div>
      {c.linkLabel && c.linkHref && (
        <Link
          href={c.linkHref}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:underline"
        >
          <ExternalLink size={13} />
          {c.linkLabel}
        </Link>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main Export                                                          */
/* ------------------------------------------------------------------ */
interface HmoTabProps {
  propertyId: string
  workspaceId: string | undefined
  /** The active tab key — determines which jurisdiction panel to show */
  tabKey: "hmo" | "fair_housing_us" | "bond_au_prop" | "betriebskosten_prop" | "ejari_prop"
  tabLabel: string
}

export function HmoTab({ propertyId, workspaceId, tabKey, tabLabel }: HmoTabProps) {
  const router = useRouter()

  // Non-GB jurisdictions get an informative panel
  if (tabKey !== "hmo") {
    return <JurisdictionPanel tabKey={tabKey} label={tabLabel} />
  }

  return <HmoTabGB propertyId={propertyId} workspaceId={workspaceId} />
}

function HmoTabGB({ propertyId, workspaceId }: { propertyId: string; workspaceId: string | undefined }) {
  const router = useRouter()
  const { data: licences = [], isLoading } = usePropertyHmoLicences(workspaceId, propertyId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-slate-900">HMO Licences</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Housing Act 2004 (England &amp; Wales) — mandatory, additional and selective licences for this property.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/property-manager/legal?tab=hmo-licences&property=${propertyId}`}
            className="shrink-0 whitespace-nowrap text-[12px] text-[var(--brand)] hover:underline flex items-center gap-1"
          >
            <ExternalLink size={12} className="shrink-0" />
            View all in Legal
          </Link>
          <Button
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={() => router.push(`/property-manager/legal/hmo-licences/new?propertyId=${propertyId}`)}
          >
            <Plus size={14} className="mr-1 shrink-0" />
            Add Licence
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      {licences.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Licences", value: licences.length, icon: Shield },
            { label: "Active",  value: licences.filter(l => l.status === "active").length,  icon: CheckCircle2 },
            { label: "Expiring Soon", value: licences.filter(l => { const d = daysUntil(l.expiry_date); return d > 0 && d <= 60 }).length, icon: Clock },
            { label: "Expired", value: licences.filter(l => daysUntil(l.expiry_date) <= 0).length, icon: AlertTriangle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-slate-400" />
                <span className="text-[11px] text-slate-500">{label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Licences or empty state */}
      {licences.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center">
            <Shield size={22} className="text-[var(--brand)]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-900 mb-1">No HMO licences recorded</p>
            <p className="text-[13px] text-slate-500 max-w-sm">
              If this property requires an HMO licence (5+ occupants from 2+ households, or within an additional/selective licensing area),
              add it here to track expiry and compliance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push(`/property-manager/legal/hmo-licences/new?propertyId=${propertyId}`)}
            >
              <Plus size={14} className="mr-1.5" />
              Add HMO Licence
            </Button>
            <Link
              href="https://www.gov.uk/house-in-multiple-occupation-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[var(--brand)] hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} />
              GOV.UK guidance
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {licences.map(l => (
            <LicenceCard key={l.id} licence={l} propertyId={propertyId} />
          ))}
        </div>
      )}

      {/* Legal section nudge */}
      <div className="bg-[var(--brand-soft)] rounded-xl border border-[var(--color-brand-100)] p-4 flex items-start gap-3">
        <Building2 size={16} className="text-[var(--brand)] shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-[var(--brand-strong)] mb-0.5">Full HMO licence management in Legal</p>
          <p className="text-[12px] text-[var(--brand)]">
            Attach licence documents, track renewal history, and manage HMO licences across all properties from the{" "}
            <Link href="/property-manager/legal?tab=hmo-licences" className="underline font-semibold">Legal section</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
