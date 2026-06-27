"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2, Home, ArrowRight, ChevronRight, Wrench, FolderOpen,
  Receipt, CheckCircle2, DoorOpen, FileText, MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveLandlordContext, resolveLandlordPropertyIds,
  formatMoney, formatDate, propertyLabel, propertyStatusMeta,
  jobStatusMeta, isOccupied, isOpenJob,
  type LandlordContext, type PropertyLite,
} from "./_lib/landlord-context"
import { getPropertyDocuments } from "@/lib/portal/documents"

interface JobRow {
  id: string
  title: string
  status: string
  scheduled_date: string | null
  property_id: string | null
  propertyLabel?: string | null
}

interface DocRow {
  id: string
  name: string | null
  file_url: string | null
  created_at: string | null
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function LandlordHomePage() {
  const [loading, setLoading] = useState(true)
  const [ctx, setCtx] = useState<LandlordContext | null>(null)
  const [noContext, setNoContext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<PropertyLite[]>([])
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [docs, setDocs] = useState<DocRow[]>([])

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const landlord = await resolveLandlordContext()
        if (!landlord) { setNoContext(true); setLoading(false); return }
        setCtx(landlord)

        // Resolve the property ids strictly linked to this landlord
        const propertyIds = await resolveLandlordPropertyIds(landlord.contactId, landlord.workspaceId)

        if (propertyIds.length > 0) {
          // LIVE properties scoped to this landlord only
          const { data: propData, error: propErr } = await supabase
            .from("properties")
            .select("id, nickname, address_line1, address_line2, city, postcode, status, template, bedrooms, bathrooms, target_rent_pcm, cover_image_url")
            .in("id", propertyIds)
            .order("created_at", { ascending: false })
          if (propErr && code(propErr) !== "42P01") console.error(propErr)
          if (propData) setProperties(propData as unknown as PropertyLite[])

          // LIVE work/jobs on those properties (read-only summaries)
          const { data: jobData, error: jobErr } = await supabase
            .from("jobs")
            .select("id, title, status, scheduled_date, property_id")
            .in("property_id", propertyIds)
            .order("created_at", { ascending: false })
            .limit(50)
          if (jobErr && code(jobErr) !== "42P01") console.error(jobErr)
          if (jobData) {
            const rows = jobData as unknown as JobRow[]
            const labelById = new Map<string, string>()
            for (const p of (propData ?? []) as unknown as PropertyLite[]) {
              labelById.set(p.id, propertyLabel(p))
            }
            setJobs(rows.map((j) => ({
              ...j,
              propertyLabel: j.property_id ? labelById.get(j.property_id) ?? null : null,
            })))
          }
        }

        // LIVE documents on the landlord's own properties (property_documents)
        if (propertyIds.length > 0) {
          const docRows = await getPropertyDocuments(propertyIds)
          setDocs(
            docRows.slice(0, 5).map((d) => ({
              id: d.id,
              name: d.name,
              file_url: d.file_url,
              created_at: d.created_at,
            }))
          )
        }
      } catch (err) {
        console.error(err)
        setError("Could not load your dashboard.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Home className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No landlord account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          This portal isn&apos;t linked to an owner contact yet. Your managing agent needs to grant you
          portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  const totalProperties = properties.length
  const occupied = properties.filter((p) => isOccupied(p.status)).length
  const vacant = properties.filter((p) => p.status === "vacant").length
  const openWork = jobs.filter((j) => isOpenJob(j.status)).length
  const recentDocs = docs.length
  const recentWork = jobs.filter((j) => isOpenJob(j.status)).slice(0, 4)

  const kpis = [
    { label: "Properties", value: totalProperties, colour: "text-[var(--brand)]", bg: "bg-[var(--brand-soft)]", icon: Building2 },
    { label: "Occupied", value: occupied, colour: "text-[#059669]", bg: "bg-[#ECFDF5]", icon: CheckCircle2 },
    { label: "Vacant", value: vacant, colour: "text-[#F59E0B]", bg: "bg-[#FFFBEB]", icon: DoorOpen },
    { label: "Open Work", value: openWork, colour: "text-[#0EA5E9]", bg: "bg-[#f0f9ff]", icon: Wrench },
    { label: "Documents", value: recentDocs, colour: "text-[#6d28d9]", bg: "bg-[#F5F3FF]", icon: FolderOpen },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, <span className="text-[var(--brand)]">{ctx?.displayName ?? "Landlord"}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <Link href="/landlord-portal/properties">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            View Properties
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* No linked properties — honest explanation */}
      {totalProperties === 0 && (
        <Card className="rounded-2xl border-[var(--color-brand-100)] bg-[var(--brand-soft)]">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-[var(--brand)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1e40af]">No properties linked to your account yet</p>
                <p className="text-xs text-[#1e40af]/80 mt-1 max-w-xl">
                  Your managing agent hasn&apos;t linked any properties to your owner profile yet. Once they do,
                  your portfolio, statements and work updates will appear here automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI strip — all live */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-4 rounded-2xl border-slate-200">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", kpi.bg)}>
                <Icon className={cn("w-4 h-4", kpi.colour)} />
              </div>
              <p className={cn("text-xl font-bold", kpi.colour)}>{kpi.value}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5">{kpi.label}</p>
            </Card>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "My Properties", href: "/landlord-portal/properties", icon: Building2 },
          { label: "Statements", href: "/landlord-portal/statements", icon: Receipt },
          { label: "Work Updates", href: "/landlord-portal/work", icon: Wrench },
          { label: "Documents", href: "/landlord-portal/documents", icon: FolderOpen },
        ].map((a) => {
          const Icon = a.icon
          return (
            <Link key={a.label} href={a.href}>
              <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[var(--brand)]" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{a.label}</span>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Your properties preview */}
      {totalProperties > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Your Properties</h2>
            <Link href="/landlord-portal/properties" className="text-xs text-[var(--brand)] hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {properties.slice(0, 4).map((p) => {
              const meta = propertyStatusMeta(p.status)
              return (
                <Link key={p.id} href={`/landlord-portal/properties/${p.id}`} className="block">
                  <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900 truncate">{propertyLabel(p)}</span>
                          <Badge variant={meta.variant} dot>{meta.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-500 truncate">
                            {[p.address_line1, p.city, p.postcode].filter(Boolean).join(", ") || "Address not set"}
                          </span>
                        </div>
                        {p.target_rent_pcm != null && (
                          <p className="text-xs text-slate-400 mt-1.5">{formatMoney(p.target_rent_pcm)} pcm</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent work updates */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Recent Work Updates</CardTitle>
          <Link href="/landlord-portal/work" className="text-xs text-[var(--brand)] hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {recentWork.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              {totalProperties === 0 ? "Work updates appear once properties are linked." : "No open work on your properties."}
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentWork.map((j) => {
                const meta = jobStatusMeta(j.status)
                return (
                  <div key={j.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{j.title}</p>
                      <p className="text-[11px] text-slate-400">{j.propertyLabel ?? "Property"} · {formatDate(j.scheduled_date)}</p>
                    </div>
                    <Badge variant={meta.variant} dot>{meta.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent documents */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Recent Documents</CardTitle>
          <Link href="/landlord-portal/documents" className="text-xs text-[var(--brand)] hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No documents shared with you yet.</p>
          ) : (
            <div className="space-y-2.5">
              {docs.map((d) => (
                <a
                  key={d.id}
                  href={d.file_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-900 truncate">{d.name || "Document"}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{formatDate(d.created_at)}</span>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages link */}
      <Link href="/landlord-portal/messages" className="block">
        <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Messages</p>
              <p className="text-xs text-slate-400">Talk to your managing agent</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Card>
      </Link>
    </div>
  )
}
