"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, MapPin, MessageSquare, Eye, Edit, Archive, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { useUpdateContact, useDeleteContact } from "@/hooks/useContacts"
import type { Contact } from "@/types/database"

const AVATAR_BG = ["bg-[var(--brand)]","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500"]

function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}

function getInitials(name: string): string {
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  tenant:              { label: "Tenant",       cls: "bg-emerald-100 text-emerald-700" },
  post_tenant:         { label: "Past Tenant",  cls: "bg-slate-100 text-slate-600" },
  applicant:           { label: "Applicant",    cls: "bg-sky-100 text-sky-700" },
  landlord:            { label: "Landlord",     cls: "bg-[var(--color-brand-100)] text-[var(--brand)]" },
  guarantor:           { label: "Guarantor",    cls: "bg-violet-100 text-violet-700" },
  local_authority:     { label: "Local Auth",   cls: "bg-teal-100 text-teal-700" },
  housing_association: { label: "Housing Assoc",cls: "bg-teal-100 text-teal-700" },
  other:               { label: "Other",        cls: "bg-slate-100 text-slate-600" },
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_BADGE[type] ?? { label: type, cls: "bg-slate-100 text-slate-600" }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const color = status === "active" ? "bg-emerald-400" : status === "inactive" ? "bg-amber-400" : "bg-slate-300"
  return <span className={cn("w-2 h-2 rounded-full shrink-0", color)} />
}

interface PersonListRowProps {
  contact: Contact
}

export function PersonListRow({ contact }: PersonListRowProps) {
  const router = useRouter()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const archived = contact.status === "archived"
  const isDemo = contact.is_demo === true

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0", avatarBg(contact.full_name))}>
        {getInitials(contact.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 group-hover:text-[var(--brand)] transition-colors">{contact.full_name}</span>
          <TypeBadge type={contact.contact_type} />
          {contact.city && (
            <span className="hidden sm:flex items-center gap-0.5 text-xs text-slate-400">
              <MapPin className="w-3 h-3" />{contact.city}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {contact.email && <span className="text-xs text-slate-500 truncate max-w-[200px]">{contact.email}</span>}
          {contact.phone && <span className="text-xs text-slate-400">{contact.phone}</span>}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-3 shrink-0">
        <StatusDot status={contact.status} />
        <span className="text-xs text-slate-500 capitalize">{contact.status}</span>
      </div>
      <div className="hidden lg:block text-xs text-slate-400 shrink-0 w-24 text-right">
        {relativeTime(contact.updated_at)}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/property-manager/messages?contact_id=${contact.id}`}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Message"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </Link>
        <Link
          href={`/property-manager/contacts/${contact.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          View <ArrowUpRight className="w-3 h-3" />
        </Link>
        <ConfirmDialog
          title="Delete contact?"
          description={`This permanently deletes ${contact.full_name} and cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={async () => { await deleteContact.mutateAsync({ id: contact.id, workspaceId: contact.workspace_id }) }}
        >
          {(openDelete) => (
            <ActionMenu
              align="right"
              items={[
                { label: "View Profile", icon: Eye, onClick: () => router.push(`/property-manager/contacts/${contact.id}`) },
                { label: "Edit", icon: Edit, onClick: () => router.push(`/property-manager/contacts/${contact.id}/edit`) },
                { label: "Message", icon: MessageSquare, onClick: () => router.push(`/property-manager/messages?contact_id=${contact.id}`) },
                { label: archived ? "Restore" : "Archive", icon: Archive, disabled: isDemo, onClick: () => { updateContact.mutate({ id: contact.id, workspaceId: contact.workspace_id, payload: { status: archived ? "active" : "archived" } as Partial<Contact> }) } },
                { label: "Delete", icon: Trash2, variant: "danger", disabled: isDemo, onClick: openDelete },
              ]}
            />
          )}
        </ConfirmDialog>
      </div>
    </div>
  )
}
