"use client"

import React from "react"
import Link from "next/link"
import {
  Zap, Home, Wallet, ListChecks, Building2, TrendingUp, FileText,
  Briefcase, Globe, Activity, CalendarDays, MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { ContactDetail } from "./types"
import { SectionCard } from "./shared"

function getNextBestAction(contact: ContactDetail): { label: string; cta: string; href: string } {
  const base = `/property-manager/contacts/${contact.id}`
  if (contact.contact_type === "tenant" && contact.arrears > 0)
    return { label: "£" + contact.arrears.toLocaleString("en-GB") + " in arrears — send reminder", cta: "Send Reminder", href: `${base}?tab=messages` }
  if (contact.contact_type === "tenant" && contact.next_follow_up)
    return { label: "Follow-up due " + contact.next_follow_up, cta: "Create Task", href: `/property-manager/work/tasks/new?contact=${contact.id}` }
  if (contact.contact_type === "landlord" && (contact.planning_sets?.length ?? 0) > 0)
    return { label: "Planning set ready — review forecast", cta: "View Planning Set", href: `${base}?tab=planning` }
  if (contact.contact_type === "applicant")
    return { label: "Book a viewing for this applicant", cta: "Book Viewing", href: `${base}?tab=viewings` }
  if (contact.contact_type === "supplier")
    return { label: "Create a new job for this supplier", cta: "Create Job", href: `/property-manager/work/jobs/new?contact=${contact.id}` }
  return { label: "Review recent activity for this contact", cta: "View Activity", href: `${base}?tab=activity` }
}

export function RightRail({ contact }: { contact: ContactDetail }) {
  const nba = getNextBestAction(contact)
  const base = `/property-manager/contacts/${contact.id}`

  const quickLinks: { label: string; href: string; icon: React.ElementType }[] = contact.contact_type === "tenant"
    ? [
        { label:"Open Tenancy",   href:`${base}?tab=tenancy`,                       icon:Home },
        { label:"View Payments",  href:`${base}?tab=payments`,                      icon:Wallet },
        { label:"View Tasks",     href:`${base}?tab=tasks`,                         icon:ListChecks },
      ]
    : contact.contact_type === "landlord"
    ? [
        { label:"View Properties",href:"/property-manager/portfolio/properties",    icon:Building2 },
        { label:"Planning Sets",  href:`${base}?tab=planning`,                      icon:TrendingUp },
        { label:"View Offers",    href:`${base}?tab=offers`,                        icon:FileText },
      ]
    : contact.contact_type === "supplier"
    ? [
        { label:"Create Job",     href:`/property-manager/work/jobs/new?contact=${contact.id}`, icon:Briefcase },
        { label:"Portal Access",  href:`${base}?tab=portal`,                        icon:Globe },
        { label:"Work History",   href:`${base}?tab=work`,                          icon:Activity },
      ]
    : [
        { label:"Book Viewing",   href:`${base}?tab=viewings`,                      icon:CalendarDays },
        { label:"Convert to Tenant",href:`/property-manager/portfolio/tenancies/new?contact=${contact.id}`, icon:Zap },
        { label:"View Messages",  href:`${base}?tab=messages`,                      icon:MessageCircle },
      ]

  return (
    <div className="space-y-4">
      {/* Next Best Action */}
      <SectionCard className="p-4 border-l-4 border-l-[var(--brand)]">
        <div className="flex items-start gap-2 mb-3">
          <div style={{ color: "#2563EB" }}><Zap className="w-4 h-4 mt-0.5" /></div>
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Next Best Action</p>
        </div>
        <p className="text-sm text-slate-700 mb-3">{nba.label}</p>
        <Link href={nba.href}>
          <Button variant="soft" size="sm" className="w-full justify-center">{nba.cta}</Button>
        </Link>
      </SectionCard>

      {/* Quick Links */}
      <SectionCard className="p-4">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Quick Links</p>
        <div className="space-y-1">
          {quickLinks.map(l => {
            const Icon = l.icon
            return (
              <Link key={l.label} href={l.href}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 hover:text-[var(--brand)] transition-colors group">
                <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--brand)]" />
                {l.label}
              </Link>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}
