"use client"

import { MapPin, Home } from "lucide-react"
import ContactAvatar from "./ContactAvatar"
import ContactTypeBadge from "./ContactTypeBadge"

interface ContactBoardCardContact {
  id: string
  full_name: string
  contact_type: string
  company_name: string | null
  avatar_url: string | null
  city: string | null
  tags: string[] | null
  status: string
  arrears_amount?: number | null
  follow_up?: boolean
  last_interaction_at: string | null
  property_address?: string | null
  property_count?: number
}

interface ContactBoardCardProps {
  contact: ContactBoardCardContact
  isDragging?: boolean
}

const STATUS_DOT: Record<string, string> = {
  active:   "bg-emerald-400",
  inactive: "bg-amber-400",
  archived: "bg-slate-300",
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(amount)
}

export default function ContactBoardCard({ contact, isDragging = false }: ContactBoardCardProps) {
  const dotColor = STATUS_DOT[contact.status] ?? STATUS_DOT.inactive

  return (
    <div
      className={[
        "relative bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 transition-all duration-150 select-none",
        isDragging ? "ring-2 ring-[var(--color-brand-400)] shadow-lg rotate-1" : "hover:shadow-md",
      ].join(" ")}
    >
      {/* Status dot top-right */}
      <span
        className={["absolute top-3 right-3 w-2 h-2 rounded-full", dotColor].join(" ")}
        aria-label={contact.status}
      />

      {/* Avatar + name row */}
      <div className="flex items-start gap-2.5 mb-2 pr-4">
        <ContactAvatar
          name={contact.full_name}
          avatarUrl={contact.avatar_url}
          size="sm"
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 truncate leading-snug">{contact.full_name}</p>
          <div className="mt-1">
            <ContactTypeBadge type={contact.contact_type} size="sm" />
          </div>
        </div>
      </div>

      {/* Company subtitle */}
      {contact.company_name && (
        <p className="text-xs text-slate-400 truncate mb-2 ml-0.5">{contact.company_name}</p>
      )}

      {/* Issue badges */}
      {(contact.arrears_amount != null && contact.arrears_amount > 0) || contact.follow_up ? (
        <div className="flex flex-wrap gap-1 mb-2">
          {contact.arrears_amount != null && contact.arrears_amount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 text-[10px] font-medium px-2 py-0.5">
              {formatCurrency(contact.arrears_amount)} arrears
            </span>
          )}
          {contact.follow_up && (
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5">
              Pending Info
            </span>
          )}
        </div>
      ) : null}

      {/* Location */}
      {contact.city && (
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{contact.city}</span>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
          <Home className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {contact.property_address
              ? contact.property_address
              : `${contact.property_count ?? 0} properties`}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
          {formatDate(contact.last_interaction_at)}
        </span>
      </div>
    </div>
  )
}
