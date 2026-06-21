"use client"

import React from "react"
import Link from "next/link"
import {
  ArrowLeft, MessageSquare, Edit, Mail, Phone, Building2, MapPin, Tag,
  Package, Trash2, Eye, Download, Wrench, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { useRouter } from "next/navigation"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { MobileTopBar } from "@/components/mobile"
import type { ContactDetail } from "./types"
import {
  avatarBg, initials, TYPE_BADGE, HEALTH_CONFIG,
} from "./shared"

interface Props {
  contact: ContactDetail
  editable: boolean
  onToast: (msg: string) => void
  onArchive: () => Promise<void>
  onDelete: () => Promise<void>
  onTabChange: (tab: string) => void
}

function PrimaryActions({ contact, onToast, onArchive, onDelete, editable, onTabChange }: Props) {
  const router = useRouter()
  const type = contact.contact_type

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onTabChange("messages")}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" /> Message
      </button>
      {type === "tenant" && <>
        <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />} onClick={() => router.push(`/property-manager/portfolio/tenancies/new?contact=${contact.id}`)}>Open Tenancy</Button>
        <Button variant="outline" size="sm" onClick={() => router.push(`/property-manager/work/tasks/new?contact=${contact.id}`)}>Create Task</Button>
        <Button variant="outline" size="sm" onClick={() => onTabChange("documents")}>Upload Document</Button>
      </>}
      {type === "landlord" && <>
        <Button variant="outline" size="sm" onClick={() => router.push(`/property-manager/planning/landlord-offers/new?contact=${contact.id}`)}>Create Offer</Button>
        <Button variant="outline" size="sm" onClick={() => router.push(`/property-manager/portfolio/properties?link_contact=${contact.id}`)}>Link Property</Button>
        <Button variant="outline" size="sm" onClick={() => router.push(`/property-manager/work/tasks/new?contact=${contact.id}`)}>Create Task</Button>
      </>}
      {type === "supplier" && <>
        <Button variant="outline" size="sm" onClick={() => router.push(`/property-manager/work/jobs/new?contact=${contact.id}`)}>Create Job</Button>
        <Button variant="outline" size="sm" onClick={() => onTabChange("documents")}>Request Docs</Button>
        <Button variant="outline" size="sm" onClick={() => onToast("Portal invite requires email configuration")}>Portal Link</Button>
      </>}
      {type === "applicant" && <>
        <Button variant="outline" size="sm" onClick={() => router.push(`/property-manager/calendar/events/new?contact=${contact.id}`)}>Book Viewing</Button>
        <Button variant="outline" size="sm" onClick={() => router.push(`/property-manager/portfolio/tenancies/new?contact=${contact.id}`)}>Convert to Tenant</Button>
        <Button variant="outline" size="sm" onClick={() => router.push(`/property-manager/work/tasks/new?contact=${contact.id}`)}>Create Follow-up</Button>
      </>}
      <Link href={`/property-manager/contacts/${contact.id}/edit`}>
        <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>Edit</Button>
      </Link>
      <ConfirmDialog
        title="Delete contact?"
        description={`This permanently deletes ${contact.full_name} and cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={onDelete}
      >
        {(openDelete) => (
          <ActionMenu
            items={[
              { label: "View Profile", icon: Eye, onClick: () => router.push(`/property-manager/contacts/${contact.id}`) },
              { label: "Edit Contact", icon: Edit, onClick: () => router.push(`/property-manager/contacts/${contact.id}/edit`) },
              { label: "Send Message", icon: MessageSquare, onClick: () => onTabChange("messages") },
              {
                label: contact.status === "archived" ? "Restore Contact" : "Archive Contact",
                icon: Package,
                disabled: !editable,
                onClick: () => { onArchive().then(() => onToast(contact.status === "archived" ? "Contact restored" : "Contact archived")) },
              },
              { label: "Export Data", icon: Download, onClick: () => onToast("Export queued — you'll receive a download link by email") },
              { label: "Delete Contact", icon: Trash2, variant: "danger", disabled: !editable, onClick: openDelete },
            ]}
          />
        )}
      </ConfirmDialog>
    </div>
  )
}

export function ContactDetailHeader({ contact, editable, onToast, onArchive, onDelete, onTabChange }: Props) {
  const health = HEALTH_CONFIG[contact.health]

  return (
    <>
      {/* Mobile top bar */}
      <MobileTopBar
        title={contact.full_name}
        subtitle={contact.contact_type}
        showBack
        backHref="/property-manager/contacts"
        primaryAction={{ label: "Edit", icon: Edit, href: `/property-manager/contacts/${contact.id}/edit` }}
        overflowActions={[
          { label: "Message", icon: MessageSquare, onClick: () => onTabChange("messages") },
          { label: "Archive", icon: Package, onClick: onArchive },
          { label: "Delete", icon: Trash2, destructive: true, onClick: onDelete },
        ]}
      />

      {/* Back + breadcrumb */}
      <div className="hidden md:block mb-4">
        <Link href="/property-manager/contacts" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Contacts
        </Link>
        <p className="text-xs text-slate-400">
          <Link href="/property-manager/contacts" className="hover:text-slate-600">Contacts</Link>
          <span className="mx-1">/</span>
          <span className="text-slate-600 font-medium">{contact.full_name}</span>
        </p>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-4">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0", avatarBg(contact.full_name))}>
            {initials(contact.full_name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{contact.full_name}</h1>
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", TYPE_BADGE[contact.contact_type])}>
                {contact.contact_type}
              </span>
              <Badge variant={contact.status === "active" ? "success" : contact.status === "inactive" ? "default" : "danger"} dot>
                {contact.status}
              </Badge>
              <div className="flex items-center gap-1.5 ml-1">
                <span className={cn("w-2 h-2 rounded-full", health.dot)} />
                <span className={cn("text-xs font-medium", health.text)}>{health.label}</span>
              </div>
            </div>
            {contact.company_name && (
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {contact.company_name}
              </p>
            )}
            {contact.contact_type === "supplier" && (contact.service_categories?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Wrench className="w-3 h-3 text-slate-400" />
                {contact.service_categories!.map(cat => (
                  <span key={cat} className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{cat}</span>
                ))}
              </div>
            )}
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {contact.city}{contact.postcode ? `, ${contact.postcode}` : ""}
            </p>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-slate-600">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                <Mail className="w-3.5 h-3.5" /> {contact.email}
              </a>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> {contact.phone}
                </a>
              )}
            </div>
            {contact.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Tag className="w-3 h-3 text-slate-400" />
                {contact.tags.map(t => (
                  <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs capitalize">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="hidden md:block shrink-0">
            <PrimaryActions contact={contact} editable={editable} onToast={onToast} onArchive={onArchive} onDelete={onDelete} onTabChange={onTabChange} />
          </div>
        </div>
      </div>
    </>
  )
}
