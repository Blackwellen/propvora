"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { ContactDetail } from "./types"

export function KpiStrip({ contact }: { contact: ContactDetail }) {
  type KpiItem = { label: string; value: string; colour?: string }
  let kpis: KpiItem[] = []

  if (contact.contact_type === "tenant") {
    kpis = [
      { label:"Monthly Rent",  value: contact.tenancy ? `£${contact.tenancy.rent.toLocaleString("en-GB")}` : "—" },
      { label:"Arrears",       value: contact.arrears > 0 ? `£${contact.arrears.toLocaleString("en-GB")}` : "None", colour: contact.arrears > 0 ? "text-red-600" : "text-emerald-600" },
      { label:"Tenancy Ends",  value: contact.tenancy?.end ?? "Ongoing" },
      { label:"Last Contacted",value: contact.last_contacted ?? "—" },
    ]
  } else if (contact.contact_type === "landlord") {
    kpis = [
      { label:"Properties",    value: String(contact.linked_properties) },
      { label:"Planning Sets", value: String(contact.planning_sets?.length ?? 0) },
      { label:"Offers",        value: String(contact.landlord_offers?.length ?? 0) },
      { label:"Last Contacted",value: contact.last_contacted ?? "—" },
    ]
  } else if (contact.contact_type === "supplier") {
    const sup = contact.supplier
    kpis = [
      { label:"Jobs Done",     value: String(sup?.jobs_completed ?? 0) },
      { label:"Open Jobs",     value: String((contact.jobs ?? []).filter(j => j.status !== "completed").length) },
      { label:"Avg Response",  value: sup ? `${sup.average_response_time}h` : "—" },
      { label:"Rating",        value: sup ? `${sup.internal_rating}/5` : "—" },
    ]
  } else if (contact.contact_type === "applicant") {
    const eq = contact.enquiry
    kpis = [
      { label:"Budget",        value: eq ? `£${eq.budget_min}–£${eq.budget_max}` : "—" },
      { label:"Move Date",     value: eq?.move_date ?? "—" },
      { label:"Viewings",      value: "0" },
      { label:"Follow-up",     value: contact.next_follow_up ?? "Not set", colour: contact.next_follow_up ? "text-amber-600" : undefined },
    ]
  } else {
    kpis = [
      { label:"Properties",    value: String(contact.linked_properties) },
      { label:"Tenancies",     value: String(contact.active_tenancies) },
      { label:"Last Contacted",value: contact.last_contacted ?? "—" },
      { label:"Next Follow-up",value: contact.next_follow_up ?? "—" },
    ]
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500 mb-0.5">{k.label}</p>
          <p className={cn("text-base font-bold text-slate-900 truncate", k.colour)}>{k.value}</p>
        </div>
      ))}
    </div>
  )
}
