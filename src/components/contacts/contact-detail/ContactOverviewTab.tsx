"use client"

import React from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Building2, ExternalLink, Clock, Zap, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import type { ContactDetail } from "./types"
import { SectionCard, FieldRow, StatusChip, EmptyState } from "./shared"

// ---- Tenant Overview ----
export function TenantOverviewTab({ contact }: { contact: ContactDetail }) {
  const invoices = contact.invoices ?? []
  const recent = invoices.slice(0, 3)
  return (
    <div className="space-y-5">
      {contact.arrears > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <div style={{ color: "#dc2626" }}><AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Arrears Outstanding</p>
            <p className="text-sm text-red-700">£{contact.arrears.toLocaleString("en-GB")} overdue — action required</p>
          </div>
          <Button variant="destructive" size="sm" className="shrink-0">Create Task</Button>
        </div>
      )}
      <div className="grid sm:grid-cols-3 gap-4">
        <SectionCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Monthly Rent</p>
          <p className="text-2xl font-bold text-slate-900">£{(contact.tenancy?.rent ?? 0).toLocaleString("en-GB")}</p>
        </SectionCard>
        <SectionCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Arrears</p>
          <p className={cn("text-2xl font-bold", contact.arrears > 0 ? "text-red-600" : "text-emerald-600")}>
            {contact.arrears > 0 ? `£${contact.arrears.toLocaleString("en-GB")}` : "None"}
          </p>
        </SectionCard>
        <SectionCard className="p-4">
          <p className="text-xs text-slate-500 mb-1">Tenancy Status</p>
          <div className="mt-1"><StatusChip status={contact.tenancy?.status ?? "inactive"} /></div>
        </SectionCard>
      </div>
      {recent.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Recent Payments</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Invoice","Date","Amount","Status"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(inv => (
                  <tr key={inv.ref} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{inv.ref}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{inv.date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">£{inv.amount.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3"><StatusChip status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Landlord Overview ----
export function LandlordOverviewTab({ contact }: { contact: ContactDetail }) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-4 gap-3">
        {[
          { label:"Properties",   value: contact.linked_properties,           colour:"text-slate-900" },
          { label:"Tenancies",    value: contact.active_tenancies,            colour:"text-emerald-600" },
          { label:"Planning Sets",value: contact.planning_sets?.length ?? 0,  colour:"text-blue-600" },
          { label:"Offers",       value: contact.landlord_offers?.length ?? 0,colour:"text-violet-600" },
        ].map(k => (
          <SectionCard key={k.label} className="p-4">
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={cn("text-2xl font-bold", k.colour)}>{k.value}</p>
          </SectionCard>
        ))}
      </div>
      {(contact.properties?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Linked Properties</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {contact.properties?.map((prop, i) => (
              <SectionCard key={i} className="p-3 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{prop}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </SectionCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Supplier Overview ----
export function SupplierOverviewTab({ contact }: { contact: ContactDetail }) {
  const sup = contact.supplier
  const jobs = contact.jobs ?? []
  return (
    <div className="space-y-5">
      {sup && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Jobs Completed",  value: sup.jobs_completed,                            colour:"text-emerald-600" },
            { label:"Avg Response",    value: `${sup.average_response_time}h`,               colour:"text-blue-600" },
            { label:"Invoices Paid",   value: (contact.invoices ?? []).filter(i => i.status === "paid").length, colour:"text-slate-900" },
            { label:"Internal Rating", value: `${sup.internal_rating}/5`,                    colour:"text-amber-600" },
          ].map(k => (
            <SectionCard key={k.label} className="p-4">
              <p className="text-xs text-slate-500 mb-1">{k.label}</p>
              <p className={cn("text-2xl font-bold", k.colour)}>{k.value}</p>
            </SectionCard>
          ))}
        </div>
      )}
      {sup && (
        <div className={cn("rounded-xl border p-3 flex items-center gap-3",
          sup.compliance_status === "valid" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
        )}>
          <p className={cn("text-sm font-medium flex-1", sup.compliance_status === "valid" ? "text-emerald-700" : "text-red-700")}>
            Insurance {sup.compliance_status === "valid" ? "valid" : "expired"} — expires {sup.insurance_expiry}
          </p>
        </div>
      )}
      {jobs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Recent Work</p>
          <div className="space-y-2">
            {jobs.slice(0, 3).map((job, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
                <div className={cn("w-2 h-2 rounded-full shrink-0", job.status === "completed" ? "bg-emerald-500" : "bg-amber-500")} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-400">{job.property} · {job.date}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700">£{job.cost}</span>
                <StatusChip status={job.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Applicant Overview ----
export function ApplicantOverviewTab({ contact }: { contact: ContactDetail }) {
  const eq = contact.enquiry
  return (
    <div className="space-y-5">
      {contact.next_follow_up && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <div style={{ color: "#d97706" }}><Clock className="w-5 h-5 mt-0.5 shrink-0" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Follow-up due {contact.next_follow_up}</p>
            <p className="text-sm text-amber-700">Book a viewing or send a follow-up message</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0">Create Task</Button>
        </div>
      )}
      {eq && (
        <div className="grid sm:grid-cols-3 gap-3">
          <SectionCard className="p-4">
            <p className="text-xs text-slate-500 mb-1">Budget Range</p>
            <p className="text-lg font-bold text-slate-900">£{eq.budget_min}–£{eq.budget_max}/mo</p>
          </SectionCard>
          <SectionCard className="p-4">
            <p className="text-xs text-slate-500 mb-1">Move-in Date</p>
            <p className="text-lg font-bold text-slate-900">{eq.move_date}</p>
          </SectionCard>
          <SectionCard className="p-4">
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <div className="mt-1"><StatusChip status={eq.status} /></div>
          </SectionCard>
        </div>
      )}
      {eq && (
        <SectionCard className="p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">Enquiry Summary</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldRow label="Source" value={eq.source} />
            <FieldRow label="Preferred Area" value={eq.preferred_area} />
            <FieldRow label="Property Type" value={eq.preferred_type} />
            <FieldRow label="Preferred Move Date" value={eq.move_date} />
          </div>
        </SectionCard>
      )}
    </div>
  )
}
