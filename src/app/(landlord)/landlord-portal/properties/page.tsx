"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, Building2, ChevronRight, BedDouble, Bath, MapPin } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveLandlordContext, resolveLandlordPropertyIds,
  formatMoney, propertyLabel, propertyStatusMeta,
  type PropertyLite,
} from "../_lib/landlord-context"

const STATUS_FILTERS = [
  { key: "All", label: "All" },
  { key: "occupied", label: "Occupied" },
  { key: "vacant", label: "Vacant" },
  { key: "under_works", label: "Under Works" },
] as const

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function LandlordPropertiesPage() {
  const [properties, setProperties] = useState<PropertyLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noContext, setNoContext] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const landlord = await resolveLandlordContext()
        if (!landlord) { setNoContext(true); setLoading(false); return }

        const propertyIds = await resolveLandlordPropertyIds(landlord.contactId, landlord.workspaceId)
        if (propertyIds.length === 0) { setProperties([]); setLoading(false); return }

        const { data, error: fetchErr } = await supabase
          .from("properties")
          .select("id, nickname, address_line1, address_line2, city, postcode, status, template, bedrooms, bathrooms, target_rent_pcm, cover_image_url")
          .in("id", propertyIds)
          .order("created_at", { ascending: false })

        if (fetchErr) {
          if (code(fetchErr) === "42P01") { setProperties([]) }
          else { setError("Could not load properties.") }
          setLoading(false)
          return
        }
        if (data) setProperties(data as unknown as PropertyLite[])
      } catch (err) {
        console.error(err)
        setError("Unexpected error loading properties.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        propertyLabel(p).toLowerCase().includes(q) ||
        (p.address_line1 ?? "").toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q) ||
        (p.postcode ?? "").toLowerCase().includes(q)
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "occupied" && (p.status === "active" || p.status === "occupied")) ||
        p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [properties, search, statusFilter])

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3"><Skeleton className="h-9 w-64" /><Skeleton className="h-9 w-80" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Building2 className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No landlord account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Ask your managing agent to grant you portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Properties</h1>
          <p className="text-sm text-slate-500">
            {properties.length} propert{properties.length === 1 ? "y" : "ies"} linked to your account
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {properties.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search by name, address, postcode..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  statusFilter === s.key
                    ? "bg-[#2563EB] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">
              {properties.length === 0 ? "No properties linked to your account" : "No properties found"}
            </h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              {properties.length === 0
                ? "Your managing agent hasn't linked any properties to your owner profile yet. Once a property is linked to you, it will appear here — you'll only ever see properties you own."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((p) => {
            const meta = propertyStatusMeta(p.status)
            return (
              <Link key={p.id} href={`/landlord-portal/properties/${p.id}`} className="block">
                <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">{propertyLabel(p)}</h3>
                        <Badge variant={meta.variant} dot>{meta.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-500 truncate">
                          {[p.address_line1, p.city, p.postcode].filter(Boolean).join(", ") || "Address not set"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                        {p.bedrooms != null && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <BedDouble className="w-3.5 h-3.5 shrink-0" />{p.bedrooms} bed
                          </span>
                        )}
                        {p.bathrooms != null && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Bath className="w-3.5 h-3.5 shrink-0" />{p.bathrooms} bath
                          </span>
                        )}
                        {p.target_rent_pcm != null && (
                          <span className="text-xs font-medium text-slate-600">{formatMoney(p.target_rent_pcm)} pcm</span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="pt-2">
          <span className="text-xs text-slate-500">Showing {filtered.length} of {properties.length} properties</span>
        </div>
      )}
    </div>
  )
}
