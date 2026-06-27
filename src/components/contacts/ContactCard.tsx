"use client"

import React from "react"
import Link from "next/link"
import { MessageSquare, Phone, Edit, Building2, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

export type ContactType =
  | "tenant"
  | "landlord"
  | "supplier"
  | "agent"
  | "applicant"
  | "other"

export interface Contact {
  id: string
  full_name: string
  email: string
  phone?: string
  company?: string
  contact_type: ContactType
  status: "active" | "inactive" | "lead"
  linked_properties: number
  active_tenancies: number
  last_activity?: string
  arrears?: number
  tags?: string[]
}

const TYPE_COLOURS: Record<ContactType, string> = {
  tenant:    "bg-emerald-100 text-emerald-700",
  landlord:  "bg-[var(--color-brand-100)] text-[var(--brand)]",
  supplier:  "bg-amber-100 text-amber-700",
  agent:     "bg-violet-100 text-violet-700",
  applicant: "bg-sky-100 text-sky-700",
  other:     "bg-slate-100 text-slate-600",
}

const AVATAR_COLOURS = [
  "bg-[var(--brand)]", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-fuchsia-500", "bg-teal-500",
]

function getAvatarColour(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface ContactCardProps {
  contact: Contact
  onMessage?: (id: string) => void
  onCall?: (id: string) => void
  onEdit?: (id: string) => void
}

export function ContactCard({ contact, onMessage, onCall, onEdit }: ContactCardProps) {
  const avatarColour = getAvatarColour(contact.full_name)
  const initials = getInitials(contact.full_name)

  return (
    <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-5 hover:shadow-md transition-all duration-150 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={`/property-manager/contacts/${contact.id}`} className="shrink-0">
          <div
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm",
              avatarColour
            )}
          >
            {initials}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/property-manager/contacts/${contact.id}`}
              className="text-sm font-semibold text-slate-900 hover:text-[var(--brand)] transition-colors truncate"
            >
              {contact.full_name}
            </Link>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                TYPE_COLOURS[contact.contact_type]
              )}
            >
              {contact.contact_type}
            </span>
          </div>
          {contact.company && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{contact.company}</p>
          )}
        </div>
        <Badge
          variant={
            contact.status === "active"
              ? "success"
              : contact.status === "lead"
              ? "warning"
              : "default"
          }
          size="sm"
          dot
          className="shrink-0"
        >
          {contact.status}
        </Badge>
      </div>

      {/* Contact info */}
      <div className="space-y-1">
        <p className="text-xs text-slate-600 truncate">{contact.email}</p>
        {contact.phone && (
          <p className="text-xs text-slate-500">{contact.phone}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>{contact.linked_properties} propert{contact.linked_properties === 1 ? "y" : "ies"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5" />
          <span>{contact.active_tenancies} tenanc{contact.active_tenancies === 1 ? "y" : "ies"}</span>
        </div>
      </div>

      {/* Arrears warning */}
      {contact.arrears && contact.arrears > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-1.5">
          <p className="text-xs font-medium text-red-700">
            Arrears: £{contact.arrears.toLocaleString("en-GB")}
          </p>
        </div>
      )}

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {contact.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs"
            >
              {tag}
            </span>
          ))}
          {contact.tags.length > 3 && (
            <span className="text-xs text-slate-400">+{contact.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          onClick={() => onMessage?.(contact.id)}
          className="flex-1 text-xs"
        >
          Message
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Phone className="w-3.5 h-3.5" />}
          onClick={() => onCall?.(contact.id)}
          className="flex-1 text-xs"
        >
          Call
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Edit className="w-3.5 h-3.5" />}
          onClick={() => onEdit?.(contact.id)}
          className="flex-1 text-xs"
        >
          Edit
        </Button>
      </div>
    </div>
  )
}
