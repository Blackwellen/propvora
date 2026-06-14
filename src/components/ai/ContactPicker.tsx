"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"
import type { MockContact } from "./InboxPanel"

type PickerContact = MockContact & { lastContact?: string }

/** Maps a live contact `type` enum value to a picker contact type. */
function normaliseType(type: string | null): MockContact["type"] {
  const t = (type ?? "").toLowerCase()
  if (t === "tenant" || t === "landlord" || t === "supplier" || t === "agent" ||
      t === "applicant" || t === "professional") {
    return t as MockContact["type"]
  }
  return "other"
}

const AVATAR_COLOURS: Record<MockContact["type"], string> = {
  tenant:       "bg-[#2563EB]",
  landlord:     "bg-[#059669]",
  supplier:     "bg-[#D97706]",
  agent:        "bg-[#7C3AED]",
  applicant:    "bg-[#2563EB]",
  professional: "bg-[#64748B]",
  other:        "bg-[#94A3B8]",
}

const TYPE_LABELS: Record<MockContact["type"], string> = {
  tenant:       "Tenant",
  landlord:     "Landlord",
  supplier:     "Supplier",
  agent:        "Agent",
  applicant:    "Applicant",
  professional: "Professional",
  other:        "Other",
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/* ------------------------------------------------------------------ */
/* ContactPicker                                                        */
/* ------------------------------------------------------------------ */
interface ContactPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (contact: MockContact) => void
}

export default function ContactPicker({ open, onClose, onSelect }: ContactPickerProps) {
  const { workspace } = useWorkspace()
  const [search, setSearch] = useState("")
  const [contacts, setContacts] = useState<PickerContact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // Load real, workspace-scoped contacts when the picker opens.
  useEffect(() => {
    if (!open || !workspace?.id) return
    let cancelled = false
    setLoading(true)
    setError(false)
    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error: qErr } = await supabase
          .from("contacts")
          .select("id, display_name, type")
          .eq("workspace_id", workspace.id)
          .is("deleted_at", null)
          .order("display_name", { ascending: true })
          .limit(100)
        if (cancelled) return
        if (qErr) { setError(true); setContacts([]); return }
        setContacts(
          (data ?? []).map((c) => ({
            id: c.id as string,
            name: (c.display_name as string) ?? "Unnamed contact",
            type: normaliseType(c.type as string | null),
          }))
        )
      } catch {
        if (!cancelled) { setError(true); setContacts([]) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [open, workspace?.id])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return contacts
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
    )
  }, [search, contacts])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className={cn(
        "relative z-10 w-full max-w-sm",
        "bg-white rounded-2xl shadow-2xl",
        "border border-slate-200",
        "overflow-hidden flex flex-col max-h-[70vh]",
        "animate-[slideUp_200ms_ease-out]"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">
            New Conversation
          </p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search contacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full h-9 pl-8 pr-3 rounded-lg text-sm",
                "bg-slate-100 border-transparent",
                "text-slate-700 placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
              )}
            />
          </div>
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Couldn&apos;t load contacts. Please try again.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              {search ? "No contacts found" : "No contacts yet. Add contacts to start a conversation."}
            </p>
          ) : (
            filtered.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelect(contact)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left",
                  "hover:bg-slate-50 transition-colors",
                  "border-b border-slate-100 last:border-0"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0",
                  AVATAR_COLOURS[contact.type]
                )}>
                  {getInitials(contact.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {contact.name}
                  </p>
                  {contact.lastContact && (
                    <p className="text-[11px] text-slate-400">Last contact: {contact.lastContact}</p>
                  )}
                </div>

                {/* Type badge */}
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
                  contact.type === "tenant" && "bg-blue-100 text-blue-700",
                  contact.type === "landlord" && "bg-emerald-100 text-emerald-700",
                  contact.type === "supplier" && "bg-amber-100 text-amber-700",
                  contact.type === "agent" && "bg-purple-100 text-purple-700",
                )}>
                  {TYPE_LABELS[contact.type]}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
