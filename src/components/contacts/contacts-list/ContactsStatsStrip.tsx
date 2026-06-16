"use client"

import React from "react"
import { Users, UserCheck, UserPlus, Wrench, Home, Clock, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MappedContact } from "./types"

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtitle?: React.ReactNode
  iconColour: string
  bg: string
}

function KpiCard({ icon: Icon, label, value, subtitle, iconColour, bg }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-default">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className="w-4 h-4" style={{ color: iconColour }} />
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
      {subtitle && <div className="mt-1">{subtitle}</div>}
    </div>
  )
}

export function ContactsStatsStrip({ contacts, isLoading }: { contacts: MappedContact[]; isLoading: boolean }) {
  const tenantCount    = contacts.filter(c => c.contact_type === "tenant" && c.status === "active").length
  const applicantCount = contacts.filter(c => c.contact_type === "applicant").length
  const supplierCount  = contacts.filter(c => ["supplier","maintenance","cleaning","emergency_contractor"].includes(c.contact_type)).length
  const landlordCount  = contacts.filter(c => c.contact_type === "landlord").length
  const preferredCount = contacts.filter(c => c.tags.includes("preferred")).length
  const followUpCount  = contacts.filter(c => c.tags.includes("follow_up")).length

  const cards = [
    { icon: Users,     label: "Total Contacts", value: contacts.length,    iconColour: "#2563EB", bg: "bg-blue-50",    subtitle: undefined },
    { icon: UserCheck, label: "Active Tenants",  value: tenantCount,        iconColour: "#10B981", bg: "bg-emerald-50", subtitle: undefined },
    { icon: UserPlus,  label: "Applicants",      value: applicantCount,     iconColour: "#0EA5E9", bg: "bg-sky-50",     subtitle: undefined },
    { icon: Wrench,    label: "Suppliers",        value: supplierCount,      iconColour: "#F59E0B", bg: "bg-amber-50",
      subtitle: preferredCount > 0 ? <span className="text-[10px] font-medium text-amber-600">{preferredCount} preferred</span> : undefined },
    { icon: Home,      label: "Landlords",        value: landlordCount,      iconColour: "#2563EB", bg: "bg-blue-50",    subtitle: undefined },
    { icon: Clock,     label: "Follow-ups",       value: followUpCount,      iconColour: "#EF4444", bg: "bg-red-50",
      subtitle: followUpCount > 0 ? <span className="text-[10px] font-medium text-red-500">needs action</span> : undefined },
    { icon: Globe,     label: "Portal Users",     value: contacts.filter(c => c.tags.includes("portal_access")).length, iconColour: "#8B5CF6", bg: "bg-violet-50",
      subtitle: undefined },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 h-24 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-slate-100 mb-3" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map(card => <KpiCard key={card.label} {...card} />)}
    </div>
  )
}
