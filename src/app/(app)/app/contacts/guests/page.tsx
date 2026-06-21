"use client"

/**
 * Guests page — Contacts > Guests
 *
 * Gated behind the `bookingManagement` v2 feature flag via the sibling layout.tsx.
 * When the flag is on this page queries the live `bookings` table (workspace-scoped).
 * If the bookings table has not been migrated yet (42P01) we show a graceful
 * "table not yet available" state rather than a crash.
 *
 * IMPORTANT: SEED_BOOKINGS is intentionally NOT imported here — this page must only
 * ever display real data. If no bookings exist, show the empty state.
 */

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BedDouble, Search, X, Mail, Phone, MapPin, ArrowUpRight,
  CalendarCheck, Star, Loader2, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { ContactsTabNav } from "@/components/contacts/ContactsTabNav"
import { MobileTopBar } from "@/components/mobile"
import { createClient } from "@/lib/supabase/client"
import { useWorkspace } from "@/providers/AuthProvider"

function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100)
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface RawBooking {
  id: string
  guest_name: string
  guest_email: string | null
  guest_phone: string | null
  property_name: string | null
  property_location: string | null
  check_in_date: string
  booking_type: string | null
  total_amount: number | null
}

interface Guest {
  key: string
  name: string
  email?: string
  phone?: string
  bookings: number
  totalSpend: number
  lastProperty: string
  lastLocation: string
  lastDate: string
  type: "Short stay" | "Long-term" | "Mixed"
}

function buildGuests(rows: RawBooking[]): Guest[] {
  const map = new Map<string, Guest>()
  for (const b of rows) {
    const key = (b.guest_email ?? b.guest_name).toLowerCase()
    const isLong = b.booking_type === "long_term"
    const existing = map.get(key)
    if (existing) {
      existing.bookings += 1
      existing.totalSpend += b.total_amount ?? 0
      if (b.check_in_date > existing.lastDate) {
        existing.lastDate = b.check_in_date
        existing.lastProperty = b.property_name ?? "—"
        existing.lastLocation = b.property_location ?? "—"
      }
      const wasLong = existing.type === "Long-term"
      if ((isLong && !wasLong) || (!isLong && wasLong)) existing.type = "Mixed"
    } else {
      map.set(key, {
        key,
        name: b.guest_name,
        email: b.guest_email ?? undefined,
        phone: b.guest_phone ?? undefined,
        bookings: 1,
        totalSpend: b.total_amount ?? 0,
        lastProperty: b.property_name ?? "—",
        lastLocation: b.property_location ?? "—",
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
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function GuestsPage() {
  const { workspace } = useWorkspace()
  const [query, setQuery] = useState("")
  const [rawBookings, setRawBookings] = useState<RawBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tableUnavailable, setTableUnavailable] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!workspace?.id) return
    const load = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("bookings")
          .select("id,guest_name,guest_email,guest_phone,property_name,property_location,check_in_date,booking_type,total_amount")
          .eq("workspace_id", workspace.id)
          .order("check_in_date", { ascending: false })
          .limit(500)

        if (error) {
          if (error.code === "42P01" || error.code === "PGRST205" || error.message?.includes("does not exist")) {
            setTableUnavailable(true)
          } else {
            setFetchError(error.message)
          }
        } else {
          setRawBookings((data as RawBooking[]) ?? [])
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [workspace?.id])

  const guests = useMemo(() => buildGuests(rawBookings), [rawBookings])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return guests
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.email ?? "").toLowerCase().includes(q) ||
        g.lastProperty.toLowerCase().includes(q)
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

        {/* Table unavailable state (bookings table not migrated yet) */}
        {tableUnavailable && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <BedDouble className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-amber-800">Booking data not yet available</p>
            <p className="text-xs text-amber-600 mt-1">
              The bookings table has not been migrated to this workspace yet.
              Guests will appear here once booking management is active.
            </p>
            <Link
              href="/property-manager/bookings"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:underline"
            >
              Go to Bookings <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Error state */}
        {fetchError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertTriangle className="w-7 h-7 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-700">Could not load guests</p>
            <p className="text-xs text-red-500 mt-1">{fetchError}</p>
          </div>
        )}

        {!tableUnavailable && !fetchError && (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Total guests", value: isLoading ? "—" : totalGuests },
                { label: "Repeat guests", value: isLoading ? "—" : repeatGuests },
                { label: "Long-term residents", value: isLoading ? "—" : longTerm },
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
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                </div>
              ) : (
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
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                                {g.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
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
                              href="/property-manager/bookings"
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
              )}

              {!isLoading && filtered.length === 0 && !tableUnavailable && (
                <div className="py-16 text-center">
                  <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    {query ? "No guests match your search." : "No booking guests yet. Add your first booking to see guests here."}
                  </p>
                  {!query && (
                    <Link
                      href="/property-manager/bookings"
                      className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                    >
                      Go to Bookings <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DashboardContainer>
    </>
  )
}
