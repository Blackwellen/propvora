"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import {
  BedDouble, Search, X, Mail, Phone, MapPin, ArrowUpRight,
  CalendarCheck, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { MobileTopBar } from "@/components/mobile"
import { SEED_BOOKINGS } from "@/lib/property-manager/bookings/seed"
import type { Booking } from "@/lib/property-manager/bookings/types"

function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100)
}

interface Guest {
  key: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  bookings: number
  totalSpend: number
  lastProperty: string
  lastLocation: string
  lastDate: string
  type: "Short stay" | "Long-term" | "Mixed"
}

/** Aggregate booking rows into a unique guest list (keyed by email or name). */
function buildGuests(rows: Booking[]): Guest[] {
  const map = new Map<string, Guest>()
  for (const b of rows) {
    const key = (b.guest_email || b.guest_name).toLowerCase()
    const existing = map.get(key)
    const isLong = b.booking_type === "long_term"
    if (existing) {
      existing.bookings += 1
      existing.totalSpend += b.total_amount
      // Most recent check-in wins for "last stay" fields.
      if (b.check_in_date > existing.lastDate) {
        existing.lastDate = b.check_in_date
        existing.lastProperty = b.property_name
        existing.lastLocation = b.property_location
      }
      const wasLong = existing.type === "Long-term"
      if ((isLong && !wasLong) || (!isLong && wasLong)) existing.type = "Mixed"
    } else {
      map.set(key, {
        key,
        name: b.guest_name,
        email: b.guest_email,
        phone: b.guest_phone,
        avatar: b.guest_avatar,
        bookings: 1,
        totalSpend: b.total_amount,
        lastProperty: b.property_name,
        lastLocation: b.property_location,
        lastDate: b.check_in_date,
        type: isLong ? "Long-term" : "Short stay",
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate))
}

const TYPE_TONE: Record<Guest["type"], string> = {
  "Short stay": "bg-blue-50 text-blue-700 border-blue-200",
  "Long-term": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Mixed: "bg-violet-50 text-violet-700 border-violet-200",
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function GuestsPage() {
  const [query, setQuery] = useState("")
  const guests = useMemo(() => buildGuests(SEED_BOOKINGS), [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return guests
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.email ?? "").toLowerCase().includes(q) ||
        g.lastProperty.toLowerCase().includes(q),
    )
  }, [guests, query])

  const totalGuests = guests.length
  const repeatGuests = guests.filter((g) => g.bookings > 1).length
  const longTerm = guests.filter((g) => g.type !== "Short stay").length

  return (
    <>
      <MobileTopBar title="Guests" subtitle="Stay guests" />
      <div className="md:hidden -mx-4 mb-4"><ContactsTabNav /></div>

      <DashboardContainer>
        <div className="hidden md:block -mx-6 mb-5">
          <ContactsTabNav />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-blue-600" />
              Guests
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Everyone who has stayed across your short-let and long-term bookings.
            </p>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total guests", value: totalGuests },
            { label: "Repeat guests", value: repeatGuests },
            { label: "Long-term residents", value: longTerm },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by guest, email or property…"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Guest</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Latest stay</th>
                  <th className="text-center px-4 py-3">Bookings</th>
                  <th className="text-right px-4 py-3">Total spend</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g) => (
                  <tr key={g.key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {g.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={g.avatar} alt={g.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                            {g.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{g.name}</p>
                          {g.bookings > 1 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                              <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" /> Repeat guest
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 text-slate-600">
                        {g.email && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {g.email}
                          </span>
                        )}
                        {g.phone && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {g.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{g.lastProperty}</p>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" /> {g.lastLocation}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <CalendarCheck className="w-3 h-3" /> {fmtDate(g.lastDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-800">{g.bookings}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{gbp(g.totalSpend)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", TYPE_TONE[g.type])}>
                        {g.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/app/bookings"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        Bookings <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No guests match your search.</p>
            </div>
          )}
        </div>
      </DashboardContainer>
    </>
  )
}
