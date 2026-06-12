"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import {
  Map, Search, Settings, List, MapPin, Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

const AVATAR_BG = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500"]
function avatarBg(name: string): string { let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h); return AVATAR_BG[Math.abs(h)%AVATAR_BG.length] }
function initials(name: string): string { const p=name.trim().split(/\s+/); return p.length===1?p[0].slice(0,2).toUpperCase():(p[0][0]+p[p.length-1][0]).toUpperCase() }

type ContactType = "tenant" | "landlord" | "supplier" | "professional" | "applicant" | "agent" | "legal"
type TypeFilter = "all" | ContactType

interface ContactEntry {
  id: string
  name: string
  type: ContactType
  city: string
}

const CONTACTS: ContactEntry[] = [
  { id:"c1",  name:"Sarah Mitchell",      type:"tenant",       city:"Birmingham" },
  { id:"c2",  name:"James Okafor",        type:"tenant",       city:"Wolverhampton" },
  { id:"c3",  name:"David Thornton",      type:"landlord",     city:"Coventry" },
  { id:"c4",  name:"Emily Patel",         type:"applicant",    city:"Leicester" },
  { id:"c5",  name:"Kevin Walsh",         type:"supplier",     city:"Stoke-on-Trent" },
  { id:"c6",  name:"Rachel Hughes",       type:"tenant",       city:"Wolverhampton" },
  { id:"c7",  name:"Premier Electrical",  type:"supplier",     city:"Dudley" },
  { id:"c8",  name:"Marcus Webb",         type:"landlord",     city:"Birmingham" },
  { id:"c9",  name:"Priya Sharma",        type:"tenant",       city:"Wolverhampton" },
  { id:"c10", name:"Connor Bradley",      type:"applicant",    city:"Birmingham" },
  { id:"c11", name:"Susan Carter",        type:"agent",        city:"Wolverhampton" },
  { id:"c12", name:"Ahmed Al-Rashid",     type:"applicant",    city:"Leicester" },
  { id:"c13", name:"Harrison & Co",       type:"legal",        city:"Birmingham" },
  { id:"c14", name:"GreenLeaf Accounting",type:"professional", city:"Birmingham" },
]

const CITY_DATA: { city: string; contacts: string[] }[] = [
  { city:"Birmingham",    contacts:["Sarah Mitchell","Marcus Webb","Harrison & Co","GreenLeaf Accounting"] },
  { city:"Wolverhampton", contacts:["James Okafor","Rachel Hughes","Priya Sharma","Susan Carter"] },
  { city:"Coventry",      contacts:["David Thornton"] },
  { city:"Leicester",     contacts:["Emily Patel","Ahmed Al-Rashid"] },
  { city:"Stoke-on-Trent",contacts:["Kevin Walsh"] },
  { city:"Dudley",        contacts:["Premier Electrical"] },
]

const MAX_CITY_COUNT = Math.max(...CITY_DATA.map(c => c.contacts.length))

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

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key:"all",          label:"All" },
  { key:"tenant",       label:"Tenants" },
  { key:"landlord",     label:"Landlords" },
  { key:"supplier",     label:"Suppliers" },
  { key:"professional", label:"Professionals" },
  { key:"agent",        label:"Other" },
]

const CITIES_COUNT = [...new Set(CONTACTS.map(c => c.city))].length

export default function ContactMapPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [selected, setSelected] = useState<string | null>(null)
  const [showMapTip, setShowMapTip] = useState(false)

  const filtered = CONTACTS.filter(c => {
    const matchType = typeFilter === "all" || c.type === typeFilter || (typeFilter === "agent" && (c.type === "agent" || c.type === "legal" || c.type === "professional"))
    const matchSearch = search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <DashboardContainer>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
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

        {/* Split Pane */}
        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden" style={{ minHeight: "600px" }}>
          {/* Left Sidebar */}
          <div className="w-80 shrink-0 border-r border-slate-200 flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div style={{ color:"#94A3B8" }}><Search className="w-3.5 h-3.5" /></div>
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
                <span className="font-semibold text-slate-700">{CITIES_COUNT} cities</span> represented &middot; {CONTACTS.length} contacts total
              </p>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map(c => (
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
                        <div style={{ color:"#94A3B8" }}><MapPin className="w-3 h-3" /></div>
                        <span className="text-[11px] text-slate-400">{c.city}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-xs text-slate-400">No contacts found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Map Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
            {/* Map Placeholder */}
            <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm mb-6">
              <div style={{ color:"#94A3B8" }} className="flex justify-center mb-4">
                <Map className="w-12 h-12" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-2">Map view requires configuration</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                Connect a map provider (Mapbox or Google Maps) in Settings to enable interactive contact mapping.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/app/settings"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configure Map Provider
                </Link>
                <Link
                  href="/app/contacts/people"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium px-4 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  <List className="w-4 h-4" />
                  View as List
                </Link>
              </div>
            </div>

            {/* Contact Location Summary */}
            <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <div style={{ color:"#2563EB" }}><MapPin className="w-4 h-4" /></div>
                Contact Location Summary
              </h4>
              <div className="space-y-4">
                {CITY_DATA.map(cityRow => {
                  const visibleAvatars = cityRow.contacts.slice(0, 3)
                  const overflow = cityRow.contacts.length - 3
                  const barWidth = Math.round((cityRow.contacts.length / MAX_CITY_COUNT) * 100)
                  return (
                    <div key={cityRow.city}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">{cityRow.city}</span>
                          <span className="text-xs text-slate-400">{cityRow.contacts.length} contact{cityRow.contacts.length !== 1 ? "s" : ""}</span>
                        </div>
                        {/* Avatar stack */}
                        <div className="flex items-center">
                          <div className="flex -space-x-1.5">
                            {visibleAvatars.map(name => (
                              <div
                                key={name}
                                className={cn("w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-semibold shrink-0", avatarBg(name))}
                                title={name}
                              >
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
                      {/* Bar */}
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#2563EB] transition-all"
                          style={{ width:`${barWidth}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Enable Map View Callout */}
        <div className="rounded-xl border-l-4 border-l-violet-500 border border-violet-200 bg-violet-50 p-5 flex items-start gap-4">
          <div style={{ color:"#7C3AED" }} className="shrink-0 mt-0.5">
            <Map className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-900 mb-1">Unlock interactive map features</p>
            <p className="text-sm text-violet-700">
              Pin contacts by address, visualise supplier coverage areas, find nearby contacts for a property, and see landlord portfolios by location.
            </p>
          </div>
          <Link
            href="/app/settings"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-violet-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-violet-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configure Map
          </Link>
        </div>
      </div>
    </DashboardContainer>
  )
}
