"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Search, UserPlus, Loader2 } from "lucide-react"
import PersonAvatar from "../components/PersonAvatar"
import BusinessLogoAvatar from "../components/BusinessLogoAvatar"
import type { SuggestedContact } from "../types"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

const FILTER_TABS = ["All", "Tenants", "Landlords", "Suppliers", "Other"]

type FilterTab = typeof FILTER_TABS[number]

const TYPE_LABEL: Record<string, string> = {
  tenant: "Tenant",
  landlord: "Landlord",
  supplier: "Supplier",
  applicant: "Applicant",
  agent: "Agent",
  other: "Contact",
}

function mapType(ct: string): SuggestedContact["type"] {
  if (ct === "tenant") return "tenant"
  if (ct === "landlord") return "landlord"
  if (ct === "supplier") return "supplier"
  return "team"
}

interface CopilotStartConversationScreenProps {
  onBack: () => void
  onStartChat: (contact: SuggestedContact) => void
}

export default function CopilotStartConversationScreen({
  onBack,
  onStartChat,
}: CopilotStartConversationScreenProps) {
  const { workspace } = useWorkspace()
  const [search, setSearch]           = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All")
  const [contacts, setContacts]       = useState<SuggestedContact[]>([])
  const [loading, setLoading]         = useState(true)

  const load = useCallback(async () => {
    if (!workspace?.id) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("contacts")
        .select("id, display_name, type, email")
        .eq("workspace_id", workspace.id)
        .order("display_name", { ascending: true })
        .limit(100)

      setContacts(
        (data ?? []).map((c: Record<string, string | null>) => ({
          id: c.id ?? "",
          name: (c.display_name as string | null) ?? "Unknown",
          role: TYPE_LABEL[(c.type as string) ?? "other"] ?? "Contact",
          email: (c.email as string | null) ?? undefined,
          type: mapType((c.type as string) ?? "other"),
        }))
      )
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }, [workspace?.id])

  useEffect(() => { load() }, [load])

  const filtered = contacts.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "Tenants"   && c.type === "tenant") ||
      (activeFilter === "Landlords" && c.type === "landlord") ||
      (activeFilter === "Suppliers" && c.type === "supplier") ||
      (activeFilter === "Other"     && c.type !== "tenant" && c.type !== "landlord" && c.type !== "supplier")

    return matchSearch && matchFilter
  })

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-[14px] font-bold text-slate-900">New conversation</h2>
          <p className="text-[10px] text-slate-400">Choose who to message</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or role…"
            className="w-full pl-8 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-300 focus:bg-white transition-all placeholder-slate-400"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto shrink-0 border-b border-slate-100">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <p className="text-[13px] font-medium">
              {contacts.length === 0 ? "No contacts yet" : "No contacts match"}
            </p>
            <p className="text-[11px] mt-1">
              {contacts.length === 0
                ? "Add contacts in the Contacts section first"
                : "Try a different search or filter"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((contact) => {
              const isBusiness = contact.type === "supplier"
              return (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {isBusiness ? (
                    <BusinessLogoAvatar name={contact.name} size={38} />
                  ) : (
                    <PersonAvatar name={contact.name} size={38} />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-slate-800 truncate">
                      {contact.name}
                    </p>
                    <p className="text-[10.5px] text-slate-500 truncate">{contact.role}</p>
                    {contact.email && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {contact.email}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onStartChat(contact)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10.5px] font-semibold hover:bg-blue-700 transition-colors shrink-0"
                  >
                    Message
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 shrink-0">
        <p className="text-[10px] text-slate-400">
          {loading ? "Loading contacts…" : `${filtered.length} contact${filtered.length === 1 ? "" : "s"}`}
        </p>
        <p className="text-[10px] text-slate-400">Real workspace contacts</p>
      </div>
    </div>
  )
}
