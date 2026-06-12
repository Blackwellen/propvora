"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Briefcase, Calendar, AlertCircle, ArrowRight, ChevronRight,
  Building2, User, PoundSterling, FileText, Wrench, Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveSupplierContext, formatMoney, formatDate,
  jobStatusMeta, invoiceStatusMeta, isOpenJob, buildJobLabelMaps,
  type SupplierContext,
} from "./_lib/supplier-context"

interface JobRow {
  id: string
  title: string
  status: string
  scheduled_date: string | null
  priority: string
  reference: string | null
  property_id: string | null
  contact_id: string | null
  quoted_amount: number | null
  approved_amount: number | null
  propertyLabel?: string | null
  operatorLabel?: string | null
}

interface InvoiceRow {
  id: string
  invoice_number: string | null
  amount: number
  currency: string | null
  status: string
  submitted_at: string
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function jobAddress(job: JobRow) {
  return job.propertyLabel || "Address not set"
}

function jobOperator(job: JobRow) {
  return job.operatorLabel || "Operator"
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function SupplierDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [ctx, setCtx] = useState<SupplierContext | null>(null)
  const [noContext, setNoContext] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const supplier = await resolveSupplierContext()
        if (!supplier) { setNoContext(true); setLoading(false); return }
        setCtx(supplier)

        // LIVE jobs — direct query by supplier_contact_id
        const { data: jobData, error: jobsErr } = await supabase
          .from("jobs")
          .select("id, title, status, scheduled_date, priority, reference, property_id, contact_id, quoted_amount, approved_amount")
          .eq("supplier_contact_id", supplier.contactId)
          .order("created_at", { ascending: false })

        if (jobsErr && code(jobsErr) !== "42P01") {
          console.error(jobsErr)
        }
        if (jobData) {
          const rows = jobData as unknown as JobRow[]
          const maps = await buildJobLabelMaps(
            rows.map((j) => j.property_id),
            rows.map((j) => j.contact_id)
          )
          setJobs(
            rows.map((j) => ({
              ...j,
              propertyLabel: j.property_id ? maps.propertyById.get(j.property_id) ?? null : null,
              operatorLabel: j.contact_id ? maps.contactById.get(j.contact_id) ?? null : null,
            }))
          )
        }

        // LIVE supplier invoices
        const { data: invData, error: invErr } = await supabase
          .from("supplier_invoices")
          .select("id, invoice_number, amount, currency, status, submitted_at")
          .eq("contact_id", supplier.contactId)
          .order("submitted_at", { ascending: false })
          .limit(6)

        if (invErr && code(invErr) !== "42P01") {
          console.error(invErr)
        }
        if (invData) setInvoices(invData as InvoiceRow[])
      } catch (err) {
        console.error(err)
        setError("Could not load dashboard data.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const assignedJobs = jobs.length
  const inProgress = jobs.filter((j) => j.status === "in_progress").length
  const awaitingQuote = jobs.filter((j) => ["supplier_requested", "scoped"].includes(j.status)).length
  const unpaidInvoices = invoices.filter((i) => ["submitted", "reviewing", "approved"].includes(i.status)).length
  const earnings = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount ?? 0), 0)
  const activeJobs = jobs.filter((j) => isOpenJob(j.status)).slice(0, 4)

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
          <Briefcase className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No supplier account linked</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          This portal isn&apos;t linked to a supplier contact yet. Your operator needs to grant you
          portal access, or sign in with the email your operator has on file.
        </p>
      </div>
    )
  }

  const kpis = [
    { label: "Assigned Jobs", value: assignedJobs, colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]", icon: Briefcase },
    { label: "In Progress", value: inProgress, colour: "text-[#0EA5E9]", bg: "bg-[#f0f9ff]", icon: Wrench },
    { label: "Awaiting Quote", value: awaitingQuote, colour: "text-[#F59E0B]", bg: "bg-[#FFFBEB]", icon: AlertCircle },
    { label: "Unpaid Invoices", value: unpaidInvoices, colour: "text-[#dc2626]", bg: "bg-[#FEF2F2]", icon: FileText },
    { label: "Earnings (Paid)", value: formatMoney(earnings), colour: "text-[#059669]", bg: "bg-[#ECFDF5]", icon: PoundSterling },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, <span className="text-[#2563EB]">{ctx?.displayName ?? "Supplier"}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <Link href="/supplier-portal/jobs">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            View All Jobs
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
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
          { label: "View Jobs", href: "/supplier-portal/jobs", icon: Briefcase },
          { label: "My Invoices", href: "/supplier-portal/invoices", icon: FileText },
          { label: "Submit Invoice", href: "/supplier-portal/jobs", icon: Plus },
          { label: "Settings", href: "/supplier-portal/settings", icon: User },
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

      {/* Active jobs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Active Jobs</h2>
          <Link href="/supplier-portal/jobs" className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {activeJobs.length === 0 ? (
          <Card className="rounded-2xl border-slate-200">
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Briefcase className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">No active jobs</h3>
              <p className="text-xs text-slate-400 mt-1">Jobs assigned to you will appear here.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => {
              const meta = jobStatusMeta(job.status)
              return (
                <Link key={job.id} href={`/supplier-portal/jobs/${job.id}`} className="block">
                  <Card className="p-4 rounded-2xl border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">{job.title}</span>
                          <Badge variant={meta.variant} dot>{meta.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs text-slate-500 truncate">{jobAddress(job)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {job.scheduled_date && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(job.scheduled_date, { day: "numeric", month: "short" })}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <User className="w-3.5 h-3.5" />
                            {jobOperator(job)}
                          </span>
                          {(job.approved_amount ?? job.quoted_amount) != null && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <PoundSterling className="w-3.5 h-3.5" />
                              {formatMoney(job.approved_amount ?? job.quoted_amount)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700">
                        View <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent invoices */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-sm">Recent Invoices</CardTitle>
          <Link href="/supplier-portal/invoices" className="text-xs text-[#2563EB] hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No invoices submitted yet.</p>
          ) : (
            <div className="space-y-2.5">
              {invoices.slice(0, 4).map((inv) => {
                const meta = invoiceStatusMeta(inv.status)
                return (
                  <Link
                    key={inv.id}
                    href={`/supplier-portal/invoices/${inv.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900">
                        {inv.invoice_number || inv.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatDate(inv.submitted_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={meta.variant} dot>{meta.label}</Badge>
                      <span className="text-xs font-semibold text-slate-700">
                        {formatMoney(inv.amount, inv.currency ?? "GBP")}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
