"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, Wrench, Building2, Calendar, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveLandlordContext, resolveLandlordPropertyIds,
  formatDate, propertyLabel, jobStatusMeta,
  type PropertyLite,
} from "../_lib/landlord-context"

interface JobRow {
  id: string
  title: string
  description: string | null
  status: string
  scheduled_date: string | null
  category: string | null
  property_id: string | null
  propertyLabel: string | null
}

const STATUS_FILTERS = [
  { key: "All", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "complete", label: "Complete" },
] as const

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function LandlordWorkPage() {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noContext, setNoContext] = useState(false)
  const [noProperties, setNoProperties] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const landlord = await resolveLandlordContext()
        if (!landlord) { setNoContext(true); setLoading(false); return }

        const propertyIds = await resolveLandlordPropertyIds(landlord.contactId, landlord.workspaceId)
        if (propertyIds.length === 0) { setNoProperties(true); setLoading(false); return }

        const { data: propData } = await supabase
          .from("properties")
          .select("id, nickname, address_line1, city")
          .in("id", propertyIds)
        const labels = new Map<string, string>()
        for (const p of (propData ?? []) as unknown as PropertyLite[]) {
          labels.set(p.id, propertyLabel(p))
        }

        const { data, error: fetchErr } = await supabase
          .from("jobs")
          .select("id, title, description, status, scheduled_date, category, property_id")
          .in("property_id", propertyIds)
          .order("created_at", { ascending: false })

        if (fetchErr) {
          if (code(fetchErr) === "42P01") { setJobs([]) }
          else { setError("Could not load work updates.") }
          setLoading(false)
          return
        }
        const rows = (data ?? []) as unknown as JobRow[]
        setJobs(rows.map((j) => ({
          ...j,
          propertyLabel: j.property_id ? labels.get(j.property_id) ?? null : null,
        })))
      } catch (err) {
        console.error(err)
        setError("Unexpected error loading work updates.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => jobs.filter((j) => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      j.title.toLowerCase().includes(q) ||
      (j.propertyLabel ?? "").toLowerCase().includes(q)
    const matchStatus =
      statusFilter === "All" ||
      (statusFilter === "open" && !["complete", "invoiced", "closed", "disputed"].includes(j.status)) ||
      j.status === statusFilter
    return matchSearch && matchStatus
  }), [jobs, search, statusFilter])

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-48" /></div>
        <div className="flex gap-3"><Skeleton className="h-9 w-64" /><Skeleton className="h-9 w-72" /></div>
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Wrench className="w-7 h-7 text-slate-400" />
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
      <div>
        <h1 className="text-xl font-bold text-slate-900">Work Updates</h1>
        <p className="text-sm text-slate-500">Maintenance and works on your properties</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {noProperties ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No work updates yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              No properties are linked to your account, so there is no work to report. Once your managing agent
              links a property, any maintenance or works will appear here as read-only updates.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search work, properties..."
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
                      ? "bg-[var(--brand)] text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card className="rounded-2xl border-slate-200">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Wrench className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">No work updates found</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {jobs.length === 0 ? "No work has been recorded on your properties." : "Try adjusting your search or filter."}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((j) => {
                const meta = jobStatusMeta(j.status)
                return (
                  <Link key={j.id} href={j.property_id ? `/landlord-portal/properties/${j.property_id}` : "#"} className="block">
                    <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-slate-900">{j.title}</h3>
                            <Badge variant={meta.variant} dot>{meta.label}</Badge>
                            {j.category && <Badge variant="outline" size="sm">{j.category}</Badge>}
                          </div>
                          {j.description && (
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{j.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                            {j.propertyLabel && (
                              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Building2 className="w-3.5 h-3.5 shrink-0" />{j.propertyLabel}
                              </span>
                            )}
                            {j.scheduled_date && (
                              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />{formatDate(j.scheduled_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        {j.property_id && (
                          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700">
                            View Property <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}

          <p className="text-xs text-slate-400">
            Work updates are read-only. Supplier quotes, costs and internal margins are not shown.
          </p>
        </>
      )}
    </div>
  )
}
