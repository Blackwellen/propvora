"use client"

import React from "react"
import Link from "next/link"
import { MessageSquare, Mail, Phone, MapPin, Wrench, ArrowUpRight, ChevronDown, Eye, Edit, Archive, Trash2, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useUpdateContact, useDeleteContact } from "@/hooks/useContacts"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import type { MappedContact } from "./types"
import { TYPE_BADGE, avatarBg, getInitials, relativeTime, formatDate } from "./types"
import type { Contact } from "@/types/database"

// ---- Shared primitives ----
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-11 h-11 text-sm" : "w-10 h-10 text-sm"
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-semibold shrink-0", avatarBg(name), sz)}>
      {getInitials(name)}
    </div>
  )
}

export function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_BADGE[type] ?? { label: type, cls: "bg-slate-100 text-slate-600" }
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  )
}

export function ContactRowMenu({ contact, align = "right" }: { contact: MappedContact; align?: "left" | "right" }) {
  const router = useRouter()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const archived = contact.status === "archived"

  async function toggleArchive() {
    await updateContact.mutateAsync({
      id: contact.id,
      workspaceId: contact.workspace_id,
      payload: { status: archived ? "active" : "archived" } as Partial<Contact>,
    })
  }
  async function remove() {
    await deleteContact.mutateAsync({ id: contact.id, workspaceId: contact.workspace_id })
  }

  return (
    <ConfirmDialog
      title="Delete contact?"
      description={`This permanently deletes ${contact.full_name} and cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={remove}
    >
      {(openDelete) => (
        <ActionMenu
          align={align}
          items={[
            { label: "View Profile", icon: Eye, onClick: () => router.push(`/property-manager/contacts/${contact.id}`) },
            { label: "Edit", icon: Edit, onClick: () => router.push(`/property-manager/contacts/${contact.id}/edit`) },
            { label: "Message", icon: MessageSquare, onClick: () => router.push(`/property-manager/messages?contact_id=${contact.id}`) },
            { label: archived ? "Restore" : "Archive", icon: Archive, disabled: contact.is_demo, onClick: () => { toggleArchive() } },
            { label: "Delete", icon: Trash2, variant: "danger", disabled: contact.is_demo, onClick: openDelete },
          ]}
        />
      )}
    </ConfirmDialog>
  )
}

// ---- Grid Card ----
export function GridContactCard({ contact }: { contact: MappedContact }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 relative group">
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={contact.full_name} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate pr-5">{contact.full_name}</p>
          {contact.company_name && <p className="text-xs text-slate-500 truncate">{contact.company_name}</p>}
          <div className="mt-1"><TypeBadge type={contact.contact_type} /></div>
        </div>
        <div className="shrink-0">
          <ContactRowMenu contact={contact} />
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {contact.email && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone className="w-3 h-3 shrink-0" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.city && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{contact.city}</span>
          </div>
        )}
      </div>

      {contact.service_categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {contact.service_categories.slice(0, 3).map(cat => (
            <span key={cat} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium">
              <Wrench className="w-2.5 h-2.5" />{cat}
            </span>
          ))}
          {contact.service_categories.length > 3 && (
            <span className="text-[10px] text-slate-400">+{contact.service_categories.length - 3}</span>
          )}
        </div>
      )}

      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {contact.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">{tag}</span>
          ))}
          {contact.tags.length > 3 && (
            <span className="text-[10px] text-slate-400">+{contact.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-[10px] text-slate-400">{relativeTime(contact.updated_at)}</span>
        <div className="flex items-center gap-1">
          <Link href={`/property-manager/messages?contact_id=${contact.id}`} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600" title="Message">
            <MessageSquare className="w-3.5 h-3.5" />
          </Link>
          <Link href={`/property-manager/contacts/${contact.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#2563EB] text-white hover:bg-[#1d4ed8] transition-colors">
            View <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ---- List Row ----
export function ListContactRow({ contact }: { contact: MappedContact }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group">
      <Avatar name={contact.full_name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors">{contact.full_name}</span>
          <TypeBadge type={contact.contact_type} />
          {contact.city && (
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />{contact.city}
            </span>
          )}
        </div>
        {contact.email && <p className="text-xs text-slate-500 mt-0.5">{contact.email}</p>}
      </div>
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 shrink-0">
        <span>{relativeTime(contact.updated_at)}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link href={`/property-manager/contacts/${contact.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
          View <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

// ---- Table ----
export function ContactsTable({
  contacts, isLoading, onClearFilters,
}: {
  contacts: MappedContact[]
  isLoading: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Contact","Type","Service","Email","Phone","Location","Status","Last Updated","Actions"].map(col => (
                <th key={col} className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {col}
                    {["Contact","Type","Last Updated"].includes(col) && (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center text-sm text-slate-400">
                  No contacts match your filters.{" "}
                  <button onClick={onClearFilters} className="text-[#2563EB] hover:underline">Clear filters</button>
                </td>
              </tr>
            ) : (
              contacts.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.full_name} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{c.full_name}</p>
                        {c.company_name && <p className="text-xs text-slate-500 truncate max-w-[140px]">{c.company_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><TypeBadge type={c.contact_type} /></td>
                  <td className="px-4 py-3">
                    {c.service_categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.service_categories.slice(0, 2).map(cat => (
                          <span key={cat} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium whitespace-nowrap">{cat}</span>
                        ))}
                        {c.service_categories.length > 2 && (
                          <span className="text-[10px] text-slate-400">+{c.service_categories.length - 2}</span>
                        )}
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {c.email
                      ? <a href={`mailto:${c.email}`} className="hover:text-[#2563EB] transition-colors truncate block max-w-[180px]">{c.email}</a>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      c.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      c.status === "inactive" ? "bg-slate-100 text-slate-500" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(c.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/property-manager/contacts/${c.id}`} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#2563EB] transition-colors">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                      <ContactRowMenu contact={c} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && contacts.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <span>{contacts.length} contacts shown</span>
          <div className="flex items-center gap-2">
            <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40">Previous</button>
            <span className="px-2">Page 1</span>
            <button disabled className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Empty State ----
export function ContactsEmptyState({ onAdd, onClear, hasFilters }: { onAdd: () => void; onClear: () => void; hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="col-span-full py-20 text-center">
        <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-400">No contacts match your filters</p>
        <button onClick={onClear} className="mt-2 text-xs text-[#2563EB] hover:underline">Clear filters</button>
      </div>
    )
  }
  return (
    <div className="py-20 text-center">
      <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-400">No contacts yet</p>
      <button onClick={onAdd} className="mt-2 text-xs text-[#2563EB] hover:underline">Add your first contact</button>
    </div>
  )
}

// ---- Skeleton ----
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4" />
          <div className="h-2 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-slate-100 rounded" />
        <div className="h-2 bg-slate-100 rounded w-5/6" />
      </div>
    </div>
  )
}
