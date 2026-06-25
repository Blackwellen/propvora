"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftRight, Calendar, DollarSign, Building2, ExternalLink,
  TrendingUp, AlertCircle, FileText, Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { InlineEditField, InlineEditDate } from "@/components/editing"
import type { Property } from "@/types/database"

interface RentToRentTabProps {
  prop: Property
  workspaceId: string | undefined
  propertyId: string
  onSave: (field: string, value: unknown) => Promise<void>
  /** Tenancies with rent amounts (for financial summary) */
  tenanciesList: Array<{ id: string; rent_amount: number; status: string; tenant_name?: string | null }>
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export function RentToRentTab({ prop, workspaceId, propertyId, onSave, tenanciesList }: RentToRentTabProps) {
  const router = useRouter()

  // Derive financials from live tenancies
  const activeTenancies = tenanciesList.filter(t => t.status === "active")
  const monthlyIncome = activeTenancies.reduce((sum, t) => sum + (t.rent_amount ?? 0), 0)
  const monthlyCost = prop.monthly_mortgage ?? 0  // used to store landlord payment in R2R context
  const monthlyProfit = monthlyIncome - monthlyCost
  const profitMargin = monthlyIncome > 0 ? Math.round((monthlyProfit / monthlyIncome) * 100) : 0

  // R2R agreement end stored in notes via a structured prefix (until a dedicated r2r_agreements table exists)
  // For now, surface what we have and link to Legal for full agreement management
  const r2rNotesPrefix = "[R2R]"
  const hasR2rNotes = prop.notes?.startsWith(r2rNotesPrefix)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-slate-900">Rent-to-Rent Agreement</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Sub-letting arrangement — you lease from the landlord and sub-let to tenants.
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 whitespace-nowrap"
          onClick={() => router.push(`/property-manager/legal?tab=r2r&propertyId=${propertyId}`)}
        >
          <FileText size={14} className="mr-1.5 shrink-0" />
          Manage Agreement
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Monthly Income",
            value: fmt(monthlyIncome),
            sub: `${activeTenancies.length} active tenant${activeTenancies.length !== 1 ? "s" : ""}`,
            icon: TrendingUp,
            positive: monthlyIncome > 0,
          },
          {
            label: "Landlord Cost",
            value: fmt(monthlyCost),
            sub: "as recorded",
            icon: DollarSign,
            positive: false,
          },
          {
            label: "Monthly Profit",
            value: fmt(monthlyProfit),
            sub: monthlyCost > 0 ? `${profitMargin}% margin` : "Cost not set",
            icon: ArrowLeftRight,
            positive: monthlyProfit > 0,
          },
          {
            label: "Annual Profit",
            value: fmt(monthlyProfit * 12),
            sub: "projected",
            icon: Building2,
            positive: monthlyProfit > 0,
          },
        ].map(({ label, value, sub, icon: Icon, positive }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className="text-slate-400" />
              <span className="text-[11px] text-slate-500">{label}</span>
            </div>
            <p className={cn("text-xl font-bold", positive ? "text-emerald-600" : label === "Landlord Cost" ? "text-slate-900" : "text-red-600")}>
              {value}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Agreement details card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <ArrowLeftRight size={15} className="text-orange-600" />
          <span className="text-[13px] font-bold text-slate-900">Agreement Details</span>
        </div>

        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
          {/* Property name / reference */}
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Property Reference</p>
            <p className="text-[13px] font-semibold text-slate-900">{prop.name}</p>
          </div>

          {/* Target landlord cost (monthly_mortgage used for R2R = landlord fee) */}
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Monthly Cost to Landlord</p>
            <InlineEditField
              value={prop.monthly_mortgage != null ? String(prop.monthly_mortgage) : ""}
              onSave={(v) => onSave("monthly_mortgage", v ? parseFloat(v) : null)}
              label="Monthly landlord cost"
              placeholder="Set amount"
              displayClassName="text-[13px] font-semibold text-slate-900"
            />
          </div>

          {/* Notes / agreement summary */}
          <div className="col-span-2">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Agreement Notes</p>
            <InlineEditField
              value={prop.notes ?? ""}
              onSave={(v) => onSave("notes", v || null)}
              label="Agreement notes"
              type="textarea"
              placeholder="Add notes about the R2R agreement, landlord details, key terms…"
              displayClassName="text-[13px] text-slate-700 whitespace-pre-wrap"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <Link
            href={`/property-manager/legal?tab=r2r&propertyId=${propertyId}`}
            className="text-[12px] text-blue-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink size={12} />
            Full agreement in Legal
          </Link>
          <span className="text-[11px] text-slate-400">
            Full contract management → Legal section
          </span>
        </div>
      </div>

      {/* Active tenants in this R2R */}
      {activeTenancies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-[13px] font-bold text-slate-900">Active Sub-Tenants</p>
          </div>
          <div className="divide-y divide-slate-50">
            {activeTenancies.map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-[11px] font-bold">
                    {(t.tenant_name ?? "?").charAt(0)}
                  </div>
                  <p className="text-[13px] font-medium text-slate-800">{t.tenant_name ?? "Unknown"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[13px] font-bold text-slate-900">{fmt(t.rent_amount)}/mo</p>
                  <Link
                    href={`/property-manager/portfolio/tenancies/${t.id}`}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal nudge */}
      <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 flex items-start gap-3">
        <AlertCircle size={15} className="text-orange-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-orange-800 mb-0.5">Full R2R agreement management in Legal</p>
          <p className="text-[12px] text-orange-700">
            Manage the formal lease agreement with your landlord, store signed documents, and track renewal dates in the{" "}
            <Link href="/property-manager/legal" className="underline font-semibold">Legal section</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
