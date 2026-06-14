"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import {
  Map as MapIcon, Search, Settings, List, MapPin, Info, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspace } from "@/providers/AuthProvider"
import { useContacts } from "@/hooks/useContacts"

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
  const [showMapTip, setShowMapTip] = useState(false)

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

  // City breakdown for the summary panel — derived from live data only.
  const cityData = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const c of entries) {
      if (c.city === "Unknown") continue
      map.set(c.city, [...(map.get(c.city) ?? []), c.name])
    }
    return Array.from(map.entries())
      .map(([city, names]) => ({ city, contacts: names }))
      .sort((a, b) => b.contacts.length - a.contacts.length)
  }, [entries])

  const maxCityCount = Math.max(1, ...cityData.map((c) => c.contacts.length))
  const citiesCount = cityData.length

  return (
    <DashboardContainer>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contact Map</h1>
            <p className="text-sm text-slate-500 mt-1">Contacts by location and coverage area</p>
          </div>
          <div className="relative shrink-0">
            <button
              onMouseEnter={() => setShowMapTip(true)}
              onMouseLeave={() => setShowMapTip(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium px-4 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configure Map
            </button>
            {showMapTip && (
              <div className="absolute right-0 top-full mt-2 z-20 w-72 rounded-xl bg-slate-800 text-white text-xs p-3 shadow-xl">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Map Provider Setup
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Connect Mapbox or Google Maps in Settings &rarr; Integrations to enable interactive contact mapping with pins, coverage areas, and proximity search.
                </p>
              </div>
            )}
          </div>
        </div>

        <ContactsTabNav />

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
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50/50">
            <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 sm:p-8 text-center shadow-sm mb-6">
              <div className="flex justify-center mb-4 text-slate-400">
                <MapIcon className="w-12 h-12" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-2">Map view requires configuration</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                Connect a map provider (Mapbox or Google Maps) in Settings to enable interactive contact mapping.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/app/settings" className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-700 transition-colors">
                  <Settings className="w-4 h-4" />
                  Configure Map Provider
                </Link>
                <Link href="/app/contacts/people" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <List className="w-4 h-4" />
                  View as List
                </Link>
              </div>
            </div>

            {/* Contact Location Summary — live */}
            <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#2563EB]" />
                Contact Location Summary
              </h4>
              {cityData.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No location data yet. Add a city or postcode to your contacts to see them here.</p>
              ) : (
                <div className="space-y-4">
                  {cityData.slice(0, 8).map(cityRow => {
                    const visibleAvatars = cityRow.contacts.slice(0, 3)
                    const overflow = cityRow.contacts.length - 3
                    const barWidth = Math.round((cityRow.contacts.length / maxCityCount) * 100)
                    return (
                      <div key={cityRow.city}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-slate-700 truncate">{cityRow.city}</span>
                            <span className="text-xs text-slate-400 shrink-0">{cityRow.contacts.length} contact{cityRow.contacts.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center shrink-0">
                            <div className="flex -space-x-1.5">
                              {visibleAvatars.map(name => (
                                <div key={name} className={cn("w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-semibold shrink-0", avatarBg(name))} title={name}>
                                  {initials(name)}
                                </div>
                              ))}
                            </div>
                            {overflow > 0 && (
                              <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-semibold -ml-1.5">
                                +{overflow}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-[#2563EB] transition-all" style={{ width:`${barWidth}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enable Map View Callout */}
        <div className="rounded-xl border-l-4 border-l-violet-500 border border-violet-200 bg-violet-50 p-5 flex items-start gap-4 flex-wrap sm:flex-nowrap">
          <div className="shrink-0 mt-0.5 text-violet-600">
            <MapIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-900 mb-1">Unlock interactive map features</p>
            <p className="text-sm text-violet-700">
              Pin contacts by address, visualise supplier coverage areas, find nearby contacts for a property, and see landlord portfolios by location.
            </p>
          </div>
          <Link href="/app/settings" className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-violet-700 transition-colors">
            <Settings className="w-4 h-4" />
            Configure Map
          </Link>
        </div>
      </div>
    </DashboardContainer>
  )
}
