"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Home, ArrowRight, ChevronRight, Wrench, FolderOpen,
  PoundSterling, CheckCircle2, FileText, MessageSquare, CalendarCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveTenantContext, resolveTenantTenancies,
  tenancyIds, tenancyPropertyIds,
  formatMoney, formatDate, propertyLabel, rentFrequencyLabel,
  tenancyStatusMeta, jobStatusMeta, isOpenJob,
  type TenantContext, type TenancyLite, type PropertyLite,
} from "./_lib/tenant-context"

interface JobRow {
  id: string
  title: string
  status: string
  scheduled_date: string | null
  created_at: string | null
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

export default function TenantHomePage() {
  const [loading, setLoading] = useState(true)
  const [ctx, setCtx] = useState<TenantContext | null>(null)
  const [noContext, setNoContext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tenancies, setTenancies] = useState<TenancyLite[]>([])
  const [property, setProperty] = useState<PropertyLite | null>(null)
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [docs, setDocs] = useState<DocRow[]>([])
  const [paidThisYear, setPaidThisYear] = useState(0)

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const tenant = await resolveTenantContext()
        if (!tenant) { setNoContext(true); setLoading(false); return }
        setCtx(tenant)

        // Resolve the tenancies strictly linked to this tenant
        const myTenancies = await resolveTenantTenancies(tenant.contactId, tenant.workspaceId)
        setTenancies(myTenancies)

        const tIds = tenancyIds(myTenancies)
        const pIds = tenancyPropertyIds(myTenancies)

        // Property nickname for the primary tenancy
        if (pIds.length > 0) {
          const { data: propData, error: propErr } = await supabase
            .from("properties")
            .select("id, nickname, address_line1, address_line2, city, postcode, status")
            .in("id", pIds)
            .limit(1)
            .maybeSingle()
          if (propErr && code(propErr) !== "42P01") console.error(propErr)
          if (propData) setProperty(propData as unknown as PropertyLite)
        }

        // LIVE maintenance requests scoped to this tenant's tenancies/properties
        if (tIds.length > 0 || pIds.length > 0) {
          try {
            let q = supabase
              .from("jobs")
              .select("id, title, status, scheduled_date, created_at, property_id")
              .order("created_at", { ascending: false })
              .limit(50)
            if (pIds.length > 0) q = q.in("property_id", pIds)
            const { data: jobData, error: jobErr } = await q
            if (jobErr && code(jobErr) !== "42P01") console.error(jobErr)
            if (jobData) setJobs(jobData as unknown as JobRow[])
          } catch { /* tolerate */ }
        }

        // LIVE rent paid this calendar year, scoped to the tenant's tenancies
        if (tIds.length > 0) {
          try {
            const { data: incData, error: incErr } = await supabase
              .from("income_records")
              .select("amount, status, date, tenancy_id")
              .in("tenancy_id", tIds)
            if (!incErr && incData) {
              const year = new Date().getFullYear()
              const paid = (incData as Record<string, unknown>[])
                .filter((r) => r.status === "received" && new Date(r.date as string).getFullYear() === year)
                .reduce((s, r) => s + ((r.amount as number) ?? 0), 0)
              setPaidThisYear(paid)
            }
          } catch { /* tolerate */ }
        }

        // LIVE documents shared with this tenant
        try {
          const { data: docData, error: docErr } = await supabase
            .from("tenant_documents")
            .select("id, name, file_url, created_at")
            .eq("contact_id", tenant.contactId)
            .order("created_at", { ascending: false })
            .limit(5)
          if (!docErr && docData) setDocs(docData as unknown as DocRow[])
        } catch { /* tolerate */ }
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
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
        <h1 className="text-lg font-bold text-slate-900">No tenant account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          This portal isn&apos;t linked to a tenant contact yet. Your managing agent needs to grant you
          portal access, or sign in with the email they have on file.
        </p>
      </div>
    )
  }

  const primary = tenancies[0] ?? null
  const openWork = jobs.filter((j) => isOpenJob(j.status)).length
  const recentWork = jobs.slice(0, 4)
  const statusMeta = primary ? tenancyStatusMeta(primary.status) : null

  const kpis = [
    {
      label: "Monthly Rent",
      value: primary?.rent_amount != null ? formatMoney(primary.rent_amount) : "—",
      colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]", icon: PoundSterling,
    },
    {
      label: "Paid This Year",
      value: formatMoney(paidThisYear),
      colour: "text-[#059669]", bg: "bg-[#ECFDF5]", icon: CheckCircle2,
    },
    {
      label: "Open Requests",
      value: String(openWork),
      colour: "text-[#0EA5E9]", bg: "bg-[#f0f9ff]", icon: Wrench,
    },
    {
      label: "Documents",
      value: String(docs.length),
      colour: "text-[#6d28d9]", bg: "bg-[#F5F3FF]", icon: FolderOpen,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, <span className="text-[#2563EB]">{ctx?.displayName ?? "Tenant"}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <Link href="/tenant-portal/tenancy">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            View Tenancy
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* No linked tenancy — honest explanation */}
      {tenancies.length === 0 && (
        <Card className="rounded-2xl border-blue-100 bg-[#EFF6FF]">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-[#2563EB] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1e40af]">No tenancy linked to your account yet</p>
                <p className="text-xs text-[#1e40af]/80 mt-1 max-w-xl">
                  Your managing agent hasn&apos;t linked a tenancy to your tenant profile yet. Once they do,
                  your tenancy, rent and maintenance requests will appear here automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenancy summary card */}
      {primary && (
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="py-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-slate-900 truncate">
                    {property ? propertyLabel(property) : "Your Home"}
                  </span>
                  {statusMeta && <Badge variant={statusMeta.variant} dot>{statusMeta.label}</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {[property?.address_line1, property?.city, property?.postcode].filter(Boolean).join(", ") || "Address not set"}
                </p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {primary.rent_amount != null && (
                    <span className="text-sm font-semibold text-slate-800">
                      {formatMoney(primary.rent_amount)}{" "}
                      <span className="text-xs font-normal text-slate-400">{rentFrequencyLabel(primary.rent_frequency)}</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    Started {formatDate(primary.start_date)}
                  </span>
                  {primary.end_date && (
                    <span className="text-xs text-slate-500">Ends {formatDate(primary.end_date)}</span>
                  )}
                </div>
              </div>
              <Link href="/tenant-portal/tenancy" className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 shrink-0">
                Details <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI strip — all live */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          { label: "Rent & Payments", href: "/tenant-portal/rent", icon: PoundSterling },
          { label: "Report an Issue", href: "/tenant-portal/maintenance", icon: Wrench },
          { label: "Documents", href: "/tenant-portal/documents", icon: FolderOpen },
          { label: "Viewings", href: "/tenant-portal/viewings", icon: CalendarCheck },
        ].map((a) => {
          const Icon = a.icon
          return (
            <Link key={a.label} href={a.href}>
              <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#2563EB]" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{a.label}</span>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent maintenance */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Your Maintenance Requests</CardTitle>
          <Link href="/tenant-portal/maintenance" className="text-xs text-[#2563EB] hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {recentWork.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              {tenancies.length === 0
                ? "Maintenance requests appear once a tenancy is linked."
                : "You haven't reported any issues yet."}
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentWork.map((j) => {
                const meta = jobStatusMeta(j.status)
                return (
                  <div key={j.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{j.title}</p>
                      <p className="text-[11px] text-slate-400">Logged {formatDate(j.created_at)}</p>
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
          <Link href="/tenant-portal/documents" className="text-xs text-[#2563EB] hover:underline">View all</Link>
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
      <Link href="/tenant-portal/messages" className="block">
        <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" />
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
