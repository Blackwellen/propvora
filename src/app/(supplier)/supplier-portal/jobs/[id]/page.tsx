"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft, Building2, Calendar, User, FileText,
  CheckCircle2, AlertCircle, Clock, Send, Plus,
  PoundSterling, Mail, Phone, XCircle, Hash, Tag,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { Input } from "@/components/ui/Input"
import { Skeleton } from "@/components/ui/Skeleton"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  resolveSupplierContext, formatMoney, formatDate, jobStatusMeta,
  type SupplierContext,
} from "../../_lib/supplier-context"

interface PageProps { params: Promise<{ id: string }> }

interface JobDetail {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  scheduled_date: string | null
  completed_date: string | null
  reference: string | null
  category: string | null
  notes: string | null
  quoted_amount: number | null
  approved_amount: number | null
  invoiced_amount: number | null
  workspace_id: string | null
  propertyLabel: string | null
  operatorName: string | null
  operatorEmail: string | null
  operatorPhone: string | null
}

interface JobDoc { name: string; url: string; type: string; size: number }

// Stages shown in the supplier-facing timeline (subset of the live enum)
const TIMELINE = [
  { key: "supplier_requested", label: "Quote Requested", icon: AlertCircle },
  { key: "quote_received", label: "Quote Submitted", icon: Send },
  { key: "approved", label: "Approved", icon: CheckCircle2 },
  { key: "in_progress", label: "In Progress", icon: Clock },
  { key: "complete", label: "Complete", icon: CheckCircle2 },
]
const TIMELINE_ORDER = ["supplier_requested", "quote_received", "approved", "scheduled", "in_progress", "complete", "invoiced"]

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export default function SupplierJobDetailPage({ params }: PageProps) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [ctx, setCtx] = useState<SupplierContext | null>(null)
  const [job, setJob] = useState<JobDetail | null>(null)
  const [docs, setDocs] = useState<JobDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [busy, setBusy] = useState(false)

  // Quote form
  const [quoteAmount, setQuoteAmount] = useState("")
  const [quoteNotes, setQuoteNotes] = useState("")

  // Invoice form
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [invoiceDesc, setInvoiceDesc] = useState("")
  const [invoiceNotes, setInvoiceNotes] = useState("")
  const [submittingInvoice, setSubmittingInvoice] = useState(false)
  const [invoiceSuccess, setInvoiceSuccess] = useState(false)

  useEffect(() => {
    params.then((p) => setJobId(p.id))
  }, [params])

  const load = useCallback(async () => {
    if (!jobId) return
    try {
      const supabase = createClient()
      const supplier = await resolveSupplierContext()
      if (!supplier) { setError("No supplier account linked."); setLoading(false); return }
      setCtx(supplier)

      const { data: j, error: jobErr } = await supabase
        .from("jobs")
        .select("id, title, description, status, priority, scheduled_date, completed_date, reference, category, notes, quoted_amount, approved_amount, invoiced_amount, workspace_id, property_id, contact_id, supplier_contact_id")
        .eq("id", jobId)
        .maybeSingle()

      if (jobErr || !j) { setError("Job not found."); setLoading(false); return }

      // Ownership check — supplier can only see their own jobs
      if ((j as Record<string, unknown>).supplier_contact_id !== supplier.contactId) {
        setError("You don't have access to this job."); setLoading(false); return
      }

      const row = j as Record<string, unknown>
      let propertyLabel: string | null = null
      let operatorName: string | null = null
      let operatorEmail: string | null = null
      let operatorPhone: string | null = null

      if (row.property_id) {
        const { data: p } = await supabase
          .from("properties")
          .select("nickname, address_line1, city")
          .eq("id", row.property_id as string)
          .maybeSingle()
        if (p) {
          const pr = p as Record<string, unknown>
          propertyLabel = (pr.nickname as string) || [pr.address_line1, pr.city].filter(Boolean).join(", ") || null
        }
      }
      if (row.contact_id) {
        const { data: c } = await supabase
          .from("contacts")
          .select("display_name, company, email, phone")
          .eq("id", row.contact_id as string)
          .maybeSingle()
        if (c) {
          const cr = c as Record<string, unknown>
          operatorName = (cr.company as string) || (cr.display_name as string) || null
          operatorEmail = (cr.email as string) || null
          operatorPhone = (cr.phone as string) || null
        }
      }

      setJob({
        id: row.id as string,
        title: row.title as string,
        description: (row.description as string) ?? null,
        status: row.status as string,
        priority: row.priority as string,
        scheduled_date: (row.scheduled_date as string) ?? null,
        completed_date: (row.completed_date as string) ?? null,
        reference: (row.reference as string) ?? null,
        category: (row.category as string) ?? null,
        notes: (row.notes as string) ?? null,
        quoted_amount: (row.quoted_amount as number) ?? null,
        approved_amount: (row.approved_amount as number) ?? null,
        invoiced_amount: (row.invoiced_amount as number) ?? null,
        workspace_id: (row.workspace_id as string) ?? supplier.workspaceId ?? null,
        propertyLabel,
        operatorName,
        operatorEmail,
        operatorPhone,
      })

      // Load existing evidence docs (42P01-safe)
      try {
        const { data: docData, error: docErr } = await supabase
          .from("job_documents")
          .select("name, file_url, file_type, file_size")
          .eq("job_id", jobId)
          .order("created_at", { ascending: false })
        if (!docErr && docData) {
          setDocs(
            (docData as Record<string, unknown>[]).map((d) => ({
              name: (d.name as string) ?? "Document",
              url: (d.file_url as string) ?? "#",
              type: (d.file_type as string) ?? "",
              size: (d.file_size as number) ?? 0,
            }))
          )
        }
      } catch { /* tolerate */ }
    } catch (err) {
      console.error(err)
      setError("Failed to load job.")
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { load() }, [load])

  // ── Job mutations (write to live `jobs` table) ──────────────────────────
  async function patchJob(payload: Record<string, unknown>) {
    if (!job) return
    setBusy(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase
        .from("jobs")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", job.id)
      if (err) throw err
      setJob((prev) => (prev ? { ...prev, ...(payload as Partial<JobDetail>) } : prev))
    } catch (err) {
      console.error(err)
      setError("Could not update the job. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmitQuote() {
    const amt = parseFloat(quoteAmount)
    if (!job || Number.isNaN(amt)) return
    await patchJob({
      quoted_amount: amt,
      status: "quote_received",
      notes: quoteNotes ? `${job.notes ? job.notes + "\n\n" : ""}Quote note: ${quoteNotes}` : job.notes,
    })
    setQuoteAmount("")
    setQuoteNotes("")
  }

  async function handleAccept() {
    if (!job) return
    // Accepting an approved job → schedule / in-progress, lock in approved amount
    await patchJob({
      status: "scheduled",
      approved_amount: job.approved_amount ?? job.quoted_amount ?? null,
    })
  }

  async function handleDecline() {
    if (!job) return
    await patchJob({ status: "scoped" })
  }

  async function handleStartWork() {
    if (!job) return
    await patchJob({ status: "in_progress" })
  }

  async function handleMarkComplete() {
    if (!job) return
    await patchJob({
      status: "complete",
      completed_date: new Date().toISOString().slice(0, 10),
    })
  }

  async function handleCreateInvoice() {
    const amt = parseFloat(invoiceAmount)
    if (!job || !ctx || Number.isNaN(amt)) return
    setSubmittingInvoice(true)
    try {
      const supabase = createClient()
      const { error: invErr } = await supabase
        .from("supplier_invoices")
        .insert({
          workspace_id: job.workspace_id ?? ctx.workspaceId,
          contact_id: ctx.contactId,
          amount: amt,
          currency: "GBP",
          status: "submitted",
          notes: [invoiceDesc, invoiceNotes].filter(Boolean).join("\n") || null,
          submitted_at: new Date().toISOString(),
        })
      if (invErr) throw invErr
      setInvoiceSuccess(true)
      setInvoiceAmount("")
      setInvoiceDesc("")
      setInvoiceNotes("")
    } catch (err) {
      console.error(err)
      setError("Could not submit the invoice.")
    } finally {
      setSubmittingInvoice(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-5">
        <Link href="/supplier-portal/jobs" className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#2563EB]">
          <ArrowLeft className="w-4 h-4" /> Jobs
        </Link>
        <Card className="rounded-2xl border-slate-200">
          <div className="p-6 text-center">
            <p className="text-sm text-slate-600">{error ?? "Job not found."}</p>
            <Link href="/supplier-portal/jobs">
              <Button variant="outline" size="sm" className="mt-3">Back to Jobs</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const meta = jobStatusMeta(job.status)
  const currentIdx = TIMELINE_ORDER.indexOf(job.status)
  const amount = job.approved_amount ?? job.quoted_amount

  // Primary action driven by live status
  const showQuote = ["supplier_requested", "scoped", "new"].includes(job.status)
  const showAcceptDecline = job.status === "approved"
  const showStart = job.status === "scheduled"
  const showComplete = job.status === "in_progress"

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/supplier-portal/jobs" className="hover:text-[#2563EB] flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Jobs
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">
          {job.reference || job.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
            <Badge variant={meta.variant} dot>{meta.label}</Badge>
            {(job.priority === "high" || job.priority === "urgent") && (
              <Badge variant="danger" size="sm">High Priority</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 flex-wrap text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />{job.propertyLabel ?? "Property not set"}
            </span>
            {job.scheduled_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />{formatDate(job.scheduled_date, { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
            {job.operatorName && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />{job.operatorName}
              </span>
            )}
            {amount != null && (
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <PoundSterling className="w-4 h-4" />{formatMoney(amount)}
              </span>
            )}
          </div>
        </div>

        {/* Primary status actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {showAcceptDecline && (
            <>
              <Button variant="primary" onClick={handleAccept} disabled={busy}>
                <CheckCircle2 className="w-4 h-4" /> Accept Job
              </Button>
              <Button variant="outline" onClick={handleDecline} disabled={busy}>
                <XCircle className="w-4 h-4" /> Decline
              </Button>
            </>
          )}
          {showStart && (
            <Button variant="primary" onClick={handleStartWork} disabled={busy}>
              <Clock className="w-4 h-4" /> Start Work
            </Button>
          )}
          {showComplete && (
            <Button variant="success" onClick={handleMarkComplete} disabled={busy}>
              <CheckCircle2 className="w-4 h-4" /> Mark Complete
            </Button>
          )}
          {showQuote && (
            <Button variant="primary" onClick={() => setActiveTab("quote")} disabled={busy}>
              <Send className="w-4 h-4" /> Submit Quote
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="underline" className="w-full overflow-x-auto">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="quote">Quote</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
        </TabsList>

        {/* Details */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <Card className="rounded-2xl border-slate-200">
                <CardHeader><CardTitle>Scope of Work</CardTitle></CardHeader>
                <CardContent>
                  {job.description ? (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
                  ) : (
                    <p className="text-sm text-slate-400">No scope description has been added by the operator.</p>
                  )}
                </CardContent>
              </Card>
              {job.notes && (
                <Card className="rounded-2xl border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-700 whitespace-pre-line">{job.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card className="rounded-2xl border-slate-200">
                <CardHeader><CardTitle>Job Info</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-xs">{job.reference || job.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  {job.category && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <Badge variant="outline" size="sm">{job.category}</Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {job.scheduled_date ? formatDate(job.scheduled_date) : "Not scheduled"}
                  </div>
                  {job.completed_date && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Completed {formatDate(job.completed_date)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {job.operatorName && (
                <Card className="rounded-2xl border-slate-200">
                  <CardHeader><CardTitle>Operator Contact</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium text-slate-800">{job.operatorName}</p>
                    {job.operatorEmail && <p className="text-xs text-slate-500 mt-0.5">{job.operatorEmail}</p>}
                    {job.operatorPhone && <p className="text-xs text-slate-500">{job.operatorPhone}</p>}
                    <div className="flex flex-col gap-2 mt-3">
                      {job.operatorEmail && (
                        <a href={`mailto:${job.operatorEmail}?subject=${encodeURIComponent(`Re: ${job.title} (${job.reference || job.id.slice(0, 8)})`)}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Mail className="w-4 h-4" /> Email Operator
                          </Button>
                        </a>
                      )}
                      {job.operatorPhone && (
                        <a href={`tel:${job.operatorPhone}`}>
                          <Button variant="ghost" size="sm" className="w-full">
                            <Phone className="w-4 h-4" /> Call Operator
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Quote */}
        <TabsContent value="quote">
          <Card className="rounded-2xl border-slate-200 max-w-lg">
            <CardHeader><CardTitle>Submit a Quote</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {job.quoted_amount != null && (
                <div className="rounded-xl bg-[#EFF6FF] border border-blue-100 p-3 text-sm text-[#2563EB]">
                  Quote submitted: <span className="font-semibold">{formatMoney(job.quoted_amount)}</span>
                  {job.approved_amount != null && (
                    <span className="block text-emerald-600 mt-0.5">Approved: {formatMoney(job.approved_amount)}</span>
                  )}
                </div>
              )}
              <Input
                label="Quote Amount (GBP)"
                placeholder="e.g. 450.00"
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Notes for the operator</label>
                <textarea
                  className="w-full h-24 rounded-lg border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  placeholder="Breakdown, materials, timing..."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                />
              </div>
              <Button variant="primary" className="w-full" onClick={handleSubmitQuote} disabled={busy || !quoteAmount}>
                <Send className="w-4 h-4" /> {busy ? "Submitting..." : "Submit Quote"}
              </Button>
              <p className="text-xs text-slate-400">
                Submitting sets the job status to &quot;Quote Submitted&quot; and records your quoted amount. The
                operator will review and approve it.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status */}
        <TabsContent value="status">
          <Card className="rounded-2xl border-slate-200 max-w-lg">
            <CardHeader><CardTitle>Job Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {TIMELINE.map((step) => {
                  const stepIdx = TIMELINE_ORDER.indexOf(step.key)
                  const isDone = currentIdx >= stepIdx && currentIdx >= 0
                  const Icon = step.icon
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        isDone ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", isDone ? "text-slate-900" : "text-slate-400")}>
                          {step.label}
                        </p>
                      </div>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-1" />}
                    </div>
                  )
                })}
              </div>

              {(showStart || showComplete || showAcceptDecline) && (
                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
                  {showAcceptDecline && (
                    <>
                      <Button variant="primary" className="flex-1" onClick={handleAccept} disabled={busy}>
                        <CheckCircle2 className="w-4 h-4" /> Accept
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={handleDecline} disabled={busy}>
                        <XCircle className="w-4 h-4" /> Decline
                      </Button>
                    </>
                  )}
                  {showStart && (
                    <Button variant="primary" className="w-full" onClick={handleStartWork} disabled={busy}>
                      <Clock className="w-4 h-4" /> Start Work
                    </Button>
                  )}
                  {showComplete && (
                    <Button variant="success" className="w-full" onClick={handleMarkComplete} disabled={busy}>
                      <CheckCircle2 className="w-4 h-4" /> Mark Complete
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence */}
        <TabsContent value="evidence">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader><CardTitle>Completion Evidence</CardTitle></CardHeader>
            <CardContent>
              <EvidenceUpload
                workspaceId={job.workspace_id ?? ctx?.workspaceId ?? undefined}
                folder="job-evidence"
                table="job_documents"
                extra={{ job_id: job.id }}
                initialDocs={docs}
              />
              <p className="text-xs text-slate-400 mt-3">
                Upload photos, certificates or sign-off documents for this job. Files are stored securely
                and shared with your operator.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice */}
        <TabsContent value="invoice">
          <Card className="rounded-2xl border-slate-200 max-w-lg">
            <CardHeader><CardTitle>Submit Invoice for this Job</CardTitle></CardHeader>
            <CardContent>
              {invoiceSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-800">Invoice submitted</p>
                  <p className="text-xs text-slate-500 mt-1">The operator will review and approve it.</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button variant="outline" size="sm" onClick={() => setInvoiceSuccess(false)}>
                      Submit Another
                    </Button>
                    <Link href="/supplier-portal/invoices">
                      <Button variant="primary" size="sm">View Invoices</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Invoice Amount (GBP)"
                    placeholder={amount != null ? formatMoney(amount).replace(/[£,]/g, "") : "e.g. 450.00"}
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                  />
                  <Input
                    label="Work Description"
                    placeholder="Brief description of work completed"
                    value={invoiceDesc}
                    onChange={(e) => setInvoiceDesc(e.target.value)}
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Additional Notes</label>
                    <textarea
                      className="w-full h-20 rounded-lg border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                      placeholder="Any notes for the operator..."
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleCreateInvoice}
                    disabled={submittingInvoice || !invoiceAmount}
                  >
                    <Plus className="w-4 h-4" />
                    {submittingInvoice ? "Submitting..." : "Submit Invoice"}
                  </Button>
                  <Link href="/supplier-portal/invoices">
                    <Button variant="ghost" size="sm" className="w-full">
                      <FileText className="w-4 h-4" /> View All Invoices
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
