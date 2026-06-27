"use client"

import { useState } from "react"
import { Mail, Phone, MapPin, MoreHorizontal, Calendar, Home } from "lucide-react"
import ContactAvatar from "./ContactAvatar"
import ContactTypeBadge from "./ContactTypeBadge"

interface PersonCardContact {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  contact_type: string
  status: string
  city: string | null
  avatar_url: string | null
  company_name: string | null
  tags: string[] | null
  last_interaction_at: string | null
  relationship_health?: string | null
  preferred?: boolean | null
  property_count?: number
  arrears_amount?: number | null
  follow_up?: boolean
}

interface PersonCardProps {
  contact: PersonCardContact
  onClick?: () => void
  onMenuClick?: (action: string) => void
}

const STATUS_DOT: Record<string, string> = {
  active:   "bg-emerald-400",
  inactive: "bg-amber-400",
  archived: "bg-slate-300",
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(amount)
}

const MENU_ACTIONS = ["View", "Edit", "Message", "Archive"] as const

export default function PersonCard({ contact, onClick, onMenuClick }: PersonCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const dotColor = STATUS_DOT[contact.status] ?? STATUS_DOT.inactive

  function handleMenuAction(action: string) {
    setMenuOpen(false)
    onMenuClick?.(action)
  }

  return (
    <div
      className="relative bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
      onClick={onClick}
    >
      {/* Status dot — top right */}
      <span
        className={["absolute top-4 right-4 w-2.5 h-2.5 rounded-full", dotColor].join(" ")}
        aria-label={contact.status}
      />

      {/* Top section: avatar + identity */}
      <div className="flex items-start gap-3 mb-3">
        <ContactAvatar
          name={contact.full_name}
          avatarUrl={contact.avatar_url}
          size="md"
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 text-sm leading-snug truncate pr-6">
            {contact.full_name}
          </p>
          {contact.company_name && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{contact.company_name}</p>
          )}
          <div className="mt-1.5">
            <ContactTypeBadge type={contact.contact_type} size="sm" />
          </div>
        </div>
      </div>

      {/* Contact details */}
      <div className="space-y-1.5 mb-3">
        {contact.city && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{contact.city}</span>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">{contact.phone}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-3" />

      {/* Footer stats */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3 h-3" />
            Last interaction
          </span>
          <span className="text-slate-600 font-medium">{formatDate(contact.last_interaction_at)}</span>
        </div>
        {contact.property_count != null && contact.property_count > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <Home className="w-3 h-3" />
              Properties
            </span>
            <span className="text-slate-600 font-medium">{contact.property_count}</span>
          </div>
        )}
      </div>

      {/* Alert badges */}
      {((contact.arrears_amount != null && contact.arrears_amount > 0) || contact.follow_up) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {contact.arrears_amount != null && contact.arrears_amount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 text-[10px] font-medium px-2 py-0.5">
              {formatCurrency(contact.arrears_amount)} arrears
            </span>
          )}
          {contact.follow_up && (
            <span className="inline-flex items-center rounded-full bg-[var(--color-brand-100)] text-[var(--brand)] text-[10px] font-medium px-2 py-0.5">
              Follow-up
            </span>
          )}
        </div>
      )}

      {/* Three-dot menu */}
      <div className="absolute bottom-4 right-4">
        <button
          type="button"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
          aria-label="Contact actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 bottom-7 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[130px] max-h-[min(60vh,360px)] overflow-y-auto overscroll-contain">
            {MENU_ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMenuAction(action)
                }}
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
