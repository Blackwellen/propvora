"use client"

import { useState } from "react"
import { ArrowLeft, Search, UserPlus } from "lucide-react"
import PersonAvatar from "../components/PersonAvatar"
import BusinessLogoAvatar from "../components/BusinessLogoAvatar"
import type { SuggestedContact } from "../types"

const FILTER_TABS = ["All", "People", "Tenants", "Landlords", "Suppliers", "Businesses", "Team"]

interface ContactSection {
  title: string
  emoji: string
  contacts: SuggestedContact[]
}

const SECTIONS: ContactSection[] = [
  {
    title: "Suggested contacts",
    emoji: "✦",
    contacts: [
      { id: "s1", name: "James Carter", role: "Property Manager", company: "Brookfield Services", property: "16 Rose Gardens", type: "team" },
      { id: "s2", name: "Sarah Mitchell", role: "Tenancy Manager", company: "Brookfield Services", property: "16 Rose Gardens", unit: "Flat 4B", type: "tenant" },
      { id: "s3", name: "Michael O'Connor", role: "Landlord", property: "16 Rose Gardens", type: "landlord" },
    ],
  },
  {
    title: "Recently contacted",
    emoji: "🕐",
    contacts: [
      { id: "r1", name: "Emily Johnson", role: "Finance Director", company: "Brookfield Services", type: "team" },
      { id: "r2", name: "David Patel", role: "Maintenance Lead", company: "Brookfield Services", type: "team" },
      { id: "r3", name: "Olivia Bennett", role: "Tenant", property: "16 Rose Gardens", unit: "Flat 6A", type: "tenant" },
    ],
  },
  {
    title: "Tenants",
    emoji: "👤",
    contacts: [
      { id: "t1", name: "Daniel Wright", role: "Tenant", property: "16 Rose Gardens", unit: "Flat 5C", type: "tenant" },
      { id: "t2", name: "Priya Shah", role: "Tenant", property: "16 Rose Gardens", unit: "Flat 1B", type: "tenant" },
    ],
  },
  {
    title: "Landlords",
    emoji: "🏠",
    contacts: [
      { id: "l1", name: "Richard Evans", role: "Landlord", type: "landlord" },
      { id: "l2", name: "Helen Moore", role: "Landlord", property: "23 Park View", type: "landlord" },
    ],
  },
  {
    title: "Suppliers",
    emoji: "🔧",
    contacts: [
      { id: "sup1", name: "Metro Plumbing Ltd", role: "Plumbing & Heating", email: "info@metroplumbing.co.uk", type: "supplier" },
      { id: "sup2", name: "CleanCo Solutions", role: "Cleaning Services", type: "supplier" },
      { id: "sup3", name: "BuildRight Contractors", role: "General Contractors", type: "supplier" },
    ],
  },
  {
    title: "Businesses",
    emoji: "🏢",
    contacts: [
      { id: "b1", name: "Brookfield Services", role: "32 properties", type: "business" },
      { id: "b2", name: "Rose Gardens Management Ltd", role: "48 properties", type: "business" },
    ],
  },
  {
    title: "Team",
    emoji: "👥",
    contacts: [
      { id: "tm1", name: "Alex Turner", role: "Compliance Officer", company: "Propvora", type: "team" },
      { id: "tm2", name: "Sophie Williams", role: "Accounts Manager", company: "Propvora", type: "team" },
    ],
  },
]

interface CopilotStartConversationScreenProps {
  onBack: () => void
  onStartChat: (contact: SuggestedContact) => void
}

export default function CopilotStartConversationScreen({
  onBack,
  onStartChat,
}: CopilotStartConversationScreenProps) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")

  const filteredSections = SECTIONS.filter((sec) => {
    if (activeFilter === "All") return true
    if (activeFilter === "People") return sec.title !== "Businesses"
    const filterLower = activeFilter.toLowerCase()
    return sec.title.toLowerCase().includes(filterLower)
  })

  const searchFiltered = filteredSections.map((sec) => ({
    ...sec,
    contacts: sec.contacts.filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase()) ||
        (c.company ?? "").toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((sec) => sec.contacts.length > 0)

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
            placeholder="Search by name, company, email, property, or role..."
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

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0 flex flex-col gap-4">
        {searchFiltered.map((sec) => (
          <div key={sec.title}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <span className="mr-1">{sec.emoji}</span>
                {sec.title}
              </p>
              <button className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                View all →
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {sec.contacts.map((contact) => {
                const isBusiness = contact.type === "business" || contact.type === "supplier"
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
                      <p className="text-[10.5px] text-slate-500 truncate">
                        {contact.role}
                        {contact.company ? ` · ${contact.company}` : ""}
                      </p>
                      {(contact.property ?? contact.email) && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {contact.email
                            ? `✉ ${contact.email}`
                            : `📍 ${contact.property}${contact.unit ? ` – ${contact.unit}` : ""}`}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onStartChat(contact)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10.5px] font-semibold hover:bg-blue-700 transition-colors shrink-0"
                    >
                      Start chat
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 shrink-0">
        <button className="flex items-center gap-1.5 text-[11px] text-violet-600 font-semibold hover:text-violet-800 transition-colors">
          <UserPlus className="w-3.5 h-3.5" />
          Invite a contact
        </button>
        <p className="text-[10px] text-slate-400">Type a name to search</p>
      </div>
    </div>
  )
}
