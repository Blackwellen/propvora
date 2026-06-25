"use client"

import { useState } from "react"
import { MapPin, Building, MoreHorizontal } from "lucide-react"
import ContactAvatar from "./ContactAvatar"
import ContactRelHealthBadge from "./ContactRelHealthBadge"

interface OrganisationCardContact {
  id: string
  full_name: string
  company_name: string | null
  contact_type: string
  city: string | null
  logo_url?: string | null
  tags: string[] | null
  preferred?: boolean | null
  relationship_health?: string | null
  last_interaction_at: string | null
  primary_contact_name?: string | null
  primary_contact_role?: string | null
  property_count?: number
}

interface OrganisationCardProps {
  contact: OrganisationCardContact
  onClick?: () => void
}

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-indigo-500",
]

function getColorClass(name: string): string {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return COLORS[sum % 8]
}

function getOrgInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function daysAgo(iso: string | null): string {
  if (!iso) return "—"
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return "today"
  if (diff === 1) return "1 day ago"
  return `${diff} days ago`
}

const MENU_ACTIONS = ["View", "Edit", "Message", "Archive"] as const

export default function OrganisationCard({ contact, onClick }: OrganisationCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = contact.company_name ?? contact.full_name
  const colorClass = getColorClass(displayName)
  const initials = getOrgInitials(displayName)

  return (
    <div
      className="relative bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      {/* Top bar: preferred badge + menu */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {contact.preferred && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2.5 py-0.5 tracking-wide">
              Preferred
            </span>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            aria-label="Organisation actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[130px] max-h-[min(60vh,360px)] overflow-y-auto overscroll-contain">
              {MENU_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logo tile */}
      <div className="flex items-start gap-4 mb-4">
        {contact.logo_url ? (
          <img
            src={contact.logo_url}
            alt={displayName}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100"
          />
        ) : (
          <span
            className={[
              "w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-lg",
              colorClass,
            ].join(" ")}
          >
            {initials}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 text-base leading-snug truncate">{displayName}</p>

          {/* Primary contact row */}
          {contact.primary_contact_name && (
            <div className="flex items-center gap-2 mt-1.5">
              <ContactAvatar name={contact.primary_contact_name} size="xs" />
              <span className="text-xs text-slate-600 truncate">{contact.primary_contact_name}</span>
              {contact.primary_contact_role && (
                <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium px-1.5 py-0.5 shrink-0">
                  {contact.primary_contact_role}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-3">
        {contact.city && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{contact.city}</span>
          </div>
        )}
        {contact.property_count != null && contact.property_count > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Building className="w-3 h-3 shrink-0" />
            <span>{contact.property_count} linked properties</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {contact.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
          {contact.tags.length > 4 && (
            <span className="inline-flex items-center rounded-md bg-slate-100 text-slate-400 text-[10px] px-2 py-0.5">
              +{contact.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Last updated: {daysAgo(contact.last_interaction_at)}
        </span>
        {contact.relationship_health && (
          <ContactRelHealthBadge health={contact.relationship_health} />
        )}
      </div>
    </div>
  )
}
