"use client"

import React, { useEffect, useState } from "react"
import { Wrench, Plus, DoorOpen, CheckCircle2, Calendar, X } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Skeleton } from "@/components/ui/Skeleton"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveTenantContext, resolveTenantTenancies,
  tenancyPropertyIds, formatDate, propertyLabel, jobStatusMeta,
  type TenantContext, type TenancyLite, type PropertyLite,
} from "../_lib/tenant-context"

interface JobRow {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  category: string | null
  scheduled_date: string | null
  created_at: string | null
  property_id: string | null
}

const CATEGORIES = [
  "Plumbing", "Electrical", "Heating", "Appliance", "Damp / Mould",
  "Pest", "Locks / Security", "Garden / Exterior", "Other",
] as const

const PRIORITIES = [
  { value: "low", label: "Low — not urgent" },
  { value: "medium", label: "Medium — needs attention soon" },
  { value: "high", label: "High — significant problem" },
  { value: "urgent", label: "Urgent — health/safety risk" },
] as const

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function TenantMaintenancePage() {
  const [ctx, setCtx] = useState<TenantContext | null>(null)
  const [tenancies, setTenancies] = useState<TenancyLite[]>([])
  const [propertyById, setPropertyById] = useState<Map<string, PropertyLite>>(new Map())
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [noContext, setNoContext] = useState(false)
  const [noTenancy, setNoTenancy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [priority, setPriority] = useState<string>("medium")
  const [submitting, setSubmitting] = useState(false)
  const [newJobId, setNewJobId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const tenant = await resolveTenantContext()
        if (!tenant) { setNoContext(true); setLoading(false); return }
        setCtx(tenant)

        const myTenancies = await resolveTenantTenancies(tenant.contactId, tenant.workspaceId)
        if (myTenancies.length === 0) { setNoTenancy(true); setLoading(false); return }
        setTenancies(myTenancies)

        await refreshJobs(myTenancies)
      } catch (err) {
        console.error(err)
        setError("Could not load your maintenance requests.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function refreshJobs(myTenancies: TenancyLite[]) {
    const supabase = createClient()
    const pIds = tenancyPropertyIds(myTenancies)
    if (pIds.length === 0) { setJobs([]); return }

    // Property labels
    try {
      const { data: pData } = await supabase
        .from("properties")
        .select("id, nickname, address_line1, address_line2, city, postcode, status")
        .in("id", pIds)
      const m = new Map<string, PropertyLite>()
      for (const r of (pData ?? []) as unknown as PropertyLite[]) m.set(r.id, r)
      setPropertyById(m)
    } catch { /* tolerate */ }

    // LIVE jobs scoped to this tenant's properties only
    const { data, error: jErr } = await supabase
      .from("jobs")
      .select("id, title, description, status, priority, category, scheduled_date, created_at, property_id")
      .in("property_id", pIds)
      .order("created_at", { ascending: false })
    if (jErr && code(jErr) !== "42P01") {
      setError("Could not load your maintenance requests.")
      return
    }
    setJobs((data ?? []) as unknown as JobRow[])
  }

  async function handleSubmit() {
    if (!title.trim() || !ctx?.workspaceId) return
    const primary = tenancies[0]
    if (!primary?.property_id) { setError("No property linked — cannot submit a request."); return }

    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      // Insert a LIVE `jobs` row linked to this tenant's property, raised BY the tenant.
      const { data, error: insErr } = await supabase
        .from("jobs")
        .insert({
          workspace_id: ctx.workspaceId,
          title: title.trim(),
          description: description.trim() || null,
          status: "new",
          priority,
          category,
          property_id: primary.property_id,
          contact_id: ctx.contactId,
          is_demo: false,
        })
        .select("id, title, description, status, priority, category, scheduled_date, created_at, property_id")
        .single()
      if (insErr) throw insErr

      if (data) {
        setJobs((prev) => [data as unknown as JobRow, ...prev])
        setNewJobId((data as { id: string }).id)
        setSubmitted(true)
      }
      setTitle("")
      setDescription("")
      setCategory(CATEGORIES[0])
      setPriority("medium")
    } catch (err) {
      console.error(err)
      setError("Could not submit your request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setShowForm(false)
    setSubmitted(false)
    setNewJobId(null)
    setTitle("")
    setDescription("")
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-56" /></div>
        <Skeleton className="h-10 w-40 rounded-lg" />
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      </div>
    )
  }

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Wrench className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">No tenant account linked</h1>
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
          <h1 className="text-xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-sm text-slate-500">Report an issue and track your requests</p>
        </div>
        {!noTenancy && !showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Report an Issue
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {noTenancy ? (
        <Card className="rounded-2xl border-slate-200">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <DoorOpen className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">No tenancy linked yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              You can report maintenance once your managing agent links your tenancy. Until then, contact them
              directly via Messages.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Report form */}
          {showForm && (
            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle>{submitted ? "Request Submitted" : "Report an Issue"}</CardTitle>
                <button onClick={resetForm} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitted ? (
                  <>
                    <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-green-800">
                        Your request has been logged and sent to your managing agent. You can add photos or
                        documents below to help them understand the issue.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Add photos or documents (optional)</p>
                      <EvidenceUpload
                        workspaceId={ctx?.workspaceId ?? undefined}
                        folder="tenant-maintenance"
                        table="job_documents"
                        extra={{ job_id: newJobId, category: "tenant_evidence" }}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={resetForm}>Done</Button>
                  </>
                ) : (
                  <>
                    <Input
                      label="What's the issue?"
                      placeholder="e.g. Leaking tap in the kitchen"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Description</label>
                      <textarea
                        className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 resize-y focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                        placeholder="Describe the problem, where it is, and how long it's been happening…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <select
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Priority</label>
                        <select
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                        >
                          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={handleSubmit} disabled={submitting || !title.trim()}>
                        {submitting ? "Submitting…" : "Submit Request"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={resetForm} disabled={submitting}>Cancel</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Requests list */}
          {jobs.length === 0 ? (
            <Card className="rounded-2xl border-slate-200">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Wrench className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">No maintenance requests yet</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-md">
                  When you report an issue it will appear here so you can track its progress.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const meta = jobStatusMeta(job.status)
                const prop = job.property_id ? propertyById.get(job.property_id) ?? null : null
                return (
                  <Card key={job.id} className="p-4 rounded-2xl border-slate-200">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-slate-900">{job.title}</h3>
                          <Badge variant={meta.variant} dot>{meta.label}</Badge>
                          {job.category && <Badge variant="outline" size="sm">{job.category}</Badge>}
                        </div>
                        {job.description && (
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{job.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {prop && <span className="text-xs text-slate-400">{propertyLabel(prop)}</span>}
                          <span className="text-xs text-slate-400">Logged {formatDate(job.created_at)}</span>
                          {job.scheduled_date && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Calendar className="w-3.5 h-3.5 shrink-0" /> Scheduled {formatDate(job.scheduled_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="rounded-2xl bg-[#EFF6FF] border border-blue-100 p-3 flex items-start gap-2">
            <Wrench className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
            <p className="text-xs text-[#1e40af]">
              For emergencies (gas leaks, flooding, no heat in winter, security risks) call your managing agent or
              emergency line immediately — don&apos;t wait for an online response.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
