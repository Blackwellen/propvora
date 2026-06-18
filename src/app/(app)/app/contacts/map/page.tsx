"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { MobileTopBar } from "@/components/mobile"
import {
  Search, MapPin, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { useContacts } from "@/hooks/useContacts"
import type { ContactCityEntry } from "@/components/contacts/ContactMapInner"

const ContactMapInner = dynamic(() => import("@/components/contacts/ContactMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center rounded-r-xl">
      <div className="text-slate-300 text-sm font-medium">Loading map…</div>
    </div>
  ),
})

const AVATAR_BG = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500"]
function avatarBg(name: string): string { let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h); return AVATAR_BG[Math.abs(h)%AVATAR_BG.length] }
function initials(name: string): string { const p=name.trim().split(/\s+/); return p.length===1?p[0].slice(0,2).toUpperCase():(p[0][0]+p[p.length-1][0]).toUpperCase() }

type TypeFilter = "all" | "tenant" | "landlord" | "supplier" | "professional" | "applicant" | "agent"

function typeBadge(type: string): string {
  const map: Record<string, string> = {
    tenant:       "bg-violet-100 text-violet-700",
    landlord:     "bg-blue-100 text-blue-700",
    supplier:     "bg-amber-100 text-amber-700",
    applicant:    "bg-sky-100 text-sky-700",
    agent:        "bg-teal-100 text-teal-700",
    legal:        "bg-rose-100 text-rose-700",
    professional: "bg-indigo-100 text-indigo-700",
  }
  return map[type] ?? "bg-slate-100 text-slate-500"
}

const TYPE_FILTERS: { key: TypeFilter; label: string; types: string[] }[] = [
  { key:"all",          label:"All",           types: [] },
  { key:"tenant",       label:"Tenants",       types: ["tenant", "post_tenant"] },
  { key:"landlord",     label:"Landlords",     types: ["landlord"] },
  { key:"supplier",     label:"Suppliers",     types: ["supplier", "maintenance", "cleaning", "emergency_contractor"] },
  { key:"professional", label:"Professionals", types: ["legal", "accountant", "insurer", "agent"] },
  { key:"applicant",    label:"Applicants",    types: ["applicant"] },
]

export default function ContactMapPage() {
  const { workspace } = useWorkspace()
  const { data: liveContacts = [], isLoading } = useContacts(workspace?.id)

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [selected, setSelected] = useState<string | null>(null)
  // Map live contacts → entries with a usable city label (city, else postcode).
  const entries = useMemo(() => {
    return liveContacts.map((c) => ({
      id: c.id,
      name: c.full_name || c.company_name || "Unnamed contact",
      type: c.contact_type,
      city: c.city || c.postcode || "Unknown",
    }))
  }, [liveContacts])

  const filtered = useMemo(() => {
    const allowed = TYPE_FILTERS.find((f) => f.key === typeFilter)?.types ?? []
    return entries.filter((c) => {
      const matchType = typeFilter === "all" || allowed.includes(c.type)
      const matchSearch = search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
      return matchType && matchSearch
    })
  }, [entries, typeFilter, search])

  // City breakdown for the map + summary panel — derived from live data only.
  const cityData = useMemo((): ContactCityEntry[] => {
    const map = new Map<string, { id: string; name: string; type: string }[]>()
    for (const c of entries) {
      if (c.city === "Unknown") continue
      map.set(c.city, [...(map.get(c.city) ?? []), { id: c.id, name: c.name, type: c.type }])
    }
    return Array.from(map.entries())
      .map(([city, contacts]) => ({ city, contacts }))
      .sort((a, b) => b.contacts.length - a.contacts.length)
  }, [entries])

  const citiesCount = cityData.length

  return (
    <DashboardContainer>
      <MobileTopBar title="Contact Map" subtitle="By location" />
      <div className="md:hidden -mx-4">
        <ContactsTabNav />
      </div>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="hidden md:flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contact Map</h1>
            <p className="text-sm text-slate-500 mt-1">Contacts by location — hover a circle to see details</p>
          </div>
        </div>

        <div className="hidden md:block">
          <ContactsTabNav />
        </div>

        {/* Split Pane — stacks on mobile, side-by-side on lg+ */}
        <div className="flex flex-col lg:flex-row rounded-xl border border-slate-200 bg-white overflow-hidden lg:min-h-[600px]">
          {/* Sidebar */}
          <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search contacts or city…"
                  className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Type Filter Pills */}
            <div className="p-3 border-b border-slate-100 flex flex-wrap gap-1.5">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border",
                    typeFilter === f.key
                      ? "bg-[#2563EB] text-white border-[#2563EB]"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Location Stats */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <p className="text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">{citiesCount} cities</span> represented &middot; {entries.length} contacts total
              </p>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto max-h-[320px] lg:max-h-none">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading contacts…</div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">{entries.length === 0 ? "No contacts yet" : "No contacts found"}</p>
                </div>
              ) : filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id === selected ? null : c.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3",
                    selected === c.id ? "bg-blue-50 border-l-2 border-l-[#2563EB]" : ""
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0", avatarBg(c.name))}>
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{c.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize", typeBadge(c.type))}>
                        {c.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-400 truncate">{c.city}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative min-h-[380px] lg:min-h-0">
            {cityData.length === 0 && !isLoading ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-r-xl">
                <div className="text-center p-8">
                  <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500">No contacts with location data yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add a city or postcode to your contacts to plot them here</p>
                </div>
              </div>
            ) : (
              <ContactMapInner
                cityData={cityData}
                selectedId={selected}
                onSelectCity={(city) => {
                  const first = cityData.find(c => c.city === city)?.contacts[0]
                  if (first) setSelected(first.id)
                }}
              />
            )}

            {/* Legend overlay */}
            {cityData.length > 0 && (
              <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm px-3 py-2.5 text-[11px] text-slate-600 pointer-events-none">
                <p className="font-semibold text-slate-800 mb-1.5">Contact types</p>
                {[
                  { label: 'Landlord', color: '#2563EB' },
                  { label: 'Tenant', color: '#7C3AED' },
                  { label: 'Supplier', color: '#D97706' },
                  { label: 'Applicant', color: '#0EA5E9' },
                  { label: 'Professional', color: '#4F46E5' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    {label}
                  </div>
                ))}
                <p className="text-slate-400 mt-1.5">Circle size = contact count</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardContainer>
  )
}
