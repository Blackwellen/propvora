"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { InlineEditField } from "@/components/portfolio/InlineEditField"
import { ActionMenu } from "@/components/portfolio/ActionMenu"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import {
  ChevronRight, Home, AlertTriangle, Calendar, User, Edit2, RefreshCw,
  CheckCircle2, FileText, Briefcase, XCircle, Upload, ClipboardList, Shield,
  CalendarDays, Sparkles, BarChart2, Info, Check, Building2, Link2, Activity,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

const TYPE_LABELS: Record<string, string> = {
  routine: "Routine Property Inspection",
  mid_term: "Mid-Term Inspection",
  checkout: "Check-Out Inspection",
  fire: "Fire Safety Inspection",
  gas: "Gas Inspection",
}

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
]

const TYPE_OPTIONS = [
  { value: "routine", label: "Routine Property Inspection" },
  { value: "mid_term", label: "Mid-Term Inspection" },
  { value: "checkout", label: "Check-Out Inspection" },
  { value: "fire", label: "Fire Safety Inspection" },
  { value: "gas", label: "Gas Inspection" },
]

const ROUTINE_CHECKLIST = [
  "General condition", "Electrics & sockets", "Plumbing & water pressure", "Heating system",
  "Windows & doors", "Garden / external areas", "Smoke & CO alarms", "Damp & mould check",
]

type TabKey = "overview" | "checklist" | "findings" | "evidence" | "linked" | "calendar" | "activity" | "audit"

const DETAIL_TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: BarChart2 },
  { key: "checklist", label: "Checklist", icon: ClipboardList },
  { key: "findings", label: "Findings", icon: FileText },
  { key: "evidence", label: "Evidence", icon: Shield },
  { key: "linked", label: "Linked Records", icon: Link2 },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "audit", label: "Audit", icon: FileText },
]

function fmtDate(d: string | null | undefined) {
  if (!d) return "—"
  const p = new Date(d)
  return isNaN(p.getTime()) ? d : p.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

function daysSince(d: string | null | undefined) {
  if (!d) return null
  const p = new Date(d)
  if (isNaN(p.getTime())) return null
  return Math.round((Date.now() - p.getTime()) / (1000 * 60 * 60 * 24))
}

function KpiContext({ label, value, sub, colour }: { label: string; value: string | number; sub?: string; colour?: string }) {
  return (
    <div className="flex-1 min-w-[110px] text-center px-3 py-3 border-r border-slate-100 last:border-0">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: colour ?? "#1E293B" }}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ChecklistTab() {
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Inspection Checklist</h3>
          <p className="text-xs text-slate-500 mt-0.5">{ROUTINE_CHECKLIST.length} items — complete the inspection to record outcomes</p>
        </div>
        {!completing && (
          <Button variant="primary" size="sm" onClick={() => setCompleting(true)}>
            <CheckCircle2 className="w-4 h-4" />Complete Checklist
          </Button>
        )}
      </div>
      {completing && (
        <div className="mb-4 px-4 py-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
          <p className="text-sm text-[#2563EB] font-medium">Tick off each item as you inspect. {completed.size}/{ROUTINE_CHECKLIST.length} completed.</p>
        </div>
      )}
      <div className="space-y-2">
        {ROUTINE_CHECKLIST.map((label) => {
          const done = completed.has(label)
          return (
            <div
              key={label}
              onClick={() => { if (completing) setCompleted((p) => { const n = new Set(p); n.has(label) ? n.delete(label) : n.add(label); return n }) }}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border transition-all", completing ? "cursor-pointer hover:border-[#2563EB]/40" : "cursor-default", done ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200")}
            >
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", done ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
                {done && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={cn("text-sm", done ? "text-emerald-700 line-through" : "text-slate-800")}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function InspectionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()
  const qc = useQueryClient()

  const { data: insp, isLoading } = useQuery({
    queryKey: ["compliance-inspection-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_inspections")
        .select("*, properties(name:nickname)")
        .eq("id", id)
        .single()
      if (error) {
        if (error.code === "42P01" || error.code === "PGRST116") return null
        throw new Error(error.message)
      }
      const r = data as any
      return {
        id: r.id,
        inspection_type: r.kind,
        property_id: r.property_id,
        property_name: r.properties?.name ?? undefined,
        status: r.status === "scheduled" ? "scheduled" : r.status,
        scheduled_date: r.scheduled_for,
        completed_date: r.completed_at,
        inspector_name: null,
        inspector_company: null,
        outcome: r.score != null ? (r.score >= 50 ? "pass" : "fail") : null,
        findings_count: 0,
        evidence_count: r.report_document_id ? 1 : 0,
        next_action: r.notes,
        created_at: r.created_at,
      }
    },
  })

  const row: any = insp ?? {}
  const notFound = !isLoading && !insp
  const isSeed = false // live data only
  const label = TYPE_LABELS[row.inspection_type] ?? row.inspection_type ?? "Inspection"
  const overdue = row.status === "overdue"
  const overdueDays = overdue ? daysSince(row.scheduled_date) : null

  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")

  // Map view-model field keys back to property_inspections columns.
  async function saveField(patch: Record<string, any>) {
    const out: Record<string, any> = { updated_at: new Date().toISOString() }
    if ("inspection_type" in patch) out.kind = patch.inspection_type
    if ("scheduled_date" in patch) out.scheduled_for = patch.scheduled_date
    if ("completed_date" in patch) out.completed_at = patch.completed_date
    if ("status" in patch) out.status = patch.status === "upcoming" ? "scheduled" : patch.status
    if ("next_action" in patch) out.notes = patch.next_action
    const { error } = await supabase
      .from("property_inspections")
      .update(out)
      .eq("id", id)
    if (error && error.code !== "42P01") throw new Error(error.message)
    qc.invalidateQueries({ queryKey: ["compliance-inspection-detail", id] })
    qc.invalidateQueries({ queryKey: ["compliance-inspections"] })
  }

  async function setStatus(status: string, extra: Record<string, any> = {}) {
    await saveField({ status, ...extra })
  }

  async function doReschedule() {
    if (!rescheduleDate) return
    await saveField({ scheduled_date: rescheduleDate, status: "scheduled" })
    setRescheduleOpen(false)
  }

  async function handleCancel() {
    await setStatus("cancelled")
    router.push("/app/compliance/inspections")
  }

  if (isLoading) {
    return (
      <div className="space-y-0">
        <div className="p-10 text-center text-sm text-slate-400">Loading inspection…</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="space-y-0">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Inspection not found</h2>
          <p className="text-sm text-slate-500 mb-5">This inspection may have been removed.</p>
          <Button variant="primary" size="sm" asChild>
            <Link href="/app/compliance/inspections">Back to Inspections</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="px-6 pt-4 pb-2">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/app/compliance" className="hover:text-[#2563EB] transition-colors">Compliance</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/app/compliance/inspections" className="hover:text-[#2563EB] transition-colors">Inspections</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-medium">{label} — {row.property_name ?? "Inspection"}</span>
        </nav>
      </div>

      <div className="p-6 space-y-4">
        {isSeed && (
          <div className="px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            Showing example data — connect the compliance database to enable inline editing.
          </div>
        )}

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex">
            <div className={cn("w-1 shrink-0", overdue ? "bg-[#DC2626]" : "bg-[#2563EB]")} />
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", overdue ? "bg-red-50" : "bg-blue-50")}>
                    <Home className={cn("w-5 h-5", overdue ? "text-[#DC2626]" : "text-[#2563EB]")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={overdue ? "danger" : "default"} size="sm">{row.status}</Badge>
                      <Badge variant="default" size="sm">{label}</Badge>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">{label}</h1>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{row.property_name ?? "—"}</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />Scheduled: {fmtDate(row.scheduled_date)}
                        {overdueDays != null && <Badge variant="danger" size="sm" dot>OVERDUE {overdueDays} days</Badge>}
                      </span>
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{row.inspector_name ?? "Unassigned"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/app/compliance/inspections/${id}/edit`}><Edit2 className="w-3.5 h-3.5" />Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(true)} disabled={isSeed}>
                    <RefreshCw className="w-3.5 h-3.5" />Reschedule
                  </Button>
                  <Button variant="success" size="sm" onClick={() => setStatus("completed", { completed_date: new Date().toISOString().slice(0, 10), outcome: "pass" })} disabled={isSeed}>
                    <CheckCircle2 className="w-3.5 h-3.5" />Mark Complete
                  </Button>
                  <ActionMenu
                    items={[
                      { label: "Mark Scheduled", icon: Calendar, onClick: () => setStatus("scheduled"), disabled: isSeed },
                      { label: "Mark In Progress", icon: Clock, onClick: () => setStatus("in_progress"), disabled: isSeed },
                      { label: "Mark Complete", icon: CheckCircle2, onClick: () => setStatus("completed", { completed_date: new Date().toISOString().slice(0, 10) }), disabled: isSeed },
                      { label: "Reschedule", icon: RefreshCw, onClick: () => setRescheduleOpen(true), disabled: isSeed },
                      { label: "Create Work Job", icon: Briefcase, onClick: () => router.push("/app/jobs/new") },
                    ]}
                  />
                  <ConfirmDialog
                    title="Cancel inspection?"
                    description="This inspection will be marked as cancelled."
                    confirmLabel="Cancel Inspection"
                    onConfirm={handleCancel}
                  >
                    {(open) => (
                      <Button variant="destructive-soft" size="sm" onClick={open}><XCircle className="w-3.5 h-3.5" />Cancel</Button>
                    )}
                  </ConfirmDialog>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-wrap divide-x divide-slate-100">
            <KpiContext label="Status" value={row.status} colour={overdue ? "#DC2626" : "#2563EB"} />
            <KpiContext label="Findings" value={row.findings_count ?? 0} sub="recorded" colour="#64748B" />
            <KpiContext label="Evidence" value={row.evidence_count ?? 0} sub="documents" colour="#64748B" />
            <KpiContext label="Inspector" value={row.inspector_name ?? "—"} colour="#64748B" />
            <KpiContext label="Completed" value={row.completed_date ? fmtDate(row.completed_date) : "Not yet"} colour="#64748B" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0 w-full">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex">
                  {DETAIL_TABS.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn("flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-all", activeTab === tab.key ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-500 hover:text-slate-700")}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />{tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-5">
                {activeTab === "overview" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Inspection Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: "Type", node: <InlineEditField value={row.inspection_type} type="select" options={TYPE_OPTIONS} disabled={isSeed} onSave={(v) => saveField({ inspection_type: v })} /> },
                          { label: "Property", node: <span className="text-sm font-medium text-slate-800">{row.property_name ?? "—"}</span> },
                          { label: "Scheduled Date", node: <InlineEditField value={row.scheduled_date} type="date" disabled={isSeed} onSave={(v) => saveField({ scheduled_date: v })} /> },
                          { label: "Inspector", node: <InlineEditField value={row.inspector_name} placeholder="Add inspector" disabled={isSeed} onSave={(v) => saveField({ inspector_name: v })} /> },
                          { label: "Inspector Company", node: <InlineEditField value={row.inspector_company} placeholder="Add company" disabled={isSeed} onSave={(v) => saveField({ inspector_company: v })} /> },
                          { label: "Status", node: <InlineEditField value={row.status} type="select" options={STATUS_OPTIONS} disabled={isSeed} onSave={(v) => saveField({ status: v })} /> },
                          { label: "Next Action", node: <InlineEditField value={row.next_action} placeholder="Add next action" disabled={isSeed} onSave={(v) => saveField({ next_action: v })} /> },
                        ].map((r) => (
                          <div key={r.label} className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-400">{r.label}</p>
                            <p className="text-sm font-medium text-slate-800 mt-0.5">{r.node}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">Next Best Actions</h3>
                      <div className="space-y-2">
                        {overdue && (
                          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                            <p className="text-sm text-red-800 font-medium flex-1">Reschedule this inspection — currently overdue</p>
                            <Button variant="destructive" size="sm" onClick={() => setRescheduleOpen(true)} disabled={isSeed}>Reschedule</Button>
                          </div>
                        )}
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <Briefcase className="w-4 h-4 text-slate-500" />
                          <p className="text-sm text-slate-700 font-medium flex-1">Create a work task to track completion</p>
                          <Button variant="outline" size="sm" asChild><Link href="/app/jobs/new">Create Job</Link></Button>
                        </div>
                      </div>
                    </div>

                    {overdue && overdueDays != null && (
                      <div className="flex items-start gap-3 px-4 py-4 bg-red-50 border border-red-100 rounded-xl">
                        <Info className="w-4 h-4 text-[#DC2626] mt-0.5" />
                        <p className="text-sm text-red-800">This inspection is <strong>{overdueDays} days overdue</strong>. Complete it as scheduled to maintain compliance records.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "checklist" && <ChecklistTab />}

                {activeTab === "findings" && (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No findings recorded</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Complete the inspection checklist to record findings</p>
                    <Button variant="primary" size="sm" onClick={() => setActiveTab("checklist")}><FileText className="w-4 h-4" />Record Findings</Button>
                  </div>
                )}

                {activeTab === "evidence" && (
                  <div>
                    <Link href="/app/compliance/evidence" className="block text-center border-2 border-dashed border-slate-200 rounded-xl py-12 bg-slate-50 mb-4 hover:border-[#2563EB]/40 transition-colors">
                      <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-600">Upload evidence</p>
                      <p className="text-xs text-slate-400 mt-1">Go to the evidence library</p>
                    </Link>
                    <p className="text-xs text-slate-400 text-center">{row.evidence_count ?? 0} documents uploaded</p>
                  </div>
                )}

                {activeTab === "linked" && (
                  <div className="space-y-3">
                    {[
                      row.property_id && { label: "Property", value: row.property_name, href: `/app/properties/${row.property_id}`, icon: Building2 },
                    ].filter(Boolean).map((rec: any) => {
                      const Icon = rec.icon
                      return (
                        <div key={rec.label} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-400">{rec.label}</p>
                            <p className="text-sm font-medium text-slate-800">{rec.value}</p>
                          </div>
                          <Link href={rec.href} className="text-[#2563EB] text-xs font-medium hover:underline flex items-center gap-1">View <ChevronRight className="w-3.5 h-3.5" /></Link>
                        </div>
                      )
                    })}
                    {!row.property_id && <p className="text-sm text-slate-400 text-center py-8">No linked records.</p>}
                  </div>
                )}

                {activeTab === "calendar" && (
                  <div className="text-center py-8">
                    <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 mb-1">Scheduled: {fmtDate(row.scheduled_date)}</p>
                    {overdue && <p className="text-xs text-red-500 mb-4">This date has passed — inspection is overdue</p>}
                    <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(true)} disabled={isSeed}><RefreshCw className="w-4 h-4" />Reschedule</Button>
                  </div>
                )}

                {activeTab === "activity" && (
                  <div className="space-y-4">
                    {[
                      { label: "Inspection created", date: row.created_at, colour: "#2563EB", actor: "You" },
                      row.completed_date && { label: "Inspection completed", date: row.completed_date, colour: "#059669", actor: "You" },
                    ].filter(Boolean).map((item: any, i: number, arr: any[]) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.colour }} />
                          {i < arr.length - 1 && <div className="flex-1 w-px bg-slate-200 mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium text-slate-800">{item.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{fmtDate(item.date)} · {item.actor}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "audit" && (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {["Date", "Action", "Actor", "Details"].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-xs text-slate-500">{fmtDate(row.created_at)}</td>
                          <td className="px-4 py-2.5 text-xs font-medium text-slate-800">Created</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">You</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">Inspection scheduled</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right rail */}
          <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6 space-y-3">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Actions</p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setRescheduleOpen(true)} disabled={isSeed}><RefreshCw className="w-4 h-4" />Reschedule</Button>
                <Button variant="success" size="sm" className="w-full justify-start" onClick={() => setStatus("completed", { completed_date: new Date().toISOString().slice(0, 10) })} disabled={isSeed}><CheckCircle2 className="w-4 h-4" />Mark Complete</Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild><Link href="/app/jobs/new"><Briefcase className="w-4 h-4" />Create Job</Link></Button>
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Inspection Info</p>
              <div className="space-y-2.5">
                {[
                  { label: "ID", value: id },
                  { label: "Type", value: label },
                  { label: "Property", value: row.property_name ?? "—" },
                  { label: "Created", value: fmtDate(row.created_at) },
                ].map((r) => (
                  <div key={r.label}>
                    <p className="text-xs text-slate-400">{r.label}</p>
                    <p className="text-xs font-medium text-slate-700 mt-0.5 truncate">{r.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide">AI Insight</p>
              </div>
              <p className="text-xs text-violet-700 leading-relaxed">
                {overdue ? "This inspection is overdue. Reschedule immediately and document why it was missed." : "Keep this inspection on track and record findings promptly once complete."}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Reschedule modal */}
      {rescheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-1">Reschedule Inspection</h3>
            <p className="text-sm text-slate-500 mb-4">Choose a new date for this inspection.</p>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" disabled={!rescheduleDate} onClick={doReschedule}><RefreshCw className="w-3.5 h-3.5" />Reschedule</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
