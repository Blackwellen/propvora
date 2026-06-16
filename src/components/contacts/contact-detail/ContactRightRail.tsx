"use client"

import React from "react"
import Link from "next/link"
import {
  Zap, Home, Wallet, ListChecks, Building2, TrendingUp, FileText,
  Briefcase, Globe, Activity, CalendarDays, MessageCircle, ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import type { ContactDetail } from "./types"
import { SectionCard, avatarBg, initials } from "./shared"

function getNextBestAction(contact: ContactDetail): { label: string; cta: string; href: string } {
  if (contact.contact_type === "tenant" && contact.arrears > 0)
    return { label: "£" + contact.arrears.toLocaleString("en-GB") + " in arrears — send reminder", cta: "Send Reminder", href: "#" }
  if (contact.contact_type === "tenant" && contact.next_follow_up)
    return { label: "Follow-up due " + contact.next_follow_up, cta: "Create Task", href: "#" }
  if (contact.contact_type === "landlord" && (contact.planning_sets?.length ?? 0) > 0)
    return { label: "Planning set ready — review forecast", cta: "View Planning Set", href: "/app/planning" }
  if (contact.contact_type === "applicant" && contact.next_follow_up)
    return { label: "Book a viewing — follow-up due " + contact.next_follow_up, cta: "Book Viewing", href: "#" }
  if (contact.contact_type === "supplier")
    return { label: "Create a new job for this supplier", cta: "Create Job", href: "/app/work/jobs/new" }
  return { label: "No urgent actions", cta: "View Activity", href: "#" }
}

export function RightRail({ contact }: { contact: ContactDetail }) {
  const nba = getNextBestAction(contact)

  const quickLinks: { label: string; href: string; icon: React.ElementType }[] = contact.contact_type === "tenant"
    ? [
        { label:"Open Tenancy",   href:"/app/portfolio/tenancies/t1", icon:Home },
        { label:"View Invoices",  href:"#",                            icon:Wallet },
        { label:"View Tasks",     href:"#",                            icon:ListChecks },
      ]
    : contact.contact_type === "landlord"
    ? [
        { label:"View Properties",href:"/app/portfolio/properties",    icon:Building2 },
        { label:"Planning Sets",  href:"/app/planning",                icon:TrendingUp },
        { label:"View Offers",    href:"#",                            icon:FileText },
      ]
    : contact.contact_type === "supplier"
    ? [
        { label:"Create Job",     href:"/app/work/jobs/new",           icon:Briefcase },
        { label:"View Portal",    href:"#",                            icon:Globe },
        { label:"Job History",    href:"#",                            icon:Activity },
      ]
    : [
        { label:"Book Viewing",   href:"#",                            icon:CalendarDays },
        { label:"Convert to Tenant",href:"#",                          icon:Zap },
        { label:"View Messages",  href:"#",                            icon:MessageCircle },
      ]

  const relatedContacts = contact.contact_type === "tenant"
    ? [{ name:"David Thornton", role:"Landlord" }, { name:"Michael Mitchell", role:"Guarantor" }]
    : contact.contact_type === "landlord"
    ? [{ name:"Sarah Mitchell", role:"Tenant" }, { name:"James Okafor", role:"Tenant" }]
    : [{ name:"David Thornton", role:"Landlord" }, { name:"Sarah Mitchell", role:"Tenant" }]

  return (
    <div className="space-y-4">
      {/* Next Best Action */}
      <SectionCard className="p-4 border-l-4 border-l-blue-500">
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
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 hover:text-blue-600 transition-colors group">
                <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                {l.label}
              </Link>
            )
          })}
        </div>
      </SectionCard>

      {/* Related Contacts */}
      <SectionCard className="p-4">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Related Contacts</p>
        <div className="space-y-2">
          {relatedContacts.map(rc => (
            <div key={rc.name} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarBg(rc.name)}`}>
                {initials(rc.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{rc.name}</p>
                <p className="text-xs text-slate-400 capitalize">{rc.role}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-300" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
